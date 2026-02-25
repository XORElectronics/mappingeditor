const fs = require('fs');
const path = require('path');

console.log('Testing application roundtrip conversion...\n');
console.log('This test will:');
console.log('1. Load each working .MAP file into the app');  
console.log('2. Save as JSON');
console.log('3. Reload the JSON');
console.log('4. Save as .MAP');
console.log('5. Compare original vs final .MAP files');
console.log('\nInstructions:');
console.log('- Open the application at http://localhost:5173/');
console.log('- Use the file upload to load each .MAP file from ../examples/');
console.log('- Save as JSON with _test.json suffix');
console.log('- Reload the JSON file');
console.log('- Save as .MAP with _roundtrip.map suffix'); 
console.log('- Run this script again to check results\n');

const workingMapsDir = path.join(__dirname, '../examples');
const testDir = path.join(__dirname, 'test_output');

// Create test output directory if it doesn't exist
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

// Get all .MAP files
const mapFiles = fs.readdirSync(workingMapsDir).filter(file => 
    file.toLowerCase().endsWith('.map'));

console.log(`Found ${mapFiles.length} .MAP files to test:`);
mapFiles.forEach(file => console.log(`  - ${file}`));

console.log('\nLooking for test results...\n');

let testResults = [];
let allPassed = true;

for (const mapFile of mapFiles) {
    const baseName = path.basename(mapFile, path.extname(mapFile));
    const originalPath = path.join(workingMapsDir, mapFile);
    const roundtripPath = path.join(testDir, `${baseName}_roundtrip.map`);
    
    console.log(`Testing ${mapFile}:`);
    
    if (!fs.existsSync(roundtripPath)) {
        console.log(`  ⏸️  SKIP: Roundtrip file not found (${baseName}_roundtrip.map)`);
        testResults.push({ file: mapFile, status: 'SKIP', reason: 'No roundtrip file' });
        continue;
    }
    
    try {
        const originalBuffer = fs.readFileSync(originalPath);
        const roundtripBuffer = fs.readFileSync(roundtripPath);
        
        if (originalBuffer.length !== roundtripBuffer.length) {
            console.log(`  ❌ FAIL: Size mismatch (${originalBuffer.length} vs ${roundtripBuffer.length})`);
            testResults.push({ file: mapFile, status: 'FAIL', reason: 'Size mismatch' });
            allPassed = false;
            continue;
        }
        
        let differences = 0;
        for (let i = 0; i < originalBuffer.length; i++) {
            if (originalBuffer[i] !== roundtripBuffer[i]) {
                if (differences < 5) {
                    console.log(`  ❌ Byte ${i}: ${originalBuffer[i]} vs ${roundtripBuffer[i]}`);
                }
                differences++;
            }
        }
        
        if (differences > 0) {
            console.log(`  ❌ FAIL: ${differences} byte differences`);
            testResults.push({ file: mapFile, status: 'FAIL', reason: `${differences} differences` });
            allPassed = false;
        } else {
            console.log(`  ✅ PASS: Files identical`);
            testResults.push({ file: mapFile, status: 'PASS', reason: 'Identical' });
        }
        
    } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
        testResults.push({ file: mapFile, status: 'ERROR', reason: error.message });
        allPassed = false;
    }
}

console.log('\n' + '='.repeat(50));
console.log('SUMMARY:');
console.log('='.repeat(50));

const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
const errors = testResults.filter(r => r.status === 'ERROR').length;
const skipped = testResults.filter(r => r.status === 'SKIP').length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🚫 Errors: ${errors}`);
console.log(`⏸️  Skipped: ${skipped}`);

if (allPassed && skipped === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The application correctly handles roundtrip conversion.');
} else if (skipped > 0) {
    console.log('\n⚠️  Some tests were skipped. Complete the manual testing process.');
} else {
    console.log('\n❌ Some tests failed. The application needs fixes.');
}