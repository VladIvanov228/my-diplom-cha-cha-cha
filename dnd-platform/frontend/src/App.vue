<template>
  <div id="app">
    <AppHeader v-if="showHeader" />
    <main :class="{ 'no-header': !showHeader }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/common/AppHeader.vue'

const route = useRoute()
const authStore = useAuthStore()

// Показывать хедер только на авторизованных страницах
const showHeader = computed(() => {
  const publicRoutes = ['/login', '/register', '/debug-auth']
  return authStore.isAuthenticated && !publicRoutes.includes(route.path)
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
  background: #f5f5f5;
  color: #1f2937;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  background: #f5f5f5;
}

main.no-header {
  padding: 0;
}

/* Глобальные стили для PrimeVue */
.p-button {
  border-radius: 6px;
}

.p-button.p-button-success {
  background: #10b981;
  border-color: #10b981;
}

.p-button.p-button-success:hover {
  background: #059669 !important;
  border-color: #059669 !important;
}

.p-button.p-button-danger {
  background: #ef4444;
  border-color: #ef4444;
}

.p-button.p-button-danger:hover {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
}

.p-dialog .p-dialog-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.p-dialog .p-dialog-content {
  padding: 1.5rem;
}

.p-dialog .p-dialog-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.p-inputtext,
.p-inputnumber,
.p-dropdown,
.p-textarea {
  border-radius: 6px;
}

.p-inputtext:focus,
.p-inputnumber:focus,
.p-dropdown:focus,
.p-textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}
</style>