import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { suggestMatches } from "./gemini";

export async function findMatches(myId) {
  const snap = await getDocs(collection(db, "users"));
  const people = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const me = people.find((p) => p.id === myId);
  if (!me) throw new Error("User not found: " + myId);

  const others = people.filter(
    (p) => p.id !== myId && ((p.offers || []).length || (p.needs || []).length),
  );
  const suggestions = await suggestMatches(me, others);
  return suggestions
    .map((s) => ({ ...s, person: others.find((o) => o.id === s.userId) }))
    .filter((s) => s.person);
}
