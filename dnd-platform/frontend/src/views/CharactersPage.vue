<template>
  <div class="characters-page">
    <div class="page-header">
      <h1>Мои персонажи</h1>
      <Button label="Создать персонажа" icon="pi pi-plus" @click="showCreateDialog = true" />
    </div>

    <!-- Список персонажей -->
    <div class="characters-list" v-if="charactersStore.characters.length > 0">
      <div v-for="character in charactersStore.characters" :key="character.id" class="character-card">
        <div class="character-info">
          <h3>{{ character.name }}</h3>
          <p>Уровень {{ character.level }} {{ character.class }} • {{ character.race }}</p>
          <div class="character-stats">
            <span>HP: {{ character.hit_points }}</span>
            <span>AC: {{ character.armor_class }}</span>
            <span>XP: {{ character.experience_points }}</span>
          </div>
        </div>
        <div class="character-actions">
          <Button icon="pi pi-eye" severity="secondary" @click="viewCharacter(character.id)" />
          <Button icon="pi pi-pencil" severity="info" @click="editCharacter(character.id)" />
          <Button icon="pi pi-trash" severity="danger" @click="confirmDelete(character)" />
        </div>
      </div>
    </div>

    <!-- Пустой список -->
    <div v-else class="empty-state">
      <i class="pi pi-users" style="font-size: 4rem; color: #6b7280;"></i>
      <h3>У вас пока нет персонажей</h3>
      <p>Создайте своего первого персонажа для игры в D&D</p>
      <Button label="Создать первого персонажа" @click="showCreateDialog = true" />
    </div>

    <!-- Диалог создания персонажа -->
    <CreateCharacterDialog 
      v-model:visible="showCreateDialog"
      @character-created="handleCharacterCreated"
    />

    <!-- Диалог удаления -->
    <Dialog v-model:visible="deleteDialogVisible" header="Подтверждение удаления" :modal="true">
      <p>Вы уверены, что хотите удалить персонажа "{{ characterToDelete?.name }}"?</p>
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="deleteDialogVisible = false" severity="secondary" />
        <Button label="Удалить" icon="pi pi-check" @click="deleteCharacter" severity="danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/characters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import CreateCharacterDialog from '@/components/character/CreateCharacterDialog.vue'

const router = useRouter()
const charactersStore = useCharactersStore()
const toast = useToast()

const showCreateDialog = ref(false)
const deleteDialogVisible = ref(false)
const characterToDelete = ref<any>(null)

onMounted(async () => {
  await charactersStore.fetchCharacters()
  // УДАЛЕНО: fetchClasses() и fetchRaces() - теперь они загружаются только в диалоге
})

const viewCharacter = (id: number) => {
  router.push(`/character/${id}`)
}

const editCharacter = (id: number) => {
  router.push(`/character/${id}/edit`)
}

const confirmDelete = (character: any) => {
  characterToDelete.value = character
  deleteDialogVisible.value = true
}

const deleteCharacter = async () => {
  if (!characterToDelete.value) return

  try {
    await charactersStore.deleteCharacter(characterToDelete.value.id)
    deleteDialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Успех',
      detail: 'Персонаж удален',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось удалить персонажа',
      life: 3000
    })
  }
}

const handleCharacterCreated = (character: any) => {
  showCreateDialog.value = false
  router.push(`/character/${character.id}`)
}
</script>

<style scoped>
.characters-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.characters-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.character-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.character-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.character-info h3 {
  margin: 0 0 8px 0;
  color: #111827;
}

.character-info p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.character-stats {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #374151;
}

.character-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.empty-state h3 {
  margin: 20px 0 10px 0;
  color: #374151;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 20px;
}
</style>