<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useResize } from '@/composables/useResize'

const props = withDefaults(defineProps<{
  title: string
  storageKey: string
  rightPosition?: string
  minimizedWidth?: string
  expandedWidth?: string
  resizable?: boolean
  minHeight?: number
  maxHeight?: number
  defaultHeight?: number
  customMaxHeight?: string
}>(), {
  rightPosition: '10px',
  minimizedWidth: '150px',
  expandedWidth: '320px',
  resizable: false,
  minHeight: 100,
  maxHeight: 600,
  defaultHeight: 350,
  customMaxHeight: '350px'
})

const emit = defineEmits<{
  expandedChange: [expanded: boolean]
  heightChange: [height: number]
}>()

const isExpanded = ref(false)
const panelBodyRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)

// Load persisted state
isExpanded.value = localStorage.getItem(props.storageKey) === 'true'

// Persist and emit on change
watch(isExpanded, (val) => {
  localStorage.setItem(props.storageKey, val.toString())
  emit('expandedChange', val)
})

// Emit initial state on mount
onMounted(() => {
  emit('expandedChange', isExpanded.value)
})

function toggleExpand(): void {
  isExpanded.value = !isExpanded.value
}

const panelWidth = computed(() => isExpanded.value ? props.expandedWidth : props.minimizedWidth)

// Initialize resize composable (always initialize, but only use if resizable)
const resizeState = useResize({
  storageKey: `${props.storageKey}-height`,
  minHeight: props.minHeight,
  maxHeight: props.maxHeight,
  defaultHeight: props.defaultHeight
})

// Watch for height changes and emit (only if resizable)
watch(() => resizeState.height.value, async (newHeight) => {
  if (props.resizable && newHeight !== undefined) {
    emit('heightChange', newHeight)
    await nextTick()
    checkOverflow()
  }
})

// Computed style for panel-body
const panelBodyStyle = computed(() => {
  if (!props.resizable) {
    return { maxHeight: props.customMaxHeight }
  }
  return { maxHeight: `${resizeState.height.value}px` }
})

// Check if content is overflowing
function checkOverflow(): void {
  if (!panelBodyRef.value || !props.resizable) return
  const isOverflowing = panelBodyRef.value.scrollHeight > panelBodyRef.value.clientHeight + 1 // +1 for rounding
  hasOverflow.value = isOverflowing
}

// Watch for expansion changes to check overflow
watch(isExpanded, async (val) => {
  if (val && props.resizable) {
    // Check immediately
    await nextTick()
    checkOverflow()

    // Check again after a short delay to ensure content is rendered
    setTimeout(checkOverflow, 100)
    setTimeout(checkOverflow, 300)

    // Set up a MutationObserver to watch for content changes
    if (panelBodyRef.value) {
      const observer = new MutationObserver(() => {
        setTimeout(checkOverflow, 50)
      })
      observer.observe(panelBodyRef.value, { childList: true, subtree: true })

      // Also add resize observer
      const resizeObserver = new ResizeObserver(() => {
        checkOverflow()
      })
      resizeObserver.observe(panelBodyRef.value)
    }
  }
})

// Also check on mount if already expanded
onMounted(async () => {
  if (isExpanded.value && props.resizable) {
    await nextTick()
    checkOverflow()
    setTimeout(checkOverflow, 100)
    setTimeout(checkOverflow, 300)
  }
})

// Expose isExpanded for parent components that need to read it
defineExpose({ isExpanded })
</script>

<template>
  <div
    class="base-panel"
    :class="{ expanded: isExpanded, minimized: !isExpanded }"
    :style="{ right: rightPosition, width: panelWidth }"
  >
    <div class="panel-header" @click="toggleExpand">
      <span class="title">{{ title }}</span>
      <slot name="header-extra" />
      <span class="toggle">{{ isExpanded ? '▼' : '▲' }}</span>
    </div>

    <div v-if="isExpanded" class="panel-body" :style="panelBodyStyle">
      <div ref="panelBodyRef" class="panel-content">
        <slot />
      </div>

      <!-- Resize handle (only if resizable) -->
      <div
        v-if="resizable"
        class="resize-handle"
        @mousedown="resizeState.startResize"
        title="Drag to resize panel"
      >
        <div class="resize-indicator"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base-panel {
  position: fixed;
  top: 10px;
  background-color: #34cc99;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
  font-size: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  font-weight: bold;
  color: black;
  background-color: #34cc99;
  border-bottom: 2px solid #000;
  white-space: nowrap;
  gap: 2px;
}

.panel-header:hover {
  background-color: #F1F700;
}

.title {
  flex: 1;
}

.toggle {
  font-size: 12px;
  color: #000;
  margin-left: 8px;
}

.panel-body {
  background-color: #000;
  border: 2px solid #34cc99;
  border-top: none;
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.resize-handle {
  width: 100%;
  height: 10px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(52, 204, 153, 0.3);
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.resize-handle:hover {
  background: rgba(52, 204, 153, 0.2);
}

.resize-indicator {
  width: 40px;
  height: 3px;
  background: rgba(52, 204, 153, 0.6);
  border-radius: 2px;
}

.resize-handle:hover .resize-indicator {
  background: #34cc99;
}
</style>
