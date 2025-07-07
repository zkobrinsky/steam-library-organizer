<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Connect Your Steam Account</h2>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 13.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5zm-7 0c0 .828-.672 1.5-1.5 1.5S5.5 16.328 5.5 15.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5z"/>
            </svg>
          </div>
          <p class="text-gray-600 text-sm">
            Enter your Steam information to analyze your library and get personalized game recommendations.
          </p>
        </div>

        <!-- Steam OpenID Login -->
        <div class="mb-6">
          <a 
            href="/api/auth/steam"
            class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 13.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5zm-7 0c0 .828-.672 1.5-1.5 1.5S5.5 16.328 5.5 15.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5z"/>
            </svg>
            <span>Sign in through Steam</span>
          </a>
          <p class="text-xs text-gray-500 mt-2 text-center">
            Recommended for private profiles - authenticate directly with Steam
          </p>
        </div>

        <!-- Divider -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-gray-300"></div>
          <span class="px-4 text-sm text-gray-500">or enter manually</span>
          <div class="flex-1 border-t border-gray-300"></div>
        </div>

        <!-- Input Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Steam ID, Username, or Profile URL
            </label>
            <input 
              v-model="steamInput"
              type="text"
              placeholder="e.g., 76561197995327300, username, or steam profile URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="loading"
            >
            <div class="mt-2 text-xs text-gray-500">
              <strong>Examples:</strong><br>
              • Steam ID64: 76561197995327300<br>
              • Username: myusername<br>
              • Profile URL: https://steamcommunity.com/id/myusername<br>
              • Profile URL: https://steamcommunity.com/profiles/76561197995327300
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit"
            :disabled="loading || !steamInput.trim()"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Connecting...' : 'Connect Steam Account' }}
          </button>
        </form>

        <!-- Privacy Note -->
        <div class="mt-6 bg-gray-50 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-xs text-gray-600">
                <strong>Privacy:</strong> Your Steam data is only used to generate recommendations and is stored locally in your browser. We don't store your data on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { loading, error, configureSteamUser } = useSteamConfig()
const steamInput = ref('')

const handleSubmit = async () => {
  if (!steamInput.value.trim()) return

  try {
    await configureSteamUser(steamInput.value.trim())
    emit('success')
    emit('close')
  } catch (err) {
    // Error is handled by the composable
  }
}

// Clear form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    steamInput.value = ''
  }
})
</script>