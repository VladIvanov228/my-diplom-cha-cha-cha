// backend/routes/equipment.js (новый файл или дополнить существующий)

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Получить все предметы персонажа
router.get('/characters/:characterId/equipment', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Получаем все предметы персонажа
    const equipment = await pool.query(
      `SELECT * FROM character_equipment 
       WHERE character_id = $1 
       ORDER BY 
         CASE WHEN equipped THEN 0 ELSE 1 END,
         slot NULLS LAST,
         created_at DESC`,
      [characterId]
    );

    res.json(equipment.rows);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать новый предмет
router.post('/characters/:characterId/equipment', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;
    const {
      name,
      type,
      subtype,
      quantity = 1,
      weight,
      cost,
      description,
      damage,
      damage_type,
      armor_class_bonus
    } = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Создаем предмет (по умолчанию в рюкзаке)
    const newItem = await pool.query(
      `INSERT INTO character_equipment 
       (character_id, name, type, subtype, quantity, weight, cost, description, damage, damage_type, armor_class_bonus, equipped)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
       RETURNING *`,
      [characterId, name, type, subtype, quantity, weight, cost, description, damage, damage_type, armor_class_bonus]
    );

    res.status(201).json(newItem.rows[0]);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить предмет
router.put('/equipment/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Проверяем, что предмет принадлежит персонажу пользователя
    const itemCheck = await pool.query(
      `SELECT ce.* FROM character_equipment ce
       JOIN characters c ON ce.character_id = c.id
       WHERE ce.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Если пытаемся экипировать, проверяем слот
    if (updates.equipped && updates.slot) {
      // Проверяем, не занят ли слот другим предметом
      const slotCheck = await pool.query(
        `SELECT id FROM character_equipment 
         WHERE character_id = $1 AND equipped = true AND slot = $2 AND id != $3`,
        [itemCheck.rows[0].character_id, updates.slot, itemId]
      );

      if (slotCheck.rows.length > 0) {
        // Снимаем старый предмет
        await pool.query(
          `UPDATE character_equipment 
           SET equipped = false, slot = NULL 
           WHERE id = $1`,
          [slotCheck.rows[0].id]
        );
      }
    }

    // Строим динамический запрос
    const setClause = [];
    const values = [itemId];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE character_equipment 
      SET ${setClause.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const updatedItem = await pool.query(query, values);
    res.json(updatedItem.rows[0]);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удалить предмет
router.delete('/equipment/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;

    // Проверяем, что предмет принадлежит персонажу пользователя
    const itemCheck = await pool.query(
      `SELECT ce.* FROM character_equipment ce
       JOIN characters c ON ce.character_id = c.id
       WHERE ce.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await pool.query('DELETE FROM character_equipment WHERE id = $1', [itemId]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить валюту персонажа
router.get('/characters/:characterId/currency', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const currency = await pool.query(
      'SELECT * FROM character_currency WHERE character_id = $1',
      [characterId]
    );

    if (currency.rows.length === 0) {
      // Создаем запись валюты по умолчанию
      const newCurrency = await pool.query(
        'INSERT INTO character_currency (character_id) VALUES ($1) RETURNING *',
        [characterId]
      );
      return res.json(newCurrency.rows[0]);
    }

    res.json(currency.rows[0]);
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать/обновить валюту
router.post('/characters/:characterId/currency', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;
    const { copper, silver, electrum, gold, platinum } = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const currency = await pool.query(
      `INSERT INTO character_currency (character_id, copper, silver, electrum, gold, platinum)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (character_id) DO UPDATE SET
         copper = EXCLUDED.copper,
         silver = EXCLUDED.silver,
         electrum = EXCLUDED.electrum,
         gold = EXCLUDED.gold,
         platinum = EXCLUDED.platinum,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [characterId, copper || 0, silver || 0, electrum || 0, gold || 0, platinum || 0]
    );

    res.json(currency.rows[0]);
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить валюту (PUT для частичного обновления)
router.put('/characters/:characterId/currency', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Строим динамический запрос
    const setClause = [];
    const values = [characterId];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && ['copper', 'silver', 'electrum', 'gold', 'platinum'].includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      INSERT INTO character_currency (character_id, copper, silver, electrum, gold, platinum)
      VALUES ($1, 0, 0, 0, 0, 0)
      ON CONFLICT (character_id) DO UPDATE SET
        ${setClause.join(', ')}
      RETURNING *
    `;

    const updatedCurrency = await pool.query(query, values);
    res.json(updatedCurrency.rows[0]);
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Экипировать предмет
router.post('/equipment/:itemId/equip', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { slot } = req.body;
    const userId = req.user?.id;

    if (!slot) {
      return res.status(400).json({ error: 'Slot is required' });
    }

    // Проверяем, что предмет принадлежит персонажу пользователя
    const itemCheck = await pool.query(
      `SELECT ce.* FROM character_equipment ce
       JOIN characters c ON ce.character_id = c.id
       WHERE ce.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemCheck.rows[0];
    const characterId = item.character_id;

    // Проверяем, не занят ли слот другим предметом
    const slotCheck = await pool.query(
      `SELECT id FROM character_equipment 
       WHERE character_id = $1 AND equipped = true AND slot = $2 AND id != $3`,
      [characterId, slot, itemId]
    );

    if (slotCheck.rows.length > 0) {
      // Снимаем старый предмет
      await pool.query(
        `UPDATE character_equipment 
         SET equipped = false, slot = NULL 
         WHERE id = $1`,
        [slotCheck.rows[0].id]
      );
    }

    // Экипируем новый предмет
    const updatedItem = await pool.query(
      `UPDATE character_equipment 
       SET equipped = true, slot = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [slot, itemId]
    );

    res.json(updatedItem.rows[0]);
  } catch (error) {
    console.error('Error equipping item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Снять предмет
router.post('/equipment/:itemId/unequip', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;

    const itemCheck = await pool.query(
      `SELECT ce.* FROM character_equipment ce
       JOIN characters c ON ce.character_id = c.id
       WHERE ce.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedItem = await pool.query(
      `UPDATE character_equipment 
       SET equipped = false, slot = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId]
    );

    res.json(updatedItem.rows[0]);
  } catch (error) {
    console.error('Error unequipping item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;