// Test if the SKIP function fix resolves the BOUNCE1.MAP issues
const fs = require('fs');

console.log("Testing BOUNCE1.MAP with SKIP function fix...");

// Read and analyze the BOUNCE1.MAP file
const buffer = fs.readFileSync('../examples/bounce/BOUNCE1.MAP');
console.log(`File size: ${buffer.length} bytes`);

let offset = 70;
let errorCount = 0;

for (let row = 0; row < 70; row++) {
  const sourceType = buffer.readUInt16LE(offset);
  const sourceFunction = buffer.readUInt16LE(offset + 2);
  const sourceExtra = buffer.readUInt16LE(offset + 4);
  
  if (sourceType !== 65535) {
    // Check SKIP source type (11) functions
    if (sourceType === 11) {
      console.log(`Row ${row}: SKIP source function ${sourceFunction}`);
      
      // Decode the function: skip_count = floor(function / 6) + 1, condition = function % 6
      if (sourceFunction < 96) { // Valid range: 0-95 (16 skip counts * 6 conditions)
        const skipCount = Math.floor(sourceFunction / 6) + 1;
        const condition = sourceFunction % 6;
        const conditions = ['<', '<=', '>', '>=', '=', '<>'];
        console.log(`  Decoded: Skip ${skipCount} rows if condition ${conditions[condition]}`);
      } else {
        console.log(`  ERROR: Invalid SKIP function ${sourceFunction} (max 95)`);
        errorCount++;
      }
    }
  }
  offset += 20;
}

console.log(`\nValidation complete. Found ${errorCount} errors.`);

if (errorCount === 0) {
  console.log("✓ All SKIP functions are now valid with the updated encoding!");
} else {
  console.log("✗ There are still validation errors that need to be addressed.");
}