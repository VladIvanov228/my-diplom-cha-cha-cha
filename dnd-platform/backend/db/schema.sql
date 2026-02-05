-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Кампании
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dm_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участники кампаний
CREATE TABLE campaign_players (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, user_id)
);

-- Персонажи
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    class VARCHAR(100),
    race VARCHAR(100),
    background VARCHAR(100),
    alignment VARCHAR(50),
    
    -- Характеристики
    strength INTEGER DEFAULT 10,
    dexterity INTEGER DEFAULT 10,
    constitution INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    wisdom INTEGER DEFAULT 10,
    charisma INTEGER DEFAULT 10,
    
    -- Боевые параметры
    hit_points INTEGER DEFAULT 10,
    armor_class INTEGER DEFAULT 10,
    
    -- Связи
    user_id INTEGER REFERENCES users(id),
    campaign_id INTEGER REFERENCES campaigns(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заклинания (SRD данные)
CREATE TABLE spells (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 0,
    school VARCHAR(100),
    casting_time VARCHAR(100),
    range VARCHAR(100),
    components VARCHAR(100),
    duration VARCHAR(100),
    description TEXT,
    classes JSONB -- Массив классов, которые могут использовать заклинание
);

-- Монстры (SRD данные)
CREATE TABLE monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    type VARCHAR(100),
    alignment VARCHAR(100),
    armor_class INTEGER,
    hit_points INTEGER,
    speed JSONB, -- {walk: 30, fly: 60}
    stats JSONB, -- {strength: 16, dexterity: 12, ...}
    skills JSONB,
    senses JSONB,
    languages TEXT,
    challenge_rating DECIMAL(3,1),
    actions JSONB,
    legendary_actions JSONB
);

-- Карты
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    width INTEGER DEFAULT 20,
    height INTEGER DEFAULT 20,
    tiles JSONB, -- Данные тайлов
    objects JSONB, -- Размещенные объекты
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Игровые сессии
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    current_map_id INTEGER REFERENCES maps(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
<<<<<<< HEAD
);

-- Заклинания (SRD данные)
CREATE TABLE IF NOT EXISTS spells (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 0,
    school VARCHAR(100),
    casting_time VARCHAR(100),
    range VARCHAR(100),
    components VARCHAR(100),
    duration VARCHAR(100),
    description TEXT,
    classes JSONB
);

-- Монстры (SRD данные)
CREATE TABLE IF NOT EXISTS monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50),
    type VARCHAR(100),
    alignment VARCHAR(100),
    armor_class INTEGER,
    hit_points INTEGER,
    speed JSONB,
    stats JSONB,
    skills JSONB,
    senses JSONB,
    languages TEXT,
    challenge_rating DECIMAL(3,1),
    actions JSONB,
    legendary_actions JSONB
);

-- Карты
CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    width INTEGER DEFAULT 20,
    height INTEGER DEFAULT 20,
    tiles JSONB,
    objects JSONB,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Дополняем таблицу characters
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS proficiency_bonus INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS inspiration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS hit_dice VARCHAR(20),
ADD COLUMN IF NOT EXISTS personality_traits TEXT,
ADD COLUMN IF NOT EXISTS ideals TEXT,
ADD COLUMN IF NOT EXISTS bonds TEXT,
ADD COLUMN IF NOT EXISTS flaws TEXT,
ADD COLUMN IF NOT EXISTS features TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Таблица навыков персонажа
CREATE TABLE character_skills (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_id VARCHAR(50) NOT NULL,
  proficient BOOLEAN DEFAULT false,
  expertise BOOLEAN DEFAULT false,
  custom_bonus INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, skill_id)
);

-- Снаряжение
CREATE TABLE IF NOT EXISTS character_equipment (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    weight DECIMAL(5,2),
    description TEXT,
    equipped BOOLEAN DEFAULT false
);

-- Заклинания
CREATE TABLE IF NOT EXISTS character_spells (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    spell_id INTEGER REFERENCES spells(id),
    prepared BOOLEAN DEFAULT false,
    CONSTRAINT unique_character_spell UNIQUE(character_id, spell_id)
);

-- Классы (справочник)
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    hit_dice VARCHAR(10),
    description TEXT,
    features JSONB
);

-- Расы (справочник)
CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ability_bonuses JSONB, -- {strength: 2, dexterity: 1, ...}
    speed INTEGER DEFAULT 30,
    features JSONB
);

-- Предыстории (справочник)
CREATE TABLE IF NOT EXISTS backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    skill_proficiencies JSONB, -- Массив навыков
    tool_proficiencies JSONB,
    languages JSONB,
    equipment JSONB,
    features JSONB
);

-- СНАРЯЖЕНИЕ И ИНВЕНТАРЬ

-- 1. Типы предметов (справочник)
CREATE TABLE IF NOT EXISTS item_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- weapon, armor, tool, consumable, etc.
    description TEXT
);

-- 2. Предметы (справочник D&D 5e)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type_id INTEGER REFERENCES item_types(id),
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 0, -- в фунтах
    cost DECIMAL(10,2) DEFAULT 0, -- в золотых монетах
    properties JSONB, -- свойства предмета
    rarity VARCHAR(50) DEFAULT 'common',
    requires_attunement BOOLEAN DEFAULT false,
    attunement_conditions TEXT
);

-- 3. Инвентарь персонажа
CREATE TABLE IF NOT EXISTS character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    custom_name VARCHAR(255), -- если предмет кастомный
    custom_description TEXT,
    quantity INTEGER DEFAULT 1,
    weight DECIMAL(5,2), -- вес одного предмета
    cost DECIMAL(10,2), -- стоимость одного предмета
    equipped BOOLEAN DEFAULT false,
    equipped_slot VARCHAR(50), -- main_hand, off_hand, head, chest, etc.
    attuned BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Проверка: либо стандартный предмет, либо кастомный
    CONSTRAINT valid_item CHECK (
        (item_id IS NOT NULL) OR 
        (custom_name IS NOT NULL AND custom_description IS NOT NULL)
    )
);

-- 4. Корабли и транспорт (опционально)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- cart, wagon, ship, etc.
    speed INTEGER,
    capacity DECIMAL(10,2), -- грузоподъемность
    cost DECIMAL(10,2),
    description TEXT
);

-- 5. Владение транспортом
CREATE TABLE IF NOT EXISTS character_vehicles (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id),
    custom_name VARCHAR(255),
    condition VARCHAR(50) DEFAULT 'good',
    notes TEXT
);

-- Индексы для быстрого поиска
CREATE INDEX idx_character_skills_character_id ON character_skills(character_id);
CREATE INDEX idx_character_skills_skill_id ON character_skills(skill_id);
CREATE INDEX idx_character_inventory_character_id ON character_inventory(character_id);
CREATE INDEX idx_character_inventory_equipped ON character_inventory(equipped) WHERE equipped = true;
CREATE INDEX idx_items_type_id ON items(type_id);
CREATE INDEX idx_items_rarity ON items(rarity);