import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const DEMO_USERS = [
  { id: "demo-ella", name: "Ella Obi", department: "Computer Science", level: "300",
    offers: ["Hair styling", "Braids"], needs: ["Fashion design"] },
  { id: "demo-amaka", name: "Amaka Okafor", department: "Fine Arts", level: "300",
    offers: ["Fashion design", "Tailoring"], needs: ["Product photography"] },
  { id: "demo-david", name: "David Eze", department: "Mass Communication", level: "400",
    offers: ["Photography"], needs: ["Hair styling"] },
  { id: "demo-tunde", name: "Tunde Bello", department: "Computer Science", level: "200",
    offers: ["Website design"], needs: ["Photography", "Logo design"] },
  { id: "demo-chisom", name: "Chisom Nwosu", department: "Architecture", level: "300",
    offers: ["Logo design", "Graphic design"], needs: ["Website design"] },
  { id: "demo-blessing", name: "Blessing Udo", department: "Music", level: "200",
    offers: ["Singing lessons"], needs: ["Social media management"] },
];

export async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    await setDoc(doc(db, "users", u.id), {
      ...u,
      email: u.id + "@demo.local",
      bio: "",
      verified: true,
      createdAt: serverTimestamp(),
    });
  }
  return DEMO_USERS.length;
}