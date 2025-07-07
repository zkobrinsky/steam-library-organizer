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
  
  if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key not configured'
    })
  }

  try {
    // Analyze the user's gaming patterns
    const analysis = analyzeGamingPatterns(games)
    
    // Generate AI recommendations using OpenAI
    const aiRecommendations = await generateAIRecommendations(games, analysis, preferences, config.openaiApiKey)
    
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

function analyzeGamingPatterns(games: any[]) {
  const totalGames = games.length
  const totalPlaytime = games.reduce((sum, game) => sum + game.playtime_forever, 0)
  const averagePlaytime = totalPlaytime / totalGames
  
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

async function generateAIRecommendations(games: any[], analysis: any, preferences: any = {}, apiKey: string) {
  const openai = new OpenAI({ apiKey })
  
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system", 
          content: "You are an expert gaming consultant who analyzes Steam libraries to provide personalized, insightful game recommendations. Focus on being specific and personal in your recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse the JSON response (handle markdown code blocks)
    let jsonContent = responseContent.trim()
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const aiResponse = JSON.parse(jsonContent)
    
    // Convert AI recommendations to our format
    const formattedRecommendations = aiResponse.ownedGameRecommendations.map((rec: any) => {
      const game = games.find(g => g.name === rec.gameName)
      return {
        type: rec.type,
        title: rec.title,
        game: game || { name: rec.gameName, playtime_forever: 0, appid: 0 },
        reason: rec.reason,
        confidence: rec.confidence
      }
    }).filter((rec: any) => rec.game.appid !== 0) // Only include games we found in library

    return {
      ownedGameRecommendations: formattedRecommendations,
      newGameSuggestions: aiResponse.newGameSuggestions || [],
      insights: aiResponse.insights || 'AI analysis completed successfully.'
    }

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