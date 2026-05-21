const foodFeedRoutes = require('../routes/user.foodFeed');

async function removeExpiredFoodPosts() {
  try {
    await foodFeedRoutes.ensureFoodFeedTables();
    await foodFeedRoutes.purgeExpiredFoodPosts();
  } catch (err) {
    console.error('Error removing expired food feed posts:', err);
  }
}

console.log('Food feed expiry worker working');

removeExpiredFoodPosts();
setInterval(() => {
  removeExpiredFoodPosts();
}, 60 * 60 * 1000);
