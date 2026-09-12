import Groq from "groq-sdk";

// Lazy-initialize so the server can start even before env vars are validated
let _groq = null;
const getGroq = () => {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

/**
 * Send messages to Groq and get a response string.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - optional overrides (model, temperature, max_tokens)
 * @returns {Promise<string>}
 */
export const askAi = async (messages, options = {}) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages array is empty.");
  }

  const {
  model = "openai/gpt-oss-20b",
  temperature = 0.7,
  max_tokens = 1024,
} = options;

  const chatCompletion = await getGroq().chat.completions.create({
  messages,
  model,
  temperature,
  max_completion_tokens: 4096,
  reasoning_effort: "low",
  include_reasoning: false,
});

  const content = chatCompletion?.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
};

/**
 * Parse JSON from AI response safely, stripping markdown code fences if present.
 * @param {string} raw
 * @returns {object}
 */
export const parseAiJson = (raw) => {
  // Strip ```json ... ``` or ``` ... ``` fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
};
