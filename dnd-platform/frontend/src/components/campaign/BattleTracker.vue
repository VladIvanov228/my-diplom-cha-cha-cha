<template>
  <div class="battle-tracker">
    <!-- Нет активного боя -->
    <div v-if="!battle" class="no-battle">
      <i class="pi pi-shield"></i>
      <h3>Нет активного боя</h3>
      <p v-if="isDM">Нажмите "Начать бой" для запуска боевого трекера</p>
      <p v-else>Ожидайте, пока DM начнёт бой</p>
      <Button 
        v-if="isDM"
        label="Начать бой" 
        icon="pi pi-play"
        severity="danger"
        size="large"
        @click="openStartBattleModal"
      />
    </div>

    <!-- Активный бой -->
    <div v-else class="active-battle">
      <!-- Заголовок -->
      <div class="battle-header">
        <div class="battle-info">
          <h3><i class="pi pi-swords"></i> Бой • Раунд {{ battle.round }}</h3>
          <span class="round-badge">
            Ход: {{ currentCombatant?.name || '...' }}
          </span>
        </div>
        <div class="battle-actions">
          <Button v-if="isDM" label="Следующий ход" icon="pi pi-forward" severity="primary" @click="handleNextTurn" />
          <Button v-if="isDM" label="Завершить" icon="pi pi-stop-circle" severity="danger" @click="handleEndBattle" />
          <Button v-if="isDM" icon="pi pi-plus-circle" severity="secondary" @click="openAddCombatantModal" title="Добавить участника" />
        </div>
      </div>

      <!-- Текущий ход + навыки -->
      <div v-if="isDM && currentCombatant" class="current-turn-panel">
        <div class="current-turn-info">
          <i :class="currentCombatant.type === 'player' ? 'pi pi-user' : 'pi pi-android'"></i>
          <strong>{{ currentCombatant.name }}</strong> ходит сейчас
          <span v-if="selectedTarget" class="target-info">
            → Цель: <strong>{{ selectedTarget.name }}</strong> ({{ selectedTarget.currentHp }}/{{ selectedTarget.maxHp }} HP)
          </span>
          <span v-else class="no-target">← Кликните на цель</span>
        </div>
        
        <!-- Навыки для игроков -->
        <div v-if="currentCombatant.type === 'player' && currentSkills.length > 0" class="skills-section">
          <span class="section-label">🎯 Навыки:</span>
          <div class="skills-list">
            <Button 
              v-for="skill in currentSkills" 
              :key="skill.id"
              :label="skill.name"
              :title="skill.description"
              size="small"
              :severity="skill.effectType === 'heal' ? 'success' : 'primary'"
              @click="useSkillOnTarget(skill)"
              :disabled="!selectedTarget || !selectedTarget.isAlive"
            />
          </div>
        </div>
        
        <!-- Быстрый урон (для всех) -->
        <div class="quick-damage">
          <span class="section-label">⚔️ Быстрый урон:</span>
          <Button 
            v-for="dice in quickDamageOptions" 
            :key="dice.formula"
            :label="dice.label"
            size="small"
            :severity="dice.severity"
            @click="quickDamage(dice.formula)"
            :disabled="!selectedTarget || !selectedTarget.isAlive"
          />
        </div>
      </div>

      <!-- Список участников -->
      <div class="combatants-list">
        <div 
          v-for="(combatant, index) in initiativeOrder" 
          :key="combatant.id"
          class="combatant-card"
          :class="{
            'current-turn': index === battle.current_turn,
            'dead': !combatant.isAlive,
            'targetable': isDM && currentCombatant && combatant.id !== currentCombatant.id && combatant.isAlive
          }"
          @click="selectTarget(combatant)"
        >
          <div class="turn-indicator" v-if="index === battle.current_turn">▶</div>
          <div class="initiative-badge">{{ combatant.initiative }}</div>
          
          <div class="combatant-info">
            <div class="combatant-name">
              <i :class="combatant.type === 'player' ? 'pi pi-user' : 'pi pi-android'"></i>
              {{ combatant.name }}
              <span v-if="combatant === selectedTarget" class="target-badge">🎯 Цель</span>
            </div>
            <div class="hp-bar-container">
              <div class="hp-bar" :class="hpBarClass(combatant)" :style="{ width: hpPercentage(combatant) + '%' }"></div>
              <span class="hp-text">{{ combatant.currentHp }}/{{ combatant.maxHp }} HP</span>
            </div>
            <div class="combatant-ac">AC: {{ combatant.armorClass }}</div>
          </div>
        </div>
      </div>

      <!-- Лог боя -->
      <div class="battle-log" v-if="battleLog.length > 0">
        <div class="log-header">
          <i class="pi pi-list"></i> Лог боя
          <span class="log-count">{{ battleLog.length }}</span>
        </div>
        <div class="log-entries" ref="logContainerRef">
          <div v-for="entry in recentLog" :key="entry.id" class="log-entry" :class="entry.type">
            <span class="log-round">[Р{{ entry.round }}]</span>
            <span class="log-actor">{{ entry.actorName }}</span>
            <span class="log-action">{{ entry.action }}</span>
            <span v-if="entry.targetName" class="log-target">→ {{ entry.targetName }}</span>
            <span v-if="entry.value" class="log-value" :class="entry.type">
              {{ entry.type === 'heal' ? '+' : '' }}{{ entry.value }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка начала боя -->
    <Dialog v-model:visible="showStartModal" header="Начать бой" modal :style="{ width: '650px' }">
      <div class="start-battle-form">
        <p>Выберите участников боя и бросьте инициативу</p>
        <div class="combatant-select-list">
          <div 
            v-for="candidate in battleCandidates" 
            :key="candidate.id"
            class="combatant-select-item"
            :class="{ selected: selectedCandidates.includes(candidate.id) }"
          >
            <Checkbox v-model="selectedCandidates" :value="candidate.id" />
            <span class="candidate-icon">{{ candidate.type === 'player' ? '👤' : '👹' }}</span>
            <span class="candidate-name">{{ candidate.name }}</span>
            <span class="candidate-type">({{ candidate.type === 'player' ? 'Игрок' : 'Враг' }})</span>
            <span class="candidate-hp">HP: {{ candidate.hp }}</span>
            <InputNumber 
              v-if="selectedCandidates.includes(candidate.id)"
              v-model="candidate.initiative"
              :min="0" :max="30"
              placeholder="Иниц."
              class="initiative-input"
            />
            <Button 
              v-if="selectedCandidates.includes(candidate.id) && !candidate.initiative"
              label="d20" icon="pi pi-chart-bar"
              size="small" severity="info"
              @click="rollInitiative(candidate)"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showStartModal = false" />
        <Button label="Начать бой" icon="pi pi-play" severity="danger"
          :disabled="selectedCandidates.length === 0"
          @click="startBattleWithSelected" />
      </template>
    </Dialog>

    <!-- Модалка добавления участника -->
    <Dialog v-model:visible="showAddModal" header="Добавить в бой" modal :style="{ width: '450px' }">
      <div class="add-combatant-form">
        <div class="form-field">
          <label>Имя</label>
          <InputText v-model="newCombatant.name" placeholder="Имя участника" class="w-full" />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>HP</label>
            <InputNumber v-model="newCombatant.maxHp" :min="1" class="w-full" />
          </div>
          <div class="form-field">
            <label>AC</label>
            <InputNumber v-model="newCombatant.ac" :min="1" :max="30" class="w-full" />
          </div>
        </div>
        <div class="form-field">
          <label>Инициатива</label>
          <div class="initiative-row">
            <InputNumber v-model="newCombatant.initiative" :min="0" :max="30" class="w-full" />
            <Button label="d20" icon="pi pi-chart-bar" size="small" @click="newCombatant.initiative = rollD20()" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showAddModal = false" />
        <Button label="Добавить" severity="primary" :disabled="!newCombatant.name" @click="addNewCombatant" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useBattleStore } from '@/stores/battle'
import { useCampaignsStore } from '@/stores/campaigns'
import { useEnemiesStore } from '@/stores/enemies'
import { useSkillsStore } from '@/stores/skills'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import type { Combatant } from '@/types/campaign'
import type { ClassSkill, CharacterSkill } from '@/types/skills'

const props = defineProps<{
  campaignId: number
  isDM: boolean
}>()

const toast = useToast()
const battleStore = useBattleStore()
const campaignsStore = useCampaignsStore()
const enemiesStore = useEnemiesStore()
const skillsStore = useSkillsStore()

// State
const showStartModal = ref(false)
const showAddModal = ref(false)
const selectedCandidates = ref<any[]>([])
const selectedTarget = ref<Combatant | null>(null)
const loading = ref(false)
const logContainerRef = ref<HTMLElement>()

// Словарь навыков для каждого участника
const combatantSkills = ref<Record<string, CharacterSkill[]>>({})

const quickDamageOptions = [
  { formula: '1d4', label: '1d4', severity: 'info' as const },
  { formula: '1d6', label: '1d6', severity: 'info' as const },
  { formula: '1d8', label: '1d8', severity: 'warning' as const },
  { formula: '1d10', label: '1d10', severity: 'warning' as const },
  { formula: '2d6', label: '2d6', severity: 'danger' as const },
  { formula: '2d8', label: '2d8', severity: 'danger' as const },
]

const newCombatant = ref({ name: '', maxHp: 20, ac: 12, initiative: 0 })
const battleCandidates = ref<any[]>([])

// Computed
const battle = computed(() => battleStore.currentBattle)
const currentCombatant = computed(() => battleStore.currentCombatant)
const initiativeOrder = computed(() => battleStore.initiativeOrder)
const battleLog = computed(() => battleStore.battleLog)
const recentLog = computed(() => battleLog.value.slice(-20))

// Навыки текущего участника
const currentSkills = computed(() => {
  const combatant = currentCombatant.value
  if (!combatant || combatant.type !== 'player') return []
  
  const skills = combatantSkills.value[combatant.id]
  if (!skills || skills.length === 0) return []
  
  // Только активные навыки
  return skills
    .filter(s => s.skill?.skillType === 'active')
    .map(s => ({
      id: s.skill!.id,
      skillId: s.skillId,
      name: s.skill!.name,
      description: s.skill!.description,
      damage: s.skill!.effectValue?.value?.toString() || s.skill!.effectValue?.damage?.toString() || '?',
      effectType: s.skill!.effectType,
      target: s.skill!.target
    }))
})

// Methods
function hpPercentage(combatant: Combatant): number {
  if (combatant.maxHp <= 0) return 0
  return (combatant.currentHp / combatant.maxHp) * 100
}

function hpBarClass(combatant: Combatant): string {
  const pct = hpPercentage(combatant)
  if (pct > 50) return 'healthy'
  if (pct > 25) return 'wounded'
  return 'critical'
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

function rollInitiative(candidate: any) {
  candidate.initiative = rollD20() + (candidate.dexterityMod || 0)
}

function selectTarget(combatant: Combatant) {
  if (!props.isDM) return
  if (combatant.id === currentCombatant.value?.id) return
  if (!combatant.isAlive) return
  selectedTarget.value = combatant
}

// Загрузка навыков для участника
async function loadSkillsForCombatant(combatant: Combatant) {
  if (combatant.type !== 'player') return
  
  const campaignPlayer = campaignsStore.campaignPlayers.find(
    p => p.character_name === combatant.name || p.username === combatant.name
  )
  
  if (campaignPlayer?.character_id) {
    try {
      await skillsStore.fetchCharacterSkills(campaignPlayer.character_id)
      combatantSkills.value[combatant.id] = [...skillsStore.learnedSkills]
      console.log(`✅ Навыки загружены для ${combatant.name}:`, combatantSkills.value[combatant.id].length)
    } catch (err) {
      console.error(`❌ Ошибка загрузки навыков для ${combatant.name}:`, err)
    }
  }
}

// Загрузка навыков для всех участников
async function loadAllSkills() {
  const battle = battleStore.currentBattle
  if (!battle?.combatants) return
  
  for (const combatant of battle.combatants) {
    await loadSkillsForCombatant(combatant)
  }
}

function openStartBattleModal() {
  const candidates: any[] = []
  
  // Игроки
  const players = campaignsStore.campaignPlayers.filter(p => p.character_id)
  players.forEach(p => {
    candidates.push({
      id: `player_${p.user_id}`,
      name: p.character_name || p.username,
      type: 'player',
      hp: 45,
      ac: 16,
      initiative: 0,
      dexterityMod: 2,
      characterId: p.character_id,
      userId: p.user_id
    })
  })
  
  // Враги из шаблонов
  enemiesStore.templates.slice(0, 12).forEach(t => {
    candidates.push({
      id: `enemy_${t.id}`,
      name: t.name,
      type: 'monster',
      hp: t.hit_points,
      ac: t.armor_class,
      initiative: 0,
      dexterityMod: Math.floor((t.dexterity - 10) / 2),
      templateId: t.id
    })
  })
  
  battleCandidates.value = candidates
  selectedCandidates.value = []
  showStartModal.value = true
}

async function startBattleWithSelected() {
  const combatants: Combatant[] = battleCandidates.value
    .filter(c => selectedCandidates.value.includes(c.id))
    .map(c => ({
      id: c.id,
      type: c.type as 'player' | 'monster',
      entityId: c.characterId || c.templateId || 0,
      name: c.name,
      initiative: c.initiative || rollD20(),
      currentHp: c.hp,
      maxHp: c.hp,
      armorClass: c.ac,
      statusEffects: [],
      isAlive: true
    }))
  
  if (combatants.length === 0) {
    toast.add({ severity: 'warn', summary: 'Выберите участников', life: 3000 })
    return
  }
  
  try {
    await battleStore.startBattle(props.campaignId, combatants)
    showStartModal.value = false
    combatantSkills.value = {}
    await loadAllSkills()
    toast.add({ severity: 'success', summary: 'Бой начат!', detail: `Участников: ${combatants.length}`, life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.response?.data?.error || err.message, life: 3000 })
  }
}

async function handleNextTurn() {
  loading.value = true
  selectedTarget.value = null
  try {
    await battleStore.nextTurn()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.message, life: 3000 })
  } finally {
    loading.value = false
  }
}

async function quickDamage(formula: string) {
  const current = currentCombatant.value
  const target = selectedTarget.value
  
  if (!current || !target) {
    toast.add({ severity: 'warn', summary: 'Выберите цель', life: 2000 })
    return
  }
  if (!target.isAlive) {
    toast.add({ severity: 'warn', summary: 'Цель уже мертва', life: 2000 })
    return
  }
  
  const damage = battleStore.rollDamage(formula)
  await battleStore.useSkillOnTarget(current.id, current.name, target.id, 'Атака', formula, 'physical')
  
  const updatedBattle = battleStore.currentBattle
  const updatedTarget = updatedBattle?.combatants.find((c: Combatant) => c.id === target.id)
  
  toast.add({ 
    severity: 'info', 
    summary: `${target.name} получил ${damage} урона`,
    detail: `Осталось ${updatedTarget?.currentHp || 0}/${updatedTarget?.maxHp || 0} HP`,
    life: 3000 
  })
  
  if (updatedTarget && !updatedTarget.isAlive) {
    selectedTarget.value = null
    toast.add({ severity: 'error', summary: `${target.name} погибает!`, life: 3000 })
  }
}

async function useSkillOnTarget(skill: any) {
  const current = currentCombatant.value
  const target = selectedTarget.value
  
  if (!current || !target) {
    toast.add({ severity: 'warn', summary: 'Выберите цель', life: 2000 })
    return
  }
  if (!target.isAlive) {
    toast.add({ severity: 'warn', summary: 'Цель уже мертва', life: 2000 })
    return
  }
  
  // Определяем формулу урона/лечения
  let formula = '1d4'
  let actionType = 'damage'
  
  if (skill.damage && skill.damage !== '?') {
    formula = skill.damage
  } else if (skill.effectValue?.value) {
    formula = skill.effectValue.value.toString()
  }
  
  if (skill.effectType === 'heal') {
    actionType = 'heal'
  }
  
  if (actionType === 'heal') {
    // Лечение применяем к себе или союзнику
    const healTarget = target.type === 'player' ? target : current
    const healAmount = battleStore.rollDamage(formula)
    await battleStore.healCombatant(healTarget.id, healAmount, current.name)
    
    toast.add({ 
      severity: 'success', 
      summary: `${skill.name}: +${healAmount} HP → ${healTarget.name}`,
      life: 3000 
    })
  } else {
    // Урон по цели
    const damage = battleStore.rollDamage(formula)
    await battleStore.useSkillOnTarget(current.id, current.name, target.id, skill.name, formula, 'magical')
    
    const updatedBattle = battleStore.currentBattle
    const updatedTarget = updatedBattle?.combatants.find((c: Combatant) => c.id === target.id)
    
    toast.add({ 
      severity: 'info', 
      summary: `${skill.name}: ${damage} урона → ${target.name}`,
      detail: `Осталось ${updatedTarget?.currentHp || 0} HP`,
      life: 3000 
    })
    
    if (updatedTarget && !updatedTarget.isAlive) {
      selectedTarget.value = null
      toast.add({ severity: 'error', summary: `${target.name} погибает!`, life: 3000 })
    }
  }
}

async function handleEndBattle() {
  try {
    await battleStore.endBattle()
    combatantSkills.value = {}
    toast.add({ severity: 'info', summary: 'Бой завершён!', life: 3000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.message, life: 3000 })
  }
}

function openAddCombatantModal() {
  newCombatant.value = { name: '', maxHp: 20, ac: 12, initiative: rollD20() }
  showAddModal.value = true
}

async function addNewCombatant() {
  const combatant: Combatant = {
    id: `new_${Date.now()}`,
    type: 'monster',
    entityId: 0,
    name: newCombatant.value.name,
    initiative: newCombatant.value.initiative,
    currentHp: newCombatant.value.maxHp,
    maxHp: newCombatant.value.maxHp,
    armorClass: newCombatant.value.ac,
    statusEffects: [],
    isAlive: true
  }
  
  try {
    await battleStore.addCombatant(combatant)
    showAddModal.value = false
    toast.add({ severity: 'success', summary: `${combatant.name} добавлен в бой!`, life: 2000 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.message, life: 3000 })
  }
}

watch(recentLog, () => {
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  })
})

onMounted(async () => {
  await battleStore.fetchBattle(props.campaignId)
  const battle = battleStore.currentBattle
  if (battle?.state === 'active') {
    await loadAllSkills()
  }
})
</script>

<style scoped>
.battle-tracker { padding: 16px; }

.no-battle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  gap: 16px;
}
.no-battle i { font-size: 4rem; color: #9ca3af; }
.no-battle h3 { color: #374151; margin: 0; }
.no-battle p { color: #6b7280; margin: 0; }

.active-battle { display: flex; flex-direction: column; gap: 16px; }

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}
.battle-info { display: flex; align-items: center; gap: 12px; }
.battle-info h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: #dc2626; }
.round-badge {
  padding: 4px 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}
.battle-actions { display: flex; gap: 8px; }

.current-turn-panel {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
}
.current-turn-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  margin-bottom: 12px;
  color: #92400e;
  flex-wrap: wrap;
}
.target-info { color: #3b82f6; font-size: 0.95rem; }
.no-target { color: #9ca3af; font-size: 0.9rem; font-style: italic; }

.skills-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.section-label { font-weight: 700; color: #92400e; font-size: 0.9rem; }
.skills-list { display: flex; gap: 6px; flex-wrap: wrap; }

.quick-damage {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.combatants-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.combatant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
}
.combatant-card.current-turn {
  border-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}
.combatant-card.dead { opacity: 0.5; background: #f3f4f6; }
.combatant-card.targetable { cursor: crosshair; }
.combatant-card.targetable:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.turn-indicator {
  position: absolute;
  left: -14px;
  color: #f59e0b;
  font-size: 1.5rem;
  animation: pulse 1s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.initiative-badge {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  font-weight: bold;
  border-radius: 50%;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.combatant-info { flex: 1; min-width: 0; }
.combatant-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.target-badge {
  padding: 2px 8px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  animation: pulse 1s infinite;
}

.hp-bar-container {
  position: relative;
  height: 22px;
  background: #e5e7eb;
  border-radius: 11px;
  overflow: hidden;
  margin-bottom: 4px;
}
.hp-bar { height: 100%; border-radius: 11px; transition: width 0.5s ease; }
.hp-bar.healthy { background: linear-gradient(90deg, #10b981, #34d399); }
.hp-bar.wounded { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.hp-bar.critical { background: linear-gradient(90deg, #ef4444, #f87171); animation: blink 0.5s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

.hp-text {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 700;
  color: #1f2937;
  text-shadow: 0 0 4px rgba(255,255,255,0.8);
  white-space: nowrap;
}

.combatant-ac { font-size: 0.85rem; color: #6b7280; font-weight: 500; }

/* Лог боя */
.battle-log { margin-top: 8px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.log-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
}
.log-count { margin-left: auto; padding: 2px 8px; background: #e5e7eb; border-radius: 10px; font-size: 0.8rem; }
.log-entries { max-height: 200px; overflow-y: auto; padding: 8px; background: #1e1e2e; }
.log-entry { display: flex; gap: 6px; padding: 4px 0; font-size: 0.85rem; font-family: monospace; }
.log-round { color: #6b7280; min-width: 35px; }
.log-actor { color: #fbbf24; font-weight: 600; }
.log-action { color: #e0e0e0; }
.log-target { color: #93c5fd; }
.log-value { font-weight: 700; }
.log-entry.damage .log-value { color: #f87171; }
.log-entry.heal .log-value { color: #34d399; }
.log-entry.system { color: #9ca3af; font-style: italic; }

/* Модалки */
.start-battle-form p { color: #6b7280; margin-bottom: 16px; }
.combatant-select-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
.combatant-select-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}
.combatant-select-item.selected { border-color: #3b82f6; background: #eff6ff; }
.candidate-icon { font-size: 1.2rem; }
.candidate-name { font-weight: 600; color: #1f2937; }
.candidate-type { font-size: 0.85rem; color: #6b7280; }
.candidate-hp { font-size: 0.8rem; color: #9ca3af; margin-left: auto; }
.initiative-input { width: 80px; }

.add-combatant-form { display: flex; flex-direction: column; gap: 12px; }
.form-field { margin-bottom: 12px; }
.form-field label { display: block; margin-bottom: 6px; font-weight: 600; color: #374151; }
.form-row { display: flex; gap: 12px; }
.form-row .form-field { flex: 1; }
.initiative-row { display: flex; gap: 8px; }
.w-full { width: 100%; }
</style>