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

// ============================================
// 8. НАПОЛНЕНИЕ ШАБЛОНОВ ВРАГОВ
// ============================================
console.log('👾 Seeding enemy templates...');

const enemies = [
  // ГУМАНОИДЫ
  {
    name: 'Бандит', type: 'humanoid', size: 'medium', alignment: 'neutral evil',
    armor_class: 12, hit_points: 11, hit_dice: '2d8+2', speed: 30,
    strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
    skills: '{}', senses: 'passive Perception 10', languages: 'Common',
    challenge_rating: '1/8', xp: 25,
    actions: '[{"name":"Scimitar","type":"melee_weapon","hit_bonus":3,"damage":"1d6+1","damage_type":"slashing","reach":5},{"name":"Light Crossbow","type":"ranged_weapon","hit_bonus":3,"damage":"1d8+1","damage_type":"piercing","range":"80/320"}]',
    special_abilities: '[]'
  },
  {
    name: 'Культист', type: 'humanoid', size: 'medium', alignment: 'neutral evil',
    armor_class: 12, hit_points: 9, hit_dice: '2d8', speed: 30,
    strength: 11, dexterity: 12, constitution: 10, intelligence: 10, wisdom: 11, charisma: 10,
    skills: '{"deception":2,"religion":2}', senses: 'passive Perception 10', languages: 'Common',
    challenge_rating: '1/8', xp: 25,
    actions: '[{"name":"Scimitar","type":"melee_weapon","hit_bonus":3,"damage":"1d6+1","damage_type":"slashing","reach":5}]',
    special_abilities: '[{"name":"Dark Devotion","description":"The cultist has advantage on saving throws against being charmed or frightened.","passive":true}]'
  },
  {
    name: 'Стражник', type: 'humanoid', size: 'medium', alignment: 'lawful neutral',
    armor_class: 16, hit_points: 11, hit_dice: '2d8+2', speed: 30,
    strength: 13, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 11, charisma: 10,
    skills: '{"perception":2}', senses: 'passive Perception 12', languages: 'Common',
    challenge_rating: '1/8', xp: 25,
    actions: '[{"name":"Spear","type":"melee_weapon","hit_bonus":3,"damage":"1d6+1","damage_type":"piercing","reach":5}]',
    special_abilities: '[]'
  },
  {
    name: 'Ассасин', type: 'humanoid', size: 'medium', alignment: 'neutral evil',
    armor_class: 15, hit_points: 78, hit_dice: '12d8+24', speed: 30,
    strength: 11, dexterity: 16, constitution: 14, intelligence: 13, wisdom: 11, charisma: 10,
    skills: '{"acrobatics":6,"deception":3,"perception":3,"stealth":9}', senses: 'passive Perception 13', languages: 'Thieves cant, Common',
    challenge_rating: '8', xp: 3900,
    actions: '[{"name":"Shortsword","type":"melee_weapon","hit_bonus":6,"damage":"1d6+3","damage_type":"piercing","reach":5},{"name":"Light Crossbow","type":"ranged_weapon","hit_bonus":6,"damage":"1d8+3","damage_type":"piercing","range":"80/320"}]',
    special_abilities: '[{"name":"Assassinate","description":"During its first turn, the assassin has advantage on attack rolls against any creature that hasn\'t taken a turn. Any hit the assassin scores against a surprised creature is a critical hit.","passive":true},{"name":"Sneak Attack","description":"Once per turn, the assassin deals an extra 14 (4d6) damage when it hits a target with a weapon attack and has advantage on the attack roll.","passive":true}]'
  },
  {
    name: 'Вор', type: 'humanoid', size: 'medium', alignment: 'any non-good',
    armor_class: 12, hit_points: 10, hit_dice: '3d8-3', speed: 30,
    strength: 9, dexterity: 14, constitution: 9, intelligence: 10, wisdom: 12, charisma: 11,
    skills: '{"stealth":4,"sleight_of_hand":4,"perception":3}', senses: 'passive Perception 13', languages: 'Common, Thieves cant',
    challenge_rating: '1/4', xp: 50,
    actions: '[{"name":"Dagger","type":"melee_weapon","hit_bonus":4,"damage":"1d4+2","damage_type":"piercing","reach":5}]',
    special_abilities: '[{"name":"Cunning Action","description":"The thug can use a bonus action to Dash, Disengage, or Hide.","passive":true}]'
  },

  // ЗВЕРИ
  {
    name: 'Гигантская крыса', type: 'beast', size: 'small', alignment: 'unaligned',
    armor_class: 12, hit_points: 7, hit_dice: '2d6', speed: 30,
    strength: 7, dexterity: 15, constitution: 11, intelligence: 2, wisdom: 10, charisma: 4,
    skills: '{"perception":2}', senses: 'darkvision 60 ft., passive Perception 12', languages: '',
    challenge_rating: '1/8', xp: 25,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":4,"damage":"1d4+2","damage_type":"piercing","reach":5}]',
    special_abilities: '[{"name":"Keen Smell","description":"The rat has advantage on Wisdom (Perception) checks that rely on smell.","passive":true},{"name":"Pack Tactics","description":"The rat has advantage on an attack roll against a creature if at least one of the rat\'s allies is within 5 feet.","passive":true}]'
  },
  {
    name: 'Волк', type: 'beast', size: 'medium', alignment: 'unaligned',
    armor_class: 13, hit_points: 11, hit_dice: '2d8+2', speed: 40,
    strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6,
    skills: '{"perception":3,"stealth":4}', senses: 'passive Perception 13', languages: '',
    challenge_rating: '1/4', xp: 50,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":4,"damage":"2d4+2","damage_type":"piercing","reach":5}]',
    special_abilities: '[{"name":"Keen Hearing and Smell","description":"The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.","passive":true},{"name":"Pack Tactics","description":"The wolf has advantage on attack rolls against a creature if at least one ally is within 5 feet.","passive":true}]'
  },
  {
    name: 'Медведь', type: 'beast', size: 'large', alignment: 'unaligned',
    armor_class: 11, hit_points: 34, hit_dice: '4d10+12', speed: 40,
    strength: 19, dexterity: 10, constitution: 16, intelligence: 2, wisdom: 13, charisma: 7,
    skills: '{"perception":3}', senses: 'passive Perception 13', languages: '',
    challenge_rating: '1', xp: 200,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":5,"damage":"1d8+4","damage_type":"piercing","reach":5},{"name":"Claws","type":"melee_weapon","hit_bonus":5,"damage":"2d6+4","damage_type":"slashing","reach":5}]',
    special_abilities: '[{"name":"Keen Smell","description":"The bear has advantage on Wisdom (Perception) checks that rely on smell.","passive":true}]'
  },
  {
    name: 'Гигантский паук', type: 'beast', size: 'large', alignment: 'unaligned',
    armor_class: 14, hit_points: 26, hit_dice: '4d10+4', speed: 30,
    strength: 14, dexterity: 16, constitution: 12, intelligence: 2, wisdom: 11, charisma: 4,
    skills: '{"stealth":7}', senses: 'blindsight 10 ft., darkvision 60 ft., passive Perception 10', languages: '',
    challenge_rating: '1', xp: 200,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":5,"damage":"1d8+3","damage_type":"piercing","reach":5}]',
    special_abilities: '[{"name":"Spider Climb","description":"The spider can climb difficult surfaces, including upside down on ceilings.","passive":true}]'
  },
  {
    name: 'Ядовитая змея', type: 'beast', size: 'tiny', alignment: 'unaligned',
    armor_class: 13, hit_points: 2, hit_dice: '1d4', speed: 30,
    strength: 2, dexterity: 16, constitution: 11, intelligence: 1, wisdom: 10, charisma: 3,
    skills: '{"perception":2}', senses: 'blindsight 10 ft., passive Perception 12', languages: '',
    challenge_rating: '1/8', xp: 25,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":5,"damage":"1","damage_type":"piercing","reach":5,"saving_throw":{"ability":"constitution","dc":10,"success_effect":"half damage"}}]',
    special_abilities: '[]'
  },
  {
    name: 'Летучая мышь', type: 'beast', size: 'tiny', alignment: 'unaligned',
    armor_class: 12, hit_points: 1, hit_dice: '1d4-1', speed: 5,
    strength: 2, dexterity: 15, constitution: 8, intelligence: 2, wisdom: 12, charisma: 4,
    skills: '{}', senses: 'blindsight 60 ft., passive Perception 11', languages: '',
    challenge_rating: '0', xp: 10,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":0,"damage":"1","damage_type":"piercing","reach":5}]',
    special_abilities: '[{"name":"Echolocation","description":"The bat can\'t use its blindsight while deafened.","passive":true},{"name":"Keen Hearing","description":"The bat has advantage on Wisdom (Perception) checks that rely on hearing.","passive":true}]'
  },

  // ГОБЛИНОИДЫ
  {
    name: 'Гоблин', type: 'humanoid', size: 'small', alignment: 'neutral evil',
    armor_class: 15, hit_points: 7, hit_dice: '2d6', speed: 30,
    strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8,
    skills: '{"stealth":6}', senses: 'darkvision 60 ft., passive Perception 9', languages: 'Common, Goblin',
    challenge_rating: '1/4', xp: 50,
    actions: '[{"name":"Scimitar","type":"melee_weapon","hit_bonus":4,"damage":"1d6+2","damage_type":"slashing","reach":5},{"name":"Shortbow","type":"ranged_weapon","hit_bonus":4,"damage":"1d6+2","damage_type":"piercing","range":"80/320"}]',
    special_abilities: '[{"name":"Nimble Escape","description":"The goblin can take the Disengage or Hide action as a bonus action on each of its turns.","passive":true}]'
  },
  {
    name: 'Хобгоблин', type: 'humanoid', size: 'medium', alignment: 'lawful evil',
    armor_class: 18, hit_points: 11, hit_dice: '2d8+2', speed: 30,
    strength: 13, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 9,
    skills: '{}', senses: 'darkvision 60 ft., passive Perception 10', languages: 'Common, Goblin',
    challenge_rating: '1/2', xp: 100,
    actions: '[{"name":"Longsword","type":"melee_weapon","hit_bonus":3,"damage":"1d8+1","damage_type":"slashing","reach":5},{"name":"Longbow","type":"ranged_weapon","hit_bonus":3,"damage":"1d8+1","damage_type":"piercing","range":"150/600"}]',
    special_abilities: '[{"name":"Martial Advantage","description":"Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits if that creature is within 5 feet of an ally.","passive":true}]'
  },

  // ОРКИ
  {
    name: 'Орк', type: 'humanoid', size: 'medium', alignment: 'chaotic evil',
    armor_class: 13, hit_points: 15, hit_dice: '2d8+6', speed: 30,
    strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10,
    skills: '{"intimidation":2}', senses: 'darkvision 60 ft., passive Perception 10', languages: 'Common, Orc',
    challenge_rating: '1/2', xp: 100,
    actions: '[{"name":"Greataxe","type":"melee_weapon","hit_bonus":5,"damage":"1d12+3","damage_type":"slashing","reach":5},{"name":"Javelin","type":"ranged_weapon","hit_bonus":5,"damage":"1d6+3","damage_type":"piercing","range":"30/120"}]',
    special_abilities: '[{"name":"Aggressive","description":"As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.","passive":true}]'
  },
  {
    name: 'Орк-вождь', type: 'humanoid', size: 'medium', alignment: 'chaotic evil',
    armor_class: 13, hit_points: 93, hit_dice: '11d8+44', speed: 30,
    strength: 18, dexterity: 12, constitution: 18, intelligence: 11, wisdom: 11, charisma: 16,
    skills: '{"intimidation":5}', senses: 'darkvision 60 ft., passive Perception 10', languages: 'Common, Orc',
    challenge_rating: '4', xp: 1100,
    actions: '[{"name":"Greataxe","type":"melee_weapon","hit_bonus":6,"damage":"1d12+4","damage_type":"slashing","reach":5},{"name":"Spear","type":"ranged_weapon","hit_bonus":6,"damage":"1d6+4","damage_type":"piercing","range":"20/60"}]',
    special_abilities: '[{"name":"Aggressive","description":"As a bonus action, the orc can move up to its speed toward a hostile creature.","passive":true},{"name":"Battle Cry","description":"Allies within 30 feet gain advantage on attack rolls until the start of the war chief\'s next turn.","limited_uses":1,"recharge":"short_rest"}]'
  },

  // НЕЖИТЬ
  {
    name: 'Скелет', type: 'undead', size: 'medium', alignment: 'lawful evil',
    armor_class: 13, hit_points: 13, hit_dice: '2d8+4', speed: 30,
    strength: 10, dexterity: 14, constitution: 15, intelligence: 6, wisdom: 8, charisma: 5,
    skills: '{}', senses: 'darkvision 60 ft., passive Perception 9', languages: 'understands all languages it knew in life',
    challenge_rating: '1/4', xp: 50,
    damage_vulnerabilities: 'bludgeoning', damage_immunities: 'poison', condition_immunities: 'exhaustion, poisoned',
    actions: '[{"name":"Shortsword","type":"melee_weapon","hit_bonus":4,"damage":"1d6+2","damage_type":"piercing","reach":5}]',
    special_abilities: '[]'
  },
  {
    name: 'Зомби', type: 'undead', size: 'medium', alignment: 'neutral evil',
    armor_class: 8, hit_points: 22, hit_dice: '3d8+9', speed: 20,
    strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5,
    skills: '{}', senses: 'darkvision 60 ft., passive Perception 8', languages: 'understands all languages it knew in life',
    challenge_rating: '1/4', xp: 50,
    damage_immunities: 'poison', condition_immunities: 'poisoned',
    actions: '[{"name":"Slam","type":"melee_weapon","hit_bonus":3,"damage":"1d6+1","damage_type":"bludgeoning","reach":5}]',
    special_abilities: '[{"name":"Undead Fortitude","description":"If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken. On a success, the zombie drops to 1 hit point instead.","passive":true}]'
  },
  {
    name: 'Призрак', type: 'undead', size: 'medium', alignment: 'chaotic evil',
    armor_class: 11, hit_points: 45, hit_dice: '10d8', speed: 0,
    strength: 7, dexterity: 13, constitution: 10, intelligence: 10, wisdom: 12, charisma: 17,
    skills: '{}', senses: 'darkvision 60 ft., passive Perception 11', languages: 'any languages it knew in life',
    challenge_rating: '4', xp: 1100,
    damage_resistances: 'acid, fire, lightning, thunder; bludgeoning, piercing, and slashing from nonmagical attacks',
    damage_immunities: 'cold, necrotic, poison',
    condition_immunities: 'charmed, exhaustion, frightened, grappled, paralyzed, petrified, poisoned, prone, restrained',
    actions: '[{"name":"Withering Touch","type":"melee_weapon","hit_bonus":5,"damage":"4d6+3","damage_type":"necrotic","reach":5}]',
    special_abilities: '[{"name":"Ethereal Sight","description":"The ghost can see 60 feet into the Ethereal Plane.","passive":true},{"name":"Incorporeal Movement","description":"The ghost can move through other creatures and objects as if they were difficult terrain.","passive":true}]'
  },

  // ДРАКОНЫ
  {
    name: 'Молодой красный дракон', type: 'dragon', size: 'large', alignment: 'chaotic evil',
    armor_class: 18, hit_points: 178, hit_dice: '17d10+85', speed: 40,
    strength: 23, dexterity: 10, constitution: 21, intelligence: 14, wisdom: 11, charisma: 19,
    skills: '{"perception":8,"stealth":4}', senses: 'blindsight 30 ft., darkvision 120 ft., passive Perception 18',
    languages: 'Common, Draconic', challenge_rating: '10', xp: 5900,
    damage_immunities: 'fire',
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":10,"damage":"2d10+6","damage_type":"piercing","reach":10},{"name":"Claw","type":"melee_weapon","hit_bonus":10,"damage":"2d6+6","damage_type":"slashing","reach":5},{"name":"Fire Breath","type":"ability","description":"The dragon exhales fire in a 30-foot cone. Each creature must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much on a successful one.","saving_throw":{"ability":"dexterity","dc":17},"recharge":"5_6"}]',
    special_abilities: '[]'
  },
  {
    name: 'Виверна', type: 'dragon', size: 'large', alignment: 'unaligned',
    armor_class: 13, hit_points: 110, hit_dice: '13d10+39', speed: 20,
    strength: 19, dexterity: 10, constitution: 16, intelligence: 5, wisdom: 12, charisma: 6,
    skills: '{"perception":4}', senses: 'darkvision 60 ft., passive Perception 14', languages: '',
    challenge_rating: '6', xp: 2300,
    actions: '[{"name":"Bite","type":"melee_weapon","hit_bonus":7,"damage":"2d6+4","damage_type":"piercing","reach":10},{"name":"Stinger","type":"melee_weapon","hit_bonus":7,"damage":"2d6+4","damage_type":"piercing","reach":10}]',
    special_abilities: '[]'
  }
];

let addedCount = 0;
let skippedCount = 0;

// Вставляем врагов с проверкой существования
for (const enemy of enemies) {
  try {
    // Проверяем, существует ли уже такой враг
    const existing = await pool.query(
      'SELECT id FROM enemy_templates WHERE name = $1',
      [enemy.name]
    );
    
    if (existing.rows.length > 0) {
      skippedCount++;
      console.log(`   ⚠️  "${enemy.name}" already exists, skipping...`);
      continue;
    }
    
    // Вставляем нового врага
    await pool.query(`
      INSERT INTO enemy_templates (
        name, type, size, alignment, armor_class, hit_points, hit_dice, speed,
        strength, dexterity, constitution, intelligence, wisdom, charisma,
        skills, senses, languages, challenge_rating, xp,
        actions, special_abilities,
        damage_vulnerabilities, damage_resistances, damage_immunities, condition_immunities,
        is_template
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,true)
    `, [
      enemy.name, enemy.type, enemy.size, enemy.alignment,
      enemy.armor_class, enemy.hit_points, enemy.hit_dice, enemy.speed,
      enemy.strength, enemy.dexterity, enemy.constitution, enemy.intelligence, enemy.wisdom, enemy.charisma,
      enemy.skills, enemy.senses, enemy.languages,
      enemy.challenge_rating, enemy.xp,
      enemy.actions, enemy.special_abilities,
      enemy.damage_vulnerabilities || null, enemy.damage_resistances || null,
      enemy.damage_immunities || null, enemy.condition_immunities || null
    ]);
    
    addedCount++;
    console.log(`   ✅ Added: ${enemy.name} (${enemy.type}, CR: ${enemy.challenge_rating})`);
    
  } catch (err) {
    console.error(`   ❌ Error adding "${enemy.name}":`, err.message);
  }
}

console.log(`\n📊 Enemy templates seeding results:`);
console.log(`   ✅ Added: ${addedCount}`);
console.log(`   ⚠️  Skipped: ${skippedCount}`);
console.log(`   📦 Total in array: ${enemies.length}`);

    // 8. Создаем тестовую кампанию
    console.log('🎮 Creating test campaign...');
    
    // Получаем первого пользователя (предполагаем, что он уже создан)
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    let dmId;
    
    if (userResult.rows.length === 0) {
      // Создаем тестового пользователя если нет
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const newUser = await pool.query(`
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['dm@example.com', 'DungeonMaster', hashedPassword, 'dm']);
      
      dmId = newUser.rows[0].id;
      console.log('Created test DM user with ID:', dmId);
    } else {
      dmId = userResult.rows[0].id;
    }
    
    // Создаем кампанию
    const campaignResult = await pool.query(`
      INSERT INTO campaigns (name, description, dm_id, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      'Проклятие Страда', 
      'Под покровом вечного тумана лежит долина Баровия, управляемая загадочным графом Страдом фон Заровичем. Это место, где ночь вечна, а страх - постоянный спутник живых. Игроки оказываются втянутыми в мрачную историю проклятого графа и должны найти способ сбежать из этого царства ужаса.',
      dmId,
      true
    ]);
    
    let campaignId;
    if (campaignResult.rows.length > 0) {
      campaignId = campaignResult.rows[0].id;
    } else {
      const existingCampaign = await pool.query('SELECT id FROM campaigns WHERE name = $1', ['Проклятие Страда']);
      campaignId = existingCampaign.rows[0].id;
    }
    
    console.log('Campaign created with ID:', campaignId);
    
    // Добавляем DM как игрока
    await pool.query(`
      INSERT INTO campaign_players (campaign_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = 'dm'
    `, [campaignId, dmId, 'dm']);
    
    // 9. Создаем тестовых игроков и персонажей
    console.log('👥 Creating test players and characters...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('player123', 10);
    
    const testPlayers = [
      { username: 'Aragorn', email: 'aragorn@example.com', charName: 'Арагорн', class: 'Следопыт', race: 'Человек' },
      { username: 'Gandalf', email: 'gandalf@example.com', charName: 'Гэндальф', class: 'Волшебник', race: 'Человек' },
      { username: 'Legolas', email: 'legolas@example.com', charName: 'Леголас', class: 'Следопыт', race: 'Эльф' },
      { username: 'Gimli', email: 'gimli@example.com', charName: 'Гимли', class: 'Воин', race: 'Дварф' }
    ];
    
    for (const player of testPlayers) {
      // Создаем пользователя
      const userResult = await pool.query(`
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
        RETURNING id
      `, [player.email, player.username, hashedPassword, 'player']);
      
      const userId = userResult.rows[0].id;
      
      // Добавляем в кампанию
      await pool.query(`
        INSERT INTO campaign_players (campaign_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (campaign_id, user_id) DO NOTHING
      `, [campaignId, userId, 'player']);
      
      // Создаем персонажа
      const charResult = await pool.query(`
        INSERT INTO characters (
          name, class, race, level, user_id, campaign_id,
          strength, dexterity, constitution, intelligence, wisdom, charisma,
          hit_points, armor_class
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        player.charName, player.class, player.race, 5, userId, campaignId,
        16, 14, 15, 12, 13, 11,
        45, 16
      ]);
      
      const characterId = charResult.rows[0].id;
      
      // Связываем персонажа с игроком в кампании
      await pool.query(`
        UPDATE campaign_players 
        SET character_id = $1
        WHERE campaign_id = $2 AND user_id = $3
      `, [characterId, campaignId, userId]);
    }
    
    // 10. Создаем тестовую карту
    console.log('🗺️ Creating test map...');
    
    const mapResult = await pool.query(`
      INSERT INTO maps (name, width, height, grid_type, campaign_id, background_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      'Замок Равенлофт',
      30,
      30,
      'square',
      campaignId,
      '/assets/maps/castle-raveloft.jpg'
    ]);
    
    const mapId = mapResult.rows[0].id;
    
    // Добавляем токены на карту
    const tokens = [
      { name: 'Арагорн', type: 'player', x: 5, y: 5, color: '#4CAF50' },
      { name: 'Гэндальф', type: 'player', x: 6, y: 4, color: '#2196F3' },
      { name: 'Леголас', type: 'player', x: 4, y: 6, color: '#FF9800' },
      { name: 'Гимли', type: 'player', x: 7, y: 5, color: '#F44336' },
      { name: 'Страд', type: 'monster', x: 15, y: 15, color: '#9C27B0' },
      { name: 'Волк', type: 'monster', x: 14, y: 16, color: '#795548' },
      { name: 'Волк', type: 'monster', x: 16, y: 14, color: '#795548' }
    ];
    
    for (const token of tokens) {
      await pool.query(`
        INSERT INTO map_tokens (map_id, token_type, name, x, y, color)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [mapId, token.type, token.name, token.x, token.y, token.color]);
    }
    
    // 11. Добавляем тестовые сообщения в чат
    console.log('💬 Adding test chat messages...');
    
    const messages = [
      { user: 'DungeonMaster', message: 'Добро пожаловать в Баровию! Туман окружает вас со всех сторон...', type: 'system' },
      { user: 'Aragorn', message: 'Я чувствую зло в этом месте. Будьте настороже.', type: 'chat' },
      { user: 'Gandalf', message: 'Страд знает о нашем присутствии. Мы должны двигаться осторожно.', type: 'chat' },
      { user: 'DungeonMaster', message: 'Бросаю проверку восприятия для всех: /roll 1d20+2', type: 'roll' }
    ];
    
    for (const msg of messages) {
      let userId = null;
      if (msg.user !== 'DungeonMaster') {
        const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [msg.user]);
        userId = userResult.rows[0]?.id;
      } else {
        userId = dmId;
      }
      
      await pool.query(`
        INSERT INTO campaign_messages (campaign_id, user_id, message, type)
        VALUES ($1, $2, $3, $4)
      `, [campaignId, userId, msg.message, msg.type]);
    }
    
    // 12. Создаем тестовый бой
    console.log('⚔️ Creating test battle...');
    
    const combatants = [
      { id: 'char1', name: 'Арагорн', type: 'player', initiative: 18, hp: 45, maxHp: 45, ac: 16 },
      { id: 'char2', name: 'Гэндальф', type: 'player', initiative: 12, hp: 32, maxHp: 32, ac: 12 },
      { id: 'char3', name: 'Леголас', type: 'player', initiative: 22, hp: 38, maxHp: 38, ac: 15 },
      { id: 'char4', name: 'Гимли', type: 'player', initiative: 8, hp: 52, maxHp: 52, ac: 17 },
      { id: 'mon1', name: 'Страд', type: 'monster', initiative: 15, hp: 144, maxHp: 144, ac: 16 },
      { id: 'mon2', name: 'Волк 1', type: 'monster', initiative: 14, hp: 11, maxHp: 11, ac: 13 },
      { id: 'mon3', name: 'Волк 2', type: 'monster', initiative: 10, hp: 11, maxHp: 11, ac: 13 }
    ];
    
    await pool.query(`
      INSERT INTO battles (campaign_id, map_id, combatants, state, current_turn, round, started_at)
      VALUES ($1, $2, $3, 'active', 0, 1, CURRENT_TIMESTAMP)
    `, [campaignId, mapId, JSON.stringify(combatants)]);
    
    console.log('✨ All test data seeded successfully!');
    console.log('✅ Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedData();