import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// Only these fields are allowed to cross into the public discovery document.
// Email and account/security fields intentionally stay in users/{uid}.
const PUBLIC_PROFILE_FIELDS = new Set([
  "name", "department", "level", "bio", "offers", "needs", "interests",
  "onboardingDone", "onboardingCompleted", "photoURL",
  "portfolio", "availability", "createdAt",
]);

function publicProjection(data = {}) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => PUBLIC_PROFILE_FIELDS.has(key)),
  );
}

export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}

export async function getPublicProfile(uid) {
  const s = await getDoc(doc(db, "publicProfiles", uid));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function saveProfile(uid, data) {
  // Private profile write first; callers must only pass the signed-in user's uid.
  await setDoc(doc(db, "users", uid), data, { merge: true });
  const safe = publicProjection(data);
  if (Object.keys(safe).length) {
    await setDoc(doc(db, "publicProfiles", uid), safe, { merge: true });
  }
}

export function watchProfile(uid, callback, onError = () => {}) {
  if (!uid) return () => {};
  return onSnapshot(doc(db, "users", uid), (snap) => callback(snap.exists() ? snap.data() : null), onError);
}

export function watchPublicProfile(uid, callback, onError = () => {}) {
  if (!uid) return () => {};
  return onSnapshot(doc(db, "publicProfiles", uid), (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}
