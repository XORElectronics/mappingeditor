/**
 * Command to paste only the source portion of a row
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { type SourceSnapshot, applySourceSnapshot } from './snapshotHelpers';
import { EMPTY_KEY } from '../modules/dataModel';

function buildSourceSnapshot(doc: MappingDocument, rowIndex: number, selectedSourceTypes: MappingType[]): SourceSnapshot {
  const row = doc.rows[rowIndex];
  return {
    typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
    funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
    extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
    selectedTypeKey: selectedSourceTypes[rowIndex]?.key ?? EMPTY_KEY
  };
}

export class PasteSourceCommand implements Command {
  private oldSnapshot: SourceSnapshot;
  private timestamp: number;

  constructor(
    private targetRowIndex: number,
    private pasteData: SourceSnapshot,
    private mappingDocument: MappingDocument,
    private selectedSourceTypes: MappingType[]
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildSourceSnapshot(mappingDocument, targetRowIndex, selectedSourceTypes);
  }

  execute(): void {
    const row = this.mappingDocument.rows[this.targetRowIndex];
    applySourceSnapshot(row, this.pasteData, this.selectedSourceTypes);
  }

  undo(): void {
    const row = this.mappingDocument.rows[this.targetRowIndex];
    applySourceSnapshot(row, this.oldSnapshot, this.selectedSourceTypes);
  }

  getDescription(): string {
    return `Paste source to row ${this.targetRowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'PasteSourceCommand',
      affectedRows: [this.targetRowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'PasteSourceCommand',
      metadata: this.getMetadata(),
      payload: {
        targetRowIndex: this.targetRowIndex,
        pasteData: this.pasteData,
        oldSnapshot: this.oldSnapshot
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): PasteSourceCommand {
    const p = payload as { targetRowIndex: number; pasteData: SourceSnapshot; oldSnapshot: SourceSnapshot };
    const cmd = new PasteSourceCommand(
      p.targetRowIndex,
      p.pasteData,
      context.mappingDocument!,
      context.currentlySelectedSourceTypes!
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
