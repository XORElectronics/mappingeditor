var EMPTY_KEY = 65535;
var EMPTY_ABBR = "----";
var EMPTY_DESCRIPTION = "----";
var MappingDocument = /** @class */ (function () {
    function MappingDocument(header, rows, variables) {
        this._header = header !== null && header !== void 0 ? header : new Header();
        this._rows = rows !== null && rows !== void 0 ? rows : new Array(MappingDocument.ROW_COUNT);
        // If rows is not provided, create a new row for each index in the array.
        if (!rows) {
            for (var rowCount = 0; rowCount < MappingDocument.ROW_COUNT; rowCount++) {
                var newRow = new Row(rowCount, new Source(), new Destination());
                this._rows[rowCount] = newRow;
            }
        }
        this._variables = variables !== null && variables !== void 0 ? variables : new Array(MappingDocument.VARIABLE_COUNT);
        // If variables is not provided, create a new variable for each index in the array.
        if (!variables) {
            for (var varCount = 0; varCount < MappingDocument.VARIABLE_COUNT; varCount++) {
                var varName = String.fromCharCode(65 + varCount);
                this._variables[varCount] = new Variable("Variable ".concat(varName));
            }
        }
    }
    Object.defineProperty(MappingDocument.prototype, "header", {
        get: function () { return this._header; },
        set: function (value) { this._header = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MappingDocument.prototype, "rows", {
        get: function () { return this._rows; },
        set: function (value) { this._rows = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MappingDocument.prototype, "variables", {
        get: function () { return this._variables; },
        set: function (value) { this._variables = value; },
        enumerable: false,
        configurable: true
    });
    MappingDocument.ROW_COUNT = 70;
    MappingDocument.VARIABLE_COUNT = 16;
    return MappingDocument;
}());
export { MappingDocument };
var Header = /** @class */ (function () {
    function Header(headerText, majorVersion, minorVersion, variant, FileName) {
        this._headerText = headerText !== null && headerText !== void 0 ? headerText : Header.DEFAULT_HEADER_TEXT;
        this._majorVersion = majorVersion !== null && majorVersion !== void 0 ? majorVersion : Header.DEFAULT_MAJOR_VERSION;
        this._minorVersion = minorVersion !== null && minorVersion !== void 0 ? minorVersion : Header.DEFAULT_MINOR_VERSION;
        this._variant = variant !== null && variant !== void 0 ? variant : Header.DEFAULT_VARIANT;
        this._filename = FileName !== null && FileName !== void 0 ? FileName : Header.DEFAULT_FILENAME;
        this._reserved = new Uint8Array(Header.RESERVED_BYTES);
    }
    Object.defineProperty(Header.prototype, "headerText", {
        get: function () { return this._headerText; },
        set: function (value) { this._headerText = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Header.prototype, "majorVersion", {
        get: function () { return this._majorVersion; },
        set: function (value) { this._majorVersion = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Header.prototype, "minorVersion", {
        get: function () { return this._minorVersion; },
        set: function (value) { this._minorVersion = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Header.prototype, "variant", {
        get: function () { return this._variant; },
        set: function (value) { this._variant = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Header.prototype, "fileName", {
        get: function () { return this._filename; },
        set: function (value) { this._filename = value; },
        enumerable: false,
        configurable: true
    });
    Header.RESERVED_BYTES = 40;
    Header.DEFAULT_HEADER_TEXT = "NerdSEQ Mapping";
    Header.DEFAULT_MAJOR_VERSION = 2;
    Header.DEFAULT_MINOR_VERSION = 0;
    Header.DEFAULT_VARIANT = "";
    Header.DEFAULT_FILENAME = "DEFAULT";
    return Header;
}());
export { Header };
var Row = /** @class */ (function () {
    function Row(index, source, destination) {
        this._index = index !== null && index !== void 0 ? index : Row.DEFAULT_INDEX;
        this._source = source !== null && source !== void 0 ? source : new Source();
        this._destination = destination !== null && destination !== void 0 ? destination : new Destination();
    }
    Object.defineProperty(Row.prototype, "index", {
        get: function () { return this._index; },
        set: function (value) { this._index = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Row.prototype, "source", {
        get: function () { return this._source; },
        set: function (value) { this._source = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Row.prototype, "destination", {
        get: function () { return this._destination; },
        set: function (value) { this._destination = value; },
        enumerable: false,
        configurable: true
    });
    Row.DEFAULT_INDEX = -1;
    return Row;
}());
export { Row };
var Source = /** @class */ (function () {
    function Source(type, func, extra) {
        this._type = type !== null && type !== void 0 ? type : new SourceType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._function = func !== null && func !== void 0 ? func : new SourceFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._extra = extra !== null && extra !== void 0 ? extra : new SourceExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
    }
    Object.defineProperty(Source.prototype, "type", {
        get: function () { return this._type; },
        set: function (value) { this._type = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Source.prototype, "function", {
        get: function () { return this._function; },
        set: function (value) { this._function = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Source.prototype, "extra", {
        get: function () { return this._extra; },
        set: function (value) { this._extra = value; },
        enumerable: false,
        configurable: true
    });
    return Source;
}());
export { Source };
var SourceType = /** @class */ (function () {
    function SourceType(key, abbr, description) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
    Object.defineProperty(SourceType.prototype, "key", {
        get: function () { return this._key; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceType.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceType.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return SourceType;
}());
export { SourceType };
var SourceFunction = /** @class */ (function () {
    function SourceFunction(key, abbr, description) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
    Object.defineProperty(SourceFunction.prototype, "key", {
        get: function () { return this._key; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceFunction.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceFunction.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return SourceFunction;
}());
export { SourceFunction };
var SourceExtra = /** @class */ (function () {
    function SourceExtra(keyOrValue, abbr, description) {
        this._keyOrValue = keyOrValue;
        this._abbr = abbr;
        this._description = description;
    }
    Object.defineProperty(SourceExtra.prototype, "keyOrValue", {
        get: function () { return this._keyOrValue; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtra.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtra.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return SourceExtra;
}());
export { SourceExtra };
var Destination = /** @class */ (function () {
    function Destination(type, func, extra) {
        this._type = type !== null && type !== void 0 ? type : new DestinationType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._function = func !== null && func !== void 0 ? func : new DestinationFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._extra = extra !== null && extra !== void 0 ? extra : new DestinationExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
    }
    Object.defineProperty(Destination.prototype, "type", {
        get: function () { return this._type; },
        set: function (value) { this._type = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Destination.prototype, "function", {
        get: function () { return this._function; },
        set: function (value) { this._function = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Destination.prototype, "extra", {
        get: function () { return this._extra; },
        set: function (value) { this._extra = value; },
        enumerable: false,
        configurable: true
    });
    return Destination;
}());
export { Destination };
var DestinationType = /** @class */ (function () {
    function DestinationType(key, abbr, description) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
    Object.defineProperty(DestinationType.prototype, "key", {
        get: function () { return this._key; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationType.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationType.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return DestinationType;
}());
export { DestinationType };
var DestinationFunction = /** @class */ (function () {
    function DestinationFunction(key, abbr, description) {
        this._key = key;
        this._description = description;
        this._abbr = abbr;
    }
    Object.defineProperty(DestinationFunction.prototype, "key", {
        get: function () { return this._key; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationFunction.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationFunction.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return DestinationFunction;
}());
export { DestinationFunction };
var DestinationExtra = /** @class */ (function () {
    function DestinationExtra(keyOrValue, abbr, description) {
        this._keyOrValue = keyOrValue;
        this._abbr = abbr;
        this._description = description;
    }
    Object.defineProperty(DestinationExtra.prototype, "keyOrValue", {
        get: function () { return this._keyOrValue; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationExtra.prototype, "abbr", {
        get: function () { return this._abbr; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationExtra.prototype, "description", {
        get: function () { return this._description; },
        enumerable: false,
        configurable: true
    });
    return DestinationExtra;
}());
export { DestinationExtra };
var Variable = /** @class */ (function () {
    function Variable(name, value) {
        this._name = name;
        this._value = value !== null && value !== void 0 ? value : 0;
    }
    Object.defineProperty(Variable.prototype, "name", {
        get: function () { return this._name; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Variable.prototype, "value", {
        get: function () { return this._value; },
        set: function (value) { this._value = value; },
        enumerable: false,
        configurable: true
    });
    return Variable;
}());
export { Variable };
//# sourceMappingURL=documentModel.js.map