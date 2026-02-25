<script setup lang="ts">
import { defineModel, ref, computed, watch, onUnmounted } from 'vue'
import { useMidi, type ParsedMidiMessage } from '../composables/useMidi'
import { SourceExtra, DestinationExtra } from '../modules/documentModel'
import { EMPTY_ABBR, EMPTY_DESCRIPTION } from '../modules/dataModel'
import {
  MIDI_INTERFACES,
  LEARN_TIMEOUT_MS,
  type MidiInterface
} from '../constants/midi'
import IconButton from './IconButton.vue'

// Props to distinguish between source and destination modes
const props = defineProps<{
  mode: 'source' | 'destination'
  sourceType?: number // Required when mode='source': 5=MIDI, 6=MIDI CC, 7=MIDI NRPN
  isLocked?: boolean
  autoStart?: boolean // Auto-start learning when this prop becomes true
  lastLearnedMessage?: string | null // Last learned message key from parent (to prevent duplicates)
}>()

// Generic model that works with both SourceExtra and DestinationExtra
const model = defineModel<SourceExtra | DestinationExtra>({ required: true })

const emit = defineEmits(['update:modelValue', 'functionUpdate', 'updateLastMessage'])

const { startLearning, stopLearning } = useMidi()

// Interface selection (TRS, USB Host, USB Device)
const selectedInterface = ref<MidiInterface>('trs')
const interfaces = MIDI_INTERFACES

// Local learning state (not shared with other instances)
const isLocalLearning = ref<boolean>(false)

// Learn state
const learnedChannel = ref<number | null>(null)
const learnedValue = ref<number | null>(null)
const learningCountdown = ref<number>(10)
const countdownInterval = ref<number | null>(null)
const learnError = ref<string>('')

// Track if we've already auto-started (to prevent duplicate triggers)
const hasAutoStarted = ref(false)

// Computed values
const channelWithOffset = computed(() => {
  if (learnedChannel.value === null) return null
  const iface = interfaces.find((i) => i.value === selectedInterface.value)
  return learnedChannel.value + (iface?.offset || 0)
})

const hasLearnedValue = computed(() => learnedChannel.value !== null && learnedValue.value !== null)

// Display label for the learned value type
const valueTypeLabel = computed(() => {
  if (props.mode === 'source') {
    switch (props.sourceType) {
      case 5: return 'Note'
      case 6: return 'CC'
      case 7: return 'NRPN'
      default: return 'Value'
    }
  } else {
    // Destination mode: determine by value range
    return learnedValue.value !== null && learnedValue.value <= 127 ? 'CC' : 'NRPN'
  }
})

// Start learning
function handleStartLearning(): void {
  learnError.value = ''
  learningCountdown.value = LEARN_TIMEOUT_MS / 1000
  isLocalLearning.value = true

  // Start countdown
  if (countdownInterval.value) clearInterval(countdownInterval.value)
  countdownInterval.value = window.setInterval(() => {
    learningCountdown.value--
    if (learningCountdown.value <= 0) {
      handleStopLearning()
      learnError.value = 'No MIDI received'
      setTimeout(() => (learnError.value = ''), 3000)
    }
  }, 1000)

  // Start MIDI learning
  startLearning(handleMidiMessage)
}

// Stop learning
function handleStopLearning(): void {
  isLocalLearning.value = false
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
  stopLearning()
}

// Handle learned MIDI message - returns true if accepted, false if rejected
function handleMidiMessage(msg: ParsedMidiMessage): boolean {
  // Create a unique key for this message
  const messageKey = `${msg.type}-${msg.channel}-${msg.note ?? msg.cc ?? msg.nrpn ?? 0}`

  // Ignore if this is the same message as the last one learned globally
  if (props.lastLearnedMessage === messageKey) {
    return false
  }

  learnedChannel.value = msg.channel

  if (props.mode === 'source') {
    // Source mode: filter by sourceType
    switch (props.sourceType) {
      case 5: // MIDI (Note)
        if (msg.type === 'note' && msg.note !== undefined) {
          learnedValue.value = msg.note
          emit('updateLastMessage', messageKey)
          updateModel(msg.note)
          return true
        }
        break
      case 6: // MIDI CC
        if (msg.type === 'cc' && msg.cc !== undefined) {
          learnedValue.value = msg.cc
          emit('updateLastMessage', messageKey)
          updateModel(msg.cc)
          return true
        }
        break
      case 7: // MIDI NRPN
        if (msg.type === 'nrpn' && msg.nrpn !== undefined) {
          learnedValue.value = msg.nrpn
          emit('updateLastMessage', messageKey)
          updateModel(msg.nrpn)
          return true
        }
        break
    }
  } else {
    // Destination mode: handle CC and NRPN
    if (msg.type === 'cc' && msg.cc !== undefined) {
      learnedValue.value = msg.cc
      emit('updateLastMessage', messageKey)
      updateModel(msg.cc)
      return true
    } else if (msg.type === 'nrpn' && msg.nrpn !== undefined) {
      learnedValue.value = msg.nrpn
      emit('updateLastMessage', messageKey)
      updateModel(msg.nrpn)
      return true
    }
  }

  // Message type doesn't match expected type for this mode
  return false
}

// Update model with learned value
function updateModel(value: number): void {
  const abbr = generateAbbr(value)
  const description = generateDescription(value)

  if (props.mode === 'source') {
    model.value = new SourceExtra(value, abbr, description)
  } else {
    model.value = new DestinationExtra(value, abbr, description)
  }

  // Stop learning immediately after successful capture
  handleStopLearning()

  // Also emit function update with learned channel
  if (channelWithOffset.value !== null) {
    emit('functionUpdate', channelWithOffset.value)
  }
}

function generateAbbr(value: number): string {
  if (props.mode === 'source') {
    switch (props.sourceType) {
      case 5:
        return `NOTE`
      case 6:
        return `#${value.toString().padStart(3, ' ')}`
      case 7:
        return value.toString().padStart(4, ' ')
      default:
        return EMPTY_ABBR
    }
  } else {
    // Destination mode: CC (0-127) or NRPN (0-10127)
    return value <= 127 ? `#${value.toString().padStart(3, ' ')}` : value.toString().padStart(5, ' ')
  }
}

function generateDescription(value: number): string {
  if (props.mode === 'source') {
    switch (props.sourceType) {
      case 5:
        return `MIDI Note`
      case 6:
        return `MIDI Controller #${value}`
      case 7:
        return `MIDI NRPN Controller #${value}`
      default:
        return EMPTY_DESCRIPTION
    }
  } else {
    // Destination mode
    return value <= 127 ? `MIDI Controller #${value}` : `MIDI NRPN Controller #${value}`
  }
}

// Auto-start learning when autoStart prop becomes true
watch(
  () => props.autoStart,
  (shouldStart, oldValue) => {
    // Only trigger when changing from false to true, and only once
    if (shouldStart && !oldValue && !hasAutoStarted.value && !isLocalLearning.value && !props.isLocked) {
      hasAutoStarted.value = true
      // Small delay to ensure component is ready
      setTimeout(() => {
        handleStartLearning()
      }, 50)
    } else if (!shouldStart) {
      // Reset flag when autoStart becomes false
      hasAutoStarted.value = false
    }
  }
)

// Cleanup on unmount
onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  if (isLocalLearning.value) {
    stopLearning()
  }
})
</script>

<template>
  <div class="learn-container" :class="{ 'container-locked': isLocked }">
    <!-- Interface Selection -->
    <div class="interface-select" :class="{ 'section-locked': isLocked }">
      <label :class="{ 'label-locked': isLocked }">Interface:</label>
      <select v-model="selectedInterface" class="form-select form-select-sm" :disabled="isLocked" :class="{ 'select-locked': isLocked }">
        <option v-for="iface in interfaces" :key="iface.value" :value="iface.value">
          {{ iface.label }}
        </option>
      </select>
    </div>

    <!-- Learn Button / Status -->
    <div class="learn-controls">
      <IconButton
        v-if="!isLocalLearning"
        @click="handleStartLearning"
        class="learn-btn"
        :class="{ 'has-learned': hasLearnedValue, 'btn-locked': isLocked }"
        size="sm"
        variant="success"
        :disabled="isLocked"
      >
        {{ hasLearnedValue ? 'Re-Learn' : 'Start Learning' }}
      </IconButton>

      <div v-else class="learning-status">
        <span class="listening-text">Listening...</span>
        <span class="countdown">{{ learningCountdown }}s</span>
        <IconButton @click="handleStopLearning" size="sm" variant="danger">Cancel</IconButton>
      </div>
    </div>

    <!-- Learned Values Display -->
    <div v-if="hasLearnedValue" class="learned-values">
      <span class="value-label">Channel:</span>
      <span class="value-text">{{ channelWithOffset! + 1 }}</span>
      <span class="value-label">{{ valueTypeLabel }}:</span>
      <span class="value-text">{{ learnedValue }}</span>
    </div>

    <!-- Error Message -->
    <div v-if="learnError" class="learn-error">
      {{ learnError }}
    </div>
  </div>
</template>

<style scoped>
.learn-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 2px;
  background-color: #34cc99;
}

.interface-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interface-select label {
  font-weight: bold;
  min-width: 70px;
  color: black;
}

.interface-select select {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.1);
  color: black;
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
}

.learn-controls {
  display: flex;
  align-items: center;
}

.learn-btn {
  background-color: #f1f700 !important;
  border-color: #d4da00 !important;
  color: black;
  font-weight: bold;
  width: 100%;
}

.learn-btn:hover {
  background-color: #fff700 !important;
  border-color: #e6ec00 !important;
}

.learn-btn.has-learned {
  background-color: #4ecdc4 !important;
}

.btn-info:hover {
  background-color: #3db9b0 !important;
}

.learning-status {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  background-color: rgba(241, 247, 0, 0.3);
  border-radius: 3px;
  border: 2px solid #f1f700;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    border-color: #f1f700;
  }
  50% {
    border-color: #34cc99;
  }
}

.listening-text {
  flex: 1;
  font-weight: bold;
  color: black;
}

.countdown {
  font-weight: bold;
  color: #ff4444;
  min-width: 30px;
  text-align: right;
}

.learned-values {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: rgba(0, 0, 0, 0.1);
}

.value-label {
  font-weight: bold;
  color: black;
}

.value-text {
  color: black;
  background-color: rgba(255, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 2px;
}

.learn-error {
  padding: 6px 8px;
  background-color: #ff4444;
  color: white;
  border-radius: 3px;
  text-align: center;
  font-weight: bold;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
