<!-- frontend/src/components/character/inventory/ItemForm.vue -->
<template>
  <div class="item-form">
    <form @submit.prevent="save">
      <div class="form-grid">
        <div class="form-column">
          <div class="field">
            <label for="name" class="required">Название предмета</label>
            <InputText 
              id="name"
              v-model="form.name"
              :class="{ 'p-invalid': errors.name }"
              class="w-full"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div class="field">
            <label for="type" class="required">Тип</label>
            <Dropdown 
              id="type"
              v-model="form.type"
              :options="itemTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Выберите тип"
              class="w-full"
              @change="onTypeChange"
            />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>

          <div class="field">
            <label for="subtype">Подтип</label>
            <Dropdown 
              v-if="form.type === 'weapon'"
              v-model="form.subtype"
              :options="weaponTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Тип оружия"
              class="w-full"
            />
            <Dropdown 
              v-else-if="form.type === 'armor'"
              v-model="form.subtype"
              :options="armorTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Тип брони"
              class="w-full"
            />
            <InputText 
              v-else
              v-model="form.subtype"
              placeholder="Подтип предмета"
              class="w-full"
            />
          </div>

          <div class="row">
            <div class="field col-6">
              <label for="quantity">Количество</label>
              <InputNumber 
                id="quantity"
                v-model="form.quantity"
                :min="1"
                :step="1"
                class="w-full"
              />
            </div>
            <div class="field col-6">
              <label for="weight">Вес (фнт.)</label>
              <InputNumber 
                id="weight"
                v-model="form.weight"
                :min="0"
                :step="0.1"
                class="w-full"
              />
            </div>
          </div>

          <div class="row">
            <div class="field col-6">
              <label for="cost">Стоимость</label>
              <InputNumber 
                id="cost"
                v-model="form.cost"
                :min="0"
                class="w-full"
              />
            </div>
            <div class="field col-6">
              <label for="cost_unit">Валюта</label>
              <Dropdown 
                v-model="form.cost_unit"
                :options="currencyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="зм"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="form-column">
          <!-- Секция для оружия -->
          <div v-if="form.type === 'weapon'" class="weapon-section">
            <h4>Характеристики оружия</h4>
            
            <div class="row">
              <div class="field col-6">
                <label for="damage">Урон</label>
                <InputText 
                  id="damage"
                  v-model="form.damage"
                  placeholder="1d8"
                  class="w-full"
                />
              </div>
              <div class="field col-6">
                <label for="damage_type">Тип урона</label>
                <Dropdown 
                  v-model="form.damage_type"
                  :options="damageTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Тип урона"
                  class="w-full"
                />
              </div>
            </div>

            <div class="row">
              <div class="field col-6">
                <label for="range_normal">Дистанция (фт.)</label>
                <InputNumber 
                  id="range_normal"
                  v-model="form.range_normal"
                  :min="0"
                  class="w-full"
                />
              </div>
              <div class="field col-6">
                <label for="range_long">Макс. дистанция</label>
                <InputNumber 
                  id="range_long"
                  v-model="form.range_long"
                  :min="0"
                  class="w-full"
                />
              </div>
            </div>

            <div class="field">
              <label>Свойства</label>
              <div class="checkbox-group">
                <div v-for="prop in weaponProperties" :key="prop.value" class="checkbox-item">
                  <Checkbox 
                    :id="'prop_' + prop.value"
                    :model-value="getPropertyValue(prop.value)"
                    @update:model-value="setPropertyValue(prop.value, $event)"
                    :binary="true"
                  />
                  <label :for="'prop_' + prop.value">{{ prop.label }}</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Секция для брони -->
          <div v-if="form.type === 'armor' || form.type === 'shield'" class="armor-section">
            <h4>Характеристики брони</h4>
            
            <div class="field">
              <label for="armor_class_bonus">Бонус к КБ</label>
              <InputNumber 
                id="armor_class_bonus"
                v-model="form.armor_class_bonus"
                :min="0"
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="strength_requirement">Требование Силы</label>
              <InputNumber 
                id="strength_requirement"
                v-model="form.strength_requirement"
                :min="0"
                class="w-full"
              />
            </div>

            <div class="field">
              <Checkbox 
                v-model="form.stealth_disadvantage" 
                :binary="true"
                inputId="stealth_disadvantage"
              />
              <label for="stealth_disadvantage">Помеха на Скрытность</label>
            </div>
          </div>

          <!-- Общие поля -->
          <div class="general-section">
            <h4>Общие свойства</h4>

            <div class="field">
              <label for="slot">Слот экипировки</label>
              <Dropdown 
                v-model="form.slot"
                :options="equipmentSlots"
                optionLabel="name"
                optionValue="id"
                placeholder="Выберите слот"
                class="w-full"
              />
            </div>

            <div class="row">
              <div class="field col-6">
                <Checkbox 
                  v-model="form.attunement" 
                  :binary="true"
                  inputId="attunement"
                />
                <label for="attunement">Требует настройки</label>
              </div>
              <div class="field col-6">
                <Dropdown 
                  v-model="form.rarity"
                  :options="rarityOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Редкость"
                  class="w-full"
                />
              </div>
            </div>

            <div class="field">
              <label for="description">Описание</label>
              <Textarea 
                id="description"
                v-model="form.description"
                rows="4"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <Button 
          type="button" 
          label="Отмена" 
          icon="pi pi-times" 
          @click="emit('cancel')" 
          severity="secondary"
        />
        <Button 
          type="submit" 
          label="Сохранить" 
          icon="pi pi-check" 
          :loading="saving"
          severity="success"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useEquipmentStore } from '@/stores/equipment'
import type { 
  CreateEquipmentDTO, 
  EquipmentType, 
  EquipmentSlot, 
  DamageType, 
  WeaponProperties 
} from '@/types/equipment'

const props = defineProps<{
  characterId: number
  item?: any // для редактирования
}>()

const emit = defineEmits(['saved', 'cancel'])

const toast = useToast()
const equipmentStore = useEquipmentStore()

const saving = ref(false)
const errors = ref<Record<string, string>>({})

// Инициализируем форму с правильными типами
const form = reactive<CreateEquipmentDTO>({
  name: '',
  type: 'other' as EquipmentType,
  subtype: '',
  quantity: 1,
  weight: 0,
  cost: 0,
  cost_unit: 'gp',
  description: '',
  properties: {} as WeaponProperties,
  damage: '',
  damage_type: undefined as DamageType | undefined,
  range_normal: undefined,
  range_long: undefined,
  armor_class_bonus: undefined,
  strength_requirement: undefined,
  stealth_disadvantage: false,
  slot: undefined as EquipmentSlot | undefined,
  attunement: false,
  rarity: 'common',
  is_magical: false,
  spell_scroll_spell_id: undefined,
  uses_max: undefined,
  recharge: undefined,
  container_id: undefined
})

// Опции для выпадающих списков
const itemTypes = [
  { label: 'Оружие', value: 'weapon' as EquipmentType },
  { label: 'Броня', value: 'armor' as EquipmentType },
  { label: 'Щит', value: 'shield' as EquipmentType },
  { label: 'Зелье', value: 'potion' as EquipmentType },
  { label: 'Свиток', value: 'scroll' as EquipmentType },
  { label: 'Волшебный предмет', value: 'wondrous_item' as EquipmentType },
  { label: 'Инструмент', value: 'tool' as EquipmentType },
  { label: 'Амуниция', value: 'ammunition' as EquipmentType },
  { label: 'Контейнер', value: 'container' as EquipmentType },
  { label: 'Прочее', value: 'other' as EquipmentType }
]

const weaponTypes = [
  { label: 'Простое рукопашное', value: 'simple_melee' },
  { label: 'Простое дальнобойное', value: 'simple_ranged' },
  { label: 'Воинское рукопашное', value: 'martial_melee' },
  { label: 'Воинское дальнобойное', value: 'martial_ranged' }
]

const armorTypes = [
  { label: 'Легкая броня', value: 'light' },
  { label: 'Средняя броня', value: 'medium' },
  { label: 'Тяжелая броня', value: 'heavy' }
]

const currencyOptions = [
  { label: 'мм', value: 'cp' },
  { label: 'см', value: 'sp' },
  { label: 'эм', value: 'ep' },
  { label: 'зм', value: 'gp' },
  { label: 'пл', value: 'pp' }
]

const damageTypes = [
  { label: 'Рубящий', value: 'slashing' as DamageType },
  { label: 'Колющий', value: 'piercing' as DamageType },
  { label: 'Дробящий', value: 'bludgeoning' as DamageType },
  { label: 'Огонь', value: 'fire' as DamageType },
  { label: 'Холод', value: 'cold' as DamageType },
  { label: 'Электричество', value: 'lightning' as DamageType },
  { label: 'Звук', value: 'thunder' as DamageType },
  { label: 'Кислота', value: 'acid' as DamageType },
  { label: 'Яд', value: 'poison' as DamageType },
  { label: 'Излучение', value: 'radiant' as DamageType },
  { label: 'Некротическая', value: 'necrotic' as DamageType },
  { label: 'Психическая', value: 'psychic' as DamageType },
  { label: 'Силовой', value: 'force' as DamageType }
]

const weaponProperties = [
  { label: 'Фехтовальное', value: 'finesse' },
  { label: 'Тяжелое', value: 'heavy' },
  { label: 'Легкое', value: 'light' },
  { label: 'Перезарядка', value: 'loading' },
  { label: 'Досягаемость', value: 'reach' },
  { label: 'Особое', value: 'special' },
  { label: 'Метательное', value: 'thrown' },
  { label: 'Двуручное', value: 'two_handed' },
  { label: 'Универсальное', value: 'versatile' },
  { label: 'Боеприпасы', value: 'ammunition' },
  { label: 'Серебряное', value: 'silvered' }
]

const equipmentSlots = [
  { id: 'head' as EquipmentSlot, name: 'Голова' },
  { id: 'neck' as EquipmentSlot, name: 'Шея' },
  { id: 'shoulders' as EquipmentSlot, name: 'Плечи' },
  { id: 'back' as EquipmentSlot, name: 'Спина' },
  { id: 'chest' as EquipmentSlot, name: 'Торс' },
  { id: 'hands' as EquipmentSlot, name: 'Руки' },
  { id: 'fingers' as EquipmentSlot, name: 'Пальцы' },
  { id: 'waist' as EquipmentSlot, name: 'Пояс' },
  { id: 'legs' as EquipmentSlot, name: 'Ноги' },
  { id: 'feet' as EquipmentSlot, name: 'Ступни' },
  { id: 'main_hand' as EquipmentSlot, name: 'Основная рука' },
  { id: 'off_hand' as EquipmentSlot, name: 'Вторая рука' },
  { id: 'ranged' as EquipmentSlot, name: 'Дальний бой' }
]

const rarityOptions = [
  { label: 'Обычный', value: 'common' },
  { label: 'Необычный', value: 'uncommon' },
  { label: 'Редкий', value: 'rare' },
  { label: 'Очень редкий', value: 'very_rare' },
  { label: 'Легендарный', value: 'legendary' }
]

// Методы для безопасной работы с properties
const getPropertyValue = (property: string): boolean => {
  if (!form.properties) {
    form.properties = {} as WeaponProperties
  }
  return (form.properties as any)[property] || false
}

const setPropertyValue = (property: string, value: boolean) => {
  if (!form.properties) {
    form.properties = {} as WeaponProperties
  }
  (form.properties as any)[property] = value
}

// Методы
const onTypeChange = () => {
  // Сбрасываем специфичные поля при смене типа
  if (form.type !== 'weapon') {
    form.damage = ''
    form.damage_type = undefined
    form.range_normal = undefined
    form.range_long = undefined
    form.properties = {} as WeaponProperties
  }
  if (form.type !== 'armor' && form.type !== 'shield') {
    form.armor_class_bonus = undefined
    form.strength_requirement = undefined
    form.stealth_disadvantage = false
  }
}

const validate = () => {
  const newErrors: Record<string, string> = {}
  
  if (!form.name) newErrors.name = 'Название обязательно'
  if (!form.type) newErrors.type = 'Тип обязателен'
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const save = async () => {
  if (!validate()) return
  
  saving.value = true
  try {
    if (props.item) {
      // Обновление существующего предмета
      await equipmentStore.updateEquipment(props.item.id, form)
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Предмет обновлен',
        life: 2000
      })
    } else {
      // Создание нового предмета
      await equipmentStore.createEquipment(props.characterId, form)
      toast.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Предмет добавлен в инвентарь',
        life: 2000
      })
    }
    emit('saved')
  } catch (error: any) {
    console.error('Error saving item:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось сохранить предмет',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Загрузка данных для редактирования
onMounted(() => {
  if (props.item) {
    Object.assign(form, props.item)
    // Убеждаемся, что properties - это объект
    if (!form.properties) {
      form.properties = {} as WeaponProperties
    }
  }
})
</script>

<style scoped>
.item-form {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.field label.required::after {
  content: ' *';
  color: #dc2626;
}

.row {
  display: flex;
  gap: 16px;
}

.col-6 {
  flex: 0 0 calc(50% - 8px);
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item label {
  margin: 0;
  font-weight: normal;
  cursor: pointer;
}

h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1rem;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.weapon-section,
.armor-section,
.general-section {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.w-full {
  width: 100%;
}

.p-error {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
  
  .row {
    flex-direction: column;
  }
  
  .col-6 {
    flex: 0 0 100%;
  }
}
</style>