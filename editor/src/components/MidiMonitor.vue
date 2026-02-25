<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMidi, type ParsedMidiMessage } from '../composables/useMidi'
import BasePanel from './BasePanel.vue'
import ClearButton from './ClearButton.vue'
import { usePanelLayout } from '../composables/usePanelLayout'

const emit = defineEmits<{
  expandedChange: [expanded: boolean]
}>()

const { isSupported, isEnabled, messageHistory, lastMessage, enableMidi, clearHistory: clearHistoryComposable } = useMidi()
const { midiRight } = usePanelLayout()

const showActivity = ref(false)

// Activity indicator (blink on new message)
watch(lastMessage, () => {
  showActivity.value = true
  setTimeout(() => (showActivity.value = false), 200)
})

// Message type filter
const filterByType = ref<Set<string>>(new Set(['note', 'cc', 'nrpn', 'pitchbend', 'aftertouch']))

// Toggle message type filter
function toggleTypeFilter(type: string): void {
  if (filterByType.value.has(type)) {
    filterByType.value.delete(type)
  } else {
    filterByType.value.add(type)
  }
  filterByType.value = new Set(filterByType.value)
}

// Display all messages (newest at bottom), filtered by type
const recentMessages = computed(() => {
  return messageHistory.value.filter(msg => filterByType.value.has(msg.type))
})

// Dynamic sizing: stop automatic growth after 4 messages
const MESSAGE_THRESHOLD = 4;
const shouldLockHeight = computed(() => recentMessages.value.length > MESSAGE_THRESHOLD);

// Messages list style - lock automatic growth when threshold exceeded
const messagesListStyle = computed(() => {
  if (shouldLockHeight.value) {
    return {
      flex: '1 1 auto',      // Fill available space when resizable
      overflowY: 'auto'      // Enable scrolling
    } as const
  }
  return {
    flex: '0 1 auto',        // Grow naturally with content
    overflow: 'visible'
  } as const
});

function formatMessage(msg: ParsedMidiMessage): string {
  switch (msg.type) {
    case 'note':
      const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][msg.note! % 12]
      const octave = Math.floor(msg.note! / 12) - 1
      return `Note ${noteName}${octave} Ch${msg.channel + 1} Vel${msg.velocity}`
    case 'cc':
      return `CC #${msg.cc} Ch${msg.channel + 1} Val${msg.value}`
    case 'nrpn':
      return `NRPN ${msg.nrpn} Ch${msg.channel + 1} Val${msg.nrpnValue}`
    case 'pitchbend':
      return `Bend Ch${msg.channel + 1} Val${msg.value}`
    case 'aftertouch':
      return `AT Ch${msg.channel + 1} Val${msg.value}`
    default:
      return 'Unknown'
  }
}

function getMessageColor(type: string): string {
  const colors: Record<string, string> = {
    note: '#34cc99',
    cc: '#F1F700',
    nrpn: '#ff6b6b',
    pitchbend: '#4ecdc4',
    aftertouch: '#95e1d3'
  }
  return colors[type] || '#fff'
}

function clearHistory(): void {
  clearHistoryComposable()
}

function onExpandedChange(expanded: boolean): void {
  emit('expandedChange', expanded)
}

// Auto-enable MIDI on mount if supported
onMounted(async () => {
  if (isSupported.value && !isEnabled.value) {
    try {
      await enableMidi()
    } catch (error) {
      console.error('Failed to enable MIDI:', error)
    }
  }
})
</script>

<template>
  <BasePanel
    title="MIDI Monitor"
    storage-key="midi-monitor-expanded"
    :right-position="midiRight"
    minimized-width="150px"
    expanded-width="320px"
    :resizable="shouldLockHeight"
    :min-height="100"
    :max-height="600"
    :default-height="170"
    @expanded-change="onExpandedChange"
  >
    <template #header-extra>
      <span v-if="showActivity" class="activity-dot"></span>
    </template>

    <div class="midi-content">
      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-group">
          <button
            class="filter-btn"
            :class="{ active: filterByType.has('note') }"
            @click="toggleTypeFilter('note')"
            title="Toggle Note messages"
          >
            <span class="type-dot" style="background: #34cc99"></span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: filterByType.has('cc') }"
            @click="toggleTypeFilter('cc')"
            title="Toggle CC messages"
          >
            <span class="type-dot" style="background: #F1F700"></span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: filterByType.has('nrpn') }"
            @click="toggleTypeFilter('nrpn')"
            title="Toggle NRPN messages"
          >
            <span class="type-dot" style="background: #ff6b6b"></span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: filterByType.has('pitchbend') }"
            @click="toggleTypeFilter('pitchbend')"
            title="Toggle Pitchbend messages"
          >
            <span class="type-dot" style="background: #4ecdc4"></span>
          </button>
          <button
            class="filter-btn"
            :class="{ active: filterByType.has('aftertouch') }"
            @click="toggleTypeFilter('aftertouch')"
            title="Toggle Aftertouch messages"
          >
            <span class="type-dot" style="background: #95e1d3"></span>
          </button>
        </div>
        <ClearButton @click="clearHistory" title="Clear all messages" />
      </div>

      <!-- Messages -->
      <div v-if="!isSupported" class="message-item error">
        MIDI not supported in this browser
      </div>

      <div v-else-if="recentMessages.length === 0" class="message-item empty">
        No MIDI messages received
      </div>

      <div v-else class="messages-list panel-scrollable" :style="messagesListStyle">
        <div
          v-for="(msg, idx) in recentMessages"
          :key="`${msg.timestamp}-${idx}`"
          class="message-item"
          :style="{ borderLeftColor: getMessageColor(msg.type) }"
        >
          <span class="message-bullet">•</span>
          <span class="message-text">{{ formatMessage(msg) }}</span>
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.activity-dot {
  width: 8px;
  height: 8px;
  background-color: #ff4444;
  border-radius: 50%;
  animation: blink 0.2s ease;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.midi-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: hidden;
  padding: 2px;
}

.message-item {
  padding: 3px 6px;
  background-color: rgba(52, 204, 153, 0.1);
  border-left: 2px solid #34cc99;
  display: flex;
  align-items: center;
  color: #34cc99;
}

.message-item.empty,
.message-item.error {
  text-align: center;
  border-left: none;
}

.message-item.empty {
  color: #666;
}

.message-item.error {
  color: #ff4444;
}

.message-bullet {
  margin-right: 6px;
  font-weight: bold;
}

.message-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
