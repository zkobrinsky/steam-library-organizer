<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
        <input 
          v-model="localFilters.search"
          type="text"
          placeholder="Search games..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
      </div>
      
      <!-- Playtime Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Playtime</label>
        <select 
          v-model="localFilters.playtime"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All games</option>
          <option value="unplayed">Unplayed</option>
          <option value="under1h">Under 1 hour</option>
          <option value="1-10h">1-10 hours</option>
          <option value="10-50h">10-50 hours</option>
          <option value="50-100h">50-100 hours</option>
          <option value="over100h">Over 100 hours</option>
        </select>
      </div>
      
      <!-- Recently Played -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Activity</label>
        <select 
          v-model="localFilters.recentActivity"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All games</option>
          <option value="recent">Recently played</option>
          <option value="not-recent">Not recently played</option>
        </select>
      </div>
      
      <!-- Collection Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection</label>
        <select 
          v-model="localFilters.collection"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All collections</option>
          <option value="uncategorized">Uncategorized</option>
          <optgroup label="Smart Collections">
            <option 
              v-for="collection in allCollections.filter(c => c.id.startsWith('auto-'))" 
              :key="collection.id"
              :value="collection.id"
            >
              {{ collection.icon }} {{ collection.name }} ({{ collection.count }})
            </option>
          </optgroup>
          <optgroup v-if="customCollections.length > 0" label="Custom Collections">
            <option 
              v-for="collection in customCollections" 
              :key="collection.id"
              :value="collection.id"
            >
              📁 {{ collection.name }} ({{ collection.gameIds.length }})
            </option>
          </optgroup>
        </select>
      </div>
    </div>
    
    <div class="mt-4 flex items-center justify-between">
      <!-- Sort Options -->
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
        <select 
          v-model="localFilters.sortBy"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Name</option>
          <option value="playtime">Playtime</option>
          <option value="recent">Recently played</option>
        </select>
        
        <button 
          @click="toggleSortOrder"
          class="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors"
        >
          {{ localFilters.sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
      
      <!-- Clear Filters -->
      <button 
        @click="clearFilters"
        class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors text-sm"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCollectionsStore } from '~/stores/collections'
import type { SteamGame } from '~/composables/useSteamGames'

export interface GameFilters {
  search: string
  playtime: string
  recentActivity: string
  collection: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface Props {
  filters: GameFilters
  games: readonly SteamGame[]
}

interface Emits {
  (e: 'update:filters', filters: GameFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const collectionsStore = useCollectionsStore()

const localFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

const allCollections = computed(() => {
  if (props.games.length === 0) return []
  return collectionsStore.getAllCollections(props.games)
})
const customCollections = computed(() => collectionsStore.collections)

const toggleSortOrder = () => {
  localFilters.value = {
    ...localFilters.value,
    sortOrder: localFilters.value.sortOrder === 'asc' ? 'desc' : 'asc'
  }
}

const clearFilters = () => {
  localFilters.value = {
    search: '',
    playtime: '',
    recentActivity: '',
    collection: '',
    sortBy: 'name',
    sortOrder: 'asc'
  }
}

// Watch for sortBy changes to set default sort order
watch(() => localFilters.value.sortBy, (newSortBy) => {
  if (newSortBy === 'recent' || newSortBy === 'playtime') {
    localFilters.value = {
      ...localFilters.value,
      sortOrder: 'desc'
    }
  }
})

// Watch for changes and emit updates
watch(localFilters, (newFilters) => {
  emit('update:filters', newFilters)
}, { deep: true })
</script>