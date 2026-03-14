<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  usePresetImport, loadLocalFile, buildGhostRows,
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
  'load-full-file': [file: File];
  'preview-change': [preview: ImportPreview | null];
}>();

const { fetchPresetManifest, loadPreset, getUsedRowCount, findAppendIndex } = usePresetImport();

// ─── Preset state ────────────────────────────────────────────────────────────
const isLoading = ref(false);
const presets = ref<PresetManifestEntry[]>([]);
const selectedPresetId = ref<string | null>(null);
const loadedPresetDoc = shallowRef<MappingDocument | null>(null);
const startLine = ref(0);
const endLine = ref(0);
const targetRow = ref(0);

// ─── Local file state ────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadedLocalDoc = shallowRef<MappingDocument | null>(null);
const localFile = ref<File | null>(null);
const localFileName = ref('');
const isLoadingLocal = ref(false);
const localStartLine = ref(0);
const localEndLine = ref(0);
const localTargetRow = ref(0);

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

// ─── Local file computed ─────────────────────────────────────────────────────
const localRowCount = computed(() =>
  loadedLocalDoc.value ? loadedLocalDoc.value.rows.length : 0
);

const localUsedRowCount = computed(() =>
  loadedLocalDoc.value ? getUsedRowCount(loadedLocalDoc.value) : 0
);

const localSelectedRangeCount = computed(() =>
  loadedLocalDoc.value ? localEndLine.value - localStartLine.value + 1 : 0
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

// ─── Local file methods ───────────────────────────────────────────────────────
async function onLocalFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  localFile.value = file;
  localFileName.value = file.name;
  loadedLocalDoc.value = null;
  isLoadingLocal.value = true;

  try {
    const doc = await loadLocalFile(file);
    loadedLocalDoc.value = doc;
    const used = getUsedRowCount(doc);
    localStartLine.value = 0;
    localEndLine.value = used > 0 ? used - 1 : 0;
    localTargetRow.value = findAppendIndex(props.mappingDocument.rows);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    props.showToast(`Failed to load "${file.name}": ${msg}`, 'error');
    localFile.value = null;
    localFileName.value = '';
  } finally {
    isLoadingLocal.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
}

watch(() => localStartLine.value, (val) => {
  if (val > localEndLine.value) localEndLine.value = val;
  if (loadedLocalDoc.value && val >= loadedLocalDoc.value.rows.length) {
    localStartLine.value = loadedLocalDoc.value.rows.length - 1;
  }
});

watch(() => localEndLine.value, (val) => {
  if (val < localStartLine.value) localStartLine.value = val;
  if (loadedLocalDoc.value) {
    const max = Math.min(localUsedRowCount.value - 1, loadedLocalDoc.value.rows.length - 1);
    if (val > max) localEndLine.value = max;
  }
});

function clampLocalStart(val: number): void {
  if (!loadedLocalDoc.value) return;
  const max = loadedLocalDoc.value.rows.length - 1;
  localStartLine.value = Math.max(0, Math.min(val, Math.min(localEndLine.value, max)));
}

function clampLocalEnd(val: number): void {
  if (!loadedLocalDoc.value) return;
  const max = Math.min(localUsedRowCount.value - 1, loadedLocalDoc.value.rows.length - 1);
  localEndLine.value = Math.max(localStartLine.value, Math.min(val, max));
}

function clampLocalTargetRow(val: number): void {
  const maxStart = Math.max(0, 69 - (localSelectedRangeCount.value - 1));
  localTargetRow.value = Math.max(0, Math.min(val, maxStart));
}

const canLocalImport = computed(() => {
  if (!loadedLocalDoc.value) return false;
  if (props.isLocked) return false;
  if (localStartLine.value > localEndLine.value) return false;
  return true;
});

function handleLocalImport(): void {
  if (!loadedLocalDoc.value || !canLocalImport.value) return;

  const block = loadedLocalDoc.value.rows.slice(localStartLine.value, localEndLine.value + 1);
  const targetStart = localTargetRow.value;
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
    `File imported: ${truncatedBlock.length} rows from rows ${localStartLine.value}–${localEndLine.value}.`,
    'success'
  );

  emit('close');
}

function handleLoadFull(): void {
  if (!localFile.value) return;
  emit('load-full-file', localFile.value);
  emit('close');
}

// ─── Import preview ───────────────────────────────────────────────────────────
const activePreview = computed<ImportPreview | null>(() => {
  const isLocal = !!loadedLocalDoc.value;
  const isPreset = !!loadedPresetDoc.value;
  if (!isLocal && !isPreset) return null;

  const activeDoc = isLocal ? loadedLocalDoc.value! : loadedPresetDoc.value!;
  const activeStart = isLocal ? localStartLine.value : startLine.value;
  const activeEnd   = isLocal ? localEndLine.value   : endLine.value;
  const activeTarget = isLocal ? localTargetRow.value : targetRow.value;

  const blockSize = activeEnd - activeStart + 1;
  if (blockSize <= 0) return null;

  const { ghostRows, cutCount } = buildGhostRows(activeDoc.rows, activeStart, activeEnd, activeTarget);
  return { targetIndex: activeTarget, blockSize, ghostRows, cutCount };
});

watch(activePreview, (p) => emit('preview-change', p), { immediate: true });
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

          <!-- Hidden file input -->
          <input
            type="file"
            ref="fileInputRef"
            accept=".map,.json"
            class="ofm-hidden-input"
            @change="onLocalFileSelected"
          />

          <!-- Browse row -->
          <div class="browse-row">
            <button
              class="browse-btn"
              :disabled="isLoadingLocal"
              @click="fileInputRef?.click()"
            >Browse…</button>
            <span v-if="localFileName" class="local-filename" :title="localFileName">{{ localFileName }}</span>
            <span v-else class="col-hint">.MAP or .JSON</span>
            <span v-if="isLoadingLocal" class="loading-indicator">loading…</span>
          </div>

          <template v-if="loadedLocalDoc">
            <div class="row-meta-line">
              {{ localUsedRowCount }} used / {{ localRowCount }} total
            </div>

            <!-- Source range (From file) -->
            <div class="control-row">
              <label class="control-label">From file</label>
              <div class="range-inputs">
                <label class="range-label">Start</label>
                <input
                  type="number"
                  class="range-input"
                  :value="localStartLine"
                  :min="0"
                  :max="localUsedRowCount - 1"
                  @change="clampLocalStart(+($event.target as HTMLInputElement).value)"
                />
                <label class="range-label">to</label>
                <input
                  type="number"
                  class="range-input"
                  :value="localEndLine"
                  :min="localStartLine"
                  :max="localUsedRowCount - 1"
                  @change="clampLocalEnd(+($event.target as HTMLInputElement).value)"
                />
                <span class="row-meta">{{ localSelectedRangeCount }} rows</span>
              </div>
            </div>

            <!-- Insert position -->
            <div class="control-row">
              <label class="control-label">Insert at</label>
              <div class="range-inputs">
                <input
                  type="number"
                  class="range-input"
                  :value="localTargetRow"
                  :min="0"
                  :max="69"
                  @change="clampLocalTargetRow(+($event.target as HTMLInputElement).value)"
                />
                <button class="append-btn" @click="localTargetRow = findAppendIndex(mappingDocument.rows)" title="Jump to first empty row">↓ Append</button>
              </div>
            </div>
            <div v-if="localSelectedRangeCount > 0" class="overwrite-info">
              Rows {{ localTargetRow }}–{{ Math.min(localTargetRow + localSelectedRangeCount - 1, 69) }} will be overwritten
            </div>

            <!-- Action buttons -->
            <div class="import-row local-action-row">
              <button
                class="import-btn"
                :disabled="!canLocalImport"
                @click="handleLocalImport"
                title="Import the selected row range into the current mapping"
              >
                Import Block
              </button>
              <button
                class="load-all-btn"
                :disabled="isLocked"
                @click="handleLoadFull"
                title="Replace the entire mapping with this file (full load with metadata)"
              >
                Load All
              </button>
            </div>
          </template>

          <p v-else class="col-description">
            Open a <code>.MAP</code> or <code>.JSON</code> file to import a block of rows or replace the full mapping.
          </p>
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
            <!-- Source range (From file) -->
            <div class="control-row">
              <label class="control-label">From file</label>
              <div class="range-inputs">
                <label class="range-label">Start</label>
                <input
                  type="number"
                  class="range-input"
                  :value="startLine"
                  :min="0"
                  :max="usedRowCount - 1"
                  @change="clampStart(+($event.target as HTMLInputElement).value)"
                />
                <label class="range-label">to</label>
                <input
                  type="number"
                  class="range-input"
                  :value="endLine"
                  :min="startLine"
                  :max="usedRowCount - 1"
                  @change="clampEnd(+($event.target as HTMLInputElement).value)"
                />
                <span class="row-meta">{{ selectedRangeCount }} rows</span>
              </div>
            </div>

            <!-- Insert position -->
            <div class="control-row">
              <label class="control-label">Insert at</label>
              <div class="range-inputs">
                <input
                  type="number"
                  class="range-input"
                  :value="targetRow"
                  :min="0"
                  :max="69"
                  @change="clampTargetRow(+($event.target as HTMLInputElement).value)"
                />
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
  min-width: 640px;
  max-width: 900px;
  width: 92vw;
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
  min-height: 200px;
}

/* Left column */
.col-local {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 14px;
  flex: 1;
  min-width: 0;
}

.col-divider {
  width: 1px;
  background: rgba(52, 204, 153, 0.25);
  flex-shrink: 0;
}

/* Right column */
.col-presets {
  flex: 1;
  min-width: 0;
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

.col-hint {
  color: rgba(52, 204, 153, 0.45);
  font-size: 10px;
  font-style: italic;
}

.ofm-hidden-input {
  display: none;
}

.browse-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.browse-btn {
  padding: 5px 10px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
  flex-shrink: 0;
}

.browse-btn:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.35);
}

.browse-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.local-filename {
  color: #34cc99;
  font-size: 10px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.local-action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.load-all-btn {
  padding: 5px 14px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.load-all-btn:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.35);
}

.load-all-btn:disabled {
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
