/**
 * Command registry and deserialization
 */

import type { Command, SerializedCommand, DeserializationContext } from './Command';
import { SetRowColorCommand } from './SetRowColorCommand';
import { SetRowCommentCommand } from './SetRowCommentCommand';
import { BatchCommand } from './BatchCommand';
import { ClearRowCommand } from './ClearRowCommand';
import { PasteRowCommand } from './PasteRowCommand';
import { PasteSourceCommand } from './PasteSourceCommand';
import { PasteDestinationCommand } from './PasteDestinationCommand';
import { MoveRowsCommand } from './MoveRowsCommand';
import { SetVariableValueCommand } from './SetVariableValueCommand';
import { SetSourceCommand } from './SetSourceCommand';
import { SetDestinationCommand } from './SetDestinationCommand';
import { useWarningLog } from '../composables/useWarningLog';

/**
 * Deserialize a command from storage
 */
export function deserializeCommand(
  serialized: SerializedCommand,
  context: DeserializationContext
): Command | null {
  try {
    switch (serialized.type) {
      case 'SetRowColorCommand':
        return SetRowColorCommand.fromJSON(serialized.payload, context);
      case 'SetRowCommentCommand':
        return SetRowCommentCommand.fromJSON(serialized.payload, context);
      case 'BatchCommand': {
        // Handle inline to avoid circular imports from BatchCommand.ts
        const p = serialized.payload as { label: string | null; commands: SerializedCommand[] };
        const children = p.commands
          .map(s => deserializeCommand(s, context))
          .filter((c): c is Command => c !== null);
        return new BatchCommand(children, p.label ?? undefined);
      }
      case 'ClearRowCommand':
        return ClearRowCommand.fromJSON(serialized.payload, context);
      case 'PasteRowCommand':
        return PasteRowCommand.fromJSON(serialized.payload, context);
      case 'PasteSourceCommand':
        return PasteSourceCommand.fromJSON(serialized.payload, context);
      case 'PasteDestinationCommand':
        return PasteDestinationCommand.fromJSON(serialized.payload, context);
      case 'MoveRowsCommand':
        return MoveRowsCommand.fromJSON(serialized.payload, context);
      case 'SetVariableValueCommand':
        return SetVariableValueCommand.fromJSON(serialized.payload, context);
      case 'SetSourceCommand':
        return SetSourceCommand.fromJSON(serialized.payload, context);
      case 'SetDestinationCommand':
        return SetDestinationCommand.fromJSON(serialized.payload, context);
      default:
        useWarningLog().addDebug('command', `Unknown command type: ${serialized.type} — skipped`);
        return null;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    useWarningLog().addDebug('command', `Failed to deserialize command: ${errorMsg}`);
    return null;
  }
}

// Export all commands
export * from './Command';
export { SetRowColorCommand } from './SetRowColorCommand';
export { SetRowCommentCommand } from './SetRowCommentCommand';
export { BatchCommand } from './BatchCommand';
export { ClearRowCommand } from './ClearRowCommand';
export { PasteRowCommand } from './PasteRowCommand';
export { PasteSourceCommand } from './PasteSourceCommand';
export { PasteDestinationCommand } from './PasteDestinationCommand';
export { MoveRowsCommand } from './MoveRowsCommand';
export type { MoveRowsResult, MoveDirection } from './MoveRowsCommand';
export { SetVariableValueCommand } from './SetVariableValueCommand';
export { SetSourceCommand } from './SetSourceCommand';
export { SetDestinationCommand } from './SetDestinationCommand';
export type { SourceSnapshot, DestinationSnapshot, RowSnapshot } from './snapshotHelpers';
export {
  captureSourceSnapshot,
  captureDestinationSnapshot,
  captureRowSnapshot
} from './snapshotHelpers';
