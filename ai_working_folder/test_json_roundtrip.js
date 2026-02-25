const fs = require('fs');
const path = require('path');

// Simple test to validate JSON roundtrip conversion
const workingMapsDir = '../examples';
const testOutputDir = './json_test_output';

// Ensure output directory exists
if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
}

console.log('Starting JSON roundtrip test...');
console.log('');

// Get all .map files
const mapFiles = fs.readdirSync(workingMapsDir).filter(file => file.endsWith('.MAP'));

console.log(`Found ${mapFiles.length} .map files to test:`);
mapFiles.forEach(file => console.log(`  - ${file}`));
console.log('');

console.log('Instructions for manual testing:');
console.log('1. Open the mapping editor in your browser');
console.log('2. For each .map file listed above:');
console.log('   a. Load the original .map file');
console.log('   b. Save it as JSON with name: [original_name]_from_map.json');
console.log('   c. Load that JSON file');
console.log('   d. Save it as .map with name: [original_name]_roundtrip.map');
console.log('   e. Compare original vs roundtrip using the comparison script below');
console.log('');

// Create a comparison script
const comparisonScript = `const fs = require('fs');
const path = require('path');

function compareMapFiles(original, roundtrip) {
    console.log(\`Comparing \${original} vs \${roundtrip}\`);
    
    const originalData = fs.readFileSync(original);
    const roundtripData = fs.readFileSync(roundtrip);
    
    if (originalData.length !== roundtripData.length) {
        console.log(\`  ❌ Size mismatch: \${originalData.length} vs \${roundtripData.length}\`);
        return false;
    }
    
    let differences = 0;
    for (let i = 0; i < originalData.length; i++) {
        if (originalData[i] !== roundtripData[i]) {
            console.log(\`  ❌ Byte \${i}: \${originalData[i]} vs \${roundtripData[i]}\`);
            differences++;
            if (differences > 10) {
                console.log(\`  ... and more differences\`);
                break;
            }
        }
    }
    
    if (differences === 0) {
        console.log(\`  ✅ Files are identical\`);
        return true;
    } else {
        console.log(\`  ❌ Found \${differences} differences\`);
        return false;
    }
}

// Usage examples:
// compareMapFiles('../examples/ONE.MAP', './json_test_output/ONE_roundtrip.map');
// compareMapFiles('../examples/TWO.MAP', './json_test_output/TWO_roundtrip.map');
// ... etc for all files

module.exports = { compareMapFiles };
`;

fs.writeFileSync(path.join(testOutputDir, 'compare_files.js'), comparisonScript);

console.log(`Created comparison script at: ${testOutputDir}/compare_files.js`);
console.log('');
console.log('After completing the manual steps, use the comparison script like this:');
console.log('node copilot/json_test_output/compare_files.js');