<template>
  <div class="register-page">
    <h2>Регистрация</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required>
      </div>
      <div class="form-group">
        <label>Имя пользователя:</label>
        <input v-model="username" type="text" required>
      </div>
      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="password" type="password" required>
      </div>
      <div class="form-group">
        <label>Повторите пароль:</label>
        <input v-model="confirmPassword" type="password" required>
      </div>
      <button type="submit">Зарегистрироваться</button>
      <p>
        Уже есть аккаунт? 
        <router-link to="/login">Войти</router-link>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

const handleRegister = () => {
  console.log('Register attempt:', { email: email.value, username: username.value })
  // Временная заглушка - переходим на дашборд
  router.push('/dashboard')
}
</script>

<style scoped>
.register-page {
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