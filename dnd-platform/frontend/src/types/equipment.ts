// Типы для системы снаряжения

export interface ItemType {
  id: number
  name: string
  category: 'weapon' | 'armor' | 'tool' | 'consumable' | 'magic' | 'misc'
  description?: string
}

export interface Item {
  id: number
  name: string
  type_id: number
  description?: string
  weight: number
  cost: number
  properties: Record<string, any>
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
  requires_attunement: boolean
  attunement_conditions?: string
  type_name?: string
  category?: string
}

export interface InventoryItem {
  id: number
  character_id: number
  item_id?: number
  custom_name?: string
  custom_description?: string
  quantity: number
  weight: number
  cost: number
  equipped: boolean
  equipped_slot?: string
  attuned: boolean
  notes?: string
  created_at: string
  updated_at: string
  
  // Joined fields
  item_name?: string
  item_description?: string
  item_properties?: Record<string, any>
  item_rarity?: string
  item_type?: string
  item_category?: string
}

export interface Vehicle {
  id: number
  name: string
  type: string
  speed: number
  capacity: number
  cost: number
  description?: string
}

export interface CharacterVehicle {
  id: number
  character_id: number
  vehicle_id?: number
  custom_name?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken'
  notes?: string
  
  // Joined fields
  vehicle_name?: string
  vehicle_type?: string
  vehicle_speed?: number
  vehicle_capacity?: number
  vehicle_description?: string
}

export interface CarryingCapacity {
  strength: number
  carryingCapacity: number
  pushDragLift: number
  currentWeight: number
  percentage: number
  encumbranceStatus: 'normal' | 'encumbered' | 'heavily_encumbered' | 'overloaded'
  isOverloaded: boolean
  remainingCapacity: number
}

export interface InventorySummary {
  items: InventoryItem[]
  equipped: InventoryItem[]
  byCategory: Record<string, InventoryItem[]>
  totals: {
    weight: number
    cost: number
    count: number
    equippedCount: number
  }
}

// Слоты для экипировки
export const EQUIPMENT_SLOTS = {
  HEAD: 'head',
  CHEST: 'chest',
  HANDS: 'hands',
  FEET: 'feet',
  MAIN_HAND: 'main_hand',
  OFF_HAND: 'off_hand',
  RING_1: 'ring_1',
  RING_2: 'ring_2',
  NECK: 'neck',
  BACK: 'back',
  WAIST: 'waist',
  GENERAL: 'general'
} as const

export type EquipmentSlot = typeof EQUIPMENT_SLOTS[keyof typeof EQUIPMENT_SLOTS]

export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  [EQUIPMENT_SLOTS.HEAD]: 'Голова',
  [EQUIPMENT_SLOTS.CHEST]: 'Грудь',
  [EQUIPMENT_SLOTS.HANDS]: 'Руки',
  [EQUIPMENT_SLOTS.FEET]: 'Ноги',
  [EQUIPMENT_SLOTS.MAIN_HAND]: 'Основная рука',
  [EQUIPMENT_SLOTS.OFF_HAND]: 'Вторая рука',
  [EQUIPMENT_SLOTS.RING_1]: 'Кольцо 1',
  [EQUIPMENT_SLOTS.RING_2]: 'Кольцо 2',
  [EQUIPMENT_SLOTS.NECK]: 'Шея',
  [EQUIPMENT_SLOTS.BACK]: 'Спина',
  [EQUIPMENT_SLOTS.WAIST]: 'Пояс',
  [EQUIPMENT_SLOTS.GENERAL]: 'Общее'
}

// Категории предметов с иконками
export const CATEGORY_ICONS: Record<string, string> = {
  weapon: 'pi pi-sword',
  armor: 'pi pi-shield',
  tool: 'pi pi-wrench',
  consumable: 'pi pi-flask',
  magic: 'pi pi-star',
  misc: 'pi pi-box'
}

export const CATEGORY_LABELS: Record<string, string> = {
  weapon: 'Оружие',
  armor: 'Доспехи',
  tool: 'Инструменты',
  consumable: 'Расходники',
  magic: 'Магические предметы',
  misc: 'Разное'
}

// Редкость предметов с цветами
export const RARITY_COLORS: Record<string, string> = {
  common: '#6b7280',
  uncommon: '#059669',
  rare: '#3b82f6',
  'very_rare': '#8b5cf6',
  legendary: '#f59e0b',
  artifact: '#dc2626'
}

export const RARITY_LABELS: Record<string, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  'very_rare': 'Очень редкий',
  legendary: 'Легендарный',
  artifact: 'Артефакт'
}