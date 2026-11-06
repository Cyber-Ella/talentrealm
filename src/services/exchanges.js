import {
  addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebase";

const uid = () => {
  const current = getAuth().currentUser;
  if (!current) throw new Error("Sign in before using exchanges.");
  return current.uid;
};
const clean = (v, max = 160) => String(v ?? "").trim().slice(0, max);
const now = () => Date.now();
const profileName = async (id, fallback = "Student") => {
  const snap = await getDoc(doc(db, "publicProfiles", id));
  return clean(snap.data()?.name, 80) || fallback;
};
const listingById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, "listings", id));
  if (!snap.exists()) throw new Error("Listing not found.");
  return { id: snap.id, ...snap.data() };
};
const exchangeRef = (id) => doc(db, "exchanges", id);
const event = async (exchangeId, actorId, type, details = {}) => {
  const ex = await getDoc(exchangeRef(exchangeId));
  return addDoc(collection(db, "exchangeEvents"), {
    exchangeId, participants: ex.data()?.participants || [], actorId, type, details, createdAt: now(),
  });
};
const notify = async (exchangeId, recipientId, actorId, type, title, body) => {
  const ex = await getDoc(exchangeRef(exchangeId));
  const participants = ex.data()?.participants || [];
  if (!participants.includes(recipientId) || !participants.includes(actorId) || recipientId === actorId) return;
  await addDoc(collection(db, "notifications"), {
    userId: recipientId, actorId, exchangeId, participants, type,
    title: clean(title, 120), body: clean(body, 500), read: false, createdAt: now(),
  });
};
const notifyOthers = async (exchangeId, ex, actorId, type, title, body) =>
  Promise.all((ex.participants || []).filter((p) => p !== actorId).map((p) => notify(exchangeId, p, actorId, type, title, body)));
const createExchange = async (data) => {
  const ref = doc(collection(db, "exchanges"));
  await setDoc(ref, data);
  return ref.id;
};
const readExchange = async (id) => {
  const snap = await getDoc(exchangeRef(id));
  if (!snap.exists()) throw new Error("Exchange not found.");
  const ex = snap.data();
  if (!ex.participants?.includes(uid())) throw new Error("You are not a participant.");
  return ex;
};
const patchExchange = async (id, patch, actor, action, details = {}) => {
  await updateDoc(exchangeRef(id), { ...patch, updatedAt: now() });
  await event(id, actor, action, details);
};

export async function proposeExchange({ receiver, offered, requested }) {
  const me = uid(), receiverUid = receiver?.uid;
  if (!receiverUid || receiverUid === me) throw new Error("Choose another student.");
  const offerTitle = clean(offered?.title, 100), requestTitle = clean(requested?.title, 100);
  if (!offerTitle || !requestTitle) throw new Error("Both services need titles.");
  const [ol, rl, myName, theirName] = await Promise.all([
    listingById(offered?.listingId), listingById(requested?.listingId),
    profileName(me), profileName(receiverUid),
  ]);
  if (ol && ol.ownerId !== me) throw new Error("Your offered listing must belong to you.");
  if (rl && rl.ownerId !== receiverUid) throw new Error("Requested listing does not belong to this student.");
  const a = Math.max(0, Number(ol?.price ?? offered?.price) || 0);
  const b = Math.max(0, Number(rl?.price ?? requested?.price) || 0);
  const participants = [me, receiverUid];
  const exchangeId = await createExchange({
    type: "direct", status: "pending_approval", participants,
    participantNames: { [me]: myName, [receiverUid]: theirName },
    items: [
      { providerId: me, receiverId: receiverUid, listingId: ol?.id || "", title: offerTitle, estimatedValue: a, reason: a ? "Owner-listed price." : "User estimate.", delivered: false, confirmed: false },
      { providerId: receiverUid, receiverId: me, listingId: rl?.id || "", title: requestTitle, estimatedValue: b, reason: b ? "Owner-listed price." : "User estimate.", delivered: false, confirmed: false },
    ],
    topUp: { amount: Math.abs(a - b), payerId: a > b ? me : receiverUid, payeeId: a > b ? receiverUid : me, status: "suggested" },
    approvals: { [me]: "accepted", [receiverUid]: "pending" }, createdBy: me, createdAt: now(), updatedAt: now(),
  });
  await event(exchangeId, me, "proposed");
  await notify(exchangeId, receiverUid, me, "exchange_proposed", "New exchange proposal", `${myName} proposed an exchange with you.`);
  return exchangeId;
}

export async function proposePurchase({ listing }) {
  const me = uid(), l = await listingById(listing?.id);
  if (!l || l.ownerId === me) throw new Error("You cannot request your own listing.");
  if (l.type !== "service") throw new Error("Only service listings can be requested.");
  const [buyerName, sellerName] = await Promise.all([profileName(me), profileName(l.ownerId, l.ownerName || "Student")]);
  const amount = Math.max(0, Number(l.price) || 0), participants = [me, l.ownerId];
  const id = await createExchange({
    type: "purchase", status: "pending_approval", participants,
    participantNames: { [me]: buyerName, [l.ownerId]: sellerName },
    items: [{ providerId: l.ownerId, receiverId: me, listingId: l.id, title: clean(l.title, 100), estimatedValue: amount, reason: "Owner-listed price.", delivered: false, confirmed: false }],
    topUp: { amount, payerId: me, payeeId: l.ownerId, status: "listed_price" },
    approvals: { [me]: "accepted", [l.ownerId]: "pending" }, createdBy: me, createdAt: now(), updatedAt: now(),
  });
  await event(id, me, "proposed");
  await notify(id, l.ownerId, me, "purchase_requested", "New service request", `${buyerName} requested ${l.title}.`);
  return id;
}

export async function respondToExchange(exchangeId, _uid, answer) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (ex.status !== "pending_approval") throw new Error("This exchange is no longer awaiting approval.");
  if (! ["accepted", "declined"].includes(answer)) throw new Error("Invalid answer.");
  if (ex.approvals?.[me] !== "pending") throw new Error("You have already responded.");
  const approvals = { ...ex.approvals, [me]: answer };
  const status = answer === "declined" ? "cancelled" : ex.participants.every((p) => approvals[p] === "accepted") ? "awaiting_arrangement" : "pending_approval";
  await patchExchange(exchangeId, { approvals, status }, me, answer);
  await notifyOthers(exchangeId, ex, me, answer === "accepted" ? "exchange_accepted" : "exchange_declined", answer === "accepted" ? "Exchange accepted" : "Exchange declined", `${ex.participantNames?.[me] || "A participant"} ${answer} the exchange proposal.`);
  if (status === "accepted" && ex.requestId) {
    const requestSnap = await getDoc(doc(db, "exchangeRequests", ex.requestId));
    if (requestSnap.exists() && requestSnap.data().ownerId === me) {
      await updateDoc(doc(db, "exchangeRequests", ex.requestId), { status: "fulfilled", updatedAt: now() });
    }
  }
  return { status };
}
export async function counterTopUp(exchangeId, _uid, amount) {
  const me = uid(), ex = await readExchange(exchangeId), value = Math.max(0, Math.round(Number(amount) || 0));
  if (ex.status !== "pending_approval" || ex.type !== "direct") throw new Error("Only pending direct exchanges support top-up counteroffers.");
  if (value > 1000000) throw new Error("Top-up cannot exceed ₦1,000,000.");
  const approvals = Object.fromEntries(ex.participants.map((p) => [p, p === me ? "accepted" : "pending"]));
  await patchExchange(exchangeId, { "topUp.amount": value, "topUp.status": "countered", "topUp.proposedBy": me, approvals, status: "pending_approval" }, me, "topup_countered", { amount: value });
  return { status: "pending_approval" };
}
const arrangementOwner = (ex) => ex.items.find((item) => item.listingId && item.providerId !== ex.createdBy)?.providerId || ex.participants.find((p) => p !== ex.createdBy);
export async function submitArrangement(exchangeId, fields) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (ex.status !== "awaiting_arrangement" || arrangementOwner(ex) !== me) throw new Error("Only the designated listing owner can submit the arrangement now.");
  const location = clean(fields.location, 120), venue = clean(fields.venue, 160), dateTime = clean(fields.dateTime, 40), notes = clean(fields.notes, 500);
  if (!location || !venue || !dateTime) throw new Error("Enter the location, meeting place, and proposed date/time.");
  const arrangement = { submittedBy: me, location, venue, dateTime, notes, status: "pending_confirmation", submittedAt: now() };
  await patchExchange(exchangeId, { arrangement, status: "awaiting_confirmation" }, me, "arrangement_submitted");
  const reviewer = ex.participants.find((p) => p !== me);
  await notify(exchangeId, reviewer, me, "arrangement_submitted", "Exchange arrangement ready", "Review the proposed meeting details and confirm or request changes.");
  return { status: "awaiting_confirmation" };
}
export async function reviewArrangement(exchangeId, _uid, decision, feedback = "") {
  const me = uid(), ex = await readExchange(exchangeId);
  if (ex.status !== "awaiting_confirmation" || ex.arrangement?.submittedBy === me) throw new Error("Only the other participant can review this arrangement.");
  if (!["confirm", "changes"].includes(decision)) throw new Error("Invalid arrangement decision.");
  const status = decision === "confirm" ? "confirmed" : "changes_requested";
  const arrangement = { ...ex.arrangement, status, reviewedBy: me, reviewedAt: now(), feedback: clean(feedback, 300) };
  await patchExchange(exchangeId, { arrangement, status: decision === "confirm" ? "accepted" : "awaiting_arrangement" }, me, decision === "confirm" ? "arrangement_confirmed" : "arrangement_changes_requested");
  await notify(exchangeId, ex.arrangement.submittedBy, me, decision === "confirm" ? "arrangement_confirmed" : "arrangement_changes_requested", decision === "confirm" ? "Meeting arrangement confirmed" : "Changes requested", decision === "confirm" ? "The other student confirmed your proposed meeting details." : (clean(feedback, 300) || "Please revise the meeting details."));
  return { status: decision === "confirm" ? "accepted" : "awaiting_arrangement" };
}

export async function startExchange(exchangeId, _uid) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (ex.status !== "accepted") throw new Error("All participants must accept before starting.");
  await patchExchange(exchangeId, { status: "in_progress" }, me, "started");
  await notifyOthers(exchangeId, ex, me, "exchange_started", "Exchange started", `${ex.participantNames?.[me] || "A participant"} started the exchange.`);
  return { status: "in_progress" };
}
export async function markDelivered(exchangeId, _uid) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (ex.status !== "in_progress") throw new Error("This exchange is not in progress.");
  const items = ex.items.map((x) => ({ ...x })), item = items.find((x) => x.providerId === me && !x.delivered);
  if (!item) throw new Error("No remaining item to deliver.");
  item.delivered = true; item.deliveredAt = now();
  const status = items.every((x) => x.delivered) ? "awaiting_confirmation" : "in_progress";
  await patchExchange(exchangeId, { items, status }, me, "delivered", { item: item.title });
  await notify(exchangeId, item.receiverId, me, "item_delivered", "A service was delivered", `${item.title} is marked delivered. Please review and confirm.`);
  return { status };
}
export async function confirmDelivery(exchangeId, _uid) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (!["in_progress", "awaiting_confirmation"].includes(ex.status)) throw new Error("This exchange cannot be confirmed now.");
  const items = ex.items.map((x) => ({ ...x })), item = items.find((x) => x.receiverId === me && x.delivered && !x.confirmed);
  if (!item) throw new Error("Nothing ready for confirmation.");
  item.confirmed = true; item.confirmedAt = now();
  const status = items.every((x) => x.confirmed) ? "completed" : ex.status;
  await patchExchange(exchangeId, { items, status }, me, "confirmed", { item: item.title });
  await notify(exchangeId, item.providerId, me, "delivery_confirmed", "Delivery confirmed", `${item.title} was received and confirmed.`);
  return { status };
}
export async function cancelExchange(exchangeId, _uid) {
  const me = uid(), ex = await readExchange(exchangeId);
  if (!["pending_approval", "accepted"].includes(ex.status)) throw new Error("Exchange can no longer be cancelled.");
  await patchExchange(exchangeId, { status: "cancelled", cancelledBy: me }, me, "cancelled"); return { status: "cancelled" };
}
export async function reportProblem(exchangeId, _uid, text) {
  const me = uid(), ex = await readExchange(exchangeId), message = clean(text, 1000);
  if (message.length < 5) throw new Error("Explain the problem (at least 5 characters).");
  await addDoc(collection(db, "reports"), { exchangeId, reporterId: me, participants: ex.participants, text: message, status: "open", createdAt: now() });
  await patchExchange(exchangeId, { problemReported: true }, me, "reported"); return { status: "reported" };
}
export async function getOpenExchangeRequests() {
  const q = query(collection(db, "exchangeRequests"), where("status", "==", "open"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.ownerId !== uid());
}
export async function proposeToExchangeRequest(requestId, proposal) {
  const me = uid(), snap = await getDoc(doc(db, "exchangeRequests", requestId));
  if (!snap.exists() || snap.data().status !== "open") throw new Error("Request is no longer open.");
  const target = snap.data();
  if (target.ownerId === me) throw new Error("Cannot propose to your own request.");
  const text = clean(proposal, 500); if (text.length < 3) throw new Error("Describe your proposal.");
  const [myName, targetName] = await Promise.all([profileName(me), profileName(target.ownerId, target.ownerName)]);
  const participants = [me, target.ownerId];
  const id = await createExchange({
    type: "request", status: "pending_approval", participants,
    participantNames: { [me]: myName, [target.ownerId]: targetName }, requestId,
    requestSnapshot: { offer: target.offer, need: target.need }, proposal: text,
    items: [
      { providerId: me, receiverId: target.ownerId, title: text, estimatedValue: 0, reason: "Respondent offer for request.", delivered: false, confirmed: false },
      { providerId: target.ownerId, receiverId: me, title: clean(target.offer, 160), estimatedValue: 0, reason: "Request owner offer.", delivered: false, confirmed: false },
    ], approvals: { [me]: "accepted", [target.ownerId]: "pending" }, createdBy: me, createdAt: now(), updatedAt: now(),
  });
  await event(id, me, "request_proposed"); return id;
}
export async function createExchangeRequest({ offer, need, description = "", allowTopUp = false }) {
  const me = uid(), profile = await getDoc(doc(db, "publicProfiles", me));
  const o = clean(offer, 160), n = clean(need, 160);
  if (o.length < 3 || n.length < 3) throw new Error("Offer and need must each be at least 3 characters.");
  const ref = doc(collection(db, "exchangeRequests"));
  await setDoc(ref, { ownerId: me, ownerName: clean(profile.data()?.name, 80), offer: o, need: n, description: clean(description, 700), allowTopUp: !!allowTopUp, status: "open", createdAt: now(), updatedAt: now() });
  return { requestId: ref.id };
}
export async function updateExchangeRequest(requestId, status) {
  const me = uid(), snap = await getDoc(doc(db, "exchangeRequests", requestId));
  if (!snap.exists() || snap.data().ownerId !== me) throw new Error("Only the request owner can manage it.");
  if (!["open", "paused", "closed"].includes(status) || snap.data().status === "fulfilled") throw new Error("Invalid request status.");
  await updateDoc(doc(db, "exchangeRequests", requestId), { status, updatedAt: now() }); return { status };
}
export async function proposeCircle({ circle }) {
  const me = uid(), legs = circle?.legs;
  if (!Array.isArray(legs) || legs.length !== 3) throw new Error("A circle must contain exactly three exchange legs.");
  const participants = [...new Set(legs.flatMap((l) => [l.providerId, l.receiverId]))];
  if (participants.length !== 3 || !participants.includes(me)) throw new Error("Circle must contain three participants including you.");
  if (legs.some((l) => !participants.includes(l.providerId) || !participants.includes(l.receiverId) || l.providerId === l.receiverId || !clean(l.offer, 160))) throw new Error("Invalid circle leg.");
  if (participants.some((p) => legs.filter((l) => l.providerId === p).length !== 1 || legs.filter((l) => l.receiverId === p).length !== 1)) throw new Error("Circle legs must form a closed loop.");
  const names = Object.fromEntries(await Promise.all(participants.map(async (p) => [p, await profileName(p)])));
  const items = legs.map((l) => ({ providerId: l.providerId, receiverId: l.receiverId, title: clean(l.offer, 160), estimatedValue: 0, reason: "Circle exchange; value/top-up to be agreed.", delivered: false, confirmed: false }));
  const id = await createExchange({ type: "circle", status: "pending_approval", participants, participantNames: names, items, transfers: [], approvals: Object.fromEntries(participants.map((p) => [p, p === me ? "accepted" : "pending"])), createdBy: me, createdAt: now(), updatedAt: now() });
  await event(id, me, "circle_proposed"); return id;
}

export function watchMyExchanges(userId, callback, onError = () => {}) {
  const q = query(collection(db, "exchanges"), where("participants", "array-contains", userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); callback(list);
  }, onError);
}
export function watchExchange(exchangeId, callback, onError = () => {}) {
  return onSnapshot(exchangeRef(exchangeId), (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}
export function watchOpenExchangeRequests(callback, onError = () => {}) {
  const q = query(collection(db, "exchangeRequests"), where("status", "==", "open"));
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    requests.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)); callback(requests);
  }, onError);
}
