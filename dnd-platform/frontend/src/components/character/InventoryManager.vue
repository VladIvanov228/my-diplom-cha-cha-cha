<template>
  <div class="inventory-manager">
    <!-- Слоты экипировки -->
    <div class="equipment-slots-section">
      <h3>⚔️ Экипировка</h3>
      <div class="slots-grid">
        <div 
          v-for="slot in equipmentSlots" 
          :key="slot.id"
          class="equipment-slot"
          :class="{ 'occupied': getItemInSlot(slot.id), 'empty': !getItemInSlot(slot.id) }"
          @dragover.prevent
          @dragenter.prevent
          @drop="handleDropOnSlot(slot.id, $event)"
        >
          <div class="slot-icon">
            <i :class="slot.icon"></i>
          </div>
          <div class="slot-content">
            <div v-if="getItemInSlot(slot.id)" class="equipped-item">
              <div class="item-icon">
                <i :class="getItemIcon(getItemInSlot(slot.id)!.type)"></i>
              </div>
              <div class="item-info">
                <div class="item-name">{{ getItemInSlot(slot.id)!.name }}</div>
                <div class="item-bonus" v-if="getItemInSlot(slot.id)!.armor_class_bonus">
                  AC +{{ getItemInSlot(slot.id)!.armor_class_bonus }}
                </div>
                <div class="item-damage" v-else-if="getItemInSlot(slot.id)!.damage">
                  {{ getItemInSlot(slot.id)!.damage }} {{ getItemInSlot(slot.id)!.damage_type }}
                </div>
              </div>
              <Button 
                icon="pi pi-times" 
                text 
                severity="danger" 
                size="small"
                class="remove-button"
                @click.stop="unequipItem(getItemInSlot(slot.id)!.id)"
              />
            </div>
            <div v-else class="empty-slot">
              <span class="slot-name">{{ slot.name }}</span>
              <small class="slot-hint">Перетащите предмет</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Инвентарь -->
    <div class="inventory-section">
      <div class="inventory-header">
        <h3>🎒 Инвентарь</h3>
        <div class="inventory-stats">
          <span class="weight-info">
            <i class="pi pi-weight"></i>
            Вес: {{ totalWeight.toFixed(1) }} / {{ carryCapacity }} фнт.
            <span :class="encumbranceLevel" class="encumbrance-badge">
              {{ encumbranceText }}
            </span>
          </span>
          <Button 
            label="Добавить предмет" 
            icon="pi pi-plus" 
            @click="openAddItemDialog" 
            size="small"
          />
        </div>
      </div>

      <!-- Сетка инвентаря -->
      <div class="inventory-grid" v-if="!loading && backpackItems.length > 0">
        <div 
          v-for="item in backpackItems" 
          :key="item.id"
          class="inventory-item"
          draggable="true"
          @dragstart="handleDragStart(item, $event)"
          @dragend="handleDragEnd"
        >
          <div class="item-icon">
            <i :class="getItemIcon(item.type)"></i>
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">
              <span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-weight">{{ ((item.weight || 0) * item.quantity).toFixed(1) }} фнт.</span>
            </div>
          </div>
          <div class="item-actions">
            <Button 
              v-if="canEquip(item)"
              icon="pi pi-shield" 
              size="small" 
              text 
              @click="quickEquip(item)"
              title="Экипировать"
            />
            <Button 
              icon="pi pi-trash" 
              severity="danger" 
              size="small"
              text
              @click="confirmDelete(item)"
              title="Удалить"
            />
          </div>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i> Загрузка инвентаря...
      </div>

      <!-- Пустое состояние -->
      <div v-if="!loading && backpackItems.length === 0" class="empty-inventory">
        <i class="pi pi-box"></i>
        <p>Инвентарь пуст</p>
        <small>Нажмите "Добавить предмет" или перетащите предметы из экипировки</small>
      </div>
    </div>

    <!-- Диалог добавления предмета -->
    <Dialog 
      v-model:visible="addItemDialogVisible" 
      header="Добавить предмет" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="add-item-form">
        <div class="form-field">
          <label>Тип предмета</label>
          <Dropdown 
            v-model="newItemType" 
            :options="itemTypes" 
            optionLabel="label"
            optionValue="value"
            placeholder="Выберите тип"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label>Название</label>
          <InputText v-model="newItemName" placeholder="Название предмета" class="w-full" />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Количество</label>
            <InputNumber v-model="newItemQuantity" :min="1" :max="99" class="w-full" />
          </div>
          <div class="form-field">
            <label>Вес (фнт.)</label>
            <InputNumber v-model="newItemWeight" :min="0" :step="0.5" class="w-full" />
          </div>
        </div>

        <div class="form-field">
          <label>Описание</label>
          <Textarea v-model="newItemDescription" rows="2" placeholder="Описание предмета" class="w-full" />
        </div>

        <!-- Боевые параметры для оружия/брони -->
        <div v-if="newItemType === 'weapon'" class="form-field">
          <label>Урон</label>
          <InputText v-model="newItemDamage" placeholder="Например: 1d8" class="w-full" />
        </div>

        <div v-if="newItemType === 'armor' || newItemType === 'shield'" class="form-field">
          <label>Бонус к AC</label>
          <InputNumber v-model="newItemArmorBonus" :min="0" :max="5" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="closeAddItemDialog" />
        <Button label="Добавить" @click="addCustomItem" :disabled="!newItemName" />
      </template>
    </Dialog>

    <!-- Диалог подтверждения удаления -->
    <Dialog 
      v-model:visible="deleteDialogVisible" 
      header="Подтверждение удаления" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>Вы уверены, что хотите удалить предмет "{{ itemToDelete?.name }}"?</p>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="deleteDialogVisible = false" />
        <Button label="Удалить" severity="danger" @click="deleteItem" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { useEquipmentStore } from '@/stores/equipment';
import { useCharactersStore } from '@/stores/characters';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import type { InventoryItem, InventorySlot, InventoryItemType } from '@/types/equipment';

const props = defineProps<{
  characterId: number;
}>();

const emit = defineEmits(['update:totalWeight', 'update:encumbrance']);

const toast = useToast();
const equipmentStore = useEquipmentStore();
const charactersStore = useCharactersStore();

// Состояние
const loading = ref(false);
const addItemDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const itemToDelete = ref<InventoryItem | null>(null);
const draggedItem = ref<InventoryItem | null>(null);

// Форма добавления предмета
const newItemType = ref<InventoryItemType>('other');
const newItemName = ref('');
const newItemQuantity = ref(1);
const newItemWeight = ref(0);
const newItemDescription = ref('');
const newItemDamage = ref('');
const newItemArmorBonus = ref(0);

// Типы предметов для выбора
const itemTypes = [
  { label: 'Оружие', value: 'weapon' },
  { label: 'Броня', value: 'armor' },
  { label: 'Щит', value: 'shield' },
  { label: 'Шлем', value: 'helmet' },
  { label: 'Сапоги', value: 'boots' },
  { label: 'Пояс', value: 'belt' },
  { label: 'Зелье', value: 'potion' },
  { label: 'Свиток', value: 'scroll' },
  { label: 'Инструмент', value: 'tool' },
  { label: 'Фокус', value: 'focus' },
  { label: 'Контейнер', value: 'container' },
  { label: 'Прочее', value: 'other' }
];

// Слоты экипировки
const equipmentSlots = [
  { id: 'helmet' as InventorySlot, name: 'Шлем', icon: 'pi pi-star', allowedTypes: ['helmet', 'armor'] },
  { id: 'chest' as InventorySlot, name: 'Нагрудник', icon: 'pi pi-shield', allowedTypes: ['armor'] },
  { id: 'belt' as InventorySlot, name: 'Пояс', icon: 'pi pi-circle', allowedTypes: ['belt', 'tool'] },
  { id: 'boots' as InventorySlot, name: 'Сапоги', icon: 'pi pi-arrow-up', allowedTypes: ['boots'] },
  { id: 'main_hand' as InventorySlot, name: 'Основная рука', icon: 'pi pi-bolt', allowedTypes: ['weapon', 'shield', 'tool', 'focus'] },
  { id: 'off_hand' as InventorySlot, name: 'Вспомогательная рука', icon: 'pi pi-sun', allowedTypes: ['weapon', 'shield', 'tool', 'focus'] }
];

// Computed
const backpackItems = computed(() => {
  return equipmentStore.items.filter(item => !item.equipped && !item.container_id);
});

const totalWeight = computed(() => {
  return equipmentStore.items.reduce((sum, item) => {
    return sum + ((item.weight || 0) * item.quantity);
  }, 0);
});

const carryCapacity = computed(() => {
  const strength = charactersStore.currentCharacter?.strength || 10;
  return strength * 15;
});

const encumbranceLevel = computed(() => {
  const ratio = totalWeight.value / carryCapacity.value;
  if (ratio >= 1) return 'overloaded';
  if (ratio >= 0.5) return 'encumbered';
  return 'normal';
});

const encumbranceText = computed(() => {
  switch (encumbranceLevel.value) {
    case 'overloaded': return 'Перегруз';
    case 'encumbered': return 'Нагрузка';
    default: return 'Норма';
  }
});

// Methods
const getItemIcon = (type: string) => {
  const icons: Record<string, string> = {
    weapon: 'pi pi-bolt',
    armor: 'pi pi-shield',
    shield: 'pi pi-shield',
    helmet: 'pi pi-star',
    boots: 'pi pi-arrow-up',
    belt: 'pi pi-circle',
    potion: 'pi pi-heart',
    scroll: 'pi pi-file',
    tool: 'pi pi-wrench',
    focus: 'pi pi-star',
    container: 'pi pi-box',
    other: 'pi pi-circle'
  };
  return icons[type] || 'pi pi-circle';
};

const getItemInSlot = (slot: InventorySlot) => {
  return equipmentStore.items.find(item => item.equipped && item.slot === slot);
};

const canEquip = (item: InventoryItem) => {
  const equippableTypes = ['weapon', 'armor', 'shield', 'helmet', 'boots', 'belt', 'focus'];
  return equippableTypes.includes(item.type);
};

const canEquipToSlot = (item: InventoryItem, slotId: InventorySlot): boolean => {
  const slot = equipmentSlots.find(s => s.id === slotId);
  if (!slot) return false;
  return slot.allowedTypes.includes(item.type);
};

// Drag & Drop
const handleDragStart = (item: InventoryItem, event: DragEvent) => {
  draggedItem.value = item;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, name: item.name }));
  }
};

const handleDragEnd = () => {
  draggedItem.value = null;
};

const handleDropOnSlot = async (slotId: InventorySlot, event: DragEvent) => {
  event.preventDefault();
  if (!draggedItem.value) return;
  
  if (!canEquipToSlot(draggedItem.value, slotId)) {
    const slot = equipmentSlots.find(s => s.id === slotId);
    toast.add({
      severity: 'error',
      summary: 'Нельзя экипировать',
      detail: `${draggedItem.value.name} нельзя надеть в слот ${slot?.name}`,
      life: 3000
    });
    return;
  }
  
  await equipmentStore.equipItem(draggedItem.value.id, slotId);
  draggedItem.value = null;
};

// Экипировка/снятие
const quickEquip = async (item: InventoryItem) => {
  const slotMap: Record<string, InventorySlot> = {
    weapon: 'main_hand',
    shield: 'off_hand',
    armor: 'chest',
    helmet: 'helmet',
    boots: 'boots',
    belt: 'belt',
    focus: 'main_hand'
  };
  
  const targetSlot = slotMap[item.type];
  if (targetSlot && canEquipToSlot(item, targetSlot)) {
    await equipmentStore.equipItem(item.id, targetSlot);
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Нельзя экипировать',
      detail: `${item.name} нельзя экипировать`,
      life: 3000
    });
  }
};

const unequipItem = async (itemId: number) => {
  await equipmentStore.unequipItem(itemId);
};

// Управление предметами
const openAddItemDialog = () => {
  newItemType.value = 'other';
  newItemName.value = '';
  newItemQuantity.value = 1;
  newItemWeight.value = 0;
  newItemDescription.value = '';
  newItemDamage.value = '';
  newItemArmorBonus.value = 0;
  addItemDialogVisible.value = true;
};

const closeAddItemDialog = () => {
  addItemDialogVisible.value = false;
};

const addCustomItem = async () => {
  if (!newItemName.value.trim()) return;
  
  const itemData: any = {
    name: newItemName.value,
    type: newItemType.value,
    quantity: newItemQuantity.value,
    weight: newItemWeight.value,
    description: newItemDescription.value || null
  };
  
  if (newItemType.value === 'weapon' && newItemDamage.value) {
    itemData.damage = newItemDamage.value;
    itemData.damage_type = 'slashing';
  }
  
  if ((newItemType.value === 'armor' || newItemType.value === 'shield') && newItemArmorBonus.value > 0) {
    itemData.armor_class_bonus = newItemArmorBonus.value;
  }
  
  await equipmentStore.createEquipment(props.characterId, itemData);
  closeAddItemDialog();
};

const confirmDelete = (item: InventoryItem) => {
  itemToDelete.value = item;
  deleteDialogVisible.value = true;
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;
  await equipmentStore.deleteEquipment(itemToDelete.value.id);
  deleteDialogVisible.value = false;
  itemToDelete.value = null;
};

// Загрузка данных
const loadData = async () => {
  loading.value = true;
  try {
    await equipmentStore.fetchEquipment(props.characterId);
    await equipmentStore.fetchCurrency(props.characterId);
    
    emit('update:totalWeight', totalWeight.value);
    emit('update:encumbrance', encumbranceLevel.value);
  } catch (error) {
    console.error('Error loading inventory:', error);
  } finally {
    loading.value = false;
  }
};

// Следим за изменениями веса
watch(totalWeight, (newWeight) => {
  emit('update:totalWeight', newWeight);
  emit('update:encumbrance', encumbranceLevel.value);
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.inventory-manager {
  padding: 1rem;
}

/* Слоты экипировки */
.equipment-slots-section {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.equipment-slots-section h3 {
  margin: 0 0 1rem 0;
  color: #f1f5f9;
  font-size: 1.1rem;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.equipment-slot {
  background: #334155;
  border: 2px solid #475569;
  border-radius: 12px;
  padding: 12px;
  min-height: 80px;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
  cursor: pointer;
}

.equipment-slot.occupied {
  border-color: #3b82f6;
  background: #1e293b;
}

.equipment-slot.empty:hover {
  border-color: #64748b;
  background: #475569;
}

.slot-icon {
  width: 48px;
  height: 48px;
  background: #1e293b;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.slot-icon i {
  font-size: 1.5rem;
  color: #94a3b8;
}

.slot-content {
  flex: 1;
  min-width: 0;
}

.equipped-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.equipped-item .item-icon {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.equipped-item .item-icon i {
  font-size: 1.2rem;
  color: white;
}

.equipped-item .item-info {
  flex: 1;
  min-width: 0;
}

.equipped-item .item-name {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.equipped-item .item-bonus,
.equipped-item .item-damage {
  font-size: 0.7rem;
  font-weight: 600;
}

.equipped-item .item-bonus {
  color: #4ade80;
}

.equipped-item .item-damage {
  color: #f87171;
}

.remove-button {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.equipment-slot.occupied:hover .remove-button {
  opacity: 1;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-name {
  font-weight: 500;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.slot-hint {
  color: #64748b;
  font-size: 0.7rem;
}

/* Инвентарь */
.inventory-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.inventory-header h3 {
  margin: 0;
  color: #1f2937;
}

.inventory-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.weight-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.9rem;
}

.encumbrance-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.encumbrance-badge.normal {
  background: #d1fae5;
  color: #065f46;
}

.encumbrance-badge.encumbered {
  background: #fed7aa;
  color: #92400e;
}

.encumbrance-badge.overloaded {
  background: #fecaca;
  color: #991b1b;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.25rem;
}

.inventory-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: grab;
  transition: all 0.2s;
}

.inventory-item:active {
  cursor: grabbing;
}

.inventory-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #3b82f6;
  background: white;
}

.inventory-item .item-icon {
  width: 44px;
  height: 44px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.inventory-item .item-icon i {
  font-size: 1.3rem;
  color: #6b7280;
}

.inventory-item .item-info {
  flex: 1;
  min-width: 0;
}

.inventory-item .item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inventory-item .item-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.inventory-item .item-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-inventory {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-inventory i {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-inventory p {
  margin: 0;
}

.empty-inventory small {
  font-size: 0.75rem;
}

/* Форма добавления */
.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .slots-grid {
    grid-template-columns: 1fr;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>