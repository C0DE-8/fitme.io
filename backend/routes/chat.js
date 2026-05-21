// routes/chat.js
const express = require("express");
const db = require("../db");
const { authenticateUser, requireSubscription } = require("../middleware");
const {
  generateChatReply,
  generateSimple,
  collectErrorChain,
} = require("../lib/gemini");

const router = express.Router();

// ---------- helpers ----------
function sanitizeStr(v, def = "") {
  return (v ?? def).toString().trim();
}

function buildSystemPrompt({ user, storageItems, foods }) {
  const username = sanitizeStr(user.username, "User");

  // limit context sizes defensively
  const storageList =
    storageItems?.length
      ? storageItems.slice(0, 80).map(i => `- ${i.item_name}`).join("\n")
      : "No storage items found.";

  const foodsList =
    foods?.length
      ? foods.slice(0, 50).map(f => {
          const name = sanitizeStr(f.name);
          const type = sanitizeStr(f.type, "unspecified");
          const ing = sanitizeStr(f.ingredients, "not provided");
          const prep = sanitizeStr(
            f.prepared ? `Preparation: ${f.prepared}` : "Preparation not provided."
          );
          return `• ${name} (${type}) — Ingredients: ${ing}. ${prep}`;
        }).join("\n")
      : "No foods available in database.";

  return [
`You are Fitme.io AI, a Nigerian-focused meal and budgeting assistant.

You are chatting with a registered user:
- Username: ${username}
- Email: ${sanitizeStr(user.email)}
- Bio: ${sanitizeStr(user.bio) || "No bio"}
- Role: ${sanitizeStr(user.role)}
- Verified: ${user.verified ? "Yes" : "No"}
- Joined: ${user.created_at}

User storage (what the user currently has):
${storageList}

Available Nigerian foods and preparation instructions (from database):
${foodsList}

Rules:
1) Always greet the user by username (${username}).
2) Suggest meals based on Nigerian dishes.
3) Prioritize meals the user can cook with what they have.
4) If something is missing, suggest the **cheapest** options and quantities.
5) Always show costs in ₦ (approximate if needed).
6) Keep advice practical, interactive, concise, and cost-conscious.
7) If the user asks how to prepare a dish, use the 'prepared' instructions from the foods table and expand them into a clear, step-by-step guide tailored to what the user already has.
8) Format responses in clean Markdown with short headers and bullet points that are easy to read on mobile.`,

`Formatting style guide:
- Start with a warm greeting: "Hey ${username} 👋"
- Use short sections: "What you have", "3 cheap options", "How to cook", "Estimated cost"
- Keep steps compact (max 6–8 steps).`
  ].join("\n\n");
}

function validateMessage(msg) {
  if (typeof msg !== "string") return "message must be a string";
  const trimmed = msg.trim();
  if (!trimmed) return "message cannot be empty";
  if (trimmed.length > 4000) return "message is too long (max 4000 chars)";
  return null;
}

function isProbablyGeminiFailure(err) {
  const n = err?.name || "";
  if (n.includes("GoogleGenerativeAI")) return true;
  const { text } = collectErrorChain(err);
  if (text.includes("generativelanguage.googleapis.com")) return true;
  if (text.includes("Error fetching from https://")) return true;
  if (text.includes("fetch failed")) return true;
  if (text.includes("GEMINI_API_KEY")) return true;
  if (text.includes("GEMINI_API_KEY")) return true;
  if (text.includes("GOOGLE_GENERATIVE_AI_API_KEY")) return true;
  return false;
}

/** Map Gemini / network failures to HTTP status + user-safe message. */
function mapAiError(err) {
  const chain = collectErrorChain(err);
  const blob = `${chain.text} ${chain.codes.join(" ")}`.toLowerCase();

  if (blob.includes("must provide a model") || blob.includes("api key")) {
    return {
      status: 503,
      json: {
        error:
          "AI is not configured on this server. Set GEMINI_API_KEY in backend/.env and restart.",
        code: "AI_NOT_CONFIGURED",
      },
    };
  }

  if (
    err?.name === "GoogleGenerativeAIAbortError" ||
    blob.includes("aborted") ||
    blob.includes("timeout")
  ) {
    return {
      status: 504,
      json: {
        error:
          "The AI request took too long or was cancelled. Try a shorter message or try again.",
        code: "AI_TIMEOUT",
      },
    };
  }

  if (
    blob.includes("fetch failed") ||
    blob.includes("econnreset") ||
    blob.includes("etimedout") ||
    blob.includes("enotfound") ||
    blob.includes("eai_again") ||
    blob.includes("econnrefused") ||
    blob.includes("getaddrinfo") ||
    blob.includes("und_err_connect") ||
    blob.includes("und_err_socket") ||
    blob.includes("network")
  ) {
    return {
      status: 503,
      json: {
        error:
          "Could not reach Google AI (network issue). Check internet, firewall, VPN, or try again. On some systems, IPv6 issues cause this — try: NODE_OPTIONS=--dns-result-order=ipv4first",
        code: "AI_NETWORK",
      },
    };
  }

  if (blob.includes("[429") || blob.includes("resource exhausted")) {
    return {
      status: 429,
      json: {
        error: "AI rate limit reached. Please wait a minute and try again.",
        code: "AI_RATE_LIMIT",
      },
    };
  }

  if (blob.includes("[400") || blob.includes("invalid argument")) {
    return {
      status: 502,
      json: {
        error:
          "The AI rejected this request (invalid model or payload). Check GEMINI_MODEL matches an available Google model.",
        code: "AI_BAD_REQUEST",
      },
    };
  }

  if (blob.includes("[404") || blob.includes("not found")) {
    return {
      status: 502,
      json: {
        error:
          "Configured Gemini model was not found. Set GEMINI_MODEL to a valid model (e.g. gemini-2.0-flash or gemini-2.5-flash-preview).",
        code: "AI_MODEL_NOT_FOUND",
      },
    };
  }

  return {
    status: 502,
    json: {
      error:
        "The AI assistant failed to respond. Please try again in a moment.",
      code: "AI_ERROR",
    },
  };
}

/** Parse JSON from model output (handles optional ```json fences). */
function parseAiJson(raw) {
  let s = typeof raw === "string" ? raw.trim() : "";
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  return JSON.parse(s);
}
// ---------- routes ----------
// POST /chat
router.post("/", authenticateUser, requireSubscription(), async (req, res) => {
  const conn = db; // mysql2 pool with promise()
  try {
    const { message } = req.body || {};
    const userId = req.user?.id;

    // 0) Basic validation
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const msgErr = validateMessage(message);
    if (msgErr) return res.status(400).json({ error: msgErr });

    // 1) Fetch user info
    const [userRows] = await conn.promise().query(
      `SELECT id, username, email, bio, role, verified, created_at
         FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (!userRows.length) return res.status(404).json({ error: "User not found" });
    const user = userRows[0];

    // 2) Fetch user storage items (lightweight, limit for context)
    const [storageRows] = await conn.promise().query(
      `SELECT id, item_name
         FROM user_storage
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 120`,
      [userId]
    );

    // 3) Fetch last 10 chat messages (latest first), then send to model oldest->newest
    const [historyRows] = await conn.promise().query(
      `SELECT role, content, created_at
         FROM chat_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10`,
      [userId]
    );
    const historyMessages = historyRows
      .slice()                // copy
      .reverse()              // chronological
      .map(h => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: sanitizeStr(h.content)
      }));

    // 4) Fetch foods with prep (sorted by estimated cost if available)
    const [foodsRows] = await conn.promise().query(
      `SELECT id, name, ingredients, type, prepared
         FROM foods
        ORDER BY estimated_cost IS NULL, estimated_cost ASC
        LIMIT 100`
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      user,
      storageItems: storageRows,
      foods: foodsRows
    });

    // 5) Ask AI (Gemini)
    const { text: replyText, usage: gemUsage } = await generateChatReply(
      systemPrompt,
      historyMessages,
      message.trim()
    );

    const reply = sanitizeStr(replyText, "")
      || "Sorry, I couldn’t generate a reply right now. Please try again.";

    // 6) Save user message (mark as not replied yet)
    const [insUser] = await conn.promise().query(
      `INSERT INTO chat_history (user_id, role, content, created_at, replied)
       VALUES (?, 'user', ?, NOW(), FALSE)`,
      [userId, message.trim()]
    );
    const userMessageId = insUser.insertId;

    // 7) Save AI reply and link both with session_id
    const sessionId = userMessageId; // simple linkage
    await conn.promise().query(
      `INSERT INTO chat_history (user_id, role, content, created_at, session_id, replied)
       VALUES (?, 'assistant', ?, NOW(), ?, TRUE)`,
      [userId, reply, sessionId]
    );

    // 8) Mark original user message as replied
    await conn.promise().query(
      `UPDATE chat_history SET replied = TRUE, session_id = ? WHERE id = ?`,
      [sessionId, userMessageId]
    );

    // 9) Return reply (and optional usage if present)
    const usage = gemUsage;

    return res.status(200).json({ reply, usage });
  } catch (err) {
    console.error("Chat error:", err);
    if (err && collectErrorChain(err).text) {
      console.error("Chat error chain:", collectErrorChain(err).text);
    }
    if (!isProbablyGeminiFailure(err)) {
      return res
        .status(500)
        .json({ error: "Chat request failed", code: "SERVER_ERROR" });
    }
    const mapped = mapAiError(err);
    return res.status(mapped.status).json(mapped.json);
  }
});

// GET /chat/history
router.get('/history', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch user's basic info
    const [userRows] = await db.promise().query(
      `SELECT username FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = userRows[0].username;

    // Fetch chat messages
    const [messages] = await db.promise().query(
      `SELECT id, role, content, session_id, created_at
       FROM chat_history
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [userId]
    );

    // Annotate messages with AI name if role is assistant
    const annotatedMessages = messages.map(msg => ({
      ...msg,
      sender: msg.role === 'assistant' ? 'Fitme.io AI' : username
    }));

    res.json({
      username,
      totalMessages: messages.length,
      messages: annotatedMessages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// AI Storage Command Endpoint
router.post('/storage/ai', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message) return res.status(400).json({ message: 'Message is required' });

  try {
    // Ask AI to interpret command
    const aiResponse = await generateSimple(
      `You are Fitme.io AI, a Nigerian-focused meal and storage assistant.
You understand commands to manage user storage:
- Add item to storage
- Remove item from storage
- Remove all items
- Show all items
- Show allowed items

Respond ONLY in JSON:
{
  "action": "add|remove|remove-all|show|show-allowed",
  "item_name": "name of item if applicable"
}`,
      message,
      0.2
    );

    let command;
    try {
      command = parseAiJson(aiResponse);
    } catch (err) {
      return res.status(400).json({ message: 'AI could not parse your command', aiResponse });
    }

    const { action, item_name } = command;

    // 1️⃣ Show allowed items
    if (action === "show-allowed") {
      const [allowed] = await db.promise().query('SELECT name FROM storage_items');
      return res.json({ allowed_items: allowed.map(i => i.name) });
    }

    // 2️⃣ Show user's storage items
    if (action === "show") {
      const [items] = await db.promise().query('SELECT id, item_name FROM user_storage WHERE user_id = ?', [userId]);
      return res.json({ storage: items });
    }

    // 3️⃣ Add item
    if (action === "add" && item_name) {
      const [allowedItems] = await db.promise().query('SELECT name FROM storage_items WHERE name = ?', [item_name]);
      if (allowedItems.length === 0) return res.status(400).json({ message: `"${item_name}" is not allowed.` });

      const [existing] = await db.promise().query('SELECT * FROM user_storage WHERE user_id = ? AND item_name = ?', [userId, item_name]);
      if (existing.length > 0) return res.status(400).json({ message: `${item_name} already in storage.` });

      await db.promise().query('INSERT INTO user_storage (user_id, item_name) VALUES (?, ?)', [userId, item_name]);
      return res.json({ message: `${item_name} added to your storage.` });
    }

    // 4️⃣ Remove item
    if (action === "remove" && item_name) {
      const [existing] = await db.promise().query('SELECT * FROM user_storage WHERE user_id = ? AND item_name = ?', [userId, item_name]);
      if (existing.length === 0) return res.status(404).json({ message: `${item_name} not found in your storage.` });

      await db.promise().query('DELETE FROM user_storage WHERE user_id = ? AND item_name = ?', [userId, item_name]);
      return res.json({ message: `${item_name} removed from your storage.` });
    }

    // 5️⃣ Remove all items
    if (action === "remove-all") {
      await db.promise().query('DELETE FROM user_storage WHERE user_id = ?', [userId]);
      return res.json({ message: 'All items removed from your storage.' });
    }

    return res.status(400).json({ message: 'Unknown action', aiResponse });

  } catch (err) {
    console.error('AI storage command error:', err);
    if (!isProbablyGeminiFailure(err)) {
      return res.status(500).json({
        message: 'Server error',
        code: 'SERVER_ERROR',
      });
    }
    const mapped = mapAiError(err);
    return res.status(mapped.status).json({
      message: mapped.json.error,
      code: mapped.json.code,
    });
  }
});
module.exports = router;
