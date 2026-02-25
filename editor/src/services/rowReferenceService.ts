/**
 * Row Reference Service
 *
 * This module handles the detection and updating of row references in the NerdSEQ Mapping Editor.
 *
 * Row references can be encoded in two ways:
 *
 * 1. EXTRA field (Calc/Skip sources, Skip destinations):
 *    - Byte encoding (each byte of the 16-bit extra value):
 *      - 255: Empty
 *      - 0-9: Constants
 *      - 10-25: Variables (A-P)
 *      - 26-95: Row references (rows 0-69), where rowIndex = byteValue - 26
 *
 * 2. FUNCTION field (SETV destinations):
 *    - Function keys 16-85 represent rows 0-69
 *    - Function key = 16 + rowIndex
 */

import {
  CALC_SOURCE_TYPE_KEY,
  SKIP_SOURCE_TYPE_KEY,
  SKIP_DESTINATION_TYPE_KEY,
  SETVAR_DESTINATION_TYPE_KEY,
  genCalcSkipSourceExtraDnA,
  EMPTY_KEY,
} from "../modules/dataModel";
import {
  Row,
  Source,
  Destination,
  SourceExtra,
  DestinationExtra,
  DestinationFunction,
} from "../modules/documentModel";

// Constants for row reference byte encoding (used in EXTRA field)
export const ROW_REF_MIN = 26;
export const ROW_REF_MAX = 95;
export const EMPTY_BYTE = 255;

// Constants for row reference function keys (used in FUNCTION field for SETV)
export const ROW_REF_FUNCTION_MIN = 16;
export const ROW_REF_FUNCTION_MAX = 85;

/**
 * Check if a byte value represents a row reference
 */
export function isRowReferenceByte(byteValue: number): boolean {
  return byteValue >= ROW_REF_MIN && byteValue <= ROW_REF_MAX;
}

/**
 * Convert a byte value to a row index
 * @throws if the byte value is not a row reference
 */
export function byteToRowIndex(byteValue: number): number {
  if (!isRowReferenceByte(byteValue)) {
    throw new Error(`Byte value ${byteValue} is not a row reference`);
  }
  return byteValue - ROW_REF_MIN;
}

/**
 * Convert a row index to a byte value
 * @throws if the row index is out of valid range (0-69)
 */
export function rowIndexToByte(rowIndex: number): number {
  if (rowIndex < 0 || rowIndex > 69) {
    throw new Error(`Row index ${rowIndex} is out of valid range (0-69)`);
  }
  return rowIndex + ROW_REF_MIN;
}

/**
 * Check if a function key represents a row reference (16-85)
 * Used for SETV destination functions
 */
export function isRowReferenceFunctionKey(functionKey: number): boolean {
  return functionKey >= ROW_REF_FUNCTION_MIN && functionKey <= ROW_REF_FUNCTION_MAX;
}

/**
 * Convert a function key to a row index (16 -> 0, 85 -> 69)
 * @throws if the function key is not a row reference
 */
export function functionKeyToRowIndex(functionKey: number): number {
  if (!isRowReferenceFunctionKey(functionKey)) {
    throw new Error(`Function key ${functionKey} is not a row reference`);
  }
  return functionKey - ROW_REF_FUNCTION_MIN;
}

/**
 * Convert a row index to a function key (0 -> 16, 69 -> 85)
 * @throws if the row index is out of valid range (0-69)
 */
export function rowIndexToFunctionKey(rowIndex: number): number {
  if (rowIndex < 0 || rowIndex > 69) {
    throw new Error(`Row index ${rowIndex} is out of valid range (0-69)`);
  }
  return rowIndex + ROW_REF_FUNCTION_MIN;
}

/**
 * Extract high and low bytes from a 16-bit extra value
 */
export function splitExtraValue(extraValue: number): {
  highByte: number;
  lowByte: number;
} {
  return {
    highByte: (extraValue & 0xff00) >> 8,
    lowByte: extraValue & 0x00ff,
  };
}

/**
 * Combine high and low bytes into a 16-bit extra value
 */
export function combineBytes(highByte: number, lowByte: number): number {
  return ((highByte & 0xff) << 8) | (lowByte & 0xff);
}

/**
 * Warning information for row reference issues
 */
export interface ReferenceWarning {
  /** The row index where the warning originates */
  rowIndex: number;
  /** The row index that was referenced */
  referencedRowIndex: number;
  /** The new position of the referenced row */
  newReferencedRowIndex: number;
  /** Human-readable warning message */
  message: string;
  /** Type of warning */
  type: "definition_order" | "info";
}

/**
 * Result of a reference update operation
 */
export interface ReferenceUpdateResult {
  /** Number of references that were updated */
  updatedCount: number;
  /** Warnings about potential issues */
  warnings: ReferenceWarning[];
}

/**
 * Check if a source type uses row references in its extra field
 */
export function sourceTypeUsesRowReferences(sourceTypeKey: number): boolean {
  return (
    sourceTypeKey === CALC_SOURCE_TYPE_KEY ||
    sourceTypeKey === SKIP_SOURCE_TYPE_KEY
  );
}

/**
 * Check if a destination type uses row references in its extra field
 */
export function destinationTypeUsesRowReferences(
  destTypeKey: number
): boolean {
  return destTypeKey === SKIP_DESTINATION_TYPE_KEY;
}

/**
 * Check if a row has any row references in its source or destination extras
 */
export function rowHasRowReferences(row: Row): boolean {
  const sourceHasRefs =
    sourceTypeUsesRowReferences(row.source.type.key) &&
    extraHasRowReferences(row.source.extra.keyOrValue);

  const destHasRefs =
    destinationTypeUsesRowReferences(row.destination.type.key) &&
    extraHasRowReferences(row.destination.extra.keyOrValue);

  return sourceHasRefs || destHasRefs;
}

/**
 * Check if an extra value contains any row references
 */
export function extraHasRowReferences(extraValue: number): boolean {
  if (extraValue === EMPTY_KEY) return false;

  const { highByte, lowByte } = splitExtraValue(extraValue);
  return isRowReferenceByte(highByte) || isRowReferenceByte(lowByte);
}

/**
 * Get all row indices referenced by a row
 */
export function getReferencedRowIndices(row: Row): number[] {
  const indices: number[] = [];

  if (
    sourceTypeUsesRowReferences(row.source.type.key) &&
    row.source.extra.keyOrValue !== EMPTY_KEY
  ) {
    const { highByte, lowByte } = splitExtraValue(row.source.extra.keyOrValue);
    if (isRowReferenceByte(highByte)) {
      indices.push(byteToRowIndex(highByte));
    }
    if (isRowReferenceByte(lowByte)) {
      indices.push(byteToRowIndex(lowByte));
    }
  }

  if (
    destinationTypeUsesRowReferences(row.destination.type.key) &&
    row.destination.extra.keyOrValue !== EMPTY_KEY
  ) {
    const { highByte, lowByte } = splitExtraValue(
      row.destination.extra.keyOrValue
    );
    if (isRowReferenceByte(highByte)) {
      indices.push(byteToRowIndex(highByte));
    }
    if (isRowReferenceByte(lowByte)) {
      indices.push(byteToRowIndex(lowByte));
    }
  }

  return [...new Set(indices)]; // Remove duplicates
}

/**
 * Update a single byte value with the new row reference based on position mapping
 * Returns the updated byte value
 */
function updateByteRowReference(
  byteValue: number,
  positionMapping: Map<number, number>
): number {
  if (!isRowReferenceByte(byteValue)) {
    return byteValue; // Not a row reference, return as-is
  }

  const currentRowIndex = byteToRowIndex(byteValue);
  const newRowIndex = positionMapping.get(currentRowIndex);

  if (newRowIndex === undefined) {
    return byteValue; // Row wasn't in the mapping, return as-is
  }

  return rowIndexToByte(newRowIndex);
}

/**
 * Update an extra value with new row references based on position mapping
 * Returns the updated extra value
 */
export function updateExtraRowReferences(
  extraValue: number,
  positionMapping: Map<number, number>
): number {
  if (extraValue === EMPTY_KEY) {
    return extraValue;
  }

  const { highByte, lowByte } = splitExtraValue(extraValue);
  const newHighByte = updateByteRowReference(highByte, positionMapping);
  const newLowByte = updateByteRowReference(lowByte, positionMapping);

  return combineBytes(newHighByte, newLowByte);
}

/**
 * Create a new SourceExtra with updated row references
 */
export function createUpdatedSourceExtra(
  currentExtra: SourceExtra,
  positionMapping: Map<number, number>
): SourceExtra {
  const newKeyOrValue = updateExtraRowReferences(
    currentExtra.keyOrValue,
    positionMapping
  );

  if (newKeyOrValue === currentExtra.keyOrValue) {
    return currentExtra; // No change
  }

  const { abbr, description } = genCalcSkipSourceExtraDnA(newKeyOrValue);
  return new SourceExtra(newKeyOrValue, abbr, description);
}

/**
 * Create a new DestinationExtra with updated row references
 * Note: Skip destination uses the same encoding as Calc/Skip source
 */
export function createUpdatedDestinationExtra(
  currentExtra: DestinationExtra,
  positionMapping: Map<number, number>
): DestinationExtra {
  const newKeyOrValue = updateExtraRowReferences(
    currentExtra.keyOrValue,
    positionMapping
  );

  if (newKeyOrValue === currentExtra.keyOrValue) {
    return currentExtra; // No change
  }

  const { abbr, description } = genCalcSkipSourceExtraDnA(newKeyOrValue);
  return new DestinationExtra(newKeyOrValue, abbr, description);
}

/**
 * Build a position mapping for a row move operation
 * This tracks where each row's CONTENT ends up after the move
 *
 * The key insight is that when moving multiple consecutive rows, we perform
 * a series of swaps. We need to track where the content that was ORIGINALLY
 * at each position ends up FINALLY.
 *
 * @param rowIndices - The indices of rows being moved
 * @param direction - The direction of the move ('up' or 'down')
 * @returns A map from original position to final position for all affected rows
 */
export function buildPositionMapping(
  rowIndices: number[],
  direction: "up" | "down"
): Map<number, number> {
  // Map: "content originally at position X is now at position Y"
  const finalPositions = new Map<number, number>();
  
  // Sort indices based on direction (same as actual swap order)
  const sorted = [...rowIndices].sort((a, b) =>
    direction === "up" ? a - b : b - a
  );

  const offset = direction === "up" ? -1 : 1;

  // Initialize: all content starts at its original position
  const allAffectedPositions = new Set<number>();
  for (const idx of sorted) {
    const adjacentIdx = idx + offset;
    allAffectedPositions.add(idx);
    allAffectedPositions.add(adjacentIdx);
  }
  
  for (const pos of allAffectedPositions) {
    finalPositions.set(pos, pos);
  }

  // Simulate each swap in order
  for (const idx of sorted) {
    const adjacentIdx = idx + offset;
    
    // Before this swap, find which original content is at idx and adjacentIdx
    let originalAtIdx = -1;
    let originalAtAdjacent = -1;
    
    for (const [original, current] of finalPositions.entries()) {
      if (current === idx) originalAtIdx = original;
      if (current === adjacentIdx) originalAtAdjacent = original;
    }
    
    // Swap them: content currently at idx goes to adjacentIdx and vice versa
    if (originalAtIdx !== -1) {
      finalPositions.set(originalAtIdx, adjacentIdx);
    }
    if (originalAtAdjacent !== -1) {
      finalPositions.set(originalAtAdjacent, idx);
    }
  }

  // Filter out positions that didn't move
  const mapping = new Map<number, number>();
  for (const [original, final] of finalPositions.entries()) {
    if (original !== final) {
      mapping.set(original, final);
    }
  }

  return mapping;
}

/**
 * Check if a reference would violate definition order after update
 * (i.e., the referenced row would be after the referencing row)
 */
function checkDefinitionOrderViolation(
  currentRowIndex: number,
  originalReferencedRowIndex: number,
  positionMapping: Map<number, number>
): { violates: boolean; newReferencingIndex: number; newReferencedIndex: number } {
  // currentRowIndex is the position where the referencing content now lives (post-swap)
  // originalReferencedRowIndex is the original position of the referenced row
  // Look up where the referenced row's content now lives
  const newReferencedIndex =
    positionMapping.get(originalReferencedRowIndex) ?? originalReferencedRowIndex;

  // A row should only reference rows that come before it (lower index)
  // The referencing row is already at its new position (currentRowIndex)
  const violates = newReferencedIndex >= currentRowIndex;

  return { violates, newReferencingIndex: currentRowIndex, newReferencedIndex };
}

/**
 * Update all row references in a document after rows have been moved
 *
 * @param rows - The array of rows in the document
 * @param positionMapping - Map from original position to new position
 * @returns Result containing update count and any warnings
 */
export function updateRowReferencesAfterMove(
  rows: Row[],
  positionMapping: Map<number, number>
): ReferenceUpdateResult {
  const result: ReferenceUpdateResult = {
    updatedCount: 0,
    warnings: [],
  };

  // If no rows were affected, nothing to update
  if (positionMapping.size === 0) {
    return result;
  }

  // Process each row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    // Check and update source extra
    if (
      sourceTypeUsesRowReferences(row.source.type.key) &&
      row.source.extra.keyOrValue !== EMPTY_KEY
    ) {
      const { highByte, lowByte } = splitExtraValue(row.source.extra.keyOrValue);

      // Check each byte that is a row reference
      for (const byteVal of [highByte, lowByte]) {
        if (isRowReferenceByte(byteVal)) {
          const referencedRowIndex = byteToRowIndex(byteVal);

          // Only process if the referenced row was affected by the move
          if (positionMapping.has(referencedRowIndex)) {
            const { violates, newReferencingIndex, newReferencedIndex } =
              checkDefinitionOrderViolation(
                rowIndex,
                referencedRowIndex,
                positionMapping
              );

            if (violates) {
              result.warnings.push({
                rowIndex: newReferencingIndex,
                referencedRowIndex,
                newReferencedRowIndex: newReferencedIndex,
                type: "definition_order",
                message: `Row ${newReferencingIndex} references Row ${newReferencedIndex}, but Row ${newReferencedIndex} is now defined after Row ${newReferencingIndex}. Check definition order.`,
              });
            }
          }
        }
      }

      // Update the extra
      const newExtra = createUpdatedSourceExtra(row.source.extra, positionMapping);
      if (newExtra !== row.source.extra) {
        row.source = new Source(row.source.type, row.source.function, newExtra);
        result.updatedCount++;
      }
    }

    // Check and update SETV destination FUNCTION row references
    if (row.destination.type.key === SETVAR_DESTINATION_TYPE_KEY) {
      const functionKey = row.destination.function.key;

      if (isRowReferenceFunctionKey(functionKey)) {
        const referencedRowIndex = functionKeyToRowIndex(functionKey);

        // Only process if the referenced row was affected by the move
        if (positionMapping.has(referencedRowIndex)) {
          const newRowIndex = positionMapping.get(referencedRowIndex)!;
          const newFunctionKey = rowIndexToFunctionKey(newRowIndex);

          // Create the new function object for the SETV destination
          // Format: "Mapping Row {hex} ({decimal})"
          const countHex = newRowIndex.toString(16).toUpperCase().padStart(2, "0");
          const newFunction = new DestinationFunction(
            newFunctionKey,
            `RW${countHex}`,
            `Mapping Row ${countHex}h (${newRowIndex})`
          );

          row.destination = new Destination(
            row.destination.type,
            newFunction,
            row.destination.extra
          );
          result.updatedCount++;

          // Check for definition order violation
          const { violates, newReferencingIndex, newReferencedIndex } =
            checkDefinitionOrderViolation(
              rowIndex,
              referencedRowIndex,
              positionMapping
            );

          if (violates) {
            result.warnings.push({
              rowIndex: newReferencingIndex,
              referencedRowIndex,
              newReferencedRowIndex: newReferencedIndex,
              type: "definition_order",
              message: `Row ${newReferencingIndex} references Row ${newReferencedIndex}, but Row ${newReferencedIndex} is now defined after Row ${newReferencingIndex}. Check definition order.`,
            });
          }
        }
      }
    }

    // Check and update destination extra
    if (
      destinationTypeUsesRowReferences(row.destination.type.key) &&
      row.destination.extra.keyOrValue !== EMPTY_KEY
    ) {
      const { highByte, lowByte } = splitExtraValue(
        row.destination.extra.keyOrValue
      );

      // Check each byte that is a row reference
      for (const byteVal of [highByte, lowByte]) {
        if (isRowReferenceByte(byteVal)) {
          const referencedRowIndex = byteToRowIndex(byteVal);

          // Only process if the referenced row was affected by the move
          if (positionMapping.has(referencedRowIndex)) {
            const { violates, newReferencingIndex, newReferencedIndex } =
              checkDefinitionOrderViolation(
                rowIndex,
                referencedRowIndex,
                positionMapping
              );

            if (violates) {
              result.warnings.push({
                rowIndex: newReferencingIndex,
                referencedRowIndex,
                newReferencedRowIndex: newReferencedIndex,
                type: "definition_order",
                message: `Row ${newReferencingIndex} references Row ${newReferencedIndex}, but Row ${newReferencedIndex} is now defined after Row ${newReferencingIndex}. Check definition order.`,
              });
            }
          }
        }
      }

      // Update the extra
      const newExtra = createUpdatedDestinationExtra(
        row.destination.extra,
        positionMapping
      );
      if (newExtra !== row.destination.extra) {
        row.destination = new Destination(
          row.destination.type,
          row.destination.function,
          newExtra
        );
        result.updatedCount++;
      }
    }
  }

  // Always add an info warning when rows are moved to remind user to check
  if (positionMapping.size > 0) {
    const movedRows = [...positionMapping.entries()]
      .filter(([from, to]) => from !== to)
      .map(([from]) => from);

    if (movedRows.length > 0) {
      result.warnings.push({
        rowIndex: -1,
        referencedRowIndex: -1,
        newReferencedRowIndex: -1,
        type: "info",
        message: `Rows moved. Please verify that any row references still have correct definition order.`,
      });
    }
  }

  return result;
}

/**
 * Build a reference map showing which rows reference (read from) each row
 * This is used for the row submonitor's "readers" display mode
 *
 * @param rows - The array of rows in the document
 * @returns A map from row index to array of row indices that reference it
 */
export function buildRowReadersMap(rows: Row[]): Map<number, number[]> {
  const readersMap = new Map<number, number[]>();

  // Initialize map with empty arrays for all rows
  for (let i = 0; i < rows.length; i++) {
    readersMap.set(i, []);
  }

  // For each row, find which rows it references
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const referencedIndices = getReferencedRowIndices(row);

    // For each row this row references, add this row as a reader
    for (const referencedIndex of referencedIndices) {
      const readers = readersMap.get(referencedIndex) ?? [];
      readers.push(rowIndex);
      readersMap.set(referencedIndex, readers);
    }
  }

  return readersMap;
}

/**
 * Get the row indices that read from a specific row
 *
 * @param rows - The array of rows in the document
 * @param targetRowIndex - The row index to find readers for
 * @returns Array of row indices that reference the target row
 */
export function getRowReaders(rows: Row[], targetRowIndex: number): number[] {
  const readersMap = buildRowReadersMap(rows);
  return readersMap.get(targetRowIndex) ?? [];
}
