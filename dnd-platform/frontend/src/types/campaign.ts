// frontend/src/types/campaign.ts (ПОЛНЫЙ ФАЙЛ)

export interface Campaign {
  id: number
  name: string
  description: string | null  
  dm_id: number
  dm_name?: string
  dm_pin?: string
  is_active: boolean
  is_public?: boolean
  created_at: string
  updated_at: string
  is_player?: boolean
  userRole?: 'dm' | 'player' | 'spectator'
}

export interface CampaignPlayer {
  id: number
  campaign_id: number
  user_id: number
  username: string
  avatar_url: string | null
  character_id: number | null
  character_name: string | null
  role: 'dm' | 'player' | 'spectator'
  entry_role?: 'dm' | 'player' | 'spectator'
  joined_at: string
}

export interface CampaignMap {
  id: number
  name: string
  width: number
  height: number
  grid_type: 'square' | 'hex'
  background_image?: string
  fog_of_war?: Record<string, any>
  updated_at: string
}

export interface CampaignDetails extends Campaign {
  players: CampaignPlayer[]
  maps?: CampaignMap[]
  userRole?: 'dm' | 'player' | 'spectator'
  map_data?: Record<string, any>
  activeBattle?: Battle
  dm_notes?: string
  system?: string
  max_players?: number
}

export interface Battle {
  id: number
  campaign_id: number
  map_id: number | null
  combatants: Combatant[]
  current_turn: number
  round: number
  state: 'waiting' | 'active' | 'finished'
  started_at: string
  finished_at: string | null
  winner: string | null
}

export interface Combatant {
  id: string
  type: 'player' | 'monster' | 'npc'
  entityId: number
  name: string
  initiative: number
  currentHp: number
  maxHp: number
  armorClass: number
  statusEffects: StatusEffect[]
  isAlive: boolean
}

export interface StatusEffect {
  id: string
  name: string
  duration: number
  modifiers: Record<string, number>
}

export interface CampaignMessage {
  id: number
  campaign_id: number
  user_id: number | null
  username: string | null
  avatar_url: string | null
  message: string
  type: 'chat' | 'system' | 'roll' | 'dice'
  metadata: any
  created_at: string
}

export interface DiceRollResult {
  formula: string
  rolls: number[]
  total: number
  modifier?: number
}

export interface CreateCampaignDTO {
  name: string
  description?: string
  dm_pin?: string
  mapCount?: number
  mapNames?: string[]
  is_public?: boolean
}

export interface UpdateCampaignDTO {
  name?: string
  description?: string
  is_active?: boolean
  is_public?: boolean
}

export interface JoinCampaignDTO {
  character_id?: number
  entry_role: 'dm' | 'player' | 'spectator'
  dm_pin?: string
}

export interface InvitePlayerDTO {
  username: string
  role?: 'player' | 'spectator'
}

// ============================================
// ТИПЫ ДЛЯ ВРАГОВ (ENEMIES)
// ============================================

export interface EnemyTemplate {
  id: number
  name: string
  type: string
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
  alignment: string
  armor_class: number
  hit_points: number
  hit_dice: string
  speed: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  skills: Record<string, number>
  senses: string
  languages: string
  challenge_rating: string
  xp: number
  actions: EnemyAction[]
  special_abilities: EnemyAbility[]
  legendary_actions?: EnemyAction[]
  lair_actions?: EnemyAbility[]
  damage_vulnerabilities?: string
  damage_resistances?: string
  damage_immunities?: string
  condition_immunities?: string
  is_template: boolean
  created_by?: number
  created_at?: string
}

export interface EnemyAction {
  name: string
  type: 'melee_weapon' | 'ranged_weapon' | 'melee_spell' | 'ranged_spell' | 'ability'
  hit_bonus?: number
  damage?: string
  damage_type?: string
  reach?: number
  range?: string
  description?: string
  saving_throw?: {
    ability: string
    dc: number
    success_effect?: string
  }
}

export interface EnemyAbility {
  name: string
  description: string
  passive?: boolean
  limited_uses?: number
  recharge?: string
}

export interface MapEnemy {
  id: number
  map_id: number
  template_id?: number
  name: string
  x: number
  y: number
  size: number
  hit_points: number
  max_hit_points: number
  armor_class: number
  initiative: number
  is_alive: boolean
  metadata: MapEnemyMetadata
  template?: EnemyTemplate
  created_at?: string
  updated_at?: string
}

export interface MapEnemyMetadata {
  template_actions?: EnemyAction[]
  template_abilities?: EnemyAbility[]
  notes?: string
  custom_name?: string
  faction?: string
  is_boss?: boolean
}

export interface PlaceEnemyDTO {
  template_id?: number
  name?: string
  x: number
  y: number
  size?: number
  hit_points?: number
  armor_class?: number
  initiative?: number
}

export interface UpdateEnemyDTO {
  x?: number
  y?: number
  hit_points?: number
  is_alive?: boolean
  initiative?: number
}