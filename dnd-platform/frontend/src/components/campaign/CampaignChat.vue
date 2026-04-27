<template>
  <div class="campaign-chat">
    <div class="chat-header">
      <h3>Чат кампании</h3>
      <div class="online-indicator">
        <span class="online-dot" :class="{ connected: isConnected }"></span>
        <span>{{ onlineCount }} онлайн</span>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-chat">
        <i class="pi pi-comments"></i>
        <p>Нет сообщений. Начните общение!</p>
      </div>
      
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message', `message-${message.type}`]"
      >
        <div v-if="message.type === 'system'" class="system-message">
          <i class="pi pi-info-circle"></i>
          <span>{{ message.message }}</span>
        </div>
        
        <div v-else-if="message.type === 'roll'" class="roll-message">
          <i class="pi pi-chart-bar"></i>
          <span class="username">{{ message.username }}</span>
          <span class="roll-result">{{ formatRollMessage(message) }}</span>
        </div>
        
        <div v-else class="chat-message">
          <img 
            v-if="message.avatar_url" 
            :src="message.avatar_url" 
            class="avatar"
            alt="avatar"
          >
          <div v-else class="avatar-placeholder">
            {{ message.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="username">{{ message.username }}</span>
              <span class="timestamp">{{ formatTime(message.created_at) }}</span>
            </div>
            <div class="message-text">{{ message.message }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <div class="dice-commands" v-if="showDiceHelp">
        <div class="help-header">
          <span>Команды бросков:</span>
          <button @click="showDiceHelp = false" class="close-help">×</button>
        </div>
        <div class="help-examples">
          <div @click="insertCommand('/roll 1d20')">/roll 1d20</div>
          <div @click="insertCommand('/roll 2d6+3')">/roll 2d6+3</div>
          <div @click="insertCommand('/roll 1d20+5 advantage')">/roll 1d20+5 advantage</div>
          <div @click="insertCommand('/roll 4d6 drop lowest')">/roll 4d6 drop lowest</div>
        </div>
      </div>
      
      <div class="input-wrapper">
        <button @click="showDiceHelp = !showDiceHelp" class="dice-btn" title="Бросить кубики">
          🎲
        </button>
        <input 
          v-model="messageInput"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Введите сообщение..."
          :disabled="!isConnected"
        />
        <button @click="sendMessage" :disabled="!isConnected || !messageInput.trim()" class="send-btn">
          <i class="pi pi-send"></i>
        </button>
      </div>
      
      <div v-if="!isConnected" class="connection-warning">
        <i class="pi pi-exclamation-triangle"></i>
        Нет подключения к чату. Переподключение...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, toRef } from 'vue'
import { useCampaignsStore } from '@/stores/campaigns'
import { useCampaignSocket } from '@/composables/useCampaignSocket'

const props = defineProps<{
  campaignId: number
}>()

const store = useCampaignsStore()

// Передаем campaignId как ref
const campaignIdRef = toRef(props, 'campaignId')
const { isConnected, onlinePlayers, sendMessage: sendSocketMessage, rollDice } = useCampaignSocket(campaignIdRef)

const messageInput = ref('')
const showDiceHelp = ref(false)
const messagesContainer = ref<HTMLElement>()

const messages = computed(() => store.messages)
const onlineCount = computed(() => onlinePlayers.value.size)

const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const formatRollMessage = (message: any) => {
  if (message.metadata?.result) {
    const { formula, result } = message.metadata
    return `${formula}: [${result.rolls?.join(', ')}] = ${result.total}`
  }
  return message.message
}

const sendMessage = () => {
  if (!messageInput.value.trim()) return
  
  const text = messageInput.value.trim()
  
  // Проверяем, является ли сообщение командой броска
  if (text.startsWith('/roll ')) {
    const formula = text.substring(6).trim()
    console.log('Rolling dice:', formula)
    rollDice(formula)
  } else {
    sendSocketMessage(text)
  }
  
  messageInput.value = ''
  showDiceHelp.value = false
}

const insertCommand = (command: string) => {
  messageInput.value = command
  showDiceHelp.value = false
}

// Автопрокрутка к новым сообщениям
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })
</script>

<style scoped>
.campaign-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.chat-header h3 {
  margin: 0;
  color: #e94560;
  font-size: 16px;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ccc;
  font-size: 12px;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  transition: background 0.3s ease;
}

.online-dot.connected {
  background: #4CAF50;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  gap: 12px;
}

.empty-chat i {
  font-size: 48px;
  opacity: 0.5;
}

.message {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.system-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(233, 69, 96, 0.1);
  border-left: 3px solid #e94560;
  border-radius: 4px;
  color: #ccc;
  font-style: italic;
}

.roll-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(33, 150, 243, 0.1);
  border-left: 3px solid #2196F3;
  border-radius: 4px;
}

.roll-message .username {
  color: #2196F3;
  font-weight: bold;
}

.roll-message .roll-result {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
}

.chat-message {
  display: flex;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.message-header .username {
  color: #e94560;
  font-weight: bold;
  font-size: 13px;
}

.message-header .timestamp {
  color: #666;
  font-size: 11px;
}

.message-text {
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.chat-input {
  padding: 12px 16px;
  background: #16213e;
  border-top: 1px solid #0f3460;
}

.dice-commands {
  margin-bottom: 12px;
  padding: 12px;
  background: #0f3460;
  border-radius: 6px;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 12px;
}

.close-help {
  background: none;
  border: none;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
}

.close-help:hover {
  color: #e94560;
}

.help-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.help-examples div {
  padding: 4px 8px;
  background: #1a1a2e;
  border: 1px solid #e94560;
  border-radius: 4px;
  color: #e94560;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-examples div:hover {
  background: #e94560;
  color: white;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.dice-btn {
  padding: 8px 12px;
  background: #0f3460;
  border: 1px solid #e94560;
  border-radius: 4px;
  color: #e94560;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dice-btn:hover {
  background: #e94560;
  color: white;
}

.input-wrapper input {
  flex: 1;
  padding: 8px 12px;
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 4px;
  color: white;
  font-size: 14px;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #e94560;
}

.input-wrapper input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 8px 12px;
  background: #e94560;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #ff6b6b;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connection-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 4px;
  color: #f59e0b;
  font-size: 12px;
}
</style>