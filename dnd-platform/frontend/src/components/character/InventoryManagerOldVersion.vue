<template>
  <div class="inventory-manager">
    <div class="inventory-header">
      <h3><i class="pi pi-box"></i> Инвентарь</h3>
      <div class="header-actions">
        <div class="currency-display">
          <div class="currency-item">
            <i class="pi pi-star" style="color: #FFD700;"></i>
            <span>{{ currency.gold }}</span>
            <small>зм</small>
          </div>
          <div class="currency-item">
            <i class="pi pi-star" style="color: #C0C0C0;"></i>
            <span>{{ currency.silver }}</span>
            <small>см</small>
          </div>
          <div class="currency-item">
            <i class="pi pi-star" style="color: #B87333;"></i>
            <span>{{ currency.copper }}</span>
            <small>мм</small>
          </div>
          <div class="currency-item" v-if="currency.electrum > 0">
            <i class="pi pi-star" style="color: #E5E4E2;"></i>
            <span>{{ currency.electrum }}</span>
            <small>эм</small>
          </div>
          <div class="currency-item" v-if="currency.platinum > 0">
            <i class="pi pi-star" style="color: #E5E4E2;"></i>
            <span>{{ currency.platinum }}</span>
            <small>пл</small>
          </div>
          <Button 
            icon="pi pi-pencil" 
            class="p-button-rounded p-button-text p-button-sm" 
            @click="openCurrencyDialog"
          />
        </div>
        <Button 
          label="Добавить предмет" 
          icon="pi pi-plus" 
          @click="openAddItemDialog" 
          severity="success" 
          size="small"
        />
      </div>
    </div>

    <!-- Табы: Экипировка / Инвентарь / Контейнеры -->
    <TabView>
      <TabPanel header="Экипировка">
        <div class="equipment-grid">
          <!-- Слоты экипировки -->
          <div class="equipment-slots">
            <div 
              v-for="slot in equipmentSlots" 
              :key="slot.id" 
              class="equipment-slot"
              :class="{ equipped: getEquippedItem(slot.id) }"
              @click="openSlotDialog(slot)"
            >
              <div class="slot-icon">
                <i :class="slot.icon"></i>
              </div>
              <div class="slot-info">
                <div class="slot-name">{{ slot.name }}</div>
                <div class="slot-item" v-if="getEquippedItem(slot.id)">
                  {{ getEquippedItem(slot.id)?.name }}
                </div>
                <div class="slot-empty" v-else>
                  Пусто
                </div>
              </div>
              <Button 
                v-if="getEquippedItem(slot.id)"
                icon="pi pi-times" 
                class="p-button-rounded p-button-danger p-button-text p-button-sm"
                @click.stop="unequipItem(getEquippedItem(slot.id)!)"
              />
            </div>
          </div>

          <!-- Активные эффекты -->
          <div class="active-effects" v-if="activeEffects.length > 0">
            <h4>Активные эффекты</h4>
            <div class="effects-list">
              <div v-for="effect in activeEffects" :key="effect.id" class="effect-item">
                <i class="pi pi-bolt"></i>
                <div class="effect-info">
                  <strong>{{ effect.name }}</strong>
                  <small>{{ effect.description }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Предметы">
        <div class="inventory-items">
          <!-- Фильтры -->
          <div class="inventory-filters">
            <InputText 
              v-model="filters.search" 
              placeholder="Поиск предметов..." 
              class="search-input"
            />
            <Dropdown 
              v-model="filters.type" 
              :options="itemTypeOptions" 
              placeholder="Все типы"
              class="filter-dropdown"
            />
          </div>

          <!-- Список предметов -->
          <div class="items-grid">
            <div 
              v-for="item in filteredItems" 
              :key="item.id"
              class="item-card"
              :class="{ equipped: item.equipped, container: item.type === 'container' }"
            >
              <div class="item-icon" :style="{ backgroundColor: getItemColor(item.type) }">
                <i :class="getItemIcon(item)"></i>
              </div>
              <div class="item-details">
                <div class="item-name">
                  {{ item.name }}
                  <span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
                </div>
                <div class="item-meta">
                  <span v-if="item.weight" class="item-weight">
                    {{ (item.weight * item.quantity).toFixed(1) }} фнт.
                  </span>
                  <span v-if="item.attunement" class="item-attunement" :class="{ attuned: item.attuned }">
                    <i class="pi pi-lock"></i>
                  </span>
                  <Tag v-if="item.rarity !== 'common'" :value="item.rarity" :severity="getRaritySeverity(item.rarity)" size="small" />
                </div>
                <div class="item-actions">
                  <Button 
                    icon="pi pi-info-circle" 
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="viewItemDetails(item)"
                  />
                  <Button 
                    v-if="canEquip(item)"
                    :icon="item.equipped ? 'pi pi-arrow-circle-down' : 'pi pi-arrow-circle-up'"
                    :severity="item.equipped ? 'warning' : 'success'"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="toggleEquip(item)"
                  />
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="editItem(item)"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    @click="confirmDelete(item)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="!loading && filteredItems.length === 0" class="empty-inventory">
            <i class="pi pi-box" style="font-size: 3rem;"></i>
            <p>Инвентарь пуст</p>
            <Button label="Добавить первый предмет" @click="openAddItemDialog" size="small" />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Контейнеры">
        <div class="containers-view">
          <div class="containers-grid">
            <div 
              v-for="container in containers" 
              :key="container.id"
              class="container-card"
              @click="openContainer(container)"
            >
              <div class="container-icon">
                <i class="pi pi-folder"></i>
              </div>
              <div class="container-info">
                <div class="container-name">{{ container.name }}</div>
                <div class="container-items">
                  {{ container.contents?.length || 0 }} предметов
                </div>
                <div class="container-weight">
                  {{ getContainerWeight(container) }} / {{ getContainerCapacity(container) }} фнт.
                </div>
              </div>
              <ProgressBar 
                :value="getContainerFillPercentage(container)" 
                :showValue="false"
                class="container-progress"
              />
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Диалоги -->
    <Dialog v-model:visible="addItemDialogVisible" header="Добавить предмет" modal :style="{ width: '600px' }">
      <ItemForm 
        :character-id="characterId"
        @saved="onItemSaved"
        @cancel="addItemDialogVisible = false"
      />
    </Dialog>

    <Dialog v-model:visible="itemDetailsDialogVisible" :header="selectedItem?.name" modal :style="{ width: '500px' }">
      <ItemDetails :item="selectedItem" />
      <template #footer>
        <Button label="Закрыть" icon="pi pi-times" @click="itemDetailsDialogVisible = false" />
      </template>
    </Dialog>

    <!-- В InventoryManager.vue обнови диалог валюты -->

    <Dialog v-model:visible="currencyDialogVisible" header="Валюта" modal :style="{ width: '400px' }">
      <CurrencyForm 
        ref="currencyFormRef"
        :character-id="characterId"
        :currency="currency"
        @saved="onCurrencySaved"
      />
      <template #footer>
        <Button 
          label="Отмена" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="currencyDialogVisible = false" 
        />
        <Button 
          label="Сохранить" 
          icon="pi pi-check" 
          @click="saveCurrency" 
        />
  </template>
</Dialog>

    <Dialog v-model:visible="containerDialogVisible" :header="selectedContainer?.name" modal :style="{ width: '600px' }">
      <ContainerView
        v-if="selectedContainer"
        :container="selectedContainer"
        :character-id="characterId"
        @item-moved="onItemMoved"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useEquipmentStore } from '@/stores/equipment'
import { useCharactersStore } from '@/stores/characters'
import type { Equipment, Currency, EquipmentSlot } from '@/types/equipment'
import ItemForm from './inventory/ItemForm.vue'
import ItemDetails from './inventory/ItemDetails.vue'
import CurrencyForm from './inventory/CurrencyForm.vue'
import ContainerView from './inventory/ContainerView.vue'

const props = defineProps<{
  characterId: number
}>()

const emit = defineEmits(['update:total-weight', 'update:encumbrance'])

const toast = useToast()
const equipmentStore = useEquipmentStore()
const charactersStore = useCharactersStore()

// Добавь ref для доступа к методам CurrencyForm
const currencyFormRef = ref<InstanceType<typeof CurrencyForm> | null>(null)

const saveCurrency = () => {
  currencyFormRef.value?.saveCurrency()
}

// Состояние
const loading = ref(false)
const items = ref<Equipment[]>([])
const currency = ref<Currency>({
  character_id: props.characterId,
  copper: 0,
  silver: 0,
  electrum: 0,
  gold: 0,
  platinum: 0
})

// Фильтры
const filters = ref({
  search: '',
  type: null as string | null // Явно указываем тип
})

// Диалоги
const addItemDialogVisible = ref(false)
const itemDetailsDialogVisible = ref(false)
const currencyDialogVisible = ref(false)
const containerDialogVisible = ref(false)
const selectedItem = ref<Equipment | null>(null)
const selectedContainer = ref<Equipment | null>(null) // Может быть null

// Слоты экипировки
const equipmentSlots = [
  { id: 'head', name: 'Голова', icon: 'pi pi-hat' },
  { id: 'neck', name: 'Шея', icon: 'pi pi-arrow-right' },
  { id: 'shoulders', name: 'Плечи', icon: 'pi pi-arrow-right' },
  { id: 'back', name: 'Спина', icon: 'pi pi-arrow-right' },
  { id: 'chest', name: 'Торс', icon: 'pi pi-arrow-right' },
  { id: 'hands', name: 'Руки', icon: 'pi pi-arrow-right' },
  { id: 'fingers', name: 'Пальцы', icon: 'pi pi-arrow-right' },
  { id: 'waist', name: 'Пояс', icon: 'pi pi-arrow-right' },
  { id: 'legs', name: 'Ноги', icon: 'pi pi-arrow-right' },
  { id: 'feet', name: 'Ступни', icon: 'pi pi-arrow-right' },
  { id: 'main_hand', name: 'Основная рука', icon: 'pi pi-arrow-right' },
  { id: 'off_hand', name: 'Вторая рука', icon: 'pi pi-arrow-right' },
  { id: 'ranged', name: 'Дальний бой', icon: 'pi pi-arrow-right' }
]

// Опции для фильтров
const itemTypeOptions = [
  { label: 'Все', value: null },
  { label: 'Оружие', value: 'weapon' },
  { label: 'Броня', value: 'armor' },
  { label: 'Щиты', value: 'shield' },
  { label: 'Зелья', value: 'potion' },
  { label: 'Свитки', value: 'scroll' },
  { label: 'Волшебные предметы', value: 'wondrous_item' },
  { label: 'Инструменты', value: 'tool' },
  { label: 'Амуниция', value: 'ammunition' },
  { label: 'Контейнеры', value: 'container' },
  { label: 'Прочее', value: 'other' }
]

// Вычисляемые свойства
const equippedItems = computed(() => {
  return items.value.filter(item => item.equipped)
})

const containers = computed(() => {
  return items.value.filter(item => item.type === 'container')
})

const totalWeight = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (item.weight || 0) * item.quantity
  }, 0)
})

const activeEffects = computed(() => {
  const effects: any[] = []
  equippedItems.value.forEach(item => {
    if (item.enchantments) {
      item.enchantments.forEach(enchant => {
        effects.push({
          id: enchant.id,
          name: enchant.name,
          description: enchant.description
        })
      })
    }
  })
  return effects
})

const filteredItems = computed(() => {
  return items.value.filter(item => {
    if (filters.value.search && !item.name.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false
    }
    if (filters.value.type && item.type !== filters.value.type) {
      return false
    }
    return true
  })
})

// Методы
const loadInventory = async () => {
  loading.value = true
  try {
    await equipmentStore.fetchEquipment(props.characterId)
    items.value = equipmentStore.equipment
    
    await equipmentStore.fetchCurrency(props.characterId)
    currency.value = equipmentStore.currency
  } catch (error) {
    console.error('Error loading inventory:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить инвентарь',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const getEquippedItem = (slot: string) => {
  return items.value.find(item => item.equipped && item.slot === slot)
}

const canEquip = (item: Equipment) => {
  // Проверяем, можно ли экипировать предмет
  if (!item.slot) return false
  if (item.attunement && !item.attuned) return false
  
  // Проверяем требования по силе
  if (item.strength_requirement) {
    const character = charactersStore.currentCharacter
    if (character && character.strength < item.strength_requirement) {
      return false
    }
  }
  
  return true
}

const toggleEquip = async (item: Equipment) => {
  try {
    if (item.equipped) {
      // Снимаем предмет
      await equipmentStore.updateEquipment(item.id, {
        equipped: false,
        slot: undefined,
        attuned: false
      })
      toast.add({
        severity: 'success',
        summary: 'Предмет снят',
        detail: `${item.name} убран из экипировки`,
        life: 2000
      })
    } else {
      // Экипируем предмет
      // Проверяем, не занят ли слот
      const existingItem = getEquippedItem(item.slot!)
      if (existingItem) {
        await equipmentStore.updateEquipment(existingItem.id, {
          equipped: false,
          slot: undefined
        })
      }
      
      await equipmentStore.updateEquipment(item.id, {
        equipped: true,
        slot: item.slot
      })
      
      toast.add({
        severity: 'success',
        summary: 'Предмет экипирован',
        detail: `${item.name} надет`,
        life: 2000
      })
    }
    
    await loadInventory()
  } catch (error) {
    console.error('Error toggling equipment:', error)
  }
}

const unequipItem = async (item: Equipment) => {
  await toggleEquip(item)
}

const getItemIcon = (item: Equipment) => {
  switch (item.type) {
    case 'weapon':
      if (item.subtype?.includes('bow')) return 'pi pi-bolt'
      if (item.subtype?.includes('sword')) return 'pi pi-bolt'
      return 'pi pi-bolt'
    case 'armor':
      return 'pi pi-shield'
    case 'shield':
      return 'pi pi-shield'
    case 'potion':
      return 'pi pi-star'
    case 'scroll':
      return 'pi pi-book'
    case 'container':
      return 'pi pi-folder'
    default:
      return 'pi pi-box'
  }
}

const getItemColor = (type: string) => {
  const colors: Record<string, string> = {
    weapon: '#ef4444',
    armor: '#3b82f6',
    shield: '#10b981',
    potion: '#f59e0b',
    scroll: '#8b5cf6',
    container: '#6b7280'
  }
  return colors[type] || '#6b7280'
}

const getRaritySeverity = (rarity: string) => {
  const severities: Record<string, string> = {
    common: 'info',
    uncommon: 'success',
    rare: 'warning',
    'very_rare': 'danger',
    legendary: 'help'
  }
  return severities[rarity] || 'info'
}

const getContainerWeight = (container: Equipment) => {
  const contents = items.value.filter(item => item.container_id === container.id)
  return contents.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0)
}

const getContainerCapacity = (container: Equipment) => {
  // По умолчанию рюкзак вмещает 30 фунтов
  return 30
}

const getContainerFillPercentage = (container: Equipment) => {
  const weight = getContainerWeight(container)
  const capacity = getContainerCapacity(container)
  return (weight / capacity) * 100
}

// Обработчики диалогов
const openAddItemDialog = () => {
  addItemDialogVisible.value = true
}

const viewItemDetails = (item: Equipment) => {
  selectedItem.value = item
  itemDetailsDialogVisible.value = true
}

const editItem = (item: Equipment) => {
  selectedItem.value = item
  addItemDialogVisible.value = true
}

const confirmDelete = (item: Equipment) => {
  // TODO: Добавить диалог подтверждения
  deleteItem(item)
}

const deleteItem = async (item: Equipment) => {
  try {
    await equipmentStore.deleteEquipment(item.id)
    await loadInventory()
    toast.add({
      severity: 'success',
      summary: 'Удалено',
      detail: `${item.name} удален из инвентаря`,
      life: 2000
    })
  } catch (error) {
    console.error('Error deleting item:', error)
  }
}

const openSlotDialog = (slot: any) => {
  const equipped = getEquippedItem(slot.id)
  if (equipped) {
    viewItemDetails(equipped)
  }
}

const openCurrencyDialog = () => {
  currencyDialogVisible.value = true
}

const openContainer = (container: Equipment) => {
  selectedContainer.value = container
  containerDialogVisible.value = true
}

// Обработчики событий
const onItemSaved = () => {
  addItemDialogVisible.value = false
  loadInventory()
}

const onCurrencySaved = () => {
  currencyDialogVisible.value = false
  loadInventory()
}

const onItemMoved = () => {
  loadInventory()
}

// Загрузка данных
onMounted(() => {
  loadInventory()
})

watch(() => totalWeight.value, (newWeight) => {
  emit('update:total-weight', newWeight)
  
  // Проверяем переносимый вес
  const character = charactersStore.currentCharacter
  if (character) {
    const carryCapacity = character.strength * 15
    const encumbranceLevel = newWeight / carryCapacity
    
    if (encumbranceLevel > 1) {
      emit('update:encumbrance', 'overloaded')
    } else if (encumbranceLevel > 0.5) {
      emit('update:encumbrance', 'encumbered')
    } else {
      emit('update:encumbrance', 'normal')
    }
  }
})

</script>

<style scoped>
.inventory-manager {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.inventory-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.currency-display {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-item i {
  font-size: 1.1rem;
}

.currency-item span {
  font-weight: 600;
  color: #1f2937;
}

.currency-item small {
  color: #6b7280;
  margin-left: 2px;
}

/* Сетка экипировки */
.equipment-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.equipment-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.equipment-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.equipment-slot:hover {
  background: white;
  border-color: #3b82f6;
}

.equipment-slot.equipped {
  background: #eff6ff;
  border-color: #3b82f6;
}

.slot-icon {
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.slot-info {
  flex: 1;
}

.slot-name {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 2px;
}

.slot-item {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.slot-empty {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85rem;
}

/* Сетка предметов */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.item-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-card.equipped {
  background: #eff6ff;
  border-color: #3b82f6;
}

.item-card.container {
  background: #f3f4f6;
  cursor: pointer;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-quantity {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: normal;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

.item-weight {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-attunement {
  color: #9ca3af;
}

.item-attunement.attuned {
  color: #10b981;
}

.item-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

/* Фильтры */
.inventory-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
}

.filter-dropdown {
  width: 200px;
}

/* Пустой инвентарь */
.empty-inventory {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-inventory i {
  margin-bottom: 16px;
}

.empty-inventory p {
  margin-bottom: 20px;
  font-size: 1.1rem;
}

/* Контейнеры */
.containers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.container-card {
  padding: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.container-card:hover {
  background: white;
  border-color: #3b82f6;
}

.container-icon {
  width: 48px;
  height: 48px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: #4b5563;
}

.container-info {
  margin-bottom: 12px;
}

.container-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.container-items {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.container-weight {
  font-size: 0.8rem;
  color: #9ca3af;
}

.container-progress {
  margin-top: 12px;
  height: 4px;
}

/* Активные эффекты */
.active-effects {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.active-effects h4 {
  margin: 0 0 16px 0;
  color: #4b5563;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.effect-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.effect-item i {
  color: #f59e0b;
  margin-top: 2px;
}

.effect-info {
  flex: 1;
}

.effect-info strong {
  display: block;
  color: #1f2937;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.effect-info small {
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .equipment-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .inventory-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .currency-display {
    flex-wrap: wrap;
  }

  .equipment-slots {
    grid-template-columns: 1fr;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .inventory-filters {
    flex-direction: column;
  }

  .filter-dropdown {
    width: 100%;
  }
}
</style>