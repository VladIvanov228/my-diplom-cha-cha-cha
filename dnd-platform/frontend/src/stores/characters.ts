import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export interface Character {
  id: number
  name: string
  level: number
  class: string
  race: string
  background: string
  alignment: string
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  hit_points: number
  armor_class: number
  experience_points: number
  proficiency_bonus: number
  inspiration: boolean
  speed: number
  hit_dice: string
  personality_traits: string
  ideals: string
  bonds: string
  flaws: string
  features: string
  notes: string
  user_id: number
  campaign_id: number | null
  created_at: string
  updated_at: string
}

export interface ClassData {
  id: number
  name: string
  hit_dice: string
  description: string
  features: any
}

export interface RaceData {
  id: number
  name: string
  description: string
  ability_bonuses: any
  speed: number
  features: any
}

export const useCharactersStore = defineStore('characters', () => {
  // State
  const characters = ref<Character[]>([])
  const currentCharacter = ref<Character | null>(null)
  const classes = ref<ClassData[]>([])
  const races = ref<RaceData[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Геттеры
  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2)
  }

  const getPassivePerception = (character: Character): number => {
    const wisdomMod = getAbilityModifier(character.wisdom)
    return 10 + wisdomMod + (character.proficiency_bonus || 0)
  }

  // Actions
  const fetchCharacters = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get('/characters')
      characters.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки персонажей'
      console.error('Error fetching characters:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchCharacter = async (id: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/characters/${id}`)
      currentCharacter.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка загрузки персонажа'
      console.error('Error fetching character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createCharacter = async (characterData: Partial<Character>) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.post('/characters', characterData)
      characters.value.unshift(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка создания персонажа'
      console.error('Error creating character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCharacter = async (id: number, updates: Partial<Character>) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.put(`/characters/${id}`, updates)
      
      // Обновляем в списке
      const index = characters.value.findIndex(c => c.id === id)
      if (index !== -1) {
        characters.value[index] = response.data
      }
      
      // Обновляем текущего персонажа если это он
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = response.data
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка обновления персонажа'
      console.error('Error updating character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteCharacter = async (id: number) => {
    isLoading.value = true
    error.value = null
    
    try {
      await api.delete(`/characters/${id}`)
      
      // Удаляем из списка
      characters.value = characters.value.filter(c => c.id !== id)
      
      // Сбрасываем текущего персонажа если это он
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка удаления персонажа'
      console.error('Error deleting character:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchClasses = async () => {
    // Не загружаем повторно если уже загружено
    if (classes.value.length > 0) {
      console.log('Classes already loaded, returning cached data')
      return classes.value
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      console.log('Fetching classes from API...')
      const response = await api.get('/characters/data/classes')
      console.log('Classes API response:', response.status, response.data)
      
      if (Array.isArray(response.data)) {
        classes.value = response.data
        console.log(`✅ Successfully loaded ${response.data.length} classes`)
      } else {
        console.error('❌ Invalid response format for classes:', response.data)
        classes.value = []
        error.value = 'Некорректный формат данных классов'
        throw new Error('Некорректный формат данных классов')
      }
    } catch (err: any) {
      console.error('❌ Error fetching classes:', err)
      
      // Подробная диагностика ошибки
      if (err.response) {
        console.error('Response status:', err.response.status)
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
        error.value = err.response.data?.error || `Ошибка ${err.response.status}: ${err.response.statusText}`
      } else if (err.request) {
        console.error('No response received:', err.request)
        error.value = 'Нет ответа от сервера. Проверьте подключение.'
      } else {
        error.value = err.message || 'Неизвестная ошибка загрузки классов'
      }
      
      classes.value = []
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchRaces = async () => {
    // Не загружаем повторно если уже загружено
    if (races.value.length > 0) {
      console.log('Races already loaded, returning cached data')
      return races.value
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      console.log('Fetching races from API...')
      const response = await api.get('/characters/data/races')
      console.log('Races API response:', response.status, response.data)
      
      if (Array.isArray(response.data)) {
        races.value = response.data
        console.log(`✅ Successfully loaded ${response.data.length} races`)
      } else {
        console.error('❌ Invalid response format for races:', response.data)
        races.value = []
        error.value = 'Некорректный формат данных рас'
        throw new Error('Некорректный формат данных рас')
      }
    } catch (err: any) {
      console.error('❌ Error fetching races:', err)
      
      // Подробная диагностика ошибки
      if (err.response) {
        console.error('Response status:', err.response.status)
        console.error('Response data:', err.response.data)
        console.error('Response headers:', err.response.headers)
        error.value = err.response.data?.error || `Ошибка ${err.response.status}: ${err.response.statusText}`
      } else if (err.request) {
        console.error('No response received:', err.request)
        error.value = 'Нет ответа от сервера. Проверьте подключение.'
      } else {
        error.value = err.message || 'Неизвестная ошибка загрузки рас'
      }
      
      races.value = []
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearCurrentCharacter = () => {
    currentCharacter.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    characters,
    currentCharacter,
    classes,
    races,
    isLoading,
    error,
    
    // Getters (computed в Composition API)
    getAbilityModifier,
    getPassivePerception,
    
    // Actions
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    fetchClasses,
    fetchRaces,
    clearCurrentCharacter,
    clearError
  }
})