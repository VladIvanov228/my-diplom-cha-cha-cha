<template>
  <div class="character-edit-page">
    <div class="edit-header">
      <Button icon="pi pi-arrow-left" label="Назад к персонажу" @click="goBack" severity="secondary" />
      <h1>Редактирование персонажа</h1>
    </div>
    
    <div class="edit-content">
      <EditCharacterDialog 
        v-model:visible="dialogVisible"
        :character-id="characterId"
        @character-updated="handleCharacterUpdated"
        @character-deleted="handleCharacterDeleted"
      />
      
      <div v-if="!dialogVisible" class="placeholder">
        <p>Диалог редактирования закрыт. Нажмите кнопку ниже, чтобы открыть снова.</p>
        <Button 
          label="Открыть редактор" 
          icon="pi pi-pencil" 
          @click="dialogVisible = true" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/characters'
import Button from 'primevue/button'
import EditCharacterDialog from '@/components/character/EditCharacterDialog.vue'

const route = useRoute()
const router = useRouter()
const charactersStore = useCharactersStore()

const characterId = Number(route.params.id)
const dialogVisible = ref(true)

onMounted(async () => {
  if (characterId) {
    await charactersStore.fetchCharacter(characterId)
  }
})

const goBack = () => {
  router.push(`/character/${characterId}`)
}

const handleCharacterUpdated = (character: any) => {
  console.log('Character updated:', character)
  // Можно обновить список персонажей или выполнить другие действия
}

const handleCharacterDeleted = (deletedId: number) => {
  console.log('Character deleted:', deletedId)
  router.push('/characters')
}
</script>

<style scoped>
.character-edit-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.edit-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.edit-header h1 {
  margin: 0;
  color: #2c3e50;
}

.edit-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  min-height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.placeholder p {
  margin-bottom: 20px;
}
</style>