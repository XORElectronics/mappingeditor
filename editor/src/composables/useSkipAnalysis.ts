import { type Ref } from 'vue';
import { EMPTY_KEY, SKIP_SOURCE_TYPE_KEY, SKIP_DESTINATION_TYPE_KEY } from '../modules/dataModel';

// Type alias for row-like objects (works with both Row instances and plain objects)
export type RowLike = {
  index: number;
  source: {
    type: { key: number };
    function: { key: number };
    extra: { keyOrValue: number }
  };
  destination: {
    type: { key: number };
    function: { key: number };
    extra: { keyOrValue: number }
  }
};

interface MappingDocumentLike {
  rows: RowLike[];
}

/**
 * Helper: Check if a byte is a constant (0-25 = constants 0-4095)
 */
function isConstant(byte: number): boolean {
  return byte >= 0 && byte <= 25;
}

/**
 * Helper: Get constant value from byte (0-25 maps to values 0-4095)
 */
function getConstantValue(byte: number): number {
  // Constants 0-25 map to values: 0, 1, 2, ..., 4095
  // Using step increments for higher values
  const constantMap = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    100, 200, 500, 1000, 2000, 3000, 4095
  ];
  return constantMap[byte] ?? 0;
}

/**
 * Evaluate a skip condition given two constant values and a condition code.
 * Returns true/false for the result, or null if indeterminate.
 */
function evaluateCondition(val1: number, val2: number, condition: number): boolean | null {
  switch (condition) {
    case 0: return val1 < val2;    // <
    case 1: return val1 <= val2;   // <=
    case 2: return val1 > val2;    // >
    case 3: return val1 >= val2;   // >=
    case 4: return val1 === val2;  // =
    case 5: return val1 !== val2;  // <>
    default: return null;
  }
}

/**
 * Analyze Skip SOURCE condition to check if it will actually skip.
 * Returns: true if skip will execute, false if skip is always false, null if indeterminate.
 */
function analyzeSkipSourceCondition(row: RowLike): boolean | null {
  if (row.source.type.key !== SKIP_SOURCE_TYPE_KEY) {
    return null;
  }

  const extraValue = row.source.extra.keyOrValue;
  const byte1 = (extraValue >> 8) & 0xFF;
  const byte2 = extraValue & 0xFF;

  // If not both constants, we can't determine at edit time - assume it might skip
  if (!isConstant(byte1) || !isConstant(byte2)) {
    return null; // Indeterminate
  }

  const val1 = getConstantValue(byte1);
  const val2 = getConstantValue(byte2);

  // Get condition from function key
  const funcKey = row.source.function.key;
  if (funcKey === EMPTY_KEY) {
    return false;
  }

  const condition = funcKey % 6;
  return evaluateCondition(val1, val2, condition);
}

/**
 * Analyze Skip DESTINATION condition.
 * Now uses the same encoding as SOURCE (function = skip count + condition, extra = params).
 */
function analyzeSkipDestCondition(row: RowLike): boolean | null {
  if (row.destination.type.key !== SKIP_DESTINATION_TYPE_KEY) {
    return null;
  }

  const extraValue = row.destination.extra.keyOrValue;
  const byte1 = (extraValue >> 8) & 0xFF;
  const byte2 = extraValue & 0xFF;

  // If not both constants, we can't determine at edit time - assume it might skip
  if (!isConstant(byte1) || !isConstant(byte2)) {
    return null; // Indeterminate
  }

  const val1 = getConstantValue(byte1);
  const val2 = getConstantValue(byte2);

  // Get condition from function key (same as SOURCE)
  const funcKey = row.destination.function.key;
  if (funcKey === EMPTY_KEY) {
    return false;
  }

  const condition = funcKey % 6;
  return evaluateCondition(val1, val2, condition);
}

export function useSkipAnalysis(mappingDocument: Ref<MappingDocumentLike>) {

  function isRowSkipped(row: RowLike): boolean {
    // Check if this row will be skipped by a previous row's Skip command
    const currentIndex = row.index;

    // Check all previous rows
    for (let i = 0; i < currentIndex; i++) {
      const prevRow = mappingDocument.value.rows[i];

      // Check Skip source
      if (prevRow.source.type.key === SKIP_SOURCE_TYPE_KEY) {
        const functionKey = prevRow.source.function.key;
        if (functionKey !== EMPTY_KEY) {
          const skipCount = Math.floor(functionKey / 6) + 1;

          // Check if this row falls within the skip range
          if (skipCount > 0 && currentIndex > i && currentIndex <= i + skipCount) {
            // Analyze the skip condition
            const willSkip = analyzeSkipSourceCondition(prevRow);

            // Only show X if skip is DEFINITELY TRUE (not false, not indeterminate)
            // Show > for always false or indeterminate (variables, row refs)
            if (willSkip === true) {
              return true;
            }
          }
        }
      }

      // Check Skip destination
      // Skip DESTINATION function encoding: skip_count (1-16) * 6 + condition (0-5)
      // Decode skip count: Math.floor(functionKey / 6) + 1 (SAME AS SOURCE)
      if (prevRow.destination.type.key === SKIP_DESTINATION_TYPE_KEY) {
        const functionKey = prevRow.destination.function.key;
        if (functionKey !== EMPTY_KEY) {
          const skipCount = Math.floor(functionKey / 6) + 1;

          // Check if this row falls within the skip range
          if (skipCount > 0 && currentIndex > i && currentIndex <= i + skipCount) {
            // Analyze the skip condition
            const willSkip = analyzeSkipDestCondition(prevRow);

            // Only show X if skip is DEFINITELY TRUE (not false, not indeterminate)
            // Show > for always false or indeterminate (variables, row refs)
            if (willSkip === true) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  return {
    isRowSkipped,
    analyzeSkipSourceCondition,
    analyzeSkipDestCondition,
    isConstant,
    getConstantValue
  };
}
