const { pool } = require('./index');

async function seedEquipment() {
  try {
    console.log('Seeding equipment data...');

    // 1. Типы предметов
    const itemTypes = [
      { name: 'Простое оружие ближнего боя', category: 'weapon' },
      { name: 'Военное оружие ближнего боя', category: 'weapon' },
      { name: 'Простое оружие дальнего боя', category: 'weapon' },
      { name: 'Военное оружие дальнего боя', category: 'weapon' },
      { name: 'Лёгкие доспехи', category: 'armor' },
      { name: 'Средние доспехи', category: 'armor' },
      { name: 'Тяжёлые доспехи', category: 'armor' },
      { name: 'Щиты', category: 'armor' },
      { name: 'Инструменты', category: 'tool' },
      { name: 'Наборы инструментов', category: 'tool' },
      { name: 'Расходные материалы', category: 'consumable' },
      { name: 'Магические предметы', category: 'magic' },
      { name: 'Разное', category: 'misc' }
    ];

    for (const type of itemTypes) {
      await pool.query(
        'INSERT INTO item_types (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [type.name, type.category]
      );
    }

    // 2. Предметы (основные из D&D 5e)
    const items = [
      // Оружие
      { name: 'Короткий меч', type: 'Простое оружие ближнего боя', weight: 2, cost: 10, 
        properties: { damage: '1d6', damage_type: 'колющий', properties: ['легкое', 'фокусировка'] } },
      { name: 'Длинный меч', type: 'Военное оружие ближнего боя', weight: 3, cost: 15, 
        properties: { damage: '1d8', damage_type: 'рубящий', properties: ['универсальное (1d10)'] } },
      { name: 'Посох', type: 'Простое оружие ближнего боя', weight: 4, cost: 5, 
        properties: { damage: '1d6', damage_type: 'дробящий', properties: [] } },
      { name: 'Кинжал', type: 'Простое оружие ближнего боя', weight: 1, cost: 2, 
        properties: { damage: '1d4', damage_type: 'колющий', properties: ['легкое', 'метательное (дис. 20/60)', 'фокусировка'] } },
      { name: 'Длинный лук', type: 'Военное оружие дальнего боя', weight: 2, cost: 50, 
        properties: { damage: '1d8', damage_type: 'колющий', properties: ['боеприпасы (дис. 150/600)', 'двуручное'] } },
      
      // Доспехи
      { name: 'Кожаный доспех', type: 'Лёгкие доспехи', weight: 10, cost: 10, 
        properties: { armor_class: 11, stealth_disadvantage: false, strength_requirement: null } },
      { name: 'Кольчуга', type: 'Средние доспехи', weight: 20, cost: 50, 
        properties: { armor_class: 16, stealth_disadvantage: true, strength_requirement: null } },
      { name: 'Латный доспех', type: 'Тяжёлые доспехи', weight: 65, cost: 1500, 
        properties: { armor_class: 18, stealth_disadvantage: true, strength_requirement: 15 } },
      { name: 'Щит', type: 'Щиты', weight: 6, cost: 10, 
        properties: { armor_class_bonus: 2 } },
      
      // Инструменты и расходники
      { name: 'Набор для взлома', type: 'Инструменты', weight: 1, cost: 25, 
        properties: { description: 'Набор отмычек и инструментов для взлома замков' } },
      { name: 'Аптечка', type: 'Наборы инструментов', weight: 3, cost: 5, 
        properties: { description: 'Набор для оказания первой помощи' } },
      { name: 'Зелье лечения', type: 'Расходные материалы', weight: 0.5, cost: 50, 
        properties: { description: 'Восстанавливает 2d4+2 хит-поинтов', rarity: 'common' } },
      { name: 'Антитоксин', type: 'Расходные материалы', weight: 0, cost: 50, 
        properties: { description: 'Дает преимущество на спасброски от яда на 1 час' } },
      
      // Магические предметы (примеры)
      { name: 'Меч +1', type: 'Магические предметы', weight: 3, cost: 500, rarity: 'uncommon',
        properties: { damage: '1d8+1', damage_type: 'рубящий', magic_bonus: 1, requires_attunement: false } },
      { name: 'Кольцо защиты', type: 'Магические предметы', weight: 0, cost: 1000, rarity: 'rare',
        properties: { armor_class_bonus: 1, requires_attunement: true } }
    ];

    for (const item of items) {
      // Находим ID типа
      const typeResult = await pool.query('SELECT id FROM item_types WHERE name = $1', [item.type]);
      if (typeResult.rows.length === 0) continue;

      await pool.query(
        `INSERT INTO items (name, type_id, description, weight, cost, properties, rarity, requires_attunement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO NOTHING`,
        [
          item.name,
          typeResult.rows[0].id,
          item.properties?.description || null,
          item.weight,
          item.cost,
          item.properties,
          item.rarity || 'common',
          item.properties?.requires_attunement || false
        ]
      );
    }

    // 3. Транспорт
    const vehicles = [
      { name: 'Повозка', type: 'cart', speed: 30, capacity: 400, cost: 35, description: 'Обычная повозка, запряженная лошадью' },
      { name: 'Корабль', type: 'ship', speed: 20, capacity: 5000, cost: 10000, description: 'Парусное судно среднего размера' },
      { name: 'Лодка', type: 'boat', speed: 15, capacity: 300, cost: 50, description: 'Небольшая гребная лодка' }
    ];

    for (const vehicle of vehicles) {
      await pool.query(
        'INSERT INTO vehicles (name, type, speed, capacity, cost, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name) DO NOTHING',
        [vehicle.name, vehicle.type, vehicle.speed, vehicle.capacity, vehicle.cost, vehicle.description]
      );
    }

    console.log('✅ Equipment data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding equipment:', error);
  } finally {
    await pool.end();
  }
}

seedEquipment();