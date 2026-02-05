<template>
  <div class="ability-score-distribution">
    <div class="distribution-header">
      <h4>Распределение характеристик</h4>
      <div class="points-info">
        <span>Осталось очков: <strong>{{ remainingPoints }}</strong></span>
        <Button 
          label="Сбросить" 
          size="small" 
          severity="secondary" 
          @click="resetScores"
          :disabled="loading"
        />
      </div>
    </div>
    
    <div class="ability-scores-grid">
      <div v-for="(ability, index) in abilities" :key="ability.key" class="ability-score-item">
        <div class="ability-header">
          <span class="ability-name">{{ abilityNames[ability.key] }}</span>
          <span class="ability-modifier">
            {{ getModifier(scores[ability.key]) >= 0 ? '+' : '' }}{{ getModifier(scores[ability.key]) }}
          </span>
        </div>
        
        <div class="ability-controls">
          <InputNumber 
            v-model="scores[ability.key]" 
            :min="8" 
            :max="15" 
            :step="1"
            :disabled="loading"
            showButtons
            buttonLayout="horizontal"
            decrementButtonClass="p-button-secondary"
            incrementButtonClass="p-button-secondary"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            @input="onScoreChange(ability.key)"
          />
          
          <div class="ability-buttons">
            <Button 
              icon="pi pi-plus" 
              size="small" 
              :disabled="scores[ability.key] >= 15 || remainingPoints <= 0 || loading"
              @click="increaseScore(ability.key)"
              aria-label="Увеличить"
            />
            <Button 
              icon="pi pi-minus" 
              size="small" 
              :disabled="scores[ability.key] <= 8 || loading"
              @click="decreaseScore(ability.key)"
              aria-label="Уменьшить"
            />
          </div>
        </div>
        
        <div class="ability-cost">
          <small>Стоимость: {{ getPointCost(ability.key) }}</small>
        </div>
      </div>
    </div>
    
    <div class="distribution-summary">
      <div class="summary-item">
        <strong>Базовая сумма очков:</strong>
        <span>27</span>
      </div>
      <div class="summary-item">
        <strong>Использовано очков:</strong>
        <span>{{ usedPoints }}</span>
      </div>
      <div class="summary-item">
        <strong>Осталось очков:</strong>
        <span :class="{ 'error-text': remainingPoints < 0 }">{{ remainingPoints }}</span>
      </div>
    </div>
    
    <div v-if="remainingPoints < 0" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>Использовано слишком много очков! Уменьшите характеристики.</span>
    </div>
    
    <div v-if="remainingPoints > 0" class="warning-message">
      <i class="pi pi-info-circle"></i>
      <span>У вас остались неиспользованные очки.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

interface Props {
  modelValue?: Record<string, number>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8
  }),
  loading: false
})

const emit = defineEmits(['update:modelValue', 'valid'])

const abilities = [
  { key: 'strength' },
  { key: 'dexterity' },
  { key: 'constitution' },
  { key: 'intelligence' },
  { key: 'wisdom' },
  { key: 'charisma' }
]

const abilityNames: Record<string, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма'
}

// Очки характеристик (по системе D&D 5e)
const scores = ref<Record<string, number>>({ ...props.modelValue })

// Система стоимости очков (стандартная для D&D 5e)
const pointCost = [
  { score: 8, cost: 0 },
  { score: 9, cost: 1 },
  { score: 10, cost: 2 },
  { score: 11, cost: 3 },
  { score: 12, cost: 4 },
  { score: 13, cost: 5 },
  { score: 14, cost: 7 },
  { score: 15, cost: 9 }
]

// Вычисляем стоимость очков для характеристики
const getPointCost = (ability: string) => {
  const score = scores.value[ability]
  const cost = pointCost.find(p => p.score === score)
  return cost ? cost.cost : 0
}

// Общее количество использованных очков
const usedPoints = computed(() => {
  return abilities.reduce((total, ability) => {
    return total + getPointCost(ability.key)
  }, 0)
})

// Остаток очков (стандартная система: 27 очков)
const remainingPoints = computed(() => {
  return 27 - usedPoints.value
})

// Проверяем, валидно ли распределение
const isValid = computed(() => {
  return remainingPoints.value === 0 && 
         Object.values(scores.value).every(score => score >= 8 && score <= 15)
})

// Модификатор характеристики
const getModifier = (score: number) => {
  return Math.floor((score - 10) / 2)
}

// Увеличение характеристики
const increaseScore = (ability: string) => {
  if (scores.value[ability] < 15 && remainingPoints.value > 0) {
    scores.value[ability]++
    onScoreChange(ability)
  }
}

// Уменьшение характеристики
const decreaseScore = (ability: string) => {
  if (scores.value[ability] > 8) {
    scores.value[ability]--
    onScoreChange(ability)
  }
}

// Сброс характеристик
const resetScores = () => {
  scores.value = {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8
  }
  emit('update:modelValue', scores.value)
  emit('valid', isValid.value)
}

// Обработчик изменения
const onScoreChange = (ability: string) => {
  emit('update:modelValue', scores.value)
  emit('valid', isValid.value)
}

// Следим за изменениями props
watch(() => props.modelValue, (newScores) => {
  if (newScores) {
    scores.value = { ...newScores }
  }
}, { deep: true })

// Инициализация
watch(scores, () => {
  emit('update:modelValue', scores.value)
  emit('valid', isValid.value)
}, { immediate: true })
</script>

<style scoped>
.ability-score-distribution {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.distribution-header h4 {
  margin: 0;
  color: #1f2937;
}

.points-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.points-info strong {
  font-size: 1.25rem;
  color: #3b82f6;
}

.ability-scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (min-width: 768px) {
  .ability-scores-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.ability-score-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ability-name {
  font-weight: 600;
  color: #1f2937;
}

.ability-modifier {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.875rem;
}

.ability-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ability-controls .p-inputnumber {
  flex-grow: 1;
}

.ability-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ability-cost {
  margin-top: 8px;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.distribution-summary {
  display: flex;
  justify-content: space-between;
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-item strong {
  color: #6b7280;
  font-size: 0.875rem;
}

.summary-item span {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}

.error-text {
  color: #dc2626 !important;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #d97706;
}

.error-message i,
.warning-message i {
  font-size: 1.25rem;
}
</style>