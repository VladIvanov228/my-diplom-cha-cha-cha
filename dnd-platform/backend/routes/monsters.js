const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Получить всех монстров с фильтрацией
router.get('/', async (req, res) => {
  try {
    const { cr_min, cr_max, type, search } = req.query;
    let query = 'SELECT id, name, size, type, alignment, armor_class, hit_points, challenge_rating FROM monsters WHERE 1=1';
    const params = [];

    if (cr_min) {
      params.push(cr_min);
      query += ` AND challenge_rating >= $${params.length}`;
    }

    if (cr_max) {
      params.push(cr_max);
      query += ` AND challenge_rating <= $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY challenge_rating, name';

    const monsters = await pool.query(query, params);
    res.json(monsters.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить монстра по ID
router.get('/:id', async (req, res) => {
  try {
    const monster = await pool.query(
      'SELECT * FROM monsters WHERE id = $1',
      [req.params.id]
    );

    if (monster.rows.length === 0) {
      return res.status(404).json({ error: 'Monster not found' });
    }

    res.json(monster.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;