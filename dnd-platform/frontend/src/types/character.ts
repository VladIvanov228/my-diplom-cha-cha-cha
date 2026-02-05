export interface Character {
  id: number
  name: string
  level: number
  class: string
  race: string
  background?: string
  alignment?: string
  
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

export interface CharacterSkill {
  skill_id: string
  proficient: boolean
  expertise: boolean
  custom_bonus?: number
  notes?: string
}

export interface CharacterEquipment {
  id: number
  character_id: number
  name: string
  type: string
  quantity: number
  weight: number
  description?: string
  equipped: boolean
}