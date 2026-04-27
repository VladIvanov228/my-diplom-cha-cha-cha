import { ref, onMounted, onUnmounted, watch, Ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useCampaignsStore } from '@/stores/campaigns'
import type { CampaignMessage } from '@/types/campaign'

export interface DiceRollData {
  userId: number
  username: string
  formula: string
  result: {
    total: number
    rolls: number[]
    modifier?: number
  }
  reason?: string
  message: CampaignMessage
}

export function useCampaignSocket(campaignId: Ref<number> | number) {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const onlinePlayers = ref<Set<number>>(new Set())
  
  const store = useCampaignsStore()
  
  const connect = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No token found, cannot connect to socket')
      return
    }
    
    const id = typeof campaignId === 'number' ? campaignId : campaignId.value
    
    socket.value = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    socket.value.on('connect', () => {
      console.log('✅ Connected to campaign socket')
      isConnected.value = true
      
      // Присоединяемся к комнате кампании
      if (id) {
        socket.value?.emit('join-campaign', id)
      }
    })
    
    socket.value.on('disconnect', () => {
      console.log('❌ Disconnected from campaign socket')
      isConnected.value = false
      onlinePlayers.value.clear()
    })
    
    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      isConnected.value = false
    })
    
    // Обработчики событий
    socket.value.on('player-joined', (data: { userId: number }) => {
      console.log('👤 Player joined:', data)
      onlinePlayers.value.add(data.userId)
    })
    
    socket.value.on('player-left', (data: { userId: number }) => {
      console.log('👋 Player left:', data)
      onlinePlayers.value.delete(data.userId)
    })
    
    socket.value.on('new-message', (message: CampaignMessage) => {
      console.log('💬 New message:', message)
      store.addMessage(message)
    })
    
    socket.value.on('recent-messages', (messages: CampaignMessage[]) => {
      console.log('📜 Recent messages:', messages.length)
      store.messages = messages
    })
    
    socket.value.on('dice-rolled', (data: DiceRollData) => {
      console.log('🎲 Dice rolled:', data)
    })
    
    socket.value.on('map-updated', (data: { mapData: Record<string, string> }) => {
      console.log('🗺️ Map updated:', data)
      if (store.currentCampaign) {
        store.currentCampaign.map_data = data.mapData
      }
    })
    
    socket.value.on('map-data', (data: { mapData: Record<string, string> }) => {
      console.log('🗺️ Received map data:', data)
      if (store.currentCampaign) {
        store.currentCampaign.map_data = data.mapData
      }
    })
    
    socket.value.on('error', (error: { message: string }) => {
      console.error('Socket error:', error)
    })
  }
  
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }
  
  const sendMessage = (message: string, type: 'chat' | 'system' = 'chat') => {
    if (!socket.value || !isConnected.value) {
      console.warn('Socket not connected, cannot send message')
      return
    }
    
    const id = typeof campaignId === 'number' ? campaignId : campaignId.value
    
    socket.value.emit('send-message', {
      campaignId: id,
      message,
      type
    })
  }
  
  const rollDice = (formula: string, reason?: string) => {
    if (!socket.value || !isConnected.value) {
      console.warn('Socket not connected, cannot roll dice')
      return
    }
    
    const id = typeof campaignId === 'number' ? campaignId : campaignId.value
    
    console.log('Emitting roll-dice:', { campaignId: id, formula, reason })
    
    socket.value.emit('roll-dice', {
      campaignId: id,
      formula,
      reason
    })
  }
  
  const updateMap = (mapData: Record<string, string>) => {
    if (!socket.value || !isConnected.value) {
      console.warn('Socket not connected, cannot update map')
      return
    }
    
    const id = typeof campaignId === 'number' ? campaignId : campaignId.value
    
    socket.value.emit('update-map', {
      campaignId: id,
      mapData
    })
  }
  
  // Автоматическое подключение при монтировании
  onMounted(() => {
    connect()
  })
  
  // Отключение при размонтировании
  onUnmounted(() => {
    disconnect()
  })
  
  // Переподключение при смене кампании
  if (typeof campaignId !== 'number') {
    watch(campaignId, (newId, oldId) => {
      if (oldId) {
        disconnect()
      }
      if (newId) {
        connect()
      }
    })
  }
  
  return {
    socket,
    isConnected,
    onlinePlayers,
    connect,
    disconnect,
    sendMessage,
    rollDice,
    updateMap
  }
}