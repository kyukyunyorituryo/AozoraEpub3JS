import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class LatinConverter {
    // 分解表記文字列→拡張ラテン文字の対応テーブル
    latinMap = new Map();

    // 分解表記文字列→CIDコードの対応テーブル
    latinCidMap = new Map();
    constructor(file) {
        // String srcFileName = "chuki_latin.txt";
        const src = fs.readFileSync(path.resolve(__dirname, file), "UTF-8");
        let line = src.split("\r\n");
        for (let i = 0; i < line.length; i++) {
                if ((line[i].length > 0) &&( line[i].charAt(0) !== '#')) {
                        const values = line[i].split("\t");
                        const ch = values[1].charAt(0);
                        if (values[0].length > 0) this.latinMap.set(values[0], ch);
                        if (values.length > 3) this.latinCidMap.set(ch, [values[2], values[3]]);
                }
            }

    }

    // 分解表記の文字単体をUTF-8文字に変換
    toLatinCharacter(separated) {
        return this.latinMap.get(separated);
    }
    // 分解表記を含む英字文字列をUTF-8文字列に変換
    toLatinString(separated) {
        const ch = separated.split('');
        const out = [];
        let outIdx = 0;

        for (let i = 0; i < ch.length; i++) {
            // 2文字か3文字でマッチング
            if (i < ch.length - 1) {
                const latin = this.latinMap.get(ch.slice(i, i + 2).join(''));
                if (latin) {
                    out[outIdx++] = latin;
                    i++;
                    continue;
                }

                if (i < ch.length - 2) {
                    const latin = this.latinMap.get(ch.slice(i, i + 3).join(''));
                    if (latin) {
                        out[outIdx++] = latin;
                        i += 2;
                        continue;
                    }
                }
            }

            out[outIdx++] = ch[i];
        }

        return out.slice(0, outIdx).join('');
    }
    // ラテン文字をグリフタグに変換した文字列に変換
    toLatinGlyphString(ch) {
        const cid = this.latinCidMap.get(ch);
        if (cid === undefined) return null;
        let buf = "<glyph system=\"Adobe-Japan1-6\" code=\"" + cid[0] + "\" v_code=\"" + cid[1] + "\"/>";
        return buf;
    }
}
