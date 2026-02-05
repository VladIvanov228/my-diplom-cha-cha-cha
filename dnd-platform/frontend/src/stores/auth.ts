
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import axios from 'axios'

interface User {
  id: number
  email: string
  username: string
  role: 'player' | 'master' | 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Восстановление из localStorage при инициализации
  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
        
        // Устанавливаем заголовок для всех будущих запросов
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        
        console.log('✅ Auth restored from localStorage:', {
          user: user.value,
          token: token.value,
          isAuthenticated: isAuthenticated.value
        })
      } catch (e) {
        console.error('❌ Error parsing stored auth data:', e)
        clearAuth()
      }
    } else {
      console.log('No auth data in localStorage')
    }
  }

  const login = async (email: string, password: string) => {
  console.log('AuthStore: login called with', email)
  isLoading.value = true
  error.value = null
  
  try {
    console.log('📤 Sending login request...')
    
    // РЕАЛЬНЫЙ ЗАПРОС К API
    const response = await api.post('/auth/login', { 
      email: email.trim(), 
      password: password.trim() 
    })
    
    console.log('✅ Login response:', response.data)
    
    // Обновляем состояние
    const { user: userData, token: tokenData } = response.data
    
    user.value = userData
    token.value = tokenData
    isAuthenticated.value = true
    
    // Устанавливаем заголовок авторизации для api
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`
    
    // Сохраняем в localStorage
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    
    console.log('✅ AuthStore: login successful', {
      user: user.value,
      token: token.value?.substring(0, 20) + '...',
      isAuthenticated: isAuthenticated.value
    })
    
    return response.data
  } catch (err: unknown) {
    // ПРАВИЛЬНАЯ обработка ошибок TypeScript
    if (axios.isAxiosError(err)) {
      error.value = err.response?.data?.error || 'Ошибка авторизации'
      console.error('❌ AuthStore: login error (axios)', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      })
    } else if (err instanceof Error) {
      error.value = err.message
      console.error('❌ AuthStore: login error (Error)', err.message)
    } else {
      error.value = 'Неизвестная ошибка'
      console.error('❌ AuthStore: login error (unknown)', err)
    }
    throw err
  } finally {
    isLoading.value = false
  }
}

  const register = async (email: string, username: string, password: string) => {
    console.log('AuthStore: register called', { email, username })
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/register', { email, username, password })
      const { user: userData, token: tokenData } = response.data
      
      console.log('Register response:', response.data)
      
      // Обновляем состояние
      user.value = userData
      token.value = tokenData
      isAuthenticated.value = true
      
      // Устанавливаем заголовок авторизации
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`
      
      // Сохраняем в localStorage
      localStorage.setItem('token', tokenData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('✅ AuthStore: register successful', {
        user: user.value,
        token: token.value,
        isAuthenticated: isAuthenticated.value
      })
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Ошибка регистрации'
      console.error('❌ AuthStore: register error', err.response?.data || err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    console.log('AuthStore: logout called')
    
    // Очищаем состояние
    user.value = null
    token.value = null
    isAuthenticated.value = false
    error.value = null
    
    // Удаляем заголовок авторизации
    delete api.defaults.headers.common['Authorization']
    
    // Очищаем localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    console.log('✅ AuthStore: logout successful')
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false
    error.value = null
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const clearError = () => {
    error.value = null
  }

  // Инициализируем при создании store
  initAuth()

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    clearAuth,
    clearError
  }
})
