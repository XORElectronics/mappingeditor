/**
 * Action History Composable - Per-Slot Undo/Redo with IndexedDB Persistence
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { CacheSlot } from './useMappingCache';
import { useWarningLog } from './useWarningLog';
import type { Command, CommandResult, CommandMetadata, SerializedCommand } from '../commands/Command';
import type { DeserializationContext } from '../commands/Command';
import { deserializeCommand } from '../commands';

// Re-export DeserializationContext for external use
export type { DeserializationContext } from '../commands/Command';

/**
 * Undo/redo stacks for a single slot
 */
interface SlotHistory {
  undoStack: Command[];
  redoStack: Command[];
}

/**
 * Serialized slot history for IndexedDB
 */
interface SerializedSlotHistory {
  slotId: CacheSlot;
  undoStack: SerializedCommand[];
  redoStack: SerializedCommand[];
  lastModified: number;
}

export interface UseActionHistoryOptions {
  maxStackSize?: number;
  activeSlot: Ref<CacheSlot>;
  isLockedA: Ref<boolean>;
  isLockedB: Ref<boolean>;
  context: DeserializationContext;
  onExecute?: (cmd: Command, slot: CacheSlot) => void;
  onUndo?: (cmd: Command, slot: CacheSlot) => void;
  onRedo?: (cmd: Command, slot: CacheSlot) => void;
}

export interface UseActionHistoryReturn {
  // State (reflects ACTIVE slot)
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  undoDescription: ComputedRef<string | null>;
  redoDescription: ComputedRef<string | null>;
  history: ComputedRef<CommandMetadata[]>;
  redoHistory: ComputedRef<CommandMetadata[]>;

  // Operations (operate on ACTIVE slot)
  executeCommand: (cmd: Command) => CommandResult;
  pushCommand: (cmd: Command) => CommandResult;
  undo: () => void;
  redo: () => void;

  // Slot management
  clearSlotHistory: (slot: CacheSlot) => void;
  clearCurrentHistory: () => void;
  clearAllHistory: () => void;

  // Statistics (for UI)
  totalActions: ComputedRef<number>;
  currentPosition: ComputedRef<number>;
  activeSlot: ComputedRef<CacheSlot>;
}

// IndexedDB configuration
const DB_NAME = 'nerdseq-undo-history';
const STORE_NAME = 'history';
const DB_VERSION = 1;

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open undo history database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save slot history to IndexedDB
 */
async function saveHistoryToIndexedDB(
  slot: CacheSlot,
  history: SlotHistory
): Promise<void> {
  try {
    const db = await openDatabase();

    const serialized: SerializedSlotHistory = {
      slotId: slot,
      undoStack: history.undoStack.map(cmd => cmd.toJSON()),
      redoStack: history.redoStack.map(cmd => cmd.toJSON()),
      lastModified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(serialized, `undo-history-${slot}`);

      request.onerror = () => {
        reject(new Error(`Failed to save undo history for Slot ${slot}`));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    const { addDebug } = useWarningLog();
    addDebug('command', `Failed to save undo history for Slot ${slot}`);
  }
}

/**
 * Load slot history from IndexedDB
 */
async function loadHistoryFromIndexedDB(
  slot: CacheSlot,
  context: DeserializationContext
): Promise<SlotHistory> {
  try {
    const db = await openDatabase();

    const serialized = await new Promise<SerializedSlotHistory | undefined>(
      (resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(`undo-history-${slot}`);

        request.onerror = () => {
          reject(new Error(`Failed to load undo history for Slot ${slot}`));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      }
    );

    if (!serialized) {
      return { undoStack: [], redoStack: [] };
    }

    // Reconstruct commands
    const undoStack = serialized.undoStack
      .map(s => deserializeCommand(s, context))
      .filter((cmd): cmd is Command => cmd !== null);

    const redoStack = serialized.redoStack
      .map(s => deserializeCommand(s, context))
      .filter((cmd): cmd is Command => cmd !== null);

    return { undoStack, redoStack };
  } catch (error) {
    const { addDebug } = useWarningLog();
    addDebug('command', `Failed to load undo history for Slot ${slot}`);
    return { undoStack: [], redoStack: [] };
  }
}

// Singleton instance
let instance: UseActionHistoryReturn | null = null;

/**
 * Action History composable with per-slot undo/redo support
 */
export function useActionHistory(
  options: UseActionHistoryOptions
): UseActionHistoryReturn {
  // Return existing instance if already created
  if (instance) {
    return instance;
  }

  const {
    maxStackSize = 50,
    activeSlot,
    isLockedA,
    isLockedB,
    context,
    onExecute,
    onUndo,
    onRedo
  } = options;

  // Per-slot history storage
  const slotHistories = ref<Record<CacheSlot, SlotHistory>>({
    A: { undoStack: [], redoStack: [] },
    B: { undoStack: [], redoStack: [] }
  });

  // Commands deserialized from IndexedDB would capture the initial empty MappingDocument
  // in their constructor (via context.mappingDocument), producing stale references that
  // silently mutate the wrong object on undo/redo. Start with empty stacks instead.
  // Within-session history (including across slot switches) works correctly via the
  // in-memory slotHistories ref.
  async function initialize() {
    slotHistories.value = {
      A: { undoStack: [], redoStack: [] },
      B: { undoStack: [], redoStack: [] }
    };
  }

  // Initialize async (non-blocking)
  initialize();

  // Helper: Get active slot's history
  const getActiveHistory = (): SlotHistory => {
    return slotHistories.value[activeSlot.value];
  };

  // Helper: Check if active slot is locked
  const isCurrentSlotLocked = computed(() => {
    return activeSlot.value === 'A' ? isLockedA.value : isLockedB.value;
  });

  // Computed state (reflects ACTIVE slot)
  const canUndo = computed(() => {
    if (isCurrentSlotLocked.value) return false;
    return getActiveHistory().undoStack.length > 0;
  });

  const canRedo = computed(() => {
    if (isCurrentSlotLocked.value) return false;
    return getActiveHistory().redoStack.length > 0;
  });

  const undoDescription = computed(() => {
    const history = getActiveHistory();
    if (history.undoStack.length === 0) return null;
    return history.undoStack[history.undoStack.length - 1].getDescription();
  });

  const redoDescription = computed(() => {
    const history = getActiveHistory();
    if (history.redoStack.length === 0) return null;
    return history.redoStack[history.redoStack.length - 1].getDescription();
  });

  const history = computed(() =>
    getActiveHistory().undoStack.map(cmd => cmd.getMetadata())
  );

  const redoHistory = computed(() =>
    getActiveHistory().redoStack.map(cmd => cmd.getMetadata())
  );

  const totalActions = computed(() => getActiveHistory().undoStack.length);
  const currentPosition = computed(() => getActiveHistory().undoStack.length);

  // Auto-save debouncing
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function scheduleSave(slot: CacheSlot): void {
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
      const history = slotHistories.value[slot];
      saveHistoryToIndexedDB(slot, history);
    }, 500); // Debounce 500ms
  }

  /**
   * Execute command on ACTIVE slot
   */
  function executeCommand(cmd: Command): CommandResult {
    if (isCurrentSlotLocked.value) {
      return {
        success: false,
        error: `Slot ${activeSlot.value} is locked`
      };
    }

    try {
      cmd.execute();

      const history = getActiveHistory();

      // Add to undo stack
      history.undoStack.push(cmd);

      // Clear redo stack (branching timeline)
      history.redoStack = [];

      // Enforce max stack size
      if (history.undoStack.length > maxStackSize) {
        history.undoStack.shift();
      }

      // Schedule persistence
      scheduleSave(activeSlot.value);

      // Callback
      if (onExecute) {
        onExecute(cmd, activeSlot.value);
      }

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      useWarningLog().addError('command', `Command failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Push a pre-executed command to the undo stack without calling execute().
   * Used for debounced/coalesced operations (e.g. fader drags) where the mutation
   * was applied incrementally and we just want to record the before→after delta.
   */
  function pushCommand(cmd: Command): CommandResult {
    if (isCurrentSlotLocked.value) {
      return {
        success: false,
        error: `Slot ${activeSlot.value} is locked`
      };
    }

    const history = getActiveHistory();

    history.undoStack.push(cmd);
    history.redoStack = [];

    if (history.undoStack.length > maxStackSize) {
      history.undoStack.shift();
    }

    scheduleSave(activeSlot.value);

    if (onExecute) {
      onExecute(cmd, activeSlot.value);
    }

    return { success: true };
  }

  /**
   * Undo last command on ACTIVE slot
   */
  function undo(): void {
    if (!canUndo.value) return;
    if (isCurrentSlotLocked.value) {
      useWarningLog().addDebug('command', `Cannot undo: Slot ${activeSlot.value} is locked`);
      return;
    }

    const history = getActiveHistory();
    const cmd = history.undoStack.pop()!;

    try {
      cmd.undo();
      history.redoStack.push(cmd);

      // Schedule persistence
      scheduleSave(activeSlot.value);

      if (onUndo) {
        onUndo(cmd, activeSlot.value);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      useWarningLog().addError('command', `Undo failed: ${errorMsg}`);
      // Re-add to undo stack on failure
      history.undoStack.push(cmd);
    }
  }

  /**
   * Redo last undone command on ACTIVE slot
   */
  function redo(): void {
    if (!canRedo.value) return;
    if (isCurrentSlotLocked.value) {
      useWarningLog().addDebug('command', `Cannot redo: Slot ${activeSlot.value} is locked`);
      return;
    }

    const history = getActiveHistory();
    const cmd = history.redoStack.pop()!;

    try {
      cmd.execute();
      history.undoStack.push(cmd);

      // Schedule persistence
      scheduleSave(activeSlot.value);

      if (onRedo) {
        onRedo(cmd, activeSlot.value);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      useWarningLog().addError('command', `Redo failed: ${errorMsg}`);
      // Re-add to redo stack on failure
      history.redoStack.push(cmd);
    }
  }

  /**
   * Clear history for a specific slot
   */
  function clearSlotHistory(slot: CacheSlot): void {
    slotHistories.value[slot] = {
      undoStack: [],
      redoStack: []
    };
    // Persist the cleared state
    scheduleSave(slot);
  }

  /**
   * Clear history for current active slot
   */
  function clearCurrentHistory(): void {
    clearSlotHistory(activeSlot.value);
  }

  /**
   * Clear history for ALL slots
   */
  function clearAllHistory(): void {
    clearSlotHistory('A');
    clearSlotHistory('B');
  }

  // Create instance
  instance = {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    history,
    redoHistory,
    totalActions,
    currentPosition,
    executeCommand,
    pushCommand,
    undo,
    redo,
    clearSlotHistory,
    clearCurrentHistory,
    clearAllHistory,
    activeSlot: computed(() => activeSlot.value)
  };

  return instance!;
}

/**
 * Get the current singleton instance without requiring options (read-only access)
 */
export function getActionHistory(): UseActionHistoryReturn | null {
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetActionHistory(): void {
  instance = null;
}
