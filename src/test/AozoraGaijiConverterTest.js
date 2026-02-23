import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import AozoraGaijiConverter from '../converter/AozoraGaijiConverter.js';

// ES Module用 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 安全な一時ディレクトリ
const mockJarPath = path.join(__dirname, 'tmp_test_dir');

// ファイル名
const mockIvsFile = 'chuki_ivs.txt';
const mockUtfFile = 'chuki_utf.txt';
const mockAltFile = 'chuki_alt.txt';

// 可視Unicodeのみ使用
const mockIvsContent = `
# comment
U+0041\tglyph_name\t※［＃character_name］
U+3042\tglyph_name\t※［＃another_character_name］
`;

const mockUtfContent = `
# comment
U+0042\tutf_name\t※［＃character_name_2］
U+3044\tutf_name\t※［＃another_character_name_2］
`;

const mockAltContent = `
# comment
U+0043\talt_name\t※［＃character_name_3］
U+3046\talt_name\t※［＃another_character_name_3］
`;

// ファイル書き込み
function writeMockFile(filename, content) {
    fs.writeFileSync(path.join(mockJarPath, filename), content.trim(), 'utf-8');
}

function runTests() {
    console.log('Running AozoraGaijiConverter tests...');

    fs.mkdirSync(mockJarPath, { recursive: true });

    try {
        // モックファイル作成
        writeMockFile(mockIvsFile, mockIvsContent);
        writeMockFile(mockUtfFile, mockUtfContent);
        writeMockFile(mockAltFile, mockAltContent);

        const converter = new AozoraGaijiConverter(mockJarPath);

        // === Map初期化確認 ===
        assert.strictEqual(converter.chukiUtfMap.get('character_name'), 'U+0041');
        assert.strictEqual(converter.chukiUtfMap.get('another_character_name'), 'U+3042');
        assert.strictEqual(converter.chukiUtfMap.get('character_name_2'), 'U+0042');
        assert.strictEqual(converter.chukiUtfMap.get('another_character_name_2'), 'U+3044');

        assert.strictEqual(converter.chukiAltMap.get('character_name_3'), 'U+0043');
        assert.strictEqual(converter.chukiAltMap.get('another_character_name_3'), 'U+3046');

        // === toUtf ===
        assert.strictEqual(converter.toUtf('character_name'), 'U+0041');
        assert.strictEqual(converter.toUtf('character_name_2'), 'U+0042');

        // === toAlterString ===
        assert.strictEqual(converter.toAlterString('character_name_3'), 'U+0043');

        // === codeToCharString ===
        assert.strictEqual(converter.codeToCharString('U+0041'), 'A');
        assert.strictEqual(converter.codeToCharString('U+1F600'), '😀');

        // === charStringToCode ===
        assert.strictEqual(converter.charStringToCode('A'), 0x41);
        assert.strictEqual(converter.charStringToCode('😀'), 0x1F600);

        console.log('✅ All tests passed!');

    } finally {
        // 必ず削除
        fs.rmSync(mockJarPath, { recursive: true, force: true });
    }
}

runTests();
