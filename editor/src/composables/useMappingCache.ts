import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';

/**
 * Slot identifier for cached mappings
 */
export type CacheSlot = 'A' | 'B';

/**
 * Serialized form of the mapping document for storage
 */
interface SerializedRow {
  sourceType: number;
  sourceFunction: number;
  sourceExtra: number;
  destinationType: number;
  destinationFunction: number;
  destinationExtra: number;
  unused1: number;
  unused2: number;
  unused3: number;
  unused4: number;
}

interface SerializedHeader {
  headerText: string;
  majorVersion: number;
  minorVersion: number;
  fileName: string;
}

interface SerializedDocument {
  header: SerializedHeader;
  rows: SerializedRow[];
  variables: number[];
}

/**
 * Cached mapping with metadata
 */
export interface CachedMapping {
  document: SerializedDocument;
  rowColors: Record<number, string>;
  rowComments: Record<number, string>;
  globalComment?: string;
  timestamp: number;
}

/**
 * Return type for useMappingCache composable
 */
export interface UseMappingCacheReturn {
  activeSlot: Ref<CacheSlot>;
  isLockedA: Ref<boolean>;
  isLockedB: Ref<boolean>;
  isCurrentLocked: ComputedRef<boolean>;
  hasDataA: Ref<boolean>;
  hasDataB: Ref<boolean>;
  switchToA: () => void;
  switchToB: () => void;
  toggleLockA: () => void;
  toggleLockB: () => void;
  saveToActiveSlot: (data: CachedMapping) => void;
  loadFromSlot: (slot: CacheSlot) => CachedMapping | null;
  clearSlot: (slot: CacheSlot) => Promise<void>;
}

// IndexedDB database name and store
const DB_NAME = 'nerdseq-editor';
const STORE_NAME = 'mappings';
const DB_VERSION = 1;

// localStorage keys for lock states
const LOCK_A_KEY = 'nerdseq-cache-lock-a';
const LOCK_B_KEY = 'nerdseq-cache-lock-b';
const ACTIVE_SLOT_KEY = 'nerdseq-cache-active-slot';

// Persistent DB connection (avoids ~5-15ms open overhead per operation)
let cachedDb: IDBDatabase | null = null;

/**
 * Open the IndexedDB database, reusing a cached connection when available
 */
function openDatabase(): Promise<IDBDatabase> {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        cachedDb = null;
      };
      cachedDb = db;
      resolve(db);
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
 * Save data to IndexedDB
 */
async function saveToIndexedDB(key: string, data: CachedMapping): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onerror = () => {
      reject(new Error('Failed to save to IndexedDB'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Load data from IndexedDB
 */
async function loadFromIndexedDB(key: string): Promise<CachedMapping | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error('Failed to load from IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Delete data from IndexedDB
 */
async function deleteFromIndexedDB(key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => {
      reject(new Error('Failed to delete from IndexedDB'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

// In-memory slot cache — both slots loaded on init, zero IndexedDB reads during switching
const slotCache: Record<CacheSlot, CachedMapping | null> = { A: null, B: null };
let slotCacheInitialized = false;
let cacheInitPromise: Promise<void> | null = null;

/**
 * Load both slots from IndexedDB into memory (called once on init)
 */
async function initSlotCache(): Promise<void> {
  if (slotCacheInitialized) return;
  try {
    const [dataA, dataB] = await Promise.all([
      loadFromIndexedDB('slot-A'),
      loadFromIndexedDB('slot-B')
    ]);
    slotCache.A = dataA;
    slotCache.B = dataB;
  } catch {
    // Slots stay null on error — same as empty
  }
  slotCacheInitialized = true;
}

// Singleton instance
let instance: UseMappingCacheReturn | null = null;

/**
 * Mapping Cache composable - provides A/B toggle and lock functionality
 * Uses singleton pattern so all components share the same state
 */
export function useMappingCache(): UseMappingCacheReturn {
  // Return existing instance if already created
  if (instance) {
    return instance;
  }

  // Load initial states from localStorage
  const savedActiveSlot = localStorage.getItem(ACTIVE_SLOT_KEY) as CacheSlot | null;
  const activeSlot = ref<CacheSlot>(savedActiveSlot === 'B' ? 'B' : 'A');
  
  const isLockedA = ref(localStorage.getItem(LOCK_A_KEY) === 'true');
  const isLockedB = ref(localStorage.getItem(LOCK_B_KEY) === 'true');
  
  // Track if slots have data
  const hasDataA = ref(false);
  const hasDataB = ref(false);

  // Load both slots into memory on init (shared promise so multiple callers get the same init)
  if (!cacheInitPromise) {
    cacheInitPromise = initSlotCache();
  }
  cacheInitPromise.then(() => {
    hasDataA.value = slotCache.A !== null;
    hasDataB.value = slotCache.B !== null;
  });

  // Persist lock states
  watch(isLockedA, (val) => {
    localStorage.setItem(LOCK_A_KEY, val.toString());
  });

  watch(isLockedB, (val) => {
    localStorage.setItem(LOCK_B_KEY, val.toString());
  });

  watch(activeSlot, (val) => {
    localStorage.setItem(ACTIVE_SLOT_KEY, val);
  });

  /**
   * Whether the currently active slot is locked
   */
  const isCurrentLocked = computed(() => {
    return activeSlot.value === 'A' ? isLockedA.value : isLockedB.value;
  });

  /**
   * Switch to slot 1
   */
  function switchToA(): void {
    activeSlot.value = 'A';
  }

  /**
   * Switch to slot 2
   */
  function switchToB(): void {
    activeSlot.value = 'B';
  }

  /**
   * Toggle lock on slot 1
   */
  function toggleLockA(): void {
    isLockedA.value = !isLockedA.value;
  }

  /**
   * Toggle lock on slot 2
   */
  function toggleLockB(): void {
    isLockedB.value = !isLockedB.value;
  }

  /**
   * Save data to the active slot (memory-first, IndexedDB in background)
   */
  function saveToActiveSlot(data: CachedMapping): void {
    const slot = activeSlot.value;
    slotCache[slot] = data;

    if (slot === 'A') {
      hasDataA.value = true;
    } else {
      hasDataB.value = true;
    }

    // Persist to IndexedDB in background
    saveToIndexedDB(`slot-${slot}`, data).catch(err => {
      console.error('Background IndexedDB save failed:', err);
    });
  }

  /**
   * Load data from a specific slot (returns from memory)
   */
  function loadFromSlot(slot: CacheSlot): CachedMapping | null {
    return slotCache[slot];
  }

  /**
   * Clear a specific slot
   */
  async function clearSlot(slot: CacheSlot): Promise<void> {
    slotCache[slot] = null;

    if (slot === 'A') {
      hasDataA.value = false;
    } else {
      hasDataB.value = false;
    }

    await deleteFromIndexedDB(`slot-${slot}`);
  }

  // Create and store instance
  instance = {
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
    loadFromSlot,
    clearSlot
  };

  return instance;
}

/**
 * Returns a Promise that resolves once the initial IndexedDB load (both slots) has completed.
 * Safe to call before useMappingCache() has been invoked — returns an already-resolved
 * Promise in that case.
 */
export function waitForCacheReady(): Promise<void> {
  return cacheInitPromise ?? Promise.resolve();
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetMappingCache(): void {
  instance = null;
  slotCache.A = null;
  slotCache.B = null;
  slotCacheInitialized = false;
  cacheInitPromise = null;
  if (cachedDb) {
    cachedDb.close();
    cachedDb = null;
  }
}
