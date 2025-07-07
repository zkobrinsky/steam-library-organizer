interface SteamUser {
  steamId: string
  displayName?: string
  avatarUrl?: string
  profileUrl?: string
}

export const useSteamConfig = () => {
  const steamUser = ref<SteamUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isConfigured = computed(() => !!steamUser.value?.steamId)

  // Load from localStorage on mount
  const loadConfig = () => {
    if (process.client) {
      const saved = localStorage.getItem('steamConfig')
      if (saved) {
        try {
          steamUser.value = JSON.parse(saved)
        } catch (error) {
          console.error('Failed to parse saved Steam config:', error)
          localStorage.removeItem('steamConfig')
        }
      }
    }
  }

  // Save to localStorage
  const saveConfig = (user: SteamUser) => {
    steamUser.value = user
    if (process.client) {
      localStorage.setItem('steamConfig', JSON.stringify(user))
    }
  }

  // Clear configuration
  const clearConfig = () => {
    steamUser.value = null
    if (process.client) {
      localStorage.removeItem('steamConfig')
    }
  }

  // Validate Steam ID format
  const isValidSteamId = (steamId: string): boolean => {
    // Steam ID64 format: 17-digit number starting with 7656119
    const steamId64Regex = /^7656119\d{10}$/
    return steamId64Regex.test(steamId)
  }

  // Extract Steam ID from various input formats
  const extractSteamId = (input: string): string | null => {
    const trimmed = input.trim()
    
    // Direct Steam ID64
    if (isValidSteamId(trimmed)) {
      return trimmed
    }
    
    // Steam profile URL patterns
    const urlPatterns = [
      /steamcommunity\.com\/profiles\/(\d+)/,
      /steamcommunity\.com\/id\/([^/]+)/
    ]
    
    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        if (pattern.source.includes('profiles')) {
          // Direct ID from profile URL
          return isValidSteamId(match[1]) ? match[1] : null
        } else {
          // Custom URL - will need to resolve via Steam API
          return match[1]
        }
      }
    }
    
    // Assume it's a custom URL/username
    return trimmed
  }

  // Configure Steam user from input
  const configureSteamUser = async (input: string) => {
    loading.value = true
    error.value = null
    
    try {
      const extracted = extractSteamId(input)
      if (!extracted) {
        throw new Error('Invalid Steam ID or username format')
      }
      
      let steamId = extracted
      
      // If it's not a valid Steam ID64, try to resolve it as a vanity URL
      if (!isValidSteamId(extracted)) {
        const resolveResponse = await $fetch<{ success: boolean; steamId: string }>('/api/steam/resolve', {
          params: { vanityurl: extracted }
        })
        steamId = resolveResponse.steamId
      }
      
      // Get user profile information
      const userInfo = await $fetch<SteamUser>('/api/steam/user', {
        params: { steamId }
      })
      
      saveConfig(userInfo)
      return userInfo
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to configure Steam user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    steamUser: readonly(steamUser),
    loading: readonly(loading),
    error: readonly(error),
    isConfigured,
    loadConfig,
    saveConfig,
    clearConfig,
    isValidSteamId,
    extractSteamId,
    configureSteamUser
  }
}