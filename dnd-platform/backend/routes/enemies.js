// backend/routes/enemies.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/enemies/templates - получить все шаблоны врагов
router.get('/templates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM enemy_templates 
      WHERE is_template = true OR created_by = $1
      ORDER BY name
    `, [req.user.userId || req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enemy templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/enemies/templates - создать свой шаблон врага
router.post('/templates', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      name, type, size, alignment, armor_class, hit_points, hit_dice,
      speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
      skills, senses, languages, challenge_rating, xp, actions, special_abilities,
      damage_vulnerabilities, damage_resistances, damage_immunities, condition_immunities
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(`
      INSERT INTO enemy_templates (
        name, type, size, alignment, armor_class, hit_points, hit_dice,
        speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
        skills, senses, languages, challenge_rating, xp, actions, special_abilities,
        damage_vulnerabilities, damage_resistances, damage_immunities, condition_immunities,
        is_template, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25,
        false, $26
      ) RETURNING *
    `, [
      name, type || 'humanoid', size || 'medium', alignment || 'neutral',
      armor_class || 10, hit_points || 10, hit_dice || '1d8',
      speed || 30, strength || 10, dexterity || 10, constitution || 10,
      intelligence || 10, wisdom || 10, charisma || 10,
      JSON.stringify(skills || {}), senses || '', languages || '',
      challenge_rating || '1/4', xp || 50,
      JSON.stringify(actions || []), JSON.stringify(special_abilities || []),
      damage_vulnerabilities, damage_resistances, damage_immunities, condition_immunities,
      userId
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating enemy template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// DELETE /api/enemies/templates/:id - удалить свой шаблон
router.delete('/templates/:id', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM enemy_templates WHERE id = $1 AND created_by = $2 AND is_template = false',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Template not found or cannot be deleted' });
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// POST /api/maps/:mapId/enemies - разместить врага на карте
router.post('/maps/:mapId/enemies', async (req, res) => {
  try {
    const { mapId } = req.params;
    const { template_id, name, x, y, hit_points, armor_class, initiative } = req.body;

    const template = template_id ? 
      (await pool.query('SELECT * FROM enemy_templates WHERE id = $1', [template_id])).rows[0] 
      : null;

    const result = await pool.query(`
      INSERT INTO map_enemies (map_id, template_id, name, x, y, hit_points, max_hit_points, armor_class, initiative, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      mapId, template_id || null,
      name || template?.name || 'Unknown Enemy',
      x || 0, y || 0,
      hit_points || template?.hit_points || 10,
      hit_points || template?.hit_points || 10,
      armor_class || template?.armor_class || 10,
      initiative || 0,
      JSON.stringify({ template_actions: template?.actions || [], template_abilities: template?.special_abilities || [] })
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error placing enemy:', error);
    res.status(500).json({ error: 'Failed to place enemy' });
  }
});

// GET /api/maps/:mapId/enemies - получить врагов на карте
router.get('/maps/:mapId/enemies', async (req, res) => {
  try {
    const { mapId } = req.params;

    const result = await pool.query(`
      SELECT me.*, et.actions, et.special_abilities
      FROM map_enemies me
      LEFT JOIN enemy_templates et ON me.template_id = et.id
      WHERE me.map_id = $1
      ORDER BY me.initiative DESC, me.id
    `, [mapId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching map enemies:', error);
    res.status(500).json({ error: 'Failed to fetch enemies' });
  }
});

// PUT /api/maps/enemies/:id - обновить врага
router.put('/maps/enemies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { x, y, hit_points, is_alive, initiative } = req.body;

    const updates = [];
    const values = [id];
    let paramIndex = 2;

    if (x !== undefined) { updates.push(`x = $${paramIndex++}`); values.push(x); }
    if (y !== undefined) { updates.push(`y = $${paramIndex++}`); values.push(y); }
    if (hit_points !== undefined) { updates.push(`hit_points = $${paramIndex++}`); values.push(hit_points); }
    if (is_alive !== undefined) { updates.push(`is_alive = $${paramIndex++}`); values.push(is_alive); }
    if (initiative !== undefined) { updates.push(`initiative = $${paramIndex++}`); values.push(initiative); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(`
      UPDATE map_enemies SET ${updates.join(', ')} WHERE id = $1 RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating enemy:', error);
    res.status(500).json({ error: 'Failed to update enemy' });
  }
});

// DELETE /api/maps/enemies/:id - удалить врага с карты
router.delete('/maps/enemies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM map_enemies WHERE id = $1', [id]);
    res.json({ message: 'Enemy removed' });
  } catch (error) {
    console.error('Error deleting enemy:', error);
    res.status(500).json({ error: 'Failed to delete enemy' });
  }
});

module.exports = router;