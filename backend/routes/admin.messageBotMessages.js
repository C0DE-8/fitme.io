const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const moment = require('moment');

// GET all messages or filter by food_type and/or situation
router.get('/message-bot-messages', authenticateAdmin, async (req, res) => {
  const { food_type, situation } = req.query;
  try {
    let query = 'SELECT * FROM message_bot_messages WHERE 1=1';
    const params = [];
    if (food_type) {
      query += ' AND food_type = ?';
      params.push(food_type);
    }
    if (situation) {
      query += ' AND situation = ?';
      params.push(situation);
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.promise().query(query, params);
    res.json({
      messages: rows.map(r => ({
        ...r,
        created_at: moment(r.created_at).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(r.updated_at).format('YYYY-MM-DD HH:mm:ss'),
      }))
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// POST add new message
router.post('/message-bot-messages', authenticateAdmin, async (req, res) => {
  const { food_type, situation, message } = req.body;

  const allowedTypes = ['rice', 'swallow', 'junks'];
  const allowedSituations = ['perfect', 'close', 'none'];

  if (!allowedTypes.includes(food_type)) {
    return res.status(400).json({ message: `Invalid food_type. Allowed: ${allowedTypes.join(', ')}` });
  }
  if (!allowedSituations.includes(situation)) {
    return res.status(400).json({ message: `Invalid situation. Allowed: ${allowedSituations.join(', ')}` });
  }
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message text is required' });
  }

  try {
    const [result] = await db.promise().execute(
      'INSERT INTO message_bot_messages (food_type, situation, message) VALUES (?, ?, ?)',
      [food_type, situation, message.trim()]
    );
    res.status(201).json({ message: 'Message added', id: result.insertId });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// PUT update message by ID
router.put('/message-bot-messages/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id;
  const { food_type, situation, message } = req.body;

  const allowedTypes = ['rice', 'swallow', 'junks'];
  const allowedSituations = ['perfect', 'close', 'none'];

  if (food_type && !allowedTypes.includes(food_type)) {
    return res.status(400).json({ message: `Invalid food_type. Allowed: ${allowedTypes.join(', ')}` });
  }
  if (situation && !allowedSituations.includes(situation)) {
    return res.status(400).json({ message: `Invalid situation. Allowed: ${allowedSituations.join(', ')}` });
  }
  if (message !== undefined && message.trim() === '') {
    return res.status(400).json({ message: 'Message text cannot be empty' });
  }

  try {
    // Build update query dynamically based on fields provided
    let updateQuery = 'UPDATE message_bot_messages SET ';
    const fields = [];
    const params = [];

    if (food_type) {
      fields.push('food_type = ?');
      params.push(food_type);
    }
    if (situation) {
      fields.push('situation = ?');
      params.push(situation);
    }
    if (message !== undefined) {
      fields.push('message = ?');
      params.push(message.trim());
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateQuery += fields.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await db.promise().execute(updateQuery, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message updated' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// DELETE message by ID
router.delete('/message-bot-messages/:id', authenticateAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await db.promise().execute('DELETE FROM message_bot_messages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
