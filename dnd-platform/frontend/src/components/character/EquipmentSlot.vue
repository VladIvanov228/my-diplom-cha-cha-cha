<template>
  <div 
    class="equipment-slot"
    :class="{ 'occupied': item, 'empty': !item }"
    @dragover.prevent
    @dragenter.prevent
    @drop="onDrop"
    @click="handleClick"
  >
    <div class="slot-icon">
      <i :class="SLOT_ICONS[slotType]"></i>
    </div>
    
    <div class="slot-content">
      <div v-if="item" class="equipped-item">
        <div class="item-icon">
          <i :class="getItemIcon(item.type)"></i>
        </div>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-bonus" v-if="item.armor_class_bonus">
            AC +{{ item.armor_class_bonus }}
          </div>
          <div class="item-damage" v-else-if="item.damage">
            {{ item.damage }} {{ item.damage_type }}
          </div>
        </div>
        <Button 
          icon="pi pi-times" 
          text 
          severity="danger" 
          size="small"
          class="remove-button"
          @click.stop="removeItem"
        />
      </div>
      
      <div v-else class="empty-slot">
        <span class="slot-name">{{ SLOT_DISPLAY_NAMES[slotType] }}</span>
        <small class="slot-hint">Перетащите предмет</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEquipmentStore } from '@/stores/equipment';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import type { InventoryItem, InventorySlot } from '@/types/equipment';
import { SLOT_DISPLAY_NAMES, SLOT_ICONS, SLOT_ALLOWED_TYPES } from '@/types/equipment';

const props = defineProps<{
  slotType: InventorySlot;
  item?: InventoryItem | null;
}>();

const emit = defineEmits<{
  (e: 'item-dropped', slot: InventorySlot): void;
}>();

const equipmentStore = useEquipmentStore();
const toast = useToast();

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  
  const draggedItem = equipmentStore.draggedItem;
  if (!draggedItem) return;
  
  if (!canEquipToSlot(draggedItem)) {
    toast.add({
      severity: 'error',
      summary: 'Нельзя экипировать',
      detail: `${draggedItem.name} нельзя надеть в слот ${SLOT_DISPLAY_NAMES[props.slotType]}`,
      life: 3000
    });
    return;
  }
  
  emit('item-dropped', props.slotType);
};

const canEquipToSlot = (item: InventoryItem): boolean => {
  const allowedTypes = SLOT_ALLOWED_TYPES[props.slotType];
  return allowedTypes.includes(item.type);
};

const removeItem = async () => {
  if (!props.item) return;
  await equipmentStore.unequipItem(props.item.id);
};

const handleClick = () => {
  if (props.item) {
    console.log('Show item details:', props.item);
  }
};

const getItemIcon = (type: string): string => {
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
    other: 'pi pi-box'
  };
  return icons[type] || 'pi pi-circle';
};
</script>

<style scoped>
.equipment-slot {
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 12px;
  min-height: 80px;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
  cursor: pointer;
}

.equipment-slot.occupied {
  border-style: solid;
  border-color: #3b82f6;
  background: #eff6ff;
}

.equipment-slot.empty:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.slot-icon {
  width: 32px;
  height: 32px;
  background: #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.slot-icon i {
  font-size: 1.2rem;
  color: #4b5563;
}

.slot-content {
  flex: 1;
  min-width: 0;
}

.equipped-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.equipped-item .item-icon {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.equipped-item .item-icon i {
  font-size: 0.9rem;
  color: white;
}

.equipped-item .item-info {
  flex: 1;
  min-width: 0;
}

.equipped-item .item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.equipped-item .item-bonus,
.equipped-item .item-damage {
  font-size: 0.75rem;
  font-weight: 600;
}

.equipped-item .item-bonus {
  color: #059669;
}

.equipped-item .item-damage {
  color: #dc2626;
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
  color: #6b7280;
  font-size: 0.9rem;
}

.slot-hint {
  color: #9ca3af;
  font-size: 0.7rem;
}

@media (max-width: 600px) {
  .equipment-slot {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .equipped-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>