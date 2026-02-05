<template>
  <div class="login-page">
    <h2>Вход в систему</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required>
      </div>
      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="password" type="password" required>
      </div>
      <button type="submit">Войти</button>
      <p>
        Нет аккаунта? 
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('player@test.com')
const password = ref('test123')
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  console.log('Login attempt:', email.value)
  
  try {
    const result = await authStore.login(email.value, password.value)
    console.log('Login result:', result)
    
    // Проверяем состояние после логина
    console.log('After login:', {
      isAuthenticated: authStore.isAuthenticated,
      token: authStore.token,
      user: authStore.user,
      localStorageToken: localStorage.getItem('token')
    })
    
    // Если всё ок - переходим
    if (authStore.isAuthenticated) {
      console.log('Navigating to dashboard...')
      router.push('/dashboard')
    }
    
  } catch (error: unknown) {
    console.error('Login error:', error)
    if (error instanceof Error) {
      alert('Ошибка входа: ' + error.message)
    } else {
      alert('Неизвестная ошибка входа')
    }
  }
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}
</style>