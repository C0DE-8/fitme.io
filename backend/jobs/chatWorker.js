// jobs/chatWorker.js
const cron = require('node-cron');
const db = require('../db'); // MySQL2 connection
const moment = require('moment');
const { generateSimple } = require('../lib/gemini');

// Config
const THROTTLE_MINUTES = 5;  // minimum minutes between AI replies per session
const RETRY_ATTEMPTS = 3;    // number of retry attempts if AI fails
const RETRY_DELAY_MS = 3000; // delay between retries in milliseconds

console.log('Chat worker working');

// Run the chat worker every minute
cron.schedule('* * * * *', async () => {
  try {
    // 1️⃣ Fetch all verified users
    const [users] = await db.promise().query(
      `SELECT id, username FROM users WHERE verified = 1`
    );

    for (const user of users) {
      const userId = user.id;
      const username = user.username;

      // 2️⃣ Fetch user messages that have not been replied and belong to active sessions
      const [pendingMessages] = await db.promise().query(
        `SELECT id AS message_id, content, session_id
         FROM chat_history
         WHERE user_id = ? AND role = 'user' AND session_id IS NOT NULL AND replied = FALSE
         ORDER BY created_at ASC`,
        [userId]
      );

      if (!pendingMessages.length) continue;

      for (const msg of pendingMessages) {
        const { message_id, content: lastMessage, session_id } = msg;

        // 3️⃣ Throttle AI calls per session
        const [lastAI] = await db.promise().query(
          `SELECT created_at FROM chat_history
           WHERE user_id = ? AND session_id = ? AND role = 'assistant'
           ORDER BY created_at DESC LIMIT 1`,
          [userId, session_id]
        );

        if (lastAI.length) {
          const lastTime = moment(lastAI[0].created_at);
          if (moment().diff(lastTime, 'minutes') < THROTTLE_MINUTES) continue;
        }

        // 4️⃣ Generate AI response with retry logic
        let aiReply = null;
        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
          try {
            aiReply = await generateSimple(
              `You are Fitme.io AI, a Nigerian-focused meal & budgeting assistant.`,
              lastMessage,
              0.4
            );
            break;
          } catch (err) {
            console.error(`[Attempt ${attempt}] AI error for ${username}:`, err.message);
            if (attempt < RETRY_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }
        }

        if (!aiReply) {
          console.warn(`[${username}] Skipped message ${message_id} — AI reply failed`);
          continue;
        }

        // 5️⃣ Save AI reply to chat_history
        await db.promise().query(
          `INSERT INTO chat_history (user_id, role, content, session_id, created_at)
           VALUES (?, 'assistant', ?, ?, ?)`,
          [userId, aiReply, session_id, moment().format('YYYY-MM-DD HH:mm:ss')]
        );

        // 6️⃣ Mark the original user message as replied
        await db.promise().query(
          `UPDATE chat_history SET replied = TRUE WHERE id = ?`,
          [message_id]
        );

      }
    }

  } catch (err) {
    console.error('Chat worker error:', err);
  }
}, {
  scheduled: true,
  timezone: "Africa/Lagos"
});

;
