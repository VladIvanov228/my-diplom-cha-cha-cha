const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Получить все кампании пользователя
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await pool.query(
      `SELECT c.*, u.username as dm_username 
       FROM campaigns c
       LEFT JOIN users u ON c.dm_id = u.id
       WHERE c.dm_id = $1 OR c.id IN (
         SELECT campaign_id FROM campaign_players WHERE user_id = $1
       )`,
      [req.user.userId]
    );
    res.json(campaigns.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать кампанию
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const newCampaign = await pool.query(
      'INSERT INTO campaigns (name, description, dm_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.userId]
    );

    res.status(201).json(newCampaign.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить детали кампании
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await pool.query(
      `SELECT c.*, u.username as dm_username 
       FROM campaigns c
       LEFT JOIN users u ON c.dm_id = u.id
       WHERE c.id = $1 AND (c.dm_id = $2 OR c.id IN (
         SELECT campaign_id FROM campaign_players WHERE user_id = $2
       ))`,
      [req.params.id, req.user.userId]
    );

    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Получаем игроков кампании
    const players = await pool.query(
      `SELECT u.id, u.username, u.email 
       FROM campaign_players cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.campaign_id = $1`,
      [req.params.id]
    );

    // Получаем персонажей в кампании
    const characters = await pool.query(
      `SELECT ch.*, u.username as player_name 
       FROM characters ch
       JOIN users u ON ch.user_id = u.id
       WHERE ch.campaign_id = $1`,
      [req.params.id]
    );

    res.json({
      ...campaign.rows[0],
      players: players.rows,
      characters: characters.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Пригласить игрока в кампанию
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { email } = req.body;

    // Находим пользователя по email
    const user = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, что приглашающий - DM
    const campaign = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1 AND dm_id = $2',
      [req.params.id, req.user.userId]
    );

    if (campaign.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Добавляем игрока в кампанию
    await pool.query(
      'INSERT INTO campaign_players (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user.rows[0].id]
    );

    res.json({ message: 'Player invited successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;