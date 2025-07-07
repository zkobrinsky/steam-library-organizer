export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { vanityurl } = query
  const config = useRuntimeConfig()
  
  const steamApiKey = config.steamApiKey
  
  if (!steamApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Steam API key not configured'
    })
  }

  if (!vanityurl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vanity URL is required'
    })
  }

  try {
    const response = await $fetch<any>(
      `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
      {
        params: {
          key: steamApiKey,
          vanityurl: vanityurl,
          url_type: 1, // Profile
          format: 'json'
        }
      }
    )

    if (response.response?.success === 1) {
      return {
        success: true,
        steamId: response.response.steamid
      }
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: 'Steam vanity URL not found'
      })
    }
  } catch (error) {
    console.error('Steam vanity URL resolution error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resolve Steam vanity URL'
    })
  }
})