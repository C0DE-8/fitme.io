const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { GoogleGenerativeAI } = require("@google/generative-ai");

function getApiKey() {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    throw new Error(
      "Set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in backend/.env"
    );
  }
  return key;
}

// Stable default — override with GEMINI_MODEL in .env if you prefer another tier
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const REQUEST_TIMEOUT_MS = Math.max(
  10000,
  parseInt(process.env.GEMINI_REQUEST_TIMEOUT_MS || "120000", 10) || 120000
);

const MAX_RETRIES = Math.min(
  5,
  Math.max(0, parseInt(process.env.GEMINI_MAX_RETRIES || "3", 10) || 3)
);

const RETRY_BASE_MS = Math.max(
  200,
  parseInt(process.env.GEMINI_RETRY_BASE_MS || "600", 10) || 600
);

const defaultRequestOptions = { timeout: REQUEST_TIMEOUT_MS };

const genAI = new GoogleGenerativeAI(getApiKey());

/** Base model instance (no system instruction). Use `getGenerativeModel({...})` for chat/system prompts. */
const model = genAI.getGenerativeModel(
  { model: MODEL },
  defaultRequestOptions
);

function collectErrorChain(err) {
  const messages = [];
  const codes = [];
  let e = err;
  let depth = 0;
  while (e && depth++ < 8) {
    if (e.message) messages.push(String(e.message));
    if (e.code) codes.push(String(e.code));
    e = e.cause;
  }
  return { text: messages.join(" | "), codes };
}

function isTransientNetworkError(err) {
  const { text, codes } = collectErrorChain(err);
  const lower = text.toLowerCase();
  const transientCodes = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNREFUSED",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
  ]);
  if (codes.some((c) => transientCodes.has(c))) return true;
  if (lower.includes("fetch failed")) return true;
  if (lower.includes("network error")) return true;
  if (lower.includes("socket") && lower.includes("hang")) return true;
  if (lower.includes("econnreset")) return true;
  if (lower.includes("etimedout")) return true;
  if (lower.includes("getaddrinfo")) return true;
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetries(label, fn) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const retry = attempt < MAX_RETRIES && isTransientNetworkError(e);
      if (!retry) throw e;
      const delay =
        RETRY_BASE_MS * 2 ** attempt + Math.floor(Math.random() * 250);
      console.warn(
        `[gemini] ${label} attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${e.message} — retry in ${delay}ms`
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Model with extra params (systemInstruction, generationConfig, etc.).
 * Uses the same API key and default timeout as `model`.
 */
function getGenerativeModel(modelParams = {}) {
  return genAI.getGenerativeModel(
    {
      model: MODEL,
      ...modelParams,
    },
    defaultRequestOptions
  );
}

/**
 * Chat with system prompt + OpenAI-style history (user/assistant) + final user message.
 */
async function generateChatReply(systemPrompt, historyMessages, userMessage) {
  const chatModel = getGenerativeModel({
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.4 },
  });

  const contents = [];
  for (const h of historyMessages) {
    const role = h.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: h.content }] });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const result = await withRetries("generateChatReply", () =>
    chatModel.generateContent({ contents })
  );
  const text = result.response.text();
  const meta = result.response.usageMetadata;
  const usage = meta
    ? {
        prompt_tokens: meta.promptTokenCount,
        completion_tokens: meta.candidatesTokenCount,
        total_tokens: meta.totalTokenCount,
      }
    : undefined;

  return { text, usage };
}

/**
 * Single system + user turn (no prior history).
 */
async function generateSimple(systemPrompt, userMessage, temperature = 0.2) {
  const simpleModel = getGenerativeModel({
    systemInstruction: systemPrompt,
    generationConfig: { temperature },
  });
  const result = await withRetries("generateSimple", () =>
    simpleModel.generateContent(userMessage)
  );
  return result.response.text();
}

module.exports = {
  model,
  genAI,
  MODEL,
  getGenerativeModel,
  generateChatReply,
  generateSimple,
  collectErrorChain,
  isTransientNetworkError,
};
