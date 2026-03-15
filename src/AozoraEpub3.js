import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { propertiesReader } from 'properties-reader';
import JSZip from "jszip";
import Archive from 'node-unrar-js';
import AozoraEpub3Converter from './converter/AozoraEpub3Converter.js';
import ImageInfoReader from './image/ImageInfoReader.js';
import BookInfo from './info/BookInfo.js';
import SectionInfo from './info/SectionInfo.js';
import Detector from './util/Detector.js';
import LogAppender from './util/LogAppender.js';
//import Epub3ImageWriter from './writer/Epub3ImageWriter.js';
import Epub3Writer from './writer/Epub3Writer.js';
import { fileURLToPath } from 'url';
import encoding from 'encoding-japanese';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定数
const VERSION = "1.1.1b31Q";
//let jarPath = process.env['NODE_PATH'] || '';
let jarPath = path.join(__dirname, '/');
/*
let idx = jarPath.indexOf(';');
if (idx > 0) jarPath = jarPath.substring(0, idx);
if (!jarPath.endsWith('.jar')) jarPath = '';
else jarPath = jarPath.substring(0, jarPath.lastIndexOf(path.sep) + 1);
*/
//this.cachePath = new File(jarPath+".cache");
//this.webConfigPath = new File(jarPath+"web");

/** ePub3出力クラス */
let epub3Writer;
/** ePub3画像出力クラス */
let epub3ImageWriter;

/** 設定ファイル */
let props;
/** 設定ファイル名 */
const propFileName = "./AozoraEpub3.ini";
/** 出力先パス */
let dstPath = null;

//メイン関数　即時関数

// コマンドライン オプション設定
const options = new Command();
options
  .version(VERSION)
  .description(`AozoraEpub3 [-options] input_files(txt,zip,cbz)\nversion : ${VERSION}`)
  .option('-i, --ini <file>', '指定したiniファイルから設定を読み込みます (コマンドラインオプション以外の設定)')
  .option('-t <type>', '本文内の表題種別\n[0:表題→著者名] (default)\n[1:著者名→表題]\n[2:表題→著者名(副題優先)]\n[3:表題のみ]\n[4:なし]')
  .option('--tf', '入力ファイル名を表題に利用')
  .option('-c, --cover <cover>', '表紙画像\n[0:先頭の挿絵]\n[1:ファイル名と同じ画像]\n[ファイル名 or URL]')
  .option('--ext <ext>', '出力ファイル拡張子\n[.epub] (default)\n[.kepub.epub]')
  .option('--of', '出力ファイル名を入力ファイル名に合せる')
  .option('-d, --dst <path>', '出力先パス')
  .option('--enc <encoding>', '入力ファイルエンコード標準は自動認識\n[MS932]\n[UTF-8]')
  .option('--hor', '横書き (指定がなければ縦書き)')
  .option('--device <device>', '端末種別(指定した端末向けの例外処理を行う)\n[kindle]')
  .arguments('<files...>')
  ;

options.parse(process.argv);



if (options.args.length === 0) {
  options.help();
}
const commandLine = options.opts();
const fileNames = options.args;



// オプションの後ろをファイル名に設定
if (fileNames.length === 0) {
  options.help();
}

// ヘルプ出力
if (commandLine.help) {
  options.help();
}
// iniファイル確認
if (commandLine.ini) {
  propFileName = commandLine.ini

  if (!fs.existsSync(commandLine.ini)) {
    LogAppender.error(`-i : ini file not exist. ${commandLine.ini}:`);
  }
}

// 出力パス確認
if (commandLine.dst) {
  dstPath = path.resolve(commandLine.dst);
  if (!fs.existsSync(commandLine.dst)|| !fs.statSync(dstPath).isDirectory()) {
    LogAppender.error(`-d : dst path not exist. ${commandLine.dst}:`);
  }
}

// ePub出力クラス初期化
epub3Writer = new Epub3Writer(`${jarPath}template/`);
//let epub3ImageWriter = new Epub3ImageWriter(`${jarPath}template/`);
// 設定ファイルの読み込み
if (propFileName) {
  props = propertiesReader({ sourceFile: propFileName });
  //console.log(props.getAllProperties());
}
//ini取得ユーティリティ関数
const getString = (key, def = null) =>
  props.get(key) ?? def;

const getBool = (key) =>
  String(props.get(key))  === "1";

const getInt = (key, def = 0) => {
  const v = parseInt(props.get(key));
  return isNaN(v) ? def : v;
};

const getFloat = (key, def = 0) => {
  const v = parseFloat(props.get(key));
  return isNaN(v) ? def : v;
};

let titleIndex = 0;
// コマンドラインオプション以外
const coverPage = getBool("CoverPage");// 表紙追加
let titlePage = 0;
if (getBool("TitlePageWrite")) {
  titlePage = getInt("TitlePage", 0);
}

const withMarkId = getBool("MarkId");
const commentPrint = getBool("CommentPrint");
const commentConvert = getBool("CommentConvert");

const autoYoko = getBool("AutoYoko");
const autoYokoNum1 = getBool("AutoYokoNum1");
const autoYokoNum3 = getBool("AutoYokoNum3");
const autoYokoEQ1 = getBool("AutoYokoEQ1");

const spaceHyp = getInt("SpaceHyphenation", 0);

const tocPage = getBool("TocPage");// 目次追加
const tocVertical = getBool("TocVertical");// 目次縦書き
const coverPageToc = getBool("CoverPageToc");

const removeEmptyLine = getInt("RemoveEmptyLine", 0);
const maxEmptyLine = getInt("MaxEmptyLine", 0);
// 画面サイズと画像リサイズ
const dispW = getInt("DispW", 600);
const dispH = getInt("DispH", 800);
const coverW = getInt("CoverW", 600);
const coverH = getInt("CoverH", 800);
let resizeW = 0;
if (getBool("ResizeW")) resizeW = getInt("ResizeNumW", 0);
let resizeH = 0;
if (getBool("ResizeH")) resizeH = getInt("ResizeNumH", 0);
const singlePageSizeW = getInt("SinglePageSizeW", 480);
const singlePageSizeH = getInt("SinglePageSizeH", 640);
const singlePageWidth = getInt("SinglePageWidth", 600);
const imageScale = getFloat("ImageScale", 1);
const imageFloatType = getInt("ImageFloatType", 0);
const imageFloatW = getInt("ImageFloatW", 0);
const imageFloatH = getInt("ImageFloatH", 0);
const imageSizeType = getInt("ImageSizeType", 1);
const fitImage = getBool("FitImage");
const svgImage = getBool("SvgImage");
let rotateImage = 0;
if (getString("RotateImage") === "1") rotateImage = 90;
else if (getString("RotateImage") === "2") rotateImage = -90;
const jpegQualty = getInt("JpegQuality", 80) / 100;
let gamma = 1.0;
if (getBool("Gamma")) gamma = getFloat("GammaValue", 1.0);

let autoMarginLimitH = 0;
let autoMarginLimitV = 0;
let autoMarginWhiteLevel = 80;
let autoMarginPadding = 0;
let autoMarginNombre = 0;
let nobreSize = 0.03;

if (getBool("AutoMargin")) {
  autoMarginLimitH = getInt("AutoMarginLimitH", 0);
  autoMarginLimitV = getInt("AutoMarginLimitV", 0);
  autoMarginWhiteLevel = getInt("AutoMarginWhiteLevel", 80);
  autoMarginPadding = getFloat("AutoMarginPadding", 0);
  autoMarginNombre = getInt("AutoMarginNombre", 0);
  nobreSize = getFloat("AutoMarginNombreSize", 0.03);
}
epub3Writer.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
  imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
/*epub3ImageWriter.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
    imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
    */

// 目次階層化設定
const navNest = getBool("NavNest");
const ncxNest = getBool("NcxNest");

epub3Writer.setTocParam(navNest, ncxNest);

// スタイル設定
function getMargin(key, unitKey) {
  const raw = getString(key);
  if (!raw) return ["0", "0", "0", "0"];

  const parts = raw.split(",");
  if (parts.length !== 4) return ["0", "0", "0", "0"];

  const unit = getString(unitKey) === "0" ? "em" : "%";

  return parts.map(v => v + unit);
}

const pageMargin = getMargin("PageMargin", "PageMarginUnit");
const bodyMargin = getMargin("BodyMargin", "BodyMarginUnit");

const lineHeight = getFloat("LineHeight", 1.8);
const fontSize = getInt("FontSize", 100);

const boldUseGothic = getBool("BoldUseGothic");
const gothicUseBold = getBool("gothicUseBold");
epub3Writer.setStyles(pageMargin, bodyMargin, lineHeight, fontSize, boldUseGothic, gothicUseBold);

// 自動改ページ
let forcePageBreakSize = 0;
let forcePageBreakEmpty = 0;
let forcePageBreakEmptySize = 0;
let forcePageBreakChapter = 0;
let forcePageBreakChapterSize = 0;

if (getBool("PageBreak")) {

  forcePageBreakSize = getInt("PageBreakSize", 0) * 1024;

  if (getBool("PageBreakEmpty")) {
    forcePageBreakEmpty = getInt("PageBreakEmptyLine", 0);
    forcePageBreakEmptySize = getInt("PageBreakEmptySize", 0) * 1024;
  }

  if (getBool("PageBreakChapter")) {
    forcePageBreakChapter = 1;
    forcePageBreakChapterSize = getInt("PageBreakChapterSize", 0) * 1024;
  }
}

// =======================
// Chapter設定
// =======================

const maxLength = getInt("ChapterNameLength", 64);

const insertTitleToc = getBool("TitleToc");
const chapterExclude = getBool("ChapterExclude");
const chapterUseNextLine = getBool("ChapterUseNextLine");

// Java:
// !props.containsKey("ChapterSection") || "1".equals(...)
const chapterSection =
  props.get("ChapterSection") === undefined ||
  getBool("ChapterSection");
const chapterH = getBool("ChapterH");
const chapterH1 = getBool("ChapterH1");
const chapterH2 = getBool("ChapterH2");
const chapterH3 = getBool("ChapterH3");
const sameLineChapter = getBool("SameLineChapter");
const chapterName = getBool("ChapterName");
const chapterNumOnly = getBool("ChapterNumOnly");
const chapterNumTitle = getBool("ChapterNumTitle");
const chapterNumParen = getBool("ChapterNumParen");
// ⚠ Java側に typo あり（hapterNumParenTitle）
const chapterNumParenTitle = getBool("ChapterNumParenTitle");
let chapterPattern = "";
if (getBool("ChapterPattern")) {
  chapterPattern = getString("ChapterPatternText", "");
}

// オプション指定を反映
let useFileName = false; // 表題に入力ファイル名利用
let coverFileName = null;
let encType = "AUTO"; // 文字コードの初期設定を空に
let outExt = ".epub";
let autoFileName = true; // ファイル名を表題に利用
let vertical = true;
let targetDevice = null;

if (commandLine.t) titleIndex = parseInt(commandLine.t);
if (commandLine.tf) useFileName = true;
if (commandLine.cover) coverFileName = path.resolve(commandLine.cover);
if (commandLine.enc) encType = commandLine.enc;
if (commandLine.ext) outExt = commandLine.ext;
if (commandLine.of) autoFileName = false;
if (commandLine.hor) vertical = false;
if (commandLine.device) {
  targetDevice = commandLine.device;
  if (targetDevice.toLowerCase() === "kindle") {
    epub3Writer.setIsKindle(true);
  }
}

// 変換クラス生成とパラメータ設定
const aozoraConverter = new AozoraEpub3Converter(epub3Writer, jarPath);
// 挿絵なし
aozoraConverter.setNoIllust(props.get("NoIllust") === "1");
// 栞用span出力
aozoraConverter.setWithMarkId(withMarkId);
// 変換オプション設定
aozoraConverter.setAutoYoko(autoYoko, autoYokoNum1, autoYokoNum3, autoYokoEQ1);
// 文字出力設定
let dakutenType = 0;
dakutenType = parseInt(props.get("DakutenType"));
let printIvsBMP = props.get("IvsBMP") === "1";
let printIvsSSP = props.get("IvsSSP") === "1";

aozoraConverter.setCharOutput(dakutenType, printIvsBMP, printIvsSSP);

// 全角スペースの禁則
aozoraConverter.setSpaceHyphenation(spaceHyp);
// コメント
aozoraConverter.setCommentPrint(commentPrint, commentConvert);

aozoraConverter.setRemoveEmptyLine(removeEmptyLine, maxEmptyLine);

// 強制改ページ
aozoraConverter.setForcePageBreak(forcePageBreakSize, forcePageBreakEmpty, forcePageBreakEmptySize, forcePageBreakChapter, forcePageBreakChapterSize);
// 目次設定
aozoraConverter.setChapterLevel(maxLength, chapterExclude, chapterUseNextLine, chapterSection,
  chapterH, chapterH1, chapterH2, chapterH3, sameLineChapter,
  chapterName,
  chapterNumOnly, chapterNumTitle, chapterNumParen, chapterNumParenTitle,
  chapterPattern);
(async function main() {
  ////////////////////////////////
  // 各ファイルを変換処理
  ////////////////////////////////
  for (const fileName of fileNames) {
    LogAppender.println("--------");
    const srcFile = fileName;
    if (!fs.existsSync(srcFile)) {
      LogAppender.error(`file not exist.  ${srcFile}:`);
      continue;
    }

    let ext = path.parse(srcFile).ext.slice(1).toLowerCase();
    let coverImageIndex = -1;
    if (coverFileName != null) {
      if (coverFileName === "0") {
        coverImageIndex = 0;
        coverFileName = "";
      } else if (coverFileName === "1") {
        coverFileName = getSameCoverFileName(srcFile); // 入力ファイルと同じ名前+.jpg/.png
      }
    }

    // zipならzip内のテキストを検索
    let txtCount = 1;
    let imageOnly = false;
    let isFile = ext === "txt";
    if (ext === "zip" || ext === "txtz") {
      try {
        txtCount = await countZipText(srcFile);
      } catch (e) {
        console.error(e);
      }
      if (txtCount === 0) { txtCount = 1; imageOnly = true; }
    } else if (ext === "rar") {
      try {
        txtCount = await AozoraEpub3.countRarText(srcFile);
      } catch (e) {
        console.error(e);
      }
      if (txtCount === 0) { txtCount = 1; imageOnly = true; }
    } else if (ext === "cbz") {
      imageOnly = true;
    }

    for (let txtIdx = 0; txtIdx < txtCount; txtIdx++) {
      const imageInfoReader = new ImageInfoReader(isFile, srcFile);

      let bookInfo = null;
      // 文字コード判別
      let encauto = "";

      encauto = await getTextCharset(srcFile, ext, imageInfoReader, txtIdx);
      if (encType === "AUTO") encType = encauto;
      if (!imageOnly) {
        bookInfo = await getBookInfo(srcFile, ext, txtIdx, imageInfoReader, aozoraConverter, encType, BookInfo.TitleType.indexOf(titleIndex), false);
        bookInfo.vertical = vertical;
        bookInfo.insertTocPage = tocPage;
        bookInfo.setTocVertical = tocVertical;
        bookInfo.insertTitleToc = insertTitleToc;
        aozoraConverter.vertical = vertical;
        // 表題ページ
        bookInfo.titlePageType = titlePage;
      }
      let writer = epub3Writer;
      if (!isFile) {
        if (ext === "rar") {
          await imageInfoReader.loadRarImageInfos(srcFile, imageOnly);
        } else {
          await imageInfoReader.loadZipImageInfos(srcFile, imageOnly);
        }
        if (imageOnly) {
          LogAppender.println("画像のみのePubファイルを生成します");
          // 画像出力用のBookInfo生成
          bookInfo = new BookInfo(srcFile);
          bookInfo.imageOnly = true;
          // Writerを画像出力用派生クラスに入れ替え
          writer = epub3ImageWriter;

          if (imageInfoReader.countImageFileInfos() === 0) {
            LogAppender.error("画像がありませんでした");
            return;
          }
          // 名前順で並び替え
          imageInfoReader.sortImageFileNames();
        }
      }

      // 表題の見出しが非表示で行が追加されていたら削除
      if (!bookInfo.insertTitleToc && bookInfo.titleLine >= 0) {
        bookInfo.removeChapterLineInfo(bookInfo.titleLine);
      }

      // 先頭からの場合で指定行数以降なら表紙無し
      if (coverFileName === "") {
        try {
          const maxCoverLine = parseInt(props.getProperty("MaxCoverLine"));
          if (maxCoverLine > 0 && bookInfo.firstImageLineNum >= maxCoverLine) {
            coverImageIndex = -1;
            coverFileName = null;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 表紙設定
      bookInfo.insertCoverPageToc = coverPageToc;
      bookInfo.insertCoverPage = coverPage;
      bookInfo.coverImageIndex = coverImageIndex;
      if (coverFileName != null && !coverFileName.startsWith("http")) {
        let coverFile = new File(coverFileName);
        if (!coverFile.exists()) {
          coverFileName = srcFile.getParent() + "/" + coverFileName;
          if (!new File(coverFileName).exists()) {
            coverFileName = null;
            LogAppender.println("[WARN] 表紙画像ファイルが見つかりません : " + coverFile.getAbsolutePath());
          }
        }
      }
      bookInfo.coverFileName = coverFileName;

      const titleCreator = BookInfo.getFileTitleCreator(path.basename(srcFile));
      if (titleCreator != null) {
        if (useFileName) {
          if (titleCreator[0] && titleCreator[0].trim().length > 0) bookInfo.title = titleCreator[0];
          if (titleCreator[1] && titleCreator[1].trim().length > 0) bookInfo.creator = titleCreator[1];
        } else {
          // テキストから取得できていない場合
          if (!bookInfo.title || bookInfo.title.length === 0) bookInfo.title = titleCreator[0] ?? "";
          if (!bookInfo.creator || bookInfo.creator.length === 0) bookInfo.creator = titleCreator[1] ?? "";
        }
      }
      const outFile = getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt);
      await convertFile(
        srcFile, ext, outFile,
        aozoraConverter, writer,
        encType, bookInfo, imageInfoReader, txtIdx
      );
    }
  }

})();


/** 出力ファイルを生成 */
function getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt) {
  // 出力ファイル
  if (dstPath === null) dstPath = path.dirname(srcFile);
  let outFileName = "";
  if (autoFileName && (bookInfo.creator != null || bookInfo.title != null)) {
    outFileName = dstPath + "/";
    if (bookInfo.creator != null && bookInfo.creator.length > 0) {
      let str = bookInfo.creator.replace(/[\\\/\:\*\?\<\>\|\\"\t]/g, "");
      if (str.length > 64) str = str.substring(0, 64);
      outFileName += "[" + str + "] ";
    }
    if (bookInfo.title != null) {
      outFileName += bookInfo.title.replace(/[\\\/\:\*\!\?\<\>\|\\"\t]/g, "");
    }
    if (outFileName.length > 250) outFileName = outFileName.substring(0, 250);
  } else {
    outFileName = dstPath.getAbsolutePath() + "/" + path.basename(srcFile).replace(/\.[^\.]+$/, "");
  }
  if (outExt.length === 0) outExt = ".epub";
  const outFile = outFileName + outExt;
  // 書き込み許可設定
  //outFile.setWritable(true);

  return outFile;
}

/** 前処理で一度読み込んでタイトル等の情報を取得 */
async function getBookInfo(srcFile, ext, txtIdx, imageInfoReader, aozoraConverter, encType, titleType, pubFirst) {
  try {
    const textEntryName = [null];
    const src = await getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx, encType);
    if (src === null) return null;
    // タイトル、画像注記、左右中央注記、目次取得
    const bookInfo = await aozoraConverter.getBookInfo(srcFile, src, imageInfoReader, titleType, pubFirst);
    bookInfo.textEntryName = textEntryName[0];
    return bookInfo;

  } catch (e) {
    console.error(e);
    LogAppender.append("エラーが発生しました : ");
    LogAppender.println(e.message);
  }
  return null;
}

/** ファイルを変換
* @param srcFile 変換するファイル
//	 * @param dstPath 出力先パス */
async function convertFile(srcFile, ext, outFile, aozoraConverter, epubWriter, encType, bookInfo, imageInfoReader, txtIdx) {
  try {
    const time = Date.now();
    LogAppender.append('変換開始 : ');
    LogAppender.println(srcFile);

    // 入力Stream再オープン
    let src = null;
    if (!bookInfo.imageOnly) {
    src = await getTextInputStream(srcFile, ext, imageInfoReader, null, txtIdx, encType);
    }
    // ePub書き出し srcは中でクローズされる
    await epubWriter.write(aozoraConverter, src, srcFile, ext, outFile, bookInfo, imageInfoReader);

    LogAppender.append(`変換完了[${((Date.now() - time) / 1000).toFixed(1)}s] : `);
    LogAppender.println(outFile);
  } catch (e) {
    console.error(e);
    LogAppender.println(`エラーが発生しました : ${e.message}`);
    // LogAppender.printStackTrace(e);
  }
}

/** 入力ファイルからStreamオープン
*
* @param {File} srcFile
* @param {string} ext
* @param {ImageInfoReader} imageInfoReader
* @param {string[]} textEntryName
* @param {number} txtIdx テキストファイルのZip内の位置
* @return {Promise<InputStream>} テキストファイルのストリーム (close()は呼び出し側ですること)
* @throws {Error}
*/
async function getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx, encType) {
  if (ext === 'txt') {
    const buffer = fs.readFileSync(srcFile);

    const src = encoding.convert(buffer, {
      to: "UNICODE",
      from: encType,
      type: "string"
    });
    return src;
  } else if (ext === 'zip' || ext === 'txtz') {
    const buffer = fs.readFileSync(srcFile);
    // MS932ファイル名対応
    const zip = await JSZip.loadAsync(buffer);
    let foundIndex = 0;
    for (const path in zip.files) {
      const file = zip.files[path];
      if (!file.dir && path.toLowerCase().endsWith(".txt")) {
        if (foundIndex === txtIdx) {
          if (imageInfoReader?.setArchiveTextEntry) {
            imageInfoReader.setArchiveTextEntry(path);
          }
          if (textEntryName) {
            textEntryName[0] = path;
          }
          const uint8 = await file.async("uint8array");
          const charset = encoding.detect(uint8);
          return encoding.convert(uint8, {
            to: "UNICODE",
            from: charset,
            type: "string"
          });
        }
        foundIndex++;
      }
    }
    LogAppender.append('zip内にtxtファイルがありません: ');
    LogAppender.println(path.basename(srcFile));
    return null;
  } else if (ext === 'rar') {
    const archive = new Archive(srcFile);
    try {
      let fileHeader = await archive.nextFileHeader();
      while (fileHeader !== null) {
        if (!fileHeader.isDirectory()) {
          let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
          entryName = entryName.replace(/\\/g, '/');
          if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
            if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
            if (textEntryName) textEntryName[0] = entryName;
            const tmpFile = fs.mkdtempSync('rarTmp');
            fs.createReadStream(archive.getInputStream(fileHeader)).pipe(fs.createWriteStream(tmpFile));
            return fs.createReadStream(tmpFile);
          }
        }
        fileHeader = await archive.nextFileHeader();
      }
    } finally {
      await archive.close();
    }
    LogAppender.append('rar内にtxtファイルがありません: ');
    LogAppender.println(path.basename(srcFile));
    return null;
  } else {
    LogAppender.append('txt, zip, rar, txtz, cbz のみ変換可能です: ');
    LogAppender.println(srcFile);
  }
  return null;
}
/** 入力ファイルから文字コードを判別
*
* @param srcFile
* @param ext
* @param imageInfoReader
* @param txtIdx テキストファイルのZip内の位置
* @return テキストファイルのストリーム (close()は呼び出し側ですること)
* @throws RarException
*/
async function getTextCharset(srcFile, ext, imageInfoReader, txtIdx) {
  let cs = '';
  if (ext === 'txt') {
    const is = srcFile;
    const data = fs.readFileSync(is);
    const cs = encoding.detect(data);
    //cs = Detector.getCharset(is);
    return cs;
  } else if (ext === 'zip' || ext === 'txtz') {
    const buffer = fs.readFileSync(srcFile);
    const zip = await JSZip.loadAsync(buffer);
    let foundIndex = 0;
    for (const path in zip.files) {
      const file = zip.files[path];
      if (!file.dir && path.toLowerCase().endsWith(".txt")) {
        if (foundIndex === txtIdx) {
          // Java版: imageInfoReader.setArchiveTextEntry(entryName)
          if (imageInfoReader && imageInfoReader.setArchiveTextEntry) { imageInfoReader.setArchiveTextEntry(path); }
          // ファイル内容取得（Uint8Array）
          const uint8 = await file.async("uint8array");
          // encoding-japaneseで判定
          const charset = encoding.detect(uint8);
          return charset;
        }
        foundIndex++;
      }
    }
    LogAppender.append('zip内にtxtファイルがありません: ');
    LogAppender.println(path.basename(srcFile));
    return null;
  } else if (ext === 'rar') {
    const archive = new Archive(srcFile);
    try {
      let fileHeader = await archive.nextFileHeader();
      while (fileHeader !== null) {
        if (!fileHeader.isDirectory()) {
          let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
          entryName = entryName.replace(/\\/g, '/');
          if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
            if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
            const tmpFile = fs.mkdtempSync('rarTmp');
            const fos = fs.createWriteStream(tmpFile);
            const is = await archive.getInputStream(fileHeader);
            await new Promise((resolve, reject) => {
              is.pipe(fos);
              is.on('end', resolve);
              is.on('error', reject);
            });
            const bis = fs.createReadStream(tmpFile, { highWaterMark: 65536 });
            cs = await Detector.getCharset(bis);
            return cs;
          }
        }
        fileHeader = await archive.nextFileHeader();
      }
    } finally {
      await archive.close();
    }
    LogAppender.append('rar内にtxtファイルがありません: ');
    LogAppender.println(path.basename(srcFile));
    return null;
  } else {
    LogAppender.append('txt, zip, rar, txtz, cbz のみ変換可能です: ');
    LogAppender.println(srcFile);
  }
  return null;
}


/**
 * Zipファイル内のテキストファイル数を取得
 * @param {string} zipPath
 * @returns {Promise<number>}
 */
export async function countZipText(zipPath) {
  let txtCount = 0;
  // ① ZIPをバイナリで読む
  const buffer = fs.readFileSync(zipPath);
  // ② JSZipで読み込み
  const zip = await JSZip.loadAsync(buffer);
  // ③ 全エントリを走査
  zip.forEach((relativePath, file) => {
    if (!file.dir) {
      const ext = relativePath.split(".").pop();
      if (ext && ext.toLowerCase() === "txt") {
        txtCount++;
      }
    }
  });
  return txtCount;
}

/** Ripファイル内のテキストファイルの数を取得 */
async function countRarText(rarFile) {
  let txtCount = 0;
  const archive = new Archive(rarFile);
  try {
    for (const fileHeader of archive.getFileHeaders()) {
      if (!fileHeader.isDirectory()) {
        let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
        entryName = entryName.replace(/\\/g, '/');
        if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt') txtCount++;
      }
    }
  } finally {
    await archive.close();
  }
  return txtCount;
}

/** 入力ファイルと同じ名前の画像を取得
 * png, jpg, jpeg, webp の順で探す */
async function getSameCoverFileName(srcFile) {
  const dir = path.dirname(srcFile);
  const name = path.basename(srcFile, path.extname(srcFile));
  const basePath = path.join(dir, name);

  const extensions = ["png", "jpg", "jpeg", "webp"];

  for (const ext of extensions) {
    const coverFileName = `${basePath}.${ext}`;
    if (fs.existsSync(coverFileName)) {
      return coverFileName;
    }
  }

  return null;
}