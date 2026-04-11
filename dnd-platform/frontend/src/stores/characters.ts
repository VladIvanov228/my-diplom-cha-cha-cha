// frontend/src/stores/characters.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { Character, CreateCharacterDTO } from '@/types/character'  // Исправленный импорт
import { useEquipmentStore } from './equipment'
import { CLASS_STARTING_EQUIPMENT, CLASS_STARTING_CURRENCY } from '@/types/character'

export const useCharactersStore = defineStore('characters', () => {
  // State
  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const classes = ref<any[]>([])
  const races = ref<any[]>([])
  const backgrounds = ref<any[]>([])
  const loading = ref(false)  
  const error = ref<string | null>(null)

  // Fetch all characters for current user
  const fetchCharacters = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/characters')
      characters.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch characters'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch single character
  const fetchCharacter = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/characters/${id}`)
      currentCharacter.value = response.data
      
      // Загружаем инвентарь персонажа
      const equipmentStore = useEquipmentStore()
      await equipmentStore.fetchEquipment(id)
      await equipmentStore.fetchCurrency(id)
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch character'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create character
  const createCharacter = async (characterData: Partial<Character>) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/characters', characterData)
      const newCharacter = response.data
      characters.value.push(newCharacter)
      return newCharacter
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create character'
      throw err
    } finally {
      loading.value = false
    }
  }

  // NEW: Create character with equipment
  const createCharacterWithEquipment = async (
    characterData: Partial<Character>, 
    options?: { 
      addStandardPack?: boolean,
      customItems?: Array<{ name: string; type: string; quantity?: number }>
    }
  ) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('Creating character with equipment:', characterData)
      
      // 1. Сначала создаем персонажа
      const characterResponse = await api.post('/characters', characterData)
      const newCharacter = characterResponse.data as Character
      
      console.log('✅ Character created:', newCharacter)
      
      // Получаем store оборудования
      const equipmentStore = useEquipmentStore()
      
      // 2. Если нужно добавить стартовый набор
      if (options?.addStandardPack && characterData.class) {
        const classKey = characterData.class
        const startingItems = CLASS_STARTING_EQUIPMENT[classKey as keyof typeof CLASS_STARTING_EQUIPMENT]
        
        if (startingItems && Array.isArray(startingItems)) {
          console.log(`Adding starting equipment for ${classKey}:`, startingItems)
          
          // Добавляем каждый предмет из стартового набора
          for (const item of startingItems) {
            try {
              await equipmentStore.createEquipment(newCharacter.id, {
                name: item.name,
                type: item.type || 'other',
                subtype: item.subtype,
                quantity: item.quantity || 1,
                weight: item.weight || 0,
                cost: item.cost || 0,
                description: item.description,
                damage: item.damage,
                damage_type: item.damage_type,
                armor_class_bonus: item.armor_class_bonus,
                // Убираем поле equipped, так как его нет в типе CreateEquipmentDTO
                // Или добавляем его в тип, как показано выше
              })
            } catch (itemError) {
              console.error(`Error adding item ${item.name}:`, itemError)
              // Продолжаем добавлять остальные предметы
            }
          }
        }
        
        // Добавляем рюкзак по умолчанию, если его нет в стартовом наборе
        const hasBackpack = startingItems?.some(item => 
          item.name.toLowerCase().includes('pack') || item.type === 'container'
        )
        if (!hasBackpack) {
          await equipmentStore.createEquipment(newCharacter.id, {
            name: 'Рюкзак',
            type: 'container',
            weight: 5,
            cost: 2,
            description: 'Обычный рюкзак для хранения вещей'
          })
        }
      }
      
      // 3. Инициализируем валюту
      if (characterData.class) {
        const classKey = characterData.class
        const startingCurrency = CLASS_STARTING_CURRENCY[classKey as keyof typeof CLASS_STARTING_CURRENCY]
        
        if (startingCurrency) {
          try {
            await equipmentStore.createCurrency(newCharacter.id)
            await equipmentStore.updateCurrency(newCharacter.id, {
              gold: startingCurrency.gold || 0,
              silver: startingCurrency.silver || 0
            })
            console.log(`💰 Starting currency added: ${startingCurrency.gold}gp, ${startingCurrency.silver}sp`)
          } catch (currencyError) {
            console.error('Error adding currency:', currencyError)
          }
        }
      }
      
      // 4. Добавляем в список персонажей
      characters.value.push(newCharacter)
      
      return newCharacter
      
    } catch (err: any) {
      console.error('❌ Error creating character with equipment:', err)
      error.value = err.response?.data?.error || err.message || 'Failed to create character'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update character
  const updateCharacter = async (id: number, updates: Partial<Character>) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/characters/${id}`, updates)
      const updatedCharacter = response.data
      
      // Update in array
      const index = characters.value.findIndex(c => c.id === id)
      if (index !== -1) {
        characters.value[index] = updatedCharacter
      }
      
      // Update current if needed
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = updatedCharacter
      }
      
      return updatedCharacter
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update character'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete character
  const deleteCharacter = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/characters/${id}`)
      characters.value = characters.value.filter(c => c.id !== id)
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete character'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await api.get('/characters/data/classes')
      classes.value = response.data
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  // Fetch races
  const fetchRaces = async () => {
    try {
      const response = await api.get('/characters/data/races')
      races.value = response.data
    } catch (err) {
      console.error('Error fetching races:', err)
    }
  }

  // Fetch backgrounds
  const fetchBackgrounds = async () => {
    try {
      const response = await api.get('/characters/data/backgrounds')
      backgrounds.value = response.data
    } catch (err) {
      console.error('Error fetching backgrounds:', err)
    }
  }

  return {
    // State
    characters,
    currentCharacter,
    classes,
    races,
    backgrounds,
    loading,  // <-- ИСПРАВЛЕНО
    error,
    
    // Methods
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    createCharacterWithEquipment,  // <-- НОВЫЙ МЕТОД
    updateCharacter,
    deleteCharacter,
    fetchClasses,
    fetchRaces,
    fetchBackgrounds,
  }
})