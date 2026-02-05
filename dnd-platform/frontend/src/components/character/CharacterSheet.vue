<template>
  <div class="character-sheet">
    <div class="sheet-header">
      <h2>{{ character?.name || 'Персонаж' }}</h2>
      <div class="character-info">
        <Tag :value="`Уровень ${character?.level}`" severity="info" />
        <Tag :value="character?.class" severity="success" />
        <Tag :value="character?.race" severity="warning" />
      </div>
    </div>
    
    <div class="sheet-content">
      <div class="loading" v-if="loading">
        <ProgressSpinner />
        <span>Загрузка персонажа...</span>
      </div>
      
      <div v-else-if="!character" class="empty">
        <h3>Персонаж не найден</h3>
        <Button label="Вернуться к списку" @click="goBack" />
      </div>
      
      <div v-else class="character-details">
        <div class="basic-info">
          <h3>Основная информация</h3>
          <div class="info-grid">
            <div class="info-item">
              <strong>Имя:</strong> {{ character.name }}
            </div>
            <div class="info-item">
              <strong>Уровень:</strong> {{ character.level }}
            </div>
            <div class="info-item">
              <strong>Класс:</strong> {{ character.class }}
            </div>
            <div class="info-item">
              <strong>Раса:</strong> {{ character.race }}
            </div>
            <div v-if="character.background" class="info-item">
              <strong>Предыстория:</strong> {{ character.background }}
            </div>
            <div v-if="character.alignment" class="info-item">
              <strong>Мировоззрение:</strong> {{ character.alignment }}
            </div>
            <div class="info-item">
              <strong>Опыт:</strong> {{ character.experience_points || 0 }}
            </div>
          </div>
        </div>
        
        <div class="abilities-section">
          <h3>Характеристики</h3>
          <div class="abilities-grid">
            <div v-for="ability in abilities" :key="ability.key" class="ability-item">
              <div class="ability-name">{{ abilityNames[ability.key] }}</div>
              <div class="ability-score">
                {{ character[ability.key] }}
              </div>
              <div class="ability-modifier">
                {{ getModifier(character[ability.key]) >= 0 ? '+' : '' }}{{ getModifier(character[ability.key]) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="combat-stats">
          <h3>Боевые параметры</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Хит-поинты</div>
              <div class="stat-value">{{ character.hit_points }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Класс брони</div>
              <div class="stat-value">{{ character.armor_class }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Бонус мастерства</div>
              <div class="stat-value">+{{ character.proficiency_bonus || 2 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Скорость</div>
              <div class="stat-value">{{ character.speed || 30 }} фт.</div>
            </div>
          </div>
        </div>
        
        <div class="skills-section">
          <h3>Навыки</h3>
          <p>Раздел навыков будет реализован позже...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '@/stores/characters'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const charactersStore = useCharactersStore()

const loading = computed(() => charactersStore.loading)
const character = computed(() => charactersStore.currentCharacter)

const abilities = [
  { key: 'strength' },
  { key: 'dexterity' },
  { key: 'constitution' },
  { key: 'intelligence' },
  { key: 'wisdom' },
  { key: 'charisma' }
]

const abilityNames: Record<string, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма'
}

const getModifier = (score: number) => {
  return Math.floor((score - 10) / 2)
}

const goBack = () => {
  router.push('/characters')
}
</script>

<style scoped>
.character-sheet {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.sheet-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.character-info {
  display: flex;
  gap: 8px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
}

.loading span {
  color: #6b7280;
}

.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty h3 {
  color: #6b7280;
  margin-bottom: 20px;
}

.character-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.basic-info h3,
.abilities-section h3,
.combat-stats h3,
.skills-section h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.25rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.info-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.info-item strong {
  color: #4b5563;
  margin-right: 8px;
}

.abilities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .abilities-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.ability-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  position: relative;
}

.ability-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.ability-score {
  font-size: 2rem;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 4px;
}

.ability-modifier {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.125rem;
  border: 3px solid white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.skills-section {
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.skills-section p {
  color: #6b7280;
  margin: 0;
}
</style>