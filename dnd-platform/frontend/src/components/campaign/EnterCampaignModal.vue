<!-- frontend/src/components/campaign/EnterCampaignModal.vue -->
<template>
  <Dialog
    v-model:visible="visible"
    :header="`Вход в кампанию: ${campaign?.name}`"
    modal
    :style="{ width: '550px' }"
    @hide="resetForm"
  >
    <form @submit.prevent="handleSubmit" class="enter-form">
      <!-- Выбор роли -->
      <div class="form-section">
        <label class="section-label">Выберите роль для входа</label>
        <div class="role-selector">
          <div 
            class="role-card"
            :class="{ active: form.entry_role === 'player' }"
            @click="selectRole('player')"
          >
            <i class="pi pi-users"></i>
            <span class="role-name">Игрок</span>
            <span class="role-desc">Управляйте персонажем</span>
          </div>
          
          <div 
            v-if="isOwner"
            class="role-card"
            :class="{ active: form.entry_role === 'dm' }"
            @click="selectRole('dm')"
          >
            <i class="pi pi-crown"></i>
            <span class="role-name">DM</span>
            <span class="role-desc">Мастер подземелий</span>
          </div>
          
          <div 
            class="role-card"
            :class="{ active: form.entry_role === 'spectator' }"
            @click="selectRole('spectator')"
          >
            <i class="pi pi-eye"></i>
            <span class="role-name">Зритель</span>
            <span class="role-desc">Наблюдайте за игрой</span>
          </div>
        </div>
      </div>

      <!-- Для DM: PIN-код -->
      <div v-if="form.entry_role === 'dm'" class="form-section">
        <label class="section-label">
          <i class="pi pi-lock"></i> PIN-код DM
        </label>
        <InputMask
          v-model="form.dm_pin"
          mask="999999"
          placeholder="123456"
          class="w-full"
          :class="{ 'p-invalid': errors.dm_pin }"
        />
        <small v-if="errors.dm_pin" class="p-error">{{ errors.dm_pin }}</small>
      </div>

      <!-- Для игрока: выбор персонажа -->
      <div v-if="form.entry_role === 'player'" class="form-section">
        <label class="section-label">
          <i class="pi pi-user"></i> Выберите персонажа <span class="required">*</span>
        </label>
        
        <div v-if="charactersLoading" class="loading-chars">
          <ProgressSpinner style="width: 30px; height: 30px;" />
          <span>Загрузка персонажей...</span>
        </div>
        
        <div v-else-if="userCharacters.length === 0" class="no-chars">
          <i class="pi pi-exclamation-triangle"></i>
          <p>У вас нет персонажей</p>
          <Button 
            label="Создать персонажа" 
            icon="pi pi-plus"
            @click="goToCreateCharacter"
            size="small"
          />
        </div>
        
        <div v-else class="character-list">
          <div
            v-for="char in userCharacters"
            :key="char.id"
            class="character-option"
            :class="{ selected: form.character_id === char.id }"
            @click="form.character_id = char.id"
          >
            <div class="char-avatar">
              {{ char.name.charAt(0).toUpperCase() }}
            </div>
            <div class="char-info">
              <strong>{{ char.name }}</strong>
              <span>{{ char.race }} {{ char.class }} • Ур.{{ char.level }}</span>
            </div>
            <i v-if="form.character_id === char.id" class="pi pi-check-circle selected-icon"></i>
          </div>
        </div>
        
        <small v-if="errors.character_id" class="p-error">{{ errors.character_id }}</small>
      </div>

      <!-- Для зрителя -->
      <div v-if="form.entry_role === 'spectator'" class="form-section spectator-info">
        <i class="pi pi-info-circle"></i>
        <span>Вы войдете как наблюдатель без возможности взаимодействия</span>
      </div>

      <!-- Ошибки -->
      <div v-if="formError" class="form-error">
        <i class="pi pi-exclamation-triangle"></i>
        {{ formError }}
      </div>

      <!-- Кнопки -->
      <div class="form-actions">
        <Button 
          type="button" 
          label="Отмена" 
          severity="secondary" 
          @click="visible = false"
          :disabled="loading"
        />
        <Button 
          type="submit" 
          :label="submitLabel"
          icon="pi pi-sign-in"
          :loading="loading"
          severity="success"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/campaigns'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputMask from 'primevue/inputmask'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import type { Campaign } from '@/types/campaign'

const props = defineProps<{
  modelValue: boolean
  campaign: Campaign | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'joined', campaignId: number): void
}>()

const router = useRouter()
const campaignStore = useCampaignsStore()
const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const toast = useToast()

const visible = ref(props.modelValue)
const loading = ref(false)
const formError = ref('')
const charactersLoading = ref(false)

const form = reactive({
  entry_role: 'player' as 'player' | 'dm' | 'spectator',
  character_id: null as number | null,
  dm_pin: ''
})

const errors = reactive({
  character_id: '',
  dm_pin: ''
})

const isOwner = computed(() => {
  return props.campaign?.dm_id === authStore.user?.id
})

const submitLabel = computed(() => {
  switch (form.entry_role) {
    case 'dm': return 'Войти как DM'
    case 'spectator': return 'Войти как зритель'
    default: return 'Войти как игрок'
  }
})

const userCharacters = computed(() => charactersStore.characters)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) loadCharacters()
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function selectRole(role: 'player' | 'dm' | 'spectator') {
  form.entry_role = role
  form.character_id = null
  form.dm_pin = ''
  errors.character_id = ''
  errors.dm_pin = ''
}

async function loadCharacters() {
  charactersLoading.value = true
  try {
    await charactersStore.fetchCharacters()
  } catch (err) {
    console.error('Failed to load characters:', err)
  } finally {
    charactersLoading.value = false
  }
}

function validate(): boolean {
  let valid = true
  errors.character_id = ''
  errors.dm_pin = ''

  if (form.entry_role === 'player' && !form.character_id) {
    errors.character_id = 'Выберите персонажа'
    valid = false
  }

  if (form.entry_role === 'dm') {
    if (!form.dm_pin) {
      errors.dm_pin = 'Введите PIN-код'
      valid = false
    } else if (!/^\d{4,6}$/.test(form.dm_pin)) {
      errors.dm_pin = 'PIN должен содержать 4-6 цифр'
      valid = false
    }
  }

  return valid
}

function resetForm() {
  form.entry_role = 'player'
  form.character_id = null
  form.dm_pin = ''
  formError.value = ''
  errors.character_id = ''
  errors.dm_pin = ''
}

async function handleSubmit() {
  if (!validate() || !props.campaign) return

  loading.value = true
  formError.value = ''

  try {
    // ИСПРАВЛЕНО: вызываем правильный метод с правильными параметрами
    await campaignStore.joinCampaign(
      props.campaign.id,
      form.character_id || undefined,
      form.entry_role,
      form.dm_pin || undefined
    )

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: `Вы вошли как ${form.entry_role === 'dm' ? 'DM' : form.entry_role === 'spectator' ? 'зритель' : 'игрок'}!`,
      life: 3000
    })

    visible.value = false
    resetForm()
    emit('joined', props.campaign.id)
    
    // Переход в кампанию
    router.push(`/campaigns/${props.campaign.id}`)
  } catch (err: any) {
    formError.value = err.response?.data?.error || 'Ошибка входа в кампанию'
  } finally {
    loading.value = false
  }
}

function goToCreateCharacter() {
  visible.value = false
  router.push('/characters?create=true')
}
</script>

<style scoped>
.enter-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 1rem;
}

.required {
  color: #dc2626;
}

.role-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-card:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.role-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.role-card i {
  font-size: 2rem;
  color: #6b7280;
}

.role-card.active i {
  color: #3b82f6;
}

.role-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.role-desc {
  font-size: 0.8rem;
  color: #9ca3af;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.character-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-option:hover {
  background: #f9fafb;
}

.character-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.char-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.char-info strong {
  color: #1f2937;
}

.char-info span {
  color: #6b7280;
  font-size: 0.85rem;
}

.selected-icon {
  color: #3b82f6;
  font-size: 1.5rem;
}

.loading-chars, .no-chars {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: #6b7280;
}

.no-chars {
  flex-direction: column;
  text-align: center;
}

.no-chars i {
  font-size: 2rem;
  color: #f59e0b;
}

.spectator-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
  color: #059669;
}

.spectator-info i {
  font-size: 1.5rem;
}

.form-error {
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
  gap: 12px;
  margin-top: 24px;
}

.p-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

.w-full {
  width: 100%;
}
</style>