import { nextTick, type Ref, type ComputedRef } from 'vue';
import {
  DataModel, type MappingTuple, type MappingType
} from '../modules/dataModel';
import {
  MappingDocument, SourceType, SourceFunction, SourceExtra,
  DestinationType, DestinationFunction, DestinationExtra
} from '../modules/documentModel';
import type { CachedMapping, CacheSlot } from './useMappingCache';

// Pre-indexed lookup tables for O(1) type/function resolution during deserialization.
// Built lazily on first use, then cached for the lifetime of the page.

interface TypeIndex {
  type: MappingType;
  functions: Map<number, MappingTuple>;
}

function buildTypeIndex(types: MappingType[]): Map<number, TypeIndex> {
  const map = new Map<number, TypeIndex>();
  for (const t of types) {
    const funcMap = new Map<number, MappingTuple>();
    for (const f of t.functions) {
      funcMap.set(f.key, f);
    }
    map.set(t.key, { type: t, functions: funcMap });
  }
  return map;
}

let _srcIndex: Map<number, TypeIndex> | null = null;
let _destIndex: Map<number, TypeIndex> | null = null;

function getSourceTypeIndex(): Map<number, TypeIndex> {
  if (!_srcIndex) _srcIndex = buildTypeIndex(DataModel.sourceTypes as MappingType[]);
  return _srcIndex;
}

function getDestTypeIndex(): Map<number, TypeIndex> {
  if (!_destIndex) _destIndex = buildTypeIndex(DataModel.destinationTypes as MappingType[]);
  return _destIndex;
}

interface MappingDocumentLike {
  header: {
    headerText: string;
    majorVersion: number;
    minorVersion: number;
    fileName: string;
  };
  rows: Array<{
    source: { type: { key: number }; function: { key: number }; extra: { keyOrValue: number } };
    destination: { type: { key: number }; function: { key: number }; extra: { keyOrValue: number } };
    unused1: number;
    unused2: number;
    unused3: number;
    unused4: number;
  }>;
  variables: Array<{ value: number }>;
  globalComment?: string;
}

export interface UseDocumentSerializationOptions {
  mappingDocument: Ref<MappingDocumentLike>;
  currentlySelectedSourceTypes: Ref<MappingType[]>;
  currentlySelectedDestinationTypes: Ref<MappingType[]>;
  rowColors: Ref<Map<number, string>>;
  rowComments: Ref<Record<number, string>>;
  clearRowSelection: () => void;
  analyzeDocument: () => void;
  reset: () => void;
  logInfo: (...args: any[]) => void;
  // From useMappingCache
  activeSlot: Ref<CacheSlot>;
  isCurrentLocked: ComputedRef<boolean>;
  saveToActiveSlot: (data: CachedMapping) => void;
  switchToA: () => void;
  switchToB: () => void;
  toggleLockA: () => void;
  toggleLockB: () => void;
  loadFromSlot: (slot: CacheSlot) => CachedMapping | null;
}

export function useDocumentSerialization(options: UseDocumentSerializationOptions) {
  const {
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
  } = options;

  // Suppresses spurious scheduleCacheSave calls triggered by reactive watches
  // during deserialization (slot switch or initial load)
  let isDeserializing = false;

  // Set to true once a real document has been loaded. Guards against overwriting
  // cached slot data with the empty initial document during the startup race window
  // (i.e. if the user clicks a slot button before auto-restore completes).
  let documentHasData = false;

  // Save current document to cache (debounced)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function serializeDocument(): CachedMapping {
    const doc = mappingDocument.value;
    return {
      document: {
        header: {
          headerText: doc.header.headerText,
          majorVersion: doc.header.majorVersion,
          minorVersion: doc.header.minorVersion,
          fileName: doc.header.fileName
        },
        rows: doc.rows.map(row => ({
          sourceType: row.source.type.key,
          sourceFunction: row.source.function.key,
          sourceExtra: row.source.extra.keyOrValue,
          destinationType: row.destination.type.key,
          destinationFunction: row.destination.function.key,
          destinationExtra: row.destination.extra.keyOrValue,
          unused1: row.unused1,
          unused2: row.unused2,
          unused3: row.unused3,
          unused4: row.unused4
        })),
        variables: doc.variables.map(v => v.value)
      },
      rowColors: Object.fromEntries(rowColors.value),
      rowComments: { ...rowComments.value },
      globalComment: doc.globalComment,
      timestamp: Date.now()
    };
  }

  function deserializeToDocument(cached: CachedMapping): void {
    documentHasData = true;
    isDeserializing = true;
    const doc = new MappingDocument();

    // Restore header
    doc.header.headerText = cached.document.header.headerText;
    doc.header.majorVersion = cached.document.header.majorVersion;
    doc.header.minorVersion = cached.document.header.minorVersion;
    doc.header.fileName = cached.document.header.fileName;

    // Restore rows using pre-indexed lookups for O(1) type/function resolution
    const srcIndex = getSourceTypeIndex();
    const destIndex = getDestTypeIndex();

    cached.document.rows.forEach((serialized, i) => {
      if (i < doc.rows.length) {
        const row = doc.rows[i];

        // Source
        const sourceEntry = srcIndex.get(serialized.sourceType);
        if (sourceEntry) {
          const st = sourceEntry.type;
          row.source.type = new SourceType(st.key, st.abbr, st.description);
          currentlySelectedSourceTypes.value[i] = st;

          const sourceFuncData = sourceEntry.functions.get(serialized.sourceFunction);
          if (sourceFuncData) {
            row.source.function = new SourceFunction(sourceFuncData.key, sourceFuncData.abbr, sourceFuncData.description);
          }

          row.source.extra = new SourceExtra(serialized.sourceExtra, '', '');
        }

        // Destination
        const destEntry = destIndex.get(serialized.destinationType);
        if (destEntry) {
          const dt = destEntry.type;
          row.destination.type = new DestinationType(dt.key, dt.abbr, dt.description);
          currentlySelectedDestinationTypes.value[i] = dt;

          const destFuncData = destEntry.functions.get(serialized.destinationFunction);
          if (destFuncData) {
            row.destination.function = new DestinationFunction(destFuncData.key, destFuncData.abbr, destFuncData.description);
          }

          row.destination.extra = new DestinationExtra(serialized.destinationExtra, '', '');
        }

        // Unused fields
        row.unused1 = serialized.unused1;
        row.unused2 = serialized.unused2;
        row.unused3 = serialized.unused3;
        row.unused4 = serialized.unused4;
      }
    });

    // Restore variables
    cached.document.variables.forEach((val, i) => {
      if (i < doc.variables.length) {
        doc.variables[i].value = val;
      }
    });

    // Apply to reactive state
    mappingDocument.value = doc;

    // Restore colors (preserve Map reference for undo commands)
    rowColors.value.clear();
    for (const [k, v] of Object.entries(cached.rowColors)) {
      rowColors.value.set(parseInt(k), v);
    }

    // Restore comments
    rowComments.value = { ...cached.rowComments };

    // Restore global comment
    if (cached.globalComment) {
      doc.globalComment = cached.globalComment;
    }

    // Clear selection
    clearRowSelection();

    // Run analysis
    analyzeDocument();

    // Reset flag after Vue processes the reactive updates
    nextTick(() => { isDeserializing = false; });
  }

  function scheduleCacheSave(): void {
    if (isDeserializing) return;
    if (isCurrentLocked.value) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      saveToActiveSlot(serializeDocument());
    }, 1000);
  }

  function handleSlotSwitch(slot: 'A' | 'B'): void {
    // If clicking on already active slot, toggle lock
    if (activeSlot.value === slot) {
      if (slot === 'A') {
        toggleLockA();
      } else {
        toggleLockB();
      }
      return;
    }

    // Cancel any pending debounced save (it would target the wrong slot)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    // Save current to active slot first (if not locked).
    // Skip if no real document has been loaded yet and the slot already has data —
    // this prevents overwriting good cached data with the empty initial document
    // during the startup race window before auto-restore completes.
    if (!isCurrentLocked.value && (documentHasData || !loadFromSlot(activeSlot.value))) {
      saveToActiveSlot(serializeDocument());
    }

    // Switch slot
    if (slot === 'A') {
      switchToA();
    } else {
      switchToB();
    }

    // Load from new slot
    const cached = loadFromSlot(slot);
    if (cached) {
      deserializeToDocument(cached);
      logInfo('system', `Loaded mapping from slot ${slot === 'A' ? '1' : '2'}`);
    } else {
      // No data in slot, reset to empty
      reset();
      logInfo('system', `Slot ${slot === 'A' ? '1' : '2'} is empty`);
    }
  }

  return {
    serializeDocument,
    deserializeToDocument,
    scheduleCacheSave,
    handleSlotSwitch
  };
}
