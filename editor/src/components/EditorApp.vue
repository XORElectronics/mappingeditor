<script setup lang="ts">
import _ from "lodash";
import { ref, onMounted, watch } from 'vue';
import {
  DataModel, type MappingTuple, type MappingType, EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION, MIDI_NRPN_SOURCE_TYPE_KEY, CALC_SOURCE_TYPE_KEY, SKIP_SOURCE_TYPE_KEY,
  EXTERNAL_SOURCE_TYPE_KEY, keyboardSourceExtras, segaGamepadSourceExtras, nerdseqButtonsSourceExtras, globalButtonsDestinationExtras, globalModesDestinationExtras, globalScreensDestinationExtras,
  KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY, SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY, NERDSEQ_BUTTONS_EXTERNAL_SOURCE_FUNCTION_KEY, VAR_SOURCE_TYPE_KEY, GLOBAL_DESTINATION_TYPE_KEY, GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY,
  GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY, GLOBAL_MODES_DESTINATION_FUNCTION_KEY, MIDI_CC_DESTINATION_TYPE_KEY, DUAL_DESTINATION_TYPE_KEY, SKIP_DESTINATION_TYPE_KEY, VISU_DESTINATION_TYPE_KEY, SETVAR_DESTINATION_TYPE_KEY,
  VISU_SHADER_SELECT_FUNCTION_KEY, VISU_SHADER_FUNCTIONS_FUNCTION_KEY, VISU_MODULATORS_FUNCTION_KEY, VISU_ENVELOPES_FUNCTION_KEY, VISU_LFOS_FUNCTION_KEY,
  visuShaderSelectExtras, visuShaderFunctionsExtras, visuModulatorsExtras, visuEnvelopesExtras, visuLfosExtras,
  genVarSourceExtraDnA
} from '../modules/dataModel';
import { MappingDocument, Row as MappingRow, Source, SourceType, SourceFunction, SourceExtra, DestinationType, DestinationFunction, DestinationExtra, Destination } from '../modules/documentModel';
import * as formatters from '../modules/formatters';

import CalcSkipSourceExtra from './CalcSkipSourceExtra.vue';
import NrpnSourceExtra from './NrpnSourceExtra.vue';
import VariableSourceExtra from './VariableSourceExtra.vue';
import MidiCcDestinationExtra from './MidiCcDestinationExtra.vue';
import SkipDestinationExtra from './SkipDestinationExtra.vue';
import DualDestinationExtra from './DualDestinationExtra.vue';
import VisuDestinationExtra from './VisuDestinationExtra.vue';
import VariableDestinationExtra from './VariableDestinationExtra.vue';
import MidiMonitor from './MidiMonitor.vue';
import VariableMonitor from './VariableMonitor.vue';
import MidiLearnExtra from './MidiLearnExtra.vue';
import RowCommentSection from './RowCommentSection.vue';
import SelectionToolbar from './SelectionToolbar.vue';
import SettingsPanel from './SettingsPanel.vue';
import LogMonitor from './LogMonitor.vue';
import GlobalDocumentationPanel from './GlobalDocumentationPanel.vue';
import MenuButton from './MenuButton.vue';
import IconButton from './IconButton.vue';
import ToastNotifications from './ToastNotifications.vue';
import { useMidi } from '../composables/useMidi';
import { useClipboard } from '../composables/useClipboard';
import { useStaticAnalyzer } from '../composables/useStaticAnalyzer';
import { useWarningLog, type LogChildEntry } from '../composables/useWarningLog';
import { useMappingCache, waitForCacheReady } from '../composables/useMappingCache';
import { useActionHistory, type DeserializationContext } from '../composables/useActionHistory';
import { useVariableUsage } from '../composables/useVariableUsage';
import { useSkipAnalysis } from '../composables/useSkipAnalysis';
import { useRowSelection } from '../composables/useRowSelection';
import { usePanelState } from '../composables/usePanelState';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';
import { useAutoAdvance } from '../composables/useAutoAdvance';
import { useDocumentSerialization } from '../composables/useDocumentSerialization';
import { useFileHandling } from '../composables/useFileHandling';
import {
  SetRowColorCommand, SetRowCommentCommand,
  SetVariableValueCommand, SetSourceCommand, SetDestinationCommand,
  type SourceSnapshot, type DestinationSnapshot
} from '../commands';
import { MIDI_LEARN_FUNCTION_KEY } from '../constants/midi';
import { COLOR_PALETTE } from '../constants/colors';

const mappingDocument = ref<MappingDocument>(new MappingDocument());
// Vue's UnwrapRef<T> strips private class fields; this accessor restores the correct MappingDocument type for commands
const doc = (): MappingDocument => mappingDocument.value as unknown as MappingDocument;
const fileInput = ref<HTMLInputElement | null>(null);

// Skip analysis composable
const { isRowSkipped } = useSkipAnalysis(mappingDocument);

const currentlySelectedSourceTypes = ref(new Array<MappingType>());
const currentlySelectedDestinationTypes = ref(new Array<MappingType>());

// Row comments storage (keyed by row index)
const rowComments = ref<Record<number, string>>({});

// Row selection composable
const {
  selectedRowIndices,
  expandedCommentRowIndex,
  sortedSelectedIndices,
  canMoveUp,
  canMoveDown,
  handleRowClick,
  handleScrollToRow,
  clearRowSelection,
  isRowSelected
} = useRowSelection(70, rowComments);

// Row colors storage (keyed by row index)
const rowColors = ref<Map<number, string>>(new Map());

// Toast notifications component ref
const toastNotifications = ref<InstanceType<typeof ToastNotifications> | null>(null);

function showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration = 5000): void {
  // Show toast notification
  toastNotifications.value?.show(message, type, duration);

  // Also log to warning log (success messages go to info log)
  if (type === 'info' || type === 'success') {
    logInfo('system', message);
  } else if (type === 'warning') {
    logWarning('system', message);
  } else {
    logError('system', message);
  }
}


// Panel state composable (expanded/visibility/localStorage persistence)
const {
  settingsPanelExpanded,
  midiMonitorExpanded,
  variableMonitorExpanded,
  selectionToolbarExpanded,
  logMonitorExpanded,
  globalDocPanelExpanded,
  showSelectionToolbar,
  showMidiMonitor,
  showVariableMonitor,
  showLogMonitor,
  showDescription,
  midiLearnAutoAdvance,
  pasteAutoAdvance,
  displayRowIndexAsHex,
  initDisplayPreferences,
  watchDisplayRowIndexAsHex
} = usePanelState();

// Track which row should auto-start MIDI learn
const midiLearnAutoStartRow = ref<number | null>(null);

// Track last learned MIDI message globally to prevent duplicates
const lastLearnedMidiMessage = ref<string | null>(null);

const { isSupported: midiSupported } = useMidi();

// Static Logic Analyzer
const {
  warnings: analyzerWarnings,
  warningCount,
  errorCount,
  analyzeDocument,
  getRowWarnings,
  rowHasWarnings,
  noticeWarning: noticeAnalyzerWarning,
  unnoticeWarning: unnoticeAnalyzerWarning
} = useStaticAnalyzer(mappingDocument, displayRowIndexAsHex);

// Variable Usage tracking
const { variableUsage } = useVariableUsage(mappingDocument);

// Warning Log
const {
  addEntry: logAddEntry,
  addInfo: logInfo,
  addWarning: logWarning,
  addError: logError,
} = useWarningLog();

// Mapping Cache (A/B toggle)
const {
  activeSlot,
  isLockedA,
  isLockedB,
  isCurrentLocked,
  hasDataA,
  hasDataB,
  switchToA,
  switchToB,
  toggleLockA,
  toggleLockB,
  saveToActiveSlot,
  loadFromSlot
} = useMappingCache();

// Action History (Undo/Redo) with per-slot support
const actionHistoryContext: DeserializationContext = {
  rowColors: rowColors.value,
  rowComments: rowComments.value,
  mappingDocument: doc(),
  currentlySelectedSourceTypes: currentlySelectedSourceTypes.value,
  currentlySelectedDestTypes: currentlySelectedDestinationTypes.value
};

const {
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  history: undoHistory,
  redoHistory,
  executeCommand,
  pushCommand,
  undo,
  redo,
  clearCurrentHistory
} = useActionHistory({
  activeSlot,
  isLockedA,
  isLockedB,
  context: actionHistoryContext,
  onExecute: (cmd, slot) => {
    logInfo('command', `[Slot ${slot === 'A' ? '1' : '2'}] ${cmd.getDescription()}`);
  },
  onUndo: (cmd, slot) => {
    logInfo('command', `[Slot ${slot === 'A' ? '1' : '2'}] Undid: ${cmd.getDescription()}`);
  },
  onRedo: (cmd, slot) => {
    logInfo('command', `[Slot ${slot === 'A' ? '1' : '2'}] Redid: ${cmd.getDescription()}`);
  }
});

// Clipboard functionality via composable
const {
  hasCopiedRow,
  hasCopiedSource,
  hasCopiedDestination,
  hasCopiedRows,
  copyRow,
  pasteRow,
  clearRow,
  copyRows,
  pasteRows,
  cutRows,
  clearRows,
  moveRowsUp,
  moveRowsDown,
  copySource,
  pasteSource,
  clearSource,
  copyDestination,
  pasteDestination,
  clearDestination
} = useClipboard({
  mappingDocument,
  currentlySelectedSourceTypes,
  currentlySelectedDestinationTypes,
  rowComments,  // Pass rowComments so they swap with rows
  executeCommand  // Enable undo/redo for clipboard operations
});

// Document serialization & cache management
const {
  serializeDocument,
  deserializeToDocument,
  scheduleCacheSave,
  handleSlotSwitch
} = useDocumentSerialization({
  mappingDocument,
  currentlySelectedSourceTypes,
  currentlySelectedDestinationTypes,
  rowColors,
  rowComments,
  clearRowSelection,
  analyzeDocument,
  reset,
  logInfo,
  activeSlot,
  isCurrentLocked,
  saveToActiveSlot,
  switchToA,
  switchToB,
  toggleLockA,
  toggleLockB,
  loadFromSlot
});

// File I/O (MAP/JSON loading)
const { readFile } = useFileHandling({
  mappingDocument,
  rowColors,
  rowComments,
  fileInput,
  init,
  clearCurrentHistory,
  showToast
});

// Helper function for MIDI learn source function update
function handleSourceMidiLearnFunctionUpdate(rowIndex: number, functionKey: number): void {
  const sourceFunc = currentlySelectedSourceTypes.value[rowIndex].functions.find((f: MappingTuple) => f.key === functionKey);
  if (sourceFunc) {
    mappingDocument.value.rows[rowIndex].source.function = new SourceFunction(functionKey, sourceFunc.abbr, sourceFunc.description);
  }
  // Reset auto-start flag and advance to next MIDI Learn row
  midiLearnAutoStartRow.value = null;
  handleMidiLearnComplete(rowIndex);
}

// Helper function for MIDI learn destination function update
function handleDestMidiLearnFunctionUpdate(rowIndex: number, functionKey: number): void {
  const destFunc = currentlySelectedDestinationTypes.value[rowIndex].functions.find((f: MappingTuple) => f.key === functionKey);
  if (destFunc) {
    mappingDocument.value.rows[rowIndex].destination.function = new DestinationFunction(functionKey, destFunc.abbr, destFunc.description);
  }
  // Reset auto-start flag and advance to next MIDI Learn row
  midiLearnAutoStartRow.value = null;
  handleMidiLearnComplete(rowIndex);
}

// Handle MIDI learn completion - auto-advance to next MIDI Learn row if enabled
function handleMidiLearnComplete(currentRowIndex: number): void {
  if (!midiLearnAutoAdvance.value) return;
  
  // Find the next row with MIDI Learn (source MIDI Learn OR destination MIDI CC Learn)
  let nextLearnRowIndex = -1;
  for (let i = currentRowIndex + 1; i < mappingDocument.value.rows.length; i++) {
    const row = mappingDocument.value.rows[i];
    
    // Check for source MIDI Learn (MIDI/CC/NRPN with Learn function)
    const isSourceMidiLearn = [5, 6, 7].includes(row.source.type.key) && row.source.function.key === 48;
    
    // Check for destination MIDI CC Learn
    const isDestMidiLearn = row.destination.type.key === 5 && row.destination.function.key === 48;
    
    if (isSourceMidiLearn || isDestMidiLearn) {
      nextLearnRowIndex = i;
      break;
    }
  }
  
  // If found, select that row and trigger auto-start
  if (nextLearnRowIndex !== -1) {
    selectedRowIndices.value.clear();
    selectedRowIndices.value.add(nextLearnRowIndex);
    expandedCommentRowIndex.value = null;
    selectedRowIndices.value = new Set(selectedRowIndices.value);
    
    // Set the auto-start flag for the next row
    midiLearnAutoStartRow.value = nextLearnRowIndex;
    
    // Scroll into view
    const rowElement = document.querySelector(`[data-row-index="${nextLearnRowIndex}"]`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Variable slider handler
function updateVariableValue(variableIndex: number, value: number): void {
  if (variableIndex >= 0 && variableIndex < mappingDocument.value.variables.length) {
    const cmd = new SetVariableValueCommand(variableIndex, value, doc());
    executeCommand(cmd);
    scheduleCacheSave();
  }
}

/**
 * Get incoming value for Variable source when "From Row/Var" is checked
 * Returns the resolved value from variables A-P or row destination values
 */
function getVariableSourceIncomingValue(row: {
  source: {
    extra: { keyOrValue: number };
    function: { key: number };
  };
}): number | undefined {
  // Only applies when checkbox is checked (keyOrValue === 0)
  if (row.source.extra.keyOrValue !== 0) {
    return undefined;
  }

  // row.source.function.key contains the reference:
  // 0-15: Variables A-P
  // 16-85: Row references (row 0-69)
  const refKey = row.source.function.key;

  if (refKey >= 0 && refKey <= 15) {
    // Variable reference (A-P)
    return mappingDocument.value.variables[refKey].value;
  } else if (refKey >= 16 && refKey <= 85) {
    // Row reference
    const referencedRowIndex = refKey - 16;
    const referencedRow = mappingDocument.value.rows[referencedRowIndex];
    if (referencedRow && referencedRow.destination.extra.keyOrValue !== EMPTY_KEY) {
      // Return the destination's keyOrValue (adjusted for 1-based indexing in binary format)
      return referencedRow.destination.extra.keyOrValue - 1;
    }
  }

  return 0; // Default to 0 if no valid reference
}

function formatRowIndex(index: number): string {
  if (displayRowIndexAsHex.value) {
    return index.toString(16).toUpperCase().padStart(2, '0');
  }
  return index.toString();
}

// Multi-selection toolbar handlers
function handleMultiCut(): void {
  cutRows(sortedSelectedIndices.value);
}

function handleMultiCopy(): void {
  const indices = sortedSelectedIndices.value;
  if (indices.length === 1) {
    copyRow(indices[0]);
  } else if (indices.length > 1) {
    copyRows(indices);
  }
}

function handleMultiPaste(): void {
  if (sortedSelectedIndices.value.length > 0) {
    const startIndex = sortedSelectedIndices.value[0];

    // For single row paste, use handlePasteRow to get auto-advance behavior
    if (hasCopiedRow.value && sortedSelectedIndices.value.length === 1) {
      handlePasteRow(startIndex);
    } else {
      // For multi-row paste, use pasteRows directly (no auto-advance)
      pasteRows(startIndex);
    }
  }
}

function handleMultiMoveUp(): void {
  const result = moveRowsUp(sortedSelectedIndices.value);
  selectedRowIndices.value = new Set(result.newIndices);
  handleMoveWarnings(result.referenceUpdateResult);
}

function handleMultiMoveDown(): void {
  const result = moveRowsDown(sortedSelectedIndices.value);
  selectedRowIndices.value = new Set(result.newIndices);
  handleMoveWarnings(result.referenceUpdateResult);
}

// Auto-advance composable (paste + advance to next row)
const {
  advanceToNextRow,
  handlePasteRow,
  handlePasteSource,
  handlePasteDestination
} = useAutoAdvance({
  selectedRowIndices,
  expandedCommentRowIndex,
  pasteAutoAdvance,
  totalRowCount: 70,
  pasteRow,
  pasteSource,
  pasteDestination
});

// Track accumulated reference updates for toast deduplication
let accumulatedReferenceCount = 0;
let accumulatedWarnings: Array<{ message: string; type: string }> = [];
let toastDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleMoveWarnings(result: { updatedCount: number; warnings: Array<{ message: string; type: string }> }): void {
  // Accumulate reference count
  accumulatedReferenceCount += result.updatedCount;
  
  // Accumulate unique warnings
  const definitionOrderWarnings = result.warnings.filter(w => w.type === 'definition_order');
  for (const warning of definitionOrderWarnings) {
    if (!accumulatedWarnings.some(w => w.message === warning.message)) {
      accumulatedWarnings.push(warning);
    }
  }

  // Clear existing timer
  if (toastDebounceTimer) {
    clearTimeout(toastDebounceTimer);
  }

  // Debounce: show toast after 1 second of no moves
  toastDebounceTimer = setTimeout(() => {
    if (accumulatedReferenceCount > 0) {
      const msg = `Updated ${accumulatedReferenceCount} row reference${accumulatedReferenceCount > 1 ? 's' : ''}.`;
      showToast(msg, 'info');
      accumulatedReferenceCount = 0;
    }

    // Show accumulated warnings
    for (const warning of accumulatedWarnings) {
      showToast(warning.message, 'warning', 8000);
    }
    accumulatedWarnings = [];
  }, 1000);
}

function handleMultiClear(): void {
  clearRows(sortedSelectedIndices.value);
}

/**
 * Handle "noticing" a warning — moves it from row display to log monitor
 */
function handleNoticeWarning(warningId: string): void {
  const warning = noticeAnalyzerWarning(warningId);
  if (warning) {
    const logType = warning.severity === 'error' ? 'error' as const : warning.severity === 'warning' ? 'warning' as const : 'info' as const;
    const entryId = logAddEntry({
      type: logType,
      source: 'analyzer',
      message: warning.message,
      rowIndex: warning.rowIndex,
      details: warning.details,
      noticed: true,
      analyzerWarningId: warningId
    });
    // Entry is already marked as noticed
    void entryId;
  }
}

/**
 * Handle un-noticing a warning from the log monitor — restores it to row display
 */
function handleUnnoticeWarning(analyzerWarningId: string): void {
  unnoticeAnalyzerWarning(analyzerWarningId);
}

function setRowColor(color: string | null): void {
  for (const idx of selectedRowIndices.value) {
    const colorValue = color && COLOR_PALETTE[color] ? COLOR_PALETTE[color] : null;
    const cmd = new SetRowColorCommand(idx, colorValue, rowColors.value);
    executeCommand(cmd);
  }
  // Note: Vue 3 tracks Map operations, no need to create new Map
}

function getRowBackgroundColor(rowIndex: number): string | undefined {
  return rowColors.value.get(rowIndex);
}

// Keyboard shortcuts composable (registers/unregisters event listeners)
useKeyboardShortcuts({
  selectedRowIndices,
  sortedSelectedIndices,
  isCurrentLocked,
  pasteAutoAdvance,
  hasCopiedRow,
  hasCopiedRows,
  handleSlotSwitch,
  undo,
  redo,
  copyRow,
  copyRows,
  cutRows,
  pasteRow,
  pasteRows,
  clearRow,
  clearRows,
  clearRowSelection,
  advanceToNextRow
});

onMounted(async () => {
  // Load row index display preference from localStorage
  initDisplayPreferences();

  // Auto-restore the active slot from IndexedDB cache
  await waitForCacheReady();
  const cached = loadFromSlot(activeSlot.value);
  if (cached) {
    deserializeToDocument(cached);
    logInfo('system', `Auto-restored Slot ${activeSlot.value === 'A' ? '1' : '2'} from cache`);
  }
});

// Re-run analysis when row index display format changes
watchDisplayRowIndexAsHex(() => analyzeDocument());

// Auto-save to cache when document changes
watch(
  () => mappingDocument.value,
  () => {
    scheduleCacheSave();
  },
  { deep: true }
);

// Also save when colors or comments change
watch(rowColors, () => scheduleCacheSave(), { deep: true });
watch(rowComments, () => scheduleCacheSave(), { deep: true });

// Watch for slot switching (history automatically switches with activeSlot)
watch(activeSlot, (newSlot, oldSlot) => {
  if (newSlot !== oldSlot) {
    logInfo('system', `Switched to Slot ${newSlot === 'A' ? '1' : '2'} (undo history preserved)`);
  }
});

function reset() {
  // Check lock state before resetting
  if (isCurrentLocked.value) {
    return;
  }

  if (fileInput.value) {
    fileInput.value.value = '';
  }
  mappingDocument.value = new MappingDocument();
  currentlySelectedSourceTypes.value = new Array<MappingType>();
  currentlySelectedDestinationTypes.value = new Array<MappingType>();
  clearRowSelection();
  rowComments.value = {};
  rowColors.value.clear(); // Clear Map but preserve reference for undo commands
  clearCurrentHistory(); // Clear undo history when resetting
  // Clear analysis warnings for empty document
  analyzeDocument();
}

function init() {
  clearRowSelection();
  for (let i = 0; i < mappingDocument.value.rows.length; i++) {
    const row = mappingDocument.value.rows[i];
    // Use row.index instead of i to match template lookup
    const rowIndex = row.index;

    // Only find and set types if they're not empty
    if (row.source.type.key !== EMPTY_KEY) {
      currentlySelectedSourceTypes.value[rowIndex] = DataModel.sourceTypes.find(x => x.key === row.source.type.key) as MappingType;
    }
    if (row.destination.type.key !== EMPTY_KEY) {
      currentlySelectedDestinationTypes.value[rowIndex] = DataModel.destinationTypes.find(x => x.key === row.destination.type.key) as MappingType;
    }
  }
  // Run static analysis after loading
  runAnalysis();

  // Show toast if warnings found
  if (warningCount.value > 0) {
    showToast(`Analysis found ${warningCount.value} warning${warningCount.value !== 1 ? 's' : ''}`, 'warning', 4000);
  }
}

function runAnalysis(): void {
  analyzeDocument();

  // Collect all current warnings as child entries
  const children: LogChildEntry[] = [];
  for (const rowWarnings of analyzerWarnings.value.values()) {
    for (const warning of rowWarnings) {
      children.push({
        type: warning.severity === 'error' ? 'error'
            : warning.severity === 'warning' ? 'warning'
            : 'info',
        message: warning.message,
        rowIndex: warning.rowIndex,
        details: warning.details,
      });
    }
  }

  if (children.length > 0) {
    const hasErrors = children.some(c => c.type === 'error');
    logAddEntry({
      type: hasErrors ? 'error' : 'warning',
      source: 'analyzer',
      message: `Analysis: ${children.length} issue${children.length !== 1 ? 's' : ''} found`,
      children,
    });
  } else {
    logInfo('analyzer', 'Analysis complete — no issues found');
  }
}

function sourceTypeSelectionChanged(event: Event, rowIndex: number) {
  const sourceTypeSelectElement = event.target as HTMLSelectElement;
  const selectedSourceTypeKey = parseInt(sourceTypeSelectElement.value);
  const selectedSourceType = DataModel.sourceTypes.find(x => x.key === selectedSourceTypeKey) as MappingType;
  const newSnapshot: SourceSnapshot = {
    typeKey: selectedSourceTypeKey, typeAbbr: selectedSourceType.abbr, typeDesc: selectedSourceType.description,
    funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
    extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
    selectedTypeKey: selectedSourceTypeKey
  };
  executeCommand(new SetSourceCommand(rowIndex, newSnapshot, doc(), currentlySelectedSourceTypes.value,
    `Set source type for row ${rowIndex + 1}`));
}

function sourceFunctionSelectionChanged(event: Event, rowIndex: number) {
  const sourceFunctionSelectElement = event.target as HTMLSelectElement;
  const selectedSourceFunctionKey = parseInt(sourceFunctionSelectElement.value);
  const selectedSourceFunction = currentlySelectedSourceTypes.value[rowIndex].functions.find(x => x.key === selectedSourceFunctionKey) as MappingTuple;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  // For Variable source, default to fader value (key 1) so the variable is immediately trackable
  let extraKey = EMPTY_KEY, extraAbbr = EMPTY_ABBR, extraDesc = EMPTY_DESCRIPTION;
  if (row.source.type.key === VAR_SOURCE_TYPE_KEY) {
    const varExtra = genVarSourceExtraDnA(1);
    extraKey = 1; extraAbbr = varExtra.abbr; extraDesc = varExtra.description;
  }
  const newSnapshot: SourceSnapshot = {
    typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
    funcKey: selectedSourceFunctionKey, funcAbbr: selectedSourceFunction.abbr, funcDesc: selectedSourceFunction.description,
    extraKey, extraAbbr, extraDesc,
    selectedTypeKey: currentlySelectedSourceTypes.value[rowIndex]?.key ?? EMPTY_KEY
  };
  executeCommand(new SetSourceCommand(rowIndex, newSnapshot, doc(), currentlySelectedSourceTypes.value,
    `Set source function for row ${rowIndex + 1}`));
}

enum SourceExtraVariant {
  DEFAULT,
  EXTERNAL_KEYBOARD,
  EXTERNAL_SEGA_GAMEPAD,
  EXTERNAL_NERDSEQ_BUTTONS,
}

function sourceExtraSelectionChanged(event: Event, rowIndex: number, extraVariant: SourceExtraVariant = SourceExtraVariant.DEFAULT) {
  const sourceExtraSelectElement = event.target as HTMLSelectElement;
  const selectedSourceExtraKey = parseInt(sourceExtraSelectElement.value);
  let selectedSourceExtra: MappingTuple;

  switch (extraVariant) {
    case SourceExtraVariant.EXTERNAL_KEYBOARD:
      selectedSourceExtra = keyboardSourceExtras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
    case SourceExtraVariant.EXTERNAL_SEGA_GAMEPAD:
      selectedSourceExtra = segaGamepadSourceExtras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
    case SourceExtraVariant.EXTERNAL_NERDSEQ_BUTTONS:
      selectedSourceExtra = nerdseqButtonsSourceExtras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
    default:
      selectedSourceExtra = currentlySelectedSourceTypes.value[rowIndex].extras.find(x => x.key === selectedSourceExtraKey) as MappingTuple;
      break;
  }

  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  const newSnapshot: SourceSnapshot = {
    typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
    funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
    extraKey: selectedSourceExtraKey, extraAbbr: selectedSourceExtra.abbr, extraDesc: selectedSourceExtra.description,
    selectedTypeKey: currentlySelectedSourceTypes.value[rowIndex]?.key ?? EMPTY_KEY
  };
  executeCommand(new SetSourceCommand(rowIndex, newSnapshot, doc(), currentlySelectedSourceTypes.value,
    `Set source extra for row ${rowIndex + 1}`));
}

// Debounced source extra state — coalesces rapid fader changes into a single undo entry
const pendingSourceExtra = ref<{
  rowIndex: number;
  oldSnapshot: SourceSnapshot;
  timer: ReturnType<typeof setTimeout>;
} | null>(null);

// Handle source extra update from extra components (e.g. CalcSkipSourceExtra, NrpnSourceExtra, etc.)
// Uses debounce to coalesce rapid fader drags into a single undo entry.
function handleSourceExtraUpdate(rowIndex: number, newExtra: SourceExtra): void {
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  if (!row) return;

  // Capture old state or reuse from existing pending drag
  let oldSnap: SourceSnapshot;
  if (pendingSourceExtra.value && pendingSourceExtra.value.rowIndex === rowIndex) {
    oldSnap = pendingSourceExtra.value.oldSnapshot;
    clearTimeout(pendingSourceExtra.value.timer);
  } else {
    oldSnap = {
      typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
      funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
      extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
      selectedTypeKey: currentlySelectedSourceTypes.value[rowIndex]?.key ?? EMPTY_KEY
    };
  }

  // Apply immediately for responsive UI
  row.source.extra = newExtra;

  // Schedule commit after 400ms idle
  const timer = setTimeout(() => {
    const finalSnapshot: SourceSnapshot = {
      typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
      funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
      extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
      selectedTypeKey: currentlySelectedSourceTypes.value[rowIndex]?.key ?? EMPTY_KEY
    };
    // Skip if value didn't actually change
    if (oldSnap.extraKey === finalSnapshot.extraKey) {
      pendingSourceExtra.value = null;
      return;
    }
    // Create command with correct old→new snapshots (already applied, so use pushCommand)
    const cmd = new SetSourceCommand(rowIndex, finalSnapshot, doc(), currentlySelectedSourceTypes.value);
    (cmd as any).oldSnapshot = oldSnap;
    pushCommand(cmd);
    pendingSourceExtra.value = null;
  }, 400);

  pendingSourceExtra.value = { rowIndex, oldSnapshot: oldSnap, timer };
}

function destinationTypeSelectionChanged(event: Event, rowIndex: number) {
  const destinationTypeSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationTypeKey = parseInt(destinationTypeSelectElement.value);
  const selectedDestinationType = DataModel.destinationTypes.find(x => x.key === selectedDestinationTypeKey) as MappingType;
  const newSnapshot: DestinationSnapshot = {
    typeKey: selectedDestinationTypeKey, typeAbbr: selectedDestinationType.abbr, typeDesc: selectedDestinationType.description,
    funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
    extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
    selectedTypeKey: selectedDestinationTypeKey
  };
  executeCommand(new SetDestinationCommand(rowIndex, newSnapshot, doc(), currentlySelectedDestinationTypes.value,
    `Set destination type for row ${rowIndex + 1}`));
}

function destinationFunctionSelectionChanged(event: Event, rowIndex: number, isInit: boolean = false) {
  const destinationFunctionSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationFunctionKey = parseInt(destinationFunctionSelectElement.value);
  const selectedDestinationFunction = currentlySelectedDestinationTypes.value[rowIndex].functions.find(x => x.key === selectedDestinationFunctionKey) as MappingTuple;
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  const newSnapshot: DestinationSnapshot = {
    typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
    funcKey: selectedDestinationFunctionKey, funcAbbr: selectedDestinationFunction.abbr, funcDesc: selectedDestinationFunction.description,
    extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
    selectedTypeKey: currentlySelectedDestinationTypes.value[rowIndex]?.key ?? EMPTY_KEY
  };
  void isInit;
  executeCommand(new SetDestinationCommand(rowIndex, newSnapshot, doc(), currentlySelectedDestinationTypes.value,
    `Set destination function for row ${rowIndex + 1}`));
}

enum DestinationExtraVariant {
  DEFAULT,
  GLOBAL_BUTTONS,
  GLOBAL_SCREENS,
  GLOBAL_MODES,
  GLOBAL_OTHER,
  MIDI_CC,
  SKIP_CALC,
  DUAL_CHORD,
  VISU_SHADER_SELECT,
  VISU_SHADER_FUNCTIONS,
  VISU_MODULATORS,
  VISU_ENVELOPES,
  VISU_LFOS,
}

function destinationExtraSelectionChanged(event: Event, rowIndex: number, isInit: boolean = false, extraVariant: DestinationExtraVariant = DestinationExtraVariant.DEFAULT) {
  const destinationExtraSelectElement = event.target as HTMLSelectElement;
  const selectedDestinationExtraKey = parseInt(destinationExtraSelectElement.value);
  let selectedDestinationExtra: MappingTuple;
  switch (extraVariant) {
    case DestinationExtraVariant.GLOBAL_BUTTONS:
      selectedDestinationExtra = globalButtonsDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.GLOBAL_SCREENS:
      selectedDestinationExtra = globalScreensDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.GLOBAL_MODES:
      selectedDestinationExtra = globalModesDestinationExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.VISU_SHADER_SELECT:
      selectedDestinationExtra = visuShaderSelectExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.VISU_SHADER_FUNCTIONS:
      selectedDestinationExtra = visuShaderFunctionsExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.VISU_MODULATORS:
      selectedDestinationExtra = visuModulatorsExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.VISU_ENVELOPES:
      selectedDestinationExtra = visuEnvelopesExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    case DestinationExtraVariant.VISU_LFOS:
      selectedDestinationExtra = visuLfosExtras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
    default:
      selectedDestinationExtra = currentlySelectedDestinationTypes.value[rowIndex].extras.find(x => x.key === selectedDestinationExtraKey) as MappingTuple;
      break;
  }
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  const newSnapshot: DestinationSnapshot = {
    typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
    funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
    extraKey: selectedDestinationExtraKey, extraAbbr: selectedDestinationExtra.abbr, extraDesc: selectedDestinationExtra.description,
    selectedTypeKey: currentlySelectedDestinationTypes.value[rowIndex]?.key ?? EMPTY_KEY
  };
  void isInit;
  executeCommand(new SetDestinationCommand(rowIndex, newSnapshot, doc(), currentlySelectedDestinationTypes.value,
    `Set destination extra for row ${rowIndex + 1}`));
}

// Debounced destination extra state — coalesces rapid fader changes into a single undo entry
const pendingDestExtra = ref<{
  rowIndex: number;
  oldSnapshot: DestinationSnapshot;
  timer: ReturnType<typeof setTimeout>;
} | null>(null);

// Handle destination extra update from extra components (e.g. MidiCcDestinationExtra, DualDestinationExtra, etc.)
// Uses debounce to coalesce rapid fader drags into a single undo entry.
function handleDestExtraUpdate(rowIndex: number, newExtra: DestinationExtra): void {
  const row = mappingDocument.value.rows.find(x => x.index === rowIndex) as MappingRow;
  if (!row) return;

  // Capture old state or reuse from existing pending drag
  let oldSnap: DestinationSnapshot;
  if (pendingDestExtra.value && pendingDestExtra.value.rowIndex === rowIndex) {
    oldSnap = pendingDestExtra.value.oldSnapshot;
    clearTimeout(pendingDestExtra.value.timer);
  } else {
    oldSnap = {
      typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
      funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
      extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
      selectedTypeKey: currentlySelectedDestinationTypes.value[rowIndex]?.key ?? EMPTY_KEY
    };
  }

  // Apply immediately for responsive UI
  row.destination.extra = newExtra;

  // Schedule commit after 400ms idle
  const timer = setTimeout(() => {
    const finalSnapshot: DestinationSnapshot = {
      typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
      funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
      extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
      selectedTypeKey: currentlySelectedDestinationTypes.value[rowIndex]?.key ?? EMPTY_KEY
    };
    // Skip if value didn't actually change
    if (oldSnap.extraKey === finalSnapshot.extraKey) {
      pendingDestExtra.value = null;
      return;
    }
    // Create command with correct old→new snapshots (already applied, so use pushCommand)
    const cmd = new SetDestinationCommand(rowIndex, finalSnapshot, doc(), currentlySelectedDestinationTypes.value);
    (cmd as any).oldSnapshot = oldSnap;
    pushCommand(cmd);
    pendingDestExtra.value = null;
  }, 400);

  pendingDestExtra.value = { rowIndex, oldSnapshot: oldSnap, timer };
}

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName; // name of the file to be downloaded
  link.click();

  URL.revokeObjectURL(url); // free up storage--remove the file blobs
}

function downloadHtml() {
  const output = formatters.toHtml(mappingDocument.value as MappingDocument);
  const blob = new Blob([output], { type: "text/html" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.html`);
  showToast('Exported to HTML successfully', 'success', 3000);
}

function downloadMarkdown(useAbbrs: boolean = false) {
  const output = formatters.toMarkdown(mappingDocument.value as MappingDocument, useAbbrs);
  const blob = new Blob([output], { type: "text/markdown" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.md`);
  showToast('Exported to Markdown successfully', 'success', 3000);
}

function downloadJson() {
  // Prepare editor metadata
  const metadata: formatters.EditorMetadata = {};

  // Convert rowColors Map to Record for JSON serialization
  if (rowColors.value.size > 0) {
    metadata.rowColors = {};
    rowColors.value.forEach((color, index) => {
      metadata.rowColors![index] = color;
    });
  }

  // Add row comments if any
  if (Object.keys(rowComments.value).length > 0) {
    metadata.rowComments = rowComments.value;
  }

  const output = formatters.toJson(mappingDocument.value as MappingDocument, metadata);
  const blob = new Blob([output], { type: "application/json" });
  downloadFile(blob, `${mappingDocument.value.header.fileName}.json`);
  showToast('Exported to JSON successfully', 'success', 3000);
}

function downloadMap() {
  const blob = formatters.toBlob(mappingDocument.value as MappingDocument);
  downloadFile(blob, `${mappingDocument.value.header.fileName}.map`);
  showToast('Downloaded MAP file successfully', 'success', 3000);
}

</script>
<template>
  <!-- Toast Notifications -->
  <ToastNotifications ref="toastNotifications" />

  <header>
    <div class="pt-5">
      <img alt="NerdSeq Logo" class="logo" src="/src/assets/images/nerdseq-logo.png" height="100" />
      <h2 class="pt-3">Mapping File Editor</h2>
    </div>
  </header>

  <!-- Settings Panel (rightmost) -->
  <SettingsPanel
    v-model:display-row-index-as-hex="displayRowIndexAsHex"
    v-model:show-selection-toolbar="showSelectionToolbar"
    v-model:show-midi-monitor="showMidiMonitor"
    v-model:show-variable-monitor="showVariableMonitor"
    v-model:show-log-monitor="showLogMonitor"
    v-model:show-description="showDescription"
    v-model:midi-learn-auto-advance="midiLearnAutoAdvance"
    v-model:paste-auto-advance="pasteAutoAdvance"
    :header-text="mappingDocument.header.headerText"
    :firmware-major="mappingDocument.header.majorVersion"
    :firmware-minor="mappingDocument.header.minorVersion"
    @expanded-change="settingsPanelExpanded = $event"
  />

  <!-- Selection Toolbar (docked to left of Settings) -->
  <SelectionToolbar
    v-if="showSelectionToolbar"
    :selected-count="selectedRowIndices.size"
    :has-copied-row="hasCopiedRow"
    :has-copied-rows="hasCopiedRows"
    :can-move-up="canMoveUp"
    :can-move-down="canMoveDown"
    :is-locked="isCurrentLocked"
    @expanded-change="selectionToolbarExpanded = $event"
    @cut="handleMultiCut"
    @copy="handleMultiCopy"
    @paste="handleMultiPaste"
    @move-up="handleMultiMoveUp"
    @move-down="handleMultiMoveDown"
    @clear="handleMultiClear"
    @set-color="setRowColor"
    @cancel="clearRowSelection"
  />

  <!-- MIDI Monitor (docked to left of Selection Toolbar) -->
  <MidiMonitor
    v-if="midiSupported && showMidiMonitor"
    @expanded-change="midiMonitorExpanded = $event"
  />

  <!-- Variable Monitor (docked to left of MIDI Monitor) -->
  <VariableMonitor
    v-if="showVariableMonitor"
    :variables="mappingDocument.variables"
    :variable-usage="variableUsage"
    :display-row-index-as-hex="displayRowIndexAsHex"
    :rows="mappingDocument.rows"
    @expanded-change="variableMonitorExpanded = $event"
    @scroll-to-row="handleScrollToRow"
  />

  <!-- Log Monitor (docked to left of Variable Monitor) -->
  <LogMonitor
    v-if="showLogMonitor"
    :display-row-index-as-hex="displayRowIndexAsHex"
    :undo-history="undoHistory"
    :redo-history="redoHistory"
    :can-undo="canUndo"
    :can-redo="canRedo"
    :undo-description="undoDescription"
    :redo-description="redoDescription"
    :active-slot="activeSlot"
    @undo="undo"
    @redo="redo"
    @expanded-change="logMonitorExpanded = $event"
    @scroll-to-row="handleScrollToRow"
    @unnotice-warning="handleUnnoticeWarning"
  />

  <main>
    <div id="mappingFileSelectContainer" class="pt-3">
      <MenuButton
        variant="primary"
        border-radius="left"
        title="Open a .MAP or .JSON file."
        @click="fileInput?.click()"
      >
        Open Mapping File
      </MenuButton>
      <input id="fileInput" class="d-none" type="file" accept=".map, .json" ref="fileInput" @change="readFile" />
      <MenuButton
        variant="primary"
        border-radius="none"
        data-variant="reset"
        :disabled="isCurrentLocked"
        @click="reset"
        title="Reset the current mapping file"
      >
        Reset
      </MenuButton>
      <MenuButton
        variant="primary"
        border-radius="none"
        class="position-relative analyze-btn"
        :class="{ 'analyze-warning': warningCount > 0 }"
        @click="runAnalysis"
        title="Run static analysis to detect potential issues"
      >
        Analyze
        <span
          v-if="warningCount > 0"
          class="position-absolute top-0 end-0 translate-middle-y badge rounded-pill"
          :class="errorCount > 0 ? 'bg-danger' : 'bg-warning text-dark'"
        >
          {{ warningCount }}
          <span class="visually-hidden">warnings</span>
        </span>
      </MenuButton>

      <!-- A/B Cache Toggle and Filename -->
      <MenuButton
        variant="slot"
        :active="activeSlot === 'A'"
        :locked="isLockedA"
        :has-data="hasDataA"
        @click="handleSlotSwitch('A')"
        :title="activeSlot === 'A' ? (isLockedA ? 'Click to unlock [1]' : 'Click to lock [1]') : (isLockedA ? 'Switch to slot 1 (locked) [1]' : 'Switch to slot 1 [1]')"
      >
        1
      </MenuButton>
      <MenuButton
        variant="slot"
        :active="activeSlot === 'B'"
        :locked="isLockedB"
        :has-data="hasDataB"
        @click="handleSlotSwitch('B')"
        :title="activeSlot === 'B' ? (isLockedB ? 'Click to unlock [2]' : 'Click to lock [2]') : (isLockedB ? 'Switch to slot 2 (locked) [2]' : 'Switch to slot 2 [2]')"
      >
        2
      </MenuButton>
      <input
        type="text"
        class="filename-input"
        v-model="mappingDocument.header.fileName"
        :disabled="isCurrentLocked"
        :class="{ 'input-locked': isCurrentLocked }"
        title="File name for exports"
      />

      <!-- Global Description Panel -->
      <GlobalDocumentationPanel
        v-if="showDescription"
        v-model:global-comment="mappingDocument.globalComment"
        :expanded="globalDocPanelExpanded"
        @toggle="globalDocPanelExpanded = !globalDocPanelExpanded"
      />
    </div>
    <div id="downloadActionsContainer" class="pt-3">
      <div class="download-label">Save as:</div>
      <div class="download-buttons">
        <MenuButton variant="download" border-radius="left" @click="downloadHtml">
          HTML
        </MenuButton>
        <MenuButton variant="download" border-radius="none" @click="downloadMarkdown(false)">
          Markdown
        </MenuButton>
        <MenuButton variant="download" border-radius="none" @click="downloadMarkdown(true)">
          NS Screens (MD)
        </MenuButton>
        <MenuButton variant="download" border-radius="none" @click="downloadJson">
          JSON
        </MenuButton>
        <MenuButton variant="download" border-radius="right" @click="downloadMap">
          MAP
        </MenuButton>
      </div>
    </div>

    <div id="docEditor" class="pt-3">
      <div id="rowsGridContainerHeader" class="pt-3">
        <div>Row</div>
        <div>Source Type</div>
        <div>Source Function</div>
        <div>Source Extra(s)</div>
        <div title="Row status: > = Active (default), X = Skip row (conditional)">●</div>
        <div>Destination Type</div>
        <div>Destination Function</div>
        <div>Destination Extra</div>
        <div>Clear</div>
      </div>
      <div id="rowsGridContainer" v-for="row in mappingDocument.rows" :key="row.index" :data-row-index="row.index" :style="{ backgroundColor: getRowBackgroundColor(row.index) }">

        <div
          class="gridItem rowIndex pt-1"
          :class="{
            'row-empty': row.source.type.key === EMPTY_KEY,
            'row-selected': isRowSelected(row.index),
            'row-multi-selected': selectedRowIndices.size > 1 && isRowSelected(row.index),
            'row-has-warning': rowHasWarnings(row.index)
          }"
          @click="handleRowClick(row.index, $event)"
          :title="rowHasWarnings(row.index) ? getRowWarnings(row.index).map(w => w.message).join('; ') : ''"
        >
          {{ formatRowIndex(row.index) }}
          <span v-if="rowHasWarnings(row.index)" class="warning-indicator">!</span>
        </div>

        <div class="gridItem">
          <select :value="row.source.type.key" @change="sourceTypeSelectionChanged($event, row.index)"
            :title="row.source.type.abbr" class="form-select pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.type.key === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="sourceType in DataModel.sourceTypes" :key="sourceType.key" :value="sourceType.key"
              :title="sourceType.abbr">
              {{ sourceType.description }}
            </option>
          </select>
        </div>

        <div class="gridItem">
          <label class="label-empty border-dark pt-1" v-if="row.source.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <select v-else :value="row.source.function.key" @change="sourceFunctionSelectionChanged($event, row.index)"
            :title="row.source.function.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.function.key === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="func in currentlySelectedSourceTypes[row.index]?.functions" :key="func.key" :value="func.key"
              :title="func.abbr">
              {{ func.description }}</option>
          </select>
        </div>

        <div class="gridItem">
          <!-- If no source type is selected then just show a label -->
          <label class="label-empty border-dark pt-1" v-if="row.source.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <!-- Else handel all the edge cases -->

          <!-- MIDI Learn for MIDI source types when LRN function selected -->
          <MidiLearnExtra
            v-else-if="[5, 6, 7].includes(row.source.type.key) && row.source.function.key === 48"
            :model-value="row.source.extra as SourceExtra"
            @update:model-value="(v) => handleSourceExtraUpdate(row.index, v as SourceExtra)"
            mode="source"
            :source-type="row.source.type.key"
            :is-locked="isCurrentLocked"
            :auto-start="midiLearnAutoStartRow === row.index"
            :last-learned-message="lastLearnedMidiMessage"
            @update-last-message="(msg: string) => lastLearnedMidiMessage = msg"
            @function-update="(functionKey: number) => handleSourceMidiLearnFunctionUpdate(row.index, functionKey)"
          />

          <!-- Calc or Skip Source Type -->
          <CalcSkipSourceExtra
            :model-value="row.source.extra as SourceExtra"
            @update:model-value="(v) => handleSourceExtraUpdate(row.index, v as SourceExtra)"
            v-else-if="row.source.type.key === CALC_SOURCE_TYPE_KEY || row.source.type.key === SKIP_SOURCE_TYPE_KEY"
            :display-row-index-as-hex="displayRowIndexAsHex"
            :is-locked="isCurrentLocked" />

          <!-- NRPN Source Type -->
          <NrpnSourceExtra
            :model-value="row.source.extra as SourceExtra"
            @update:model-value="(v) => handleSourceExtraUpdate(row.index, v as SourceExtra)"
            v-else-if="row.source.type.key === MIDI_NRPN_SOURCE_TYPE_KEY"
            :is-locked="isCurrentLocked" />

          <!-- Variable Source Type -->
          <VariableSourceExtra
            :model-value="row.source.extra as SourceExtra"
            @update:model-value="(v) => handleSourceExtraUpdate(row.index, v as SourceExtra)"
            v-else-if="row.source.type.key === VAR_SOURCE_TYPE_KEY"
            :is-locked="isCurrentLocked"
            :incoming-value="getVariableSourceIncomingValue(row)" />

          <!-- External Source Type, Keyboard Function -->
          <select
            v-else-if="row.source.type.key == EXTERNAL_SOURCE_TYPE_KEY && row.source.function.key == KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY"
            :value="row.source.extra.keyOrValue"
            @change="sourceExtraSelectionChanged($event, row.index, SourceExtraVariant.EXTERNAL_KEYBOARD)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="extra in keyboardSourceExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- External Source Type, Sega Gamepad Function  -->
          <select
            v-else-if="row.source.type.key == EXTERNAL_SOURCE_TYPE_KEY && row.source.function.key == SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY"
            :value="row.source.extra.keyOrValue"
            @change="sourceExtraSelectionChanged($event, row.index, SourceExtraVariant.EXTERNAL_SEGA_GAMEPAD)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="extra in segaGamepadSourceExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- External Source Type, NerdSEQ Buttons Function  -->
          <select
            v-else-if="row.source.type.key == EXTERNAL_SOURCE_TYPE_KEY && row.source.function.key == NERDSEQ_BUTTONS_EXTERNAL_SOURCE_FUNCTION_KEY"
            :value="row.source.extra.keyOrValue"
            @change="sourceExtraSelectionChanged($event, row.index, SourceExtraVariant.EXTERNAL_NERDSEQ_BUTTONS)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="extra in nerdseqButtonsSourceExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Else show a select with all the extras for this source type -->
          <select v-else :value="row.source.extra.keyOrValue" @change="sourceExtraSelectionChanged($event, row.index)"
            :title="row.source.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.source.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="extra in currentlySelectedSourceTypes[row.index]?.extras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

        </div>

        <div class="gridItem row-status pt-1"
          :class="{ 'row-status-active': !isRowSkipped(row), 'row-status-skipped': isRowSkipped(row) }"
          :title="isRowSkipped(row) ? 'Row will be skipped conditionally' : 'Row is active'">
          {{ isRowSkipped(row) ? 'X' : '>' }}
        </div>

        <div class="gridItem">
          <select :value="row.destination.type.key" @change="destinationTypeSelectionChanged($event, row.index)"
            :title="row.destination.type.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.type.key === EMPTY_KEY, 'select-locked': isCurrentLocked }">

            <option v-for="destinationType in DataModel.destinationTypes" :key="destinationType.key"
              :value="destinationType.key" :title="destinationType.abbr">
              {{ destinationType.description }}</option>

          </select>
        </div>

        <div class="gridItem">
          <label class="label-empty border-dark pt-1" v-if="row.destination.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <select v-else :value="row.destination.function.key"
            @change="destinationFunctionSelectionChanged($event, row.index)" :title="row.destination.function.abbr"
            class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.function.key === EMPTY_KEY, 'select-locked': isCurrentLocked }">
            <option v-for="func in currentlySelectedDestinationTypes[row.index]?.functions" :key="func.key"
              :value="func.key" :title="func.abbr">
              {{ func.description }}</option>
          </select>

        </div>

        <div class="gridItem">
          <!-- If no destination type is selected then just show a label -->
          <label class="label-empty border-dark pt-1" v-if="row.destination.type.key === EMPTY_KEY">{{ EMPTY_DESCRIPTION
          }}</label>

          <!-- Else handel all the edge cases -->

          <!-- MIDI Learn for MIDI CC destination when LRN function selected -->
          <MidiLearnExtra
            v-else-if="row.destination.type.key === MIDI_CC_DESTINATION_TYPE_KEY && row.destination.function.key === MIDI_LEARN_FUNCTION_KEY"
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            mode="destination"
            :is-locked="isCurrentLocked"
            :auto-start="midiLearnAutoStartRow === row.index"
            :last-learned-message="lastLearnedMidiMessage"
            @update-last-message="(msg: string) => lastLearnedMidiMessage = msg"
            @function-update="(functionKey: number) => handleDestMidiLearnFunctionUpdate(row.index, functionKey)"
          />

          <!-- Midi CC Destination Type -->
          <MidiCcDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === MIDI_CC_DESTINATION_TYPE_KEY && row.destination.function.key !== MIDI_LEARN_FUNCTION_KEY"
            :midi-cc-extras="currentlySelectedDestinationTypes[row.index]?.extras"
            :is-locked="isCurrentLocked" />

          <!-- Skip Destination Type -->
          <SkipDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === SKIP_DESTINATION_TYPE_KEY"
            :display-row-index-as-hex="displayRowIndexAsHex"
            :is-locked="isCurrentLocked" />

          <!-- Variable Destination Type -->
          <VariableDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === SETVAR_DESTINATION_TYPE_KEY"
            :is-locked="isCurrentLocked" />

          <!-- DUAL Destination Type -->
          <DualDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === DUAL_DESTINATION_TYPE_KEY"
            :dual-extras="currentlySelectedDestinationTypes[row.index]?.extras"
            :is-locked="isCurrentLocked" />

          <!-- VISU Destination Type - Shader Select -->
          <VisuDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === VISU_DESTINATION_TYPE_KEY && row.destination.function.key === VISU_SHADER_SELECT_FUNCTION_KEY"
            :visu-extras="visuShaderSelectExtras"
            :is-locked="isCurrentLocked" />

          <!-- VISU Destination Type - Shader Functions -->
          <VisuDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === VISU_DESTINATION_TYPE_KEY && row.destination.function.key === VISU_SHADER_FUNCTIONS_FUNCTION_KEY"
            :visu-extras="visuShaderFunctionsExtras"
            :is-locked="isCurrentLocked" />

          <!-- VISU Destination Type - Modulators -->
          <VisuDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === VISU_DESTINATION_TYPE_KEY && row.destination.function.key === VISU_MODULATORS_FUNCTION_KEY"
            :visu-extras="visuModulatorsExtras"
            :is-locked="isCurrentLocked" />

          <!-- VISU Destination Type - Envelopes -->
          <VisuDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === VISU_DESTINATION_TYPE_KEY && row.destination.function.key === VISU_ENVELOPES_FUNCTION_KEY"
            :visu-extras="visuEnvelopesExtras"
            :is-locked="isCurrentLocked" />

          <!-- VISU Destination Type - LFOs -->
          <VisuDestinationExtra
            :model-value="row.destination.extra as DestinationExtra"
            @update:model-value="(v) => handleDestExtraUpdate(row.index, v as DestinationExtra)"
            v-else-if="row.destination.type.key === VISU_DESTINATION_TYPE_KEY && row.destination.function.key === VISU_LFOS_FUNCTION_KEY"
            :visu-extras="visuLfosExtras"
            :is-locked="isCurrentLocked" />

          <!-- Global Buttons Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_BUTTONS)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">
            <option v-for="extra in globalButtonsDestinationExtras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Global Screens Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_SCREENS)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">
            <option v-for="extra in globalScreensDestinationExtras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Global Modes Destination Type -->
          <select
            v-else-if="row.destination.type.key === GLOBAL_DESTINATION_TYPE_KEY && row.destination.function.key === GLOBAL_MODES_DESTINATION_FUNCTION_KEY"
            :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index, false, DestinationExtraVariant.GLOBAL_MODES)"
            :title="row.destination.extra.abbr" class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">
            <option v-for="extra in globalModesDestinationExtras" :key="extra.key" :value="extra.key"
              :title="extra.abbr">
              {{ extra.description }}</option>
          </select>

          <!-- Else show a select with all the extras for this destination type -->
          <select v-else :value="row.destination.extra.keyOrValue"
            @change="destinationExtraSelectionChanged($event, row.index)" :title="row.destination.extra.abbr"
            class="form-select border-dark pt-1"
            :disabled="isCurrentLocked"
            :class="{ 'select-empty': row.destination.extra.keyOrValue === EMPTY_KEY, 'select-locked': isCurrentLocked }">
            <option v-for="extra in currentlySelectedDestinationTypes[row.index]?.extras" :key="extra.key"
              :value="extra.key" :title="extra.abbr">
              {{ extra.description }}</option>
          </select>
        </div>

        <!-- Clear button at grid position 10 -->
        <div class="endCap">
          <IconButton
            v-if="row.source.type.key !== EMPTY_KEY || row.destination.type.key !== EMPTY_KEY"
            class="clear-btn-fixed"
            :class="{ 'btn-locked': isCurrentLocked }"
            size="sm"
            variant="clear"
            :disabled="isCurrentLocked"
            @click="clearRow(row.index)"
            title="Clear this row"
          >
            X
          </IconButton>
        </div>

        <!-- Comment section (unfolds only when single row is selected) -->
        <RowCommentSection
          v-if="expandedCommentRowIndex === row.index"
          :row-index="row.index"
          :source-empty="row.source.type.key === EMPTY_KEY"
          :destination-empty="row.destination.type.key === EMPTY_KEY"
          :has-copied-source="hasCopiedSource"
          :has-copied-destination="hasCopiedDestination"
          :warnings="getRowWarnings(row.index)"
          :source-value="row.source.type.key === VAR_SOURCE_TYPE_KEY && row.source.extra.keyOrValue === 0 && row.source.function.key >= 0 && row.source.function.key < 16 ? mappingDocument.variables[row.source.function.key].value : row.source.extra.keyOrValue"
          :destination-value="row.destination.type.key === SETVAR_DESTINATION_TYPE_KEY && row.destination.extra.keyOrValue === 0 && row.destination.function.key >= 0 && row.destination.function.key < 16 ? mappingDocument.variables[row.destination.function.key].value : row.destination.extra.keyOrValue"
          :is-source-skip="row.source.type.key === SKIP_SOURCE_TYPE_KEY"
          :is-destination-skip="row.destination.type.key === SKIP_DESTINATION_TYPE_KEY"
          :source-skip-active="row.source.type.key === SKIP_SOURCE_TYPE_KEY && row.source.function.key !== EMPTY_KEY && Math.floor(row.source.function.key / 6) + 1 > 0"
          :destination-skip-active="row.destination.type.key === SKIP_DESTINATION_TYPE_KEY && row.destination.function.key !== EMPTY_KEY && Math.floor(row.destination.function.key / 6) + 1 > 0"
          :is-locked="isCurrentLocked"
          :model-value="rowComments[row.index] || ''"
          @update:model-value="(val) => executeCommand(new SetRowCommentCommand(row.index, val, rowComments))"
          @copy-source="copySource"
          @paste-source="handlePasteSource"
          @clear-source="clearSource"
          @copy-destination="copyDestination"
          @paste-destination="handlePasteDestination"
          @clear-destination="clearDestination"
          @notice-warning="(warningId: string) => handleNoticeWarning(warningId)"
        />
      </div>
      <div id="variablesContainer" class="pt-3"></div>
    </div>
  </main>
</template>

<style scoped>
h2 {
  color: var(--color-text-yellow);
}

/* File input label wrapping MenuButton */
#fileInputLabel {
  display: inline-block;
  cursor: pointer;
}

#fileInputLabel :deep(.menu-btn):hover {
  background-color: var(--color-hover) !important;
  color: var(--color-text-primary) !important;
}

/* Download container styles */
.download-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
}

.download-buttons {
  display: inline-flex;
}

/* Analyze button warning state */
.analyze-btn.analyze-warning {
  background-color: #ffc107 !important;
  color: #000 !important;
}

#rowsGridContainer,
#rowsGridContainerHeader {
  display: grid;
  grid-template-columns: 2.5em 1.3fr 2fr 2.5fr 2em 1.3fr 2fr 2.5fr 3.5em;
  gap: var(--grid-gap);
  width: 100%;
}

#rowsGridContainer {
  margin: 0px;
  padding: 1px;
}

#rowsGridContainerHeader {
  font-weight: bold;
  text-align: center;
}

.btn:hover {
  background-color: var(--color-hover) !important;
  color: var(--color-text-primary);
}

.rowIndex {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary) !important;
  color: var(--color-text-primary);
  border-radius: var(--form-border-radius-left);
  text-align: center;
  font-size: small;
  font-weight: bold;
}

.row-status {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  text-align: center;
  font-size: medium;
  font-weight: bold;
}

.row-status-active {
  color: #888888;
}

.row-status-skipped {
  color: #ff4444;
  padding: 3px 0;
  cursor: pointer;
}

.rowIndex.row-selected {
  background-color: #F1F700 !important;
  color: #000;
  box-shadow: 0 0 8px rgba(241, 247, 0, 0.5);
}

.rowIndex.row-multi-selected {
  background-color: rgba(241, 247, 0, 0.7) !important;
  color: #000;
  border-left: 3px solid #F1F700;
}

.rowIndex.row-has-warning {
  border-left: 3px solid #ffc107;
}

.rowIndex.row-has-warning:not(.row-selected):not(.row-multi-selected) {
  background-color: rgba(255, 193, 7, 0.15) !important;
}

.warning-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ffc107;
  color: #000;
  font-size: 9px;
  font-weight: bold;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.rowIndex {
  position: relative;
}

.gridItem {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gridItem>select {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  height: 100%;
}

/* Note: .select-empty and .label-empty are now in global form-elements.css */

#buttonReset {
  background-color: var(--color-reset) !important;
}

#buttonReset:hover {
  background-color: var(--color-reset-hover) !important;
}

/* Clear button and endCap container */
.endCap {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  border-radius: var(--form-border-radius-right);
}

.clear-btn-fixed {
  font-size: var(--button-font-size);
  margin: 0;
  height: 100%;
  width: 100%;
  border-radius: var(--form-border-radius-right);
}

/* Consistent spacing for all controls */
#mappingFileSelectContainer > *:not(.d-none) {
  margin-right: 4px;
}

#mappingFileSelectContainer > *:last-child {
  margin-right: 0;
}

/* Remove border-radius gap between grouped buttons */
#mappingFileSelectContainer :deep(.menu-btn--radius-left),
#mappingFileSelectContainer :deep(.menu-btn--radius-none) {
  margin-right: 0;
}

/* Add spacing after last button in a group */
#mappingFileSelectContainer :deep(.menu-btn--radius-right),
#mappingFileSelectContainer :deep(.menu-btn--radius-all) {
  margin-right: 4px;
}

/* Filename input inline with buttons */
.filename-input {
  height: var(--form-height);
  background-color: var(--color-primary);
  border: 1px solid var(--color-dark-bg);
  border-radius: var(--form-border-radius);
  color: #F1F700;
  font-size: var(--form-font-size);
  font-weight: bold;
  padding: 0 10px;
  width: 200px;
  display: inline-block;
  vertical-align: middle;
}

.filename-input:focus {
  outline: none;
  border-color: var(--color-hover);
  background-color: rgba(52, 204, 153, 0.3);
}

.filename-input.input-locked {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--color-disabled);
}

/* Global description panel inline */
#mappingFileSelectContainer .global-doc-panel {
  display: inline-block;
  margin-bottom: 0;
  vertical-align: middle;
}

/* Locked state overlay for editor */
.editor-locked-overlay {
  position: relative;
}

.editor-locked-overlay::after {
  content: 'LOCKED';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(220, 53, 69, 0.9);
  color: #fff;
  padding: 10px 30px;
  font-size: 24px;
  font-weight: bold;
  border-radius: 4px;
  pointer-events: none;
}

/* Locked state for form elements */
.select-locked {
  opacity: 0.5;
  cursor: not-allowed !important;
  background-color: var(--color-disabled, #333) !important;
}

.select-locked:disabled {
  pointer-events: none;
}

.btn-locked {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.btn-locked:disabled {
  pointer-events: none;
}

.input-locked {
  opacity: 0.5;
  cursor: not-allowed !important;
  background-color: var(--color-disabled, #333) !important;
}
</style>
