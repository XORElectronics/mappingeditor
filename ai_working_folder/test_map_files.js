const fs = require('fs');
const path = require('path');

// Test all .map files in examples folder
const workingMapsDir = path.join(__dirname, '../examples');
const files = fs.readdirSync(workingMapsDir).filter(file => file.endsWith('.MAP'));

console.log(`Testing ${files.length} .map files...`);

files.forEach(file => {
  console.log(`\n=== Testing ${file} ===`);
  const filePath = path.join(workingMapsDir, file);
  const buffer = fs.readFileSync(filePath);
  
  // Check file size
  console.log(`File size: ${buffer.length} bytes`);
  
  // Check header
  const header = buffer.toString('ascii', 0, 15);
  console.log(`Header: "${header}"`);
  
  // Read version
  const versionMajor = buffer.readUInt16LE(16);
  const versionMinor = buffer.readUInt16LE(18);
  console.log(`Version: ${versionMajor}.${versionMinor}`);
  
  // Read filename
  const filename = buffer.toString('ascii', 20, 32).replace(/\0/g, '');
  console.log(`Filename: "${filename}"`);
  
  // Parse mapping rows (starting at offset 70)
  for (let row = 0; row < 70; row++) {
    const offset = 70 + (row * 20); // 10 words * 2 bytes per word
    
    const sourceType = buffer.readUInt16LE(offset);
    const sourceFunction = buffer.readUInt16LE(offset + 2);
    const sourceExtra = buffer.readUInt16LE(offset + 4);
    const destType = buffer.readUInt16LE(offset + 6);
    const destFunction = buffer.readUInt16LE(offset + 8);
    const destExtra = buffer.readUInt16LE(offset + 10);
    
    // Only check non-empty rows
    if (sourceType !== 65535) {
      console.log(`Row ${row}: SRC=${sourceType}:${sourceFunction}:${sourceExtra} DST=${destType}:${destFunction}:${destExtra}`);
      
      // Check for specific problematic combinations
      if (sourceType === 11 && sourceFunction > 5) {
        console.log(`  ⚠️  SKIP source function ${sourceFunction} > 5 (max allowed)`);
      }
      if (sourceType > 14) {
        console.log(`  ⚠️  Unknown source type ${sourceType}`);
      }
      if (destType > 16) {
        console.log(`  ⚠️  Unknown destination type ${destType}`);
      }
    }
  }
});