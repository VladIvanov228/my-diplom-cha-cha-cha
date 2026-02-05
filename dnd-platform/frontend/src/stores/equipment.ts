import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { 
  Item, 
  ItemType, 
  InventoryItem, 
  InventorySummary, 
  Vehicle, 
  CharacterVehicle,
  CarryingCapacity 
} from '@/types/equipment'

export const useEquipmentStore = defineStore('equipment', () => {
  // State
  const itemTypes = ref<ItemType[]>([])
  const items = ref<Item[]>([])
  const characterInventory = ref<Record<number, InventorySummary>>({})
  const characterVehicles = ref<Record<number, CharacterVehicle[]>>({})
  const carryingCapacity = ref<Record<number, CarryingCapacity>>({})
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions для справочников

  const fetchItemTypes = async () => {
    if (itemTypes.value.length > 0) return itemTypes.value
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get('/equipment/types')
      itemTypes.value = response.data
      return itemTypes.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки типов предметов'
      console.error('Error fetching item types:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchItems = async (filters?: {
    category?: string
    rarity?: string
    search?: string
    type?: string
  }) => {
    isLoading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.rarity) params.append('rarity', filters.rarity)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.type) params.append('type', filters.type)
      
      const url = `/equipment/items${params.toString() ? `?${params.toString()}` : ''}`
      const response = await api.get(url)
      
      items.value = response.data
      return items.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки предметов'
      console.error('Error fetching items:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getItemById = async (id: number) => {
    try {
      const response = await api.get(`/equipment/items/${id}`)
      return response.data
    } catch (err: any) {
      console.error('Error fetching item:', err)
      throw err
    }
  }

  // Actions для инвентаря персонажа

  const fetchCharacterInventory = async (characterId: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/equipment/characters/${characterId}/inventory`)
      characterInventory.value[characterId] = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки инвентаря'
      console.error('Error fetching inventory:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addToInventory = async (characterId: number, itemData: {
    item_id?: number
    custom_name?: string
    custom_description?: string
    quantity?: number
    equipped?: boolean
    equipped_slot?: string
    notes?: string
  }) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.post(
        `/equipment/characters/${characterId}/inventory`,
        itemData
      )
      
      // Обновляем локальное состояние
      if (characterInventory.value[characterId]) {
        await fetchCharacterInventory(characterId)
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка добавления предмета'
      console.error('Error adding to inventory:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateInventoryItem = async (
    characterId: number, 
    itemId: number, 
    updates: Partial<InventoryItem>
  ) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.put(
        `/equipment/characters/${characterId}/inventory/${itemId}`,
        updates
      )
      
      // Обновляем локальное состояние
      if (characterInventory.value[characterId]) {
        const inventory = characterInventory.value[characterId]
        const itemIndex = inventory.items.findIndex(item => item.id === itemId)
        
        if (itemIndex !== -1) {
          inventory.items[itemIndex] = { ...inventory.items[itemIndex], ...response.data }
          
          // Пересчитываем сводку
          inventory.equipped = inventory.items.filter(item => item.equipped)
          inventory.totals = calculateInventoryTotals(inventory.items)
          inventory.byCategory = groupItemsByCategory(inventory.items)
        }
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка обновления предмета'
      console.error('Error updating inventory item:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteInventoryItem = async (characterId: number, itemId: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      await api.delete(`/equipment/characters/${characterId}/inventory/${itemId}`)
      
      // Обновляем локальное состояние
      if (characterInventory.value[characterId]) {
        characterInventory.value[characterId].items = characterInventory.value[characterId]
          .items.filter(item => item.id !== itemId)
        
        const inventory = characterInventory.value[characterId]
        inventory.equipped = inventory.items.filter(item => item.equipped)
        inventory.totals = calculateInventoryTotals(inventory.items)
        inventory.byCategory = groupItemsByCategory(inventory.items)
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка удаления предмета'
      console.error('Error deleting inventory item:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const toggleEquipItem = async (
    characterId: number, 
    itemId: number, 
    slot?: string
  ) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.post(
        `/equipment/characters/${characterId}/inventory/${itemId}/toggle-equip`,
        { slot }
      )
      
      // Обновляем локальное состояние
      if (characterInventory.value[characterId]) {
        const inventory = characterInventory.value[characterId]
        const itemIndex = inventory.items.findIndex(item => item.id === itemId)
        
        if (itemIndex !== -1) {
          inventory.items[itemIndex] = response.data
          inventory.equipped = inventory.items.filter(item => item.equipped)
        }
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка изменения экипировки'
      console.error('Error toggling equipment:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Actions для транспорта

  const fetchCharacterVehicles = async (characterId: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/equipment/characters/${characterId}/vehicles`)
      characterVehicles.value[characterId] = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки транспорта'
      console.error('Error fetching vehicles:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Грузоподъёмность

  const fetchCarryingCapacity = async (characterId: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/equipment/characters/${characterId}/carrying-capacity`)
      carryingCapacity.value[characterId] = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка расчёта грузоподъёмности'
      console.error('Error fetching carrying capacity:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Вспомогательные функции

  const calculateInventoryTotals = (items: InventoryItem[]) => {
    const totals = items.reduce((acc, item) => {
      acc.weight += item.weight * item.quantity
      acc.cost += item.cost * item.quantity
      acc.count += 1
      acc.equippedCount += item.equipped ? 1 : 0
      return acc
    }, { weight: 0, cost: 0, count: 0, equippedCount: 0 })
    
    return totals
  }

  const groupItemsByCategory = (items: InventoryItem[]) => {
    return items.reduce((acc: Record<string, InventoryItem[]>, item) => {
      const category = item.item_category || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    }, {})
  }

  const getItemDisplayName = (item: InventoryItem) => {
    return item.custom_name || item.item_name || 'Безымянный предмет'
  }

  const getItemDisplayDescription = (item: InventoryItem) => {
    return item.custom_description || item.item_description || ''
  }

  const getItemProperties = (item: InventoryItem) => {
    return item.item_properties || {}
  }

  const clearInventoryCache = (characterId?: number) => {
    if (characterId) {
      delete characterInventory.value[characterId]
      delete characterVehicles.value[characterId]
      delete carryingCapacity.value[characterId]
    } else {
      characterInventory.value = {}
      characterVehicles.value = {}
      carryingCapacity.value = {}
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    itemTypes,
    items,
    characterInventory,
    characterVehicles,
    carryingCapacity,
    isLoading,
    error,
    
    // Actions
    fetchItemTypes,
    fetchItems,
    getItemById,
    fetchCharacterInventory,
    addToInventory,
    updateInventoryItem,
    deleteInventoryItem,
    toggleEquipItem,
    fetchCharacterVehicles,
    fetchCarryingCapacity,
    
    // Helpers
    getItemDisplayName,
    getItemDisplayDescription,
    getItemProperties,
    clearInventoryCache,
    clearError
  }
})