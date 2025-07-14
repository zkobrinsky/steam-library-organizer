import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, games, chatHistory } = body
  
  if (!message || typeof message !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is required'
    })
  }
  
  if (!games || !Array.isArray(games)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Games array is required'
    })
  }

  const config = useRuntimeConfig()
  
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    })
  }

  try {
    const openai = new OpenAI({
      apiKey: config.openaiApiKey
    })
    
    // Analyze the user's gaming library
    const libraryAnalysis = await analyzeGameLibrary(games)
    
    // Build context about their games
    const gameContext = buildGameContext(games, libraryAnalysis)
    
    // Create chat messages with game context
    const chatMessages = buildChatMessages(message, gameContext, chatHistory)
    
    const modelToUse = config.openaiFinetunedModel || 'gpt-4o-mini'
    
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: chatMessages,
      max_tokens: 150,
      temperature: 0.7
    })

    const responseContent = response.choices[0]?.message?.content?.trim()
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    return {
      message: responseContent,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Chat error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to process chat: ${error.message || error}`
    })
  }
})

async function analyzeGameLibrary(games: any[]) {
  const totalGames = games.length
  const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0)
  
  // Calculate collection value
  const collectionValue = await calculateCollectionValue(games)
  
  // Top games by playtime
  const topGames = games
    .filter(g => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 10)
  
  // Recently played games
  const recentGames = games
    .filter(g => g.playtime_2weeks && g.playtime_2weeks > 0)
    .sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0))
    .slice(0, 5)
  
  // Categorize games more intelligently
  const unplayed = games.filter(g => g.playtime_forever === 0)
  const abandoned = games.filter(g => g.playtime_forever > 0 && g.playtime_forever < 120) // < 2 hours, likely abandoned
  const worthRevisiting = games.filter(g => g.playtime_forever >= 120 && g.playtime_forever < 3000 && (!g.playtime_2weeks || g.playtime_2weeks === 0)) // 2-50 hours, not recently played
  const activelyPlaying = games.filter(g => g.playtime_2weeks && g.playtime_2weeks > 0) // Currently playing
  const completed = games.filter(g => g.playtime_forever >= 3000 && (!g.playtime_2weeks || g.playtime_2weeks === 0)) // 50+ hours, not recently played - likely completed
  const inProgress = games.filter(g => g.playtime_forever >= 120 && g.playtime_forever < 3000 && g.playtime_2weeks && g.playtime_2weeks > 0) // 2-50 hours AND recently played
  
  return {
    totalGames,
    totalPlaytime: Math.round(totalPlaytime / 60), // Convert to hours
    collectionValue,
    topGames: topGames.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) })),
    recentGames: recentGames.map(g => ({ name: g.name, hours: Math.round((g.playtime_2weeks || 0) / 60) })),
    categories: {
      unplayed: unplayed.length,
      abandoned: abandoned.length,
      worthRevisiting: worthRevisiting.length,
      activelyPlaying: activelyPlaying.length,
      completed: completed.length,
      inProgress: inProgress.length
    },
    gamesByCategory: {
      unplayed: unplayed.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) })),
      abandoned: abandoned.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) })),
      worthRevisiting: worthRevisiting.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) })),
      activelyPlaying: activelyPlaying.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60), recent: Math.round((g.playtime_2weeks || 0) / 60) })),
      completed: completed.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) })),
      inProgress: inProgress.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60), recent: Math.round((g.playtime_2weeks || 0) / 60) }))
    }
  }
}

function buildGameContext(games: any[], analysis: any) {
  return `
USER'S STEAM LIBRARY CONTEXT:
- Total games: ${analysis.totalGames}
- Total playtime: ${analysis.totalPlaytime} hours
- Collection value: $${analysis.collectionValue.total.toFixed(2)} (${analysis.collectionValue.currency})

GAME CATEGORIZATION:
- Unplayed games: ${analysis.categories.unplayed} (never launched)
- Abandoned games: ${analysis.categories.abandoned} (< 2 hours, likely didn't enjoy)
- Worth revisiting: ${analysis.categories.worthRevisiting} (2-50 hours, not recently played)
- In progress: ${analysis.categories.inProgress} (2-50 hours AND recently played)
- Actively playing: ${analysis.categories.activelyPlaying} (any playtime, recent activity)
- Likely completed: ${analysis.categories.completed} (50+ hours, not recently played)

TOP PLAYED GAMES (likely completed or favorites):
${analysis.topGames.map(game => `- ${game.name} (${game.hours}h)`).join('\n')}

RECENTLY ACTIVE GAMES (currently playing):
${analysis.recentGames.length > 0 ? analysis.recentGames.map(game => `- ${game.name} (${game.hours}h recent)`).join('\n') : '- No recent activity'}

BEST GAMES TO RECOMMEND:
1. UNPLAYED GAMES (${analysis.categories.unplayed} available):
${analysis.gamesByCategory.unplayed.slice(0, 10).map(game => `- ${game.name}`).join('\n')}

2. WORTH REVISITING (${analysis.categories.worthRevisiting} available):
${analysis.gamesByCategory.worthRevisiting.slice(0, 10).map(game => `- ${game.name} (${game.hours}h played)`).join('\n')}

3. IN PROGRESS (${analysis.categories.inProgress} available):
${analysis.gamesByCategory.inProgress.slice(0, 5).map(game => `- ${game.name} (${game.hours}h total, ${game.recent}h recent)`).join('\n')}

AVOID RECOMMENDING:
- ABANDONED GAMES (< 2h played): ${analysis.gamesByCategory.abandoned.slice(0, 10).map(game => game.name).join(', ')}
- LIKELY COMPLETED (50+ hours, not recent): ${analysis.gamesByCategory.completed.slice(0, 10).map(game => game.name).join(', ')}
`
}

function buildChatMessages(message: string, gameContext: string, chatHistory: any[] = []) {
  const systemMessage = {
    role: "system" as const,
    content: `You are a helpful gaming assistant with access to the user's complete Steam library. You can:
- Recommend games from their library based on their preferences
- Analyze their gaming patterns and habits
- Suggest what to play next
- Help them discover unplayed games
- Discuss gaming topics with full context of their library
- Answer questions about their games and playtime

IMPORTANT RECOMMENDATION RULES:
- PRIORITIZE: Unplayed games, games worth revisiting, and games in progress
- AVOID: Abandoned games (< 2h played - user likely didn't enjoy them)
- AVOID: Likely completed games (50+ hours, not recently played - user probably finished them)
- When suggesting "what to play next", focus on unplayed games and games worth revisiting
- If user asks about completing games, focus on "in progress" games they're actively playing
- Be specific about WHY you're recommending certain games based on their play patterns

Be conversational, helpful, and personalized. Use the library context to give specific recommendations and insights.

${gameContext}`
  }
  
  // Convert chat history to OpenAI format
  const historyMessages = chatHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }))
  
  const userMessage = {
    role: "user" as const,
    content: message
  }
  
  return [systemMessage, ...historyMessages, userMessage]
}

function convertMessagesToPrompt(messages: any[]) {
  // Extract system context and conversation
  const systemMsg = messages.find(m => m.role === 'system')
  const conversationMsgs = messages.filter(m => m.role !== 'system')
  
  // Create a simplified prompt for DialoGPT
  let prompt = ''
  
  // Add key context from system message
  if (systemMsg) {
    const gameContext = systemMsg.content.split('USER\'S STEAM LIBRARY CONTEXT:')[1]
    if (gameContext) {
      const lines = gameContext.split('\n').slice(0, 20) // First 20 lines of context
      prompt += `Gaming Context: ${lines.join(' ').replace(/\s+/g, ' ').trim()}\n\n`
    }
  }
  
  // Add conversation history
  conversationMsgs.forEach(msg => {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`
    } else {
      prompt += `Assistant: ${msg.content}\n`
    }
  })
  
  prompt += 'Assistant:'
  return prompt
}

async function calculateCollectionValue(games: any[]) {
  try {
    // Batch API calls for pricing data
    const appIds = games.map(g => g.appid).slice(0, 50) // Limit to avoid rate limits
    const pricePromises = appIds.map(appId => fetchGamePrice(appId))
    
    const priceResults = await Promise.allSettled(pricePromises)
    
    let totalValue = 0
    let successfulPrices = 0
    
    priceResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        totalValue += result.value.price
        successfulPrices++
      }
    })
    
    // Estimate total value based on successful price fetches
    const estimatedTotal = games.length > 50 
      ? (totalValue / successfulPrices) * games.length 
      : totalValue
    
    return {
      total: estimatedTotal,
      currency: 'USD',
      gamesWithPrices: successfulPrices,
      totalGames: games.length,
      estimated: games.length > 50
    }
  } catch (error) {
    console.error('Error calculating collection value:', error)
    return {
      total: 0,
      currency: 'USD',
      gamesWithPrices: 0,
      totalGames: games.length,
      estimated: false,
      error: 'Unable to fetch pricing data'
    }
  }
}

async function fetchGamePrice(appId: string) {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&filters=price_overview`)
    const data = await response.json()
    
    if (data[appId]?.success && data[appId]?.data?.price_overview) {
      const priceData = data[appId].data.price_overview
      return {
        appId,
        price: priceData.initial / 100, // Convert cents to dollars
        currency: priceData.currency
      }
    }
    return null
  } catch (error) {
    console.error(`Error fetching price for ${appId}:`, error)
    return null
  }
}