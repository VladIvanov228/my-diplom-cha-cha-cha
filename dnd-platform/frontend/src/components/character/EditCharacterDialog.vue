<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    :header="`Редактирование персонажа: ${character?.name || ''}`"
    :style="{ width: '95vw', maxWidth: '1200px', maxHeight: '90vh' }"
    @hide="resetForm"
  >
    <div class="edit-character-form">
      <!-- Индикатор загрузки -->
      <div v-if="loading" class="loading-overlay">
        <ProgressSpinner />
        <span>Загрузка данных персонажа...</span>
      </div>
      
      <!-- Сообщение об ошибке -->
      <div v-if="error" class="error-overlay">
        <i class="pi pi-exclamation-triangle"></i>
        <div class="error-content">
          <h4>Ошибка загрузки</h4>
          <p>{{ error }}</p>
          <Button 
            label="Повторить" 
            @click="loadCharacter" 
            severity="secondary" 
            size="small"
          />
        </div>
      </div>
      
      <div class="form-content" :class="{ 'loading': loading, 'error': error }">
        <div class="form-layout">
          <!-- Левая колонка: Основная информация -->
          <div class="form-column main-info">
            <div class="form-section">
              <h3>Основная информация</h3>
              
              <div class="form-field">
                <label for="name" class="required">Имя персонажа</label>
                <InputText 
                  id="name"
                  v-model="characterData.name"
                  :class="{ 'p-invalid': !characterData.name && formSubmitted }"
                  placeholder="Введите имя персонажа"
                  class="w-full"
                />
                <small v-if="!characterData.name && formSubmitted" class="p-error">
                  Укажите имя персонажа
                </small>
              </div>
              
              <div class="form-field">
                <label for="level" class="required">Уровень</label>
                <InputNumber 
                  id="level"
                  v-model="characterData.level"
                  :min="1"
                  :max="20"
                  :step="1"
                  showButtons
                  buttonLayout="horizontal"
                  decrementButtonClass="p-button-secondary"
                  incrementButtonClass="p-button-secondary"
                  class="w-full"
                />
              </div>
              
              <div class="form-field">
                <label for="class" class="required">Класс</label>
                <InputText 
                  id="class"
                  v-model="characterData.class"
                  :class="{ 'p-invalid': !characterData.class && formSubmitted }"
                  placeholder="Класс персонажа"
                  class="w-full"
                  disabled
                />
                <small class="field-hint">Класс нельзя изменить после создания</small>
              </div>
              
              <div class="form-field">
                <label for="race" class="required">Раса</label>
                <InputText 
                  id="race"
                  v-model="characterData.race"
                  :class="{ 'p-invalid': !characterData.race && formSubmitted }"
                  placeholder="Раса персонажа"
                  class="w-full"
                  disabled
                />
                <small class="field-hint">Расу нельзя изменить после создания</small>
              </div>
              
              <div class="form-field">
                <label for="background">Предыстория</label>
                <InputText 
                  id="background"
                  v-model="characterData.background"
                  placeholder="Например: Народный герой"
                  class="w-full"
                />
              </div>
              
              <div class="form-field">
                <label for="alignment">Мировоззрение</label>
                <Dropdown 
                  id="alignment"
                  v-model="characterData.alignment"
                  :options="alignments"
                  placeholder="Выберите мировоззрение"
                  class="w-full"
                />
              </div>
              
              <div class="form-field">
                <label for="experience_points">Опыт (XP)</label>
                <InputNumber 
                  id="experience_points"
                  v-model="characterData.experience_points"
                  :min="0"
                  :step="100"
                  showButtons
                  buttonLayout="horizontal"
                  decrementButtonClass="p-button-secondary"
                  incrementButtonClass="p-button-secondary"
                  class="w-full"
                />
              </div>
            </div>
            
            <div class="form-section">
              <h3>Личность</h3>
              
              <div class="form-field">
                <label for="personality_traits">Черты характера</label>
                <Textarea 
                  id="personality_traits"
                  v-model="characterData.personality_traits"
                  rows="3"
                  class="w-full"
                  placeholder="Опишите черты характера персонажа"
                />
              </div>
              
              <div class="form-field">
                <label for="ideals">Идеалы</label>
                <Textarea 
                  id="ideals"
                  v-model="characterData.ideals"
                  rows="2"
                  class="w-full"
                  placeholder="Во что верит персонаж"
                />
              </div>
              
              <div class="form-field">
                <label for="bonds">Привязанности</label>
                <Textarea 
                  id="bonds"
                  v-model="characterData.bonds"
                  rows="2"
                  class="w-full"
                  placeholder="Люди, места или события, важные для персонажа"
                />
              </div>
              
              <div class="form-field">
                <label for="flaws">Слабости</label>
                <Textarea 
                  id="flaws"
                  v-model="characterData.flaws"
                  rows="2"
                  class="w-full"
                  placeholder="Недостатки и слабости персонажа"
                />
              </div>
            </div>
          </div>
          
          <!-- Центральная колонка: Характеристики и навыки -->
          <div class="form-column abilities-skills">
            <div class="form-section">
              <h3>Характеристики</h3>
              <div class="abilities-grid">
                <div v-for="ability in abilities" :key="ability.key" class="ability-item">
                  <div class="ability-header">
                    <span class="ability-name">{{ abilityNames[ability.key] }}</span>
                    <span class="ability-modifier">
                      {{ getModifier(characterData[ability.key]) >= 0 ? '+' : '' }}{{ getModifier(characterData[ability.key]) }}
                    </span>
                  </div>
                  <InputNumber 
                    v-model="characterData[ability.key]"
                    :min="1"
                    :max="30"
                    :step="1"
                    showButtons
                    buttonLayout="horizontal"
                    decrementButtonClass="p-button-secondary"
                    incrementButtonClass="p-button-secondary"
                    class="w-full"
                    @update:modelValue="updateDerivedStats"
                  />
                </div>
              </div>
              
              <div class="derived-stats">
                <div class="stat-item">
                  <label>Хит-поинты</label>
                  <InputNumber 
                    v-model="characterData.hit_points"
                    :min="1"
                    :step="1"
                    class="w-full"
                  />
                </div>
                <div class="stat-item">
                  <label>Класс брони</label>
                  <InputNumber 
                    v-model="characterData.armor_class"
                    :min="1"
                    :step="1"
                    class="w-full"
                  />
                </div>
                <div class="stat-item">
                  <label>Бонус мастерства</label>
                  <InputNumber 
                    v-model="characterData.proficiency_bonus"
                    :min="2"
                    :max="6"
                    :step="1"
                    class="w-full"
                  />
                </div>
                <div class="stat-item">
                  <label>Скорость</label>
                  <InputNumber 
                    v-model="characterData.speed"
                    :min="5"
                    :step="5"
                    class="w-full"
                  />
                  <small class="field-hint">фт.</small>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Особенности и заметки</h3>
              
              <div class="form-field">
                <label for="features">Особенности</label>
                <Textarea 
                  id="features"
                  v-model="characterData.features"
                  rows="4"
                  class="w-full"
                  placeholder="Особенности класса, расы, таланты и т.д."
                />
              </div>
              
              <div class="form-field">
                <label for="notes">Заметки</label>
                <Textarea 
                  id="notes"
                  v-model="characterData.notes"
                  rows="4"
                  class="w-full"
                  placeholder="Дополнительные заметки о персонаже"
                />
              </div>
              
              <div class="form-field">
                <label for="inspiration">
                  <Checkbox 
                    id="inspiration"
                    v-model="characterData.inspiration"
                    :binary="true"
                  />
                  <span style="margin-left: 8px;">Вдохновение</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Правая колонка: Сводка и действия -->
          <div class="form-column summary-actions">
            <div class="form-section">
              <h3>Сводка изменений</h3>
              
              <div class="changes-summary">
                <div class="change-item" v-for="change in changes" :key="change.field">
                  <strong>{{ change.label }}:</strong>
                  <span class="old-value">{{ change.oldValue }}</span>
                  <i class="pi pi-arrow-right"></i>
                  <span class="new-value">{{ change.newValue }}</span>
                </div>
                
                <div v-if="changes.length === 0" class="no-changes">
                  <i class="pi pi-info-circle"></i>
                  <span>Изменений нет</span>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Действия</h3>
              
              <div class="quick-actions">
                <Button 
                  label="Пересчитать HP" 
                  icon="pi pi-heart"
                  severity="secondary"
                  @click="recalculateHitPoints"
                  class="w-full mb-2"
                />
                <Button 
                  label="Пересчитать AC" 
                  icon="pi pi-shield"
                  severity="secondary"
                  @click="recalculateArmorClass"
                  class="w-full mb-2"
                />
                <Button 
                  label="Сбросить изменения" 
                  icon="pi pi-refresh"
                  severity="warning"
                  @click="resetToOriginal"
                  class="w-full"
                />
              </div>
              
              <div class="validation-messages">
                <div v-if="!characterData.name && formSubmitted" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Укажите имя персонажа</span>
                </div>
                <div v-if="saveError" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ saveError }}</span>
                </div>
              </div>
              
              <div class="form-actions">
                <Button 
                  label="Сохранить" 
                  icon="pi pi-save"
                  :loading="saving"
                  :disabled="!hasChanges || saving"
                  @click="saveCharacter"
                  class="save-button w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button label="Отмена" severity="secondary" @click="visible = false" />
      <Button 
        label="Удалить персонажа" 
        severity="danger" 
        @click="confirmDelete" 
        icon="pi pi-trash"
      />
    </template>
  </Dialog>
  
  <!-- Диалог подтверждения удаления -->
  <Dialog v-model:visible="deleteDialogVisible" header="Подтверждение удаления" :modal="true">
    <p>Вы уверены, что хотите удалить персонажа "{{ character?.name }}"?</p>
    <p class="p-error"><small>Это действие нельзя отменить!</small></p>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" @click="deleteDialogVisible = false" severity="secondary" />
      <Button label="Удалить" icon="pi pi-check" @click="deleteCharacter" severity="danger" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCharactersStore } from '@/stores/characters'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  visible: boolean
  characterId: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'character-updated', 'character-deleted'])

const toast = useToast()
const charactersStore = useCharactersStore()

// Данные
const originalCharacter = ref<any>(null)
const characterData = ref<any>({})
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)
const formSubmitted = ref(false)
const deleteDialogVisible = ref(false)

// Списки опций
const alignments = ref([
  'Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый',
  'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный',
  'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой'
])

// Характеристики
const abilities = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкость' },
  { key: 'constitution', label: 'Телосложение' },
  { key: 'intelligence', label: 'Интеллект' },
  { key: 'wisdom', label: 'Мудрость' },
  { key: 'charisma', label: 'Харизма' }
]

const abilityNames: Record<string, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма'
}

// Вспомогательные функции
const getModifier = (score: number) => {
  return Math.floor((score - 10) / 2)
}

// Вычисляемые свойства
const character = computed(() => originalCharacter.value)

const hasChanges = computed(() => {
  if (!originalCharacter.value) return false
  
  return Object.keys(characterData.value).some(key => {
    const oldVal = originalCharacter.value[key]
    const newVal = characterData.value[key]
    
    // Сравниваем с учётом типов
    return String(oldVal) !== String(newVal)
  })
})

const changes = computed(() => {
  if (!originalCharacter.value) return []
  
  const changesList: Array<{
    field: string
    label: string
    oldValue: any
    newValue: any
  }> = []
  
  Object.keys(characterData.value).forEach(key => {
    const oldVal = originalCharacter.value[key]
    const newVal = characterData.value[key]
    
    if (String(oldVal) !== String(newVal)) {
      let label = key
      switch(key) {
        case 'name': label = 'Имя'; break
        case 'level': label = 'Уровень'; break
        case 'background': label = 'Предыстория'; break
        case 'alignment': label = 'Мировоззрение'; break
        case 'experience_points': label = 'Опыт'; break
        case 'hit_points': label = 'Хит-поинты'; break
        case 'armor_class': label = 'Класс брони'; break
        case 'proficiency_bonus': label = 'Бонус мастерства'; break
        case 'strength': label = 'Сила'; break
        case 'dexterity': label = 'Ловкость'; break
        case 'constitution': label = 'Телосложение'; break
        case 'intelligence': label = 'Интеллект'; break
        case 'wisdom': label = 'Мудрость'; break
        case 'charisma': label = 'Харизма'; break
      }
      
      changesList.push({
        field: key,
        label,
        oldValue: oldVal,
        newValue: newVal
      })
    }
  })
  
  return changesList
})

// Методы
const loadCharacter = async () => {
  if (!props.characterId) return
  
  loading.value = true
  error.value = null
  
  try {
    console.log('Loading character ID:', props.characterId)
    
    // Загружаем персонажа
    await charactersStore.fetchCharacter(props.characterId)
    
    if (!charactersStore.currentCharacter) {
      throw new Error('Персонаж не найден')
    }
    
    // Сохраняем оригинал и копию для редактирования
    originalCharacter.value = { ...charactersStore.currentCharacter }
    characterData.value = { ...charactersStore.currentCharacter }
    
    console.log('Character loaded:', characterData.value)
    
  } catch (err: any) {
    console.error('Error loading character:', err)
    error.value = err.message || 'Не удалось загрузить персонажа'
  } finally {
    loading.value = false
  }
}

const updateDerivedStats = () => {
  // Автоматический пересчёт HP при изменении телосложения
  if (characterData.value.constitution !== originalCharacter.value?.constitution) {
    const conMod = getModifier(characterData.value.constitution)
    characterData.value.hit_points = 10 + conMod
  }
  
  // Автоматический пересчёт AC при изменении ловкости
  if (characterData.value.dexterity !== originalCharacter.value?.dexterity) {
    const dexMod = getModifier(characterData.value.dexterity)
    characterData.value.armor_class = 10 + dexMod
  }
  
  // Автоматический пересчёт бонуса мастерства при изменении уровня
  if (characterData.value.level !== originalCharacter.value?.level) {
    characterData.value.proficiency_bonus = 2 + Math.floor((characterData.value.level - 1) / 4)
  }
}

const recalculateHitPoints = () => {
  const conMod = getModifier(characterData.value.constitution)
  const baseHP = 10 + conMod
  characterData.value.hit_points = baseHP
  toast.add({
    severity: 'success',
    summary: 'Хит-поинты пересчитаны',
    detail: `Новое значение: ${baseHP}`,
    life: 3000
  })
}

const recalculateArmorClass = () => {
  const dexMod = getModifier(characterData.value.dexterity)
  const baseAC = 10 + dexMod
  characterData.value.armor_class = baseAC
  toast.add({
    severity: 'success',
    summary: 'Класс брони пересчитан',
    detail: `Новое значение: ${baseAC}`,
    life: 3000
  })
}

const resetToOriginal = () => {
  if (originalCharacter.value) {
    characterData.value = { ...originalCharacter.value }
    toast.add({
      severity: 'info',
      summary: 'Изменения сброшены',
      detail: 'Все поля восстановлены к исходным значениям',
      life: 3000
    })
  }
}

const saveCharacter = async () => {
  formSubmitted.value = true
  
  if (!characterData.value.name) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Укажите имя персонажа',
      life: 3000
    })
    return
  }
  
  saving.value = true
  saveError.value = null
  
  try {
    // Подготавливаем данные для отправки
    const updates: any = {}
    
    // Собираем только изменённые поля
    Object.keys(characterData.value).forEach(key => {
      if (originalCharacter.value && 
          String(characterData.value[key]) !== String(originalCharacter.value[key])) {
        updates[key] = characterData.value[key]
      }
    })
    
    // Убираем неизменяемые поля
    delete updates.id
    delete updates.user_id
    delete updates.created_at
    delete updates.updated_at
    delete updates.class
    delete updates.race
    
    console.log('Saving updates:', updates)
    
    if (Object.keys(updates).length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Нет изменений',
        detail: 'Нечего сохранять',
        life: 3000
      })
      return
    }
    
    // Отправляем обновление
    const updatedCharacter = await charactersStore.updateCharacter(
      props.characterId,
      updates
    )
    
    // Обновляем оригинал
    originalCharacter.value = { ...updatedCharacter }
    
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: `Персонаж "${characterData.value.name}" обновлён`,
      life: 3000
    })
    
    emit('character-updated', updatedCharacter)
    visible.value = false
    
  } catch (err: any) {
    console.error('Error saving character:', err)
    saveError.value = err.message || 'Не удалось сохранить изменения'
    
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: saveError.value,
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = () => {
  deleteDialogVisible.value = true
}

const deleteCharacter = async () => {
  try {
    await charactersStore.deleteCharacter(props.characterId)
    
    toast.add({
      severity: 'success',
      summary: 'Удалено',
      detail: `Персонаж "${characterData.value.name}" удалён`,
      life: 3000
    })
    
    deleteDialogVisible.value = false
    visible.value = false
    
    emit('character-deleted', props.characterId)
    
  } catch (err: any) {
    console.error('Error deleting character:', err)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: err.message || 'Не удалось удалить персонажа',
      life: 3000
    })
  }
}

const resetForm = () => {
  originalCharacter.value = null
  characterData.value = {}
  error.value = null
  saveError.value = null
  formSubmitted.value = false
}

// Видимость диалога
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Загружаем данные при открытии
watch(visible, (newVal) => {
  if (newVal && props.characterId) {
    loadCharacter()
  } else {
    resetForm()
  }
})
</script>

<style scoped>
.edit-character-form {
  position: relative;
  min-height: 500px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 6px;
}

.loading-overlay {
  gap: 16px;
  color: #6b7280;
}

.error-overlay {
  gap: 20px;
  text-align: center;
  padding: 40px;
  color: #dc2626;
}

.error-overlay i {
  font-size: 3rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
}

.error-content h4 {
  margin: 0;
  color: #dc2626;
}

.error-content p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.form-content.loading,
.form-content.error {
  opacity: 0.5;
  pointer-events: none;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.125rem;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.form-field {
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-field label.required::after {
  content: ' *';
  color: #dc2626;
}

.field-hint {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
}

.w-full {
  width: 100%;
}

.w-full.mb-2 {
  margin-bottom: 8px;
}

.p-invalid {
  border-color: #ef4444 !important;
}

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

/* Стили для характеристик */
.abilities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.ability-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ability-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
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

.derived-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Стили для сводки изменений */
.changes-summary {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.change-item:last-child {
  border-bottom: none;
}

.change-item strong {
  min-width: 120px;
  color: #4b5563;
  font-size: 0.875rem;
}

.old-value {
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 0.875rem;
}

.new-value {
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
}

.change-item i {
  color: #6b7280;
  font-size: 0.875rem;
}

.no-changes {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-style: italic;
  padding: 12px 0;
  justify-content: center;
}

/* Быстрые действия */
.quick-actions {
  margin-bottom: 20px;
}

/* Валидация */
.validation-messages {
  margin: 16px 0;
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.validation-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.validation-error:last-child {
  margin-bottom: 0;
}

.validation-error i {
  font-size: 1rem;
}

/* Кнопки */
.form-actions {
  margin-top: 24px;
}

.save-button {
  height: 48px;
  font-size: 1.1rem;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .form-layout {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-column.summary-actions {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
  
  .form-column.summary-actions {
    grid-column: span 1;
  }
  
  .abilities-grid {
    grid-template-columns: 1fr;
  }
  
  .derived-stats {
    grid-template-columns: 1fr;
  }
}

/* Полоса прокрутки */
.form-layout::-webkit-scrollbar {
  width: 6px;
}

.form-layout::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.form-layout::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.form-layout::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>