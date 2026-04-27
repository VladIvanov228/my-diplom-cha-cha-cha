import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { 
  Campaign, 
  CampaignDetails, 
  CreateCampaignDTO, 
  UpdateCampaignDTO,
  CampaignPlayer,
  CampaignMessage 
} from '@/types/campaign'

export const useCampaignsStore = defineStore('campaigns', () => {
  // State
  const campaigns = ref<Campaign[]>([])
  const currentCampaign = ref<CampaignDetails | null>(null)
  const messages = ref<CampaignMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Getters
  const myCampaigns = computed(() => 
    campaigns.value.filter(c => c.dm_id === getCurrentUserId())
  )
  
  const joinedCampaigns = computed(() => 
    campaigns.value.filter(c => c.dm_id !== getCurrentUserId() && c.is_player)
  )
  
  const isDM = computed(() => 
    currentCampaign.value?.userRole === 'dm'
  )
  
  const players = computed(() => 
    currentCampaign.value?.players.filter(p => p.role !== 'dm') || []
  )

  const campaignPlayers = computed(() => 
    currentCampaign.value?.players || []
  )
  
  // Actions
  const fetchCampaigns = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/campaigns')
      campaigns.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch campaigns'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchCampaign = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/campaigns/${id}`)
      currentCampaign.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch campaign'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const createCampaign = async (data: CreateCampaignDTO) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/campaigns', data)
      const newCampaign = response.data
      campaigns.value.unshift(newCampaign)
      return newCampaign
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create campaign'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateCampaign = async (id: number, data: UpdateCampaignDTO) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/campaigns/${id}`, data)
      const updated = response.data
      
      const index = campaigns.value.findIndex(c => c.id === id)
      if (index !== -1) {
        campaigns.value[index] = { ...campaigns.value[index], ...updated }
      }
      
      if (currentCampaign.value?.id === id) {
        currentCampaign.value = { ...currentCampaign.value, ...updated }
      }
      
      return updated
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update campaign'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteCampaign = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/campaigns/${id}`)
      campaigns.value = campaigns.value.filter(c => c.id !== id)
      if (currentCampaign.value?.id === id) {
        currentCampaign.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete campaign'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Новые методы для работы с игроками
  const fetchCampaignPlayers = async (campaignId: number) => {
    loading.value = true
    error.value = null
    try {
      // Если у нас уже загружена кампания, просто возвращаем её игроков
      if (currentCampaign.value?.id === campaignId) {
        return currentCampaign.value.players
      }
      // Иначе загружаем кампанию
      const campaign = await fetchCampaign(campaignId)
      return campaign.players
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch campaign players'
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateInviteCode = async (campaignId: number): Promise<{ code: string; expires_at: string }> => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/campaigns/${campaignId}/invite-code`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to generate invite code'
      // Мок-ответ для разработки
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return {
        code,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    } finally {
      loading.value = false
    }
  }

  // frontend/src/stores/campaigns.ts (ИСПРАВЛЕННЫЙ МЕТОД joinCampaign)

const joinCampaign = async (
  campaignId: number, 
  characterId?: number, 
  entryRole: 'dm' | 'player' | 'spectator' = 'player',
  dmPin?: string
) => {
  loading.value = true
  error.value = null
  try {
    const response = await api.post(`/campaigns/${campaignId}/join`, {
      character_id: characterId || undefined,
      entry_role: entryRole,
      dm_pin: dmPin || undefined
    })
    
    // Обновляем список кампаний
    await fetchCampaigns()
    
    return response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to join campaign'
    throw err
  } finally {
    loading.value = false
  }
}

  const leaveCampaign = async (campaignId: number) => {
    loading.value = true
    error.value = null
    try {
      await api.post(`/campaigns/${campaignId}/leave`)
      campaigns.value = campaigns.value.filter(c => c.id !== campaignId)
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to leave campaign'
      throw err
    } finally {
      loading.value = false
    }
  }

  const invitePlayer = async (campaignId: number, username: string, role: 'player' | 'spectator' = 'player') => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/campaigns/${campaignId}/invite`, { username, role })
      
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value.players.push(response.data.player)
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to invite player'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const removePlayer = async (campaignId: number, playerId: number) => {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/campaigns/${campaignId}/players/${playerId}`)
      
      if (currentCampaign.value?.id === campaignId) {
        currentCampaign.value.players = currentCampaign.value.players.filter(
          p => p.user_id !== playerId
        )
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to remove player'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const selectCharacter = async (campaignId: number, playerId: number, characterId: number) => {
    loading.value = true
    error.value = null
    try {
      await api.post(`/campaigns/${campaignId}/players/${playerId}/character`, { characterId })
      
      if (currentCampaign.value?.id === campaignId) {
        const player = currentCampaign.value.players.find(p => p.user_id === playerId)
        if (player) {
          player.character_id = characterId
          const characterResponse = await api.get(`/characters/${characterId}`)
          player.character_name = characterResponse.data.name
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to select character'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const addMessage = (message: CampaignMessage) => {
  // Проверяем, нет ли уже такого сообщения
  const exists = messages.value.some(m => 
    m.id === message.id || 
    (m.message === message.message && 
     m.user_id === message.user_id && 
     Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 1000)
  )
  
  if (!exists) {
    messages.value.push(message)
    
    if (messages.value.length > 500) {
      messages.value = messages.value.slice(-500)
    }
  }
}
  
  const clearMessages = () => {
    messages.value = []
  }
  
  const clearError = () => {
    error.value = null
  }
  
  const reset = () => {
    campaigns.value = []
    currentCampaign.value = null
    messages.value = []
    loading.value = false
    error.value = null
  }
  
  function getCurrentUserId(): number {
    const token = localStorage.getItem('token')
    if (!token) return 0
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || payload.id || 0
    } catch {
      return 0
    }
  }
  
  return {
    // State
    campaigns,
    currentCampaign,
    messages,
    loading,
    error,
    
    // Getters
    myCampaigns,
    joinedCampaigns,
    isDM,
    players,
    campaignPlayers,
    
    // Actions
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    fetchCampaignPlayers,
    generateInviteCode,
    joinCampaign,
    leaveCampaign,
    invitePlayer,
    removePlayer,
    selectCharacter,
    addMessage,
    clearMessages,
    clearError,
    reset
  }
})