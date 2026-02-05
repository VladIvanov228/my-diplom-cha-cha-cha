const { pool } = require('./index');

async function seedData() {
  try {
    console.log('Seeding database with initial data...');

    // Тестовые заклинания
    await pool.query(`
      INSERT INTO spells (name, level, school, casting_time, range, components, duration, description, classes) VALUES
      ('Fireball', 3, 'Evocation', '1 action', '150 feet', 'V, S, M', 'Instantaneous', 'A bright streak flashes from your pointing finger...', '["Wizard", "Sorcerer"]'),
      ('Cure Wounds', 1, 'Evocation', '1 action', 'Touch', 'V, S', 'Instantaneous', 'A creature you touch regains hit points...', '["Cleric", "Paladin", "Bard"]'),
      ('Magic Missile', 1, 'Evocation', '1 action', '120 feet', 'V, S', 'Instantaneous', 'You create three glowing darts of magical force...', '["Wizard", "Sorcerer"]')
      ON CONFLICT DO NOTHING;
    `);

    // Тестовые монстры
    await pool.query(`
      INSERT INTO monsters (name, size, type, alignment, armor_class, hit_points, speed, stats, challenge_rating) VALUES
      ('Goblin', 'Small', 'Humanoid', 'Neutral Evil', 15, 7, '{"walk": 30}', '{"strength": 8, "dexterity": 14, "constitution": 10, "intelligence": 10, "wisdom": 8, "charisma": 8}', 0.25),
      ('Orc', 'Medium', 'Humanoid', 'Chaotic Evil', 13, 15, '{"walk": 30}', '{"strength": 16, "dexterity": 12, "constitution": 16, "intelligence": 7, "wisdom": 11, "charisma": 10}', 0.5),
      ('Dragon', 'Large', 'Dragon', 'Chaotic Evil', 18, 200, '{"walk": 40, "fly": 80}', '{"strength": 23, "dexterity": 14, "constitution": 21, "intelligence": 16, "wisdom": 13, "charisma": 19}', 10)
      ON CONFLICT DO NOTHING;
    `);
    
    //Тестовые классы
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
    
    //Тестовые расы
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

    console.log('✅ Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedData();