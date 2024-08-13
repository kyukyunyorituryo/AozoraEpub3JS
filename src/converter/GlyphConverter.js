import fs from 'fs';
import path from 'path';

/**
 * パラメータファイルで指定されたUTF-8をグリフタグに変換するクラス
 * XMDF変換で利用していてePub3では未使用
 */
export default class GlyphConverter {
    constructor(log, dir) {
        this.cidMap = new Map();
        this.initialize(log, dir);
    }

    async initialize(log, dir) {
        const dirPath = path.resolve(dir);
        const files = await fs.promises.readdir(dirPath);
        
        for (const fileName of files) {
            const filePath = path.join(dirPath, fileName);
            const fileStat = await fs.promises.stat(filePath);
            if (fileStat.isFile()) {
                console.log(filePath);
                await this.loadCidFile(log, filePath, this.cidMap);
            }
        }
    }

    async loadCidFile(log, srcFile, cidMap) {
        const data = await fs.promises.readFile(srcFile, 'utf-8');
        const lines = data.split('\n');
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            if (line.length > 0 && line.charAt(0) !== '#') {
                try {
                    const values = line.split('\t');
                    const ch = values[0].charAt(0);
                    if (!cidMap.has(ch)) cidMap.set(ch, values[1]);
                } catch (e) {
                    console.error(`Error at line ${lineNum} in ${path.basename(srcFile)}: ${line}`);
                }
            }
        });
    }

    async convertGlyph(src, out) {
        const lines = src.split('\n');
        
        for (const line of lines) {
            const arr = line.split('');
            for (const ch of arr) {
                await this.printGlyphTag(out, ch);
            }
            out.write('\n');
        }
    }

    async printGlyphTag(out, ch) {
        const cid = this.cidMap.get(ch);
        if (cid === null || cid === undefined) {
            out.write(ch);
        } else {
            console.log(cid);
            out.write(`<glyph system="Adobe-Japan1-6" code="${cid}"/>`);
        }
    }
}
/*
// 使用例
(async () => {
    const log = [];
    try {
        const converter = new GlyphConverter(log, 'Glyph_JIS1-4');
        
        // サンプル文字のグリフタグを出力
        const output = process.stdout;
        await converter.printGlyphTag(output, '㎎');
        output.write('\n');
    } catch (e) {
        console.error(e);
    }
})();
*/