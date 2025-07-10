<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">💬 Chat with AI about your games</h2>
      <button 
        v-if="messages.length > 0"
        @click="clearChat"
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Clear Chat
      </button>
    </div>
    
    <!-- Chat Messages -->
    <div v-if="messages.length > 0" class="mb-4 max-h-96 overflow-y-auto space-y-4">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="flex"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div 
          class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
          :class="message.role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'"
        >
          <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
          <p class="text-xs opacity-75 mt-1">{{ formatTime(message.timestamp) }}</p>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-start mb-4">
      <div class="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
        <div class="flex items-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
        </div>
      </div>
    </div>
    
    <!-- Chat Input -->
    <div class="flex space-x-2">
      <input 
        v-model="currentMessage"
        @keydown.enter="sendMessage"
        type="text"
        placeholder="Ask about your games, get recommendations, or chat about gaming..."
        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :disabled="loading"
      >
      <button 
        @click="sendMessage"
        :disabled="loading || !currentMessage.trim()"
        class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>
    </div>
    
    <!-- Quick Suggestions -->
    <div v-if="messages.length === 0" class="mt-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Try asking:</p>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="suggestion in quickSuggestions"
          :key="suggestion"
          @click="currentMessage = suggestion"
          class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SteamGame } from '~/composables/useSteamGames'

interface Props {
  games: readonly SteamGame[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const props = defineProps<Props>()

const messages = ref<ChatMessage[]>([])
const currentMessage = ref('')
const loading = ref(false)

const quickSuggestions = [
  "What should I play next?",
  "Find me a relaxing game",
  "What are my most played games?",
  "Recommend a co-op game",
  "Which games haven't I finished?",
  "Find hidden gems in my library"
]

const sendMessage = async () => {
  if (!currentMessage.value.trim() || loading.value) return
  
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: currentMessage.value.trim(),
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  const messageToSend = currentMessage.value.trim()
  currentMessage.value = ''
  loading.value = true
  
  try {
    const response = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        message: messageToSend,
        games: props.games,
        chatHistory: messages.value.slice(-6) // Send last 6 messages for context
      }
    })
    
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date()
    }
    
    messages.value.push(aiMessage)
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "Sorry, I encountered an error. Please try again.",
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  } finally {
    loading.value = false
  }
}

const clearChat = () => {
  messages.value = []
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>