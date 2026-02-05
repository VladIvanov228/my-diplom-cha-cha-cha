<template>
  <div class="skills-section">
    <div class="section-header">
      <h3>Навыки</h3>
      <div class="section-actions">
        <span class="proficiency-bonus">
          Бонус мастерства: +{{ character.proficiency_bonus || 2 }}
        </span>
        <Button 
          label="Сохранить" 
          size="small" 
          @click="saveSkills"
          :loading="saving"
          :disabled="!hasChanges"
        />
      </div>
    </div>

    <div v-if="loading" class="loading">
      <ProgressSpinner />
    </div>

    <div v-else class="skills-container">
      <div class="skills-header">
        <div class="header-controls">
          <span>Влад.</span>
          <span>Эксп.</span>
        </div>
        <div class="header-name">Навык</div>
        <div class="header-mod">Модиф.</div>
      </div>

      <div class="skills-list">
        <SkillItem
          v-for="(skillData, index) in skills"
          :key="skillData.skill.id"
          :skill="skillData.skill"
          :character="character"
          :modelValue="skillData.characterSkill"
          @update:modelValue="onSkillChange(index, $event)"
          :disabled="loading || saving"
        />
      </div>

      <div class="skills-summary">
        <div class="summary-item">
          <strong>Всего владений:</strong>
          <span>{{ proficientCount }}</span>
        </div>
        <div class="summary-item">
          <strong>Всего экспертиз:</strong>
          <span>{{ expertiseCount }}</span>
        </div>
        <div v-if="hasChanges" class="summary-item changes">
          <strong>Есть несохраненные изменения</strong>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import SkillItem from '../ui/SkillItem.vue'
import { DND_SKILLS } from '@/data/dndSkills'
import type { Character } from '@/types/character'

const props = defineProps<{
  character: Character
}>()

const emit = defineEmits(['update'])

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)

interface CharacterSkill {
  skill_id: string
  proficient: boolean
  expertise: boolean
  custom_bonus?: number
  notes?: string
}

interface SkillData {
  skill: any
  characterSkill: CharacterSkill
}

const skills = ref<SkillData[]>([])

// Подсчет статистики
const proficientCount = computed(() => {
  return skills.value.filter(s => s.characterSkill.proficient).length
})

const expertiseCount = computed(() => {
  return skills.value.filter(s => s.characterSkill.expertise).length
})

// Загружаем навыки персонажа
const loadSkills = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/characters/${props.character.id}/skills`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Ошибка загрузки навыков')
    }

    const characterSkills: CharacterSkill[] = await response.json()
    
    // Создаем полный массив навыков
    skills.value = DND_SKILLS.map(skill => {
      const characterSkill = characterSkills.find(cs => cs.skill_id === skill.id) || {
        skill_id: skill.id,
        proficient: false,
        expertise: false,
        custom_bonus: 0
      }
      
      return {
        skill,
        characterSkill
      }
    })

    hasChanges.value = false
  } catch (error) {
    console.error('Error loading skills:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить навыки персонажа',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Сохраняем навыки
const saveSkills = async () => {
  saving.value = true
  try {
    const skillsToSave = skills.value.map(s => s.characterSkill)
    
    const response = await fetch(`/api/characters/${props.character.id}/skills`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ skills: skillsToSave })
    })

    if (!response.ok) {
      throw new Error('Ошибка сохранения навыков')
    }

    await loadSkills() // Перезагружаем для обновления данных
    
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Навыки сохранены',
      life: 2000
    })

    emit('update') // Уведомляем родительский компонент об обновлении
  } catch (error) {
    console.error('Error saving skills:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось сохранить навыки',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Обработчик изменения навыка
const onSkillChange = (index: number, newValue: CharacterSkill) => {
  skills.value[index].characterSkill = newValue
  hasChanges.value = true
}

// Автосохранение при изменении персонажа
watch(() => props.character, () => {
  if (skills.value.length > 0) {
    loadSkills()
  }
})

// Инициализация
onMounted(() => {
  loadSkills()
})
</script>

<style scoped>
.skills-section {
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.proficiency-bonus {
  font-weight: 600;
  color: #3b82f6;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.skills-container {
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.skills-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #4b5563;
}

.header-controls {
  display: flex;
  gap: 12px;
  min-width: 80px;
}

.header-name {
  flex-grow: 1;
}

.header-mod {
  min-width: 60px;
  text-align: center;
}

.skills-list {
  max-height: 400px;
  overflow-y: auto;
}

.skills-list > * {
  border-bottom: 1px solid #f3f4f6;
}

.skills-list > *:last-child {
  border-bottom: none;
}

.skills-summary {
  padding: 16px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.summary-item.changes {
  color: #dc2626;
}

@media (max-width: 640px) {
  .skills-section {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .section-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .skills-summary {
    flex-direction: column;
    gap: 12px;
  }
}
</style>