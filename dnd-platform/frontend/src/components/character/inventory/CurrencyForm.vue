<!-- src/components/character/inventory/CurrencyForm.vue -->

<template>
  <div class="currency-form">
    <div class="currency-inputs">
      <div class="currency-field">
        <label>
          <i class="pi pi-star" style="color: #B87333;"></i>
          Медные (мм)
        </label>
        <InputNumber 
          v-model="formData.copper" 
          :min="0"
          :step="1"
          class="currency-input"
        />
      </div>

      <div class="currency-field">
        <label>
          <i class="pi pi-star" style="color: #C0C0C0;"></i>
          Серебряные (см)
        </label>
        <InputNumber 
          v-model="formData.silver" 
          :min="0"
          :step="1"
          class="currency-input"
        />
      </div>

      <div class="currency-field" v-if="formData.electrum !== undefined">
        <label>
          <i class="pi pi-star" style="color: #E5E4E2;"></i>
          Электрумовые (эм)
        </label>
        <InputNumber 
          v-model="formData.electrum" 
          :min="0"
          :step="1"
          class="currency-input"
        />
      </div>

      <div class="currency-field">
        <label>
          <i class="pi pi-star" style="color: #FFD700;"></i>
          Золотые (зм)
        </label>
        <InputNumber 
          v-model="formData.gold" 
          :min="0"
          :step="1"
          class="currency-input"
        />
      </div>

      <div class="currency-field" v-if="formData.platinum !== undefined">
        <label>
          <i class="pi pi-star" style="color: #E5E4E2;"></i>
          Платиновые (пл)
        </label>
        <InputNumber 
          v-model="formData.platinum" 
          :min="0"
          :step="1"
          class="currency-input"
        />
      </div>
    </div>

    <!-- Калькулятор конвертации -->
    <Divider>
      <span class="converter-title">Конвертер валют</span>
    </Divider>

    <div class="converter">
      <div class="converter-row">
        <div class="converter-input">
          <label>Из:</label>
          <Dropdown 
            v-model="converter.from" 
            :options="currencyOptions" 
            optionLabel="label"
            optionValue="value"
            class="converter-dropdown"
          />
        </div>
        <div class="converter-input">
          <label>Количество:</label>
          <InputNumber 
            v-model="converter.amount" 
            :min="0"
            :step="1"
            class="converter-number"
          />
        </div>
        <div class="converter-input">
          <label>В:</label>
          <Dropdown 
            v-model="converter.to" 
            :options="currencyOptions" 
            optionLabel="label"
            optionValue="value"
            class="converter-dropdown"
          />
        </div>
        <Button 
          icon="pi pi-arrow-right" 
          label="Конвертировать"
          :disabled="!canConvert"
          @click="convertCurrency"
        />
      </div>

      <div v-if="conversionResult" class="conversion-result">
        <i class="pi pi-check-circle" style="color: #10b981;"></i>
        <span>
          {{ converter.amount }} {{ getCurrencySymbol(converter.from) }} = 
          <strong>{{ conversionResult }}</strong> {{ getCurrencySymbol(converter.to) }}
        </span>
      </div>
    </div>

    <!-- Итоговая стоимость в золоте -->
    <Divider />
    
    <div class="total-value">
      <span>Общая стоимость:</span>
      <span class="total-amount">
        {{ totalValueInGold }} зм
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import type { Currency } from '@/types/equipment'

const props = defineProps<{
  characterId: number
  currency: Currency
}>()

const emit = defineEmits(['saved', 'cancel'])

const equipmentStore = useEquipmentStore()


// Данные формы
const formData = reactive<Currency>({
  character_id: props.characterId,
  copper: props.currency?.copper || 0,
  silver: props.currency?.silver || 0,
  electrum: props.currency?.electrum || 0,
  gold: props.currency?.gold || 0,
  platinum: props.currency?.platinum || 0
})

// Конвертер
const converter = ref({
  from: 'copper',
  to: 'gold',
  amount: 0
})

const conversionResult = ref<number | null>(null)

// Курсы конвертации (относительно золота)
const conversionRates = {
  copper: 0.01,    // 1 медная = 0.01 золота
  silver: 0.1,      // 1 серебряная = 0.1 золота
  electrum: 0.5,    // 1 электрумовая = 0.5 золота
  gold: 1,          // 1 золотая = 1 золото
  platinum: 10      // 1 платиновая = 10 золота
}

const currencyOptions = [
  { label: 'Медные (мм)', value: 'copper' },
  { label: 'Серебряные (см)', value: 'silver' },
  { label: 'Электрумовые (эм)', value: 'electrum' },
  { label: 'Золотые (зм)', value: 'gold' },
  { label: 'Платиновые (пл)', value: 'platinum' }
]

const canConvert = computed(() => {
  return converter.value.amount > 0 && converter.value.from !== converter.value.to
})

const totalValueInGold = computed(() => {
  return Object.entries(formData).reduce((total, [key, value]) => {
    if (key === 'character_id') return total
    const rate = conversionRates[key as keyof typeof conversionRates] || 0
    return total + (value * rate)
  }, 0).toFixed(2)
})

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    copper: 'мм',
    silver: 'см',
    electrum: 'эм',
    gold: 'зм',
    platinum: 'пл'
  }
  return symbols[currency] || currency
}

const convertCurrency = () => {
  if (!canConvert.value) return

  const fromRate = conversionRates[converter.value.from as keyof typeof conversionRates]
  const toRate = conversionRates[converter.value.to as keyof typeof conversionRates]
  
  // Конвертируем в золото, затем в целевую валюту
  const valueInGold = converter.value.amount * fromRate
  const result = valueInGold / toRate
  
  conversionResult.value = Math.floor(result)
}

const saveCurrency = async () => {
  try {
    await equipmentStore.updateCurrency(props.characterId, formData)
    emit('saved')
  } catch (error) {
    console.error('Error saving currency:', error)
  }
}

// Добавляем функцию для отмены
const cancel = () => {
  emit('cancel')
}

// Expose methods to parent
defineExpose({
  saveCurrency,
  cancel
})


</script>

<style scoped>
.currency-form {
  padding: 20px;
}

.currency-inputs {
  display: grid;
  gap: 20px;
  margin-bottom: 20px;
}

.currency-field {
  display: grid;
  gap: 8px;
}

.currency-field label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #4b5563;
}

.currency-field label i {
  font-size: 1.2rem;
}

.currency-input {
  width: 100%;
}

.converter-title {
  font-size: 0.9rem;
  color: #6b7280;
}

.converter {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 6px;
  margin: 20px 0;
}

.converter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.converter-input {
  flex: 1;
  min-width: 150px;
}

.converter-input label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #6b7280;
}

.converter-dropdown,
.converter-number {
  width: 100%;
}

.conversion-result {
  margin-top: 20px;
  padding: 12px;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #065f46;
}

.total-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 6px;
  margin: 20px 0;
  font-size: 1.1rem;
}

.total-amount {
  font-weight: 700;
  color: #059669;
  font-size: 1.3rem;
}

@media (max-width: 768px) {
  .converter-row {
    flex-direction: column;
  }

  .converter-input {
    width: 100%;
  }
}
</style>