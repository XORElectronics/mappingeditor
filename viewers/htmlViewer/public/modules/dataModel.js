export var EMPTY_KEY = 65535;
export var MIDI_RPN_SOURCE_TYPE_KEY = 7;
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
    sourceFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        sourceFunctions.push({ key: key, value: "TRS Midi Channel ".concat(key + 1) });
    }
    for (var key = 16; key <= 31; key++) {
        sourceFunctions.push({ key: key, value: "USB Host Midi Channel ".concat(key - 15) });
    }
    for (var key = 32; key <= 47; key++) {
        sourceFunctions.push({ key: key, value: "USB Device Midi Channel ".concat(key - 31) });
    }
    sourceFunctions.push({ key: 48, value: "MIDI Learn" });
    return sourceFunctions;
}
function genMidiNoteExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    extras.push({ key: 0, value: "Note" });
    extras.push({ key: 1, value: "Gate" });
    extras.push({ key: 2, value: "Velocity" });
    extras.push({ key: 3, value: "Channel Pressure" });
    extras.push({ key: 4, value: "Pitch Bend" });
    for (var key = 5; key <= 124; key++) {
        extras.push({ key: key, value: "Selected Midi Note ".concat(key - 5, " On/Off") });
    }
    for (var key = 125; key <= 245; key++) {
        extras.push({ key: key, value: "Selected Midi Note ".concat(key - 125, " Velocity") });
    }
    for (var key = 246; key <= 364; key++) {
        extras.push({ key: key, value: "Selected Midi Note ".concat(key - 246, " Aftertouch") });
    }
    return extras;
}
function genVariableSourceFunctions() {
    var sourceFunctions = [];
    sourceFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        sourceFunctions.push({ key: key, value: "Variable ".concat(String.fromCharCode(65 + key)) });
    }
    for (var key = 16; key <= 86; key++) {
        sourceFunctions.push({ key: key, value: "Mapping Row ".concat((key - 16).toString(16), " (").concat(key - 16, ")") });
    }
    return sourceFunctions;
}
function genSkipSourceFunctions() {
    var sourceFunctions = [];
    sourceFunctions.push({ key: 65535, value: "----" });
    var key = 0;
    for (var rowSkipCount = 1; rowSkipCount <= 16; rowSkipCount++) {
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 < Param2") });
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 <= Param2") });
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 > Param2") });
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 >= Param2") });
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 = Param2") });
        sourceFunctions.push({ key: key++, value: "Skip ".concat(rowSkipCount, " Rows If Param1 <> Param2") });
    }
    return sourceFunctions;
}
function genControlSourceExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 31; key++) {
        extras.push({ key: key, value: "Execute ".concat(key + 1, " Mapping Rows") });
    }
    return extras;
}
function genVariableDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        destinationFunctions.push({ key: key, value: "Variable ".concat(String.fromCharCode(65 + key)) });
    }
    for (var key = 16; key <= 85; key++) {
        destinationFunctions.push({ key: key, value: "Mapping Row ".concat((key - 16).toString(16), "h (").concat(key - 16, ")") });
    }
    return destinationFunctions;
}
function genMidiDeviceChannelDestinationFunctions(addLearn) {
    if (addLearn === void 0) { addLearn = true; }
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        destinationFunctions.push({ key: key, value: "TRS Midi Channel ".concat(key + 1) });
    }
    for (var key = 16; key <= 31; key++) {
        destinationFunctions.push({ key: key, value: "USB Host Midi Channel ".concat(key - 15) });
    }
    for (var key = 32; key <= 47; key++) {
        destinationFunctions.push({ key: key, value: "USB Device Midi Channel ".concat(key - 31) });
    }
    if (addLearn) {
        destinationFunctions.push({ key: 48, value: "MIDI Learn" });
    }
    return destinationFunctions;
}
function genCVDestinationExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 5; key++) {
        extras.push({ key: key, value: "Local CV ".concat(key) });
    }
    for (var key = 6; key <= 11; key++) {
        extras.push({ key: key, value: "Local MOD ".concat(key - 6) });
    }
    for (var key = 12; key <= 27; key++) {
        extras.push({ key: key, value: "CV16 NSA1 ".concat(key - 12) });
    }
    for (var key = 28; key <= 43; key++) {
        extras.push({ key: key, value: "CV16 NSA2 ".concat(key - 28) });
    }
    for (var key = 44; key <= 59; key++) {
        extras.push({ key: key, value: "CV16 NSA3 ".concat(key - 44) });
    }
    for (var key = 60; key <= 75; key++) {
        extras.push({ key: key, value: "CV16 NSA4 ".concat(key - 60) });
    }
    return extras;
}
function genTriggerDestinationExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 5; key++) {
        extras.push({ key: key, value: "Local Trigger ".concat(key) });
    }
    for (var key = 6; key <= 21; key++) {
        extras.push({ key: key, value: "Trigger16 NSA1 ".concat(key - 6) });
    }
    for (var key = 22; key <= 37; key++) {
        extras.push({ key: key, value: "Trigger16 NSA2 ".concat(key - 22) });
    }
    for (var key = 38; key <= 53; key++) {
        extras.push({ key: key, value: "Trigger16 NSA3 ".concat(key - 38) });
    }
    for (var key = 54; key <= 69; key++) {
        extras.push({ key: key, value: "Trigger16 NSA4 ".concat(key - 54) });
    }
    return extras;
}
function genTrackDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    destinationFunctions.push({ key: 0, value: "Mute" });
    destinationFunctions.push({ key: 1, value: "Solo" });
    destinationFunctions.push({ key: 2, value: "Pattern Order" });
    destinationFunctions.push({ key: 3, value: "Transpose" });
    destinationFunctions.push({ key: 4, value: "Trigger Delay" });
    destinationFunctions.push({ key: 5, value: "Probability 1" });
    destinationFunctions.push({ key: 6, value: "Probability 2" });
    destinationFunctions.push({ key: 7, value: "Probability 3" });
    destinationFunctions.push({ key: 8, value: "Probability 4" });
    destinationFunctions.push({ key: 9, value: "Probability 5" });
    destinationFunctions.push({ key: 10, value: "Probability 6" });
    destinationFunctions.push({ key: 11, value: "Probability 7" });
    destinationFunctions.push({ key: 12, value: "Probability 8" });
    destinationFunctions.push({ key: 13, value: "Row Probability" });
    destinationFunctions.push({ key: 14, value: "Glide CV" });
    destinationFunctions.push({ key: 15, value: "Glide CV Resolution" });
    destinationFunctions.push({ key: 16, value: "Glide MOD" });
    destinationFunctions.push({ key: 17, value: "Glide MOD Resolution" });
    destinationFunctions.push({ key: 18, value: "Track Clock" });
    destinationFunctions.push({ key: 19, value: "Set Pattern Start Position(not used yet)" });
    destinationFunctions.push({ key: 20, value: "Pattern Length" });
    destinationFunctions.push({ key: 21, value: "Set current Pattern Row" });
    destinationFunctions.push({ key: 22, value: "Generate Tick" });
    destinationFunctions.push({ key: 23, value: "Pattern Shift Up" });
    destinationFunctions.push({ key: 24, value: "Pattern Shift Down" });
    destinationFunctions.push({ key: 25, value: "Sync Track" });
    destinationFunctions.push({ key: 26, value: "Reset Track" });
    destinationFunctions.push({ key: 27, value: "FX1 Overrule" });
    destinationFunctions.push({ key: 28, value: "FX2 Overrule" });
    destinationFunctions.push({ key: 29, value: "FX3 Overrule" });
    destinationFunctions.push({ key: 30, value: "FX4 Overrule" });
    destinationFunctions.push({ key: 31, value: "Unused" });
    destinationFunctions.push({ key: 32, value: "Unused" });
    destinationFunctions.push({ key: 33, value: "Unused" });
    destinationFunctions.push({ key: 34, value: "Unused" });
    destinationFunctions.push({ key: 35, value: "Unused" });
    destinationFunctions.push({ key: 36, value: "Unused" });
    destinationFunctions.push({ key: 37, value: "Euclidean" });
    for (var key = 38; key <= 53; key++) {
        destinationFunctions.push({ key: key, value: "Drum Matrix Euclidean ".concat(key - 38) });
    }
    destinationFunctions.push({ key: 54, value: "Pattern Cursor Position" });
    destinationFunctions.push({ key: 55, value: "Pattern Note at Cursor" });
    for (var key = 56; key <= 119; key++) {
        destinationFunctions.push({ key: key, value: "Note at Pattern Step ".concat(key - 56) });
    }
    for (var key = 120; key <= 183; key++) {
        destinationFunctions.push({ key: key, value: "Value at Cursor Column Step ".concat(key - 120) });
    }
    return destinationFunctions;
}
function genTableDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 31; key++) {
        destinationFunctions.push({ key: key, value: "Selected Table ".concat(key + 1) });
    }
    for (var key = 32; key <= 40; key++) {
        destinationFunctions.push({ key: key, value: "Running Table on Track ".concat(key - 31) });
    }
    return destinationFunctions;
}
function genRandomRangeDestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        destinationFunctions.push({ key: key, value: "Range ".concat(key) });
    }
    return destinationFunctions;
}
function genCV16DestinationFunctions() {
    var destinationFunctions = [];
    destinationFunctions.push({ key: 65535, value: "----" });
    destinationFunctions.push({ key: 0, value: "Glide Speed" });
    destinationFunctions.push({ key: 1, value: "Glide Resolution" });
    var key = 2;
    for (var envCount = 0; envCount <= 7; envCount++) {
        destinationFunctions.push({ key: key++, value: "Envelope ".concat(envCount + 1, " Attack") });
        destinationFunctions.push({ key: key++, value: "Envelope ".concat(envCount + 1, " Amplitude") });
        destinationFunctions.push({ key: key++, value: "Envelope ".concat(envCount + 1, " Release") });
        destinationFunctions.push({ key: key++, value: "Envelope ".concat(envCount + 1, " Fire Oneshot") });
        destinationFunctions.push({ key: key++, value: "Envelope ".concat(envCount + 1, " Fire A/R") });
    }
    for (var lfoCount = 0; lfoCount <= 7; lfoCount++) {
        destinationFunctions.push({ key: key++, value: "LFO ".concat(lfoCount + 1, " Type") });
        destinationFunctions.push({ key: key++, value: "LFO ".concat(lfoCount + 1, " Speed") });
        destinationFunctions.push({ key: key++, value: "LFO ".concat(lfoCount + 1, " Amplitude") });
        destinationFunctions.push({ key: key++, value: "LFO ".concat(lfoCount + 1, " Start") });
        destinationFunctions.push({ key: key++, value: "LFO ".concat(lfoCount + 1, " Reset") });
    }
    destinationFunctions.push({ key: 82, value: "Stop Modulator Function" });
    return destinationFunctions;
}
function genCV16DestinationExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 15; key++) {
        extras.push({ key: key, value: "NSA1 ".concat(key + 1) });
    }
    for (var key = 16; key <= 31; key++) {
        extras.push({ key: key, value: "NSA2 ".concat(key - 15) });
    }
    for (var key = 32; key <= 47; key++) {
        extras.push({ key: key, value: "NSA3 ".concat(key - 31) });
    }
    for (var key = 48; key <= 63; key++) {
        extras.push({ key: key, value: "NSA4 ".concat(key - 47) });
    }
    return extras;
}
function genMidiControllerExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 127; key++) {
        extras.push({ key: key, value: "MIDI Controller #".concat(key) });
    }
    return extras;
}
function genI2cPortExtras() {
    var extras = [];
    extras.push({ key: 65535, value: "----" });
    for (var key = 0; key <= 127; key++) {
        extras.push({ key: key, value: "Port Number ".concat(key) });
    }
    return extras;
}
export function toJson() {
    return JSON.stringify(DataModel);
}
export var DataModel = {
    sourceTypes: [
        {
            key: 65535,
            value: "----",
            functions: [{ key: 65535, value: "----" }],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 0,
            value: "CV or MOD",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "CV In 1" },
                { key: 1, value: "CV In 2" },
                { key: 2, value: "CV In 3" },
                { key: 3, value: "CV In 4" },
                { key: 4, value: "CV Out 1" },
                { key: 5, value: "CV Out 2" },
                { key: 6, value: "CV Out 3" },
                { key: 7, value: "CV Out 4" },
                { key: 8, value: "CV Out 5" },
                { key: 9, value: "CV Out 6" },
                { key: 10, value: "MOD Out 1" },
                { key: 11, value: "MOD Out 2" },
                { key: 12, value: "MOD Out 3" },
                { key: 13, value: "MOD Out 4" },
                { key: 14, value: "MOD Out 5" },
                { key: 15, value: "MOD Out 6" },
            ],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 1,
            value: "Trigger",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Trigger 1" },
                { key: 1, value: "Trigger 2" },
                { key: 2, value: "Trigger 3" },
                { key: 3, value: "Trigger 4" },
                { key: 4, value: "Trigger 5" },
                { key: 5, value: "Trigger 6" },
            ],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 2,
            value: "Track",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Track 1" },
                { key: 1, value: "Track 2" },
                { key: 2, value: "Track 3" },
                { key: 3, value: "Track 4" },
                { key: 4, value: "Track 5" },
                { key: 5, value: "Track 6" },
                { key: 6, value: "Track 7" },
                { key: 7, value: "Track 8" },
            ],
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Probability 0" },
                { key: 1, value: "Probability 1" },
                { key: 2, value: "Probability 2" },
                { key: 3, value: "Probability 3" },
                { key: 4, value: "Probability 4" },
                { key: 5, value: "Probability 5" },
                { key: 6, value: "Probability 6" },
                { key: 7, value: "Probability 7" },
                { key: 8, value: "Row Probability" },
                { key: 9, value: "Pattern Row" },
                { key: 10, value: "Pattern/Track Run Status" },
                { key: 11, value: "Track Active Note" },
            ],
        },
        {
            key: 3,
            value: "Automator",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Slot 1" },
                { key: 1, value: "Slot 2" },
                { key: 2, value: "Slot 3" },
                { key: 3, value: "Slot 4" },
                { key: 4, value: "Slot 5" },
                { key: 5, value: "Slot 6" },
                { key: 6, value: "Slot 7" },
                { key: 7, value: "Slot 8" },
            ],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 4,
            value: "Envelope",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Envelope 1" },
                { key: 1, value: "Envelope 2" },
                { key: 2, value: "Envelope 3" },
                { key: 3, value: "Envelope 4" },
                { key: 4, value: "Envelope 5" },
                { key: 5, value: "Envelope 6" },
                { key: 6, value: "Envelope 7" },
                { key: 7, value: "Envelope 8" },
            ],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 5,
            value: "MIDI Note",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: genMidiNoteExtras(),
        },
        {
            key: 6,
            value: "MIDI CC",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: genMidiControllerExtras(),
        },
        {
            key: 7,
            value: "MIDI NRPN",
            functions: genMidiDeviceChannelSourceFunctions(),
            extras: [{ key: 65535, value: "----" },]
            // Handle Extras in code. 
            // 0..9999 "Midi NRPN Controller #"
        },
        {
            key: 8,
            value: "I2C",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "SC.CV" },
                { key: 48, value: "Learn" },
            ],
            extras: genI2cPortExtras(),
        },
        {
            key: 9,
            value: "Variable",
            functions: genVariableSourceFunctions(),
            extras: [{ key: 65535, value: "----" }],
            // Handle Extras in code. 
            // 0 Pass Value from Variable/Row
            // 1..4096 Set Variable/ Row to 0 - 4095 / 0 - FFF
        },
        {
            key: 10,
            value: "Calculation",
            functions: [
                { key: 0, value: "Add" },
                { key: 1, value: "Add with Overflow" },
                { key: 2, value: "Subtract" },
                { key: 3, value: "Subtract with Overflow" },
                { key: 4, value: "Multiply" },
                { key: 5, value: "Multiply with Overflow" },
                { key: 6, value: "Multiply 0.1" },
                { key: 7, value: "Multiply 0.1 with Overflow" },
                { key: 8, value: "Divide" },
                { key: 9, value: "Divide 0.1" },
                { key: 10, value: "Divide 0.1 with Overflow" },
                { key: 11, value: "Modulo" },
                { key: 12, value: "Bitwise AND" },
                { key: 13, value: "Bitwise OR" },
                { key: 14, value: "Bitwise XOR" },
                { key: 15, value: "Left SHIFT" },
                { key: 16, value: "Right SHIFT" },
                { key: 17, value: "Logical AND" },
                { key: 18, value: "Logical OR" },
                { key: 19, value: "Logical XOR" },
                { key: 20, value: "IF <" },
                { key: 21, value: "IF <=" },
                { key: 22, value: "IF >" },
                { key: 23, value: "IF >=" },
                { key: 24, value: "IF =" },
                { key: 25, value: "IF <>" },
                { key: 26, value: "Flipflop" },
                { key: 27, value: "Raising value does invert" },
                { key: 28, value: "Falling value does invert" },
                { key: 29, value: "Track & Hold" },
                { key: 30, value: "Sample & Hold" },
                { key: 31, value: "Pass A if B is true" },
                { key: 32, value: "Count" },
                { key: 33, value: "Logical Invert" },
                { key: 34, value: "Bitwise Invert" },
                { key: 35, value: "Right Shift with carry" },
                { key: 36, value: "Left Shift with carry" },
                { key: 37, value: "Increment" },
                { key: 38, value: "Decrement" },
                { key: 39, value: "MIN" },
                { key: 40, value: "MAX" },
                { key: 41, value: "Average" },
                { key: 42, value: "Pitch To Note" },
                { key: 43, value: "Note To Pitch" },
                { key: 44, value: "Generate Random Value" },
                { key: 45, value: "Range former row between A and B" },
                { key: 46, value: "Force Value to Destination" },
                { key: 65535, value: "----" },
            ],
            extras: [{ key: 65535, value: "----" }],
            // Handle Extras in code.
            // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
            // Value definition of a operand:
            // = 0..= 9 Constant 0 to 9
            // VA..VP Variables A- P
            // 00..70 Rows 0 - 70
        },
        {
            key: 11,
            value: "Skip",
            functions: genSkipSourceFunctions(),
            extras: [{ key: 65535, value: "----" }],
            // Handle Extras in code.
            // 16 bit word is split in 2 bytes where the MSB is the first operand and the LSB is the 2nd operand
            // Value definition of a operand:
            // = 0..= 9 Constant 0 to 9
            // VA..VP Variables A- P
            // 00..70 Rows 0 - 70
        },
        {
            key: 12,
            value: "Global",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Current Main Clock Row" },
                { key: 1, value: "Sequencer Started/Stopped" },
                { key: 2, value: "Clock Input State" },
                { key: 3, value: "Clock Output State" },
                { key: 4, value: "Reset Input State" },
                { key: 5, value: "Reset Output State" },
                { key: 6, value: "Random Value" },
                { key: 7, value: "Clock Tempo/BPM" },
                { key: 8, value: "Sequencer Value" },
                { key: 9, value: "Create Pulse from Command" },
            ],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 13,
            value: "External",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Keyboard Numpad" },
                { key: 1, value: "Sega Gamepad" },
            ],
            extras: [{ key: 65535, value: "----" }],
            // Handle Extras in code. Different Extras for each of 0, 1
            // Use KeyboardSourceExtras and GamepadSourceExtras
        },
        {
            key: 14,
            value: "Control",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "External X Mapping Rows" },
            ],
            extras: genControlSourceExtras(),
        },
    ],
    destinationTypes: [
        {
            key: 65535,
            value: "----",
            functions: [{ key: 65535, value: "----" }],
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 0,
            value: "CV",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Pitch" },
                { key: 1, value: "Note" },
            ],
            extras: genCVDestinationExtras(),
        },
        {
            key: 1,
            value: "Trigger",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Gate" },
                { key: 1, value: "Trigger" },
                { key: 2, value: "Trigger Value" },
                { key: 3, value: "Trigger Always" },
                { key: 4, value: "Trigger Value Always" },
            ],
            extras: genTriggerDestinationExtras(),
        },
        {
            key: 2,
            value: "Track",
            functions: genTrackDestinationFunctions(),
            extras: [{ key: 65535, value: "----" }],
        },
        {
            key: 3,
            value: "Automator",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Selected Automator Slot 0" },
                { key: 1, value: "Selected Automator Slot 1" },
                { key: 2, value: "Selected Automator Slot 2" },
                { key: 3, value: "Selected Automator Slot 3" },
                { key: 4, value: "Selected Automator Slot 4" },
                { key: 5, value: "Selected Automator Slot 5" },
                { key: 6, value: "Selected Automator Slot 6" },
                { key: 7, value: "Selected Automator Slot 7" },
            ],
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "LFO Start" },
                { key: 1, value: "LFO Reset" },
                { key: 2, value: "LFO Speed" },
                { key: 3, value: "LFO Offset" },
                { key: 4, value: "LFO Invert" },
                { key: 5, value: "LFO Clock Source" },
                { key: 6, value: "LFO Amplitude" },
                { key: 7, value: "LFO Waveform" },
                { key: 8, value: "LFO Bit Rate" },
                { key: 9, value: "LFO Phase" },
            ],
        },
        {
            key: 4,
            value: "Envelope",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Envelope 1" },
                { key: 1, value: "Envelope 2" },
                { key: 2, value: "Envelope 3" },
                { key: 3, value: "Envelope 4" },
                { key: 4, value: "Envelope 5" },
                { key: 5, value: "Envelope 6" },
                { key: 6, value: "Envelope 7" },
                { key: 7, value: "Envelope 8" },
            ],
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Attack" },
                { key: 1, value: "Attack Peak" },
                { key: 2, value: "Decay" },
                { key: 3, value: "Sustain" },
                { key: 4, value: "Release" },
                { key: 5, value: "Offset" },
                { key: 6, value: "Gate" },
                { key: 7, value: "Fire" },
                { key: 8, value: "Toggle" },
            ],
        },
        {
            key: 5,
            value: "MIDI CC",
            functions: genMidiDeviceChannelDestinationFunctions(),
            extras: genMidiControllerExtras(),
            // Handle in code
            // 128 - 10127 Midi NRPN Controller 0-9999
        },
        {
            key: 6,
            value: "MIDI NRPN",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "I2CA SET.CV Slew" },
                { key: 1, value: "I2CA SET.CV NoSlew" },
                { key: 2, value: "I2CA SET.CV NoSlew X" },
                { key: 3, value: "I2CA SET.TR" },
                { key: 4, value: "I2CA SET.CV Slew" },
                { key: 5, value: "I2CA SET.CV NoSlew" },
                { key: 6, value: "I2CA SET.CV NoSlew X" },
                { key: 7, value: "I2CA SET.TR" },
            ],
            extras: genI2cPortExtras(),
        },
        {
            key: 7,
            value: "Audio",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Audio Part/Channel/Operator 1" },
                { key: 1, value: "Audio Part/Channel/Operator 2" },
                { key: 2, value: "Audio Part/Channel/Operator 3" },
                { key: 3, value: "Audio Part/Channel/Operator 4" },
            ],
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Pitch" },
                { key: 1, value: "Note" },
                { key: 2, value: "Gate" },
                { key: 3, value: "Start/Stop Wave" },
                { key: 4, value: "Sample/Waveform" },
                { key: 5, value: "Offset" },
                { key: 6, value: "Backwards" },
                { key: 7, value: "Delay Type" },
                { key: 8, value: "Delay Time" },
                { key: 9, value: "Delay Send" },
                { key: 10, value: "Delay Feedback" },
                { key: 11, value: "FM Boost" },
                { key: 12, value: "Volume" },
                { key: 13, value: "Glide" },
                { key: 14, value: "Mute" },
                { key: 15, value: "Clone Notes" },
                { key: 16, value: "Note Coarse" },
                { key: 17, value: "Fine Coarse" },
                { key: 18, value: "Modulation Source" },
                { key: 19, value: "PWM" },
                { key: 20, value: "Wave Folder" },
                { key: 21, value: "Bit Crusher" },
                { key: 22, value: "Distortion" },
            ],
        },
        {
            key: 8,
            value: "Variable",
            functions: genVariableDestinationFunctions(),
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Set Variable/Row" },
                { key: 1, value: "Reset Variable/Row if Source == true" },
            ],
        },
        {
            key: 9,
            value: "Random Range",
            functions: genRandomRangeDestinationFunctions(),
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Minimum Range" },
                { key: 1, value: "Maximum Range" },
            ],
        },
        {
            key: 10,
            value: "Global",
            functions: [
                { key: 65535, value: "----" },
                { key: 0, value: "Transpose" },
                { key: 1, value: "Swing" },
                { key: 2, value: "Tempo/BPM" },
                { key: 3, value: "Master Clock Steps" },
                { key: 4, value: "Scale" },
                { key: 5, value: "Scale Keynote" },
                { key: 6, value: "Resync All Tracks" },
                { key: 7, value: "Reset Player" },
                { key: 8, value: "Row as Midi Record Source" },
                { key: 9, value: "Buttons" },
                { key: 10, value: "Screens" },
                { key: 11, value: "Modes" },
            ],
            extras: [{ key: 65535, value: "----" }],
            // Handle Extras in code. Different Extras for each of 9, 10, 11
            // Use GlobalButtonsDestinationExtras, GlobalScreensDestinationExtras, and GlobalModesDestinationExtras
        },
        {
            key: 11,
            value: "CV16",
            functions: genCV16DestinationFunctions(),
            extras: genCV16DestinationExtras(),
        },
        {
            key: 12,
            value: "Table",
            functions: genTableDestinationFunctions(),
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Speed" },
                { key: 1, value: "Type" },
                { key: 2, value: "Quantize" },
                { key: 3, value: "Set Chord" },
                { key: 4, value: "Range Low" },
                { key: 5, value: "Range High" },
                { key: 6, value: "Set Preset" },
                { key: 7, value: "Add Tick" },
            ],
        },
        {
            key: 13,
            value: "MIDI Note",
            functions: genMidiDeviceChannelDestinationFunctions(false),
            extras: [
                { key: 65535, value: "----" },
                { key: 0, value: "Note On" },
                { key: 1, value: "Note Off" },
                { key: 2, value: "Note OnOff" },
                { key: 3, value: "Pitch Bend" },
            ],
        },
    ],
};
export var keyboardSourceExtras = [
    { key: 65535, value: "----" },
    { key: 0, value: "Keyboard Numpad 0" },
    { key: 1, value: "Keyboard Numpad 1" },
    { key: 2, value: "Keyboard Numpad 2" },
    { key: 3, value: "Keyboard Numpad 3" },
    { key: 4, value: "Keyboard Numpad 4" },
    { key: 5, value: "Keyboard Numpad 5" },
    { key: 6, value: "Keyboard Numpad 6" },
    { key: 7, value: "Keyboard Numpad 7" },
    { key: 8, value: "Keyboard Numpad 8" },
    { key: 9, value: "Keyboard Numpad 9" },
    { key: 10, value: "Keyboard Numpad ." },
];
export var segaGamepadSourceExtras = [
    { key: 65535, value: "----" },
    { key: 0, value: "Sega Gamepad: A" },
    { key: 1, value: "Sega Gamepad: B" },
    { key: 2, value: "Sega Gamepad: C" },
    { key: 3, value: "Sega Gamepad: X" },
    { key: 4, value: "Sega Gamepad: Y" },
    { key: 5, value: "Sega Gamepad: Z" },
    { key: 6, value: "Sega Gamepad: Start" },
    { key: 7, value: "Sega Gamepad: Mode" },
    { key: 8, value: "Sega Gamepad: Up" },
    { key: 9, value: "Sega Gamepad: Down" },
    { key: 10, value: "Sega Gamepad: Left" },
    { key: 11, value: "Sega Gamepad: Right" },
];
export var globalButtonsDestinationExtras = [
    { key: 65535, value: "----" },
    { key: 0, value: "Sequencer/Mark" },
    { key: 1, value: "Pattern/Copy" },
    { key: 2, value: "Patch/Delete" },
    { key: 3, value: "Table/Record" },
    { key: 4, value: "Automate/Nerd" },
    { key: 5, value: "Project/Setup" },
    { key: 6, value: "Start" },
    { key: 7, value: "Stop" },
    { key: 8, value: "Shift" },
    { key: 9, value: "OK" },
    { key: 10, value: "Down" },
    { key: 11, value: "Up" },
    { key: 12, value: "Cursor Up" },
    { key: 13, value: "Cursor Down" },
    { key: 14, value: "Cursor Left" },
    { key: 15, value: "Cursor Right" },
];
export var globalScreensDestinationExtras = [
    { key: 65535, value: "----" },
    { key: 0, value: "Sequencer Screen" },
    { key: 1, value: "Pattern Screen" },
    { key: 2, value: "Patch Screen" },
    { key: 3, value: "Table Screen" },
    { key: 4, value: "Current Values Screen" },
    { key: 5, value: "Automator Screen" },
    { key: 6, value: "Envelope Screen" },
    { key: 7, value: "Track Setup Screen" },
    { key: 8, value: "Random FX Screen" },
    { key: 9, value: "Mappings Screen" },
    { key: 10, value: "Variable Screen" },
    { key: 11, value: "Scaling Screen" },
    { key: 12, value: "Nerd Menu" },
    { key: 13, value: "Project Screen" },
    { key: 14, value: "Setup Screen" },
    { key: 15, value: "Sample Select Screen" },
    { key: 16, value: "Record Setup Screen" },
    { key: 17, value: "Midi/I2C Setup Screen" },
    { key: 18, value: "Screen Saver" },
    { key: 19, value: "Track Assign Screen" },
    { key: 20, value: "Load Project" },
    { key: 21, value: "Save Project" },
];
export var globalModesDestinationExtras = [
    { key: 65535, value: "----" },
    { key: 0, value: "Edit Mode" },
    { key: 1, value: "Record Mode" },
];
var MAPPING_COUNT = 70;
function decodeByteExtras(arg) {
    if (arg === 255) {
        return "----";
    }
    if (arg >= 0 && arg <= 9) {
        return "Constant ".concat(arg);
    }
    if (arg >= 10 && arg <= 25) {
        return "Variable ".concat(String.fromCharCode(55 + arg));
    }
    if (arg >= 26 && arg <= 75) {
        return "Row ".concat(arg - 26);
    }
    if (arg > 75) {
        return "Unexpected Value";
    }
}
//# sourceMappingURL=dataModel.js.map