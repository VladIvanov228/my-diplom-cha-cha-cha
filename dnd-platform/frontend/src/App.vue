<template>
  <div id="app">
    <nav v-if="showNav" class="navbar">
      <div class="nav-brand">
        <h2>D&D Platform</h2>
        <small v-if="authStore.user">({{ authStore.user.username }})</small>
      </div>
      <div class="nav-links">
        <router-link to="/dashboard">Дашборд</router-link>
        <router-link to="/characters">Персонажи</router-link>
        <router-link to="/campaigns">Кампании</router-link>
        <button @click="logout">Выйти</button>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
    
    <!-- Отладочная информация -->
    <div v-if="showDebug" style="position: fixed; bottom: 10px; right: 10px; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
      <div>Auth: {{ authStore.isAuthenticated ? '✅' : '❌' }}</div>
      <div>User: {{ authStore.user?.username || 'None' }}</div>
      <div>Token: {{ authStore.token ? 'Present' : 'None' }}</div>
      <button @click="showDebug = !showDebug" style="margin-top: 5px; font-size: 10px;">Toggle Debug</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showDebug = ref(true)

// Показывать навигацию только на авторизованных страницах
const showNav = computed(() => {
  return authStore.isAuthenticated && !['/login', '/register'].includes(route.path)
})

const logout = () => {
  console.log('App: logout called')
  authStore.logout()
  router.push('/login')
}

// Логируем состояние при монтировании
console.log('App mounted:', {
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  currentRoute: route.path
})
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand h2 {
  margin: 0;
  color: #42b983;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: #ecf0f1;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-links a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #42b983;
}

.nav-links a.router-link-active {
  background-color: rgba(66, 185, 131, 0.2);
  color: #42b983;
}

.nav-links button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.nav-links button:hover {
  background: #c0392b;
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  main {
    padding: 1rem;
  }
}
</style>