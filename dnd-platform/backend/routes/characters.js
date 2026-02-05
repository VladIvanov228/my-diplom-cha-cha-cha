const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    console.log('GET /api/characters called')
    console.log('req.user:', req.user)
    
    // Используем userId или id для совместимости
    const userId = req.user?.userId || req.user?.id
    if (!userId) {
      console.log('❌ No user ID found in request')
      return res.status(401).json({ 
        error: 'Не авторизован',
        details: 'User ID not found in request'
      })
    }

    console.log('✅ User ID:', userId)
    
    // Простой запрос для тестирования
    const characters = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    console.log(`✅ Found ${characters.rows.length} characters`)
    res.json(characters.rows)
  } catch (error) {
    console.error('Error fetching characters:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Создать нового персонажа
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const {
      name,
      class: charClass,
      race,
      background,
      alignment,
      level = 1,
      experience_points = 0,
      strength = 10,
      dexterity = 10,
      constitution = 10,
      intelligence = 10,
      wisdom = 10,
      charisma = 10,
      campaign_id
    } = req.body;

    // Автоматический расчет производных характеристик
    const hit_points = 10 + Math.floor((constitution - 10) / 2);
    const proficiency_bonus = 2 + Math.floor((level - 1) / 4);
    const armor_class = 10 + Math.floor((dexterity - 10) / 2);

    const newCharacter = await pool.query(
      `INSERT INTO characters 
       (name, class, race, background, alignment, level, experience_points,
        strength, dexterity, constitution, intelligence, wisdom, charisma,
        hit_points, proficiency_bonus, armor_class, user_id, campaign_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        name, charClass, race, background, alignment, level, experience_points,
        strength, dexterity, constitution, intelligence, wisdom, charisma,
        hit_points, proficiency_bonus, armor_class, userId, campaign_id
      ]
    );

    res.status(201).json(newCharacter.rows[0]);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Ошибка создания персонажа' });
  }
});

// Получить детали персонажа
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const character = await pool.query(
      `SELECT c.*, 
              json_agg(DISTINCT cs.*) FILTER (WHERE cs.id IS NOT NULL) as skills,
              json_agg(DISTINCT ce.*) FILTER (WHERE ce.id IS NOT NULL) as equipment,
              json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL) as spells
       FROM characters c
       LEFT JOIN character_skills cs ON c.id = cs.character_id
       LEFT JOIN character_equipment ce ON c.id = ce.character_id
       LEFT JOIN character_spells csp ON c.id = csp.character_id
       LEFT JOIN spells sp ON csp.spell_id = sp.id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [id, userId]
    );

    if (character.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден' });
    }

    res.json(character.rows[0]);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить персонажа
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Проверяем владельца
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Если обновляем характеристики, пересчитываем производные значения
    if (updates.constitution !== undefined || updates.level !== undefined) {
      const constitution = updates.constitution || (await pool.query(
        'SELECT constitution FROM characters WHERE id = $1', [id]
      )).rows[0].constitution;
      
      const level = updates.level || (await pool.query(
        'SELECT level FROM characters WHERE id = $1', [id]
      )).rows[0].level;

      updates.hit_points = 10 + Math.floor((constitution - 10) / 2);
      updates.proficiency_bonus = 2 + Math.floor((level - 1) / 4);
    }

    if (updates.dexterity !== undefined) {
      updates.armor_class = 10 + Math.floor((updates.dexterity - 10) / 2);
    }

    // Собираем SQL запрос динамически
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updates);
    values.unshift(id);

    const query = `UPDATE characters SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

    const updatedCharacter = await pool.query(query, values);
    res.json(updatedCharacter.rows[0]);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Ошибка обновления персонажа' });
  }
});

// Удалить персонажа
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      'DELETE FROM characters WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    res.json({ message: 'Персонаж удален' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Ошибка удаления персонажа' });
  }
});

// Получить классы
router.get('/data/classes', async (req, res) => {
  try {
    const classes = await pool.query('SELECT * FROM classes ORDER BY name');
    res.json(classes.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Ошибка загрузки классов' });
  }
});

// Получить расы
router.get('/data/races', async (req, res) => {
  try {
    console.log('📦 GET /api/characters/data/races called')
    console.log('Request headers:', req.headers)
    
    const races = await pool.query('SELECT * FROM races ORDER BY name');
    
    console.log(`✅ Found ${races.rows.length} races`)
    console.log('Sample race:', races.rows[0])
    
    res.json(races.rows);
  } catch (error) {
    console.error('❌ Error fetching races:', error);
    res.status(500).json({ error: 'Ошибка загрузки рас' });
  }
});

// Получить навыки персонажа
router.get('/:id/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Получаем навыки персонажа
    const skills = await pool.query(
      `SELECT cs.*,
        CASE cs.skill_id
          WHEN 'acrobatics' THEN 'Акробатика'
          WHEN 'animal_handling' THEN 'Уход за животными'
          WHEN 'arcana' THEN 'Магия'
          WHEN 'athletics' THEN 'Атлетика'
          WHEN 'deception' THEN 'Обман'
          WHEN 'history' THEN 'История'
          WHEN 'insight' THEN 'Проницательность'
          WHEN 'intimidation' THEN 'Запугивание'
          WHEN 'investigation' THEN 'Анализ'
          WHEN 'medicine' THEN 'Медицина'
          WHEN 'nature' THEN 'Природа'
          WHEN 'perception' THEN 'Восприятие'
          WHEN 'performance' THEN 'Выступление'
          WHEN 'persuasion' THEN 'Убеждение'
          WHEN 'religion' THEN 'Религия'
          WHEN 'sleight_of_hand' THEN 'Ловкость рук'
          WHEN 'stealth' THEN 'Скрытность'
          WHEN 'survival' THEN 'Выживание'
          ELSE cs.skill_id
        END as name,
        CASE cs.skill_id
          WHEN 'acrobatics' THEN 'dexterity'
          WHEN 'animal_handling' THEN 'wisdom'
          WHEN 'arcana' THEN 'intelligence'
          WHEN 'athletics' THEN 'strength'
          WHEN 'deception' THEN 'charisma'
          WHEN 'history' THEN 'intelligence'
          WHEN 'insight' THEN 'wisdom'
          WHEN 'intimidation' THEN 'charisma'
          WHEN 'investigation' THEN 'intelligence'
          WHEN 'medicine' THEN 'wisdom'
          WHEN 'nature' THEN 'intelligence'
          WHEN 'perception' THEN 'wisdom'
          WHEN 'performance' THEN 'charisma'
          WHEN 'persuasion' THEN 'charisma'
          WHEN 'religion' THEN 'intelligence'
          WHEN 'sleight_of_hand' THEN 'dexterity'
          WHEN 'stealth' THEN 'dexterity'
          WHEN 'survival' THEN 'wisdom'
          ELSE 'strength'
        END as ability
       FROM character_skills cs
       WHERE cs.character_id = $1
       ORDER BY cs.skill_id`,
      [id]
    );

    // Если навыков нет, создаем дефолтные записи
    if (skills.rows.length === 0) {
      const skillIds = [
        'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception',
        'history', 'insight', 'intimidation', 'investigation', 'medicine',
        'nature', 'perception', 'performance', 'persuasion', 'religion',
        'sleight_of_hand', 'stealth', 'survival'
      ];

      for (const skillId of skillIds) {
        await pool.query(
          'INSERT INTO character_skills (character_id, skill_id) VALUES ($1, $2) ON CONFLICT (character_id, skill_id) DO NOTHING',
          [id, skillId]
        );
      }

      // Получаем созданные навыки
      const createdSkills = await pool.query(
        `SELECT cs.*,
          CASE cs.skill_id
            WHEN 'acrobatics' THEN 'Акробатика'
            WHEN 'animal_handling' THEN 'Уход за животными'
            WHEN 'arcana' THEN 'Магия'
            WHEN 'athletics' THEN 'Атлетика'
            WHEN 'deception' THEN 'Обман'
            WHEN 'history' THEN 'История'
            WHEN 'insight' THEN 'Проницательность'
            WHEN 'intimidation' THEN 'Запугивание'
            WHEN 'investigation' THEN 'Анализ'
            WHEN 'medicine' THEN 'Медицина'
            WHEN 'nature' THEN 'Природа'
            WHEN 'perception' THEN 'Восприятие'
            WHEN 'performance' THEN 'Выступление'
            WHEN 'persuasion' THEN 'Убеждение'
            WHEN 'religion' THEN 'Религия'
            WHEN 'sleight_of_hand' THEN 'Ловкость рук'
            WHEN 'stealth' THEN 'Скрытность'
            WHEN 'survival' THEN 'Выживание'
            ELSE cs.skill_id
          END as name,
          CASE cs.skill_id
            WHEN 'acrobatics' THEN 'dexterity'
            WHEN 'animal_handling' THEN 'wisdom'
            WHEN 'arcana' THEN 'intelligence'
            WHEN 'athletics' THEN 'strength'
            WHEN 'deception' THEN 'charisma'
            WHEN 'history' THEN 'intelligence'
            WHEN 'insight' THEN 'wisdom'
            WHEN 'intimidation' THEN 'charisma'
            WHEN 'investigation' THEN 'intelligence'
            WHEN 'medicine' THEN 'wisdom'
            WHEN 'nature' THEN 'intelligence'
            WHEN 'perception' THEN 'wisdom'
            WHEN 'performance' THEN 'charisma'
            WHEN 'persuasion' THEN 'charisma'
            WHEN 'religion' THEN 'intelligence'
            WHEN 'sleight_of_hand' THEN 'dexterity'
            WHEN 'stealth' THEN 'dexterity'
            WHEN 'survival' THEN 'wisdom'
            ELSE 'strength'
          END as ability
         FROM character_skills cs
         WHERE cs.character_id = $1
         ORDER BY cs.skill_id`,
        [id]
      );

      return res.json(createdSkills.rows);
    }

    res.json(skills.rows);
  } catch (error) {
    console.error('Error fetching character skills:', error);
    res.status(500).json({ error: 'Ошибка загрузки навыков' });
  }
});

// Обновить навыки персонажа
router.put('/:id/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { skills } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Некорректные данные навыков' });
    }

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Обновляем каждый навык
    const updatedSkills = [];
    for (const skillData of skills) {
      const { skill_id, proficient, expertise, custom_bonus, notes } = skillData;

      // Проверяем, существует ли запись
      const existingSkill = await pool.query(
        'SELECT id FROM character_skills WHERE character_id = $1 AND skill_id = $2',
        [id, skill_id]
      );

      if (existingSkill.rows.length > 0) {
        // Обновляем существующую запись
        await pool.query(
          `UPDATE character_skills 
           SET proficient = COALESCE($1, proficient),
               expertise = COALESCE($2, expertise),
               custom_bonus = COALESCE($3, custom_bonus),
               notes = COALESCE($4, notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE character_id = $5 AND skill_id = $6
           RETURNING *`,
          [proficient, expertise, custom_bonus, notes, id, skill_id]
        );
      } else {
        // Создаем новую запись
        await pool.query(
          `INSERT INTO character_skills 
           (character_id, skill_id, proficient, expertise, custom_bonus, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (character_id, skill_id) DO UPDATE SET
           proficient = EXCLUDED.proficient,
           expertise = EXCLUDED.expertise,
           custom_bonus = EXCLUDED.custom_bonus,
           notes = EXCLUDED.notes,
           updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [id, skill_id, proficient, expertise, custom_bonus, notes]
        );
      }

      // Получаем обновленную запись
      const updatedSkill = await pool.query(
        `SELECT cs.*,
          CASE cs.skill_id
            WHEN 'acrobatics' THEN 'Акробатика'
            WHEN 'animal_handling' THEN 'Уход за животными'
            WHEN 'arcana' THEN 'Магия'
            WHEN 'athletics' THEN 'Атлетика'
            WHEN 'deception' THEN 'Обман'
            WHEN 'history' THEN 'История'
            WHEN 'insight' THEN 'Проницательность'
            WHEN 'intimidation' THEN 'Запугивание'
            WHEN 'investigation' THEN 'Анализ'
            WHEN 'medicine' THEN 'Медицина'
            WHEN 'nature' THEN 'Природа'
            WHEN 'perception' THEN 'Восприятие'
            WHEN 'performance' THEN 'Выступление'
            WHEN 'persuasion' THEN 'Убеждение'
            WHEN 'religion' THEN 'Религия'
            WHEN 'sleight_of_hand' THEN 'Ловкость рук'
            WHEN 'stealth' THEN 'Скрытность'
            WHEN 'survival' THEN 'Выживание'
            ELSE cs.skill_id
          END as name,
          CASE cs.skill_id
            WHEN 'acrobatics' THEN 'dexterity'
            WHEN 'animal_handling' THEN 'wisdom'
            WHEN 'arcana' THEN 'intelligence'
            WHEN 'athletics' THEN 'strength'
            WHEN 'deception' THEN 'charisma'
            WHEN 'history' THEN 'intelligence'
            WHEN 'insight' THEN 'wisdom'
            WHEN 'intimidation' THEN 'charisma'
            WHEN 'investigation' THEN 'intelligence'
            WHEN 'medicine' THEN 'wisdom'
            WHEN 'nature' THEN 'intelligence'
            WHEN 'perception' THEN 'wisdom'
            WHEN 'performance' THEN 'charisma'
            WHEN 'persuasion' THEN 'charisma'
            WHEN 'religion' THEN 'intelligence'
            WHEN 'sleight_of_hand' THEN 'dexterity'
            WHEN 'stealth' THEN 'dexterity'
            WHEN 'survival' THEN 'wisdom'
            ELSE 'strength'
          END as ability
         FROM character_skills cs
         WHERE cs.character_id = $1 AND cs.skill_id = $2`,
        [id, skill_id]
      );

      if (updatedSkill.rows.length > 0) {
        updatedSkills.push(updatedSkill.rows[0]);
      }
    }

    res.json(updatedSkills);
  } catch (error) {
    console.error('Error updating character skills:', error);
    res.status(500).json({ error: 'Ошибка обновления навыков' });
  }
});

// Обновить конкретный навык
router.put('/:id/skills/:skillId', async (req, res) => {
  try {
    const { id, skillId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Проверяем валидность skillId
    const validSkillIds = [
      'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception',
      'history', 'insight', 'intimidation', 'investigation', 'medicine',
      'nature', 'perception', 'performance', 'persuasion', 'religion',
      'sleight_of_hand', 'stealth', 'survival'
    ];

    if (!validSkillIds.includes(skillId)) {
      return res.status(400).json({ error: 'Некорректный идентификатор навыка' });
    }

    // Обновляем навык
    const { proficient, expertise, custom_bonus, notes } = updates;
    
    const updatedSkill = await pool.query(
      `UPDATE character_skills 
       SET proficient = COALESCE($1, proficient),
           expertise = COALESCE($2, expertise),
           custom_bonus = COALESCE($3, custom_bonus),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE character_id = $5 AND skill_id = $6
       RETURNING *`,
      [proficient, expertise, custom_bonus, notes, id, skillId]
    );

    // Если запись не существует, создаем ее
    if (updatedSkill.rows.length === 0) {
      const newSkill = await pool.query(
        `INSERT INTO character_skills 
         (character_id, skill_id, proficient, expertise, custom_bonus, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, skillId, proficient, expertise, custom_bonus, notes]
      );
      
      return res.json(newSkill.rows[0]);
    }

    res.json(updatedSkill.rows[0]);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Ошибка обновления навыка' });
  }
});

// Массовое обновление навыков (пакетное)
router.post('/:id/skills/batch', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { skills } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Проверяем, что персонаж принадлежит пользователю
    const characterCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Персонаж не найден или нет доступа' });
    }

    // Начинаем транзакцию
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Удаляем все навыки персонажа
      await client.query(
        'DELETE FROM character_skills WHERE character_id = $1',
        [id]
      );

      // Вставляем новые навыки
      const insertedSkills = [];
      for (const skillData of skills) {
        const { skill_id, proficient = false, expertise = false, custom_bonus = 0, notes = '' } = skillData;

        const result = await client.query(
          `INSERT INTO character_skills 
           (character_id, skill_id, proficient, expertise, custom_bonus, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id, skill_id, proficient, expertise, custom_bonus, notes]
        );

        insertedSkills.push(result.rows[0]);
      }

      await client.query('COMMIT');
      res.json(insertedSkills);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error batch updating skills:', error);
    res.status(500).json({ error: 'Ошибка массового обновления навыков' });
  }
});

module.exports = router;