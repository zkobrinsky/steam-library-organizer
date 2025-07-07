<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="relative">
        <img 
          :src="getGameImageUrl(game, 'header')" 
          :alt="game.name"
          class="w-full h-48 object-cover rounded-t-lg"
          @error="handleImageError"
        />
        <button 
          @click="$emit('close')"
          class="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Game Title -->
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ game.name }}</h2>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ formatPlaytime(game.playtime_forever) }}</div>
            <div class="text-sm text-gray-600">Total Playtime</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ game.playtime_2weeks ? formatPlaytime(game.playtime_2weeks) : '0m' }}
            </div>
            <div class="text-sm text-gray-600">Last 2 Weeks</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{ gameCollections.length }}
            </div>
            <div class="text-sm text-gray-600">Collections</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{ game.has_community_visible_stats ? '✓' : '✗' }}
            </div>
            <div class="text-sm text-gray-600">Stats Available</div>
          </div>
        </div>
        
        <!-- Platform Breakdown -->
        <div v-if="hasPlatformData" class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Platform Playtime</h3>
          <div class="space-y-2">
            <div v-if="game.playtime_windows_forever" class="flex items-center justify-between">
              <span class="flex items-center">
                <span class="mr-2">🪟</span> Windows
              </span>
              <span class="font-medium">{{ formatPlaytime(game.playtime_windows_forever) }}</span>
            </div>
            <div v-if="game.playtime_mac_forever" class="flex items-center justify-between">
              <span class="flex items-center">
                <span class="mr-2">🍎</span> macOS
              </span>
              <span class="font-medium">{{ formatPlaytime(game.playtime_mac_forever) }}</span>
            </div>
            <div v-if="game.playtime_linux_forever" class="flex items-center justify-between">
              <span class="flex items-center">
                <span class="mr-2">🐧</span> Linux
              </span>
              <span class="font-medium">{{ formatPlaytime(game.playtime_linux_forever) }}</span>
            </div>
            <div v-if="game.playtime_deck_forever" class="flex items-center justify-between">
              <span class="flex items-center">
                <span class="mr-2">🎮</span> Steam Deck
              </span>
              <span class="font-medium">{{ formatPlaytime(game.playtime_deck_forever) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Collections -->
        <div v-if="gameCollections.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Collections</h3>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="collection in gameCollections" 
              :key="collection.id"
              class="px-3 py-1 rounded-full text-sm text-white"
              :style="{ backgroundColor: collection.color }"
            >
              {{ collection.name }}
            </span>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="flex space-x-3">
          <a 
            :href="`steam://run/${game.appid}`"
            class="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🎮 Launch Game
          </a>
          <a 
            :href="`https://store.steampowered.com/app/${game.appid}`"
            target="_blank"
            class="flex-1 bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            🛒 Store Page
          </a>
        </div>
        
        <!-- Gaming Analysis -->
        <div class="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">Game Analysis</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Category:</span>
              <span class="font-medium">{{ getGameCategory() }}</span>
            </div>
            <div class="flex justify-between">
              <span>Engagement Level:</span>
              <span class="font-medium">{{ getEngagementLevel() }}</span>
            </div>
            <div class="flex justify-between">
              <span>Recent Activity:</span>
              <span class="font-medium">{{ getRecentActivity() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SteamGame } from '~/composables/useSteamGames'
import { useCollectionsStore } from '~/stores/collections'

interface Props {
  game: SteamGame
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getGameImageUrl, formatPlaytime } = useSteamGames()
const collectionsStore = useCollectionsStore()

const gameCollections = computed(() => 
  collectionsStore.getCollectionsByGame(props.game.appid)
)

const hasPlatformData = computed(() => 
  props.game.playtime_windows_forever || 
  props.game.playtime_mac_forever || 
  props.game.playtime_linux_forever || 
  props.game.playtime_deck_forever
)

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-game.jpg'
}

const getGameCategory = () => {
  const hours = props.game.playtime_forever / 60
  if (hours === 0) return 'Unplayed'
  if (hours < 2) return 'Barely Touched'
  if (hours < 10) return 'Short Session'
  if (hours < 50) return 'Moderate Play'
  if (hours < 100) return 'Well Played'
  return 'Heavily Played'
}

const getEngagementLevel = () => {
  const hours = props.game.playtime_forever / 60
  const recent = (props.game.playtime_2weeks || 0) / 60
  
  if (hours === 0) return 'Never Played'
  if (recent > 0) return 'Currently Active'
  if (hours > 20) return 'Invested'
  if (hours > 5) return 'Engaged'
  return 'Limited'
}

const getRecentActivity = () => {
  const recent = (props.game.playtime_2weeks || 0) / 60
  if (recent === 0) return 'None'
  if (recent < 1) return 'Light'
  if (recent < 5) return 'Moderate'
  return 'Heavy'
}

// Close modal on Escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close')
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>