/**
 * Base command interface for undo/redo system
 */

import type { MappingDocument } from '../modules/documentModel';
import type { MappingType } from '../modules/dataModel';

export interface CommandMetadata {
  timestamp: number;
  type: string;
  affectedRows: number[];
  description: string;
}

export interface Command {
  /**
   * Execute the command (forward operation)
   */
  execute(): void;

  /**
   * Undo the command (reverse operation)
   */
  undo(): void;

  /**
   * Get human-readable description for UI
   */
  getDescription(): string;

  /**
   * Get metadata about the command
   */
  getMetadata(): CommandMetadata;

  /**
   * Serialize command for IndexedDB persistence
   */
  toJSON(): SerializedCommand;
}

export interface CommandResult {
  success: boolean;
  error?: string;
}

/**
 * Serialized form of a command for storage
 */
export interface SerializedCommand {
  type: string;
  payload: unknown;
  metadata: CommandMetadata;
}

/**
 * Context needed to reconstruct commands from serialized form
 */
export interface DeserializationContext {
  rowColors: Map<number, string>;
  rowComments: Record<number, string>;
  // Extended context for Phase 3 commands
  mappingDocument?: MappingDocument;
  currentlySelectedSourceTypes?: MappingType[];
  currentlySelectedDestTypes?: MappingType[];
}
