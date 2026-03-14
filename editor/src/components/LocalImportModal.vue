<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  buildGhostRows, getUsedRowCount, findAppendIndex,
  type ImportPreview
} from '../composables/usePresetImport';
import type { Row, MappingDocument } from '../modules/documentModel';

interface MappingDocumentLike {
  rows: Array<{ source: { type: { key: number } } }>;
}

const props = defineProps<{
  loadedDoc: MappingDocument;
  fileName: string;
  mappingDocument: MappingDocumentLike;
  isLocked: boolean;
  pastePresetBlock: (block: Row[], targetStartIndex: number) => void;
  scheduleCacheSave: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error', duration?: number) => void;
}>();

const emit = defineEmits<{
  'close': [];
  'preview-change': [preview: ImportPreview | null];
  'load-full-file': [file: File];
}>();

const usedRowCount = computed(() => getUsedRowCount(props.loadedDoc));
const rowCount = computed(() => props.loadedDoc.rows.length);

const startLine = ref(0);
const endLine = ref(0);
const targetRow = ref(0);

onMounted(() => {
  const used = usedRowCount.value;
  startLine.value = 0;
  endLine.value = used > 0 ? used - 1 : 0;
  targetRow.value = findAppendIndex(props.mappingDocument.rows);
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

const selectedRangeCount = computed(() =>
  endLine.value - startLine.value + 1
);

watch(() => startLine.value, (val) => {
  if (val > endLine.value) endLine.value = val;
  if (val >= rowCount.value) startLine.value = rowCount.value - 1;
});

watch(() => endLine.value, (val) => {
  if (val < startLine.value) startLine.value = val;
  const max = Math.min(usedRowCount.value - 1, rowCount.value - 1);
  if (val > max) endLine.value = max;
});

function clampStart(val: number): void {
  const max = rowCount.value - 1;
  startLine.value = Math.max(0, Math.min(val, Math.min(endLine.value, max)));
}

function clampEnd(val: number): void {
  const max = Math.min(usedRowCount.value - 1, rowCount.value - 1);
  endLine.value = Math.max(startLine.value, Math.min(val, max));
}

function clampTargetRow(val: number): void {
  const maxStart = Math.max(0, 69 - (selectedRangeCount.value - 1));
  targetRow.value = Math.max(0, Math.min(val, maxStart));
}

const canImport = computed(() =>
  !props.isLocked && startLine.value <= endLine.value
);

function handleImport(): void {
  if (!canImport.value) return;

  const block = props.loadedDoc.rows.slice(startLine.value, endLine.value + 1) as Row[];
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
    `File imported: ${truncatedBlock.length} rows from rows ${startLine.value}–${endLine.value}.`,
    'success'
  );
  emit('close');
}

function handleLoadAll(): void {
  if (props.isLocked) return;
  // Signal parent to do a full file load via the hidden file-based readFile
  // We emit a synthetic "load full file" using the already-loaded doc
  // The parent wires this to readFile with the original file reference.
  // Since we don't hold a File reference here, we paste all rows directly.
  const allRows = props.loadedDoc.rows as Row[];
  props.pastePresetBlock(allRows, 0);
  props.scheduleCacheSave();
  props.showToast(`Loaded all ${allRows.length} rows from "${props.fileName}".`, 'success');
  emit('close');
}

const activePreview = computed<ImportPreview | null>(() => {
  const blockSize = endLine.value - startLine.value + 1;
  if (blockSize <= 0) return null;
  const { ghostRows, cutCount } = buildGhostRows(
    props.loadedDoc.rows, startLine.value, endLine.value, targetRow.value
  );
  return { targetIndex: targetRow.value, blockSize, ghostRows, cutCount };
});

watch(activePreview, (p) => emit('preview-change', p), { immediate: true });
</script>

<template>
  <div class="lim-backdrop">
  <div class="lim-dialog" role="dialog" aria-modal="true" :aria-label="`Import ${fileName}`">
    <div class="lim-header">
      <span class="lim-title" :title="fileName">{{ fileName }}</span>
      <button class="lim-close" @click="$emit('close')" title="Close (ESC)">✕</button>
    </div>

    <div class="lim-body">
      <div class="lim-meta">{{ usedRowCount }} used / {{ rowCount }} total</div>

      <!-- Source range -->
      <div class="lim-control-row">
        <span class="lim-label">From file</span>
        <div class="lim-range-inputs">
          <label class="lim-range-label">Start</label>
          <div class="lim-num-wrap">
            <input
              type="number"
              class="lim-range-input"
              :value="startLine"
              :min="0"
              :max="usedRowCount - 1"
              @change="clampStart(+($event.target as HTMLInputElement).value)"
            />
            <div class="lim-num-btns">
              <button class="lim-num-btn" @click="clampStart(startLine - 1)">▴</button>
              <button class="lim-num-btn" @click="clampStart(startLine + 1)">▾</button>
            </div>
          </div>
          <label class="lim-range-label">to</label>
          <div class="lim-num-wrap">
            <input
              type="number"
              class="lim-range-input"
              :value="endLine"
              :min="startLine"
              :max="usedRowCount - 1"
              @change="clampEnd(+($event.target as HTMLInputElement).value)"
            />
            <div class="lim-num-btns">
              <button class="lim-num-btn" @click="clampEnd(endLine - 1)">▴</button>
              <button class="lim-num-btn" @click="clampEnd(endLine + 1)">▾</button>
            </div>
          </div>
          <span class="lim-row-count">{{ selectedRangeCount }} rows</span>
        </div>
      </div>

      <!-- Insert position -->
      <div class="lim-control-row">
        <span class="lim-label">Insert at</span>
        <div class="lim-range-inputs">
          <div class="lim-num-wrap">
            <input
              type="number"
              class="lim-range-input"
              :value="targetRow"
              :min="0"
              :max="69"
              @change="clampTargetRow(+($event.target as HTMLInputElement).value)"
            />
            <div class="lim-num-btns">
              <button class="lim-num-btn" @click="clampTargetRow(targetRow - 1)">▴</button>
              <button class="lim-num-btn" @click="clampTargetRow(targetRow + 1)">▾</button>
            </div>
          </div>
          <button
            class="lim-append-btn"
            @click="targetRow = findAppendIndex(mappingDocument.rows)"
            title="Jump to first empty row"
          >↓ Append</button>
        </div>
      </div>

      <div v-if="selectedRangeCount > 0" class="lim-overwrite-info">
        Rows {{ targetRow }}–{{ Math.min(targetRow + selectedRangeCount - 1, 69) }} will be overwritten
      </div>

      <div class="lim-action-row">
        <button class="lim-import-btn" :disabled="!canImport" @click="handleImport">Import Block</button>
        <button class="lim-load-btn" :disabled="isLocked" @click="handleLoadAll">Load All</button>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.lim-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lim-dialog {
  position: relative;
  pointer-events: auto;
  width: 340px;
  background: #0a0a0a;
  border: 1px solid #34cc99;
  box-shadow: 0 0 20px rgba(52, 204, 153, 0.2);
}

.lim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(52, 204, 153, 0.3);
  gap: 6px;
}

.lim-title {
  color: #34cc99;
  font-size: 11px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.lim-close {
  background: none;
  border: none;
  color: #34cc99;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
}

.lim-close:hover {
  color: #F1F700;
}

.lim-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.lim-meta {
  color: rgba(52, 204, 153, 0.6);
  font-size: 10px;
}

.lim-control-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lim-label {
  color: #34cc99;
  font-size: 10px;
  font-weight: bold;
}

.lim-range-inputs {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

.lim-range-label {
  color: rgba(52, 204, 153, 0.7);
  font-size: 9px;
}

.lim-num-wrap {
  display: flex;
  align-items: stretch;
}

.lim-range-input {
  width: 32px;
  background-color: #000;
  border: 1px solid #34cc99;
  border-right: none;
  color: #34cc99;
  font-size: 10px;
  padding: 1px 3px;
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;
}

.lim-range-input::-webkit-outer-spin-button,
.lim-range-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.lim-num-btns {
  display: flex;
  flex-direction: column;
  border: 1px solid #34cc99;
}

.lim-num-btn {
  flex: 1;
  width: 14px;
  background: rgba(52, 204, 153, 0.1);
  border: none;
  border-bottom: 1px solid rgba(52, 204, 153, 0.4);
  color: #34cc99;
  font-size: 7px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s;
}

.lim-num-btn:last-child {
  border-bottom: none;
}

.lim-num-btn:hover {
  background: rgba(52, 204, 153, 0.35);
  color: #F1F700;
}

.lim-num-btn:active {
  background: rgba(52, 204, 153, 0.55);
}

.lim-row-count {
  color: rgba(52, 204, 153, 0.6);
  font-size: 9px;
}

.lim-append-btn {
  font-size: 9px;
  padding: 2px 6px;
  background-color: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.6);
  color: #34cc99;
  cursor: pointer;
  transition: background-color 0.1s;
  flex-shrink: 0;
}

.lim-append-btn:hover {
  background-color: rgba(52, 204, 153, 0.3);
}

.lim-overwrite-info {
  color: rgba(241, 247, 0, 0.7);
  font-size: 9px;
  font-style: italic;
}

.lim-action-row {
  display: flex;
  gap: 4px;
}

.lim-import-btn {
  flex: 1;
  padding: 4px 6px;
  background-color: #34cc99;
  border: 1px solid #34cc99;
  color: #000;
  font-size: 9px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.lim-import-btn:hover:not(:disabled) {
  background-color: #F1F700;
  border-color: #F1F700;
}

.lim-import-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lim-load-btn {
  flex: 1;
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-size: 9px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.lim-load-btn:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.35);
}

.lim-load-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
