// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  tailwindcss: {
    config: {
      darkMode: 'class'
    }
  },
  runtimeConfig: {
    steamApiKey: process.env.STEAM_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    public: {}
  }
})
