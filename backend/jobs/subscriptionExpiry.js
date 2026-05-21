const db = require('../db');
const { subscriptionExpiryMail } = require('../utils/mailer');

// Check and expire subscriptions every hour
async function checkAndExpireSubscriptions() {
  try {
    const [expiredSubs] = await db.promise().query(
      `SELECT s.id, s.user_id, u.email, u.username, s.start_date, s.expiry_date 
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active' AND s.expiry_date < NOW()`
    );

    for (const sub of expiredSubs) {
      await db.promise().query(
        `UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`,
        [sub.id]
      );

      const startDateFormatted = new Date(sub.start_date).toLocaleDateString();
      const expiryDateFormatted = new Date(sub.expiry_date).toLocaleDateString();

      await subscriptionExpiryMail(
        sub.email,
        sub.username,
        startDateFormatted,
        expiryDateFormatted
      );
    }

  } catch (err) {
    console.error('Error checking expired subscriptions:', err);
  }
}

console.log('Subscription expiry worker working');

// Run the expiry check every hour
setInterval(() => {
  checkAndExpireSubscriptions();
}, 60 * 60 * 1000); // every hour
