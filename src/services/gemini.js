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
