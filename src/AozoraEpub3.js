import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import PropertiesReader from 'properties-reader';
//import { ZipFile } from 'yazl';
import Archive from 'node-unrar-js';
import AozoraEpub3Converter from './converter/AozoraEpub3Converter.js';
import ImageInfoReader from './image/ImageInfoReader.js';
import BookInfo,{getFileTitleCreator} from './info/BookInfo.js';
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
const VERSION = "1.1.1b25Q";
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
const propFileName = "AozoraEpub3.ini";
/** 出力先パス */
let dstPath = null;

//メイン関数　即時関数
(async function main() {
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
    return
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

    if (!fs.existsSync(commandLine.ini)) {
      LogAppender.error(`-i : ini file not exist. ${commandLine.ini}:`);
      return;
    }
  }

  // 出力パス確認
  if (commandLine.dst) {
    if (!fs.existsSync(commandLine.dst)) {
      LogAppender.error(`-d : dst path not exist. ${commandLine.dst}:`);
      return;
    }
  }

  // ePub出力クラス初期化
  let epub3Writer = new Epub3Writer(`${jarPath}template/`);
  //let epub3ImageWriter = new Epub3ImageWriter(`${jarPath}template/`);
  // 設定ファイルの読み込み
  if (commandLine.ini) {
    props = PropertiesReader(commandLine.ini);
    // console.log(props)
  }
  let titleIndex = 0; // 表題

  // コマンドラインオプション以外
  let coverPage = props.get('CoverPage') === '1'; // 表紙追加
  let titlePage = BookInfo.TITLE_NONE;
  if (props.get('TitlePageWrite') === '1') {
    titlePage = parseInt(props.get('TitlePage'));
  }
  let withMarkId = props.get('MarkId') === '1';
  let commentPrint = props.get('CommentPrint') === '1';
  let commentConvert = props.get('CommentConvert') === '1';
  let autoYoko = props.get('AutoYoko') === '1';
  let autoYokoNum1 = props.get('AutoYokoNum1') === '1';
  let autoYokoNum3 = props.get('AutoYokoNum3') === '1';
  let autoYokoEQ1 = props.get('AutoYokoEQ1') === '1';
  let spaceHyp = 0;
  spaceHyp = parseInt(props.get('SpaceHyphenation'));
  let tocPage = props.get('TocPage') === '1'; // 目次追加
  let tocVertical = props.get('TocVertical') === '1'; // 目次縦書き
  let coverPageToc = props.get('CoverPageToc') === '1';
  let removeEmptyLine = 0;
  removeEmptyLine = parseInt(props.get('RemoveEmptyLine'));
  let maxEmptyLine = 0;
  maxEmptyLine = parseInt(props.get('MaxEmptyLine'));
  // 画面サイズと画像リサイズ
  let dispW = 600; dispW = parseInt(props.get("DispW")); 
  let dispH = 800;  dispH = parseInt(props.get("DispH")); 
  let coverW = 600;  coverW = parseInt(props.get("CoverW")); 
  let coverH = 800;  coverH = parseInt(props.get("CoverH")); 

  let resizeW = 0; if ("1" == props.get("ResizeW"))  resizeW = parseInt(props.get("ResizeNumW")); 
  let resizeH = 0; if ("1" == props.get("ResizeH"))  resizeH = parseInt(props.get("ResizeNumH")); 
  let singlePageSizeW = 480;  singlePageSizeW = parseInt(props.get("SinglePageSizeW")); 
  let singlePageSizeH = 640;  singlePageSizeH = parseInt(props.get("SinglePageSizeH")); 
  let singlePageWidth = 600;  singlePageWidth = parseInt(props.get("SinglePageWidth")); 
  let imageScale = 1;  imageScale = parseFloat(props.get("ImageScale")); 
  let imageFloatType = 0;  imageFloatType = parseInt(props.get("ImageFloatType")); 
  let imageFloatW = 0;  imageFloatW = parseInt(props.get("ImageFloatW")); 
  let imageFloatH = 0;  imageFloatH = parseInt(props.get("ImageFloatH")); 
  let imageSizeType = SectionInfo.IMAGE_SIZE_TYPE_HEIGHT;  imageSizeType = parseInt(props.get("ImageSizeType")); 
  let fitImage = "1" == props.get("FitImage");
  let svgImage = "1" == props.get("SvgImage");
  let rotateImage = 0; if ("1" == props.get("RotateImage")) rotateImage = 90; else if ("2" == props.get("RotateImage")) rotateImage = -90;
  let jpegQualty = 0.8;  jpegQualty = parseInt(props.get("JpegQuality")) / 100; 
  let gamma = 1.0; if ("1" == props.get("Gamma"))  gamma = parseFloat(props.get("GammaValue")); 
  let autoMarginLimitH = 0;
  let autoMarginLimitV = 0;
  let autoMarginWhiteLevel = 80;
  let autoMarginPadding = 0;
  let autoMarginNombre = 0;
  let nobreSize = 0.03;
  if ("1" == props.get("AutoMargin")) {
     autoMarginLimitH = parseInt(props.get("AutoMarginLimitH")); 
     autoMarginLimitV = parseInt(props.get("AutoMarginLimitV")); 
     autoMarginWhiteLevel = parseInt(props.get("AutoMarginWhiteLevel"));
     autoMarginPadding = parseFloat(props.get("AutoMarginPadding")); 
     autoMarginNombre = parseInt(props.get("AutoMarginNombre")); 
     autoMarginPadding = parseFloat(props.get("AutoMarginNombreSize")); 
  }
  await epub3Writer.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
    imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
  /*epub3ImageWriter.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
      imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
      */
 
  // 目次階層化設定
  await epub3Writer.setTocParam("1" == (props.get("NavNest")), "1" == (props.get("NcxNest")));

  // スタイル設定
  let pageMargin = [];
  pageMargin = props.get("PageMargin").split(",");
  if (pageMargin.length !== 4) pageMargin = ["0", "0", "0", "0"];
  else {
    let pageMarginUnit = props.get("PageMarginUnit") === "0" ? "em" : "%";
    for (let i = 0; i < 4; i++) { pageMargin[i] += pageMarginUnit; }
  }
  let bodyMargin = [];
  bodyMargin = props.get("BodyMargin").split(",");
  if (bodyMargin.length !== 4) bodyMargin = ["0", "0", "0", "0"];
  else {
    let bodyMarginUnit = props.get("BodyMarginUnit") === "0" ? "em" : "%";
    for (let i = 0; i < 4; i++) { bodyMargin[i] += bodyMarginUnit; }
  }
  let lineHeight = 1.8; lineHeight = parseFloat(props.get("LineHeight"));
  let fontSize = 100; fontSize = parseInt(props.get("FontSize"));
  let boldUseGothic = "1" == (props.get("BoldUseGothic"));
  let gothicUseBold = "1" == (props.get("gothicUseBold"));
  epub3Writer.setStyles(pageMargin, bodyMargin, lineHeight, fontSize, boldUseGothic, gothicUseBold);

  // 自動改ページ
  let forcePageBreakSize = 0;
  let forcePageBreakEmpty = 0;
  let forcePageBreakEmptySize = 0;
  let forcePageBreakChapter = 0;
  let forcePageBreakChapterSize = 0;
  if (props.get("PageBreak") === "1") {
    forcePageBreakSize = parseInt(props.get("PageBreakSize")) * 1024;
    if (props.get("PageBreakEmpty") === "1") {
      forcePageBreakEmpty = parseInt(props.get("PageBreakEmptyLine"));
      forcePageBreakEmptySize = parseInt(props.get("PageBreakEmptySize")) * 1024;
    }
    if (props.get("PageBreakChapter") === "1") {
      forcePageBreakChapter = 1;
      forcePageBreakChapterSize = parseInt(props.get("PageBreakChapterSize")) * 1024;
    }
  }

  let maxLength = 64;
  maxLength = parseInt(props.get("ChapterNameLength"));
  let insertTitleToc = props.get("TitleToc") === "1";
  let chapterExclude = props.get("ChapterExclude") === "1";
  let chapterUseNextLine = props.get("ChapterUseNextLine") === "1";
  let chapterSection = !props.hasOwnProperty("ChapterSection") || props.get("ChapterSection") === "1";
  let chapterH = props.get("ChapterH") === "1";
  let chapterH1 = props.get("ChapterH1") === "1";
  let chapterH2 = props.get("ChapterH2") === "1";
  let chapterH3 = props.get("ChapterH3") === "1";
  let sameLineChapter = props.get("SameLineChapter") === "1";
  let chapterName = props.get("ChapterName") === "1";
  let chapterNumOnly = props.get("ChapterNumOnly") === "1";
  let chapterNumTitle = props.get("ChapterNumTitle") === "1";
  let chapterNumParen = props.get("ChapterNumParen") === "1";
  let chapterNumParenTitle = props.get("ChapterNumParenTitle") === "1";
  let chapterPattern = "";
  if (props.get("ChapterPattern") === "1") chapterPattern = props.get("ChapterPatternText");

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
  if (commandLine.c) coverFileName = commandLine.c;
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

    let ext =path.parse(srcFile).ext.slice(1).toLowerCase();
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
            txtCount = await AozoraEpub3.countZipText(srcFile);
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
       // if (encauto === "SHIFT_JIS") encauto = "MS932";
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

        const titleCreator = getFileTitleCreator(path.basename(srcFile));
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

        const outFile = await getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt);
        await convertFile(
            srcFile, ext, outFile,
            aozoraConverter, writer,
            encType, bookInfo, imageInfoReader, txtIdx
        );
    }
}

})();

 
	/** 出力ファイルを生成 */
  async function getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt) {
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
      const is = await getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx);
      if (is === null) return null;
      // タイトル、画像注記、左右中央注記、目次取得
      
      const src = fs.readFileSync(is, encType)      
     
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
async function  convertFile(srcFile, ext, outFile, aozoraConverter, epubWriter, encType, bookInfo, imageInfoReader, txtIdx) {
try {
  const time = Date.now();
  LogAppender.append('変換開始 : ');
  LogAppender.println(srcFile);

  // 入力Stream再オープン
  let src = null;
  if (!bookInfo.imageOnly) {
    //src = fs.createReadStream(srcFile, { encoding: encType });
    src = fs.createReadStream(srcFile);
  }

  // ePub書き出し srcは中でクローズされる
  await epubWriter.write(aozoraConverter, src, srcFile, ext, outFile, bookInfo, imageInfoReader);

  LogAppender.append(`変換完了[${((Date.now() - time) / 1000).toFixed(1)}s] : `);
  LogAppender.println(outFile.getPath());
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
async function  getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx) {
if (ext === 'txt') {
  return srcFile;
} else if (ext === 'zip' || ext === 'txtz') {
  const zis = new ZipArchiveInputStream(fs.createReadStream(srcFile), 'MS932', false);
  let entry;
  while ((entry = await zis.getNextEntry()) !== null) {
    const entryName = entry.getName();
    if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
      if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
      if (textEntryName) textEntryName[0] = entryName;
      return zis;
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
      const zis = new ZipArchiveInputStream(fs.createReadStream(srcFile), 'MS932', false);
      let entry;
      while ((entry = await zis.getNextEntry()) !== null) {
        const entryName = entry.getName();
        if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
          if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
          const cs = encoding.detect(zis)
          return cs;
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

  /** Zipファイル内のテキストファイルの数を取得 */
 async function countZipText(zipFile) {
    let txtCount = 0;
    const zis = new ZipArchiveInputStream(fs.createReadStream(zipFile), 'MS932', false);
    try {
      let entry;
      while ((entry = await zis.getNextEntry()) !== null) {
        const entryName = entry.getName();
        if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt') txtCount++;
      }
    } finally {
      await zis.close();
    }
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
   * png, jpg, jpegの順で探す  */
  async function getSameCoverFileName(srcFile) {
    let baseFileName = srcFile;
    baseFileName = baseFileName.substring(0, baseFileName.lastIndexOf('.') + 1);
    const extensions = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'Png', 'Jpg', 'Jpeg'];
    for (const ext of extensions) {
      const coverFileName = `${baseFileName}${ext}`;
      if (fs.existsSync(coverFileName)) return coverFileName;
    }
    return null;
  }