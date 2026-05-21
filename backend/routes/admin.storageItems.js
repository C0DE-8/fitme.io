const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('./upload');
const { authenticateAdmin } = require('../middleware');

let imageColumnReady = false;

async function ensureImageColumn() {
  if (imageColumnReady) return;

  try {
    await db.promise().query('ALTER TABLE storage_items ADD COLUMN image VARCHAR(255) NULL');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }

  imageColumnReady = true;
}

function withImageUrl(req, item) {
  return {
    ...item,
    image_url: item.image ? `${req.protocol}://${req.get('host')}/uploads/${item.image}` : null
  };
}

// Add new storage item to the global list (admin only)
router.post('/storage-items/add', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Item name is required' });
  }

  try {
    await ensureImageColumn();

    // Check if item already exists
    const [existing] = await db.promise().query(
      'SELECT * FROM storage_items WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: `Item "${name}" already exists.` });
    }

    // Insert new item
    const imageFilename = req.file ? req.file.filename : null;
    const [result] = await db.promise().query(
      'INSERT INTO storage_items (name, image) VALUES (?, ?)',
      [name, imageFilename]
    );

    res.status(201).json({
      message: `Item "${name}" added to storage items.`,
      item: withImageUrl(req, { id: result.insertId, name, image: imageFilename })
    });
  } catch (error) {
    console.error('Error adding storage item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get all storage items (optional: for display in frontend dropdowns)
router.get('/storage-items', authenticateAdmin, async (req, res) => {
  try {
    await ensureImageColumn();
    const [items] = await db.promise().query('SELECT * FROM storage_items ORDER BY name ASC');
    res.json({ storage_items: items.map((item) => withImageUrl(req, item)) });
  } catch (error) {
    console.error('Error fetching storage items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// UPDATE storage item name (admin only)
router.put('/storage-items/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'New item name is required' });
  }

  try {
    await ensureImageColumn();

    const params = [name];
    let query = 'UPDATE storage_items SET name = ?';

    if (req.file) {
      query += ', image = ?';
      params.push(req.file.filename);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.promise().query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating storage item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// DELETE storage item (admin only)
router.delete('/storage-items/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM storage_items WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found or already deleted' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting storage item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
