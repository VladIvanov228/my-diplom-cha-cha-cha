const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ========== ПУБЛИЧНЫЕ СПРАВОЧНИКИ ==========

// Получить все типы предметов
router.get('/types', async (req, res) => {
  try {
    const types = await pool.query('SELECT * FROM item_types ORDER BY category, name');
    res.json(types.rows);
  } catch (error) {
    console.error('Error fetching item types:', error);
    res.status(500).json({ error: 'Ошибка загрузки типов предметов' });
  }
});

// Получить все предметы (с фильтрацией)
router.get('/items', async (req, res) => {
  try {
    const { category, rarity, search, type } = req.query;
    let query = `
      SELECT i.*, it.name as type_name, it.category 
      FROM items i
      JOIN item_types it ON i.type_id = it.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND it.category = $${params.length}`;
    }

    if (rarity) {
      params.push(rarity);
      query += ` AND i.rarity = $${params.length}`;
    }

    if (type) {
      params.push(`%${type}%`);
      query += ` AND it.name ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND i.name ILIKE $${params.length}`;
    }

    query += ' ORDER BY i.name';
    
    const items = await pool.query(query, params);
    res.json(items.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Ошибка загрузки предметов' });
  }
});

// Получить предмет по ID
router.get('/items/:id', async (req, res) => {
  try {
    const item = await pool.query(
      `SELECT i.*, it.name as type_name, it.category 
       FROM items i
       JOIN item_types it ON i.type_id = it.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    res.json(item.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Ошибка загрузки предмета' });
  }
});

// ========== ИНВЕНТАРЬ ПЕРСОНАЖА (требует авторизации) ==========

// Получить инвентарь персонажа
router.get('/characters/:characterId/inventory', auth, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    const inventory = await pool.query(
      `SELECT ci.*, 
              i.name as item_name,
              i.description as item_description,
              i.properties as item_properties,
              i.rarity as item_rarity,
              it.name as item_type,
              it.category as item_category
       FROM character_inventory ci
       LEFT JOIN items i ON ci.item_id = i.id
       LEFT JOIN item_types it ON i.type_id = it.id
       WHERE ci.character_id = $1
       ORDER BY ci.equipped DESC, it.category, ci.custom_name, i.name`,
      [characterId]
    );

    // Рассчитываем общий вес и стоимость
    const totalWeight = inventory.rows.reduce((sum, item) => {
      return sum + (item.weight * item.quantity);
    }, 0);

    const totalCost = inventory.rows.reduce((sum, item) => {
      return sum + (item.cost * item.quantity);
    }, 0);

    // Экипированные предметы
    const equipped = inventory.rows.filter(item => item.equipped);
    
    // Предметы по категориям
    const byCategory = inventory.rows.reduce((acc, item) => {
      const category = item.item_category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    res.json({
      items: inventory.rows,
      equipped,
      byCategory,
      totals: {
        weight: totalWeight,
        cost: totalCost,
        count: inventory.rows.length,
        equippedCount: equipped.length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Ошибка загрузки инвентаря' });
  }
});

// Добавить предмет в инвентарь
router.post('/characters/:characterId/inventory', auth, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;
    const { item_id, custom_name, custom_description, quantity = 1, equipped = false, equipped_slot, notes } = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Если указан item_id, проверяем существование предмета
    let weight = 0;
    let cost = 0;

    if (item_id) {
      const item = await pool.query('SELECT weight, cost FROM items WHERE id = $1', [item_id]);
      if (item.rows.length === 0) {
        return res.status(404).json({ error: 'Предмет не найден' });
      }
      weight = item.rows[0].weight;
      cost = item.rows[0].cost;
    }

    // Если предмет экипируется, проверяем слот
    if (equipped && equipped_slot) {
      // Проверяем, не занят ли уже этот слот
      const slotOccupied = await pool.query(
        'SELECT id FROM character_inventory WHERE character_id = $1 AND equipped = true AND equipped_slot = $2',
        [characterId, equipped_slot]
      );

      if (slotOccupied.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Слот уже занят', 
          occupiedItemId: slotOccupied.rows[0].id 
        });
      }
    }

    const newItem = await pool.query(
      `INSERT INTO character_inventory 
       (character_id, item_id, custom_name, custom_description, quantity, weight, cost, equipped, equipped_slot, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [characterId, item_id, custom_name, custom_description, quantity, weight, cost, equipped, equipped_slot, notes]
    );

    res.status(201).json(newItem.rows[0]);
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    res.status(500).json({ error: 'Ошибка добавления предмета' });
  }
});

// Обновить предмет в инвентаре
router.put('/characters/:characterId/inventory/:itemId', auth, async (req, res) => {
  try {
    const { characterId, itemId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Проверяем, что предмет принадлежит персонажу
    const itemCheck = await pool.query(
      'SELECT id FROM character_inventory WHERE id = $1 AND character_id = $2',
      [itemId, characterId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Предмет не найден в инвентаре' });
    }

    // Если предмет экипируется, проверяем слот
    if (updates.equipped && updates.equipped_slot) {
      // Исключаем текущий предмет из проверки
      const slotOccupied = await pool.query(
        'SELECT id FROM character_inventory WHERE character_id = $1 AND equipped = true AND equipped_slot = $2 AND id != $3',
        [characterId, updates.equipped_slot, itemId]
      );

      if (slotOccupied.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Слот уже занят', 
          occupiedItemId: slotOccupied.rows[0].id 
        });
      }
    }

    // Собираем SQL запрос динамически
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updates);
    values.unshift(itemId);

    const query = `UPDATE character_inventory SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

    const updatedItem = await pool.query(query, values);
    res.json(updatedItem.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Ошибка обновления предмета' });
  }
});

// Удалить предмет из инвентаря
router.delete('/characters/:characterId/inventory/:itemId', auth, async (req, res) => {
  try {
    const { characterId, itemId } = req.params;
    const userId = req.user.userId;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    const result = await pool.query(
      'DELETE FROM character_inventory WHERE id = $1 AND character_id = $2 RETURNING id',
      [itemId, characterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Предмет не найден в инвентаре' });
    }

    res.json({ message: 'Предмет удалён из инвентаря' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Ошибка удаления предмета' });
  }
});

// Экипировать/снять предмет
router.post('/characters/:characterId/inventory/:itemId/toggle-equip', auth, async (req, res) => {
  try {
    const { characterId, itemId } = req.params;
    const userId = req.user.userId;
    const { slot } = req.body;

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Получаем текущее состояние предмета
    const item = await pool.query(
      'SELECT * FROM character_inventory WHERE id = $1 AND character_id = $2',
      [itemId, characterId]
    );

    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Предмет не найден в инвентаре' });
    }

    const currentItem = item.rows[0];
    const willBeEquipped = !currentItem.equipped;

    // Если экипируем, проверяем слот
    if (willBeEquipped) {
      const equippedSlot = slot || currentItem.equipped_slot || 'general';
      
      // Проверяем, не занят ли слот
      const slotOccupied = await pool.query(
        'SELECT id FROM character_inventory WHERE character_id = $1 AND equipped = true AND equipped_slot = $2 AND id != $3',
        [characterId, equippedSlot, itemId]
      );

      if (slotOccupied.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Слот уже занят', 
          occupiedItemId: slotOccupied.rows[0].id 
        });
      }

      // Экипируем предмет
      const updatedItem = await pool.query(
        `UPDATE character_inventory 
         SET equipped = true, equipped_slot = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [equippedSlot, itemId]
      );

      res.json(updatedItem.rows[0]);
    } else {
      // Снимаем предмет
      const updatedItem = await pool.query(
        `UPDATE character_inventory 
         SET equipped = false, equipped_slot = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [itemId]
      );

      res.json(updatedItem.rows[0]);
    }
  } catch (error) {
    console.error('Error toggling equipment:', error);
    res.status(500).json({ error: 'Ошибка изменения экипировки' });
  }
});

// Получить транспорт персонажа
router.get('/characters/:characterId/vehicles', auth, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;

    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    const vehicles = await pool.query(
      `SELECT cv.*, v.name as vehicle_name, v.type, v.speed, v.capacity, v.description
       FROM character_vehicles cv
       LEFT JOIN vehicles v ON cv.vehicle_id = v.id
       WHERE cv.character_id = $1`,
      [characterId]
    );

    res.json(vehicles.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Ошибка загрузки транспорта' });
  }
});

// Рассчитать грузоподъёмность
router.get('/characters/:characterId/carrying-capacity', auth, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.userId;

    const characterCheck = await pool.query(
      'SELECT id, strength FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    const character = characterCheck.rows[0];
    const strength = character.strength || 10;
    
    // В D&D 5e: carrying capacity = strength * 15 (в фунтах)
    const carryingCapacity = strength * 15;
    
    // Push/drag/lift = strength * 30
    const pushDragLift = strength * 30;

    // Получаем текущий вес инвентаря
    const inventoryWeight = await pool.query(
      `SELECT COALESCE(SUM(weight * quantity), 0) as total_weight
       FROM character_inventory
       WHERE character_id = $1`,
      [characterId]
    );

    const currentWeight = parseFloat(inventoryWeight.rows[0].total_weight) || 0;
    const percentage = (currentWeight / carryingCapacity) * 100;

    // Определяем статус перегруза
    let encumbranceStatus = 'normal';
    if (percentage > 100) encumbranceStatus = 'overloaded';
    else if (percentage > 66.6) encumbranceStatus = 'heavily_encumbered';
    else if (percentage > 33.3) encumbranceStatus = 'encumbered';

    res.json({
      strength,
      carryingCapacity,
      pushDragLift,
      currentWeight,
      percentage: Math.round(percentage * 100) / 100,
      encumbranceStatus,
      isOverloaded: percentage > 100,
      remainingCapacity: carryingCapacity - currentWeight
    });
  } catch (error) {
    console.error('Error calculating carrying capacity:', error);
    res.status(500).json({ error: 'Ошибка расчёта грузоподъёмности' });
  }
});

module.exports = router;