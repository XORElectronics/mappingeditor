/**
 * Command to move rows up or down with full snapshot for undo support.
 * Uses full row snapshots to avoid needing inverse reference-update logic.
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument, Row as MappingRow } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { EMPTY_KEY } from '../modules/dataModel';
import {
  Source, SourceType, SourceFunction, SourceExtra,
  Destination, DestinationType, DestinationFunction, DestinationExtra
} from '../modules/documentModel';
import {
  buildPositionMapping,
  updateRowReferencesAfterMove,
  type ReferenceUpdateResult
} from '../services/rowReferenceService';
import { type RowSnapshot, applyRowSnapshot } from './snapshotHelpers';

export type MoveDirection = 'up' | 'down';

export interface MoveRowsResult {
  newIndices: number[];
  referenceUpdateResult: ReferenceUpdateResult;
}

function buildRowSnapshot(doc: MappingDocument, rowIndex: number, selectedSourceTypes: MappingType[], selectedDestTypes: MappingType[], rowComments: Record<number, string>): RowSnapshot {
  const row = doc.rows[rowIndex];
  return {
    rowIndex,
    source: {
      typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
      funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
      extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
      selectedTypeKey: selectedSourceTypes[rowIndex]?.key ?? EMPTY_KEY
    },
    destination: {
      typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
      funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
      extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
      selectedTypeKey: selectedDestTypes[rowIndex]?.key ?? EMPTY_KEY
    },
    comment: rowComments[rowIndex] ?? null
  };
}

export class MoveRowsCommand implements Command {
  private snapshots: RowSnapshot[];
  private timestamp: number;
  lastResult: MoveRowsResult = { newIndices: [], referenceUpdateResult: { updatedCount: 0, warnings: [] } };

  constructor(
    private rowIndices: number[],
    private direction: MoveDirection,
    private mappingDocument: MappingDocument,
    private rowComments: Record<number, string>,
    private selectedSourceTypes: MappingType[],
    private selectedDestTypes: MappingType[]
  ) {
    this.timestamp = Date.now();

    // Snapshot all involved rows (moved rows + their adjacent rows)
    const isUp = direction === 'up';
    const offset = isUp ? -1 : 1;
    const allIndices = new Set<number>(rowIndices);
    for (const idx of rowIndices) {
      const adj = idx + offset;
      if (adj >= 0 && adj < mappingDocument.rows.length) {
        allIndices.add(adj);
      }
    }

    this.snapshots = [...allIndices].map(idx =>
      buildRowSnapshot(mappingDocument, idx, selectedSourceTypes, selectedDestTypes, rowComments)
    );
  }

  execute(): void {
    const isUp = this.direction === 'up';
    const maxIndex = this.mappingDocument.rows.length - 1;
    const boundaryIndex = isUp ? 0 : maxIndex;
    const offset = isUp ? -1 : 1;
    const sorted = [...this.rowIndices].sort((a, b) => isUp ? a - b : b - a);

    if (sorted[0] === boundaryIndex) {
      this.lastResult = {
        newIndices: this.rowIndices,
        referenceUpdateResult: { updatedCount: 0, warnings: [] }
      };
      return;
    }

    const positionMapping = buildPositionMapping(this.rowIndices, this.direction);

    const newIndices: number[] = [];
    for (const idx of sorted) {
      const currentRow = this.mappingDocument.rows[idx];
      const adjacentRow = this.mappingDocument.rows[idx + offset];
      if (!currentRow || !adjacentRow) continue;

      swapRowData(currentRow, adjacentRow);
      swapComments(idx, idx + offset, this.rowComments);
      swapSelectedTypes(idx, idx + offset, this.selectedSourceTypes, this.selectedDestTypes);
      newIndices.push(idx + offset);
    }

    const referenceUpdateResult = updateRowReferencesAfterMove(
      this.mappingDocument.rows,
      positionMapping
    );

    this.lastResult = { newIndices, referenceUpdateResult };
  }

  undo(): void {
    for (const snap of this.snapshots) {
      applyRowSnapshot(
        this.mappingDocument.rows,
        snap,
        this.selectedSourceTypes,
        this.selectedDestTypes,
        this.rowComments
      );
    }
  }

  getDescription(): string {
    const dir = this.direction === 'up' ? 'up' : 'down';
    const count = this.rowIndices.length;
    return `Move ${count} row${count !== 1 ? 's' : ''} ${dir}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'MoveRowsCommand',
      affectedRows: this.rowIndices,
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'MoveRowsCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndices: this.rowIndices,
        direction: this.direction,
        snapshots: this.snapshots
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): MoveRowsCommand {
    const p = payload as {
      rowIndices: number[];
      direction: MoveDirection;
      snapshots: RowSnapshot[];
    };
    const cmd = new MoveRowsCommand(
      p.rowIndices,
      p.direction,
      context.mappingDocument!,
      context.rowComments as Record<number, string>,
      context.currentlySelectedSourceTypes!,
      context.currentlySelectedDestTypes!
    );
    cmd.snapshots = p.snapshots;
    return cmd;
  }
}

function swapRowData(rowA: MappingRow, rowB: MappingRow): void {
  const tempSource = new Source(
    new SourceType(rowA.source.type.key, rowA.source.type.abbr, rowA.source.type.description),
    new SourceFunction(rowA.source.function.key, rowA.source.function.abbr, rowA.source.function.description),
    new SourceExtra(rowA.source.extra.keyOrValue, rowA.source.extra.abbr, rowA.source.extra.description)
  );
  const tempDest = new Destination(
    new DestinationType(rowA.destination.type.key, rowA.destination.type.abbr, rowA.destination.type.description),
    new DestinationFunction(rowA.destination.function.key, rowA.destination.function.abbr, rowA.destination.function.description),
    new DestinationExtra(rowA.destination.extra.keyOrValue, rowA.destination.extra.abbr, rowA.destination.extra.description)
  );

  rowA.source = new Source(
    new SourceType(rowB.source.type.key, rowB.source.type.abbr, rowB.source.type.description),
    new SourceFunction(rowB.source.function.key, rowB.source.function.abbr, rowB.source.function.description),
    new SourceExtra(rowB.source.extra.keyOrValue, rowB.source.extra.abbr, rowB.source.extra.description)
  );
  rowA.destination = new Destination(
    new DestinationType(rowB.destination.type.key, rowB.destination.type.abbr, rowB.destination.type.description),
    new DestinationFunction(rowB.destination.function.key, rowB.destination.function.abbr, rowB.destination.function.description),
    new DestinationExtra(rowB.destination.extra.keyOrValue, rowB.destination.extra.abbr, rowB.destination.extra.description)
  );

  rowB.source = tempSource;
  rowB.destination = tempDest;
}

function swapComments(idxA: number, idxB: number, rowComments: Record<number, string>): void {
  const tempComment = rowComments[idxA] ?? '';
  rowComments[idxA] = rowComments[idxB] ?? '';
  if (!rowComments[idxA]) delete rowComments[idxA];
  rowComments[idxB] = tempComment;
  if (!rowComments[idxB]) delete rowComments[idxB];
}

function swapSelectedTypes(
  idxA: number,
  idxB: number,
  selectedSourceTypes: MappingType[],
  selectedDestTypes: MappingType[]
): void {
  const tempSrc = selectedSourceTypes[idxA];
  const tempDst = selectedDestTypes[idxA];
  selectedSourceTypes[idxA] = selectedSourceTypes[idxB];
  selectedDestTypes[idxA] = selectedDestTypes[idxB];
  selectedSourceTypes[idxB] = tempSrc;
  selectedDestTypes[idxB] = tempDst;
}
