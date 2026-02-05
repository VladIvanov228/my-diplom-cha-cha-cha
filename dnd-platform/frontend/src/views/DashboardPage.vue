<template>
  <div class="dashboard-page">
    <h1>Дашборд</h1>
    <div v-if="authStore.user">
      <p>Добро пожаловать, <strong>{{ authStore.user.username }}</strong>!</p>
      <p>Email: {{ authStore.user.email }}</p>
      <p>Роль: {{ authStore.user.role }}</p>
    </div>
    <div class="stats">
      <div class="stat-card">
        <h3>Кампании</h3>
        <p>0</p>
      </div>
      <div class="stat-card">
        <h3>Персонажи</h3>
        <p>0</p>
      </div>
      <div class="stat-card">
        <h3>Активные сессии</h3>
        <p>0</p>
      </div>
    </div>
    
    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
      <h3>Отладка</h3>
      <button @click="checkAuth">Проверить состояние аутентификации</button>
      <button @click="forceRedirect" style="margin-left: 10px;">Принудительный редирект</button>
      <pre style="margin-top: 10px; background: white; padding: 10px; border-radius: 4px;">
{{ debugInfo }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const debugInfo = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  token: authStore.token ? 'Present' : 'None',
  localStorageToken: localStorage.getItem('token'),
  localStorageUser: localStorage.getItem('user')
}))

const checkAuth = () => {
  console.log('Checking auth:', debugInfo.value)
  alert('Информация в консоли')
}

const forceRedirect = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.dashboard-page {
  padding: 2rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  color: #42b983;
  margin: 0;
}
</style>