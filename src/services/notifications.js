import {
  addDoc,
  collection,
  doc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Writes one notification per person.
export async function notify(userIds, { type, title, body, exchangeId = "" }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  await Promise.all(
    ids.map((userId) =>
      addDoc(collection(db, "notifications"), {
        userId,
        type,
        title,
        body,
        exchangeId,
        read: false,
        createdAt: serverTimestamp(),
      }),
    ),
  );
}

// Live list for one student, newest first.
export function watchNotifications(uid, callback) {
  const q = query(collection(db, "notifications"), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
    callback(list);
  });
}

export function markRead(id) {
  return updateDoc(doc(db, "notifications", id), { read: true });
}

export async function markAllRead(uid) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}
