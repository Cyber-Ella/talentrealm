import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import app from "./firebase";

// If you ever get a "404" or "model not found" error, only this line needs changing.
// Check the model names listed in the Firebase console under AI Logic.
const MODEL_NAME = "gemini-3.5-flash-lite";

const ai = getAI(app, { backend: new GoogleAIBackend() });

const schema = Schema.object({
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

const model = getGenerativeModel(ai, {
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json", responseSchema: schema },
});

const INSTRUCTIONS = `You help UNIZIK students describe what they can do and what they need.
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
  const result = await model.generateContent(INSTRUCTIONS + text);
  return JSON.parse(result.response.text());
}