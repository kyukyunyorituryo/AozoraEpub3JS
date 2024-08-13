import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AozoraGaijiConverter from './converter/AozoraGaijiConverter.js';

// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock files and their contents
const mockJarPath = path.join(__dirname, '/');
const mockIvsFile = 'chuki_ivs.txt';
const mockUtfFile = 'chuki_utf.txt';
const mockAltFile = 'chuki_alt.txt';

// Mock content
const mockIvsContent = `
# comment line
U+0001\tglyph_name\t※［＃character_name］
U+0002\tglyph_name\t※［＃another_character_name］
`;
const mockUtfContent = `
# comment line
U+0003\tutf_name\t※［＃character_name_2］
U+0004\tutf_name\t※［＃another_character_name_2］
`;
const mockAltContent = `
# comment line
U+0005\talt_name\t※［＃character_name_3］
U+0006\talt_name\t※［＃another_character_name_3］
`;

// Helper function to write mock files
const writeMockFile = (filename, content) => {
    fs.writeFileSync(path.resolve(mockJarPath, filename), content, 'utf-8');
};

// Test cases
const testAozoraGaijiConverter = () => {
    // Ensure the mock directory exists
    if (!fs.existsSync(mockJarPath)) {
        fs.mkdirSync(mockJarPath);
    }

    // Write mock files
    writeMockFile(mockIvsFile, mockIvsContent);
    writeMockFile(mockUtfFile, mockUtfContent);
    writeMockFile(mockAltFile, mockAltContent);

    // Initialize AozoraGaijiConverter
    const converter = new AozoraGaijiConverter(mockJarPath);

    // Test chukiUtfMap and chukiAltMap initialization
    console.assert(converter.chukiUtfMap.get('character_name') === 'U+0001', 'chukiUtfMap character_name');
    console.assert(converter.chukiUtfMap.get('another_character_name') === 'U+0002', 'chukiUtfMap another_character_name');
    console.assert(converter.chukiUtfMap.get('character_name_2') === 'U+0003', 'chukiUtfMap character_name_2');
    console.assert(converter.chukiUtfMap.get('another_character_name_2') === 'U+0004', 'chukiUtfMap another_character_name_2');
    console.assert(converter.chukiAltMap.get('character_name_3') === 'U+0005', 'chukiAltMap character_name_3');
    console.assert(converter.chukiAltMap.get('another_character_name_3') === 'U+0006', 'chukiAltMap another_character_name_3');

    // Test toUtf method
    console.assert(converter.toUtf('character_name') === 'U+0001', 'toUtf character_name');
    console.assert(converter.toUtf('another_character_name') === 'U+0002', 'toUtf another_character_name');
    console.assert(converter.toUtf('character_name_2') === 'U+0003', 'toUtf character_name_2');
    console.assert(converter.toUtf('another_character_name_2') === 'U+0004', 'toUtf another_character_name_2');

    // Test toAlterString method
    console.assert(converter.toAlterString('character_name_3') === 'U+0005', 'toAlterString character_name_3');
    console.assert(converter.toAlterString('another_character_name_3') === 'U+0006', 'toAlterString another_character_name_3');

    // Test codeToCharString method
    console.assert(converter.codeToCharString('U+0041') === 'A', 'codeToCharString U+0041');
    console.assert(converter.codeToCharString('U+1F600') === '😀', 'codeToCharString U+1F600'); // Unicode Emoji

    // Test charStringToCode method
    console.assert(converter.charStringToCode('A') === 0x41, 'charStringToCode A');
    console.assert(converter.charStringToCode('😀') === 0x1F600, 'charStringToCode 😀'); // Unicode Emoji

    // Clean up mock files
    fs.unlinkSync(path.resolve(mockJarPath, mockIvsFile));
    fs.unlinkSync(path.resolve(mockJarPath, mockUtfFile));
    fs.unlinkSync(path.resolve(mockJarPath, mockAltFile));
    fs.rmdirSync(mockJarPath);

    console.log('All tests passed!');
};

// Run tests
testAozoraGaijiConverter();
