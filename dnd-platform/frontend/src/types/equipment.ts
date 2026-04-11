// frontend/src/types/equipment.ts

// Типы предметов
export type InventoryItemType = 
  | 'weapon'        // Оружие
  | 'armor'         // Броня
  | 'shield'        // Щит
  | 'helmet'        // Шлем
  | 'boots'         // Сапоги
  | 'belt'          // Пояс
  | 'container'     // Контейнер (рюкзак)
  | 'potion'        // Зелье
  | 'scroll'        // Свиток
  | 'ammunition'    // Боеприпасы
  | 'tool'          // Инструменты
  | 'focus'         // Фокус (для заклинаний)
  | 'other';        // Прочее

// Слоты экипировки
export type InventorySlot = 
  | 'helmet'
  | 'chest'
  | 'belt'
  | 'boots'
  | 'main_hand'
  | 'off_hand'
  | 'backpack';

// Сопоставление слотов и типов предметов, которые можно туда экипировать
export const SLOT_ALLOWED_TYPES: Record<InventorySlot, InventoryItemType[]> = {
  helmet: ['helmet', 'armor'], // В шлем можно надеть шлем или часть брони
  chest: ['armor'],            // В нагрудник только броню
  belt: ['belt', 'tool'],      // В пояс - пояс или инструменты
  boots: ['boots'],            // В сапоги только сапоги
  main_hand: ['weapon', 'shield', 'tool', 'focus'], // В основную руку - оружие, щит, инструмент, фокус
  off_hand: ['weapon', 'shield', 'tool', 'focus'], // Во вторую руку - щит, фокус, легкое оружие
  backpack: []                  // В рюкзак можно положить что угодно (обрабатывается отдельно)
};

// Отображаемые названия слотов
export const SLOT_DISPLAY_NAMES: Record<InventorySlot, string> = {
  helmet: 'Шлем',
  chest: 'Нагрудник',
  belt: 'Пояс',
  boots: 'Сапоги',
  main_hand: 'Основная рука',
  off_hand: 'Вспомогательная рука',
  backpack: 'Рюкзак'
};

// Иконки для слотов (используем PrimeIcons)
export const SLOT_ICONS: Record<InventorySlot, string> = {
  helmet: 'pi pi-star',
  chest: 'pi pi-shield',
  belt: 'pi pi-circle',
  boots: 'pi pi-arrow-up',
  main_hand: 'pi pi-bolt',
  off_hand: 'pi pi-sun',
  backpack: 'pi pi-box'
};

// Интерфейс предмета
export interface InventoryItem {
  id: number;
  character_id: number;
  name: string;
  type: InventoryItemType;
  subtype?: string;
  quantity: number;
  weight?: number;
  cost?: number;
  cost_unit?: string;
  description?: string;
  properties?: any;
  
  // Боевые свойства
  damage?: string;
  damage_type?: string;
  range_normal?: number;
  range_long?: number;
  
  // Броня
  armor_class_bonus?: number;
  strength_requirement?: number;
  stealth_disadvantage?: boolean;
  
  // Экипировка
  equipped: boolean;
  slot?: InventorySlot; // В каком слоте экипирован
  
  // Магические предметы
  attunement?: boolean;
  attuned?: boolean;
  rarity?: string;
  is_magical?: boolean;
  
  // Для контейнеров
  container_id?: number; // ID контейнера, в котором лежит предмет
  contents?: InventoryItem[]; // Для рюкзака - вложенные предметы
  
  created_at: string;
  updated_at: string;
}

// Интерфейс валюты
export interface Currency {
  character_id: number;
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

// DTO для создания предмета
export interface CreateInventoryItemDTO {
  name: string;
  type: InventoryItemType;
  subtype?: string;
  quantity?: number;
  weight?: number;
  cost?: number;
  description?: string;
  damage?: string;
  damage_type?: string;
  armor_class_bonus?: number;
  equipped?: boolean;
  slot?: InventorySlot;
}

// DTO для обновления предмета
export interface UpdateInventoryItemDTO {
  name?: string;
  type?: InventoryItemType;
  subtype?: string;
  quantity?: number;
  weight?: number;
  cost?: number;
  description?: string;
  damage?: string;
  damage_type?: string;
  armor_class_bonus?: number;
  equipped?: boolean;
  slot?: InventorySlot;
  container_id?: number | null;
}