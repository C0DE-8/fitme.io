const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_CHAT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

function isConfigured() {
  return !!TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_IDS.length > 0;
}

async function sendTelegramMessage(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.description || 'Telegram message failed');
  }
}

async function sendTelegramAdminAlert(text) {
  if (!isConfigured()) {
    console.warn('Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_IDS missing');
    return;
  }

  await Promise.allSettled(TELEGRAM_ADMIN_CHAT_IDS.map((chatId) => sendTelegramMessage(chatId, text)));
}

module.exports = {
  sendTelegramAdminAlert
};
