import type { SteamGame } from '~/composables/useSteamGames'

export interface AutoCollection {
  id: string
  name: string
  description: string
  color: string
  icon: string
  games: readonly SteamGame[]
  count: number
}

export const useAutoCollections = () => {
  const getAutoCollections = (games: readonly SteamGame[]): AutoCollection[] => {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    // Convert timestamps to dates for comparison
    const getLastPlayedDate = (game: SteamGame) => {
      // Steam uses Unix timestamps, but some games have rtime_last_played
      // For now, we'll use playtime_2weeks as a proxy for recent activity
      return game.playtime_2weeks && game.playtime_2weeks > 0 ? new Date() : sixMonthsAgo
    }

    const collections: AutoCollection[] = []

    // Untouched - 0 playtime
    const untouchedGames = games.filter(game => game.playtime_forever === 0)
    collections.push({
      id: 'auto-untouched',
      name: 'Untouched',
      description: 'Games you\'ve never played',
      color: '#6b7280',
      icon: '🎮',
      games: untouchedGames,
      count: untouchedGames.length
    })

    // Abandoned - Low playtime (< 2 hours) + not played recently
    const abandonedGames = games.filter(game => {
      const hoursPlayed = game.playtime_forever / 60
      const hasRecentActivity = game.playtime_2weeks && game.playtime_2weeks > 0
      return hoursPlayed > 0 && hoursPlayed < 2 && !hasRecentActivity
    })
    collections.push({
      id: 'auto-abandoned',
      name: 'Abandoned',
      description: 'Games with little playtime that haven\'t been touched recently',
      color: '#ef4444',
      icon: '💀',
      games: abandonedGames,
      count: abandonedGames.length
    })

    // Binge-worthy - High recent activity
    const bingeGames = games.filter(game => {
      const recentHours = (game.playtime_2weeks || 0) / 60
      return recentHours >= 5 // 5+ hours in last 2 weeks
    })
    collections.push({
      id: 'auto-binge',
      name: 'Binge-worthy',
      description: 'Games you\'ve been playing a lot recently',
      color: '#10b981',
      icon: '🔥',
      games: bingeGames,
      count: bingeGames.length
    })

    // Completionist - Very high playtime (100+ hours)
    const completionistGames = games.filter(game => {
      const hoursPlayed = game.playtime_forever / 60
      return hoursPlayed >= 100
    })
    collections.push({
      id: 'auto-completionist',
      name: 'Completionist',
      description: 'Games with 100+ hours of playtime',
      color: '#8b5cf6',
      icon: '👑',
      games: completionistGames,
      count: completionistGames.length
    })

    // Worth Revisiting - Moderate playtime (5-50 hours) with good engagement
    const worthRevisitingGames = games.filter(game => {
      const hoursPlayed = game.playtime_forever / 60
      return hoursPlayed >= 5 && hoursPlayed <= 50
    })
    collections.push({
      id: 'auto-worth-revisiting',
      name: 'Worth Revisiting',
      description: 'Games with solid playtime that deserve more attention',
      color: '#f59e0b',
      icon: '🔄',
      games: worthRevisitingGames,
      count: worthRevisitingGames.length
    })

    // Quick Sessions - Games with low individual playtime but multiple sessions
    const quickSessionGames = games.filter(game => {
      const hoursPlayed = game.playtime_forever / 60
      return hoursPlayed >= 1 && hoursPlayed <= 10
    })
    collections.push({
      id: 'auto-quick-sessions',
      name: 'Quick Sessions',
      description: 'Perfect for short gaming sessions',
      color: '#06b6d4',
      icon: '⚡',
      games: quickSessionGames,
      count: quickSessionGames.length
    })

    // Filter out empty collections
    return collections.filter(collection => collection.count > 0)
  }

  const getGamesInAutoCollection = (collectionId: string, games: readonly SteamGame[]): readonly SteamGame[] => {
    const collections = getAutoCollections(games)
    const collection = collections.find(c => c.id === collectionId)
    return collection?.games || []
  }

  return {
    getAutoCollections,
    getGamesInAutoCollection
  }
}