import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JisConverter from './JisConverter.js'

// もし __dirname がない場合は以下の方法で定義します
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class AozoraGaijiConverter {
    constructor(jarPath) {
        this.chukiUtfMap = new Map();
        this.chukiAltMap = new Map();

        // 初期化
        // ファイルチェック取得 IVS優先
        this.loadChukiFile(path.join(jarPath, 'chuki_ivs.txt'), this.chukiUtfMap);
        this.loadChukiFile(path.join(jarPath, 'chuki_utf.txt'), this.chukiUtfMap);
        this.loadChukiFile(path.join(jarPath, 'chuki_alt.txt'), this.chukiAltMap);
    }

    loadChukiFile(srcFile, chukiMap) {
        const src = fs.readFileSync(srcFile, 'utf-8');
        const lines = src.split('\r\n');
        let lineNum = 0;

        for (const line of lines) {
            if (line.length > 0 && line.charAt(0) !== '#') {
                try {
                    let charStart = line.indexOf('\t');
                    if (charStart === -1) continue;
                    charStart = line.indexOf('\t', charStart + 1);
                    if (charStart === -1) continue;
                    charStart++;
                    let chukiStart = line.indexOf('\t', charStart);
                    if (chukiStart === -1) continue;
                    chukiStart++;
                    if (!line.startsWith("※［＃", chukiStart)) continue;
                    let chukiEnd = line.indexOf('\t', chukiStart);
                    let chukiCode = line.indexOf('、', chukiStart);
                    if (chukiCode !== -1 && line.charAt(chukiCode + 1) === '「') chukiCode = line.indexOf('、', chukiCode + 1);
                    if (chukiCode !== -1 && (chukiEnd === -1 || chukiCode < chukiEnd)) chukiEnd = chukiCode + 1;
                    if (chukiEnd === -1) chukiEnd = line.length;

                    const utfChar = line.substring(charStart, chukiStart - 1);
                    const chuki = line.substring(chukiStart + 3, chukiEnd - 1);
                    if (chukiMap.has(chuki)) {
                        console.warn(`${lineNum}: 外字注記定義重複 ${chuki}`);
                    } else {
                        chukiMap.set(chuki, utfChar);
                    }
                } catch (error) {
                    console.error(`${lineNum}: ${srcFile} ${line}`);
                }
            }
            lineNum++;
        }
    }

    toUtf(chuki) {
        return this.chukiUtfMap.get(chuki);
    }

    toAlterString(chuki) {
        return this.chukiAltMap.get(chuki);
    }

    codeToCharString(code) {
        try {
            if (code.startsWith("U+") || code.startsWith("u+")) {
                let idx = code.indexOf("-");
                if (idx === -1) {
                    return this.codeToCharStringHex(parseInt(code.substring(2), 16));
                } else {
                    let ivs = code.substring(idx + 1);
                    if (ivs.startsWith("U+") || ivs.startsWith("u+")) ivs = ivs.substring(2);
                    return this.codeToCharStringHex(parseInt(code.substring(2, idx), 16)) +
                        this.codeToCharStringHex(parseInt(ivs, 16));
                }
            } else if (code.startsWith("UCS-")) {
                return this.codeToCharStringHex(parseInt(code.substring(4), 16));
            } else if (code.startsWith("unicode")) {
                return this.codeToCharStringHex(parseInt(code.substring(7), 16));
            } else {
                const codes = code.startsWith("第3水準") || code.startsWith("第4水準")
                    ? code.substring(4).split("-")
                    : code.split("-");
                return JisConverter.getConverter().toCharString(parseInt(codes[0]), parseInt(codes[1]), parseInt(codes[2]));
                //return this.jisToCharString(parseInt(codes[0]), parseInt(codes[1]), parseInt(codes[2]));
            }
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    codeToCharStringHex(unicode) {
        if (unicode === 0) return null;
      return String.fromCodePoint(unicode);
    }

    charStringToCode(charString) {
        try {
            const utf32Bytes = new TextEncoder().encode(charString);
            return this.toCode(utf32Bytes);
        } catch (error) {
            console.error(error);
            return 0;
        }
    }

    toCode(utf32Bytes) {
        const buffer = new Uint8Array(utf32Bytes).buffer;
        return new DataView(buffer).getInt32(0, false);
    }

}
