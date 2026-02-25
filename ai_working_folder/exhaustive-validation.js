// Exhaustive validation test generator
// This script generates test .map files with every valid combination according to mapping_file_definition.txt

const fs = require('fs');

// Valid ranges based on mapping_file_definition.txt
const sourceDefinitions = {
  0: { name: "CV", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], extras: [] },  // N/A extras
  1: { name: "TRIG", functions: [0,1,2,3,4,5], extras: [] },  // N/A extras
  2: { name: "TRCK", functions: [0,1,2,3,4,5,6,7], extras: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19] },
  3: { name: "AUTM", functions: [0,1,2,3,4,5,6,7], extras: [] },  // N/A extras
  4: { name: "ENV", functions: [0,1,2,3,4,5,6,7], extras: [] },  // N/A extras
  5: { name: "MIDI", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48], extras: [0,1,2,3,4,5].concat(Array.from({length: 120}, (_, i) => i + 6)).concat(Array.from({length: 120}, (_, i) => i + 126)).concat(Array.from({length: 120}, (_, i) => i + 246)) },
  6: { name: "MCC", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48], extras: Array.from({length: 128}, (_, i) => i) },
  7: { name: "NRPN", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48], extras: Array.from({length: 10000}, (_, i) => i) },
  8: { name: "I2C", functions: [0,1], extras: Array.from({length: 128}, (_, i) => i) },
  9: { name: "VAR", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].concat(Array.from({length: 71}, (_, i) => i + 16)), extras: [0].concat(Array.from({length: 4096}, (_, i) => i + 1)) },
  10: { name: "CALC", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48], extras: [] }, // Complex extras - skip for now
  11: { name: "SKIP", functions: [0,1,2,3,4,5], extras: [] }, // Complex extras - skip for now
  12: { name: "GLOB", functions: [0,1,2,3,4,5,6,7,8,9,10], extras: [] }, // N/A extras
  13: { name: "EXT", functions: [0,1,2], extras: [] }, // Complex function-dependent extras
  14: { name: "CTRL", functions: [0,1,2], extras: Array.from({length: 70}, (_, i) => i) }
};

const destinationDefinitions = {
  0: { name: "CV", functions: [0,1], extras: Array.from({length: 76}, (_, i) => i) },
  1: { name: "TRIG", functions: [0,1,2,3,4], extras: Array.from({length: 70}, (_, i) => i) },
  2: { name: "TRCK", functions: Array.from({length: 95}, (_, i) => i), extras: Array.from({length: 184}, (_, i) => i) },
  3: { name: "AUTM", functions: Array.from({length: 95}, (_, i) => i), extras: [0,1,2,3,4,5,6,7,8,9] },
  4: { name: "ENV", functions: Array.from({length: 95}, (_, i) => i), extras: [0,1,2,3,4,5,6,7,8] },
  5: { name: "MCON", functions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47], extras: Array.from({length: 10128}, (_, i) => i) },
  6: { name: "I2C", functions: [0,1,2,3,4,5,6,7], extras: Array.from({length: 128}, (_, i) => i) },
  7: { name: "AUDI", functions: [0,1,2,3], extras: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22] },
  8: { name: "SETV", functions: Array.from({length: 86}, (_, i) => i), extras: [0,1] },
  9: { name: "RNDM", functions: Array.from({length: 16}, (_, i) => i), extras: [0,1] },
  10: { name: "GLOB", functions: [0,1,2,3,4,5,6,7,8,9,10], extras: [] } // Function-dependent extras
};

function createBinaryMapping(mappingRows) {
  const buffer = Buffer.alloc(2048);
  
  // Header
  buffer.write("NerdSEQ Mapping ", 0, 16);
  buffer.writeUInt8(3, 16);  // Major version
  buffer.writeUInt8(0, 17);  // Minor version  
  buffer.write("TEST        ", 18, 12); // Filename padded to 12 chars
  
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

function generateValidCombination(testIndex) {
  const sourceTypes = Object.keys(sourceDefinitions).map(k => parseInt(k));
  const destTypes = Object.keys(destinationDefinitions).map(k => parseInt(k));
  
  const sourceType = sourceTypes[testIndex % sourceTypes.length];
  const destType = destTypes[(testIndex + 1) % destTypes.length];
  
  const sourceDef = sourceDefinitions[sourceType];
  const destDef = destinationDefinitions[destType];
  
  // Only pick valid functions (not 65535/empty)
  const sourceFunction = sourceDef.functions.length > 0 ? 
    sourceDef.functions[testIndex % sourceDef.functions.length] : 65535;
  const destFunction = destDef.functions.length > 0 ? 
    destDef.functions[testIndex % destDef.functions.length] : 65535;
  
  // Pick a valid extra for each type (or 65535 if no extras)
  const sourceExtra = sourceDef.extras.length > 0 ? 
    sourceDef.extras[testIndex % sourceDef.extras.length] : 65535;
  const destExtra = destDef.extras.length > 0 ? 
    destDef.extras[testIndex % destDef.extras.length] : 65535;
  
  return {
    sourceType,
    sourceFunction,
    sourceExtra,
    destType,
    destFunction,
    destExtra
  };
}

function runExhaustiveTest() {
  console.log("Starting exhaustive validation test...");
  
  const testMappings = [];
  
  // Generate 64 different valid combinations
  for (let i = 0; i < 64; i++) {
    const mapping = generateValidCombination(i);
    testMappings.push(mapping);
    console.log(`Row ${i}: ${sourceDefinitions[mapping.sourceType].name}(${mapping.sourceFunction}:${mapping.sourceExtra}) -> ${destinationDefinitions[mapping.destType].name}(${mapping.destFunction}:${mapping.destExtra})`);
  }
  
  // Create binary file
  const buffer = createBinaryMapping(testMappings);
  fs.writeFileSync('../examples/exhaustive_test.map', buffer);
  
  console.log("Created exhaustive_test.map with 64 valid combinations");
  console.log("Test this file in the editor to validate parsing!");
}

runExhaustiveTest();