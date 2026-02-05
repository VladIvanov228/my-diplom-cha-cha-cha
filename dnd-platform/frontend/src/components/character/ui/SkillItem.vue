<template>
  <div class="skill-item" :class="{ 'proficient': modelValue.proficient }">
    <div class="skill-controls">
      <Checkbox 
        v-model="modelValue.proficient" 
        :binary="true" 
        @change="onChange"
        :disabled="disabled"
        aria-label="Владение навыком"
      />
      <Checkbox 
        v-model="modelValue.expertise" 
        :binary="true" 
        @change="onChange"
        :disabled="!modelValue.proficient || disabled"
        aria-label="Экспертность"
      />
    </div>
    
    <div class="skill-info">
      <span class="skill-name">{{ skill.name }}</span>
      <span class="skill-ability">{{ getAbilityName(skill.ability) }}</span>
    </div>
    
    <div class="skill-modifier">
      <span class="modifier-value">
        {{ calculatedModifier >= 0 ? '+' : '' }}{{ calculatedModifier }}
      </span>
    </div>

    <Tooltip v-if="skill.description" :position="'top'">
      <template #content>
        {{ skill.description }}
      </template>
      <Button 
        icon="pi pi-info-circle" 
        severity="secondary" 
        text 
        rounded 
        aria-label="Описание навыка"
      />
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import Checkbox from 'primevue/checkbox'
import Tooltip from 'primevue/tooltip'
import Button from 'primevue/button'

interface Skill {
  id: string
  name: string
  ability: string
  description?: string
}

interface CharacterSkill {
  skill_id: string
  proficient: boolean
  expertise: boolean
  custom_bonus?: number
  notes?: string
}

const props = defineProps({
  skill: {
    type: Object as PropType<Skill>,
    required: true
  },
  modelValue: {
    type: Object as PropType<CharacterSkill>,
    required: true
  },
  character: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const abilityNames: Record<string, string> = {
  strength: 'Сил',
  dexterity: 'Лов',
  constitution: 'Тел',
  intelligence: 'Инт',
  wisdom: 'Мдр',
  charisma: 'Хар'
}

const getAbilityName = (ability: string): string => {
  return abilityNames[ability] || ability
}

const calculatedModifier = computed(() => {
  const abilityScore = props.character[props.skill.ability] || 10
  const abilityMod = Math.floor((abilityScore - 10) / 2)
  const proficiencyBonus = props.character.proficiency_bonus || 2
  
  let total = abilityMod
  if (props.modelValue.proficient) {
    total += proficiencyBonus
  }
  if (props.modelValue.expertise) {
    total += proficiencyBonus // Удваиваем за экспертность
  }
  if (props.modelValue.custom_bonus) {
    total += props.modelValue.custom_bonus
  }
  
  return total
})

const onChange = () => {
  emit('update:modelValue', props.modelValue)
  emit('change', props.modelValue)
}
</script>

<style scoped>
.skill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.skill-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skill-item.proficient {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.skill-controls {
  display: flex;
  gap: 4px;
}

.skill-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.skill-name {
  font-weight: 500;
  color: #1f2937;
}

.skill-ability {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.skill-modifier {
  min-width: 50px;
  text-align: center;
}

.modifier-value {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  font-weight: bold;
  font-size: 1rem;
  color: #3b82f6;
  background: white;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.proficient .modifier-value {
  background: #dbeafe;
  border-color: #3b82f6;
}
</style>