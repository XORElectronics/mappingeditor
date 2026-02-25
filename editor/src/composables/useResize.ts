import { ref, onMounted, onUnmounted, type Ref, readonly } from 'vue'

export interface UseResizeOptions {
  storageKey?: string      // LocalStorage key for persistence
  minHeight: number        // Minimum height constraint (px)
  maxHeight: number        // Maximum height constraint (px)
  defaultHeight: number    // Initial height (px)
}

export interface UseResizeReturn {
  height: Ref<number>
  isResizing: Readonly<Ref<boolean>>
  startResize: (event: MouseEvent) => void
  setHeight: (height: number) => void
  resetHeight: () => void
}

export function useResize(options: UseResizeOptions): UseResizeReturn {
  const { storageKey, minHeight, maxHeight, defaultHeight } = options

  // State
  const height = ref<number>(defaultHeight)
  const isResizing = ref<boolean>(false)
  const resizeStartY = ref<number>(0)
  const resizeStartHeight = ref<number>(0)

  // Load persisted height from localStorage
  onMounted(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedHeight = parseInt(stored, 10)
        if (!isNaN(parsedHeight)) {
          height.value = Math.max(minHeight, Math.min(maxHeight, parsedHeight))
        }
      }
    }
  })

  // Save height to localStorage when it changes
  function saveHeight(): void {
    if (storageKey) {
      localStorage.setItem(storageKey, height.value.toString())
    }
  }

  // Handle resize movement
  function handleResize(event: MouseEvent): void {
    if (!isResizing.value) return

    const deltaY = event.clientY - resizeStartY.value
    const newHeight = resizeStartHeight.value + deltaY

    // Enforce constraints
    height.value = Math.max(minHeight, Math.min(maxHeight, newHeight))
  }

  // Stop resizing
  function stopResize(): void {
    if (!isResizing.value) return

    isResizing.value = false
    saveHeight()

    // Remove event listeners
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  }

  // Start resizing
  function startResize(event: MouseEvent): void {
    event.preventDefault()

    isResizing.value = true
    resizeStartY.value = event.clientY
    resizeStartHeight.value = height.value

    // Add event listeners
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }

  // Programmatically set height
  function setHeight(newHeight: number): void {
    height.value = Math.max(minHeight, Math.min(maxHeight, newHeight))
    saveHeight()
  }

  // Reset to default height
  function resetHeight(): void {
    height.value = defaultHeight
    saveHeight()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (isResizing.value) {
      stopResize()
    }
  })

  return {
    height,
    isResizing: readonly(isResizing),
    startResize,
    setHeight,
    resetHeight
  }
}
