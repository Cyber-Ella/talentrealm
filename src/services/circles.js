import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { findServiceEdges } from "./gemini";

/* ---------- Plain-code matching (no AI), so the demo always works ---------- */

const STOP = new Set([
  "and",
  "for",
  "the",
  "service",
  "services",
  "design",
  "with",
  "your",
  "help",
]);

const GROUPS = [
  ["hair", "braid", "twist", "wig", "stylin", "hairstyl", "barb"],
  ["photo", "camera", "shoot", "videograph", "video"],
  ["fashion", "tailor", "sewing", "cloth", "outfit", "garment", "dress"],
  ["website", "web", "coding", "develop", "programm", "app"],
  ["logo", "graphic", "branding", "brand"],
  ["sing", "music", "vocal", "song"],
  ["social", "instagram", "tiktok", "content"],
];

const tokens = (s) =>
  String(s || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

const stemMatch = (word, stem) =>
  word === stem || (stem.length > 3 && word.startsWith(stem));

const groupsOf = (word) =>
  GROUPS.map((g, i) =>
    g.some((stem) => stemMatch(word, stem)) ? i : -1,
  ).filter((i) => i >= 0);

function related(a, b) {
  const ta = tokens(a),
    tb = tokens(b);
  if (ta.some((w) => tb.includes(w))) return true;
  const ga = new Set(ta.flatMap(groupsOf));
  return tb.flatMap(groupsOf).some((g) => ga.has(g));
}

function localEdges(people) {
  const edges = [];
  for (const p of people) {
    for (const r of people) {
      if (p.id === r.id) continue;
      for (const offer of p.offers || []) {
        const need = (r.needs || []).find((n) => related(offer, n));
        if (need) {
          edges.push({ providerId: p.id, receiverId: r.id, offer, need });
          break;
        }
      }
    }
  }
  return edges;
}

function mergeEdges(primary, extra) {
  const seen = new Set(primary.map((e) => e.providerId + ">" + e.receiverId));
  const out = [...primary];
  for (const e of extra) {
    const key = e.providerId + ">" + e.receiverId;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

/* ---------- Finding swaps and circles ---------- */

// Each leg means: providerId gives "offer" to receiverId.
// Direct swap: legs [me to x, x to me].
// Circle: legs [me to x, x to y, y to me].
export async function findCircles(myId) {
  const snap = await getDocs(collection(db, "users"));
  const people = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const active = people.filter(
    (p) => (p.offers || []).length || (p.needs || []).length,
  );
  if (!active.find((p) => p.id === myId))
    throw new Error("Add some offers and needs to this profile first.");

  const codeEdges = localEdges(active);
  let aiEdges = [];
  let geminiError = "";
  try {
    aiEdges = await findServiceEdges(active);
  } catch (e) {
    geminiError = e.message;
  }
  const edges = mergeEdges(codeEdges, aiEdges);

  const edge = (a, b) =>
    edges.find((e) => e.providerId === a && e.receiverId === b);
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));

  const direct = [];
  const circles = [];
  const seen = new Set();

  for (const e1 of edges.filter((e) => e.providerId === myId)) {
    const back = edge(e1.receiverId, myId);
    if (back) {
      const key = "d:" + [myId, e1.receiverId].sort().join(",");
      if (!seen.has(key)) {
        seen.add(key);
        direct.push({ legs: [e1, back] });
      }
    }
    for (const e2 of edges.filter(
      (e) => e.providerId === e1.receiverId && e.receiverId !== myId,
    )) {
      const e3 = edge(e2.receiverId, myId);
      if (!e3) continue;
      const key = "c:" + [myId, e1.receiverId, e2.receiverId].sort().join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      circles.push({ legs: [e1, e2, e3] });
    }
  }

  return {
    people: byId,
    direct: direct.slice(0, 5),
    circles: circles.slice(0, 5),
    debug: {
      people: active.length,
      byCode: codeEdges.length,
      byGemini: aiEdges.length,
      geminiError,
    },
  };
}
