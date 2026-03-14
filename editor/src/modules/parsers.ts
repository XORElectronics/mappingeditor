import * as docModel from './documentModel.js'
import * as dataModel from './dataModel.js'

export class MappingDocumentParser {
  private static readonly HEADER_LENGTH = 70;
  private static readonly VARIABLES_OFFSET = 1470;

  public static parse(buffer: Uint8Array): docModel.MappingDocument {
    try {
      console.log(`Parsing binary file: ${buffer.length} bytes`);

      if (buffer.length < MappingDocumentParser.HEADER_LENGTH) {
        throw new Error(`File too short: ${buffer.length} bytes, expected at least ${MappingDocumentParser.HEADER_LENGTH} bytes for header`);
      }

      const document = new docModel.MappingDocument();

      // Parse header
      const headerData = buffer.slice(0, MappingDocumentParser.HEADER_LENGTH);
      console.log(`Parsing header: ${headerData.length} bytes`);
      document.header = HeaderParser.parse(headerData);

      // Parse rows
      const rowsData = buffer.slice(MappingDocumentParser.HEADER_LENGTH, MappingDocumentParser.VARIABLES_OFFSET);
      document.rows = RowsParser.parse(rowsData);

      // Parse variables
      if (buffer.length < MappingDocumentParser.VARIABLES_OFFSET + 32) {
        throw new Error(`File too short for variables: ${buffer.length} bytes, expected at least ${MappingDocumentParser.VARIABLES_OFFSET + 32} bytes`);
      }

      const variablesData = buffer.slice(MappingDocumentParser.VARIABLES_OFFSET);
      document.variables = VariablesParser.parse(new Uint16Array(variablesData.buffer, variablesData.byteOffset, variablesData.byteLength / 2));


      return document;
    } catch (error) {
      console.error('Binary parsing error:', error);
      throw new Error(`Binary file parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Parse a JSON mapping file. Handles both old and new JSON formats.
   *  Does NOT process editorMetadata (colors, comments) — use useFileHandling for full load. */
  public static parseJson(jsonText: string): docModel.MappingDocument {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j = JSON.parse(jsonText) as any;
    const doc = new docModel.MappingDocument();

    // Header — old format: header is object; new format: header is string
    if (j.header && typeof j.header === 'object') {
      if (typeof j.header.headerText === 'string') doc.header.headerText = j.header.headerText;
      if (typeof j.header.majorVersion === 'number') doc.header.majorVersion = j.header.majorVersion;
      if (typeof j.header.minorVersion === 'number') doc.header.minorVersion = j.header.minorVersion;
      if (typeof j.header.fileName === 'string') doc.header.fileName = j.header.fileName;
    } else if (Array.isArray(j.mappings)) {
      if (typeof j.header === 'string') doc.header.headerText = j.header;
      if (typeof j.versionMajor === 'number') doc.header.majorVersion = j.versionMajor;
      if (typeof j.versionMinor === 'number') doc.header.minorVersion = j.versionMinor;
      if (typeof j.filename === 'string') doc.header.fileName = j.filename;
    }

    // Rows
    const rowsData: unknown[] = Array.isArray(j.rows) ? j.rows : (Array.isArray(j.mappings) ? j.mappings : []);
    for (let i = 0; i < doc.rows.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rd = rowsData[i] as any;
      if (!rd) continue;
      const row = doc.rows[i];

      const srcTypeKey: number = rd.source?.type ?? rd.sourceType ?? dataModel.EMPTY_KEY;
      const srcFnKey: number = rd.source?.function ?? rd.sourceFunction ?? dataModel.EMPTY_KEY;
      const srcExKey: number = rd.source?.extra ?? rd.sourceFunctionExtra ?? dataModel.EMPTY_KEY;

      if (srcTypeKey === dataModel.EMPTY_KEY) {
        row.source = new docModel.Source(
          new docModel.SourceType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
          new docModel.SourceFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
          new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
        );
      } else {
        const srcTypeData = dataModel.DataModel.sourceTypes.find(s => s.key === srcTypeKey) as dataModel.MappingType | undefined;
        const srcType = srcTypeData
          ? new docModel.SourceType(srcTypeData.key, srcTypeData.abbr, srcTypeData.description)
          : new docModel.SourceType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        const srcFnData = srcTypeData?.functions.find((f: dataModel.MappingTuple) => f.key === srcFnKey);
        const srcFn = srcFnData
          ? new docModel.SourceFunction(srcFnData.key, srcFnData.abbr, srcFnData.description)
          : new docModel.SourceFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        const srcExData = srcTypeData?.extras?.find((e: dataModel.MappingTuple) => e.key === srcExKey);
        const srcEx = srcExData
          ? new docModel.SourceExtra(srcExData.key, srcExData.abbr, srcExData.description)
          : new docModel.SourceExtra(srcExKey, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        row.source = new docModel.Source(srcType, srcFn, srcEx);
      }

      const dstTypeKey: number = rd.destination?.type ?? rd.destinationType ?? dataModel.EMPTY_KEY;
      const dstFnKey: number = rd.destination?.function ?? rd.destinationFunction ?? dataModel.EMPTY_KEY;
      const dstExKey: number = rd.destination?.extra ?? rd.destinationFunctionExtra ?? dataModel.EMPTY_KEY;

      if (dstTypeKey === dataModel.EMPTY_KEY) {
        row.destination = new docModel.Destination(
          new docModel.DestinationType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
          new docModel.DestinationFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
          new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION),
        );
      } else {
        const dstTypeData = dataModel.DataModel.destinationTypes.find(d => d.key === dstTypeKey) as dataModel.MappingType | undefined;
        const dstType = dstTypeData
          ? new docModel.DestinationType(dstTypeData.key, dstTypeData.abbr, dstTypeData.description)
          : new docModel.DestinationType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        const dstFnData = dstTypeData?.functions.find((f: dataModel.MappingTuple) => f.key === dstFnKey);
        const dstFn = dstFnData
          ? new docModel.DestinationFunction(dstFnData.key, dstFnData.abbr, dstFnData.description)
          : new docModel.DestinationFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        const dstExData = dstTypeData?.extras?.find((e: dataModel.MappingTuple) => e.key === dstExKey);
        const dstEx = dstExData
          ? new docModel.DestinationExtra(dstExData.key, dstExData.abbr, dstExData.description)
          : new docModel.DestinationExtra(dstExKey, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        row.destination = new docModel.Destination(dstType, dstFn, dstEx);
      }

      if (typeof rd.unused1 === 'number') row.unused1 = rd.unused1;
      if (typeof rd.unused2 === 'number') row.unused2 = rd.unused2;
      if (typeof rd.unused3 === 'number') row.unused3 = rd.unused3;
      if (typeof rd.unused4 === 'number') row.unused4 = rd.unused4;
    }

    // Variables
    if (Array.isArray(j.variables)) {
      for (let i = 0; i < doc.variables.length && i < j.variables.length; i++) {
        const v = j.variables[i];
        if (typeof v === 'number') doc.variables[i].value = v;
        else if (v && typeof v.value === 'number') doc.variables[i].value = v.value;
      }
    }

    return doc;
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
    // Preserve the 40 reserved bytes (30-69)
    header.reserved = buffer.slice(30, 70);

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
    
    // Check if this is an empty row (all 0xFFFF values)
    const isEmpty = buffer.every(value => value === 0xFFFF);
    if (isEmpty) {
      // Create empty source and destination with default values
      row.source = new docModel.Source();
      row.source.type = new docModel.SourceType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      row.source.function = new docModel.SourceFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      row.source.extra = new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      
      row.destination = new docModel.Destination();
      row.destination.type = new docModel.DestinationType(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      row.destination.function = new docModel.DestinationFunction(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      row.destination.extra = new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
      
      // Set default values for empty rows
      row.channel = 1;
      row.minValue = -2048;
      row.maxValue = 2047;
      row.offset = 0;
      
      return row;
    }
    
    const sourceBuffer = buffer.slice(0, 3);
    row.source = SourceParser.parse(sourceBuffer);
    const destinationBuffer = buffer.slice(3, 6);
    row.destination = DestinationParser.parse(destinationBuffer);
    
    // Preserve the unused fields from the binary format
    row.unused1 = buffer[6];
    row.unused2 = buffer[7];
    row.unused3 = buffer[8];
    row.unused4 = buffer[9];
    
    // Set default values for UI fields (these are not stored in the binary format)
    row.channel = 1;
    row.minValue = -2048;
    row.maxValue = 2047;
    row.offset = 0;

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
                const sourceEx = dataModel.segaGamepadSourceExtras.find((c) => c.key === key) as dataModel.MappingTuple
                if (!sourceEx) {
                  throw new Error(`Unknown Sega GamePad Source Function Extra ${key}`);
                }
                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                break;
              }
            case dataModel.NERDSEQ_BUTTONS_EXTERNAL_SOURCE_FUNCTION_KEY:
              {
                const sourceEx = dataModel.nerdseqButtonsSourceExtras.find((c) => c.key === key) as dataModel.MappingTuple
                if (!sourceEx) {
                  throw new Error(`Unknown NerdSEQ Buttons Source Function Extra ${key}`);
                }
                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                break;
              }
            default:
              {
                throw new Error(`Unknown External Source Function ${sourceFunctionKey}`);
              }
          }
          break;
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
          break;
        }
      case dataModel.MIDI_CC_DESTINATION_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genMidiCcDestinationDnA(key);
          destinationExtra = new docModel.DestinationExtra(key, abbr, description);
          break
        }
      case dataModel.VISU_DESTINATION_TYPE_KEY:
        {
          switch (destinationFunctionKey) {
            case dataModel.VISU_SHADER_SELECT_FUNCTION_KEY:
              {
                const destExtra = dataModel.visuShaderSelectExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown VISU Shader Select Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.VISU_SHADER_FUNCTIONS_FUNCTION_KEY:
              {
                const destExtra = dataModel.visuShaderFunctionsExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown VISU Shader Functions Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.VISU_MODULATORS_FUNCTION_KEY:
              {
                const destExtra = dataModel.visuModulatorsExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown VISU Modulators Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.VISU_ENVELOPES_FUNCTION_KEY:
              {
                const destExtra = dataModel.visuEnvelopesExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown VISU Envelopes Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            case dataModel.VISU_LFOS_FUNCTION_KEY:
              {
                const destExtra = dataModel.visuLfosExtras.find((e) => e.key === key) as dataModel.MappingTuple;
                if (!destExtra) {
                  throw new Error(`Unknown VISU LFOs Destination Function Extra ${key}`);
                }
                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                break;
              }
            default:
              {
                throw new Error(`Unknown VISU Destination Function ${destinationFunctionKey}`);
              }
          }
          break;
        }
      case dataModel.SKIP_DESTINATION_TYPE_KEY:
        {
          const { abbr, description } = dataModel.genCalcSkipSourceExtraDnA(key);
          destinationExtra = new docModel.DestinationExtra(key, abbr, description);
          break;
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




