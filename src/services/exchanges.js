import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { estimateValues, estimateServiceValues } from "./gemini";
import { computeTopUp, roundTo, settleCircle } from "./valuation";
import { notify } from "./notifications";

/* ---------- helpers ---------- */

const first = (n) => String(n || "Someone").split(" ")[0];
const refOf = (id) => doc(db, "exchanges", id);
const nameOf = (ex, uid) => first(ex.participantNames?.[uid]);
const othersOf = (ex, uid) => ex.participants.filter((p) => p !== uid);

async function load(id) {
  const snap = await getDoc(refOf(id));
  if (!snap.exists()) throw new Error("Exchange not found.");
  return snap.data();
}
function mustBeParticipant(ex, uid) {
  if (!ex.participants.includes(uid))
    throw new Error("You are not part of this exchange.");
}
function mustHaveStatus(ex, allowed) {
  if (!allowed.includes(ex.status))
    throw new Error(
      "This exchange is " + ex.status + " and can't do that now.",
    );
}

/* ---------- create ---------- */

// proposer / receiver: { uid, name }; offered / requested: { listingId, title }
export async function proposeExchange({
  proposer,
  receiver,
  offered,
  requested,
}) {
  const offeredPrice = Number(offered.price || 0);
  const requestedPrice = Number(requested.price || 0);
  const estimated = offeredPrice > 0 && requestedPrice > 0
    ? null : await estimateValues(offered.title, requested.title);
  const v = {
    offeredValue: offeredPrice > 0 ? offeredPrice : estimated.offeredValue,
    requestedValue: requestedPrice > 0 ? requestedPrice : estimated.requestedValue,
    offeredReason: offeredPrice > 0 ? "Owner-listed price." : estimated.offeredReason,
    requestedReason: requestedPrice > 0 ? "Owner-listed price." : estimated.requestedReason,
  };
  const topUp = computeTopUp({
    proposerId: proposer.uid,
    receiverId: receiver.uid,
    offeredValue: v.offeredValue,
    requestedValue: v.requestedValue,
  });

  const ref = await addDoc(collection(db, "exchanges"), {
    type: "direct",
    status: "pending_approval",
    participants: [proposer.uid, receiver.uid],
    participantNames: {
      [proposer.uid]: proposer.name,
      [receiver.uid]: receiver.name,
    },
    items: [
      {
        providerId: proposer.uid,
        receiverId: receiver.uid,
        listingId: offered.listingId || "",
        title: offered.title,
        estimatedValue: v.offeredValue,
        reason: v.offeredReason,
        delivered: false,
        confirmed: false,
      },
      {
        providerId: receiver.uid,
        receiverId: proposer.uid,
        listingId: requested.listingId || "",
        title: requested.title,
        estimatedValue: v.requestedValue,
        reason: v.requestedReason,
        delivered: false,
        confirmed: false,
      },
    ],
    topUp: { ...topUp, status: "suggested" },
    approvals: { [proposer.uid]: "accepted", [receiver.uid]: "pending" },
    createdBy: proposer.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await notify([receiver.uid], {
    type: "proposal",
    title: "New exchange proposal",
    body: `${first(proposer.name)} proposes ${offered.title} for ${requested.title}.`,
    exchangeId: ref.id,
  });
  return ref.id;
}

// circle = { legs: [me to x, x to y, y to me] } from findCircles
export async function proposeCircle({ circle, people }) {
  const [l1, l2, l3] = circle.legs;
  const vals = await estimateServiceValues([l1.offer, l2.offer, l3.offer]);

  const members = [
    { uid: l1.providerId, gives: vals[0].value, gets: vals[2].value },
    { uid: l2.providerId, gives: vals[1].value, gets: vals[0].value },
    { uid: l3.providerId, gives: vals[2].value, gets: vals[1].value },
  ];
  const transfers = settleCircle(members).map((t) => ({
    ...t,
    status: "suggested",
  }));
  const ids = members.map((m) => m.uid);

  const ref = await addDoc(collection(db, "exchanges"), {
    type: "circle",
    status: "pending_approval",
    participants: ids,
    participantNames: Object.fromEntries(
      ids.map((id) => [id, people[id]?.name || "Student"]),
    ),
    items: circle.legs.map((leg, i) => ({
      providerId: leg.providerId,
      receiverId: leg.receiverId,
      title: leg.offer,
      estimatedValue: vals[i].value,
      reason: vals[i].reason,
      delivered: false,
      confirmed: false,
    })),
    transfers,
    approvals: Object.fromEntries(
      ids.map((id, i) => [id, i === 0 ? "accepted" : "pending"]),
    ),
    createdBy: ids[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const starter = first(people[ids[0]]?.name);
  await notify(ids.slice(1), {
    type: "proposal",
    title: "You were matched in a 3-person exchange",
    body: `${starter} found a circle that works for all three of you. Review it and accept or decline.`,
    exchangeId: ref.id,
  });
  return ref.id;
}

/* ---------- direct purchase request (agreement + delivery tracking; no in-app payment yet) ---------- */
export async function proposePurchase({ buyer, seller, listing }) {
  const price = Number(listing.price || 0);
  const ref = await addDoc(collection(db, "exchanges"), {
    type: "purchase", status: "pending_approval",
    participants: [buyer.uid, seller.uid],
    participantNames: { [buyer.uid]: buyer.name, [seller.uid]: seller.name },
    items: [{ providerId: seller.uid, receiverId: buyer.uid, listingId: listing.id,
      title: listing.title, estimatedValue: price, reason: "Owner-listed price.",
      delivered: false, confirmed: false }],
    topUp: { amount: price, payerId: buyer.uid, payeeId: seller.uid, status: "listed_price" },
    approvals: { [buyer.uid]: "accepted", [seller.uid]: "pending" },
    createdBy: buyer.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await notify([seller.uid], { type: "proposal", title: "Purchase request",
    body: `${first(buyer.name)} wants to purchase ${listing.title} at ${price ? "₦"+price.toLocaleString() : "your agreed price"}.`,
    exchangeId: ref.id });
  return ref.id;
}

/* ---------- approval ---------- */

// answer: "accepted" or "declined". Declining cancels the exchange for everyone.
export async function respondToExchange(exchangeId, uid, answer) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, ["pending_approval"]);

  const approvals = { ...ex.approvals, [uid]: answer };
  let status = ex.status;
  if (answer === "declined") status = "cancelled";
  else if (Object.values(approvals).every((a) => a === "accepted"))
    status = "accepted";
  await updateDoc(refOf(exchangeId), {
    approvals,
    status,
    updatedAt: serverTimestamp(),
  });

  const who = nameOf(ex, uid);
  if (answer === "declined") {
    await notify(othersOf(ex, uid), {
      type: "declined",
      title: "Exchange cancelled",
      body: `${who} declined, so this exchange was cancelled.`,
      exchangeId,
    });
  } else if (status === "accepted") {
    await notify(ex.participants, {
      type: "accepted",
      title: "Everyone accepted",
      body: "All terms are agreed. You can start the exchange.",
      exchangeId,
    });
  } else {
    await notify(othersOf(ex, uid), {
      type: "accepted",
      title: `${who} accepted`,
      body: "Waiting for the others to accept.",
      exchangeId,
    });
  }
}

// Direct swaps only: suggest a different top-up. Everyone else must approve again.
export async function counterTopUp(exchangeId, uid, amount) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, ["pending_approval"]);
  if (ex.type !== "direct")
    throw new Error("Only direct swaps have a single top-up.");

  const clean = Math.max(0, roundTo(Number(amount) || 0, 100));
  const approvals = Object.fromEntries(
    ex.participants.map((p) => [p, p === uid ? "accepted" : "pending"]),
  );
  await updateDoc(refOf(exchangeId), {
    "topUp.amount": clean,
    "topUp.status": "countered",
    "topUp.proposedBy": uid,
    approvals,
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
  await notify(othersOf(ex, uid), {
    type: "counter",
    title: "New top-up suggested",
    body: `${nameOf(ex, uid)} suggested a top-up of ₦${clean.toLocaleString()}.`,
    exchangeId,
  });
}

/* ---------- progress ---------- */

export async function startExchange(exchangeId, uid) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, ["accepted"]);
  await updateDoc(refOf(exchangeId), {
    status: "in_progress",
    updatedAt: serverTimestamp(),
  });
  await notify(othersOf(ex, uid), {
    type: "progress",
    title: "Exchange started",
    body: `${nameOf(ex, uid)} started the exchange.`,
    exchangeId,
  });
}

// The provider says "I have done my part".
export async function markDelivered(exchangeId, uid) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, ["in_progress"]);
  const items = ex.items.map((it) => ({ ...it }));
  const item = items.find((it) => it.providerId === uid && !it.delivered);
  if (!item) throw new Error("You have nothing left to mark as delivered.");
  item.delivered = true;
  item.deliveredAt = Date.now();

  const allDelivered = items.every((it) => it.delivered);
  await updateDoc(refOf(exchangeId), {
    items,
    status: allDelivered ? "awaiting_confirmation" : "in_progress",
    updatedAt: serverTimestamp(),
  });
  await notify([item.receiverId], {
    type: "delivered",
    title: "Service marked as delivered",
    body: `${nameOf(ex, uid)} says ${item.title} is done. Please confirm it.`,
    exchangeId,
  });
}

// The receiver says "yes, I received it".
export async function confirmDelivery(exchangeId, uid) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, ["in_progress", "awaiting_confirmation"]);
  const items = ex.items.map((it) => ({ ...it }));
  const item = items.find(
    (it) => it.receiverId === uid && it.delivered && !it.confirmed,
  );
  if (!item) throw new Error("There is nothing for you to confirm yet.");
  item.confirmed = true;
  item.confirmedAt = Date.now();

  const allConfirmed = items.every((it) => it.confirmed);
  const status = allConfirmed ? "completed" : ex.status;
  await updateDoc(refOf(exchangeId), {
    items,
    status,
    updatedAt: serverTimestamp(),
  });

  await notify([item.providerId], {
    type: "confirmed",
    title: "Delivery confirmed",
    body: `${nameOf(ex, uid)} confirmed ${item.title}.`,
    exchangeId,
  });
  if (allConfirmed) {
    await notify(ex.participants, {
      type: "completed",
      title: "Exchange complete",
      body: "Everyone confirmed. Well done!",
      exchangeId,
    });
  }
}

/* ---------- cancel and report ---------- */

export async function cancelExchange(exchangeId, uid) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  mustHaveStatus(ex, [
    "pending_approval",
    "accepted",
    "in_progress",
    "awaiting_confirmation",
  ]);
  await updateDoc(refOf(exchangeId), {
    status: "cancelled",
    cancelledBy: uid,
    updatedAt: serverTimestamp(),
  });
  await notify(othersOf(ex, uid), {
    type: "cancelled",
    title: "Exchange cancelled",
    body: `${nameOf(ex, uid)} cancelled this exchange.`,
    exchangeId,
  });
}

export async function reportProblem(exchangeId, uid, text) {
  const ex = await load(exchangeId);
  mustBeParticipant(ex, uid);
  await addDoc(collection(db, "reports"), {
    exchangeId,
    reporterId: uid,
    text: String(text || "").slice(0, 1000),
    createdAt: serverTimestamp(),
  });
  await updateDoc(refOf(exchangeId), {
    problemReported: true,
    updatedAt: serverTimestamp(),
  });
  await notify(othersOf(ex, uid), {
    type: "report",
    title: "A problem was reported",
    body: `${nameOf(ex, uid)} reported a problem with this exchange.`,
    exchangeId,
  });
}

/* ---------- live data for screens ---------- */

export function watchMyExchanges(uid, callback) {
  const q = query(
    collection(db, "exchanges"),
    where("participants", "array-contains", uid),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
    callback(list);
  });
}

export function watchExchange(exchangeId, callback) {
  return onSnapshot(refOf(exchangeId), (snap) =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
  );
}
