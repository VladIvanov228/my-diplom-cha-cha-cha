<template>
  <div 
    class="active-skill-card" 
    :class="{ 
      'on-cooldown': (cooldown ?? 0) > 0, 
      'no-uses': (usesRemaining ?? 0) <= 0 
    }"
  >
    <div class="skill-icon">
      <i :class="getSkillIcon()"></i>
    </div>
    
    <div class="skill-info">
      <div class="skill-name">
        {{ skill.name }}
        <PrimeTag v-if="(cooldown ?? 0) > 0" severity="warning" :value="`КД: ${cooldown}`" />
        <PrimeTag v-if="(usesRemaining ?? 0) > 0" severity="info" :value="`${usesRemaining} ост.`" />
      </div>
      
      <div class="skill-description">
        {{ truncateDescription(skill.description, 80) }}
      </div>
      
      <div class="skill-details">
        <span v-if="skill.activationCost" class="skill-cost">
          <i class="pi pi-stopwatch"></i>
          {{ formatActivationCost(skill.activationCost) }}
        </span>
        <span v-if="skill.range !== 'self'" class="skill-range">
          <i class="pi pi-map-marker"></i>
          {{ skill.range }}
        </span>
        <span v-if="skill.duration !== 'instant'" class="skill-duration">
          <i class="pi pi-clock"></i>
          {{ skill.duration }}
        </span>
      </div>
    </div>
    
    <div class="skill-action">
      <PrimeButton
        :label="useButtonLabel"
        :disabled="!canUse"
        :loading="isLoading"
        severity="primary"
        size="small"
        @click="$emit('use', skill)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PrimeButton from 'primevue/button';
import PrimeTag from 'primevue/tag';
import type { ClassSkill, ActivationCost } from '@/types/skills';

const props = defineProps<{
  skill: ClassSkill;
  cooldown?: number;
  usesRemaining?: number | null;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'use', skill: ClassSkill): void;
}>();

// Используем nullish coalescing для безопасной проверки
const currentCooldown = computed(() => props.cooldown ?? 0);
const currentUsesRemaining = computed(() => {
  if (props.usesRemaining === null || props.usesRemaining === undefined) {
    return null;
  }
  return props.usesRemaining;
});

const canUse = computed(() => {
  // Проверка кулдауна
  if (currentCooldown.value > 0) return false;
  // Проверка использований
  if (currentUsesRemaining.value !== null && currentUsesRemaining.value <= 0) return false;
  return true;
});

const useButtonLabel = computed(() => {
  if (currentCooldown.value > 0) return `${currentCooldown.value}`;
  if (currentUsesRemaining.value !== null && currentUsesRemaining.value <= 0) return 'Нет зарядов';
  return 'Использовать';
});

function formatActivationCost(cost: ActivationCost): string {
  if (cost.type === 'action') return 'Действие';
  if (cost.type === 'bonus_action') return 'Бонусное действие';
  if (cost.type === 'reaction') return 'Реакция';
  if (cost.type === 'resource') return `Тратит: ${cost.value}`;
  if (cost.type === 'charges') return `${cost.amount} зарядов`;
  return '';
}

function getSkillIcon(): string {
  const effectType = props.skill.effectType;
  switch (effectType) {
    case 'damage': return 'pi pi-bolt';
    case 'heal': return 'pi pi-heart';
    case 'buff': return 'pi pi-star';
    case 'debuff': return 'pi pi-times-circle';
    case 'control': return 'pi pi-lock';
    default: return 'pi pi-fw pi-circle';
  }
}

function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
</script>

<style scoped>
.active-skill-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.active-skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.active-skill-card.on-cooldown {
  opacity: 0.7;
  filter: grayscale(0.2);
}

.active-skill-card.no-uses {
  opacity: 0.5;
}

.skill-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-50);
  border-radius: 12px;
  font-size: 1.5rem;
  color: var(--primary-color);
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.skill-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.skill-details {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.skill-details span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.skill-action {
  display: flex;
  align-items: center;
}
</style>