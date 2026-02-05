const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Получить все заклинания с фильтрацией
router.get('/', async (req, res) => {
  try {
    const { level, class: spellClass, search } = req.query;
    let query = 'SELECT * FROM spells WHERE 1=1';
    const params = [];

    if (level) {
      params.push(level);
      query += ` AND level = $${params.length}`;
    }

    if (spellClass) {
      params.push(`%${spellClass}%`);
      query += ` AND classes::text LIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY level, name';

    const spells = await pool.query(query, params);
    res.json(spells.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить заклинание по ID
router.get('/:id', async (req, res) => {
  try {
    const spell = await pool.query(
      'SELECT * FROM spells WHERE id = $1',
      [req.params.id]
    );

    if (spell.rows.length === 0) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    res.json(spell.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;