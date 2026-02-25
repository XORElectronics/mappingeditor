<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import BasePanel from './BasePanel.vue'
import RowRefBadge from './RowRefBadge.vue'
import type { VariableUsageInfo } from '@/composables/useVariableUsage'
import { buildRowReadersMap } from '@/services/rowReferenceService'
import { usePanelLayout } from '../composables/usePanelLayout'

interface VariableLike {
  readonly name: string
  value: number
}

interface RowLike {
  readonly index: number
  source: {
    type: { key: number; abbr: string }
    function: { key: number; abbr: string }
    extra: { keyOrValue: number }
  }
  destination: {
    type: { key: number; abbr: string }
    function: { key: number; abbr: string }
    extra: { keyOrValue: number }
  }
}

const props = defineProps<{
  variables: VariableLike[]
  variableUsage: VariableUsageInfo[]
  displayRowIndexAsHex: boolean
  rows?: RowLike[]
}>()

const { variablesRight } = usePanelLayout()

const emit = defineEmits<{
  expandedChange: [expanded: boolean]
  scrollToRow: [rowIndex: number]
}>()

// Value display format
type ValueFormat = 'decimal' | 'hex' | 'binary' | 'boolean';
const valueFormat = ref<ValueFormat>('decimal');
const VALUE_FORMAT_KEY = 'variable-value-format';

// Display mode: values, writers, or readers
type DisplayMode = 'values' | 'writers' | 'readers';
const displayMode = ref<DisplayMode>('values');
const DISPLAY_MODE_KEY = 'variable-display-mode';

// Value source mode: 'current' (static analyzer) or 'debugging' (future virtual execution)
type ValueSourceMode = 'current' | 'debugging';
const valueSourceMode = ref<ValueSourceMode>('current');
const VALUE_SOURCE_MODE_KEY = 'variable-monitor-mode';

// Rows subsection state
type RowsDisplayMode = 'values' | 'readers';
const rowsSubsectionExpanded = ref(false);
const rowsDisplayMode = ref<RowsDisplayMode>('values');
const ROWS_SUBSECTION_EXPANDED_KEY = 'variable-rows-subsection-expanded';
const ROWS_DISPLAY_MODE_KEY = 'variable-rows-display-mode';

// Variables section height state (flexible resizing)
const variablesHeight = ref<number | null>(null);
const VARIABLES_HEIGHT_KEY = 'variable-monitor-variables-height';
const isResizingVariables = ref(false);
const resizeStartY2 = ref(0);
const resizeStartHeight2 = ref(0);
const minVariablesHeightNeeded = ref(0); // Calculated based on content

// Rows section height state (not whole panel)
const rowsHeight = ref(200);
const ROWS_HEIGHT_KEY = 'variable-monitor-rows-height';
const isResizing = ref(false);
const resizeStartY = ref(0);
const resizeStartHeight = ref(0);
const maxRowsHeight = ref(0); // Calculated based on content

// Load preferences from localStorage
onMounted(() => {
  const savedFormat = localStorage.getItem(VALUE_FORMAT_KEY);
  if (savedFormat && ['decimal', 'hex', 'binary', 'boolean'].includes(savedFormat)) {
    valueFormat.value = savedFormat as ValueFormat;
  }

  const savedMode = localStorage.getItem(DISPLAY_MODE_KEY);
  if (savedMode && ['values', 'writers', 'readers'].includes(savedMode)) {
    displayMode.value = savedMode as DisplayMode;
  }

  const savedRowsExpanded = localStorage.getItem(ROWS_SUBSECTION_EXPANDED_KEY);
  if (savedRowsExpanded !== null) {
    rowsSubsectionExpanded.value = savedRowsExpanded === 'true';
  }

  const savedRowsMode = localStorage.getItem(ROWS_DISPLAY_MODE_KEY);
  if (savedRowsMode && ['values', 'readers'].includes(savedRowsMode)) {
    rowsDisplayMode.value = savedRowsMode as RowsDisplayMode;
  }

  const savedSourceMode = localStorage.getItem(VALUE_SOURCE_MODE_KEY);
  if (savedSourceMode && ['current', 'debugging'].includes(savedSourceMode)) {
    valueSourceMode.value = savedSourceMode as ValueSourceMode;
  }

  const savedVariablesHeight = localStorage.getItem(VARIABLES_HEIGHT_KEY);
  if (savedVariablesHeight !== null) {
    const height = parseInt(savedVariablesHeight, 10);
    if (!isNaN(height) && height >= 24 && height <= 600) {
      variablesHeight.value = height;
    }
  }

  const savedHeight = localStorage.getItem(ROWS_HEIGHT_KEY);
  if (savedHeight !== null) {
    const height = parseInt(savedHeight, 10);
    if (!isNaN(height) && height >= 24 && height <= 800) {
      rowsHeight.value = height;
    }
  }
});

// Persist preferences
watch(valueFormat, (val) => {
  localStorage.setItem(VALUE_FORMAT_KEY, val);
});

watch(displayMode, (val) => {
  localStorage.setItem(DISPLAY_MODE_KEY, val);
});

watch(rowsSubsectionExpanded, (val) => {
  localStorage.setItem(ROWS_SUBSECTION_EXPANDED_KEY, String(val));
});

watch(rowsDisplayMode, (val) => {
  localStorage.setItem(ROWS_DISPLAY_MODE_KEY, val);
});

watch(valueSourceMode, (val) => {
  localStorage.setItem(VALUE_SOURCE_MODE_KEY, val);
});

watch(rowsHeight, (val) => {
  localStorage.setItem(ROWS_HEIGHT_KEY, String(val));
});

// Variable labels A-P
const variableLabels = computed(() => {
  return props.variables.map((_, index) => String.fromCharCode(65 + index))
})

// Use single column for binary format, two columns otherwise
const useSingleColumn = computed(() => {
  return valueFormat.value === 'binary';
});

// Detect if scrolling is needed in variables container
const variablesNeedScroll = computed(() => {
  // Will be set dynamically based on actual content height
  return minVariablesHeightNeeded.value > 0;
});

// Split variables based on layout mode
const leftColumn = computed(() => {
  return useSingleColumn.value ? props.variables : props.variables.slice(0, 8);
});

const rightColumn = computed(() => {
  return useSingleColumn.value ? [] : props.variables.slice(8, 16);
});

const leftLabels = computed(() => {
  return useSingleColumn.value ? variableLabels.value : variableLabels.value.slice(0, 8);
});

const rightLabels = computed(() => {
  return useSingleColumn.value ? [] : variableLabels.value.slice(8, 16);
});

// Format value based on selected format
function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'hex':
      return value.toString(16).toUpperCase().padStart(3, '0'); // 000-FFF
    case 'binary':
      return value.toString(2).padStart(12, '0'); // 12-bit binary
    case 'boolean':
      return value === 0 ? 'false:0' : 'true:1';
    case 'decimal':
    default:
      return value.toString(); // 0-4095
  }
}

function getFormatPrefix(format: ValueFormat): string {
  switch (format) {
    case 'hex': return '0x';
    case 'binary': return '0b';
    default: return '';
  }
}

// Format row index based on hex/dec preference
function formatRowIndex(index: number): string {
  if (props.displayRowIndexAsHex) {
    return index.toString(16).toUpperCase().padStart(2, '0');
  }
  return index.toString();
}

// Get raw row indices for variable writers/readers (for clickable badges)
function getVarRowIndices(varIndex: number): number[] {
  if (displayMode.value === 'writers') {
    return props.variableUsage[varIndex]?.writtenByRows ?? [];
  } else if (displayMode.value === 'readers') {
    return props.variableUsage[varIndex]?.readByRows ?? [];
  }
  return [];
}

// Get raw row reader indices for rows subsection
function getRowReaderIndices(rowIndex: number): number[] {
  return rowReadersMap.value.get(rowIndex) ?? [];
}

// Handle click on a row index — scroll to that row in the main table
function handleRowNavigate(rowIndex: number): void {
  emit('scrollToRow', rowIndex);
}

// Get display content based on mode
function getDisplayContent(varIndex: number): string {
  if (displayMode.value === 'writers') {
    const writers = props.variableUsage[varIndex]?.writtenByRows ?? [];
    return writers.length > 0 ? writers.map(formatRowIndex).join(', ') : '—';
  } else if (displayMode.value === 'readers') {
    const readers = props.variableUsage[varIndex]?.readByRows ?? [];
    return readers.length > 0 ? readers.map(formatRowIndex).join(', ') : '—';
  } else {
    // Values mode: use current-values analysis when enabled
    if (valueSourceMode.value === 'current') {
      const usage = props.variableUsage[varIndex];
      if (usage?.isWritten) {
        if (usage.lastWriteValue !== null) {
          // Known fader value
          return getFormatPrefix(valueFormat.value) + formatValue(usage.lastWriteValue, valueFormat.value);
        }
        // Written by SetVar only (dynamic value)
        return '?';
      }
      // Never written: show document initial value
    }
    const variable = props.variables[varIndex];
    return getFormatPrefix(valueFormat.value) + formatValue(variable.value, valueFormat.value);
  }
}

// Expanded width - consistent sizing to avoid scrollbars
const expandedWidth = computed(() => {
  // Use consistent 300px width for all formats to ensure proper panel docking
  // and to accommodate future Rows subsection
  return '300px';
})

function onExpandedChange(expanded: boolean): void {
  emit('expandedChange', expanded)
}

// Toggle rows subsection
function toggleRowsSubsection(): void {
  rowsSubsectionExpanded.value = !rowsSubsectionExpanded.value;
}

// Build row readers map when rows change
const rowReadersMap = computed(() => {
  if (!props.rows) return new Map<number, number[]>();
  // Cast to any to work around type compatibility issues with buildRowReadersMap
  return buildRowReadersMap(props.rows as any);
});

// Format row destination info
function formatRowDestination(row: RowLike): string {
  const destType = row.destination.type.abbr;
  const destFunc = row.destination.function.abbr;

  if (destType === '----' || destType === 'EMPTY') {
    return '[Empty]';
  }

  if (destFunc === '----' || destFunc === 'EMPTY') {
    return destType;
  }

  return `${destType} ${destFunc}`;
}

// Constants for source type detection
const EMPTY_KEY = 65535;
const VAR_SOURCE_TYPE_KEY = 9;
const CALC_SOURCE_TYPE_KEY = 10;

/**
 * Resolve a Calc/Skip operand byte to a numeric value.
 * Constants 0-9 = literal, Variables 10-25 = variable's known value.
 * Returns null if the operand's value is unknown.
 */
function resolveCalcOperand(byte: number): number | null {
  if (byte >= 0 && byte <= 9) {
    return byte; // Constant literal
  }
  if (byte >= 10 && byte <= 25) {
    const varIdx = byte - 10;
    const usage = props.variableUsage[varIdx];
    if (usage?.lastWriteValue !== null && usage?.lastWriteValue !== undefined) {
      return usage.lastWriteValue;
    }
    return null; // Variable value unknown
  }
  return null; // Row reference or other — unknown for static analysis
}

/**
 * Evaluate a Calc operation given two operand values and function key.
 * Returns the result as a string: number, "OVF", "Err", or "NaN".
 */
function evaluateCalc(funcKey: number, a: number | null, b: number | null): string {
  if (a === null || b === null) return 'NaN';

  let result: number;
  const clamp = (v: number) => Math.max(0, Math.min(4095, v));

  switch (funcKey) {
    case 0: result = clamp(a + b); break;                     // ADD (clamped)
    case 1: result = a + b; break;                             // ADD! (overflow)
    case 2: result = clamp(a - b); break;                     // SUB (clamped)
    case 3: result = a - b; break;                             // SUB! (overflow)
    case 4: result = clamp(a * b); break;                     // MUL (clamped)
    case 5: result = a * b; break;                             // MUL! (overflow)
    case 6: result = clamp(Math.floor(a * b / 10)); break;   // MUL. (0.1, clamped)
    case 7: result = Math.floor(a * b / 10); break;           // MUL: (0.1, overflow)
    case 8:                                                     // DIV
      if (b === 0) return 'Err';
      result = clamp(Math.floor(a / b));
      break;
    case 9:                                                     // DIV. (0.1)
      if (b === 0) return 'Err';
      result = clamp(Math.floor(a * 10 / b));
      break;
    case 10:                                                    // DIV: (0.1, overflow)
      if (b === 0) return 'Err';
      result = Math.floor(a * 10 / b);
      break;
    case 11:                                                    // MOD
      if (b === 0) return 'Err';
      result = a % b;
      break;
    case 12: result = a & b; break;                            // BAND
    case 13: result = a | b; break;                            // B OR
    case 14: result = a ^ b; break;                            // BXOR
    case 15: result = clamp(a << b); break;                   // LSFT
    case 16: result = a >> b; break;                           // RSFT
    case 17: result = (a && b) ? 1 : 0; break;               // LAND
    case 18: result = (a || b) ? 1 : 0; break;               // L OR
    case 19: result = ((a ? 1 : 0) ^ (b ? 1 : 0)); break;   // LXOR
    case 20: result = (a < b) ? a : 0; break;                // IF <
    case 21: result = (a <= b) ? a : 0; break;               // IF <=
    case 22: result = (a > b) ? a : 0; break;                // IF >
    case 23: result = (a >= b) ? a : 0; break;               // IF >=
    case 24: result = (a === b) ? a : 0; break;              // IF =
    case 25: result = (a !== b) ? a : 0; break;              // IF <>
    case 39: result = Math.min(a, b); break;                  // MIN
    case 40: result = Math.max(a, b); break;                  // MAX
    case 41: result = Math.floor((a + b) / 2); break;        // AVRG
    case 48:                                                    // MODS (signed modulo)
      if (b === 0) return 'Err';
      result = ((a % b) + b) % b;
      break;
    default:
      // Stateful/dynamic operations (Flipflop, T&H, S&H, Count, Random, etc.)
      return 'NaN';
  }

  // Check overflow for operations that can overflow
  if (result < 0 || result > 4095) {
    return 'OVF';
  }

  return result.toString();
}

/**
 * Get source value for a row, statically determined where possible.
 */
function getRowSourceValue(row: RowLike): string {
  const srcType = row.source.type.key;
  const srcExtra = row.source.extra.keyOrValue;

  // Empty row
  if (srcType === EMPTY_KEY) return '—';

  // Variable source
  if (srcType === VAR_SOURCE_TYPE_KEY) {
    if (srcExtra === EMPTY_KEY) return '—';
    if (srcExtra >= 1 && srcExtra <= 4096) {
      // Fader mode: value is extra - 1
      return (srcExtra - 1).toString();
    }
    if (srcExtra === 0) {
      // Read mode: value depends on the referenced variable
      const varIdx = row.source.function.key;
      if (varIdx >= 0 && varIdx <= 15) {
        const usage = props.variableUsage[varIdx];
        if (usage?.lastWriteValue !== null && usage?.lastWriteValue !== undefined) {
          return usage.lastWriteValue.toString();
        }
        return '?';
      }
      return '?';
    }
  }

  // Calc source
  if (srcType === CALC_SOURCE_TYPE_KEY) {
    const funcKey = row.source.function.key;
    if (funcKey === EMPTY_KEY || srcExtra === EMPTY_KEY) return '—';

    const byte1 = (srcExtra >> 8) & 0xFF;
    const byte2 = srcExtra & 0xFF;
    const a = resolveCalcOperand(byte1);
    const b = resolveCalcOperand(byte2);
    return evaluateCalc(funcKey, a, b);
  }

  // All other source types are live/external inputs
  return '?';
}

// Format a numeric row value according to current display format
function formatRowValue(valueStr: string): string {
  // Handle special cases (?, —, OVF, Err, NaN)
  if (valueStr === '?' || valueStr === '—' || valueStr === 'OVF' || valueStr === 'Err' || valueStr === 'NaN') {
    return valueStr;
  }

  const value = parseInt(valueStr, 10);
  if (isNaN(value)) return valueStr;

  // Apply current format
  if (valueFormat.value === 'hex') {
    return value.toString(16).toUpperCase().padStart(3, '0');
  } else if (valueFormat.value === 'binary') {
    return value.toString(2).padStart(12, '0');
  } else if (valueFormat.value === 'boolean') {
    return value === 0 ? 'false:0' : 'true:1';
  }

  // Decimal (default)
  return valueStr;
}

/**
 * Tooltip for special display values (?, NaN, OVF, Err).
 * Returns undefined for normal numeric values (no tooltip needed).
 */
function getValueHint(value: string): string | undefined {
  switch (value) {
    case '?': return 'Value depends on live/runtime data and cannot be determined statically';
    case 'NaN': return 'One or more operands could not be resolved for this calculation';
    case 'OVF': return 'Arithmetic overflow: result is outside the 0–4095 range';
    case 'Err': return 'Division by zero';
    default: return undefined;
  }
}

// Get row display content based on mode
function getRowDisplayContent(row: RowLike, rowIndex: number): string {
  if (rowsDisplayMode.value === 'readers') {
    const readers = rowReadersMap.value.get(rowIndex) ?? [];
    return readers.length > 0 ? readers.map(formatRowIndex).join(', ') : '—';
  } else {
    if (valueSourceMode.value === 'current') {
      return formatRowValue(getRowSourceValue(row));
    }
    return '—';
  }
}

// Calculate the maximum height needed to show all variables without scrolling
function getMaxVariablesHeight(): number {
  const variablesContainer = document.querySelector('.variables-container') as HTMLElement;
  if (!variablesContainer) return 600;

  // Get the actual scrollHeight (total content height)
  const scrollHeight = variablesContainer.scrollHeight;

  // Return the scroll height as max, cap at 600px absolute max
  return Math.min(scrollHeight, 600);
}

// Resize variables section
function startVariablesResize(event: MouseEvent): void {
  isResizingVariables.value = true;
  resizeStartY2.value = event.clientY;
  const variablesContainer = document.querySelector('.variables-container') as HTMLElement;
  resizeStartHeight2.value = variablesContainer?.offsetHeight || 200;

  document.addEventListener('mousemove', handleVariablesResize);
  document.addEventListener('mouseup', stopVariablesResize);
  event.preventDefault();
}

function handleVariablesResize(event: MouseEvent): void {
  if (!isResizingVariables.value) return;

  const deltaY = event.clientY - resizeStartY2.value;
  const newHeight = resizeStartHeight2.value + deltaY;

  // Allow resizing between 24px (approx one row) and the actual content height needed
  const maxHeight = getMaxVariablesHeight();
  variablesHeight.value = Math.max(24, Math.min(maxHeight, newHeight));
}

function stopVariablesResize(): void {
  if (isResizingVariables.value) {
    localStorage.setItem(VARIABLES_HEIGHT_KEY, String(variablesHeight.value));
  }
  isResizingVariables.value = false;
  document.removeEventListener('mousemove', handleVariablesResize);
  document.removeEventListener('mouseup', stopVariablesResize);
}

// Resize rows section
function startResize(event: MouseEvent): void {
  isResizing.value = true;
  resizeStartY.value = event.clientY;
  resizeStartHeight.value = rowsHeight.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
}

function getMaxRowsHeight(): number {
  const rowsContainer = document.querySelector('.rows-container') as HTMLElement;
  if (!rowsContainer) return 800;

  // Get the actual scrollHeight (total content height)
  const scrollHeight = rowsContainer.scrollHeight;

  // Return the scroll height as max, cap at 800px absolute max
  return Math.min(scrollHeight, 800);
}

function handleResize(event: MouseEvent): void {
  if (!isResizing.value) return;

  const deltaY = event.clientY - resizeStartY.value;
  const newHeight = resizeStartHeight.value + deltaY;

  // Allow resizing between 24px (one row) and the actual content height needed
  const maxHeight = getMaxRowsHeight();
  rowsHeight.value = Math.max(24, Math.min(maxHeight, newHeight));
}

function stopResize(): void {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}
</script>

<template>
  <BasePanel
    title="Variables"
    storage-key="variable-monitor-expanded"
    :right-position="variablesRight"
    minimized-width="110px"
    :expanded-width="expandedWidth"
    @expanded-change="onExpandedChange"
  >
    <div class="variable-monitor-content">
      <!-- Toggle Controls Header (Fixed) -->
      <div class="variable-controls">
      <!-- Value source mode toggle -->
      <div class="control-group">
        <span class="control-label">Mode:</span>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            :class="{ active: valueSourceMode === 'current' }"
            @click="valueSourceMode = 'current'"
            title="Show values from static analysis"
          >
            Static Analyzer
          </button>
          <button
            class="toggle-btn mode-disabled"
            disabled
            title="Requires Virtual Execution Engine (Phase 2)"
          >
            Debugging
          </button>
        </div>
      </div>

      <!-- Format buttons row -->
      <div class="control-group">
        <span class="control-label">Format:</span>
        <div class="toggle-group">
          <button
            class="format-toggle-btn"
            :class="{ active: valueFormat === 'decimal', disabled: displayMode !== 'values' }"
            :disabled="displayMode !== 'values'"
            @click="valueFormat = 'decimal'"
            title="Decimal (0-4095)"
          >
            DEC
          </button>
          <button
            class="format-toggle-btn"
            :class="{ active: valueFormat === 'hex', disabled: displayMode !== 'values' }"
            :disabled="displayMode !== 'values'"
            @click="valueFormat = 'hex'"
            title="Hexadecimal (000-FFF)"
          >
            HEX
          </button>
          <button
            class="format-toggle-btn"
            :class="{ active: valueFormat === 'binary', disabled: displayMode !== 'values' }"
            :disabled="displayMode !== 'values'"
            @click="valueFormat = 'binary'"
            title="Binary (12-bit)"
          >
            BIN
          </button>
          <button
            class="format-toggle-btn"
            :class="{ active: valueFormat === 'boolean', disabled: displayMode !== 'values' }"
            :disabled="displayMode !== 'values'"
            @click="valueFormat = 'boolean'"
            title="Boolean (0 or 1)"
          >
            BOOL
          </button>
        </div>
      </div>

      <!-- Display mode buttons row -->
      <div class="control-group">
        <span class="control-label">Show:</span>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            :class="{ active: displayMode === 'values' }"
            @click="displayMode = 'values'"
            title="Show variable values"
          >
            Values
          </button>
          <button
            class="toggle-btn"
            :class="{ active: displayMode === 'writers' }"
            @click="displayMode = 'writers'"
            title="Show rows that write to variables"
          >
            Writers
          </button>
          <button
            class="toggle-btn"
            :class="{ active: displayMode === 'readers' }"
            @click="displayMode = 'readers'"
            title="Show rows that read from variables"
          >
            Readers
          </button>
        </div>
      </div>
    </div>

    <!-- Variables Grid Container (Scrollable) -->
    <div class="variables-container panel-scrollable" :style="variablesHeight ? { height: variablesHeight + 'px' } : {}">
      <div class="variables-grid" :class="{ 'single-column': useSingleColumn }">
        <div class="variables-column">
        <div
          v-for="(variable, idx) in leftColumn"
          :key="leftLabels[idx]"
          class="variable-item"
          :class="{
            'variable-unused': !variableUsage[useSingleColumn ? idx : idx]?.isUsed,
            'variable-read': variableUsage[useSingleColumn ? idx : idx]?.isRead,
            'variable-written': variableUsage[useSingleColumn ? idx : idx]?.isWritten
          }"
        >
          <span class="variable-label">{{ leftLabels[idx] }}:</span>
          <span class="variable-value" :title="getValueHint(getDisplayContent(idx))">
            <template v-if="(displayMode === 'writers' || displayMode === 'readers') && getVarRowIndices(idx).length > 0">
              <RowRefBadge
                v-for="rowIdx in getVarRowIndices(idx)"
                :key="rowIdx"
                :row-index="rowIdx"
                :display-as-hex="displayRowIndexAsHex"
                @click="handleRowNavigate($event)"
              />
            </template>
            <template v-else>{{ getDisplayContent(idx) }}</template>
          </span>
        </div>
      </div>

      <div v-if="!useSingleColumn" class="variables-column">
        <div
          v-for="(variable, idx) in rightColumn"
          :key="rightLabels[idx]"
          class="variable-item"
          :class="{
            'variable-unused': !variableUsage[8 + idx]?.isUsed,
            'variable-read': variableUsage[8 + idx]?.isRead,
            'variable-written': variableUsage[8 + idx]?.isWritten
          }"
        >
          <span class="variable-label">{{ rightLabels[idx] }}:</span>
          <span class="variable-value" :title="getValueHint(getDisplayContent(8 + idx))">
            <template v-if="(displayMode === 'writers' || displayMode === 'readers') && getVarRowIndices(8 + idx).length > 0">
              <RowRefBadge
                v-for="rowIdx in getVarRowIndices(8 + idx)"
                :key="rowIdx"
                :row-index="rowIdx"
                :display-as-hex="displayRowIndexAsHex"
                @click="handleRowNavigate($event)"
              />
            </template>
            <template v-else>{{ getDisplayContent(8 + idx) }}</template>
          </span>
        </div>
      </div>
    </div>
    </div>

    <!-- Resize Handle - Between Variables and Rows Subsection -->
    <div
      v-if="rows && rows.length > 0"
      class="resize-handle variables-resize-handle"
      @mousedown="startVariablesResize"
      title="Drag to resize variables section"
    >
      <div class="resize-indicator"></div>
    </div>

    <!-- Rows Subsection (Collapsible) -->
    <div v-if="rows && rows.length > 0" class="rows-subsection">
      <!-- Collapsible Divider -->
      <div class="rows-divider subsection-divider" @click="toggleRowsSubsection">
        <div style="display: flex; align-items: center;">
          <span class="subsection-toggle-icon" :class="{ expanded: rowsSubsectionExpanded }">▸</span>
          <span class="divider-title">Rows</span>
        </div>
        <div class="rows-controls">
          <button
            class="rows-toggle-btn"
            :class="{ active: rowsDisplayMode === 'values' }"
            @click.stop="rowsDisplayMode = 'values'"
            title="Show row destination values"
          >
            Values
          </button>
          <button
            class="rows-toggle-btn"
            :class="{ active: rowsDisplayMode === 'readers' }"
            @click.stop="rowsDisplayMode = 'readers'"
            title="Show rows that reference each row"
          >
            Readers
          </button>
        </div>
      </div>

      <!-- Rows List (Scrollable) -->
      <div v-if="rowsSubsectionExpanded" class="rows-container panel-scrollable" :style="{ height: rowsHeight + 'px' }">
        <div
          v-for="(row, idx) in rows"
          :key="idx"
          class="row-item"
        >
          <span class="row-index row-index-clickable" @click.stop="handleRowNavigate(idx)" title="Click to scroll to row">{{ formatRowIndex(idx) }}:</span>
          <span class="row-destination">{{ formatRowDestination(row) }}</span>
          <span class="row-value" :class="{
            'value-unknown': getRowDisplayContent(row, idx) === '?' || getRowDisplayContent(row, idx) === 'NaN',
            'value-error': getRowDisplayContent(row, idx) === 'Err',
            'value-overflow': getRowDisplayContent(row, idx) === 'OVF'
          }" :title="getValueHint(getRowDisplayContent(row, idx))">
            <template v-if="rowsDisplayMode === 'readers' && getRowReaderIndices(idx).length > 0">
              <RowRefBadge
                v-for="rowIdx in getRowReaderIndices(idx)"
                :key="rowIdx"
                :row-index="rowIdx"
                :display-as-hex="displayRowIndexAsHex"
                @click="handleRowNavigate($event)"
              />
            </template>
            <template v-else>{{ getRowDisplayContent(row, idx) }}</template>
          </span>
        </div>
      </div>
    </div>

    <!-- Resize Handle - Only show when rows section is expanded -->
    <div
      v-if="rows && rows.length > 0 && rowsSubsectionExpanded"
      class="resize-handle"
      @mousedown="startResize"
      title="Drag to resize rows section"
    >
      <div class="resize-indicator"></div>
    </div>
    </div>
  </BasePanel>
</template>

<style scoped>
/* Main content wrapper */
.variable-monitor-content {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: visible;
  padding: 4px 4px 0 4px;
}

/* Controls Header - Fixed at top */
.variable-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px 4px 7px 4px;
  border-bottom: 1px solid #34cc99;
  margin-bottom: 5px;
  flex-shrink: 0;
  background: rgba(52, 204, 153, 0.1);
}

.control-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  min-width: 48px;
}

.format-toggle-btn {
  padding: 4px 8px;
  font-size: 0.8rem;
  background: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.3);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.format-toggle-btn:hover:not(:disabled) {
  background: rgba(52, 204, 153, 0.2);
  border-color: rgba(52, 204, 153, 0.5);
}

.format-toggle-btn.active {
  background: rgba(52, 204, 153, 0.4);
  border-color: #34cc99;
  color: #34cc99;
  font-weight: bold;
}

.format-toggle-btn.disabled,
.format-toggle-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toggle-btn {
  padding: 4px 10px;
  font-size: 0.8rem;
  background: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.3);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(52, 204, 153, 0.2);
  border-color: rgba(52, 204, 153, 0.5);
}

.toggle-btn.active {
  background: rgba(52, 204, 153, 0.4);
  border-color: #34cc99;
  color: #34cc99;
}

.toggle-btn.mode-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Variables Container - Scrollable */
.variables-container {
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 24px;
  padding-right: 2px;
  flex-shrink: 0;
}


/* Variables Grid */
.variables-grid {
  display: flex;
  gap: 6px;
  padding: 0 2px;
}

.variables-grid.single-column {
  flex-direction: column;
}

.variables-grid.single-column .variables-column {
  width: 100%;
}

.variables-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  gap: 4px;
  background-color: rgba(52, 204, 153, 0.1);
  border-left: 2px solid #34cc99;
  color: #34cc99;
  transition: opacity 0.2s, background-color 0.2s;
}

/* Unused variables - greyed out */
.variable-item.variable-unused {
  opacity: 0.6;
  background-color: rgba(108, 117, 125, 0.15);
  border-left-color: rgba(108, 117, 125, 0.6);
}

.variable-item.variable-unused .variable-label,
.variable-item.variable-unused .variable-value {
  color: rgba(108, 117, 125, 0.9);
}

/* Read indicator - subtle highlight */
.variable-item.variable-read {
  border-left-color: #34cc99;
}

/* Written indicator - stronger highlight */
.variable-item.variable-written {
  background-color: rgba(52, 204, 153, 0.15);
}

.variable-label {
  font-weight: bold;
  min-width: 18px;
  font-size: 0.85rem;
}

.variable-value {
  color: #F1F700;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem; /* Increased from 0.85rem */
  font-weight: 500;
}

.variable-item.variable-unused .variable-value {
  color: rgba(241, 247, 0, 0.3);
}

/* Override BasePanel's overflow to let us handle it internally */
:deep(.panel-body) {
  overflow: visible !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: auto !important;
  max-height: none !important;
}

/* Resize Handle */
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
  z-index: 100;
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

/* Variables resize handle - between variables and rows */
.variables-resize-handle {
  margin: 0;
}

/* Rows Subsection */
.rows-subsection {
  display: flex;
  flex-direction: column;
  margin-top: 0;
  flex-shrink: 0;
}

/* Collapsible Divider - minimal style like SettingsPanel */
.rows-divider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 4px 4px 4px;
  border-top: 1px solid rgba(52, 204, 153, 0.3);
  cursor: pointer;
  user-select: none;
  margin: 0;
}

.rows-divider:hover .divider-title {
  color: #F1F700;
}

.subsection-toggle-icon {
  margin-right: 4px;
}

.divider-title {
  font-size: 10px;
  font-weight: 500;
  color: #34cc99;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.2s;
}

.rows-controls {
  display: flex;
  gap: 2px;
}

.rows-toggle-btn {
  padding: 2px 6px;
  font-size: 10px;
  background: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.3);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.rows-toggle-btn:hover {
  background: rgba(52, 204, 153, 0.2);
  border-color: rgba(52, 204, 153, 0.5);
}

.rows-toggle-btn.active {
  background: rgba(52, 204, 153, 0.4);
  border-color: #34cc99;
  color: #34cc99;
  font-weight: bold;
}

/* Rows Container - Scrollable */
.rows-container {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 2px 0 2px;
  flex-shrink: 0;
  min-height: 24px;
}


/* Row Item */
.row-item {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 4px;
  align-items: center;
  padding: 2px 4px;
  background-color: rgba(52, 204, 153, 0.1);
  border-left: 2px solid #34cc99;
  transition: background-color 0.2s;
  margin-bottom: 1px;
}

.row-item:hover {
  background-color: rgba(52, 204, 153, 0.15);
}

.row-index {
  font-weight: bold;
  color: #34cc99;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  min-width: 18px;
}

.row-destination {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-value {
  color: #F1F700;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: right;
  min-width: 40px;
}

.row-value.value-unknown {
  color: rgba(241, 247, 0, 0.5);
  font-style: italic;
}

.row-value.value-error {
  color: #dc3545;
  font-weight: bold;
}

.row-value.value-overflow {
  color: #ffc107;
  font-weight: bold;
}


/* Row index in rows subsection — clickable with hover effect */
.row-index-clickable {
  cursor: pointer;
}

.row-index-clickable:hover {
  color: #F1F700;
}
</style>
