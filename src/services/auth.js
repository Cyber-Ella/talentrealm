import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
updateProfile,
sendEmailVerification,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const UNIZIK_DOMAIN = "@stu.unizik.edu.ng";

export function isUnizikEmail(email = "") {
return String(email).trim().toLowerCase().endsWith(UNIZIK_DOMAIN);
}

export async function signUp({
name,
email,
password,
department,
level,
interests = [],
}) {
const normalizedEmail = email.trim().toLowerCase();

if (!isUnizikEmail(normalizedEmail)) {
throw new Error("Only UNIZIK student emails are allowed.");
}

const cred = await createUserWithEmailAndPassword(
auth,
normalizedEmail,
password
);

await updateProfile(cred.user, { displayName: name });

// Send verification email.
await sendEmailVerification(cred.user);

await setDoc(doc(db, "users", cred.user.uid), {
name,
email: normalizedEmail,
department,
level,
bio: "",
offers: [],
needs: [],
interests,
onboardingCompleted: true,
verified: false,
createdAt: serverTimestamp(),
});

await setDoc(doc(db, "publicProfiles", cred.user.uid), {
name,
department,
level,
interests,
offers: [],
needs: [],
createdAt: serverTimestamp(),
});

return cred.user;
}

export function logIn(email, password) {
const normalizedEmail = email.trim().toLowerCase();

if (!isUnizikEmail(normalizedEmail)) {
throw new Error("Only UNIZIK student emails are allowed.");
}

return signInWithEmailAndPassword(auth, normalizedEmail, password);
}
