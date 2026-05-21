const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('./upload');
const { authenticateUser, requireSubscription } = require('../middleware');

const allowedReactions = new Set(['like', 'love', 'fire']);

function imageUrl(req, image) {
  return image ? `${req.protocol}://${req.get('host')}/uploads/${image}` : null;
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

async function ensureFoodFeedTables() {
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS food_feed_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      meal_name VARCHAR(140) NULL,
      caption TEXT NULL,
      image VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      INDEX idx_feed_expires (expires_at),
      INDEX idx_feed_user_created (user_id, created_at)
    )
  `);

  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS food_feed_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      body VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_feed_comment_post (post_id, created_at),
      INDEX idx_feed_comment_user (user_id)
    )
  `);

  // Reactions do not use a post foreign key so user reaction history remains after a post expires.
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS food_feed_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      post_author_user_id INT NOT NULL,
      reactor_user_id INT NOT NULL,
      reaction_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_feed_post_reactor (post_id, reactor_user_id),
      INDEX idx_feed_reactor (reactor_user_id, created_at),
      INDEX idx_feed_author (post_author_user_id, created_at)
    )
  `);

  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS food_feed_follows (
      follower_user_id INT NOT NULL,
      following_user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_user_id, following_user_id),
      INDEX idx_feed_following (following_user_id)
    )
  `);
}

async function purgeExpiredFoodPosts() {
  const [expiredRows] = await db.promise().query(
    'SELECT id FROM food_feed_posts WHERE expires_at <= NOW()'
  );

  if (!expiredRows.length) return;

  const ids = expiredRows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');
  await db.promise().query(`DELETE FROM food_feed_comments WHERE post_id IN (${placeholders})`, ids);
  await db.promise().query(`DELETE FROM food_feed_posts WHERE id IN (${placeholders})`, ids);
}

async function prepareFoodFeed() {
  await ensureFoodFeedTables();
  await purgeExpiredFoodPosts();
}

function groupRows(rows, key) {
  return rows.reduce((groups, row) => {
    const value = row[key];
    groups[value] = groups[value] || [];
    groups[value].push(row);
    return groups;
  }, {});
}

async function fetchPosts(req, scope = 'all') {
  const params = [req.user.id];
  let scopeSql = '';

  if (scope === 'following') {
    scopeSql = `
      AND (
        p.user_id = ?
        OR EXISTS (
          SELECT 1
          FROM food_feed_follows ff
          WHERE ff.follower_user_id = ?
            AND ff.following_user_id = p.user_id
        )
      )`;
    params.push(req.user.id, req.user.id);
  }

  const [posts] = await db.promise().query(
    `SELECT p.id, p.user_id, p.meal_name, p.caption, p.image, p.created_at, p.expires_at,
            u.username, u.bio,
            EXISTS (
              SELECT 1
              FROM food_feed_follows mine
              WHERE mine.follower_user_id = ?
                AND mine.following_user_id = p.user_id
            ) AS is_following
     FROM food_feed_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.expires_at > NOW()
     ${scopeSql}
     ORDER BY p.created_at DESC
     LIMIT 60`,
    params
  );

  if (!posts.length) return [];

  const ids = posts.map((post) => post.id);
  const placeholders = ids.map(() => '?').join(', ');
  const [commentRows] = await db.promise().query(
    `SELECT c.id, c.post_id, c.user_id, c.body, c.created_at, u.username
     FROM food_feed_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id IN (${placeholders})
     ORDER BY c.created_at ASC`,
    ids
  );
  const [reactionRows] = await db.promise().query(
    `SELECT post_id, reaction_type, COUNT(*) AS total
     FROM food_feed_reactions
     WHERE post_id IN (${placeholders})
     GROUP BY post_id, reaction_type`,
    ids
  );
  const [myReactionRows] = await db.promise().query(
    `SELECT post_id, reaction_type
     FROM food_feed_reactions
     WHERE reactor_user_id = ?
       AND post_id IN (${placeholders})`,
    [req.user.id, ...ids]
  );

  const commentsByPost = groupRows(commentRows, 'post_id');
  const reactionsByPost = groupRows(reactionRows, 'post_id');
  const myReactions = new Map(myReactionRows.map((row) => [row.post_id, row.reaction_type]));

  return posts.map((post) => ({
    ...post,
    image_url: imageUrl(req, post.image),
    is_owner: post.user_id === req.user.id,
    is_following: Boolean(post.is_following),
    my_reaction: myReactions.get(post.id) || null,
    reactions: Object.fromEntries(
      (reactionsByPost[post.id] || []).map((reaction) => [reaction.reaction_type, Number(reaction.total)])
    ),
    comments: (commentsByPost[post.id] || []).map((comment) => ({
      ...comment,
      is_owner: comment.user_id === req.user.id
    }))
  }));
}

router.get('/food-feed', authenticateUser, requireSubscription(), async (req, res) => {
  const scope = String(req.query.scope || 'all').toLowerCase();
  if (!['all', 'following'].includes(scope)) {
    return res.status(400).json({ message: 'Invalid feed scope' });
  }

  try {
    await prepareFoodFeed();
    return res.json({ posts: await fetchPosts(req, scope), scope });
  } catch (err) {
    console.error('Food feed fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/food-feed/posts', authenticateUser, requireSubscription(), upload.single('image'), async (req, res) => {
  const mealName = cleanText(req.body?.meal_name, 140) || null;
  const caption = cleanText(req.body?.caption, 1200) || null;
  const image = req.file?.filename || null;

  if (!mealName && !caption && !image) {
    return res.status(400).json({ message: 'Add a meal name, a note, or a food image before posting.' });
  }

  try {
    await prepareFoodFeed();
    const [result] = await db.promise().query(
      `INSERT INTO food_feed_posts (user_id, meal_name, caption, image, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [req.user.id, mealName, caption, image]
    );

    const posts = await fetchPosts(req);
    return res.status(201).json({
      message: 'Food post shared for 24 hours.',
      post: posts.find((post) => post.id === result.insertId) || null
    });
  } catch (err) {
    console.error('Food feed create error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/food-feed/posts/:id', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await prepareFoodFeed();
    const [result] = await db.promise().query(
      'DELETE FROM food_feed_posts WHERE id = ? AND user_id = ? AND expires_at > NOW()',
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    await db.promise().query('DELETE FROM food_feed_comments WHERE post_id = ?', [req.params.id]);
    return res.json({ message: 'Food post removed. Reactions stay in user history.' });
  } catch (err) {
    console.error('Food feed delete error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/food-feed/posts/:id/reaction', authenticateUser, requireSubscription(), async (req, res) => {
  const reactionType = cleanText(req.body?.reaction_type, 20).toLowerCase();
  if (!allowedReactions.has(reactionType)) {
    return res.status(400).json({ message: 'Invalid reaction type' });
  }

  try {
    await prepareFoodFeed();
    const [posts] = await db.promise().query(
      'SELECT id, user_id FROM food_feed_posts WHERE id = ? AND expires_at > NOW() LIMIT 1',
      [req.params.id]
    );
    if (!posts.length) return res.status(404).json({ message: 'Food post not found' });

    await db.promise().query(
      `INSERT INTO food_feed_reactions (post_id, post_author_user_id, reactor_user_id, reaction_type)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type)`,
      [posts[0].id, posts[0].user_id, req.user.id, reactionType]
    );

    return res.json({ message: 'Reaction saved', reaction_type: reactionType });
  } catch (err) {
    console.error('Food feed reaction error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/food-feed/posts/:id/reaction', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await prepareFoodFeed();
    await db.promise().query(
      'DELETE FROM food_feed_reactions WHERE post_id = ? AND reactor_user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Reaction removed' });
  } catch (err) {
    console.error('Food feed reaction remove error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/food-feed/posts/:id/comments', authenticateUser, requireSubscription(), async (req, res) => {
  const body = cleanText(req.body?.body, 500);
  if (!body) {
    return res.status(400).json({ message: 'Comment is required' });
  }

  try {
    await prepareFoodFeed();
    const [posts] = await db.promise().query(
      'SELECT id FROM food_feed_posts WHERE id = ? AND expires_at > NOW() LIMIT 1',
      [req.params.id]
    );
    if (!posts.length) return res.status(404).json({ message: 'Food post not found' });

    const [result] = await db.promise().query(
      'INSERT INTO food_feed_comments (post_id, user_id, body) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, body]
    );
    return res.status(201).json({
      comment: {
        id: result.insertId,
        post_id: Number(req.params.id),
        user_id: req.user.id,
        username: req.user.username,
        body,
        is_owner: true,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Food feed comment error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/food-feed/comments/:id', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await prepareFoodFeed();
    const [result] = await db.promise().query(
      'DELETE FROM food_feed_comments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    return res.json({ message: 'Comment removed' });
  } catch (err) {
    console.error('Food feed comment remove error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/food-feed/users/:id/follow', authenticateUser, requireSubscription(), async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId) || targetId <= 0 || targetId === req.user.id) {
    return res.status(400).json({ message: 'Choose another user to follow' });
  }

  try {
    await prepareFoodFeed();
    const [users] = await db.promise().query('SELECT id, username FROM users WHERE id = ? LIMIT 1', [targetId]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });

    await db.promise().query(
      `INSERT INTO food_feed_follows (follower_user_id, following_user_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE following_user_id = VALUES(following_user_id)`,
      [req.user.id, targetId]
    );

    return res.json({ message: `Following ${users[0].username}`, following: true });
  } catch (err) {
    console.error('Food feed follow error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/food-feed/users/:id/follow', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await prepareFoodFeed();
    await db.promise().query(
      'DELETE FROM food_feed_follows WHERE follower_user_id = ? AND following_user_id = ?',
      [req.user.id, req.params.id]
    );
    return res.json({ message: 'User unfollowed', following: false });
  } catch (err) {
    console.error('Food feed unfollow error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.ensureFoodFeedTables = ensureFoodFeedTables;
module.exports.purgeExpiredFoodPosts = purgeExpiredFoodPosts;
