<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import BasePanel from './BasePanel.vue';
import CollapsibleSection from './CollapsibleSection.vue';
import { ROW_COLORS } from '../constants/colors';
import { usePanelLayout } from '../composables/usePanelLayout';

// Props and emits first — everything else may reference them
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
  fileName: string;
  globalComment: string | undefined;
}>();

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
  (e: 'update:fileName', value: string): void;
  (e: 'update:globalComment', value: string | undefined): void;
}>();

const { selectionRight } = usePanelLayout();

// File input
const importFileRef = ref<HTMLInputElement | null>(null);

function onImportFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  emit('local-file-selected', file);
  if (importFileRef.value) importFileRef.value.value = '';
}

// Description wrapper resize
const DESCRIPTION_HEIGHT_KEY = 'selection-description-height';
const descriptionHeight = ref(Number(localStorage.getItem(DESCRIPTION_HEIGHT_KEY)) || 80);
const isResizingDescription = ref(false);
const resizeStartY = ref(0);
const resizeStartHeight = ref(0);

function startDescriptionResize(event: MouseEvent): void {
  isResizingDescription.value = true;
  resizeStartY.value = event.clientY;
  resizeStartHeight.value = descriptionHeight.value;
  document.addEventListener('mousemove', handleDescriptionResize);
  document.addEventListener('mouseup', stopDescriptionResize);
  event.preventDefault();
}

function handleDescriptionResize(event: MouseEvent): void {
  if (!isResizingDescription.value) return;
  const deltaY = event.clientY - resizeStartY.value;
  descriptionHeight.value = Math.max(40, Math.min(400, resizeStartHeight.value + deltaY));
}

function stopDescriptionResize(): void {
  isResizingDescription.value = false;
  localStorage.setItem(DESCRIPTION_HEIGHT_KEY, String(descriptionHeight.value));
  document.removeEventListener('mousemove', handleDescriptionResize);
  document.removeEventListener('mouseup', stopDescriptionResize);
}

// Auto-resize textarea to fit its content
const descriptionTextareaRef = ref<HTMLTextAreaElement | null>(null);
const descriptionExpanded = ref(localStorage.getItem('selection-description-expanded') === 'true');

function autoResizeTextarea(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function onDescriptionInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit('update:globalComment', target.value || undefined);
  autoResizeTextarea(target);
}

// Re-run auto-resize when value is set externally (file open, slot switch)
watch(() => props.globalComment, async () => {
  await nextTick();
  if (descriptionTextareaRef.value) autoResizeTextarea(descriptionTextareaRef.value);
});

onMounted(async () => {
  await nextTick();
  if (descriptionTextareaRef.value) autoResizeTextarea(descriptionTextareaRef.value);
});

// Track expanded state
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
    custom-max-height="none"
    @expanded-change="onExpandedChange"
  >

    <div class="toolbar-content" :class="{ 'toolbar-content--description-folded': !descriptionExpanded }">
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
          <div class="filename-row">
            <label class="filename-label">Slot name</label>
            <input
              type="text"
              class="filename-input"
              :value="fileName"
              :disabled="isLocked"
              :class="{ 'input-locked': isLocked }"
              title="File name used for all exports"
              @input="$emit('update:fileName', ($event.target as HTMLInputElement).value)"
            />
          </div>
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
            <button class="file-btn" @click="importFileRef?.click()">Import Local Mapping</button>
            <button class="file-btn" @click="emit('open-preset-library')">Open Preset Library</button>
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

      <!-- Description subsection -->
      <CollapsibleSection label="Description" storage-key="selection-description-expanded" :default-expanded="false" @update:expanded="descriptionExpanded = $event">
        <div class="description-wrapper" :style="{ height: descriptionHeight + 'px' }">
          <textarea
            ref="descriptionTextareaRef"
            class="description-textarea"
            :value="globalComment ?? ''"
            :disabled="isLocked"
            placeholder="Add a description for this mapping…"
            @input="onDescriptionInput"
          ></textarea>
        </div>
        <div
          class="resize-handle"
          title="Drag to resize"
          @mousedown="startDescriptionResize"
        >
          <div class="resize-indicator"></div>
        </div>
      </CollapsibleSection>
    </div>
  </BasePanel>
</template>

<style scoped>
.toolbar-content {
  padding: 4px 4px 0 4px;
}

.toolbar-content--description-folded {
  padding-bottom: 4px;
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
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.2);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.slot-btn:hover {
  background-color: rgba(52, 204, 153, 0.4);
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

.filename-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.filename-label {
  color: rgba(52, 204, 153, 0.7);
  font-size: 9px;
}

.filename-input {
  width: 100%;
  background-color: rgba(52, 204, 153, 0.05);
  border: 1px solid rgba(52, 204, 153, 0.4);
  color: #34cc99;
  font-size: 10px;
  padding: 2px 4px;
  box-sizing: border-box;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
  cursor: text;
}

.filename-input:focus {
  outline: none;
  border-color: #F1F700;
  color: #F1F700;
}

.filename-input.input-locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.description-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 4px;
  background-color: #000;
}

.description-wrapper::-webkit-scrollbar {
  width: 6px;
}

.description-wrapper::-webkit-scrollbar-track {
  background: rgba(52, 204, 153, 0.05);
}

.description-wrapper::-webkit-scrollbar-thumb {
  background: rgba(52, 204, 153, 0.4);
  border-radius: 3px;
}

.description-wrapper::-webkit-scrollbar-thumb:hover {
  background: #34cc99;
}

.description-textarea {
  display: block;
  width: 100%;
  min-height: 100%;
  background-color: transparent;
  border: 1px solid rgba(52, 204, 153, 0.25);
  color: #34cc99;
  font-size: 10px;
  padding: 4px;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
  overflow: hidden;
}

.description-textarea:focus {
  outline: none;
  border-color: rgba(52, 204, 153, 0.6);
}

.description-textarea:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  transition: background-color 0.2s;
}

.resize-handle:hover .resize-indicator {
  background: #34cc99;
}
</style>
