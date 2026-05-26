const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
require('dotenv').config();
const path = require('path');

// Serve the uploads folder statically to access uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads/foods')));
// Serve the uploads folder statically to access uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads/payment_proofs')));
// Serve the account logos folder statically to access uploaded account logos
app.use('/uploads/account-logos', express.static(path.join(__dirname, 'uploads', 'account-logos')));
// app.js (or server.js)
app.use(express.static(path.join(__dirname, 'public'))); // where shared-storage.html lives
// If a browser hits the API URL, send them to the HTML page with ?id=<shareId>
// put BEFORE app.use('/api/user', user storage routes)
app.get('/api/user/storage/shared/:shareId', (req, res, next) => {
  const accept = req.headers.accept || '';
  const secDest = req.headers['sec-fetch-dest'];   // 'document' on real page loads
  const secMode = req.headers['sec-fetch-mode'];   // 'navigate' on real page loads

  const wantsJson = accept.includes('application/json');
  const isBrowserNavigation =
    (secDest === 'document' || secMode === 'navigate') &&
    accept.includes('text/html');

  if (isBrowserNavigation && !wantsJson) {
    return res.redirect(302, `/shared-storage.html?id=${req.params.shareId}`);
  }
  return next(); // let your JSON route handle fetch/Postman
});

require('./jobs/chatWorker');
require('./jobs/subscriptionExpiry');
require('./jobs/foodFeedExpiry');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('fitme is working');
});

// Routes
const userProfileRoutes = require('./routes/user.profile');
const userSubscriptionRoutes = require('./routes/user.subscriptions');
const userAccountRoutes = require('./routes/user.accounts');
const userPaymentRoutes = require('./routes/user.payments');
const userStorageRoutes = require('./routes/user.storage');
const userFoodRoutes = require('./routes/user.foods');
const userFoodFeedRoutes = require('./routes/user.foodFeed');
const adminProfileRoutes = require('./routes/admin.profile');
const adminUsersRoutes = require('./routes/admin.users');
const adminStatsRoutes = require('./routes/admin.stats');
const adminAccountsRoutes = require('./routes/admin.accounts');
const adminPlansRoutes = require('./routes/admin.plans');
const adminSubscriptionsRoutes = require('./routes/admin.subscriptions');
const adminFoodsRoutes = require('./routes/admin.foods');
const adminFoodFeedRoutes = require('./routes/admin.foodFeed');
const adminStorageItemsRoutes = require('./routes/admin.storageItems');
const adminMessageBotMessagesRoutes = require('./routes/admin.messageBotMessages');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

app.use('/api/user', userProfileRoutes);
app.use('/api/user', userSubscriptionRoutes);
app.use('/api/user', userAccountRoutes);
app.use('/api/user', userPaymentRoutes);
app.use('/api/user', userStorageRoutes);
app.use('/api/user', userFoodRoutes);
app.use('/api/user', userFoodFeedRoutes);
app.use('/api/admin', adminProfileRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin', adminAccountsRoutes);
app.use('/api/admin', adminPlansRoutes);
app.use('/api/admin', adminSubscriptionsRoutes);
app.use('/api/admin', adminFoodsRoutes);
app.use('/api/admin', adminFoodFeedRoutes);
app.use('/api/admin', adminStorageItemsRoutes);
app.use('/api/admin', adminMessageBotMessagesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


const PORT = 7005;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
