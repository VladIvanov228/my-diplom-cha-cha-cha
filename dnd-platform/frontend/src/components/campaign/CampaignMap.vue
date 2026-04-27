<template>
  <div class="campaign-map">
    <div class="map-header">
      <div class="map-controls">
        <div class="tool-selector">
          <button 
            v-for="tool in availableTools" 
            :key="tool.type"
            :class="['tool-btn', { active: currentTool === tool.type }]"
            @click="selectTool(tool.type)"
            :title="tool.label"
          >
            {{ tool.icon }}
          </button>
        </div>
        <div class="map-actions">
          <Button 
            v-if="isDM"
            label="Очистить" 
            icon="pi pi-trash"
            severity="secondary"
            size="small"
            @click="confirmClear"
          />
          <Button 
            v-if="isDM"
            label="Сохранить" 
            icon="pi pi-save"
            severity="primary"
            size="small"
            :loading="saving"
            @click="saveMap"
          />
        </div>
      </div>
      <div class="map-stats">
        <span>Размер: {{ GRID_SIZE }}×{{ GRID_SIZE }}</span>
        <span>Объектов: {{ filledCells }}</span>
        <span v-if="selectedToken" class="selected-info">
          Выбрано: {{ selectedToken.cell.playerName || selectedToken.cell.enemyName || selectedToken.cell.type }}
          <button @click="deselectToken" class="deselect-btn">✕</button>
        </span>
      </div>
    </div>
    
    <div class="map-container" ref="mapContainerRef">
      <canvas 
        ref="canvasRef"
        :width="canvasSize"
        :height="canvasSize"
        @click="handleCanvasClick"
        @contextmenu.prevent="handleRightClick"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
      ></canvas>
      
      <div v-if="hoverCell && !isDragging" class="cell-tooltip" :style="tooltipStyle">
        <div class="tooltip-header">
          {{ hoverCell.x }}, {{ hoverCell.y }}
        </div>
        <div class="tooltip-content">
          {{ getCellDescription(hoverCell) }}
        </div>
      </div>
    </div>
    
    <div class="map-legend">
      <div 
        v-for="item in legendItems" 
        :key="item.type"
        class="legend-item"
        @click="currentTool = item.type"
        :class="{ active: currentTool === item.type }"
      >
        <span class="color-box" :style="{ background: item.color }"></span>
        <span>{{ item.label }}</span>
        <span class="legend-count">{{ getCellCount(item.type) }}</span>
      </div>
    </div>
    
    <Dialog 
      v-model:visible="showEnemyModal" 
      header="Выберите врага"
      modal
      :style="{ width: '500px' }"
    >
      <div v-if="enemyTemplates.length === 0" class="empty-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Загрузка шаблонов врагов...</p>
      </div>
      <div v-else class="enemy-select-list">
        <div 
          v-for="template in enemyTemplates" 
          :key="template.id"
          class="enemy-select-item"
          @click="placeEnemyFromTemplate(template)"
        >
          <div class="enemy-icon">👹</div>
          <div class="enemy-info">
            <strong>{{ template.name }}</strong>
            <span>{{ template.type }} • CR: {{ template.challenge_rating }} • HP: {{ template.hit_points }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showEnemyModal = false" />
      </template>
    </Dialog>

    <Dialog 
      v-model:visible="showPlayerModal" 
      header="Выберите игрока"
      modal
      :style="{ width: '500px' }"
    >
      <div class="player-select-list">
        <div 
          v-for="player in campaignPlayers" 
          :key="player.user_id"
          class="player-select-item"
          @click="placePlayerToken(player)"
        >
          <div class="player-avatar-small">
            {{ player.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="player-info">
            <strong>{{ player.username }}</strong>
            <span v-if="player.character_name">{{ player.character_name }}</span>
            <span v-else class="no-char">Персонаж не выбран</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showPlayerModal = false" />
      </template>
    </Dialog>

    <Dialog 
      v-model:visible="showClearDialog" 
      header="Подтверждение"
      modal
      :style="{ width: '400px' }"
    >
      <p>Вы уверены, что хотите очистить карту? Все изменения будут потеряны.</p>
      <template #footer>
        <Button label="Отмена" severity="secondary" @click="showClearDialog = false" />
        <Button label="Очистить" severity="danger" @click="clearMap" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useCampaignSocket } from '@/composables/useCampaignSocket'
import { useCampaignsStore } from '@/stores/campaigns'
import { useEnemiesStore } from '@/stores/enemies'
import { useAuthStore } from '@/stores/auth'

type ToolType = 'empty' | 'wall' | 'door' | 'player' | 'enemy' | 'bush'

interface MapCell {
  type: ToolType
  enemyTemplateId?: number
  enemyName?: string
  enemyHp?: number
  enemyMaxHp?: number
  enemyAc?: number
  playerAccountId?: number
  playerCharacterId?: number
  playerName?: string
}

interface Tool {
  type: ToolType
  icon: string
  label: string
  dmOnly?: boolean
}

interface SelectedToken {
  key: string
  cell: MapCell
}

const props = defineProps<{
  campaignId: number
  isDM: boolean
  initialMapData?: Record<string, any>
  currentUserId?: number
}>()

const emit = defineEmits<{
  (e: 'map-updated', mapData: Record<string, any>): void
}>()

const toast = useToast()
const campaignsStore = useCampaignsStore()
const enemiesStore = useEnemiesStore()
const authStore = useAuthStore()
const { updateMap } = useCampaignSocket(props.campaignId)

const GRID_SIZE = 20
const CELL_SIZE = 30
const canvasSize = GRID_SIZE * CELL_SIZE

const canvasRef = ref<HTMLCanvasElement>()
const mapContainerRef = ref<HTMLDivElement>()
const currentTool = ref<ToolType>('wall')
const mapCells = ref<Record<string, MapCell>>({})
const saving = ref(false)
const showClearDialog = ref(false)
const showEnemyModal = ref(false)
const showPlayerModal = ref(false)
const hoverCell = ref<{ x: number; y: number; type: string; cell: MapCell | null } | null>(null)
const mousePos = ref({ x: 0, y: 0 })
const selectedToken = ref<SelectedToken | null>(null)
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const selectedEnemyTemplate = ref<any>(null)
const selectedPlayer = ref<any>(null)

const tools: Tool[] = [
  { type: 'wall', icon: '🧱', label: 'Стена' },
  { type: 'door', icon: '🚪', label: 'Дверь' },
  { type: 'bush', icon: '🌿', label: 'Куст' },
  { type: 'player', icon: '👤', label: 'Игрок', dmOnly: true },
  { type: 'enemy', icon: '👹', label: 'Враг', dmOnly: true },
  { type: 'empty', icon: '🧹', label: 'Ластик' }
]

const availableTools = computed(() => {
  if (props.isDM) return tools
  return [
    { type: 'player' as ToolType, icon: '👤', label: 'Мой персонаж' }
  ]
})

const legendItems = [
  { type: 'empty' as ToolType, label: 'Пусто', color: '#2a2a4a' },
  { type: 'wall' as ToolType, label: 'Стена', color: '#4a4a6a' },
  { type: 'door' as ToolType, label: 'Дверь', color: '#8B4513' },
  { type: 'bush' as ToolType, label: 'Куст', color: '#2d5a27' },
  { type: 'player' as ToolType, label: 'Игрок', color: '#4CAF50' },
  { type: 'enemy' as ToolType, label: 'Враг', color: '#f44336' }
]

const colors: Record<ToolType, string> = {
  empty: '#2a2a4a',
  wall: '#4a4a6a',
  door: '#8B4513',
  bush: '#2d5a27',
  player: '#4CAF50',
  enemy: '#f44336'
}

const filledCells = computed(() => Object.keys(mapCells.value).length)
const enemyTemplates = computed(() => enemiesStore.templates)
const campaignPlayers = computed(() => campaignsStore.campaignPlayers)

const tooltipStyle = computed(() => ({
  left: mousePos.value.x + 10 + 'px',
  top: mousePos.value.y + 10 + 'px'
}))

const loadEnemyTemplates = async () => {
  try {
    await enemiesStore.fetchTemplates()
  } catch (err) {
    console.error('Failed to load enemy templates:', err)
  }
}

onMounted(() => {
  if (props.initialMapData) {
    const converted: Record<string, MapCell> = {}
    for (const [key, value] of Object.entries(props.initialMapData)) {
      if (typeof value === 'string') {
        converted[key] = { type: value as ToolType }
      } else if (value && typeof value === 'object') {
        converted[key] = value as MapCell
      }
    }
    mapCells.value = converted
  }
  if (props.isDM) {
    loadEnemyTemplates()
  }
  drawMap()
})

watch(mapCells, () => drawMap(), { deep: true })

watch(() => props.initialMapData, (newData) => {
  if (newData) {
    const converted: Record<string, MapCell> = {}
    for (const [key, value] of Object.entries(newData)) {
      if (typeof value === 'string') {
        converted[key] = { type: value as ToolType }
      } else if (value && typeof value === 'object') {
        converted[key] = value as MapCell
      }
    }
    mapCells.value = converted
  }
}, { deep: true })

function selectTool(tool: ToolType) {
  currentTool.value = tool
  selectedToken.value = null
  selectedEnemyTemplate.value = null
  selectedPlayer.value = null
  
  if (tool === 'enemy' && props.isDM) {
    showEnemyModal.value = true
  } else if (tool === 'player' && props.isDM) {
    showPlayerModal.value = true
  }
}

function drawMap() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.fillStyle = colors.empty
  ctx.fillRect(0, 0, canvasSize, canvasSize)
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`
      const cellData = mapCells.value[key]
      
      if (!cellData) continue
      
      const type = cellData.type
      
      if (type === 'bush') {
        ctx.fillStyle = colors.bush
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
        
        ctx.fillStyle = '#1a4a17'
        const cx = x * CELL_SIZE + CELL_SIZE / 2
        const cy = y * CELL_SIZE + CELL_SIZE / 2
        
        const dots = [
          { dx: -5, dy: -5 },
          { dx: 5, dy: -3 },
          { dx: -2, dy: 3 },
          { dx: 6, dy: 4 },
          { dx: -6, dy: 2 }
        ]
        
        dots.forEach(({ dx, dy }) => {
          ctx.beginPath()
          ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2)
          ctx.fill()
        })
        
        continue
      }
      
      ctx.fillStyle = colors[type] || colors.empty
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
      
      const cx = x * CELL_SIZE + CELL_SIZE / 2
      const cy = y * CELL_SIZE + CELL_SIZE / 2
      
      if (type === 'enemy' && cellData.enemyName) {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cellData.enemyName.charAt(0).toUpperCase(), cx, cy)
      } else if (type === 'player' && cellData.playerName) {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cellData.playerName.charAt(0).toUpperCase(), cx, cy)
      } else {
        const iconMap: Partial<Record<ToolType, string>> = {
          door: '🚪',
          wall: '🧱',
          player: '👤',
          enemy: '👹',
          bush: '🌿'
        }
        const icon = iconMap[type]
        if (icon) {
          ctx.fillStyle = '#fff'
          ctx.font = '20px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(icon, cx, cy)
        }
      }
      
      if (selectedToken.value && selectedToken.value.key === key) {
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
      }
    }
  }
  
  ctx.strokeStyle = '#3a3a5a'
  ctx.lineWidth = 1
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL_SIZE, 0)
    ctx.lineTo(i * CELL_SIZE, canvasSize)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(0, i * CELL_SIZE)
    ctx.lineTo(canvasSize, i * CELL_SIZE)
    ctx.stroke()
  }
}

function getCellCoordinates(event: MouseEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  const x = Math.floor((event.clientX - rect.left) * scaleX / CELL_SIZE)
  const y = Math.floor((event.clientY - rect.top) * scaleY / CELL_SIZE)
  
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null
  
  return { x, y }
}

function handleCanvasClick(event: MouseEvent) {
  if (isDragging.value) {
    isDragging.value = false
    return
  }
  
  const coords = getCellCoordinates(event)
  if (!coords) return
  
  const { x, y } = coords
  const key = `${x},${y}`
  
  // Перемещение выбранного токена
  if (selectedToken.value && !selectedEnemyTemplate.value && !selectedPlayer.value) {
    const targetCell = mapCells.value[key]
    if (!targetCell) {
      mapCells.value[key] = { ...selectedToken.value.cell }
      delete mapCells.value[selectedToken.value.key]
      mapCells.value = { ...mapCells.value }
      selectedToken.value = { key, cell: { ...selectedToken.value.cell } }
      drawMap()
      return
    }
  }
  
  // Режим ластика
  if (currentTool.value === 'empty' && !selectedEnemyTemplate.value && !selectedPlayer.value) {
    const existingCell = mapCells.value[key]
    if (existingCell && (existingCell.type === 'player' || existingCell.type === 'enemy')) {
      selectedToken.value = { key, cell: { ...existingCell } }
      drawMap()
      return
    }
    
    delete mapCells.value[key]
    selectedToken.value = null
    mapCells.value = { ...mapCells.value }
    return
  }
  
  // Размещение врага из шаблона
  if (selectedEnemyTemplate.value && props.isDM) {
    const template = selectedEnemyTemplate.value
    mapCells.value[key] = {
      type: 'enemy',
      enemyTemplateId: template.id,
      enemyName: template.name,
      enemyHp: template.hit_points,
      enemyMaxHp: template.hit_points,
      enemyAc: template.armor_class
    }
    mapCells.value = { ...mapCells.value }
    selectedEnemyTemplate.value = null
    return
  }
  
  // Размещение игрока (DM выбирает конкретного)
  if (selectedPlayer.value && props.isDM) {
    const player = selectedPlayer.value
    
    Object.keys(mapCells.value).forEach(k => {
      const d = mapCells.value[k]
      if (d?.playerAccountId === player.user_id) {
        delete mapCells.value[k]
      }
    })
    
    mapCells.value[key] = {
      type: 'player',
      playerAccountId: player.user_id,
      playerCharacterId: player.character_id ?? undefined,
      playerName: player.character_name || player.username
    }
    mapCells.value = { ...mapCells.value }
    selectedPlayer.value = null
    currentTool.value = 'wall'
    return
  }
  
  // Стены/двери/кусты для DM
  if (props.isDM && ['wall', 'door', 'bush'].includes(currentTool.value)) {
    mapCells.value[key] = { type: currentTool.value as ToolType }
    mapCells.value = { ...mapCells.value }
    return
  }
  
  // Игрок размещает только себя
  if (!props.isDM && currentTool.value === 'player') {
    const myPlayer = campaignPlayers.value.find(p => p.user_id === authStore.user?.id)
    if (myPlayer) {
      Object.keys(mapCells.value).forEach(k => {
        const d = mapCells.value[k]
        if (d?.playerAccountId === myPlayer.user_id) {
          delete mapCells.value[k]
        }
      })
      
      mapCells.value[key] = {
        type: 'player',
        playerAccountId: myPlayer.user_id,
        playerCharacterId: myPlayer.character_id ?? undefined,
        playerName: myPlayer.character_name || myPlayer.username
      }
      mapCells.value = { ...mapCells.value }
    }
    return
  }
}

function handleRightClick(event: MouseEvent) {
  if (!props.isDM) return
  
  const coords = getCellCoordinates(event)
  if (!coords) return
  
  const { x, y } = coords
  const key = `${x},${y}`
  
  delete mapCells.value[key]
  mapCells.value = { ...mapCells.value }
}

function handleMouseDown(event: MouseEvent) {
  const coords = getCellCoordinates(event)
  if (!coords) return
  
  const { x, y } = coords
  const key = `${x},${y}`
  const cell = mapCells.value[key]
  
  if (cell && (cell.type === 'player' || cell.type === 'enemy')) {
    if (cell.type === 'enemy' && !props.isDM) return
    
    isDragging.value = true
    dragStartPos.value = { x, y }
    selectedToken.value = { key, cell: { ...cell } }
  }
}

function handleMouseUp(event: MouseEvent) {
  if (!isDragging.value) return
  
  const coords = getCellCoordinates(event)
  isDragging.value = false
  
  if (!coords || !selectedToken.value) return
  
  const { x, y } = coords
  const newKey = `${x},${y}`
  
  if (newKey !== selectedToken.value.key) {
    const targetCell = mapCells.value[newKey]
    if (!targetCell) {
      mapCells.value[newKey] = { ...selectedToken.value.cell }
      delete mapCells.value[selectedToken.value.key]
      mapCells.value = { ...mapCells.value }
    }
  }
  
  drawMap()
}

function handleMouseMove(event: MouseEvent) {
  const coords = getCellCoordinates(event)
  if (!coords) {
    hoverCell.value = null
    return
  }
  
  const { x, y } = coords
  const key = `${x},${y}`
  const cellData = mapCells.value[key]
  
  hoverCell.value = { 
    x, 
    y, 
    type: cellData?.type || 'empty', 
    cell: cellData || null 
  }
  mousePos.value = { x: event.clientX, y: event.clientY }
}

function handleMouseLeave() {
  hoverCell.value = null
}

function placeEnemyFromTemplate(template: any) {
  showEnemyModal.value = false
  selectedEnemyTemplate.value = template
  currentTool.value = 'enemy'
  
  toast.add({
    severity: 'info',
    summary: 'Враг выбран',
    detail: `Кликните на карту для размещения ${template.name}`,
    life: 3000
  })
}

function placePlayerToken(player: any) {
  showPlayerModal.value = false
  selectedPlayer.value = player
  currentTool.value = 'player'
  
  toast.add({
    severity: 'info',
    summary: 'Игрок выбран',
    detail: `Кликните на карту для размещения ${player.username}`,
    life: 3000
  })
}

function getCellDescription(cell: { x: number; y: number; type: string; cell: MapCell | null }): string {
  if (!cell.cell) return 'Пусто'
  
  const parts: string[] = []
  
  switch (cell.cell.type) {
    case 'wall': parts.push('🧱 Стена'); break
    case 'door': parts.push('🚪 Дверь'); break
    case 'bush': parts.push('🌿 Куст (укрытие)'); break
    case 'player': 
      parts.push(`👤 ${cell.cell.playerName || 'Игрок'}`)
      break
    case 'enemy':
      parts.push(`👹 ${cell.cell.enemyName || 'Враг'}`)
      if (cell.cell.enemyHp !== undefined) {
        parts.push(`HP: ${cell.cell.enemyHp}/${cell.cell.enemyMaxHp}`)
      }
      if (cell.cell.enemyAc) {
        parts.push(`AC: ${cell.cell.enemyAc}`)
      }
      break
  }
  
  return parts.join(' • ')
}

function getCellCount(type: string): number {
  return Object.values(mapCells.value).filter(cell => cell.type === type).length
}

function deselectToken() {
  selectedToken.value = null
  selectedEnemyTemplate.value = null
  selectedPlayer.value = null
  currentTool.value = 'wall'
  drawMap()
}

function confirmClear() {
  showClearDialog.value = true
}

function clearMap() {
  mapCells.value = {}
  selectedToken.value = null
  showClearDialog.value = false
  toast.add({ severity: 'info', summary: 'Карта очищена', life: 2000 })
}

async function saveMap() {
  if (!props.isDM) return
  saving.value = true
  try {
    updateMap(mapCells.value as any)
    emit('map-updated', mapCells.value as any)
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Карта сохранена', life: 3000 })
  } catch (error) {
    console.error('Failed to save map:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось сохранить карту', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.campaign-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.map-header { margin-bottom: 16px; }

.map-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tool-selector { display: flex; gap: 8px; }

.tool-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #0f3460;
  border-radius: 8px;
  background: #16213e;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  border-color: #e94560;
  transform: scale(1.05);
}

.tool-btn.active {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.2);
  box-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
}

.map-actions { display: flex; gap: 8px; }

.map-stats {
  display: flex;
  gap: 16px;
  color: #888;
  font-size: 12px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FFD700;
  font-weight: 600;
}

.deselect-btn {
  background: none;
  border: 1px solid #FFD700;
  color: #FFD700;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 6px;
}

.deselect-btn:hover { background: rgba(255, 215, 0, 0.2); }

.map-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  overflow: auto;
  background: #0f0f1a;
  border-radius: 8px;
  padding: 16px;
}

canvas {
  border: 2px solid #0f3460;
  border-radius: 4px;
  cursor: crosshair;
}

.cell-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  border: 1px solid #e94560;
}

.tooltip-header {
  font-weight: bold;
  color: #e94560;
  margin-bottom: 4px;
}

.tooltip-content { color: #ccc; }

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.legend-item:hover { background: rgba(233, 69, 96, 0.1); }
.legend-item.active {
  background: rgba(233, 69, 96, 0.2);
  box-shadow: 0 0 8px rgba(233, 69, 96, 0.3);
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #0f3460;
}

.legend-count {
  margin-left: 4px;
  padding: 2px 6px;
  background: #0f3460;
  border-radius: 10px;
  font-size: 11px;
  color: #ccc;
}

.enemy-select-list,
.player-select-list {
  max-height: 400px;
  overflow-y: auto;
}

.enemy-select-item,
.player-select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.enemy-select-item:hover,
.player-select-item:hover { background: #f3f4f6; }

.enemy-icon { font-size: 2rem; }

.enemy-info,
.player-info {
  display: flex;
  flex-direction: column;
}

.enemy-info strong,
.player-info strong { color: #1f2937; }

.enemy-info span,
.player-info span {
  font-size: 0.85rem;
  color: #6b7280;
}

.no-char { color: #f59e0b !important; }

.player-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
  gap: 12px;
}
</style>