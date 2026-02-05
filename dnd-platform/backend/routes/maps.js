const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Получить карты кампании
router.get('/campaign/:campaignId', auth, async (req, res) => {
  try {
    const maps = await pool.query(
      'SELECT * FROM maps WHERE campaign_id = $1 ORDER BY created_at DESC',
      [req.params.campaignId]
    );
    res.json(maps.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать карту
router.post('/', auth, async (req, res) => {
  try {
    const { name, width, height, tiles, objects, campaign_id } = req.body;

    const newMap = await pool.query(
      `INSERT INTO maps (name, width, height, tiles, objects, campaign_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, width || 20, height || 20, tiles || [], objects || [], campaign_id]
    );

    res.status(201).json(newMap.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить карту
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, tiles, objects } = req.body;

    const updatedMap = await pool.query(
      `UPDATE maps 
       SET name = COALESCE($1, name), 
           tiles = COALESCE($2, tiles), 
           objects = COALESCE($3, objects)
       WHERE id = $4
       RETURNING *`,
      [name, tiles, objects, req.params.id]
    );

    if (updatedMap.rows.length === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }

    res.json(updatedMap.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удалить карту
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM maps WHERE id = $1', [req.params.id]);
    res.json({ message: 'Map deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;