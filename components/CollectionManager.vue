<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">Collections</h2>
      <button 
        @click="showCreateForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        New Collection
      </button>
    </div>
    
    <!-- Create Collection Form -->
    <div v-if="showCreateForm" class="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <div class="flex items-center space-x-3">
        <input 
          v-model="newCollectionName"
          type="text"
          placeholder="Collection name"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="createCollection"
        >
        <input 
          v-model="newCollectionColor"
          type="color"
          class="w-12 h-10 rounded-md border border-gray-300"
        >
        <button 
          @click="createCollection"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Create
        </button>
        <button 
          @click="cancelCreate"
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
    
    <!-- Auto Collections -->
    <div v-if="autoCollections.length > 0" class="mb-6">
      <h3 class="text-md font-medium text-gray-700 mb-3">Smart Collections</h3>
      <div class="space-y-2">
        <div 
          v-for="collection in autoCollections" 
          :key="collection.id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gradient-to-r from-gray-50 to-white"
        >
          <div class="flex items-center space-x-3">
            <span class="text-lg">{{ collection.icon }}</span>
            <div>
              <span class="font-medium">{{ collection.name }}</span>
              <p class="text-xs text-gray-500">{{ collection.description }}</p>
            </div>
            <span class="text-sm text-gray-500 font-medium">({{ collection.count }} games)</span>
          </div>
          
          <div 
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: collection.color }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Custom Collections -->
    <div>
      <h3 class="text-md font-medium text-gray-700 mb-3">Custom Collections</h3>
      <div class="space-y-2">
        <div 
          v-for="collection in customCollections" 
          :key="collection.id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded-md"
        >
          <div class="flex items-center space-x-3">
            <div 
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: collection.color }"
            ></div>
            <span class="font-medium">{{ collection.name }}</span>
            <span class="text-sm text-gray-500">({{ collection.gameIds.length }} games)</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <button 
              @click="editCollection(collection)"
              class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button 
              @click="deleteCollection(collection.id)"
              class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div v-if="customCollections.length === 0" class="text-center py-8 text-gray-500">
          No custom collections yet. Create your first collection to organize your games!
        </div>
      </div>
    </div>
    
    <!-- Edit Collection Modal -->
    <div v-if="editingCollection" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Edit Collection</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input 
              v-model="editingCollection.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <input 
              v-model="editingCollection.color"
              type="color"
              class="w-full h-10 rounded-md border border-gray-300"
            >
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="cancelEdit"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="saveEdit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCollectionsStore, type Collection } from '~/stores/collections'
import type { SteamGame } from '~/composables/useSteamGames'

interface Props {
  games: SteamGame[]
}

const props = defineProps<Props>()
const collectionsStore = useCollectionsStore()

const showCreateForm = ref(false)
const newCollectionName = ref('')
const newCollectionColor = ref('#3b82f6')
const editingCollection = ref<Collection | null>(null)

const allCollections = computed(() => {
  console.log('CollectionManager: props.games.length =', props.games.length)
  if (props.games.length === 0) return []
  const collections = collectionsStore.getAllCollections(props.games)
  console.log('CollectionManager: allCollections =', collections)
  return collections
})
const customCollections = computed(() => collectionsStore.collections)
const autoCollections = computed(() => allCollections.value.filter(c => c.id.startsWith('auto-')))

const createCollection = () => {
  if (newCollectionName.value.trim()) {
    collectionsStore.createCollection(newCollectionName.value.trim(), newCollectionColor.value)
    cancelCreate()
  }
}

const cancelCreate = () => {
  showCreateForm.value = false
  newCollectionName.value = ''
  newCollectionColor.value = '#3b82f6'
}

const editCollection = (collection: Collection) => {
  editingCollection.value = { ...collection }
}

const saveEdit = () => {
  if (editingCollection.value) {
    collectionsStore.updateCollection(editingCollection.value.id, {
      name: editingCollection.value.name,
      color: editingCollection.value.color
    })
    editingCollection.value = null
  }
}

const cancelEdit = () => {
  editingCollection.value = null
}

const deleteCollection = (collectionId: string) => {
  if (confirm('Are you sure you want to delete this collection?')) {
    collectionsStore.deleteCollection(collectionId)
  }
}
</script>