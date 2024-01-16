
const EMPTY_KEY = 65535;
const EMPTY_TEXT = "----";

export class MappingDocument {
    public static readonly ROW_COUNT = 70;
    public static readonly VARIABLE_COUNT = 16;

    public get header(): Header { return this._header; }
    public set header(value: Header) { this._header = value; }
    public get rows(): Row[] { return this._rows; }
    public set rows(value: Row[]) { this._rows = value; }
    public get variables(): Variable[] { return this._variables; }
    public set variables(value: Variable[]) { this._variables = value; }

    // TODO: Ensure that the length of rows is equal to ROW_COUNT on construction and in the setter.    8

    private _header: Header;
    private _rows: Row[];
    private _variables: Variable[];

    constructor(header?: Header, rows?: Row[], variables?: Variable[]) {
        this._header = header ?? new Header();
        this._rows = rows ?? new Array<Row>(MappingDocument.ROW_COUNT);
        this._variables = variables ?? new Array<Variable>(MappingDocument.VARIABLE_COUNT);
    }
}

export class Header {
    public static readonly RESERVED_BYTES = 40;
    public static readonly DEFAULT_HEADER_TEXT = "NerdSEQ Mapping";
    public static readonly DEFAULT_MAJOR_VERSION = 2;
    public static readonly DEFAULT_MINOR_VERSION = 0;
    public static readonly DEFAULT_VARIANT = "";
    public static readonly DEFAULT_FILENAME = "MYMAP.MAP";

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

    // TODO: Ensure that the index does not exceed it MappingDocument.ROW_COUNT on construction and in the setter.
    // Will use index rather than array index to order rows on export of the doc

    private _index: number;
    private _source: Source;
    private _destination: Destination;

    constructor(index?: number, source?: Source, destination?: Destination) {
        this._index = index ?? Row.DEFAULT_INDEX;
        this._source = source ?? new Source();
        this._destination = destination ?? new Destination();
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
        this._type = type ?? new SourceType();
        this._function = func ?? new SourceFunction();
        this._extra = extra ?? new SourceExtra();
    }
}


export class SourceType {

    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }

    // TODO: Obviously cant just change the key since that will change the command. Will need to probably only set that on construction 
    // and then make it readonly.
}

export class SourceFunction {
    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }
}

export class SourceExtra {
    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }
}

export class SourceExtraTuple extends SourceExtra {
    public get key2(): number { return this._key2; }
    public set key2(value: number) { this._key2 = value; }
    public get text2(): string { return this._text2; }
    public set text2(value: string) { this._text2 = value; }
    public get code2(): string { return this._code2; }
    public set code2(value: string) { this._code2 = value; }
    public get description2(): string { return this._description2; }
    public set description2(value: string) { this._description2 = value; }

    private _key2: number;
    private _text2: string;
    private _code2: string;
    private _description2: string;

    constructor(key?: number, text?: string, code?: string, description?: string, key2?: number, text2?: string, code2?: string, description2?: string, value2?: number) {
        super(key, text, code, description);
        this._key2 = key2 ?? EMPTY_KEY;
        this._text2 = text2 ?? EMPTY_TEXT;
        this._code2 = code2 ?? EMPTY_TEXT;
        this._description2 = description2 ?? "";
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
        this._type = type ?? new DestinationType();
        this._function = func ?? new DestinationFunction();
        this._extra = extra ?? new DestinationExtra();
    }
}

export class DestinationType {
    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }
}

export class DestinationFunction {
    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }
}

export class DestinationExtra {
    public get key(): number { return this._key; }
    public set key(value: number) { this._key = value; }
    public get text(): string { return this._text; }
    public set text(value: string) { this._text = value; }
    public get code(): string { return this._code; }
    public set code(value: string) { this._code = value; }
    public get description(): string { return this._description; }
    public set description(value: string) { this._description = value; }

    private _key: number;
    private _text: string;
    private _code: string;
    private _description: string;

    constructor(key?: number, text?: string, code?: string, description?: string) {
        this._key = key ?? EMPTY_KEY;
        this._text = text ?? EMPTY_TEXT;
        this._code = code ?? EMPTY_TEXT;
        this._description = description ?? "";
    }
}

export class Variable {
    public get name(): string { return this._name; }
    public set name(value: string) { this._name = value; }
    public get value(): number { return this._value; }
    public set value(value: number) { this._value = value; }

    private _name: string;
    private _value: number;

    constructor(name?: string, value?: number) {
        this._name = name ?? "Unnamed Variable";
        this._value = value ?? 0;
    }
}
