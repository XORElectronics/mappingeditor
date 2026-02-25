// Targeted validation test - tests each source/destination type individually
// This will help identify exactly which combinations are failing

const fs = require('fs');

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

// Test each source type individually with minimal valid combinations
function testSourceTypes() {
  const tests = [
    // CV source (0) - functions 0-15, no extras
    { name: "CV_source", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // TRIG source (1) - functions 0-5, no extras  
    { name: "TRIG_source", mappings: [
      { sourceType: 1, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // TRCK source (2) - functions 0-7, extras 0-19
    { name: "TRCK_source", mappings: [
      { sourceType: 2, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // AUTM source (3) - functions 0-7, no extras
    { name: "AUTM_source", mappings: [
      { sourceType: 3, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // ENV source (4) - functions 0-7, no extras
    { name: "ENV_source", mappings: [
      { sourceType: 4, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // MIDI source (5) - functions 0-48, extras 0-365
    { name: "MIDI_source", mappings: [
      { sourceType: 5, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // MCC source (6) - functions 0-48, extras 0-127
    { name: "MCC_source", mappings: [
      { sourceType: 6, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // NRPN source (7) - functions 0-48, extras 0-9999
    { name: "NRPN_source", mappings: [
      { sourceType: 7, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // I2C source (8) - functions 0-1, extras 0-127
    { name: "I2C_source", mappings: [
      { sourceType: 8, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // VAR source (9) - functions 0-86, extras 0-4096
    { name: "VAR_source", mappings: [
      { sourceType: 9, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // CALC source (10) - functions 0-48, complex extras
    { name: "CALC_source", mappings: [
      { sourceType: 10, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // SKIP source (11) - functions 0-5, complex extras  
    { name: "SKIP_source", mappings: [
      { sourceType: 11, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // GLOB source (12) - functions 0-10, no extras
    { name: "GLOB_source", mappings: [
      { sourceType: 12, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // EXT source (13) - functions 0-2, complex extras
    { name: "EXT_source", mappings: [
      { sourceType: 13, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // CTRL source (14) - functions 0-2, extras 0-69
    { name: "CTRL_source", mappings: [
      { sourceType: 14, sourceFunction: 0, sourceExtra: 0, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
  ];
  
  console.log("Creating individual source type test files...");
  
  tests.forEach(test => {
    const buffer = createBinaryMapping(test.mappings);
    const filename = `../examples/test_${test.name}.map`;
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename} - ${test.name}`);
  });
}

// Test each destination type individually
function testDestinationTypes() {
  const tests = [
    // CV dest (0) - functions 0-1, extras 0-75
    { name: "CV_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 0, destFunction: 0, destExtra: 0 }
    ]},
    
    // TRIG dest (1) - functions 0-4, extras 0-69
    { name: "TRIG_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 1, destFunction: 0, destExtra: 0 }
    ]},
    
    // TRCK dest (2) - functions 0-94, extras 0-183
    { name: "TRCK_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 2, destFunction: 0, destExtra: 0 }
    ]},
    
    // AUTM dest (3) - functions 0-94, extras 0-9
    { name: "AUTM_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 3, destFunction: 0, destExtra: 0 }
    ]},
    
    // ENV dest (4) - functions 0-94, extras 0-8
    { name: "ENV_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 4, destFunction: 0, destExtra: 0 }
    ]},
    
    // MCON dest (5) - functions 0-47, extras 0-10127
    { name: "MCON_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 5, destFunction: 0, destExtra: 0 }
    ]},
    
    // I2C dest (6) - functions 0-7, extras 0-127
    { name: "I2C_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 6, destFunction: 0, destExtra: 0 }
    ]},
    
    // AUDI dest (7) - functions 0-3, extras 0-22
    { name: "AUDI_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 7, destFunction: 0, destExtra: 0 }
    ]},
    
    // SETV dest (8) - functions 0-85, extras 0-1
    { name: "SETV_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 8, destFunction: 0, destExtra: 0 }
    ]},
    
    // RNDM dest (9) - functions 0-15, extras 0-1
    { name: "RNDM_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 9, destFunction: 0, destExtra: 0 }
    ]},
    
    // GLOB dest (10) - functions 0-10, function-dependent extras
    { name: "GLOB_dest", mappings: [
      { sourceType: 0, sourceFunction: 0, sourceExtra: 65535, destType: 10, destFunction: 0, destExtra: 65535 }
    ]},
  ];
  
  console.log("Creating individual destination type test files...");
  
  tests.forEach(test => {
    const buffer = createBinaryMapping(test.mappings);
    const filename = `../examples/test_${test.name}.map`;
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename} - ${test.name}`);
  });
}

console.log("Starting targeted validation tests...");
testSourceTypes();
testDestinationTypes();
console.log("All test files created. Test them in the editor to identify validation issues!");