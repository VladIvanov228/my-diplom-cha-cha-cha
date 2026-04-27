<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <router-link to="/dashboard" class="logo">
          <i class="pi pi-dragon"></i>
          <span class="logo-text">D&D Platform</span>
        </router-link>
      </div>
      
      <nav class="header-nav">
        <router-link to="/dashboard" class="nav-link" :class="{ active: isActive('/dashboard') }">
          <i class="pi pi-home"></i>
          <span>Дашборд</span>
        </router-link>
        <router-link to="/characters" class="nav-link" :class="{ active: isActive('/characters') }">
          <i class="pi pi-users"></i>
          <span>Персонажи</span>
        </router-link>
        <router-link to="/campaigns" class="nav-link" :class="{ active: isActive('/campaigns') }">
          <i class="pi pi-map"></i>
          <span>Кампании</span>
        </router-link>
      </nav>
      
      <div class="header-right">
        <div class="user-menu" ref="userMenuRef">
          <button class="user-button" @click="toggleUserMenu">
            <i class="pi pi-user"></i>
            <span class="username">{{ authStore.user?.username || 'Пользователь' }}</span>
            <i class="pi pi-chevron-down" :class="{ rotated: showUserMenu }"></i>
          </button>
          
          <div v-if="showUserMenu" class="user-dropdown">
            <div class="dropdown-header">
              <div class="user-avatar">
                {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
              </div>
              <div class="user-info">
                <strong>{{ authStore.user?.username }}</strong>
                <span>{{ authStore.user?.email }}</span>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            
            <!-- ИСПОЛЬЗУЕМ @click с навигацией -->
            <div class="dropdown-item" @click="navigateTo('/profile')">
              <i class="pi pi-user"></i>
              <span>Профиль</span>
            </div>
            
            <div class="dropdown-item" @click="navigateTo('/settings')">
              <i class="pi pi-cog"></i>
              <span>Настройки</span>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <button class="dropdown-item logout" @click="handleLogout">
              <i class="pi pi-sign-out"></i>
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showUserMenu" class="menu-overlay" @click="showUserMenu = false"></div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const navigateTo = (path: string) => {
  showUserMenu.value = false
  router.push(path)
}

const handleLogout = () => {
  showUserMenu.value = false
  authStore.logout()
  router.push('/login')
}

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showUserMenu.value) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Стили остаются те же */
.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #1f2937;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo i {
  font-size: 2rem;
  color: #3b82f6;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link i {
  font-size: 1.1rem;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.nav-link.active {
  background: #eff6ff;
  color: #3b82f6;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.user-button i:first-child {
  color: #3b82f6;
}

.username {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-button .pi-chevron-down {
  font-size: 0.9rem;
  color: #9ca3af;
  transition: transform 0.2s;
}

.user-button .pi-chevron-down.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 260px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideDown 0.2s ease;
  z-index: 101;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-info strong {
  color: #1f2937;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info span {
  color: #6b7280;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #374151;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item i {
  color: #6b7280;
  width: 20px;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout i {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav-link span {
    display: none;
  }
  
  .nav-link {
    padding: 10px 14px;
  }
  
  .username {
    display: none;
  }
  
  .user-button {
    padding: 8px 12px;
  }
}
</style>