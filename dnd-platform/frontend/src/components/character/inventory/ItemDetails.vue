<template>
  <div class="item-details">
    <div v-if="item" class="details-container">
      <div class="detail-header">
        <div class="item-icon" :style="{ backgroundColor: getItemColor(item.type) }">
          <i :class="getItemIcon(item)"></i>
        </div>
        <div class="item-title">
          <h3>{{ item.name }}</h3>
          <Tag :value="item.rarity" :severity="getRaritySeverity(item.rarity)" v-if="item.rarity" />
        </div>
      </div>

      <Divider />

      <div class="detail-section">
        <h4>Основная информация</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Тип:</span>
            <span class="value">{{ formatItemType(item.type) }}</span>
          </div>
          <div class="info-item" v-if="item.subtype">
            <span class="label">Подтип:</span>
            <span class="value">{{ item.subtype }}</span>
          </div>
          <div class="info-item" v-if="item.quantity && item.quantity > 1">
            <span class="label">Количество:</span>
            <span class="value">{{ item.quantity }}</span>
          </div>
          <div class="info-item" v-if="item.weight">
            <span class="label">Вес:</span>
            <span class="value">{{ item.weight }} фнт.</span>
          </div>
          <div class="info-item" v-if="item.cost">
            <span class="label">Стоимость:</span>
            <span class="value">{{ item.cost }} {{ item.cost_unit || 'зм' }}</span>
          </div>
        </div>
      </div>

      <Divider />

      <div class="detail-section" v-if="item.damage || item.armor_class_bonus || item.range_normal || item.strength_requirement || item.stealth_disadvantage">
        <h4>Боевые характеристики</h4>
        <div class="info-grid">
          <div class="info-item" v-if="item.damage">
            <span class="label">Урон:</span>
            <span class="value">{{ item.damage }} {{ item.damage_type || '' }}</span>
          </div>
          <div class="info-item" v-if="item.armor_class_bonus">
            <span class="label">Бонус к КД:</span>
            <span class="value">+{{ item.armor_class_bonus }}</span>
          </div>
          <div class="info-item" v-if="item.range_normal">
            <span class="label">Дальность:</span>
            <span class="value">{{ item.range_normal }}/{{ item.range_long || item.range_normal }} фт.</span>
          </div>
          <div class="info-item" v-if="item.strength_requirement">
            <span class="label">Требование Силы:</span>
            <span class="value">{{ item.strength_requirement }}</span>
          </div>
          <div class="info-item" v-if="item.stealth_disadvantage">
            <span class="label">Особенности:</span>
            <span class="value text-warning">Помеха на Скрытность</span>
          </div>
        </div>
      </div>

      <Divider v-if="item.description || hasProperties" />

      <div class="detail-section" v-if="item.description">
        <h4>Описание</h4>
        <p class="description">{{ item.description }}</p>
      </div>

      <div class="detail-section" v-if="hasProperties">
        <h4>Свойства</h4>
        <div class="properties-list">
          <template v-for="(propValue, propKey) in item.properties" :key="propKey">
            <Tag 
              v-if="propValue === true"
              :value="formatProperty(propKey)" 
              severity="info" 
              class="property-tag"
            />
          </template>
        </div>
      </div>

      <Divider v-if="item.enchantments && item.enchantments.length > 0" />

      <div class="detail-section" v-if="item.enchantments && item.enchantments.length > 0">
        <h4>Зачарования</h4>
        <div v-for="enchant in item.enchantments" :key="enchant.id" class="enchantment-item">
          <strong>{{ enchant.name }}</strong>
          <p>{{ enchant.description }}</p>
          <Tag v-if="enchant.bonus_value" :value="'+' + enchant.bonus_value" severity="success" />
        </div>
      </div>
    </div>
    <div v-else class="no-item">
      <i class="pi pi-box" style="font-size: 3rem;"></i>
      <p>Предмет не выбран</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Equipment } from '@/types/equipment'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

const props = defineProps<{
  item: Equipment | null
}>()

// Тип для свойств предмета
interface EquipmentProperties {
  [key: string]: boolean | string | number | undefined
}

const hasProperties = computed(() => {
  if (!props.item?.properties) return false
  return Object.keys(props.item.properties).length > 0
})

const getItemIcon = (item: Equipment) => {
  switch (item.type) {
    case 'weapon': return 'pi pi-bolt'
    case 'armor': return 'pi pi-shield'
    case 'shield': return 'pi pi-shield'
    case 'potion': return 'pi pi-star'
    case 'scroll': return 'pi pi-book'
    case 'container': return 'pi pi-folder'
    default: return 'pi pi-box'
  }
}

const getItemColor = (type: string) => {
  const colors: Record<string, string> = {
    weapon: '#ef4444',
    armor: '#3b82f6',
    shield: '#10b981',
    potion: '#f59e0b',
    scroll: '#8b5cf6',
    container: '#6b7280'
  }
  return colors[type] || '#6b7280'
}

const getRaritySeverity = (rarity: string) => {
  const severities: Record<string, string> = {
    common: 'info',
    uncommon: 'success',
    rare: 'warning',
    very_rare: 'danger',
    legendary: 'help'
  }
  return severities[rarity] || 'info'
}

const formatItemType = (type: string) => {
  const types: Record<string, string> = {
    weapon: 'Оружие',
    armor: 'Броня',
    shield: 'Щит',
    potion: 'Зелье',
    scroll: 'Свиток',
    wand: 'Волшебная палочка',
    staff: 'Посох',
    rod: 'Жезл',
    wondrous_item: 'Чудесный предмет',
    tool: 'Инструмент',
    kit: 'Набор',
    ammunition: 'Амуниция',
    container: 'Контейнер',
    clothing: 'Одежда',
    food: 'Еда',
    light: 'Осветительный прибор',
    trade_good: 'Товар',
    trinket: 'Безделушка',
    other: 'Прочее'
  }
  return types[type] || type
}

const formatProperty = (prop: string) => {
  const props: Record<string, string> = {
    finesse: 'Фехтовальное',
    heavy: 'Тяжелое',
    light: 'Легкое',
    loading: 'Перезарядка',
    reach: 'Досягаемость',
    thrown: 'Метательное',
    two_handed: 'Двуручное',
    versatile: 'Универсальное',
    ammunition: 'Боеприпас',
    silvered: 'Посеребренное'
  }
  return props[prop] || prop
}
</script>

<style scoped>
.item-details {
  min-height: 300px;
}

.details-container {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
}

.item-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.item-title {
  flex: 1;
}

.item-title h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.detail-section {
  margin: 16px 0;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #4b5563;
  font-size: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 0.8rem;
  color: #6b7280;
}

.info-item .value {
  font-weight: 600;
  color: #1f2937;
}

.text-warning {
  color: #f59e0b;
}

.description {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.properties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.property-tag {
  margin-right: 4px;
}

.enchantment-item {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  margin-bottom: 8px;
}

.enchantment-item:last-child {
  margin-bottom: 0;
}

.enchantment-item strong {
  display: block;
  color: #7c3aed;
  margin-bottom: 4px;
}

.enchantment-item p {
  margin: 4px 0;
  color: #4b5563;
  font-size: 0.9rem;
}

.no-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #9ca3af;
  gap: 16px;
}

.no-item p {
  margin: 0;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>