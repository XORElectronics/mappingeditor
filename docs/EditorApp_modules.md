# EditorApp.vue Modularization Plan

## Executive Summary

**Current State (Updated 2026-02-04):**
- Total lines: ~2,400 (was 2,130)
- Script lines: ~1,600 (was 1,300)
- Template lines: ~800
- Functions: 70+ (was 60+)
- Reactive properties: 50+ (was 40+)
- Concerns: File I/O, serialization, selection, panels, skip analysis, keyboard shortcuts, metadata, **auto-advance systems**, **comment expansion tracking**

**Recent Additions (+280 lines):**
- Paste auto-advance system (3 modes: DISABLED/ROWS/ALL)
- MIDI learn auto-advance with duplicate prevention
- Enhanced row selection (3-click cycle, sticky comment state)
- Comment section expansion tracking (`expandedCommentRowIndex`)
- Auto-advance helpers (`advanceToNextRow`, paste wrappers)

**Target State:**
- Script lines: ~500 (reduction of 1,100 lines)
- Extract **7 composables** (~1,010 lines of reusable logic)
  - Original 6 + new `useAutoAdvance`
- Improve testability, maintainability, and enable debugger features

**Benefits:**
- ✅ **Testability:** Each composable can be unit tested independently
- ✅ **Reusability:** Skip logic, serialization reused in debugger/simulation
- ✅ **Maintainability:** Smaller files, clear separation of concerns
- ✅ **Feature Enablement:** Foundation for Phases 0.1, 0.11, 0.13 from FEATURE_PLAN.md

---

## Current Architecture Analysis

### File Metrics (Updated 2026-02-04)

```
EditorApp.vue Total: ~2,400 lines
├── <script setup>: ~1,600 lines
│   ├── Imports: 55 lines (+5 for new state)
│   ├── State declarations: 236 lines (+20 for auto-advance/comment expansion)
│   ├── Serialization: 120 lines
│   ├── Skip analysis: 180 lines
│   ├── Row selection: 180 lines (+80 for 3-click cycle, sticky state)
│   ├── Auto-advance: 140 lines (NEW: paste/MIDI wrappers, advanceToNextRow)
│   ├── Multi-row operations: 80 lines
│   ├── Keyboard shortcuts: 120 lines (+20 for paste auto-advance)
│   ├── File I/O: 200 lines
│   ├── Selection handlers: 130 lines
│   └── Helpers: 159 lines (+35 for MIDI learn handlers)
└── <template>: ~800 lines
```

**Change Summary (+280 script lines):**
- +20 lines: State declarations (expandedCommentRowIndex, pasteAutoAdvance, etc.)
- +80 lines: Enhanced row selection (3-click cycle, sticky comment state)
- +140 lines: Auto-advance system (paste/MIDI wrappers, advanceToNextRow)
- +20 lines: Keyboard shortcuts (paste auto-advance integration)
- +35 lines: MIDI learn handlers (auto-start, duplicate tracking)

### Identified Concerns (Updated 2026-02-04)

| Concern | Lines | Complexity | Extraction Priority | Status |
|---------|-------|------------|---------------------|--------|
| 1. Skip Analysis | 180 | HIGH | HIGH (pure logic, reusable) | Planned |
| 2. Row Selection | 180 | HIGH | HIGH (state machine + sticky state) | **UPDATED** (+80 lines) |
| 3. Panel State | 120 | LOW | MEDIUM (simple state) | Planned |
| 4. Keyboard Shortcuts | 120 | MEDIUM | MEDIUM (event handling) | **UPDATED** (+20 lines) |
| 5. Serialization | 150 | MEDIUM | HIGH (testable) | Planned |
| 6. File Handling | 300 | HIGH | CRITICAL (data integrity) | Planned |
| 7. Row Metadata | 120 | LOW | MEDIUM (colors, comments) | Planned |
| **8. Auto-Advance** | **140** | **MEDIUM** | **HIGH (workflow feature)** | **NEW 2026-02-04** |

**New Concern #8: Auto-Advance Systems**
- Paste auto-advance (row/source/destination with 3 modes)
- MIDI learn auto-advance with duplicate prevention
- `advanceToNextRow(currentRowIndex, keepCommentOpen)` helper
- Paste wrappers: `handlePasteRow()`, `handlePasteSource()`, `handlePasteDestination()`
- MIDI learn completion handlers
- Global `lastLearnedMidiMessage` tracking
- Should be extracted to `useAutoAdvance.ts` composable

### Dependency Graph

```
MappingDocument (core state)
    │
    ├─→ Serialization ──→ File Handling
    │       │
    │       └─→ Cache Management
    │
    ├─→ Skip Analysis (pure functions)
    │
    ├─→ Row Selection ──→ Multi-row Operations
    │       │
    │       └─→ Clipboard
    │
    ├─→ Row Metadata (colors, comments)
    │
    └─→ Panel State (UI state)
            │
            └─→ Keyboard Shortcuts
```

**Key Insight:** Skip Analysis and Panel State have minimal dependencies → extract first.
File Handling depends on Serialization → extract together.

---

## Extraction Plan

### Phase B.1: useSkipAnalysis (~4-5 hours)

**Purpose:** Extract skip condition analysis logic for source and destination Skip types. This logic is pure domain logic that will be reused in the debugger (Phase 0.11).

#### Functions to Extract

**From EditorApp.vue lines 486-606:**
- `isConstant(byte: number): boolean` - Check if value is encoded constant
- `getConstantValue(byte: number): number` - Decode constant value
- `analyzeSkipSourceCondition(row: RowLike): boolean | null` - Evaluate skip source condition
- `analyzeSkipDestCondition(row: RowLike): boolean | null` - Evaluate skip destination condition
- `isRowSkipped(row: RowLike): boolean` - Determine if row should skip execution

#### Dependencies

**Input:**
- `mappingDocument: Ref<MappingDocument>` - for row lookups

**Output:**
- Skip analysis functions (pure, memoized)

#### API Design

```typescript
/**
 * Composable for skip condition analysis
 *
 * Provides functions to evaluate Skip Source and Skip Destination conditions
 * for determining whether a mapping row should be skipped during execution.
 *
 * @param mappingDocument - Reactive reference to the mapping document
 * @returns Skip analysis functions
 */
export interface UseSkipAnalysisReturn {
  /**
   * Check if a row should be skipped based on source and destination conditions
   */
  isRowSkipped: (row: Row, allRows: Row[]) => boolean;

  /**
   * Analyze Skip Source condition (Source Type 11)
   */
  analyzeSkipSourceCondition: (
    row: Row,
    allRows: Row[]
  ) => boolean | null;

  /**
   * Analyze Skip Destination condition (Destination Type 15)
   */
  analyzeSkipDestCondition: (
    row: Row,
    allRows: Row[]
  ) => boolean | null;

  /**
   * Check if a value is an encoded constant (0x8000-0x8FFF)
   */
  isConstant: (value: number) => boolean;

  /**
   * Decode constant value from encoded form
   */
  getConstantValue: (encodedValue: number) => number;
}

export function useSkipAnalysis(
  mappingDocument: Ref<MappingDocument>
): UseSkipAnalysisReturn {
  // Implementation with memoization cache
  const skipCache = new Map<number, boolean>();

  // Watch document changes to invalidate cache
  watch(mappingDocument, () => {
    skipCache.clear();
  }, { deep: true });

  // ... pure function implementations

  return {
    isRowSkipped,
    analyzeSkipSourceCondition,
    analyzeSkipDestCondition,
    isConstant,
    getConstantValue
  };
}
```

#### Implementation Details

**Memoization Strategy:**
```typescript
const skipCache = new Map<number, boolean>();

function isRowSkipped(row: Row, allRows: Row[]): boolean {
  const cacheKey = row.hashCode(); // Use row index or hash

  if (skipCache.has(cacheKey)) {
    return skipCache.get(cacheKey)!;
  }

  const result = computeSkipStatus(row, allRows);
  skipCache.set(cacheKey, result);
  return result;
}
```

**Cache Invalidation:**
```typescript
watch(mappingDocument, () => {
  skipCache.clear();
}, { deep: true });
```

#### Testing Strategy

```typescript
describe('useSkipAnalysis', () => {
  it('detects skip when source condition is true', () => {
    const doc = createTestDocument();
    const row = createSkipSourceRow(10, '>', 5); // Variable 10 > 5
    doc.variables[10].value = 8; // Set variable value > 5

    const { analyzeSkipSourceCondition } = useSkipAnalysis(ref(doc));

    expect(analyzeSkipSourceCondition(row, doc.rows)).toBe(true);
  });

  it('detects constant encoding', () => {
    const { isConstant, getConstantValue } = useSkipAnalysis(ref(new MappingDocument()));

    expect(isConstant(0x8000)).toBe(true);
    expect(isConstant(0x7FFF)).toBe(false);
    expect(getConstantValue(0x8005)).toBe(5);
  });

  it('caches skip analysis results', () => {
    const doc = createTestDocument();
    const { isRowSkipped } = useSkipAnalysis(ref(doc));

    const row = doc.rows[0];
    const result1 = isRowSkipped(row, doc.rows);
    const result2 = isRowSkipped(row, doc.rows);

    expect(result1).toBe(result2); // Same result
    // Verify cache was used (spy on computation)
  });
});
```

#### Files Created

- `editor/src/composables/useSkipAnalysis.ts` (~200 lines)
- `editor/src/composables/__tests__/useSkipAnalysis.test.ts` (~150 lines)

---

### Phase B.2: useRowSelection (~6-7 hours) **UPDATED 2026-02-04**

**Purpose:** Extract enhanced row selection state machine with 3-click cycle and sticky comment state.

**⚠️ COMPLEXITY INCREASED:** Recent additions (+80 lines) include three-click cycle logic and sticky comment state preservation when switching rows.

#### Functions to Extract

**From EditorApp.vue lines 55-57, 427-544, 661-670:**
- `selectedRowIndices: Ref<Set<number>>`
- `lastClickedRowIndex: Ref<number | null>`
- `expandedCommentRowIndex: Ref<number | null>` **NEW 2026-02-04**
- `handleRowClick(rowIndex: number, event: MouseEvent)` - **Enhanced** with 3-click cycle + sticky state
- `handleScrollToRow(rowIndex: number)` **NEW 2026-02-04**
- `clearRowSelection()`
- `isRowSelected(rowIndex: number): boolean`
- `sortedSelectedIndices: ComputedRef<number[]>`
- `canMoveUp: ComputedRef<boolean>`
- `canMoveDown: ComputedRef<boolean>`

#### Dependencies

**Input:** None (self-contained state)

**Output:**
- Selection state
- Selection event handlers

#### API Design

```typescript
export interface UseRowSelectionReturn {
  // State
  selectedRowIndices: Readonly<Ref<Set<number>>>;
  lastClickedRowIndex: Readonly<Ref<number | null>>;

  // Computed
  sortedSelectedIndices: ComputedRef<number[]>;
  canMoveUp: ComputedRef<boolean>;
  canMoveDown: ComputedRef<boolean>;
  singleSelection: ComputedRef<number | null>;
  hasSelection: ComputedRef<boolean>;

  // Actions
  handleRowClick: (rowIndex: number, event: MouseEvent) => void;
  clearSelection: () => void;
  isSelected: (rowIndex: number) => boolean;
  selectRow: (rowIndex: number) => void;
  selectRange: (start: number, end: number) => void;
  toggleRow: (rowIndex: number) => void;
}

export function useRowSelection(options?: {
  maxRows?: number;
}): UseRowSelectionReturn {
  const maxRows = options?.maxRows ?? 70;

  const selectedRowIndices = ref<Set<number>>(new Set());
  const lastClickedRowIndex = ref<number | null>(null);

  // ... implementation
}
```

#### Implementation Details

**Multi-select Logic:**
```typescript
function handleRowClick(rowIndex: number, event: MouseEvent): void {
  if (event.shiftKey && lastClickedRowIndex.value !== null) {
    // Range selection
    selectRange(lastClickedRowIndex.value, rowIndex);
  } else if (event.ctrlKey || event.metaKey) {
    // Toggle selection
    toggleRow(rowIndex);
  } else {
    // Single selection (clear others)
    clearSelection();
    selectRow(rowIndex);
  }

  lastClickedRowIndex.value = rowIndex;
}
```

#### Testing Strategy

```typescript
describe('useRowSelection', () => {
  it('single-clicks select one row', () => {
    const { handleRowClick, isSelected } = useRowSelection();

    handleRowClick(5, { shiftKey: false, ctrlKey: false } as MouseEvent);

    expect(isSelected(5)).toBe(true);
    expect(isSelected(4)).toBe(false);
  });

  it('shift-click selects range', () => {
    const { handleRowClick, sortedSelectedIndices } = useRowSelection();

    handleRowClick(5, { shiftKey: false, ctrlKey: false } as MouseEvent);
    handleRowClick(10, { shiftKey: true, ctrlKey: false } as MouseEvent);

    expect(sortedSelectedIndices.value).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it('ctrl-click toggles rows', () => {
    const { handleRowClick, isSelected } = useRowSelection();

    handleRowClick(5, { shiftKey: false, ctrlKey: true } as MouseEvent);
    handleRowClick(10, { shiftKey: false, ctrlKey: true } as MouseEvent);
    handleRowClick(5, { shiftKey: false, ctrlKey: true } as MouseEvent);

    expect(isSelected(5)).toBe(false);
    expect(isSelected(10)).toBe(true);
  });
});
```

#### Files Created

- `editor/src/composables/useRowSelection.ts` (~120 lines)
- `editor/src/composables/__tests__/useRowSelection.test.ts` (~100 lines)

---

### Phase B.3: usePanelState (~3-4 hours)

**Purpose:** Centralize panel visibility and expansion state management.

#### State to Extract

**From EditorApp.vue lines 90-127:**
- `settingsPanelExpanded: Ref<boolean>`
- `midiMonitorExpanded: Ref<boolean>`
- `variableMonitorExpanded: Ref<boolean>`
- `selectionToolbarExpanded: Ref<boolean>`
- `logMonitorExpanded: Ref<boolean>`
- `globalDocPanelExpanded: Ref<boolean>`
- `showSelectionToolbar: Ref<boolean>`
- `showMidiMonitor: Ref<boolean>`
- `showVariableMonitor: Ref<boolean>`
- `showLogMonitor: Ref<boolean>`
- `showDescription: Ref<boolean>`

#### API Design

```typescript
interface PanelConfig {
  visible: Ref<boolean>;
  expanded: Ref<boolean>;
  storageKey: string;
}

export interface UsePanelStateReturn {
  // Panel configs
  panels: {
    settings: PanelConfig;
    midiMonitor: PanelConfig;
    variableMonitor: PanelConfig;
    selectionToolbar: PanelConfig;
    logMonitor: PanelConfig;
    globalDoc: PanelConfig;
    description: PanelConfig;
  };

  // Actions
  togglePanel: (key: string) => void;
  setVisible: (key: string, visible: boolean) => void;
  setExpanded: (key: string, expanded: boolean) => void;

  // Computed positions (for vertical stacking)
  calculatePanelTop: (panelKey: string, baseTop: number) => ComputedRef<number>;
}

export function usePanelState(): UsePanelStateReturn {
  // Implementation with localStorage persistence
}
```

#### Implementation Details

**localStorage Persistence:**
```typescript
function createPanelConfig(
  storageKey: string,
  defaultVisible: boolean = false,
  defaultExpanded: boolean = false
): PanelConfig {
  const visible = ref(
    localStorage.getItem(storageKey + '-visible') === 'true' ? true :
    localStorage.getItem(storageKey + '-visible') === 'false' ? false :
    defaultVisible
  );

  const expanded = ref(
    localStorage.getItem(storageKey + '-expanded') === 'true'
  );

  watch(visible, (val) => {
    localStorage.setItem(storageKey + '-visible', String(val));
  });

  watch(expanded, (val) => {
    localStorage.setItem(storageKey + '-expanded', String(val));
  });

  return { visible, expanded, storageKey };
}
```

#### Files Created

- `editor/src/composables/usePanelState.ts` (~150 lines)

---

### Phase B.4: useKeyboardShortcuts (~3-4 hours)

**Purpose:** Extract keyboard event handling and shortcut management.

#### Functions to Extract

**From EditorApp.vue lines 759-872:**
- `handleKeyDown(event: KeyboardEvent)` - Main keyboard event handler

**Shortcuts to support:**
- Delete/Backspace: Clear selected rows
- Ctrl+C: Copy row(s)
- Ctrl+V: Paste row(s)
- Ctrl+X: Cut row(s)
- Ctrl+Z: Undo
- Ctrl+Shift+Z / Ctrl+Y: Redo
- Ctrl+A: Select all rows
- Arrow Up/Down: Navigate rows

#### API Design

```typescript
export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onClear?: () => void;
  onSelectAll?: () => void;
  onNavigate?: (direction: 'up' | 'down') => void;
}

export interface UseKeyboardShortcutsReturn {
  // Setup/cleanup
  enable: () => void;
  disable: () => void;
  isEnabled: Readonly<Ref<boolean>>;

  // Update handlers
  setHandlers: (handlers: Partial<KeyboardShortcutHandlers>) => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options?: {
    enableOnMount?: boolean;
  }
): UseKeyboardShortcutsReturn {
  const isEnabled = ref(options?.enableOnMount ?? true);

  // ... implementation with event listener
}
```

#### Implementation Details

```typescript
function handleKeyDown(event: KeyboardEvent): void {
  // Ignore if typing in input
  const target = event.target as HTMLElement;
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return;
  }

  const ctrl = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;

  switch (event.key) {
    case 'z':
      if (ctrl && shift) {
        handlers.onRedo?.();
        event.preventDefault();
      } else if (ctrl) {
        handlers.onUndo?.();
        event.preventDefault();
      }
      break;

    case 'c':
      if (ctrl) {
        handlers.onCopy?.();
        event.preventDefault();
      }
      break;

    // ... other shortcuts
  }
}
```

#### Files Created

- `editor/src/composables/useKeyboardShortcuts.ts` (~120 lines)

---

### Phase B.5: useSerialization (~3-4 hours)

**Purpose:** Extract document serialization/deserialization logic for caching.

#### Functions to Extract

**From EditorApp.vue lines 250-365:**
- `serializeDocument(): CachedMapping`
- `deserializeToDocument(cached: CachedMapping): void`
- `scheduleCacheSave(): void`

#### API Design

```typescript
export interface SerializedMapping {
  rows: any[]; // Serialized row data
  variables: any[]; // Serialized variable data
  globalComment?: string;
  author?: string;
  version?: string;
  rowColors: Record<number, string>;
  rowComments: Record<number, string>;
}

export interface UseSerializationReturn {
  /**
   * Serialize mapping document to plain object
   */
  serialize: (
    document: MappingDocument,
    metadata: {
      rowColors?: Map<number, string> | Record<number, string>;
      rowComments?: Record<number, string>;
    }
  ) => SerializedMapping;

  /**
   * Deserialize plain object back to mapping document
   */
  deserialize: (
    serialized: SerializedMapping,
    targetDocument?: MappingDocument
  ) => {
    document: MappingDocument;
    rowColors: Map<number, string>;
    rowComments: Record<number, string>;
  };
}

export function useSerialization(): UseSerializationReturn {
  // Pure serialization functions
}
```

#### Implementation Details

**Serialization:**
```typescript
function serialize(
  document: MappingDocument,
  metadata: { rowColors?: Map<number, string>; rowComments?: Record<number, string> }
): SerializedMapping {
  return {
    rows: document.rows.map(row => ({
      sourceType: row.source.type,
      sourceFunction: row.source.function,
      sourceExtra: row.source.extra,
      destType: row.destination.type,
      destFunction: row.destination.function,
      destExtra: row.destination.extra
    })),
    variables: document.variables.map(v => ({
      name: v.name,
      value: v.value
    })),
    globalComment: document.globalComment,
    author: document.author,
    version: document.version,
    rowColors: metadata.rowColors instanceof Map
      ? Object.fromEntries(metadata.rowColors)
      : (metadata.rowColors ?? {}),
    rowComments: metadata.rowComments ?? {}
  };
}
```

#### Files Created

- `editor/src/composables/useSerialization.ts` (~150 lines)
- `editor/src/composables/__tests__/useSerialization.test.ts` (~100 lines)

---

### Phase B.6: useFileHandling (~4-5 hours) ⚠️ HIGH RISK

**Purpose:** Extract file import/export logic with validation and error handling.

#### Functions to Extract

**From EditorApp.vue lines 872-1075, 1246-1294:**
- `readFile(): Promise<void>` - File input handler
- `reset()` - Reset document to empty state
- `downloadFile(blob: Blob, fileName: string)` - Browser download trigger
- `downloadHtml()` - Export to HTML
- `downloadMarkdown(useAbbrs: boolean)` - Export to Markdown
- `downloadJson()` - Export to JSON
- `downloadMap()` - Export to binary .MAP

#### API Design

```typescript
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UseFileHandlingReturn {
  // State
  isLoading: Readonly<Ref<boolean>>;
  lastError: Readonly<Ref<string | null>>;

  // Import
  importFile: (file: File) => Promise<MappingDocument | null>;
  validateFile: (file: File) => Promise<FileValidationResult>;
  detectFormat: (file: File) => Promise<'map' | 'json' | 'unknown'>;

  // Export
  exportToJson: (
    document: MappingDocument,
    metadata: EditorMetadata
  ) => Blob;
  exportToHtml: (document: MappingDocument) => Blob;
  exportToMarkdown: (
    document: MappingDocument,
    useAbbrs: boolean
  ) => Blob;
  exportToMap: (document: MappingDocument) => Blob;

  // Helpers
  downloadBlob: (blob: Blob, fileName: string) => void;
  resetDocument: () => MappingDocument;
}

export function useFileHandling(): UseFileHandlingReturn {
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);

  // ... implementation
}
```

#### Implementation Details

**Critical: Binary Format Validation**
```typescript
async function importFile(file: File): Promise<MappingDocument | null> {
  isLoading.value = true;
  lastError.value = null;

  try {
    const format = await detectFormat(file);

    if (format === 'map') {
      return await importMapFile(file);
    } else if (format === 'json') {
      return await importJsonFile(file);
    } else {
      throw new Error('Unknown file format');
    }
  } catch (error) {
    lastError.value = error.message;
    return null;
  } finally {
    isLoading.value = false;
  }
}

async function importMapFile(file: File): Promise<MappingDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Validate .MAP format (must be exactly 1502 bytes)
  if (uint8Array.length !== 1502) {
    throw new Error(`Invalid .MAP file: Expected 1502 bytes, got ${uint8Array.length}`);
  }

  // Parse using existing parser
  return MappingDocumentParser.parse(uint8Array);
}
```

**Export Safety:**
```typescript
function exportToMap(document: MappingDocument): Blob {
  try {
    const blob = toBlob(document);

    // Verify blob is exactly 1502 bytes
    if (blob.size !== 1502) {
      throw new Error(`Export integrity check failed: Expected 1502 bytes, got ${blob.size}`);
    }

    return blob;
  } catch (error) {
    throw new Error(`MAP export failed: ${error.message}`);
  }
}
```

#### Testing Strategy - CRITICAL

**Automated Export Regression Tests:**
```typescript
describe('useFileHandling - Export Integrity', () => {
  it('round-trip .MAP preserves all row data', async () => {
    const original = createTestMapping();
    const { exportToMap, importFile } = useFileHandling();

    // Export
    const blob = exportToMap(original);
    expect(blob.size).toBe(1502);

    // Import
    const file = new File([blob], 'test.map');
    const imported = await importFile(file);

    // Verify all rows match
    expect(imported!.rows).toEqual(original.rows);
    expect(imported!.variables).toEqual(original.variables);
  });

  it('round-trip .JSON preserves metadata', async () => {
    const original = createTestMapping();
    const metadata = {
      rowColors: { 0: 'red', 5: 'blue' },
      rowComments: { 0: 'test comment' }
    };

    const { exportToJson, importFile } = useFileHandling();

    // Export
    const blob = exportToJson(original, metadata);

    // Import
    const file = new File([blob], 'test.json');
    const result = await importFile(file);

    // Verify metadata preserved
    const json = JSON.parse(await blob.text());
    expect(json.editorMetadata.rowColors).toEqual(metadata.rowColors);
    expect(json.editorMetadata.rowComments).toEqual(metadata.rowComments);
  });

  it('backward compatibility with old JSON format', async () => {
    const oldJson = {
      header: { /* ... */ },
      rows: [ /* ... */ ],
      variables: [ /* ... */ ]
      // No editorMetadata field
    };

    const { importFile } = useFileHandling();
    const blob = new Blob([JSON.stringify(oldJson)], { type: 'application/json' });
    const file = new File([blob], 'old.json');

    const result = await importFile(file);

    expect(result).not.toBeNull();
    expect(result!.rows.length).toBe(70);
  });
});
```

**Manual Test Checklist (REQUIRED before PR merge):**
- [ ] Import .MAP → all 70 rows loaded correctly
- [ ] Import .JSON (new format) → metadata restored
- [ ] Import .JSON (old format) → backward compatible
- [ ] Export .MAP → exactly 1502 bytes
- [ ] Export .JSON → valid JSON schema
- [ ] Export HTML → renders correctly
- [ ] Export Markdown → correct format

#### Files Created

- `editor/src/composables/useFileHandling.ts` (~350 lines)
- `editor/src/composables/__tests__/useFileHandling.test.ts` (~200 lines)
- `tests/export-regression.test.ts` (~150 lines) - **CRITICAL**

---

### Phase B.7: useRowMetadata (~3-4 hours)

**Purpose:** Extract row color and comment management.

#### State to Extract

**From EditorApp.vue lines 66-69, 745-754:**
- `rowComments: Ref<Record<number, string>>`
- `rowColors: Ref<Map<number, string>>`
- `setRowColor(color: string | null)`
- `getRowBackgroundColor(rowIndex: number): string | undefined`

#### API Design

```typescript
export interface UseRowMetadataReturn {
  // State
  rowColors: Ref<Map<number, string>>;
  rowComments: Ref<Record<number, string>>;

  // Actions
  setRowColor: (rowIndex: number, color: string | null) => void;
  setRowComment: (rowIndex: number, comment: string) => void;
  clearRowColor: (rowIndex: number) => void;
  clearRowComment: (rowIndex: number) => void;

  // Queries
  getRowColor: (rowIndex: number) => string | undefined;
  getRowComment: (rowIndex: number) => string | undefined;
  hasColor: (rowIndex: number) => boolean;
  hasComment: (rowIndex: number) => boolean;

  // Bulk operations
  setMultipleColors: (indices: number[], color: string) => void;
  clearAllColors: () => void;
  clearAllComments: () => void;

  // Serialization helpers
  exportColors: () => Record<number, string>;
  exportComments: () => Record<number, string>;
  importColors: (colors: Record<number, string>) => void;
  importComments: (comments: Record<number, string>) => void;
}

export function useRowMetadata(): UseRowMetadataReturn {
  const rowColors = ref<Map<number, string>>(new Map());
  const rowComments = ref<Record<number, string>>({});

  // ... implementation
}
```

#### Implementation Details

```typescript
function setRowColor(rowIndex: number, color: string | null): void {
  if (color === null) {
    rowColors.value.delete(rowIndex);
  } else {
    rowColors.value.set(rowIndex, color);
  }
}

function setMultipleColors(indices: number[], color: string): void {
  indices.forEach(index => {
    rowColors.value.set(index, color);
  });
}

function exportColors(): Record<number, string> {
  return Object.fromEntries(rowColors.value);
}

function importColors(colors: Record<number, string>): void {
  rowColors.value = new Map(Object.entries(colors).map(([k, v]) => [Number(k), v]));
}
```

#### Files Created

- `editor/src/composables/useRowMetadata.ts` (~150 lines)

---

## Integration Plan

### EditorApp.vue After Extraction

**New Structure (~400 script lines):**

```vue
<script setup lang="ts">
// ========================================
// IMPORTS (50 lines)
// ========================================
import { ref, computed, watch, onMounted } from 'vue';
import { MappingDocument } from '@/modules/documentModel';

// New composables (6)
import { useSkipAnalysis } from '@/composables/useSkipAnalysis';
import { useRowSelection } from '@/composables/useRowSelection';
import { usePanelState } from '@/composables/usePanelState';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { useSerialization } from '@/composables/useSerialization';
import { useFileHandling } from '@/composables/useFileHandling';
import { useRowMetadata } from '@/composables/useRowMetadata';

// Existing composables
import { useClipboard } from '@/composables/useClipboard';
import { useStaticAnalyzer } from '@/composables/useStaticAnalyzer';
import { useActionHistory } from '@/composables/useActionHistory';
import { useMappingCache } from '@/composables/useMappingCache';
import { useMidi } from '@/composables/useMidi';

// Components
import BasePanel from './BasePanel.vue';
import SettingsPanel from './SettingsPanel.vue';
// ... etc

// ========================================
// CORE STATE (40 lines)
// ========================================
const mappingDocument = ref(new MappingDocument());
const fileInput = ref<HTMLInputElement | null>(null);
const currentlySelectedSourceTypes = ref(new Array<MappingType>());
const currentlySelectedDestinationTypes = ref(new Array<MappingType>());
const toastNotifications = ref<InstanceType<typeof ToastNotifications> | null>(null);
const displayRowIndexAsHex = ref(false);

// ========================================
// COMPOSABLES INITIALIZATION (120 lines)
// ========================================

// Skip analysis
const {
  isRowSkipped,
  analyzeSkipSourceCondition,
  analyzeSkipDestCondition
} = useSkipAnalysis(mappingDocument);

// Row selection
const {
  selectedRowIndices,
  lastClickedRowIndex,
  handleRowClick,
  clearSelection: clearRowSelection,
  isSelected: isRowSelected,
  sortedSelectedIndices,
  canMoveUp,
  canMoveDown,
  singleSelection: selectedRowIndex
} = useRowSelection({ maxRows: 70 });

// Panel state
const {
  panels,
  togglePanel,
  setVisible,
  setExpanded
} = usePanelState();

// Keyboard shortcuts
const {
  enable: enableKeyboardShortcuts,
  disable: disableKeyboardShortcuts
} = useKeyboardShortcuts({
  onUndo: () => undo(),
  onRedo: () => redo(),
  onCopy: () => handleMultiCopy(),
  onPaste: () => handleMultiPaste(),
  onCut: () => handleMultiCut(),
  onClear: () => handleMultiClear(),
  onSelectAll: () => selectAllRows()
});

// Serialization
const { serialize, deserialize } = useSerialization();

// File handling
const {
  importFile,
  exportToJson,
  exportToHtml,
  exportToMarkdown,
  exportToMap,
  downloadBlob,
  resetDocument
} = useFileHandling();

// Row metadata
const {
  rowColors,
  rowComments,
  setRowColor,
  setRowComment,
  getRowColor,
  setMultipleColors
} = useRowMetadata();

// Existing composables (clipboard, cache, analyzer, etc.)
const { copyRow, pasteRow, moveRows } = useClipboard(
  mappingDocument,
  rowComments
);

const {
  activeSlot,
  switchToSlot,
  isLockedA,
  isLockedB,
  toggleLock
} = useMappingCache({
  serialize: () => serialize(mappingDocument.value, { rowColors, rowComments }),
  deserialize: (data) => {
    const result = deserialize(data);
    mappingDocument.value = result.document;
    rowColors.value = result.rowColors;
    rowComments.value = result.rowComments;
  }
});

const { analyze, warnings } = useStaticAnalyzer(
  mappingDocument,
  displayRowIndexAsHex
);

const { undo, redo, canUndo, canRedo, executeCommand } = useActionHistory({
  activeSlot,
  isLockedA,
  isLockedB,
  context: { mappingDocument, rowColors, rowComments }
});

// ========================================
// SELECTION CHANGE HANDLERS (130 lines)
// ========================================
function sourceTypeSelectionChanged(event: Event, rowIndex: number) {
  const target = event.target as HTMLSelectElement;
  const newValue = parseInt(target.value);

  executeCommand(
    new UpdateSourceTypeCommand(mappingDocument.value.rows[rowIndex], newValue)
  );
}

function sourceFunctionSelectionChanged(event: Event, rowIndex: number) {
  // ... similar pattern
}

function sourceExtraSelectionChanged(event: Event, rowIndex: number) {
  // ... similar pattern
}

function destinationTypeSelectionChanged(event: Event, rowIndex: number) {
  // ... similar pattern
}

function destinationFunctionSelectionChanged(event: Event, rowIndex: number) {
  // ... similar pattern
}

function destinationExtraSelectionChanged(event: Event, rowIndex: number) {
  // ... similar pattern
}

// ========================================
// MULTI-ROW OPERATIONS (60 lines)
// ========================================
function handleMultiCopy(): void {
  if (sortedSelectedIndices.value.length > 0) {
    copyRow(sortedSelectedIndices.value[0]);
    showToast(`Copied ${sortedSelectedIndices.value.length} row(s)`, 'success');
  }
}

function handleMultiPaste(): void {
  if (sortedSelectedIndices.value.length > 0) {
    pasteRow(sortedSelectedIndices.value[0]);
    showToast('Pasted', 'success');
  }
}

function handleMultiCut(): void {
  handleMultiCopy();
  handleMultiClear();
}

function handleMultiClear(): void {
  if (isLockedA.value && activeSlot.value === 'A') return;
  if (isLockedB.value && activeSlot.value === 'B') return;

  sortedSelectedIndices.value.forEach(index => {
    mappingDocument.value.rows[index].clear();
  });

  showToast(`Cleared ${sortedSelectedIndices.value.length} row(s)`, 'success');
}

function handleMultiMoveUp(): void {
  const result = moveRows(sortedSelectedIndices.value, 'up');
  handleMoveWarnings(result);
}

function handleMultiMoveDown(): void {
  const result = moveRows(sortedSelectedIndices.value, 'down');
  handleMoveWarnings(result);
}

// ========================================
// HELPERS (50 lines)
// ========================================
function formatRowIndex(index: number): string {
  return displayRowIndexAsHex.value
    ? `0x${index.toString(16).toUpperCase().padStart(2, '0')}`
    : String(index);
}

function showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
  toastNotifications.value?.show(message, type);
}

function updateVariableValue(variableIndex: number, value: number): void {
  mappingDocument.value.variables[variableIndex].value = value;
}

function handleMoveWarnings(result: { updatedCount: number; warnings: Array<{ message: string }> }): void {
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      showToast(warning.message, 'warning', 8000);
    });
  }

  if (result.updatedCount > 0) {
    showToast(`Moved ${result.updatedCount} row(s)`, 'success');
  }
}

// ========================================
// LIFECYCLE (10 lines)
// ========================================
onMounted(() => {
  analyze();
});

async function readFile() {
  const file = fileInput.value?.files?.[0];
  if (!file) return;

  const result = await importFile(file);
  if (result) {
    mappingDocument.value = result.document;
    rowColors.value = result.rowColors;
    rowComments.value = result.rowComments;
    analyze();
    showToast('File loaded successfully', 'success');
  }
}

function reset() {
  if (isLockedA.value && activeSlot.value === 'A') return;
  if (isLockedB.value && activeSlot.value === 'B') return;

  if (confirm('Reset all mappings?')) {
    mappingDocument.value = resetDocument();
    rowColors.value.clear();
    rowComments.value = {};
    clearRowSelection();
    analyze();
  }
}

function downloadJson() {
  const blob = exportToJson(mappingDocument.value, {
    rowColors: rowColors.value,
    rowComments: rowComments.value
  });
  downloadBlob(blob, 'mapping.json');
}

function downloadMap() {
  const blob = exportToMap(mappingDocument.value);
  downloadBlob(blob, 'mapping.map');
}

function downloadHtml() {
  const blob = exportToHtml(mappingDocument.value);
  downloadBlob(blob, 'mapping.html');
}

function downloadMarkdown(useAbbrs: boolean = false) {
  const blob = exportToMarkdown(mappingDocument.value, useAbbrs);
  downloadBlob(blob, 'mapping.md');
}
</script>

<template>
  <!-- Template remains largely unchanged (830 lines) -->
  <!-- But now uses composable state instead of local state -->
</template>
```

**Line Count Breakdown:**

| Section | Lines | Notes |
|---------|-------|-------|
| Imports | 50 | Composable imports |
| Core State | 40 | Minimal local state |
| Composable Init | 120 | Initialize all composables |
| Selection Handlers | 130 | Source/dest change handlers |
| Multi-row Operations | 60 | Copy/paste/move |
| Helpers | 50 | Format, toast, etc. |
| Lifecycle | 10 | onMounted, readFile, reset |
| **Total Script** | **~460 lines** | (down from 1,300) |
| Template | 830 | (unchanged) |
| **Grand Total** | **~1,290 lines** | (down from 2,130) |

---

## Testing Requirements

### 1. Automated Export Regression Tests (CRITICAL)

**File:** `tests/export-regression.test.ts`

**MUST PASS before merging PR #3 (File I/O extraction)**

```typescript
import { describe, it, expect } from 'vitest';
import { MappingDocument } from '../editor/src/modules/documentModel';
import { MappingDocumentParser } from '../editor/src/modules/parsers';
import { toBlob, toJson } from '../editor/src/modules/formatters';

describe('Export Regression Tests', () => {
  function createTestMapping(): MappingDocument {
    const doc = new MappingDocument();

    // Set up test data
    doc.rows[0].source.type = 1; // CV
    doc.rows[0].source.function = 5;
    doc.rows[0].source.extra = 100;
    doc.rows[0].destination.type = 2; // Trigger
    doc.rows[0].destination.function = 3;
    doc.rows[0].destination.extra = 200;

    doc.variables[0].name = 'A';
    doc.variables[0].value = 1234;

    return doc;
  }

  it('round-trip .MAP preserves all row data', async () => {
    const original = createTestMapping();

    // Export to .MAP
    const mapBlob = toBlob(original);
    expect(mapBlob.size).toBe(1502);

    // Parse back
    const uint8Array = new Uint8Array(await mapBlob.arrayBuffer());
    const parsed = MappingDocumentParser.parse(uint8Array);

    // Verify all fields
    expect(parsed.rows[0].source.type).toBe(original.rows[0].source.type);
    expect(parsed.rows[0].source.function).toBe(original.rows[0].source.function);
    expect(parsed.rows[0].source.extra).toBe(original.rows[0].source.extra);
    expect(parsed.rows[0].destination.type).toBe(original.rows[0].destination.type);
    expect(parsed.rows[0].destination.function).toBe(original.rows[0].destination.function);
    expect(parsed.rows[0].destination.extra).toBe(original.rows[0].destination.extra);

    expect(parsed.variables[0].value).toBe(original.variables[0].value);
  });

  it('round-trip .JSON preserves metadata', () => {
    const original = createTestMapping();
    original.globalComment = 'Test comment';
    original.author = 'Test Author';

    const metadata = {
      rowColors: { 0: 'red', 5: 'blue' },
      rowComments: { 0: 'test row comment' }
    };

    // Export to JSON
    const jsonString = toJson(original, metadata);
    const parsed = JSON.parse(jsonString);

    // Verify metadata
    expect(parsed.editorMetadata.rowColors).toEqual(metadata.rowColors);
    expect(parsed.editorMetadata.rowComments).toEqual(metadata.rowComments);
    expect(parsed.editorMetadata.globalComment).toBe('Test comment');
    expect(parsed.editorMetadata.author).toBe('Test Author');
  });

  it('backward compatibility: old JSON format without metadata', () => {
    const oldJson = {
      header: { version: 1 },
      rows: Array(70).fill(null).map(() => ({
        sourceType: 0,
        sourceFunction: 0,
        sourceExtra: 0,
        destType: 0,
        destFunction: 0,
        destExtra: 0
      })),
      variables: Array(16).fill(null).map(() => ({
        name: 'A',
        value: 0
      }))
      // No editorMetadata field
    };

    // Should not throw
    expect(() => {
      // Parse logic here
      const parsed = JSON.parse(JSON.stringify(oldJson));
      expect(parsed.rows.length).toBe(70);
    }).not.toThrow();
  });

  it('exports exactly 1502 bytes for .MAP files', () => {
    const doc = new MappingDocument();
    const blob = toBlob(doc);

    expect(blob.size).toBe(1502);
  });
});
```

**Run command:**
```bash
npm run test -- export-regression.test.ts
```

### 2. Composable Unit Tests

**Priority Levels:**
- **HIGH:** useSkipAnalysis, useFileHandling (complex logic, critical paths)
- **MEDIUM:** useRowSelection, useSerialization (state machines, data transformation)
- **LOW:** usePanelState, useRowMetadata (simple state management)

**Test Coverage Target:** >80% for HIGH priority composables

### 3. Manual Regression Checklist

**MUST COMPLETE before final PR merge:**

#### File Operations
- [ ] Import .MAP file → all 70 rows loaded correctly
- [ ] Import .JSON (new format with metadata) → colors/comments restored
- [ ] Import .JSON (old format without metadata) → backward compatible
- [ ] Export .MAP → exactly 1502 bytes, correct binary data
- [ ] Export .JSON → valid JSON schema, includes metadata
- [ ] Export HTML → renders correctly in browser
- [ ] Export Markdown → correct format, readable

#### Core Functionality
- [ ] Static analyzer → warnings generated for read-before-write, conflicts
- [ ] Static analyzer → respects hex/decimal display setting
- [ ] Multi-row copy → copies all selected rows
- [ ] Multi-row paste → pastes to all selected rows
- [ ] Multi-row move up/down → respects row order, updates references
- [ ] Multi-row clear → clears all selected rows
- [ ] Multi-row color → applies color to all selected rows

#### Cache & Slots
- [ ] Slot A/B switching → cache persists document state
- [ ] Slot A lock → prevents all modifications when active
- [ ] Slot B lock → prevents all modifications when active
- [ ] Cache restore on page load → A/B slots restored from IndexedDB

#### Keyboard Shortcuts
- [ ] Ctrl+C → copies row(s)
- [ ] Ctrl+V → pastes row(s)
- [ ] Ctrl+X → cuts row(s)
- [ ] Delete/Backspace → clears row(s), respects lock
- [ ] Ctrl+Z → undo (if implemented)
- [ ] Ctrl+Shift+Z → redo (if implemented)
- [ ] Arrow keys → navigate rows

#### MIDI Learn
- [ ] MIDI learn mode → captures channel and CC correctly
- [ ] MIDI learn timeout → cancels after 10 seconds
- [ ] MIDI monitor → displays incoming messages

#### UI State
- [ ] Row colors → persist across save/load
- [ ] Row comments → persist across save/load
- [ ] Panel expanded states → persist in localStorage
- [ ] Panel visibility → persists in localStorage
- [ ] Row selection → shift-click range select works
- [ ] Row selection → ctrl-click toggle works

---

## Git Strategy

### Branch Structure

```
main
  └─ refactor/editor-extraction
       ├─ refactor/b1-skip-analysis        (PR #1)
       ├─ refactor/b2-row-selection        (PR #1)
       ├─ refactor/b3-panel-state          (PR #2)
       ├─ refactor/b4-keyboard             (PR #2)
       ├─ refactor/b5-serialization        (PR #3)
       ├─ refactor/b6-file-handling        (PR #3) ⚠️ HIGH RISK
       └─ refactor/b7-row-metadata         (PR #4)
```

### Incremental PR Strategy

#### PR #1: Foundation (B.1 + B.2)
**Files:** useSkipAnalysis + useRowSelection
**Lines Extracted:** ~230 lines
**Risk:** LOW
**Review Time:** 1-2 hours

**Checklist:**
- [ ] Tests passing (skip analysis, row selection)
- [ ] EditorApp imports new composables
- [ ] TypeScript strict mode compliant
- [ ] No functionality changes

**Merge Criteria:**
- ✅ All tests passing
- ✅ Code review approved
- ✅ Manual smoke test (skip analysis works, row selection works)

---

#### PR #2: UI State (B.3 + B.4)
**Files:** usePanelState + useKeyboardShortcuts
**Lines Extracted:** ~220 lines
**Risk:** LOW
**Review Time:** 1 hour

**Checklist:**
- [ ] Panel visibility persists in localStorage
- [ ] Keyboard shortcuts work correctly
- [ ] All shortcuts respect lock state

**Merge Criteria:**
- ✅ Panel state tests passing
- ✅ Manual keyboard shortcut verification
- ✅ Code review approved

---

#### PR #3: Data Layer (B.5 + B.6) ⚠️ CRITICAL
**Files:** useSerialization + useFileHandling
**Lines Extracted:** ~450 lines
**Risk:** HIGH (data integrity, backward compatibility)
**Review Time:** 2-3 hours

**CRITICAL REQUIREMENT:** Export regression tests MUST pass before merge.

**Checklist:**
- [ ] Export regression tests implemented
- [ ] All export regression tests passing
- [ ] Round-trip .MAP → no data loss
- [ ] Round-trip .JSON → metadata preserved
- [ ] Backward compatibility with old JSON
- [ ] Manual file import/export verification

**Merge Criteria:**
- ✅ **Export regression tests passing (MANDATORY)**
- ✅ Manual regression checklist complete
- ✅ Code review by 2+ reviewers
- ✅ No breaking changes to .MAP format

**Rollback Plan:**
```bash
git tag pre-file-io-extraction   # Create safety tag before merge
# If issues detected:
git revert <pr-merge-commit>
```

---

#### PR #4: Metadata (B.7)
**Files:** useRowMetadata
**Lines Extracted:** ~120 lines
**Risk:** MEDIUM
**Review Time:** 1-2 hours

**Checklist:**
- [ ] Row colors persist across save/load
- [ ] Row comments persist across save/load
- [ ] Color/comment state integrates with cache

**Merge Criteria:**
- ✅ Metadata tests passing
- ✅ Manual verification of color/comment persistence
- ✅ Code review approved

---

#### PR #5: Feature Branch → Main
**Final Integration**
**Risk:** LOW (all incremental PRs tested)
**Review Time:** 1 hour

**Checklist:**
- [ ] All previous PRs merged to feature branch
- [ ] Full manual regression checklist complete
- [ ] No regressions detected
- [ ] Performance acceptable (no slowdowns)

**Merge Criteria:**
- ✅ All manual tests passing
- ✅ All automated tests passing
- ✅ Final code review
- ✅ User acceptance testing (if applicable)

---

### Rollback Strategy

**Pre-extraction Tags:**
```bash
git tag pre-skip-extraction         # Before B.1
git tag pre-panel-extraction        # Before B.3
git tag pre-file-io-extraction      # Before B.5/B.6 (CRITICAL)
git tag pre-metadata-extraction     # Before B.7
```

**If Extraction Fails:**
```bash
# Rollback to last known good state
git reset --hard pre-file-io-extraction

# Or revert specific PR
git revert <pr-merge-commit-hash>
```

**Emergency Rollback (Production Issue):**
```bash
# Immediately revert feature branch merge
git revert <feature-branch-merge-commit>
git push origin main

# Investigate in separate branch
git checkout -b hotfix/investigate-issue
```

---

## Timeline

### Week 1: Foundation & UI (22-26 hours)

**Day 0 (2 hours):**
- Setup export regression test framework
- Create test utilities and fixtures

**Days 1-2 (8-10 hours):**
- **B.1:** useSkipAnalysis (4-5h)
  - Extract functions
  - Add memoization
  - Write tests
- **B.2:** useRowSelection (4-5h)
  - Extract state machine
  - Write tests
  - Update EditorApp
- **PR #1:** Submit for review

**Day 3 (6-8 hours):**
- **B.3:** usePanelState (3-4h)
  - Extract panel configs
  - localStorage persistence
- **B.4:** useKeyboardShortcuts (3-4h)
  - Extract event handler
  - Wire up shortcuts
- **PR #2:** Submit for review

### Week 2: Data Layer & Integration (10-15 hours)

**Days 4-5 (7-9 hours):**
- **B.5:** useSerialization (3-4h)
  - Extract serialize/deserialize
  - Write round-trip tests
- **B.6:** useFileHandling (4-5h)
  - Extract file I/O
  - **CRITICAL:** Run export regression tests
  - Fix any issues
- **PR #3:** Submit for review (REQUIRES export tests passing)

**Day 6 (3-4 hours):**
- **B.7:** useRowMetadata (3-4h)
  - Extract colors/comments
  - Integration with serialization
- **PR #4:** Submit for review

**Day 7 (3-4 hours):**
- Full integration testing
- Manual regression checklist
- Performance testing
- **PR #5:** Feature branch → main

---

### Total Effort Estimate

| Phase | Effort | Timeline | Risk |
|-------|--------|----------|------|
| Setup (export tests) | 2h | Day 0 | LOW |
| B.1-B.2 (Foundation) | 8-10h | Days 1-2 | LOW |
| B.3-B.4 (UI State) | 6-8h | Day 3 | LOW |
| B.5-B.6 (Data Layer) | 7-9h | Days 4-5 | HIGH |
| B.7 (Metadata) | 3-4h | Day 6 | MEDIUM |
| Integration Testing | 3-4h | Day 7 | LOW |
| **Total** | **29-37 hours** | **~6-7 days** | |

**Buffer:** 20% (6-7 hours) for unexpected issues → **35-44 hours total**

---

## Risk Assessment

| Risk | Level | Impact | Mitigation | Contingency |
|------|-------|--------|------------|-------------|
| **Data Integrity Loss** | HIGH | CRITICAL | Automated export tests (MANDATORY) | Rollback to pre-extraction tag |
| **Backward Compatibility** | HIGH | HIGH | Test old JSON formats, .MAP validation | Version migration scripts |
| **Integration Bugs** | MEDIUM | MEDIUM | Incremental PRs, isolated testing | Revert individual PR |
| **Hidden Dependencies** | MEDIUM | MEDIUM | Extract in dependency order | Add integration tests |
| **Timeline Overrun** | MEDIUM | LOW | 20% buffer, daily progress tracking | Defer B.7 to later |
| **Performance Regression** | LOW | MEDIUM | Memoization, shallow watchers | Profile and optimize |
| **TypeScript Errors** | LOW | LOW | Strict mode from start | Fix before PR |

### Risk Mitigation Checklist

**Before Starting:**
- [ ] Create feature branch: `refactor/editor-extraction`
- [ ] Tag main branch: `pre-editor-modularization`
- [ ] Setup export regression test framework
- [ ] Review CLAUDE.md and REFACTORING_PLAN.md

**Before Each PR:**
- [ ] All tests passing locally
- [ ] TypeScript strict mode compliant
- [ ] Manual smoke test complete
- [ ] Code review checklist ready

**Before PR #3 (File I/O) - CRITICAL:**
- [ ] Export regression tests implemented
- [ ] All export tests passing
- [ ] Manual import/export verification
- [ ] Backward compatibility tested
- [ ] Two reviewers assigned

**Before Final Merge:**
- [ ] All PRs merged to feature branch
- [ ] Full manual regression checklist complete
- [ ] Performance benchmarks acceptable
- [ ] Documentation updated

---

## Success Criteria

### Quantitative Metrics

- [x] EditorApp.vue reduced from **1,300 → ~460 script lines** (65% reduction)
- [ ] **6 new composables** created (useSkipAnalysis, useRowSelection, usePanelState, useKeyboardShortcuts, useSerialization, useFileHandling, useRowMetadata)
- [ ] **Test coverage:** >80% for HIGH priority composables
- [ ] **Export regression tests:** 100% passing
- [ ] **TypeScript errors:** 0
- [ ] **Build warnings:** 0

### Qualitative Criteria

- [ ] All existing functionality preserved (no regressions)
- [ ] No breaking changes to .MAP binary format (backward compatible)
- [ ] Code is more maintainable (smaller files, clear concerns)
- [ ] Code is more testable (composables isolated)
- [ ] Code is more reusable (skip logic, serialization used in debugger)
- [ ] Documentation updated (CLAUDE.md, REFACTORING_PLAN.md)

### User Acceptance Criteria

- [ ] Import .MAP file works as before
- [ ] Import .JSON file works as before (old + new formats)
- [ ] Export all formats works as before
- [ ] All keyboard shortcuts work
- [ ] Multi-row operations work
- [ ] Slot A/B caching works
- [ ] Lock mechanism works
- [ ] Static analyzer works
- [ ] MIDI learn works
- [ ] Panel state persists

---

## Files to Create

### Composables (7 files)

1. `editor/src/composables/useSkipAnalysis.ts` (~200 lines)
2. `editor/src/composables/useRowSelection.ts` (~120 lines)
3. `editor/src/composables/usePanelState.ts` (~150 lines)
4. `editor/src/composables/useKeyboardShortcuts.ts` (~120 lines)
5. `editor/src/composables/useSerialization.ts` (~150 lines)
6. `editor/src/composables/useFileHandling.ts` (~350 lines)
7. `editor/src/composables/useRowMetadata.ts` (~150 lines)

**Total new lines:** ~1,240 lines

### Tests (8 files)

1. `editor/src/composables/__tests__/useSkipAnalysis.test.ts` (~150 lines)
2. `editor/src/composables/__tests__/useRowSelection.test.ts` (~100 lines)
3. `editor/src/composables/__tests__/useSerialization.test.ts` (~100 lines)
4. `editor/src/composables/__tests__/useFileHandling.test.ts` (~200 lines)
5. `tests/export-regression.test.ts` (~150 lines) - **CRITICAL**

**Total test lines:** ~700 lines

---

## Files to Modify

### Major Refactoring

1. `editor/src/components/EditorApp.vue` - **MAJOR** refactoring (~900 lines removed, ~200 added for composable integration)

### Minor Updates

2. `docs/REFACTORING_PLAN.md` - Update Phase 3.6 status, completion criteria
3. `docs/CLAUDE.md` - Add composables to architecture section
4. `editor/src/composables/useClipboard.ts` - May need integration updates
5. `editor/src/composables/useMappingCache.ts` - May need serialization integration updates

---

## Appendix: Detailed Function Mappings

### EditorApp.vue Line-by-Line Extraction Map

**Lines 1-46: Imports**
- **Action:** Update to import new composables
- **Keep:** Component imports, type imports
- **Add:** 6 new composable imports

**Lines 48-216: State Management**
- **Lines 48-54:** Core state → KEEP (mappingDocument, currentlySelectedTypes)
- **Lines 55-56:** Row selection → EXTRACT to useRowSelection
- **Lines 66-69:** Row metadata → EXTRACT to useRowMetadata
- **Lines 72-74:** Toast → KEEP
- **Lines 90-127:** Panel state → EXTRACT to usePanelState
- **Lines 152-153:** Display settings → KEEP

**Lines 250-365: Serialization & Cache**
- **Lines 250-281:** serializeDocument() → EXTRACT to useSerialization
- **Lines 282-363:** deserializeToDocument() → EXTRACT to useSerialization
- **Lines 365-424:** scheduleCacheSave() → KEEP (integrates with useSerialization)

**Lines 427-464: Row Selection**
- **Lines 427-456:** handleRowClick() → EXTRACT to useRowSelection
- **Lines 458-467:** clearRowSelection(), isRowSelected() → EXTRACT to useRowSelection

**Lines 476-606: Skip Analysis**
- **Lines 486-491:** isConstant() → EXTRACT to useSkipAnalysis
- **Lines 493-520:** getConstantValue() → EXTRACT to useSkipAnalysis
- **Lines 522-564:** analyzeSkipSourceCondition() → EXTRACT to useSkipAnalysis
- **Lines 566-604:** analyzeSkipDestCondition() → EXTRACT to useSkipAnalysis
- **Lines 606-659:** isRowSkipped() → EXTRACT to useSkipAnalysis

**Lines 661-670: Selection Helpers**
- **Lines 661-663:** sortedSelectedIndices → EXTRACT to useRowSelection
- **Lines 665-670:** canMoveUp, canMoveDown → EXTRACT to useRowSelection

**Lines 677-754: Multi-row Operations**
- **Lines 677-745:** handleMultiCut/Copy/Paste/Clear/Move → KEEP (uses composables)
- **Lines 745-752:** setRowColor() → EXTRACT to useRowMetadata
- **Lines 754-757:** getRowBackgroundColor() → EXTRACT to useRowMetadata

**Lines 759-872: Keyboard Shortcuts**
- **Lines 759-870:** handleKeyDown() → EXTRACT to useKeyboardShortcuts

**Lines 872-1075: File I/O**
- **Lines 872-1074:** readFile() → EXTRACT to useFileHandling
- **Lines 1076-1094:** reset() → KEEP (uses useFileHandling.resetDocument())

**Lines 1096-1244: Selection Change Handlers**
- **Lines 1096-1244:** All selection changed functions → KEEP (use executeCommand for undo)

**Lines 1246-1294: Export Functions**
- **Lines 1246-1255:** downloadFile() → EXTRACT to useFileHandling
- **Lines 1257-1262:** downloadHtml() → EXTRACT to useFileHandling
- **Lines 1264-1269:** downloadMarkdown() → EXTRACT to useFileHandling
- **Lines 1271-1292:** downloadJson() → EXTRACT to useFileHandling
- **Lines 1294:** downloadMap() → EXTRACT to useFileHandling

---

## Next Steps

Once this modularization is complete:

1. **Phase 0.1 (Debugger):** Clean architecture enables breakpoint insertion, step-through execution
2. **Phase 0.11 (Skip Visualization):** useSkipAnalysis provides skip logic for visual indicators
3. **Phase 0.13 (Simulation):** Composables are testable units for simulation engine
4. **Undo/Redo UI:** useActionHistory already in place, just needs UI integration
5. **Advanced Features:** Clean foundation for complex features on maintainable codebase

---

## Last Updated

**2026-02-01** - Created comprehensive modularization plan for EditorApp.vue with 6 composables, detailed extraction strategy, testing requirements, and risk mitigation.
