// =====================================================
// Типы для системы навыков
// =====================================================

export type EffectType = 'bonus' | 'damage' | 'heal' | 'condition' | 'buff' | 'debuff' | 'control' | 'utility';

export type SkillEffect = {
  type: EffectType;
  value: number | string;
  target?: 'self' | 'enemy' | 'ally' | 'area';
  duration?: number;
  savingThrow?: {
    type: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
    dc: number;
    effectOnSuccess?: string;
  };
  // Дополнительные поля для сложных эффектов
  bonus?: string | number;
  resistances?: string[];
  condition?: string;
  [key: string]: any;
};

export type ActivationCostType = 'action' | 'bonus_action' | 'reaction' | 'resource' | 'charges';

export type ActivationCost = {
  type: ActivationCostType;
  value?: string | number; // 'action', 'bonus_action', 'reaction', или название ресурса ('rage', 'ki', 'spell_slot')
  amount?: number; // количество ресурса, если type = 'resource'
};

export type SkillTarget = 'self' | 'enemy' | 'ally' | 'allies' | 'enemies' | 'area';

// Расовый пассивный навык
export interface RacePassiveSkill {
  id: number;
  raceId: number;
  raceName?: string;
  name: string;
  description: string;
  effectType: 'combat' | 'exploration' | 'social' | 'utility';
  effectValue: SkillEffect;
  isPassive: boolean;
}

// Классовый навык
export interface ClassSkill {
  id: number;
  classId: number;
  className?: string;
  name: string;
  description: string;
  skillLevel: number;
  skillType: 'passive' | 'active';
  activationCost?: ActivationCost;
  cooldown: number; // в раундах, 0 = нет кулдауна
  range: string;
  target: string;
  duration: string;
  savingThrow?: string;
  effectType: string;
  effectValue: SkillEffect;
  requirements?: {
    level?: number;
    prerequisiteSkill?: string;
    [key: string]: any;
  };
}

// Изученный навык персонажа
export interface CharacterSkill {
  id: number;
  characterId: number;
  skillId: number;
  skill: ClassSkill;
  isLearned: boolean;
  currentCooldown: number;
  usesRemaining?: number; // меняем с number | null на number | undefined
  lastUsedAt?: string;
}

// Состояние навыков персонажа (для Pinia store)
export interface SkillsState {
  racePassive: RacePassiveSkill | null;
  classSkills: ClassSkill[];
  learnedSkills: CharacterSkill[];
  isLoading: boolean;
  error: string | null;
}

// Параметры использования активного навыка
export interface UseSkillParams {
  characterId: number;
  skillId: number;
  targetId?: number; // ID цели (персонажа, монстра)
  targetType?: 'character' | 'monster' | 'self';
  position?: { x: number; y: number }; // для area эффектов
}

// Результат использования навыка
export interface UseSkillResult {
  success: boolean;
  message: string;
  damage?: number;
  healing?: number;
  effects?: any[];
  cooldownStarted?: boolean;
  usesDecremented?: boolean;
}