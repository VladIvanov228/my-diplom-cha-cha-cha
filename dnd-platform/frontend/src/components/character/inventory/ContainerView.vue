<!-- src/components/character/inventory/ContainerView.vue -->

<template>
  <div class="container-view">
    <!-- Заголовок с информацией о контейнере -->
    <div class="container-header">
      <div class="container-icon">
        <i :class="getContainerIcon(container.type)"></i>
      </div>
      <div class="container-info">
        <h3>{{ container.name }}</h3>
        <p v-if="container.description" class="container-description">{{ container.description }}</p>
        <div class="container-stats">
          <span class="stat">
            <i class="pi pi-box"></i>
            {{ containerContents.length }} / {{ getContainerCapacity() }} предметов
          </span>
          <span class="stat">
            <i class="pi pi-weight"></i>
            {{ getContainerWeight().toFixed(1) }} / {{ getContainerCapacity() }} фнт.
          </span>
          <span class="stat" v-if="container.cost">
            <i class="pi pi-dollar"></i>
            {{ container.cost }} {{ container.cost_unit || 'зм' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Прогресс заполнения -->
    <ProgressBar 
      :value="getFillPercentage()" 
      :showValue="false"
      :class="getFillColorClass()"
      class="container-progress"
    />

    <Divider>
      <span class="divider-label">
        <i class="pi pi-box"></i>
        Содержимое
      </span>
    </Divider>

    <!-- Фильтры и поиск -->
    <div class="container-filters">
      <div class="search-box">
        <i class="pi pi-search search-icon"></i>
        <InputText 
          v-model="filters.search" 
          placeholder="Поиск предметов..." 
          class="search-input"
        />
      </div>
      <Dropdown 
        v-model="filters.type" 
        :options="itemTypeOptions" 
        placeholder="Все типы"
        class="filter-dropdown"
      />
    </div>

    <!-- Список предметов в контейнере -->
    <div class="items-list">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
      </div>

      <div v-else-if="filteredContents.length === 0" class="empty-state">
        <i class="pi pi-box empty-icon"></i>
        <p v-if="filters.search || filters.type">Ничего не найдено</p>
        <p v-else>В контейнере нет предметов</p>
        <Button 
          label="Добавить предмет" 
          icon="pi pi-plus" 
          @click="showAddItemDialog = true"
          size="small"
        />
      </div>

      <div v-else class="items-grid">
        <div 
          v-for="item in filteredContents" 
          :key="item.id"
          class="item-card"
          :class="{ equipped: item.equipped }"
        >
          <div class="item-icon" :style="{ backgroundColor: getItemColor(item.type) }">
            <i :class="getItemIcon(item)"></i>
          </div>
          
          <div class="item-details">
            <div class="item-header">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.quantity && item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
            </div>
            
            <div class="item-meta">
              <span v-if="item.weight" class="item-weight">
                {{ (item.weight * (item.quantity || 1)).toFixed(1) }} фнт.
              </span>
              <Tag 
                v-if="item.rarity && item.rarity !== 'common'" 
                :value="item.rarity" 
                :severity="getRaritySeverity(item.rarity)" 
                size="small" 
              />
            </div>
          </div>

          <div class="item-actions">
            <Button 
              icon="pi pi-info-circle" 
              class="p-button-rounded p-button-text p-button-sm"
              @click="viewItemDetails(item)"
            />
            <Button 
              icon="pi pi-folder-open" 
              class="p-button-rounded p-button-text p-button-sm"
              @click="showMoveItemDialog(item)"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-text p-button-danger p-button-sm"
              @click="confirmRemoveItem(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог перемещения предмета -->
    <Dialog 
      v-model:visible="moveItemDialogVisible" 
      header="Переместить предмет" 
      modal 
      :style="{ width: '400px' }"
    >
      <div class="move-item-form" v-if="selectedItem">
        <p>Переместить "{{ selectedItem.name }}"</p>
        
        <div class="field">
          <label>Назначение:</label>
          <Dropdown 
            v-model="moveTarget" 
            :options="moveTargets" 
            optionLabel="label"
            optionValue="value"
            placeholder="Выберите место"
            class="w-full"
          />
        </div>

        <div class="field" v-if="moveTarget === 'container'">
          <label>Выберите контейнер:</label>
          <Dropdown 
            v-model="targetContainerId" 
            :options="otherContainers" 
            optionLabel="name"
            optionValue="id"
            placeholder="Выберите контейнер"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Количество:</label>
          <InputNumber 
            v-model="moveQuantity" 
            :min="1" 
            :max="selectedItem.quantity || 1"
            :step="1"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Отмена" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="moveItemDialogVisible = false"
        />
        <Button 
          label="Переместить" 
          icon="pi pi-folder-open" 
          @click="moveItem"
          :disabled="!canMoveItem"
        />
      </template>
    </Dialog>

    <!-- Диалог просмотра предмета -->
    <Dialog 
      v-model:visible="itemDetailsDialogVisible" 
      :header="selectedItem?.name" 
      modal 
      :style="{ width: '500px' }"
    >
      <ItemDetails :item="selectedItem" />
      <template #footer>
        <Button label="Закрыть" icon="pi pi-times" @click="itemDetailsDialogVisible = false" />
      </template>
    </Dialog>

    <!-- Диалог добавления предмета -->
    <Dialog 
      v-model:visible="showAddItemDialog" 
      header="Добавить предмет в контейнер" 
      modal 
      :style="{ width: '600px' }"
    >
      <ItemForm 
        :character-id="characterId"
        :initial-container-id="container.id"
        @saved="onItemAdded"
        @cancel="showAddItemDialog = false"
      />
    </Dialog>

    <!-- Диалог подтверждения удаления -->
    <Dialog 
      v-model:visible="confirmDeleteDialog" 
      header="Подтверждение" 
      modal 
      :style="{ width: '400px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #ef4444;"></i>
        <p>Вы уверены, что хотите удалить "{{ selectedItem?.name }}" из контейнера?</p>
      </div>
      <template #footer>
        <Button label="Нет" icon="pi pi-times" class="p-button-text" @click="confirmDeleteDialog = false" />
        <Button label="Да" icon="pi pi-check" class="p-button-danger" @click="removeItem" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useEquipmentStore } from '@/stores/equipment'
import type { Equipment } from '@/types/equipment'
import ItemDetails from './ItemDetails.vue'
import ItemForm from './ItemForm.vue'

const props = defineProps<{
  container: Equipment
  characterId: number
}>()

const emit = defineEmits(['item-moved'])

const toast = useToast()
const equipmentStore = useEquipmentStore()

// Состояние
const loading = ref(false)
const containerContents = ref<Equipment[]>([])
const allItems = ref<Equipment[]>([])

// Фильтры
const filters = ref({
  search: '',
  type: null as string | null
})

// Диалоги
const moveItemDialogVisible = ref(false)
const itemDetailsDialogVisible = ref(false)
const showAddItemDialog = ref(false)
const confirmDeleteDialog = ref(false)
const selectedItem = ref<Equipment | null>(null)

// Параметры перемещения
const moveTarget = ref<'inventory' | 'container'>('inventory')
const targetContainerId = ref<number | null>(null)
const moveQuantity = ref(1)

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
  { label: 'Прочее', value: 'other' }
]

// Опции для перемещения
const moveTargets = [
  { label: 'В инвентарь', value: 'inventory' },
  { label: 'В другой контейнер', value: 'container' }
]

// Вычисляемые свойства
const filteredContents = computed(() => {
  return containerContents.value.filter(item => {
    if (filters.value.search && !item.name.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false
    }
    if (filters.value.type && item.type !== filters.value.type) {
      return false
    }
    return true
  })
})

const otherContainers = computed(() => {
  return allItems.value.filter(item => 
    item.type === 'container' && 
    item.id !== props.container.id
  )
})

const canMoveItem = computed(() => {
  if (!selectedItem.value) return false
  const maxQuantity = selectedItem.value.quantity || 1
  if (moveQuantity.value < 1 || moveQuantity.value > maxQuantity) return false
  if (moveTarget.value === 'container' && !targetContainerId.value) return false
  return true
})

// Методы
const loadContents = async () => {
  loading.value = true
  try {
    await equipmentStore.fetchEquipment(props.characterId)
    allItems.value = equipmentStore.equipment
    containerContents.value = allItems.value.filter(item => 
      item.container_id === props.container.id
    )
  } catch (error) {
    console.error('Error loading container contents:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить содержимое контейнера',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const getContainerIcon = (type: string) => {
  const icons: Record<string, string> = {
    backpack: 'pi pi-briefcase',
    pouch: 'pi pi-tag',
    chest: 'pi pi-box',
    barrel: 'pi pi-circle',
    sack: 'pi pi-shopping-bag',
    default: 'pi pi-folder'
  }
  return icons[type] || icons.default
}

const getContainerCapacity = (): number => {
  // Базовая вместимость для разных типов контейнеров
  const capacities: Record<string, number> = {
    backpack: 30,
    pouch: 5,
    chest: 50,
    barrel: 100,
    sack: 20,
    default: 30
  }
  
  // Используем capacity из props.container если есть, иначе определяем по типу
  const containerType = props.container.subtype || 'default'
  return capacities[containerType] || 30
}

const getContainerWeight = (): number => {
  return containerContents.value.reduce((sum, item) => {
    return sum + (item.weight || 0) * (item.quantity || 1)
  }, 0)
}

const getFillPercentage = (): number => {
  const weight = getContainerWeight()
  const capacity = getContainerCapacity()
  return (weight / capacity) * 100
}

const getFillColorClass = (): string => {
  const percentage = getFillPercentage()
  if (percentage >= 90) return 'fill-critical'
  if (percentage >= 70) return 'fill-warning'
  return 'fill-normal'
}

const getItemIcon = (item: Equipment) => {
  switch (item.type) {
    case 'weapon': return 'pi pi-bolt'
    case 'armor': return 'pi pi-shield'
    case 'shield': return 'pi pi-shield'
    case 'potion': return 'pi pi-star'
    case 'scroll': return 'pi pi-book'
    default: return 'pi pi-box'
  }
}

const getItemColor = (type: string) => {
  const colors: Record<string, string> = {
    weapon: '#ef4444',
    armor: '#3b82f6',
    shield: '#10b981',
    potion: '#f59e0b',
    scroll: '#8b5cf6'
  }
  return colors[type] || '#6b7280'
}

const getRaritySeverity = (rarity: string) => {
  const severities: Record<string, string> = {
    common: 'info',
    uncommon: 'success',
    rare: 'warning',
    very_rare: 'danger',
    legendary: 'help'
  }
  return severities[rarity] || 'info'
}

const viewItemDetails = (item: Equipment) => {
  selectedItem.value = item
  itemDetailsDialogVisible.value = true
}

const showMoveItemDialog = (item: Equipment) => {
  selectedItem.value = item
  moveQuantity.value = item.quantity || 1
  moveTarget.value = 'inventory'
  targetContainerId.value = null
  moveItemDialogVisible.value = true
}

const confirmRemoveItem = (item: Equipment) => {
  selectedItem.value = item
  confirmDeleteDialog.value = true
}

const moveItem = async () => {
  if (!selectedItem.value || !canMoveItem.value) return

  try {
    const updates: Partial<Equipment> = {
      quantity: moveQuantity.value
    }

    if (moveTarget.value === 'inventory') {
      updates.container_id = undefined
    } else if (moveTarget.value === 'container' && targetContainerId.value) {
      updates.container_id = targetContainerId.value
    }

    if (moveQuantity.value === (selectedItem.value.quantity || 1)) {
      // Перемещаем весь предмет
      await equipmentStore.updateEquipment(selectedItem.value.id, updates)
    } else {
      // Создаем новый объект без id для нового предмета
      const { id, ...newItemData } = selectedItem.value
      const newItem = { ...newItemData, ...updates }
      await equipmentStore.createEquipment(props.characterId, newItem)
      
      // Уменьшаем количество в исходном предмете
      await equipmentStore.updateEquipment(selectedItem.value.id, {
        quantity: (selectedItem.value.quantity || 1) - moveQuantity.value
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Предмет перемещен',
      life: 2000
    })

    moveItemDialogVisible.value = false
    await loadContents()
    emit('item-moved')
  } catch (error) {
    console.error('Error moving item:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось переместить предмет',
      life: 3000
    })
  }
}

const removeItem = async () => {
  if (!selectedItem.value) return

  try {
    await equipmentStore.deleteEquipment(selectedItem.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Удалено',
      detail: 'Предмет удален из контейнера',
      life: 2000
    })

    confirmDeleteDialog.value = false
    await loadContents()
    emit('item-moved')
  } catch (error) {
    console.error('Error removing item:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить предмет',
      life: 3000
    })
  }
}

const onItemAdded = () => {
  showAddItemDialog.value = false
  loadContents()
  emit('item-moved')
}

// Загрузка данных при монтировании
onMounted(() => {
  loadContents()
})
</script>

<style scoped>
.container-view {
  padding: 20px;
}

.container-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.container-icon {
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #6b7280;
}

.container-info {
  flex: 1;
}

.container-info h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.container-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 12px 0;
}

.container-stats {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #4b5563;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat i {
  font-size: 0.9rem;
}

.container-progress {
  margin-bottom: 20px;
  height: 8px;
}

.fill-normal :deep(.p-progressbar-value) {
  background: #3b82f6;
}

.fill-warning :deep(.p-progressbar-value) {
  background: #f59e0b;
}

.fill-critical :deep(.p-progressbar-value) {
  background: #ef4444;
}

.divider-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.container-filters {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.9rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding-left: 35px;
}

.filter-dropdown {
  width: 200px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.item-card:hover {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-card.equipped {
  background: #eff6ff;
  border-color: #3b82f6;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.item-quantity {
  font-size: 0.8rem;
  color: #6b7280;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #6b7280;
}

.item-weight {
  display: flex;
  align-items: center;
  gap: 2px;
}

.item-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #9ca3af;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 1rem;
}

.move-item-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.move-item-form p {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #1f2937;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-weight: 600;
  color: #4b5563;
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

.confirmation-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.confirmation-content p {
  margin: 0;
  color: #4b5563;
}

@media (max-width: 768px) {
  .container-header {
    flex-direction: column;
    text-align: center;
  }

  .container-stats {
    flex-wrap: wrap;
    justify-content: center;
  }

  .container-filters {
    flex-direction: column;
  }

  .filter-dropdown {
    width: 100%;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .item-card {
    flex-wrap: wrap;
  }

  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>