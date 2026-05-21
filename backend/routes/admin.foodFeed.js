const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const foodFeedRoutes = require('./user.foodFeed');

async function prepareFoodFeed() {
  await foodFeedRoutes.ensureFoodFeedTables();
  await foodFeedRoutes.purgeExpiredFoodPosts();
}

function imageUrl(req, image) {
  return image ? `${req.protocol}://${req.get('host')}/uploads/${image}` : null;
}

router.get('/food-feed/posts', authenticateAdmin, async (req, res) => {
  try {
    await prepareFoodFeed();
    const [posts] = await db.promise().query(
      `SELECT p.id, p.user_id, p.meal_name, p.caption, p.image, p.created_at, p.expires_at,
              u.username,
              COUNT(DISTINCT c.id) AS comment_count,
              COUNT(DISTINCT r.id) AS reaction_count
       FROM food_feed_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN food_feed_comments c ON c.post_id = p.id
       LEFT JOIN food_feed_reactions r ON r.post_id = p.id
       WHERE p.expires_at > NOW()
       GROUP BY p.id, p.user_id, p.meal_name, p.caption, p.image, p.created_at, p.expires_at, u.username
       ORDER BY p.created_at DESC
       LIMIT 100`
    );

    return res.json({
      posts: posts.map((post) => ({
        ...post,
        image_url: imageUrl(req, post.image),
        comment_count: Number(post.comment_count),
        reaction_count: Number(post.reaction_count)
      }))
    });
  } catch (err) {
    console.error('Admin food feed fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/food-feed/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    await prepareFoodFeed();
    const [result] = await db.promise().query('DELETE FROM food_feed_posts WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Food post not found' });

    await db.promise().query('DELETE FROM food_feed_comments WHERE post_id = ?', [req.params.id]);
    return res.json({ message: 'Food post removed. Reactions stay in user history.' });
  } catch (err) {
    console.error('Admin food feed remove error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
