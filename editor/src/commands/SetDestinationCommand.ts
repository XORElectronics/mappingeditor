/**
 * Command to set destination type, function, and/or extra fields on a row.
 * Captures the full destination snapshot for clean undo/redo.
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';
import { EMPTY_KEY } from '../modules/dataModel';
import { type DestinationSnapshot, applyDestinationSnapshot } from './snapshotHelpers';

function buildDestinationSnapshot(doc: MappingDocument, rowIndex: number, selectedDestTypes: MappingType[]): DestinationSnapshot {
  const row = doc.rows[rowIndex];
  return {
    typeKey: row.destination.type.key, typeAbbr: row.destination.type.abbr, typeDesc: row.destination.type.description,
    funcKey: row.destination.function.key, funcAbbr: row.destination.function.abbr, funcDesc: row.destination.function.description,
    extraKey: row.destination.extra.keyOrValue, extraAbbr: row.destination.extra.abbr, extraDesc: row.destination.extra.description,
    selectedTypeKey: selectedDestTypes[rowIndex]?.key ?? EMPTY_KEY
  };
}

export class SetDestinationCommand implements Command {
  private oldSnapshot: DestinationSnapshot;
  private timestamp: number;

  constructor(
    private rowIndex: number,
    private newSnapshot: DestinationSnapshot,
    private mappingDocument: MappingDocument,
    private selectedDestTypes: MappingType[],
    private descriptionLabel?: string
  ) {
    this.timestamp = Date.now();
    this.oldSnapshot = buildDestinationSnapshot(mappingDocument, rowIndex, selectedDestTypes);
  }

  execute(): void {
    const row = this.mappingDocument.rows[this.rowIndex];
    applyDestinationSnapshot(row, this.newSnapshot, this.selectedDestTypes);
  }

  undo(): void {
    const row = this.mappingDocument.rows[this.rowIndex];
    applyDestinationSnapshot(row, this.oldSnapshot, this.selectedDestTypes);
  }

  getDescription(): string {
    return this.descriptionLabel ?? `Set destination for row ${this.rowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'SetDestinationCommand',
      affectedRows: [this.rowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'SetDestinationCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndex: this.rowIndex,
        newSnapshot: this.newSnapshot,
        oldSnapshot: this.oldSnapshot,
        descriptionLabel: this.descriptionLabel ?? null
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): SetDestinationCommand {
    const p = payload as {
      rowIndex: number;
      newSnapshot: DestinationSnapshot;
      oldSnapshot: DestinationSnapshot;
      descriptionLabel: string | null;
    };
    const cmd = new SetDestinationCommand(
      p.rowIndex,
      p.newSnapshot,
      context.mappingDocument!,
      context.currentlySelectedDestTypes!,
      p.descriptionLabel ?? undefined
    );
    cmd.oldSnapshot = p.oldSnapshot;
    return cmd;
  }
}
