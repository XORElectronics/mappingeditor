<script setup lang="ts">
import { ref, computed } from 'vue';
import BasePanel from './BasePanel.vue';
import CollapsibleSection from './CollapsibleSection.vue';
import { ROW_COLORS } from '../constants/colors';
import { usePanelLayout } from '../composables/usePanelLayout';

const importFileRef = ref<HTMLInputElement | null>(null);

function onImportFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  emit('local-file-selected', file);
  if (importFileRef.value) importFileRef.value.value = '';
}

const props = defineProps<{
  selectedCount: number;
  hasCopiedRow: boolean;
  hasCopiedRows: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLocked: boolean;
  activeSlot: 'A' | 'B';
  isLockedA: boolean;
  isLockedB: boolean;
  hasDataA: boolean;
  hasDataB: boolean;
}>();

const { selectionRight } = usePanelLayout();

const emit = defineEmits<{
  (e: 'expandedChange', expanded: boolean): void;
  (e: 'cut'): void;
  (e: 'copy'): void;
  (e: 'paste'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
  (e: 'clear'): void;
  (e: 'setColor', color: string | null): void;
  (e: 'cancel'): void;
  (e: 'switchSlot', slot: 'A' | 'B'): void;
  (e: 'reset'): void;
  (e: 'local-file-selected', file: File): void;
  (e: 'open-preset-library'): void;
  (e: 'download-html'): void;
  (e: 'download-markdown'): void;
  (e: 'download-markdown-ns'): void;
  (e: 'download-json'): void;
  (e: 'download-map'): void;
}>();

// Track expanded state - initialize from localStorage to match BasePanel's initial state
const storageKey = 'selection-toolbar-expanded';
const initialExpanded = localStorage.getItem(storageKey) === 'true';
const isExpanded = ref(initialExpanded);

function getSlotTitle(slot: 'A' | 'B'): string {
  const isActive = props.activeSlot === slot;
  const isLocked = slot === 'A' ? props.isLockedA : props.isLockedB;
  const num = slot === 'A' ? '1' : '2';
  if (isActive) return isLocked ? `Click to unlock [${num}]` : `Click to lock [${num}]`;
  return isLocked ? `Switch to slot ${num} (locked) [${num}]` : `Switch to slot ${num} [${num}]`;
}

// Panel title based on selection count and expanded state
const panelTitle = computed(() => {
  // When minimized (folded), always show "Selection"
  if (!isExpanded.value) return 'Selection';

  // When expanded, show count
  if (props.selectedCount === 0) return 'Selection';
  if (props.selectedCount === 1) return '1 row selected';
  return `${props.selectedCount} rows selected`;
});

// Whether we have any selection
const hasSelection = computed(() => props.selectedCount > 0);

// Whether we can paste (have clipboard content)
const canPaste = computed(() => props.hasCopiedRow || props.hasCopiedRows);


const showColorPicker = ref(false);

function handleColorSelect(colorName: string | null): void {
  emit('setColor', colorName);
  showColorPicker.value = false;
}

function onExpandedChange(expanded: boolean): void {
  isExpanded.value = expanded;
  emit('expandedChange', expanded);
}
</script>

<template>
  <BasePanel
    :title="panelTitle"
    storage-key="selection-toolbar-expanded"
    :right-position="selectionRight"
    minimized-width="120px"
    expanded-width="200px"
    @expanded-change="onExpandedChange"
  >

    <div class="toolbar-content">
      <!-- Slots subsection -->
      <div class="slots-section">
        <CollapsibleSection label="Slots" storage-key="selection-slots-expanded">
          <div class="slots-buttons">
            <button
              class="slot-btn"
              :class="{
                'slot-btn--active': activeSlot === 'A',
                'slot-btn--locked': isLockedA,
                'slot-btn--no-data': !hasDataA
              }"
              :title="getSlotTitle('A')"
              @click="$emit('switchSlot', 'A')"
            >1</button>
            <button
              class="slot-btn"
              :class="{
                'slot-btn--active': activeSlot === 'B',
                'slot-btn--locked': isLockedB,
                'slot-btn--no-data': !hasDataB
              }"
              :title="getSlotTitle('B')"
              @click="$emit('switchSlot', 'B')"
            >2</button>
          </div>
          <button
            class="reset-btn"
            :disabled="isLocked"
            @click="$emit('reset')"
            title="Reset mapping to empty"
          >
            Reset
          </button>
        </CollapsibleSection>
      </div>

      <!-- File subsection -->
      <div class="file-section">
        <CollapsibleSection label="File" storage-key="selection-file-expanded">
          <input
            type="file"
            ref="importFileRef"
            accept=".map,.json"
            class="hidden-file-input"
            @change="onImportFileChange"
          />
          <div class="file-buttons">
            <button class="file-btn" @click="importFileRef?.click()">Import…</button>
            <button class="file-btn" @click="emit('open-preset-library')">Open Preset Library…</button>
          </div>
          <div class="save-label">Save as:</div>
          <div class="save-grid">
            <button class="save-btn" @click="emit('download-html')">HTML</button>
            <button class="save-btn" @click="emit('download-markdown')">MD</button>
            <button class="save-btn" @click="emit('download-markdown-ns')">NS MD</button>
            <button class="save-btn" @click="emit('download-json')">JSON</button>
            <button class="save-btn" @click="emit('download-map')">MAP</button>
          </div>
        </CollapsibleSection>
      </div>

      <!-- Actions subsection -->
      <CollapsibleSection label="Actions" storage-key="selection-actions-expanded">
        <!-- No selection state -->
        <div v-if="!hasSelection" class="no-selection">
          <div class="empty-message">No rows selected</div>
          <div class="hint">Click a row to select it</div>
          <button
            v-if="canPaste"
            class="action-btn paste-available"
            @click="$emit('paste')"
            title="Paste rows"
          >
            Paste Available
          </button>
        </div>

        <!-- Has selection -->
        <div v-else class="selection-actions">
          <!-- Action buttons row 1: Cut, Copy, Paste -->
          <div class="button-row">
            <button
              class="action-btn"
              :disabled="isLocked"
              @click="$emit('cut')"
              title="Cut (Ctrl+X)"
            >
              Cut
            </button>
            <button
              class="action-btn"
              @click="$emit('copy')"
              title="Copy (Ctrl+C)"
            >
              Copy
            </button>
            <button
              class="action-btn"
              @click="$emit('paste')"
              :disabled="!canPaste || isLocked"
              title="Paste (Ctrl+V)"
            >
              Paste
            </button>
          </div>

          <!-- Action buttons row 2: Move Up, Move Down -->
          <div class="button-row">
            <button
              class="action-btn"
              @click="$emit('moveUp')"
              :disabled="!canMoveUp || isLocked"
              title="Move Up"
            >
              Move Up
            </button>
            <button
              class="action-btn"
              @click="$emit('moveDown')"
              :disabled="!canMoveDown || isLocked"
              title="Move Down"
            >
              Move Down
            </button>
          </div>

          <!-- Action buttons row 3: Color, Clear, Cancel -->
          <div class="button-row">
            <button
              class="action-btn color-btn"
              :disabled="isLocked"
              @click="showColorPicker = !showColorPicker"
              title="Set Color"
            >
              Color
            </button>
            <button
              class="action-btn btn-danger"
              :disabled="isLocked"
              @click="$emit('clear')"
              title="Clear (Delete)"
            >
              Clear
            </button>
            <button
              class="action-btn btn-cancel"
              @click="$emit('cancel')"
              title="Cancel (Escape)"
            >
              Deselect
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
            <button
              class="color-swatch color-none"
              @click="handleColorSelect(null)"
              title="Clear color"
            >
              X
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  </BasePanel>
</template>

<style scoped>
.toolbar-content {
  padding: 4px;
}

/* File subsection — no extra border; CollapsibleSection header border-top provides the separator */
.file-section {
  margin-bottom: 4px;
}

.hidden-file-input {
  display: none;
}

.file-buttons {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 6px;
}

.file-btn {
  width: 100%;
  font-size: 10px;
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: center;
}

.file-btn:hover {
  background-color: rgba(52, 204, 153, 0.35);
}

.save-label {
  color: #34cc99;
  font-size: 10px;
  font-weight: 500;
  margin-top: 6px;
  margin-bottom: 3px;
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}

.save-btn {
  font-size: 10px;
  padding: 3px 2px;
  background-color: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.5);
  color: #34cc99;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: center;
}

.save-btn:hover {
  background-color: rgba(52, 204, 153, 0.3);
}

/* Slots subsection — first section, so suppress the CollapsibleSection header's top border */
.slots-section {
  margin-bottom: 4px;
}

.slots-section :deep(.cs-header) {
  border-top: none;
  margin-top: 0;
  padding-top: 2px;
}

.slots-buttons {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.reset-btn {
  width: 100%;
  margin-top: 4px;
  padding: 3px 6px;
  background-color: rgba(220, 53, 69, 0.15);
  border: 1px solid #dc3545;
  color: #dc3545;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
}

.reset-btn:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.35);
}

.reset-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.slot-btn {
  flex: 1;
  height: 28px;
  padding: 0;
  background-color: #000;
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-btn:hover {
  background-color: rgba(52, 204, 153, 0.3);
}

.slot-btn--active {
  background-color: #F1F700;
  color: #000;
  border-color: #F1F700;
}

.slot-btn--no-data {
  border-style: dashed;
  opacity: 0.7;
}

.slot-btn--locked:not(.slot-btn--active) {
  border-color: #dc3545;
  border-style: solid;
  color: #dc3545;
}

.slot-btn--active.slot-btn--locked {
  box-shadow: 0 0 8px 2px #dc3545, inset 0 0 4px rgba(220, 53, 69, 0.3);
  border-color: #dc3545;
}

.no-selection {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  padding: 4px 0;
}

.empty-message {
  color: #34cc99;
  font-weight: bold;
  font-size: 11px;
}

.hint {
  color: rgba(52, 204, 153, 0.6);
  font-size: 10px;
}

.selection-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.button-row {
  display: flex;
  gap: 2px;
}

.action-btn {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #34cc99;
  background-color: rgba(52, 204, 153, 0.1);
  color: #34cc99;
  cursor: pointer;
  font-size: 10px;
  font-weight: bold;
  transition: background-color 0.15s;
  text-align: center;
}

.action-btn:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.35);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.btn-danger {
  background-color: rgba(220, 53, 69, 0.15);
  border-color: #dc3545;
  color: #dc3545;
}

.action-btn.btn-danger:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.35);
}

.action-btn.btn-cancel {
  background-color: rgba(52, 204, 153, 0.05);
  border-color: rgba(52, 204, 153, 0.4);
  color: rgba(52, 204, 153, 0.6);
}

.action-btn.btn-cancel:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.2);
  color: #34cc99;
}

.action-btn.paste-available {
  background-color: rgba(52, 204, 153, 0.2);
  border-color: #34cc99;
  color: #34cc99;
  margin-top: 4px;
}

.action-btn.paste-available:hover {
  background-color: rgba(52, 204, 153, 0.4);
}

.color-picker {
  margin-top: 4px;
  padding: 6px;
  background-color: rgba(52, 204, 153, 0.1);
  border: 1px solid #34cc99;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid #34cc99;
  cursor: pointer;
  transition: transform 0.1s ease;
  min-height: 24px;
}

.color-swatch:hover {
  transform: scale(1.1);
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
