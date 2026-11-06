import { collection, doc, updateDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Notifications are created only by trusted Functions. This client module is read/acknowledge-only.
export function watchNotifications(uid, callback, onError = () => {}) {
  const q = query(collection(db, "notifications"), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt) || 0)-(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt) || 0));
    callback(list);
  }, onError);
}
export function markRead(id) { return updateDoc(doc(db, "notifications", id), { read: true }); }
export async function markAllRead(uid) {
  const q=query(collection(db,"notifications"),where("userId","==",uid),where("read","==",false));
  const snap=await getDocs(q);
  await Promise.all(snap.docs.map(d=>updateDoc(d.ref,{read:true})));
}
