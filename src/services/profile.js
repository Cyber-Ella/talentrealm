import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const USERS = "users";
const SAVE_TIMEOUT_MS = 30000;
const LOAD_TIMEOUT_MS = 15000;

/** Rejects if a promise takes too long, so the screen never sits on "Saving…" forever. */
export function withTimeout(
  promise,
  ms = SAVE_TIMEOUT_MS,
  message = "This is taking too long. Check your connection and try again.",
) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(message);
      err.code = "timeout";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Turns a Firebase error into a message the student (and you) can act on. */
export function saveErrorMessage(err) {
  if (err?.code === "timeout") return err.message;
  if (err?.code === "permission-denied")
    return "Saving was blocked. The Firestore rules need to let a signed-in student update their own document in the users collection.";
  if (err?.code === "not-found")
    return "We couldn't find your profile document to update. Sign out, sign in again, and retry.";
  return "We couldn't save your changes. Check your connection and try again.";
}

/** Accepts an array or a "a, b, c" string and returns a clean array of tags. */
function toList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/[,\n;]+/);
  return [];
}

/** Keep tags tidy: trimmed, no blanks, no duplicates, sensible limits. */
export function cleanTags(list = []) {
  const seen = new Set();
  const out = [];
  for (const raw of toList(list)) {
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
  if (!uid) throw new Error("No signed-in user.");
  const snap = await withTimeout(
    getDoc(doc(db, USERS, uid)),
    LOAD_TIMEOUT_MS,
    "Loading your profile is taking too long. Check your connection and refresh.",
  );
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
    profileSetupComplete: Boolean(data.profileSetupComplete),
  };
}

/** Cleans the editable fields. photoURL is only included when a new photo was picked. */
export function cleanProfileChanges({ bio, offers, needs, photoURL }) {
  const changes = {
    bio: String(bio || "")
      .trim()
      .slice(0, 300),
    offers: cleanTags(offers),
    needs: cleanTags(needs),
  };
  if (photoURL) changes.photoURL = photoURL;
  return changes;
}

/** Saves the editable fields in ONE write and returns the cleaned values that were saved. */
export async function updateProfile(uid, values) {
  if (!uid) throw new Error("No signed-in user.");
  const changes = cleanProfileChanges(values);
  await withTimeout(updateDoc(doc(db, USERS, uid), changes));
  return changes;
}

/** Used by the setup page: saves the generated profile and marks setup as done. */
export async function completeProfileSetup(uid, generated = {}) {
  if (!uid) throw new Error("No signed-in user.");
  const changes = {
    bio: String(generated.bio || "")
      .trim()
      .slice(0, 300),
    offers: cleanTags(generated.offers || generated.skills || []),
    needs: cleanTags(generated.needs || []),
    profileSetupComplete: true,
  };
  await withTimeout(updateDoc(doc(db, USERS, uid), changes));
  return changes;
}

/* ---------- profile photo ---------- */
/* Phone photos are 3-5 MB, which is what makes uploads crawl. We crop to a square and shrink
   it to ~320px in the browser (about 20-30 KB), then save it on the user document with the
   rest of the profile. No Firebase Storage needed. */

const MAX_PICKED_BYTES = 15 * 1024 * 1024;
const PHOTO_SIZE = 320;
const PHOTO_QUALITY = 0.8;
const MAX_PHOTO_CHARS = 150_000; // ~110 KB; Firestore documents max out at 1 MB

/** Returns an error message, or "" if the file is fine. */
export function validatePhoto(file) {
  if (!file.type.startsWith("image/"))
    return "Choose an image file (JPG or PNG).";
  if (file.size > MAX_PICKED_BYTES)
    return "That image is over 15 MB. Choose a smaller one.";
  return "";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We couldn't read that image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

/** Center-crop to a square, shrink, and return a small JPEG data URL. */
export async function shrinkPhoto(file) {
  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  canvas
    .getContext("2d")
    .drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  let data = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
  if (data.length > MAX_PHOTO_CHARS) data = canvas.toDataURL("image/jpeg", 0.5); // keep the document small
  return data;
}
