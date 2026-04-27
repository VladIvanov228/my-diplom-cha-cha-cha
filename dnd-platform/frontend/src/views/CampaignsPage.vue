<template>
  <div class="campaigns-page">
    <!-- Заголовок -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <i class="pi pi-map"></i>
          Мои кампании
        </h1>
        <p>Управляйте своими приключениями или присоединяйтесь к новым</p>
      </div>
      <Button 
        label="Создать кампанию" 
        icon="pi pi-plus" 
        @click="showCreateModal = true"
        severity="success"
      />
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading && campaigns.length === 0" class="loading-container">
      <ProgressSpinner />
      <p>Загрузка кампаний...</p>
    </div>

    <!-- Контент -->
    <div v-else class="campaigns-content">
      <!-- Мои кампании (DM) -->
      <div v-if="myCampaigns.length > 0" class="section">
        <h2 class="section-title">
          <i class="pi pi-crown"></i> 
          Я Dungeon Master
          <span class="badge">{{ myCampaigns.length }}</span>
        </h2>
        <div class="campaigns-grid">
          <CampaignCard
            v-for="campaign in myCampaigns"
            :key="campaign.id"
            :campaign="campaign"
            :is-dm="true"
            @click="goToCampaign"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- Кампании где я игрок -->
      <div v-if="joinedCampaigns.length > 0" class="section">
        <h2 class="section-title">
          <i class="pi pi-users"></i>
          Я игрок
          <span class="badge">{{ joinedCampaigns.length }}</span>
        </h2>
        <div class="campaigns-grid">
          <CampaignCard
            v-for="campaign in joinedCampaigns"
            :key="campaign.id"
            :campaign="campaign"
            :is-dm="false"
            @click="goToCampaign"
          />
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-if="campaigns.length === 0" class="empty-state">
        <i class="pi pi-map" style="font-size: 4rem; color: #9ca3af;"></i>
        <h3>У вас пока нет кампаний</h3>
        <p>Создайте свою первую кампанию или попросите друга пригласить вас</p>
        <Button 
          label="Создать кампанию" 
          icon="pi pi-plus"
          @click="showCreateModal = true"
        />
      </div>
    </div>

    <!-- Модалка создания кампании -->
    <CreateCampaignModal 
      v-model="showCreateModal"
      @created="onCampaignCreated"
    />

    <!-- Модалка входа в кампанию -->
    <EnterCampaignModal
      v-model="showEnterModal"
      :campaign="selectedCampaign"
      @joined="onJoinedCampaign"
    />

    <!-- Модалка редактирования -->
    <Dialog 
      v-model:visible="showEditModal" 
      header="Редактирование кампании"
      modal
      :style="{ width: '500px' }"
    >
      <form @submit.prevent="handleEditSubmit" class="campaign-form">
        <div class="form-field">
          <label class="required">Название</label>
          <InputText v-model="editForm.name" class="w-full" />
        </div>
        <div class="form-field">
          <label>Описание</label>
          <Textarea v-model="editForm.description" rows="4" class="w-full" />
        </div>
        <div class="form-actions">
          <Button type="button" label="Отмена" severity="secondary" @click="showEditModal = false" />
          <Button type="submit" label="Сохранить" severity="success" :loading="editLoading" />
        </div>
      </form>
    </Dialog>

    <!-- Модалка подтверждения удаления -->
    <Dialog 
      v-model:visible="showDeleteModal" 
      header="Удаление кампании"
      modal
      :style="{ width: '450px' }"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #f59e0b;"></i>
        <p>Вы уверены, что хотите удалить кампанию <strong>"{{ campaignToDelete?.name }}"</strong>?</p>
        <p class="warning-text">Это действие нельзя отменить. Все данные кампании будут потеряны.</p>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showDeleteModal = false" />
        <Button label="Удалить" severity="danger" :loading="deleteLoading" @click="confirmDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import CampaignCard from '@/components/campaign/CampaignCard.vue'
import CreateCampaignModal from '@/components/campaign/CreateCampaignModal.vue'
import EnterCampaignModal from '@/components/campaign/EnterCampaignModal.vue'
import type { Campaign } from '@/types/campaign'

const router = useRouter()
const toast = useToast()
const campaignsStore = useCampaignsStore()
const authStore = useAuthStore()

// State
const loading = ref(true)
const showCreateModal = ref(false)
const showEnterModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)
const selectedCampaign = ref<Campaign | null>(null)
const campaignToDelete = ref<Campaign | null>(null)

const editForm = ref({ name: '', description: '' })

// Computed
const campaigns = computed(() => campaignsStore.campaigns)
const myCampaigns = computed(() => campaignsStore.myCampaigns)
const joinedCampaigns = computed(() => campaignsStore.joinedCampaigns)

// Methods
const goToCampaign = (campaign: Campaign) => {
  console.log('🖱️ Campaign clicked:', campaign.id, campaign.name)
  openEnterModal(campaign)
  // // Если это моя кампания (я DM) - сразу переходим
  // if (campaign.dm_id === authStore.user?.id || campaign.is_player) {
  //   console.log('✅ Direct access - navigating to campaign')
  //   router.push(`/campaigns/${campaign.id}`)
  // } else {
  //   // Для новых кампаний - открываем модалку входа
  //   console.log('🔐 Opening enter modal')
  //   openEnterModal(campaign)
  // }
}

async function loadCampaigns() {
  loading.value = true
  try {
    await campaignsStore.fetchCampaigns()
  } catch (error) {
    console.error('Failed to load campaigns:', error)
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось загрузить кампании',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

function openEnterModal(campaign: Campaign) {
  selectedCampaign.value = campaign
  showEnterModal.value = true
}

function onCampaignCreated() {
  loadCampaigns()
}

function onJoinedCampaign(campaignId: number) {
  showEnterModal.value = false
  router.push(`/campaigns/${campaignId}`)
}

function handleEdit(campaign: Campaign) {
  editForm.value = {
    name: campaign.name,
    description: campaign.description || ''
  }
  selectedCampaign.value = campaign
  showEditModal.value = true
}

async function handleEditSubmit() {
  if (!selectedCampaign.value) return
  editLoading.value = true
  try {
    await campaignsStore.updateCampaign(selectedCampaign.value.id, editForm.value)
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Кампания обновлена', life: 3000 })
    showEditModal.value = false
    loadCampaigns()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.response?.data?.error || 'Ошибка', life: 3000 })
  } finally {
    editLoading.value = false
  }
}

function handleDelete(campaign: Campaign) {
  campaignToDelete.value = campaign
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!campaignToDelete.value) return
  deleteLoading.value = true
  try {
    await campaignsStore.deleteCampaign(campaignToDelete.value.id)
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Кампания удалена', life: 3000 })
    showDeleteModal.value = false
    campaignToDelete.value = null
    loadCampaigns()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить', life: 3000 })
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadCampaigns()
  }
})
</script>

<style scoped>
.campaigns-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 20px;
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 2rem;
}

.header-content h1 i {
  color: #3b82f6;
}

.header-content p {
  margin: 0;
  color: #6b7280;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  color: #374151;
  font-size: 1.25rem;
}

.section-title i {
  color: #3b82f6;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-left: 8px;
}

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-state h3 {
  margin: 20px 0 10px;
  color: #374151;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 20px;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.required::after {
  content: ' *';
  color: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.delete-confirmation {
  text-align: center;
  padding: 20px;
}

.warning-text {
  color: #dc2626;
  padding: 12px;
  background: #fef2f2;
  border-radius: 6px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .campaigns-page {
    padding: 1rem;
  }
  
  .campaigns-grid {
    grid-template-columns: 1fr;
  }
}
</style>