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
      return
    }
    
    observer.value = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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