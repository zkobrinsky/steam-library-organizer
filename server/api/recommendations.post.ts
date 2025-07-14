import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { games, preferences } = body
  
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
    // Analyze the user's gaming patterns
    const analysis = await analyzeGamingPatterns(games)
    
    // Generate AI recommendations using Hugging Face
    const aiRecommendations = await generateAIRecommendations(games, analysis, preferences, config)
    
    return {
      analysis,
      recommendations: aiRecommendations.ownedGameRecommendations,
      newGameSuggestions: aiRecommendations.newGameSuggestions,
      aiInsights: aiRecommendations.insights,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Recommendation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate recommendations: ${error.message || error}`
    })
  }
})

async function analyzeGamingPatterns(games: any[]) {
  const totalGames = games.length
  const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0)
  const averagePlaytime = totalPlaytime / totalGames
  
  // Calculate collection value
  const collectionValue = await calculateCollectionValue(games)
  
  // Categorize games by playtime
  const unplayed = games.filter(g => g.playtime_forever === 0)
  const shortSessions = games.filter(g => g.playtime_forever > 0 && g.playtime_forever < 120) // < 2 hours
  const mediumSessions = games.filter(g => g.playtime_forever >= 120 && g.playtime_forever < 3000) // 2-50 hours
  const longSessions = games.filter(g => g.playtime_forever >= 3000) // 50+ hours
  
  // Recent activity analysis
  const recentlyPlayed = games.filter(g => g.playtime_2weeks && g.playtime_2weeks > 0)
  const mostPlayedRecent = recentlyPlayed.sort((a, b) => (b.playtime_2weeks || 0) - (a.playtime_2weeks || 0)).slice(0, 5)
  
  // Find favorite games (high playtime)
  const favorites = games.filter(g => g.playtime_forever > 1800).sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 10)
  
  return {
    totalGames,
    totalPlaytime: Math.round(totalPlaytime / 60), // Convert to hours
    averagePlaytime: Math.round(averagePlaytime / 60),
    collectionValue,
    categories: {
      unplayed: unplayed.length,
      shortSessions: shortSessions.length,
      mediumSessions: mediumSessions.length,
      longSessions: longSessions.length
    },
    recentActivity: {
      gamesPlayed: recentlyPlayed.length,
      mostActive: mostPlayedRecent.map(g => ({ name: g.name, hours: Math.round((g.playtime_2weeks || 0) / 60) }))
    },
    favorites: favorites.map(g => ({ name: g.name, hours: Math.round(g.playtime_forever / 60) }))
  }
}

function getMoodContext(mood: string) {
  const moodMap = {
    'chill': 'User wants relaxing, low-stress games - think puzzles, exploration, peaceful building games',
    'action': 'User wants high-energy, exciting games - think shooters, racing, intense action games',
    'nostalgia': 'User wants to revisit older games they used to love or games that feel nostalgic',
    'discover': 'User wants to try unplayed games or hidden gems they own but haven\'t explored',
    'completion': 'User wants to finish games they\'ve started but never completed',
    'multiplayer': 'User wants social games they can play with friends - co-op or competitive',
    'creative': 'User wants building, crafting, or creative games where they can make things',
    'brain': 'User wants mentally challenging games - strategy, puzzles, complex mechanics',
    'story': 'User wants narrative-driven games with good stories and characters'
  }
  return moodMap[mood as keyof typeof moodMap] || 'No specific mood preference - recommend variety'
}

async function generateAIRecommendations(games: any[], analysis: any, preferences: any = {}, config: any) {
  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })
  
  // Prepare game data for AI analysis
  const gameData = games.map(game => ({
    name: game.name,
    playtime_hours: Math.round(game.playtime_forever / 60),
    recent_hours: Math.round((game.playtime_2weeks || 0) / 60),
    appid: game.appid
  }))

  // Create a comprehensive prompt for the AI
  const prompt = `You are a gaming AI assistant analyzing a Steam library to provide personalized recommendations.

GAMING PROFILE:
- Total games: ${analysis.totalGames}
- Total playtime: ${analysis.totalPlaytime} hours
- Average playtime per game: ${analysis.averagePlaytime} hours
- Unplayed games: ${analysis.categories.unplayed}
- Recently active games: ${analysis.recentActivity.gamesPlayed}

USER PREFERENCES:
- Current mood: ${preferences.mood || 'any'}
- Skip recently played: ${preferences.skipRecent || false}

MOOD CONTEXT:
${getMoodContext(preferences.mood)}

TOP PLAYED GAMES (favorites):
${analysis.favorites.slice(0, 10).map(game => `- ${game.name} (${game.hours}h)`).join('\n')}

RECENTLY ACTIVE GAMES:
${analysis.recentActivity.mostActive.slice(0, 5).map(game => `- ${game.name} (${game.hours}h recent)`).join('\n')}

ALL GAMES IN LIBRARY:
${gameData.slice(0, 50).map(game => `- ${game.name} (${game.playtime_hours}h total, ${game.recent_hours}h recent)`).join('\n')}
${gameData.length > 50 ? `... and ${gameData.length - 50} more games` : ''}

Please provide:
1. 4 specific recommendations from their owned games with detailed reasoning
2. 3 new game suggestions they should consider buying (based on their preferences)
3. Overall insights about their gaming patterns

Format your response as JSON with this structure:
{
  "ownedGameRecommendations": [
    {
      "type": "discover|revisit|quick|favorite|challenge",
      "title": "Brief recommendation title",
      "gameName": "Exact game name from library",
      "reason": "Detailed personal reason why this game fits right now",
      "confidence": 0.95
    }
  ],
  "newGameSuggestions": [
    {
      "title": "Game title",
      "reason": "Why this would fit their library and preferences",
      "genre": "Game genre",
      "estimatedHours": "Expected playtime"
    }
  ],
  "insights": "2-3 sentences about their gaming patterns and what it reveals about their preferences"
}`

  try {
    // Create a simplified prompt for Flan-T5
    const simplifiedPrompt = createFlanT5Prompt(games, analysis, preferences)
    
    const response = await openai.chat.completions.create({
      model: config.openaiFinetunedModel || 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are an expert gaming advisor who helps users understand games and make informed decisions. Analyze gaming patterns, terminology, and player feedback to provide helpful insights and recommendations."
        },
        {
          role: "user",
          content: simplifiedPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })

    const responseContent = response.choices[0]?.message?.content?.trim()
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse Flan-T5 response and convert to structured format
    const aiRecommendations = parseFlanT5Response(responseContent, games, analysis, preferences)
    
    return aiRecommendations

  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback to basic recommendations if AI fails
    return {
      ownedGameRecommendations: generateFallbackRecommendations(games, preferences),
      newGameSuggestions: [],
      insights: 'Using fallback recommendations due to AI service unavailability.'
    }
  }
}

function generateFallbackRecommendations(games: any[], preferences: any) {
  // Simple fallback recommendations
  const unplayed = games.filter(g => g.playtime_forever === 0)
  const revisit = games.filter(g => g.playtime_forever > 300 && g.playtime_forever < 3000 && (!g.playtime_2weeks || g.playtime_2weeks === 0))
  
  const recommendations = []
  
  if (unplayed.length > 0) {
    const game = unplayed[Math.floor(Math.random() * unplayed.length)]
    recommendations.push({
      type: 'discover',
      title: 'Try Something New',
      game,
      reason: 'You own this game but haven\'t played it yet.',
      confidence: 0.7
    })
  }
  
  if (revisit.length > 0) {
    const game = revisit[Math.floor(Math.random() * revisit.length)]
    recommendations.push({
      type: 'revisit',
      title: 'Worth Revisiting',
      game,
      reason: `You've played this for ${Math.round(game.playtime_forever / 60)} hours. Time to return!`,
      confidence: 0.8
    })
  }
  
  return recommendations
}

function createFlanT5Prompt(games: any[], analysis: any, preferences: any) {
  // Create a simple conversational prompt for DialoGPT
  const unplayed = games.filter(g => g.playtime_forever === 0).slice(0, 8)
  const favorites = analysis.favorites.slice(0, 3)
  const moodContext = getMoodContext(preferences.mood)
  
  return `User: I have ${analysis.totalGames} Steam games and want recommendations for my ${preferences.mood || 'gaming'} mood. ${moodContext}

My favorites: ${favorites.map(g => g.name).join(', ')}
Unplayed games: ${unplayed.map(g => g.name).join(', ')}

What should I play?
Assistant:`
}

function parseFlanT5Response(response: string, games: any[], analysis: any, preferences: any): any {
  // Since Flan-T5 won't return JSON, we'll parse the text and create structured recommendations
  const lines = response.split('\n').filter(line => line.trim())
  const recommendations = []
  
  // Extract game names mentioned in the response
  const mentionedGames = []
  for (const game of games) {
    if (response.toLowerCase().includes(game.name.toLowerCase())) {
      mentionedGames.push(game)
    }
  }
  
  // Create recommendations based on mentioned games and user patterns
  const unplayed = games.filter(g => g.playtime_forever === 0)
  const revisitable = games.filter(g => g.playtime_forever > 300 && g.playtime_forever < 3000 && (!g.playtime_2weeks || g.playtime_2weeks === 0))
  
  // Add up to 4 recommendations
  if (mentionedGames.length > 0) {
    // Use games mentioned by AI
    for (let i = 0; i < Math.min(3, mentionedGames.length); i++) {
      const game = mentionedGames[i]
      const isUnplayed = game.playtime_forever === 0
      
      recommendations.push({
        type: isUnplayed ? 'discover' : 'revisit',
        title: isUnplayed ? 'AI Suggests: Try This Unplayed Game' : 'AI Suggests: Revisit This Game',
        game,
        reason: `AI analysis suggests this game fits your current ${preferences.mood || 'gaming'} mood.`,
        confidence: 0.85
      })
    }
  }
  
  // Fill remaining slots with smart fallbacks
  while (recommendations.length < 3) {
    if (unplayed.length > 0 && recommendations.length < 2) {
      const game = unplayed[Math.floor(Math.random() * unplayed.length)]
      recommendations.push({
        type: 'discover',
        title: 'Unplayed Gem',
        game,
        reason: 'You own this but haven\'t tried it yet - perfect time to discover something new!',
        confidence: 0.7
      })
      unplayed.splice(unplayed.indexOf(game), 1)
    } else if (revisitable.length > 0) {
      const game = revisitable[Math.floor(Math.random() * revisitable.length)]
      recommendations.push({
        type: 'revisit',
        title: 'Worth Another Look',
        game,
        reason: `You played this for ${Math.round(game.playtime_forever / 60)} hours before. Time to continue the journey!`,
        confidence: 0.75
      })
      revisitable.splice(revisitable.indexOf(game), 1)
    } else {
      break
    }
  }
  
  return {
    ownedGameRecommendations: recommendations,
    newGameSuggestions: [
      {
        title: 'Based on Your Library Patterns',
        reason: 'Consider exploring similar games to your favorites',
        genre: 'Varied',
        estimatedHours: '10-50 hours'
      }
    ],
    insights: `You have ${analysis.totalGames} games worth $${analysis.collectionValue.total.toFixed(2)} with ${analysis.totalPlaytime} hours played. ${analysis.categories.unplayed} games are waiting to be discovered!`
  }
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