export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  playtime_2weeks?: number
  img_icon_url: string
  img_logo_url: string
  has_community_visible_stats?: boolean
  playtime_windows_forever?: number
  playtime_mac_forever?: number
  playtime_linux_forever?: number
}

export interface SteamGamesResponse {
  game_count: number
  games: SteamGame[]
}

export const useSteamGames = () => {
  const games = ref<SteamGame[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGames = async (steamId?: string) => {
    loading.value = true
    error.value = null
    
    let targetSteamId = steamId
    
    // If no steamId provided, try to get from config
    if (!targetSteamId) {
      const { steamUser } = useSteamConfig()
      targetSteamId = steamUser.value?.steamId
    }
    
    if (!targetSteamId) {
      error.value = 'No Steam ID configured'
      loading.value = false
      return
    }
    
    try {
      const response = await $fetch<SteamGamesResponse>('/api/steam/games', {
        params: { steamId: targetSteamId }
      })
      games.value = response.games
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch games'
    } finally {
      loading.value = false
    }
  }

  const getGameImageUrl = (game: SteamGame, type: 'icon' | 'logo' | 'header' = 'header') => {
    if (type === 'header') {
      return `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`
    }
    const imageHash = type === 'icon' ? game.img_icon_url : game.img_logo_url
    if (!imageHash) return ''
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${imageHash}.jpg`
  }

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 0) {
      return `${remainingMinutes}m`
    } else if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }

  return {
    games: readonly(games),
    loading: readonly(loading),
    error: readonly(error),
    fetchGames,
    getGameImageUrl,
    formatPlaytime
  }
}