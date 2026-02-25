import { ref, computed, type ComputedRef, type Ref } from 'vue';

/**
 * Log entry types
 */
export type LogEntryType = 'info' | 'warning' | 'error' | 'debug';

/**
 * Log entry sources
 */
export type LogEntrySource = 'analyzer' | 'reference' | 'system' | 'midi' | 'command';

/**
 * A child entry within a summary log entry (no id/timestamp/noticed state)
 */
export interface LogChildEntry {
  type: LogEntryType;
  message: string;
  rowIndex?: number;
  details?: string;
}

/**
 * A log entry in the warning log
 */
export interface LogEntry {
  id: number;
  timestamp: Date;
  type: LogEntryType;
  source: LogEntrySource;
  message: string;
  rowIndex?: number;
  details?: string;
  noticed?: boolean;
  analyzerWarningId?: string;
  children?: LogChildEntry[];
}

/**
 * Input for creating a new log entry (without auto-generated fields)
 */
export type LogEntryInput = Omit<LogEntry, 'id' | 'timestamp'>;

/**
 * Return type for useWarningLog composable
 */
export interface UseWarningLogReturn {
  entries: Ref<LogEntry[]>;
  addEntry: (entry: LogEntryInput) => number;
  addInfo: (source: LogEntrySource, message: string, rowIndex?: number, details?: string) => number;
  addWarning: (source: LogEntrySource, message: string, rowIndex?: number, details?: string) => number;
  addError: (source: LogEntrySource, message: string, rowIndex?: number, details?: string) => number;
  addDebug: (source: LogEntrySource, message: string, rowIndex?: number, details?: string) => number;
  clearLog: () => void;
  filterByType: Ref<Set<LogEntryType>>;
  filterBySource: Ref<Set<LogEntrySource>>;
  showNoticed: Ref<boolean>;
  filteredEntries: ComputedRef<LogEntry[]>;
  entryCount: ComputedRef<number>;
  warningCount: ComputedRef<number>;
  errorCount: ComputedRef<number>;
  noticeEntry: (id: number) => void;
  unnoticeEntry: (id: number) => void;
}

// Maximum number of entries to keep
const MAX_ENTRIES = 100;

// Singleton instance for global access
let instance: UseWarningLogReturn | null = null;

/**
 * Composable for centralized warning and message logging.
 *
 * Uses **singleton pattern** - all components share the same log instance.
 * Automatically prunes entries to keep only the most recent 100.
 *
 * **Log Entry Types:**
 * - `info` - Informational messages (e.g., "File loaded successfully")
 * - `warning` - Potential issues (e.g., "Variable read before write")
 * - `error` - Critical errors (e.g., "Failed to save file")
 *
 * **Log Entry Sources:**
 * - `analyzer` - Static analysis warnings
 * - `reference` - Row reference tracking (Skip/Dual destination updates)
 * - `system` - General system messages (file I/O, cache operations)
 *
 * @example
 * ```typescript
 * const {
 *   addWarning,
 *   addError,
 *   filteredEntries,
 *   warningCount,
 *   filterByType
 * } = useWarningLog();
 *
 * // Add a warning for row 5
 * addWarning('analyzer', 'Variable A read before write', 5);
 *
 * // Add a system error
 * addError('system', 'Failed to load file', undefined, 'FileNotFoundError');
 *
 * // Filter to show only warnings
 * filterByType.value = new Set(['warning']);
 *
 * // Display filtered entries
 * console.log('Warnings:', warningCount.value);
 * filteredEntries.value.forEach(entry => {
 *   console.log(`[${entry.type}] ${entry.message}`);
 * });
 * ```
 *
 * @returns Warning log API with add/clear/filter operations
 */
export function useWarningLog(): UseWarningLogReturn {
  // Return existing instance if already created
  if (instance) {
    return instance;
  }

  let nextId = 1;
  const entries = ref<LogEntry[]>([]);

  // Active filters
  const filterByType = ref<Set<LogEntryType>>(new Set(['info', 'warning', 'error']));
  const filterBySource = ref<Set<LogEntrySource>>(new Set(['analyzer', 'reference', 'system', 'midi', 'command']));
  const showNoticed = ref<boolean>(true);

  /**
   * Filtered entries based on active filters
   */
  const filteredEntries = computed(() => {
    return entries.value.filter(entry =>
      entry.type !== 'debug' &&
      filterByType.value.has(entry.type) &&
      filterBySource.value.has(entry.source) &&
      (showNoticed.value || !entry.noticed)
    );
  });

  /**
   * Total entry count (unfiltered)
   */
  const entryCount = computed(() => entries.value.length);

  /**
   * Count of warning-type non-noticed entries
   */
  const warningCount = computed(() =>
    entries.value.filter(e => e.type === 'warning' && !e.noticed).length
  );

  /**
   * Count of error-type non-noticed entries
   */
  const errorCount = computed(() =>
    entries.value.filter(e => e.type === 'error' && !e.noticed).length
  );

  /**
   * Add a new entry to the log. Returns the entry id.
   */
  function addEntry(entry: LogEntryInput): number {
    const entryId = nextId++;
    const newEntry: LogEntry = {
      ...entry,
      id: entryId,
      timestamp: new Date()
    };

    // Add to beginning (newest first)
    entries.value.unshift(newEntry);

    // Prune old entries if over limit
    if (entries.value.length > MAX_ENTRIES) {
      entries.value = entries.value.slice(0, MAX_ENTRIES);
    }

    return entryId;
  }

  /**
   * Add an info entry
   */
  function addInfo(source: LogEntrySource, message: string, rowIndex?: number, details?: string): number {
    return addEntry({ type: 'info', source, message, rowIndex, details });
  }

  /**
   * Add a warning entry
   */
  function addWarning(source: LogEntrySource, message: string, rowIndex?: number, details?: string): number {
    return addEntry({ type: 'warning', source, message, rowIndex, details });
  }

  /**
   * Add an error entry
   */
  function addError(source: LogEntrySource, message: string, rowIndex?: number, details?: string): number {
    return addEntry({ type: 'error', source, message, rowIndex, details });
  }

  /**
   * Add a debug entry (stored in entries and downloadable, but never shown in the monitor UI)
   */
  function addDebug(source: LogEntrySource, message: string, rowIndex?: number, details?: string): number {
    return addEntry({ type: 'debug', source, message, rowIndex, details });
  }

  /**
   * Mark a log entry as noticed
   */
  function noticeEntry(id: number): void {
    const entry = entries.value.find(e => e.id === id);
    if (entry) {
      entry.noticed = true;
    }
  }

  /**
   * Un-notice a log entry and remove it from the log
   */
  function unnoticeEntry(id: number): void {
    entries.value = entries.value.filter(e => e.id !== id);
  }

  /**
   * Clear all entries from the log
   */
  function clearLog(): void {
    entries.value = [];
  }

  // Create and store instance
  instance = {
    entries,
    addEntry,
    addInfo,
    addWarning,
    addError,
    addDebug,
    clearLog,
    filterByType,
    filterBySource,
    showNoticed,
    filteredEntries,
    entryCount,
    warningCount,
    errorCount,
    noticeEntry,
    unnoticeEntry
  };

  return instance!;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetWarningLog(): void {
  instance = null;
}
