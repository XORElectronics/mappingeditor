import type { Ref } from 'vue';
import Ajv from 'ajv';
import { useWarningLog } from './useWarningLog';
import {
  DataModel, type MappingTuple, type MappingType,
  EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION
} from '../modules/dataModel';
import {
  MappingDocument, Source, SourceType, SourceFunction, SourceExtra,
  DestinationType, DestinationFunction, DestinationExtra, Destination
} from '../modules/documentModel';
import { MappingDocumentParser } from '../modules/parsers';
import schema from '../modules/documentModel.schema.json';

interface MappingDocumentLike {
  header: {
    headerText: string;
    majorVersion: number;
    minorVersion: number;
    fileName: string;
  };
  rows: Array<{
    source: { type: { key: number }; function: { key: number }; extra: { keyOrValue: number } };
    destination: { type: { key: number }; function: { key: number }; extra: { keyOrValue: number } };
  }>;
  variables: Array<{ value: number }>;
  globalComment?: string;
}

export interface UseFileHandlingOptions {
  mappingDocument: Ref<MappingDocumentLike>;
  rowColors: Ref<Map<number, string>>;
  rowComments: Ref<Record<number, string>>;
  fileInput: Ref<HTMLInputElement | null>;
  init: () => void;
  clearCurrentHistory: () => void;
  showToast: (...args: any[]) => void;
}

export function useFileHandling(options: UseFileHandlingOptions) {
  const {
    mappingDocument,
    rowColors,
    rowComments,
    fileInput,
    init,
    clearCurrentHistory,
    showToast
  } = options;

  const { addDebug, addError } = useWarningLog();

  function readFile() {
    const file = fileInput.value?.files?.[0];

    if (!file) {
      alert('No file uploaded!');
      return;
    }

    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    switch (fileExtension) {

      case 'map':
        reader.readAsArrayBuffer(file);
        reader.onload = async function (e: any) {
          try {
            const fileData = new Uint8Array(e.target.result);
            addDebug('system', `Loading .map file: ${file.name} (${fileData.length} bytes)`);
            mappingDocument.value = MappingDocumentParser.parse(fileData);
            init();
            clearCurrentHistory(); // Clear undo history after loading new file
            addDebug('system', '.map file loaded successfully');
            showToast(`Loaded ${file.name} successfully`, 'success', 3000);
            // Clear file input to allow reloading the same file
            if (fileInput.value) {
              fileInput.value.value = '';
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            addError('system', `Failed to parse .map file: ${errorMsg}`);
            alert(`Error loading .map file: ${errorMsg}\n\nFile: ${file.name}\nSize: ${e.target.result.byteLength} bytes`);
          }
        };
        break;

      case 'json':
        reader.readAsText(file);
        reader.onload = function (e: any) {
          try {
            const fileData = e.target.result;
            addDebug('system', `Loading .json file: ${file.name} (${fileData.length} chars)`);
            const jsonData = JSON.parse(fileData);

            // Validate the JSON file against the schema
            const ajv = () => new Ajv({ allErrors: true });
            const validate = ajv().compile(schema);
            const isValid = validate(jsonData);
            if (!isValid) {
              const validationDetails = validate.errors?.map(err => `• ${err.instancePath || 'root'}: ${err.message}`).join('\n');
              addError('system', 'JSON schema validation failed', undefined, validationDetails);
              alert(`Invalid JSON file structure!\n\nValidation errors:\n${validationDetails}`);
              return;
            }

            // Reconstruct the MappingDocument with proper class instances
            const mappingDoc = new MappingDocument();
            const jsonObj = jsonData as any; // Cast to any to access properties

            // Handle both old and new JSON formats
            if (jsonObj.header) {
              // Old format
              mappingDoc.header.headerText = jsonObj.header.headerText || mappingDoc.header.headerText;
              mappingDoc.header.majorVersion = jsonObj.header.majorVersion || mappingDoc.header.majorVersion;
              mappingDoc.header.minorVersion = jsonObj.header.minorVersion || mappingDoc.header.minorVersion;
              mappingDoc.header.fileName = jsonObj.header.fileName || mappingDoc.header.fileName;
            } else if (jsonObj.mappings) {
              // New format
              mappingDoc.header.headerText = jsonObj.header || mappingDoc.header.headerText;
              mappingDoc.header.majorVersion = jsonObj.versionMajor || mappingDoc.header.majorVersion;
              mappingDoc.header.minorVersion = jsonObj.versionMinor || mappingDoc.header.minorVersion;
              mappingDoc.header.fileName = jsonObj.filename || mappingDoc.header.fileName;

              // Handle placeholder bytes
              if (jsonObj.placeholderBytes && Array.isArray(jsonObj.placeholderBytes)) {
                mappingDoc.header.reserved = new Uint8Array(jsonObj.placeholderBytes);
              }
            }

            // Convert rows - handle both old and new formats
            const rowsData = jsonObj.rows || jsonObj.mappings;
            if (rowsData && Array.isArray(rowsData)) {
              for (let i = 0; i < mappingDoc.rows.length; i++) {
                const rowData = rowsData[i];
                const row = mappingDoc.rows[i]; // Use the pre-initialized row

                if (rowData) {
                  // Handle both old format (rowData.source.type) and new format (rowData.sourceType)
                  const sourceTypeKey = rowData.source?.type ?? rowData.sourceType;
                  const sourceFunctionKey = rowData.source?.function ?? rowData.sourceFunction;
                  const sourceExtraKey = rowData.source?.extra ?? rowData.sourceFunctionExtra;
                  const destinationTypeKey = rowData.destination?.type ?? rowData.destinationType;
                  const destinationFunctionKey = rowData.destination?.function ?? rowData.destinationFunction;
                  const destinationExtraKey = rowData.destination?.extra ?? rowData.destinationFunctionExtra;

                  // Source - lookup from DataModel using numeric keys
                  const sourceTypeData = DataModel.sourceTypes.find(st => st.key === sourceTypeKey) as MappingType | undefined;
                  const sourceType = sourceTypeData ? new SourceType(sourceTypeData.key, sourceTypeData.abbr, sourceTypeData.description)
                                                    : new SourceType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  const sourceFunctionData = sourceTypeData?.functions.find((sf: MappingTuple) => sf.key === sourceFunctionKey);
                  const sourceFunction = sourceFunctionData ? new SourceFunction(sourceFunctionData.key, sourceFunctionData.abbr, sourceFunctionData.description)
                                                            : new SourceFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  const sourceExtraData = sourceTypeData?.extras?.find((se: MappingTuple) => se.key === sourceExtraKey);
                  const sourceExtra = sourceExtraData ? new SourceExtra(sourceExtraData.key, sourceExtraData.abbr, sourceExtraData.description)
                                                      : new SourceExtra(sourceExtraKey, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  row.source = new Source(sourceType, sourceFunction, sourceExtra);

                  // Destination - lookup from DataModel using numeric keys
                  const destinationTypeData = DataModel.destinationTypes.find(dt => dt.key === destinationTypeKey) as MappingType | undefined;
                  const destinationType = destinationTypeData ? new DestinationType(destinationTypeData.key, destinationTypeData.abbr, destinationTypeData.description)
                                                              : new DestinationType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  const destinationFunctionData = destinationTypeData?.functions.find((df: MappingTuple) => df.key === destinationFunctionKey);
                  const destinationFunction = destinationFunctionData ? new DestinationFunction(destinationFunctionData.key, destinationFunctionData.abbr, destinationFunctionData.description)
                                                                      : new DestinationFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  const destinationExtraData = destinationTypeData?.extras?.find((de: MappingTuple) => de.key === destinationExtraKey);
                  const destinationExtra = destinationExtraData ? new DestinationExtra(destinationExtraData.key, destinationExtraData.abbr, destinationExtraData.description)
                                                                : new DestinationExtra(destinationExtraKey, EMPTY_ABBR, EMPTY_DESCRIPTION);

                  row.destination = new Destination(destinationType, destinationFunction, destinationExtra);

                  // Handle unused fields for new format
                  if (typeof rowData.unused1 === 'number') row.unused1 = rowData.unused1;
                  if (typeof rowData.unused2 === 'number') row.unused2 = rowData.unused2;
                  if (typeof rowData.unused3 === 'number') row.unused3 = rowData.unused3;
                  if (typeof rowData.unused4 === 'number') row.unused4 = rowData.unused4;
                }
                // If no rowData for this index, the row keeps its default empty values
              }
            }

            // Update variables from JSON
            const variablesData = jsonObj.variables;
            if (variablesData && Array.isArray(variablesData)) {
              for (let i = 0; i < mappingDoc.variables.length && i < variablesData.length; i++) {
                const varData = variablesData[i];
                if (typeof varData === 'number') {
                  // New format: direct values
                  mappingDoc.variables[i].value = varData;
                } else if (varData && typeof varData.value === 'number') {
                  // Old format: objects with value property
                  mappingDoc.variables[i].value = varData.value;
                }
              }
            }

            // Load editor metadata (row colors, comments, and global documentation)
            if (jsonObj.editorMetadata) {
              const metadata = jsonObj.editorMetadata;

              // Load row colors (preserve Map reference for undo commands)
              if (metadata.rowColors && typeof metadata.rowColors === 'object') {
                rowColors.value.clear();
                for (const [indexStr, color] of Object.entries(metadata.rowColors)) {
                  const index = parseInt(indexStr, 10);
                  if (!isNaN(index) && typeof color === 'string') {
                    rowColors.value.set(index, color);
                  }
                }
              }

              // Load row comments
              if (metadata.rowComments && typeof metadata.rowComments === 'object') {
                rowComments.value = metadata.rowComments as Record<number, string>;
              }

              // Load global documentation field
              if (metadata.globalComment && typeof metadata.globalComment === 'string') {
                mappingDoc.globalComment = metadata.globalComment;
              }
            }

            mappingDocument.value = mappingDoc;
            init();
            clearCurrentHistory(); // Clear undo history after loading new file
            addDebug('system', '.json file loaded successfully');
            showToast(`Loaded ${file.name} successfully`, 'success', 3000);
            // Clear file input to allow reloading the same file
            if (fileInput.value) {
              fileInput.value.value = '';
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            addError('system', `Failed to parse .json file: ${errorMsg}`);
            if (error instanceof SyntaxError) {
              alert(`JSON Parse Error: ${error.message}\n\nFile: ${file.name}\n\nThe file may be corrupted or not valid JSON.`);
            } else {
              alert(`Error loading .json file: ${errorMsg}\n\nFile: ${file.name}`);
            }
          }
        };
        break;

      default:
        alert(`Invalid file type: "${fileExtension}"\n\nSupported formats: .map (binary) or .json (text)`);
    }

    reader.onerror = function (e: any) {
      addError('system', 'FileReader error reading file');
      alert(`File reading error: ${e.target.error.name}\n\nFile: ${file.name}`);
    }
  }

  return { readFile };
}
