export var EMPTY_KEY = 65535;
export var EMPTY_KEY_SHORT = 255;
export var EMPTY_ABBR = "----";
export var EMPTY_ABBR_SHORT = "--";
export var EMPTY_DESCRIPTION = "----";
export var MIDI_NRPN_SOURCE_TYPE_KEY = 7;
export var VAR_SOURCE_TYPE_KEY = 9;
export var CALC_SOURCE_TYPE_KEY = 10;
export var SKIP_SOURCE_TYPE_KEY = 11;
export var EXTERNAL_SOURCE_TYPE_KEY = 13;
export var KEYBOARD_EXTERNAL_SOURCE_FUNCTION_KEY = 0;
export var SEGA_GAMEPAD_EXTERNAL_SOURCE_FUNCTION_KEY = 1;
export var MIDI_CC_DESTINATION_TYPE_KEY = 5;
export var GLOBAL_DESTINATION_TYPE_KEY = 10;
export var GLOBAL_BUTTONS_DESTINATION_FUNCTION_KEY = 9;
export var GLOBAL_SCREENS_DESTINATION_FUNCTION_KEY = 10;
export var GLOBAL_MODES_DESTINATION_FUNCTION_KEY = 11;
function genMidiDeviceChannelSourceFunctions() {
    var sourceFunctions = [];
    sourceFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        var count = key + 1;
        sourceFunctions.push({
            key: key,
            abbr: "TC".concat(count > 9 ? "" : " ").concat(count),
            description: "TRS Midi Channel ".concat(count),
        });
    }
    for (var key = 16; key <= 31; key++) {
        var count = key - 15;
        sourceFunctions.push({
            key: key,
            abbr: "HC".concat(count > 9 ? "" : " ").concat(count),
            description: "USB Host Midi Channel ".concat(count),
        });
    }
    for (var key = 32; key <= 47; key++) {
        var count = key - 31;
        sourceFunctions.push({
            key: key,
            abbr: "DC".concat(count > 9 ? "" : " ").concat(count),
            description: "USB Device Midi Channel ".concat(count),
        });
    }
    sourceFunctions.push({ key: 48, abbr: "LRN ", description: "MIDI Learn" });
    return sourceFunctions;
}
var noteAbbrs = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
function countToNoteAbbr(count, suffix) {
    var note = count % 12;
    var octave = Math.floor(count / 12);
    var noteAbbr = noteAbbrs[note];
    return "".concat(noteAbbr).concat(octave).concat(suffix);
}
function genMidiNoteExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    extras.push({ key: 0, abbr: "NOTE", description: "Note" });
    extras.push({ key: 1, abbr: "GATE", description: "Gate" });
    extras.push({ key: 2, abbr: "VELO", description: "Velocity" });
    extras.push({ key: 3, abbr: "PRSR", description: "Channel Pressure" });
    extras.push({ key: 4, abbr: "BEND", description: "Pitch Bend" });
    for (var key = 5; key <= 124; key++) {
        var count = key - 5;
        extras.push({ key: key, abbr: countToNoteAbbr(count, "N"), description: "Selected Midi Note ".concat(count, " On/Off") });
    }
    for (var key = 125; key <= 244; key++) {
        var count = key - 125;
        extras.push({ key: key, abbr: countToNoteAbbr(count, "V"), description: "Selected Midi Note ".concat(count, " Velocity") });
    }
    for (var key = 245; key <= 364; key++) {
        var count = key - 245;
        extras.push({ key: key, abbr: countToNoteAbbr(count, "A"), description: "Selected Midi Note ".concat(count, " Aftertouch") });
    }
    return extras;
}
function genVariableSourceFunctions() {
    var sourceFunctions = [];
    sourceFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        var varName = String.fromCharCode(65 + key);
        sourceFunctions.push({ key: key, abbr: "V  ".concat(varName), description: "Variable ".concat(varName) });
    }
    for (var key = 16; key <= 86; key++) {
        var count = key - 16;
        var countHex = count.toString(16).toUpperCase().padStart(2, "0");
        ;
        sourceFunctions.push({ key: key, abbr: "RW".concat(countHex), description: "Mapping Row ".concat(countHex, " (").concat(count, ")") });
    }
    return sourceFunctions;
}
export function genCalcSkipSourceByteExtras() {
    var calcSkipSourceExtras = [];
    calcSkipSourceExtras.push({ key: EMPTY_KEY_SHORT, abbr: EMPTY_ABBR_SHORT, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 9; key++) {
        calcSkipSourceExtras.push({ key: key, abbr: "=".concat(key), description: "Constant ".concat(key) });
    }
    for (var key = 10; key <= 25; key++) {
        var count = key - 10;
        var char = String.fromCharCode(65 + count);
        calcSkipSourceExtras.push({ key: key, abbr: "V  ".concat(char), description: "Variable ".concat(char) });
    }
    for (var key = 26; key <= 95; key++) {
        var count = key - 26;
        calcSkipSourceExtras.push({ key: key, abbr: "".concat(count), description: "Row ".concat(count) });
    }
    return calcSkipSourceExtras;
}
function genSkipSourceFunctions() {
    var sourceFunctions = [];
    sourceFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    var key = 0;
    for (var rowSkipCount = 1; rowSkipCount <= 0x16; rowSkipCount++) {
        var skipCountHex = rowSkipCount.toString(16).padStart(2, "0");
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, " <"),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 < Param2"),
        });
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, "<="),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 <= Param2"),
        });
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, " >"),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 > Param2"),
        });
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, ">="),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 >= Param2"),
        });
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, " ="),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 = Param2"),
        });
        sourceFunctions.push({
            key: key++,
            abbr: "".concat(skipCountHex, "<>"),
            description: "Skip ".concat(rowSkipCount, " Rows If Param1 <> Param2"),
        });
    }
    return sourceFunctions;
}
function genControlSourceExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 31; key++) {
        var count = key + 1;
        extras.push({ key: key, abbr: "".concat(count).concat(count > 9 ? "" : " ", "RW"), description: "Execute ".concat(count, " Mapping Rows") });
    }
    return extras;
}
function genCVDestinationExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 5; key++) {
        var count = key + 1;
        extras.push({ key: key, abbr: "CV ".concat(count), description: "Local CV ".concat(count) });
    }
    for (var key = 6; key <= 11; key++) {
        var count = key - 5;
        extras.push({ key: key, abbr: "MOD".concat(count), description: "Local MOD ".concat(count) });
    }
    for (var key = 12; key <= 27; key++) {
        var count = key - 11;
        extras.push({ key: key, abbr: "1-".concat(count > 9 ? "" : " ").concat(count), description: "CV16 NSA1 ".concat(count) });
    }
    for (var key = 28; key <= 43; key++) {
        var count = key - 27;
        extras.push({ key: key, abbr: "2-".concat(count > 9 ? "" : " ").concat(count), description: "CV16 NSA2 ".concat(count) });
    }
    for (var key = 44; key <= 59; key++) {
        var count = key - 43;
        extras.push({ key: key, abbr: "3-".concat(count > 9 ? "" : " ").concat(count), description: "CV16 NSA3 ".concat(count) });
    }
    for (var key = 60; key <= 75; key++) {
        var count = key - 59;
        extras.push({ key: key, abbr: "4-".concat(count > 9 ? "" : " ").concat(count), description: "CV16 NSA4 ".concat(count) });
    }
    return extras;
}
function genTriggerDestinationExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 5; key++) {
        var count = key + 1;
        extras.push({ key: key, abbr: "TR ".concat(count), description: "Local Trigger ".concat(count) });
    }
    for (var key = 6; key <= 21; key++) {
        var count = key - 5;
        extras.push({ key: key, abbr: "1-".concat(count > 9 ? "" : " ").concat(count), description: "Trigger16 NSA1 ".concat(count) });
    }
    for (var key = 22; key <= 37; key++) {
        var count = key - 21;
        extras.push({ key: key, abbr: "2-".concat(count > 9 ? "" : " ").concat(count), description: "Trigger16 NSA2 ".concat(count) });
    }
    for (var key = 38; key <= 53; key++) {
        var count = key - 37;
        extras.push({ key: key, abbr: "3-".concat(count > 9 ? "" : " ").concat(count), description: "Trigger16 NSA3 ".concat(count) });
    }
    for (var key = 54; key <= 69; key++) {
        var count = key - 53;
        extras.push({ key: key, abbr: "4-".concat(count > 9 ? "" : " ").concat(count), description: "Trigger16 NSA4 ".concat(count) });
    }
    return extras;
}
function genTrackDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    destinationFunctions.push({ key: 0, abbr: "MUTE", description: "Mute" });
    destinationFunctions.push({ key: 1, abbr: "SOLO", description: "Solo" });
    destinationFunctions.push({ key: 2, abbr: "PORD", description: "Pattern Order" });
    destinationFunctions.push({ key: 3, abbr: "TPS ", description: "Transpose" });
    destinationFunctions.push({ key: 4, abbr: "TDLY", description: "Trigger Delay" });
    destinationFunctions.push({ key: 5, abbr: "PRB1", description: "Probability 1" });
    destinationFunctions.push({ key: 6, abbr: "PRB2", description: "Probability 2" });
    destinationFunctions.push({ key: 7, abbr: "PRB3", description: "Probability 3" });
    destinationFunctions.push({ key: 8, abbr: "PRB4", description: "Probability 4" });
    destinationFunctions.push({ key: 9, abbr: "PRB5", description: "Probability 5" });
    destinationFunctions.push({ key: 10, abbr: "PRB6", description: "Probability 6" });
    destinationFunctions.push({ key: 11, abbr: "PRB7", description: "Probability 7" });
    destinationFunctions.push({ key: 12, abbr: "PRB8", description: "Probability 8" });
    destinationFunctions.push({ key: 13, abbr: "PRB9", description: "Row Probability" });
    destinationFunctions.push({ key: 14, abbr: "GL C", description: "Glide CV" });
    destinationFunctions.push({ key: 15, abbr: "GLCR", description: "Glide CV Resolution" });
    destinationFunctions.push({ key: 16, abbr: "GL M", description: "Glide MOD" });
    destinationFunctions.push({ key: 17, abbr: "GLMR", description: "Glide MOD Resolution" });
    destinationFunctions.push({ key: 18, abbr: "TCLK", description: "Track Clock" });
    destinationFunctions.push({ key: 19, abbr: "PSTA", description: "Set Pattern Start Position(not used yet)" });
    destinationFunctions.push({ key: 20, abbr: "LGTH", description: "Pattern Length" });
    destinationFunctions.push({ key: 21, abbr: "PROW", description: "Set current Pattern Row" });
    destinationFunctions.push({ key: 22, abbr: "TICK", description: "Generate Tick" });
    destinationFunctions.push({ key: 23, abbr: "SHUP", description: "Pattern Shift Up" });
    destinationFunctions.push({ key: 24, abbr: "SHDN", description: "Pattern Shift Down" });
    destinationFunctions.push({ key: 25, abbr: "SYNC", description: "Sync Track" });
    destinationFunctions.push({ key: 26, abbr: "RSET", description: "Reset Track" });
    destinationFunctions.push({ key: 27, abbr: "FX 1", description: "FX1 Overrule" });
    destinationFunctions.push({ key: 28, abbr: "FX 2", description: "FX2 Overrule" });
    destinationFunctions.push({ key: 29, abbr: "FX 3", description: "FX3 Overrule" });
    destinationFunctions.push({ key: 30, abbr: "FX 4", description: "FX4 Overrule" });
    destinationFunctions.push({ key: 31, abbr: "STRT", description: "Unused" });
    destinationFunctions.push({ key: 32, abbr: "STRW", description: "Unused" });
    destinationFunctions.push({ key: 33, abbr: "JMPT", description: "Unused" });
    destinationFunctions.push({ key: 34, abbr: "JMPR", description: "Unused" });
    destinationFunctions.push({ key: 35, abbr: "STOP", description: "Unused" });
    destinationFunctions.push({ key: 36, abbr: "PH 1", description: "Unused" });
    destinationFunctions.push({ key: 37, abbr: "ECLD", description: "Euclidean" });
    for (var key = 38; key <= 53; key++) {
        var count = key - 37;
        destinationFunctions.push({
            key: key,
            abbr: "EC".concat(count > 9 ? "" : " ").concat(count),
            description: "Drum Matrix Euclidean ".concat(count),
        });
    }
    destinationFunctions.push({ key: 54, abbr: "CRSR", description: "Pattern Cursor Position" });
    destinationFunctions.push({ key: 55, abbr: "CRNT", description: "Pattern Note at Cursor" });
    for (var key = 56; key <= 119; key++) {
        var count = key - 56;
        var countHex = count.toString(16).toUpperCase().padStart(2, "0");
        ;
        destinationFunctions.push({ key: key, abbr: "NT".concat(countHex), description: "Note at Pattern Step ".concat(count) });
    }
    for (var key = 120; key <= 183; key++) {
        var count = key - 120;
        var countHex = count.toString(16).toUpperCase().padStart(2, "0");
        ;
        destinationFunctions.push({ key: key, abbr: "CU".concat(countHex), description: "Value at Cursor Column Step ".concat(count) });
    }
    return destinationFunctions;
}
function genVariableDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        var varName = String.fromCharCode(65 + key);
        destinationFunctions.push({ key: key, abbr: "V  ".concat(varName), description: "Variable ".concat(varName) });
    }
    for (var key = 16; key <= 85; key++) {
        var count = key - 16;
        var countHex = count.toString(16).toUpperCase().padStart(2, "0");
        destinationFunctions.push({ key: key, abbr: "RW".concat(countHex), description: "Mapping Row ".concat(countHex, "h (").concat(count, ")") });
    }
    return destinationFunctions;
}
function genMidiDeviceChannelDestinationFunctions(addLearn) {
    if (addLearn === void 0) { addLearn = true; }
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        var count = key + 1;
        destinationFunctions.push({
            key: key,
            abbr: "TC".concat(count > 9 ? "" : " ").concat(count),
            description: "TRS Midi Channel ".concat(count),
        });
    }
    for (var key = 16; key <= 31; key++) {
        var count = key - 15;
        destinationFunctions.push({
            key: key,
            abbr: "HC".concat(count > 9 ? "" : " ").concat(count),
            description: "USB Host Midi Channel ".concat(count),
        });
    }
    for (var key = 32; key <= 47; key++) {
        var count = key - 31;
        destinationFunctions.push({
            key: key,
            abbr: "DC".concat(count > 9 ? "" : " ").concat(count),
            description: "USB Device Midi Channel ".concat(count),
        });
    }
    if (addLearn) {
        destinationFunctions.push({ key: 48, abbr: "LRN ", description: "MIDI Learn" });
    }
    return destinationFunctions;
}
function genRandomRangeDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        destinationFunctions.push({ key: key, abbr: "RG".concat(key > 9 ? "" : " ").concat(key), description: "Range ".concat(key) });
    }
    return destinationFunctions;
}
function genTableDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 31; key++) {
        var count = key + 1;
        var countHex = count.toString(16).toUpperCase().padStart(2, "0");
        destinationFunctions.push({ key: key, abbr: "TB".concat(countHex), description: "Selected Table ".concat(count) });
    }
    for (var key = 32; key <= 40; key++) {
        var count = key - 31;
        destinationFunctions.push({ key: key, abbr: "TRK".concat(count), description: "Running Table on Track ".concat(count) });
    }
    return destinationFunctions;
}
function genCV16DestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    destinationFunctions.push({ key: 0, abbr: "GLCV", description: "Glide Speed" });
    destinationFunctions.push({ key: 1, abbr: "GLCR", description: "Glide Resolution" });
    var key = 2;
    for (var envCount = 1; envCount <= 8; envCount++) {
        destinationFunctions.push({ key: key++, abbr: "EV".concat(envCount, "A"), description: "Envelope ".concat(envCount, " Attack") });
        destinationFunctions.push({ key: key++, abbr: "EV".concat(envCount, "S"), description: "Envelope ".concat(envCount, " Amplitude") });
        destinationFunctions.push({ key: key++, abbr: "EV".concat(envCount, "R"), description: "Envelope ".concat(envCount, " Release") });
        destinationFunctions.push({ key: key++, abbr: "EV".concat(envCount, "O"), description: "Envelope ".concat(envCount, " Fire Oneshot") });
        destinationFunctions.push({ key: key++, abbr: "EV".concat(envCount, "X"), description: "Envelope ".concat(envCount, " Fire A/R") });
    }
    for (var lfoCount = 1; lfoCount <= 8; lfoCount++) {
        destinationFunctions.push({ key: key++, abbr: "FL".concat(lfoCount, "T"), description: "LFO ".concat(lfoCount, " Type") });
        destinationFunctions.push({ key: key++, abbr: "FL".concat(lfoCount, "S"), description: "LFO ".concat(lfoCount, " Speed") });
        destinationFunctions.push({ key: key++, abbr: "FL".concat(lfoCount, "A"), description: "LFO ".concat(lfoCount, " Amplitude") });
        destinationFunctions.push({ key: key++, abbr: "FL".concat(lfoCount, "X"), description: "LFO ".concat(lfoCount, " Start") });
        destinationFunctions.push({ key: key++, abbr: "FL".concat(lfoCount, "R"), description: "LFO ".concat(lfoCount, " Reset") });
    }
    destinationFunctions.push({ key: 82, abbr: "STOP", description: "Stop Modulator Function" });
    return destinationFunctions;
}
function genCV16DestinationExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 15; key++) {
        var count = key + 1;
        extras.push({ key: key, abbr: "1-".concat(count > 9 ? "" : " ").concat(count), description: "NSA1 ".concat(count) });
    }
    for (var key = 16; key <= 31; key++) {
        var count = key - 15;
        extras.push({ key: key, abbr: "2-".concat(count > 9 ? "" : " ").concat(count), description: "NSA2 ".concat(count) });
    }
    for (var key = 32; key <= 47; key++) {
        var count = key - 31;
        extras.push({ key: key, abbr: "3-".concat(count > 9 ? "" : " ").concat(count), description: "NSA3 ".concat(count) });
    }
    for (var key = 48; key <= 63; key++) {
        var count = key - 47;
        extras.push({ key: key, abbr: "4-".concat(count > 9 ? "" : " ").concat(count), description: "NSA4 ".concat(count) });
    }
    return extras;
}
function genMidiControllerExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 127; key++) {
        var countStr = key.toString().padStart(3, " ");
        extras.push({ key: key, abbr: "#".concat(countStr), description: "MIDI Controller #".concat(key) });
    }
    return extras;
}
function genI2cPortExtras() {
    var extras = [];
    extras.push({ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION });
    for (var key = 0; key <= 127; key++) {
        var countStr = key.toString().padStart(3, " ");
        extras.push({ key: key, abbr: "#".concat(countStr), description: "Port Number ".concat(key) });
    }
    return extras;
}
// Functions for generating abbreviations and descriptions for the various extras.
// Adding them here so that the datamodel is self-contained and includes all the necessary information,
// to fully generate a mapping file or UX.
var MAX_NPRN_VALUE = 9999;
export function genNrpnSourceExtraDnA(keyOrValue) {
    if (keyOrValue === EMPTY_KEY) {
        return { abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION };
    }
    if (keyOrValue > MAX_NPRN_VALUE) {
        throw new Error("Unexpected RPN value ".concat(keyOrValue));
    }
    var _description = "NPRN Controller #".concat(keyOrValue);
    var _abbr = keyOrValue.toString().padStart(4, " ");
    if (_abbr[0] === " ") {
        _abbr = "#" + _abbr.slice(1);
    }
    return { abbr: _abbr, description: _description };
}
export function genVarSourceExtraDnA(keyOrValue) {
    if (keyOrValue === EMPTY_KEY) {
        return { abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION };
    }
    if (keyOrValue === 0) {
        return { abbr: "SRC ", description: "Pass Value from Variable/Row" };
    }
    if (keyOrValue > 4096) {
        throw new Error("Unexpected Variable value ".concat(keyOrValue));
    }
    var index = keyOrValue - 1;
    var indexHex = index.toString(16);
    var description = "Set Variable/Row to ".concat(indexHex, "h (").concat(index, ")");
    var abbr = "#" + indexHex.toUpperCase().padStart(3, "0");
    return { abbr: abbr, description: description };
}
export function decodeByteExtra(byteVal) {
    if (byteVal === 255) {
        return { abbr: EMPTY_ABBR_SHORT, description: EMPTY_DESCRIPTION };
    }
    if (byteVal >= 0 && byteVal <= 9) {
        return { abbr: "=".concat(byteVal), description: "Constant ".concat(byteVal) };
    }
    if (byteVal >= 10 && byteVal <= 25) {
        var index = byteVal - 10;
        var char = String.fromCharCode(65 + index);
        return { abbr: "V".concat(char), description: "Variable ".concat(char) };
    }
    if (byteVal >= 26 && byteVal <= 95) {
        var index = byteVal - 26;
        var indexHex = index.toString(16).toUpperCase().padStart(2, '0');
        return { abbr: "".concat(indexHex), description: "Row ".concat(index) };
    }
    throw new Error("Unexpected byte value ".concat(byteVal));
}
export function genCalcSkipSourceExtraDnA(keyOrValue) {
    if (keyOrValue === EMPTY_KEY) {
        return { abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION };
    }
    var byteVal1 = (keyOrValue & 0xff00) >> 8;
    var byteVal2 = keyOrValue & 0x00ff;
    var _a = decodeByteExtra(byteVal1), abbr1 = _a.abbr, description1 = _a.description;
    var _b = decodeByteExtra(byteVal2), abbr2 = _b.abbr, description2 = _b.description;
    // To be consistent with the NS whenever a byte is set, but the other not, the second byte shows as '=0' but is still stored internally as 255
    var abbr = "".concat(abbr1).concat(abbr2);
    if (byteVal1 !== 255 && byteVal2 === 255) {
        abbr = "".concat(abbr1, "=0");
    }
    if (byteVal1 === 255 && byteVal2 !== 255) {
        abbr = "=0".concat(abbr2);
    }
    var description = "".concat(description1, " : ").concat(description2);
    return { abbr: abbr, description: description };
}
export function genMidiCcDestinationDnA(keyOrValue) {
    if (keyOrValue === EMPTY_KEY) {
        return { abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION };
    }
    if (keyOrValue >= 0 && keyOrValue <= 127) {
        var description = "MIDI Controller ".concat(keyOrValue);
        var abbr = "#" + keyOrValue.toString().padStart(3, " ");
        return { abbr: abbr, description: description };
    }
    if (keyOrValue >= 128 && keyOrValue <= 10127) {
        var description = "MIDI NPRN Controller #".concat(keyOrValue);
        var abbr = keyOrValue.toString().padStart(4, " ");
        if (abbr[0] === " ") {
            abbr = "N" + abbr.slice(1);
        }
        return { abbr: abbr, description: description };
    }
    throw new Error("Unexpected RPN value ".concat(keyOrValue));
}
export function toJson() {
    return JSON.stringify(DataModel);
}
export var DataModel = {
    sourceTypes: [
        {
            key: EMPTY_KEY,
            abbr: EMPTY_ABBR,
            description: EMPTY_DESCRIPTION,
            functions: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 0,
            abbr: "CV  ",
            description: "CV or MOD",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "IN 1", description: "CV In 1" },
                { key: 1, abbr: "IN 2", description: "CV In 2" },
                { key: 2, abbr: "IN 3", description: "CV In 3" },
                { key: 3, abbr: "IN 4", description: "CV In 4" },
                { key: 4, abbr: "CV 1", description: "CV Out 1" },
                { key: 5, abbr: "CV 2", description: "CV Out 2" },
                { key: 6, abbr: "CV 3", description: "CV Out 3" },
                { key: 7, abbr: "CV 4", description: "CV Out 4" },
                { key: 8, abbr: "CV 5", description: "CV Out 5" },
                { key: 9, abbr: "CV 6", description: "CV Out 6" },
                { key: 10, abbr: "MOD1", description: "MOD Out 1" },
                { key: 11, abbr: "MOD2", description: "MOD Out 2" },
                { key: 12, abbr: "MOD3", description: "MOD Out 3" },
                { key: 13, abbr: "MOD4", description: "MOD Out 4" },
                { key: 14, abbr: "MOD5", description: "MOD Out 5" },
                { key: 15, abbr: "MOD6", description: "MOD Out 6" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 1,
            abbr: "TRIG",
            description: "Trigger",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "TR 1", description: "Trigger 1" },
                { key: 1, abbr: "TR 2", description: "Trigger 2" },
                { key: 2, abbr: "TR 3", description: "Trigger 3" },
                { key: 3, abbr: "TR 4", description: "Trigger 4" },
                { key: 4, abbr: "TR 5", description: "Trigger 5" },
                { key: 5, abbr: "TR 6", description: "Trigger 6" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 2,
            abbr: "TRCK",
            description: "Track",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "TRK1", description: "Track 1" },
                { key: 1, abbr: "TRK2", description: "Track 2" },
                { key: 2, abbr: "TRK3", description: "Track 3" },
                { key: 3, abbr: "TRK4", description: "Track 4" },
                { key: 4, abbr: "TRK5", description: "Track 5" },
                { key: 5, abbr: "TRK6", description: "Track 6" },
                { key: 6, abbr: "TRK7", description: "Track 7" },
                { key: 7, abbr: "TRK8", description: "Track 8" },
            ],
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "PRB0", description: "Probability 0" },
                { key: 1, abbr: "PRB1", description: "Probability 1" },
                { key: 2, abbr: "PRB2", description: "Probability 2" },
                { key: 3, abbr: "PRB3", description: "Probability 3" },
                { key: 4, abbr: "PRB4", description: "Probability 4" },
                { key: 5, abbr: "PRB5", description: "Probability 5" },
                { key: 6, abbr: "PRB6", description: "Probability 6" },
                { key: 7, abbr: "PRB7", description: "Probability 7" },
                { key: 8, abbr: "PRB8", description: "Row Probability" },
                { key: 9, abbr: "PTRW", description: "Pattern Row" },
                { key: 10, abbr: "PRUN", description: "Pattern/Track Run Status" },
                { key: 11, abbr: "NOTE", description: "Track Active Note" },
            ],
        },
        {
            key: 3,
            abbr: "AUTM",
            description: "Automator",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SLT0", description: "Slot 0" },
                { key: 1, abbr: "SLT1", description: "Slot 1" },
                { key: 2, abbr: "SLT2", description: "Slot 2" },
                { key: 3, abbr: "SLT3", description: "Slot 3" },
                { key: 4, abbr: "SLT4", description: "Slot 4" },
                { key: 5, abbr: "SLT5", description: "Slot 5" },
                { key: 6, abbr: "SLT6", description: "Slot 6" },
                { key: 7, abbr: "SLT7", description: "Slot 7" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 4,
            abbr: "ENV ",
            description: "Envelope",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "#  1", description: "Envelope 1" },
                { key: 1, abbr: "#  2", description: "Envelope 2" },
                { key: 2, abbr: "#  3", description: "Envelope 3" },
                { key: 3, abbr: "#  4", description: "Envelope 4" },
                { key: 4, abbr: "#  5", description: "Envelope 5" },
                { key: 5, abbr: "#  6", description: "Envelope 6" },
                { key: 6, abbr: "#  7", description: "Envelope 7" },
                { key: 7, abbr: "#  8", description: "Envelope 8" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 5,
            abbr: "MIDI",
            description: "MIDI",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: genMidiNoteExtras(),
        },
        {
            key: 6,
            abbr: "MCC ",
            description: "MIDI CC",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: genMidiControllerExtras(),
        },
        {
            key: 7,
            abbr: "NPRN",
            description: "MIDI NRPN",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code.
            // 0..9999 "Midi NRPN Controller #"
        },
        {
            key: 8,
            abbr: "I2C ",
            description: "I2C",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SCCV", description: "SC.CV" },
                { key: 48, abbr: "LRN ", description: "Learn" },
            ],
            extras: genI2cPortExtras(),
        },
        {
            key: 9,
            abbr: "VAR ",
            description: "Variable",
            functions: genVariableSourceFunctions(),
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code.
            // 0 Pass Value from Variable/Row
            // 1..4096 Set Variable/ Row to 0 - 4095 / 0 - FFF
        },
        {
            key: 10,
            abbr: "CALC",
            description: "Calculation",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "ADD ", description: "Add" },
                { key: 1, abbr: "ADD!", description: "Add with Overflow" },
                { key: 2, abbr: "SUB ", description: "Subtract" },
                { key: 3, abbr: "SUB!", description: "Subtract with Overflow" },
                { key: 4, abbr: "MUL ", description: "Multiply" },
                { key: 5, abbr: "MUL!", description: "Multiply with Overflow" },
                { key: 6, abbr: "MUL.", description: "Multiply 0.1" },
                { key: 7, abbr: "MUL:", description: "Multiply 0.1 with Overflow" },
                { key: 8, abbr: "DIV ", description: "Divide" },
                { key: 9, abbr: "DIV.", description: "Divide 0.1" },
                { key: 10, abbr: "DIV:", description: "Divide 0.1 with Overflow" },
                { key: 11, abbr: "MOD ", description: "Modulo" },
                { key: 12, abbr: "BAND", description: "Bitwise AND" },
                { key: 13, abbr: "B OR", description: "Bitwise OR" },
                { key: 14, abbr: "BXOR", description: "Bitwise XOR" },
                { key: 15, abbr: "LSFT", description: "Left SHIFT" },
                { key: 16, abbr: "RSFT", description: "Right SHIFT" },
                { key: 17, abbr: "LAND", description: "Logical AND" },
                { key: 18, abbr: "L OR", description: "Logical OR" },
                { key: 19, abbr: "LXOR", description: "Logical XOR" },
                { key: 20, abbr: "IF <", description: "IF <" },
                { key: 21, abbr: "IF<=", description: "IF <=" },
                { key: 22, abbr: "IF >", description: "IF >" },
                { key: 23, abbr: "IF>=", description: "IF >=" },
                { key: 24, abbr: "IF =", description: "IF =" },
                { key: 25, abbr: "IF<>", description: "IF <>" },
                { key: 26, abbr: "LFLP", description: "Flipflop" },
                { key: 27, abbr: "FLG^", description: "Raising value does invert" },
                { key: 28, abbr: "FLGv", description: "Falling value does invert" },
                { key: 29, abbr: "T&H ", description: "Track & Hold" },
                { key: 30, abbr: "S&H ", description: "Sample & Hold" },
                { key: 31, abbr: "PASS", description: "Pass A if B is true" },
                { key: 32, abbr: "CNT ", description: "Count" },
                { key: 33, abbr: "DINV", description: "Logical Invert" },
                { key: 34, abbr: "INV ", description: "Bitwise Invert" },
                { key: 35, abbr: "SHTR", description: "Right Shift with carry" },
                { key: 36, abbr: "SHTL", description: "Left Shift with carry" },
                { key: 37, abbr: "INC ", description: "Increment" },
                { key: 38, abbr: "DEC ", description: "Decrement" },
                { key: 39, abbr: "MIN ", description: "MIN" },
                { key: 40, abbr: "MAX ", description: "MAX" },
                { key: 41, abbr: "AVRG", description: "Average" },
                { key: 42, abbr: "P2NT", description: "Pitch To Note" },
                { key: 43, abbr: "NT2P", description: "Note To Pitch" },
                { key: 44, abbr: "RNDM", description: "Generate Random Value" },
                { key: 45, abbr: "RNGE", description: "Range former row between A and B" },
                { key: 46, abbr: "FORC", description: "Force Value to Destination" },
                { key: 47, abbr: "PULS", description: "Generate Onetime Pulse if A is getting bigger than B" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code.
            // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
            // Value definition of a operand:
            // = 0..= 9 Constant 0 to 9
            // VA..VP Variables A- P
            // 00..70 Rows 0 - 70
        },
        {
            key: 11,
            abbr: "SKIP",
            description: "Skip",
            functions: genSkipSourceFunctions(),
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code.
            // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
            // Value definition of a operand:
            // = 0..= 9 Constant 0 to 9
            // VA..VP Variables A- P
            // 00..70 Rows 0 - 70
        },
        {
            key: 12,
            abbr: "GLOB",
            description: "Global",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SQRW", description: "Current Main Clock Row" },
                { key: 1, abbr: "SRUN", description: "Sequencer Started/Stopped" },
                { key: 2, abbr: "CLKI", description: "Clock Input State" },
                { key: 3, abbr: "CLKO", description: "Clock Output State" },
                { key: 4, abbr: "RSTI", description: "Reset Input State" },
                { key: 5, abbr: "RSTO", description: "Reset Output State" },
                { key: 6, abbr: "RAND", description: "Random Value" },
                { key: 7, abbr: "BPM ", description: "Clock Tempo/BPM" },
                { key: 8, abbr: "SEQV", description: "Sequencer Value" },
                { key: 9, abbr: "PULS", description: "Create Pulse from Command" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 13,
            abbr: "EXT ",
            description: "External",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "KEYB", description: "Keyboard Numpad" },
                { key: 1, abbr: "SEGA", description: "Sega Gamepad" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code. Different Extras for each of 0, 1
            // Use KeyboardSourceExtras and GamepadSourceExtras
        },
        {
            key: 14,
            abbr: "CTRL",
            description: "Control",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "XMAP", description: "External X Mapping Rows" },
            ],
            extras: genControlSourceExtras(),
        },
    ],
    destinationTypes: [
        {
            key: EMPTY_KEY,
            description: EMPTY_DESCRIPTION,
            abbr: EMPTY_ABBR,
            functions: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 0,
            abbr: "CV  ",
            description: "CV",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "PTCH", description: "Pitch" },
                { key: 1, abbr: "NOTE", description: "Note" },
            ],
            extras: genCVDestinationExtras(),
        },
        {
            key: 1,
            abbr: "TRIG",
            description: "Trigger",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "GATE", description: "Gate" },
                { key: 1, abbr: "TRIG", description: "Trigger" },
                { key: 2, abbr: "TVAL", description: "Trigger Value" },
                { key: 3, abbr: "TRG*", description: "Trigger Always" },
                { key: 4, abbr: "VAL*", description: "Trigger Value Always" },
            ],
            extras: genTriggerDestinationExtras(),
        },
        {
            key: 2,
            abbr: "TRCK",
            description: "Track",
            functions: genTrackDestinationFunctions(),
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
        },
        {
            key: 3,
            abbr: "AUTM",
            description: "Automator",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SLT0", description: "Selected Automator Slot 0" },
                { key: 1, abbr: "SLT1", description: "Selected Automator Slot 1" },
                { key: 2, abbr: "SLT2", description: "Selected Automator Slot 2" },
                { key: 3, abbr: "SLT3", description: "Selected Automator Slot 3" },
                { key: 4, abbr: "SLT4", description: "Selected Automator Slot 4" },
                { key: 5, abbr: "SLT5", description: "Selected Automator Slot 5" },
                { key: 6, abbr: "SLT6", description: "Selected Automator Slot 6" },
                { key: 7, abbr: "SLT7", description: "Selected Automator Slot 7" },
            ],
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "STRT", description: "LFO Start" },
                { key: 1, abbr: "RST ", description: "LFO Reset" },
                { key: 2, abbr: "SPED", description: "LFO Speed" },
                { key: 3, abbr: "OFFS", description: "LFO Offset" },
                { key: 4, abbr: "INV ", description: "LFO Invert" },
                { key: 5, abbr: "CLCK", description: "LFO Clock Source" },
                { key: 6, abbr: "AMP ", description: "LFO Amplitude" },
                { key: 7, abbr: "WAVE", description: "LFO Waveform" },
                { key: 8, abbr: "BIT ", description: "LFO Bit Rate" },
                { key: 9, abbr: "PHAS", description: "LFO Phase" },
            ],
        },
        {
            key: 4,
            abbr: "ENV ",
            description: "Envelope",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "#  1", description: "Envelope 1" },
                { key: 1, abbr: "#  2", description: "Envelope 2" },
                { key: 2, abbr: "#  3", description: "Envelope 3" },
                { key: 3, abbr: "#  4", description: "Envelope 4" },
                { key: 4, abbr: "#  5", description: "Envelope 5" },
                { key: 5, abbr: "#  6", description: "Envelope 6" },
                { key: 6, abbr: "#  7", description: "Envelope 7" },
                { key: 7, abbr: "#  8", description: "Envelope 8" },
            ],
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "ATK ", description: "Attack" },
                { key: 1, abbr: "ATKP", description: "Attack Peak" },
                { key: 2, abbr: "DECY", description: "Decay" },
                { key: 3, abbr: "SUST", description: "Sustain" },
                { key: 4, abbr: "RELS", description: "Release" },
                { key: 5, abbr: "OFFS", description: "Offset" },
                { key: 6, abbr: "GATE", description: "Gate" },
                { key: 7, abbr: "FIRE", description: "Fire" },
                { key: 8, abbr: "TOGL", description: "Toggle" },
            ],
        },
        {
            key: 5,
            abbr: "MCON",
            description: "MIDI CC",
            functions: genMidiDeviceChannelDestinationFunctions(),
            extras: genMidiControllerExtras(),
            // Handle in code
            // 128 - 10127 Midi NRPN Controller 0-9999
        },
        {
            key: 6,
            abbr: "I2C ",
            description: "I2C",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "A CV", description: "I2CA SET.CV Slew" },
                { key: 1, abbr: "ACVS", description: "I2CA SET.CV NoSlew" },
                { key: 2, abbr: "ACVX", description: "I2CA SET.CV NoSlew X" },
                { key: 3, abbr: "A TR", description: "I2CA SET.TR" },
                { key: 4, abbr: "B CV", description: "I2CA SET.CV Slew" },
                { key: 5, abbr: "BCVS", description: "I2CA SET.CV NoSlew" },
                { key: 6, abbr: "BCVX", description: "I2CA SET.CV NoSlew X" },
                { key: 7, abbr: "B TR", description: "I2CA SET.TR" },
            ],
            extras: genI2cPortExtras(),
        },
        {
            key: 7,
            abbr: "AUDI",
            description: "Audio",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "#  1", description: "Audio Part/Channel/Operator 1" },
                { key: 1, abbr: "#  2", description: "Audio Part/Channel/Operator 2" },
                { key: 2, abbr: "#  3", description: "Audio Part/Channel/Operator 3" },
                { key: 3, abbr: "#  4", description: "Audio Part/Channel/Operator 4" },
            ],
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "PTCH", description: "Pitch" },
                { key: 1, abbr: "NOTE", description: "Note" },
                { key: 2, abbr: "GATE", description: "Gate" },
                { key: 3, abbr: "ONOF", description: "Start/Stop Wave" },
                { key: 4, abbr: "WAVE", description: "Sample/Waveform" },
                { key: 5, abbr: "OFFS", description: "Offset" },
                { key: 6, abbr: "BACK", description: "Backwards" },
                { key: 7, abbr: "DLYT", description: "Delay Type" },
                { key: 8, abbr: "DYTI", description: "Delay Time" },
                { key: 9, abbr: "DLYS", description: "Delay Send" },
                { key: 10, abbr: "FDBK", description: "Delay Feedback" },
                { key: 11, abbr: "BOST", description: "FM Boost" },
                { key: 12, abbr: "VOLM", description: "Volume" },
                { key: 13, abbr: "GLID", description: "Glide" },
                { key: 14, abbr: "MUTE", description: "Mute" },
                { key: 15, abbr: "CLON", description: "Clone Notes" },
                { key: 16, abbr: "CORS", description: "Note Coarse" },
                { key: 17, abbr: "CFIN", description: "Fine Coarse" },
                { key: 18, abbr: "MSRC", description: "Modulation Source" },
                { key: 19, abbr: "PWM ", description: "PWM" },
                { key: 20, abbr: "WFLD", description: "Wave Folder" },
                { key: 21, abbr: "BCSH", description: "Bit Crusher" },
                { key: 22, abbr: "DIST", description: "Distortion" },
            ],
        },
        {
            key: 8,
            abbr: "SETV",
            description: "Variable",
            functions: genVariableDestinationFunctions(),
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SRC ", description: "Set Variable/Row" },
                { key: 1, abbr: "RST ", description: "Reset Variable/Row if Source == true" },
            ],
        },
        {
            key: 9,
            abbr: "RNDM",
            description: "Random Range",
            functions: genRandomRangeDestinationFunctions(),
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "LOW ", description: "Minimum Range" },
                { key: 1, abbr: "HIGH", description: "Maximum Range" },
            ],
        },
        {
            key: 10,
            abbr: "GLOB",
            description: "Global",
            functions: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "TPS ", description: "Transpose" },
                { key: 1, abbr: "SWNG", description: "Swing" },
                { key: 2, abbr: "TMPO", description: "Tempo/BPM" },
                { key: 3, abbr: "MCLK", description: "Master Clock Steps" },
                { key: 4, abbr: "SCAL", description: "Scale" },
                { key: 5, abbr: "SLKN", description: "Scale Keynote" },
                { key: 6, abbr: "SYNC", description: "Resync All Tracks" },
                { key: 7, abbr: "RSET", description: "Reset Player" },
                { key: 8, abbr: "MREC", description: "Row as Midi Record Source" },
                { key: 9, abbr: "BUTN", description: "Buttons" },
                { key: 10, abbr: "SCRN", description: "Screens" },
                { key: 11, abbr: "MODE", description: "Modes" },
            ],
            extras: [{ key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION }],
            // Handle Extras in code. Different Extras for each of 9, 10, 11
            // Use GlobalButtonsDestinationExtras, GlobalScreensDestinationExtras, and GlobalModesDestinationExtras
        },
        {
            key: 11,
            abbr: "CV16",
            description: "CV16",
            functions: genCV16DestinationFunctions(),
            extras: genCV16DestinationExtras(),
        },
        {
            key: 12,
            abbr: "TABL",
            description: "Table",
            functions: genTableDestinationFunctions(),
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "SPED", description: "Speed" },
                { key: 1, abbr: "TYPE", description: "Type" },
                { key: 2, abbr: "QUTZ", description: "Quantize" },
                { key: 3, abbr: "CHRD", description: "Set Chord" },
                { key: 4, abbr: "RGLO", description: "Range Low" },
                { key: 5, abbr: "RGHI", description: "Range High" },
                { key: 6, abbr: "PRST", description: "Set Preset" },
                { key: 7, abbr: "TICK", description: "Add Tick" },
            ],
        },
        {
            key: 13,
            abbr: "MIDI",
            description: "MIDI",
            functions: genMidiDeviceChannelDestinationFunctions(false),
            extras: [
                { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
                { key: 0, abbr: "NTON", description: "Note On" },
                { key: 1, abbr: "NTOF", description: "Note Off" },
                { key: 2, abbr: "NOTE", description: "Note OnOff" },
                { key: 3, abbr: "PBND", description: "Pitch Bend" },
            ],
        },
    ],
};
export var keyboardSourceExtras = [
    { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
    { key: 0, abbr: "NUM0", description: "Keyboard Numpad 0" },
    { key: 1, abbr: "NUM1", description: "Keyboard Numpad 1" },
    { key: 2, abbr: "NUM2", description: "Keyboard Numpad 2" },
    { key: 3, abbr: "NUM3", description: "Keyboard Numpad 3" },
    { key: 4, abbr: "NUM4", description: "Keyboard Numpad 4" },
    { key: 5, abbr: "NUM5", description: "Keyboard Numpad 5" },
    { key: 6, abbr: "NUM6", description: "Keyboard Numpad 6" },
    { key: 7, abbr: "NUM7", description: "Keyboard Numpad 7" },
    { key: 8, abbr: "NUM8", description: "Keyboard Numpad 8" },
    { key: 9, abbr: "NUM9", description: "Keyboard Numpad 9" },
    { key: 10, abbr: "DOT ", description: "Keyboard Numpad ." },
];
export var segaGamepadSourceExtras = [
    { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
    { key: 0, abbr: "A   ", description: "Sega Gamepad: A" },
    { key: 1, abbr: "B   ", description: "Sega Gamepad: B" },
    { key: 2, abbr: "C   ", description: "Sega Gamepad: C" },
    { key: 3, abbr: "X   ", description: "Sega Gamepad: X" },
    { key: 4, abbr: "Y   ", description: "Sega Gamepad: Y" },
    { key: 5, abbr: "Z   ", description: "Sega Gamepad: Z" },
    { key: 6, abbr: "STRT", description: "Sega Gamepad: Start" },
    { key: 7, abbr: "MODE", description: "Sega Gamepad: Mode" },
    { key: 8, abbr: "UP  ", description: "Sega Gamepad: Up" },
    { key: 9, abbr: "DOWN", description: "Sega Gamepad: Down" },
    { key: 10, abbr: "LEFT", description: "Sega Gamepad: Left" },
    { key: 11, abbr: "RGHT", description: "Sega Gamepad: Right" },
];
export var globalButtonsDestinationExtras = [
    { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
    { key: 0, abbr: "SEQ ", description: "Sequencer/Mark" },
    { key: 1, abbr: "PATN", description: "Pattern/Copy" },
    { key: 2, abbr: "PTCH", description: "Patch/Delete" },
    { key: 3, abbr: "TABL", description: "Table/Record" },
    { key: 4, abbr: "AUTM", description: "Automate/Nerd" },
    { key: 5, abbr: "PROJ", description: "Project/Setup" },
    { key: 6, abbr: "STRT", description: "Start" },
    { key: 7, abbr: "STOP", description: "Stop" },
    { key: 8, abbr: "SHFT", description: "Shift" },
    { key: 9, abbr: "OK  ", description: "OK" },
    { key: 10, abbr: "DOWN", description: "Down" },
    { key: 11, abbr: "UP  ", description: "Up" },
    { key: 12, abbr: "C UP", description: "Cursor Up" },
    { key: 13, abbr: "CDWN", description: "Cursor Down" },
    { key: 14, abbr: "CLFT", description: "Cursor Left" },
    { key: 15, abbr: "CRGT", description: "Cursor Right" },
];
export var globalScreensDestinationExtras = [
    { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
    { key: 0, abbr: "SEQ ", description: "Sequencer Screen" },
    { key: 1, abbr: "PATN", description: "Pattern Screen" },
    { key: 2, abbr: "PTCH", description: "Patch Screen" },
    { key: 3, abbr: "TABL", description: "Table Screen" },
    { key: 4, abbr: "CVAL", description: "Current Values Screen" },
    { key: 5, abbr: "AUTM", description: "Automator Screen" },
    { key: 6, abbr: "ENV ", description: "Envelope Screen" },
    { key: 7, abbr: "TSET", description: "Track Setup Screen" },
    { key: 8, abbr: "RDFX", description: "Random FX Screen" },
    { key: 9, abbr: "MAPP", description: "Mappings Screen" },
    { key: 10, abbr: "VAR ", description: "Variable Screen" },
    { key: 11, abbr: "SCAL", description: "Scaling Screen" },
    { key: 12, abbr: "NERD", description: "Nerd Menu" },
    { key: 13, abbr: "PROJ", description: "Project Screen" },
    { key: 14, abbr: "SETP", description: "Setup Screen" },
    { key: 15, abbr: "SMPL", description: "Sample Select Screen" },
    { key: 16, abbr: "RSET", description: "Record Setup Screen" },
    { key: 17, abbr: "MI2C", description: "Midi/I2C Setup Screen" },
    { key: 18, abbr: "SSVR", description: "Screen Saver" },
    { key: 19, abbr: "TASS", description: "Track Assign Screen" },
    { key: 20, abbr: "LOAD", description: "Load Project" },
    { key: 21, abbr: "SAVE", description: "Save Project" },
];
export var globalModesDestinationExtras = [
    { key: EMPTY_KEY, abbr: EMPTY_ABBR, description: EMPTY_DESCRIPTION },
    { key: 0, abbr: "EDIT", description: "Edit Mode" },
    { key: 1, abbr: "REC ", description: "Record Mode" },
];
//# sourceMappingURL=dataModel.js.map