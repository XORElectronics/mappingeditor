/**
 * Command to set/clear row background color
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';

export class SetRowColorCommand implements Command {
  private oldColor: string | null;

  constructor(
    private rowIndex: number,
    private newColor: string | null,
    private rowColors: Map<number, string>
  ) {
    // Capture current state during construction
    this.oldColor = rowColors.get(rowIndex) ?? null;
  }

  execute(): void {
    if (this.newColor === null) {
      this.rowColors.delete(this.rowIndex);
    } else {
      this.rowColors.set(this.rowIndex, this.newColor);
    }
  }

  undo(): void {
    if (this.oldColor === null) {
      this.rowColors.delete(this.rowIndex);
    } else {
      this.rowColors.set(this.rowIndex, this.oldColor);
    }
  }

  getDescription(): string {
    if (this.newColor === null) {
      return `Clear color for row ${this.rowIndex + 1}`;
    }
    return `Set row ${this.rowIndex + 1} color to ${this.newColor}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: Date.now(),
      type: 'SetRowColorCommand',
      affectedRows: [this.rowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'SetRowColorCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndex: this.rowIndex,
        newColor: this.newColor,
        oldColor: this.oldColor
      }
    };
  }

  static fromJSON(
    payload: unknown,
    context: DeserializationContext
  ): SetRowColorCommand {
    const p = payload as {
      rowIndex: number;
      newColor: string | null;
      oldColor: string | null;
    };

    const cmd = new SetRowColorCommand(
      p.rowIndex,
      p.newColor,
      context.rowColors
    );

    // Restore captured old state
    cmd.oldColor = p.oldColor;

    return cmd;
  }
}
