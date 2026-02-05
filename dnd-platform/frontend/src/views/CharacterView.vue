<template>
  <div class="character-view">
    <div class="view-header">
      <Button icon="pi pi-arrow-left" label="Назад" @click="goBack" severity="secondary" />
      <div class="header-actions">
        <Button icon="pi pi-pencil" label="Редактировать" @click="editCharacter" />
        <Button icon="pi pi-print" label="Печать" severity="secondary" />
      </div>
    </div>
    
    <CharacterSheet v-if="characterStore.currentCharacter" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/characters'
import Button from 'primevue/button'
import CharacterSheet from '@/components/character/CharacterSheet.vue'

const route = useRoute()
const router = useRouter()
const characterStore = useCharactersStore()

const characterId = Number(route.params.id)

onMounted(async () => {
  if (characterId) {
    await characterStore.fetchCharacter(characterId)
  }
})

const goBack = () => {
  router.push('/characters')
}

const editCharacter = () => {
  router.push(`/character/${characterId}/edit`)
}
</script>

<style scoped>
.character-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>