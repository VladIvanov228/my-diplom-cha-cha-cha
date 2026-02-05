<template>
  <div class="ability-score">
    <div class="ability-label">{{ label }}</div>
    <div class="ability-value">
      <div class="score-display">
        <button class="score-btn minus" @click="decrement">−</button>
        <div class="score">{{ score }}</div>
        <button class="score-btn plus" @click="increment">+</button>
      </div>
      <div class="modifier">
        {{ modifier >= 0 ? '+' : '' }}{{ modifier }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  score: number
  modifier: number
}>()

const emit = defineEmits<{
  update: [score: number]
}>()

const increment = () => {
  if (props.score < 20) {
    emit('update', props.score + 1)
  }
}

const decrement = () => {
  if (props.score > 1) {
    emit('update', props.score - 1)
  }
}
</script>

<style scoped>
.ability-score {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.2s;
}

.ability-score:hover {
  border-color: #3b82f6;
}

.ability-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.ability-value {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.score {
  font-size: 1.8rem;
  font-weight: bold;
  color: #111827;
  min-width: 40px;
}

.score-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: white;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
}

.score-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.score-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modifier {
  font-size: 1.2rem;
  font-weight: bold;
  color: #3b82f6;
  padding: 4px 12px;
  background: #eff6ff;
  border-radius: 20px;
  min-width: 40px;
}
</style>