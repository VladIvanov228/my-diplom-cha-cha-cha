<template>
  <div class="debug-auth">
    <h2>Отладка аутентификации</h2>
    
    <div class="debug-section">
      <h3>Состояние аутентификации</h3>
      <pre>{{ authState }}</pre>
      
      <div class="actions">
        <Button label="Войти как игрок" @click="loginAsPlayer" />
        <Button label="Войти как мастер" @click="loginAsMaster" />
        <Button label="Выйти" severity="danger" @click="logout" />
      </div>
    </div>
    
    <div class="debug-section">
      <h3>Тест API запросов</h3>
      <div class="api-tests">
        <Button label="Тест публичного API" @click="testPublicApi" />
        <Button label="Тест защищенного API" @click="testProtectedApi" />
        <Button label="Получить персонажей" @click="testGetCharacters" />
      </div>
      
      <h4>Результат:</h4>
      <pre>{{ apiResult }}</pre>
    </div>
    
    <div class="debug-section">
      <h3>LocalStorage</h3>
      <Button label="Очистить LocalStorage" severity="warning" @click="clearStorage" />
      <Button label="Показать LocalStorage" @click="showStorage" />
      
      <h4>Содержимое:</h4>
      <pre>{{ storageContent }}</pre>
    </div>
    
    <div class="debug-section">
      <h3>Навигация</h3>
      <div class="navigation">
        <Button label="На страницу персонажей" @click="goToCharacters" />
        <Button label="На дашборд" @click="goToDashboard" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const apiResult = ref<any>(null)
const storageContent = ref<any>(null)

const authState = computed(() => ({
  store: {
    token: authStore.token,
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated
  },
  localStorage: {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user')
  },
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}))

const loginAsPlayer = async () => {
  try {
    await authStore.login('player@test.com', 'test123')
    apiResult.value = { success: true, message: 'Вход выполнен' }
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}

const loginAsMaster = async () => {
  try {
    await authStore.login('master@test.com', 'test123')
    apiResult.value = { success: true, message: 'Вход выполнен' }
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}

const logout = () => {
  authStore.logout()
  apiResult.value = { success: true, message: 'Выход выполнен' }
}

const testPublicApi = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/characters/data/classes')
    const data = await response.json()
    apiResult.value = {
      status: response.status,
      ok: response.ok,
      data: data
    }
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}

const testProtectedApi = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:3000/api/characters', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await response.json()
    apiResult.value = {
      status: response.status,
      ok: response.ok,
      data: data
    }
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}

const testGetCharacters = async () => {
  try {
    const token = localStorage.getItem('token')
    console.log('Token for request:', token)
    
    const response = await fetch('http://localhost:3000/api/characters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    
    const text = await response.text()
    console.log('Response text:', text)
    
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      data = text
    }
    
    apiResult.value = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: data
    }
  } catch (error) {
    apiResult.value = { error: error.message }
  }
}

const clearStorage = () => {
  localStorage.clear()
  storageContent.value = 'LocalStorage очищен'
}

const showStorage = () => {
  storageContent.value = {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
    all: Object.keys(localStorage).reduce((obj, key) => {
      obj[key] = localStorage.getItem(key)
      return obj
    }, {})
  }
}

const goToCharacters = () => {
  router.push('/characters')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

// При монтировании показываем текущее состояние
showStorage()
</script>

<style scoped>
.debug-auth {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.debug-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.debug-section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.debug-section h4 {
  margin: 16px 0 8px 0;
  color: #4b5563;
}

.actions, .api-tests, .navigation {
  display: flex;
  gap: 10px;
  margin: 16px 0;
  flex-wrap: wrap;
}

pre {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: auto;
  font-size: 14px;
  margin: 8px 0;
}
</style>