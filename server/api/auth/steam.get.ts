export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Steam OpenID authentication endpoint
  const steamOpenIdUrl = 'https://steamcommunity.com/openid/login'
  
  // Get the current URL to build return URL
  const headers = getHeaders(event)
  const protocol = headers['x-forwarded-proto'] || 'http'
  const host = headers.host
  const returnUrl = `${protocol}://${host}/api/auth/steam/callback`
  
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': `${protocol}://${host}`,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  })
  
  const redirectUrl = `${steamOpenIdUrl}?${params.toString()}`
  
  // Redirect to Steam login
  return sendRedirect(event, redirectUrl)
})