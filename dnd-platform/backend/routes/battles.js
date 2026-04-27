// backend/routes/battles.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/battles/campaign/:campaignId - получить бой кампании
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM battles 
      WHERE campaign_id = $1 AND state != 'finished'
      ORDER BY created_at DESC LIMIT 1
    `, [campaignId]);
    
    if (result.rows.length === 0) {
      return res.json({ battle: null, message: 'No active battle' });
    }
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error fetching battle:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/battles/start - начать бой
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { campaignId, combatants } = req.body;
    
    if (!campaignId || !combatants || !Array.isArray(combatants)) {
      return res.status(400).json({ error: 'campaignId and combatants array required' });
    }
    
    // Проверяем, что пользователь - DM
    const dmCheck = await pool.query(
      'SELECT dm_id FROM campaigns WHERE id = $1', [campaignId]
    );
    
    if (dmCheck.rows.length === 0 || dmCheck.rows[0].dm_id !== userId) {
      return res.status(403).json({ error: 'Only DM can start battle' });
    }
    
    // Проверяем, нет ли уже активного боя
    const existing = await pool.query(
      "SELECT id FROM battles WHERE campaign_id = $1 AND state = 'active'",
      [campaignId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Battle already in progress' });
    }
    
    // Сортируем по инициативе (по убыванию)
    const sortedCombatants = [...combatants].sort(function(a, b) {
      return b.initiative - a.initiative;
    });
    
    const result = await pool.query(`
      INSERT INTO battles (campaign_id, combatants, state, current_turn, round, started_at)
      VALUES ($1, $2, 'active', 0, 1, CURRENT_TIMESTAMP)
      RETURNING *
    `, [campaignId, JSON.stringify(sortedCombatants)]);
    
    console.log('✅ Battle started:', result.rows[0].id);
    res.status(201).json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/battles/:id/next-turn - следующий ход
router.post('/:id/next-turn', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    
    const battle = await pool.query('SELECT * FROM battles WHERE id = $1', [id]);
    if (battle.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }
    
    var combatants = battle.rows[0].combatants;
    var currentTurn = battle.rows[0].current_turn;
    var round = battle.rows[0].round;
    
    // Переходим к следующему живому участнику
    var nextTurn = (currentTurn + 1) % combatants.length;
    var attempts = 0;
    
    while (!combatants[nextTurn].isAlive && attempts < combatants.length) {
      nextTurn = (nextTurn + 1) % combatants.length;
      attempts++;
    }
    
    // Если вернулись к началу - новый раунд
    if (nextTurn <= currentTurn && combatants[nextTurn].isAlive) {
      round++;
    }
    
    const result = await pool.query(`
      UPDATE battles SET current_turn = $1, round = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `, [nextTurn, round, id]);
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error next turn:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// PUT /api/battles/:id/combatant/:combatantId - обновить участника
router.put('/:id/combatant/:combatantId', async (req, res) => {
  try {
    const { id, combatantId } = req.params;
    const { currentHp, isAlive, statusEffects, armorClass } = req.body;
    
    const battle = await pool.query('SELECT * FROM battles WHERE id = $1', [id]);
    if (battle.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }
    
    var combatants = battle.rows[0].combatants;
    var index = -1;
    
    for (var i = 0; i < combatants.length; i++) {
      if (combatants[i].id === combatantId) {
        index = i;
        break;
      }
    }
    
    if (index === -1) {
      return res.status(404).json({ error: 'Combatant not found' });
    }
    
    if (currentHp !== undefined) {
      combatants[index].currentHp = Math.max(0, Math.min(currentHp, combatants[index].maxHp));
    }
    if (isAlive !== undefined) {
      combatants[index].isAlive = isAlive;
    }
    if (statusEffects !== undefined) {
      combatants[index].statusEffects = statusEffects;
    }
    if (armorClass !== undefined) {
      combatants[index].armorClass = armorClass;
    }
    
    const result = await pool.query(`
      UPDATE battles SET combatants = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [JSON.stringify(combatants), id]);
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error updating combatant:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/battles/:id/add-combatant - добавить участника
router.post('/:id/add-combatant', async (req, res) => {
  try {
    const { id } = req.params;
    const { combatant } = req.body;
    
    if (!combatant || !combatant.id) {
      return res.status(400).json({ error: 'Combatant with id required' });
    }
    
    const battle = await pool.query('SELECT * FROM battles WHERE id = $1', [id]);
    if (battle.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }
    
    var combatants = battle.rows[0].combatants;
    combatants.push(combatant);
    
    // Пересортировка по инициативе
    combatants.sort(function(a, b) {
      return b.initiative - a.initiative;
    });
    
    const result = await pool.query(`
      UPDATE battles SET combatants = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [JSON.stringify(combatants), id]);
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error adding combatant:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/battles/:id/remove-combatant/:combatantId - удалить участника
router.post('/:id/remove-combatant/:combatantId', async (req, res) => {
  try {
    const { id, combatantId } = req.params;
    
    const battle = await pool.query('SELECT * FROM battles WHERE id = $1', [id]);
    if (battle.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }
    
    var combatants = battle.rows[0].combatants;
    combatants = combatants.filter(function(c) {
      return c.id !== combatantId;
    });
    
    const result = await pool.query(`
      UPDATE battles SET combatants = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [JSON.stringify(combatants), id]);
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error removing combatant:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/battles/:id/end - завершить бой
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { winner } = req.body;
    
    const result = await pool.query(`
      UPDATE battles SET state = 'finished', winner = $1, finished_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [winner || 'none', id]);
    
    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Error ending battle:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;