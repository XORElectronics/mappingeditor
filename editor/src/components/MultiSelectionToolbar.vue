<script setup lang="ts">
import { ref, computed } from 'vue';
import { ROW_COLORS } from '../constants/colors';

const props = defineProps<{
  selectedCount: number;
  hasCopiedRows: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  midiMonitorExpanded: boolean;
  variableMonitorExpanded: boolean;
}>();

// Position to the left of Variable Monitor
// MIDI Monitor: minimized=150px, expanded=320px (+ 10px gap each side)
// Variable Monitor: minimized=100px, expanded=200px (+ 10px gap)
const rightPosition = computed(() => {
  const midiWidth = props.midiMonitorExpanded ? 330 : 160;
  const varWidth = props.variableMonitorExpanded ? 210 : 110;
  return `${midiWidth + varWidth + 10}px`;
});

const emit = defineEmits<{
  (e: 'cut'): void;
  (e: 'copy'): void;
  (e: 'paste'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
  (e: 'clear'): void;
  (e: 'setColor', color: string | null): void;
  (e: 'cancel'): void;
}>();

const showColorPicker = ref(false);

function handleColorSelect(colorName: string | null): void {
  emit('setColor', colorName);
  showColorPicker.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="selectedCount > 1"
      class="multi-selection-toolbar"
      :style="{ right: rightPosition }"
    >
      <span class="selection-count">{{ selectedCount }} rows</span>
    <div class="toolbar-buttons">
      <button @click="$emit('cut')" title="Cut (Ctrl+X)">
        Cut
      </button>
      <button @click="$emit('copy')" title="Copy (Ctrl+C)">
        Copy
      </button>
      <button @click="$emit('paste')" :disabled="!hasCopiedRows" title="Paste (Ctrl+V)">
        Paste
      </button>
      <div class="separator"></div>
      <button @click="$emit('moveUp')" :disabled="!canMoveUp" title="Move Up">
        Up
      </button>
      <button @click="$emit('moveDown')" :disabled="!canMoveDown" title="Move Down">
        Down
      </button>
      <div class="separator"></div>
      <button @click="$emit('clear')" class="danger-btn" title="Clear (Delete)">
        Clear
      </button>
      <button @click="showColorPicker = !showColorPicker" title="Set Color" class="color-btn">
        Color
      </button>
      <button @click="$emit('cancel')" title="Cancel (Escape)" class="cancel-btn">
        X
      </button>
    </div>

      <!-- Color picker dropdown -->
      <div v-if="showColorPicker" class="color-picker">
        <button
          v-for="color in ROW_COLORS"
          :key="color.name"
          class="color-swatch"
          :style="{ backgroundColor: color.value }"
          @click="handleColorSelect(color.name)"
          :title="color.name"
        ></button>
        <button class="color-swatch color-none" @click="handleColorSelect(null)" title="Clear color">
          X
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.multi-selection-toolbar {
  position: fixed;
  top: 10px;
  background-color: #34cc99;
  border-bottom: 2px solid #000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  z-index: 1000;
  transition: right 0.3s ease;
}

.selection-count {
  font-weight: bold;
  color: #000;
  white-space: nowrap;
  padding-right: 4px;
  border-right: 2px solid #000;
  line-height: 1;
}

.toolbar-buttons {
  display: flex;
  gap: 1px;
  align-items: center;
}

.toolbar-buttons button {
  padding: 0px 6px;
  border: 1px solid #000;
  background-color: #000;
  color: #34cc99;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: bold;
  transition: background-color 0.15s ease;
  height: 18px;
  line-height: 1;
}

.toolbar-buttons button:hover:not(:disabled) {
  background-color: #F1F700;
  color: #000;
}

.toolbar-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-buttons .danger-btn {
  background-color: #cc8534;
  color: #000;
}

.toolbar-buttons .danger-btn:hover:not(:disabled) {
  background-color: #F1F700;
  color: #000;
}

.toolbar-buttons .cancel-btn {
  background-color: #000;
  color: #34cc99;
  padding: 2px 6px;
}

.toolbar-buttons .cancel-btn:hover {
  background-color: #F1F700;
  color: #000;
}

.separator {
  width: 2px;
  height: 14px;
  background: #000;
  margin: 0 2px;
}

.color-picker {
  position: absolute;
  top: 100%;
  right: 40px;
  margin-top: 4px;
  background-color: #000;
  border: 2px solid #34cc99;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border: 1px solid #34cc99;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.color-swatch:hover {
  transform: scale(1.15);
  border-color: #F1F700;
}

.color-none {
  background-color: #333 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #34cc99;
}
</style>
