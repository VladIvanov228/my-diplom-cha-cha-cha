// frontend/src/stores/skills.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { 
  RacePassiveSkill, 
  ClassSkill, 
  CharacterSkill, 
  UseSkillParams,
  UseSkillResult 
} from '../types/skills';

export const useSkillsStore = defineStore('skills', () => {
  // State
  const racePassive = ref<RacePassiveSkill | null>(null);
  const classSkills = ref<ClassSkill[]>([]);
  const learnedSkills = ref<CharacterSkill[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentCharacterId = ref<number | null>(null);

  // Getters
  const activeSkills = computed(() => {
    return learnedSkills.value.filter(s => s.skill?.skillType === 'active');
  });

  const passiveSkills = computed(() => {
    return learnedSkills.value.filter(s => s.skill?.skillType === 'passive');
  });

  const skillsByLevel = computed(() => {
    const byLevel: { [level: number]: ClassSkill[] } = {};
    classSkills.value.forEach(skill => {
      if (!byLevel[skill.skillLevel]) {
        byLevel[skill.skillLevel] = [];
      }
      byLevel[skill.skillLevel].push(skill);
    });
    return byLevel;
  });

  const availableToLearn = computed(() => {
    const learnedIds = new Set(learnedSkills.value.map(s => s.skill?.id));
    return classSkills.value.filter(skill => !learnedIds.has(skill.id));
  });

  // В skills.ts, исправь методы:

async function fetchRacePassiveSkill(raceId: number) {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.get(`/skills/races/${raceId}/passive-skills`);
    // Если ответ в обертке { data: ... }
    const data = response.data.data || response.data;
    racePassive.value = data;
    console.log('Race passive skill loaded:', racePassive.value);
    return data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch race passive skill';
    console.error('Error fetching race passive skill:', err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

async function fetchClassSkills(classId: number, level?: number) {
  isLoading.value = true;
  error.value = null;
  try {
    const url = level 
      ? `/skills/classes/${classId}/skills?level=${level}`
      : `/skills/classes/${classId}/skills`;
    const response = await api.get(url);
    // Если ответ в обертке { data: ... }
    const data = response.data.data || response.data;
    classSkills.value = Array.isArray(data) ? data : [];
    console.log('Class skills loaded:', classSkills.value);
    return classSkills.value;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch class skills';
    console.error('Error fetching class skills:', err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

async function fetchCharacterSkills(characterId: number) {
  isLoading.value = true;
  error.value = null;
  currentCharacterId.value = characterId;
  try {
    const response = await api.get(`/skills/characters/${characterId}`);
    // Если ответ в обертке { data: ... }
    const data = response.data.data || response.data;
    const skills = Array.isArray(data) ? data : [];
    
    learnedSkills.value = skills.map((skill: any) => ({
      id: skill.id || skill.character_skill_id,
      characterId: characterId,
      skillId: skill.skill_id || skill.id,
      skill: {
        id: skill.id || skill.skill_id,
        classId: skill.class_id,
        className: skill.class_name,
        name: skill.name,
        description: skill.description,
        skillLevel: skill.skill_level || skill.level || 1,
        skillType: skill.skill_type || 'active',
        activationCost: skill.activation_cost,
        cooldown: skill.cooldown || 0,
        range: skill.range || 'self',
        target: skill.target || 'self',
        duration: skill.duration || 'instant',
        savingThrow: skill.saving_throw,
        effectType: skill.effect_type || 'utility',
        effectValue: skill.effect_value,
        requirements: skill.requirements
      },
      isLearned: true,
      currentCooldown: skill.current_cooldown || 0,
      usesRemaining: skill.uses_remaining !== null && skill.uses_remaining !== undefined ? skill.uses_remaining : undefined,
      lastUsedAt: skill.last_used_at
    }));
    
    console.log('Character skills loaded:', learnedSkills.value);
    return skills;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch character skills';
    console.error('Error fetching character skills:', err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

  async function learnSkill(characterId: number, skillId: number) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/skills/characters/${characterId}/learn`, { skillId });
      const newSkill = response.data;
      
      // Находим навык в classSkills
      const skillToAdd = classSkills.value.find(s => s.id === skillId);
      if (skillToAdd) {
        learnedSkills.value.push({
          id: newSkill.id || Date.now(),
          characterId,
          skillId: skillId,
          skill: skillToAdd,
          isLearned: true,
          currentCooldown: 0,
          usesRemaining: skillToAdd.activationCost?.type === 'charges' 
            ? (skillToAdd.activationCost?.amount as number) 
            : undefined
        });
        
        // Удаляем из доступных
        const index = classSkills.value.findIndex(s => s.id === skillId);
        if (index !== -1) {
          classSkills.value.splice(index, 1);
        }
      }
      
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to learn skill';
      console.error('Error learning skill:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function useSkill(params: UseSkillParams): Promise<UseSkillResult> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.put(
        `/skills/characters/${params.characterId}/skills/${params.skillId}/use`,
        {
          targetId: params.targetId,
          targetType: params.targetType,
          position: params.position
        }
      );
      
      // Обновляем локальное состояние
      const learnedSkill = learnedSkills.value.find(s => s.skillId === params.skillId);
      if (learnedSkill && learnedSkill.skill) {
        if (learnedSkill.skill.cooldown > 0) {
          learnedSkill.currentCooldown = learnedSkill.skill.cooldown;
        }
        if (learnedSkill.usesRemaining !== undefined && learnedSkill.usesRemaining > 0) {
          learnedSkill.usesRemaining -= 1;
        }
        learnedSkill.lastUsedAt = new Date().toISOString();
      }
      
      const result: UseSkillResult = {
        success: true,
        message: response.data?.message || 'Skill used successfully',
        damage: response.data?.damage,
        healing: response.data?.healing,
        effects: response.data?.effects,
        cooldownStarted: response.data?.cooldownStarted,
        usesDecremented: response.data?.usesRemaining !== undefined
      };
      
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to use skill';
      console.error('Error using skill:', err);
      return {
        success: false,
        message: error.value || 'Unknown error occurred'
      };
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCooldowns(characterId: number) {
    try {
      const response = await api.post(`/skills/characters/${characterId}/cooldown/update`);
      // Обновляем локальные кулдауны
      learnedSkills.value.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown -= 1;
        }
      });
      return response.data;
    } catch (err: any) {
      console.error('Failed to update cooldowns:', err);
      throw err;
    }
  }

  function reset() {
    racePassive.value = null;
    classSkills.value = [];
    learnedSkills.value = [];
    isLoading.value = false;
    error.value = null;
    currentCharacterId.value = null;
  }

  return {
    // State
    racePassive,
    classSkills,
    learnedSkills,
    isLoading,
    error,
    currentCharacterId,
    
    // Getters
    activeSkills,
    passiveSkills,
    skillsByLevel,
    availableToLearn,
    
    // Actions
    fetchRacePassiveSkill,
    fetchClassSkills,
    fetchCharacterSkills,
    learnSkill,
    useSkill,
    updateCooldowns,
    reset
  };
});