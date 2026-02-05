<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>🎲 Вход в D&D Platform</h2>
        <p>Войдите в свою учетную запись</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="your@email.com"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="••••••••"
          >
        </div>
        
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
      
      <div class="login-footer">
        <p>Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
        <p>Или войдите как <a href="#" @click.prevent="useTestAccount">тестовый пользователь</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}

const useTestAccount = () => {
  email.value = 'test@example.com'
  password.value = 'test123'
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #64ffda;
  box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.2);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.login-btn {
  background: linear-gradient(135deg, #64ffda 0%, #00b8a9 100%);
  color: #1a1a2e;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-top: 1rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(100, 255, 218, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(255, 65, 108, 0.2);
  color: #ff416c;
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 65, 108, 0.3);
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.login-footer a {
  color: #64ffda;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>