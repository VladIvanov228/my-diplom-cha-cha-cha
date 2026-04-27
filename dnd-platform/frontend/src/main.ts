import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import App from './App.vue'
import router from './router'

import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primevue/resources/primevue.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

// Создаем Pinia и проверяем аутентификацию
const pinia = createPinia()
app.use(pinia)

// Проверяем аутентификацию при запуске
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

app.use(router)
app.use(PrimeVue)
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')

console.log('App started, isAuthenticated:', authStore.isAuthenticated)