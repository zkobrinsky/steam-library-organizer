export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Verify the OpenID response
  if (query['openid.mode'] !== 'id_res') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid OpenID response'
    })
  }
  
  // Verify the signature with Steam
  const verificationParams = new URLSearchParams()
  
  // Copy all openid parameters for verification
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.') && typeof value === 'string') {
      verificationParams.append(key, value)
    }
  }
  
  // Change mode to check_authentication for verification
  verificationParams.set('openid.mode', 'check_authentication')
  
  try {
    const verificationResponse = await $fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: verificationParams.toString()
    })
    
    if (!verificationResponse.includes('is_valid:true')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Steam authentication'
      })
    }
    
    // Extract Steam ID from claimed_id
    const claimedId = query['openid.claimed_id'] as string
    const steamIdMatch = claimedId.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/)
    
    if (!steamIdMatch) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not extract Steam ID'
      })
    }
    
    const steamId = steamIdMatch[1]
    
    // Fetch user information
    const config = useRuntimeConfig()
    const userInfo = await $fetch(`/api/steam/user?steamId=${steamId}`)
    
    // Redirect back to the frontend with user info
    const frontendUrl = query.return_to as string || '/'
    const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo))
    
    return sendRedirect(event, `${frontendUrl}?steamAuth=${userInfoEncoded}`)
    
  } catch (error) {
    console.error('Steam authentication error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Steam authentication failed'
    })
  }
})