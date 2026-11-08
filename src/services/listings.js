import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, where, updateDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { studentName } from "./names";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VALID_TYPES = new Set(["service", "product", "showcase"]);

function cleanText(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function validateListing(data) {
  if (!data?.ownerId) throw new Error("Sign in before publishing a listing.");
  const title = cleanText(data.title, 100);
  const description = cleanText(data.description, 2000);
  if (title.length < 2) throw new Error("Give your listing a title (at least 2 characters).");
  if (!description) throw new Error("Add a description so people understand your offer.");
  if (!VALID_TYPES.has(data.type)) throw new Error("Choose a valid listing type.");
  const price = Number(data.price ?? 0);
  if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
  return { ...data, title, description, price, category: cleanText(data.category, 60) || "Other" };
}

async function uploadImageToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Image uploads aren't configured. Add Cloudinary values to .env.");
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: only images are allowed.`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} exceeds the 5MB limit.`);
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || `Could not upload ${file.name}.`);
  return result.secure_url;
}

export async function createListing(data, imageFiles = []) {
  const valid = validateListing(data);
  if (imageFiles.length > MAX_IMAGES) throw new Error(`Upload no more than ${MAX_IMAGES} images.`);
  const imageUrls = [];
  for (const file of imageFiles) imageUrls.push(await uploadImageToCloudinary(file));
  let ownerName = studentName(cleanText(valid.ownerName, 100));
  if (ownerName === "Student") {
    try { ownerName = studentName((await getDoc(doc(db, "publicProfiles", valid.ownerId))).data()?.name); } catch { /* keep fallback */ }
  }
  const ref = await addDoc(collection(db, "listings"), {
    ownerId: valid.ownerId,
    ownerName,
    type: valid.type,
    title: valid.title,
    description: valid.description,
    category: valid.category,
    price: valid.type === "showcase" ? 0 : valid.price,
    skills: Array.isArray(valid.skills) ? valid.skills.slice(0, 20).map((s) => cleanText(s, 60)).filter(Boolean) : [valid.title],
    imageUrls,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}


export function watchListings(callback, onError = () => {}) {
  return onSnapshot(collection(db, "listings"), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  }, onError);
}

export function watchMyListings(uid, callback, onError = () => {}) {
  if (!uid) return () => {};
  const q = query(collection(db, "listings"), where("ownerId", "==", uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  }, onError);
}

export function watchListing(id, callback, onError = () => {}) {
  if (!id) return () => {};
  return onSnapshot(doc(db, "listings", id), (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}

export async function getListings({ ownerId, type, category } = {}) {
  // Filter in-memory so the same function works without requiring new composite indexes.
  const snap = await getDocs(collection(db, "listings"));
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (ownerId) items = items.filter((x) => x.ownerId === ownerId);
  if (type) items = items.filter((x) => x.type === type);
  if (category) items = items.filter((x) => x.category === category);
  return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getListing(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, "listings", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyListings(uid) {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, "listings"), where("ownerId", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function updateListing(id, uid, changes) {
  const ref = doc(db, "listings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("This listing no longer exists.");
  if (snap.data().ownerId !== uid) throw new Error("You can only edit your own listings.");
  const next = validateListing({ ...snap.data(), ...changes, ownerId: uid });
  await updateDoc(ref, { title: next.title, description: next.description, category: next.category, price: next.type === "showcase" ? 0 : next.price, skills: next.skills || [next.title] });
  return getListing(id);
}

export async function deleteListing(id, uid) {
  const ref = doc(db, "listings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (snap.data().ownerId !== uid) throw new Error("You can only delete your own listings.");
  const open = ["pending_approval", "accepted", "in_progress", "awaiting_confirmation"];
  const mine = await getDocs(query(collection(db, "exchanges"), where("participants", "array-contains", uid)));
  const inUse = mine.docs.some((d) => {
    const x = d.data();
    return open.includes(x.status) && (x.items || []).some((i) => i.listingId === id);
  });
  if (inUse) throw new Error("This listing belongs to an active exchange. Finish or cancel that exchange first.");
  await deleteDoc(ref);
}
