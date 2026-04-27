<template>
  <div class="campaign-detail-page">
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Загрузка кампании...</p>
    </div>

    <!-- Контент -->
    <template v-else-if="campaign">
      <!-- Заголовок -->
      <div class="page-header">
        <div class="header-left">
          <Button 
            icon="pi pi-arrow-left" 
            severity="secondary" 
            text
            @click="goBack"
          />
          <div class="campaign-info">
            <h1>
              <i class="pi pi-map"></i>
              {{ campaign.name }}
            </h1>
            <div class="campaign-meta">
              <span class="meta-badge" :class="{ active: campaign.is_active }">
                <i class="pi pi-circle-fill"></i>
                {{ campaign.is_active ? 'Активна' : 'Завершена' }}
              </span>
              <span class="meta-badge">
                <i class="pi pi-user"></i>
                DM: {{ campaign.dm_name }}
              </span>
              <span class="meta-badge">
                <i class="pi pi-users"></i>
                Игроков: {{ campaign.players?.length || 0 }}
              </span>
              <span class="meta-badge" :class="roleClass">
                <i :class="roleIcon"></i>
                {{ roleLabel }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <Button 
            v-if="isDM"
            icon="pi pi-pencil" 
            label="Редактировать"
            severity="secondary"
            @click="openEditModal"
          />
          <Button 
            v-if="!isDM && !isSpectator"
            icon="pi pi-sign-out" 
            label="Покинуть"
            severity="danger"
            text
            @click="handleLeave"
          />
        </div>
      </div>

      <!-- Описание кампании -->
      <div v-if="campaign.description" class="campaign-description">
        <i class="pi pi-align-left"></i>
        <p>{{ campaign.description }}</p>
      </div>

      <!-- Вкладки -->
      <TabView class="campaign-tabs">
        <!-- Вкладка: Чат (доступен всем кроме зрителей) -->
        <TabPanel v-if="canInteract">
          <template #header>
            <i class="pi pi-comments"></i>
            <span>Чат</span>
          </template>
          <div class="tab-content chat-tab">
            <CampaignChat :campaign-id="campaign.id" />
          </div>
        </TabPanel>

        <!-- Вкладка: Участники -->
        <TabPanel>
          <template #header>
            <i class="pi pi-users"></i>
            <span>Участники</span>
          </template>
          <div class="tab-content">
            <CampaignPlayersList 
              :campaign-id="campaign.id"
              :is-dm="isDM"
            />
          </div>
        </TabPanel>

        <!-- Вкладка: Карта -->
        <TabPanel>
          <template #header>
            <i class="pi pi-image"></i>
            <span>Карта</span>
          </template>
          <div class="tab-content map-tab">
            <!-- DM видит селектор карт -->
            <div class="map-selector" v-if="campaignMaps.length > 0 && isDM">
              <div class="map-selector-header">
                <i class="pi pi-map"></i>
                <Dropdown
                  v-model="selectedMapId"
                  :options="campaignMaps"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Выберите карту"
                  class="map-dropdown"
                  @change="onMapSelected"
                />
                <span class="map-info" v-if="selectedMap">
                  {{ selectedMap.width }}×{{ selectedMap.height }}
                </span>
              </div>
            </div>
            
            <!-- Игроки видят только название карты -->
            <div class="map-selector" v-else-if="campaignMaps.length > 0 && !isDM">
              <div class="map-selector-header">
                <i class="pi pi-map"></i>
                <span class="map-name">{{ selectedMap?.name || 'Карта' }}</span>
                <span class="map-info" v-if="selectedMap">
                  {{ selectedMap.width }}×{{ selectedMap.height }}
                </span>
              </div>
            </div>
            
            <!-- Сама карта -->
            <div class="map-content">
              <CampaignMap 
                v-if="selectedMapId"
                :key="selectedMapId"
                :campaign-id="campaign.id"
                :is-d-m="isDM"
                :initial-map-data="(campaign as any).map_data"
                :current-user-id="authStore.user?.id || 0"
                @map-updated="handleMapUpdated"
              />
              
              <div v-else class="no-maps">
                <i class="pi pi-map"></i>
                <h3>Нет доступных карт</h3>
                <p v-if="isDM">Выберите карту из списка выше</p>
                <p v-else>DM ещё не добавил карты в эту кампанию</p>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Вкладка: Бой -->
        <TabPanel>
          <template #header>
            <i class="pi pi-shield"></i>
            <span>Бой</span>
          </template>
          <div class="tab-content">
            <BattleTracker 
              :campaign-id="campaign.id"
              :is-d-m="isDM"
            />
          </div>
        </TabPanel>

        <!-- Вкладка: Заметки DM (ТОЛЬКО ДЛЯ DM) -->
        <TabPanel v-if="isDM">
          <template #header>
            <i class="pi pi-pencil"></i>
            <span>Заметки DM</span>
          </template>
          <div class="tab-content">
            <div class="dm-notes">
              <Textarea 
                v-model="dmNotes" 
                placeholder="Заметки мастера (видны только вам)..."
                rows="10"
                class="w-full"
                @input="saveDmNotes"
              />
            </div>
          </div>
        </TabPanel>
      </TabView>
    </template>

    <!-- Ошибка -->
    <div v-else class="error-container">
      <i class="pi pi-exclamation-triangle"></i>
      <h3>Кампания не найдена</h3>
      <p>{{ error || 'Не удалось загрузить кампанию' }}</p>
      <Button label="Вернуться к списку" @click="goBack" />
    </div>

    <!-- Модальное окно редактирования -->
    <Dialog 
      v-model:visible="showEditModal" 
      header="Редактирование кампании"
      modal
      :style="{ width: '500px' }"
    >
      <form @submit.prevent="handleUpdate" class="campaign-form">
        <div class="form-field">
          <label for="name" class="required">
            <i class="pi pi-tag"></i> Название
          </label>
          <InputText
            id="name"
            v-model="editForm.name"
            placeholder="Название кампании"
            :class="{ 'p-invalid': editFormSubmitted && !editForm.name }"
            :disabled="editLoading"
            class="w-full"
          />
          <small v-if="editFormSubmitted && !editForm.name" class="p-error">
            <i class="pi pi-exclamation-circle"></i> Название обязательно
          </small>
        </div>

        <div class="form-field">
          <label for="description">
            <i class="pi pi-align-left"></i> Описание
          </label>
          <Textarea
            id="description"
            v-model="editForm.description"
            placeholder="Опишите вашу кампанию..."
            :disabled="editLoading"
            rows="4"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label>
            <Checkbox 
              id="is_active"
              v-model="editForm.is_active"
              :binary="true"
              :disabled="editLoading"
            />
            <span style="margin-left: 8px;">Кампания активна</span>
          </label>
        </div>

        <div v-if="editError" class="form-error">
          <i class="pi pi-exclamation-triangle"></i>
          {{ editError }}
        </div>

        <div class="form-actions">
          <Button 
            type="button" 
            label="Отмена" 
            severity="secondary" 
            @click="showEditModal = false" 
            :disabled="editLoading"
          />
          <Button 
            type="submit" 
            label="Сохранить"
            :loading="editLoading"
            severity="success"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог подтверждения -->
    <Dialog 
      v-model:visible="showConfirmDialog" 
      header="Подтверждение"
      modal
      :style="{ width: '400px' }"
    >
      <p>{{ confirmMessage }}</p>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showConfirmDialog = false" />
        <Button label="Подтвердить" :severity="confirmSeverity" @click="confirmAction" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'
import CampaignChat from '@/components/campaign/CampaignChat.vue'
import CampaignPlayersList from '@/components/campaign/CampaignPlayerList.vue'
import CampaignMap from '@/components/campaign/CampaignMap.vue'
import BattleTracker from '@/components/campaign/BattleTracker.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const campaignsStore = useCampaignsStore()
const authStore = useAuthStore()

const campaignId = computed(() => Number(route.params.id))

// State
const loading = ref(true)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const editLoading = ref(false)
const editError = ref('')
const editFormSubmitted = ref(false)
const dmNotes = ref('')
const selectedMapId = ref<number | null>(null)

// Кастомный диалог подтверждения
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmSeverity = ref<'danger' | 'primary'>('danger')
let confirmResolve: ((value: boolean) => void) | null = null

const editForm = ref({
  name: '',
  description: '',
  is_active: true
})

// ========================================
// РОЛИ И ПРАВА ДОСТУПА
// ========================================

const campaign = computed(() => campaignsStore.currentCampaign)

// Определяем реальную роль пользователя
const userRole = computed(() => {
  if (!campaign.value || !authStore.user) return null
  
  // Сначала проверяем в players
  const player = campaign.value.players?.find(p => p.user_id === authStore.user?.id)
  if (player) {
    return player.role // 'dm', 'player', 'spectator'
  }
  
  // Если создатель кампании
  if (campaign.value.dm_id === authStore.user?.id) {
    return 'dm'
  }
  
  return null
})

const isDM = computed(() => userRole.value === 'dm')
const isPlayer = computed(() => userRole.value === 'player')
const isSpectator = computed(() => userRole.value === 'spectator')
const canInteract = computed(() => isDM.value || isPlayer.value)

// Отображение роли
const roleLabel = computed(() => {
  if (isDM.value) return 'DM'
  if (isPlayer.value) return 'Игрок'
  if (isSpectator.value) return 'Зритель'
  return 'Гость'
})

const roleIcon = computed(() => {
  if (isDM.value) return 'pi pi-crown'
  if (isPlayer.value) return 'pi pi-user'
  if (isSpectator.value) return 'pi pi-eye'
  return 'pi pi-question'
})

const roleClass = computed(() => {
  if (isDM.value) return 'role-dm'
  if (isPlayer.value) return 'role-player'
  if (isSpectator.value) return 'role-spectator'
  return ''
})

// Карты
const campaignMaps = computed(() => {
  return campaign.value?.maps || []
})

const selectedMap = computed(() => {
  if (!selectedMapId.value || !campaignMaps.value.length) return null
  return campaignMaps.value.find((m: any) => m.id === selectedMapId.value)
})

// ========================================
// МЕТОДЫ
// ========================================

const confirm = (message: string, severity: 'danger' | 'primary' = 'danger'): Promise<boolean> => {
  confirmMessage.value = message
  confirmSeverity.value = severity
  showConfirmDialog.value = true
  return new Promise((resolve) => { confirmResolve = resolve })
}

const confirmAction = () => {
  showConfirmDialog.value = false
  if (confirmResolve) { confirmResolve(true); confirmResolve = null }
}

const selectFirstMap = () => {
  if (campaignMaps.value.length > 0) {
    selectedMapId.value = campaignMaps.value[0].id
    console.log('🗺️ Selected first map:', selectedMapId.value, campaignMaps.value[0].name)
  }
}

const onMapSelected = () => {
  console.log('🗺️ Map selected:', selectedMapId.value, selectedMap.value?.name)
}

const loadCampaign = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('📡 Loading campaign:', campaignId.value)
    await campaignsStore.fetchCampaign(campaignId.value)
    console.log('✅ Campaign loaded:', campaign.value?.name)
    console.log('👤 User role:', userRole.value)
    
    if (campaign.value) {
      editForm.value = {
        name: campaign.value.name,
        description: campaign.value.description || '',
        is_active: campaign.value.is_active
      }

      const savedNotes = localStorage.getItem(`dm_notes_${campaignId.value}`)
      if (savedNotes) dmNotes.value = savedNotes

      selectFirstMap()
    }
  } catch (err: any) {
    console.error('❌ Failed to load campaign:', err)
    error.value = err.response?.data?.error || err.message || 'Не удалось загрузить кампанию'
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/campaigns')

const openEditModal = () => {
  editError.value = ''
  editFormSubmitted.value = false
  showEditModal.value = true
}

const handleUpdate = async () => {
  editFormSubmitted.value = true
  if (!editForm.value.name.trim()) { editError.value = 'Название обязательно'; return }

  editLoading.value = true
  editError.value = ''
  try {
    await campaignsStore.updateCampaign(campaignId.value, editForm.value)
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Кампания обновлена', life: 3000 })
    showEditModal.value = false
    await loadCampaign()
  } catch (err: any) {
    editError.value = err.response?.data?.error || 'Произошла ошибка'
  } finally {
    editLoading.value = false
  }
}

const handleLeave = async () => {
  const confirmed = await confirm('Вы уверены, что хотите покинуть кампанию?', 'danger')
  if (!confirmed) return
  try {
    await campaignsStore.leaveCampaign(campaignId.value)
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Вы покинули кампанию', life: 3000 })
    router.push('/campaigns')
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message || 'Не удалось покинуть кампанию', life: 3000 })
  }
}

const startBattle = () => {
  toast.add({ severity: 'info', summary: 'В разработке', detail: 'Функция начала боя будет доступна позже', life: 3000 })
}

const handleMapUpdated = (mapData: Record<string, any>) => {
  if (campaign.value) (campaign.value as any).map_data = mapData
}

const saveDmNotes = () => {
  localStorage.setItem(`dm_notes_${campaignId.value}`, dmNotes.value)
}

onMounted(() => loadCampaign())
watch(campaignId, () => loadCampaign())
</script>

<style scoped>
.campaign-detail-page {
  padding: 1.5rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f8fafc;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  text-align: center;
}

.error-container i { font-size: 4rem; color: #f59e0b; }
.error-container h3 { margin: 0; color: #1f2937; }
.error-container p { color: #6b7280; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left { display: flex; align-items: flex-start; gap: 12px; }

.campaign-info h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.75rem;
}
.campaign-info h1 i { color: #3b82f6; }

.campaign-meta { display: flex; gap: 12px; flex-wrap: wrap; }

.meta-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #6b7280;
}
.meta-badge i { font-size: 0.7rem; }
.meta-badge.active { background: #d1fae5; color: #065f46; }
.meta-badge.active i { color: #10b981; }

/* Цвета для ролей */
.role-dm { background: #fef3c7; color: #92400e; }
.role-player { background: #dbeafe; color: #1e40af; }
.role-spectator { background: #f3f4f6; color: #6b7280; }

.header-actions { display: flex; gap: 8px; }

.campaign-description {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.campaign-description i { color: #3b82f6; font-size: 1.2rem; margin-top: 2px; }
.campaign-description p { margin: 0; color: #4b5563; line-height: 1.6; }

/* Вкладки */
.campaign-tabs {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.campaign-tabs :deep(.p-tabview-nav) { background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 0 8px; }
.campaign-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) { padding: 1rem 1.25rem; color: #6b7280; border: none; background: transparent; }
.campaign-tabs :deep(.p-tabview-nav li .p-tabview-nav-link i) { margin-right: 8px; }
.campaign-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) { color: #3b82f6; border-bottom: 2px solid #3b82f6; }
.campaign-tabs :deep(.p-tabview-panels) { padding: 0; background: white; }

.tab-content { min-height: 500px; }
.map-tab { height: 600px; display: flex; flex-direction: column; }
.chat-tab { height: 600px; display: flex; flex-direction: column; }

/* Селектор карты */
.map-selector { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; flex-shrink: 0; }
.map-selector-header { display: flex; align-items: center; gap: 12px; }
.map-selector-header i { color: #3b82f6; font-size: 1.2rem; }
.map-dropdown { min-width: 250px; }
.map-name { font-weight: 600; color: #1f2937; }
.map-info { font-size: 0.85rem; color: #6b7280; margin-left: auto; }

.map-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.no-maps {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
  text-align: center;
}
.no-maps i { font-size: 4rem; color: #9ca3af; margin-bottom: 16px; }
.no-maps h3 { color: #374151; margin: 0 0 8px 0; }
.no-maps p { color: #6b7280; margin: 0 0 20px 0; }

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 40px;
}
.placeholder-content i { font-size: 4rem; color: #9ca3af; margin-bottom: 20px; }
.placeholder-content h3 { margin: 0 0 8px 0; color: #374151; }
.placeholder-content p { color: #6b7280; margin-bottom: 24px; }

.dm-notes { padding: 20px; }

/* Форма редактирования */
.campaign-form { padding: 8px 0; }
.form-field { margin-bottom: 20px; }
.form-field label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 0.9rem; }
.form-field label i { color: #6b7280; }
.form-field label.required::after { content: ' *'; color: #dc2626; }
.w-full { width: 100%; }
.p-error { color: #ef4444; font-size: 0.8rem; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
.form-error { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #dc2626; font-size: 0.9rem; margin-bottom: 20px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

@media (max-width: 768px) {
  .campaign-detail-page { padding: 1rem; }
  .page-header { flex-direction: column; }
  .header-left { width: 100%; }
  .campaign-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) { padding: 0.75rem 1rem; }
  .campaign-tabs :deep(.p-tabview-nav li .p-tabview-nav-link span) { display: none; }
  .campaign-tabs :deep(.p-tabview-nav li .p-tabview-nav-link i) { margin-right: 0; font-size: 1.2rem; }
  .chat-tab { height: 500px; }
  .map-tab { height: 500px; }
}
</style>