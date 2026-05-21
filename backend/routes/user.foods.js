const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser, requireSubscription } = require('../middleware');
const moment = require('moment');

function makeUploadUrl(req, filename) {
  return filename ? `${req.protocol}://${req.get('host')}/uploads/${filename}` : null;
}

async function getIngredientImageMap(req) {
  try {
    const [rows] = await db.promise().query('SELECT name, image FROM storage_items');
    return new Map(
      rows.map((item) => [
        String(item.name || '').toLowerCase().trim(),
        {
          image: item.image || null,
          image_url: makeUploadUrl(req, item.image)
        }
      ])
    );
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') return new Map();
    throw error;
  }
}

function attachIngredientImages(ingredients, imageMap) {
  return ingredients.map((ingredient) => {
    const image = imageMap.get(String(ingredient.name || '').toLowerCase().trim());
    return {
      ...ingredient,
      image: image?.image || null,
      image_url: image?.image_url || null
    };
  });
}

// GET /foods/suggest/:type
router.get('/foods/suggest/:type', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const foodType = req.params.type.toLowerCase();
  const allowedTypes = ['rice', 'swallow', 'junks'];

  if (!allowedTypes.includes(foodType)) {
    return res.status(400).json({ message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
  }

  try {
    // User's storage items
    const [storageItems] = await db.promise().query(
      'SELECT item_name FROM user_storage WHERE user_id = ?',
      [userId]
    );
    const storageSet = new Set(storageItems.map(item => item.item_name.toLowerCase()));
    const ingredientImageMap = await getIngredientImageMap(req);

    // Get all foods of this type (with prepared field)
    const [foods] = await db.promise().query(
      `SELECT id, name, package, ingredients, estimated_cost, image, type, prepared, created_at 
       FROM foods 
       WHERE type = ?`,
      [foodType]
    );

    // Messages for this food type
    const [messages] = await db.promise().query(
      'SELECT situation, message FROM message_bot_messages WHERE food_type = ?',
      [foodType]
    );
    const messageMap = {};
    for (const m of messages) messageMap[m.situation] = m.message;

    function parseIngredients(ingredientsStr) {
      return ingredientsStr.split(',').map(item => {
        const [name, cost] = item.trim().split('-');
        return { name: name.toLowerCase(), cost: Number(cost) };
      });
    }

    // Build full list with missing ingredients & cost
    const suggestions = foods.map(food => {
      const ingredients = food.ingredients ? attachIngredientImages(parseIngredients(food.ingredients), ingredientImageMap) : [];
      const missing = ingredients.filter(i => !storageSet.has(i.name));
      const missingCost = missing.reduce((sum, i) => sum + i.cost, 0);

      return {
        id: food.id,
        name: food.name,
        package: food.package,
        type: food.type,
        prepared: food.prepared,
        estimated_cost: food.estimated_cost,
        image: food.image,
        image_url: makeUploadUrl(req, food.image),
        created_at: food.created_at ? moment(food.created_at).format('YYYY-MM-DD HH:mm') : null,
        ingredients,
        missingIngredients: missing,
        totalMissingCost: missingCost,
        message:
          missingCost === 0
            ? messageMap['perfect'] || 'You have all ingredients to prepare this food.'
            : messageMap['missing'] || 'You are missing some ingredients to prepare this food.'
      };
    });

    if (suggestions.length === 0) {
      return res.json({ message: `No ${foodType} foods found.` });
    }

    // Sort cheapest missing cost first
    suggestions.sort((a, b) => a.totalMissingCost - b.totalMissingCost);

    res.json({
      type: foodType,
      totalFoods: suggestions.length,
      foods: suggestions
    });
  } catch (error) {
    console.error('Error suggesting foods:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /foods/suggest/:type/:id  → type then id
router.get('/foods/suggest/:type/:id', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id;
  const foodType = String(req.params.type || '').toLowerCase();
  const foodId = req.params.id;
  const allowedTypes = ['rice', 'swallow', 'junks'];

  if (!allowedTypes.includes(foodType)) {
    return res.status(400).json({ message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
  }

  try {
    // User storage items
    const [storageItems] = await db.promise().query(
      'SELECT item_name FROM user_storage WHERE user_id = ?',
      [userId]
    );
    const storageSet = new Set(storageItems.map(i => i.item_name.toLowerCase()));
    const ingredientImageMap = await getIngredientImageMap(req);

    // Fetch the food by id, but ensure the type matches
    const [rows] = await db.promise().query(
      `SELECT id, name, package, ingredients, estimated_cost, image, type, prepared, created_at
       FROM foods
       WHERE id = ? AND type = ?`,
      [foodId, foodType]
    );
    if (!rows.length) {
      return res.status(404).json({ message: `Food not found for type "${foodType}".` });
    }
    const food = rows[0];

    // Optional: fetch type-specific messages
    const [messages] = await db.promise().query(
      'SELECT situation, message FROM message_bot_messages WHERE food_type = ?',
      [foodType]
    );
    const messageMap = {};
    for (const m of messages) messageMap[m.situation] = m.message;

    // Parse ingredients "name-cost, name-cost"
    const parseIngredients = (s) =>
      (s || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(pair => {
          const [name, cost] = pair.split('-');
          return { name: (name || '').toLowerCase().trim(), cost: Number(cost) };
        })
        .filter(x => x.name && !Number.isNaN(x.cost));

    const ingredients = attachIngredientImages(parseIngredients(food.ingredients), ingredientImageMap);
    const missing = ingredients.filter(i => !storageSet.has(i.name));
    const missingCost = missing.reduce((sum, i) => sum + i.cost, 0);

    res.json({
      id: food.id,
      type: food.type, // echoes the type path param
      name: food.name,
      package: food.package,
      prepared: food.prepared,
      estimated_cost: food.estimated_cost,
      image: food.image,
      image_url: makeUploadUrl(req, food.image),
      created_at: food.created_at ? moment(food.created_at).format('YYYY-MM-DD HH:mm') : null,
      ingredients,
      missingIngredients: missing,
      totalMissingCost: missingCost,
      message: missingCost === 0
        ? (messageMap['perfect'] || 'You have all ingredients to prepare this food.')
        : (messageMap['missing'] || 'You are missing some ingredients to prepare this food.')
    });
  } catch (error) {
    console.error('Error fetching suggested food by type/id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /foods/suggest-budget/:type
router.post('/foods/suggest-budget/:type', authenticateUser, requireSubscription(), async (req, res) => {
  const userId = req.user.id; // not used now, but kept for parity if you later factor in storage
  const foodType = String(req.params.type || '').toLowerCase();
  const { budget } = req.body;

  const allowedTypes = ['rice', 'swallow', 'junks'];
  if (!allowedTypes.includes(foodType)) {
    return res.status(400).json({ message: `Invalid type. Allowed types: ${allowedTypes.join(', ')}` });
  }

  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0) {
    return res.status(400).json({ message: 'Budget must be a positive number' });
  }

  try {
    // Pull ALL foods within budget, highest price first
    const [foods] = await db.promise().query(
      `SELECT id, name, package, ingredients, estimated_cost, image, type, prepared, created_at
       FROM foods
       WHERE type = ? AND estimated_cost <= ?
       ORDER BY estimated_cost DESC, created_at DESC`,
      [foodType, budget]
    );

    if (!foods.length) {
      return res.json({
        type: foodType,
        budget,
        tiers: [],
        message: 'No foods found within your budget.'
      });
    }

    // Group into price tiers by exact estimated_cost (e.g., 1000, 700, 500...)
    const tiersMap = new Map();
    for (const f of foods) {
      const price = Number(f.estimated_cost);
      if (!tiersMap.has(price)) tiersMap.set(price, []);
      tiersMap.get(price).push({
        id: f.id,
        name: f.name,
        package: f.package,
        type: f.type,
        prepared: f.prepared,
        estimated_cost: price,
        image: f.image,
        image_url: f.image ? `${req.protocol}://${req.get('host')}/uploads/${f.image}` : null,
        created_at: f.created_at ? moment(f.created_at).format('YYYY-MM-DD HH:mm') : null
      });
    }

    // Build sorted tiers array (highest tier first)
    const tiers = Array.from(tiersMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([price, items]) => ({
        price,             // the tier price (e.g., 1000, 700, 500)
        count: items.length,
        foods: items
      }));

    // Optional: include a quick “top pick” = highest-priced within budget
    const topPick = tiers[0]?.foods[0] || null;

    // Optional: contextual messages by budget usage (kept simple)
    const amountUsed = topPick ? topPick.estimated_cost : 0;
    const amountSaved = Math.max(0, budget - amountUsed);
    const message =
      amountSaved === 0
        ? 'Here are foods that fully use your budget.'
        : 'Here are foods within your budget (you may save some).';

    return res.json({
      type: foodType,
      budget,
      topPick,
      amountUsed,
      amountSaved,
      tiers
    });

  } catch (error) {
    console.error('Error suggesting foods by budget tiers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
