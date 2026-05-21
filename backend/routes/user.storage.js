const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const { authenticateUser, requireSubscription } = require('../middleware');

const genShareId = () => crypto.randomBytes(16).toString('hex');

// Get all storage items (optional: for display in frontend dropdowns)
router.get('/storage-items', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    const [items] = await db.promise().query('SELECT * FROM storage_items');
    res.json({ storage_items: items });
  } catch (error) {
    console.error('Error fetching storage items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Add an item to user's storage
router.post('/storage/add', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const { item_name } = req.body;

  if (!item_name) {
    return res.status(400).json({ message: 'Item name is required' });
  }

  try {
    // Check if item is allowed (exists in storage_items)
    const [allowedItems] = await db.promise().query(
      'SELECT name FROM storage_items WHERE name = ?',
      [item_name]
    );
    if (allowedItems.length === 0) {
      return res.status(400).json({ message: `Item "${item_name}" is not allowed.` });
    }

    // Check if user already has this item
    const [existing] = await db.promise().query(
      'SELECT * FROM user_storage WHERE user_id = ? AND item_name = ?',
      [userId, item_name]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: `You already have ${item_name} in your storage.` });
    }

    // Insert item for user
    await db.promise().query(
      'INSERT INTO user_storage (user_id, item_name) VALUES (?, ?)',
      [userId, item_name]
    );

    res.json({ message: `${item_name} added to your storage.` });
  } catch (error) {
    console.error('Error adding item to storage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get list of items user has (with ID)
router.get('/storage', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;

  try {
    const [items] = await db.promise().query(
      'SELECT id, item_name FROM user_storage WHERE user_id = ?',
      [userId]
    );

    res.json({ storage: items }); // items will be array of { id, item_name }
  } catch (error) {
    console.error('Error fetching user storage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Optional: Remove an item from user's storage by item ID
router.delete('/storage/remove/:id', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  try {
    const [existing] = await db.promise().query(
      'SELECT * FROM user_storage WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: `Item with ID ${itemId} not found in your storage.` });
    }

    await db.promise().query(
      'DELETE FROM user_storage WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    res.json({ message: `Item with ID ${itemId} removed from your storage.` });
  } catch (error) {
    console.error('Error removing item from storage by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Remove all items from user's storage
router.delete('/storage/remove-all', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if the user has items in storage
    const [existing] = await db.promise().query(
      'SELECT * FROM user_storage WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'No items found in your storage to remove.' });
    }

    // Delete all items belonging to the user
    await db.promise().query(
      'DELETE FROM user_storage WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'All items removed from your storage successfully.' });
  } catch (error) {
    console.error('Error removing all items from storage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /storage/share  -> enable sharing and return URL (creates if missing)
router.post('/storage/share', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // try to fetch existing
    const [rows] = await db.promise().query(
      'SELECT share_id, is_enabled FROM storage_shares WHERE user_id = ? LIMIT 1',
      [userId]
    );

    let share_id = rows[0]?.share_id || genShareId();

    // upsert: ensure a single row per user, enable = 1
    await db.promise().query(
      `INSERT INTO storage_shares (user_id, share_id, is_enabled)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE share_id = VALUES(share_id), is_enabled = 1`,
      [userId, share_id]
    );

    const share_url = `${req.protocol}://${req.get('host')}/api/user/storage/shared/${share_id}`;
    return res.json({ share_url });
  } catch (err) {
    console.error('Enable share error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// DELETE /storage/share  -> disable sharing (keeps the share_id but off)
router.delete('/storage/share', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(
      'SELECT share_id FROM storage_shares WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      // nothing to disable; stay idempotent
      return res.json({ message: 'Sharing disabled' });
    }

    await db.promise().query(
      'UPDATE storage_shares SET is_enabled = 0 WHERE user_id = ?',
      [userId]
    );

    return res.json({ message: 'Sharing disabled' });
  } catch (err) {
    console.error('Disable share error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// GET /storage/shared/:shareId  (public read-only)
router.get('/storage/shared/:shareId', async (req, res) => {
  const { shareId } = req.params;

  try {
    // Get share record + username
    const [rows] = await db.promise().query(
      `SELECT ss.user_id, ss.is_enabled, u.username
       FROM storage_shares ss
       JOIN users u ON ss.user_id = u.id
       WHERE ss.share_id = ? LIMIT 1`,
      [shareId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    const { user_id, is_enabled, username } = rows[0];
    if (!is_enabled) {
      return res.status(403).json({ message: 'This share link is disabled' });
    }

    // Get storage items
    const [items] = await db.promise().query(
      'SELECT id, item_name FROM user_storage WHERE user_id = ? ORDER BY id DESC',
      [user_id]
    );

    return res.json({
      username,
      storage: items
    });
  } catch (err) {
    console.error('Public share fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add ingredients of a food to user storage
router.post('/storage/add-food/:foodId', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const foodId = req.params.foodId;

  try {
    // 1️⃣ Get the food ingredients
    const [foods] = await db.promise().query(
      'SELECT ingredients FROM foods WHERE id = ?',
      [foodId]
    );

    if (foods.length === 0) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const ingredients = foods[0].ingredients.split(',').map(i => i.trim());

    // 2️⃣ Get current user storage
    const [existing] = await db.promise().query(
      'SELECT item_name FROM user_storage WHERE user_id = ?',
      [userId]
    );
    const existingItems = existing.map(i => i.item_name);

    const addedItems = [];
    const alreadyHad = [];

    // 3️⃣ Loop through ingredients
    for (const ingredient of ingredients) {
      // Check if ingredient exists in storage_items (FK requirement)
      const [allowed] = await db.promise().query(
        'SELECT name FROM storage_items WHERE name = ?',
        [ingredient]
      );

      if (allowed.length === 0) {
        // Skip ingredient if it's not allowed
        continue;
      }

      if (existingItems.includes(ingredient)) {
        alreadyHad.push(ingredient);
      } else {
        await db.promise().query(
          'INSERT INTO user_storage (user_id, item_name) VALUES (?, ?)',
          [userId, ingredient]
        );
        addedItems.push(ingredient);
      }
    }

    res.json({
      message: 'Ingredients processed.',
      added: addedItems,
      alreadyHad
    });
  } catch (error) {
    console.error('Error adding food ingredients to storage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
