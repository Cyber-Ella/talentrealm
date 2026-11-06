import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./firebase";

const call = async (action, payload = {}) => {
  const fn = httpsCallable(getFunctions(), "exchangeAction");
  const result = await fn({ action, ...payload });
  return result.data;
};

// Compatible wrappers for the existing screens. Identity is always taken from Firebase Auth on server.
export async function proposeExchange({ proposer, receiver, offered, requested }) {
  const result = await call("proposeExchange", {
    receiverUid: receiver.uid,
    offered: { listingId: offered.listingId || "", title: offered.title, price: offered.price || 0 },
    requested: { listingId: requested.listingId || "", title: requested.title, price: requested.price || 0 },
  // proposer is deliberately not trusted by the backend.
  displayNameHint: proposer?.name || "",
  });
  return result.exchangeId;
}
export async function proposePurchase({ buyer, seller, listing }) {
  const result = await call("proposePurchase", { listingId: listing.id });
  return result.exchangeId;
}
export async function respondToExchange(exchangeId, uid, answer) {
  return call("respond", { exchangeId, answer });
}
export async function counterTopUp(exchangeId, uid, amount) {
  return call("counterTopUp", { exchangeId, amount });
}
export async function startExchange(exchangeId, uid) {
  return call("start", { exchangeId });
}
export async function markDelivered(exchangeId, uid) {
  return call("deliver", { exchangeId });
}
export async function confirmDelivery(exchangeId, uid) {
  return call("confirm", { exchangeId });
}
export async function cancelExchange(exchangeId, uid) {
  return call("cancel", { exchangeId });
}
export async function reportProblem(exchangeId, uid, text) {
  return call("report", { exchangeId, text });
}
export async function createExchangeRequest({ offer, need, description = "", allowTopUp = false }) {
  return call("createRequest", { offer, need, description, allowTopUp });
}
export async function proposeToExchangeRequest(requestId, proposal) {
  const result = await call("proposeToRequest", { requestId, proposal });
  return result.exchangeId;
}
export async function updateExchangeRequest(requestId, status) {
  return call("updateRequest", { requestId, status });
}
// Automated circular exchanges are deliberately outside the hackathon MVP.
export async function proposeCircle() {
  throw new Error("Three-person circular exchanges are planned for a later TalentRealm release.");
}

export function watchMyExchanges(uid, callback) {
  const q = query(collection(db, "exchanges"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(list);
  });
}
export function watchExchange(exchangeId, callback) {
  return onSnapshot(doc(db, "exchanges", exchangeId), (snap) =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
  );
}
