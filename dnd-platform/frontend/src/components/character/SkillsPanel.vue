<template>
  <div class="skills-panel">
    <div class="skills-header">
      <h3>Навыки и способности</h3>
      <Button 
        v-if="showLearnButton"
        icon="pi pi-plus"
        label="Изучить навык"
        severity="success"
        size="small"
        @click="openLearnDialog"
      />
    </div>

    <!-- Отладочная информация -->
    <div class="debug-info">
      <h4>Отладка SkillsPanel:</h4>
      <p><strong>Пропсы:</strong> characterId={{ characterId }}, raceId={{ raceId }}, classId={{ classId }}, level={{ characterLevel }}</p>
      <p><strong>Состояние стора:</strong> loading={{ isLoading }}, error={{ error || 'нет' }}</p>
      <p><strong>Данные:</strong> racePassive={{ racePassive ? 'есть' : 'нет' }}, classSkills={{ classSkillsCount }}, learnedSkills={{ learnedSkillsCount }}</p>
    </div>

    <!-- Расовый навык -->
    <div v-if="racePassive" class="skill-section">
      <h4>🌿 Расовый навык</h4>
      <div class="skill-card race-skill">
        <div class="skill-name">{{ racePassive.name }}</div>
        <div class="skill-description">{{ racePassive.description }}</div>
      </div>
    </div>
    <div v-else-if="!isLoading" class="skill-section">
      <h4>🌿 Расовый навык</h4>
      <div class="empty-message">Нет расового навыка</div>
    </div>

    <!-- Пассивные навыки -->
    <div v-if="passiveSkillsList.length > 0" class="skill-section">
      <h4>📖 Пассивные навыки</h4>
      <div class="skills-list">
        <div v-for="skill in passiveSkillsList" :key="skill.id" class="skill-card">
          <div class="skill-name">{{ skill.skill?.name || 'Без названия' }}</div>
          <div class="skill-description">{{ skill.skill?.description || 'Нет описания' }}</div>
        </div>
      </div>
    </div>

    <!-- Активные навыки -->
    <div v-if="activeSkillsList.length > 0" class="skill-section">
      <h4>⚔️ Активные навыки</h4>
      <div class="skills-list">
        <div v-for="skill in activeSkillsList" :key="skill.id" class="skill-card">
          <div class="skill-name">{{ skill.skill?.name || 'Без названия' }}</div>
          <div class="skill-description">{{ skill.skill?.description || 'Нет описания' }}</div>
          <div class="skill-meta" v-if="skill.skill?.cooldown">
            <span>⏱️ КД: {{ skill.skill.cooldown }} раундов</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Доступные для изучения -->
    <div v-if="availableToLearnList.length > 0 && showLearnButton" class="skill-section">
      <h4>📚 Доступно для изучения</h4>
      <div class="skills-list">
        <div v-for="skill in availableToLearnList" :key="skill.id" class="skill-card available">
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-description">{{ skill.description }}</div>
          <div class="skill-meta">
            <span>📈 Уровень: {{ skill.skillLevel }}</span>
            <span v-if="skill.cooldown">⏱️ КД: {{ skill.cooldown }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i> Загрузка навыков...
    </div>

    <!-- Пустое состояние -->
    <div v-if="!isLoading && !racePassive && activeSkillsList.length === 0 && passiveSkillsList.length === 0 && availableToLearnList.length === 0" class="empty-state">
      <i class="pi pi-info-circle"></i>
      <p>Нет доступных навыков</p>
      <small>Проверьте подключение к серверу и наличие данных в БД</small>
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSkillsStore } from '@/stores/skills';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Button from 'primevue/button';

const props = defineProps<{
  characterId: number;
  raceId: number;
  classId: number;
  characterLevel: number;
  showLearnButton?: boolean;
}>();

const skillsStore = useSkillsStore();
const toast = useToast();

const learnDialogVisible = ref(false);
const error = computed(() => skillsStore.error);

// Computed properties
const racePassive = computed(() => skillsStore.racePassive);
const passiveSkillsList = computed(() => skillsStore.passiveSkills);
const activeSkillsList = computed(() => skillsStore.activeSkills);
const availableToLearnList = computed(() => skillsStore.availableToLearn);
const isLoading = computed(() => skillsStore.isLoading);
const classSkillsCount = computed(() => skillsStore.classSkills.length);
const learnedSkillsCount = computed(() => skillsStore.learnedSkills.length);

// Methods
async function loadSkills() {
  console.log('=== SkillsPanel: загрузка навыков ===');
  console.log('props:', {
    characterId: props.characterId,
    raceId: props.raceId,
    classId: props.classId,
    characterLevel: props.characterLevel
  });
  
  if (!props.characterId) {
    console.warn('Нет characterId');
    return;
  }
  
  if (!props.raceId && !props.classId) {
    console.warn('Нет raceId или classId, но попробуем загрузить только навыки персонажа');
  }
  
  try {
    // Загружаем навыки персонажа в любом случае
    if (props.characterId) {
      console.log('Загружаем навыки персонажа...');
      await skillsStore.fetchCharacterSkills(props.characterId);
    }
    
    // Загружаем расовый навык если есть raceId
    if (props.raceId) {
      console.log('Загружаем расовый навык...');
      await skillsStore.fetchRacePassiveSkill(props.raceId);
    }
    
    // Загружаем классовые навыки если есть classId
    if (props.classId) {
      console.log('Загружаем классовые навыки...');
      await skillsStore.fetchClassSkills(props.classId, props.characterLevel);
    }
    
    console.log('=== Результат загрузки ===');
    console.log('racePassive:', skillsStore.racePassive);
    console.log('classSkills:', skillsStore.classSkills.length);
    console.log('learnedSkills:', skillsStore.learnedSkills.length);
    console.log('activeSkills:', skillsStore.activeSkills.length);
    console.log('passiveSkills:', skillsStore.passiveSkills.length);
    
  } catch (error: any) {
    console.error('Ошибка загрузки навыков:', error);
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.message || 'Не удалось загрузить навыки',
      life: 5000
    });
  }
}

function openLearnDialog() {
  toast.add({
    severity: 'info',
    summary: 'Изучение навыков',
    detail: 'Эта функция будет доступна позже',
    life: 3000
  });
}

onMounted(() => {
  loadSkills();
});
</script>

<style scoped>
.skills-panel {
  padding: 1rem;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.skills-header h3 {
  margin: 0;
  color: #1f2937;
}

.debug-info {
  background: #1e293b;
  color: #a5f3fc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 12px;
  font-family: monospace;
}

.debug-info h4 {
  margin: 0 0 8px 0;
  color: #facc15;
}

.debug-info p {
  margin: 4px 0;
}

.skill-section {
  margin-bottom: 2rem;
}

.skill-section h4 {
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3b82f6;
  font-size: 1rem;
  color: #374151;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skill-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.skill-card.race-skill {
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
}

.skill-card.available {
  border-left: 4px solid #10b981;
  cursor: pointer;
}

.skill-card.available:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.skill-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.skill-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.skill-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-message {
  color: #9ca3af;
  font-style: italic;
  padding: 1rem;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.loading-state i {
  margin-right: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
}

.empty-state small {
  font-size: 0.75rem;
}
</style>