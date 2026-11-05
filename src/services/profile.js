import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}

export function saveProfile(uid, data) {
  return setDoc(doc(db, "users", uid), data, { merge: true });
}
