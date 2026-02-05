<template>
  <div class="ability-scores">
    <h3>Характеристики</h3>
    
    <div class="abilities-grid">
      <AbilityScore 
        v-for="ability in abilities"
        :key="ability.key"
        :label="ability.label"
        :score="character[ability.key]"
        :modifier="getModifier(character[ability.key])"
        @update="(value) => updateAbility(ability.key, value)"
      />
    </div>

    <div class="derived-stats">
      <div class="stat">
        <span>Бонус мастерства</span>
        <strong>+{{ character.proficiency_bonus || 0 }}</strong>
      </div>
      <div class="stat">
        <span>Пассивная мудрость</span>
        <strong>{{ getPassivePerception() }}</strong>
      </div>
      <div class="stat">
        <span>Вдохновение</span>
        <InputSwitch v-model="character.inspiration" @change="updateInspiration" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import AbilityScore from './AbilityScore.vue'

const props = defineProps<{
  character: any
}>()

const emit = defineEmits<{
  update: [updates: any]
}>()

const abilities = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкость' },
  { key: 'constitution', label: 'Телосложение' },
  { key: 'intelligence', label: 'Интеллект' },
  { key: 'wisdom', label: 'Мудрость' },
  { key: 'charisma', label: 'Харизма' }
]

const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2)
}

const getPassivePerception = (): number => {
  const wisdomMod = getModifier(props.character.wisdom)
  return 10 + wisdomMod + (props.character.proficiency_bonus || 0)
}

const updateAbility = (ability: string, value: number) => {
  const updates = { [ability]: value }
  
  // Автоматически пересчитываем производные характеристики
  if (ability === 'constitution') {
    updates.hit_points = 10 + Math.floor((value - 10) / 2)
  } else if (ability === 'dexterity') {
    updates.armor_class = 10 + Math.floor((value - 10) / 2)
  }
  
  emit('update', updates)
}

const updateInspiration = () => {
  emit('update', { inspiration: props.character.inspiration })
}
</script>

<style scoped>
.ability-scores {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
}

.ability-scores h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.derived-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat span {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat strong {
  font-size: 1.2rem;
  color: #111827;
}

@media (max-width: 768px) {
  .abilities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .derived-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>