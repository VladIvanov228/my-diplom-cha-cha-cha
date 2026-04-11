const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Все роуты навыков защищены middleware аутентификации
router.use(authMiddleware);

// GET /api/skills/races/:raceId/passive-skills
router.get('/races/:raceId/passive-skills', async (req, res) => {
  const { raceId } = req.params;
  console.log('Fetching race passive skill for raceId:', raceId);
  
  try {
    // Сначала проверим, есть ли таблица race_passive_skills
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'race_passive_skills'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Table race_passive_skills does not exist');
      return res.json(null);
    }
    
    // Проверим структуру таблицы
    const columnsCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'race_passive_skills'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in race_passive_skills:', columnsCheck.rows.map(c => c.column_name));
    
    // Попробуем разные варианты запроса
    let result;
    try {
      // Вариант 1: если есть колонка race_id
      result = await db.query(
        `SELECT s.*, rps.description as skill_description
         FROM race_passive_skills rps
         JOIN skills s ON rps.skill_id = s.id
         WHERE rps.race_id = $1`,
        [raceId]
      );
    } catch (err) {
      console.log('First query failed, trying alternative...');
      // Вариант 2: если нет таблицы skills или другая структура
      result = await db.query(
        `SELECT * FROM race_passive_skills WHERE race_id = $1`,
        [raceId]
      );
    }
    
    console.log('Query result:', result.rows);
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    // Форматируем ответ
    const skillData = result.rows[0];
    const response = {
      id: skillData.id || skillData.skill_id,
      raceId: skillData.race_id,
      name: skillData.name || 'Расовый навык',
      description: skillData.description || skillData.skill_description || 'Нет описания',
      effectType: skillData.effect_type || 'utility',
      effectValue: skillData.effect_value || {},
      isPassive: true
    };
    
    res.json(response);
  } catch (error) {
    console.error('Ошибка получения расового навыка:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/skills/classes/:classId/skills
router.get('/classes/:classId/skills', async (req, res) => {
  const { classId } = req.params;
  const level = parseInt(req.query.level) || 1;
  console.log('Fetching class skills for classId:', classId, 'level:', level);
  
  try {
    // Проверим существование таблиц
    const tablesCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('class_skills', 'skills')
      ORDER BY table_name;
    `);
    console.log('Available tables:', tablesCheck.rows.map(t => t.table_name));
    
    let result;
    try {
      // Основной запрос
      result = await db.query(
        `SELECT s.*, cs.required_level
         FROM class_skills cs
         JOIN skills s ON cs.skill_id = s.id
         WHERE cs.class_id = $1 AND cs.required_level <= $2
         ORDER BY cs.required_level ASC, s.name ASC`,
        [classId, level]
      );
    } catch (err) {
      console.log('Main query failed, trying simplified query...');
      // Упрощенный запрос без JOIN
      result = await db.query(
        `SELECT * FROM class_skills WHERE class_id = $1`,
        [classId]
      );
    }
    
    console.log(`Found ${result.rows.length} skills`);
    
    if (result.rows.length === 0) {
      return res.json([]);
    }
    
    // Форматируем ответ
    const skills = result.rows.map(row => ({
      id: row.id || row.skill_id,
      classId: row.class_id,
      name: row.name || `Навык ${row.skill_id}`,
      description: row.description || 'Нет описания',
      skillLevel: row.required_level || row.skill_level || 1,
      skillType: row.skill_type || 'active',
      activationCost: row.activation_cost || { type: 'action' },
      cooldown: row.cooldown || 0,
      range: row.range || 'self',
      target: row.target || 'self',
      duration: row.duration || 'instant',
      savingThrow: row.saving_throw,
      effectType: row.effect_type || 'utility',
      effectValue: row.effect_value || {},
      requirements: row.requirements || {}
    }));
    
    res.json(skills);
  } catch (error) {
    console.error('Ошибка получения классовых навыков:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// GET /api/skills/characters/:characterId
router.get('/characters/:characterId', async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  console.log('Fetching character skills for characterId:', characterId, 'userId:', userId);
  
  try {
    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await db.query(
      'SELECT id, class, race FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Персонаж не найден' });
    }
    
    // Проверяем, существует ли таблица class_skills (новая система навыков)
    const classSkillsTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'class_skills'
      );
    `);
    
    if (!classSkillsTableCheck.rows[0].exists) {
      console.log('Table class_skills does not exist, returning empty array');
      return res.json([]);
    }
    
    // Проверяем, есть ли у персонажа изученные навыки (если таблица character_skills имеет правильную структуру)
    const characterSkillsTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'character_skills'
      );
    `);
    
    if (!characterSkillsTableCheck.rows[0].exists) {
      console.log('Table character_skills does not exist');
      return res.json([]);
    }
    
    // Пытаемся получить навыки, но с проверкой на существование колонок
    let result;
    try {
      // Сначала проверим структуру таблицы character_skills
      const columnsCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'character_skills'
        ORDER BY ordinal_position;
      `);
      
      const columnNames = columnsCheck.rows.map(c => c.column_name);
      console.log('character_skills columns:', columnNames);
      
      // Если есть skill_id (числовой) - используем новую структуру
      if (columnNames.includes('skill_id') && columnNames.includes('character_id')) {
        // Проверяем тип данных skill_id
        const skillIdTypeCheck = await db.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = 'character_skills' AND column_name = 'skill_id';
        `);
        
        const isNumericSkillId = skillIdTypeCheck.rows[0]?.data_type === 'integer';
        
        if (isNumericSkillId) {
          // Новая структура: связь с class_skills
          result = await db.query(
            `SELECT cs.*, cls.name, cls.description, cls.skill_type, cls.cooldown, cls.range, cls.duration
             FROM character_skills cs
             JOIN class_skills cls ON cs.skill_id = cls.id
             WHERE cs.character_id = $1
             ORDER BY cs.created_at ASC`,
            [characterId]
          );
        } else {
          // Старая структура: skill_id как текст
          result = await db.query(
            `SELECT * FROM character_skills WHERE character_id = $1`,
            [characterId]
          );
        }
      } else {
        // Старая структура или нет нужных колонок
        result = await db.query(
          `SELECT * FROM character_skills WHERE character_id = $1`,
          [characterId]
        );
      }
    } catch (err) {
      console.log('Error querying character_skills, returning empty:', err.message);
      return res.json([]);
    }
    
    console.log(`Found ${result.rows.length} learned skills`);
    
    // Форматируем ответ с проверкой полей
    const skills = result.rows.map(row => ({
      id: row.id,
      character_id: row.character_id,
      skill_id: row.skill_id,
      name: row.name || `Skill ${row.skill_id}`,
      description: row.description || 'No description',
      skill_type: row.skill_type || 'active',
      cooldown: row.cooldown || 0,
      range: row.range || 'self',
      duration: row.duration || 'instant',
      current_cooldown: row.current_cooldown || 0,
      uses_remaining: row.uses_remaining,
      last_used_at: row.last_used_at,
      learned_at: row.learned_at || row.created_at
    }));
    
    res.json(skills);
  } catch (error) {
    console.error('Ошибка получения навыков персонажа:', error);
    // Возвращаем пустой массив вместо 500 ошибки, чтобы фронтенд не падал
    res.json([]);
  }
});

// POST /api/skills/characters/:characterId/learn
router.post('/characters/:characterId/learn', async (req, res) => {
  const { characterId } = req.params;
  const { skillId } = req.body;
  const userId = req.user.id;
  console.log('Learning skill:', { characterId, skillId, userId });
  
  try {
    // Проверка владельца
    const characterCheck = await db.query(
      'SELECT id, class_id, level FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Персонаж не найден' });
    }
    
    // Проверка, не изучен ли уже
    const alreadyLearned = await db.query(
      'SELECT id FROM character_skills WHERE character_id = $1 AND skill_id = $2',
      [characterId, skillId]
    );
    
    if (alreadyLearned.rows.length > 0) {
      return res.status(400).json({ message: 'Навык уже изучен' });
    }
    
    // Изучаем навык
    const result = await db.query(
      `INSERT INTO character_skills (character_id, skill_id, learned_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [characterId, skillId]
    );
    
    // Получаем информацию о навыке
    const skillInfo = await db.query(
      'SELECT * FROM skills WHERE id = $1',
      [skillId]
    );
    
    res.status(201).json({
      message: 'Навык успешно изучен',
      data: {
        id: result.rows[0].id,
        skill: skillInfo.rows[0]
      }
    });
  } catch (error) {
    console.error('Ошибка изучения навыка:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// PUT /api/skills/characters/:characterId/skills/:skillId/use
router.put('/characters/:characterId/skills/:skillId/use', async (req, res) => {
  const { characterId, skillId } = req.params;
  const userId = req.user.id;
  
  try {
    // Проверка владельца
    const characterCheck = await db.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Персонаж не найден' });
    }
    
    // Получаем навык и проверяем кулдаун
    const skillResult = await db.query(
      `SELECT cs.*, s.cooldown
       FROM character_skills cs
       JOIN skills s ON cs.skill_id = s.id
       WHERE cs.character_id = $1 AND cs.skill_id = $2`,
      [characterId, skillId]
    );
    
    if (skillResult.rows.length === 0) {
      return res.status(404).json({ message: 'Навык не найден у персонажа' });
    }
    
    const { cooldown, last_used_at } = skillResult.rows[0];
    
    if (last_used_at) {
      const timeSinceLastUse = new Date() - new Date(last_used_at);
      const cooldownMs = cooldown * 1000;
      if (timeSinceLastUse < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastUse) / 1000);
        return res.status(400).json({ 
          message: `Навык перезаряжается. Осталось ${remainingSeconds} сек.` 
        });
      }
    }
    
    // Обновляем время последнего использования
    await db.query(
      `UPDATE character_skills 
       SET last_used_at = NOW() 
       WHERE character_id = $1 AND skill_id = $2`,
      [characterId, skillId]
    );
    
    res.json({ 
      message: 'Навык успешно применен',
      success: true
    });
  } catch (error) {
    console.error('Ошибка использования навыка:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// POST /api/skills/characters/:characterId/cooldown/update
router.post('/characters/:characterId/cooldown/update', async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;
  
  try {
    const characterCheck = await db.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Персонаж не найден' });
    }
    
    const result = await db.query(
      `SELECT cs.skill_id, s.cooldown, cs.last_used_at,
              EXTRACT(EPOCH FROM (NOW() - cs.last_used_at)) as seconds_since_use
       FROM character_skills cs
       JOIN skills s ON cs.skill_id = s.id
       WHERE cs.character_id = $1`,
      [characterId]
    );
    
    const skillsWithCooldown = result.rows.map(skill => ({
      skillId: skill.skill_id,
      cooldown: skill.cooldown,
      lastUsedAt: skill.last_used_at,
      isReady: !skill.last_used_at || skill.seconds_since_use >= skill.cooldown,
      remainingSeconds: skill.last_used_at 
        ? Math.max(0, skill.cooldown - skill.seconds_since_use)
        : 0
    }));
    
    res.json(skillsWithCooldown);
  } catch (error) {
    console.error('Ошибка обновления кулдаунов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;