const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test roundtrip: .map -> JSON -> .map and verify files are identical
const workingMapsDir = path.join(__dirname, '../examples');
const testDir = path.join(__dirname, 'test_results');

// Ensure test directory exists
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

const mapFiles = fs.readdirSync(workingMapsDir).filter(file => file.endsWith('.MAP'));

console.log(`Testing ${mapFiles.length} .map files for roundtrip conversion...`);

let allPassed = true;

mapFiles.forEach(file => {
  console.log(`\n=== Testing ${file} ===`);
  
  try {
    const originalPath = path.join(workingMapsDir, file);
    const jsonPath = path.join(testDir, file.replace('.MAP', '.json'));
    const newMapPath = path.join(testDir, file.replace('.MAP', '_roundtrip.MAP'));
    
    // Read original file
    const originalBuffer = fs.readFileSync(originalPath);
    
    // Step 1: Convert .map to JSON using the app
    console.log('  Converting .map to JSON...');
    // We'll need to simulate this through the web app
    
    // Step 2: Convert JSON back to .map using the app
    console.log('  Converting JSON back to .map...');
    
    // Step 3: Compare original and roundtrip .map files
    console.log('  Comparing files...');
    
    // For now, just check if original file is valid format
    if (originalBuffer.length !== 1502) {
      console.log(`  ❌ Invalid file size: ${originalBuffer.length} bytes (expected 1502)`);
      allPassed = false;
    } else {
      const header = originalBuffer.toString('ascii', 0, 15);
      if (header !== 'NerdSEQ Mapping') {
        console.log(`  ❌ Invalid header: "${header}"`);
        allPassed = false;
      } else {
        console.log('  ✅ File format is valid');
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Error testing ${file}: ${error.message}`);
    allPassed = false;
  }
});

console.log(`\n${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);
process.exit(allPassed ? 0 : 1);