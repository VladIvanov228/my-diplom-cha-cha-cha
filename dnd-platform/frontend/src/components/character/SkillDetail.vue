<template>
  <div class="skill-detail" :class="{ 'race-skill': isRaceSkill }">
    <div class="skill-header">
      <div class="skill-name">
        <i :class="getSkillIcon()"></i>
        {{ skill.name }}
        <PrimeTag v-if="isRaceSkill" severity="info" value="Расовый" />
      </div>
    </div>
    
    <div class="skill-description">
      {{ skill.description }}
    </div>
    
    <div v-if="!isRaceSkill && isClassSkill(skill)" class="skill-stats">
      <div v-if="skill.skillLevel > 1" class="stat-item">
        <span class="stat-label">Уровень:</span>
        <span class="stat-value">{{ skill.skillLevel }}</span>
      </div>
      
      <div v-if="skill.activationCost" class="stat-item">
        <span class="stat-label">Активация:</span>
        <span class="stat-value">{{ formatActivationCost(skill.activationCost) }}</span>
      </div>
      
      <div v-if="skill.cooldown && skill.cooldown > 0" class="stat-item">
        <span class="stat-label">Перезарядка:</span>
        <span class="stat-value">{{ skill.cooldown }} раундов</span>
      </div>
      
      <div v-if="skill.range && skill.range !== 'self'" class="stat-item">
        <span class="stat-label">Дистанция:</span>
        <span class="stat-value">{{ skill.range }}</span>
      </div>
      
      <div v-if="skill.target && skill.target !== 'self'" class="stat-item">
        <span class="stat-label">Цель:</span>
        <span class="stat-value">{{ formatTarget(skill.target) }}</span>
      </div>
      
      <div v-if="skill.duration && skill.duration !== 'instant'" class="stat-item">
        <span class="stat-label">Длительность:</span>
        <span class="stat-value">{{ skill.duration }}</span>
      </div>
      
      <div v-if="skill.savingThrow" class="stat-item">
        <span class="stat-label">Спасбросок:</span>
        <span class="stat-value">{{ formatSavingThrow(skill.savingThrow) }}</span>
      </div>
      
      <div v-if="cooldown !== undefined && cooldown > 0" class="stat-item cooldown">
        <span class="stat-label">Текущий КД:</span>
        <span class="stat-value">{{ cooldown }} раундов</span>
      </div>
      
      <div v-if="usesRemaining !== undefined && usesRemaining !== null && usesRemaining > 0" class="stat-item uses">
        <span class="stat-label">Осталось использований:</span>
        <span class="stat-value">{{ usesRemaining }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PrimeTag from 'primevue/tag';
import type { ClassSkill, RacePassiveSkill, ActivationCost } from '@/types/skills';

const props = defineProps<{
  skill: ClassSkill | RacePassiveSkill;
  isRaceSkill?: boolean;
  cooldown?: number;
  usesRemaining?: number | null;
}>();

// Type guard для проверки, является ли навык классовым
function isClassSkill(skill: ClassSkill | RacePassiveSkill): skill is ClassSkill {
  return !props.isRaceSkill && 'skillType' in skill;
}

function getSkillIcon(): string {
  if (props.isRaceSkill) return 'pi pi-users';
  
  // Если это классовый навык, используем его тип
  if (isClassSkill(props.skill)) {
    switch (props.skill.effectType) {
      case 'damage': return 'pi pi-bolt';
      case 'heal': return 'pi pi-heart';
      case 'buff': return 'pi pi-star';
      case 'debuff': return 'pi pi-times-circle';
      case 'control': return 'pi pi-lock';
      default: return 'pi pi-fw pi-circle';
    }
  }
  
  return 'pi pi-fw pi-circle';
}

function formatActivationCost(cost: ActivationCost): string {
  if (cost.type === 'action') return 'Действие';
  if (cost.type === 'bonus_action') return 'Бонусное действие';
  if (cost.type === 'reaction') return 'Реакция';
  if (cost.type === 'resource') return `Тратит: ${cost.value}`;
  if (cost.type === 'charges') return `${cost.amount} зарядов`;
  return '';
}

function formatTarget(target: string): string {
  const targets: Record<string, string> = {
    self: 'Себя',
    enemy: 'Врага',
    ally: 'Союзника',
    enemies: 'Всех врагов',
    allies: 'Всех союзников',
    area: 'Область'
  };
  return targets[target] || target;
}

function formatSavingThrow(savingThrow: string): string {
  const throws: Record<string, string> = {
    strength: 'Сила',
    dexterity: 'Ловкость',
    constitution: 'Телосложение',
    intelligence: 'Интеллект',
    wisdom: 'Мудрость',
    charisma: 'Харизма'
  };
  return throws[savingThrow] || savingThrow;
}
</script>

<style scoped>
.skill-detail {
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
}

.skill-detail.race-skill {
  background: var(--surface-hover);
  border-left: 4px solid var(--primary-color);
}

.skill-header {
  margin-bottom: 0.75rem;
}

.skill-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.skill-name i {
  color: var(--primary-color);
}

.skill-description {
  font-size: 0.9rem;
  color: var(--text-color);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.skill-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.stat-item {
  font-size: 0.8rem;
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.stat-label {
  color: var(--text-color-secondary);
  margin-right: 0.25rem;
}

.stat-value {
  color: var(--text-color);
  font-weight: 500;
}

.stat-item.cooldown .stat-value {
  color: var(--orange-500);
}

.stat-item.uses .stat-value {
  color: var(--green-500);
}
</style>