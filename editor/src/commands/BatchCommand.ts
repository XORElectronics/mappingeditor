/**
 * Composite command that groups multiple commands into one atomic undo/redo operation.
 * Deserialization is handled in commands/index.ts to avoid circular imports.
 */

import type { Command, CommandMetadata, SerializedCommand } from './Command';

export class BatchCommand implements Command {
  readonly timestamp: number;

  constructor(
    private commands: Command[],
    private label?: string
  ) {
    this.timestamp = Date.now();
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getDescription(): string {
    if (this.label) return this.label;
    return `Batch: ${this.commands.length} operation${this.commands.length !== 1 ? 's' : ''}`;
  }

  getMetadata(): CommandMetadata {
    const affectedRows = [...new Set(this.commands.flatMap(c => c.getMetadata().affectedRows))];
    return {
      timestamp: this.timestamp,
      type: 'BatchCommand',
      affectedRows,
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'BatchCommand',
      metadata: this.getMetadata(),
      payload: {
        label: this.label ?? null,
        commands: this.commands.map(c => c.toJSON())
      }
    };
  }
}
