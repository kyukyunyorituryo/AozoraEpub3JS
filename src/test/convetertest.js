import assert from 'assert';
import AozoraEpub3Converter from '../converter/AozoraEpub3Converter.js';
import Epub3Writer from '../writer/Epub3Writer.js';
import BookInfo from '../info/BookInfo.js';
import path from "path";

let converter;

function setup() {
    const basePath = path.resolve("src"); // chuki_*.txt が src にある場合
    const writer = new Epub3Writer("");
    converter = new AozoraEpub3Converter(writer, basePath);
    converter.writer = new TestEpub3Writer("");
    converter.bookInfo = new BookInfo(null);
}

class TestEpub3Writer extends Epub3Writer {
    constructor(templatePath) {
        super(templatePath);
    }
    getImageOrientation(imagePath) {
        return 0;
    }
    getImageFilePath(srcImageFileName, lineNum) {
        return "test.png";
    }
}

/* ========================= */

function testConvertRubyText() {
    setup();

    converter.vertical = true;

    let buf;

    buf = converter.convertRubyText("｜※｜縦線《たてせん》※｜");
    assert.strictEqual(buf.toString(), "<ruby>｜縦線<rt>たてせん</rt></ruby>｜");

    buf = converter.convertRubyText("※｜縦線《たてせん》※｜");
    assert.strictEqual(buf.toString(), "｜<ruby>縦線<rt>たてせん</rt></ruby>｜");

    console.log("✓ testConvertRubyText");
}

/* ========================= */

function testConvertGaijiChuki() {
    setup();

    let str;

    str = converter.convertGaijiChuki("※［＃U+845b］U+845b", true, true);
    assert.strictEqual(str, "葛U+845b");

    str = converter.convertGaijiChuki("※［＃u+845b-e0100］u+845b-e0100", true, true);
    assert.strictEqual(str, "葛󠄀u+845b-e0100");

    console.log("✓ testConvertGaijiChuki");
}

/* ========================= */

function testCheckTcyPrev() {
    setup();

    let prev = "";
    let cur = "10";
    let next = "";

    assert.strictEqual(
        converter.checkTcyPrev((prev + cur + next).split(""), prev.length - 1),
        true
    );

    prev = "a";
    assert.strictEqual(
        converter.checkTcyPrev((prev + cur + next).split(""), prev.length - 1),
        false
    );

    console.log("✓ testCheckTcyPrev");
}

/* ========================= */

function testCheckTcyNext() {
    setup();

    let prev = "";
    let cur = "10";
    let next = "";

    assert.strictEqual(
        converter.checkTcyNext((prev + cur + next).split(""), prev.length + cur.length),
        true
    );

    next = "a";

    assert.strictEqual(
        converter.checkTcyNext((prev + cur + next).split(""), prev.length + cur.length),
        false
    );

    console.log("✓ testCheckTcyNext");
}

/* ========================= */
/* 実行 */

function run() {
    testConvertRubyText();
    testConvertGaijiChuki();
    testCheckTcyPrev();
    testCheckTcyNext();
    console.log("🎉 All tests passed");
}

run();
