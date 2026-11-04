import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function createListing(data) {
  const ref = await addDoc(collection(db, "listings"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getListings() {
  const snap = await getDocs(collection(db, "listings"));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return list;
}

export async function getListing(id) {
  const s = await getDoc(doc(db, "listings", id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function getMyListings(uid) {
  return (await getListings()).filter((l) => l.ownerId === uid);
}