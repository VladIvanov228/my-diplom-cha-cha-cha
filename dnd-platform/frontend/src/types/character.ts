// frontend/src/types/character.ts

export interface Character {
  id: number
  name: string
  level: number
  class: string
  race: string
  background?: string
  alignment?: string
  class_id: number;      // добавляем
  race_id: number;   
  // Характеристики
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  
  // Боевые параметры
  hit_points: number
  armor_class: number
  proficiency_bonus: number
  speed?: number
  
  // Дополнительные поля
  experience_points?: number
  inspiration?: boolean
  hit_dice?: string
  personality_traits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  features?: string
  notes?: string
  
  // Связи
  user_id: number
  campaign_id?: number
  
  created_at: string
  updated_at: string
}

export interface CreateCharacterDTO {
  name: string
  level: number
  class: string
  race: string
  background?: string
  alignment?: string
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  hit_points: number
  armor_class: number
  proficiency_bonus: number
  speed?: number
  experience_points?: number
  campaign_id?: number
}

// Стартовое снаряжение по классам
export const CLASS_STARTING_EQUIPMENT: Record<string, any[]> = {
  'Barbarian': [
    { name: 'Боевой топор', type: 'weapon', damage: '1d8', damage_type: 'slashing', weight: 4 },
    { name: 'Ручной топор', type: 'weapon', damage: '1d6', damage_type: 'slashing', weight: 2 },
    { name: 'Исследовательский набор', type: 'pack', weight: 5 }
  ],
  'Bard': [
    { name: 'Рапира', type: 'weapon', damage: '1d8', damage_type: 'piercing', weight: 2 },
    { name: 'Дипломатический набор', type: 'pack', weight: 3 },
    { name: 'Лютня', type: 'tool', weight: 2 }
  ],
  'Cleric': [
    { name: 'Булава', type: 'weapon', damage: '1d6', damage_type: 'bludgeoning', weight: 4 },
    { name: 'Щит', type: 'shield', armor_class_bonus: 2, weight: 6 },
    { name: 'Священный символ', type: 'tool', weight: 0.5 }
  ],
  'Druid': [
    { name: 'Дубинка', type: 'weapon', damage: '1d4', damage_type: 'bludgeoning', weight: 2 },
    { name: 'Щит', type: 'shield', armor_class_bonus: 2, weight: 6 },
    { name: 'Набор травника', type: 'tool', weight: 3 }
  ],
  'Fighter': [
    { name: 'Длинный меч', type: 'weapon', damage: '1d8', damage_type: 'slashing', weight: 3 },
    { name: 'Щит', type: 'shield', armor_class_bonus: 2, weight: 6 },
    { name: 'Арбалет', type: 'weapon', damage: '1d8', damage_type: 'piercing', weight: 5 }
  ],
  'Monk': [
    { name: 'Короткий меч', type: 'weapon', damage: '1d6', damage_type: 'piercing', weight: 2 },
    { name: 'Дротики', type: 'weapon', damage: '1d4', damage_type: 'piercing', weight: 0.25, quantity: 10 },
    { name: 'Набор ремесленника', type: 'tool', weight: 5 }
  ],
  'Paladin': [
    { name: 'Длинный меч', type: 'weapon', damage: '1d8', damage_type: 'slashing', weight: 3 },
    { name: 'Щит', type: 'shield', armor_class_bonus: 2, weight: 6 },
    { name: 'Священный символ', type: 'tool', weight: 0.5 }
  ],
  'Ranger': [
    { name: 'Длинный лук', type: 'weapon', damage: '1d8', damage_type: 'piercing', weight: 2 },
    { name: 'Короткий меч', type: 'weapon', damage: '1d6', damage_type: 'piercing', weight: 2 },
    { name: 'Колчан со стрелами', type: 'ammunition', weight: 1, quantity: 20 }
  ],
  'Rogue': [
    { name: 'Рапира', type: 'weapon', damage: '1d8', damage_type: 'piercing', weight: 2 },
    { name: 'Короткий лук', type: 'weapon', damage: '1d6', damage_type: 'piercing', weight: 2 },
    { name: 'Воровские инструменты', type: 'tool', weight: 1 }
  ],
  'Sorcerer': [
    { name: 'Посох', type: 'weapon', damage: '1d6', damage_type: 'bludgeoning', weight: 4 },
    { name: 'Кинжал', type: 'weapon', damage: '1d4', damage_type: 'piercing', weight: 1 },
    { name: 'Фокусировка', type: 'tool', weight: 1 }
  ],
  'Warlock': [
    { name: 'Посох', type: 'weapon', damage: '1d6', damage_type: 'bludgeoning', weight: 4 },
    { name: 'Кожаная броня', type: 'armor', armor_class_bonus: 1, weight: 10 },
    { name: 'Фокусировка', type: 'tool', weight: 1 }
  ],
  'Wizard': [
    { name: 'Посох', type: 'weapon', damage: '1d6', damage_type: 'bludgeoning', weight: 4 },
    { name: 'Кинжал', type: 'weapon', damage: '1d4', damage_type: 'piercing', weight: 1 },
    { name: 'Книга заклинаний', type: 'tool', weight: 3 }
  ]
}

// Стартовая валюта по классам
export const CLASS_STARTING_CURRENCY: Record<string, { gold: number, silver: number }> = {
  'Barbarian': { gold: 2, silver: 4 },
  'Bard': { gold: 5, silver: 0 },
  'Cleric': { gold: 5, silver: 0 },
  'Druid': { gold: 2, silver: 5 },
  'Fighter': { gold: 5, silver: 0 },
  'Monk': { gold: 1, silver: 0 },
  'Paladin': { gold: 5, silver: 0 },
  'Ranger': { gold: 5, silver: 0 },
  'Rogue': { gold: 4, silver: 0 },
  'Sorcerer': { gold: 3, silver: 0 },
  'Warlock': { gold: 4, silver: 0 },
  'Wizard': { gold: 4, silver: 0 }
}