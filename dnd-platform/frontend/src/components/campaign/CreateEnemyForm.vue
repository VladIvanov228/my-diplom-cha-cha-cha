<template>
  <form @submit.prevent="handleSubmit" class="create-enemy-form">
    <div class="form-field">
      <label>Название</label>
      <InputText v-model="form.name" required class="w-full" />
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <label>HP</label>
        <InputNumber v-model="form.hp" :min="1" class="w-full" />
      </div>
      <div class="form-field">
        <label>AC</label>
        <InputNumber v-model="form.ac" :min="1" :max="30" class="w-full" />
      </div>
    </div>
    
    <div class="form-field">
      <label>Или выберите из справочника</label>
      <Dropdown 
        v-model="selectedMonster" 
        :options="monsters" 
        optionLabel="name"
        placeholder="Выберите монстра"
        class="w-full"
        @change="onMonsterSelected"
      />
    </div>
    
    <div class="form-actions">
      <Button label="Отмена" severity="secondary" @click="$emit('cancel')" />
      <Button type="submit" label="Создать" severity="primary" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { api } from '@/services/api'

const emit = defineEmits<{
  (e: 'created', enemy: any): void
  (e: 'cancel'): void
}>()

const monsters = ref([])
const selectedMonster = ref(null)

const form = ref({
  name: '',
  hp: 20,
  ac: 12,
  initiative: 0
})

onMounted(async () => {
  try {
    const response = await api.get('/monsters')
    monsters.value = response.data.slice(0, 50)
  } catch (error) {
    console.error('Failed to load monsters:', error)
  }
})

const onMonsterSelected = () => {
  if (selectedMonster.value) {
    const m = selectedMonster.value as any
    form.value.name = m.name
    form.value.hp = m.hit_points || 20
    form.value.ac = m.armor_class || 12
  }
}

const handleSubmit = () => {
  emit('created', {
    ...form.value,
    type: 'enemy',
    id: `enemy_${Date.now()}`
  })
}
</script>

<style scoped>
.create-enemy-form {
  padding: 8px 0;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-field {
  flex: 1;
}

.w-full {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>