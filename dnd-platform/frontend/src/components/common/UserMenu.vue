<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>
        <i class="pi pi-user"></i>
        Профиль пользователя
      </h1>
    </div>

    <div class="profile-container">
      <!-- Основная информация -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar">
              <span>{{ userInitials }}</span>
            </div>
            <div class="avatar-info">
              <h2>{{ authStore.user?.username }}</h2>
              <span class="role-badge" :class="authStore.user?.role">
                {{ getUserRoleName(authStore.user?.role) }}
              </span>
            </div>
          </div>
        </div>

        <div class="profile-body">
          <div class="info-section">
            <h3><i class="pi pi-user"></i> Основная информация</h3>
            
            <div class="info-row">
              <span class="info-label">
                <i class="pi pi-user"></i> Имя пользователя
              </span>
              <span class="info-value">{{ authStore.user?.username || '—' }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="pi pi-envelope"></i> Email
              </span>
              <span class="info-value">{{ authStore.user?.email || '—' }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="pi pi-shield"></i> Роль
              </span>
              <span class="info-value">
                <span class="role-badge" :class="authStore.user?.role">
                  {{ getUserRoleName(authStore.user?.role) }}
                </span>
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="pi pi-calendar"></i> Дата регистрации
              </span>
              <span class="info-value">{{ formatDate(authStore.user?.created_at) }}</span>
            </div>
          </div>

          <Divider />

          <!-- Смена пароля -->
          <div class="password-section">
            <h3><i class="pi pi-lock"></i> Сменить пароль</h3>
            
            <form @submit.prevent="handleChangePassword">
              <div class="form-field">
                <label for="currentPassword">
                  <i class="pi pi-key"></i> Текущий пароль
                </label>
                <Password
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  placeholder="Введите текущий пароль"
                  :feedback="false"
                  toggleMask
                  required
                  class="w-full"
                  :class="{ 'p-invalid': submitted && !passwordForm.currentPassword }"
                />
              </div>

              <div class="form-field">
                <label for="newPassword">
                  <i class="pi pi-lock"></i> Новый пароль
                </label>
                <Password
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  placeholder="Введите новый пароль"
                  toggleMask
                  required
                  class="w-full"
                  :class="{ 'p-invalid': submitted && (!passwordForm.newPassword || passwordForm.newPassword.length < 6) }"
                />
                <small v-if="submitted && passwordForm.newPassword && passwordForm.newPassword.length < 6" class="p-error">
                  Пароль должен быть не менее 6 символов
                </small>
              </div>

              <div class="form-field">
                <label for="confirmPassword">
                  <i class="pi pi-lock"></i> Подтвердите пароль
                </label>
                <Password
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  placeholder="Подтвердите новый пароль"
                  :feedback="false"
                  toggleMask
                  required
                  class="w-full"
                  :class="{ 'p-invalid': submitted && passwordForm.newPassword !== passwordForm.confirmPassword }"
                />
                <small v-if="submitted && passwordForm.newPassword !== passwordForm.confirmPassword" class="p-error">
                  Пароли не совпадают
                </small>
              </div>

              <div v-if="passwordError" class="error-message">
                <i class="pi pi-exclamation-triangle"></i>
                {{ passwordError }}
              </div>

              <div class="form-actions">
                <Button 
                  type="submit" 
                  label="Сменить пароль" 
                  icon="pi pi-save"
                  :loading="changing"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="stats-sidebar">
        <div class="stats-card">
          <h3><i class="pi pi-chart-bar"></i> Статистика</h3>
          
          <div class="stat-item">
            <div class="stat-icon campaigns">
              <i class="pi pi-map"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.campaignsCount }}</span>
              <span class="stat-label">Кампаний</span>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon characters">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.charactersCount }}</span>
              <span class="stat-label">Персонажей</span>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon dm">
              <i class="pi pi-crown"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.dmCampaignsCount }}</span>
              <span class="stat-label">Мастер игр</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignsStore } from '@/stores/campaigns'
import { useCharactersStore } from '@/stores/characters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Divider from 'primevue/divider'
import { api } from '@/services/api'

const authStore = useAuthStore()
const campaignsStore = useCampaignsStore()
const charactersStore = useCharactersStore()
const toast = useToast()

const submitted = ref(false)
const changing = ref(false)
const passwordError = ref('')

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const stats = ref({
  campaignsCount: 0,
  charactersCount: 0,
  dmCampaignsCount: 0
})

const userInitials = computed(() => {
  if (!authStore.user?.username) return 'U'
  return authStore.user.username.charAt(0).toUpperCase()
})

const getUserRoleName = (role?: string): string => {
  const roles: Record<string, string> = {
    'admin': 'Администратор',
    'dm': 'Мастер',
    'player': 'Игрок'
  }
  return roles[role || 'player'] || 'Игрок'
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const loadStats = async () => {
  try {
    await campaignsStore.fetchCampaigns()
    await charactersStore.fetchCharacters()
    
    stats.value.campaignsCount = campaignsStore.campaigns.length
    stats.value.charactersCount = charactersStore.characters.length
    stats.value.dmCampaignsCount = campaignsStore.campaigns.filter(c => c.dm_id === authStore.user?.id).length
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const handleChangePassword = async () => {
  submitted.value = true
  passwordError.value = ''

  if (!passwordForm.value.currentPassword) {
    passwordError.value = 'Введите текущий пароль'
    return
  }

  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'Новый пароль должен быть не менее 6 символов'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Пароли не совпадают'
    return
  }

  changing.value = true

  try {
    await api.post('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Пароль успешно изменен',
      life: 3000
    })

    // Очищаем форму
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    submitted.value = false
  } catch (error: any) {
    passwordError.value = error.response?.data?.error || 'Не удалось изменить пароль'
  } finally {
    changing.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.profile-page {
  padding: 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.page-header h1 i {
  color: #3b82f6;
}

.profile-container {
  display: flex;
  gap: 24px;
}

.profile-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profile-header {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  border-bottom: 1px solid #e5e7eb;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 2rem;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.avatar-info h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.profile-body {
  padding: 24px;
}

.info-section h3,
.password-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  color: #374151;
  font-size: 1.1rem;
}

.info-section h3 i,
.password-section h3 i {
  color: #3b82f6;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 180px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.9rem;
}

.info-label i {
  width: 20px;
  color: #9ca3af;
}

.info-value {
  flex: 1;
  color: #1f2937;
  font-weight: 500;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.dm {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.player {
  background: #d1fae5;
  color: #065f46;
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

.form-field label i {
  color: #6b7280;
}

.w-full {
  width: 100%;
}

.p-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.stats-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.stats-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stats-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  color: #374151;
  font-size: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-icon.campaigns {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.stat-icon.characters {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.stat-icon.dm {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .profile-container {
    flex-direction: column;
  }

  .stats-sidebar {
    width: 100%;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-label {
    width: 100%;
  }
}
</style>