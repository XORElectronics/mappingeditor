/**
 * Command to set a variable value (used by VariableMonitor fader)
 */

import type { Command, CommandMetadata, SerializedCommand, DeserializationContext } from './Command';
import type { MappingDocument } from '../modules/documentModel';

export class SetVariableValueCommand implements Command {
  private oldValue: number;
  private timestamp: number;

  constructor(
    private variableIndex: number,
    private newValue: number,
    private mappingDocument: MappingDocument
  ) {
    this.timestamp = Date.now();
    this.oldValue = mappingDocument.variables[variableIndex].value;
  }

  execute(): void {
    this.mappingDocument.variables[this.variableIndex].value = this.newValue;
  }

  undo(): void {
    this.mappingDocument.variables[this.variableIndex].value = this.oldValue;
  }

  getDescription(): string {
    const varName = String.fromCharCode(65 + this.variableIndex);
    return `Set Variable ${varName} to ${this.newValue}`;
  }

  getMetadata(): CommandMetadata {
    return {
      timestamp: this.timestamp,
      type: 'SetVariableValueCommand',
      affectedRows: [],
      description: this.getDescription()
    };
  }

  toJSON(): SerializedCommand {
    return {
      type: 'SetVariableValueCommand',
      metadata: this.getMetadata(),
      payload: {
        variableIndex: this.variableIndex,
        newValue: this.newValue,
        oldValue: this.oldValue
      }
    };
  }

  static fromJSON(payload: unknown, context: DeserializationContext): SetVariableValueCommand {
    const p = payload as { variableIndex: number; newValue: number; oldValue: number };
    const cmd = new SetVariableValueCommand(p.variableIndex, p.newValue, context.mappingDocument!);
    cmd.oldValue = p.oldValue;
    return cmd;
  }
}
