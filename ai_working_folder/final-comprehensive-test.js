// Final comprehensive test - generates a complete test file with all valid combinations
// This tests every source type, destination type, and their valid function/extra ranges

const fs = require('fs');

function createBinaryMapping(mappingRows) {
  const buffer = Buffer.alloc(2048);
  
  // Header
  buffer.write("NerdSEQ Mapping ", 0, 16);
  buffer.writeUInt8(3, 16);  // Major version
  buffer.writeUInt8(0, 17);  // Minor version  
  buffer.write("FINAL       ", 18, 12); // Filename padded to 12 chars
  
  // Fill remaining header bytes (30-69) with 0xFF
  for (let i = 30; i < 70; i++) {
    buffer.writeUInt8(0xFF, i);
  }
  
  // Write mapping rows (70 rows * 20 bytes each = 1400 bytes)
  let offset = 70;
  for (let row = 0; row < 70; row++) {
    if (row < mappingRows.length) {
      const mapping = mappingRows[row];
      buffer.writeUInt16LE(mapping.sourceType, offset);
      buffer.writeUInt16LE(mapping.sourceFunction, offset + 2);
      buffer.writeUInt16LE(mapping.sourceExtra, offset + 4);
      buffer.writeUInt16LE(mapping.destType, offset + 6);
      buffer.writeUInt16LE(mapping.destFunction, offset + 8);
      buffer.writeUInt16LE(mapping.destExtra, offset + 10);
      // Fill remaining 8 bytes with 0xFFFF
      for (let i = 12; i < 20; i += 2) {
        buffer.writeUInt16LE(0xFFFF, offset + i);
      }
    } else {
      // Fill empty rows with 0xFFFF
      for (let i = 0; i < 20; i += 2) {
        buffer.writeUInt16LE(0xFFFF, offset + i);
      }
    }
    offset += 20;
  }
  
  // Variables (16 * 2 bytes = 32 bytes)
  for (let i = 0; i < 16; i++) {
    buffer.writeUInt16LE(0x0000, offset + i * 2);
  }
  offset += 32;
  
  // Pad to 2048 bytes with 0xFF
  for (let i = offset; i < 2048; i++) {
    buffer.writeUInt8(0xFF, i);
  }
  
  return buffer;
}

// Comprehensive valid combinations based on mapping_file_definition.txt
const validCombinations = [
  // CV source (0) - functions 0-15, no extras -> CV dest (0) - functions 0-1, extras 0-75
  { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0, name: "CV->CV" },
  
  // TRIG source (1) - functions 0-5, no extras -> TRIG dest (1) - functions 0-4, extras 0-69
  { sourceType: 1, sourceFunction: 0, sourceExtra: 65535, destType: 1, destFunction: 0, destExtra: 0, name: "TRIG->TRIG" },
  
  // TRCK source (2) - functions 0-7, extras 0-19 -> TRCK dest (2) - functions 0-94, extras 0-183
  { sourceType: 2, sourceFunction: 0, sourceExtra: 0, destType: 2, destFunction: 0, destExtra: 0, name: "TRCK->TRCK" },
  
  // AUTM source (3) - functions 0-7, no extras -> AUTM dest (3) - functions 0-94, extras 0-9
  { sourceType: 3, sourceFunction: 0, sourceExtra: 65535, destType: 3, destFunction: 0, destExtra: 0, name: "AUTM->AUTM" },
  
  // ENV source (4) - functions 0-7, no extras -> ENV dest (4) - functions 0-94, extras 0-8
  { sourceType: 4, sourceFunction: 0, sourceExtra: 65535, destType: 4, destFunction: 0, destExtra: 0, name: "ENV->ENV" },
  
  // MIDI source (5) - functions 0-48, extras 0-365 -> MCON dest (5) - functions 0-47, extras 0-10127
  { sourceType: 5, sourceFunction: 0, sourceExtra: 0, destType: 5, destFunction: 0, destExtra: 0, name: "MIDI->MCON" },
  
  // MCC source (6) - functions 0-48, extras 0-127
  { sourceType: 6, sourceFunction: 0, sourceExtra: 0, destType: 5, destFunction: 0, destExtra: 1, name: "MCC->MCON" },
  
  // NRPN source (7) - functions 0-48, extras 0-9999
  { sourceType: 7, sourceFunction: 0, sourceExtra: 0, destType: 5, destFunction: 0, destExtra: 128, name: "NRPN->MCON" },
  
  // I2C source (8) - functions 0-1, extras 0-127 -> I2C dest (6) - functions 0-7, extras 0-127
  { sourceType: 8, sourceFunction: 0, sourceExtra: 0, destType: 6, destFunction: 0, destExtra: 0, name: "I2C->I2C" },
  
  // VAR source (9) - functions 0-86, extras 0-4096 -> SETV dest (8) - functions 0-85, extras 0-1
  { sourceType: 9, sourceFunction: 0, sourceExtra: 0, destType: 8, destFunction: 0, destExtra: 0, name: "VAR->SETV" },
  
  // CALC source (10) - functions 0-48, complex extras
  { sourceType: 10, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 1, name: "CALC->CV" },
  
  // SKIP source (11) - functions 0-95 (16 skip counts * 6 conditions)
  { sourceType: 11, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 2, name: "SKIP->CV" },
  { sourceType: 11, sourceFunction: 6, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 3, name: "SKIP(2,<)->CV" },
  { sourceType: 11, sourceFunction: 95, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 4, name: "SKIP(16,<>)->CV" },
  
  // GLOB source (12) - functions 0-10, no extras -> GLOB dest (10) - functions 0-10
  { sourceType: 12, sourceFunction: 0, sourceExtra: 65535, destType: 10, destFunction: 0, destExtra: 65535, name: "GLOB->GLOB" },
  
  // EXT source (13) - functions 0-2, complex extras
  { sourceType: 13, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 5, name: "EXT->CV" },
  
  // CTRL source (14) - functions 0-2, extras 0-69
  { sourceType: 14, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 6, name: "CTRL->CV" },
  
  // Test destination types
  // AUDI dest (7) - functions 0-3, extras 0-22
  { sourceType: 0, sourceFunction: 1, sourceExtra: 65535, destType: 7, destFunction: 0, destExtra: 0, name: "CV->AUDI" },
  
  // RNDM dest (9) - functions 0-15, extras 0-1
  { sourceType: 0, sourceFunction: 2, sourceExtra: 65535, destType: 9, destFunction: 0, destExtra: 0, name: "CV->RNDM" },
  
  // Test edge cases and maximum values
  { sourceType: 0, sourceFunction: 15, sourceExtra: 65535, destType: 0, destFunction: 1, destExtra: 75, name: "CV(max)->CV(max)" },
  { sourceType: 1, sourceFunction: 5, sourceExtra: 65535, destType: 1, destFunction: 4, destExtra: 69, name: "TRIG(max)->TRIG(max)" },
  { sourceType: 2, sourceFunction: 7, sourceExtra: 19, destType: 2, destFunction: 94, destExtra: 183, name: "TRCK(max)->TRCK(max)" },
  { sourceType: 3, sourceFunction: 7, sourceExtra: 65535, destType: 3, destFunction: 94, destExtra: 9, name: "AUTM(max)->AUTM(max)" },
  { sourceType: 4, sourceFunction: 7, sourceExtra: 65535, destType: 4, destFunction: 94, destExtra: 8, name: "ENV(max)->ENV(max)" },
  { sourceType: 5, sourceFunction: 48, sourceExtra: 365, destType: 5, destFunction: 47, destExtra: 10127, name: "MIDI(max)->MCON(max)" },
  { sourceType: 6, sourceFunction: 48, sourceExtra: 127, destType: 6, destFunction: 7, destExtra: 127, name: "MCC(max)->I2C(max)" },
  { sourceType: 7, sourceFunction: 48, sourceExtra: 9999, destType: 7, destFunction: 3, destExtra: 22, name: "NRPN(max)->AUDI(max)" },
  { sourceType: 8, sourceFunction: 1, sourceExtra: 127, destType: 8, destFunction: 85, destExtra: 1, name: "I2C(max)->SETV(max)" },
  { sourceType: 9, sourceFunction: 86, sourceExtra: 4096, destType: 9, destFunction: 15, destExtra: 1, name: "VAR(max)->RNDM(max)" },
  { sourceType: 10, sourceFunction: 48, sourceExtra: 65535, destType: 10, destFunction: 10, destExtra: 65535, name: "CALC(max)->GLOB(max)" },
  { sourceType: 12, sourceFunction: 10, sourceExtra: 65535, destType: 0, destFunction: 1, destExtra: 0, name: "GLOB(max)->CV" },
  { sourceType: 13, sourceFunction: 2, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0, name: "EXT(max)->CV" },
  { sourceType: 14, sourceFunction: 2, sourceExtra: 69, destType: 0, destFunction: 0, destExtra: 0, name: "CTRL(max)->CV" },
];

function generateFinalTest() {
  console.log("Generating final comprehensive test file...");
  console.log(`Testing ${validCombinations.length} valid combinations:`);
  
  validCombinations.forEach((combo, index) => {
    console.log(`  ${index + 1}: ${combo.name}`);
  });
  
  // Create binary file
  const buffer = createBinaryMapping(validCombinations);
  fs.writeFileSync('../examples/final_comprehensive_test.map', buffer);
  
  console.log(`\nCreated final_comprehensive_test.map with ${validCombinations.length} valid combinations`);
  console.log("This file should load without any parser errors!");
  
  // Also create a JSON version for comparison
  const jsonData = {
    mappings: validCombinations.map((combo, index) => ({
      index: index,
      source: {
        type: combo.sourceType,
        function: combo.sourceFunction,
        extra: combo.sourceExtra
      },
      destination: {
        type: combo.destType,
        function: combo.destFunction,
        extra: combo.destExtra
      },
      name: combo.name
    }))
  };
  
  fs.writeFileSync('../examples/final_comprehensive_test.json', JSON.stringify(jsonData, null, 2));
  console.log("Also created final_comprehensive_test.json for reference");
}

generateFinalTest();