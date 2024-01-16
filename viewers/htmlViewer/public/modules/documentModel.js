var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var EMPTY_KEY = 65535;
var EMPTY_TEXT = "----";
var MappingDocument = /** @class */ (function () {
    function MappingDocument(header, rows, variables) {
        this._header = header !== null && header !== void 0 ? header : new Header();
        this._rows = rows !== null && rows !== void 0 ? rows : new Array(MappingDocument.ROW_COUNT);
        this._variables = variables !== null && variables !== void 0 ? variables : new Array(MappingDocument.VARIABLE_COUNT);
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
    MappingDocument.prototype.toHtml = function (useBsStyles) {
        if (useBsStyles === void 0) { useBsStyles = true; }
        var output = "<table ".concat(useBsStyles ? "class='table table-dark'" : '', "><tbody>");
        output += "<tr><td>Header Text: </td><td>".concat(this.header.headerText, "</td></tr>");
        output += "<tr><td>Major Version: </td><td>".concat(this.header.majorVersion, "</td></tr>");
        output += "<tr><td>Minor Version: </td><td>".concat(this.header.minorVersion, "</td></tr>");
        output += "<tr><td>FileName: </td><td>".concat(this.header.fileName, "</td></tr>");
        output += "<tr>";
        output += "<table ".concat(useBsStyles ? "class='table table-dark'" : '', ">");
        output += "<thead ".concat(useBsStyles ? "class='thead-dark'" : '', "><tr><th>Index </th><th>Source Type </th><th>Source Function </th><th>Source Extra </th><th>Destination Type </th><th>Destination Function </th><th>Destination Extra </th></tr></thead>");
        output += "<tbody>";
        this.rows.forEach(function (row) {
            output += "<tr>";
            output += "<td>".concat(row.index, "</td>");
            output += "<td>".concat(row.source.type.text, "</td>");
            output += "<td>".concat(row.source.function.text, "</td>");
            output += "<td>".concat(row.source.extra.text, "</td>");
            output += "<td>".concat(row.destination.type.text, "</td>");
            output += "<td>".concat(row.destination.function.text, "</td>");
            output += "<td>".concat(row.destination.extra.text, "</td>");
            output += "</tr>";
        });
        output += "</tbody></table></tr><table ".concat(useBsStyles ? "class='table table-dark'" : '', ">");
        this.variables.forEach(function (variable) {
            output += "<tr><td>".concat(variable.name, ": </td><td>").concat(variable.value, "</td></tr>");
        });
        output += "</tbody></table>";
        return output;
    };
    MappingDocument.prototype.toJson = function () {
        return JSON.stringify(this);
    };
    MappingDocument.prototype.toStream = function () {
        return new Blob([], { type: "application/octet-stream" });
    };
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
    Header.DEFAULT_FILENAME = "MYMAP.MAP";
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
        this._type = type !== null && type !== void 0 ? type : new SourceType();
        this._function = func !== null && func !== void 0 ? func : new SourceFunction();
        this._extra = extra !== null && extra !== void 0 ? extra : new SourceExtra();
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
    function SourceType(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(SourceType.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceType.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceType.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceType.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return SourceType;
}());
export { SourceType };
var SourceFunction = /** @class */ (function () {
    function SourceFunction(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(SourceFunction.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceFunction.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceFunction.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceFunction.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return SourceFunction;
}());
export { SourceFunction };
var SourceExtra = /** @class */ (function () {
    function SourceExtra(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(SourceExtra.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtra.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtra.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtra.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return SourceExtra;
}());
export { SourceExtra };
var SourceExtraTuple = /** @class */ (function (_super) {
    __extends(SourceExtraTuple, _super);
    function SourceExtraTuple(key, text, code, description, key2, text2, code2, description2, value2) {
        var _this = _super.call(this, key, text, code, description) || this;
        _this._key2 = key2 !== null && key2 !== void 0 ? key2 : EMPTY_KEY;
        _this._text2 = text2 !== null && text2 !== void 0 ? text2 : EMPTY_TEXT;
        _this._code2 = code2 !== null && code2 !== void 0 ? code2 : EMPTY_TEXT;
        _this._description2 = description2 !== null && description2 !== void 0 ? description2 : "";
        return _this;
    }
    Object.defineProperty(SourceExtraTuple.prototype, "key2", {
        get: function () { return this._key2; },
        set: function (value) { this._key2 = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtraTuple.prototype, "text2", {
        get: function () { return this._text2; },
        set: function (value) { this._text2 = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtraTuple.prototype, "code2", {
        get: function () { return this._code2; },
        set: function (value) { this._code2 = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SourceExtraTuple.prototype, "description2", {
        get: function () { return this._description2; },
        set: function (value) { this._description2 = value; },
        enumerable: false,
        configurable: true
    });
    return SourceExtraTuple;
}(SourceExtra));
export { SourceExtraTuple };
var Destination = /** @class */ (function () {
    function Destination(type, func, extra) {
        this._type = type !== null && type !== void 0 ? type : new DestinationType();
        this._function = func !== null && func !== void 0 ? func : new DestinationFunction();
        this._extra = extra !== null && extra !== void 0 ? extra : new DestinationExtra();
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
    function DestinationType(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(DestinationType.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationType.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationType.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationType.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return DestinationType;
}());
export { DestinationType };
var DestinationFunction = /** @class */ (function () {
    function DestinationFunction(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(DestinationFunction.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationFunction.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationFunction.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationFunction.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return DestinationFunction;
}());
export { DestinationFunction };
var DestinationExtra = /** @class */ (function () {
    function DestinationExtra(key, text, code, description) {
        this._key = key !== null && key !== void 0 ? key : EMPTY_KEY;
        this._text = text !== null && text !== void 0 ? text : EMPTY_TEXT;
        this._code = code !== null && code !== void 0 ? code : EMPTY_TEXT;
        this._description = description !== null && description !== void 0 ? description : "";
    }
    Object.defineProperty(DestinationExtra.prototype, "key", {
        get: function () { return this._key; },
        set: function (value) { this._key = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationExtra.prototype, "text", {
        get: function () { return this._text; },
        set: function (value) { this._text = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationExtra.prototype, "code", {
        get: function () { return this._code; },
        set: function (value) { this._code = value; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DestinationExtra.prototype, "description", {
        get: function () { return this._description; },
        set: function (value) { this._description = value; },
        enumerable: false,
        configurable: true
    });
    return DestinationExtra;
}());
export { DestinationExtra };
var Variable = /** @class */ (function () {
    function Variable(name, value) {
        this._name = name !== null && name !== void 0 ? name : "Unnamed Variable";
        this._value = value !== null && value !== void 0 ? value : 0;
    }
    Object.defineProperty(Variable.prototype, "name", {
        get: function () { return this._name; },
        set: function (value) { this._name = value; },
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