/**
 * Command to set/clear row comment
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';

export class SetRowCommentCommand implements Command {
  private oldComment: string | null;

  constructor(
    private rowIndex: number,
    private newComment: string | null,
    private rowComments: Record<number, string>
  ) {
    // Capture current state during construction
    this.oldComment = rowComments[rowIndex] ?? null;
  }

  execute(): void {
    if (this.newComment === null || this.newComment.trim() === '') {
      delete this.rowComments[this.rowIndex];
    } else {
      this.rowComments[this.rowIndex] = this.newComment;
    }
  }

  undo(): void {
    if (this.oldComment === null) {
      delete this.rowComments[this.rowIndex];
    } else {
      this.rowComments[this.rowIndex] = this.oldComment;
    }
  }

  getDescription(): string {
    if (this.newComment === null || this.newComment.trim() === '') {
      return `Clear comment for row ${this.rowIndex + 1}`;
    }
    return `Set comment for row ${this.rowIndex + 1}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: Date.now(),
      type: 'SetRowCommentCommand',
      affectedRows: [this.rowIndex],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'SetRowCommentCommand',
      metadata: this.getMetadata(),
      payload: {
        rowIndex: this.rowIndex,
        newComment: this.newComment,
        oldComment: this.oldComment
      }
    };
  }

  static fromJSON(
    payload: unknown,
    context: DeserializationContext
  ): SetRowCommentCommand {
    const p = payload as {
      rowIndex: number;
      newComment: string | null;
      oldComment: string | null;
    };

    const cmd = new SetRowCommentCommand(
      p.rowIndex,
      p.newComment,
      context.rowComments
    );

    // Restore captured old state
    cmd.oldComment = p.oldComment;

    return cmd;
  }
}
