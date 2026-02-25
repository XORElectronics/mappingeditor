<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import BasePanel from './BasePanel.vue';
import RowRefBadge from './RowRefBadge.vue';
import ClearButton from './ClearButton.vue';
import { useWarningLog, type LogEntry, type LogEntryType, type LogEntrySource } from '../composables/useWarningLog';
import { usePanelLayout } from '../composables/usePanelLayout';
import type { CommandMetadata } from '../commands/Command';

const props = defineProps<{
  displayRowIndexAsHex: boolean;
  undoHistory: CommandMetadata[];
  redoHistory: CommandMetadata[];
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  activeSlot: 'A' | 'B';
}>();

const { logRight } = usePanelLayout();

const emit = defineEmits<{
  (e: 'expandedChange', expanded: boolean): void;
  (e: 'scrollToRow', rowIndex: number): void;
  (e: 'unnoticeWarning', analyzerWarningId: string): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const {
  entries,
  filteredEntries,
  filterByType,
  filterBySource,
  showNoticed,
  clearLog,
  entryCount,
  warningCount,
  errorCount,
  unnoticeEntry
} = useWarningLog();

// View toggle: 'log' or 'history'
const activeView = ref<'log' | 'history'>('history');

// Selected entries for expanded details view (supports multiple expanded simultaneously)
const expandedEntryIds = ref<Set<number>>(new Set());

function isExpanded(entry: LogEntry): boolean {
  return expandedEntryIds.value.has(entry.id);
}

// Dynamic sizing: stop automatic growth after 3 messages
const MESSAGE_THRESHOLD = 3;
const shouldLockHeight = computed(() => {
  if (activeView.value === 'history') {
    return (props.undoHistory.length + props.redoHistory.length) > MESSAGE_THRESHOLD;
  }
  return filteredEntries.value.length > MESSAGE_THRESHOLD;
});

// Entries list style - lock automatic growth when threshold exceeded
const entriesListStyle = computed(() => {
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


// Toggle type filter
function toggleTypeFilter(type: LogEntryType): void {
  if (filterByType.value.has(type)) {
    filterByType.value.delete(type);
  } else {
    filterByType.value.add(type);
  }
  filterByType.value = new Set(filterByType.value);
}

// Toggle source filter
function toggleSourceFilter(source: LogEntrySource): void {
  if (filterBySource.value.has(source)) {
    filterBySource.value.delete(source);
  } else {
    filterBySource.value.add(source);
  }
  filterBySource.value = new Set(filterBySource.value);
}

// Toggle noticed filter
function toggleNoticedFilter(): void {
  showNoticed.value = !showNoticed.value;
}

// Handle clicking a noticed entry — un-notice it and remove from log
function handleUnnotice(entry: LogEntry): void {
  if (entry.noticed && entry.analyzerWarningId) {
    emit('unnoticeWarning', entry.analyzerWarningId);
    unnoticeEntry(entry.id);
  }
}

// Toggle expanded view for an entry
function toggleExpanded(entry: LogEntry): void {
  // If this is a noticed entry, un-notice instead of expanding
  if (entry.noticed && entry.analyzerWarningId) {
    handleUnnotice(entry);
    return;
  }
  if (expandedEntryIds.value.has(entry.id)) {
    expandedEntryIds.value.delete(entry.id);
  } else {
    expandedEntryIds.value.add(entry.id);
  }
  expandedEntryIds.value = new Set(expandedEntryIds.value); // trigger reactivity
}

// Handle click on row number
function handleRowClick(rowIndex: number | undefined): void {
  if (rowIndex !== undefined) {
    emit('scrollToRow', rowIndex);
  }
}

// Format row index based on hex/dec preference
function formatRowIndex(index: number): string {
  if (props.displayRowIndexAsHex) {
    return index.toString(16).toUpperCase().padStart(2, '0');
  }
  return index.toString();
}

// Format timestamp as HH:MM:SS
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Get type indicator color
function getTypeColor(type: LogEntryType): string {
  switch (type) {
    case 'info': return '#34cc99';
    case 'warning': return '#ffc107';
    case 'error': return '#dc3545';
    case 'debug': return '#6c757d';
  }
}

function downloadLog(): void {
  const lines: string[] = [
    'NerdSEQ Mapping Editor \u2014 Session Log',
    `Generated: ${new Date().toLocaleString()}`,
    '='.repeat(40),
    '',
  ];

  for (const entry of entries.value) {
    const time = formatTime(entry.timestamp);
    const type = entry.type === 'debug'
      ? 'DEBUG  '
      : entry.type.toUpperCase().padEnd(7);
    const source = entry.source.padEnd(9);
    const row = entry.rowIndex !== undefined ? ` R${formatRowIndex(entry.rowIndex)}` : '';
    lines.push(`[${time}] ${type} ${source}${row} \u2014 ${entry.message}`);
    if (entry.details) {
      lines.push(`         ${entry.details}`);
    }
    if (entry.children) {
      for (const child of entry.children) {
        const childType = child.type.toUpperCase().padEnd(7);
        const childRow = child.rowIndex !== undefined ? ` R${formatRowIndex(child.rowIndex)}` : '';
        lines.push(`  >      ${childType}${childRow} \u2014 ${child.message}`);
      }
    }
    lines.push('');
  }

  // Append undo history
  const slot = props.activeSlot;
  const slotLabel = slot === 'A' ? '1' : '2';
  const historyItems = props.undoHistory;
  lines.push('='.repeat(40));
  lines.push(`Undo History \u2014 Slot ${slotLabel} (${historyItems.length} action${historyItems.length !== 1 ? 's' : ''})`);
  lines.push('');
  if (historyItems.length === 0) {
    lines.push('  (empty)');
  } else {
    historyItems.forEach((item, index) => {
      const time = formatTimestamp(item.timestamp);
      const rows = item.affectedRows.length > 0
        ? ` [R${item.affectedRows.map(r => formatRowIndex(r)).join(', R')}]`
        : '';
      lines.push(`  ${(index + 1).toString().padStart(2)}. [${time}] ${item.type}${rows} \u2014 ${item.description}`);
    });
  }
  lines.push('');

  // Append redo history
  const redoItems = props.redoHistory;
  lines.push('='.repeat(40));
  lines.push(`Redo Stack \u2014 Slot ${slotLabel} (${redoItems.length} action${redoItems.length !== 1 ? 's' : ''} available to redo)`);
  lines.push('');
  if (redoItems.length === 0) {
    lines.push('  (empty)');
  } else {
    redoItems.forEach((item, index) => {
      const time = formatTimestamp(item.timestamp);
      const rows = item.affectedRows.length > 0
        ? ` [R${item.affectedRows.map(r => formatRowIndex(r)).join(', R')}]`
        : '';
      lines.push(`  ${(index + 1).toString().padStart(2)}. [${time}] ${item.type}${rows} \u2014 ${item.description}`);
    });
  }
  lines.push('');

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.href = url;
  link.download = `nerdseq-log-${ts}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function onExpandedChange(expanded: boolean): void {
  emit('expandedChange', expanded);
}

// Panel title with entry count
const panelTitle = computed(() => {
  if (entryCount.value === 0) return 'Log Monitor';
  return `Logs (${entryCount.value})`;
});

// Per-slot cutoff and show-hidden state so each slot tracks its own cleared position.
const hiddenBeforeCounts = reactive<Record<'A' | 'B', number>>({ A: 0, B: 0 });
const showHiddenFlags = reactive<Record<'A' | 'B', boolean>>({ A: false, B: false });

const hiddenBeforeCount = computed({
  get: () => hiddenBeforeCounts[props.activeSlot],
  set: (v: number) => { hiddenBeforeCounts[props.activeSlot] = v; },
});

const showHidden = computed({
  get: () => showHiddenFlags[props.activeSlot],
  set: (v: boolean) => { showHiddenFlags[props.activeSlot] = v; },
});

// Clamp so hiddenBeforeCount never exceeds actual stack length (e.g. after aggressive undo)
watch(() => props.undoHistory.length, (newLen) => {
  if (newLen < hiddenBeforeCounts[props.activeSlot]) {
    hiddenBeforeCounts[props.activeSlot] = newLen;
  }
});

// Entries to display in the history list, each tagged with its original stack number
// and whether it belongs to the hidden (pre-clear) region.
const displayedUndoHistoryReversed = computed(() => {
  const all = [...props.undoHistory].reverse();
  const N = props.undoHistory.length;
  const K = hiddenBeforeCount.value;
  const visibleCount = N - K;
  if (!showHidden.value) {
    return all.slice(0, visibleCount).map((item, idx) => ({
      item,
      wasHidden: false,
      stackNum: N - K - idx,
    }));
  }
  return all.map((item, idx) => ({
    item,
    wasHidden: idx >= visibleCount,
    stackNum: N - idx,
  }));
});
</script>

<template>
  <BasePanel
    :title="panelTitle"
    storage-key="warning-log-expanded"
    :right-position="logRight"
    minimized-width="140px"
    expanded-width="350px"
    :resizable="shouldLockHeight"
    :min-height="150"
    :max-height="800"
    :default-height="activeView === 'history' ? 280 : 150"
    @expanded-change="onExpandedChange"
  >
    <template #header-extra>
      <div class="badge-container">
        <span v-if="warningCount > 0" class="count-badge warning-badge">{{ warningCount }}</span>
        <span v-if="errorCount > 0" class="count-badge error-badge">{{ errorCount }}</span>
      </div>
    </template>

    <div class="log-content">
      <!-- View toggle tabs -->
      <div class="view-tabs">
        <button
          class="view-tab"
          :class="{ active: activeView === 'log' }"
          @click="activeView = 'log'"
        >
          Log
        </button>
        <button
          class="view-tab"
          :class="{ active: activeView === 'history' }"
          @click="activeView = 'history'"
        >
          History
          <span v-if="undoHistory.length - hiddenBeforeCount > 0" class="history-count">{{ undoHistory.length - hiddenBeforeCount }}</span>
        </button>
      </div>

      <!-- LOG VIEW -->
      <template v-if="activeView === 'log'">
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="filter-group">
            <button
              class="filter-btn"
              :class="{ active: filterByType.has('info') }"
              @click="toggleTypeFilter('info')"
              title="Toggle info entries"
            >
              <span class="type-dot" style="background: #34cc99"></span>
            </button>
            <button
              class="filter-btn"
              :class="{ active: filterByType.has('warning') }"
              @click="toggleTypeFilter('warning')"
              title="Toggle warning entries"
            >
              <span class="type-dot" style="background: #ffc107"></span>
            </button>
            <button
              class="filter-btn"
              :class="{ active: filterByType.has('error') }"
              @click="toggleTypeFilter('error')"
              title="Toggle error entries"
            >
              <span class="type-dot" style="background: #dc3545"></span>
            </button>
          </div>
          <div class="filter-group">
            <button
              class="filter-btn source-btn"
              :class="{ active: filterBySource.has('analyzer') }"
              @click="toggleSourceFilter('analyzer')"
              title="Toggle analyzer entries"
            >
              A
            </button>
            <button
              class="filter-btn source-btn"
              :class="{ active: filterBySource.has('reference') }"
              @click="toggleSourceFilter('reference')"
              title="Toggle reference entries"
            >
              R
            </button>
            <button
              class="filter-btn source-btn"
              :class="{ active: filterBySource.has('system') }"
              @click="toggleSourceFilter('system')"
              title="Toggle system entries"
            >
              S
            </button>
            <button
              class="filter-btn source-btn command-filter-btn"
              :class="{ active: filterBySource.has('command') }"
              @click="toggleSourceFilter('command')"
              title="Toggle command entries"
            >
              C
            </button>
            <button
              class="filter-btn source-btn noticed-filter-btn"
              :class="{ active: showNoticed }"
              @click="toggleNoticedFilter"
              title="Toggle noticed entries"
            >
              N
            </button>
          </div>
          <button
            class="download-btn"
            style="margin-left: auto"
            @click="downloadLog"
            title="Download log + undo/redo history as text file"
          >
            &#8595;
          </button>
          <ClearButton @click="clearLog" title="Clear all entries" :disabled="entryCount === 0" />
        </div>

        <!-- Entries list -->
        <div class="entries-list panel-scrollable" :style="entriesListStyle">
          <div v-if="filteredEntries.length === 0" class="empty-state">
            <span v-if="entryCount === 0">No log entries</span>
            <span v-else>No entries match filters</span>
          </div>

          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="log-entry"
            :class="{ expanded: isExpanded(entry), noticed: entry.noticed }"
            @click="toggleExpanded(entry)"
          >
            <div class="entry-header">
              <span class="type-indicator" :style="{ background: getTypeColor(entry.type) }"></span>
              <span v-if="entry.noticed" class="noticed-icon" title="Noticed — click to un-notice">&#10003;</span>
              <span
                v-if="entry.children && entry.children.length"
                class="expand-arrow"
                :class="{ expanded: isExpanded(entry) }"
              >&#9654;</span>
              <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
              <span class="entry-source">{{ entry.source.charAt(0).toUpperCase() }}</span>
              <RowRefBadge
                v-if="entry.rowIndex !== undefined"
                :row-index="entry.rowIndex"
                :display-as-hex="displayRowIndexAsHex"
                style="margin-left: auto"
                @click="handleRowClick($event)"
              />
            </div>
            <div class="entry-message">{{ entry.message }}</div>
            <div v-if="isExpanded(entry) && entry.details" class="entry-details">
              {{ entry.details }}
            </div>
            <div
              v-if="isExpanded(entry) && entry.children && entry.children.length"
              class="entry-children"
            >
              <div
                v-for="(child, idx) in entry.children"
                :key="idx"
                class="child-entry"
              >
                <span class="type-indicator" :style="{ background: getTypeColor(child.type) }"></span>
                <RowRefBadge
                  v-if="child.rowIndex !== undefined"
                  :row-index="child.rowIndex"
                  :display-as-hex="displayRowIndexAsHex"
                  @click="handleRowClick($event)"
                />
                <span class="child-message">{{ child.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- HISTORY VIEW -->
      <template v-else>
        <!-- Undo/Redo action buttons -->
        <div class="history-actions">
          <button
            class="history-btn undo-btn"
            :disabled="!canUndo"
            :title="undoDescription ? `Undo [Slot ${activeSlot === 'A' ? '1' : '2'}]: ${undoDescription} (Ctrl/⌘+Z)` : `Nothing to undo (Ctrl/⌘+Z)`"
            @click="emit('undo')"
          >
            ↶ Undo
          </button>
          <button
            class="history-btn redo-btn"
            :disabled="!canRedo"
            :title="redoDescription ? `Redo [Slot ${activeSlot === 'A' ? '1' : '2'}]: ${redoDescription} (Ctrl/⌘+Y)` : `Nothing to redo (Ctrl/⌘+Y)`"
            @click="emit('redo')"
          >
            ↷ Redo
          </button>
          <span class="slot-label" style="margin-left: auto;">Slot {{ activeSlot === 'A' ? '1' : '2' }}</span>
          <div style="display: flex; gap: 1px;">
            <button
              v-if="hiddenBeforeCount > 0"
              class="filter-btn source-btn history-show-hidden-btn"
              :class="{ active: showHidden }"
              @click="showHidden = !showHidden"
              title="Show hidden history entries"
            >H</button>
            <ClearButton @click="hiddenBeforeCount = undoHistory.length; showHidden = false" title="Hide history entries (undo/redo still works)" :disabled="hiddenBeforeCount >= undoHistory.length && redoHistory.length === 0" />
          </div>
        </div>

        <!-- History stack -->
        <div class="entries-list panel-scrollable history-list" :style="entriesListStyle">
          <!-- Empty states -->
          <div v-if="hiddenBeforeCount === 0 && undoHistory.length === 0 && redoHistory.length === 0" class="empty-state">
            No history for this slot
          </div>
          <div v-else-if="displayedUndoHistoryReversed.length === 0 && redoHistory.length === 0" class="empty-state">
            History cleared
          </div>

          <!-- Undo stack: most recent at top -->
          <div
            v-for="entry in displayedUndoHistoryReversed"
            :key="'u-' + entry.stackNum"
            class="history-entry"
            :class="{ 'was-hidden': entry.wasHidden }"
          >
            <span class="history-index">{{ entry.stackNum }}</span>
            <span class="history-time">{{ formatTimestamp(entry.item.timestamp) }}</span>
            <span class="history-desc">{{ entry.item.description }}</span>
            <span v-if="entry.item.affectedRows.length > 0" class="history-rows-container">
              <RowRefBadge
                v-for="rowIdx in entry.item.affectedRows"
                :key="rowIdx"
                :row-index="rowIdx"
                :display-as-hex="displayRowIndexAsHex"
                @click="handleRowClick($event)"
              />
            </span>
          </div>

          <!-- Redo stack divider -->
          <div v-if="redoHistory.length > 0" class="redo-divider">
            <span>&#8595; redo available ({{ redoHistory.length }})</span>
          </div>

          <!-- Redo stack: next redo at top -->
          <div
            v-for="(item, idx) in redoHistory"
            :key="'r-' + idx"
            class="history-entry redo-entry"
          >
            <span class="history-index">{{ idx + 1 }}</span>
            <span class="history-time">{{ formatTimestamp(item.timestamp) }}</span>
            <span class="history-desc">{{ item.description }}</span>
            <span v-if="item.affectedRows.length > 0" class="history-rows-container">
              <RowRefBadge
                v-for="rowIdx in item.affectedRows"
                :key="rowIdx"
                :row-index="rowIdx"
                :display-as-hex="displayRowIndexAsHex"
                @click="handleRowClick($event)"
              />
            </span>
          </div>
        </div>
      </template>
    </div>
  </BasePanel>
</template>

<style scoped>
.log-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

/* View tabs */
.view-tabs {
  display: flex;
  gap: 2px;
}

.view-tab {
  flex: 1;
  padding: 2px 6px;
  background: rgba(52, 204, 153, 0.05);
  border: 1px solid rgba(52, 204, 153, 0.2);
  color: rgba(52, 204, 153, 0.6);
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.view-tab:hover {
  background: rgba(52, 204, 153, 0.1);
  color: #34cc99;
}

.view-tab.active {
  background: rgba(52, 204, 153, 0.15);
  border-color: rgba(52, 204, 153, 0.5);
  color: #34cc99;
}

.history-count {
  font-size: 9px;
  background: rgba(52, 204, 153, 0.3);
  padding: 0 4px;
  border-radius: 8px;
  font-weight: bold;
}

/* History view */
.history-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  padding: 4px;
  background: rgba(52, 204, 153, 0.1);
  border-bottom: 1px solid #34cc99;
}

.history-btn {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid rgba(52, 204, 153, 0.4);
  background: rgba(52, 204, 153, 0.1);
  color: #34cc99;
  transition: all 0.15s ease;
}

.history-btn:hover:not(:disabled) {
  background: rgba(52, 204, 153, 0.2);
}

.history-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.slot-label {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.6);
  font-weight: bold;
  padding: 0 4px;
}

.history-list {
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  margin-bottom: 1px;
  background: rgba(52, 204, 153, 0.05);
  border-left: 2px solid rgba(52, 204, 153, 0.3);
  border-radius: 0 2px 2px 0;
}

.history-entry.redo-entry {
  opacity: 0.5;
  border-left-color: rgba(52, 204, 153, 0.15);
  font-style: italic;
}

.history-entry.was-hidden {
  opacity: 0.35;
  border-left-style: dashed;
}

.history-show-hidden-btn {
  font-weight: bold;
  min-width: 16px;
  justify-content: center;
  opacity: 0.6;
  color: rgba(52, 204, 153, 0.8) !important;
  border-color: rgba(52, 204, 153, 0.35) !important;
}

.history-show-hidden-btn:hover,
.history-show-hidden-btn.active {
  opacity: 1;
}

.history-index {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.5);
  font-family: monospace;
  min-width: 16px;
  text-align: right;
}

.history-time {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.6);
  font-family: monospace;
  white-space: nowrap;
}

.history-desc {
  font-size: 10px;
  color: #34cc99;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-rows-container {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  white-space: nowrap;
}

.redo-divider {
  text-align: center;
  font-size: 9px;
  color: rgba(52, 204, 153, 0.4);
  padding: 4px 0;
  margin: 2px 0;
  border-top: 1px dashed rgba(52, 204, 153, 0.2);
  border-bottom: 1px dashed rgba(52, 204, 153, 0.2);
}

.entries-list {
  overflow-x: hidden;
  padding: 2px;
}

.empty-state {
  text-align: center;
  padding: 16px;
  color: rgba(52, 204, 153, 0.5);
  font-size: 11px;
}

.log-entry {
  padding: 4px 6px;
  margin-bottom: 2px;
  background: rgba(52, 204, 153, 0.05);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.log-entry:hover {
  background: rgba(52, 204, 153, 0.1);
}

.log-entry.expanded {
  background: rgba(52, 204, 153, 0.15);
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.type-indicator {
  width: 3px;
  height: 12px;
  border-radius: 1px;
}

.entry-time {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.7);
  font-family: monospace;
}

.entry-source {
  font-size: 9px;
  font-weight: bold;
  color: #34cc99;
  background: rgba(52, 204, 153, 0.2);
  padding: 0 3px;
  border-radius: 2px;
}


.entry-message {
  font-size: 10px;
  color: #34cc99;
  line-height: 1.3;
  word-break: break-word;
}

.entry-details {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.7);
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  line-height: 1.4;
}

/* Noticed entries */
.log-entry.noticed {
  opacity: 0.5;
  border-left-color: #34cc99;
}

.log-entry.noticed:hover {
  opacity: 0.8;
}

.noticed-icon {
  font-size: 9px;
  color: #34cc99;
  font-weight: bold;
}

.noticed-filter-btn {
  color: #34cc99 !important;
  border-color: rgba(52, 204, 153, 0.5) !important;
}

.command-filter-btn {
  color: #7ec8e3 !important;
  border-color: rgba(126, 200, 227, 0.5) !important;
}

.badge-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.count-badge {
  font-size: 9px;
  font-weight: bold;
  padding: 0 4px;
  border-radius: 6px;
  white-space: nowrap;
}

.warning-badge {
  background: #ffc107;
  color: #000;
}

.error-badge {
  background: #dc3545;
  color: #fff;
}

.expand-arrow {
  font-size: 8px;
  color: rgba(52, 204, 153, 0.7);
  display: inline-block;
  transition: transform 0.15s ease;
  transform: rotate(0deg);
  margin-right: 2px;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.entry-children {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 1px solid rgba(52, 204, 153, 0.2);
}

.child-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}

.child-message {
  font-size: 9px;
  color: rgba(52, 204, 153, 0.8);
  line-height: 1.3;
  word-break: break-word;
  flex: 1;
}

.download-btn {
  font-size: 14px;
  padding: 2px 6px;
  background: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.3);
  color: #34cc99;
  border-radius: 3px;
  cursor: pointer;
  line-height: 1;
}

.download-btn:hover:not(:disabled) {
  background: rgba(52, 204, 153, 0.2);
}

.download-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Filter bar (shared with log view) */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}


.source-btn {
  font-weight: bold;
  min-width: 16px;
  justify-content: center;
}

</style>
