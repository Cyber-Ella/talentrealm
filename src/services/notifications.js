import { collection, doc, updateDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Notifications are created only by trusted Functions. This client module is read/acknowledge-only.
export function watchNotifications(uid, callback) {
  const q = query(collection(db, "notifications"), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    callback(list);
  });
}
export function markRead(id) { return updateDoc(doc(db, "notifications", id), { read: true }); }
export async function markAllRead(uid) {
  const q=query(collection(db,"notifications"),where("userId","==",uid),where("read","==",false));
  const snap=await getDocs(q);
  await Promise.all(snap.docs.map(d=>updateDoc(d.ref,{read:true})));
}
