// frontend/src/services/api.ts
import axios from 'axios'
import router from '@/router' // Импортируем роутер

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 секунд таймаут
})

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`📤 Request to ${config.url} with token`)
    } else {
      console.log(`📤 Request to ${config.url} without token`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status)
    return response
  },
  async (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Обработка 401 (Unauthorized) и 403 (Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔒 Authentication error, redirecting to login')
      
      // Очищаем аутентификацию
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Перенаправляем на страницу логина, если мы не там уже
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    
    // Обработка 400 (Bad Request) - показываем сообщение
    if (error.response?.status === 400) {
      console.log('⚠️ Bad request:', error.response.data)
    }
    
    // Обработка 500 (Server Error)
    if (error.response?.status === 500) {
      console.log('🔥 Server error')
    }
    
    // Обработка отсутствия сети
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.log('🌐 Network error or timeout')
    }
    
    return Promise.reject(error)
  }
)

export { api }