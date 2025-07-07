<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">🤖 AI Game Recommendations</h2>
      <div class="flex items-center space-x-3">
        <!-- Preferences Controls -->
        <select 
          v-model="preferences.mood"
          @change="refreshRecommendations"
          class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="any">🎯 Surprise me</option>
          <option value="chill">😌 Something chill</option>
          <option value="action">⚡ High energy</option>
          <option value="nostalgia">🕰️ Nostalgia trip</option>
          <option value="discover">🔍 Hidden gems</option>
          <option value="completion">🏆 Time to finish something</option>
          <option value="multiplayer">👥 Social gaming</option>
          <option value="creative">🎨 Creative/building</option>
          <option value="brain">🧠 Mental challenge</option>
          <option value="story">📚 Story-driven</option>
        </select>
        
        <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <input 
            v-model="preferences.skipRecent" 
            @change="refreshRecommendations"
            type="checkbox" 
            class="mr-2"
          >
          Skip recent
        </label>
        
        <button 
          @click="refreshRecommendations"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
        >
          {{ loading ? 'Analyzing...' : (recommendations.length > 0 ? 'Generate More' : 'Get Recommendations') }}
        </button>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Analyzing your gaming patterns...</p>
    </div>
    
    <!-- Gaming Analysis Summary -->
    <div v-if="analysis && !loading" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
      <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-3">📊 Your Gaming Profile</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="text-center">
          <div class="font-semibold text-lg text-blue-600 dark:text-blue-400">{{ analysis.totalGames }}</div>
          <div class="text-gray-600 dark:text-gray-400">Total Games</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-lg text-green-600 dark:text-green-400">{{ analysis.totalPlaytime }}h</div>
          <div class="text-gray-600 dark:text-gray-400">Total Playtime</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-lg text-purple-600 dark:text-purple-400">{{ analysis.categories.unplayed }}</div>
          <div class="text-gray-600 dark:text-gray-400">Unplayed</div>
        </div>
        <div class="text-center">
          <div class="font-semibold text-lg text-orange-600 dark:text-orange-400">{{ analysis.recentActivity.gamesPlayed }}</div>
          <div class="text-gray-600 dark:text-gray-400">Recent Games</div>
        </div>
      </div>
    </div>
    
    <!-- AI Insights -->
    <div v-if="aiInsights && !loading" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
      <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">🤖 AI Insights</h3>
      <p class="text-blue-700 dark:text-blue-200 text-sm">{{ aiInsights }}</p>
    </div>
    
    <!-- Owned Game Recommendations -->
    <div v-if="recommendations.length > 0 && !loading" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎮 From Your Library</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        v-for="rec in recommendations" 
        :key="rec.game.appid"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-xl transition-shadow"
      >
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <img 
              :src="getGameImageUrl(rec.game, 'header')" 
              :alt="rec.game.name"
              class="w-16 h-9 object-cover rounded"
              @error="handleImageError"
            />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-lg">{{ getRecommendationIcon(rec.type) }}</span>
              <h4 class="font-medium text-gray-900 dark:text-white text-sm">{{ rec.title }}</h4>
              <div 
                class="px-2 py-1 rounded-full text-xs text-white"
                :style="{ backgroundColor: getRecommendationColor(rec.type) }"
              >
                {{ Math.round(rec.confidence * 100) }}% match
              </div>
            </div>
            
            <h5 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 truncate">{{ rec.game.name }}</h5>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ rec.reason }}</p>
            
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ formatPlaytime(rec.game.playtime_forever) }} played</span>
              <span v-if="rec.game.playtime_2weeks">
                {{ formatPlaytime(rec.game.playtime_2weeks) }} recent
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    
    <!-- New Game Suggestions -->
    <div v-if="newGameSuggestions.length > 0 && !loading" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛒 New Games to Consider</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="suggestion in newGameSuggestions" 
          :key="suggestion.title"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-xl transition-shadow"
        >
          <div class="mb-3">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{{ suggestion.title }}</h4>
            <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded">{{ suggestion.genre }}</span>
              <span>~{{ suggestion.estimatedHours }}</span>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ suggestion.reason }}</p>
          
          <a 
            :href="`https://store.steampowered.com/search/?term=${encodeURIComponent(suggestion.title)}`"
            target="_blank"
            class="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            View on Steam →
          </a>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="recommendations.length === 0 && !loading && !error" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p class="mb-4">Click "Get Recommendations" to discover what to play next!</p>
      <p class="text-sm">I'll analyze your gaming patterns and suggest games based on your preferences.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SteamGame } from '~/composables/useSteamGames'
import type { RecommendationPreferences } from '~/composables/useRecommendations'

interface Props {
  games: SteamGame[]
}

const props = defineProps<Props>()

const { 
  loading, 
  error, 
  recommendations, 
  newGameSuggestions,
  aiInsights,
  analysis,
  getRecommendations,
  getRecommendationIcon,
  getRecommendationColor 
} = useRecommendations()

const { getGameImageUrl, formatPlaytime } = useSteamGames()

const preferences = ref<RecommendationPreferences>({
  mood: 'any',
  skipRecent: false
})

const refreshRecommendations = async () => {
  if (props.games.length === 0) {
    return
  }
  await getRecommendations(props.games, preferences.value)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-game.jpg'
}

// Auto-generate initial recommendations when games are loaded
watch(() => props.games.length, (newLength) => {
  if (newLength > 0 && recommendations.value.length === 0) {
    refreshRecommendations()
  }
}, { immediate: true })
</script>