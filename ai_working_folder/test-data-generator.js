/**
 * Test Data Generator for NerdSEQ Mapping Editor
 * Generates valid test files for both JSON and binary .map formats
 */

// Import the mapping definitions
const fs = require('fs');
const path = require('path');

// Load the mapping definitions from the editor
const editorPath = path.join(__dirname, '..', 'editor');

// Define the mapping structure based on mapping_file_definition.txt
const EMPTY_VALUE = 65535;

const sourceTypes = {
    0: 'EMPTY',
    1: 'NOTE',
    2: 'VELOCITY', 
    3: 'AFTERTOUCH',
    4: 'CC',
    5: 'PITCHBEND',
    6: 'PROGRAM',
    7: 'CLOCK',
    8: 'TRANSPORT',
    9: 'MODWHEEL',
    10: 'BREATH',
    11: 'FOOT',
    12: 'PORTAMENTO_TIME',
    13: 'DATA_ENTRY',
    14: 'VOLUME',
    15: 'BALANCE',
    16: 'PAN',
    17: 'EXPRESSION',
    18: 'EFFECT_CONTROL_1',
    19: 'EFFECT_CONTROL_2',
    20: 'GENERAL_PURPOSE_1',
    21: 'GENERAL_PURPOSE_2',
    22: 'GENERAL_PURPOSE_3',
    23: 'GENERAL_PURPOSE_4',
    24: 'SUSTAIN',
    25: 'PORTAMENTO',
    26: 'SOSTENUTO',
    27: 'SOFT_PEDAL',
    28: 'LEGATO',
    29: 'HOLD_2',
    30: 'SOUND_VARIATION',
    31: 'SOUND_TIMBRE',
    32: 'SOUND_RELEASE_TIME',
    33: 'SOUND_ATTACK_TIME',
    34: 'SOUND_BRIGHTNESS',
    35: 'SOUND_CONTROL_6',
    36: 'SOUND_CONTROL_7',
    37: 'SOUND_CONTROL_8',
    38: 'SOUND_CONTROL_9',
    39: 'SOUND_CONTROL_10',
    40: 'GENERAL_PURPOSE_5',
    41: 'GENERAL_PURPOSE_6',
    42: 'GENERAL_PURPOSE_7',
    43: 'GENERAL_PURPOSE_8',
    44: 'PORTAMENTO_CONTROL',
    45: 'HIGH_RESOLUTION_VELOCITY_PREFIX',
    46: 'EFFECTS_1_DEPTH',
    47: 'EFFECTS_2_DEPTH',
    48: 'EFFECTS_3_DEPTH',
    49: 'EFFECTS_4_DEPTH',
    50: 'EFFECTS_5_DEPTH',
    51: 'DATA_BUTTON_INCREMENT',
    52: 'DATA_BUTTON_DECREMENT',
    53: 'NON_REGISTERED_PARAMETER_NUMBER_LSB',
    54: 'NON_REGISTERED_PARAMETER_NUMBER_MSB',
    55: 'REGISTERED_PARAMETER_NUMBER_LSB',
    56: 'REGISTERED_PARAMETER_NUMBER_MSB',
    57: 'ALL_SOUND_OFF',
    58: 'ALL_CONTROLLERS_OFF',
    59: 'LOCAL_KEYBOARD',
    60: 'ALL_NOTES_OFF',
    61: 'OMNI_MODE_OFF',
    62: 'OMNI_MODE_ON',
    63: 'MONO_OPERATION',
    64: 'POLY_OPERATION'
};

const destinationTypes = {
    0: 'EMPTY',
    1: 'CV1',
    2: 'CV2',
    3: 'CV3',
    4: 'CV4',
    5: 'CV5',
    6: 'CV6',
    7: 'CV7',
    8: 'CV8',
    9: 'GATE1',
    10: 'GATE2',
    11: 'GATE3',
    12: 'GATE4',
    13: 'GATE5',
    14: 'GATE6',
    15: 'GATE7',
    16: 'GATE8'
};

const extras = {
    0: 'EMPTY',
    1: 'INVERT',
    2: 'QUANTIZE',
    3: 'SLEW',
    4: 'RANGE',
    5: 'OFFSET',
    6: 'SCALE',
    7: 'CURVE',
    8: 'MIDI_CHANNEL',
    9: 'VELOCITY_CURVE',
    10: 'NOTE_PRIORITY',
    11: 'TRIGGER_MODE',
    12: 'GATE_LENGTH'
};

function generateMinimalTest() {
    return {
        mappings: [
            {
                sourceType: 1, // NOTE
                sourceFunction: 0, // C
                sourceExtra: 0, // EMPTY
                sourceValue: EMPTY_VALUE,
                destinationType: 1, // CV1
                destinationFunction: 0,
                destinationExtra: 0, // EMPTY
                destinationValue: EMPTY_VALUE
            },
            {
                sourceType: 2, // VELOCITY
                sourceFunction: 0,
                sourceExtra: 0, // EMPTY
                sourceValue: EMPTY_VALUE,
                destinationType: 9, // GATE1
                destinationFunction: 0,
                destinationExtra: 0, // EMPTY
                destinationValue: EMPTY_VALUE
            },
            {
                sourceType: 4, // CC
                sourceFunction: 1, // CC1
                sourceExtra: 8, // MIDI_CHANNEL
                sourceValue: 1, // Channel 1
                destinationType: 2, // CV2
                destinationFunction: 0,
                destinationExtra: 4, // RANGE
                destinationValue: 100 // Range value
            }
        ]
    };
}

function generateComprehensiveTest() {
    const mappings = [];
    let sourceTypeIndex = 0;
    let destTypeIndex = 0;
    let extraIndex = 0;
    
    const sourceTypeKeys = Object.keys(sourceTypes).map(k => parseInt(k));
    const destTypeKeys = Object.keys(destinationTypes).map(k => parseInt(k));
    const extraKeys = Object.keys(extras).map(k => parseInt(k));
    
    for (let i = 0; i < 70; i++) {
        const sourceType = sourceTypeKeys[sourceTypeIndex % sourceTypeKeys.length];
        const destType = destTypeKeys[destTypeIndex % destTypeKeys.length];
        const sourceExtraType = extraKeys[extraIndex % extraKeys.length];
        const destExtraType = extraKeys[(extraIndex + 1) % extraKeys.length];
        
        // Generate appropriate values based on type
        let sourceFunction = 0;
        let sourceValue = EMPTY_VALUE;
        let destValue = EMPTY_VALUE;
        
        // Set source function based on source type
        if (sourceType === 1) { // NOTE
            sourceFunction = i % 12; // Note C to B
        } else if (sourceType === 4) { // CC
            sourceFunction = (i % 127) + 1; // CC 1-127
        } else if (sourceType >= 9 && sourceType <= 64) { // Various CC types
            sourceFunction = 0; // Most don't need specific functions
        }
        
        // Set values for extras that need them
        if (sourceExtraType === 8) { // MIDI_CHANNEL
            sourceValue = (i % 16) + 1; // Channel 1-16
        } else if (sourceExtraType === 4 || sourceExtraType === 5 || sourceExtraType === 6) { // RANGE, OFFSET, SCALE
            sourceValue = (i % 100) + 1; // Value 1-100
        } else if (sourceExtraType === 3) { // SLEW
            sourceValue = (i % 10) + 1; // Slew 1-10
        } else if (sourceExtraType === 12) { // GATE_LENGTH
            sourceValue = (i % 50) + 1; // Gate length 1-50
        }
        
        if (destExtraType === 4 || destExtraType === 5 || destExtraType === 6) { // RANGE, OFFSET, SCALE
            destValue = ((i + 10) % 100) + 1; // Value 1-100
        } else if (destExtraType === 3) { // SLEW
            destValue = ((i + 5) % 10) + 1; // Slew 1-10
        } else if (destExtraType === 12) { // GATE_LENGTH
            destValue = ((i + 20) % 50) + 1; // Gate length 1-50
        }
        
        mappings.push({
            sourceType: sourceType,
            sourceFunction: sourceFunction,
            sourceExtra: sourceExtraType,
            sourceValue: sourceValue,
            destinationType: destType,
            destinationFunction: 0,
            destinationExtra: destExtraType,
            destinationValue: destValue
        });
        
        // Cycle through different combinations
        sourceTypeIndex++;
        if (sourceTypeIndex % 3 === 0) destTypeIndex++;
        if (sourceTypeIndex % 5 === 0) extraIndex++;
    }
    
    return { mappings };
}

function writeBinaryFile(data, filename) {
    const buffer = Buffer.alloc(70 * 16); // 70 mappings * 16 bytes each
    
    for (let i = 0; i < data.mappings.length && i < 70; i++) {
        const mapping = data.mappings[i];
        const offset = i * 16;
        
        // Write as little-endian 16-bit values
        buffer.writeUInt16LE(mapping.sourceType, offset + 0);
        buffer.writeUInt16LE(mapping.sourceFunction, offset + 2);
        buffer.writeUInt16LE(mapping.sourceExtra, offset + 4);
        buffer.writeUInt16LE(mapping.sourceValue, offset + 6);
        buffer.writeUInt16LE(mapping.destinationType, offset + 8);
        buffer.writeUInt16LE(mapping.destinationFunction, offset + 10);
        buffer.writeUInt16LE(mapping.destinationExtra, offset + 12);
        buffer.writeUInt16LE(mapping.destinationValue, offset + 14);
    }
    
    // Fill remaining slots with empty values
    for (let i = data.mappings.length; i < 70; i++) {
        const offset = i * 16;
        for (let j = 0; j < 8; j++) {
            buffer.writeUInt16LE(EMPTY_VALUE, offset + j * 2);
        }
    }
    
    fs.writeFileSync(filename, buffer);
}

function generateTestFiles() {
    console.log('Generating test files...');
    
    // Generate minimal test
    const minimalData = generateMinimalTest();
    fs.writeFileSync('minimal_test.json', JSON.stringify(minimalData, null, 2));
    writeBinaryFile(minimalData, 'minimal_test.map');
    console.log('Generated minimal_test.json and minimal_test.map');
    
    // Generate comprehensive test
    const comprehensiveData = generateComprehensiveTest();
    fs.writeFileSync('comprehensive_test.json', JSON.stringify(comprehensiveData, null, 2));
    writeBinaryFile(comprehensiveData, 'comprehensive_test.map');
    console.log('Generated comprehensive_test.json and comprehensive_test.map');
    
    console.log('Test file generation complete!');
}

// Run if called directly
if (require.main === module) {
    generateTestFiles();
}

module.exports = {
    generateMinimalTest,
    generateComprehensiveTest,
    writeBinaryFile,
    generateTestFiles
};