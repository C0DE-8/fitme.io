const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const { authenticateUser, requireSubscription } = require('../middleware');

const genShareId = () => crypto.randomBytes(16).toString('hex');

function withImageUrl(req, item) {
  return {
    ...item,
    image_url: item.image ? `${req.protocol}://${req.get('host')}/uploads/${item.image}` : null
  };
}

function foodImageUrl(req, image) {
  return image ? `${req.protocol}://${req.get('host')}/uploads/${image}` : null;
}

function parseFoodIngredients(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, cost] = part.split('-');
      return { name: String(name || '').trim().toLowerCase(), cost: Number(cost || 0) };
    })
    .filter((item) => item.name && Number.isFinite(item.cost));
}

async function getEnabledShare(shareId) {
  const [rows] = await db.promise().query(
    `SELECT ss.user_id, ss.is_enabled, u.username
     FROM storage_shares ss
     JOIN users u ON ss.user_id = u.id
     WHERE ss.share_id = ? LIMIT 1`,
    [shareId]
  );

  if (!rows.length) return { error: { status: 404, message: 'Share link not found' } };
  if (!rows[0].is_enabled) return { error: { status: 403, message: 'This share link is disabled' } };

  return { share: rows[0] };
}

async function ensureFriendSuggestionsTable() {
  await db.promise().query(`
    CREATE TABLE IF NOT EXISTS storage_friend_suggestions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_user_id INT NOT NULL,
      share_id VARCHAR(64) NOT NULL,
      food_id INT NOT NULL,
      food_type VARCHAR(50) NOT NULL,
      food_name VARCHAR(255) NOT NULL,
      suggested_by_name VARCHAR(255) NOT NULL,
      note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_owner_user_id (owner_user_id),
      INDEX idx_share_id (share_id),
      INDEX idx_food_id (food_id)
    )
  `);
}

function cleanSuggestionName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  return name || 'A friend';
}

function cleanSuggestionNote(value) {
  const note = String(value || '').trim().slice(0, 500);
  return note || null;
}

// Get all storage items (optional: for display in frontend dropdowns)
router.get('/storage-items', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    let items;
    try {
      [items] = await db.promise().query('SELECT * FROM storage_items');
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      [items] = await db.promise().query('SELECT id, name FROM storage_items');
    }
    res.json({ storage_items: items.map((item) => withImageUrl(req, item)) });
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
    let items;
    try {
      [items] = await db.promise().query(
        `SELECT us.id, us.item_name, si.image
         FROM user_storage us
         LEFT JOIN storage_items si ON LOWER(si.name) = LOWER(us.item_name)
         WHERE us.user_id = ?`,
        [userId]
      );
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      [items] = await db.promise().query(
        'SELECT id, item_name FROM user_storage WHERE user_id = ?',
        [userId]
      );
    }

    res.json({ storage: items.map((item) => withImageUrl(req, item)) }); // items will be array of { id, item_name }
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

    const share_url = `${req.protocol}://${req.get('host')}/shared-storage.html?id=${share_id}`;
    return res.json({ share_id, share_url });
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
    const { share, error } = await getEnabledShare(shareId);
    if (error) return res.status(error.status).json({ message: error.message });

    const { user_id, username } = share;

    // Get storage items
    let items;
    try {
      [items] = await db.promise().query(
        `SELECT us.id, us.item_name, si.image
         FROM user_storage us
         LEFT JOIN storage_items si ON LOWER(si.name) = LOWER(us.item_name)
         WHERE us.user_id = ?
         ORDER BY us.id DESC`,
        [user_id]
      );
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      [items] = await db.promise().query(
        'SELECT id, item_name FROM user_storage WHERE user_id = ? ORDER BY id DESC',
        [user_id]
      );
    }

    return res.json({
      username,
      storage: items.map((item) => withImageUrl(req, item))
    });
  } catch (err) {
    console.error('Public share fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /storage/shared/:shareId/suggestions?type=rice  (public read-only)
router.get('/storage/shared/:shareId/suggestions', async (req, res) => {
  const { shareId } = req.params;
  const requestedType = String(req.query.type || '').toLowerCase();
  const allowedTypes = ['rice', 'swallow', 'junks'];

  if (requestedType && !allowedTypes.includes(requestedType)) {
    return res.status(400).json({ message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
  }

  try {
    const { share, error } = await getEnabledShare(shareId);
    if (error) return res.status(error.status).json({ message: error.message });

    const [storageRows] = await db.promise().query(
      'SELECT item_name FROM user_storage WHERE user_id = ?',
      [share.user_id]
    );
    const storageSet = new Set(storageRows.map((item) => String(item.item_name || '').toLowerCase().trim()));

    const params = [];
    let foodQuery = 'SELECT id, name, package, ingredients, estimated_cost, image, type, prepared, created_at FROM foods';
    if (requestedType) {
      foodQuery += ' WHERE type = ?';
      params.push(requestedType);
    }
    foodQuery += ' ORDER BY type ASC, estimated_cost ASC, created_at DESC';

    const [foods] = await db.promise().query(foodQuery, params);

    const suggestions = foods
      .map((food) => {
        const ingredients = parseFoodIngredients(food.ingredients);
        const missingIngredients = ingredients.filter((item) => !storageSet.has(item.name));
        const availableIngredients = ingredients.filter((item) => storageSet.has(item.name));
        const totalMissingCost = missingIngredients.reduce((sum, item) => sum + item.cost, 0);

        return {
          id: food.id,
          name: food.name,
          package: food.package,
          type: food.type,
          prepared: food.prepared,
          estimated_cost: food.estimated_cost,
          image: food.image,
          image_url: foodImageUrl(req, food.image),
          ingredients,
          availableIngredients,
          missingIngredients,
          totalMissingCost,
          canCook: missingIngredients.length === 0,
          created_at: food.created_at
        };
      })
      .sort((a, b) => {
        if (a.canCook !== b.canCook) return a.canCook ? -1 : 1;
        return a.totalMissingCost - b.totalMissingCost;
      });

    return res.json({
      username: share.username,
      type: requestedType || 'all',
      totalFoods: suggestions.length,
      suggestions
    });
  } catch (err) {
    console.error('Shared suggestion fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /storage/shared/:shareId/suggestions/:foodId  (public friend pick)
router.post('/storage/shared/:shareId/suggestions/:foodId', async (req, res) => {
  const { shareId, foodId } = req.params;
  const suggestedBy = cleanSuggestionName(req.body?.suggested_by_name);
  const note = cleanSuggestionNote(req.body?.note);

  try {
    const { share, error } = await getEnabledShare(shareId);
    if (error) return res.status(error.status).json({ message: error.message });

    const [foods] = await db.promise().query(
      'SELECT id, name, type, image, estimated_cost FROM foods WHERE id = ? LIMIT 1',
      [foodId]
    );

    if (!foods.length) {
      return res.status(404).json({ message: 'Food not found' });
    }

    await ensureFriendSuggestionsTable();

    const food = foods[0];
    const [result] = await db.promise().query(
      `INSERT INTO storage_friend_suggestions
       (owner_user_id, share_id, food_id, food_type, food_name, suggested_by_name, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [share.user_id, shareId, food.id, food.type, food.name, suggestedBy, note]
    );

    return res.status(201).json({
      suggestion: {
        id: result.insertId,
        owner_user_id: share.user_id,
        share_id: shareId,
        food_id: food.id,
        food_type: food.type,
        food_name: food.name,
        suggested_by_name: suggestedBy,
        note,
        image_url: foodImageUrl(req, food.image),
        estimated_cost: food.estimated_cost,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Shared suggestion save error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /storage/friend-suggestions  (owner view)
router.get('/storage/friend-suggestions', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await ensureFriendSuggestionsTable();

    const [rows] = await db.promise().query(
      `SELECT s.id, s.food_id, s.food_type, s.food_name, s.suggested_by_name, s.note, s.created_at,
              f.image, f.estimated_cost, f.package
       FROM storage_friend_suggestions s
       LEFT JOIN foods f ON f.id = s.food_id
       WHERE s.owner_user_id = ?
       ORDER BY s.created_at DESC, s.id DESC`,
      [req.user.id]
    );

    return res.json({
      suggestions: rows.map((row) => ({
        ...row,
        image_url: foodImageUrl(req, row.image)
      }))
    });
  } catch (err) {
    console.error('Friend suggestions fetch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /storage/friend-suggestions/:id  (owner dismiss)
router.delete('/storage/friend-suggestions/:id', authenticateUser, requireSubscription(), async (req, res) => {
  try {
    await ensureFriendSuggestionsTable();

    const [result] = await db.promise().query(
      'DELETE FROM storage_friend_suggestions WHERE id = ? AND owner_user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    return res.json({ message: 'Suggestion removed' });
  } catch (err) {
    console.error('Friend suggestion remove error:', err);
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
