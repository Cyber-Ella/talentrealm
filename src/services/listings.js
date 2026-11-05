import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadImageToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Image upload failed.");
  }

  return result.secure_url;
}

export async function createListing(data, imageFiles = []) {
  const imageUrls = [];

  // Upload portfolio images to Cloudinary.
  for (const file of imageFiles) {
    const url = await uploadImageToCloudinary(file);
    imageUrls.push(url);
  }

  // Save listing and image URLs in Firestore.
  const listingRef = await addDoc(collection(db, "listings"), {
    ...data,
    imageUrls,
    createdAt: serverTimestamp(),
  });

  return listingRef.id;
}

export async function getListings() {
  const snap = await getDocs(collection(db, "listings"));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  list.sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
  );

  return list;
}

export async function getListing(id) {
  const s = await getDoc(doc(db, "listings", id));

  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export async function getMyListings(uid) {
  return (await getListings()).filter((l) => l.ownerId === uid);
}
