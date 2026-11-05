import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const DEMO_USERS = [
  {
    id: "demo-ella",
    name: "Ella Obi",
    department: "Computer Science",
    level: "300",
    offers: ["Hair styling", "Braids"],
    needs: ["Fashion design"],
  },
  {
    id: "demo-amaka",
    name: "Amaka Okafor",
    department: "Fine Arts",
    level: "300",
    offers: ["Fashion design", "Tailoring"],
    needs: ["Product photography"],
  },
  {
    id: "demo-david",
    name: "David Eze",
    department: "Mass Communication",
    level: "400",
    offers: ["Photography"],
    needs: ["Hair styling"],
  },
  {
    id: "demo-tunde",
    name: "Tunde Bello",
    department: "Computer Science",
    level: "200",
    offers: ["Website design"],
    needs: ["Photography", "Logo design"],
  },
  {
    id: "demo-chisom",
    name: "Chisom Nwosu",
    department: "Architecture",
    level: "300",
    offers: ["Logo design", "Graphic design"],
    needs: ["Website design"],
  },
  {
    id: "demo-blessing",
    name: "Blessing Udo",
    department: "Music",
    level: "200",
    offers: ["Live singing"],
    needs: ["Social media management"],
  },
];

const CATEGORY = {
  "Hair styling": "Beauty",
  Braids: "Beauty",
  "Fashion design": "Fashion",
  Tailoring: "Fashion",
  Photography: "Photography",
  "Website design": "Technology",
  "Logo design": "Creative",
  "Graphic design": "Creative",
  "Live singing": "Music",
};
const PRICE = {
  "Hair styling": 8000,
  Braids: 10000,
  "Fashion design": 12000,
  Tailoring: 6000,
  Photography: 7000,
  "Website design": 15000,
  "Logo design": 5000,
  "Graphic design": 5000,
  "Live singing": 4000,
};

export async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    await setDoc(doc(db, "users", u.id), {
      ...u,
      email: u.id + "@demo.local",
      bio: "",
      verified: true,
      createdAt: serverTimestamp(),
    });
    for (const [i, offer] of u.offers.entries()) {
      await setDoc(doc(db, "listings", `${u.id}-${i}`), {
        ownerId: u.id,
        ownerName: u.name,
        title: offer,
        category: CATEGORY[offer] || "Other",
        description: `${u.name.split(" ")[0]} offers ${offer.toLowerCase()} to fellow UNIZIK students.`,
        type: "service",
        price: PRICE[offer] || 5000,
        skills: [offer],
        createdAt: serverTimestamp(),
      });
    }
  }
  return DEMO_USERS.length;
}
