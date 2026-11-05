import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function signUp({
  name,
  email,
  password,
  department,
  level,
  interests = [],
}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(cred.user, { displayName: name });

  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    department,
    level,
    bio: "",
    offers: [],
    needs: [],
    interests,
    onboardingCompleted: true,
    verified: email.endsWith("@stu.unizik.edu.ng"),
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

export function logIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
