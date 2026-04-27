<template>
  <div class="players-list">
    <!-- Заголовок и приглашение -->
    <div class="players-header">
      <h3>
        <i class="pi pi-users"></i>
        Участники ({{ playersList.length }})
      </h3>
      <div v-if="isDm" class="invite-section">
        <Button 
          label="Пригласить игрока" 
          icon="pi pi-user-plus"
          severity="primary"
          @click="openInviteModal"
        />
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner style="width: 40px; height: 40px;" />
      <p>Загрузка участников...</p>
    </div>

    <!-- Список игроков -->
    <div v-else-if="playersList.length > 0" class="players-grid">
      <div 
        v-for="player in playersList" 
        :key="player.id"
        class="player-card"
        :class="{ 'dm': player.role === 'dm' }"
      >
        <div class="player-avatar">
          <img v-if="player.avatar_url" :src="player.avatar_url" :alt="player.username">
          <span v-else>{{ player.username?.charAt(0).toUpperCase() || 'U' }}</span>
        </div>
        <div class="player-info">
          <div class="player-name">
            {{ player.username }}
            <span v-if="player.role === 'dm'" class="dm-badge">
              <i class="pi pi-crown"></i> DM
            </span>
            <span v-else-if="player.role === 'spectator'" class="spectator-badge">
              <i class="pi pi-eye"></i> Зритель
            </span>
          </div>
          <div v-if="player.character_name" class="player-character">
            <i class="pi pi-user"></i>
            {{ player.character_name }}
          </div>
          <div v-else-if="player.role === 'player'" class="no-character">
            <i class="pi pi-exclamation-circle"></i>
            Персонаж не выбран
          </div>
        </div>
        <div class="player-actions">
          <Button 
            v-if="isDm && player.role !== 'dm'"
            icon="pi pi-user-minus"
            severity="danger"
            text
            rounded
            @click="handleRemovePlayer(player)"
            title="Удалить игрока"
          />
        </div>
      </div>
    </div>

    <!-- Пустой список -->
    <div v-else class="empty-players">
      <i class="pi pi-users"></i>
      <p>Нет участников</p>
    </div>

    <!-- Мои персонажи для выбора -->
    <div v-if="!isDm && !hasCharacter && availableCharacters.length > 0" class="character-selection">
      <h4>
        <i class="pi pi-user"></i>
        Выберите персонажа
      </h4>
      <div class="characters-list">
        <div 
          v-for="char in availableCharacters" 
          :key="char.id"
          class="character-option"
          :class="{ selected: selectedCharacterId === char.id }"
          @click="selectedCharacterId = char.id"
        >
          <div class="character-radio">
            <i :class="selectedCharacterId === char.id ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
          </div>
          <div class="character-details">
            <strong>{{ char.name }}</strong>
            <span>Ур. {{ char.level }} {{ char.class }} • {{ char.race }}</span>
          </div>
        </div>
      </div>
      <div class="selection-actions">
        <Button 
          label="Присоединиться с персонажем" 
          icon="pi pi-check"
          :disabled="!selectedCharacterId || joining"
          :loading="joining"
          @click="joinWithCharacter"
        />
      </div>
    </div>

    <!-- Модальное окно приглашения -->
    <Dialog 
      v-model:visible="showInviteModal" 
      header="Пригласить игрока"
      modal
      :style="{ width: '450px' }"
    >
      <div class="invite-form">
        <div class="form-field">
          <label for="invite-code">
            <i class="pi pi-link"></i> Код приглашения
          </label>
          <div class="invite-code-display">
            <InputText
              id="invite-code"
              v-model="inviteCode"
              readonly
              class="w-full"
            />
            <Button 
              icon="pi pi-copy" 
              severity="secondary"
              @click="copyInviteCode"
              title="Копировать"
            />
          </div>
          <small class="field-hint">
            <i class="pi pi-info-circle"></i>
            Отправьте этот код игроку для присоединения
          </small>
        </div>
        <div class="form-divider">
          <span>ИЛИ</span>
        </div>
        <div class="form-field">
          <label for="username">
            <i class="pi pi-search"></i> Пригласить по имени
          </label>
          <div class="invite-by-username">
            <InputText
              id="username"
              v-model="inviteUsername"
              placeholder="Введите имя пользователя"
              class="w-full"
            />
            <Dropdown
              v-model="inviteRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              class="role-dropdown"
            />
          </div>
          <Button 
            label="Отправить приглашение" 
            icon="pi pi-send"
            :loading="inviting"
            :disabled="!inviteUsername"
            @click="inviteByUsername"
            class="mt-3 w-full"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCampaignsStore } from '@/stores/campaigns'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  campaignId: number
  isDm: boolean
}>()

const toast = useToast()
const campaignsStore = useCampaignsStore()
const charactersStore = useCharactersStore()
const authStore = useAuthStore()

// State
const loading = ref(false)
const showInviteModal = ref(false)
const inviteCode = ref('')
const inviteUsername = ref('')
const inviteRole = ref<'player' | 'spectator'>('player')
const inviting = ref(false)
const joining = ref(false)
const selectedCharacterId = ref<number | null>(null)

const roleOptions = [
  { label: 'Игрок', value: 'player' },
  { label: 'Зритель', value: 'spectator' }
]

// Computed
const playersList = computed(() => campaignsStore.campaignPlayers)

const currentUserId = computed(() => authStore.user?.id)

const currentPlayer = computed(() => {
  if (!currentUserId.value) return null
  return playersList.value.find(p => p.user_id === currentUserId.value)
})

const hasCharacter = computed(() => {
  return currentPlayer.value?.character_id !== null
})

const availableCharacters = computed(() => charactersStore.characters)

// Methods
const loadData = async () => {
  loading.value = true
  try {
    await campaignsStore.fetchCampaign(props.campaignId)
    if (!props.isDm) {
      await charactersStore.fetchCharacters()
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

const openInviteModal = async () => {
  try {
    const response = await campaignsStore.generateInviteCode(props.campaignId)
    inviteCode.value = response.code
    showInviteModal.value = true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось создать код приглашения',
      life: 3000
    })
  }
}

const copyInviteCode = () => {
  navigator.clipboard?.writeText(inviteCode.value).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: 'Код приглашения скопирован в буфер обмена',
      life: 2000
    })
  }).catch(() => {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось скопировать код',
      life: 2000
    })
  })
}

const inviteByUsername = async () => {
  if (!inviteUsername.value.trim()) return

  inviting.value = true
  try {
    await campaignsStore.invitePlayer(props.campaignId, inviteUsername.value, inviteRole.value)
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: `Приглашение отправлено пользователю ${inviteUsername.value}`,
      life: 3000
    })
    showInviteModal.value = false
    inviteUsername.value = ''
    await loadData()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось отправить приглашение',
      life: 3000
    })
  } finally {
    inviting.value = false
  }
}

const handleRemovePlayer = async (player: any) => {
  try {
    await campaignsStore.removePlayer(props.campaignId, player.user_id)
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: `Игрок ${player.username} удалён из кампании`,
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось удалить игрока',
      life: 3000
    })
  }
}

const joinWithCharacter = async () => {
  if (!selectedCharacterId.value || !currentPlayer.value) return

  joining.value = true
  try {
    await campaignsStore.selectCharacter(
      props.campaignId, 
      currentPlayer.value.user_id, 
      selectedCharacterId.value
    )
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Персонаж выбран',
      life: 3000
    })
    await loadData()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось выбрать персонажа',
      life: 3000
    })
  } finally {
    joining.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.players-list {
  padding: 20px;
}

.players-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.players-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.players-header h3 i {
  color: #3b82f6;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  color: #6b7280;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
}

.player-card.dm {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
}

.player-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.player-card.dm .player-avatar {
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.dm-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(217, 119, 6, 0.2);
  border-radius: 4px;
  font-size: 0.7rem;
  color: #92400e;
}

.spectator-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #6b7280;
}

.player-character {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #6b7280;
}

.player-character i {
  color: #3b82f6;
  font-size: 0.75rem;
}

.no-character {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #f59e0b;
}

.empty-players {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.empty-players i {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-players p {
  margin: 0;
}

.character-selection {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.character-selection h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: #374151;
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.character-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-option:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.character-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.character-radio i {
  font-size: 1.25rem;
  color: #3b82f6;
}

.character-details {
  display: flex;
  flex-direction: column;
}

.character-details strong {
  color: #1f2937;
  margin-bottom: 2px;
}

.character-details span {
  font-size: 0.8rem;
  color: #6b7280;
}

.selection-actions {
  display: flex;
  justify-content: flex-end;
}

.invite-form {
  padding: 8px 0;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.invite-code-display {
  display: flex;
  gap: 8px;
}

.invite-by-username {
  display: flex;
  gap: 8px;
}

.role-dropdown {
  width: 120px;
}

.field-hint {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  margin: 24px 0;
}

.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.form-divider span {
  padding: 0 16px;
}

.w-full {
  width: 100%;
}

.mt-3 {
  margin-top: 12px;
}
</style>