-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

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
    classes JSONB
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
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    width INTEGER DEFAULT 20,
    height INTEGER DEFAULT 20,
    tiles JSONB,
    objects JSONB,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Игровые сессии
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    current_map_id INTEGER REFERENCES maps(id),
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
CREATE TABLE IF NOT EXISTS character_skills (
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

-- Заклинания персонажа
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
    ability_bonuses JSONB,
    speed INTEGER DEFAULT 30,
    features JSONB
);

-- Предыстории (справочник)
CREATE TABLE IF NOT EXISTS backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    skill_proficiencies JSONB,
    tool_proficiencies JSONB,
    languages JSONB,
    equipment JSONB,
    features JSONB
);

-- Таблица снаряжения персонажа
CREATE TABLE IF NOT EXISTS character_equipment (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    weight DECIMAL(6, 2),
    cost DECIMAL(10, 2),
    cost_unit VARCHAR(10) DEFAULT 'gp',
    description TEXT,
    properties JSONB,
    damage VARCHAR(50),
    damage_type VARCHAR(50),
    range_normal INTEGER,
    range_long INTEGER,
    armor_class_bonus INTEGER,
    strength_requirement INTEGER,
    stealth_disadvantage BOOLEAN DEFAULT false,
    equipped BOOLEAN DEFAULT false,
    slot VARCHAR(50),
    attunement BOOLEAN DEFAULT false,
    attuned BOOLEAN DEFAULT false,
    rarity VARCHAR(50) DEFAULT 'common',
    is_magical BOOLEAN DEFAULT false,
    spell_scroll_spell_id INTEGER REFERENCES spells(id),
    uses_current INTEGER,
    uses_max INTEGER,
    recharge VARCHAR(50),
    container_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем внешний ключ для container_id отдельно
ALTER TABLE character_equipment 
ADD CONSTRAINT fk_equipment_container 
FOREIGN KEY (container_id) 
REFERENCES character_equipment(id) 
ON DELETE SET NULL;

-- Валюта персонажа
CREATE TABLE IF NOT EXISTS character_currency (
    character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    copper BIGINT DEFAULT 0,
    silver BIGINT DEFAULT 0,
    electrum BIGINT DEFAULT 0,
    gold BIGINT DEFAULT 0,
    platinum BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Предметы в контейнерах
CREATE TABLE IF NOT EXISTS container_contents (
    id SERIAL PRIMARY KEY,
    container_id INTEGER NOT NULL REFERENCES character_equipment(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES character_equipment(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    UNIQUE(container_id, item_id)
);

-- Зачарования предметов
CREATE TABLE IF NOT EXISTS item_enchantments (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES character_equipment(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    effect JSONB,
    bonus_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица расовых пассивных навыков
CREATE TABLE IF NOT EXISTS race_passive_skills (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    effect_type VARCHAR(50) NOT NULL CHECK (effect_type IN ('combat', 'exploration', 'social', 'utility')),
    effect_value JSONB NOT NULL,
    is_passive BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(race_id)
);

-- Таблица классовых навыков
CREATE TABLE IF NOT EXISTS class_skills (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    skill_level INTEGER DEFAULT 1,
    skill_type VARCHAR(20) NOT NULL CHECK (skill_type IN ('passive', 'active')),
    activation_cost JSONB,
    cooldown INTEGER DEFAULT 0,
    range VARCHAR(50) DEFAULT 'self',
    target VARCHAR(50) DEFAULT 'self',
    duration VARCHAR(50) DEFAULT 'instant',
    saving_throw VARCHAR(50),
    effect_type VARCHAR(50) NOT NULL,
    effect_value JSONB NOT NULL,
    requirements JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, name)
);

-- Таблица изученных навыков персонажа
CREATE TABLE IF NOT EXISTS character_class_skills (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES class_skills(id) ON DELETE CASCADE,
    is_learned BOOLEAN DEFAULT true,
    current_cooldown INTEGER DEFAULT 0,
    uses_remaining INTEGER,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, skill_id)
);

-- Бои (активные сражения)
CREATE TABLE IF NOT EXISTS battles (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    map_id INTEGER REFERENCES maps(id) ON DELETE SET NULL,
    combatants JSONB NOT NULL,
    current_turn INTEGER DEFAULT 0,
    round INTEGER DEFAULT 1,
    state VARCHAR(20) DEFAULT 'waiting',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    winner VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем недостающие поля в campaigns (ИСПРАВЛЕНО)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS map_data JSONB,
ADD COLUMN IF NOT EXISTS active_battle JSONB;

-- Добавляем role в campaign_players
ALTER TABLE campaign_players 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'player',
ADD COLUMN IF NOT EXISTS character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL;

-- Добавляем fog_of_war в maps
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS grid_type VARCHAR(20) DEFAULT 'square',
ADD COLUMN IF NOT EXISTS background_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS fog_of_war JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Сессии пользователей (для отслеживания онлайн-статуса)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    socket_id VARCHAR(255),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Удаляем старую таблицу если есть
DROP TABLE IF EXISTS campaign_invites CASCADE;

-- Создаем таблицу пригласительных кодов
CREATE TABLE campaign_invites (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  invite_code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id)
);

-- Индекс для быстрого поиска по коду
CREATE INDEX IF NOT EXISTS idx_campaign_invites_code ON campaign_invites(invite_code);

-- Таблица сообщений чата
CREATE TABLE IF NOT EXISTS campaign_messages (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'chat',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для сообщений
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_created_at ON campaign_messages(created_at DESC);

-- Лог бросков кубиков
CREATE TABLE IF NOT EXISTS dice_rolls (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
    formula VARCHAR(100) NOT NULL,
    result JSONB NOT NULL,
    reason VARCHAR(255),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Токены на карте (для отслеживания позиций)
CREATE TABLE IF NOT EXISTS map_tokens (
    id SERIAL PRIMARY KEY,
    map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL,
    entity_id INTEGER,
    name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    size INTEGER DEFAULT 1,
    color VARCHAR(20),
    image_url VARCHAR(500),
    is_hidden BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Эффекты (статусы на персонажах/монстрах)
CREATE TABLE IF NOT EXISTS active_effects (
    id SERIAL PRIMARY KEY,
    battle_id INTEGER REFERENCES battles(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    effect_name VARCHAR(100) NOT NULL,
    effect_data JSONB NOT NULL,
    duration INTEGER,
    rounds_remaining INTEGER,
    source_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггеры к таблицам
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_maps_updated_at ON maps;
CREATE TRIGGER update_maps_updated_at
    BEFORE UPDATE ON maps
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_map_tokens_updated_at ON map_tokens;
CREATE TRIGGER update_map_tokens_updated_at
    BEFORE UPDATE ON map_tokens
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- ДОБАВЛЯЕМ НОВЫЕ ТАБЛИЦЫ И ПОЛЯ

-- PIN-код для входа DM в кампанию
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS dm_pin VARCHAR(6);

-- Шаблоны врагов (предустановленные)
CREATE TABLE IF NOT EXISTS enemy_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'humanoid',
    size VARCHAR(20) DEFAULT 'medium',
    alignment VARCHAR(50) DEFAULT 'neutral evil',
    armor_class INTEGER DEFAULT 10,
    hit_points INTEGER DEFAULT 10,
    hit_dice VARCHAR(20) DEFAULT '1d8',
    speed INTEGER DEFAULT 30,
    strength INTEGER DEFAULT 10,
    dexterity INTEGER DEFAULT 10,
    constitution INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    wisdom INTEGER DEFAULT 10,
    charisma INTEGER DEFAULT 10,
    skills JSONB DEFAULT '{}',
    senses VARCHAR(100) DEFAULT 'passive Perception 10',
    languages VARCHAR(100) DEFAULT 'Common',
    challenge_rating VARCHAR(10) DEFAULT '1/4',
    xp INTEGER DEFAULT 50,
    actions JSONB DEFAULT '[]',
    special_abilities JSONB DEFAULT '[]',
    damage_vulnerabilities VARCHAR(255),
    damage_resistances VARCHAR(255),
    damage_immunities VARCHAR(255),
    condition_immunities VARCHAR(255),
    is_template BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Кастомные враги (экземпляры на карте)
CREATE TABLE IF NOT EXISTS map_enemies (
    id SERIAL PRIMARY KEY,
    map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES enemy_templates(id),
    name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    size INTEGER DEFAULT 1,
    hit_points INTEGER DEFAULT 10,
    max_hit_points INTEGER DEFAULT 10,
    armor_class INTEGER DEFAULT 10,
    initiative INTEGER DEFAULT 0,
    is_alive BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Роль пользователя при входе в кампанию
ALTER TABLE campaign_players ADD COLUMN IF NOT EXISTS entry_role VARCHAR(20) DEFAULT 'player';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_map_enemies_map_id ON map_enemies(map_id);
CREATE INDEX IF NOT EXISTS idx_map_enemies_template_id ON map_enemies(template_id);
CREATE INDEX IF NOT EXISTS idx_enemy_templates_type ON enemy_templates(type);
-- Комментарии к таблицам
COMMENT ON TABLE campaign_messages IS 'Сообщения чата в кампании';
COMMENT ON TABLE battles IS 'Активные бои в кампании';
COMMENT ON TABLE user_sessions IS 'Активные сессии пользователей';
COMMENT ON TABLE campaign_invites IS 'Приглашения игроков в кампанию';
COMMENT ON TABLE dice_rolls IS 'История бросков кубиков';
COMMENT ON TABLE map_tokens IS 'Токены на игровых картах';
COMMENT ON TABLE active_effects IS 'Активные эффекты в бою';
COMMENT ON TABLE race_passive_skills IS 'Расовые пассивные навыки (1 навык на расу)';
COMMENT ON TABLE class_skills IS 'Классовые навыки (пассивные и активные)';
COMMENT ON TABLE character_class_skills IS 'Изученные навыки конкретного персонажа';

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_character_skills_character_id ON character_skills(character_id);
CREATE INDEX IF NOT EXISTS idx_character_skills_skill_id ON character_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_equipment_character_id ON character_equipment(character_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON character_equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_equipped ON character_equipment(equipped) WHERE equipped = true;
CREATE INDEX IF NOT EXISTS idx_equipment_slot ON character_equipment(slot) WHERE equipped = true;
CREATE INDEX IF NOT EXISTS idx_equipment_container_id ON character_equipment(container_id);
CREATE INDEX IF NOT EXISTS idx_container_contents_container_id ON container_contents(container_id);
CREATE INDEX IF NOT EXISTS idx_container_contents_item_id ON container_contents(item_id);
CREATE INDEX IF NOT EXISTS idx_item_enchantments_item_id ON item_enchantments(item_id);
CREATE INDEX IF NOT EXISTS idx_race_passive_skills_race_id ON race_passive_skills(race_id);
CREATE INDEX IF NOT EXISTS idx_class_skills_class_id ON class_skills(class_id);
CREATE INDEX IF NOT EXISTS idx_character_class_skills_character_id ON character_class_skills(character_id);
CREATE INDEX IF NOT EXISTS idx_character_class_skills_skill_id ON character_class_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_battles_campaign_id ON battles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_battles_state ON battles(state);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_campaign_id ON user_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_campaign_id ON campaign_invites(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_campaign_id ON dice_rolls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_map_tokens_map_id ON map_tokens(map_id);
CREATE INDEX IF NOT EXISTS idx_active_effects_battle_id ON active_effects(battle_id);