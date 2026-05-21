const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'this_is_gods_not_man_990_555_heaven';
/** Separate secret so admin JWTs cannot be used on /api/user routes and vice versa. */
const JWT_ADMIN_SECRET =
  process.env.JWT_ADMIN_SECRET || `${JWT_SECRET}_admin_fitme_io`;

function attachUserFromPayload(decoded, req) {
  req.user = {
    id: decoded.userId,
    username: decoded.username,
    role: decoded.role
  };
}

// Middleware: app users only (JWT signed with JWT_SECRET)
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    if (decoded.typ === 'admin') {
      return res.status(403).json({ error: 'Use a user session token for this resource' });
    }
    attachUserFromPayload(decoded, req);
    next();
  });
}

// Middleware: admins only (JWT signed with JWT_ADMIN_SECRET)
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_ADMIN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    attachUserFromPayload(decoded, req);
    next();
  });
}

// --- Subscription gate middleware & helper -------------------------------
async function hasActiveSubscription(userId, planName = null) {
  const sql = `
    SELECT id, plan_name, status, start_date, expiry_date
    FROM subscriptions
    WHERE user_id = ?
      AND status = 'active'
      ${planName ? 'AND plan_name = ?' : ''}
      AND start_date <= NOW()
      AND expiry_date >= NOW()
    ORDER BY expiry_date DESC
    LIMIT 1
  `;
  const params = planName ? [userId, planName] : [userId];
  const [rows] = await db.promise().query(sql, params);
  return rows[0] || null;
}

// Middleware to enforce subscription requirements
function requireSubscription(options = {}) {
  const { planName = null, adminBypass = true } = options;

  return async (req, res, next) => {
    try {
      // Must be authenticated first
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Optional admin bypass
      if (adminBypass && req.user.role === 'admin') {
        return next();
      }

      const activeSub = await hasActiveSubscription(req.user.id, planName);

      if (!activeSub) {
        const baseMsg = 'No active subscription. Please subscribe to continue.';
        return res.status(402).json({
          error: baseMsg,
          required_plan: planName || 'any',
          // You can surface UI hints to your frontend here:
          action: {
            type: 'subscribe',
            plan_required: planName || null
          }
        });
      }

      // Attach the active subscription for downstream handlers if needed
      req.subscription = activeSub;
      next();
    } catch (err) {
      console.error('Subscription middleware error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
}
module.exports = {
  authenticateUser,
  authenticateAdmin,
  requireSubscription,
  hasActiveSubscription,
  JWT_SECRET,
  JWT_ADMIN_SECRET
};
