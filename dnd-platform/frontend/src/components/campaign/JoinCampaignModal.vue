<template>
  <Dialog 
    v-model:visible="visible" 
    header="Присоединиться к кампании"
    :modal="true"
    :closable="!joining"
    :closeOnEscape="!joining"
    :style="{ width: '550px' }"
  >
    <div class="join-campaign-form">
      <p class="campaign-name">
        <i class="pi pi-map"></i>
        {{ campaignName }}
      </p>
      
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 40px; height: 40px" />
        <p>Загрузка персонажей...</p>
      </div>

      <template v-else>
        <div v-if="availableCharacters.length === 0" class="no-characters">
          <i class="pi pi-exclamation-triangle"></i>
          <h4>У вас нет доступных персонажей</h4>
          <p>Создайте персонажа, чтобы присоединиться к кампании.</p>
          <Button 
            label="Создать персонажа" 
            icon="pi pi-user-plus"
            @click="createCharacter"
          />
        </div>

        <template v-else>
          <div class="form-field">
            <label>Выберите персонажа</label>
            <div class="characters-list">
              <div 
                v-for="char in availableCharacters" 
                :key="char.id"
                class="character-option"
                :class="{ selected: selectedCharacter?.id === char.id }"
                @click="selectedCharacter = char"
              >
                <div class="character-avatar">
                  <span>{{ char.name.charAt(0) }}</span>
                </div>
                <div class="character-info">
                  <div class="character-name">{{ char.name }}</div>
                  <div class="character-meta">
                    {{ char.race }} {{ char.class }} • Ур. {{ char.level }}
                  </div>
                  <div class="character-stats">
                    <span title="Сила">💪 {{ char.strength }}</span>
                    <span title="Ловкость">🤸 {{ char.dexterity }}</span>
                    <span title="Телосложение">❤️ {{ char.constitution }}</span>
                    <span title="HP">🩸 {{ char.hit_points }}</span>
                    <span title="Класс брони">🛡️ {{ char.armor_class }}</span>
                  </div>
                </div>
                <div class="character-select">
                  <i :class="selectedCharacter?.id === char.id ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                </div>
              </div>
            </div>
          </div>

          <div v-if="joinError" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            {{ joinError }}
          </div>
        </template>
      </template>
    </div>

    <template #footer>
      <Button 
        label="Отмена" 
        severity="secondary" 
        @click="closeModal"
        :disabled="joining"
      />
      <Button 
        v-if="availableCharacters.length > 0"
        label="Присоединиться" 
        icon="pi pi-sign-in"
        :loading="joining"
        :disabled="!selectedCharacter"
        @click="handleJoin"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useCharactersStore } from '@/stores/characters'
import { useCampaignsStore } from '@/stores/campaigns'
import { useRouter } from 'vue-router'
import type { Character } from '@/types/character'

const props = defineProps<{
  modelValue: boolean
  campaignId: number
  campaignName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'joined'): void
}>()

const router = useRouter()
const charactersStore = useCharactersStore()
const campaignsStore = useCampaignsStore()

const visible = ref(props.modelValue)
const loading = ref(false)
const joining = ref(false)
const joinError = ref('')
const selectedCharacter = ref<Character | null>(null)

const availableCharacters = ref<Character[]>([])

watch(() => props.modelValue, async (newVal) => {
  visible.value = newVal
  if (newVal) {
    loading.value = true
    joinError.value = ''
    selectedCharacter.value = null
    try {
      await charactersStore.fetchCharacters()
      availableCharacters.value = charactersStore.characters
    } catch (error) {
      console.error('Failed to load characters:', error)
    } finally {
      loading.value = false
    }
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const closeModal = () => {
  visible.value = false
}

const createCharacter = () => {
  visible.value = false
  router.push('/characters/create')
}

const handleJoin = async () => {
  if (!selectedCharacter.value) return

  joining.value = true
  joinError.value = ''
  
  try {
    await campaignsStore.joinCampaign(props.campaignId, selectedCharacter.value.id)
    emit('joined')
    visible.value = false
  } catch (error: any) {
    joinError.value = error.response?.data?.error || 'Не удалось присоединиться к кампании'
  } finally {
    joining.value = false
  }
}
</script>

<style scoped>
.join-campaign-form {
  padding: 0.5rem 0;
}

.campaign-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.campaign-name i {
  color: #3b82f6;
}

.loading-state, .no-characters {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  gap: 1rem;
}

.no-characters i {
  font-size: 3rem;
  color: #f59e0b;
}

.no-characters h4 {
  margin: 0;
  color: #1f2937;
}

.no-characters p {
  color: #6b7280;
  margin: 0;
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.character-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
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

.character-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.character-info {
  flex: 1;
}

.character-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.character-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.character-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.character-select i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  margin-top: 1rem;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
}
</style>