/**
 * Command to paste a full row (source + destination) to a target position
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { type RowSnapshot, applyRowSnapshot } from './snapshotHelpers';
import { EMPTY_KEY } from '../modules/dataModel';

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

export class PasteRowCommand implements Command {
  private oldSnapshot: RowSnapshot;
  private timestamp: number;

  constructor(
    private targetRowIndex: number,
    private pasteData: RowSnapshot,
    private mappingDocument: MappingDocument,
    private rowComments: Record<number, string>,
    private selectedSourceTypes: MappingType[],
    private selectedDestTypes: MappingType[]
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildRowSnapshot(mappingDocument, targetRowIndex, selectedSourceTypes, selectedDestTypes, rowComments);
  }

  execute(): void {
    const snapWithTargetIndex: RowSnapshot = { ...this.pasteData, rowIndex: this.targetRowIndex };
    applyRowSnapshot(
      this.mappingDocument.rows,
      snapWithTargetIndex,
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
    return `Paste row to position ${this.targetRowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'PasteRowCommand',
      affectedRows: [this.targetRowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'PasteRowCommand',
      metadata: this.getMetadata(),
      payload: {
        targetRowIndex: this.targetRowIndex,
        pasteData: this.pasteData,
        oldSnapshot: this.oldSnapshot
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): PasteRowCommand {
    const p = payload as { targetRowIndex: number; pasteData: RowSnapshot; oldSnapshot: RowSnapshot };
    const cmd = new PasteRowCommand(
      p.targetRowIndex,
      p.pasteData,
      context.mappingDocument!,
      context.rowComments as Record<number, string>,
      context.currentlySelectedSourceTypes!,
      context.currentlySelectedDestTypes!
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
