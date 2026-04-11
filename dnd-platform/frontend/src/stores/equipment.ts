// frontend/src/stores/equipment.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { 
  InventoryItem, 
  Currency, 
  InventorySlot,
  CreateInventoryItemDTO,
  UpdateInventoryItemDTO
} from '@/types/equipment';
import { SLOT_DISPLAY_NAMES } from '@/types/equipment';
import { useToast } from 'primevue/usetoast';

export const useEquipmentStore = defineStore('equipment', () => {
  const toast = useToast();
  
  // State
  const items = ref<InventoryItem[]>([]);
  const currency = ref<Currency | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const draggedItem = ref<InventoryItem | null>(null);

  // Getters
  const equippedItems = computed(() => {
    return items.value.filter(item => item.equipped);
  });

  const backpackItems = computed(() => {
    return items.value.filter(item => !item.equipped && !item.container_id);
  });

  const itemsInContainer = (containerId: number) => {
    return items.value.filter(item => item.container_id === containerId);
  };

  const getItemInSlot = (slot: InventorySlot) => {
    return items.value.find(item => item.equipped && item.slot === slot);
  };

  // Загрузка инвентаря персонажа
  const fetchEquipment = async (characterId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/characters/${characterId}/equipment`);
      items.value = response.data;
      console.log(`✅ Loaded ${items.value.length} equipment items`);
      return items.value;
    } catch (err: any) {
      console.error('❌ Error fetching equipment:', err);
      error.value = err.response?.data?.error || 'Failed to load equipment';
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.value,
        life: 3000
      });
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Загрузка валюты
  const fetchCurrency = async (characterId: number) => {
    try {
      const response = await api.get(`/characters/${characterId}/currency`);
      currency.value = response.data;
      return currency.value;
    } catch (err: any) {
      console.error('❌ Error fetching currency:', err);
      return null;
    }
  };

  // Создание предмета
  const createEquipment = async (characterId: number, data: CreateInventoryItemDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(`/characters/${characterId}/equipment`, data);
      const newItem = response.data;
      items.value.push(newItem);
      
      toast.add({
        severity: 'success',
        summary: 'Успех',
        detail: `Предмет "${data.name}" добавлен`,
        life: 3000
      });
      
      return newItem;
    } catch (err: any) {
      console.error('❌ Error creating equipment:', err);
      error.value = err.response?.data?.error || 'Failed to create item';
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.value,
        life: 3000
      });
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Обновление предмета
  const updateEquipment = async (itemId: number, data: UpdateInventoryItemDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.put(`/equipment/${itemId}`, data);
      const updatedItem = response.data;
      
      const index = items.value.findIndex(i => i.id === itemId);
      if (index !== -1) {
        items.value[index] = updatedItem;
      }
      
      return updatedItem;
    } catch (err: any) {
      console.error('❌ Error updating equipment:', err);
      error.value = err.response?.data?.error || 'Failed to update item';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Удаление предмета
  const deleteEquipment = async (itemId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/equipment/${itemId}`);
      items.value = items.value.filter(i => i.id !== itemId);
      
      toast.add({
        severity: 'success',
        summary: 'Успех',
        detail: 'Предмет удален',
        life: 3000
      });
    } catch (err: any) {
      console.error('❌ Error deleting equipment:', err);
      error.value = err.response?.data?.error || 'Failed to delete item';
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.value,
        life: 3000
      });
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Экипировка предмета в слот
  const equipItem = async (itemId: number, slot: InventorySlot) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(`/equipment/${itemId}/equip`, { slot });
      const updatedItem = response.data;
      
      const index = items.value.findIndex(i => i.id === itemId);
      if (index !== -1) {
        items.value[index] = updatedItem;
      }
      
      toast.add({
        severity: 'success',
        summary: 'Экипировано',
        detail: `${updatedItem.name} надето в слот ${SLOT_DISPLAY_NAMES[slot]}`,
        life: 2000
      });
      
      return updatedItem;
    } catch (err: any) {
      console.error('❌ Error equipping item:', err);
      error.value = err.response?.data?.error || 'Failed to equip item';
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.value,
        life: 3000
      });
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Снятие предмета (в рюкзак)
  const unequipItem = async (itemId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(`/equipment/${itemId}/unequip`);
      const updatedItem = response.data;
      
      const index = items.value.findIndex(i => i.id === itemId);
      if (index !== -1) {
        items.value[index] = updatedItem;
      }
      
      toast.add({
        severity: 'info',
        summary: 'Снято',
        detail: `${updatedItem.name} перемещено в рюкзак`,
        life: 2000
      });
      
      return updatedItem;
    } catch (err: any) {
      console.error('❌ Error unequipping item:', err);
      error.value = err.response?.data?.error || 'Failed to unequip item';
      
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: error.value,
        life: 3000
      });
      
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Перемещение предмета в контейнер
  const moveToContainer = async (itemId: number, containerId: number) => {
    try {
      const updated = await updateEquipment(itemId, {
        container_id: containerId,
        equipped: false,
        slot: undefined
      });
      
      toast.add({
        severity: 'info',
        summary: 'Перемещено',
        detail: 'Предмет перемещен в контейнер',
        life: 2000
      });
      
      return updated;
    } catch (err) {
      console.error('❌ Error moving item to container:', err);
      throw err;
    }
  };

  // Извлечение предмета из контейнера
  const removeFromContainer = async (itemId: number) => {
    try {
      const updated = await updateEquipment(itemId, {
        container_id: null
      });
      
      toast.add({
        severity: 'info',
        summary: 'Извлечено',
        detail: 'Предмет извлечен из контейнера',
        life: 2000
      });
      
      return updated;
    } catch (err) {
      console.error('❌ Error removing item from container:', err);
      throw err;
    }
  };

  // Создание валюты
  const createCurrency = async (characterId: number) => {
    try {
      const response = await api.post(`/characters/${characterId}/currency`, {
        copper: 0,
        silver: 0,
        electrum: 0,
        gold: 0,
        platinum: 0
      });
      currency.value = response.data;
      return currency.value;
    } catch (err: any) {
      console.error('❌ Error creating currency:', err);
      return null;
    }
  };

  // Обновление валюты
  const updateCurrency = async (characterId: number, data: Partial<Currency>) => {
    try {
      const response = await api.put(`/characters/${characterId}/currency`, data);
      currency.value = response.data;
      return currency.value;
    } catch (err: any) {
      console.error('❌ Error updating currency:', err);
      throw err;
    }
  };

  // Drag-n-drop методы
  const setDraggedItem = (item: InventoryItem | null) => {
    draggedItem.value = item;
  };

  const clearDraggedItem = () => {
    draggedItem.value = null;
  };

  // Сброс состояния
  const reset = () => {
    items.value = [];
    currency.value = null;
    loading.value = false;
    error.value = null;
    draggedItem.value = null;
  };

  return {
    // State
    items,
    currency,
    loading,
    error,
    draggedItem,
    
    // Getters
    equippedItems,
    backpackItems,
    itemsInContainer,
    getItemInSlot,
    
    // Actions
    fetchEquipment,
    fetchCurrency,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    equipItem,
    unequipItem,
    moveToContainer,
    removeFromContainer,
    createCurrency,
    updateCurrency,
    
    // Drag-n-drop
    setDraggedItem,
    clearDraggedItem,
    
    // Utils
    reset
  };
});