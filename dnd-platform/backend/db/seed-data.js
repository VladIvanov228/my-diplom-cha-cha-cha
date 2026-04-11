const { pool } = require('./index');

async function seedData() {
  try {
    console.log('🌱 Seeding database with initial data...');

    // Очищаем таблицы в правильном порядке (опционально)
    // await pool.query('TRUNCATE classes, races, spells, monsters RESTART IDENTITY CASCADE;');

    // 1. Классы
    console.log('📚 Seeding classes...');
    await pool.query(`
      INSERT INTO classes (name, hit_dice, description) VALUES
      ('Barbarian', 'd12', 'A fierce warrior of primitive background who can enter a battle rage'),
      ('Bard', 'd8', 'An inspiring magician whose power echoes the music of creation'),
      ('Cleric', 'd8', 'A priestly champion who wields divine magic in service of a higher power'),
      ('Druid', 'd8', 'A priest of the Old Faith, wielding the powers of nature'),
      ('Fighter', 'd10', 'A master of martial combat, skilled with a variety of weapons and armor'),
      ('Monk', 'd8', 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection'),
      ('Paladin', 'd10', 'A holy warrior bound to a sacred oath'),
      ('Ranger', 'd10', 'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization'),
      ('Rogue', 'd8', 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies'),
      ('Sorcerer', 'd6', 'A spellcaster who draws on inherent magic from a gift or bloodline'),
      ('Warlock', 'd8', 'A wielder of magic that is derived from a bargain with an extraplanar entity'),
      ('Wizard', 'd6', 'A scholarly magic-user capable of manipulating the structures of reality')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Расы
    console.log('🧬 Seeding races...');
    await pool.query(`
      INSERT INTO races (name, description, ability_bonuses, speed) VALUES
      ('Human', 'Versatile and ambitious, humans are the most common race', '{"strength": 1, "dexterity": 1, "constitution": 1, "intelligence": 1, "wisdom": 1, "charisma": 1}', 30),
      ('Elf', 'A magical people of otherworldly grace, living in the world but not entirely part of it', '{"dexterity": 2}', 30),
      ('Dwarf', 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal', '{"constitution": 2}', 25),
      ('Halfling', 'The diminutive halflings survive in a world full of larger creatures by avoiding notice', '{"dexterity": 2}', 25),
      ('Dragonborn', 'Dragonborn look very much like dragons standing erect in humanoid form', '{"strength": 2, "charisma": 1}', 30),
      ('Gnome', 'A gnome''s energy and enthusiasm for living shines through every inch of his or her tiny body', '{"intelligence": 2}', 25),
      ('Half-Elf', 'Half-elves combine what some say are the best qualities of their elf and human parents', '{"charisma": 2, "two_other": 1}', 30),
      ('Half-Orc', 'Half-orcs'' grayish pigmentation, sloping foreheads, jutting jaws, prominent teeth, and towering builds make their orcish heritage plain for all to see', '{"strength": 2, "constitution": 1}', 30),
      ('Tiefling', 'To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling', '{"intelligence": 1, "charisma": 2}', 30)
      ON CONFLICT (name) DO NOTHING;
    `);

    // 3. Заклинания
    console.log('🔮 Seeding spells...');
    await pool.query(`
      INSERT INTO spells (name, level, school, casting_time, range, components, duration, description, classes) VALUES
      -- Кантрипы
      ('Fire Bolt', 0, 'Evocation', '1 action', '120 feet', 'V, S', 'Instantaneous', 'You hurl a mote of fire at a creature or object within range.', '["Wizard", "Sorcerer"]'),
      ('Light', 0, 'Evocation', '1 action', 'Touch', 'V, M', '1 hour', 'You touch one object that is no larger than 10 feet in any dimension.', '["Bard", "Cleric", "Wizard", "Sorcerer"]'),
      ('Mage Hand', 0, 'Conjuration', '1 action', '30 feet', 'V, S', '1 minute', 'A spectral, floating hand appears at a point you choose within range.', '["Bard", "Wizard", "Sorcerer"]'),
      
      -- 1 уровень
      ('Cure Wounds', 1, 'Evocation', '1 action', 'Touch', 'V, S', 'Instantaneous', 'A creature you touch regains hit points equal to 1d8 + your spellcasting ability modifier.', '["Cleric", "Paladin", "Bard", "Druid"]'),
      ('Magic Missile', 1, 'Evocation', '1 action', '120 feet', 'V, S', 'Instantaneous', 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.', '["Wizard", "Sorcerer"]'),
      ('Shield', 1, 'Abjuration', '1 reaction', 'Self', 'V, S', '1 round', 'An invisible barrier of magical force appears and protects you.', '["Wizard", "Sorcerer"]'),
      ('Bless', 1, 'Enchantment', '1 action', '30 feet', 'V, S, M', 'Concentration, up to 1 minute', 'You bless up to three creatures of your choice within range.', '["Cleric", "Paladin"]'),
      ('Bane', 1, 'Enchantment', '1 action', '30 feet', 'V, S, M', 'Concentration, up to 1 minute', 'Up to three creatures of your choice must make a Charisma saving throw.', '["Cleric"]'),
      
      -- 2 уровень
      ('Misty Step', 2, 'Conjuration', '1 bonus action', 'Self', 'V', 'Instantaneous', 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.', '["Wizard", "Sorcerer", "Warlock"]'),
      ('Invisibility', 2, 'Illusion', '1 action', 'Touch', 'V, S, M', 'Concentration, up to 1 hour', 'A creature you touch becomes invisible until the spell ends.', '["Bard", "Wizard", "Sorcerer", "Warlock"]'),
      
      -- 3 уровень
      ('Fireball', 3, 'Evocation', '1 action', '150 feet', 'V, S, M', 'Instantaneous', 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.', '["Wizard", "Sorcerer"]'),
      ('Lightning Bolt', 3, 'Evocation', '1 action', 'Self (100-foot line)', 'V, S, M', 'Instantaneous', 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose.', '["Wizard", "Sorcerer"]'),
      
      -- 4 уровень
      ('Polymorph', 4, 'Transmutation', '1 action', '60 feet', 'V, S, M', 'Concentration, up to 1 hour', 'This spell transforms a creature that you can see within range into a new form.', '["Bard", "Wizard", "Sorcerer"]'),
      
      -- 5 уровень
      ('Cone of Cold', 5, 'Evocation', '1 action', 'Self (60-foot cone)', 'V, S, M', 'Instantaneous', 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw.', '["Wizard", "Sorcerer"]')
      ON CONFLICT DO NOTHING;
    `);

    // 4. Монстры
    console.log('👾 Seeding monsters...');
    await pool.query(`
      INSERT INTO monsters (name, size, type, alignment, armor_class, hit_points, speed, stats, skills, senses, languages, challenge_rating, actions) VALUES
      ('Goblin', 'Small', 'Humanoid (goblinoid)', 'Neutral Evil', 15, 7, '{"walk": 30}', '{"strength": 8, "dexterity": 14, "constitution": 10, "intelligence": 10, "wisdom": 8, "charisma": 8}', '{"stealth": 6}', '{"darkvision": 60}', 'Common, Goblin', 0.25, 
       '[{"name": "Scimitar", "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."}]'),
      
      ('Orc', 'Medium', 'Humanoid (orc)', 'Chaotic Evil', 13, 15, '{"walk": 30}', '{"strength": 16, "dexterity": 12, "constitution": 16, "intelligence": 7, "wisdom": 11, "charisma": 10}', '{"intimidation": 2}', '{"darkvision": 60}', 'Common, Orc', 0.5,
       '[{"name": "Greataxe", "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage."}]'),
      
      ('Young Red Dragon', 'Large', 'Dragon', 'Chaotic Evil', 18, 178, '{"walk": 40, "fly": 80}', '{"strength": 23, "dexterity": 10, "constitution": 21, "intelligence": 14, "wisdom": 11, "charisma": 19}', '{"perception": 8, "stealth": 4}', '{"darkvision": 120, "blindsight": 30}', 'Common, Draconic', 10,
       '[{"name": "Bite", "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage."}, {"name": "Fire Breath", "description": "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one."}]'),
      
      ('Lich', 'Medium', 'Undead', 'Any Evil', 17, 135, '{"walk": 30}', '{"strength": 11, "dexterity": 16, "constitution": 16, "intelligence": 20, "wisdom": 14, "charisma": 16}', '{"arcana": 19, "history": 13, "insight": 10, "perception": 10}', '{"darkvision": 120, "truesight": 120}', 'Common, Draconic, Elvish, Infernal', 21,
       '[{"name": "Paralyzing Touch", "description": "Melee Spell Attack: +12 to hit, reach 5 ft., one creature. Hit: 10 (3d6) cold damage. The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute."}]'),
      
      ('Mind Flayer', 'Medium', 'Aberration', 'Lawful Evil', 15, 71, '{"walk": 30}', '{"strength": 11, "dexterity": 12, "constitution": 12, "intelligence": 19, "wisdom": 17, "charisma": 17}', '{"arcana": 10, "deception": 9, "insight": 9, "perception": 9, "stealth": 7}', '{"darkvision": 120}', 'Deep Speech, Undercommon, Telepathy 120 ft.', 7,
       '[{"name": "Tentacles", "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 15 (2d10 + 4) psychic damage. If the target is Medium or smaller, it is grappled and must succeed on a DC 15 Intelligence saving throw or be stunned until this grapple ends."}]')
      ON CONFLICT DO NOTHING;
    `);

    // 5. Предыстории
    console.log('📖 Seeding backgrounds...');
    await pool.query(`
      INSERT INTO backgrounds (name, description, skill_proficiencies, tool_proficiencies, languages, equipment, features) VALUES
      ('Acolyte', 'You have spent your life in the service of a temple to a specific god or pantheon.', '["insight", "religion"]', '[]', '["Two of your choice"]', '["Holy symbol", "Prayer book", "5 sticks of incense", "Vestments", "Common clothes", "15 gp"]', '{"name": "Shelter of the Faithful", "description": "You can receive free healing and care at a temple of your faith."}'),
      
      ('Criminal', 'You have a history of breaking the law and have developed a network of contacts.', '["deception", "stealth"]', '["Thieves tools"]', '[]', '["Crowbar", "Dark common clothes", "15 gp"]', '{"name": "Criminal Contact", "description": "You have a reliable and trustworthy contact who acts as your liaison to a network of criminals."}'),
      
      ('Folk Hero', 'You come from a humble background and are known for your courageous deeds.', '["animal handling", "survival"]', '["Land vehicles"]', '[]', '["Shovel", "Iron pot", "Common clothes", "10 gp"]', '{"name": "Rustic Hospitality", "description": "You can find a place to hide, rest, or recuperate among common folk."}'),
      
      ('Noble', 'You understand wealth, power, and privilege. You carry a noble title.', '["history", "persuasion"]', '["One gaming set"]', '["One of your choice"]', '["Fine clothes", "Signet ring", "Scroll of pedigree", "25 gp"]', '{"name": "Position of Privilege", "description": "Thanks to your noble birth, people are inclined to think the best of you."}'),
      
      ('Sage', 'You are curious and well-read, with an insatiable hunger for knowledge.', '["arcana", "history"]', '[]', '["Two of your choice"]', '["Bottle of ink", "Quill", "Small knife", "Letter from dead colleague", "10 gp"]', '{"name": "Researcher", "description": "When you attempt to recall lore about a topic, you often know where to find that information."}'),
      
      ('Soldier', 'You have experience on the battlefield and understand the nature of military life.', '["athletics", "intimidation"]', '["Land vehicles", "One gaming set"]', '[]', '["Insignia of rank", "Trophy from enemy", "Common clothes", "10 gp"]', '{"name": "Military Rank", "description": "Your military rank gives you influence over other soldiers."}')
      ON CONFLICT (name) DO NOTHING;
    `);
  

    // 6. Расовые пассивные навыки
    console.log('✨ Seeding race passive skills...');
    await pool.query(`
      INSERT INTO race_passive_skills (race_id, name, description, effect_type, effect_value) VALUES
      -- Human (id = 1)
      ((SELECT id FROM races WHERE name = 'Human'), 'Адаптивность', 
      'Вы получаете +1 к одному навыку на выбор при создании персонажа.', 
      'utility', '{"bonus": 1, "type": "skill_choice"}'),
      
      -- Elf (id = 2)
      ((SELECT id FROM races WHERE name = 'Elf'), 'Острое зрение', 
      'Вы получаете +2 к проверкам Восприятия в условиях сумерек или темноты.', 
      'exploration', '{"stat": "perception", "bonus": 2, "condition": "in_darkness"}'),
      
      -- Dwarf (id = 3)
      ((SELECT id FROM races WHERE name = 'Dwarf'), 'Каменная стойкость', 
      'Вы имеете сопротивление яду и получаете +2 к спасброскам против яда.', 
      'combat', '{"resistances": ["poison"], "saving_throw_bonus": 2, "saving_throw_type": "constitution"}'),
      
      -- Halfling (id = 4)
      ((SELECT id FROM races WHERE name = 'Halfling'), 'Удача', 
      'Когда вы выбрасываете 1 на d20, вы можете перебросить кость, но обязаны использовать новый результат.', 
      'utility', '{"reroll_on": 1, "die": "d20"}'),
      
      -- Dragonborn (id = 5)
      ((SELECT id FROM races WHERE name = 'Dragonborn'), 'Драконья кровь', 
      'Выберите один тип урона (кислота, холод, огонь, молния, яд). Вы получаете сопротивление этому типу урона.', 
      'combat', '{"resistances": ["choice"], "choice_options": ["acid", "cold", "fire", "lightning", "poison"]}'),
      
      -- Gnome (id = 6)
      ((SELECT id FROM races WHERE name = 'Gnome'), 'Магическая интуиция', 
      'Вы получаете +2 к проверкам Магии, связанным с артефактами.', 
      'exploration', '{"skill": "arcana", "bonus": 2, "condition": "artifacts"}'),
      
      -- Half-Elf (id = 7)
      ((SELECT id FROM races WHERE name = 'Half-Elf'), 'Двойное наследие', 
      'Вы владеете двумя дополнительными навыками на выбор.', 
      'utility', '{"bonus_skills": 2}'),
      
      -- Half-Orc (id = 8)
      ((SELECT id FROM races WHERE name = 'Half-Orc'), 'Запугивающий вид', 
      'Вы получаете +2 к Запугиванию. Вы можете использовать Силу вместо Харизмы при проверках Запугивания.', 
      'social', '{"skill": "intimidation", "bonus": 2, "alternate_stat": "strength"}'),
      
      -- Tiefling (id = 9)
      ((SELECT id FROM races WHERE name = 'Tiefling'), 'Адское сопротивление', 
      'Вы имеете сопротивление огню.', 
      'combat', '{"resistances": ["fire"]}')
      ON CONFLICT (race_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        effect_type = EXCLUDED.effect_type,
        effect_value = EXCLUDED.effect_value;
    `);

    // 7. Классовые навыки
    console.log('⚔️ Seeding class skills...');
    await pool.query(`
      INSERT INTO class_skills (class_id, name, description, skill_level, skill_type, activation_cost, cooldown, range, target, duration, effect_type, effect_value, requirements) VALUES
      
      -- BARBARIAN
      ((SELECT id FROM classes WHERE name = 'Barbarian'), 'Ярость рода', 
      'В состоянии ярости вы получаете +2 к урону и сопротивление физическому урону.', 
      1, 'passive', NULL, 0, 'self', 'self', 'while_raging', 
      'combat', '{"bonus_damage": 2, "resistances": ["bludgeoning", "piercing", "slashing"]}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Barbarian'), 'Боевой клич', 
      'Вы издаете мощный клич. Все враги в радиусе 15 футов должны совершить спасбросок Мудрости (Сл 12) или получить помеху на атаки до конца вашего следующего хода.', 
      2, 'active', '{"type": "action", "value": "action"}', 2, '15ft', 'enemies', '1 round', 
      'debuff', '{"saving_throw": "wisdom", "dc": 12, "effect": "disadvantage_on_attacks"}', NULL),
      
      -- BARD
      ((SELECT id FROM classes WHERE name = 'Bard'), 'Вдохновение', 
      'Вы можете вдохновить союзника в пределах 30 футов. Союзник получает 1d6, который может добавить к одной проверке характеристики, атаке или спасброску.', 
      1, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 0, '30ft', 'ally', '10 minutes', 
      'buff', '{"bonus": "1d6", "uses": "charisma_modifier", "reset": "long_rest"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Bard'), 'Разоружающая насмешка', 
      'Вы осыпаете врага оскорблениями. Цель совершает спасбросок Мудрости (Сл 14) или получает помеху на следующую атаку.', 
      3, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 1, '60ft', 'enemy', '1 round', 
      'debuff', '{"saving_throw": "wisdom", "dc": 14, "effect": "disadvantage_on_next_attack"}', NULL),
      
      -- CLERIC
      ((SELECT id FROM classes WHERE name = 'Cleric'), 'Божественный канал: Изгнание нежити', 
      'Каждая нежить в пределах 30 футов должна совершить спасбросок Мудрости или быть изгнанной на 1 минуту.', 
      2, 'active', '{"type": "action", "value": "action"}', 0, '30ft', 'undead', '1 minute', 
      'control', '{"saving_throw": "wisdom", "effect": "turned"}', '{"level": 2}'),
      
      ((SELECT id FROM classes WHERE name = 'Cleric'), 'Ожог нечестивых', 
      'Вы направляете божественную энергию на врага. Цель получает 3d10 урона излучением, половина при успешном спасброске Ловкости.', 
      3, 'active', '{"type": "action", "value": "action"}', 1, '60ft', 'enemy', 'instant', 
      'damage', '{"damage": "3d10", "damage_type": "radiant", "saving_throw": "dexterity", "dc": 15}', '{"level": 3}'),
      
      -- DRUID
      ((SELECT id FROM classes WHERE name = 'Druid'), 'Дикий облик', 
      'Вы можете превратиться в зверя, которого видели ранее.', 
      2, 'active', '{"type": "action", "value": "action"}', 0, 'self', 'self', 'hours', 
      'utility', '{"uses": 2, "reset": "short_rest"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Druid'), 'Шипящая стена', 
      'Вы создаете стену из шипов длиной 20 футов. Проходящие через нее существа получают 2d4 колющего урона и замедляются.', 
      3, 'active', '{"type": "action", "value": "action"}', 2, '60ft', 'area', '1 minute', 
      'control', '{"damage": "2d4", "damage_type": "piercing", "effect": "slowed", "area": "20ft_wall"}', '{"level": 3}'),
      
      -- FIGHTER
      ((SELECT id FROM classes WHERE name = 'Fighter'), 'Боевой стиль: Защита', 
      'Когда существо, которое вы видите, атакует цель, отличную от вас, вы можете использовать реакцию, чтобы дать помеху этой атаке.', 
      1, 'passive', NULL, 0, 'self', 'self', 'always', 
      'combat', '{"reaction": "impose_disadvantage"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Fighter'), 'Вихрь атак', 
      'Вы совершаете одну атаку по всем врагам в радиусе 5 футов от вас.', 
      3, 'active', '{"type": "action", "value": "action"}', 1, '5ft', 'enemies', 'instant', 
      'damage', '{"attack_all": true}', '{"level": 3}'),
      
      ((SELECT id FROM classes WHERE name = 'Fighter'), 'Победный рывок', 
      'После убийства врага вы можете совершить дополнительную атаку бонусным действием.', 
      5, 'passive', NULL, 0, 'self', 'self', 'always', 
      'combat', '{"extra_attack_on_kill": true}', '{"level": 5}'),
      
      -- MONK
      ((SELECT id FROM classes WHERE name = 'Monk'), 'Оглушающий удар', 
      'Когда вы попадаете по существу атакой рукопашного боя, вы можете потратить 1 очко ци, чтобы попытаться оглушить цель. Цель должна совершить спасбросок Телосложения или быть оглушенной до конца вашего следующего хода.', 
      5, 'active', '{"type": "resource", "value": "ki", "amount": 1}', 0, 'touch', 'enemy', '1 round', 
      'debuff', '{"saving_throw": "constitution", "effect": "stunned"}', '{"level": 5}'),
      
      ((SELECT id FROM classes WHERE name = 'Monk'), 'Поток ци', 
      'После успешной атаки вы можете переместиться на 10 футов, не провоцируя атак.', 
      3, 'active', '{"type": "resource", "value": "ki", "amount": 1}', 0, 'self', 'self', 'instant', 
      'utility', '{"movement": 10, "no_opportunity_attack": true}', '{"level": 3}'),
      
      -- PALADIN
      ((SELECT id FROM classes WHERE name = 'Paladin'), 'Божественная кара', 
      'Когда вы попадаете по существу атакой рукопашного оружия, вы можете потратить ячейку заклинаний, чтобы нанести дополнительный урон излучением: 2d8 за ячейку 1-го уровня + 1d8 за каждый уровень выше.', 
      2, 'active', '{"type": "resource", "value": "spell_slot"}', 0, 'self', 'enemy', 'instant', 
      'damage', '{"base_damage": "2d8", "scaling": "1d8_per_level", "damage_type": "radiant"}', '{"level": 2}'),
      
      ((SELECT id FROM classes WHERE name = 'Paladin'), 'Клятва вражде', 
      'Вы получаете преимущество на атаки против выбранной цели. Союзники получают +1d4 к атакам по этой цели.', 
      3, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 2, '30ft', 'enemy', '1 minute', 
      'buff', '{"advantage": true, "ally_bonus": "1d4"}', '{"level": 3}'),
      
      -- RANGER
      ((SELECT id FROM classes WHERE name = 'Ranger'), 'Метка охотника', 
      'Вы выбираете существо как свою метку. Вы получаете +1d6 урона по цели и имеете преимущество на проверки для ее выслеживания.', 
      2, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 0, '90ft', 'enemy', '1 hour', 
      'buff', '{"bonus_damage": "1d6", "tracking_advantage": true}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Ranger'), 'Ловушка охотника', 
      'Вы устанавливаете ловушку в выбранной точке. Первый враг, наступивший на нее, должен совершить спасбросок Ловкости или получить 2d6 урона и быть замедленным.', 
      5, 'active', '{"type": "action", "value": "action"}', 3, '30ft', 'area', '1 minute', 
      'control', '{"damage": "2d6", "damage_type": "piercing", "saving_throw": "dexterity", "effect": "slowed"}', '{"level": 5}'),
      
      -- ROGUE
      ((SELECT id FROM classes WHERE name = 'Rogue'), 'Скрытая атака', 
      'Один раз в ход вы можете нанести дополнительные 1d6 урона, если у вас есть преимущество на атаку или союзник находится в 5 футах от цели.', 
      1, 'passive', NULL, 0, 'self', 'self', 'always', 
      'combat', '{"bonus_damage": "1d6", "condition": "advantage_or_ally"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Rogue'), 'Удар в спину', 
      'Если вы попадаете по существу атакой с преимуществом, вы наносите дополнительные 2d6 урона, и цель не может использовать реакцию до начала своего следующего хода.', 
      2, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 1, 'touch', 'enemy', 'instant', 
      'damage', '{"bonus_damage": "2d6", "effect": "no_reaction"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Rogue'), 'Дымовая завеса', 
      'Вы бросаете дымовую шашку, создавая облако дыма радиусом 10 футов. Облако дает укрытие и скрывает перемещения.', 
      3, 'active', '{"type": "action", "value": "action"}', 2, '20ft', 'area', '1 minute', 
      'utility', '{"area": "10ft_cloud", "effect": "heavily_obscured", "stealth_advantage": true}', '{"level": 3}'),
      
      -- SORCERER
      ((SELECT id FROM classes WHERE name = 'Sorcerer'), 'Изначальная магия', 
      'Вы получаете бонус +2 к проверкам концентрации и дополнительный кантрип на выбор.', 
      1, 'passive', NULL, 0, 'self', 'self', 'always', 
      'utility', '{"concentration_bonus": 2, "bonus_cantrip": 1}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Sorcerer'), 'Усиленное заклинание', 
      'Когда вы совершаете бросок урона заклинанием, вы можете потратить 2 очка волшебства, чтобы перебросить количество костей урона, равное вашему модификатору Харизмы (минимум 1).', 
      3, 'active', '{"type": "resource", "value": "sorcery_points", "amount": 2}', 0, 'self', 'self', 'instant', 
      'utility', '{"reroll_damage": "charisma_modifier"}', '{"level": 3}'),
      
      ((SELECT id FROM classes WHERE name = 'Sorcerer'), 'Зеркальные копии', 
      'Вы создаете 2 иллюзорные копии себя. Каждый раз, когда враг атакует вас, бросайте d6: 1-3 атака попадает по копии и уничтожает её, 4-6 атака попадает по вам.', 
      5, 'active', '{"type": "action", "value": "action"}', 3, 'self', 'self', '1 minute', 
      'buff', '{"mirror_images": 2, "miss_chance": 50}', '{"level": 5}'),
      
      -- WARLOCK
      ((SELECT id FROM classes WHERE name = 'Warlock'), 'Проклятие ведьмака', 
      'Вы накладываете проклятие на существо в пределах 30 футов. Вы наносите дополнительный 1d6 урона по цели, крит при 19-20, и если цель умирает, вы восстанавливаете хиты, равные уровню колдуна + модификатор Харизмы.', 
      1, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 0, '30ft', 'enemy', '1 hour', 
      'debuff', '{"bonus_damage": "1d6", "crit_range": "19-20", "heal_on_kill": "level+charisma"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Warlock'), 'Мистический рывок', 
      'Вы телепортируетесь на 30 футов в видимое пространство. В момент телепортации вы становитесь невидимым до начала следующего хода.', 
      5, 'active', '{"type": "bonus_action", "value": "bonus_action"}', 2, '30ft', 'self', 'instant', 
      'utility', '{"teleport": 30, "invisible_until_next_turn": true}', '{"level": 5}'),
      
      -- WIZARD
      ((SELECT id FROM classes WHERE name = 'Wizard'), 'Арканое восстановление', 
      'Один раз в день во время короткого отдыха вы можете восстановить ячейки заклинаний, общая сумма уровней которых равна половине вашего уровня волшебника (округление вверх).', 
      1, 'active', '{"type": "action", "value": "action"}', 0, 'self', 'self', 'instant', 
      'utility', '{"restore_spell_slots": "half_level", "uses": 1, "reset": "long_rest"}', NULL),
      
      ((SELECT id FROM classes WHERE name = 'Wizard'), 'Контроль магии', 
      'Вы пытаетесь прервать заклинание врага. Цель должна совершить спасбросок Интеллекта или заклинание будет потеряно без эффекта.', 
      5, 'active', '{"type": "reaction", "value": "reaction"}', 3, '60ft', 'enemy', 'instant', 
      'control', '{"counterspell": true, "saving_throw": "intelligence"}', '{"level": 5}')
      ON CONFLICT (class_id, name) DO UPDATE SET
        description = EXCLUDED.description,
        skill_level = EXCLUDED.skill_level,
        skill_type = EXCLUDED.skill_type,
        activation_cost = EXCLUDED.activation_cost,
        cooldown = EXCLUDED.cooldown,
        range = EXCLUDED.range,
        target = EXCLUDED.target,
        duration = EXCLUDED.duration,
        effect_type = EXCLUDED.effect_type,
        effect_value = EXCLUDED.effect_value,
        requirements = EXCLUDED.requirements;
    `);

console.log('✨ Skills seeded successfully!');

    console.log('✅ Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedData();