// frontend/src/stores/battle.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { Battle, Combatant } from '@/types/campaign'

interface BattleLogEntry {
  id: string
  round: number
  actorName: string
  action: string
  targetName?: string
  value?: number
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'system' | 'turn'
  timestamp: string
}

export const useBattleStore = defineStore('battle', () => {
  const currentBattle = ref<Battle | null>(null)
  const battleLog = ref<BattleLogEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isActive = computed(() => currentBattle.value?.state === 'active')
  const isFinished = computed(() => currentBattle.value?.state === 'finished')
  
  const currentCombatant = computed(() => {
    if (!currentBattle.value?.combatants) return null
    return currentBattle.value.combatants[currentBattle.value.current_turn] || null
  })

  const activeCombatants = computed(() => {
    if (!currentBattle.value?.combatants) return []
    return currentBattle.value.combatants.filter((c: Combatant) => c.isAlive)
  })

  const initiativeOrder = computed(() => {
    if (!currentBattle.value?.combatants) return []
    return [...currentBattle.value.combatants].sort((a: Combatant, b: Combatant) => b.initiative - a.initiative)
  })

  const aliveEnemies = computed(() => {
    if (!currentBattle.value?.combatants) return []
    return currentBattle.value.combatants.filter((c: Combatant) => c.type !== 'player' && c.isAlive)
  })

  const aliveAllies = computed(() => {
    if (!currentBattle.value?.combatants) return []
    return currentBattle.value.combatants.filter((c: Combatant) => c.type === 'player' && c.isAlive)
  })

  function addLog(entry: Omit<BattleLogEntry, 'id' | 'timestamp'>) {
    battleLog.value.push({
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    })
    
    if (battleLog.value.length > 200) {
      battleLog.value = battleLog.value.slice(-200)
    }
  }

  async function fetchBattle(campaignId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/battles/campaign/${campaignId}`)
      if (response.data.battle) {
        currentBattle.value = response.data.battle
      } else {
        currentBattle.value = null
        battleLog.value = []
      }
      return currentBattle.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch battle'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function startBattle(campaignId: number, combatants: Combatant[]) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/battles/start', { campaignId, combatants })
      currentBattle.value = response.data.battle
      battleLog.value = []
      
      addLog({
        round: 1,
        actorName: 'Система',
        action: 'Бой начался!',
        type: 'system'
      })
      
      const battle = currentBattle.value
      if (battle && battle.combatants && battle.combatants.length > 0) {
        addLog({
          round: 1,
          actorName: battle.combatants[0].name,
          action: 'ходит первым',
          type: 'turn'
        })
      }
      
      return currentBattle.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to start battle'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function nextTurn() {
    const battle = currentBattle.value
    if (!battle) return
    
    loading.value = true
    try {
      const response = await api.post(`/battles/${battle.id}/next-turn`)
      currentBattle.value = response.data.battle
      
      const current = currentCombatant.value
      if (current) {
        addLog({
          round: currentBattle.value?.round || 0,
          actorName: current.name,
          action: 'ходит сейчас',
          type: 'turn'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to next turn'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCombatant(combatantId: string, data: Partial<Combatant>) {
    const battle = currentBattle.value
    if (!battle) return
    
    try {
      const response = await api.put(
        `/battles/${battle.id}/combatant/${combatantId}`,
        data
      )
      currentBattle.value = response.data.battle
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update combatant'
      throw err
    }
  }

  async function damageCombatant(combatantId: string, damage: number, attackerName?: string) {
    const battle = currentBattle.value
    if (!battle) return
    
    const combatant = battle.combatants.find((c: Combatant) => c.id === combatantId)
    if (!combatant) return
    
    const newHp = Math.max(0, combatant.currentHp - damage)
    await updateCombatant(combatantId, {
      currentHp: newHp,
      isAlive: newHp > 0
    })
    
    addLog({
      round: battle.round,
      actorName: attackerName || 'Атакующий',
      action: newHp <= 0 ? 'убивает' : 'наносит урон',
      targetName: combatant.name,
      value: damage,
      type: 'damage'
    })
    
    if (newHp <= 0) {
      addLog({
        round: battle.round,
        actorName: combatant.name,
        action: 'погибает в бою',
        type: 'system'
      })
    }
    
    return { newHp, isAlive: newHp > 0 }
  }

  async function healCombatant(combatantId: string, healing: number, healerName?: string) {
    const battle = currentBattle.value
    if (!battle) return
    
    const combatant = battle.combatants.find((c: Combatant) => c.id === combatantId)
    if (!combatant) return
    
    const newHp = Math.min(combatant.maxHp, combatant.currentHp + healing)
    const actualHeal = newHp - combatant.currentHp
    
    await updateCombatant(combatantId, { currentHp: newHp })
    
    addLog({
      round: battle.round,
      actorName: healerName || 'Целитель',
      action: 'восстанавливает HP',
      targetName: combatant.name,
      value: actualHeal,
      type: 'heal'
    })
    
    return { newHp, healAmount: actualHeal }
  }

  async function useSkillOnTarget(
    attackerId: string,
    attackerName: string,
    targetId: string,
    skillName: string,
    skillDamage: string,
    damageType: string
  ) {
    const battle = currentBattle.value
    if (!battle) return
    
    const damage = rollDamage(skillDamage)
    
    const target = battle.combatants.find((c: Combatant) => c.id === targetId)
    if (!target) return
    
    const newHp = Math.max(0, target.currentHp - damage)
    await updateCombatant(targetId, {
      currentHp: newHp,
      isAlive: newHp > 0
    })
    
    addLog({
      round: battle.round,
      actorName: attackerName,
      action: `использует "${skillName}" (${damageType})`,
      targetName: target.name,
      value: damage,
      type: 'damage'
    })
    
    return { targetName: target.name, damage, newHp, isAlive: newHp > 0 }
  }

  function rollDamage(formula: string): number {
    const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/)
    if (!match) return parseInt(formula) || 0
    
    const count = parseInt(match[1])
    const sides = parseInt(match[2])
    const modifier = match[3] ? parseInt(match[3]) : 0
    
    let total = 0
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1
    }
    
    return total + modifier
  }

  async function addCombatant(combatant: Combatant) {
    const battle = currentBattle.value
    if (!battle) return
    
    try {
      const response = await api.post(`/battles/${battle.id}/add-combatant`, { combatant })
      currentBattle.value = response.data.battle
      
      addLog({
        round: battle.round,
        actorName: combatant.name,
        action: 'присоединяется к бою!',
        type: 'system'
      })
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to add combatant'
      throw err
    }
  }

  async function removeCombatant(combatantId: string) {
    const battle = currentBattle.value
    if (!battle) return
    
    const combatant = battle.combatants.find((c: Combatant) => c.id === combatantId)
    const name = combatant?.name
    
    try {
      const response = await api.post(`/battles/${battle.id}/remove-combatant/${combatantId}`)
      currentBattle.value = response.data.battle
      
      if (name) {
        addLog({
          round: battle.round,
          actorName: name,
          action: 'удалён из боя',
          type: 'system'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to remove combatant'
      throw err
    }
  }

  async function endBattle(winner?: string) {
    const battle = currentBattle.value
    if (!battle) return
    
    loading.value = true
    try {
      const response = await api.post(`/battles/${battle.id}/end`, { winner })
      
      addLog({
        round: battle.round,
        actorName: 'Система',
        action: `Бой завершён! ${winner ? 'Победитель: ' + winner : ''}`,
        type: 'system'
      })
      
      // Очищаем бой через 1.5 секунды
      setTimeout(() => {
        currentBattle.value = null
        battleLog.value = []
      }, 1500)
      
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to end battle'
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    currentBattle.value = null
    battleLog.value = []
    loading.value = false
    error.value = null
  }

  return {
    currentBattle,
    battleLog,
    loading,
    error,
    isActive,
    isFinished,
    currentCombatant,
    activeCombatants,
    initiativeOrder,
    aliveEnemies,
    aliveAllies,
    fetchBattle,
    startBattle,
    nextTurn,
    updateCombatant,
    damageCombatant,
    healCombatant,
    useSkillOnTarget,
    rollDamage,
    addCombatant,
    removeCombatant,
    endBattle,
    addLog,
    reset
  }
})