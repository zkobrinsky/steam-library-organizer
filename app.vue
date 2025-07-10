<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
    <header
      class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              Steam Library Organizer
            </h1>
            <span
              v-if="games.length > 0"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              {{ filteredGames.length }} of {{ games.length }} games
            </span>
          </div>

          <div class="flex items-center space-x-4">
            <!-- User Profile (prominent) -->
            <div
              v-if="steamUser"
              class="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
            >
              <img
                :src="steamUser.avatarUrl"
                :alt="steamUser.displayName"
                class="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
              />
              <div class="hidden sm:block">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ steamUser.displayName }}
                </p>
              </div>
            </div>

            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Toggle theme"
            >
              <svg
                v-if="isDark"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>

            <button
              v-if="isConfigured"
              @click="refreshGames"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {{ loading ? "Loading..." : "Refresh" }}
            </button>

            <UserProfile
              v-if="!steamUser"
              @login="showLoginModal = true"
              @logout="handleLogout"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Screen -->
      <div v-if="!isConfigured" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div
            class="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg
              class="w-12 h-12 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 13.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5zm-7 0c0 .828-.672 1.5-1.5 1.5S5.5 16.328 5.5 15.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Steam Library Organizer
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-8">
            Connect your Steam account to analyze your library, get AI-powered
            game recommendations, and organize your collection with smart
            filtering tools.
          </p>
          <button
            @click="showLoginModal = true"
            class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
          >
            Connect Your Steam Account
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else>
        <div
          v-if="error"
          class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6"
        >
          {{ error }}
        </div>

        <GameChat :games="games" />

        <GameRecommendations :games="games" />

        <GameFilters
          :filters="filters"
          :games="games"
          @update:filters="filters = $event"
        />

        <div v-if="loading" class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"
          ></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Loading your Steam library...
          </p>
        </div>

        <div v-else-if="games.length === 0" class="text-center py-12">
          <p class="text-gray-600 dark:text-gray-400">
            No games found. Make sure your Steam profile is public and try
            refreshing.
          </p>
        </div>

        <div v-else>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <GameCard
              v-for="game in visibleGames"
              :key="game.appid"
              :game="game"
            />
          </div>

          <!-- Loading indicator -->
          <div v-if="lazyLoading" class="text-center py-8">
            <div
              class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"
            ></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Loading more games...
            </p>
          </div>

          <!-- Intersection observer target -->
          <div ref="scrollTarget" class="h-10"></div>
        </div>
      </div>
    </main>

    <!-- Steam Login Modal -->
    <SteamLoginModal
      :is-open="showLoginModal"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameFilters } from "~/components/GameFilters.vue";
import type { SteamGame } from "~/composables/useSteamGames";
import { useCollectionsStore } from "~/stores/collections";

const { games, loading, error, fetchGames } = useSteamGames();
const { steamUser, isConfigured, loadConfig } = useSteamConfig();
const collectionsStore = useCollectionsStore();

const filters = ref<GameFilters>({
  search: "",
  playtime: "",
  recentActivity: "",
  collection: "",
  sortBy: "name",
  sortOrder: "asc",
});

const filteredGames = computed(() => {
  let result = [...games.value];

  // Search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    result = result.filter((game) =>
      game.name.toLowerCase().includes(searchTerm)
    );
  }

  // Playtime filter
  if (filters.value.playtime) {
    switch (filters.value.playtime) {
      case "unplayed":
        result = result.filter((game) => game.playtime_forever === 0);
        break;
      case "under-1h":
        result = result.filter((game) => game.playtime_forever < 60);
        break;
      case "1-10h":
        result = result.filter(
          (game) => game.playtime_forever >= 60 && game.playtime_forever < 600
        );
        break;
      case "10-50h":
        result = result.filter(
          (game) => game.playtime_forever >= 600 && game.playtime_forever < 3000
        );
        break;
      case "over-50h":
        result = result.filter((game) => game.playtime_forever >= 3000);
        break;
    }
  }

  // Recent activity filter
  if (filters.value.recentActivity) {
    switch (filters.value.recentActivity) {
      case "recent":
        result = result.filter((game) => (game.playtime_2weeks || 0) > 0);
        break;
      case "not-recent":
        result = result.filter((game) => (game.playtime_2weeks || 0) === 0);
        break;
    }
  }

  // Collection filter
  if (filters.value.collection) {
    if (filters.value.collection === "uncategorized") {
      result = result.filter(
        (game) => collectionsStore.getCollectionsByGame(game.appid).length === 0
      );
    } else {
      // Handle custom collections
      result = result.filter((game) =>
        collectionsStore
          .getCollectionsByGame(game.appid)
          .some((c) => c.id === filters.value.collection)
      );
    }
  }

  // Sort
  result.sort((a, b) => {
    let comparison = 0;

    switch (filters.value.sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "playtime":
        comparison = a.playtime_forever - b.playtime_forever;
        break;
      case "recent":
        comparison = (a.rtime_last_played || 0) - (b.rtime_last_played || 0);
        break;
    }

    return filters.value.sortOrder === "asc" ? comparison : -comparison;
  });

  return result;
});

// Lazy loading setup
const {
  visibleItems: visibleGames,
  hasMore,
  isLoading: lazyLoading,
  loadMore,
  reset: resetLazyLoading,
} = useLazyLoading(filteredGames, 20);
const { target: scrollTarget } = useInfiniteScroll(() => {
  if (hasMore.value) {
    loadMore();
  }
});

const showLoginModal = ref(false);
const isDark = ref(true);

// Theme management
const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (process.client) {
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
    updateTheme();
  }
};

const updateTheme = () => {
  if (process.client) {
    if (isDark.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
};

const loadTheme = () => {
  if (process.client) {
    const saved = localStorage.getItem("theme");
    isDark.value =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    updateTheme();
  }
};

const formatSteamId = (steamId: string) => {
  return `${steamId.slice(0, 8)}...${steamId.slice(-4)}`;
};

const refreshGames = async () => {
  if (isConfigured.value && steamUser.value?.steamId) {
    await fetchGames(steamUser.value.steamId);
  }
};

const handleLoginSuccess = async () => {
  showLoginModal.value = false;
  if (steamUser.value?.steamId) {
    await fetchGames(steamUser.value.steamId);
  }
};

const handleLogout = () => {
  // Games will be automatically cleared since we check isConfigured
};

// Handle Steam auth callback
const handleSteamAuthCallback = () => {
  if (process.client) {
    const urlParams = new URLSearchParams(window.location.search);
    const steamAuthData = urlParams.get("steamAuth");

    if (steamAuthData) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(steamAuthData));
        const { saveConfig } = useSteamConfig();
        saveConfig(userInfo);

        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("steamAuth");
        window.history.replaceState({}, "", url.toString());

        // Fetch games for the authenticated user
        if (userInfo.steamId) {
          fetchGames(userInfo.steamId);
        }
      } catch (error) {
        console.error("Failed to process Steam authentication:", error);
      }
    }
  }
};

// Watch for filter changes and reset lazy loading
watch(
  filters,
  () => {
    resetLazyLoading();
  },
  { deep: true }
);

// Load collections and config on mount
onMounted(async () => {
  collectionsStore.loadFromLocalStorage();
  loadConfig();
  loadTheme();

  // Check for Steam auth callback
  handleSteamAuthCallback();

  // Auto-fetch games if already configured
  if (isConfigured.value && steamUser.value?.steamId) {
    await fetchGames(steamUser.value.steamId);
  }
  
});
</script>
