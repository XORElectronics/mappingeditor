import * as docModel from './documentModel.js';
import * as dataModel from './dataModel.js';
var MappingDocumentParser = /** @class */ (function () {
    function MappingDocumentParser() {
    }
    MappingDocumentParser.parse = function (buffer) {
        var document = new docModel.MappingDocument();
        var headerData = buffer.slice(0, MappingDocumentParser.HEADER_LENGTH);
        document.header = HeaderParser.parse(headerData);
        var rowsData = buffer.slice(MappingDocumentParser.HEADER_LENGTH);
        document.rows = RowsParser.parse(rowsData);
        var variablesData = buffer.slice(MappingDocumentParser.VARIABLES_OFFSET);
        document.variables = VariablesParser.parse(new Uint16Array(variablesData.buffer));
        return document;
    };
    MappingDocumentParser.HEADER_LENGTH = 70;
    MappingDocumentParser.VARIABLES_OFFSET = 1470;
    return MappingDocumentParser;
}());
export { MappingDocumentParser };
var HeaderParser = /** @class */ (function () {
    function HeaderParser() {
    }
    HeaderParser.parse = function (buffer) {
        var header = new docModel.Header();
        var textDecoder = new TextDecoder();
        header.headerText = textDecoder.decode(buffer.slice(0, HeaderParser.HEADER_TEXT_LENGTH)).replace(/[\0\s]+$/, ''); // remove trailing nulls and spaces
        header.majorVersion = buffer[HeaderParser.MAJOR_VERSION_OFFSET];
        header.minorVersion = buffer[HeaderParser.MINOR_VERSION_OFFSET];
        header.fileName = textDecoder.decode(buffer.slice(HeaderParser.FILE_NAME_OFFSET, HeaderParser.FILE_NAME_OFFSET + HeaderParser.FILE_NAME_LENGTH)).replace(/[\0\s]+$/, ''); // remove trailing nulls and spaces
        header.variant = ''; // variant is not encoded in the file yet
        // ignore next 40 bytes (reserved)
        return header;
    };
    HeaderParser.HEADER_TEXT_LENGTH = 16;
    HeaderParser.MAJOR_VERSION_OFFSET = 16;
    HeaderParser.MINOR_VERSION_OFFSET = 17;
    HeaderParser.FILE_NAME_OFFSET = 18;
    HeaderParser.FILE_NAME_LENGTH = 12;
    return HeaderParser;
}());
var RowsParser = /** @class */ (function () {
    function RowsParser() {
    }
    RowsParser.parse = function (buffer) {
        var rows = new Array(RowsParser.ROW_COUNT);
        for (var rowCount = 0; rowCount < RowsParser.ROW_COUNT; rowCount++) {
            var startIndex = rowCount * RowsParser.ROW_LENGTH;
            var endIndex = startIndex + RowsParser.ROW_LENGTH;
            var rowBuffer8 = buffer.slice(startIndex, endIndex);
            var rowBuffer16 = new Uint16Array(rowBuffer8.buffer);
            var row = RowParser.parse(rowBuffer16, rowCount);
            rows[rowCount] = row;
        }
        return rows;
    };
    RowsParser.ROW_LENGTH = 20;
    RowsParser.ROW_COUNT = 70;
    return RowsParser;
}());
var RowParser = /** @class */ (function () {
    function RowParser() {
    }
    RowParser.parse = function (buffer, rowIndex) {
        var row = new docModel.Row();
        row.index = rowIndex;
        var sourceBuffer = buffer.slice(0, 3);
        row.source = SourceParser.parse(sourceBuffer);
        var destinationBuffer = buffer.slice(3, 7);
        row.destination = DestinationParser.parse(destinationBuffer);
        return row;
    };
    return RowParser;
}());
var SourceParser = /** @class */ (function () {
    function SourceParser() {
    }
    SourceParser.parse = function (buffer) {
        var source = new docModel.Source();
        var typeKey = buffer[0];
        var functionKey = buffer[1];
        var extraKey = buffer[2];
        var _a = SourceTypeParser.parse(typeKey), sourceType = _a[0], mappingType = _a[1];
        source.type = sourceType;
        source.function = SourceFunctionParser.parse(functionKey, mappingType);
        source.extra = SourceExtraParser.parse(extraKey, functionKey, mappingType);
        return source;
    };
    return SourceParser;
}());
var SourceTypeParser = /** @class */ (function () {
    function SourceTypeParser() {
    }
    SourceTypeParser.parse = function (key) {
        var sourceMappingType = dataModel.DataModel.sourceTypes.find(function (c) { return c.key === key; });
        if (!sourceMappingType) {
            throw new Error("Unknown source type ".concat(key));
        }
        var sourceType = new docModel.SourceType(sourceMappingType.key, sourceMappingType.abbr, sourceMappingType.description);
        return [sourceType, sourceMappingType];
    };
    return SourceTypeParser;
}());
var SourceFunctionParser = /** @class */ (function () {
    function SourceFunctionParser() {
    }
    SourceFunctionParser.parse = function (key, sourceTypeLookup) {
        var sourceMappingFunction = sourceTypeLookup === null || sourceTypeLookup === void 0 ? void 0 : sourceTypeLookup.functions.find(function (c) { return c.key === key; });
        if (!sourceMappingFunction) {
            throw new Error("Unknown source function ".concat(key, " for source type ").concat(sourceTypeLookup.key));
        }
        var sourceFunction = new docModel.SourceFunction(sourceMappingFunction.key, sourceMappingFunction.abbr, sourceMappingFunction.description);
        return sourceFunction;
    };
    return SourceFunctionParser;
}());
var SourceExtraParser = /** @class */ (function () {
    function SourceExtraParser() {
    }
    SourceExtraParser.parse = function (key, sourceFunctionKey, sourceMappingType) {
        if (!sourceMappingType) {
            throw new Error("sourceTypeLookup is null or undefined");
        }
        if (key === dataModel.EMPTY_KEY) {
            return new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        }
        var sourceExtra;
        switch (sourceMappingType.key) {
            case dataModel.MIDI_NRPN_SOURCE_TYPE_KEY:
                {
                    var _a = dataModel.genNrpnSourceExtraDnA(key), abbr = _a.abbr, description = _a.description;
                    sourceExtra = new docModel.SourceExtra(key, abbr, description);
                    break;
                }
            case dataModel.VAR_SOURCE_TYPE_KEY:
                {
                    var _b = dataModel.genVarSourceExtraDnA(key), abbr = _b.abbr, description = _b.description;
                    sourceExtra = new docModel.SourceExtra(key, abbr, description);
                    break;
                }
            case dataModel.CALC_SOURCE_TYPE_KEY:
            case dataModel.SKIP_SOURCE_TYPE_KEY:
                {
                    var _c = dataModel.genCalcSkipSourceExtraDnA(key), abbr = _c.abbr, description = _c.description;
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
                                var sourceEx = dataModel.keyboardSourceExtras.find(function (c) { return c.key === key; });
                                if (!sourceEx) {
                                    throw new Error("Unknown Keyboard Source Function Extra ".concat(key));
                                }
                                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                                break;
                            }
                        case dataModel.SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY:
                            {
                                var sourceEx = dataModel.keyboardSourceExtras.find(function (c) { return c.key === key; });
                                if (!sourceEx) {
                                    throw new Error("Unknown Sega GamePad Source Function Extra ".concat(key));
                                }
                                sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                                break;
                            }
                        default:
                            {
                                throw new Error("Unknown External Source Function ".concat(sourceFunctionKey));
                            }
                    }
                }
            default:
                {
                    var sourceEx = sourceMappingType === null || sourceMappingType === void 0 ? void 0 : sourceMappingType.extras.find(function (e) { return e.key === key; });
                    if (!sourceEx) {
                        throw new Error("Unknown Source Function Extra ".concat(key));
                    }
                    sourceExtra = new docModel.SourceExtra(key, sourceEx.abbr, sourceEx.description);
                    break;
                }
        }
        return sourceExtra !== null && sourceExtra !== void 0 ? sourceExtra : new docModel.SourceExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
    };
    return SourceExtraParser;
}());
export { SourceExtraParser };
var DestinationParser = /** @class */ (function () {
    function DestinationParser() {
    }
    DestinationParser.parse = function (buffer) {
        var destination = new docModel.Destination();
        var typeKey = buffer[0];
        var functionKey = buffer[1];
        var extraKey = buffer[2];
        var _a = DestinationTypeParser.parse(typeKey), destinationType = _a[0], mappingType = _a[1];
        destination.type = destinationType;
        destination.function = DestinationFunctionParser.parse(functionKey, mappingType);
        destination.extra = DestinationExtraParser.parse(extraKey, functionKey, mappingType);
        return destination;
    };
    return DestinationParser;
}());
var DestinationTypeParser = /** @class */ (function () {
    function DestinationTypeParser() {
    }
    DestinationTypeParser.parse = function (key) {
        var _a;
        var destinationMappingType = (_a = dataModel.DataModel.destinationTypes) === null || _a === void 0 ? void 0 : _a.find(function (c) { return c.key === key; });
        if (!destinationMappingType) {
            throw new Error("Unknown source type ".concat(key));
        }
        ;
        var destinationType = new docModel.DestinationType(destinationMappingType.key, destinationMappingType.abbr, destinationMappingType.description);
        return [destinationType, destinationMappingType];
    };
    return DestinationTypeParser;
}());
var DestinationFunctionParser = /** @class */ (function () {
    function DestinationFunctionParser() {
    }
    DestinationFunctionParser.parse = function (key, destinationMappingType) {
        var destinationFunctionLookup = destinationMappingType === null || destinationMappingType === void 0 ? void 0 : destinationMappingType.functions.find(function (c) { return c.key === key; });
        if (!destinationFunctionLookup) {
            throw new Error("Unknown source type ".concat(key));
        }
        var sourceFunction = new docModel.DestinationFunction(destinationFunctionLookup.key, destinationFunctionLookup.abbr, destinationFunctionLookup.description);
        return sourceFunction;
    };
    return DestinationFunctionParser;
}());
var DestinationExtraParser = /** @class */ (function () {
    function DestinationExtraParser() {
    }
    DestinationExtraParser.parse = function (key, destinationFunctionKey, destinationMappingType) {
        if (!destinationMappingType) {
            throw new Error("destinationMappingType is null or undefined");
        }
        if (key === dataModel.EMPTY_KEY) {
            return new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
        }
        var destinationExtra;
        switch (destinationMappingType.key) {
            case dataModel.GLOBAL_DESTINATION_TYPE_KEY:
                {
                    switch (destinationFunctionKey) {
                        case dataModel.GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY:
                            {
                                var destExtra = dataModel.globalButtonsDestinationExtras.find(function (e) { return e.key === key; });
                                if (!destExtra) {
                                    throw new Error("Unknown Global Buttons Destination Function Extra ".concat(key));
                                }
                                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                                break;
                            }
                        case dataModel.GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY:
                            {
                                var destExtra = dataModel.globalScreensDestinationExtras.find(function (e) { return e.key === key; });
                                if (!destExtra) {
                                    throw new Error("Unknown Global Screens Destination Function Extra ".concat(key));
                                }
                                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                                break;
                            }
                        case dataModel.GLOBAL_MODES_DESTINATION_FUNCTION_KEY:
                            {
                                var destExtra = dataModel.globalModesDestinationExtras.find(function (e) { return e.key === key; });
                                if (!destExtra) {
                                    throw new Error("Unknown Global Modes Destination Function Extra ".concat(key));
                                }
                                destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                                break;
                            }
                        default:
                            {
                                throw new Error("Unknown External Destination Function ".concat(destinationFunctionKey));
                            }
                    }
                }
            case dataModel.MIDI_CC_DESTINATION_TYPE_KEY:
                {
                    var _a = dataModel.genMidiCcDestinationDnA(key), abbr = _a.abbr, description = _a.description;
                    destinationExtra = new docModel.DestinationExtra(key, abbr, description);
                    break;
                }
            default:
                {
                    var destExtra = destinationMappingType === null || destinationMappingType === void 0 ? void 0 : destinationMappingType.extras.find(function (e) { return e.key === key; });
                    if (!destExtra) {
                        throw new Error("Unknown Destination Function Extra ".concat(key));
                    }
                    destinationExtra = new docModel.DestinationExtra(key, destExtra.abbr, destExtra.description);
                    break;
                }
        }
        return destinationExtra !== null && destinationExtra !== void 0 ? destinationExtra : new docModel.DestinationExtra(dataModel.EMPTY_KEY, dataModel.EMPTY_ABBR, dataModel.EMPTY_DESCRIPTION);
    };
    return DestinationExtraParser;
}());
var VariablesParser = /** @class */ (function () {
    function VariablesParser() {
    }
    VariablesParser.parse = function (buffer) {
        var variables = new Array(VariablesParser.VARIABLE_COUNT);
        for (var index = 0; index < VariablesParser.VARIABLE_COUNT; index++) {
            var varName = "Variable ".concat(String.fromCharCode(65 + index));
            var varValue = buffer[index];
            var variable = new docModel.Variable(varName, varValue);
            variables[index] = variable;
        }
        return variables;
    };
    VariablesParser.VARIABLE_COUNT = 16;
    return VariablesParser;
}());
//# sourceMappingURL=parsers.js.map