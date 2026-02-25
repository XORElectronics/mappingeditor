/**
 * Command to clear a single row (source + destination + comment + selected types)
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION, DataModel } from '../modules/dataModel';
import { type RowSnapshot, applyRowSnapshot } from './snapshotHelpers';

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

const EMPTY_SNAPSHOT_SOURCE = () => ({
  typeKey: EMPTY_KEY, typeAbbr: EMPTY_ABBR, typeDesc: EMPTY_DESCRIPTION,
  funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
  extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
  selectedTypeKey: DataModel.sourceTypes[0]?.key ?? EMPTY_KEY
});

const EMPTY_SNAPSHOT_DEST = () => ({
  typeKey: EMPTY_KEY, typeAbbr: EMPTY_ABBR, typeDesc: EMPTY_DESCRIPTION,
  funcKey: EMPTY_KEY, funcAbbr: EMPTY_ABBR, funcDesc: EMPTY_DESCRIPTION,
  extraKey: EMPTY_KEY, extraAbbr: EMPTY_ABBR, extraDesc: EMPTY_DESCRIPTION,
  selectedTypeKey: DataModel.destinationTypes[0]?.key ?? EMPTY_KEY
});

export class ClearRowCommand implements Command {
  private oldSnapshot: RowSnapshot;
  private timestamp: number;

  constructor(
    private rowIndex: number,
    private mappingDocument: MappingDocument,
    private rowComments: Record<number, string>,
    private selectedSourceTypes: MappingType[],
    private selectedDestTypes: MappingType[]
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildRowSnapshot(mappingDocument, rowIndex, selectedSourceTypes, selectedDestTypes, rowComments);
  }

  execute(): void {
    applyRowSnapshot(
      this.mappingDocument.rows,
      { rowIndex: this.rowIndex, source: EMPTY_SNAPSHOT_SOURCE(), destination: EMPTY_SNAPSHOT_DEST(), comment: null },
      this.selectedSourceTypes,
      this.selectedDestTypes,
      this.rowComments
    );
  }

  undo(): void {
    applyRowSnapshot(
      this.mappingDocument.rows,
      this.oldSnapshot,
      this.selectedSourceTypes,
      this.selectedDestTypes,
      this.rowComments
    );
  }

  getDescription(): string {
    return `Clear row ${this.rowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'ClearRowCommand',
      affectedRows: [this.rowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'ClearRowCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndex: this.rowIndex,
        oldSnapshot: this.oldSnapshot
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): ClearRowCommand {
    const p = payload as { rowIndex: number; oldSnapshot: RowSnapshot };
    const cmd = new ClearRowCommand(
      p.rowIndex,
      context.mappingDocument!,
      context.rowComments as Record<number, string>,
      context.currentlySelectedSourceTypes!,
      context.currentlySelectedDestTypes!
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
