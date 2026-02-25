/**
 * Command to paste only the destination portion of a row
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { type DestinationSnapshot, applyDestinationSnapshot } from './snapshotHelpers';
import { EMPTY_KEY } from '../modules/dataModel';

function buildDestinationSnapshot(doc: MappingDocument, rowIndex: number, selectedDestTypes: MappingType[]): DestinationSnapshot {
  const row = doc.rows[rowIndex];
  return {
    typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
    funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
    extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
    selectedTypeKey: selectedDestTypes[rowIndex]?.key ?? EMPTY_KEY
  };
}

export class PasteDestinationCommand implements Command {
  private oldSnapshot: DestinationSnapshot;
  private timestamp: number;

  constructor(
    private targetRowIndex: number,
    private pasteData: DestinationSnapshot,
    private mappingDocument: MappingDocument,
    private selectedDestTypes: MappingType[]
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildDestinationSnapshot(mappingDocument, targetRowIndex, selectedDestTypes);
  }

  execute(): void {
    const row = this.mappingDocument.rows[this.targetRowIndex];
    applyDestinationSnapshot(row, this.pasteData, this.selectedDestTypes);
  }

  undo(): void {
    const row = this.mappingDocument.rows[this.targetRowIndex];
    applyDestinationSnapshot(row, this.oldSnapshot, this.selectedDestTypes);
  }

  getDescription(): string {
    return `Paste destination to row ${this.targetRowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'PasteDestinationCommand',
      affectedRows: [this.targetRowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'PasteDestinationCommand',
      metadata: this.getMetadata(),
      payload: {
        targetRowIndex: this.targetRowIndex,
        pasteData: this.pasteData,
        oldSnapshot: this.oldSnapshot
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): PasteDestinationCommand {
    const p = payload as { targetRowIndex: number; pasteData: DestinationSnapshot; oldSnapshot: DestinationSnapshot };
    const cmd = new PasteDestinationCommand(
      p.targetRowIndex,
      p.pasteData,
      context.mappingDocument!,
      context.currentlySelectedDestTypes!
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
