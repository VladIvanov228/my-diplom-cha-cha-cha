<template>
  <div class="campaign-card" @click="$emit('click', campaign)">
    <div class="card-header">
      <div class="campaign-role" :class="{ 'dm': isDm, 'player': !isDm }">
        <i :class="isDm ? 'pi pi-crown' : 'pi pi-user'"></i>
        <span>{{ isDm ? 'DM' : 'Игрок' }}</span>
      </div>
      <div class="campaign-status" :class="{ active: campaign.is_active }">
        <span class="status-dot"></span>
        <span>{{ campaign.is_active ? 'Активна' : 'Завершена' }}</span>
      </div>
    </div>
    
    <div class="card-body">
      <h3 class="campaign-name">{{ campaign.name }}</h3>
      <p class="campaign-description">
        {{ campaign.description || 'Без описания' }}
      </p>
      
      <div class="campaign-meta">
        <div class="meta-item">
          <i class="pi pi-user"></i>
          <span>{{ campaign.dm_name || 'Неизвестный DM' }}</span>
        </div>
        <div class="meta-item">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(campaign.updated_at) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="isDm" class="card-actions" @click.stop>
      <Button 
        icon="pi pi-pencil" 
        severity="secondary" 
        text 
        rounded
        @click="$emit('edit', campaign)"
        title="Редактировать"
      />
      <Button 
        icon="pi pi-trash" 
        severity="danger" 
        text 
        rounded
        @click="$emit('delete', campaign)"
        title="Удалить"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { Campaign } from '@/types/campaign'

defineProps<{
  campaign: Campaign
  isDm: boolean
}>()

defineEmits<{
  (e: 'click', campaign: Campaign): void
  (e: 'edit', campaign: Campaign): void
  (e: 'delete', campaign: Campaign): void
}>()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дн. назад`
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`
  return date.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.campaign-card {
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.campaign-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.08);
  border-color: #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.campaign-role {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.campaign-role.dm {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.campaign-role.player {
  background: #eff6ff;
  color: #1e40af;
}

.campaign-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f9fafb;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #6b7280;
}

.campaign-status.active {
  background: #d1fae5;
  color: #065f46;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
}

.campaign-status.active .status-dot {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-body {
  margin-bottom: 16px;
}

.campaign-name {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.campaign-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 4.5em;
}

.campaign-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
}

.meta-item i {
  width: 16px;
  color: #3b82f6;
}

.meta-item span {
  color: #4b5563;
}

.card-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.campaign-card:hover .card-actions {
  opacity: 1;
}
</style>