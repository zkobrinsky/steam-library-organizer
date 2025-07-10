import type { SteamGame } from './useSteamGames'

export interface GameRecommendation {
  type: 'discover' | 'quick' | 'revisit' | 'second_chance' | 'favorite_type'
  title: string
  game: SteamGame
  reason: string
  confidence: number
}

export interface GamingAnalysis {
  totalGames: number
  totalPlaytime: number
  averagePlaytime: number
  categories: {
    unplayed: number
    shortSessions: number
    mediumSessions: number
    longSessions: number
  }
  recentActivity: {
    gamesPlayed: number
    mostActive: Array<{ name: string; hours: number }>
  }
  favorites: Array<{ name: string; hours: number }>
}

export interface RecommendationPreferences {
  mood?: 'any' | 'chill' | 'action' | 'nostalgia' | 'discover' | 'completion' | 'multiplayer' | 'creative' | 'brain' | 'story'
  skipRecent?: boolean
}

export interface NewGameSuggestion {
  title: string
  reason: string
  genre: string
  estimatedHours: string
}

export interface RecommendationResponse {
  analysis: GamingAnalysis
  recommendations: GameRecommendation[]
  newGameSuggestions: NewGameSuggestion[]
  aiInsights: string
  timestamp: string
}

export const useRecommendations = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const recommendations = ref<GameRecommendation[]>([])
  const newGameSuggestions = ref<NewGameSuggestion[]>([])
  const aiInsights = ref<string>('')
  const analysis = ref<GamingAnalysis | null>(null)

  const getRecommendations = async (games: readonly SteamGame[], preferences: RecommendationPreferences = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<RecommendationResponse>('/api/recommendations', {
        method: 'POST',
        body: {
          games,
          preferences
        }
      })
      
      recommendations.value = response.recommendations
      newGameSuggestions.value = response.newGameSuggestions || []
      aiInsights.value = response.aiInsights || ''
      analysis.value = response.analysis
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get recommendations'
      console.error('Recommendations error:', err)
    } finally {
      loading.value = false
    }
  }

  const getRecommendationIcon = (type: string) => {
    const icons = {
      discover: '🎮',
      quick: '⚡',
      revisit: '🔄',
      second_chance: '💫',
      favorite_type: '⭐'
    }
    return icons[type as keyof typeof icons] || '🎯'
  }

  const getRecommendationColor = (type: string) => {
    const colors = {
      discover: '#10b981',     // green
      quick: '#06b6d4',        // cyan  
      revisit: '#f59e0b',      // amber
      second_chance: '#8b5cf6', // purple
      favorite_type: '#ef4444'  // red
    }
    return colors[type as keyof typeof colors] || '#6b7280'
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    recommendations: readonly(recommendations),
    newGameSuggestions: readonly(newGameSuggestions),
    aiInsights: readonly(aiInsights),
    analysis: readonly(analysis),
    getRecommendations,
    getRecommendationIcon,
    getRecommendationColor
  }
}