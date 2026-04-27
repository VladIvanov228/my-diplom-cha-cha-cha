<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1>📝 Регистрация</h1>
        <p>Создайте аккаунт и начните своё приключение</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">Имя пользователя</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Aragorn"
            required
            :disabled="loading"
            minlength="3"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Минимум 6 символов"
            required
            :disabled="loading"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="validationErrors.length" class="validation-errors">
          <div v-for="(err, i) in validationErrors" :key="i">
            • {{ err }}
          </div>
        </div>

        <button type="submit" class="register-btn" :disabled="loading || !isFormValid">
          <span v-if="!loading">Зарегистрироваться</span>
          <span v-else class="spinner"></span>
        </button>

        <p class="login-link">
          Уже есть аккаунт?
          <router-link to="/login">Войти</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

const validationErrors = computed(() => {
  const errors: string[] = []
  
  if (form.value.username && form.value.username.length < 3) {
    errors.push('Имя пользователя должно содержать минимум 3 символа')
  }
  
  if (form.value.password && form.value.password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов')
  }
  
  if (form.value.password && form.value.confirmPassword && 
      form.value.password !== form.value.confirmPassword) {
    errors.push('Пароли не совпадают')
  }
  
  return errors
})

const isFormValid = computed(() => {
  return form.value.username.length >= 3 &&
         form.value.email.includes('@') &&
         form.value.password.length >= 6 &&
         form.value.password === form.value.confirmPassword
})

const handleRegister = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''

  try {
    await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
    router.push('/campaigns')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  color: #e94560;
  font-size: 28px;
  margin-bottom: 8px;
}

.register-header p {
  color: #a0a0a0;
  font-size: 14px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #e94560;
  background: rgba(255, 255, 255, 0.12);
}

.error-message {
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
  border-radius: 4px;
  color: #f44336;
  font-size: 14px;
}

.validation-errors {
  padding: 12px;
  background: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
  border-radius: 4px;
  color: #ff9800;
  font-size: 13px;
}

.register-btn {
  padding: 14px;
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(233, 69, 96, 0.4);
}

.register-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-link {
  text-align: center;
  color: #a0a0a0;
  font-size: 14px;
  margin-top: 16px;
}

.login-link a {
  color: #e94560;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>