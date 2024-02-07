import * as docModel from './documentModel.js'
import * as dataModel from './dataModel.js'

export class MappingDocumentParser {
  private static readonly HEADER_LENGTH = 70;
  private static readonly VARIABLES_OFFSET = 1470;

  public static parse(buffer: Uint8Array): docModel.MappingDocument {
    const document = new docModel.MappingDocument();
    const headerData = buffer.slice(0, MappingDocumentParser.HEADER_LENGTH);
    document.header = HeaderParser.parse(headerData);
    const rowsData = buffer.slice(MappingDocumentParser.HEADER_LENGTH);
    document.rows = RowsParser.parse(rowsData);
    const variablesData = buffer.slice(MappingDocumentParser.VARIABLES_OFFSET);
    document.variables = VariablesParser.parse(new Uint16Array(variablesData.buffer));
    return document;
  }
}

class HeaderParser {
  private static readonly HEADER_TEXT_LENGTH = 16;
  private static readonly MAJOR_VERSION_OFFSET = 16;
  private static readonly MINOR_VERSION_OFFSET = 17;
  private static readonly FILE_NAME_OFFSET = 18;
  private static readonly FILE_NAME_LENGTH = 12;

  public static parse(buffer: Uint8Array): docModel.Header {
    const header = new docModel.Header();
    const textDecoder = new TextDecoder();

    header.headerText = textDecoder.decode(buffer.slice(0, HeaderParser.HEADER_TEXT_LENGTH)).replace(/[\0\s]+$/, ''); // remove trailing nulls and spaces
    header.majorVersion = buffer[HeaderParser.MAJOR_VERSION_OFFSET];
    header.minorVersion = buffer[HeaderParser.MINOR_VERSION_OFFSET];
    header.fileName = textDecoder.decode(buffer.slice(HeaderParser.FILE_NAME_OFFSET, HeaderParser.FILE_NAME_OFFSET + HeaderParser.FILE_NAME_LENGTH)).replace(/[\0\s]+$/, ''); // remove trailing nulls and spaces
    header.variant = ''; // variant is not encoded in the file yet
    // ignore next 40 bytes (reserved)

    return header;
  }
}

class RowsParser {
  private static readonly ROW_LENGTH = 20;
  private static readonly ROW_COUNT = 70;

  public static parse(buffer: Uint8Array): docModel.Row[] {
    const rows: docModel.Row[] = new Array<docModel.Row>(RowsParser.ROW_COUNT);
    for (let rowCount = 0; rowCount < RowsParser.ROW_COUNT; rowCount++) {
      const startIndex = rowCount * RowsParser.ROW_LENGTH;
      const endIndex = startIndex + RowsParser.ROW_LENGTH;
      const rowBuffer8 = buffer.slice(startIndex, endIndex);
      const rowBuffer16 = new Uint16Array(rowBuffer8.buffer);
      const row = RowParser.parse(rowBuffer16, rowCount);
      rows[rowCount] = row;
    }
    return rows;
  }
}

class RowParser {
  public static parse(buffer: Uint16Array, rowIndex: number): docModel.Row {
    const row = new docModel.Row();

    row.index = rowIndex;
    const sourceBuffer = buffer.slice(0, 3);
    row.source = SourceParser.parse(sourceBuffer);
    const destinationBuffer = buffer.slice(3, 7);
    row.destination = DestinationParser.parse(destinationBuffer);

    return row;
  }
}

class SourceParser {
  public static parse(buffer: Uint16Array): docModel.Source {
    const source = new docModel.Source();
    const typeKey = buffer[0];
    const functionKey = buffer[1];
    const extraKey = buffer[2];
    const [sourceType, mappingType] = SourceTypeParser.parse(typeKey);
    source.type = sourceType;
    source.function = SourceFunctionParser.parse(functionKey, mappingType);
    source.extra = SourceExtraParser.parse(extraKey, functionKey, mappingType);
    return source;
  }
}

class SourceTypeParser {
  public static parse(key: number): [docModel.SourceType, dataModel.MappingType] {
    const sourceMappingType = dataModel.DataModel.sourceTypes.find((c) => c.key === key) as dataModel.MappingType;
    if (!sourceMappingType) {
      throw new Error(`Unknown source type ${key}`);
    }
    const sourceType = new docModel.SourceType(sourceMappingType.key, sourceMappingType.abbr, sourceMappingType.description)
    return [sourceType, sourceMappingType];
  }
}

class SourceFunctionParser {
  public static parse(key: number, sourceTypeLookup: dataModel.MappingType): docModel.SourceFunction {
    const sourceMappingFunction = sourceTypeLookup?.functions.find((c) => c.key === key) as dataModel.MappingTuple;
    if (!sourceMappingFunction) {
      throw new Error(`Unknown source function ${key} for source type ${sourceTypeLookup.key}`);
    }
    const sourceFunction = new docModel.SourceFunction(sourceMappingFunction.key, sourceMappingFunction.abbr, sourceMappingFunction.description);
    return sourceFunction;
  }
}

export class SourceExtraParser {
  public static parse(key: number, sourceFunctionKey: number, sourceMappingType: dataModel.MappingType): docModel.SourceExtra {
    if
      (!sourceMappingType) {
      throw new Error(`sourceTypeLookup is null or undefined`);
    }

    if (key === dataModel.EMPTY_KEY) {
      return new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
    }

    let sourceExtra: docModel.SourceExtra;

    switch (sourceMappingType.key) {
      case dataModel.MIDI_NRPN_SOURCE_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genNrpnSourceExtraDnA(key);
          sourceExtra = new docModel.SourceExtra(key, abbr, description);
          break;
        }
      case dataModel.VAR_SOURCE_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genVarSourceExtraDnA(key);
          sourceExtra = new docModel.SourceExtra(key, abbr, description);
          break;
        }
      case dataModel.CALC_SOURCE_TYPE_KEY:
      case dataModel.SKIP_SOURCE_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genCalcSkipSourceExtraDnA(key);
          sourceExtra = new docModel.SourceExtra(key, abbr, description);
          break;
        }
      case dataModel.EXTERNAL_SOURCE_TYPE_KEY:
        {
          switch (sourceFunctionKey) {
            case dataModel.EMPTY_KEY:
              {
                sourceExtra = new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
                break;
              }
            case dataModel.KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY:
              {
                const sourceEx = dataModel.keyboardSourceExtras.find((c) => c.key === key) as dataModel.MappingTuple
                if (!sourceEx) {
                  throw new Error(`Unknown Keyboard Source Function Extra ${key}`);
                }
                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                break;
              }
            case dataModel.SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY:
              {
                const sourceEx = dataModel.keyboardSourceExtras.find((c) => c.key === key) as dataModel.MappingTuple
                if (!sourceEx) {
                  throw new Error(`Unknown Sega GamePad Source Function Extra ${key}`);
                }
                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                break;
              }
            default:
              {
                throw new Error(`Unknown External Source Function ${sourceFunctionKey}`);
              }
          }
        }
      default:
        {
          const sourceEx = sourceMappingType?.extras.find((e) => e.key === key) as dataModel.MappingTuple;
          if (!sourceEx) {
            throw new Error(`Unknown Source Function Extra ${key}`);
          }
          sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
          break;
        }
    }
    return sourceExtra ?? new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
  }
}

class DestinationParser {
  public static parse(buffer: Uint16Array): docModel.Destination {
    const destination = new docModel.Destination();
    const typeKey = buffer[0];
    const functionKey = buffer[1];
    const extraKey = buffer[2];
    const [destinationType, mappingType] = DestinationTypeParser.parse(typeKey);
    destination.type = destinationType;
    destination.function = DestinationFunctionParser.parse(functionKey, mappingType);
    destination.extra = DestinationExtraParser.parse(extraKey, functionKey, mappingType);
    return destination;
  }
}

class DestinationTypeParser {
  public static parse(key: number): [docModel.DestinationType, dataModel.MappingType] {
    const destinationMappingType = dataModel.DataModel.destinationTypes?.find((c) => c.key === key) as dataModel.MappingType;
    if (!destinationMappingType) {
      throw new Error(`Unknown source type ${key}`);
    };
    const destinationType = new docModel.DestinationType(destinationMappingType.key, destinationMappingType.abbr, destinationMappingType.description)
    return [destinationType, destinationMappingType];
  }
}

class DestinationFunctionParser {
  public static parse(key: number, destinationMappingType: dataModel.MappingType): docModel.DestinationFunction {
    const destinationFunctionLookup = destinationMappingType?.functions.find((c) => c.key === key) as dataModel.MappingTuple;
    if (!destinationFunctionLookup) {
      throw new Error(`Unknown source type ${key}`);
    }
    const sourceFunction = new docModel.DestinationFunction(destinationFunctionLookup.key, destinationFunctionLookup.abbr, destinationFunctionLookup.description);
    return sourceFunction;
  }
}

class DestinationExtraParser {
  public static parse(key: number, destinationFunctionKey: number, destinationMappingType: dataModel.MappingType): docModel.DestinationExtra {
    if
      (!destinationMappingType) {
      throw new Error(`destinationMappingType is null or undefined`);
    }

    if (key === dataModel.EMPTY_KEY) {
      return new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
    }

    let destinationExtra: docModel.DestinationExtra;

    switch (destinationMappingType.key) {
      case dataModel.GLOBAL_DESTINATION_TYPE_KEY:
        {
          switch (destinationFunctionKey) {
            case dataModel.GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY:
              {
                const destExtra = dataModel.globalButtonsDestinationExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown Global Buttons Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY:
              {
                const destExtra = dataModel.globalScreensDestinationExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown Global Screens Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.GLOBAL_MODES_DESTINATION_FUNCTION_KEY:
              {
                const destExtra = dataModel.globalModesDestinationExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown Global Modes Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            default:
              {
                throw new Error(`Unknown External Destination Function ${destinationFunctionKey}`);
              }
          }
        }
      case dataModel.MIDI_CC_DESTINATION_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genMidiCcDestinationDnA(key);
          destinationExtra = new docModel.DestinationExtra(key, abbr, description);
          break
        }
      default:
        {
          const destExtra = destinationMappingType?.extras.find((e) => e.key === key) as dataModel.MappingTuple;
          if (!destExtra) {
            throw new Error(`Unknown Destination Function Extra ${key}`);
          }
          destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
          break;
        }
    }
    return destinationExtra ?? new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
  }
}

class VariablesParser {
  private static readonly VARIABLE_COUNT = 16;
  public static parse(buffer: Uint16Array): docModel.Variable[] {

    const variables: docModel.Variable[] = new Array<docModel.Variable>(VariablesParser.VARIABLE_COUNT);

    for (let index = 0; index < VariablesParser.VARIABLE_COUNT; index++) {
      const varName = `Variable ${String.fromCharCode(65 + index)}`;
      const varValue = buffer[index];
      const variable = new docModel.Variable(varName, varValue);
      variables[index] = variable;
    }

    return variables;
  }
}




