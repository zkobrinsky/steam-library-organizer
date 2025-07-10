export const useLazyLoading = <T>(items: Ref<T[]>, itemsPerPage: number = 20) => {
  const currentPage = ref(1)
  const isLoading = ref(false)
  
  const visibleItems = computed(() => {
    return items.value.slice(0, currentPage.value * itemsPerPage)
  })
  
  const hasMore = computed(() => {
    return visibleItems.value.length < items.value.length
  })
  
  const loadMore = () => {
    console.log('loadMore called:', { hasMore: hasMore.value, isLoading: isLoading.value, currentPage: currentPage.value, totalItems: items.value.length })
    if (hasMore.value && !isLoading.value) {
      isLoading.value = true
      // Simulate loading delay for better UX
      setTimeout(() => {
        currentPage.value++
        isLoading.value = false
        console.log('Page incremented:', { newPage: currentPage.value, visibleItems: visibleItems.value.length })
      }, 100)
    }
  }
  
  const reset = () => {
    currentPage.value = 1
    isLoading.value = false
  }
  
  // Watch for changes in items and reset pagination
  watch(items, () => {
    reset()
  }, { deep: true })
  
  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset
  }
}