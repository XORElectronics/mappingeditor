<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  usePresetImport, buildGhostRows,
  type PresetManifestEntry, type ImportPreview
} from '../composables/usePresetImport';
import type { Row, MappingDocument } from '../modules/documentModel';

interface MappingDocumentLike {
  rows: Array<{ source: { type: { key: number } } }>;
}

const props = defineProps<{
  mappingDocument: MappingDocumentLike;
  isLocked: boolean;
  pastePresetBlock: (block: Row[], targetStartIndex: number) => void;
  scheduleCacheSave: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error', duration?: number) => void;
}>();

const emit = defineEmits<{
  'close': [];
  'preview-change': [preview: ImportPreview | null];
}>();

const { fetchPresetManifest, loadPreset, getUsedRowCount, findAppendIndex } = usePresetImport();

// ─── Filter state ─────────────────────────────────────────────────────────────
const filterText = ref('');
const filterCategory = ref('');

// ─── Preset state ────────────────────────────────────────────────────────────
const isLoading = ref(false);
const presets = ref<PresetManifestEntry[]>([]);
const selectedPresetId = ref<string | null>(null);
const loadedPresetDoc = shallowRef<MappingDocument | null>(null);
const startLine = ref(0);
const endLine = ref(0);
const targetRow = ref(0);

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

// ─── Filter computed ──────────────────────────────────────────────────────────
const availableCategories = computed(() =>
  [...new Set(presets.value.map(p => p.category).filter((c): c is string => !!c))]
);

const filteredPresets = computed(() => {
  return presets.value.filter(p => {
    const matchText = !filterText.value ||
      p.label.toLowerCase().includes(filterText.value.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(filterText.value.toLowerCase());
    const matchCat = !filterCategory.value || p.category === filterCategory.value;
    return matchText && matchCat;
  });
});

// Reset selected preset if it's filtered out
watch(filteredPresets, (list) => {
  if (selectedPresetId.value && !list.find(p => p.id === selectedPresetId.value)) {
    selectedPresetId.value = null;
    loadedPresetDoc.value = null;
    startLine.value = 0;
    endLine.value = 0;
  }
});

// ─── Preset computed ─────────────────────────────────────────────────────────
const presetRowCount = computed(() =>
  loadedPresetDoc.value ? loadedPresetDoc.value.rows.length : 0
);

const usedRowCount = computed(() =>
  loadedPresetDoc.value ? getUsedRowCount(loadedPresetDoc.value) : 0
);

const selectedRangeCount = computed(() =>
  loadedPresetDoc.value ? endLine.value - startLine.value + 1 : 0
);

const selectedPreset = computed(() =>
  presets.value.find(p => p.id === selectedPresetId.value) ?? null
);

// ─── Preset methods ───────────────────────────────────────────────────────────
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
    targetRow.value = findAppendIndex(props.mappingDocument.rows);
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
  if (loadedPresetDoc.value) {
    const max = Math.min(usedRowCount.value - 1, loadedPresetDoc.value.rows.length - 1);
    if (val > max) endLine.value = max;
  }
});

function clampStart(val: number): void {
  if (!loadedPresetDoc.value) return;
  const max = loadedPresetDoc.value.rows.length - 1;
  startLine.value = Math.max(0, Math.min(val, Math.min(endLine.value, max)));
}

function clampEnd(val: number): void {
  if (!loadedPresetDoc.value) return;
  const max = Math.min(usedRowCount.value - 1, loadedPresetDoc.value.rows.length - 1);
  endLine.value = Math.max(startLine.value, Math.min(val, max));
}

function clampTargetRow(val: number): void {
  const maxStart = Math.max(0, 69 - (selectedRangeCount.value - 1));
  targetRow.value = Math.max(0, Math.min(val, maxStart));
}

const canImport = computed(() => {
  if (!loadedPresetDoc.value) return false;
  if (props.isLocked) return false;
  if (startLine.value > endLine.value) return false;
  return true;
});

function handleImport(): void {
  if (!loadedPresetDoc.value || !canImport.value) return;

  const block = loadedPresetDoc.value.rows.slice(startLine.value, endLine.value + 1);
  const targetStart = targetRow.value;
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

// ─── Import preview ───────────────────────────────────────────────────────────
const activePreview = computed<ImportPreview | null>(() => {
  if (!loadedPresetDoc.value) return null;
  const blockSize = endLine.value - startLine.value + 1;
  if (blockSize <= 0) return null;
  const { ghostRows, cutCount } = buildGhostRows(
    loadedPresetDoc.value.rows, startLine.value, endLine.value, targetRow.value
  );
  return { targetIndex: targetRow.value, blockSize, ghostRows, cutCount };
});

watch(activePreview, (p) => emit('preview-change', p), { immediate: true });
</script>

<template>
  <div class="plm-backdrop">
    <div class="plm-dialog" role="dialog" aria-modal="true" aria-label="Preset Library">
      <div class="plm-header">
        <span class="plm-title">Preset Library</span>
        <button class="plm-close" @click="$emit('close')" title="Close">✕</button>
      </div>

      <div class="plm-body">
        <!-- Filter controls -->
        <div class="filter-row">
          <input
            type="text"
            class="filter-input"
            v-model="filterText"
            placeholder="Search…"
          />
          <select
            class="filter-cat"
            v-model="filterCategory"
          >
            <option value="">All categories</option>
            <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Preset selection -->
        <div class="control-row">
          <label class="control-label">Preset</label>
          <select
            class="preset-select"
            :value="selectedPresetId"
            :disabled="isLoading"
            @change="onPresetChange(($event.target as HTMLSelectElement).value || null)"
          >
            <option value="">— select preset —</option>
            <option v-for="p in filteredPresets" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
          <span v-if="isLoading" class="loading-indicator">loading…</span>
        </div>

        <!-- Preset info line -->
        <div v-if="selectedPreset && (selectedPreset.category || selectedPreset.description)" class="preset-info">
          <span v-if="selectedPreset.category" class="preset-category">{{ selectedPreset.category }}</span>
          <span v-if="selectedPreset.description" class="preset-description">{{ selectedPreset.description }}</span>
        </div>

        <div v-if="loadedPresetDoc" class="row-meta-line">
          {{ usedRowCount }} used / {{ presetRowCount }} total
        </div>

        <template v-if="loadedPresetDoc">
          <!-- Source range (From file) -->
          <div class="control-row">
            <label class="control-label">From file</label>
            <div class="range-inputs">
              <label class="range-label">Start</label>
              <div class="num-wrap">
                <input
                  type="number"
                  class="range-input"
                  :value="startLine"
                  :min="0"
                  :max="usedRowCount - 1"
                  @change="clampStart(+($event.target as HTMLInputElement).value)"
                />
                <div class="num-btns">
                  <button class="num-btn" @click="clampStart(startLine - 1)">▴</button>
                  <button class="num-btn" @click="clampStart(startLine + 1)">▾</button>
                </div>
              </div>
              <label class="range-label">to</label>
              <div class="num-wrap">
                <input
                  type="number"
                  class="range-input"
                  :value="endLine"
                  :min="startLine"
                  :max="usedRowCount - 1"
                  @change="clampEnd(+($event.target as HTMLInputElement).value)"
                />
                <div class="num-btns">
                  <button class="num-btn" @click="clampEnd(endLine - 1)">▴</button>
                  <button class="num-btn" @click="clampEnd(endLine + 1)">▾</button>
                </div>
              </div>
              <span class="row-meta">{{ selectedRangeCount }} rows</span>
            </div>
          </div>

          <!-- Insert position -->
          <div class="control-row">
            <label class="control-label">Insert at</label>
            <div class="range-inputs">
              <div class="num-wrap">
                <input
                  type="number"
                  class="range-input"
                  :value="targetRow"
                  :min="0"
                  :max="69"
                  @change="clampTargetRow(+($event.target as HTMLInputElement).value)"
                />
                <div class="num-btns">
                  <button class="num-btn" @click="clampTargetRow(targetRow - 1)">▴</button>
                  <button class="num-btn" @click="clampTargetRow(targetRow + 1)">▾</button>
                </div>
              </div>
              <button class="append-btn" @click="targetRow = findAppendIndex(mappingDocument.rows)" title="Jump to first empty row">↓ Append</button>
            </div>
          </div>
          <div v-if="selectedRangeCount > 0" class="overwrite-info">
            Rows {{ targetRow }}–{{ Math.min(targetRow + selectedRangeCount - 1, 69) }} will be overwritten
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
</template>

<style scoped>
.plm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plm-dialog {
  position: relative;
  pointer-events: auto;
  width: 420px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  background: #0a0a0a;
  border: 1px solid #34cc99;
  box-shadow: 0 0 24px rgba(52, 204, 153, 0.2);
}

.plm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(52, 204, 153, 0.3);
}

.plm-title {
  color: #34cc99;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plm-close {
  background: none;
  border: none;
  color: #34cc99;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
  transition: color 0.15s;
}

.plm-close:hover {
  color: #F1F700;
}

.plm-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 14px;
}

/* Filter row */
.filter-row {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.filter-input {
  flex: 1;
  background-color: #000;
  border: 1px solid rgba(52, 204, 153, 0.5);
  color: #34cc99;
  font-size: 11px;
  padding: 3px 6px;
  min-width: 0;
}

.filter-input::placeholder {
  color: rgba(52, 204, 153, 0.35);
}

.filter-cat {
  background-color: #000;
  border: 1px solid rgba(52, 204, 153, 0.5);
  color: #34cc99;
  font-size: 11px;
  padding: 2px 4px;
  flex-shrink: 0;
}

/* Preset info line */
.preset-info {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-left: 50px;
  margin-top: -4px;
}

.preset-category {
  background: rgba(52, 204, 153, 0.15);
  border: 1px solid rgba(52, 204, 153, 0.4);
  color: #34cc99;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 1px 5px;
}

.preset-description {
  color: rgba(52, 204, 153, 0.6);
  font-size: 10px;
  font-style: italic;
}

/* Controls */
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

.num-wrap {
  display: flex;
  align-items: stretch;
}

.range-input {
  width: 38px;
  background-color: #000;
  border: 1px solid #34cc99;
  border-right: none;
  color: #34cc99;
  font-size: 11px;
  padding: 1px 4px;
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;
}

.range-input::-webkit-outer-spin-button,
.range-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.num-btns {
  display: flex;
  flex-direction: column;
  border: 1px solid #34cc99;
}

.num-btn {
  flex: 1;
  width: 16px;
  background: rgba(52, 204, 153, 0.1);
  border: none;
  border-bottom: 1px solid rgba(52, 204, 153, 0.4);
  color: #34cc99;
  font-size: 8px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s;
}

.num-btn:last-child {
  border-bottom: none;
}

.num-btn:hover {
  background: rgba(52, 204, 153, 0.35);
  color: #F1F700;
}

.num-btn:active {
  background: rgba(52, 204, 153, 0.55);
}

.append-btn {
  font-size: 10px;
  padding: 2px 8px;
  background-color: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.6);
  color: #34cc99;
  cursor: pointer;
  transition: background-color 0.1s;
  flex-shrink: 0;
}

.append-btn:hover {
  background-color: rgba(52, 204, 153, 0.3);
}

.overwrite-info {
  color: rgba(241, 247, 0, 0.7);
  font-size: 10px;
  font-style: italic;
  padding-left: 50px;
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
