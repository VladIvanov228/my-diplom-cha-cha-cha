// frontend/src/stores/enemies.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { EnemyTemplate, MapEnemy } from '@/types/campaign'

export const useEnemiesStore = defineStore('enemies', () => {
  const templates = ref<EnemyTemplate[]>([])
  const mapEnemies = ref<MapEnemy[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeMapEnemies = computed(() => 
    mapEnemies.value.filter(e => e.is_alive)
  )

  const enemiesByType = computed(() => {
    const grouped: Record<string, EnemyTemplate[]> = {}
    templates.value.forEach(t => {
      const type = t.type || 'other'
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(t)
    })
    return grouped
  })

  async function fetchTemplates() {
    loading.value = true
    try {
      const response = await api.get('/enemies/templates')
      templates.value = response.data
      console.log('✅ Loaded enemy templates:', templates.value.length)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch templates'
      console.error('❌ Failed to fetch templates:', err)
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(data: Partial<EnemyTemplate>) {
    loading.value = true
    try {
      const response = await api.post('/enemies/templates', data)
      templates.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create template'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTemplate(id: number) {
    loading.value = true
    try {
      await api.delete(`/enemies/templates/${id}`)
      templates.value = templates.value.filter(t => t.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete template'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function placeEnemy(mapId: number, data: Partial<MapEnemy>) {
    loading.value = true
    try {
      const response = await api.post(`/maps/${mapId}/enemies`, data)
      mapEnemies.value.push(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to place enemy'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMapEnemies(mapId: number) {
    loading.value = true
    try {
      const response = await api.get(`/maps/${mapId}/enemies`)
      mapEnemies.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch enemies'
    } finally {
      loading.value = false
    }
  }

  async function updateEnemy(id: number, data: Partial<MapEnemy>) {
    try {
      const response = await api.put(`/maps/enemies/${id}`, data)
      const index = mapEnemies.value.findIndex(e => e.id === id)
      if (index !== -1) {
        mapEnemies.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update enemy'
      throw err
    }
  }

  async function removeEnemy(id: number) {
    try {
      await api.delete(`/maps/enemies/${id}`)
      mapEnemies.value = mapEnemies.value.filter(e => e.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to remove enemy'
      throw err
    }
  }

  return {
    templates,
    mapEnemies,
    loading,
    error,
    activeMapEnemies,
    enemiesByType,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    placeEnemy,
    fetchMapEnemies,
    updateEnemy,
    removeEnemy
  }
})