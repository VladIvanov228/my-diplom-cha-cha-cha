import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginPage = () => import('@/views/LoginPage.vue')
const RegisterPage = () => import('@/views/RegisterPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const CharactersPage = () => import('@/views/CharactersPage.vue')
const CampaignsPage = () => import('@/views/CampaignsPage.vue')
const CharacterView = () => import('@/views/CharacterView.vue')
const CharacterEdit = () => import('@/views/CharacterEdit.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/characters',
      name: 'characters',
      component: CharactersPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: CampaignsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/character/:id',
      name: 'cequeharacter',
      component: CharacterView,
      meta: { requiresAuth: true }
    },
    {
      path: '/character/:id/edit',
      name: 'character-edit',
      component: CharacterEdit,
      meta: { requiresAuth: true }
    },
    {
      path: '/debug-auth',
      name: 'debug-auth',
      component: () => import('@/views/DebugAuth.vue')
    },
    {
      path: '/character/equipment',
      name: 'equipment',
      component: () => import('@/components/character/InventoryManager.vue')
    }
  ]
})

// Навигационный guard
router.beforeEach((to, from, next) => {
  console.log('=== NAVIGATION GUARD ===')
  console.log('From:', from.path)
  console.log('To:', to.path)
  console.log('Requires Auth:', to.meta.requiresAuth)
  
  const authStore = useAuthStore()
  
  // Проверяем актуальное состояние
  const isAuthenticated = authStore.isAuthenticated && !!authStore.token
  
  console.log('Auth status:', {
    isAuthenticated,
    token: authStore.token,
    user: authStore.user,
    localStorageToken: localStorage.getItem('token')
  })
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Access denied: requires auth, redirecting to login')
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    console.log('Access denied: requires guest, redirecting to dashboard')
    next('/dashboard')
  } else {
    console.log('Access granted')
    next()
  }
})

export default router