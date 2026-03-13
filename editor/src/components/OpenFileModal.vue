<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue';
import { usePresetImport, type PresetManifestEntry } from '../composables/usePresetImport';
import type { Row, MappingDocument } from '../modules/documentModel';

interface MappingDocumentLike {
  rows: Array<{ source: { type: { key: number } } }>;
}

const props = defineProps<{
  mappingDocument: MappingDocumentLike;
  selectedRowIndices: Set<number>;
  lastClickedRowIndex: number | null;
  isLocked: boolean;
  pastePresetBlock: (block: Row[], targetStartIndex: number) => void;
  scheduleCacheSave: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error', duration?: number) => void;
}>();

const emit = defineEmits<{
  'close': [];
  'open-local-file': [];
}>();

const { fetchPresetManifest, loadPreset, getUsedRowCount, findAppendIndex } = usePresetImport();

const isLoading = ref(false);
const presets = ref<PresetManifestEntry[]>([]);
const selectedPresetId = ref<string | null>(null);
const loadedPresetDoc = shallowRef<MappingDocument | null>(null);
const startLine = ref(0);
const endLine = ref(0);
type InsertMode = 'append' | 'insert-at-cursor' | 'replace-selection';
const insertMode = ref<InsertMode>('append');

onMounted(async () => {
  try {
    presets.value = await fetchPresetManifest();
  } catch (e) {
    // Manifest not available
  }
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

const presetRowCount = computed(() =>
  loadedPresetDoc.value ? loadedPresetDoc.value.rows.length : 0
);

const usedRowCount = computed(() =>
  loadedPresetDoc.value ? getUsedRowCount(loadedPresetDoc.value) : 0
);

const selectedRangeCount = computed(() =>
  loadedPresetDoc.value ? endLine.value - startLine.value + 1 : 0
);

const sortedSelectedIndices = computed(() =>
  [...props.selectedRowIndices].sort((a, b) => a - b)
);

async function onPresetChange(id: string | null): Promise<void> {
  selectedPresetId.value = id;
  loadedPresetDoc.value = null;
  startLine.value = 0;
  endLine.value = 0;

  if (!id) return;
  const preset = presets.value.find(p => p.id === id);
  if (!preset) return;

  isLoading.value = true;
  try {
    const doc = await loadPreset(preset.filename);
    loadedPresetDoc.value = doc;
    const used = getUsedRowCount(doc);
    startLine.value = 0;
    endLine.value = used > 0 ? used - 1 : 0;
  } catch (e) {
    props.showToast(`Failed to load preset "${preset.label}".`, 'error');
  } finally {
    isLoading.value = false;
  }
}

watch(() => startLine.value, (val) => {
  if (val > endLine.value) endLine.value = val;
  if (loadedPresetDoc.value && val >= loadedPresetDoc.value.rows.length) {
    startLine.value = loadedPresetDoc.value.rows.length - 1;
  }
});

watch(() => endLine.value, (val) => {
  if (val < startLine.value) startLine.value = val;
  if (loadedPresetDoc.value && val >= loadedPresetDoc.value.rows.length) {
    endLine.value = loadedPresetDoc.value.rows.length - 1;
  }
});

function clampStart(val: number): void {
  if (!loadedPresetDoc.value) return;
  const max = loadedPresetDoc.value.rows.length - 1;
  startLine.value = Math.max(0, Math.min(val, Math.min(endLine.value, max)));
}

function clampEnd(val: number): void {
  if (!loadedPresetDoc.value) return;
  const max = loadedPresetDoc.value.rows.length - 1;
  endLine.value = Math.max(startLine.value, Math.min(val, max));
}

function computeTargetIndex(): number {
  switch (insertMode.value) {
    case 'append':
      return findAppendIndex(props.mappingDocument.rows);
    case 'insert-at-cursor':
      return props.lastClickedRowIndex ?? 0;
    case 'replace-selection': {
      const sorted = sortedSelectedIndices.value;
      return sorted[0] ?? 0;
    }
  }
}

const canImport = computed(() => {
  if (!loadedPresetDoc.value) return false;
  if (props.isLocked) return false;
  if (startLine.value > endLine.value) return false;
  if (insertMode.value === 'insert-at-cursor' && props.lastClickedRowIndex === null) return false;
  if (insertMode.value === 'replace-selection' && props.selectedRowIndices.size === 0) return false;
  return true;
});

function handleImport(): void {
  if (!loadedPresetDoc.value || !canImport.value) return;

  const block = loadedPresetDoc.value.rows.slice(startLine.value, endLine.value + 1);
  const targetStart = computeTargetIndex();
  const rowsFit = Math.min(block.length, 70 - targetStart);

  if (rowsFit <= 0) {
    props.showToast('No rows imported: target position is beyond row 70.', 'warning');
    return;
  }

  if (rowsFit < block.length) {
    props.showToast(
      `Block truncated: ${rowsFit} of ${block.length} rows imported (mapping is full).`,
      'warning'
    );
  }

  const truncatedBlock = block.slice(0, rowsFit);
  props.pastePresetBlock(truncatedBlock, targetStart);
  props.scheduleCacheSave();

  props.showToast(
    `Preset imported: ${truncatedBlock.length} rows from rows ${startLine.value}–${endLine.value}.`,
    'success'
  );

  emit('close');
}

function handleBrowse(): void {
  emit('open-local-file');
}
</script>

<template>
  <div class="ofm-backdrop" @click="$emit('close')">
    <div class="ofm-dialog" role="dialog" aria-modal="true" aria-label="Open Mapping File" @click.stop>
      <div class="ofm-header">
        <span class="ofm-title">Open Mapping File</span>
        <button class="ofm-close" @click="$emit('close')" title="Close">✕</button>
      </div>

      <div class="ofm-body">
        <!-- Left column: local file -->
        <div class="col-local">
          <div class="col-heading">Local File</div>
          <p class="col-description">Open a <code>.MAP</code> or <code>.JSON</code> file from your disk.</p>
          <button class="browse-btn" @click="handleBrowse">Browse…</button>
        </div>

        <div class="col-divider"></div>

        <!-- Right column: preset browser -->
        <div class="col-presets">
          <div class="col-heading">NerdSEQ Presets</div>

          <!-- Preset selection -->
          <div class="control-row">
            <label class="control-label">Preset</label>
            <select
              class="preset-select"
              :value="selectedPresetId"
              :disabled="isLoading"
              @change="onPresetChange(($event.target as HTMLSelectElement).value || null)"
            >
              <option value="">— select —</option>
              <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
            <span v-if="isLoading" class="loading-indicator">loading…</span>
          </div>

          <div v-if="loadedPresetDoc" class="row-meta-line">
            {{ usedRowCount }} used / {{ presetRowCount }} total
          </div>

          <template v-if="loadedPresetDoc">
            <!-- Row range -->
            <div class="control-row">
              <label class="control-label">Range</label>
              <div class="range-inputs">
                <label class="range-label">Start</label>
                <input
                  type="number"
                  class="range-input"
                  :value="startLine"
                  :min="0"
                  :max="presetRowCount - 1"
                  @change="clampStart(+($event.target as HTMLInputElement).value)"
                />
                <label class="range-label">End</label>
                <input
                  type="number"
                  class="range-input"
                  :value="endLine"
                  :min="startLine"
                  :max="presetRowCount - 1"
                  @change="clampEnd(+($event.target as HTMLInputElement).value)"
                />
                <span class="row-meta">{{ selectedRangeCount }} rows</span>
              </div>
            </div>

            <!-- Insert mode -->
            <div class="control-row mode-row">
              <label class="control-label">Mode</label>
              <div class="mode-options">
                <label class="mode-option">
                  <input type="radio" v-model="insertMode" value="append" />
                  Append to end
                </label>
                <label class="mode-option" :class="{ disabled: lastClickedRowIndex === null }">
                  <input
                    type="radio"
                    v-model="insertMode"
                    value="insert-at-cursor"
                    :disabled="lastClickedRowIndex === null"
                  />
                  Insert at row {{ lastClickedRowIndex !== null ? lastClickedRowIndex + 1 : '?' }}
                </label>
                <label class="mode-option" :class="{ disabled: selectedRowIndices.size === 0 }">
                  <input
                    type="radio"
                    v-model="insertMode"
                    value="replace-selection"
                    :disabled="selectedRowIndices.size === 0"
                  />
                  Replace selection ({{ selectedRowIndices.size }} rows)
                </label>
              </div>
            </div>

            <!-- Import button -->
            <div class="import-row">
              <button
                class="import-btn"
                :disabled="!canImport"
                @click="handleImport"
                title="Import the selected row range into the current mapping"
              >
                Import Block
              </button>
            </div>
          </template>

          <div v-else-if="!isLoading && presets.length === 0" class="no-presets">
            No presets available.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ofm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.ofm-dialog {
  background: #0a0a0a;
  border: 1px solid #34cc99;
  min-width: 560px;
  max-width: 760px;
  width: 90vw;
  box-shadow: 0 0 24px rgba(52, 204, 153, 0.2);
  pointer-events: auto;
}

.ofm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(52, 204, 153, 0.3);
}

.ofm-title {
  color: #34cc99;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ofm-close {
  background: none;
  border: none;
  color: #34cc99;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
  transition: color 0.15s;
}

.ofm-close:hover {
  color: #F1F700;
}

.ofm-body {
  display: flex;
  gap: 0;
  min-height: 180px;
}

/* Left column */
.col-local {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 14px;
  width: 180px;
  flex-shrink: 0;
}

.col-divider {
  width: 1px;
  background: rgba(52, 204, 153, 0.25);
  flex-shrink: 0;
}

/* Right column */
.col-presets {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 14px;
}

.col-heading {
  color: #34cc99;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(52, 204, 153, 0.2);
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.col-description {
  color: #888;
  font-size: 11px;
  margin: 0;
  line-height: 1.4;
}

.col-description code {
  color: #34cc99;
  font-size: 10px;
}

.browse-btn {
  padding: 6px 12px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
  align-self: flex-start;
}

.browse-btn:hover {
  background-color: rgba(52, 204, 153, 0.35);
}

/* Preset controls */
.control-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.control-label {
  color: #34cc99;
  font-size: 10px;
  font-weight: bold;
  width: 44px;
  flex-shrink: 0;
}

.preset-select {
  background-color: #000;
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  padding: 2px 4px;
  min-width: 140px;
  flex: 1;
}

.preset-select:disabled {
  opacity: 0.5;
}

.row-meta-line {
  color: rgba(52, 204, 153, 0.6);
  font-size: 10px;
  padding-left: 50px;
  margin-top: -4px;
}

.row-meta {
  color: rgba(52, 204, 153, 0.6);
  font-size: 10px;
}

.loading-indicator {
  color: rgba(52, 204, 153, 0.5);
  font-size: 10px;
  font-style: italic;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.range-label {
  color: rgba(52, 204, 153, 0.7);
  font-size: 10px;
}

.range-input {
  width: 46px;
  background-color: #000;
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  padding: 1px 4px;
  text-align: center;
}

.mode-row {
  align-items: flex-start;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #34cc99;
  font-size: 10px;
  cursor: pointer;
}

.mode-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mode-option input[type="radio"] {
  accent-color: #34cc99;
}

.import-row {
  margin-top: 4px;
}

.import-btn {
  padding: 5px 20px;
  background-color: #34cc99;
  border: 1px solid #34cc99;
  color: #000;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.import-btn:hover:not(:disabled) {
  background-color: #F1F700;
  border-color: #F1F700;
}

.import-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.no-presets {
  color: rgba(52, 204, 153, 0.4);
  font-size: 11px;
  font-style: italic;
  padding-left: 50px;
}
</style>
