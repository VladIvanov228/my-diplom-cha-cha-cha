<template>
  <div class="character-view">
    <div class="view-header">
      <Button icon="pi pi-arrow-left" label="Назад" @click="goBack" severity="secondary" />
      <div class="header-actions">
        <Button icon="pi pi-pencil" label="Редактировать" @click="editCharacter" />
        <Button icon="pi pi-print" label="Печать" severity="secondary" />
      </div>
    </div>
    
    <!-- Отладочная информация -->
    <div v-if="characterStore.currentCharacter" class="debug-panel">
      <h4>Данные персонажа (отладка):</h4>
      <pre>{{ JSON.stringify({
        id: characterStore.currentCharacter.id,
        name: characterStore.currentCharacter.name,
        race: characterStore.currentCharacter.race,
        race_id: characterStore.currentCharacter.race_id,
        class: characterStore.currentCharacter.class,
        class_id: characterStore.currentCharacter.class_id,
        level: characterStore.currentCharacter.level
      }, null, 2) }}</pre>
    </div>
    
    <TabView>
      <TabPanel header="Основное">
        <CharacterSheet v-if="characterStore.currentCharacter" />
      </TabPanel>
      
      <TabPanel header="Инвентарь и снаряжение">
        <InventoryManager 
          v-if="characterId"
          :character-id="characterId"
          @update:total-weight="updateTotalWeight"
          @update:encumbrance="updateEncumbrance"
        />
      </TabPanel>
      
      <TabPanel header="Навыки">
        <SkillsPanel 
          v-if="characterStore.currentCharacter && characterStore.currentCharacter.id"
          :character-id="characterStore.currentCharacter.id"
          :race-id="characterStore.currentCharacter.race_id"
          :class-id="characterStore.currentCharacter.class_id"
          :character-level="characterStore.currentCharacter.level"
          :show-learn-button="true"
        />
      </TabPanel>
      
      <TabPanel header="Заклинания">
        <div class="coming-soon">
          <i class="pi pi-star"></i>
          <h3>Книга заклинаний</h3>
          <p>Скоро здесь появится список заклинаний персонажа</p>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/characters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import CharacterSheet from '@/components/character/CharacterSheet.vue'
import InventoryManager from '@/components/character/InventoryManager.vue'
import SkillsPanel from '@/components/character/SkillsPanel.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const characterStore = useCharactersStore()

const characterId = Number(route.params.id)
const totalWeight = ref(0)
const encumbrance = ref('normal')

onMounted(async () => {
  if (characterId) {
    await characterStore.fetchCharacter(characterId)
    console.log('Loaded character:', characterStore.currentCharacter)
  }
})

const goBack = () => {
  router.push('/characters')
}

const editCharacter = () => {
  router.push(`/character/${characterId}/edit`)
}

const updateTotalWeight = (weight: number) => {
  totalWeight.value = weight
}

const updateEncumbrance = (level: string) => {
  encumbrance.value = level
  
  if (level === 'overloaded') {
    toast.add({
      severity: 'warn',
      summary: 'Перегруз',
      detail: 'Вы несете слишком много! Скорость уменьшена до 0',
      life: 3000
    })
  } else if (level === 'encumbered') {
    toast.add({
      severity: 'info',
      summary: 'Нагрузка',
      detail: 'Скорость уменьшена на 10 футов',
      life: 3000
    })
  }
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

.debug-panel {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 12px;
}

.debug-panel h4 {
  margin: 0 0 8px 0;
  color: #166534;
}

.debug-panel pre {
  margin: 0;
  overflow-x: auto;
  font-family: monospace;
}

.coming-soon {
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.coming-soon i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.coming-soon h3 {
  margin: 0 0 8px 0;
  color: #374151;
}

.coming-soon p {
  margin: 0;
  color: #6b7280;
}
</style>