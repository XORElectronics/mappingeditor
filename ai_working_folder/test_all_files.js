const fs = require('fs');
const path = require('path');

function testAllMapFiles() {
    const workingMapsDir = path.join(__dirname, '../examples');
    const files = fs.readdirSync(workingMapsDir).filter(f => f.endsWith('.MAP'));
    
    console.log('=== Testing All Working MAP Files ===');
    console.log(`Found ${files.length} MAP files to test\n`);
    
    let allPassed = true;
    
    files.forEach((filename, index) => {
        const filePath = path.join(workingMapsDir, filename);
        const buffer = fs.readFileSync(filePath);
        
        console.log(`${index + 1}. ${filename}`);
        
        try {
            if (buffer.length !== 1502) {
                console.log(`   ❌ Wrong file size: ${buffer.length} bytes (expected 1502)`);
                allPassed = false;
                return;
            }
            
            // Parse header
            const headerText = buffer.toString('utf8', 0, 16).replace(/\0+$/, '');
            const majorVersion = buffer[16];
            const minorVersion = buffer[17];
            const fileName = buffer.toString('utf8', 18, 30).replace(/\0+$/, '');
            
            if (!headerText.startsWith('NerdSEQ Mapping')) {
                console.log(`   ❌ Invalid header: "${headerText}"`);
                allPassed = false;
                return;
            }
            
            // Count active rows and check structure
            let activeRows = 0;
            let structureValid = true;
            
            for (let i = 0; i < 70; i++) {
                const rowOffset = 70 + (i * 20);
                
                // Check we don't read beyond file
                if (rowOffset + 20 > buffer.length) {
                    console.log(`   ❌ Row ${i} extends beyond file`);
                    structureValid = false;
                    break;
                }
                
                const sourceType = buffer.readUInt16LE(rowOffset + 0);
                
                if (sourceType !== 65535) {
                    activeRows++;
                    
                    // Basic validation of values
                    const sourceFunction = buffer.readUInt16LE(rowOffset + 2);
                    const sourceExtra = buffer.readUInt16LE(rowOffset + 4);
                    const destType = buffer.readUInt16LE(rowOffset + 6);
                    const destFunction = buffer.readUInt16LE(rowOffset + 8);
                    const destExtra = buffer.readUInt16LE(rowOffset + 10);
                    
                    // Check unused bytes are 0xFFFF
                    for (let j = 6; j < 10; j++) {
                        const unusedValue = buffer.readUInt16LE(rowOffset + (j * 2));
                        if (unusedValue !== 0xFFFF) {
                            console.log(`   ⚠️  Row ${i} unused word ${j} = ${unusedValue} (expected 65535)`);
                        }
                    }
                }
            }
            
            if (!structureValid) {
                allPassed = false;
                return;
            }
            
            // Check variables section
            const variablesOffset = 1470;
            if (variablesOffset + 32 > buffer.length) {
                console.log(`   ❌ Variables section extends beyond file`);
                allPassed = false;
                return;
            }
            
            let nonZeroVars = 0;
            for (let i = 0; i < 16; i++) {
                const value = buffer.readUInt16LE(variablesOffset + (i * 2));
                if (value !== 0) nonZeroVars++;
            }
            
            console.log(`   ✅ Valid - Version ${majorVersion}.${minorVersion}, ${activeRows} active rows, ${nonZeroVars} non-zero variables`);
            
        } catch (error) {
            console.log(`   ❌ Parse error: ${error.message}`);
            allPassed = false;
        }
    });
    
    console.log(`\n=== Summary ===`);
    if (allPassed) {
        console.log(`✅ All ${files.length} files passed validation!`);
        console.log(`The binary parser should now work correctly.`);
    } else {
        console.log(`❌ Some files failed validation.`);
    }
    
    return allPassed;
}

testAllMapFiles();