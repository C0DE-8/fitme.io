const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('./upload');
const { authenticateAdmin } = require('../middleware');

// POST /foods - Create new food item
router.post('/foods', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, package: packageName, ingredients, type, prepared } = req.body; // ✅ added prepared

    // Check required fields
    if (!name || !packageName || !ingredients || !type || !prepared) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, package, ingredients, type, prepared' 
      });
    }

    const allowedTypes = ['rice', 'swallow', 'junks'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
    }

    // Parse and validate ingredients
    let ingredientsArray;
    try {
      ingredientsArray = JSON.parse(ingredients);
      if (!Array.isArray(ingredientsArray) || ingredientsArray.length === 0) {
        return res.status(400).json({ message: 'Ingredients must be a non-empty array' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Ingredients must be a valid JSON array string' });
    }

    const ingredientsText = ingredientsArray.map(ing => {
      if (!ing.name || typeof ing.cost !== 'number') {
        throw new Error('Each ingredient must have a name and numeric cost');
      }
      return `${ing.name}-${ing.cost}`;
    }).join(', ');

    const estimated_cost = ingredientsArray.reduce((sum, ing) => sum + ing.cost, 0);
    const imageFilename = req.file ? req.file.filename : null;

    // ✅ Insert into DB including prepared
    const [result] = await db.promise().execute(
      `INSERT INTO foods (name, package, ingredients, estimated_cost, image, type, prepared)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, packageName, ingredientsText, estimated_cost, imageFilename, type, prepared]
    );

    res.status(201).json({
      message: 'Food created successfully',
      data: {
        id: result.insertId,
        name,
        package: packageName,
        ingredients: ingredientsArray,
        estimated_cost,
        image: imageFilename,
        type,
        prepared // ✅ return in response
      }
    });
  } catch (error) {
    console.error('Error creating food:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get all foods
router.get('/foods', authenticateAdmin, async (req, res) => {
  try {
    const [foods] = await db.promise().query('SELECT * FROM foods ORDER BY created_at DESC');
    res.json({ foods });
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get single food by ID
router.get('/foods/:id', authenticateAdmin, async (req, res) => {
  const foodId = req.params.id;

  try {
    const [rows] = await db.promise().query('SELECT * FROM foods WHERE id = ?', [foodId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const food = rows[0];

    // Parse ingredients stored as "name-cost, name-cost" into array [{name, cost}, ...]
    let ingredientsArray = [];
    if (food.ingredients) {
      ingredientsArray = String(food.ingredients)
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(pair => {
          const [name, costStr] = pair.split('-');
          return {
            name: name?.trim() || '',
            cost: Number(costStr)
          };
        })
        .filter(item => item.name && !Number.isNaN(item.cost));
    }

    const imageUrl = food.image
      ? `${req.protocol}://${req.get('host')}/uploads/${food.image}`
      : null;

    res.json({
      food: {
        id: food.id,
        name: food.name,
        package: food.package,
        type: food.type,
        prepared: food.prepared,                 // ✅ includes new column
        ingredients: ingredientsArray,           // ✅ parsed for frontend
        estimated_cost: food.estimated_cost,
        image: food.image,
        image_url: imageUrl,                     // ✅ full URL for convenience
        created_at: food.created_at,
        updated_at: food.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching food:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Update food item by ID
router.put('/foods/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  const foodId = req.params.id;

  try {
    const { name, package: packageName, ingredients, type, prepared } = req.body; // ✅ prepared added

    // Validate required fields
    if (!name || !packageName || !ingredients || !type || !prepared) {
      return res.status(400).json({ message: 'Missing required fields: name, package, ingredients, type, prepared' });
    }

    const allowedTypes = ['rice', 'swallow', 'junks'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
    }

    // Parse ingredients
    let ingredientsArray;
    try {
      ingredientsArray = JSON.parse(ingredients);
      if (!Array.isArray(ingredientsArray) || ingredientsArray.length === 0) {
        return res.status(400).json({ message: 'Ingredients must be a non-empty array' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Ingredients must be a valid JSON array string' });
    }

    const ingredientsText = ingredientsArray.map(ing => {
      if (!ing.name || typeof ing.cost !== 'number') {
        throw new Error('Each ingredient must have a name and numeric cost');
      }
      return `${ing.name}-${ing.cost}`;
    }).join(', ');

    const estimated_cost = ingredientsArray.reduce((sum, ing) => sum + ing.cost, 0);

    const imageFilename = req.file ? req.file.filename : null;

    // Build UPDATE
    let updateQuery = `
      UPDATE foods 
      SET name = ?, package = ?, ingredients = ?, estimated_cost = ?, type = ?, prepared = ?`;
    const params = [name, packageName, ingredientsText, estimated_cost, type, prepared];

    if (imageFilename) {
      updateQuery += `, image = ?`;
      params.push(imageFilename);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(foodId);

    const [result] = await db.promise().execute(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.json({
      message: 'Food updated successfully',
      data: {
        id: Number(foodId),
        name,
        package: packageName,
        ingredients: ingredientsArray,
        estimated_cost,
        image: imageFilename || undefined,
        type,
        prepared
      }
    });
  } catch (error) {
    console.error('Error updating food:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Delete food item by ID
router.delete('/foods/:id', authenticateAdmin, async (req, res) => {
  const foodId = req.params.id;

  try {
    const [result] = await db.promise().execute(
      `DELETE FROM foods WHERE id = ?`,
      [foodId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Error deleting food:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
