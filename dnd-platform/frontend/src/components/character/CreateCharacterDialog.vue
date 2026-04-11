<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    header="Создание нового персонажа"
    :style="{ width: '95vw', maxWidth: '1400px', maxHeight: '90vh' }"
    @hide="resetForm"
  >
    <div class="create-character-form">
      <!-- Индикатор загрузки данных -->
      <div v-if="loadingData" class="loading-overlay">
        <ProgressSpinner />
        <span>Загрузка данных классов и рас...</span>
      </div>
      
      <!-- Сообщение об ошибке -->
      <div v-if="dataLoadError" class="error-overlay">
        <i class="pi pi-exclamation-triangle"></i>
        <div class="error-content">
          <h4>Ошибка загрузки данных</h4>
          <p>{{ dataLoadErrorMessage }}</p>
          <div class="error-details" v-if="apiErrorDetails">
            <small>Детали: {{ apiErrorDetails }}</small>
          </div>
          <div class="error-actions">
            <Button 
              label="Повторить загрузку" 
              @click="loadData" 
              severity="secondary" 
              size="small"
            />
            <Button 
              label="Проверить соединение" 
              @click="runDiagnostics" 
              severity="info" 
              size="small"
            />
          </div>
        </div>
      </div>
      
      <div class="form-content" :class="{ 'loading': loadingData, 'error': dataLoadError }">
        <div class="form-layout">
          <!-- Левая колонка: Основная информация -->
          <div class="form-column main-info">
            <div class="form-section">
              <h3><i class="pi pi-user mr-2"></i>Основная информация</h3>
              
              <div class="form-field">
                <label for="name" class="required">
                  <i class="pi pi-id-card"></i> Имя персонажа
                </label>
                <InputText 
                  id="name"
                  v-model="characterData.name"
                  :class="{ 'p-invalid': !characterData.name && formSubmitted }"
                  placeholder="Введите имя персонажа"
                  class="w-full"
                />
                <small v-if="!characterData.name && formSubmitted" class="p-error">
                  <i class="pi pi-exclamation-circle"></i> Укажите имя персонажа
                </small>
              </div>
              
              <div class="form-row">
                <div class="form-field">
                  <label for="level" class="required">
                    <i class="pi pi-chart-line"></i> Уровень
                  </label>
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
                  <label for="experience_points">
                    <i class="pi pi-star"></i> Опыт (XP)
                  </label>
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
              
              <div class="form-field">
                <label for="class" class="required">
                  <i class="pi pi-briefcase"></i> Класс
                </label>
                <Dropdown 
                  id="class"
                  v-model="characterData.class"
                  :options="classesOptions"
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Выберите класс"
                  :loading="loadingData"
                  :disabled="loadingData || dataLoadError"
                  :class="{ 'p-invalid': !characterData.class && formSubmitted }"
                  filter
                  showClear
                  class="w-full"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="selected-option">
                      <i class="pi pi-briefcase mr-2"></i>
                      <span>{{ slotProps.value }}</span>
                    </div>
                    <span v-else class="placeholder-text">Выберите класс</span>
                  </template>
                  <template #option="slotProps">
                    <div class="class-option">
                      <strong>{{ slotProps.option.name }}</strong>
                      <div class="option-details">
                        <span><i class="pi pi-heart"></i> {{ slotProps.option.hit_dice }}</span>
                        <small>{{ slotProps.option.description?.substring(0, 60) }}...</small>
                      </div>
                    </div>
                  </template>
                </Dropdown>
                <small v-if="!characterData.class && formSubmitted" class="p-error">
                  <i class="pi pi-exclamation-circle"></i> Выберите класс
                </small>
                <small v-if="selectedClass" class="field-hint success">
                  <i class="pi pi-check-circle"></i> Кость хитов: {{ selectedClass.hit_dice }}
                </small>
              </div>
              
              <!-- Секция выбора стартового снаряжения -->
              <div class="form-section equipment-option" v-if="characterData.class">
                <h3><i class="pi pi-box"></i> Стартовое снаряжение</h3>
                <div class="field-checkbox">
                  <Checkbox
                    id="addStartingEquipment"
                    v-model="addStartingEquipment"
                    :binary="true"
                  />
                  <label for="addStartingEquipment"> Добавить стартовый набор класса</label>
                </div>

                <!-- Превью стартового снаряжения -->
                <div v-if="addStartingEquipment && startingEquipmentPreview.length > 0" class="starting-equipment-preview">
                  <h4>Предметы, которые будут добавлены:</h4>
                  <ul>
                    <li v-for="item in startingEquipmentPreview" :key="item.name">
                      <i :class="getItemIcon(item.type)"></i>
                      <strong>{{ item.name }}</strong>
                      <span v-if="item.quantity > 1"> x{{ item.quantity }}</span>
                      <span v-if="item.damage"> ({{ item.damage }} {{ item.damage_type }})</span>
                      <span v-if="item.armor_class_bonus"> (AC +{{ item.armor_class_bonus }})</span>
                      <small class="item-weight">{{ item.weight || 0 }} фнт.</small>
                    </li>
                  </ul>
                  <p class="currency-note">
                    <i class="pi pi-star"></i> Стартовая валюта:
                    {{ CLASS_STARTING_CURRENCY[characterData.class]?.gold || 0 }} зм,
                    {{ CLASS_STARTING_CURRENCY[characterData.class]?.silver || 0 }} см
                  </p>
                </div>
              </div>
              
              <div class="form-field">
                <label for="race" class="required">
                  <i class="pi pi-users"></i> Раса
                </label>
                <Dropdown 
                  id="race"
                  v-model="characterData.race"
                  :options="racesOptions"
                  optionLabel="name"
                  optionValue="name"
                  placeholder="Выберите расу"
                  :loading="loadingData"
                  :disabled="loadingData || dataLoadError"
                  :class="{ 'p-invalid': !characterData.race && formSubmitted }"
                  filter
                  showClear
                  class="w-full"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="selected-option">
                      <i class="pi pi-users mr-2"></i>
                      <span>{{ slotProps.value }}</span>
                    </div>
                    <span v-else class="placeholder-text">Выберите расу</span>
                  </template>
                  <template #option="slotProps">
                    <div class="race-option">
                      <strong>{{ slotProps.option.name }}</strong>
                      <div class="option-details">
                        <span><i class="pi pi-forward"></i> {{ slotProps.option.speed }} фт.</span>
                        <small>{{ slotProps.option.description?.substring(0, 60) }}...</small>
                      </div>
                    </div>
                  </template>
                </Dropdown>
                <small v-if="!characterData.race && formSubmitted" class="p-error">
                  <i class="pi pi-exclamation-circle"></i> Выберите расу
                </small>
                <small v-if="selectedRace" class="field-hint success">
                  <i class="pi pi-check-circle"></i> Скорость: {{ selectedRace.speed }} фт.
                  <span v-if="selectedRace.ability_bonuses" class="bonus-info">
                    | Бонусы: {{ formatAbilityBonuses(selectedRace.ability_bonuses) }}
                  </span>
                </small>
              </div>
              
              <!-- Блок расового навыка -->
              <div v-if="selectedRace && racePassiveSkill" class="form-section race-skill-section">
                <h3><i class="pi pi-users"></i> Расовый навык</h3>
                <SkillDetail 
                  :skill="racePassiveSkill"
                  :is-race-skill="true"
                />
              </div>

              <!-- Блок классовых навыков -->
              <div v-if="selectedClass && availableClassSkills.length > 0" class="form-section class-skills-section">
                <h3><i class="pi pi-briefcase"></i> Доступные навыки класса</h3>
                <div class="skills-list">
                  <div 
                    v-for="skill in availableClassSkills" 
                    :key="skill.id"
                    class="skill-select-item"
                  >
                    <ActiveSkillCard 
                      :skill="skill"
                      :is-loading="false"
                      @use="selectSkill"
                    />
                  </div>
                </div>
                <small class="field-hint">
                  <i class="pi pi-info-circle"></i>
                  Навыки будут доступны после создания персонажа
                </small>
              </div>
              
              <div class="form-field">
                <label for="background">
                  <i class="pi pi-history"></i> Предыстория
                </label>
                <InputText 
                  id="background"
                  v-model="characterData.background"
                  placeholder="Например: Народный герой, Благородный рыцарь"
                  class="w-full"
                />
              </div>
              
              <div class="form-field">
                <label for="alignment">
                  <i class="pi pi-compass"></i> Мировоззрение
                </label>
                <Dropdown 
                  id="alignment"
                  v-model="characterData.alignment"
                  :options="alignments"
                  placeholder="Выберите мировоззрение"
                  class="w-full"
                />
              </div>
            </div>
            
            <div class="form-section">
              <h3><i class="pi pi-heart"></i> Личность</h3>
              
              <div class="form-field">
                <label for="personality_traits">Черты характера</label>
                <Textarea 
                  id="personality_traits"
                  v-model="characterData.personality_traits"
                  rows="2"
                  class="w-full"
                  placeholder="Опишите основные черты характера персонажа"
                />
              </div>
              
              <div class="form-field">
                <label for="ideals">Идеалы</label>
                <Textarea 
                  id="ideals"
                  v-model="characterData.ideals"
                  rows="2"
                  class="w-full"
                  placeholder="Во что верит персонаж, его принципы"
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
          
          <!-- Центральная колонка: Характеристики и распределение -->
          <div class="form-column abilities">
            <div class="form-section">
              <h3><i class="pi pi-chart-bar"></i> Характеристики</h3>
              
              <AbilityScoreDistribution 
                v-model:scores="abilityScores"
                :loading="loadingData || submitting || dataLoadError"
                @valid="onAbilityScoresValid"
              />
              
              <div class="ability-summary">
                <h4><i class="pi pi-calculator"></i> Итоговые характеристики (с расовыми бонусами)</h4>
                <div class="final-scores-grid">
                  <div v-for="ability in abilities" :key="ability.key" class="final-score-item">
                    <div class="final-score-label">
                      <i :class="abilityIcons[ability.key]"></i>
                      {{ abilityNames[ability.key] }}
                    </div>
                    <div class="final-score-value">
                      {{ getFinalScore(ability.key) }}
                      <span v-if="getRaceBonus(ability.key)" class="race-bonus-indicator">
                        (+{{ getRaceBonus(ability.key) }})
                      </span>
                    </div>
                    <div class="final-score-modifier">
                      {{ getModifier(getFinalScore(ability.key)) >= 0 ? '+' : '' }}{{ getModifier(getFinalScore(ability.key)) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3><i class="pi pi-shield"></i> Боевые параметры</h3>
              
              <div class="combat-stats-grid">
                <div class="combat-stat">
                  <div class="stat-header">
                    <i class="pi pi-heart"></i>
                    <div class="stat-label">Макс. HP</div>
                  </div>
                  <div class="stat-value">{{ calculatedHitPoints }}</div>
                  <div class="stat-formula">
                    10 + мод. телосложения ({{ getModifier(getFinalScore('constitution')) }})
                  </div>
                </div>
                
                <div class="combat-stat">
                  <div class="stat-header">
                    <i class="pi pi-shield"></i>
                    <div class="stat-label">Класс брони</div>
                  </div>
                  <div class="stat-value">{{ calculatedArmorClass }}</div>
                  <div class="stat-formula">
                    10 + мод. ловкости ({{ getModifier(getFinalScore('dexterity')) }})
                  </div>
                </div>
                
                <div class="combat-stat">
                  <div class="stat-header">
                    <i class="pi pi-star"></i>
                    <div class="stat-label">Бонус мастерства</div>
                  </div>
                  <div class="stat-value">+{{ calculatedProficiencyBonus }}</div>
                  <div class="stat-formula">
                    2 + (({{ characterData.level }} - 1) / 4)
                  </div>
                </div>
                
                <div class="combat-stat">
                  <div class="stat-header">
                    <i class="pi pi-forward"></i>
                    <div class="stat-label">Скорость</div>
                  </div>
                  <div class="stat-value">{{ calculatedSpeed }} фт.</div>
                  <div class="stat-formula">
                    {{ selectedRace ? 'Базовая скорость расы' : 'Стандартная скорость' }}
                  </div>
                </div>
              </div>
              
              <div class="quick-calculations">
                <Button 
                  label="Пересчитать HP" 
                  icon="pi pi-refresh"
                  severity="secondary"
                  size="small"
                  @click="recalculateHitPoints"
                  :disabled="!characterData.race"
                />
                <Button 
                  label="Пересчитать AC" 
                  icon="pi pi-refresh"
                  severity="secondary"
                  size="small"
                  @click="recalculateArmorClass"
                  :disabled="!characterData.race"
                />
              </div>
            </div>
          </div>
          
          <!-- Правая колонка: Сводка и создание -->
          <div class="form-column summary">
            <div class="form-section">
              <h3><i class="pi pi-eye"></i> Предпросмотр персонажа</h3>
              
              <div class="character-preview">
                <div class="preview-header">
                  <div class="preview-avatar">
                    <i class="pi pi-user" style="font-size: 2rem;"></i>
                  </div>
                  <div class="preview-name">
                    <h4>{{ characterData.name || 'Безымянный герой' }}</h4>
                    <div class="preview-tags">
                      <span class="tag level" v-if="characterData.level">
                        <i class="pi pi-chart-line"></i> Ур. {{ characterData.level }}
                      </span>
                      <span class="tag class" v-if="characterData.class">
                        <i class="pi pi-briefcase"></i> {{ characterData.class }}
                      </span>
                      <span class="tag race" v-if="characterData.race">
                        <i class="pi pi-users"></i> {{ characterData.race }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="preview-stats">
                  <div class="preview-stat">
                    <span class="stat-label">HP</span>
                    <span class="stat-value">{{ calculatedHitPoints }}</span>
                  </div>
                  <div class="preview-stat">
                    <span class="stat-label">AC</span>
                    <span class="stat-value">{{ calculatedArmorClass }}</span>
                  </div>
                  <div class="preview-stat">
                    <span class="stat-label">Скорость</span>
                    <span class="stat-value">{{ calculatedSpeed }} фт.</span>
                  </div>
                  <div class="preview-stat">
                    <span class="stat-label">Бонус</span>
                    <span class="stat-value">+{{ calculatedProficiencyBonus }}</span>
                  </div>
                </div>
                
                <div class="preview-details">
                  <div class="detail-item" v-if="characterData.background">
                    <strong>Предыстория:</strong> {{ characterData.background }}
                  </div>
                  <div class="detail-item" v-if="characterData.alignment">
                    <strong>Мировоззрение:</strong> {{ characterData.alignment }}
                  </div>
                  <div class="detail-item" v-if="characterData.experience_points">
                    <strong>Опыт:</strong> {{ characterData.experience_points }} XP
                  </div>
                </div>
              </div>
              
              <div class="requirements-check">
                <h4><i class="pi pi-check-circle"></i> Проверка требований</h4>
                <div class="requirement" :class="{ 'met': characterData.name }">
                  <i :class="characterData.name ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  <span>Имя персонажа указано</span>
                </div>
                <div class="requirement" :class="{ 'met': characterData.class }">
                  <i :class="characterData.class ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  <span>Класс выбран</span>
                </div>
                <div class="requirement" :class="{ 'met': characterData.race }">
                  <i :class="characterData.race ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  <span>Раса выбрана</span>
                </div>
                <div class="requirement" :class="{ 'met': abilityScoresValid }">
                  <i :class="abilityScoresValid ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  <span>Характеристики распределены</span>
                </div>
              </div>
            </div>
            
            <div class="form-section actions-section">
              <h3><i class="pi pi-cog"></i> Действия</h3>
              
              <div class="validation-messages">
                <div v-if="!characterData.name && formSubmitted" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Укажите имя персонажа</span>
                </div>
                <div v-if="!characterData.class && formSubmitted" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Выберите класс</span>
                </div>
                <div v-if="!characterData.race && formSubmitted" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Выберите расу</span>
                </div>
                <div v-if="!abilityScoresValid && formSubmitted" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Распределите характеристики (27 очков)</span>
                </div>
                <div v-if="charactersStore.error" class="validation-error">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Ошибка: {{ charactersStore.error }}</span>
                </div>
              </div>
              
              <div class="form-actions">
                <Button 
                  label="Создать персонажа" 
                  icon="pi pi-plus"
                  :loading="submitting"
                  :disabled="!canCreateCharacter || submitting"
                  @click="submitCharacter"
                  class="create-button"
                  severity="success"
                />
                <Button 
                  label="Сбросить форму" 
                  icon="pi pi-refresh"
                  @click="resetForm"
                  severity="warning"
                  class="mt-2"
                />
              </div>
              
              <div class="creation-tips">
                <h4><i class="pi pi-lightbulb"></i> Советы по созданию</h4>
                <ul>
                  <li>Используйте распределение характеристик для оптимизации персонажа</li>
                  <li>Учитывайте расовые бонусы при выборе характеристик</li>
                  <li>Выбранный класс определяет основные навыки персонажа</li>
                  <li>Вы можете изменить персонажа позже в редакторе</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button label="Отмена" severity="secondary" @click="visible = false" />
      <Button 
        label="Помощь" 
        severity="help" 
        @click="showHelp" 
        icon="pi pi-question-circle"
      />
      <Button 
        label="Диагностика" 
        severity="info" 
        @click="runDiagnostics" 
        icon="pi pi-wrench"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCharactersStore } from '@/stores/characters'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { useSkillsStore } from '@/stores/skills'
import { CLASS_STARTING_EQUIPMENT, CLASS_STARTING_CURRENCY } from '@/types/character'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import AbilityScoreDistribution from './creation/AbilityScoreDistribution.vue'
import SkillDetail from './SkillDetail.vue'
import ActiveSkillCard from './ActiveSkillCard.vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'character-created'])

const toast = useToast()
const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()
const skillsStore = useSkillsStore()

// Данные формы - объявляем ПЕРВЫМИ
const characterData = ref({
  name: '',
  level: 1,
  class: '',
  race: '',
  background: '',
  alignment: '',
  experience_points: 0,
  personality_traits: '',
  ideals: '',
  bonds: '',
  flaws: ''
})

const abilityScores = ref({
  strength: 8,
  dexterity: 8,
  constitution: 8,
  intelligence: 8,
  wisdom: 8,
  charisma: 8
})

// Состояние
const loadingData = ref(false)
const dataLoadError = ref(false)
const dataLoadErrorMessage = ref<string | null>(null)
const apiErrorDetails = ref<string | null>(null)
const submitting = ref(false)
const abilityScoresValid = ref(false)
const formSubmitted = ref(false)
const addStartingEquipment = ref(true)

// Вычисляемые свойства для навыков
const racePassiveSkill = computed(() => skillsStore.racePassive)
const availableClassSkills = computed(() => skillsStore.classSkills)

// Списки опций
const alignments = ref([
  'Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый',
  'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный',
  'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой'
])

// Иконки для характеристик
const abilityIcons: Record<string, string> = {
  strength: 'pi pi-bolt',
  dexterity: 'pi pi-sun',
  constitution: 'pi pi-heart',
  intelligence: 'pi pi-brain',
  wisdom: 'pi pi-eye',
  charisma: 'pi pi-star'
}

// Выбранные опции
const selectedClass = computed(() => {
  return charactersStore.classes.find(c => c.name === characterData.value.class)
})

const selectedRace = computed(() => {
  return charactersStore.races.find(r => r.name === characterData.value.race)
})

// Опции для dropdown
const classesOptions = computed(() => {
  return charactersStore.classes.filter(c => c && c.name && c.hit_dice)
})

const racesOptions = computed(() => {
  return charactersStore.races.filter(r => r && r.name && r.speed)
})

// Вспомогательные данные для характеристик
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

// Стартовое снаряжение
const startingEquipmentPreview = computed(() => {
  if (!characterData.value.class || !addStartingEquipment.value) return []
  const classKey = characterData.value.class
  return CLASS_STARTING_EQUIPMENT[classKey as keyof typeof CLASS_STARTING_EQUIPMENT] || []
})

// Функции
const getItemIcon = (type: string) => {
  switch (type) {
    case 'weapon': return 'pi pi-bolt'
    case 'armor':
    case 'shield': return 'pi pi-shield'
    case 'tool': return 'pi pi-wrench'
    case 'container': return 'pi pi-folder'
    case 'pack': return 'pi pi-box'
    case 'ammunition': return 'pi pi-arrow-right'
    default: return 'pi pi-circle'
  }
}

const selectSkill = (skill: any) => {
  toast.add({
    severity: 'info',
    summary: skill.name,
    detail: 'Навык будет изучен после создания персонажа',
    life: 3000
  })
}

const runDiagnostics = async () => {
  console.log('=== ДИАГНОСТИКА СОЗДАНИЯ ПЕРСОНАЖА ===')
  console.log('1. Данные формы:', characterData.value)
  console.log('2. Характеристики:', abilityScores.value)
  console.log('3. Store состояние:', {
    classes: charactersStore.classes.length,
    races: charactersStore.races.length,
    error: charactersStore.error
  })
  
  toast.add({
    severity: 'info',
    summary: 'Диагностика',
    detail: 'Информация в консоли браузера',
    life: 3000
  })
}

const showHelp = () => {
  toast.add({
    severity: 'info',
    summary: 'Помощь по созданию персонажа',
    detail: 'Заполните все обязательные поля и распределите характеристики',
    life: 5000
  })
}

const checkToken = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Токен не найден. Войдите заново.',
      life: 3000
    })
    return false
  }
  
  if (token.includes('mock-jwt-token')) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Обнаружен мок-токен. Очистите localStorage.',
      life: 5000
    })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    authStore.clearAuth()
    return false
  }
  
  return true
}

const loadData = async () => {
  if (!checkToken()) return
  
  loadingData.value = true
  dataLoadError.value = false
  dataLoadErrorMessage.value = null
  apiErrorDetails.value = null
  
  try {
    console.log('🔄 Загрузка данных для создания персонажа...')
    
    await charactersStore.fetchClasses()
    console.log('✅ Классы загружены:', charactersStore.classes.length)
    
    await charactersStore.fetchRaces()
    console.log('✅ Расы загружены:', charactersStore.races.length)
    
    if (charactersStore.classes.length === 0) {
      dataLoadError.value = true
      dataLoadErrorMessage.value = 'Классы не загружены. Проверьте соединение с сервером.'
    }
    
    if (charactersStore.races.length === 0) {
      dataLoadError.value = true
      dataLoadErrorMessage.value = 'Расы не загружены. Проверьте соединение с сервером.'
    }
    
    if (charactersStore.error) {
      dataLoadError.value = true
      dataLoadErrorMessage.value = charactersStore.error
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка загрузки данных:', error)
    dataLoadError.value = true
    dataLoadErrorMessage.value = error.message || 'Не удалось загрузить данные классов и рас.'
    
    if (error.response?.status === 403) {
      apiErrorDetails.value = 'Доступ запрещен. Токен невалидный или устарел.'
    } else if (error.response?.status === 401) {
      apiErrorDetails.value = 'Не авторизован. Войдите заново.'
    }
  } finally {
    loadingData.value = false
  }
}

const formatAbilityBonuses = (bonuses: any) => {
  if (!bonuses) return ''
  const parts = []
  if (bonuses.strength) parts.push(`Сил +${bonuses.strength}`)
  if (bonuses.dexterity) parts.push(`Лов +${bonuses.dexterity}`)
  if (bonuses.constitution) parts.push(`Тел +${bonuses.constitution}`)
  if (bonuses.intelligence) parts.push(`Инт +${bonuses.intelligence}`)
  if (bonuses.wisdom) parts.push(`Мдр +${bonuses.wisdom}`)
  if (bonuses.charisma) parts.push(`Хар +${bonuses.charisma}`)
  if (bonuses.two_other) parts.push(`+1 к двум другим`)
  return parts.join(', ')
}

const getModifier = (score: number) => {
  return Math.floor((score - 10) / 2)
}

const getRaceBonus = (ability: string) => {
  if (!selectedRace.value?.ability_bonuses) return 0
  const bonuses = selectedRace.value.ability_bonuses
  
  switch (ability) {
    case 'strength': return bonuses.strength || 0
    case 'dexterity': return bonuses.dexterity || 0
    case 'constitution': return bonuses.constitution || 0
    case 'intelligence': return bonuses.intelligence || 0
    case 'wisdom': return bonuses.wisdom || 0
    case 'charisma': return bonuses.charisma || 0
    default: return 0
  }
}

const getFinalScore = (ability: string) => {
  const base = abilityScores.value[ability as keyof typeof abilityScores.value]
  const bonus = getRaceBonus(ability)
  const final = base + bonus
  return final > 20 ? 20 : final
}

const calculatedHitPoints = computed(() => {
  const conScore = getFinalScore('constitution')
  const conMod = getModifier(conScore)
  const baseHP = 10 + conMod
  return baseHP
})

const calculatedArmorClass = computed(() => {
  const dexScore = getFinalScore('dexterity')
  const dexMod = getModifier(dexScore)
  return 10 + dexMod
})

const calculatedProficiencyBonus = computed(() => {
  const level = characterData.value.level
  return 2 + Math.floor((level - 1) / 4)
})

const calculatedSpeed = computed(() => {
  return selectedRace.value?.speed || 30
})

const recalculateHitPoints = () => {
  toast.add({
    severity: 'info',
    summary: 'Хит-поинты',
    detail: `Автоматически рассчитаны: ${calculatedHitPoints.value} HP`,
    life: 3000
  })
}

const recalculateArmorClass = () => {
  toast.add({
    severity: 'info',
    summary: 'Класс брони',
    detail: `Автоматически рассчитан: ${calculatedArmorClass.value} AC`,
    life: 3000
  })
}

const onAbilityScoresValid = (valid: boolean) => {
  abilityScoresValid.value = valid
}

const canCreateCharacter = computed(() => {
  return characterData.value.name && 
         characterData.value.class && 
         characterData.value.race &&
         abilityScoresValid.value &&
         !loadingData.value &&
         !dataLoadError.value &&
         !submitting.value
})

const submitCharacter = async () => {
  formSubmitted.value = true
  
  if (!canCreateCharacter.value) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Заполните все обязательные поля правильно',
      life: 3000
    })
    return
  }
  
  if (!checkToken()) return
  
  submitting.value = true
  try {
    const finalScores: any = {}
    abilities.forEach(ability => {
      finalScores[ability.key] = getFinalScore(ability.key)
    })

    const characterDataPayload = {
      ...characterData.value,
      ...finalScores,
      hit_points: calculatedHitPoints.value,
      armor_class: calculatedArmorClass.value,
      proficiency_bonus: calculatedProficiencyBonus.value,
      speed: calculatedSpeed.value,
      inspiration: false,
      hit_dice: selectedClass.value?.hit_dice || 'd8'
    }

    console.log('Создание персонажа с инвентарем:', characterDataPayload)

    const newCharacter = await charactersStore.createCharacterWithEquipment(
      characterDataPayload,
      {
        addStandardPack: addStartingEquipment.value,
      }
    )

    toast.add({
      severity: 'success',
      summary: 'Успешно!',
      detail: `Персонаж "${characterData.value.name}" создан!`,
      life: 5000
    })

    emit('character-created', newCharacter)
    visible.value = false
    resetForm()

  } catch (error: any) {
    console.error('Ошибка создания персонажа:', error)
    let errorMessage = error.message || 'Не удалось создать персонажа'
    if (error.response?.status === 403) {
      errorMessage = 'Доступ запрещен. Войдите заново.'
    } else if (error.response?.status === 401) {
      errorMessage = 'Не авторизован. Войдите заново.'
    }
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  characterData.value = {
    name: '',
    level: 1,
    class: '',
    race: '',
    background: '',
    alignment: '',
    experience_points: 0,
    personality_traits: '',
    ideals: '',
    bonds: '',
    flaws: ''
  }
  
  abilityScores.value = {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8
  }
  
  abilityScoresValid.value = false
  dataLoadError.value = false
  dataLoadErrorMessage.value = null
  apiErrorDetails.value = null
  formSubmitted.value = false
  addStartingEquipment.value = true
  skillsStore.reset()
  
  toast.add({
    severity: 'info',
    summary: 'Форма сброшена',
    detail: 'Все поля очищены',
    life: 3000
  })
}

// Watchers для навыков
watch(() => characterData.value.race, async (newRace) => {
  if (newRace && selectedRace.value) {
    await skillsStore.fetchRacePassiveSkill(selectedRace.value.id)
  } else {
    skillsStore.racePassive = null
  }
})

watch(() => characterData.value.class, async (newClass) => {
  if (newClass && selectedClass.value) {
    await skillsStore.fetchClassSkills(selectedClass.value.id, characterData.value.level)
  } else {
    skillsStore.classSkills = []
  }
})

watch(() => characterData.value.level, async (newLevel) => {
  if (characterData.value.class && selectedClass.value) {
    await skillsStore.fetchClassSkills(selectedClass.value.id, newLevel)
  }
})

// Видимость диалога
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Загружаем данные при открытии диалога
watch(visible, (newVal) => {
  if (newVal) {
    loadData()
  } else {
    resetForm()
  }
})
</script>

<style scoped>
.create-character-form {
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
  background: rgba(255, 255, 255, 0.98);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 6px;
  backdrop-filter: blur(5px);
}

.loading-overlay {
  gap: 16px;
  color: #3b82f6;
}

.loading-overlay .p-progress-spinner {
  width: 60px !important;
  height: 60px !important;
}

.error-overlay {
  gap: 20px;
  text-align: center;
  padding: 40px;
  color: #dc2626;
}

.error-overlay i {
  font-size: 3rem;
  color: #dc2626;
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

.error-details {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 4px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.form-content.loading,
.form-content.error {
  opacity: 0.5;
  pointer-events: none;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 20px;
  max-height: 75vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 1.1rem;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
}

.form-section h3 i {
  color: #3b82f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  margin-bottom: 20px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-field label i {
  color: #6b7280;
}

.form-field label.required::after {
  content: ' *';
  color: #dc2626;
}

.field-hint {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-hint.success {
  color: #059669;
}

.field-hint i {
  font-size: 0.9rem;
}

.bonus-info {
  color: #7c3aed;
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.mr-2 {
  margin-right: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.p-invalid {
  border-color: #ef4444 !important;
}

.p-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.p-error i {
  font-size: 0.9rem;
}

/* Стили для dropdown опций */
.selected-option {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.selected-option i {
  color: #3b82f6;
}

.placeholder-text {
  color: #9ca3af;
}

.class-option,
.race-option,
.alignment-option {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.class-option:last-child,
.race-option:last-child,
.alignment-option:last-child {
  border-bottom: none;
}

.class-option strong,
.race-option strong {
  display: block;
  margin-bottom: 4px;
  color: #1f2937;
}

.option-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-details span {
  color: #059669;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.option-details small {
  color: #6b7280;
  font-size: 0.8rem;
}

.alignment-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Стили для характеристик */
.ability-summary {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.ability-summary h4 {
  margin: 0 0 16px 0;
  color: #4b5563;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.final-scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.final-score-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: all 0.2s;
}

.final-score-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
}

.final-score-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.final-score-label i {
  color: #3b82f6;
}

.final-score-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.race-bonus-indicator {
  font-size: 0.8rem;
  color: #059669;
  font-weight: normal;
  margin-left: 4px;
}

.final-score-modifier {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.95rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Стили для боевых параметров */
.combat-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.combat-stat {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: all 0.2s;
}

.combat-stat:hover {
  border-color: #10b981;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.1);
}

.stat-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-header i {
  font-size: 1.5rem;
  color: #10b981;
  background: #d1fae5;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.stat-formula {
  color: #9ca3af;
  font-size: 0.75rem;
  line-height: 1.4;
}

.quick-calculations {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Стили для предпросмотра */
.character-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.preview-avatar {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-name h4 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 1.5rem;
}

.preview-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag i {
  font-size: 0.8rem;
}

.tag.level {
  background: rgba(59, 130, 246, 0.8);
}

.tag.class {
  background: rgba(16, 185, 129, 0.8);
}

.tag.race {
  background: rgba(139, 92, 246, 0.8);
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.preview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.preview-stat .stat-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.preview-stat .stat-value {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.preview-details {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item strong {
  color: rgba(255, 255, 255, 0.9);
  margin-right: 8px;
}

/* Стили для стартового снаряжения */
.equipment-option {
  background: #f0fdf4;
  border-color: #86efac;
  margin-top: 16px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.field-checkbox label {
  font-weight: 500;
  color: #166534;
}

.starting-equipment-preview {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-top: 16px;
}

.starting-equipment-preview h4 {
  margin: 0 0 12px 0;
  color: #166534;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.starting-equipment-preview ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.starting-equipment-preview li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.starting-equipment-preview li:last-child {
  border-bottom: none;
}

.starting-equipment-preview li i {
  color: #059669;
  width: 20px;
}

.starting-equipment-preview li strong {
  color: #1f2937;
  min-width: 120px;
}

.starting-equipment-preview li .item-weight {
  margin-left: auto;
  color: #6b7280;
}

.currency-note {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* Проверка требований */
.requirements-check {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.requirements-check h4 {
  margin: 0 0 16px 0;
  color: #4b5563;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.requirement:last-child {
  border-bottom: none;
}

.requirement i {
  font-size: 1.1rem;
}

.requirement.met i {
  color: #10b981;
}

.requirement:not(.met) i {
  color: #dc2626;
}

.requirement.met span {
  color: #059669;
}

.requirement:not(.met) span {
  color: #6b7280;
}

/* Валидация */
.validation-messages {
  margin: 20px 0;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.validation-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.validation-error:last-child {
  margin-bottom: 0;
}

.validation-error i {
  font-size: 1rem;
}

/* Действия */
.actions-section {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.form-actions {
  margin-top: 24px;
}

.create-button {
  height: 52px;
  font-size: 1.1rem;
  font-weight: 600;
}

.creation-tips {
  margin-top: 24px;
  padding: 20px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.creation-tips h4 {
  margin: 0 0 12px 0;
  color: #d97706;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.creation-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #92400e;
}

.creation-tips li {
  margin-bottom: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.creation-tips li:last-child {
  margin-bottom: 0;
}

/* Полоса прокрутки */
.form-layout::-webkit-scrollbar {
  width: 8px;
}

.form-layout::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.form-layout::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.form-layout::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Адаптивность */
@media (max-width: 1400px) {
  .form-layout {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-column.summary {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
  
  .form-column.summary {
    grid-column: span 1;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .combat-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .form-section {
    padding: 16px;
  }
  
  .final-scores-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-stats {
    grid-template-columns: 1fr;
  }
}

/* Стили для навыков в форме создания */
.race-skill-section,
.class-skills-section {
  margin-top: 20px;
}

.race-skill-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-left: 4px solid #3b82f6;
}

.class-skills-section {
  background: #faf5ff;
  border-left: 4px solid #8b5cf6;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.skill-select-item {
  cursor: pointer;
  transition: all 0.2s;
}

.skill-select-item:hover {
  transform: translateX(4px);
}

.skills-list::-webkit-scrollbar {
  width: 6px;
}

.skills-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.skills-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
</style>