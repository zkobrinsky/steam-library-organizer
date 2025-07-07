<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl overflow-hidden hover:shadow-lg dark:hover:shadow-2xl transition-shadow border border-gray-200 dark:border-gray-700">
    <div class="aspect-w-16 aspect-h-9 bg-gray-200 cursor-pointer" @click="openDetails">
      <img 
        :src="gameImageUrl" 
        :alt="game.name"
        class="w-full h-48 object-cover"
        @error="handleImageError"
      />
    </div>
    
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{{ game.name }}</h3>
      
      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span>{{ formatPlaytime(game.playtime_forever) }}</span>
        <span v-if="game.playtime_2weeks" class="text-green-600 dark:text-green-400">
          {{ formatPlaytime(game.playtime_2weeks) }} recent
        </span>
      </div>
      
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="collection in gameCollections" 
            :key="collection.id"
            class="px-2 py-1 text-xs rounded-full text-white"
            :style="{ backgroundColor: collection.color }"
          >
            {{ collection.name }}
          </span>
        </div>
        
        <button 
          @click="toggleCollectionMenu"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Collection Menu -->
    <div v-if="showCollectionMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
      <div class="py-1">
        <button 
          v-for="collection in collections" 
          :key="collection.id"
          @click="toggleGameInCollection(collection.id)"
          class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          :class="{ 'bg-blue-50 text-blue-700': gameCollections.some(c => c.id === collection.id) }"
        >
          {{ collection.name }}
        </button>
      </div>
    </div>
    
    <!-- Game Details Modal -->
    <GameDetailsModal 
      :game="game"
      :is-open="showDetails"
      @close="showDetails = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { SteamGame } from '~/composables/useSteamGames'
import { useCollectionsStore } from '~/stores/collections'

interface Props {
  game: SteamGame
}

const props = defineProps<Props>()
const { getGameImageUrl, formatPlaytime } = useSteamGames()
const collectionsStore = useCollectionsStore()

const showCollectionMenu = ref(false)
const showDetails = ref(false)
const gameImageUrl = ref('')

const collections = computed(() => collectionsStore.collections)
const gameCollections = computed(() => 
  collectionsStore.getCollectionsByGame(props.game.appid)
)

const toggleCollectionMenu = () => {
  showCollectionMenu.value = !showCollectionMenu.value
}

const toggleGameInCollection = (collectionId: string) => {
  const isInCollection = gameCollections.value.some(c => c.id === collectionId)
  
  if (isInCollection) {
    collectionsStore.removeGameFromCollection(collectionId, props.game.appid)
  } else {
    collectionsStore.addGameToCollection(collectionId, props.game.appid)
  }
  
  showCollectionMenu.value = false
}

const handleImageError = () => {
  gameImageUrl.value = '/placeholder-game.jpg'
}

const openDetails = () => {
  showDetails.value = true
}

// Initialize image URL
gameImageUrl.value = getGameImageUrl(props.game, 'header')

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (showCollectionMenu.value && !event.target?.closest('.relative')) {
    showCollectionMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>