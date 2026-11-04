import {
  addDoc, collection, doc, getDoc, updateDoc,
  onSnapshot, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { estimateValues } from "./gemini";
import { computeTopUp, roundTo } from "./valuation";

// proposer / receiver: { uid, name }
// offered / requested: { listingId, title }  (offered = the proposer's service)
export async function proposeExchange({ proposer, receiver, offered, requested }) {
  const v = await estimateValues(offered.title, requested.title);
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
    participantNames: { [proposer.uid]: proposer.name, [receiver.uid]: receiver.name },
    items: [
      { providerId: proposer.uid, receiverId: receiver.uid, listingId: offered.listingId || "",
        title: offered.title, estimatedValue: v.offeredValue, reason: v.offeredReason },
      { providerId: receiver.uid, receiverId: proposer.uid, listingId: requested.listingId || "",
        title: requested.title, estimatedValue: v.requestedValue, reason: v.requestedReason },
    ],
    topUp: { ...topUp, status: "suggested" },
    approvals: { [proposer.uid]: "accepted", [receiver.uid]: "pending" },
    createdBy: proposer.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// answer: "accepted" or "declined"
export async function respondToExchange(exchangeId, uid, answer) {
  const ref = doc(db, "exchanges", exchangeId);
  const ex = (await getDoc(ref)).data();
  const approvals = { ...ex.approvals, [uid]: answer };
  let status = ex.status;
  if (answer === "declined") status = "cancelled";
  else if (Object.values(approvals).every((a) => a === "accepted")) status = "accepted";
  await updateDoc(ref, { approvals, status, updatedAt: serverTimestamp() });
}

// A student suggests a different top-up amount. Everyone else must approve again.
export async function counterTopUp(exchangeId, uid, amount) {
  const ref = doc(db, "exchanges", exchangeId);
  const ex = (await getDoc(ref)).data();
  const clean = Math.max(0, roundTo(Number(amount) || 0, 100));
  const approvals = Object.fromEntries(
    ex.participants.map((p) => [p, p === uid ? "accepted" : "pending"])
  );
  await updateDoc(ref, {
    "topUp.amount": clean,
    "topUp.status": "countered",
    "topUp.proposedBy": uid,
    approvals,
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
}

// Live list of one student's exchanges, newest first.
export function watchMyExchanges(uid, callback) {
  const q = query(collection(db, "exchanges"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(list);
  });
}