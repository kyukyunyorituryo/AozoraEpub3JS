import AozoraEpub3Converter from '../converter/AozoraEpub3Converter.js';
import path from "path";
import BookInfo from '../info/BookInfo.js';
import Epub3Writer from '../writer/Epub3Writer.js';
import CharUtils from '../util/CharUtils.js';
let converter;
const jarPath = path.resolve("src") + path.sep;
    const writer = new Epub3Writer("");
    console.log(jarPath)
    converter = new AozoraEpub3Converter(writer, jarPath);
    converter.bookInfo = new BookInfo(null);
        function createTestContext() {
      return {
        noTcyStart: new Set(),
        noTcyEnd: new Set(),
        lineNum: 1,

chukiMap: new Map([
  ["ルビ開始", ["<ruby>"]],
  ["ルビ終了", ["</ruby>"]],
  ["ルビ前",   ["<rt>"]],
  ["ルビ後",   ["</rt>"]],
]),

        convertTcyText(buf, ch, start, end) {
          buf.push(ch.slice(start, end).join(""));
        },

        convertReplacedChar(buf, ch, i) {
          buf.push(ch[i]);
        }
      };
    }
let shuturyoku =""
    function runTest(name, input, expected) {
      const ctx = createTestContext();
      const result = converter.convertRubyText(input);

      const ok = result === expected;
      shuturyoku +=
        (ok ? "✅ " : "❌ ") + name + "\n" +
        "  input:    " + input + "\n" +
        "  expected: " + expected + "\n" +
        "  actual:   " + result + "\n\n";

    }

    // テスト実行
runTest(
  "末尾未確定",
  "※《29※》",
  "※《29※》"
);
runTest(
  "エスケープ縦線",
  "※※＃※》",
  "※※＃※》"
);
runTest(
  "同文字長ルビ",
  "｜※｜縦線《たてせん》※｜",
  "<ruby>｜縦線<rt>たてせん</rt></ruby>｜"
);
runTest(
  "漢字英字混在",
  "※｜縦線《たてせん》※｜",
  "｜<ruby>縦線<rt>たてせん</rt></ruby>｜"
);
        console.log(shuturyoku)