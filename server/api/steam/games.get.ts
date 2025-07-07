export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { steamId } = query
  const config = useRuntimeConfig()
  
  const steamApiKey = config.steamApiKey
  
  if (!steamApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Steam API key not configured'
    })
  }

  if (!steamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID is required'
    })
  }

  try {
    const response = await $fetch<any>(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
      {
        params: {
          key: steamApiKey,
          steamid: steamId,
          format: 'json',
          include_appinfo: 1,
          include_played_free_games: 1
        }
      }
    )

    if (!response.response) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No games found or invalid Steam ID'
      })
    }

    return response.response
  } catch (error) {
    console.error('Steam API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch games from Steam API: ${error.message || error}`
    })
  }
})