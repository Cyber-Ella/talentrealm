import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import app from "./firebase";

// If you ever get a "404" or "model not found" error, only this line needs changing.
const MODEL_NAME = "gemini-3.5-flash-lite";

const ai = getAI(app, { backend: new GoogleAIBackend() });

/* ---------- 1. Refine a description ---------- */

const refineSchema = Schema.object({
  properties: {
    refined: Schema.string(),
    skills: Schema.array({ items: Schema.string() }),
    needs: Schema.array({ items: Schema.string() }),
    category: Schema.enumString({
      enum: ["Beauty", "Fashion", "Photography", "Food", "Music", "Technology", "Academics", "Creative", "Other"],
    }),
    type: Schema.enumString({ enum: ["service", "showcase"] }),
  },
});

const refineModel = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: refineSchema },
});

const REFINE_INSTRUCTIONS = `You help UNIZIK students describe what they can do and what they need.
Rewrite the student's text as a clear, friendly description in the first person (1 to 3 sentences).
Keep their meaning. Do not invent prices, qualifications, experience or services they did not mention.
Also return:
- skills: the services or talents they offer (short phrases)
- needs: things they say they need (empty list if none)
- category: the best matching category
- type: "service" if they offer something others can request, "showcase" if they mainly show their work.
Student's text:
`;

export async function refineDescription(text) {
  const result = await refineModel.generateContent(REFINE_INSTRUCTIONS + text);
  return JSON.parse(result.response.text());
}

/* ---------- 2. Estimate the value of two services ---------- */

const valueSchema = Schema.object({
  properties: {
    offeredValue: Schema.number(),
    requestedValue: Schema.number(),
    offeredReason: Schema.string(),
    requestedReason: Schema.string(),
  },
});

const valueModel = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: valueSchema },
});

const VALUE_INSTRUCTIONS = `You estimate fair prices in Nigerian naira for services exchanged between university students in Nigeria.
Typical student jobs cost between 1000 and 20000 naira. Be conservative and round each value to the nearest 500.
For each service, give a fair price and a one-sentence reason that mentions what drives it (time, skill, materials).
Return plain numbers only, with no currency symbols.
Use exactly these JSON fields: offeredValue, requestedValue, offeredReason, requestedReason.
"offered" is the service the first student gives. "requested" is the service they want in return.
Services:
`;

export async function estimateValues(offered, requested) {
  const prompt = VALUE_INSTRUCTIONS + JSON.stringify({ offered, requested });
  const result = await valueModel.generateContent(prompt);
  const raw = result.response.text();
  console.log("Gemini valuation raw:", raw);

  let data = JSON.parse(raw);
  if (Array.isArray(data)) data = data[0] || {};

  const num = (v) => {
    const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const offeredValue = Math.min(500000, num(data.offeredValue ?? data.offered_value));
  const requestedValue = Math.min(500000, num(data.requestedValue ?? data.requested_value));

  if (!offeredValue || !requestedValue) {
    throw new Error("Gemini did not return a usable estimate. Raw answer: " + raw.slice(0, 200));
  }

  return {
    offeredValue,
    requestedValue,
    offeredReason: data.offeredReason ?? data.offered_reason ?? "",
    requestedReason: data.requestedReason ?? data.requested_reason ?? "",
  };
}

/* ---------- 3. Suggest matches for one student ---------- */

/* ---------- 3. Suggest matches for one student ---------- */

const matchSchema = Schema.object({
  properties: {
    matches: Schema.array({
      items: Schema.object({
        properties: {
          userId: Schema.string(),
          theyOffer: Schema.string(),
          theirNeed: Schema.string(),
          iOffer: Schema.string(),
        },
      }),
    }),
  },
});

const matchModel = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: matchSchema },
});

const MATCH_INSTRUCTIONS = `You match university students on a skill-exchange platform. Students trade services (barter). This is not teaching or learning.
Never use the words learn, teach, lesson or training.
You get "me" (offers and needs) and "others" (userId, name, offers, needs).
For each person in "others" who offers something I need, return one entry:
- userId: exactly as given
- theyOffer: the item from THEIR offers that satisfies one of MY needs (copy the text exactly)
- theirNeed: an item from THEIR needs that one of MY offers satisfies (copy exactly), or "" if none
- iOffer: the item from MY offers that satisfies theirNeed (copy exactly), or "" if theirNeed is ""
Match by meaning (braids satisfies hair styling) but never invent a need that is not in their list.
Return at most 5 entries. People with both theirNeed and iOffer filled come first.
Data:
`;

const norm = (s) => String(s || "").trim().toLowerCase();
const inList = (list, v) => (list || []).some((x) => norm(x) === norm(v));
const pick = (list, v) => (list || []).find((x) => norm(x) === norm(v)) || "";

export async function suggestMatches(me, others) {
  const payload = {
    me: { offers: me.offers || [], needs: me.needs || [] },
    others: others.map((o) => ({ userId: o.id, name: o.name, offers: o.offers || [], needs: o.needs || [] })),
  };
  const result = await matchModel.generateContent(MATCH_INSTRUCTIONS + JSON.stringify(payload));
  const raw = result.response.text();
  console.log("Gemini matching raw:", raw);
  const data = JSON.parse(raw);

  const byId = Object.fromEntries(others.map((o) => [o.id, o]));
  const out = [];
  for (const m of data.matches || []) {
    const person = byId[m.userId];
    if (!person) continue;

    const theyOffer = pick(person.offers, m.theyOffer);
    if (!theyOffer) continue; // they must really offer it

    let theirNeed = pick(person.needs, m.theirNeed);
    let iOffer = pick(me.offers, m.iOffer);
    if (!theirNeed || !iOffer) { theirNeed = ""; iOffer = ""; }

    const first = (person.name || "They").split(" ")[0];
    const direct = Boolean(theirNeed && iOffer);
    const reason = direct
      ? `${first} offers ${theyOffer}, which you need. You offer ${iOffer}, which ${first} needs. A fair trade.`
      : `${first} offers ${theyOffer}, which you need. Nothing you offer matches what ${first} needs yet, so this could work as part of a 3-person exchange.`;

    out.push({ userId: m.userId, theyOffer, theirNeed, iOffer, direct, reason });
  }
  out.sort((a, b) => Number(b.direct) - Number(a.direct));
  return out.slice(0, 5);
}
/* ---------- 4. Who can serve whom (used to find circles) ---------- */

const edgeSchema = Schema.object({
  properties: {
    edges: Schema.array({
      items: Schema.object({
        properties: {
          providerId: Schema.string(),
          receiverId: Schema.string(),
          offerIndex: Schema.number(),
          needIndex: Schema.number(),
        },
      }),
    }),
  },
});

const edgeModel = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: edgeSchema },
});

const EDGE_INSTRUCTIONS = `You analyse a skill-exchange platform where students trade services (barter). This is not teaching or learning.
You get "people": each has id, offers (a list) and needs (a list).
Return every pair where one person's offer satisfies another person's need. Match by meaning:
braids satisfies hair styling, and photography satisfies product photography.
Each entry:
- providerId: the person offering
- receiverId: the person who needs it
- offerIndex: the zero-based position of that offer inside the provider's offers list
- needIndex: the zero-based position of that need inside the receiver's needs list
Never use the same person as provider and receiver.
People:
`;

export async function findServiceEdges(people) {
  const payload = people.map((p) => ({ id: p.id, offers: p.offers || [], needs: p.needs || [] }));
  const result = await edgeModel.generateContent(EDGE_INSTRUCTIONS + JSON.stringify(payload));
  const raw = result.response.text();
  console.log("Gemini edges raw:", raw);
  const data = JSON.parse(raw);

  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const seen = new Set();
  const edges = [];
  for (const e of data.edges || []) {
    const provider = byId[e.providerId];
    const receiver = byId[e.receiverId];
    if (!provider || !receiver || provider.id === receiver.id) continue;
    const offer = (provider.offers || [])[Math.round(Number(e.offerIndex))];
    const need = (receiver.needs || [])[Math.round(Number(e.needIndex))];
    if (!offer || !need) continue;
    const key = provider.id + ">" + receiver.id;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ providerId: provider.id, receiverId: receiver.id, offer, need });
  }
  console.log("Edges kept:", edges);
  return edges;
}

/* ---------- 5. Value of several services at once (for circles) ---------- */

const listSchema = Schema.object({
  properties: {
    values: Schema.array({
      items: Schema.object({
        properties: { service: Schema.string(), value: Schema.number(), reason: Schema.string() },
      }),
    }),
  },
});

const listModel = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: listSchema },
});

export async function estimateServiceValues(services) {
  const prompt = `You estimate fair prices in Nigerian naira for services exchanged between university students in Nigeria.
Typical student jobs cost between 1000 and 20000 naira. Be conservative and round each value to the nearest 500.
For each service in the list, return an entry in the SAME ORDER with: service (copied exactly), value (plain number), reason (one sentence about time, skill or materials).
Services:
` + JSON.stringify(services);
  const result = await listModel.generateContent(prompt);
  const raw = result.response.text();
  console.log("Gemini list values raw:", raw);
  const data = JSON.parse(raw);
  const list = data.values || [];
  if (list.length !== services.length) throw new Error("Gemini returned the wrong number of values.");
  return list.map((v) => {
    const n = Number(String(v.value ?? "").replace(/[^0-9.]/g, ""));
    const value = Math.min(500000, Number.isFinite(n) ? n : 0);
    if (!value) throw new Error("Gemini did not return a usable value for " + v.service);
    return { value, reason: v.reason || "" };
  });
}