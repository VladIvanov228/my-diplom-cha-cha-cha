<!-- frontend/src/components/campaign/CreateCampaignModal.vue -->
<template>
  <Dialog 
    v-model:visible="visible" 
    header="Создание новой кампании"
    modal
    :style="{ width: '600px' }"
    @hide="resetForm"
  >
    <form @submit.prevent="handleSubmit" class="create-campaign-form">
      <!-- Название -->
      <div class="form-section">
        <label class="section-label">
          <i class="pi pi-tag"></i> Название кампании <span class="required">*</span>
        </label>
        <InputText
          v-model="form.name"
          placeholder="Введите название..."
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- Описание -->
      <div class="form-section">
        <label class="section-label">
          <i class="pi pi-align-left"></i> Описание
        </label>
        <Textarea
          v-model="form.description"
          placeholder="Опишите кампанию..."
          rows="3"
          class="w-full"
        />
      </div>

      <!-- PIN для DM -->
      <div class="form-section">
        <label class="section-label">
          <i class="pi pi-lock"></i> PIN-код для DM <span class="required">*</span>
        </label>
        <InputMask
          v-model="form.dm_pin"
          mask="999999"
          placeholder="123456"
          class="w-full"
          :class="{ 'p-invalid': errors.dm_pin }"
        />
        <small class="form-hint">4-6 цифр, используется для входа как DM</small>
        <small v-if="errors.dm_pin" class="p-error">{{ errors.dm_pin }}</small>
      </div>

      <!-- Количество карт -->
      <div class="form-section">
        <label class="section-label">
          <i class="pi pi-map"></i> Количество карт (1-10)
        </label>
        <InputNumber
          v-model="form.mapCount"
          :min="1"
          :max="10"
          showButtons
          class="w-full"
        />
      </div>

      <!-- Названия карт -->
      <div v-if="form.mapCount > 1" class="form-section">
        <label class="section-label">
          <i class="pi pi-list"></i> Названия карт
        </label>
        <div class="map-names-list">
          <div v-for="i in form.mapCount" :key="i" class="map-name-row">
            <span class="map-index">Карта {{ i }}:</span>
            <InputText
              v-model="form.mapNames[i - 1]"
              :placeholder="`Карта ${i}`"
              class="flex-1"
            />
          </div>
        </div>
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
          label="Создать кампанию"
          icon="pi pi-check"
          :loading="loading"
          severity="success"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useCampaignsStore } from '@/stores/campaigns'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputMask from 'primevue/inputmask'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const visible = ref(props.modelValue)
const loading = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  description: '',
  dm_pin: '',
  mapCount: 1,
  mapNames: [] as string[]
})

const errors = reactive({
  name: '',
  dm_pin: ''
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(() => form.mapCount, (newCount) => {
  // Дополняем массив названий
  while (form.mapNames.length < newCount) {
    form.mapNames.push('')
  }
  // Обрезаем если уменьшили
  form.mapNames.length = newCount
})

const campaignStore = useCampaignsStore()
const toast = useToast()

function validate(): boolean {
  let valid = true
  errors.name = ''
  errors.dm_pin = ''

  if (!form.name.trim()) {
    errors.name = 'Название обязательно'
    valid = false
  }

  if (!form.dm_pin || !/^\d{4,6}$/.test(form.dm_pin)) {
    errors.dm_pin = 'PIN должен содержать 4-6 цифр'
    valid = false
  }

  return valid
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.dm_pin = ''
  form.mapCount = 1
  form.mapNames = ['']
  formError.value = ''
  errors.name = ''
  errors.dm_pin = ''
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  formError.value = ''

  try {
    await campaignStore.createCampaign({
      name: form.name.trim(),
      description: form.description.trim(),
      dm_pin: form.dm_pin,
      mapCount: form.mapCount,
      mapNames: form.mapNames.filter(n => n.trim())
    })

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Кампания создана!',
      life: 3000
    })

    visible.value = false
    resetForm()
    emit('created')
  } catch (err: any) {
    formError.value = err.response?.data?.error || 'Ошибка создания кампании'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-campaign-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.required {
  color: #dc2626;
}

.form-hint {
  display: block;
  color: #9ca3af;
  font-size: 0.8rem;
  margin-top: 4px;
}

.map-names-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-index {
  min-width: 70px;
  font-weight: 500;
  color: #6b7280;
}

.flex-1 {
  flex: 1;
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
</style>