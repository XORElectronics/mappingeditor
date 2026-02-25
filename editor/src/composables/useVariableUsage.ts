import { computed, type Ref, type ComputedRef } from 'vue';

const VAR_SOURCE_TYPE_KEY = 9;
const SETVAR_DESTINATION_TYPE_KEY = 8;
const CALC_SOURCE_TYPE_KEY = 10;
const SKIP_SOURCE_TYPE_KEY = 11;
const EMPTY_KEY = 65535;

/**
 * Interfaces for reactive document structure (Vue unwraps class instances)
 */
interface TypeLike {
  key: number;
  abbr: string;
  description: string;
}

interface ExtraLike {
  keyOrValue: number;
  abbr: string;
  description: string;
}

interface SourceLike {
  type: TypeLike;
  function: TypeLike;
  extra: ExtraLike;
}

interface DestinationLike {
  type: TypeLike;
  function: TypeLike;
  extra: ExtraLike;
}

interface RowLike {
  index: number;
  source: SourceLike;
  destination: DestinationLike;
  channel: number;
  minValue: number;
  maxValue: number;
  offset: number;
}

interface MappingDocumentLike {
  rows: RowLike[];
}

/**
 * Information about how a single variable (A-P) is used in the mapping
 */
export interface VariableUsageInfo {
  index: number;           // 0-15 (A-P)
  name: string;            // A-P
  isUsed: boolean;         // Read OR written
  isRead: boolean;         // Used as Variable source in read mode, or Calc/Skip parameter
  isWritten: boolean;      // Used as SetVar destination or Variable source in write/fader mode
  readByRows: number[];    // Row indices that read this variable
  writtenByRows: number[]; // Row indices that write to this variable (SetVar dest or Variable source fader)
  lastWriteRow: number | null; // Most recent write (highest row index)
  lastWriteValue: number | null; // Statically known write value (from fader), null if dynamic (SetVar)
}

export interface UseVariableUsageReturn {
  variableUsage: ComputedRef<VariableUsageInfo[]>;
  isVariableUsed: (index: number) => boolean;
  getVariableReaders: (index: number) => number[];
  getVariableWriters: (index: number) => number[];
}

/**
 * Composable for tracking variable usage across all mapping rows
 *
 * Detects:
 * - Variable source reads (source type 9)
 * - Calc/Skip parameter reads (source type 10/11 with extra bytes 10-25)
 * - SetVar destination writes (destination type 8)
 *
 * @param mappingDocument - Reactive reference to the mapping document
 * @returns Object with variable usage information and helper functions
 */
export function useVariableUsage(
  mappingDocument: Ref<MappingDocumentLike>
): UseVariableUsageReturn {

  const variableUsage = computed(() => {
    const usage: VariableUsageInfo[] = [];

    // Initialize all 16 variables (A-P)
    for (let i = 0; i < 16; i++) {
      usage[i] = {
        index: i,
        name: String.fromCharCode(65 + i), // A-P
        isUsed: false,
        isRead: false,
        isWritten: false,
        readByRows: [],
        writtenByRows: [],
        lastWriteRow: null,
        lastWriteValue: null
      };
    }

    // Scan all 70 rows for variable usage
    mappingDocument.value.rows.forEach((row, rowIndex) => {
      // Check for Variable source - distinguish read vs write mode
      // extra === 0: read (pass value from variable/row)
      // extra 1-4096: write (set variable/row to value 0-4095)
      // extra === EMPTY_KEY: unset/default (neither read nor write)
      if (row.source.type.key === VAR_SOURCE_TYPE_KEY) {
        const varIdx = row.source.function.key;
        if (varIdx >= 0 && varIdx <= 15) {
          const extra = row.source.extra.keyOrValue;
          if (extra === 0) {
            // Read mode
            usage[varIdx].isRead = true;
            usage[varIdx].isUsed = true;
            if (!usage[varIdx].readByRows.includes(rowIndex)) {
              usage[varIdx].readByRows.push(rowIndex);
            }
          } else if (extra !== EMPTY_KEY) {
            // Write/fader mode (extra 1-4096: set variable to value 0-4095)
            usage[varIdx].isWritten = true;
            usage[varIdx].isUsed = true;
            if (!usage[varIdx].writtenByRows.includes(rowIndex)) {
              usage[varIdx].writtenByRows.push(rowIndex);
            }
            const currentLast = usage[varIdx].lastWriteRow;
            if (currentLast === null || rowIndex > currentLast) {
              usage[varIdx].lastWriteRow = rowIndex;
              // Fader value is extra - 1 (extra 1 = value 0, extra 4096 = value 4095)
              usage[varIdx].lastWriteValue = extra - 1;
            }
          } else {
            // EMPTY_KEY: unconfigured but variable is still referenced
            usage[varIdx].isUsed = true;
          }
        }
      }

      // Check for Calc/Skip source params (reads)
      if (row.source.type.key === CALC_SOURCE_TYPE_KEY ||
          row.source.type.key === SKIP_SOURCE_TYPE_KEY) {
        const extraValue = row.source.extra.keyOrValue;
        const byte1 = (extraValue >> 8) & 0xFF;
        const byte2 = extraValue & 0xFF;

        // Variables encoded as 10-25 in Calc/Skip bytes (10=A, 11=B, ..., 25=P)
        [byte1, byte2].forEach(byte => {
          if (byte >= 10 && byte <= 25) {
            const varIdx = byte - 10; // Map to 0-15
            usage[varIdx].isRead = true;
            usage[varIdx].isUsed = true;
            if (!usage[varIdx].readByRows.includes(rowIndex)) {
              usage[varIdx].readByRows.push(rowIndex);
            }
          }
        });
      }

      // Check for SetVar destination (writes)
      if (row.destination.type.key === SETVAR_DESTINATION_TYPE_KEY) {
        const varIdx = row.destination.function.key;
        if (varIdx >= 0 && varIdx <= 15) {
          usage[varIdx].isWritten = true;
          usage[varIdx].isUsed = true;
          if (!usage[varIdx].writtenByRows.includes(rowIndex)) {
            usage[varIdx].writtenByRows.push(rowIndex);
          }
          // Track last write (highest row index)
          const currentLast = usage[varIdx].lastWriteRow;
          if (currentLast === null || rowIndex > currentLast) {
            usage[varIdx].lastWriteRow = rowIndex;
            // SetVar destination value is dynamic (depends on source), mark unknown
            usage[varIdx].lastWriteValue = null;
          }
        }
      }
    });

    return usage;
  });

  const isVariableUsed = (index: number): boolean => {
    return variableUsage.value[index]?.isUsed ?? false;
  };

  const getVariableReaders = (index: number): number[] => {
    return variableUsage.value[index]?.readByRows ?? [];
  };

  const getVariableWriters = (index: number): number[] => {
    return variableUsage.value[index]?.writtenByRows ?? [];
  };

  return {
    variableUsage,
    isVariableUsed,
    getVariableReaders,
    getVariableWriters
  };
}
