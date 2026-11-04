import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

const USERS = "users";

/** Keep tags tidy: trimmed, no blanks, no duplicates, sensible limits. */
export function cleanTags(list = []) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = String(raw).trim().slice(0, 40);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 10);
}

/** Read one student's profile. Returns null if the document does not exist. */
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name || data.fullName || data.displayName || "",
    department: data.department || "",
    level: data.level || "",
    bio: data.bio || "",
    offers: Array.isArray(data.offers) ? data.offers : [],
    needs: Array.isArray(data.needs) ? data.needs : [],
    photoURL: data.photoURL || "",
  };
}

/** Save the three editable fields. Returns the cleaned values that were saved. */
export async function updateProfile(uid, { bio, offers, needs }) {
  const changes = {
    bio: String(bio || "")
      .trim()
      .slice(0, 300),
    offers: cleanTags(offers),
    needs: cleanTags(needs),
  };
  await updateDoc(doc(db, USERS, uid), changes);
  return changes;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Returns an error message, or "" if the file is fine. */
export function validatePhoto(file) {
  if (!file.type.startsWith("image/"))
    return "Choose an image file (JPG, PNG or WebP).";
  if (file.size > MAX_PHOTO_BYTES)
    return "That image is over 5 MB. Choose a smaller one.";
  return "";
}

/** Upload a new profile photo (replaces the old one) and save its URL on the user document. */
export async function uploadProfilePhoto(uid, file) {
  const problem = validatePhoto(file);
  if (problem) throw new Error(problem);

  const photoRef = ref(storage, `profile-photos/${uid}`);
  await uploadBytes(photoRef, file, { contentType: file.type });
  const url = `${await getDownloadURL(photoRef)}&v=${Date.now()}`; // busts the cache after a change
  await updateDoc(doc(db, USERS, uid), { photoURL: url });
  return url;
}
