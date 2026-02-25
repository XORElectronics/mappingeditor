/**
 * Command to set source type, function, and/or extra fields on a row.
 * Captures the full source snapshot for clean undo/redo.
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { EMPTY_KEY } from '../modules/dataModel';
import { type SourceSnapshot, applySourceSnapshot } from './snapshotHelpers';

function buildSourceSnapshot(doc: MappingDocument, rowIndex: number, selectedSourceTypes: MappingType[]): SourceSnapshot {
  const row = doc.rows[rowIndex];
  return {
    typeKey: row.source.type.key, typeAbbr: row.source.type.abbr, typeDesc: row.source.type.description,
    funcKey: row.source.function.key, funcAbbr: row.source.function.abbr, funcDesc: row.source.function.description,
    extraKey: row.source.extra.keyOrValue, extraAbbr: row.source.extra.abbr, extraDesc: row.source.extra.description,
    selectedTypeKey: selectedSourceTypes[rowIndex]?.key ?? EMPTY_KEY
  };
}

export class SetSourceCommand implements Command {
  private oldSnapshot: SourceSnapshot;
  private timestamp: number;

  constructor(
    private rowIndex: number,
    private newSnapshot: SourceSnapshot,
    private mappingDocument: MappingDocument,
    private selectedSourceTypes: MappingType[],
    private descriptionLabel?: string
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildSourceSnapshot(mappingDocument, rowIndex, selectedSourceTypes);
  }

  execute(): void {
    const row = this.mappingDocument.rows[this.rowIndex];
    applySourceSnapshot(row, this.newSnapshot, this.selectedSourceTypes);
  }

  undo(): void {
    const row = this.mappingDocument.rows[this.rowIndex];
    applySourceSnapshot(row, this.oldSnapshot, this.selectedSourceTypes);
  }

  getDescription(): string {
    return this.descriptionLabel ?? `Set source for row ${this.rowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'SetSourceCommand',
      affectedRows: [this.rowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'SetSourceCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndex: this.rowIndex,
        newSnapshot: this.newSnapshot,
        oldSnapshot: this.oldSnapshot,
        descriptionLabel: this.descriptionLabel ?? null
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): SetSourceCommand {
    const p = payload as {
      rowIndex: number;
      newSnapshot: SourceSnapshot;
      oldSnapshot: SourceSnapshot;
      descriptionLabel: string | null;
    };
    const cmd = new SetSourceCommand(
      p.rowIndex,
      p.newSnapshot,
      context.mappingDocument!,
      context.currentlySelectedSourceTypes!,
      p.descriptionLabel ?? undefined
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
