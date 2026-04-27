// frontend/src/composables/useAuth.ts
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()

  const user = computed(() => store.user)
  const isAuthenticated = computed(() => store.isAuthenticated)
  const isDM = computed(() => store.isDM)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)

  const login = async (email: string, password: string) => {
    try {
      await store.login(email, password)
      router.push('/dashboard')
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    store.logout()
    router.push('/login')
  }

  const register = async (data: any) => {
    try {
      await store.register(data)
      router.push('/dashboard')
      return true
    } catch {
      return false
    }
  }

  return {
    user,
    isAuthenticated,
    isDM,
    loading,
    error,
    login,
    logout,
    register,
    clearError: store.clearError
  }
}