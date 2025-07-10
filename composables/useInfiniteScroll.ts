export const useInfiniteScroll = (callback: () => void, options: {
  threshold?: number
  root?: Element | null
  rootMargin?: string
} = {}) => {
  const { threshold = 0.1, root = null, rootMargin = '100px' } = options
  const target = ref<Element | null>(null)
  const observer = ref<IntersectionObserver | null>(null)
  
  const observe = () => {
    if (!target.value) {
      console.log('No target element found for intersection observer')
      return
    }
    
    console.log('Setting up intersection observer on:', target.value)
    
    observer.value = new IntersectionObserver(
      ([entry]) => {
        console.log('Intersection observer entry:', entry.isIntersecting)
        if (entry.isIntersecting) {
          console.log('Intersection observer triggered - loading more items')
          callback()
        }
      },
      {
        threshold,
        root,
        rootMargin
      }
    )
    
    observer.value.observe(target.value)
  }
  
  const unobserve = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }
  
  onMounted(() => {
    nextTick(() => {
      observe()
    })
  })

  // Watch for target element changes
  watch(target, (newTarget) => {
    if (newTarget) {
      unobserve()
      observe()
    }
  })
  
  onUnmounted(() => {
    unobserve()
  })
  
  return {
    target,
    observe,
    unobserve
  }
}