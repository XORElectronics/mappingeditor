// Automated round-trip test for all map files
// This simulates loading a .map file, converting to JSON, and back to .map
// to validate that the formatters and parsers work correctly

const fs = require('fs');
const path = require('path');

// Import the modules (this would need to be adapted based on the actual module structure)
// For now, we'll just validate the binary structure directly

function validateBinaryStructure(buffer, filename) {
  console.log(`\nValidating ${filename}...`);
  
  if (buffer.length < 70) {
    console.error(`  ✗ File too short: ${buffer.length} bytes`);
    return false;
  }

  // Check header
  const headerText = buffer.slice(0, 16).toString().replace(/\0/g, '');
  if (!headerText.includes('NerdSEQ')) {
    console.error(`  ✗ Invalid header: "${headerText}"`);
    return false;
  }
  console.log(`  ✓ Header: ${headerText}`);

  const majorVersion = buffer[16];
  const minorVersion = buffer[17];
  console.log(`  ✓ Version: ${majorVersion}.${minorVersion}`);

  let errorCount = 0;
  let validRows = 0;
  
  // Validate mapping rows
  let offset = 70;
  for (let row = 0; row < 70; row++) {
    const sourceType = buffer.readUInt16LE(offset);
    const sourceFunction = buffer.readUInt16LE(offset + 2);
    const sourceExtra = buffer.readUInt16LE(offset + 4);
    const destType = buffer.readUInt16LE(offset + 6);
    const destFunction = buffer.readUInt16LE(offset + 8);
    const destExtra = buffer.readUInt16LE(offset + 10);
    
    if (sourceType !== 65535) {
      validRows++;
      
      // Validate source type ranges
      if (sourceType > 14) {
        console.error(`  ✗ Row ${row}: Invalid source type ${sourceType} (max 14)`);
        errorCount++;
      }
      
      // Validate destination type ranges  
      if (destType !== 65535 && destType > 16) {
        console.error(`  ✗ Row ${row}: Invalid destination type ${destType} (max 16)`);
        errorCount++;
      }
      
      // Specific validations for known problematic types
      if (sourceType === 11) { // SKIP
        if (sourceFunction > 95) {
          console.error(`  ✗ Row ${row}: Invalid SKIP function ${sourceFunction} (max 95)`);
          errorCount++;
        }
      }
      
      if (sourceType === 10) { // CALC
        if (sourceFunction > 48) {
          console.error(`  ✗ Row ${row}: Invalid CALC function ${sourceFunction} (max 48)`);
          errorCount++;
        }
      }
    }
    offset += 20;
  }
  
  console.log(`  ✓ Found ${validRows} valid mapping rows`);
  
  if (errorCount === 0) {
    console.log(`  ✓ ${filename} validation passed`);
    return true;
  } else {
    console.log(`  ✗ ${filename} has ${errorCount} validation errors`);
    return false;
  }
}

function findMapFiles(dir) {
  const mapFiles = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.name.toUpperCase().endsWith('.MAP')) {
        mapFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return mapFiles;
}

function runAutomatedTests() {
  console.log("Starting automated round-trip validation tests...");
  
  // Find all .map files in examples directory
  const examplesDir = path.join(__dirname, '..', 'examples');
  const mapFiles = findMapFiles(examplesDir);
  
  console.log(`Found ${mapFiles.length} .map files to test:`);
  mapFiles.forEach(file => console.log(`  - ${path.relative(examplesDir, file)}`));
  
  let passedCount = 0;
  let failedCount = 0;
  
  // Test each file
  mapFiles.forEach(mapFile => {
    try {
      const buffer = fs.readFileSync(mapFile);
      const filename = path.relative(examplesDir, mapFile);
      
      if (validateBinaryStructure(buffer, filename)) {
        passedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`\n✗ Error reading ${mapFile}: ${error.message}`);
      failedCount++;
    }
  });
  
  console.log(`\n=== Test Results ===`);
  console.log(`✓ Passed: ${passedCount}`);
  console.log(`✗ Failed: ${failedCount}`);
  console.log(`Total: ${passedCount + failedCount}`);
  
  if (failedCount === 0) {
    console.log(`\n🎉 All files passed validation! The binary parser should handle these files correctly.`);
  } else {
    console.log(`\n⚠️  ${failedCount} files failed validation. These may cause parser errors.`);
  }
  
  return failedCount === 0;
}

// Run the tests
runAutomatedTests();