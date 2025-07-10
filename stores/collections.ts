import { defineStore } from 'pinia'
import type { SteamGame } from '~/composables/useSteamGames'
import type { AutoCollection } from '~/composables/useAutoCollections'

export interface Collection {
  id: string
  name: string
  gameIds: number[]
  color: string
  createdAt: Date
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<Collection[]>([])
  
  const getAllCollections = (games: readonly SteamGame[] = []) => {
    const { getAutoCollections } = useAutoCollections()
    const autoCollections = getAutoCollections(games)
    const customCollections = collections.value.map(c => ({
      ...c,
      games: [],
      count: c.gameIds.length,
      icon: '📁',
      description: `Custom collection with ${c.gameIds.length} games`
    }))
    return [...autoCollections, ...customCollections]
  }
  
  const getCollectionsByGame = (gameId: number) => {
    return collections.value.filter(collection => 
      collection.gameIds.includes(gameId)
    )
  }
  
  const getGamesInCollection = (collectionId: string, allGames: readonly SteamGame[]) => {
    // Check if it's an auto-collection
    if (collectionId.startsWith('auto-')) {
      const { getGamesInAutoCollection } = useAutoCollections()
      return getGamesInAutoCollection(collectionId, allGames)
    }
    
    // Handle custom collections
    const collection = collections.value.find(c => c.id === collectionId)
    if (!collection) return []
    
    return allGames.filter(game => 
      collection.gameIds.includes(game.appid)
    )
  }
  
  const createCollection = (name: string, color: string = '#3b82f6') => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      gameIds: [],
      color,
      createdAt: new Date()
    }
    
    collections.value.push(newCollection)
    saveToLocalStorage()
    return newCollection
  }
  
  const addGameToCollection = (collectionId: string, gameId: number) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection && !collection.gameIds.includes(gameId)) {
      collection.gameIds.push(gameId)
      saveToLocalStorage()
    }
  }
  
  const removeGameFromCollection = (collectionId: string, gameId: number) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection) {
      const index = collection.gameIds.indexOf(gameId)
      if (index > -1) {
        collection.gameIds.splice(index, 1)
        saveToLocalStorage()
      }
    }
  }
  
  const deleteCollection = (collectionId: string) => {
    const index = collections.value.findIndex(c => c.id === collectionId)
    if (index > -1) {
      collections.value.splice(index, 1)
      saveToLocalStorage()
    }
  }
  
  const updateCollection = (collectionId: string, updates: Partial<Collection>) => {
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection) {
      Object.assign(collection, updates)
      saveToLocalStorage()
    }
  }
  
  const saveToLocalStorage = () => {
    if (process.client) {
      localStorage.setItem('steamCollections', JSON.stringify(collections.value))
    }
  }
  
  const loadFromLocalStorage = () => {
    if (process.client) {
      const saved = localStorage.getItem('steamCollections')
      if (saved) {
        collections.value = JSON.parse(saved)
      }
    }
  }
  
  return {
    collections: readonly(collections),
    getAllCollections,
    getCollectionsByGame,
    getGamesInCollection,
    createCollection,
    addGameToCollection,
    removeGameFromCollection,
    deleteCollection,
    updateCollection,
    loadFromLocalStorage
  }
})