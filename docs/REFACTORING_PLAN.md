# NerdSEQ Mapping Editor - Refactoring Plan

## Overview

This document tracks recent implementations, architectural observations, and opportunities for code improvement. It serves as a living document for maintaining code quality and planning incremental refactoring.

---

## Recent Bug Fixes and Improvements (2026-02-04)

### ✅ Recent Feature Implementations (2026-02-04)

| Feature | Status | Details |
|---------|--------|---------|
| Paste Auto-Advance System | ✅ IMPLEMENTED | Three modes (DISABLED/ROWS/ALL), localStorage persistence, smart comment handling |
| MIDI Learn Auto-Advance | ✅ IMPLEMENTED | Auto-advance to next MIDI Learn row, duplicate prevention |
| Enhanced Row Selection | ✅ IMPLEMENTED | Three-click cycle, sticky comment state, improved multi-selection |
| Settings Panel Auto-Advance Section | ✅ IMPLEMENTED | New collapsible section with MIDI Learn and Paste toggles |
| Toolbar Copy Button Fix | ✅ FIXED | Now correctly distinguishes single/multi-row copy operations |

### ✅ Critical Data Integrity Fixes

| Bug | Priority | Status | Impact |
|-----|----------|--------|--------|
| Row comments not moving with rows | CRITICAL | ✅ FIXED | Comments now swap with rows in `useClipboard.ts` |
| Lock bypass via Delete/Backspace keys | CRITICAL | ✅ FIXED | Keyboard shortcuts now check lock state |
| Reset button clears locked mappings | HIGH | ✅ FIXED | Reset button disabled when locked + early return check |
| Skip Destination encoding mismatch | HIGH | ✅ FIXED | Unified to 96 functions matching Skip Source |
| Toolbar Copy button inconsistency | HIGH | ✅ FIXED | Now calls correct function based on selection size |

### ✅ UX Consistency Improvements

| Feature | Status | Details |
|---------|--------|---------|
| Analyzer warnings adapt to Hex/Dec | ✅ FIXED | `useStaticAnalyzer` now formats row indices based on display preference |
| Skip Destination respects Hex/Dec | ✅ FIXED | Row index fields in SkipDestinationExtra.vue now use setting |

### ✅ Lock State Protection - Complete Coverage

All modification operations now check lock state:
- **UI Buttons**: Row X, Selection Toolbar Clear, Reset, RowCommentSection clear buttons
- **Keyboard Shortcuts**: Delete, Backspace
- **Functions**: `reset()`, `clearRow()`, `clearRows()`

### 📝 Known Issues - Documented

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| Extra field reset on function change | MEDIUM | DEFERRED | Documented in FEATURE_PLAN.md with investigation areas |

**See:** `docs/FEATURE_PLAN.md` and Serena memory `bug-fixes-2026-01` for detailed documentation.

---

## Recently Implemented Components

| Component | Purpose | Recent Updates (2026-02-04) |
|-----------|---------|------------------------------|
| `MenuButton.vue` | Unified button styling with variants | Consider adding icon slot support for icon+text buttons |
| `ToastNotifications.vue` | Transient notifications system | Currently underutilized - integrate for more events (save, export, etc.) |
| `BasePanel.vue` | Foldable side panels (Variables, Settings, MidiMonitor) | Add drag-to-dock functionality (Phase 0.1 advanced) |
| `SelectionToolbar.vue` | Multi-row operations toolbar | Consider moving to BasePanel-based implementation |
| `SettingsPanel.vue` | Settings & Info display | ✅ Added Auto-Advance section with MIDI Learn and Paste toggles |
| `RowCommentSection.vue` | Row details and warnings display | Well-structured, minimal changes needed |
| `RowActionButtons.vue` | Copy/paste/clear per-row actions | Could migrate to IconButton pattern |
| `SkipDestinationExtra.vue` | Skip destination parameters | ✅ Refactored to two-dropdown pattern (matches source encoding) |
| `MidiLearnExtra.vue` | MIDI learn mode UI | ✅ Added auto-start support, duplicate message prevention |

---

## Recently Implemented Composables

| Composable | Purpose | Recent Updates |
|------------|---------|----------------|
| `useMappingCache.ts` | A/B slot caching with IndexedDB | Add export/import of cached slots |
| `useStaticAnalyzer.ts` | Logic validation & warning generation | ✅ 2026-01-31: Now accepts `displayRowIndexAsHex` ref, formats all warning messages accordingly |
| `useWarningLog.ts` | Centralized warning logging | Add log export, filtering by severity |
| `useClipboard.ts` | Row/source/dest copy-paste operations | ✅ 2026-01-31: Now swaps row comments when rows are moved, accepts optional `rowComments` ref |
| `useMidi.ts` | Web MIDI API integration | Stable, works well |
| `useMultiSelect.ts` | Multi-row selection state | Consider renaming to `useSelection.ts` |

---

## Architecture Observations

### 1. EditorApp.vue is Large (~2,400 lines total, ~1,600 script lines after 2026-02-04 updates)

**Recent Growth (2026-02-04):** Added ~280 lines for paste/MIDI learn auto-advance systems and enhanced row selection.

The main component handles multiple concerns:
- File I/O (import/export)
- Serialization/deserialization
- Row selection state (recently enhanced with 3-click cycle and sticky comment state)
- Panel positioning coordination
- Document state management
- Skip analysis logic
- Keyboard shortcuts
- Row metadata (colors, comments)
- **NEW:** Auto-advance systems (paste and MIDI learn)
- **NEW:** Comment section expansion tracking

**Solution: Phase 3.6 Modularization - MORE IMPORTANT THAN EVER**

See `docs/EditorApp_modules.md` for the complete extraction plan:
- 6 composables to extract (~730 lines + recent 280 lines = ~1,010 lines)
- Target: Reduce from ~1,600 to ~500 script lines
- Incremental PR strategy with automated tests
- Full implementation details and API designs

**NOTE:** The recent auto-advance and selection enhancements make modularization more valuable. These features could be extracted into:
- `useAutoAdvance.ts` - Paste and MIDI learn auto-advance logic
- `useRowSelection.ts` - Enhanced selection with sticky comment state

### 2. Panel Positioning is Complex

Multiple panels (SettingsPanel, MidiMonitor, VariablesPanel) track each other's expanded state for vertical positioning. This creates implicit coupling.

**Current Pattern:**
```vue
:style="{ top: calculatedTop + 'px' }"
```

**Possible Improvement:**
- Create a `usePanelLayout.ts` composable to centralize panel positioning logic
- Or move to CSS-based stacking (flexbox/grid) if possible

### 3. Toast Notifications Underutilized

`ToastNotifications.vue` was created but is only used for row move warnings. Could be used for:
- File save/export success
- MIDI device connection status
- Analyzer completion
- Cache slot switches

### 4. Remaining Bootstrap Button Classes

Some buttons still use raw Bootstrap `.btn` classes instead of `MenuButton.vue`:

| File | Button | Line | Current Class |
|------|--------|------|---------------|
| `MidiMonitor.vue` | Clear button | ~125 | `btn btn-sm clear-btn` |
| `EditorApp.vue` | Row clear (X) | ~1427 | `btn btn-sm clear-btn-fixed` |
| `MidiLearnExtra.vue` | Learn button | ~214 | `btn btn-sm learn-btn` |
| `MidiLearnExtra.vue` | Cancel button | ~224 | `btn btn-sm btn-danger` |
| `RowActionButtons.vue` | Copy button | ~31 | `btn btn-sm copy-btn` |
| `RowActionButtons.vue` | Paste button | ~43 | `btn btn-sm paste-btn` |
| `SettingsPanel.vue` | HEX/DEC toggle | ~62 | `btn btn-sm toggle-btn` |

**Recommendation:** These could be migrated to:
- `MenuButton.vue` with appropriate variants, OR
- A new `IconButton.vue` component for small action buttons (icon-only or icon+label)

---

## Code Style Patterns

### Established Patterns to Follow

1. **Composables** - Extract reusable logic into `use*.ts` files
2. **TypeScript strict mode** - All code must pass type-check
3. **Reactive state** - Use Vue 3 Composition API with `ref`/`reactive`
4. **EMPTY_KEY constant** - Use `0xFFFF` for empty values
5. **Component props** - Use TypeScript interfaces for prop definitions

### Naming Conventions

- Components: PascalCase (`EditorApp.vue`)
- Composables: camelCase with `use` prefix (`useMidi.ts`)
- CSS classes: kebab-case (`.row-selected`, `.menu-btn`)
- Constants: UPPER_SNAKE_CASE (`EMPTY_KEY`)

---

## Refactoring Priorities

See the **Detailed Implementation Plan** section below for the comprehensive phased approach.

### Quick Reference

- **Short-term (Low Effort):** Phase 1 - Toasts, Buttons, TypeDoc comments
- **Medium-term (Medium Effort):** Phases 2-3 - Row Value Display, Global Documentation
- **Long-term (High Effort):** Phases 4-7 - useFileIO, usePanelLayout, SelectionToolbar, Style Consolidation

---

## Completion Status

### ✅ Completed Phases

- **Phase 1:** Short-term wins (ToastNotifications, Buttons, TypeDoc) - COMPLETE
- **Phase 3:** Global Documentation Panel - COMPLETE

### ⏳ Current Phase

**Phase 3.6:** EditorApp Modularization - Extract composables from EditorApp.vue
- Extract 730 lines into 6 new composables
- Improve testability and maintainability
- Foundation for debugger features (Phase 0.1, 0.11, 0.13)
- See `docs/EditorApp_modules.md` for detailed implementation plan

### 🔜 Remaining Phases

- **Phase 6:** SelectionToolbar Enhancement
- **Phase 7:** Style Consolidation & Unification
- **Future:** Undo/Redo UI (builds on Phase 3.5 action log)
- **Future:** Debugger & Simulation features (Phase 0.1, 0.11, 0.13 from FEATURE_PLAN.md)

---

## Detailed Implementation Plan

### Overview

This plan combines strategic refactoring with forward-looking infrastructure. The new **Phase 3.5 (Action Logging System)** prepares the foundation for undo/redo functionality without implementing the full feature yet.

### Strategic Sequencing

**Updated Sequence:**

1. ~~**Phase 1:** Short-term wins~~ ✅ COMPLETE
2. ~~**Phase 3:** Global Documentation~~ ✅ COMPLETE
3. ~~**Phase 3.5:** Action Logging System~~ ✅ PARTIALLY COMPLETE (useActionHistory exists)
4. **Phase 3.6:** EditorApp Modularization (CURRENT) - Extract 6 composables, foundation for debugger
5. **Phase 6:** SelectionToolbar Enhancement
6. **Future:** Undo/Redo UI (builds on Phase 3.5)
7. **Future:** Debugger & Simulation Engine (builds on Phase 3.6 clean architecture)

---

## Phase 3.5: Action Logging System - ✅ PARTIALLY COMPLETE

### Status

**IMPLEMENTED:** `useActionHistory.ts` composable exists with full command pattern support, per-slot undo/redo, and IndexedDB persistence.

**RECENT (2026-02-17):** Added `pushCommand()` API and debounced extra update handlers:
- `pushCommand(cmd)` — pushes a pre-executed command to undo stack without calling `execute()`. Used for debounced/coalesced operations where the mutation was applied incrementally.
- `handleSourceExtraUpdate()` and `handleDestExtraUpdate()` in `EditorApp.vue` now debounce rapid fader changes (400ms idle) into single undo entries, preventing history flooding during slider drags.
- `VariableSourceExtra.vue` now watches model prop changes to sync fader position on undo/redo.

**NEXT STEPS:** The foundation is in place. Focus shifts to:
1. Audit existing implementation for coverage gaps
2. Extend debounce pattern to other high-frequency inputs if needed
3. Add UI components (undo/redo buttons, history panel)

### Goal

Create a comprehensive action logging system that records all document mutations. This system will serve as the foundation for future undo/redo functionality while remaining non-invasive to existing code.

### Architecture Overview

```typescript
// Command Pattern - Each action is reversible
interface Action {
  type: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  metadata?: Record<string, unknown>;
}

// Action Log - Central history
interface ActionLog {
  actions: Action[];
  currentIndex: number;
  maxSize: number;
}
```

### Implementation Steps

#### Step 1: Create Core Action Log Composable

**File:** `editor/src/composables/useActionLog.ts` (NEW)

**Purpose:** Central action logging system with command pattern support.

**API Design:**
```typescript
export interface ActionDefinition {
  type: string;
  description: string;
  execute: () => void;
  undo: () => void;
  metadata?: Record<string, unknown>;
}

export interface ActionLogEntry {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  // Internal: execute/undo functions stored for future undo/redo
  _execute?: () => void;
  _undo?: () => void;
}

export interface UseActionLogReturn {
  // State
  readonly actions: Readonly<Ref<ActionLogEntry[]>>;
  readonly currentIndex: Ref<number>;
  readonly canUndo: ComputedRef<boolean>;
  readonly canRedo: ComputedRef<boolean>;
  
  // Logging
  logAction: (action: ActionDefinition) => void;
  logSimple: (type: string, description: string, metadata?: Record<string, unknown>) => void;
  
  // Future undo/redo (stubbed for now)
  undo: () => void;
  redo: () => void;
  
  // Management
  clearLog: () => void;
  getRecentActions: (count?: number) => ActionLogEntry[];
  exportLog: () => string;
}

export function useActionLog(options?: {
  maxSize?: number;
  enablePersistence?: boolean;
}): UseActionLogReturn {
  const maxSize = options?.maxSize ?? 100;
  const enablePersistence = options?.enablePersistence ?? false;
  
  const actions = ref<ActionLogEntry[]>([]);
  const currentIndex = ref(-1);
  
  const canUndo = computed(() => currentIndex.value >= 0);
  const canRedo = computed(() => currentIndex.value < actions.value.length - 1);
  
  /**
   * Log an action with full command pattern support
   */
  function logAction(action: ActionDefinition): void {
    const entry: ActionLogEntry = {
      id: crypto.randomUUID(),
      type: action.type,
      description: action.description,
      timestamp: Date.now(),
      metadata: action.metadata,
      _execute: action.execute,
      _undo: action.undo,
    };
    
    // Clear any redo history when new action is logged
    if (currentIndex.value < actions.value.length - 1) {
      actions.value = actions.value.slice(0, currentIndex.value + 1);
    }
    
    actions.value.push(entry);
    currentIndex.value = actions.value.length - 1;
    
    // Enforce max size
    if (actions.value.length > maxSize) {
      actions.value = actions.value.slice(-maxSize);
      currentIndex.value = actions.value.length - 1;
    }
    
    if (enablePersistence) {
      persistLog();
    }
  }
  
  /**
   * Log a simple action without undo support (for analytics/debugging)
   */
  function logSimple(type: string, description: string, metadata?: Record<string, unknown>): void {
    const entry: ActionLogEntry = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: Date.now(),
      metadata,
    };
    
    actions.value.push(entry);
    
    if (actions.value.length > maxSize) {
      actions.value = actions.value.slice(-maxSize);
    }
    
    if (enablePersistence) {
      persistLog();
    }
  }
  
  /**
   * Undo the last action (stub for now)
   */
  function undo(): void {
    if (!canUndo.value) return;
    
    const action = actions.value[currentIndex.value];
    if (action._undo) {
      action._undo();
      currentIndex.value--;
    } else {
      console.warn('Cannot undo action without undo function:', action.type);
    }
  }
  
  /**
   * Redo the next action (stub for now)
   */
  function redo(): void {
    if (!canRedo.value) return;
    
    const action = actions.value[currentIndex.value + 1];
    if (action._execute) {
      action._execute();
      currentIndex.value++;
    } else {
      console.warn('Cannot redo action without execute function:', action.type);
    }
  }
  
  function clearLog(): void {
    actions.value = [];
    currentIndex.value = -1;
    if (enablePersistence) {
      localStorage.removeItem('actionLog');
    }
  }
  
  function getRecentActions(count: number = 10): ActionLogEntry[] {
    return actions.value.slice(-count);
  }
  
  function exportLog(): string {
    const exportData = actions.value.map(({ id, type, description, timestamp, metadata }) => ({
      id,
      type,
      description,
      timestamp: new Date(timestamp).toISOString(),
      metadata,
    }));
    return JSON.stringify(exportData, null, 2);
  }
  
  function persistLog(): void {
    const persistData = actions.value.map(({ id, type, description, timestamp, metadata }) => ({
      id,
      type,
      description,
      timestamp,
      metadata,
    }));
    localStorage.setItem('actionLog', JSON.stringify(persistData));
  }
  
  // Restore from localStorage on init
  if (enablePersistence) {
    const stored = localStorage.getItem('actionLog');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        actions.value = parsed;
        currentIndex.value = parsed.length - 1;
      } catch (e) {
        console.warn('Failed to restore action log:', e);
      }
    }
  }
  
  return {
    actions: readonly(actions),
    currentIndex,
    canUndo,
    canRedo,
    logAction,
    logSimple,
    undo,
    redo,
    clearLog,
    getRecentActions,
    exportLog,
  };
}
```

**Effort:** 3-4 hours

---

#### Step 2: Define Action Types

**File:** `editor/src/types/actions.ts` (NEW)

**Purpose:** Type definitions for all loggable actions.

```typescript
/**
 * Action types for the NerdSEQ Mapping Editor
 */
export enum ActionType {
  // Row operations
  ROW_EDIT = 'row.edit',
  ROW_COPY = 'row.copy',
  ROW_PASTE = 'row.paste',
  ROW_CLEAR = 'row.clear',
  ROW_MOVE_UP = 'row.moveUp',
  ROW_MOVE_DOWN = 'row.moveDown',
  ROW_COLOR_SET = 'row.color.set',
  ROW_COMMENT_SET = 'row.comment.set',
  
  // Source operations
  SOURCE_TYPE_SET = 'source.type.set',
  SOURCE_FUNCTION_SET = 'source.function.set',
  SOURCE_EXTRA_SET = 'source.extra.set',
  
  // Destination operations
  DEST_TYPE_SET = 'dest.type.set',
  DEST_FUNCTION_SET = 'dest.function.set',
  DEST_EXTRA_SET = 'dest.extra.set',
  
  // Variable operations
  VARIABLE_VALUE_SET = 'variable.value.set',
  VARIABLE_NAME_SET = 'variable.name.set',
  
  // Document operations
  DOC_IMPORT = 'document.import',
  DOC_EXPORT = 'document.export',
  DOC_RESET = 'document.reset',
  DOC_GLOBAL_COMMENT_SET = 'document.globalComment.set',
  
  // Multi-row operations
  MULTI_ROW_COPY = 'multi.row.copy',
  MULTI_ROW_PASTE = 'multi.row.paste',
  MULTI_ROW_CLEAR = 'multi.row.clear',
  MULTI_ROW_COLOR = 'multi.row.color',
  
  // Cache operations
  CACHE_SLOT_SWITCH = 'cache.slot.switch',
  CACHE_SLOT_LOCK = 'cache.slot.lock',
  
  // MIDI operations
  MIDI_LEARN_START = 'midi.learn.start',
  MIDI_LEARN_COMPLETE = 'midi.learn.complete',
  MIDI_LEARN_CANCEL = 'midi.learn.cancel',
}

/**
 * Metadata structures for specific action types
 */
export interface RowEditMetadata {
  rowIndex: number;
  field: 'sourceType' | 'sourceFunction' | 'sourceExtra' | 'destType' | 'destFunction' | 'destExtra';
  oldValue: number;
  newValue: number;
}

export interface RowColorMetadata {
  rowIndex: number;
  oldColor?: string;
  newColor: string;
}

export interface MultiRowMetadata {
  rowIndices: number[];
  operation: string;
}

export interface DocumentImportMetadata {
  fileName: string;
  format: 'map' | 'json';
  rowCount: number;
}
```

**Effort:** 1-2 hours

---

#### Step 3: Integrate Action Logging into EditorApp

**File:** `editor/src/components/EditorApp.vue`

**What to add:**

```typescript
import { useActionLog } from '@/composables/useActionLog';
import { ActionType } from '@/types/actions';

// In setup()
const {
  logAction,
  logSimple,
  actions: actionLog,
  canUndo,
  canRedo,
  exportLog,
} = useActionLog({
  maxSize: 100,
  enablePersistence: false, // Start with false, enable later
});
```

**Integration points:**

1. **Row editing** - Log when source/dest type/function/extra changes:
```typescript
function updateRowSource(rowIndex: number, field: string, value: number) {
  const row = mappingDocument.value.rows[rowIndex];
  const oldValue = row.source[field];
  
  logAction({
    type: ActionType.SOURCE_TYPE_SET,
    description: `Changed row ${rowIndex} source ${field}`,
    execute: () => {
      row.source[field] = value;
    },
    undo: () => {
      row.source[field] = oldValue;
    },
    metadata: { rowIndex, field, oldValue, newValue: value },
  });
}
```

2. **Row operations** - Log copy/paste/clear/move:
```typescript
function clearRow(rowIndex: number) {
  const oldRow = { ...mappingDocument.value.rows[rowIndex] };
  
  logAction({
    type: ActionType.ROW_CLEAR,
    description: `Cleared row ${rowIndex}`,
    execute: () => {
      mappingDocument.value.rows[rowIndex].clear();
    },
    undo: () => {
      Object.assign(mappingDocument.value.rows[rowIndex], oldRow);
    },
    metadata: { rowIndex },
  });
}
```

3. **File imports** - Log simple (no undo):
```typescript
async function readFile(file: File) {
  // ... existing logic ...
  
  logSimple(
    ActionType.DOC_IMPORT,
    `Imported ${file.name}`,
    { fileName: file.name, format: 'map', rowCount: 70 }
  );
}
```

4. **Color/comment changes** - Log with undo:
```typescript
function setRowColor(rowIndex: number, color: string) {
  const oldColor = rowColors.value[rowIndex];
  
  logAction({
    type: ActionType.ROW_COLOR_SET,
    description: `Set row ${rowIndex} color to ${color}`,
    execute: () => {
      rowColors.value[rowIndex] = color;
    },
    undo: () => {
      if (oldColor) {
        rowColors.value[rowIndex] = oldColor;
      } else {
        delete rowColors.value[rowIndex];
      }
    },
    metadata: { rowIndex, oldColor, newColor: color },
  });
}
```

**Effort:** 4-5 hours

---

#### Step 4: Create Action Log Viewer Component (Optional)

**File:** `editor/src/components/ActionLogPanel.vue` (NEW)

**Purpose:** Debug panel to view action history (for development only initially).

```vue
<template>
  <BasePanel
    title="Action Log"
    :expanded="expanded"
    @toggle="$emit('toggle')"
  >
    <div class="action-log">
      <div class="log-header">
        <button @click="exportToFile" class="btn btn-sm">Export Log</button>
        <button @click="clearLog" class="btn btn-sm btn-danger">Clear</button>
        <span class="log-count">{{ actions.length }} actions</span>
      </div>
      
      <div class="log-entries">
        <div
          v-for="(action, index) in recentActions"
          :key="action.id"
          class="log-entry"
          :class="{ active: index === currentIndex }"
        >
          <span class="timestamp">{{ formatTime(action.timestamp) }}</span>
          <span class="type">{{ action.type }}</span>
          <span class="description">{{ action.description }}</span>
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ActionLogEntry } from '@/composables/useActionLog';

const props = defineProps<{
  expanded: boolean;
  actions: readonly ActionLogEntry[];
  currentIndex: number;
}>();

const emit = defineEmits<{
  toggle: [];
  export: [];
  clear: [];
}>();

const recentActions = computed(() => {
  return props.actions.slice(-50).reverse();
});

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

function exportToFile() {
  emit('export');
}

function clearLog() {
  if (confirm('Clear action log?')) {
    emit('clear');
  }
}
</script>

<style scoped>
.action-log {
  padding: 0.5rem;
}

.log-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.log-count {
  margin-left: auto;
  font-size: 0.875rem;
  opacity: 0.7;
}

.log-entries {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

.log-entry {
  display: grid;
  grid-template-columns: 80px 150px 1fr;
  gap: 0.5rem;
  padding: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-entry.active {
  background: rgba(0, 123, 255, 0.2);
}

.timestamp {
  opacity: 0.6;
}

.type {
  color: #61dafb;
}

.description {
  opacity: 0.9;
}
</style>
```

**Effort:** 2-3 hours

---

### Integration Strategy

#### Phase A: Logging Without Undo (Week 1)

1. Implement `useActionLog.ts` with basic logging
2. Define `ActionType` enum and metadata types
3. Add `logSimple()` calls to key operations:
   - File import/export
   - Row clear/copy/paste
   - Color/comment changes
4. Add ActionLogPanel for debugging (dev only)

**Benefits:**
- Visibility into user actions
- Debugging aid
- Analytics foundation

#### Phase B: Add Command Pattern (Week 2)

1. Refactor `logSimple()` calls to `logAction()` with execute/undo
2. Start with simple operations (color, comment)
3. Add undo/redo for row clear
4. Gradually expand to all row operations

**Benefits:**
- Undo foundation in place
- Can test undo logic incrementally

#### Phase C: Undo/Redo UI (Future)

1. Add undo/redo buttons to toolbar
2. Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
3. Visual feedback for undo/redo state
4. Enable persistence

---

### Benefits of This Approach

1. **Non-invasive:** Logging is additive, doesn't break existing code
2. **Incremental:** Can add logging to one operation at a time
3. **Testable:** Command pattern makes undo logic testable
4. **Future-proof:** Foundation for full undo/redo feature
5. **Debugging:** Action log helps diagnose user issues
6. **Analytics:** Track which features are used most

---

### Testing Strategy

1. **Manual Testing:**
   - Perform action → check log entry appears
   - Verify metadata is correct
   - Export log → verify JSON format

2. **Automated Testing (Future):**
   - Unit tests for `useActionLog` composable
   - Test execute/undo symmetry
   - Test log size limits

---

### Phase 3.5 Effort Estimate

| Task | Effort |
|------|--------|
| Step 1: useActionLog composable | 3-4 hours |
| Step 2: Action type definitions | 1-2 hours |
| Step 3: Integrate into EditorApp | 4-5 hours |
| Step 4: ActionLogPanel component | 2-3 hours |
| **Total** | **10-14 hours (~2 days)** |

---

## Phase 1: Short-Term Wins

#### 1.1 Expand ToastNotifications Usage

**Current State:** ToastNotifications component exists but only used for row move warnings.

**Files to Modify:**
- `editor/src/components/EditorApp.vue`
- `editor/src/components/ToastNotifications.vue`

**Add toast notifications for:**
- File save/export success
  - "Exported to HTML successfully"
  - "Saved to JSON successfully"
  - "Downloaded MAP file successfully"
- MIDI device connection status
  - "MIDI device connected: [device name]"
  - "MIDI device disconnected"
- Static analyzer completion
  - "Analysis complete: X warnings found"
  - "Analysis complete: No issues found"
- Cache slot switches
  - "Switched to Slot A"
  - "Switched to Slot B"
  - "Slot A locked/unlocked"
- File load success
  - "Loaded [filename] successfully"
  - "Loaded from cache: Slot A/B"

**Implementation Steps:**
1. Verify ToastNotifications API supports success/info/warning/error variants
2. Replace `console.log()` statements with toast notifications
3. Replace some `alert()` calls with toasts (keep critical errors as alerts)
4. Add toast calls in:
   - `downloadHtml/Json/Markdown/Map()` (success messages)
   - `handleSlotSwitch()` (slot switch confirmations)
   - `init()` after analysis (analysis results)
   - `readFile()` after successful load
   - `useMidi.ts` for device connection events (may need to emit events)

**Effort:** 2-3 hours

---

#### 1.2 Migrate Remaining Buttons to MenuButton

**Current State:** 7 buttons still use raw Bootstrap classes instead of MenuButton component.

**Files to Modify:**
- `editor/src/components/MidiMonitor.vue`
- `editor/src/components/EditorApp.vue`
- `editor/src/components/MidiLearnExtra.vue`
- `editor/src/components/RowActionButtons.vue`
- `editor/src/components/SettingsPanel.vue`

**Implementation:**

Create **IconButton.vue** component for small action buttons:
```vue
<template>
  <button
    class="icon-btn"
    :class="[variant, size]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'clear';
  size?: 'sm' | 'md';
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
/* Minimal button styles for icon/small buttons */
</style>
```

**Migration Strategy:**

1. Create `IconButton.vue` in `editor/src/components/`
2. Update each component:
   - `MidiMonitor.vue` line ~125: Clear button → `<IconButton variant="clear">`
   - `EditorApp.vue` line ~1427: Row clear (X) → `<IconButton variant="clear" size="sm">`
   - `MidiLearnExtra.vue` lines 214, 224: Learn/Cancel → `<IconButton>`
   - `RowActionButtons.vue` lines 31, 43: Copy/Paste → `<IconButton>`
   - `SettingsPanel.vue` line ~62: HEX/DEC toggle → MenuButton or IconButton

**Effort:** 3-4 hours

---

#### 1.3 Add TypeDoc Comments to Composables

**Files to Document:**
- `editor/src/composables/useClipboard.ts` ⭐ (well-structured)
- `editor/src/composables/useMappingCache.ts` ✅ (already has good comments)
- `editor/src/composables/useMidi.ts`
- `editor/src/composables/useStaticAnalyzer.ts`
- `editor/src/composables/useWarningLog.ts`

**Template:**
```typescript
/**
 * Composable for [purpose]
 *
 * @example
 * ```typescript
 * const { state, action } = useComposable();
 * ```
 *
 * @returns {Object} Composable API
 * @returns {Ref<T>} returns.state - Description
 * @returns {Function} returns.action - Description
 */
export function useComposable() {
  // ...
}
```

**Focus on:**
- Public API documentation
- Parameter descriptions
- Return type documentation
- Usage examples

**Effort:** 2-3 hours

**Phase 1 Total:** 7-10 hours (~1-2 days)

---

### Phase 2: Row Value Display

**Goal:** Add hex/decimal/binary value display in RowCommentSection for selected rows.

**Files to Modify:**
- `editor/src/components/RowCommentSection.vue`

**Implementation:**

Add a value monitor section when row is selected:
```vue
<div class="row-value-monitor">
  <div class="value-row">
    <span class="label">Source:</span>
    <span class="dec">{{ sourceValue }}</span>
    <span class="hex">{{ toHex(sourceValue) }}</span>
    <span class="bin">{{ toBinary(sourceValue) }}</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: sourcePercent + '%' }"></div>
  </div>
  <div class="value-row">
    <span class="label">Dest:</span>
    <span class="dec">{{ destValue }}</span>
    <span class="hex">{{ toHex(destValue) }}</span>
    <span class="bin">{{ toBinary(destValue) }}</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: destPercent + '%' }"></div>
  </div>
</div>
```

**New Props:**
- `sourceValue: number`
- `destinationValue: number`

**Helper Functions:**
```typescript
function toHex(value: number): string {
  return '0x' + value.toString(16).toUpperCase().padStart(4, '0');
}

function toBinary(value: number): string {
  return '0b' + value.toString(2).padStart(16, '0');
}

function toPercent(value: number): number {
  return (value / 4095) * 100;
}
```

**Effort:** 2-3 hours (~0.5 days)

---

### Phase 3: Global Documentation

**Goal:** Add mapping-level documentation stored in JSON format.

**Critical:** Do this BEFORE useFileIO refactoring so the file I/O extraction includes this logic.

#### 3.1 Extend MappingDocument Model

**File:** `editor/src/modules/documentModel.ts`

Add to MappingDocument class:
```typescript
export class MappingDocument {
  // ... existing fields

  /**
   * Optional global documentation for the mapping
   */
  globalComment?: string;

  /**
   * Optional author information
   */
  author?: string;

  /**
   * Optional version string
   */
  version?: string;

  /**
   * Optional changelog entries
   */
  changelog?: string[];
}
```

#### 3.2 Update JSON Export/Import

**File:** `editor/src/modules/formatters.ts`

Update `exportToJson()` to include new fields:
```typescript
export function exportToJson(
  document: MappingDocument,
  editorMetadata?: {
    rowColors?: Record<number, string>;
    rowComments?: Record<number, string>;
    globalComment?: string;
    author?: string;
    version?: string;
    changelog?: string[];
  }
): string {
  const json = {
    header: { ... },
    rows: [ ... ],
    variables: [ ... ],
    editorMetadata: {
      ...(editorMetadata || {}),
      globalComment: document.globalComment,
      author: document.author,
      version: document.version,
      changelog: document.changelog
    }
  };
  return JSON.stringify(json, null, 2);
}
```

**File:** `editor/src/modules/parsers.ts`

Update JSON parsing in `readFile()` to restore these fields.

#### 3.3 Add UI Component

**File:** `editor/src/components/GlobalDocumentationPanel.vue` (NEW)

Create a collapsible panel in the header:
```vue
<template>
  <BasePanel
    title="Documentation"
    :expanded="expanded"
    @toggle="$emit('toggle')"
  >
    <div class="doc-fields">
      <div class="field">
        <label>Author:</label>
        <input v-model="author" placeholder="Your name" />
      </div>
      <div class="field">
        <label>Version:</label>
        <input v-model="version" placeholder="1.0.0" />
      </div>
      <div class="field">
        <label>Description:</label>
        <textarea
          v-model="globalComment"
          placeholder="Describe this mapping..."
          rows="5"
        ></textarea>
      </div>
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
const author = defineModel<string>('author');
const version = defineModel<string>('version');
const globalComment = defineModel<string>('globalComment');

defineProps<{
  expanded: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>
```

**File:** `editor/src/components/EditorApp.vue`

Add panel to header and wire up v-model bindings.

**Effort:** 4-5 hours (~1 day)

---

---

## Phase 3.6: EditorApp Modularization - NEW

### Overview

Extract 6 composables from EditorApp.vue (2,130 lines total, 1,300 script lines) to improve testability, maintainability, and enable future features. This refactoring reduces EditorApp.vue script from 1,300 lines to ~400 lines while preserving all functionality.

**Target:** Extract 730 lines into 6 new composables

See `docs/EditorApp_modules.md` for complete implementation details.

### Composables to Extract

| Composable | Lines | Priority | Risk | Effort |
|------------|-------|----------|------|--------|
| B.1: useSkipAnalysis | ~180 | HIGH | LOW | 4-5h |
| B.2: useRowSelection | ~100 | HIGH | LOW | 4-5h |
| B.3: usePanelState | ~120 | MEDIUM | LOW | 3-4h |
| B.4: useKeyboardShortcuts | ~100 | MEDIUM | LOW | 3-4h |
| B.5: useSerialization | ~150 | HIGH | MEDIUM | 3-4h |
| B.6: useFileHandling | ~300 | CRITICAL | HIGH | 4-5h |
| B.7: useRowMetadata | ~120 | MEDIUM | MEDIUM | 3-4h |

### Sequencing Strategy

**Week 1:** Foundation + Low Risk
- Days 0-1: Setup export regression tests + B.1 + B.2
- Days 2-3: B.3 + B.4

**Week 2:** High Risk + Integration
- Days 4-5: B.5 + B.6 (requires extensive testing)
- Day 6: B.7 + integration testing

### Integration with Feature Roadmap

This refactoring enables:
- **Phase 0.1 (Debugger):** Clean architecture for breakpoints and step-through
- **Phase 0.11 (Skip Visualization):** useSkipAnalysis provides reusable skip logic
- **Phase 0.13 (Simulation):** Composables are testable units for simulation engine

### Git Strategy

Incremental PRs:
1. **PR #1:** B.1 + B.2 (Skip + Selection, ~230 lines, LOW risk)
2. **PR #2:** B.3 + B.4 (Panels + Keyboard, ~130 lines, LOW risk)
3. **PR #3:** B.5 + B.6 (Serialization + File I/O, ~320 lines, HIGH risk) - **Requires export tests passing**
4. **PR #4:** B.7 (Metadata, ~100 lines, MEDIUM risk)
5. **PR #5:** Feature branch → main (full integration)

### Testing Requirements

**CRITICAL:** Automated export regression tests MUST pass before PR #3 merge.

**File:** `tests/export-regression.test.ts` (NEW)
- Round-trip .MAP → binary → parse → verify
- Round-trip .JSON → metadata preservation
- Backward compatibility with old JSON formats

**Manual Regression Checklist:**
- [ ] Import .MAP file → all fields loaded
- [ ] Import .JSON (old/new) → backward compatible
- [ ] Export all formats → correct outputs
- [ ] Static analyzer → warnings generated
- [ ] Multi-row operations → work correctly
- [ ] Slot A/B switching → cache persists
- [ ] Keyboard shortcuts → all combinations work
- [ ] MIDI learn → channel/CC capture works
- [ ] Row colors/comments → persistence works

### Effort Estimate

| Phase | Effort | Timeline |
|-------|--------|----------|
| Setup + Export Tests | 2h | Day 0 |
| B.1-B.2 (Foundation) | 8-10h | Days 1-2 |
| B.3-B.4 (Panel + KB) | 6-8h | Day 3 |
| B.5-B.6 (Serialization + I/O) | 7-9h | Days 4-5 |
| B.7 (Metadata) | 3-4h | Day 6 |
| Integration Testing | 3-4h | Day 7 |
| **Total** | **29-37 hours** | **~6-7 days** |

### Success Criteria

- [ ] EditorApp.vue reduced from 1,300 → ~400 script lines
- [ ] 6 new composables created and tested
- [ ] All existing functionality preserved
- [ ] Export regression tests passing
- [ ] TypeScript strict mode compliant
- [ ] No breaking changes to .MAP format
- [ ] All manual regression tests passing

### Benefits

1. **Testability:** Each composable can be unit tested independently
2. **Reusability:** Skip logic, serialization logic can be reused in debugger/simulation
3. **Maintainability:** Smaller files, clear separation of concerns
4. **Feature Enablement:** Clean foundation for Phases 0.1, 0.11, 0.13

---

## Phase 4: Extract useFileIO Composable

**Status:** NEXT - Ready to implement after Phase 3.5

**Goal:** Extract 200+ lines of file I/O logic from EditorApp.vue into a composable.

**Critical:** This happens AFTER Phase 3, so the composable includes global documentation logic.

#### 4.1 Create useFileIO Composable

**File:** `editor/src/composables/useFileIO.ts` (NEW)

**API Design:**
```typescript
export interface UseFileIOReturn {
  // State
  isLoading: Ref<boolean>;
  lastError: Ref<string | null>;

  // Actions
  importFile: (file: File) => Promise<MappingDocument | null>;
  exportToJson: (document: MappingDocument, metadata: EditorMetadata) => Blob;
  exportToHtml: (document: MappingDocument) => Blob;
  exportToMarkdown: (document: MappingDocument, useAbbrs: boolean) => Blob;
  exportToMap: (document: MappingDocument) => Blob;

  // Helpers
  validateJsonSchema: (json: unknown) => ValidationError[];
  detectFileFormat: (file: File) => 'map' | 'json' | 'unknown';
}

export function useFileIO(): UseFileIOReturn {
  // Implementation
}
```

#### 4.2 Extract Logic from EditorApp

**Functions to move:**
- `readFile()` → `importFile()`
- `downloadJson/Html/Markdown/Map()` → export functions
- JSON schema validation logic → `validateJsonSchema()`
- Format detection → `detectFileFormat()`

**Keep in EditorApp:**
- `init()` - still needs to call analysis
- `reset()` - still needs to clear UI state
- Download triggering - calls composable export functions

#### 4.3 Update EditorApp.vue

Replace file reading logic:
```typescript
const {
  isLoading,
  lastError,
  importFile,
  exportToJson,
  exportToHtml,
  exportToMarkdown,
  exportToMap
} = useFileIO();

async function handleFileUpload(file: File) {
  const document = await importFile(file);
  if (document) {
    mappingDocument.value = document;
    init();
  }
}

function downloadJson() {
  const blob = exportToJson(mappingDocument.value, {
    rowColors: rowColors.value,
    rowComments: rowComments.value,
    globalComment: mappingDocument.value.globalComment,
    author: mappingDocument.value.author,
    version: mappingDocument.value.version
  });
  downloadBlob(blob, fileName.value + '.json');
}
```

**Effort:** 8-10 hours (~2 days)

---

### Phase 5: Extract usePanelLayout Composable

**Goal:** Eliminate prop drilling and centralize panel positioning logic.

#### 5.1 Create usePanelLayout Composable

**File:** `editor/src/composables/usePanelLayout.ts` (NEW)

**API Design:**
```typescript
interface PanelConfig {
  key: string;
  visible: boolean;
  expanded: boolean;
  storageKey: string;
}

interface PanelPosition {
  top: number;
  height: number;
}

export interface UsePanelLayoutReturn {
  // Panel state
  panels: {
    settings: PanelConfig;
    selectionToolbar: PanelConfig;
    midiMonitor: PanelConfig;
    variableMonitor: PanelConfig;
    warningLog: PanelConfig;
  };

  // Computed positions
  positions: ComputedRef<Record<string, PanelPosition>>;

  // Actions
  togglePanel: (key: string) => void;
  setVisible: (key: string, visible: boolean) => void;
  setExpanded: (key: string, expanded: boolean) => void;
}

export function usePanelLayout(): UsePanelLayoutReturn {
  // Implementation with localStorage persistence
  // Position calculation based on panel states
}
```

#### 5.2 Update EditorApp.vue

Replace 10 state variables with composable:
```typescript
const { panels, positions, togglePanel, setVisible } = usePanelLayout();
```

#### 5.3 Update Panel Components

Pass computed positions instead of upstream states:
```vue
<SettingsPanel
  :style="{ top: positions.settings.top + 'px' }"
  :expanded="panels.settings.expanded"
  @toggle="togglePanel('settings')"
/>
```

**Effort:** 6-8 hours (~1-2 days)

---

### Phase 6: SelectionToolbar Enhancement

**Goal:** Convert SelectionToolbar to use BasePanel, make it dockable.

**Benefits from:** usePanelLayout refactoring (easier to add to panel system).

**File:** `editor/src/components/SelectionToolbar.vue`

Convert to use BasePanel wrapper and integrate with usePanelLayout.

**Effort:** 3-4 hours (~0.5 days)

---

## Phase 7: Style Consolidation & Unification

### Overview

**Goal:** Unify and consolidate styling across the NerdSEQ Mapping Editor to reduce duplication while maintaining the exact current visual appearance.

**Status:** 📋 PLANNED

**Priority:** MEDIUM - Improves maintainability and consistency, but not blocking other features

### Problem Summary

**Current Issues:**
- **163+ hardcoded color values** across 23 components (`#34cc99`, `#F1F700`, etc.)
- **75+ hardcoded spacing values** (4px, 6px, 8px duplicated everywhere)
- **Inconsistent button styling** (IconButton uses hardcoded colors, MenuButton uses CSS variables)
- **Duplicated component patterns** (panel headers, message items, scrollbars)
- **No semantic color variables** for success/warning/danger states

**Foundation (Good):**
- CSS variables exist in `/editor/src/assets/styles/variables.css`
- Shared form classes in `/editor/src/assets/styles/form-elements.css`
- All components use scoped styles (best practice)

### Solution Approach

4-phase incremental refactoring that maintains visual appearance while consolidating styles.

---

#### 7.1 Expand CSS Variables (1-2 hours)
**Risk:** LOW - No component changes yet

**Add to `/editor/src/assets/styles/variables.css`:**

**Semantic Color Variables:**
```css
/* Semantic state colors */
--color-success: #28a745;
--color-warning: #ffc107;
--color-danger: #dc3545;
--color-info: #34cc99;

/* MIDI message type colors */
--color-midi-note: #34cc99;
--color-midi-cc: #F1F700;
--color-midi-nrpn: #ff6b6b;
--color-midi-pitchbend: #4ecdc4;
--color-midi-aftertouch: #95e1d3;

/* Background variants */
--color-bg-panel: #34cc99;
--color-bg-panel-body: #000;
--color-bg-toolbar: #34cc99;
--color-bg-button: #000;
--color-bg-button-hover: rgba(52, 204, 153, 0.4);

/* Primary color opacity variants */
--color-primary-10: rgba(52, 204, 153, 0.1);
--color-primary-30: rgba(52, 204, 153, 0.3);
--color-primary-40: rgba(52, 204, 153, 0.4);
--color-primary-50: rgba(52, 204, 153, 0.5);
--color-primary-60: rgba(52, 204, 153, 0.6);
--color-primary-80: rgba(52, 204, 153, 0.8);

/* Text colors */
--color-text-muted: rgba(52, 204, 153, 0.6);
```

**Spacing Scale:**
```css
/* Spacing scale (2px base unit) */
--spacing-1: 2px;
--spacing-2: 4px;
--spacing-3: 6px;
--spacing-4: 8px;
--spacing-5: 10px;
--spacing-6: 12px;
```

**Shadows & Borders:**
```css
/* Shadows */
--shadow-panel: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-scrollbar-track: rgba(0, 0, 0, 0.3);
--shadow-locked: 0 0 8px 2px #dc3545;
--shadow-locked-inset: inset 0 0 4px rgba(220, 53, 69, 0.3);

/* Borders */
--border-panel: 2px solid #000;
--border-panel-secondary: 2px solid #34cc99;
--border-button: 1px solid #34cc99;
```

**Typography Scale:**
```css
/* Font sizes */
--font-size-xs: 10px;
--font-size-sm: 11px;
--font-size-base: 12px;
--font-size-md: 14px;

/* Line heights */
--line-height-tight: 1;
--line-height-normal: 1.2;
```

**Border Radius:**
```css
--border-radius-sm: 2px;
--border-radius-md: 4px;
```

**Verification:** Run `npm run dev`, verify no visual changes.

---

#### 7.2 Create Utility Classes (2-3 hours)
**Risk:** LOW - Optional classes, no breaking changes

**Add to `/editor/src/assets/styles/form-elements.css`:**

**Panel Component Classes:**
```css
/* Panel headers */
.panel-header-base {
  background-color: var(--color-bg-panel);
  border-bottom: var(--border-panel);
  box-shadow: var(--shadow-panel);
  padding: var(--spacing-1) var(--spacing-4);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.panel-header-interactive {
  cursor: pointer;
  user-select: none;
  transition: background-color var(--transition-standard);
}

.panel-header-interactive:hover {
  background-color: var(--color-hover);
}

/* Panel body */
.panel-body-base {
  padding: var(--spacing-2);
  background-color: var(--color-bg-panel-body);
  border: var(--border-panel-secondary);
  border-top: none;
}

/* Scrollable panels */
.panel-scrollable::-webkit-scrollbar {
  width: 6px;
}

.panel-scrollable::-webkit-scrollbar-track {
  background: var(--shadow-scrollbar-track);
}

.panel-scrollable::-webkit-scrollbar-thumb {
  background: var(--color-primary-50);
}

.panel-scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-80);
}
```

**Button Utility Classes:**
```css
/* Action buttons */
.action-btn-base {
  padding: var(--spacing-2) var(--spacing-3);
  border: var(--border-button);
  background-color: var(--color-bg-button);
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: bold;
  transition: all var(--transition-fast);
}

.action-btn-base:hover:not(:disabled) {
  background-color: var(--color-bg-button-hover);
}

.action-btn-base:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Filter buttons */
.filter-btn-base {
  padding: var(--spacing-1) var(--spacing-3);
  border: var(--border-button);
  background-color: var(--color-bg-button);
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.filter-btn-base.active {
  background-color: var(--color-primary-30);
  border-color: var(--color-hover);
}
```

**Message Item Classes:**
```css
.message-item {
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--color-primary-30);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.message-item:hover {
  background-color: var(--color-primary-10);
}

.message-item:last-child {
  border-bottom: none;
}
```

**Type Indicator Classes:**
```css
.type-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: var(--spacing-2);
}

.type-indicator-info { background-color: var(--color-info); }
.type-indicator-success { background-color: var(--color-success); }
.type-indicator-warning { background-color: var(--color-warning); }
.type-indicator-error { background-color: var(--color-danger); }
```

**Verification:** Classes added but not used yet. No visual impact.

---

#### 7.3 Component Updates (6-8 hours)
**Risk:** MEDIUM - Visual regression possible

Update components incrementally, one at a time, with screenshot comparison.

**Tier 1: Foundation Components (2 hours)**
1. **BasePanel.vue** - Convert hardcoded colors to CSS variables
2. **IconButton.vue** - Convert to CSS variable pattern like MenuButton
3. **ToastNotifications.vue** - Use semantic color variables

**Tier 2: Panel Components (3 hours)**
4. **MidiMonitor.vue** - MIDI message type colors + CSS variables
5. **LogMonitor.vue** - Log type colors + filter buttons
6. **VariableMonitor.vue** - CSS variables for spacing/colors
7. **SettingsPanel.vue** - CSS variables

**Tier 3: Toolbar Components (2 hours)**
8. **SelectionToolbar.vue** - Action button classes + CSS variables
9. **MultiSelectionToolbar.vue** - Similar to SelectionToolbar

**Tier 4: Extra Components (2 hours)**
10. All 9 Extra components (CalcSkipSourceExtra, VariableSourceExtra, etc.)

**Tier 5: Remaining (1 hour)**
11. **RowCommentSection.vue**
12. **RowActionButtons.vue**
13. **GlobalDocumentationPanel.vue**

**Per-Component Workflow:**
1. Take screenshot BEFORE changes
2. Replace hardcoded values with CSS variables:
   - `#34cc99` → `var(--color-primary)`
   - `#F1F700` → `var(--color-hover)`
   - `4px` → `var(--spacing-2)`
   - etc.
3. Test in dev server
4. Take screenshot AFTER, compare side-by-side
5. Verify hover/disabled/locked states
6. Commit with descriptive message

**Example change (BasePanel.vue):**
```css
/* Before */
background-color: #34cc99;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
padding: 2px 8px;

/* After */
background-color: var(--color-bg-panel);
box-shadow: var(--shadow-panel);
padding: var(--spacing-1) var(--spacing-4);
```

---

#### 7.4 Verification (2-3 hours)
**Risk:** LOW

**Visual Regression Testing:**
- [ ] Test all components in default state
- [ ] Test hover states on all interactive elements
- [ ] Test disabled states
- [ ] Test locked states (A/B cache)
- [ ] Test panel expand/collapse animations
- [ ] Test MIDI Monitor with live MIDI messages (all types)
- [ ] Test Log Monitor with analyzer warnings
- [ ] Test SelectionToolbar with multi-row selection
- [ ] Test all color variations (row colors, warnings, errors)

**Browser Testing:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on macOS)

**Type Check:**
```bash
npm run type-check
```

**Dev Server:**
```bash
npm run dev
# Visual inspection at http://localhost:5173
```

### Critical Files

**CSS Foundation (Phase 7.1-7.2):**
- `/editor/src/assets/styles/variables.css` - Add all new CSS variables
- `/editor/src/assets/styles/form-elements.css` - Add utility classes

**High Priority Components (Phase 7.3 Tier 1-2):**
- `/editor/src/components/BasePanel.vue` - Foundation panel (affects 5+ children)
- `/editor/src/components/IconButton.vue` - Button standardization
- `/editor/src/components/MidiMonitor.vue` - Complex panel with MIDI colors
- `/editor/src/components/LogMonitor.vue` - Complex panel with log colors
- `/editor/src/components/SelectionToolbar.vue` - Action buttons pattern

**Medium Priority (Phase 7.3 Tier 3-4):**
- `/editor/src/components/VariableMonitor.vue`
- `/editor/src/components/SettingsPanel.vue`
- `/editor/src/components/MultiSelectionToolbar.vue`
- `/editor/src/components/ToastNotifications.vue`

**Lower Priority (Phase 7.3 Tier 4-5):**
- All Extra components (9 files)
- `/editor/src/components/RowCommentSection.vue`
- `/editor/src/components/RowActionButtons.vue`
- `/editor/src/components/GlobalDocumentationPanel.vue`

### Success Criteria

- [ ] **Zero visual changes** to existing UI
- [ ] **163+ hardcoded colors** → ~10 (95% reduction)
- [ ] **75+ hardcoded spacing values** → ~5 (93% reduction)
- [ ] **All duplicated patterns** extracted to utility classes
- [ ] **All components tested** in all states
- [ ] **No TypeScript errors**
- [ ] **Documentation updated** with usage guide

### Expected Outcomes

**Quantitative:**
- 95% reduction in hardcoded colors
- 93% reduction in hardcoded spacing
- 100% elimination of duplicated patterns
- 15-20% reduction in CSS lines

**Qualitative:**
- Single source of truth for all styling values
- Easy to change global colors/spacing in future
- Faster component development with utility classes
- Consistent spacing, colors, typography across app

### Rollback Plan

If visual regression detected:
1. Immediately revert the specific component commit
2. Document the issue
3. Fix in isolation
4. Re-test before proceeding

Each component updated independently for safe rollback.

### Effort Estimate

| Phase | Duration |
|-------|----------|
| Phase 7.1: CSS Variables | 1-2 hours |
| Phase 7.2: Utility Classes | 2-3 hours |
| Phase 7.3: Component Updates | 6-8 hours |
| Phase 7.4: Verification | 2-3 hours |
| **Total** | **16-18 hours (~3-4 days)** |

---

## Verification & Testing

### After Phase 1: Short-Term Wins
- [ ] Toasts appear for all file operations
- [ ] All buttons use MenuButton or IconButton
- [ ] TypeDoc comments generate proper documentation

### After Phase 2: Row Value Display
- [ ] Select a row → values display correctly in hex/dec/bin
- [ ] Progress bars show correct percentages
- [ ] Values update when row changes

### After Phase 3: Global Documentation
- [ ] Add global comment → save as JSON → reload → comment restored
- [ ] Global docs NOT in .MAP binary export
- [ ] Backward compatible with old JSON files (missing fields)

### After Phase 4: useFileIO Refactoring
- [ ] Import .MAP file works
- [ ] Import .JSON file works (old and new format)
- [ ] Export all formats works
- [ ] Error handling shows toasts/alerts correctly
- [ ] Global documentation preserved in export/import

### After Phase 5: usePanelLayout Refactoring
- [ ] All panels position correctly
- [ ] Panel visibility persists in localStorage
- [ ] Expanding/collapsing panels updates layout
- [ ] No prop drilling in template

### After Phase 6: SelectionToolbar Enhancement
- [ ] Toolbar uses BasePanel
- [ ] Docks next to Variables panel
- [ ] Shows for single selections too

---

## Risk Mitigation

### Phase 1: Short-Term Wins
- **Risk Level:** Low
- **Impact:** Isolated changes, no architectural impact
- **Testing:** Manual verification of toasts and buttons

### Phase 2: Row Value Display
- **Risk Level:** Low
- **Impact:** Additive feature, no breaking changes
- **Testing:** Manual verification with different row types

### Phase 3: Global Documentation
- **Risk Level:** Medium
- **Impact:** Modifies file format (JSON only)
- **Mitigation:** Backward compatibility for missing fields
- **Testing:** Import old JSON files, verify no errors

### Phase 4: useFileIO Refactoring
- **Risk Level:** High
- **Impact:** Touches critical file I/O logic
- **Mitigation:** Incremental extraction, extensive testing
- **Testing:** Import/export all file types, edge cases

### Phase 5: usePanelLayout Refactoring
- **Risk Level:** Medium
- **Impact:** Structural change affecting 5 components
- **Mitigation:** Test panel positioning thoroughly
- **Testing:** All panel combinations, localStorage persistence

### Phase 6: SelectionToolbar Enhancement
- **Risk Level:** Low
- **Impact:** UI enhancement only
- **Testing:** Manual verification of toolbar behavior

---

## Timeline Estimate

| Phase | Effort | Duration | Status |
|-------|--------|----------|--------|
| ~~1. Short-term wins~~ | ~~7-10 hours~~ | ~~1-2 days~~ | ✅ DONE |
| ~~2. Row Value Display~~ | ~~2-3 hours~~ | ~~0.5 days~~ | ⏭️ SKIPPED |
| ~~3. Global Documentation~~ | ~~4-5 hours~~ | ~~1 day~~ | ✅ DONE |
| ~~3.5. Action Logging System~~ | ~~10-14 hours~~ | ~~2 days~~ | ✅ PARTIALLY COMPLETE |
| **3.6. EditorApp Modularization** | **29-37 hours** | **6-7 days** | ⏳ **CURRENT** |
| 4. useFileIO Refactoring | 8-10 hours | 2 days | 🔀 MERGED INTO 3.6 |
| 5. usePanelLayout Refactoring | 6-8 hours | 1-2 days | 🔀 MERGED INTO 3.6 |
| 6. SelectionToolbar Enhancement | 3-4 hours | 0.5 days | 📋 PLANNED |
| 7. Style Consolidation | 16-18 hours | 3-4 days | 📋 PLANNED |
| ~~8. Slot-Switch Performance~~ | ~~4–6 hours~~ | ~~1 day~~ | ✅ DONE |
| **Total** | **86-110 hours** | **16-20 days** | |
| **Remaining** | **52-65 hours** | **11-13 days** | |

---

## Success Criteria

**Phase 1-3 (Completed):**
- [x] Toast notifications integrated
- [x] Most buttons migrated to MenuButton/IconButton
- [x] TypeDoc comments added to composables
- [x] Global documentation panel implemented

**Phase 3.5 (Action Logging - Partially Complete):**
- [x] useActionHistory composable created with command pattern
- [x] Per-slot undo/redo with IndexedDB persistence
- [x] Foundation for undo/redo in place
- [x] `pushCommand()` API for pre-applied mutations (debounced fader drags)
- [x] Debounced extra update handlers prevent history flooding
- [x] VariableSourceExtra syncs fader position on undo/redo via model watcher
- [ ] UI components (undo/redo buttons, history panel)
- [ ] Complete integration audit

**Phase 3.6 (Current - EditorApp Modularization):**
- [ ] EditorApp.vue reduced from 1,300 → ~400 script lines
- [ ] 6 new composables created (Skip, Selection, Panel, Keyboard, Serialization, FileIO, Metadata)
- [ ] Export regression tests implemented and passing
- [ ] All existing functionality preserved
- [ ] No breaking changes to .MAP binary format
- [ ] TypeScript strict mode compliant
- [ ] Manual regression checklist complete

**Phase 6 (Upcoming):**
- [ ] SelectionToolbar converted to BasePanel
- [ ] Dockable panel system implemented

---

## Next Steps After Implementation

Once these refactorings are complete, the codebase will be in excellent shape for:

**Immediate Next Features:**
- **Undo/Redo UI** (builds on Phase 3.5 action logging foundation)
  - Add undo/redo buttons to toolbar
  - Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - Visual history timeline
  - Persist undo history across sessions

**Future Major Features:**
- **Simulation Engine** (clean architecture for complex feature)
- **Breakpoints & Debugging** (benefits from clean separation)
- **Draggable/Dockable Panels** (usePanelLayout makes this easier)

---

## Component Dependency Graph

```
EditorApp.vue
├── MenuButton.vue
├── BasePanel.vue
│   ├── SettingsPanel.vue
│   ├── MidiMonitor.vue
│   └── VariablesPanel.vue
├── SelectionToolbar.vue
├── ToastNotifications.vue
├── RowCommentSection.vue
├── RowActionButtons.vue
└── *Extra.vue components (11 files)
    ├── CalcSkipSourceExtra.vue
    ├── DualDestinationExtra.vue
    ├── MidiCcDestinationExtra.vue
    ├── MidiLearnExtra.vue
    ├── NrpnSourceExtra.vue
    ├── SettingsPanel.vue
    ├── SkipDestinationExtra.vue
    ├── VariableDestinationExtra.vue
    ├── VariableSourceExtra.vue
    └── VisuDestinationExtra.vue
```

---

## Recent Investigation: Variable Fader Migration & .MAP Export Safety (2026-02-07)

### Overview

Investigated the impact of migrating Variable Fader UI from `RowCommentSection.vue` to `VariableSourceExtra.vue` on .MAP binary exports.

**Conclusion: ZERO .MAP EXPORT IMPACT** - Pure UI refactoring with no data model changes.

### Key Findings

#### 1. .MAP Binary Format (1502 bytes)

```
Byte Offset  | Content                    | Size
-------------|----------------------------|--------
0-69         | Header                     | 70 bytes
70-1469      | 70 Rows × 20 bytes/row     | 1400 bytes
1470-1501    | 16 Variables × 2 bytes/var | 32 bytes
```

**Variable Storage:**
- 16 variables (A-P) stored at bytes 1470-1501
- Each variable: 16-bit unsigned Little Endian
- Range: 0-4095 (12-bit values)
- Exported by `formatters.ts` lines 153-156 from `mappingDocument.variables[i].value`

**Row Source Extra Storage:**
- `row.source.extra.keyOrValue` stored at byte offset: `70 + (rowIndex × 20) + 4`
- Range: 0-4096 (0 = "From Row/Var" mode, 1-4096 = constant values 0-4095)

#### 2. What the Migration Actually Does

**Two separate UI changes:**

1. **VariableSourceExtra Enhancement** (Primary):
   - Replace number input with horizontal slider for `row.source.extra.keyOrValue`
   - Unchecked "From Row/Var": Editable slider (0-4095)
   - Checked "From Row/Var": Read-only progress bar showing incoming value
   - **Data modified**: Row source extra field (already exported in .MAP)

2. **RowCommentSection Simplification** (Secondary):
   - Remove global variable value faders (decision confirmed: Option A)
   - Keep read-only progress bar for display only
   - **UX Impact**: Users must use Variable Monitor panel to set global variable values
   - **Data NOT affected**: Global variables still exported, just set from different UI

#### 3. Semantic Clarification

The FEATURE_PLAN.md section 1.5 title "Move variable faders from RowCommentSection to VariableSourceExtra" is **misleading**. The plan actually involves:

- **RowCommentSection fader**: Sets `mappingDocument.variables[A-P].value` (global state) - **being removed**
- **VariableSourceExtra slider**: Sets `row.source.extra.keyOrValue` (row-specific constant) - **being added**

These are **different sliders** controlling **different values**.

#### 4. Data Flow Verification

**Current variable value update flow:**
```
RowCommentSection slider → emit('updateVariable', variableIndex, value)
                         ↓ (EditorApp.vue handler)
mappingDocument.variables[variableIndex].value = value
                         ↓ (scheduleCacheSave debounced 1s)
IndexedDB persistence
                         ↓ (formatters.toBlob())
Bytes 1470-1501 in .MAP export
```

**Proposed row constant value update flow:**
```
VariableSourceExtra slider → v-model="varValue"
                           ↓ (numChanged event)
row.source.extra.keyOrValue = value
                           ↓ (scheduleCacheSave debounced 1s)
IndexedDB persistence
                           ↓ (formatters.toBlob())
Bytes 70+ in .MAP export (row data)
```

Both flows modify fields **already serialized** by existing export logic. UI location doesn't matter.

#### 5. Export Verification Strategy

**Test workflow:**
1. Create test mapping with Variable A = 1234 (via Variable Monitor)
2. Create row with Variable source (function = Variable A, extra keyOrValue = 2500)
3. Export to .MAP file
4. Binary inspection:
   ```javascript
   const buffer = fs.readFileSync('test.map');
   const varAValue = buffer.readUInt16LE(1470); // Should be 1234
   const row0SourceExtra = buffer.readUInt16LE(74); // Should be 2501 (2500+1)
   ```
5. Round-trip test: Import .MAP → verify values preserved

### Implementation Plan

**Files to modify:**
1. `VariableSourceExtra.vue` (~180 lines): Add slider/progress bar UI
2. `EditorApp.vue` (~30 lines): Add `getVariableSourceIncomingValue()` helper
3. `RowCommentSection.vue` (~70 lines removed): Remove editable sliders

**No changes required:**
- ❌ `formatters.ts` - Export logic unchanged
- ❌ `parsers.ts` - Import logic unchanged
- ❌ `documentModel.ts` - Variable class unchanged

**Detailed plan:** `/Users/pforsten/.claude/plans/foamy-cuddling-oasis.md`
**Integration plan:** `/Users/pforsten/.claude/plans/woolly-herding-lantern.md`

**Effort estimate:** 4.5-6.5 hours

### Critical Observations

1. **No map-export-guardian review needed**: Zero impact on binary export logic
2. **Data model unchanged**: Only UI components modified
3. **Backward compatibility preserved**: .MAP format unchanged
4. **UX change requires documentation**: Removal of RowCommentSection global variable faders should be documented in release notes

### Testing Checklist

**Functional:**
- [ ] VariableSourceExtra slider updates row source extra correctly
- [ ] Read-only progress bar shows live incoming values
- [ ] Variable Monitor still sets global variable values
- [ ] Locked state disables slider but shows values

**Export:**
- [ ] .MAP binary export byte-identical (same input values)
- [ ] JSON export includes correct variable values array
- [ ] Round-trip (export → import) preserves all values
- [ ] Binary inspection confirms correct byte offsets

**Regression:**
- [ ] Variable Monitor displays/edits global variables
- [ ] SETVAR destination writes to global variables
- [ ] Static analyzer variable warnings still work
- [ ] MIDI learn functions with Variable source rows

---

## Phase 8: Slot-Switch Performance

**Status:** ✅ IMPLEMENTED
**Priority:** MEDIUM — noticeable latency on every slot switch
**Risk:** LOW — confined to `useMappingCache.ts` and `useDocumentSerialization.ts`

### Problem

Switching between slots (pressing `1` or `2`) involves two sequential IndexedDB operations (save + load) and three reactive watch triggers that each schedule a redundant cache save immediately after loading.

**Measured timing:**
| Step | Time |
|------|------|
| `serializeDocument()` (sync) | ~1ms |
| `saveToActiveSlot()` — IndexedDB write | ~10–50ms |
| `loadFromSlot()` — IndexedDB read | ~10–50ms |
| `deserializeToDocument()` — 420 object creations | ~5–50ms |
| Post-load watch → `scheduleCacheSave()` ×3 (debounced 1s) | +1000ms |
| **Total perceived** | **~100–200ms + 1s lingering** |

### Root Causes

1. **Sequential save → load** (`useDocumentSerialization.ts:217–234`): The save to the current slot and load from the new slot are awaited one after the other, even though they touch different IndexedDB keys.

2. **Post-load redundant saves** (`EditorApp.vue:545–555`): After `deserializeToDocument()` sets `mappingDocument.value`, `rowColors`, and `rowComments`, three watches each fire `scheduleCacheSave()` — immediately scheduling a re-save of data that was just loaded.

3. **Repeated DB open/close** (`useMappingCache.ts:80–99`): `openDatabase()` is called once per operation; the `IDBDatabase` instance is not reused between save and load.

### Solution

#### Fix 1 — In-memory slot cache (biggest win)
**File:** `useMappingCache.ts`

Keep both slots' `CachedMapping` in a module-level plain object `slotCache: Record<CacheSlot, CachedMapping | null>`. On init, load both slots from IndexedDB in parallel (`Promise.all`). Thereafter:

- `saveToActiveSlot(data)`: write to `slotCache[slot]` immediately; fire `saveToIndexedDB()` in background (no `await`).
- `loadFromSlot(slot)`: return `slotCache[slot]` directly (no IndexedDB read on switch).

**Result:** Zero IndexedDB reads during slot switching after first load.

#### Fix 2 — Suppress post-load saves
**File:** `useDocumentSerialization.ts`

Add a plain boolean `let isDeserializing = false`. In `scheduleCacheSave()` add `if (isDeserializing) return;`. In `deserializeToDocument()` set it `true` at the top, then reset via `nextTick(() => { isDeserializing = false; })` after all assignments.

**Result:** Eliminates 3 spurious `scheduleCacheSave()` calls after every slot switch.

#### Fix 3 — Persistent DB connection (minor)
**File:** `useMappingCache.ts`

Cache the `IDBDatabase` instance as a module-level variable. `openDatabase()` returns the cached instance if available, otherwise opens and stores it. Handle `versionchange` event to close/re-open as needed.

**Result:** Removes ~5–15ms open overhead per save/load operation.

### Files to Modify

| File | Change |
|------|--------|
| `editor/src/composables/useMappingCache.ts` | `slotCache` map, parallel init, background saves, persistent DB connection |
| `editor/src/composables/useDocumentSerialization.ts` | `isDeserializing` flag, guard `scheduleCacheSave` |

### Expected Improvement

| Operation | Before | After |
|-----------|--------|-------|
| IndexedDB read on switch | ~10–50ms | 0ms (memory) |
| IndexedDB write on switch | ~10–50ms (blocking) | ~0ms (background) |
| DB open overhead | ~5–15ms × 2 | ~0ms (cached) |
| Post-load redundant saves | ×3 at +1000ms | 0 |
| **Total perceived switch** | **~100–200ms + 1s** | **~5–50ms** |

### Verification

1. `npm run dev` in `editor/`
2. Load a mapping, switch slots → switch should feel instant
3. Reload page → both slots restore correctly from IndexedDB
4. Make a change in slot 1 → switch to slot 2 → switch back → change persists
5. `npm run type-check` → no errors

---

## Last Updated

**2026-02-17** — Phase 3.5 update: Added `pushCommand()` API to `useActionHistory.ts` for debounced/coalesced operations. Debounced `handleSourceExtraUpdate` and `handleDestExtraUpdate` in EditorApp.vue (400ms coalescing) to prevent undo history flooding from fader drags. Added model watcher in `VariableSourceExtra.vue` so fader position syncs on undo/redo.

**2026-02-15** — Added Phase 8 (Slot-Switch Performance): in-memory slot cache, post-load save suppression, persistent DB connection. Expected to reduce slot switch latency from ~200ms to ~50ms.

**2026-02-04** - Documented major feature implementations: Paste Auto-Advance System (3 modes), MIDI Learn Auto-Advance, Enhanced Row Selection (3-click cycle, sticky comment state), Settings Panel Auto-Advance section, and Toolbar Copy button bug fix. Updated EditorApp.vue size (~2,400 lines total, ~1,600 script) to reflect recent additions. Emphasized increased importance of Phase 3.6 modularization. Comprehensive commit: "Add comprehensive auto-advance system and enhance row selection UX" (406 insertions, 68 deletions across 6 files).

**2026-02-02** - Added Phase 7 (Style Consolidation & Unification) with comprehensive plan to consolidate 163+ hardcoded color values and 75+ spacing values into CSS variables and utility classes. 4-phase incremental refactoring targeting 95% reduction in hardcoded values while maintaining exact visual appearance. Estimated 16-18 hours over 3-4 days.

**2026-02-01** - Added Phase 3.6 (EditorApp Modularization) with plan to extract 6 composables from EditorApp.vue. Updated Phase 3.5 status to PARTIALLY COMPLETE (useActionHistory exists). Created `docs/EditorApp_modules.md` with detailed implementation plan.

**2026-01-31** - Documented critical bug fixes (row comments, lock bypass, reset button, analyzer hex/dec formatting, Skip Destination encoding). Updated composables section with recent enhancements to `useStaticAnalyzer` and `useClipboard`.

2026-01-26 - Added Phase 3.5 (Action Logging System) as foundation for undo/redo, updated completion status

---
