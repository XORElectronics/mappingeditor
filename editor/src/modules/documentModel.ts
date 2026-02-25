
const EMPTY_KEY = 65535;
const EMPTY_ABBR = "----";
const EMPTY_DESCRIPTION = "----";

export class MappingDocument {
    public static readonly ROW_COUNT = 70;
    public static readonly VARIABLE_COUNT = 16;

    public get header(): Header { return this._header; }
    public set header(value: Header) { this._header = value; }
    public get rows(): Row[] { return this._rows; }
    public set rows(value: Row[]) { this._rows = value; }
    public get variables(): Variable[] { return this._variables; }
    public set variables(value: Variable[]) { this._variables = value; }

    // Global documentation field (JSON-only, not in binary .MAP format)
    public globalComment?: string;

    // TODO: Ensure that the length of rows is equal to ROW_COUNT on construction and in the setter.    8

    private _header: Header;
    private _rows: Row[];
    private _variables: Variable[];

    constructor(header?: Header, rows?: Row[], variables?: Variable[]) {
        this._header = header ?? new Header();

        this._rows = rows ?? new Array<Row>(MappingDocument.ROW_COUNT);
        // If rows is not provided, create a new row for each index in the array.
        if (!rows) {
            for (let rowCount = 0; rowCount < MappingDocument.ROW_COUNT; rowCount++) {
                const newRow = new Row(rowCount, new Source(), new Destination());
                this._rows[rowCount] = newRow;
            }
        }

        this._variables = variables ?? new Array<Variable>(MappingDocument.VARIABLE_COUNT);
        // If variables is not provided, create a new variable for each index in the array.
        if (!variables) {
            for (let varCount = 0; varCount < MappingDocument.VARIABLE_COUNT; varCount++) {
                const varName = String.fromCharCode(65 + varCount);
                this._variables[varCount] = new Variable(`Variable ${varName}`);
            }
        }
    }
}

export class Header {
    public static readonly RESERVED_BYTES = 40;
    public static readonly DEFAULT_HEADER_TEXT = "NerdSEQ Mapping";
    public static readonly DEFAULT_MAJOR_VERSION = 3;
    public static readonly DEFAULT_MINOR_VERSION = 0;
    public static readonly DEFAULT_VARIANT = "";
    public static readonly DEFAULT_FILENAME = "DEFAULT";

    public get headerText(): string { return this._headerText; }
    public set headerText(value: string) { this._headerText = value; }
    public get majorVersion(): number { return this._majorVersion; }
    public set majorVersion(value: number) { this._majorVersion = value; }
    public get minorVersion(): number { return this._minorVersion; }
    public set minorVersion(value: number) { this._minorVersion = value; }
    public get variant(): string { return this._variant; }
    public set variant(value: string) { this._variant = value; }
    public get fileName(): string { return this._filename; }
    public set fileName(value: string) { this._filename = value; }
    public get reserved(): Uint8Array { return this._reserved; }
    public set reserved(value: Uint8Array) { this._reserved = value; }

    // TODO: Ensure that none of the the above properties exceed their maximum length or values on construction
    // and in the setters.
    // TODO: Check the version number against the version of the app and throw an error if it is not compatible.

    private _headerText: string;
    private _majorVersion: number;
    private _minorVersion: number;
    private _variant: string;
    private _filename: string;
    private _reserved: Uint8Array;

    constructor(headerText?: string, majorVersion?: number, minorVersion?: number, variant?: string, FileName?: string) {
        this._headerText = headerText ?? Header.DEFAULT_HEADER_TEXT;
        this._majorVersion = majorVersion ?? Header.DEFAULT_MAJOR_VERSION;
        this._minorVersion = minorVersion ?? Header.DEFAULT_MINOR_VERSION;
        this._variant = variant ?? Header.DEFAULT_VARIANT;
        this._filename = FileName ?? Header.DEFAULT_FILENAME;
        this._reserved = new Uint8Array(Header.RESERVED_BYTES);
    }
}

export class Row {
    public static readonly DEFAULT_INDEX = -1;

    public get index(): number { return this._index; }
    public set index(value: number) { this._index = value; }
    public get source(): Source { return this._source; }
    public set source(value: Source) { this._source = value; }
    public get destination(): Destination { return this._destination; }
    public set destination(value: Destination) { this._destination = value; }
    public get channel(): number { return this._channel; }
    public set channel(value: number) { this._channel = value; }
    public get minValue(): number { return this._minValue; }
    public set minValue(value: number) { this._minValue = value; }
    public get maxValue(): number { return this._maxValue; }
    public set maxValue(value: number) { this._maxValue = value; }
    public get offset(): number { return this._offset; }
    public set offset(value: number) { this._offset = value; }
    public get unused1(): number { return this._unused1; }
    public set unused1(value: number) { this._unused1 = value; }
    public get unused2(): number { return this._unused2; }
    public set unused2(value: number) { this._unused2 = value; }
    public get unused3(): number { return this._unused3; }
    public set unused3(value: number) { this._unused3 = value; }
    public get unused4(): number { return this._unused4; }
    public set unused4(value: number) { this._unused4 = value; }

    // TODO: Ensure that the index does not exceed it MappingDocument.ROW_COUNT on construction and in the setter.
    // Will use index rather than array index to order rows on export of the doc

    private _index: number;
    private _source: Source;
    private _destination: Destination;
    private _channel: number;
    private _minValue: number;
    private _maxValue: number;
    private _offset: number;
    private _unused1: number;
    private _unused2: number;
    private _unused3: number;
    private _unused4: number;

    constructor(index?: number, source?: Source, destination?: Destination, channel?: number, minValue?: number, maxValue?: number, offset?: number) {
        this._index = index ?? Row.DEFAULT_INDEX;
        this._source = source ?? new Source();
        this._destination = destination ?? new Destination();
        this._channel = channel ?? 1;
        this._minValue = minValue ?? -2048;
        this._maxValue = maxValue ?? 2047;
        this._offset = offset ?? 0;
        this._unused1 = 65535;
        this._unused2 = 65535;
        this._unused3 = 65535;
        this._unused4 = 65535;
    }
}

export class Source {
    public get type(): SourceType { return this._type; }
    public set type(value: SourceType) { this._type = value; }
    public get function(): SourceFunction { return this._function; }
    public set function(value: SourceFunction) { this._function = value; }
    public get extra(): SourceExtra { return this._extra; }
    public set extra(value: SourceExtra) { this._extra = value; }

    private _type: SourceType;
    private _function: SourceFunction;
    private _extra: SourceExtra;

    constructor(type?: SourceType, func?: SourceFunction, extra?: SourceExtra) {
        this._type = type ?? new SourceType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._function = func ?? new SourceFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._extra = extra ?? new SourceExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
    }
}

export class SourceType {
    public get key(): number { return this._key; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _key: number;
    private _abbr: string;
    private _description: string;

    constructor(key: number, abbr: string, description: string) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
}

export class SourceFunction {
    public get key(): number { return this._key; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _key: number;
    private _abbr: string;
    private _description: string;

    constructor(key: number, abbr: string, description: string) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
}

export class SourceExtra {
    public get keyOrValue(): number { return this._keyOrValue; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _keyOrValue: number;
    private _abbr: string;
    private _description: string;

    constructor(keyOrValue: number, abbr: string, description: string) {
        this._keyOrValue = keyOrValue;
        this._abbr = abbr;
        this._description = description;
    }
}

export class Destination {
    public get type(): DestinationType { return this._type; }
    public set type(value: DestinationType) { this._type = value; }
    public get function(): DestinationFunction { return this._function; }
    public set function(value: DestinationFunction) { this._function = value; }
    public get extra(): DestinationExtra { return this._extra; }
    public set extra(value: DestinationExtra) { this._extra = value; }

    private _type: DestinationType;
    private _function: DestinationFunction;
    private _extra: DestinationExtra;

    constructor(type?: DestinationType, func?: DestinationFunction, extra?: DestinationExtra) {
        this._type = type ?? new DestinationType(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._function = func ?? new DestinationFunction(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
        this._extra = extra ?? new DestinationExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
    }
}

export class DestinationType {
    public get key(): number { return this._key; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _key: number;
    private _abbr: string;
    private _description: string;

    constructor(key: number, abbr: string, description: string) {
        this._key = key;
        this._abbr = abbr;
        this._description = description;
    }
}

export class DestinationFunction {
    public get key(): number { return this._key; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _key: number;
    private _abbr: string;
    private _description: string;

    constructor(key: number, abbr: string, description: string) {
        this._key = key;
        this._description = description;
        this._abbr = abbr;
    }
}

export class DestinationExtra {
    public get keyOrValue(): number { return this._keyOrValue; }
    public get abbr(): string { return this._abbr; }
    public get description(): string { return this._description; }

    private _keyOrValue: number;
    private _abbr: string;
    private _description: string;

    constructor(keyOrValue: number, abbr: string, description: string) {
        this._keyOrValue = keyOrValue;
        this._abbr = abbr;
        this._description = description;
    }
}

export class Variable {
    public get name(): string { return this._name; }
    public get value(): number { return this._value; }
    public set value(value: number) { this._value = value; }

    private _name: string;
    private _value: number;

    constructor(name: string, value?: number) {
        this._name = name;
        this._value = value ?? 0;
    }
}
