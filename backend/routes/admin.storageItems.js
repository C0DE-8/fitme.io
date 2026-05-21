const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');

// Add new storage item to the global list (admin only)
router.post('/storage-items/add', authenticateAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Item name is required' });
  }

  try {
    // Check if item already exists
    const [existing] = await db.promise().query(
      'SELECT * FROM storage_items WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: `Item "${name}" already exists.` });
    }

    // Insert new item
    await db.promise().query(
      'INSERT INTO storage_items (name) VALUES (?)',
      [name]
    );

    res.status(201).json({ message: `Item "${name}" added to storage items.` });
  } catch (error) {
    console.error('Error adding storage item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get all storage items (optional: for display in frontend dropdowns)
router.get('/storage-items', authenticateAdmin, async (req, res) => {
  try {
    const [items] = await db.promise().query('SELECT * FROM storage_items');
    res.json({ storage_items: items });
  } catch (error) {
    console.error('Error fetching storage items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// UPDATE storage item name (admin only)
router.put('/storage-items/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'New item name is required' });
  }

  try {
    const [result] = await db.promise().query(
      'UPDATE storage_items SET name = ? WHERE id = ?',
      [name, id]
    );

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
