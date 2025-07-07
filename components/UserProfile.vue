<template>
  <div v-if="steamUser" class="flex items-center space-x-3">
    <!-- Avatar -->
    <img 
      :src="steamUser.avatarUrl" 
      :alt="steamUser.displayName"
      class="w-10 h-10 rounded-full border-2 border-gray-200"
    />
    
    <!-- User Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">
        {{ steamUser.displayName }}
      </p>
      <p class="text-xs text-gray-500">
        Steam ID: {{ formatSteamId(steamUser.steamId) }}
      </p>
    </div>
    
    <!-- Actions Dropdown -->
    <div class="relative">
      <button 
        @click="showMenu = !showMenu"
        class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      
      <!-- Dropdown Menu -->
      <div v-if="showMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
        <div class="py-1">
          <a 
            :href="steamUser.profileUrl"
            target="_blank"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z"></path>
              </svg>
              View Steam Profile
            </div>
          </a>
          
          <button 
            @click="showQR = true; showMenu = false"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1zm12 0h2a1 1 0 001-1V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 001 1zM5 20h2a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1z" />
              </svg>
              Share QR Code
            </div>
          </button>
          
          <button 
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Switch Account
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- QR Code Modal -->
    <div v-if="showQR" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 class="text-lg font-semibold mb-4">Share Your Steam Profile</h3>
        <div class="bg-gray-100 p-4 rounded-lg mb-4">
          <!-- QR Code would go here - for now showing placeholder -->
          <div class="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
            <div class="text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1zm12 0h2a1 1 0 001-1V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 001 1zM5 20h2a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1z" />
              </svg>
              <p class="text-sm">QR Code</p>
              <p class="text-xs">{{ steamUser.steamId }}</p>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          Scan this QR code to quickly access this profile
        </p>
        <div class="flex space-x-3">
          <button 
            @click="copyProfileUrl"
            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Copy URL
          </button>
          <button 
            @click="showQR = false"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Login Button -->
  <button 
    v-else
    @click="$emit('login')"
    class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
  >
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-2 0V5H5v10h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"></path>
      <path d="M13 8a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1z"></path>
    </svg>
    <span>Connect Steam</span>
  </button>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'login'): void
  (e: 'logout'): void
}

const emit = defineEmits<Emits>()

const { steamUser, clearConfig } = useSteamConfig()
const showMenu = ref(false)
const showQR = ref(false)

const formatSteamId = (steamId: string) => {
  return `${steamId.slice(0, 8)}...${steamId.slice(-4)}`
}

const handleLogout = () => {
  clearConfig()
  showMenu.value = false
  emit('logout')
}

const copyProfileUrl = async () => {
  if (steamUser.value?.profileUrl) {
    try {
      await navigator.clipboard.writeText(steamUser.value.profileUrl)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (showMenu.value && !event.target?.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>