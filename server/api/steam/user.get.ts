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
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`,
      {
        params: {
          key: steamApiKey,
          steamids: steamId,
          format: 'json'
        }
      }
    )

    if (!response.response?.players?.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Steam user not found'
      })
    }

    const player = response.response.players[0]
    return {
      steamId: player.steamid,
      displayName: player.personaname,
      realName: player.realname || null,
      avatarUrl: player.avatarfull || player.avatarmedium || player.avatar,
      profileUrl: player.profileurl,
      profileState: player.profilestate,
      visibility: player.communityvisibilitystate,
      lastLogoff: player.lastlogoff ? new Date(player.lastlogoff * 1000).toISOString() : null,
      location: player.loccountrycode || null
    }
  } catch (error) {
    console.error('Steam user lookup error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch Steam user information'
    })
  }
})