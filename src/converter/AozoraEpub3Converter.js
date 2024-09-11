//import { Epub3Writer } from '../writer/Epub3Writer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Epub3Writer from '../writer/Epub3Writer.js';
import PageBreakType from './PageBreakType.js';
import LatinConverter from './LatinConverter.js';
import AozoraGaijiConverter from './AozoraGaijiConverter.js';
import LogAppender from '../util/LogAppender.js';
import BookInfo from '../info/BookInfo.js';
import CharUtils from '../util/CharUtils.js';

export default class AozoraEpub3Converter {
  //---------------- Properties ----------------//
  /** UTF-8以外の文字を代替文字に変換 */
  userAlterCharEscape = false;
  /** 半角2文字の数字と!?を縦横中に変換 */
  autoYoko = true;
  /** 半角数字1桁を自動縦中横 */
  autoYokoNum1 = true;
  /** 半角数字3桁を自動縦中横 */
  autoYokoNum3 = true;
  /** !か?の1文字(前後は全角)を自動縦中横 */
  autoYokoEQ1 = true;
  /** !か?の3文字連続を自動縦中横 */
  autoYokoEQ3 = true;
  /** 英字2文字縦中横 */
  autoAlpha2 = false;
  /** 英数字2文字縦中横 */
  autoAlphaNum2 = false;
  /** ～の注記をルビで表示 */
  chukiRuby = false;
  /** ～の注記を小書きで表示 */
  chukiKogaki = false;

  /** 挿絵無し 外字画像は出力する */
  noIllust = false;

  /** 画像Float表示 単ページ */
  imageFloatPage = false;
  /** 画像Float表示 通常画像 */
  imageFloatBlock = false;

  /** 栞用のidを行頭の<p>につけるならtrue */
  withMarkId = false;

  /** コメントブロックを非表示 */
  commentPrint = false;
  /** コメントブロック内注記変換 */
  commentConvert = false;

  /** 改ページ後を目次に追加 */
  chapterSection = true;

  /** 濁点出力 0=そのまま 1=重ねる 2=フォント利用 */
  dakutenType = 1;

  /** 漢字用IVS(U+FE00-FE0F)を出力 */
  printIvsBMP = false;
  /** 漢字用IVS(U+E0100-E01EF)を出力 */
  printIvsSSP = true;

  /** 奥付を別ページ */
  separateColophon = true;

  /** 文中全角スペース(1文字)の禁則処理
   * 1なら余白付き半角スペース
   * 2なら追い出しのために前の文字の後ろに余白 */
  spaceHyphenation = 0;
  /** 空行除去 連続した空行の行数を減らす */
  removeEmptyLine = 0;
  /** 最大空行制限 */
  maxEmptyLine = Number.MAX_SAFE_INTEGER;
  /** 行頭字下げ */
  forceIndent = false;
  /** 行頭半角スペース除去 */
  removeHeadSpace = false;
  /** 強制改ページが有効ならtrue*/
  forcePageBreak = false;
  /** 強制改ページバイト数 */
  forcePageBreakSize = 0;
  /** 空行でのみ強制改ページ行数 */
  forcePageBreakEmptyLine = 0;
  /** 空行でのみ強制改ページ バイト数 */
  forcePageBreakEmptySize = 0;
  /** 見出しでのみ強制改ページ 階層レベル */
  forcePageBreakChapterLevel = 0;
  /** 見出しでのみ強制改ページ バイト数 */
  forcePageBreakChapterSize = 0;
  /** 強制改行対象の空行後のパターン */
  //Pattern forcePageBreakPattern = null;

  //---------------- Chapter Properties ----------------//
  autoChapterName = false;
  autoChapterNumOnly = false;
  autoChapterNumTitle = false;
  autoChapterNumParen = false;
  autoChapterNumParenTitle = false;

  excludeSeqencialChapter = true;
  /** 次の行の文字列も繋げて目次の見出しにする */
  useNextLineChapterName = true;

  /** 章名の最大文字数 */
  maxChapterNameLength = 64

  /** 目次抽出パターン */;
  chapterPattern;

  canceled = false;

  //---------------- Chapter Infos ----------------//
  //TODO パターンはファイルまたは設定から読み込む
  /** 章の数値文字パターン */
  chapterNumChar = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '０', '１', '２', '３', '４', '５', '６', '７', '８', '９',
    '〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百',
    '壱', '弐', '参', '肆', '伍',
    'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'];
  /** 章番号の後の証明との間の文字 */
  chapterSeparator = [' ', '　', '-', '－', '「', '―', '『', '（'];
  /** 章名数字無し */
  chapterName = ["プロローグ", "エピローグ", "モノローグ", "序", "序章", "序　章", "終章", "終　章", "間章", "間　章", "転章", "転　章", "幕間", "幕　間"];
  /** 章名数字前 suffixのみは空文字 */
  chapterNumPrefix = ["第", "その", ""];
  /** 章名数字後 prefixに対応する複数のsuffixを指定 指定なしなら空文字 */
  chapterNumSuffix = [["話", "章", "篇", "部", "節", "幕", "編"], [""], ["章"]];
  chapterNumParenPrefix = ["（", "〈", "〔", "【"];
  chapterNumParenSuffix = ["）", "〉", "〕", "】"];
  /** 章の注記と目次階層レベル指定 大見出し 中見出し 小見出し 見出し */
  chapterChukiMap = null;

  //---------------- Flags Variables ----------------//
  /** 字下げ 字下げ開始した行番号を入れておく */
  inJisage = -1;
  /** 横組み内 */
  inYoko = false;

  /** 自動縦中横抑止開始 */
  noTcyStart = new Set();
  /** 自動縦中横抑止終了 */
  noTcyEnd = new Set();

  //---------------- パターン ----------------//
  /** 注記パターン */
  chukiPattern = /(［＃.+?］)|(<.+?>)/g;
  /** 外字注記パターン */
  gaijiChukiPattern = /(※［＃.+?］)|(〔.+?〕)|(／"?＼)/g;
  /** 前方参照注記パターン ［＃「○○」は～］ 注記内に注記があったら途中までしかマッチしないので外字変換と除外処理をしておく */
  chukiSufPattern = /［＃「([^］]+)」([^」|^］]+)］/g;
  /** 前方参照注記パターン2 ［＃「○○」に「××」の注記］ */
  chukiSufPattern2 = /［＃「([^］]+)」([^」|^］]*「[^」|^］]+」[^」|^］]*)］/g;
  /** 先頭注記内側のパターン */
  chukiLeftPattern = /^［＃(.+?)］/g;
  /** ファイル名 [著作者] 表題.txt から抽出するパターン */
  fileNamePattern = /\[(.+?)\]( |　)*(.+?)(\(|（|\.)/g;

  //---------------- 変換用テーブル ----------------//
  /** 変換関連が初期化済みならtrue */
  inited = false;

  /** 注記→タグ変換用
   * key=注記文字列 (［＃］除外)
   * value= { 置換文字列, 行末追加文字列 }
   */
  chukiMap = new Map();


  /** 注記フラグ 改行なし key = 注記名 */
  chukiFlagNoBr = new Set();

  /** 注記フラグ 圏点開始 key = 注記名 */
  chukiFlagNoRubyStart = new Set();

  /** 注記フラグ 圏点終了 key = 注記名 */
  chukiFlagNoRubyEnd = new Set();

  /** 注記フラグ 改ページ処理 key = 注記名 */
  chukiFlagPageBreak = new Set();

  /** 注記フラグ 左右中央 key = 注記名 */
  chukiFlagMiddle = new Set();

  /** 注記フラグ ページ左 key = 注記名 */
  chukiFlagBottom = new Set();

  /** 注記フラグ 訓点・返り点 key = 注記名 */
  chukiKunten = new Set();
  /**
   * 注記を返す 画像のみの出力用
   */
  getChukiValue(key) {
    return chukiMap.get(key);
  }

  /** 後述注記→タグ変換用
   * key=注記文字列 (「」内削除)
   * value= { 前タグ, 後タグ } */
  sufChukiMap = new Map();
  chukiPatternMap = new Map();

  /** 文字置換マップ */
  replaceMap = new Map();
  /** 文字置換マップ 2文字用 */
  replace2Map = new Map();

  /** U+FFFF以前の文字の外字フォントパス文字列 */
  utf16FontMap = new Map();
  /** U+20000以降の文字の外字フォントパス文字列 */
  utf32FontMap = new Map();
  /** IVS付きのU+FFFF以前の文字の外字フォントパス文字列 */
  ivs16FontMap = new Map();
  /** IVS付きのU+20000以降の文字の外字フォントパス文字列 */
  ivs32FontMap = new Map();

  /** 「基本ラテン文字のみによる拡張ラテン文字Aの分解表記」の変換クラス */
  latinConverter;
  /** 外字注記タグをUTF-8・グリフタグ・代替文字に変換するクラス */
  gaijiConverter;
  /** Epub圧縮出力用クラス */
  writer;

  ///////////////////////////////
  // 変換前に初期化すること

  /** BookInfo */
  bookInfo;
  /** 縦書き用変換 bookInfo.verticalと同じ */
  vertical;
  /** 現在処理中の行番号 */
  lineNum;

  //セクション毎に初期化
  /** 改ページ後の文字数 */
  pageByteSize;
  /** セクション内の文字数(変換前の注記タグ含む) 空ページチェック用 */
  sectionCharLength;
  /** 栞用ID連番 xhtml内連番 */
  lineIdNum;
  /** タグの階層 */
  tagLevel = 0;
  /** 画像の次の行にキャプション指定有り */
  nextLineIsCaption = false;
  /** キャプション出力中で画像タグが閉じていないならtrue */
  inImageTag = false;

  ////////////////////////////////
  //改ページトリガ ファイル名は入れ替えて利用する
  /** 改ページ通常 */
  pageBreakNormal = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_NONE);

  /** 改ページ左右中央 */
  pageBreakMiddle = new PageBreakType(true, PageBreakType.PAGE_MIDDLE, PageBreakType.IMAGE_PAGE_NONE);

  /** 改ページ左 */
  pageBreakBottom = new PageBreakType(true, PageBreakType.PAGE_BOTTOM, PageBreakType.IMAGE_PAGE_NONE);
  /** 改ページ画像単一ページ サイズに応じて自動調整 */
  pageBreakImageAuto = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_AUTO);
  /** 改ページ画像単一ページ 幅100% */
  pageBreakImageW = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_W);
  /** 改ページ画像単一ページ 高さ100% */
  pageBreakImageH = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_H);
  /** 改ページ画像単一ページ 拡大しない */
  pageBreakImageNoFit = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_NOFIT);
  /** 改ページ「底本：」の前 */
  pageBreakNoChapter = new PageBreakType(true, 0, PageBreakType.IMAGE_PAGE_NONE, true);

  /** 見出し仮対応出力用
 * 章の最初の本文をsetChapterNameでセットしたらtrue */
  //boolean chapterStarted = true;

  /** コンストラクタ
   * 変換テーブルやクラスがstaticで初期化されていなければ初期化
   * @param _msgBuf ログ出力用バッファ
   * @throws IOException */
  constructor(writer, jarPath) {
    this.writer = writer;
    // 初期化されていたら終了
    if (this.inited) return;
    // 拡張ラテン変換
    this.latinConverter = new LatinConverter(jarPath + "chuki_latin.txt");
    this.gaijiConverter = new AozoraGaijiConverter(jarPath);

    // 注記タグ変換
    const chukiTagFile = jarPath + "chuki_tag.txt";
    const src = fs.readFileSync(path.resolve(__dirname, chukiTagFile), 'utf8');
    //  const chukiMap = new Map();
    // const chukiFlagNoBr = new Set();
    // const chukiFlagNoRubyStart = new Set();
    // const chukiFlagNoRubyEnd = new Set();
    // const chukiFlagPageBreak = new Set();
    // const chukiFlagMiddle = new Set();
    // const chukiKunten = new Set();
    // const chukiFlagBottom = new Set();

    const lines = src.split('\n');
    let lineNum = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.charAt(0) !== '#') {
        lineNum++;
        try {
          const values = line.split('\t');
          //タグ取得 3列目は行末タグ
          const tags = (values.length > 2 && values[2].length > 0) ? [values[1], values[2]] : [values[1]];
          this.chukiMap.set(values[0], tags);
          //注記フラグ
          if (values.length > 3 && values[3].length > 0) {
            switch (values[3].charAt(0)) {
              case '1': this.chukiFlagNoBr.add(values[0]); break;
              case '2': this.chukiFlagNoRubyStart.add(values[0]); break;
              case '3': this.chukiFlagNoRubyEnd.add(values[0]); break;
              case 'P': this.chukiFlagPageBreak.add(values[0]); break;
              case 'M': this.chukiFlagPageBreak.add(values[0]); this.chukiFlagMiddle.add(values[0]); break;
              case 'K': this.chukiKunten.add(values[0]); break;
              case 'L': this.chukiFlagPageBreak.add(values[0]); this.chukiFlagBottom.add(values[0]); break;
            }
          }
        } catch (e) {
          LogAppender.error(lineNum, "chuki_tag.txt", line);
        }
      }
    }
    //TODO パターンとprintfのFormatを設定ファイルから読み込みできるようにする (printfの引数の演算処理はフラグで切り替え？)
    // const chukiPatternMap = new Map();
    this.chukiPatternMap.set("折り返し", /^［＃ここから([０-９]+)字下げ、折り返して([０-９]+)字下げ(.*)］/);
    this.chukiPatternMap.set("字下げ字詰め", /^［＃ここから([０-９]+)字下げ、([０-９]+)字詰め.*］/);
    this.chukiPatternMap.set("字下げ複合", /^［＃ここから([０-９]+)字下げ.*］/);
    this.chukiPatternMap.set("字下げ終わり複合", /^［＃ここで字下げ.*終わり/);

    // 前方参照注記
    const chukiSufFilePath = jarPath + 'chuki_tag_suf.txt';
    const chukiSufFileContent = fs.readFileSync(path.resolve(__dirname, chukiSufFilePath), 'utf-8');
    const chukiSufFileLines = chukiSufFileContent.split('\n');
    const sufChukiMap = new Map();

    lineNum = 0;
    for (const line of chukiSufFileLines) {
      lineNum++;
      if (line.length > 0 && line.charAt(0) !== '#') {
        try {
          const values = line.split('\t');
          // タグ取得 3列目は行末タグ
          let tags;
          if (values.length > 2 && values[2].length > 0) {
            tags = [values[1], values[2]];
          } else {
            tags = [values[1]];
          }
          sufChukiMap.set(values[0], tags);
          // 別名
          if (values.length > 3 && values[3].length > 0) {
            sufChukiMap.set(values[3] + values[0], tags);
          }
        } catch (e) {
          console.error(`Error at line ${lineNum} in ${chukiSufFilePath}`, e);
        }
      }
    }
    // 単純文字置換
    const replaceFilePath = jarPath + 'replace.txt';
    if (fs.existsSync(replaceFilePath)) {
      const replaceMap = new Map();
      const replace2Map = new Map();

      const replaceFileContent = fs.readFileSync(path.resolve(__dirname, replaceFilePath), 'utf-8');
      const replaceFileLines = replaceFileContent.split('\n');

      let lineNum = 0;
      for (const line of replaceFileLines) {
        lineNum++;
        if (line.length > 0 && line.charAt(0) !== '#') {
          try {
            const values = line.split('\t');
            if (values[0].length === 1) {
              replaceMap.set(values[0].charAt(0), values[1]);
            } else if (values[0].length === 2) {
              replace2Map.set(values[0], values[1]);
            } else {
              console.error(`Error at line ${lineNum} in ${replaceFilePath}: too long ${line}`);
            }
          } catch (e) {
            console.error(`Error at line ${lineNum} in ${replaceFilePath}`, e);
          }
        }
      }
    }

    // 外字フォント一覧取得
    const gaijiPath = writer.getGaijiFontPath(); // 仮定のパス
    if (fs.existsSync(gaijiPath) && fs.statSync(gaijiPath).isDirectory()) {
      let utf16FontMap = new Map();
      let utf32FontMap = new Map();
      let ivs16FontMap = new Map();
      let ivs32FontMap = new Map();
      let subPath = "";

      const fontFiles = fs.readdirSync(gaijiPath);
      for (const fontFile of fontFiles) {
        const fileName = fontFile.toLowerCase();
        const ext = fileName.substring(fileName.lastIndexOf(".") + 1);

        if (["ttf", "ttc", "otf"].includes(ext)) {
          if (fileName.startsWith("u")) {
            if (fileName.indexOf("-u") > 0) {
              const className = fileName.substring(1, fileName.length - ext.length - 1);
              const strs = className.split("-u");

              if (strs.length > 2) {
                console.warn("IVS以外の合成フォントは対応しません", fontFile);
              } else {
                const codes = [parseInt(strs[0], 16), parseInt(strs[1], 16)];

                if (0xe0100 <= codes[1] && codes[1] <= 0xe01ef) {
                  if (codes[0] < 0xFFFF) {
                    ivs16FontMap.set("u" + className, subPath + fontFile);
                  } else {
                    ivs32FontMap.set("u" + className, subPath + fontFile);
                  }
                } else {
                  console.warn("IVS以外の合成フォントは対応しません", fontFile);
                }
              }
            } else {
              let code = 0;
              try {
                code = parseInt(fileName.substring(1, fileName.length - ext.length - 1), 16);
              } catch (e) { }

              if (code <= 0xFFFF) {
                utf16FontMap.set(code, subPath + fontFile);
              } else {
                utf32FontMap.set(code, subPath + fontFile);
              }
            }
          }
        }
      }

      if (utf16FontMap.size === 0) utf16FontMap = null;
      if (utf32FontMap.size === 0) utf32FontMap = null;
      if (ivs16FontMap.size === 0) ivs16FontMap = null;
      if (ivs32FontMap.size === 0) ivs32FontMap = null;
    }
    AozoraEpub3Converter.inited = true;


    /** 本文があれば改ページするフラグ */
    this.pageBreakTrigger = null; // Assuming PageBreakType is an external dependency

    /** 左右中央の前の空行を除外するフラグ */
    this.skipMiddleEmpty = false;

    /** 改ページ前の空行 */
    this.printEmptyLines = 0;

    /** 直前で見出しが出力された行番号 複数出力防止用 */
    this.lastChapterLine = -1;
  }
  /** 挿絵なし設定 */
  setNoIllust(noIllust) {
    this.noIllust = noIllust;
  }

  /** 画像Float出力 */
  setImageFloat(imageFloatPage, imageFloatBlock) {
    this.imageFloatPage = imageFloatPage;
    this.imageFloatBlock = imageFloatBlock;
  }

  /**  栞用id付きspanの出力設定
   * @param withIdSpan 栞用id付きspanを出力するならtrue */
  setWithMarkId(withIdSpan) {
    this.withMarkId = withIdSpan;
  }

  /**  3文字の半角数字 3文字の!か?の回転を設定
   * @param autoYoko 回転を設定するならtrue */
  setAutoYoko(autoYoko, autoYokoNum1, autoYokoNum3, autoYokoEQ1) {
    this.autoYoko = autoYoko;
    this.autoYokoNum1 = autoYokoNum1;
    this.autoYokoNum3 = autoYokoNum3;
    this.autoYokoEQ1 = autoYokoEQ1;
  }

  /** 文字出力設定
   * @param dakuten 濁点出力設定 0=そのまま 1=重ねる 2=フォント利用 */
  setCharOutput(dakutenType, printIvsBMP, printIvsSSP) {
    this.dakutenType = dakutenType;
    this.printIvsBMP = printIvsBMP;
    this.printIvsSSP = printIvsSSP;
  }

  /** コメント行内出力設定 */
  setCommentPrint(commentPrint, commentConvert) {
    this.commentPrint = commentPrint;
    this.commentConvert = commentConvert;
  }

  /** 空行除去
   * @param maxEmptyLine 空行最大 0なら制限なし */
  setRemoveEmptyLine(removeEmptyLine, maxEmptyLine) {
    this.removeEmptyLine = removeEmptyLine;
    this.maxEmptyLine = maxEmptyLine;
    if (this.maxEmptyLine === 0) this.maxEmptyLine = Number.MAX_SAFE_INTEGER;
  }

  /** 行頭字下げ
   * @param forceIndent */
  setForceIndent(forceIndent) {
    this.forceIndent = forceIndent;
  }

  /** 目次抽出 */
  setChapterLevel(
    maxLength,
    excludeSeqencialChapter,
    useNextLineChapterName,
    section,
    h,
    h1,
    h2,
    h3,
    userSameLineChapter,
    chapterName,
    autoChapterNumOnly,
    autoChapterNumTitle,
    autoChapterNumParen,
    autoChapterNumParenTitle,
    chapterPattern
  ) {
    this.maxChapterNameLength = maxLength;

    this.chapterSection = section;

    if (!this.chapterChukiMap) {
      this.chapterChukiMap = new Map();
    } else {
      this.chapterChukiMap.clear();
    }

    if (h) {
      this.chapterChukiMap.set("ここから見出し", ChapterLineInfo.TYPE_CHUKI_H);
      this.chapterChukiMap.set("見出し", ChapterLineInfo.TYPE_CHUKI_H);
      if (userSameLineChapter) this.chapterChukiMap.set("同行見出し", ChapterLineInfo.TYPE_CHUKI_H);
    }
    if (h1) {
      this.chapterChukiMap.set("ここから大見出し", ChapterLineInfo.TYPE_CHUKI_H1);
      this.chapterChukiMap.set("大見出し", ChapterLineInfo.TYPE_CHUKI_H1);
      if (userSameLineChapter) this.chapterChukiMap.set("同行大見出し", ChapterLineInfo.TYPE_CHUKI_H1);
    }
    if (h2) {
      this.chapterChukiMap.set("ここから中見出し", ChapterLineInfo.TYPE_CHUKI_H2);
      this.chapterChukiMap.set("中見出し", ChapterLineInfo.TYPE_CHUKI_H2);
      if (userSameLineChapter) this.chapterChukiMap.set("同行中見出し", ChapterLineInfo.TYPE_CHUKI_H2);
    }
    if (h3) {
      this.chapterChukiMap.set("ここから小見出し", ChapterLineInfo.TYPE_CHUKI_H3);
      this.chapterChukiMap.set("小見出し", ChapterLineInfo.TYPE_CHUKI_H3);
      if (userSameLineChapter) this.chapterChukiMap.set("同行小見出し", ChapterLineInfo.TYPE_CHUKI_H3);
    }

    this.useNextLineChapterName = useNextLineChapterName;
    this.excludeSeqencialChapter = excludeSeqencialChapter;

    this.autoChapterName = chapterName;
    this.autoChapterNumOnly = autoChapterNumOnly;
    this.autoChapterNumTitle = autoChapterNumTitle;
    this.autoChapterNumParen = autoChapterNumParen;
    this.autoChapterNumParenTitle = autoChapterNumParenTitle;

    this.chapterPattern = null;
    if (chapterPattern !== "") {
      try {
        this.chapterPattern = new RegExp(chapterPattern);
      } catch (e) {
        console.warn("[WARN] 目次抽出のその他パターンが正しくありません: " + chapterPattern);
      }
    }
  }

  getSpaceHyphenation() {
    return this.spaceHyphenation;
  }

  setSpaceHyphenation(type) {
    this.spaceHyphenation = type;
  }

  setChukiRuby(chukiRuby, chukiKogaki) {
    this.chukiRuby = chukiRuby;
    this.chukiKogaki = chukiKogaki;
  }

  /** 自動強制改行設定 */
  setForcePageBreak(forcePageBreakSize, emptyLine, emptySize, chapterLevel, chapterSize) {
    this.forcePageBreakSize = forcePageBreakSize;
    this.forcePageBreakEmptyLine = emptyLine;
    this.forcePageBreakEmptySize = emptySize;
    this.forcePageBreakChapterLevel = chapterLevel;
    this.forcePageBreakChapterSize = chapterSize;
    // this.forcePageBreakPattern = pattern;

    this.forcePageBreak =
      forcePageBreakSize > 0 ||
      (emptyLine > 0 && emptySize > 0) ||
      (chapterLevel > 0 && chapterSize > 0);

    // 行での強制改行は他の改行設定より大きくする
    if (emptyLine > 0) {
      this.forcePageBreakSize = Math.max(this.forcePageBreakSize, emptySize);
    }
    if (chapterLevel > 0) {
      this.forcePageBreakSize = Math.max(this.forcePageBreakSize, chapterSize);
    }
  }

  /** タイトルと著作者を取得. 行番号も保存して出力時に変換出力
   * 章洗濯用に見出しの行もここで取得
   * @param src 青空テキストファイルのReader
   * @param imageInfoReader テキスト内の画像ファイル名を格納して返却
   * @param titleType 表題種別
   * //@param coverFileName 表紙ファイル名 nullなら表紙無し ""は先頭ファイル "*"は同じファイル名 */
  async getBookInfo(srcFile, src, imageInfoReader, titleType, pubFirst) {
    try {
      this.bookInfo = new BookInfo(srcFile);

      let line;
      this.lineNum = -1;
      // 前の行のバッファ [1行前, 2行前]
      const preLines = [null, null];

      // コメントブロック内
      let inComment = false;
      // コメントが始まったらtrue
      let firstCommentStarted = false;

      // 最初のコメント開始行
      let firstCommentLineNum = -1;

      // 先頭行
      const firstLines = new Array(10);
      // 先頭行の開始行番号
      let firstLineStart = -1;

      // タイトルページ開始行 画像等がなければ-1 タイトルなしは-2
      // int preTitlePageBreak = titleType==TitleType.NONE ? -2 : -1;

      // コメント内の行数
      let commentLineNum = 0;
      // コメント開始行
      let commentLineStart = -1;

      // 直線の空行
      let lastEmptyLine = -1;

      // 目次用見出し自動抽出
      const autoChapter =
        this.autoChapterName ||
        this.autoChapterNumTitle ||
        this.autoChapterNumOnly ||
        this.autoChapterNumParen ||
        this.autoChapterNumParenTitle ||
        this.chapterPattern !== null;
      // 改ページ後の目次を追加するならtrue
      let addSectionChapter = true;
      // 見出し注記の後の文字を追加
      let addChapterName = false;
      // 見出しの次の行を繋げるときに見出しの次の行番号を設定
      let addNextChapterName = -1;
      // ブロック見出し注記、次の行を繋げる場合に設定
      let preChapterLineInfo = null;
      // 最後まで回す 
      var lines = src.toString().split('¥n');
      for (let i = 0; i < lines.length; i++) {
        let line =lines[i];
 
     // while ((line = await src.readLine()) !== null) {
        this.lineNum++;
        // 見出し等の取得のため前方参照注記は変換 外字文字は置換
        line = CharUtils.removeSpace(
          this.replaceChukiSufTag(this.convertGaijiChuki(line, true, false))
        );
        // 注記と画像のチェックなので先にルビ除去
        let noRubyLine = CharUtils.removeRuby(line);

        // コメント除外 50文字以上をコメントにする
        if (noRubyLine.startsWith('--------------------------------')) {
          if (!noRubyLine.startsWith('--------------------------------------------------')) {
            LogAppender.warn(this.lineNum, 'コメント行の文字数が足りません');
          } else {
            if (firstCommentLineNum === -1) firstCommentLineNum = this.lineNum;
            // コメントブロックに入ったらタイトル著者終了
            this.firstCommentStarted = true;
            if (this.inComment) {
              // コメント行終了
              if (this.commentLineNum > 20)
                LogAppender.warn(this.lineNum, `コメントが ${this.commentLineNum} 行 (${this.commentLineStart + 1}) -`);
              this.commentLineNum = 0;
              this.inComment = false;
              continue;
            } else {
              if (this.lineNum > 10 && !(this.commentPrint && this.commentConvert))
                LogAppender.warn(this.lineNum, 'コメント開始行が10行目以降にあります');
              // コメント行開始
              this.commentLineStart = this.lineNum;
              this.inComment = true;
              continue;
            }
          }
          if (this.inComment) this.commentLineNum++;
        }

        // 空行チェック
        if (noRubyLine === '' || noRubyLine === ' ' || noRubyLine === '　') {
          this.lastEmptyLine = this.lineNum;
          // 空行なので次の行へ
          continue;
        }

        if (this.inComment && !this.commentPrint) continue;

        // 2行前が改ページと画像の行かをチェックして行番号をbookInfoに保存
        if (!this.noIllust)
          this.checkImageOnly(this.bookInfo, preLines, noRubyLine, this.lineNum);

        // 見出しのChapter追加
        if (this.addChapterName) {
          if (this.preChapterLineInfo === null) this.addChapterName = false; // 前の見出しがなければ中止
          else {
            const name = this.getChapterName(noRubyLine);
            // 字下げ注記等は飛ばして次の行を見る
            if (name.length > 0) {
              this.preChapterLineInfo.setChapterName(name);
              this.preChapterLineInfo.lineNum = this.lineNum;
              this.addChapterName = false;
              // 次の行を繋げる設定
              if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1;
              this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
            }
            // 必ず文字が入る
            this.preChapterLineInfo = null;
          }
        }
// 画像のファイル名の順にimageInfoReaderにファイル名を追加
let m = this.chukiPattern.exec(noRubyLine);
while (m !== null) {
  const chukiTag = m[0];
  const chukiName = chukiTag.substring(2, chukiTag.length - 1);

  if (this.chukiFlagPageBreak.has(chukiName)) {
    // 改ページ注記ならフラグON
    this.addSectionChapter = true;
  } else if (this.chapterChukiMap.has(chukiName)) {
    // 見出し注記
    const chapterType = this.chapterChukiMap.get(chukiName);
    if (noRubyLine.length === m.index + chukiTag.length) {
      this.preChapterLineInfo = {
        lineNum: this.lineNum + 1,
        chapterType: chapterType,
        addSectionChapter: this.addSectionChapter,
        level: ChapterLineInfo.getLevel(chapterType),
        isAfterEmptyLine: this.lastEmptyLine === this.lineNum - 1
      };
      bookInfo.addChapterLineInfo(this.preChapterLineInfo);
      this.addChapterName = true; // 次の行を見出しとして利用
      this.addNextChapterName = -1;
    } else {
      bookInfo.addChapterLineInfo({
        lineNum: this.lineNum,
        chapterType: chapterType,
        addSectionChapter: this.addSectionChapter,
        level: ChapterLineInfo.getLevel(chapterType),
        isAfterEmptyLine: this.lastEmptyLine === this.lineNum - 1,
        chapterName: this.getChapterName(noRubyLine.substring(m.index + chukiTag.length))
      });
      if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1; // 次の行を連結
      this.addChapterName = false; // 次の行を見出しとして利用しない
    }
    this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
  }

  const lowerChukiTag = chukiTag.toLowerCase();
  const imageStartIdx = chukiTag.lastIndexOf('（');
  if (imageStartIdx > -1) {
    const imageEndIdx = chukiTag.indexOf('）', imageStartIdx);
    const imageDotIdx = chukiTag.indexOf('.', imageStartIdx);
    // 訓点送り仮名チェック ＃の次が（で.を含まない
    if (imageDotIdx > -1 && imageDotIdx < imageEndIdx) {
      // 画像ファイル名を取得し画像情報を格納
      const imageFileName = this.getImageChukiFileName(chukiTag, imageStartIdx);
      if (imageFileName !== null) {
        imageInfoReader.addImageFileName(imageFileName);
        if (this.bookInfo.firstImageLineNum === -1) {
          const imageInfo = imageInfoReader.getImageInfo(imageInfoReader.correctExt(imageFileName));
          if (imageInfo && imageInfo.width > 64 && imageInfo.height > 64) {
            this.bookInfo.firstImageLineNum = this.lineNum;
            this.bookInfo.firstImageIdx = imageInfoReader.countImageFileNames() - 1;
          }
        }
      }
    }
  } else if (lowerChukiTag.startsWith('<img')) {
    // src=の値抽出
    const imageFileName = this.getTagAttr(chukiTag, 'src');
    if (imageFileName !== null) {
      imageInfoReader.addImageFileName(imageFileName); // 画像がなければそのまま追加
      if (this.bookInfo.firstImageLineNum === -1) {
        const imageInfo = imageInfoReader.getImageInfo(imageInfoReader.correctExt(imageFileName));
        if (imageInfo && imageInfo.width > 64 && imageInfo.height > 64) {
          this.bookInfo.firstImageLineNum = this.lineNum;
          this.bookInfo.firstImageIdx = imageInfoReader.countImageFileNames() - 1;
        }
      }
    }
  }

  // 次のマッチを探す
  m = this.chukiPattern.exec(noRubyLine);
}

        // 見出し行パターン抽出 パターン抽出時はレベル+10
        // TODO パターンと目次レベルは設定可能にする 空行指定の場合はpreLines利用
        if (this.autoChapter && this.bookInfo.getChapterLevel(this.lineNum) === 0) {
          // 文字列から注記と前の空白を除去
          const noChukiLine = this.removeSpace(this.removeTag(noRubyLine));

          // その他パターン
          if (this.chapterPattern !== null) {
            if (this.chapterPattern.test(noChukiLine)) {
              this.bookInfo.addChapterLineInfo(
                new ChapterLineInfo(
                  this.lineNum,
                  ChapterLineInfo.TYPE_PATTERN,
                  this.addSectionChapter,
                  ChapterLineInfo.getLevel(ChapterLineInfo.TYPE_PATTERN),
                  this.lastEmptyLine === this.lineNum - 1,
                  this.getChapterName(noRubyLine)
                )
              );
              if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1; // 次の行を連結
              this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
            }
          }
          const noChukiLineLength = noChukiLine.length;
          if (this.autoChapterName) {
            let isChapter = false;
            // 数字を含まない章名
            for (let i = 0; i < this.chapterName.length; i++) {
              const prefix = this.chapterName[i];
              if (noChukiLine.startsWith(prefix)) {
                if (noChukiLine.length === prefix.length) {
                  isChapter = true;
                  break;
                } else if (this.isChapterSeparator(noChukiLine.charAt(prefix.length))) {
                  isChapter = true;
                  break;
                }
              }
            }
            // 数字を含む章名
            if (!isChapter) {
              for (let i = 0; i < this.chapterNumPrefix.length; i++) {
                const prefix = this.chapterNumPrefix[i];
                if (noChukiLine.startsWith(prefix)) {
                  let idx = prefix.length;
                  // 次が数字かチェック
                  while (noChukiLineLength > idx && this.isChapterNum(noChukiLine.charAt(idx))) idx++;
                  if (idx <= prefix.length) break; // 数字がなければ抽出しない
                  // 後ろをチェック prefixに対応するsuffixで回す
                  for (const suffix of this.chapterNumSuffix[i]) {
                    if (suffix !== "") {
                      if (noChukiLine.substring(idx).startsWith(suffix)) {
                        idx += suffix.length;
                        if (noChukiLine.length === idx) {
                          isChapter = true;
                          break;
                        } else if (this.isChapterSeparator(noChukiLine.charAt(idx))) {
                          isChapter = true;
                          break;
                        }
                      }
                    } else {
                      if (noChukiLine.length === idx) {
                        isChapter = true;
                        break;
                      } else if (this.isChapterSeparator(noChukiLine.charAt(idx))) {
                        isChapter = true;
                        break;
                      }
                    }
                  }
                }
              }
            }
            if (isChapter) {
              this.bookInfo.addChapterLineInfo(
                new ChapterLineInfo(
                  this.lineNum,
                  ChapterLineInfo.TYPE_CHAPTER_NAME,
                  this.addSectionChapter,
                  ChapterLineInfo.getLevel(ChapterLineInfo.TYPE_CHAPTER_NAME),
                  this.lastEmptyLine === this.lineNum - 1,
                  this.getChapterName(noRubyLine)
                )
              );
              if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1; // 次の行を連結
              this.addChapterName = false; // 次の行を見出しとして利用
              this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
            }
          }
          if (this.autoChapterNumOnly || this.autoChapterNumTitle) {
            // 数字
            let idx = 0;
            while (noChukiLineLength > idx && this.isChapterNum(noChukiLine.charAt(idx))) idx++;
            if (
              (this.autoChapterNumOnly && noChukiLine.length === idx) ||
              (this.autoChapterNumTitle && noChukiLine.length > idx && this.isChapterSeparator(noChukiLine.charAt(idx)))
            ) {
              this.bookInfo.addChapterLineInfo(
                new ChapterLineInfo(
                  this.lineNum,
                  ChapterLineInfo.TYPE_CHAPTER_NUM,
                  this.addSectionChapter,
                  ChapterLineInfo.getLevel(ChapterLineInfo.TYPE_CHAPTER_NUM),
                  this.lastEmptyLine === this.lineNum - 1,
                  this.getChapterName(noRubyLine)
                )
              );
              if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1; // 次の行を連結
              this.addChapterName = false; // 次の行を見出しとして利用しない
              this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
            }
          }
          if (this.autoChapterNumParen || this.autoChapterNumParenTitle) {
            // 括弧内数字のみ
            for (let i = 0; i < this.chapterNumParenPrefix.length; i++) {
              const prefix = this.chapterNumParenPrefix[i];
              if (noChukiLine.startsWith(prefix)) {
                let idx = prefix.length;
                // 次が数字かチェック
                while (noChukiLineLength > idx && this.isChapterNum(noChukiLine.charAt(idx))) idx++;
                if (idx <= prefix.length) break; // 数字がなければ抽出しない
                // 後ろをチェック
                const suffix = this.chapterNumParenSuffix[i];
                if (noChukiLine.substring(idx).startsWith(suffix)) {
                  idx += suffix.length;
                  if (
                    (this.autoChapterNumParen && noChukiLine.length === idx) ||
                    (this.autoChapterNumParenTitle &&
                      noChukiLine.length > idx &&
                      this.isChapterSeparator(noChukiLine.charAt(idx)))
                  ) {
                    this.bookInfo.addChapterLineInfo(
                      new ChapterLineInfo(
                        this.lineNum,
                        ChapterLineInfo.TYPE_CHAPTER_NUM,
                        this.addSectionChapter,
                        13,
                        this.lastEmptyLine === this.lineNum - 1,
                        this.getChapterName(noRubyLine)
                      )
                    );
                    if (this.useNextLineChapterName) this.addNextChapterName = this.lineNum + 1; // 次の行を連結
                    this.addChapterName = false; // 次の行を見出しとして利用しない
                    this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
                  }
                }
              }
            }
          }
        }
        // 改ページ後の注記以外の本文を追加
        if (this.chapterSection && this.addSectionChapter) {
          // 底本：は目次に出さない
          if (
            noRubyLine.length > 2 &&
            noRubyLine.charAt(0) === '底' &&
            noRubyLine.charAt(1) === '本' &&
            noRubyLine.charAt(2) === '：'
          ) {
            this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
          } else {
            // 記号のみの行は無視して次の行へ
            const name = this.getChapterName(noRubyLine);
            if (name.replace(/◇|◆|□|■|▽|▼|☆|★|＊|＋|×|†|　/g, '').length > 0) {
              this.bookInfo.addChapterLineInfo(
                new ChapterLineInfo(
                  lineNum,
                  ChapterLineInfo.TYPE_PAGEBREAK,
                  true,
                  1,
                  lastEmptyLine === lineNum - 1,
                  name
                )
              );
              if (this.useNextLineChapterName) this.addNextChapterName = lineNum + 1;
              this.addSectionChapter = false; // 改ページ後のChapter出力を抑止
            }
          }
        }

        // 見出しの次の行＆見出しでない
        if (this.addNextChapterName === this.lineNum && this.bookInfo.getChapterLineInfo(this.lineNum) === null) {
          // 見出しの次の行を繋げる
          const name = this.getChapterName(noRubyLine);
          if (name.length > 0) {
            const info = this.bookInfo.getChapterLineInfo(lineNum - 1);
            if (info !== null) info.joinChapterName(name);
          }
          this.addNextChapterName = -1;
        }

        // コメント行の後はタイトル取得はしない
        if (!firstCommentStarted) {
          const replaced = CharUtils.getChapterName(noRubyLine, 0);
          if (firstLineStart === -1) {
            // 改ページチェック
            // タイトル前の改ページ位置を保存
            // if (isPageBreakLine(noRubyLine))
            // preTitlePageBreak = lineNum;
            // 文字の行が来たら先頭行開始
            if (replaced.length > 0) {
              firstLineStart = lineNum;
              firstLines[0] = noRubyLine;
            }
          } else {
            // 改ページで終了
            if (this.isPageBreakLine(noRubyLine)) firstCommentStarted = true;
            if (lineNum - firstLineStart > firstLines.length - 1) {
              firstCommentStarted = true;
            } else if (replaced.length > 0) {
              firstLines[lineNum - firstLineStart] = noRubyLine;
            }
          }
        }
        // 前の2行を保存
        preLines[1] = preLines[0];
        preLines[0] = noRubyLine;
      }
      // 行数設定
      this.bookInfo.totalLineNum = this.lineNum;
   
      if (this.inComment) {
        LogAppender.error(this.commentLineStart, "コメントが閉じていません");
      }
      // 表題と著者を先頭行から設定
      this.bookInfo.setMetaInfo(titleType, pubFirst, firstLines, firstLineStart, firstCommentLineNum);
      // this.bookInfo.preTitlePageBreak = preTitlePageBreak; // タイトルがあればタイトル前の改ページ状況を設定

      // タイトルのChapter追加
      if (this.bookInfo.titleLine > -1) {
        const name = this.getChapterName(this.bookInfo.title);
        let chapterLineInfo = this.bookInfo.getChapterLineInfo(this.bookInfo.titleLine);
        if (!chapterLineInfo) {
          this.bookInfo.addChapterLineInfo(
            new ChapterLineInfo(
              this.bookInfo.titleLine,
              ChapterLineInfo.TYPE_TITLE,
              true,
              0,
              false,
              name
            )
          );
        } else {
          chapterLineInfo.type = ChapterLineInfo.TYPE_TITLE;
          chapterLineInfo.level = 0;
        }

        // 1行目がタイトルでなければ除外
        if (this.bookInfo.titleLine > 0) {
          for (let i = this.bookInfo.titleLine - 1; i >= 0; i--) {
            this.bookInfo.removeChapterLineInfo(i);
          }
        }
      }

      if (this.bookInfo.orgTitleLine > 0) this.bookInfo.removeChapterLineInfo(this.bookInfo.orgTitleLine);
      if (this.bookInfo.subTitleLine > 0) this.bookInfo.removeChapterLineInfo(this.bookInfo.subTitleLine);
      if (this.bookInfo.subOrgTitleLine > 0) this.bookInfo.removeChapterLineInfo(this.bookInfo.subOrgTitleLine);

      // 目次ページの見出しを除外
      // 前後2行前と2行後に3つ以上に抽出した見出しがある場合連続する見出しを除去
      if (this.excludeSeqencialChapter) this.bookInfo.excludeTocChapter();

      return this.bookInfo;
    } catch (e) {
      console.error(e);
      LogAppender.error(this.lineNum, "");
      throw e;
    }
  }
  /** 目次やタイトル用の文字列を取得 ルビ関連の文字 ｜《》 は除外済で他の特殊文字は'※'エスケープ */
  getChapterName(line) {
    return CharUtils.getChapterName(line, this.maxChapterNameLength);
  }

  /** 文字が章の数字ならtrue */
  isChapterNum(c) {
    for (const num of this.chapterNumChar) {
      if (c === num) return true;
    }
    return false;
  }

  /** 文字が章の後の区切り文字ならtrue */
  isChapterSeparator(c) {
    for (const sep of this.chapterSeparator) {
      if (c === sep) return true;
    }
    return false;
  }

  /** 改ページのある行か判別 */
  isPageBreakLine(line) {
    const m = this.chukiLeftPattern.exec(line);
    while (m) {
      return this.chukiFlagPageBreak.includes(m[1]);
    }
    return false;
  }

  /** 改ページ処理があったら次のセクションの情報をbookInfoに追加 */
  checkImageOnly(bookInfo, preLines, line, lineNum) {
    // 現在の行が改ページ
    if (preLines[0]==null) return;
    if (line.indexOf('］') <= 3) return;
    const curChuki = line.substring(2, line.indexOf('］')); // 現在行の行頭注記
    if (this.chukiFlagPageBreak.includes(curChuki)) {
      // 2行前の行末が改ページまたは現在行が先頭から2行目
      if (!preLines[1] ||
        (preLines[1].indexOf('］') > 3 && this.chukiFlagPageBreak.includes(preLines[1].substring(preLines[1].lastIndexOf('＃') + 1, preLines[1].length - 1)))
      ) {
        // 1行前が画像
        if (
          (preLines[0].startsWith("［＃") && preLines[0].match(/^［＃.*（.+\..+/) && preLines[0].indexOf('］') === preLines[0].length - 1) ||
          (preLines[0].toLowerCase().startsWith("<img") && preLines[0].indexOf('>') === preLines[0].length - 1)
        ) {
          // 画像単一ページの画像行に設定
          let fileName = null;
          if (preLines[0].toLowerCase().startsWith("<img")) {
            fileName = this.getTagAttr(preLines[0], "src");
          } else {
            fileName = this.getImageChukiFileName(preLines[0], preLines[0].indexOf('（'));
          }
          bookInfo.addImageSectionLine(lineNum - 1, fileName);
        }
      }
    }
  }

  /** タグからattr取得 */
  getTagAttr(tag, attr) {
    const lowerTag = tag.toLowerCase();
    const srcIdx = lowerTag.indexOf(" " + attr + "=");
    if (srcIdx === -1) return null;
    let start = srcIdx + attr.length + 2;
    let end = -1;
    if (lowerTag.charAt(start) === '"') end = lowerTag.indexOf('"', start + 1);
    else if (lowerTag.charAt(start) === '\'') end = lowerTag.indexOf('\'', start + 1);
    if (end === -1) { end = lowerTag.indexOf('>', start); start--; }
    if (end === -1) { end = lowerTag.indexOf(' ', start); start--; }
    if (end !== -1) return tag.substring(start + 1, end).trim();
    return null;
  }

  /** 画像注記にキャプション付きの指定がある場合true */
  hasImageCaption(chukiTag) {
    return chukiTag.indexOf("キャプション付き") > 0;
  }

  /** 画像注記からファイル名取得
   * @param startIdx 画像注記の'（'の位置 */
  getImageChukiFileName(chukiTag, startIdx) {
    let endIdx = chukiTag.indexOf('、', startIdx + 1);
    if (endIdx === -1) endIdx = chukiTag.indexOf('）', startIdx + 1);
    else endIdx = Math.min(endIdx, chukiTag.indexOf('）', startIdx + 1));
    if (startIdx < endIdx) return chukiTag.substring(startIdx + 1, endIdx);
    return null;
  }

  ////////////////////////////////////////////////////////////////
  // 変換処理
  ////////////////////////////////////////////////////////////////

  cancel() {
    this.canceled = true;
  }

  /** 青空テキストをePub3のXHTMLに変換
   * @param out 出力先Writer
   * @param src 入力テキストReader
   * @param bookInfo 事前読み込みで取得したメタ情報他  */

  convertTextToEpub3(out, src, bookInfo) {
    try {
      // ダミー切り替え用
      const orgOut = out;

      this.canceled = false;

      // BookInfoの参照を保持
      this.bookInfo = bookInfo;

      let line;

      ////////////////////////////////
      // 変換開始字のメンバ変数の初期化
      this.pageByteSize = 0;
      this.sectionCharLength = 0;
      this.lineNum = -1;
      this.lineIdNum = 1;
      this.tagLevel = 0;
      this.inJisage = -1;
      // 最初のページの改ページフラグを設定
      this.setPageBreakTrigger(this.pageBreakNormal);
      ////////////////////////////////

      // 直前のtagLevel=0の行
      let lastZeroTagLevelLineNum = -1;

      // タイトル目の画像等をバッファ
      let preTitleBuf = null;

      // コメントブロック内
      let inComment = false;

      // タイトルを出力しない
      let skipTitle = false;
      // バッファ中は画像は処理しない
      let noImage = false;

      // 表題をバッファ処理
      if (
        this.bookInfo.titlePageType === BookInfo.TITLE_NONE ||
        this.bookInfo.titlePageType === BookInfo.TITLE_MIDDLE ||
        this.bookInfo.titlePageType === BookInfo.TITLE_HORIZONTAL
      ) {
        // ページ出力設定
        bookInfo.insertTitlePage = true;
        // 開始位置がタグの中なら次の行へ
        skipTitle = true;
        // outがnullなら改ページと出力はされない
        out = null;
        // バッファ
        preTitleBuf = [];
        noImage = true;
      }

      // 先頭行取得
      line = src.readLine();
      if (line == null) {
        return;
      }
      // BOM除去
      line = CharUtils.removeBOM(line);
      do {
        this.lineNum++;

        if (skipTitle) {
          // タイトル文字行前までバッファ
          if (bookInfo.metaLineStart > this.lineNum) {
            preTitleBuf.push(line);
          }
          // タイトル文字行 前の行のバッファがあれば出力
          if (bookInfo.metaLineStart === this.lineNum && preTitleBuf.length > 0) {
            noImage = false;
            if (lastZeroTagLevelLineNum >= 0) {
              // タイトル行前のtagLevel=0の行以前のバッファを出力
              const lineNumBak = this.lineNum;
              this.pageByteSize = 0;
              this.sectionCharLength = 0;
              this.lineNum = 0;
              this.lineIdNum = 1;
              this.tagLevel = 0;
              this.inJisage = -1;
              let i = 0;
              while (this.lineNum < lineNumBak) {
                // 出力しない行を飛ばす
                if (bookInfo.isIgnoreLine(this.lineNum)) continue;
                if (this.lineNum <= lastZeroTagLevelLineNum)
                  this.convertTextLineToEpub3(orgOut, preTitleBuf[i++], this.lineNum, false, false);
                else
                  this.convertTextLineToEpub3(out, preTitleBuf[i++], this.lineNum, false, false);

                this.lineNum++;
              }
            }
            preTitleBuf.length = 0;
          }
          // タイトルページの改ページ
          if (bookInfo.titleEndLine + 1 === this.lineNum) {
            if (this.tagLevel > 0) bookInfo.titleEndLine++;
            else {
              skipTitle = false;
              // ダミーから戻す
              out = orgOut;
              noImage = false;
              bookInfo.addPageBreakLine(bookInfo.titleEndLine + 1);
            }
          }
        }

        // 改ページ指定行なら改ページフラグ設定 タグ内は次の行へ
        if (bookInfo.isPageBreakLine(this.lineNum) && this.sectionCharLength > 0) {
          // タグの中なら次の行へ
          if (this.tagLevel === 0) this.setPageBreakTrigger(this.pageBreakNormal);
          else bookInfo.addPageBreakLine(this.lineNum + 1);
        }

        // コメント除外
        if (line.startsWith("--------------------------------------------------")) {
          if (this.commentPrint) {
            if (inComment) {
              inComment = false;
            } else {
              inComment = true;
            }
          } else {
            if (inComment) {
              inComment = false;
              continue;
            } else {
              // コメント開始
              inComment = true;
              continue;
            }
          }
        }
        if (inComment) {
          if (this.commentPrint) {
            if (!this.commentConvert) {
              // そのまま出力
              const buf = [];
              const ch = [...line];
              for (let idx = 0; idx < ch.length; idx++) {
                switch (ch[idx]) {
                  case "&":
                    buf.push("&amp;");
                    break;
                  case "<":
                    buf.push("&lt;");
                    break;
                  case ">":
                    buf.push("&gt;");
                    break;
                  default:
                    buf.push(ch[idx]);
                }
              }
              this.printLineBuffer(out, buf.join(""), this.lineNum, false);
              continue;
            }
          } else {
            continue;
          }
        }

        // 出力しない行を飛ばす
        if (bookInfo.isIgnoreLine(this.lineNum)) continue;

        if (this.lineNum === bookInfo.titleLine) {
          this.printLineBuffer(out, chukiMap.get("表題前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("表題後")[0], -1, true);
        } else if (this.lineNum === bookInfo.orgTitleLine) {
          this.printLineBuffer(out, chukiMap.get("原題前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("原題後")[0], -1, true);
        } else if (this.lineNum === bookInfo.subTitleLine) {
          this.printLineBuffer(out, chukiMap.get("副題前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("副題後")[0], -1, true);
        } else if (this.lineNum === bookInfo.subOrgTitleLine) {
          this.printLineBuffer(out, chukiMap.get("副原題前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("副原題後")[0], -1, true);
        } else if (this.lineNum === bookInfo.creatorLine) {
          this.printLineBuffer(out, chukiMap.get("著者前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("著者後")[0], -1, true);
        } else if (this.lineNum === bookInfo.subCreatorLine) {
          this.printLineBuffer(out, chukiMap.get("副著者前")[0], -1, true);
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
          this.printLineBuffer(out, chukiMap.get("副著者後")[0], -1, true);
        } else {
          this.convertTextLineToEpub3(out, line, this.lineNum, false, noImage);
        }
        if (this.canceled) return;
        if (this.writer.jProgressBar != null && this.lineNum % 10 === 0) {
          this.writer.jProgressBar.setValue(this.lineNum / 10);
          this.writer.jProgressBar.repaint();
        }

        if (this.tagLevel === 0) lastZeroTagLevelLineNum = this.lineNum;
      } while ((line = src.readLine()) != null);
    } catch (e) {
      LogAppender.error(this.lineNum, "");
    }
  }
  
	/** 文字列内の外字を変換
	 * ・外字はUTF-16文字列に変換
	 * ・特殊文字のうち※《》｜＃ は文字の前に※をつけてエスケープ
	 * @param line 行文字列
	 * @param escape ※での特殊文字のエスケープをするならtrue
	 * @return 外字変換済の行文字列 
  convertGaijiChuki(line, escape) {
    return this.convertGaijiChuki(line, escape, true);
  }
*/    

  convertGaijiChuki(line, escape, logged) {
    if(logged==null)logged=true
    /*
    ・外字
     ※の場合は外字に変換
     ※［＃「さんずい＋垂」、unicode6DB6］
     ※［＃「さんずい＋垂」、U+6DB6、235-7］
     ※［＃「てへん＋劣」、第3水準1-84-77］
     ※［＃二の字点、1-2-22］
    ・特殊文字
    《　→　※［＃始め二重山括弧、1-1-52］
     》　→　※［＃終わり二重山括弧、1-1-53］
     ［　→　※［＃始め角括弧、1-1-46］
     ］　→　※［＃終わり角括弧、1-1-47］
     〔　→　※［＃始めきっこう（亀甲）括弧、1-1-44］
     〕　→　※［＃終わりきっこう（亀甲）括弧、1-1-45］
     ｜　→　※［＃縦線、1-1-35］
     ＃　→　※［＃井げた、1-1-84］
     ※　→　※［＃米印、1-2-8］
    ・アクセント 〔e'tiquette〕
    ・くの字点 〳〴〵
    */
    let match;
    let begin = 0;
    let chukiStart = 0;
    // 変換後の文字列を出力するバッファ
    let buf = [];
    // 外字が無ければそのまま返却
    if (!this.gaijiChukiPattern.test(line)) return line;
    // 正規表現の再初期化
    this.gaijiChukiPattern.lastIndex = 0;

    while ((match = this.gaijiChukiPattern.exec(line)) !== null) {
    //  for(let i=0;i++;i>1){
    //  match = this.gaijiChukiPattern.exec(line)
      let chuki = match[0];
      chukiStart = match.index;
      buf.push(line.slice(begin, chukiStart));

      // 外字はUTF-8に変換してそのまま継続
      if (chuki.startsWith('※')) {
        let chukiInner = chuki.slice(3, chuki.length - 1);

        // U+のコードのみの注記
        if (chukiInner.startsWith("U+") || chukiInner.startsWith("u+")) {
          let gaiji = this.gaijiConverter.codeToCharString(chukiInner);
          if (gaiji) {
            buf.push(gaiji);
            begin = chukiStart + chuki.length;
            continue;
          }
        }
        // 、の後ろにコードがある場合
        let chukiValues = chukiInner.split("、");
        // 注記文字グリフ or 代替文字変換
        let gaiji = this.gaijiConverter.toAlterString(chukiValues[0]);

        // 注記内なら注記タグは除外
        if (gaiji && this.hasInnerChuki(line, chukiStart)) {
          gaiji = gaiji.replace(this.gaijiChukiPattern, "");
        }

        // コード変換
        if (!gaiji && chukiValues.length > 3) {
          gaiji = this.gaijiConverter.codeToCharString(chukiValues[3]);
        }
        if (!gaiji && chukiValues.length > 2) {
          gaiji = this.gaijiConverter.codeToCharString(chukiValues[2]);
        }
        if (!gaiji && chukiValues.length > 1) {
          gaiji = this.gaijiConverter.codeToCharString(chukiValues[1]);
        }

        // 注記名称で変換
        if (!gaiji) {
          gaiji = this.gaijiConverter.toUtf(chukiValues[0]);
        }

        // 外字注記変換をログに出力
        if (gaiji) {
          if (gaiji.length === 1 && escape) {
            switch (gaiji) {
              case '※': case '》': case '《': case '｜': case '＃':
                buf.push('※');
                break;
            }
          }
          buf.push(gaiji);
          begin = chukiStart + chuki.length;
          continue;
        }

        // 変換不可 画像指定付き外字なら画像注記に変更
        if (this.hasInnerChuki(line, chukiStart)) {
          gaiji = "〓";
          LogAppender.warn(lineNum, "外字注記内に注記があります", chuki);
        } else {
          // 画像指定外字
          let imageStartIdx = chuki.indexOf('（', 2);
          if (imageStartIdx > -1 && chuki.indexOf('.', 2) !== -1) {
             // ※を消して内部処理用画像注記に変更 ［＃（ファイル名）#GAIJI#］
            gaiji = chuki.slice(1, chuki.length - 1) + "#GAIJI#］";
          } else {
            if (logged) console.info(`外字未変換: ${chuki}`);
            gaiji = `〓［＃行右小書き］（${chukiValues[0]}）［＃行右小書き終わり］`;
          }
        }
        buf.push(gaiji);
      } else if (chuki.startsWith('〔')) {
        // 拡張ラテン文字変換
        let inner = chuki.slice(1, chuki.length - 1);
        // 〔の次が半角でなければ〔の中を再度外字変換
        if (!CharUtils.isHalfSpace(inner)) {
          buf.push('〔' + this.convertGaijiChuki(inner, true, logged) + '〕');
        } else {
          buf.push(this.toLatinString(inner));
        }
      } else if (chuki.startsWith('／')) {
        // くの字点
        if (chuki[1] === '″') {
          buf.push("〴");
        } else {
          buf.push("〳");
        }
        buf.push("〵");
      }

      begin = chukiStart + chuki.length;
    }

    // 残りの文字をつなげて返却
    return buf.join('') + line.slice(begin);
  }
  
	/** 注記内かチェック
	 * @param gaijiStart これより前で注記が閉じていないかをチェック */
  hasInnerChuki(line, gaijiStart) {
    let chukiStartCount = 0;
    let end = gaijiStart;
    while ((end = line.lastIndexOf("［＃", end - 1)) !== -1) {
      chukiStartCount++;
    }
    let chukiEndCount = 0;
    end = gaijiStart;
    while ((end = line.lastIndexOf('］', end - 1)) !== -1) {
      chukiEndCount++;
    }
    return chukiStartCount > chukiEndCount;
  }
  	/** 前方参照注記をインライン注記に変換
	 * 重複等の法則が変則すぎるのでバッファを利用
	 * 注記文字変換は2回目に行う
	 * 前にルビがあって｜で始まる場合は｜の前に追加 */
    replaceChukiSufTag(line) {
      //前方参照注記がなければそのまま返却
      if (line.indexOf("［＃「") === -1) return line;
  
      //注記内注記があれば除外
      let buf = [];
      //最初の注記以後は文字判別で入れ子をチェック
      let mTag = /((［＃)|］)/g;
      let mTagEnd = 0;
      let innerTagLevel = 0;
      let innerTagStart = 0;
      let match;
  
      while ((match = mTag.exec(line)) !== null) {
        //注記前まで出力
        if (innerTagLevel <= 1) buf.push(line.slice(mTagEnd, match.index));
        mTagEnd = match.index + match[0].length;
        let tag = match[0];
        if (tag === '］') {
          //注記タグを出力
          if (innerTagLevel <= 1) buf.push(tag);
          else if (innerTagLevel === 2) LogAppender.warn(lineNum, "注記内に注記があります", line.slice(innerTagStart, mTagEnd));
          innerTagLevel--;
        } else {
          innerTagLevel++;
          //注記タグを出力
          if (innerTagLevel <= 1) buf.push(tag);
          else if (innerTagLevel === 2) innerTagStart = match.index;
        }
      }
      //後ろを出力
      buf.push(line.slice(mTagEnd));
      line = buf.join('');
  
      // "［＃「([^］]+)」([^」|^］]+)］"
      let m = this.chukiSufPattern.exec(line);
      if (!m) return line;
  
      let chOffset = 0;
      buf = [line];
      do {
        let target = m[1];
        let chuki = m[2];
        let tags = this.sufChukiMap.get(chuki);
        let chukiTagStart = m.index;
        let chukiTagEnd = m.index + m[0].length;
  
        // 後ろにルビがあったら前に移動して位置を調整
        if (chukiTagEnd < line.length && buf[0].charAt(chukiTagEnd + chOffset) === '《') {
          let rubyEnd = buf[0].indexOf("》", chukiTagEnd + chOffset + 2);
          let ruby = buf[0].slice(chukiTagEnd + chOffset, rubyEnd + 1);
          buf[0] = buf[0].slice(0, chukiTagEnd + chOffset) + buf[0].slice(rubyEnd + 1);
          buf[0] = buf[0].slice(0, chukiTagStart + chOffset) + ruby + buf[0].slice(chukiTagStart + chOffset);
          chukiTagStart += ruby.length;
          chukiTagEnd += ruby.length;
          LogAppender.warn(lineNum, "ルビが注記の後ろにあります", ruby);
        }
  
        if (chuki.endsWith("の注記付き終わり")) {
          //［＃注記付き］○○［＃「××」の注記付き終わり］の例外処理
          buf[0] = buf[0].slice(0, chukiTagStart + chOffset) + "《" + target + "》" + buf[0].slice(chukiTagEnd + chOffset);
          // 前にある［＃注記付き］を｜に置換
          let start = buf[0].lastIndexOf("［＃注記付き］", chukiTagStart + chOffset);
          if (start !== -1) {
            buf[0] = buf[0].slice(0, start + 1) + buf[0].slice(start + 7);
            buf[0] = buf[0].slice(0, start) + '｜' + buf[0].slice(start + 1);
            chOffset -= 6;
          }
          chOffset += target.length + 2 - (chukiTagEnd - chukiTagStart);
        } else if (tags) {
          // 置換済みの文字列で注記追加位置を探す
          let targetStart = this.getTargetStart(buf[0], chukiTagStart, chOffset, CharUtils.removeRuby(target).length);
  
          // 後ろタグ置換
          buf[0] = buf[0].slice(0, chukiTagStart + chOffset) + "［＃" + tags[1] + "］" + buf[0].slice(chukiTagEnd + chOffset);
          // 前タグinsert
          buf[0] = buf[0].slice(0, targetStart) + "［＃" + tags[0] + "］" + buf[0].slice(targetStart);
  
          chOffset += tags[0].length + tags[1].length + 6 - (chukiTagEnd - chukiTagStart);
        }
      } while ((m = this.chukiSufPattern.exec(line)) !== null);
  
      // 注記タグ等を再度変換
      line = buf[0];
      // 「」が2つある注記 「○○」に「××」の注記
      m = this.chukiSufPattern2.exec(line);
      // マッチしなければそのまま返却
      if (!m) return line;
      chOffset = 0;
      do {
        let target = m[1];
        let chuki = m[2];
        let tags = sufChukiMap.get(chuki);
        let targetLength = target.length;
        let chukiTagStart = m.index;
        let chukiTagEnd = m.index + m[0].length;
  
        // 前方参照注記ではない
        if (!tags) {
          if (chuki.endsWith("のルビ") || (chukiRuby && chuki.endsWith("の注記"))) {
            // ルビに変換 ママは除外
            if (chuki.startsWith("に「") && !chuki.startsWith("に「ママ")) {
              // ［＃「青空文庫」に「あおぞらぶんこ」のルビ］
              let targetStart = this.getTargetStart(buf[0], chukiTagStart, chOffset, targetLength);
              // 後ろタグ置換
              buf[0] = buf[0].slice(0, chukiTagStart + chOffset) + "《" + chuki.slice(chuki.indexOf('「') + 1, chuki.indexOf('」')) + "》" + buf[0].slice(chukiTagEnd + chOffset);
              // 前に ｜ insert
              buf[0] = buf[0].slice(0, targetStart) + '｜' + buf[0].slice(targetStart);
              chOffset += chuki.slice(chuki.indexOf('「') + 1, chuki.indexOf('」')).length + 3 - (chukiTagEnd - chukiTagStart);
            }
          } else if (chukiKogaki && chuki.endsWith("の注記")) {
            // 後ろに小書き表示 ママは除外
            if (chuki.startsWith("に「") && !chuki.startsWith("に「ママ")) {
              // ［＃「青空文庫」に「あおぞらぶんこ」の注記］
              let kogaki = "［＃小書き］" + chuki.slice(chuki.indexOf('「') + 1, chuki.indexOf('」')) + "［＃小書き終わり］";
              buf[0] = buf[0].slice(0, chukiTagStart + chOffset) + kogaki + buf[0].slice(chukiTagEnd + chOffset);
              chOffset += kogaki.length - (chukiTagEnd - chukiTagStart);
            }
          }
        }
      } while ((m = chukiSufPattern2.exec(line)) !== null);
  
      // 置換後文字列を返却
      return buf[0];    
    }
	/** 前方参照注記の前タグ挿入位置を取得 */
  getTargetStart(buf, chukiTagStart, chOffset, targetLength) {
    // 置換済みの文字列で注記追加位置を探す
    let idx = chukiTagStart - 1 + chOffset;
    let hasRuby = false;
    let length = 0;
    // 間にあるルビと注記タグは除外 ※※※》等のエスケープをチェックする
    while (targetLength > length && idx >= 0) {
      switch (buf.charAt(idx)) {
        case '》':
          idx--;
          // エスケープ文字
          if (CharUtils.isEscapedChar(buf, idx)) {
            length++;
            break;
          }
          while (idx >= 0 && buf.charAt(idx) !== '《' && !CharUtils.isEscapedChar(buf, idx)) {
            idx--;
          }
          hasRuby = true;
          break;
        case '］':
          idx--;
          // エスケープ文字
          if (CharUtils.isEscapedChar(buf, idx)) {
            length++;
            break;
          }
          while (idx >= 0 && buf.charAt(idx) !== '［' && !CharUtils.isEscapedChar(buf, idx)) {
            idx--;
          }
          break;
        case '｜':
          // エスケープ文字
          if (CharUtils.isEscapedChar(buf, idx)) {
            length++;
          }
          break;
        default:
          length++;
      }
      idx--;
    }
    // ルビがあれば先頭の｜を含める
    if (hasRuby && idx >= 0 && buf.charAt(idx) === '｜') return idx;
    // 一つ戻す
    return idx + 1;
  }

  	/** タイトル用にルビと外字画像注記と縦中横注記(縦書きのみ)のみ変換する
	 * @param line 外字と前方参照注記変換済文字列 */
    convertTitleLineToEpub3(line) {
      let buf = [];
      let ch = Array.from(line);
      let charStart = 0;

      let m = chukiPattern.exec(line);
      let chukiStart = 0;

      while (m !== null) {
          let chukiTag = m[0];
          let lowerChukiTag = chukiTag.toLowerCase();
          chukiStart = m.index;

          // fontの入れ子は可、圏点・縦横中はルビも付加
			//なぜか【＃マッチするので除外
          if (chukiTag.charAt(0) === '＃') {
              m = chukiPattern.exec(line);
              continue;
          }
          // <img </img> <a </a> 以外のタグは注記処理せず本文処理
          if (chukiTag.charAt(0) === '<' &&
              !(lowerChukiTag.startsWith('<img ') || lowerChukiTag.startsWith('</img>') || lowerChukiTag.startsWith('<a ') || lowerChukiTag.startsWith('</a>'))) {
              m = chukiPattern.exec(line);
              continue;
          }

          let chukiName = chukiTag.substring(2, chukiTag.length - 1);

          // 注記の前まで本文出力
          if (charStart < chukiStart) {
              this.convertEscapedText(buf, ch, charStart, chukiStart);
          }

          // 訓点・返り点と縦書き時の縦中横
          if (chukiKunten.includes(chukiName) || (this.vertical && chukiName.startsWith("縦中横"))) {
              // 注記変換
              buf.push(chukiMap.get(chukiName)[0]);
          } else {
              // 外字画像
              let imageStartIdx = chukiTag.lastIndexOf('（');
              if (imageStartIdx > -1) {
                  // 訓点送り仮名チェック ＃の次が（で.を含まない
                  if (imageStartIdx === 2 && chukiTag.endsWith("）］") && chukiTag.indexOf('.', 2) === -1) {
                      buf.push(chukiMap.get("行右小書き")[0]);
                      buf.push(chukiTag.substring(3, chukiTag.length - 2));
                      buf.push(chukiMap.get("行右小書き終わり")[0]);
                  } else if (chukiTag.indexOf('.', 2) === -1) {
                      // 拡張子を含まない

                  } else {
                      // 画像ファイル名置換処理実行
                      let srcFilePath = this.getImageChukiFileName(chukiTag, imageStartIdx);
                      let orient = this.writer.getImageOrientation(srcFilePath);
                      if (srcFilePath !== null) {
                          // 外字の場合 (注記末尾がフラグ文字列になっている)
                          if (chukiTag.endsWith("#GAIJI#］")) {
                              let fileName = this.writer.getImageFilePath(srcFilePath.trim(), -1);
                              switch (orient) {
                                  case 0:
                                      buf.push(chukiMap.get("外字画像")[0].replace("%s", fileName));
                                      break;
                                  case 1:
                                      buf.push(chukiMap.get("横長外字画像")[0].replace("%s", fileName));
                                      break;
                                  case 2:
                                      buf.push(chukiMap.get("縦長外字画像")[0].replace("%s", fileName));
                                      break;
                              }
                          }
                      }
                  }
              }
          }
          // 注記の後ろを文字開始位置に設定
          charStart = chukiStart + chukiTag.length;
          m = chukiPattern.exec(line);
      }
      // 注記の後ろの残りの文字
      if (charStart < ch.length) {
          this.convertEscapedText(buf, ch, charStart, ch.length);
      }

      return this.convertRubyText(buf.join("")).toString();
  }

  	/** 青空テキスト行をePub3のXHTMLで出力
	 * @param out 出力先Writer
	 * @param line 変換前の行文字列
	 * @param noBr 改行を出力しない */
    convertTextLineToEpub3(out, line, lineNum, noBr, noImage) {
      let buf = [];
  
      // 外字変換後に前方参照注記変換
      line = this.replaceChukiSufTag(this.convertGaijiChuki(line, true));
  
      // キャプション指定の画像の場合はすぐにキャプションでなければ画像タグを閉じる
      if (this.nextLineIsCaption) {
        if (!line.startsWith("［＃キャプション］") && !line.startsWith("［＃ここからキャプション］")) {
          LogAppender.warn(lineNum, "画像の次の行にキャプションがありません");
          buf.push(chukiMap.get("画像終わり")[0]);
          buf.push("\n");
          this.inImageTag = false;
        }
      }
  
      this.nextLineIsCaption = false;
  
      let ch = line.split('');
      let charStart = 0;
  
      // 行頭半角スペース除去
      /* if (this.removeHeadSpace && line.length() > begin+1) {
        switch (line.charAt(begin)) {
        case ' ': case ' ': begin++;
        }
      } */
      // 行頭インデント 先頭が「『―（以外 半角空白は除去
      if (this.forceIndent && ch.length > charStart + 1) {
        switch (ch[charStart]) {
          case '　': case '「': case '『':  case '（': case '”': case '〈': case '【': case '〔': case '［': case '※':
            break;
            case ' ': case ' ':
            let c1 = ch[charStart+1];
              if (c1 == ' ' || c1 == ' ' || c1 == '　') charStart++;
              ch[charStart] = '　';
              break;
            default: buf.append('　');
            }
          }
// 割り注開始文字位置
let wrcStart = 0;
// 割り注の改行挿入位置
let wrcBrPos = -1;
// 〔〕or（）を外に出す場合に開始文字が設定されている
let wrcStartChar = 0;

// 窓見出し内 行頭のみ
let inMado = false;
// 行内地付き
// boolean inlineBtm = false;
// 行の後でfloatのクリア
// boolean clearRight = false;
// boolean clearLeft = false;

// aタグが出力されたらtrue
let linkStarted = false;

let bufSuf = new StringBuilder();
// 注記タグ変換
let m = chukiPattern.matcher(line);
let chukiStart = 0;

this.noTcyStart.clear();
this.noTcyEnd.clear();
// 横組み中なら先頭から縦中横抑止
if (inYoko) this.noTcyStart.add(0);
while (m.find()) {
  const chukiTag = m.group();
  const lowerChukiTag = chukiTag.toLowerCase();
  let chukiStart = m.start();

  // fontの入れ子は可、圏点・縦横中はルビも付加
  //なぜか【＃マッチするので除外
  if (chukiTag.charAt(0) === '＃') {
    continue;
  }

  // <img </img> <a </a> 以外のタグは注記処理せず本文処理
  if (
    chukiTag.charAt(0) === '<' &&
    !(
      lowerChukiTag.startsWith('<img ') ||
      lowerChukiTag === '</img>' ||
      lowerChukiTag.startsWith('<a ') ||
      lowerChukiTag === '</a>'
    )
  ) {
    continue;
  }

  // 注記→タグ変換
  const chukiName = chukiTag.substring(2, chukiTag.length - 1);
  const tags = chukiMap.get(chukiName);

  if (wrcStart > 0 && chukiName.endsWith('割り注終わり')) {
    // 〕と）を外に出すかチェック
    let wrcEndChar = 0;
    if (wrcStartChar !== 0) {
      wrcEndChar = ch[chukiStart - 1];
    }

    // 割り注の改行指定があったら改行を挿入
    if (charStart <= wrcBrPos && wrcBrPos <= chukiStart) {
      this.convertEscapedText(buf, ch, charStart, wrcBrPos);
      buf.append(chukiMap.get('改行')[0]);
      this.convertEscapedText(buf, ch, wrcBrPos, chukiStart - (wrcEndChar === 0 ? 0 : 1));
      wrcBrPos = -1;
    } else {
      this.convertEscapedText(buf, ch, charStart, chukiStart - (wrcEndChar === 0 ? 0 : 1));
    }

    // 割り注終わりタグ出力
    buf.append(tags[0]);
    if (wrcEndChar !== 0) buf.append(wrcEndChar);

    // 長さ警告
    if (wrcStart !== -1 && chukiStart - wrcStart > 60) {
      LogAppender.warn(lineNum, '割り注が長すぎます');
    }

    // 割り注終了
    wrcStart = -1;
    wrcStartChar = 0;
    wrcBrPos = -1;

    // continueするのでループの後処理
    // 注記の後ろを文字開始位置に設定
    charStart = chukiStart + chukiTag.length();
    continue;
  }

  // 注記の前まで本文出力
  if (charStart < chukiStart) {
    // 割り注の改行指定があったら改行を挿入
    if (charStart <= wrcBrPos && wrcBrPos <= chukiStart) {
      this.convertEscapedText(buf, ch, charStart, wrcBrPos);
      buf.append(chukiMap.get('改行')[0]);
      this.convertEscapedText(buf, ch, wrcBrPos, chukiStart);
      wrcBrPos = -1;
    } else {
      this.convertEscapedText(buf, ch, charStart, chukiStart);
    }
  }

  // 縦中横抑止
  // 横組みチェック
  if (chukiName.endsWith('横組み')) {
    inYoko = true;
    noTcyStart.add(buf.length());
  } else if (inYoko && chukiName.endsWith('横組み終わり')) {
    inYoko = false;
    noTcyEnd.add(buf.length());
  }

  // 縦中横チェック
  if (!inYoko) {
    if (chukiName.startsWith('縦中横')) {
      if (chukiName.endsWith('終わり')) {
        noTcyEnd.add(buf.length());
      } else {
        noTcyStart.add(buf.length());
      }
    }
  }
  if (tags != null) {
    // タグを出力しないフラグ 字下げや窓見出しエラー用
    let noTagAppend = false;

    ////////////////////////////////////////////////////////////////////
    // 改ページ注記
    ////////////////////////////////////////////////////////////////////
    if (chukiFlagPageBreak.includes(chukiName) && !bookInfo.isNoPageBreakLine(lineNum)) {
      // 字下げ状態エラー出力
      if (inJisage >= 0) {
        LogAppender.warn(inJisage, '字下げ注記省略');
        buf.append(chukiMap.get('字下げ省略')[0]);
        inJisage = -1;
      }

      // 改ページの前に文字があれば出力
      if (buf.length > 0) {
        printLineBuffer(out, this.convertRubyText(buf.toString()), lineNum, true);
        // bufはクリア
        buf.setLength(0);
      }

      noBr = true;
      // 改ページの後ろに文字があれば</br>は出力
      if (ch.length > charStart + chukiTag.length) noBr = false;

      // 改ページフラグ設定
      if (chukiFlagMiddle.includes(chukiName)) {
        // 左右中央
        this.setPageBreakTrigger(pageBreakMiddle);
      } else if (chukiFlagBottom.includes(chukiName)) {
        // ページ左
        this.setPageBreakTrigger(pageBreakBottom);
      } else if (bookInfo.isImageSectionLine(lineNum + 1)) {
        // 次の行が画像単ページの表紙
        if (writer.getImageIndex() === bookInfo.coverImageIndex && bookInfo.insertCoverPage) {
          // 先頭画像で表紙に移動なら改ページしない
          this.setPageBreakTrigger(null);
        } else {
          this.setPageBreakTrigger(pageBreakImageAuto);
          pageBreakImageAuto.srcFileName = bookInfo.getImageSectionFileName(lineNum + 1);
          pageBreakImageAuto.imagePageType = this.writer.getImagePageType(
            this.pageBreakTrigger.srcFileName,
            this.tagLevel,
            lineNum,
            this.hasImageCaption(chukiTag)
          );
        }
      } else {
        this.setPageBreakTrigger(pageBreakNormal);
      }
    }
    ////////////////////////////////////////////////////////////////////

    // 字下げフラグ処理
    else if (chukiName.endsWith('字下げ')) {
      if (inJisage >= 0) {
        LogAppender.warn(inJisage, '字下げ注記省略');
        buf.append(chukiMap.get('字下げ省略')[0]);
        inJisage = -1;
      }
      // タグが閉じていればインラインなのでフラグは立てない
      if (tags.length > 1) inJisage = -1; // インライン
      else inJisage = lineNum; // ブロック開始
    } else if (chukiName.endsWith('字下げ終わり')) {
      if (inJisage === -1) {
        LogAppender.info(lineNum, '字下げ終わり重複');
        noTagAppend = true;
      }
      inJisage = -1;
    }
    // 窓見出しは行頭のみ
    else if (chukiName.startsWith('窓')) {
      // 注記以外の文字があるかチェック
      if (
        !inMado &&
        line
          .substring(0, chukiStart)
          .replace(/［＃[^］]+］/g, '')
          .replace(/^( |　)*$/, '').length > 0
      ) {
        LogAppender.warn(lineNum, '行頭のみ対応: ' + chukiName);
        noTagAppend = true;
      } else {
        if (inMado && chukiName.endsWith('終わり')) {
          inMado = false;
          // clearLeft = true;
        } else inMado = true;
      }
    }
    // 行内地付き Kobo調整中
    /*else if (buf.length() > 0 && chukiName.startsWith("地付き")) {
      if (inlineBtm && (chukiName.endsWith("終わり") || chukiName.endsWith("終り"))) {
        inlineBtm = false;
        chukiName = "行内"+chukiName;
        tags = chukiMap.get(chukiName);
      } else {
        inlineBtm = true;
        clearRight = true;
        chukiName = "行内"+chukiName;
        tags = chukiMap.get(chukiName);
      }
    }*/
    // 割り注開始時
    else if (chukiName.endsWith('割り注')) {
      // 割り注終わりの位置を取得
      wrcStart = chukiStart + chukiTag.length;
      wrcStartChar = 0;
      wrcBrPos = -1;

      let wrcEnd = line.indexOf('［＃割り注終わり］', wrcStart);
      if (wrcEnd === -1) wrcEnd = line.indexOf('［＃ここで割り注終わり］', wrcStart);
      if (wrcEnd === -1) {
        LogAppender.error(lineNum, '割り注終わりなし');
        wrcStart = -1;
      } else {
        // 前後の 〔or（ があるかチェック 割り注注記の前もチェック
        if (chukiStart === 0 || (ch[chukiStart - 1] !== '〔' && ch[chukiStart - 1] !== '（')) {
          if (
            (ch[wrcStart] === '〔' && line.indexOf('〕', wrcStart) === wrcEnd - 1) ||
            (ch[wrcStart] === '（' && line.indexOf('）', wrcStart) === wrcEnd - 1)
          ) {
            wrcStartChar = ch[wrcStart];
            // １文字出力して注記の位置を1文字後ろにずらす
            buf.append(ch[wrcStart]);
            chukiStart++;
          }
        }

        // 改行がなければ追加位置を指定 半角文字は0.5で加算
        // 割り注内の他の注記を除いた文字数を取得 末尾が。かもチェック
        let start = wrcStart + (wrcStartChar === 0 ? 0 : 1);
        let end = wrcEnd - (wrcStartChar === 0 ? 0 : 1);
        if (ch[end] === '。') end--;
        let blength = 0;
        let hasBr = false;
        let inChuki = false;
        let inRuby = false;
        for (let i = start; i < end; i++) {
          if (inChuki) {
            if (ch[i] === '］') inChuki = false;
          } else if (i < end - 1 && ch[i] === '［' && ch[i + 1] === '＃') {
            if (i < end - 4 && ch[i + 2] === '改' && ch[i + 3] === '行' && ch[i + 4] === '］') {
              hasBr = true;
              break;
            }
            inChuki = true;
            i++;
          } else if (inRuby) {
            if (ch[i] === '》') inRuby = false;
          } else if (i < end - 1 && ch[i] === '《') {
            inRuby = true;
          } else {
            if (CharUtils.isHalf(ch[i])) blength++;
            else blength += 2;
          }
        }
        if (!hasBr) {
          let half =Math.ceil(blength / 2.0);
          blength = 0;
          let inChuki = false;
          let inRuby = false;
          for (let i = start; i < end; i++) {
              if (inChuki) {
                  if (ch[i] === '］') inChuki = false;
              } else if (i < end - 1 && ch[i] === '［' && ch[i + 1] === '＃') {
                  inChuki = true;
                  i++;
              } else if (inRuby) {
                  if (ch[i] === '》') inRuby = false;
              } else if (i < end - 1 && ch[i] === '《') {
                  inRuby = true;
              } else {
                  if (blength >= half) {
                      wrcBrPos = i;
                      break;
                  }
                  if (CharUtils.isHalf(ch[i])) blength++;
                  else blength += 2;
              }
          }
          //改行位置を取得 、。は禁則処理する
          if (wrcBrPos > 0 && wrcBrPos < ch.length &&
              (ch[wrcBrPos] === '、' || ch[wrcBrPos] === '。')) wrcBrPos++;
      }
  }
} else if (chukiName.endsWith("キャプション終わり")) {
  if (this.inImageTag) {
      buf.append(chukiMap.get("画像終わり")[0]);
      buf.append("\n");
      this.inImageTag = false;
      noBr = true;
  }
}
//タグ出力
if (!noTagAppend) {
  buf.append(tags[0]);
  //行末で閉じる指定のタグをバッファに追加
  if (tags.length > 1) {
      bufSuf.insert(0, tags[1]);
  }
}
//ブロック注記の改行無しチェック
if (chukiFlagNoBr.contains(chukiName)) noBr = true;
}
else {
  // 画像 (訓点 ［＃（ス）］ は . があるかで判断)
  // ［＃表紙（表紙.jpg）］［＃（表紙.jpg）］［＃「キャプション」のキャプション付きの図（表紙.jpg、横321×縦123）入る）］
  //
  const imageStartIdx = chukiTag.lastIndexOf('（');
  if (imageStartIdx > -1) {
    // 訓点送り仮名チェック ＃の次が（で.を含まない
    if (imageStartIdx === 2 && chukiTag.endsWith("）］") && chukiTag.indexOf('.', 2) === -1) {
      buf.append(chukiMap.get("行右小書き")[0]);
      buf.append(chukiTag.substring(3, chukiTag.length - 2));
      buf.append(chukiMap.get("行右小書き終わり")[0]);
    } else if (chukiTag.indexOf('.', 2) === -1) {
      // 拡張子を含まない
      LogAppender.info(lineNum, "注記未変換", chukiTag);
    } else {
      // ダミー出力時は画像注記は無視
      if (!noImage) {
        // 画像ファイル名置換処理実行
        let srcFilePath = this.getImageChukiFileName(chukiTag, imageStartIdx);
        if (srcFilePath == null) {
          LogAppender.error(lineNum, "注記エラー", chukiTag);
        } else {
          srcFilePath = srcFilePath.trim();
          // 外字のすぐ後ろがルビならルビ開始文字をチェックしてなければ外字の前に｜をつける(1文字のみ対応)
          if (ch.length - 1 > chukiStart + chukiTag.length && ch[chukiStart + chukiTag.length] === '《') {
            let hasRubyStart = false;
            for (let i = chukiStart - 1; i >= 0; i--) {
              if (ch[i] === '｜') {
                hasRubyStart = true;
                i = -1;
              } else if (ch[i] === '》') i = -1;
            }
            if (!hasRubyStart) {
              if (!chukiTag.endsWith("#GAIJI#］")) LogAppender.info(lineNum, "画像にルビ", srcFilePath);
              buf.append('｜');
            }
          }
          // 外字の場合 (注記末尾がフラグ文字列になっている)
          if (chukiTag.endsWith("#GAIJI#］")) {
            const orient = this.writer.getImageOrientation(srcFilePath);
            const imgFileName = writer.getImageFilePath(srcFilePath.trim(), lineNum);
            if (imgFileName != null) {
              switch (orient) {
                case 0:
                  buf.append(String.format(chukiMap.get("外字画像")[0], imgFileName));
                  break;
                case 1:
                  buf.append(String.format(chukiMap.get("横長外字画像")[0], imgFileName));
                  break;
                case 2:
                  buf.append(String.format(chukiMap.get("縦長外字画像")[0], imgFileName));
                  break;
              }
              // ログ出力
              LogAppender.info(lineNum, "外字画像利用", srcFilePath);
            }
          } else {
            if (noIllust && !writer.isCoverImage()) {
              LogAppender.info(lineNum, "挿絵除外", chukiTag);
            } else {
              const dstFileName = writer.getImageFilePath(srcFilePath, lineNum);
              if (dstFileName != null) { // 先頭に移動してここで出力しない場合はnull
                if (bookInfo.isImageSectionLine(lineNum)) noBr = true;
                // 画像注記またはページ出力
                if (this.printImageChuki(out, buf, srcFilePath, dstFileName, this.hasImageCaption(chukiTag), lineNum)) noBr = true;
              }
            }
          }
        }
      }
    }
  } else if (lowerChukiTag.startsWith("<img")) {
    if (noIllust && !writer.isCoverImage()) {
      LogAppender.info(lineNum, "挿絵除外", chukiTag);
    } else {
      // ダミー出力時は画像注記は無視
      if (!noImage) {
        // src=の値抽出
        const srcFilePath = this.getTagAttr(chukiTag, "src");
        if (srcFilePath == null) {
          LogAppender.error(lineNum, "画像注記エラー", chukiTag);
        } else {
          // 単ページ画像の場合は<p>タグを出さない
          const dstFileName = writer.getImageFilePath(srcFilePath.trim(), lineNum);
          if (dstFileName != null) { // 先頭に移動してここで出力しない場合はnull
            if (bookInfo.isImageSectionLine(lineNum)) noBr = true;
            // 画像注記またはページ出力
            if (this.printImageChuki(out, buf, srcFilePath, dstFileName, this.hasImageCaption(chukiTag), lineNum)) noBr = true;
          }
        }
      }
    }
  } else if (lowerChukiTag.startsWith("<a")) {
    if (linkStarted) {
      buf.append("</a>");
    }

    const href = this.getTagAttr(chukiTag, "href");
    if (href != null && (href.startsWith("http") || href.startsWith("#"))) {
      buf.append(chukiTag.replaceAll("&", "&amp;"));
      linkStarted = true;
    } else {
      linkStarted = false;
    }
  } else if (lowerChukiTag === "</a>") {
    if (linkStarted) {
      buf.append(chukiTag);
    }
  } else {
    // インデント字下げ
    let patternMatched = false;
    let m2 = chukiPatternMap.get("折り返し").matcher(chukiTag);
    if (m2.find()) {
      // 字下げフラグ処理
      if (inJisage >= 0) {
        LogAppender.warn(inJisage, "字下げ注記省略");
        buf.append(chukiMap.get("字下げ省略")[0]);
      }
      inJisage = lineNum;

      const arg0 = parseInt(CharUtils.fullToHalf(m2.group(1)));
      const arg1 = parseInt(CharUtils.fullToHalf(m2.group(2)));
      buf.append(chukiMap.get("折り返し1")[0] + arg1);
      buf.append(chukiMap.get("折り返し2")[0] + (arg0 - arg1));
      buf.append(chukiMap.get("折り返し3")[0]);

      noBr = true; // ブロック字下げなので改行なし
      patternMatched = true;
    }
    // インデント字下げ
    if (!patternMatched) {
      m2 = chukiPatternMap.get("字下げ字詰め").matcher(chukiTag);
      if (m2.find()) {
        // 字下げフラグ処理
        if (inJisage >= 0) {
          LogAppender.warn(inJisage, "字下げ注記省略");
          buf.append(chukiMap.get("字下げ省略")[0]);
        }
        inJisage = lineNum;

        const arg0 = parseInt(CharUtils.fullToHalf(m2.group(1)));
        const arg1 = parseInt(CharUtils.fullToHalf(m2.group(2)));
        buf.append(chukiMap.get("字下げ字詰め1")[0] + arg0);
        buf.append(chukiMap.get("字下げ字詰め2")[0] + arg1);
        buf.append(chukiMap.get("字下げ字詰め3")[0]);

        noBr = true; // ブロック字下げなので改行なし
        patternMatched = true;
      }
    }
   					//字下げ複合は字下げの後の複合注記をclassに追加
             if (!patternMatched) {
              m2 = chukiPatternMap.get("字下げ複合").matcher(chukiTag);
              if (m2.find()) {
                //字下げフラグ処理
                if (inJisage >= 0) {
                  LogAppender.warn(inJisage, "字下げ注記省略");
                  buf.append(chukiMap.get("字下げ省略")[0]);
                }
                inJisage = lineNum;
  
                let arg0 = parseInt(CharUtils.fullToHalf(m2.group(1)));
                buf.append(chukiMap.get("字下げ複合1")[0]+arg0);
                //複合注記クラス追加
                if (chukiTag.indexOf("破線罫囲み") > 0) buf.append(" ").append(chukiMap.get("字下げ破線罫囲み")[0]);
                else if (chukiTag.indexOf("罫囲み") > 0) buf.append(" ").append(chukiMap.get("字下げ罫囲み")[0]);
                if (chukiTag.indexOf("破線枠囲み") > 0) buf.append(" ").append(chukiMap.get("字下げ破線枠囲み")[0]);
                else if (chukiTag.indexOf("枠囲み") > 0) buf.append(" ").append(chukiMap.get("字下げ枠囲み")[0]);
                if (chukiTag.indexOf("中央揃え") > 0) buf.append(" ").append(chukiMap.get("字下げ中央揃え")[0]);
                if (chukiTag.indexOf("横書き") > 0) buf.append(" ").append(chukiMap.get("字下げ横書き")[0]);
                //複合字下げclass閉じる
                buf.append(chukiMap.get("字下げ複合2")[0]);
  
                noBr = true;//ブロック字下げなので改行なし
                patternMatched = true;
              }
            }
            //字下げ終わり複合注記
            if (!patternMatched) {
              m2 = chukiPatternMap.get("字下げ終わり複合").matcher(chukiTag);
              if (m2.find()) {
                if (inJisage == -1) LogAppender.error(lineNum, "字下げ注記エラー");
                else buf.append(chukiMap.get("ここで字下げ終わり")[0]);
                inJisage = -1;
  
                noBr = true;
                patternMatched = true;
              }
            }
  
            //注記未変換
            if (!patternMatched) {
              if (chukiTag.indexOf("底本では") == -1 && chukiTag.indexOf("に「ママ」") == -1 && chukiTag.indexOf("」はママ") == -1)
                LogAppender.info(lineNum, "注記未変換", chukiTag);
            }
          }
        }
        //注記の後ろを文字開始位置に設定
        charStart = chukiStart+chukiTag.length();
      		//注記の後ろの残りの文字
          if (charStart < ch.length) {
            this.convertEscapedText(buf, ch, charStart, ch.length);
          }
          //行末タグを追加
          if (bufSuf.length() > 0) buf.append(bufSuf.toString());
      
          //底本：で前が改ページでなければ改ページ追加
          if (separateColophon) {
            if (this.sectionCharLength > 0 && buf.length() > 2 && buf.charAt(0) === '底' && buf.charAt(1) === '本' && buf.charAt(2) === '：') {
              //字下げ状態エラー出力
              if (inJisage >= 0) {
                LogAppender.error(inJisage, "字下げ注記エラー");
              } else {
                this.setPageBreakTrigger(pageBreakNoChapter);
              }
            }
          }
      
          //ルビ変換＋自動縦中横してからバッファを出力
          this.printLineBuffer(out, this.convertRubyText(buf.toString()), lineNum, noBr || this.inImageTag);
      
          //クリア Kobo 調整中
          /*if (clearRight && clearLeft) out.append(chukiMap.get("クリア")[0]);
          else if (clearRight) out.append(chukiMap.get("右クリア")[0]);
          else if (clearLeft) out.append(chukiMap.get("左クリア")[0]);*/
}

  
    }
    	/** 画像タグを出力
	 * @return 単ページ出力ならtrue */
    async printImageChuki(out, buf, srcFileName, dstFileName, hasCaption, lineNum) {
      //サイズを取得して画面サイズとの%を指定
      const imagePageType = this.writer.getImagePageType(srcFileName, this.tagLevel, lineNum, hasCaption);
  
      //サイズを%で指定 倍率指定が無効または画像が小さいなら0
      const ratio = this.writer.getImageWidthRatio(srcFileName, hasCaption);
  
      if (imagePageType === PageBreakType.IMAGE_INLINE_W) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像横")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType === PageBreakType.IMAGE_INLINE_H) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像縦")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType === PageBreakType.IMAGE_INLINE_TOP_W) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像上横")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅上")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType === PageBreakType.IMAGE_INLINE_BOTTOM_W) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像下横")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅下")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType === PageBreakType.IMAGE_INLINE_TOP) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像上")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅上")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType === PageBreakType.IMAGE_INLINE_BOTTOM) {
        if (ratio <= 0) buf.append(`${chukiMap.get("画像下")[0]}${dstFileName}`);
        else buf.append(`${chukiMap.get("画像幅下")[0]}${ratio}${dstFileName}`);
      } else if (imagePageType !== PageBreakType.IMAGE_PAGE_NONE) {
        if (ratio !== -1 && this.imageFloatPage) {
          //単ページfloat表示
          if (imagePageType === PageBreakType.IMAGE_PAGE_W) {
            buf.append(`${chukiMap.get("画像単横浮")[0]}${dstFileName}`);
          } else if (imagePageType === PageBreakType.IMAGE_PAGE_H) {
            buf.append(`${chukiMap.get("画像単縦浮")[0]}${dstFileName}`);
          } else {
            if (ratio <= 0) buf.append(`${chukiMap.get("画像単浮")[0]}${dstFileName}`);
            else buf.append(`${chukiMap.get("画像単幅浮")[0]}${ratio}${dstFileName}`);
          }
        } else {
          //単ページ出力 タグの外のみ
          //改ページの前に文字があれば前のページに出力
          if (buf.length > 0) await this.printLineBuffer(out, buf, lineNum, true);
          buf.append(`${chukiMap.get("画像")[0]}${dstFileName}`);
          buf.append(chukiMap.get("画像終わり")[0]);
          //単ページ出力
          await this.printImagePage(out, buf, lineNum, srcFileName, dstFileName, imagePageType);
          return true;
        }
      } else {
        if (ratio !== -1 && imageFloatBlock) {
          //画像float表示
          if (ratio <= 0) buf.append(`${chukiMap.get("画像浮")[0]}${dstFileName}`);
          else buf.append(`${chukiMap.get("画像幅浮")[0]}${ratio}${dstFileName}`);
        } else {
          //画像通常表示
          if (ratio <= 0) buf.append(`${chukiMap.get("画像")[0]}${dstFileName}`);
          else buf.append(`${chukiMap.get("画像幅")[0]}${ratio}${dstFileName}`);
        }
      }
      //キャプショがある場合はタグを閉じない
      if (hasCaption) {
        this.inImageTag = true;
        this.nextLineIsCaption = true;
      } else {
        buf.append(chukiMap.get("画像終わり")[0]);
      }
      return false;
    }
	/** 注記で分割された文字列単位でエスケープ処理を行う
	 * <>&のエスケープと《》置換、IVSや不正な文字を除去して文字列を出力バッファに出力
	 * ルビ変換前に呼び出す */
	convertEscapedText(buf, ch, begin, end) {
		//先頭にあるIVSは除去
		switch (ch[begin]) {
			case 0xDB40:
				begin += 2;
				LogAppender.warn(lineNum, "先頭にあるIVSを除去します");
				break;
			case 0xFE00: case 0xFE01: case 0xFE02: case 0xFE03: case 0xFE04: case 0xFE05: case 0xFE06: case 0xFE07:
			case 0xFE08: case 0xFE09: case 0xFE0A: case 0xFE0B: case 0xFE0C: case 0xFE0D: case 0xFE0E: case 0xFE0F:
				begin++;
				LogAppender.warn(lineNum, "先頭にあるIVSを除去します");
				break;
		}

		//事前に《,》の代替文字をエスケープ済※《,※》 に変換
		for (let i = begin + 1; i < end; i++) {
			switch (ch[i]) {
				case '<':
					if (ch[i - 1] === '<' && (i === begin + 1 || ch[i - 2] !== '<') && (end - 1 === i || ch[i + 1] !== '<')) {
						ch[i - 1] = '※'; ch[i] = '《';
					}
					break;
				case '>':
					if (ch[i - 1] === '>' && (i === begin + 1 || ch[i - 2] !== '>') && (end - 1 === i || ch[i + 1] !== '>')) {
						ch[i - 1] = '※'; ch[i] = '》';
					}
					break;
				case '＜':
					if (ch[i - 1] === '＜' && (i === begin + 1 || ch[i - 2] !== '＜') && (end - 1 === i || ch[i + 1] !== '＜')) {
						ch[i - 1] = '※'; ch[i] = '《';
					}
					break;
				case '＞':
					if (ch[i - 1] === '＞' && (i === begin + 1 || ch[i - 2] !== '＞') && (end - 1 === i || ch[i + 1] !== '＞')) {
						ch[i - 1] = '※'; ch[i] = '》';
					}
					break;
				//濁点半濁点の結合文字は通常の文字に変換 半角は横書きの場合があるのでそのまま
				case '゙': ch[i] = '゛'; break;
				case '゚': ch[i] = '゜'; break;
			}
		}
		//NULLは除去
		for (let idx = begin; idx < end; idx++) {
			switch (ch[idx]) {
				case '\0':
					break;
				case '&': buf.append("&amp;"); break;
				case '<': buf.append("&lt;"); break;
				case '>': buf.append("&gt;"); break;
				default:
					buf.append(ch[idx]);
			}
		}
	}
  	/** ルビタグに変換して出力
	 * 特殊文字は※が前についているので※｜※《※》はルビ処理しない
	 * ・ルビ （前｜漢字《かんじ》 → 前<ruby>漢字<rt>かんじ</rt></ruby>）
	 * ・</ruby><ruby> と連続する場合はタグを除去
	 * //@param buf 出力先バッファ
	 * //@param ch ルビ変換前の行文字列 */
   convertRubyText(line) {
		let buf = new StringBuilder();
		let ch = Array.from(line);

		let begin = 0;
		let end = ch.length;
		let noRuby = false;

		// ルビと文字変換
		let rubyStart = -1; // ルビ開始位置
		let rubyTopStart = -1; // ぶりがな開始位置
		let inRuby = false;
		// let isAlphaRuby = false; // 英字へのルビ
		let rubyCharType = RubyCharType.NULL;

		let rubyStartChuki = chukiMap.get("ルビ開始")[0];
		let rubyEndChuki = chukiMap.get("ルビ終了")[0];

		let noTcy = false;
		let noTcyPre = noTcy;
		for (let i = begin; i < end; i++) {

			// 縦中横と横書きの中かチェック
			if (!noTcy && noTcyStart.includes(i)) {
				// 未処理の文字列が残っていないなら noTcy と同じ値を設定。残っているなら noTcy の値を保存。
				noTcyPre = (rubyStart === -1) ? true : noTcy;
				noTcy = true;
			} else if (noTcy && noTcyEnd.includes(i)) {
				// 未処理の文字列が残っていないなら noTcy と同じ値を設定。残っているなら noTcy の値を保存。
				noTcyPre = (rubyStart === -1) ? false : noTcy;
				noTcy = false;
			}
			console.assert(rubyStart !== -1 || noTcyPre === noTcy);

			switch (ch[i]) {
				case '｜':
					// エスケープ文字なら処理しない
					if (!CharUtils.isEscapedChar(ch, i)) {
						// 前まで出力
						if (rubyStart !== -1) this.convertTcyText(buf, ch, rubyStart, i, noTcy);
						rubyStart = i + 1;
						noTcyPre = noTcy;
						inRuby = true;
					}
					break;
				case '《':
					// エスケープ文字なら処理しない
					if (!CharUtils.isEscapedChar(ch, i)) {
						inRuby = true;
						rubyTopStart = i;
					}
					break;
			}

			// ルビ内ならルビの最後でrubyタグ出力
			if (inRuby) {
				// ルビ終わり エスケープ文字なら処理しない
				if (ch[i] === '》' && !CharUtils.isEscapedChar(ch, i)) {
					if (rubyStart !== -1 && rubyTopStart !== -1) {
						if (noRuby) {
							this.convertTcyText(buf, ch, rubyStart, rubyTopStart, noTcy); // 本文
						} else {
							// 長すぎるルビを警告
							if (rubyTopStart - rubyStart >= 30) {
								// タグは除去 面倒なので文字列で置換
								if (line.substring(rubyStart, rubyTopStart).replaceAll("<[^>]+>", " ").length >= 30) {
									LogAppender.warn(lineNum, "ルビが長すぎます");
								}
							}
							// 同じ長さで同じ文字なら一文字づつルビを振る
							if (rubyTopStart - rubyStart === i - rubyTopStart - 1 && CharUtils.isSameChars(ch, rubyTopStart + 1, i)) {
								if (buf.lastIndexOf(rubyEndChuki) !== buf.length - rubyEndChuki.length) {
									buf.append(rubyStartChuki);
								} else {
									buf.setLength(buf.length - rubyEndChuki.length);
								}
								for (let j = 0; j < rubyTopStart - rubyStart; j++) {
									this.convertReplacedChar(buf, ch, rubyStart + j, noTcy); // 本文
									buf.append(chukiMap.get("ルビ前")[0]);
									this.convertReplacedChar(buf, ch, rubyTopStart + 1 + j, true); // ルビ
									buf.append(chukiMap.get("ルビ後")[0]);
								}
								buf.append(rubyEndChuki);
							} else {
								if (buf.lastIndexOf(rubyEndChuki) !== buf.length - rubyEndChuki.length) {
									buf.append(rubyStartChuki);
								} else {
									buf.setLength(buf.length - rubyEndChuki.length);
								}
								this.convertTcyText(buf, ch, rubyStart, rubyTopStart, noTcy); // 本文
								buf.append(chukiMap.get("ルビ前")[0]);
								this.convertTcyText(buf, ch, rubyTopStart + 1, i, true); // ルビ
								buf.append(chukiMap.get("ルビ後")[0]);
								buf.append(rubyEndChuki);
							}
						}
					}
					if (rubyStart === -1 && !noRuby) {
						LogAppender.warn(lineNum, "ルビ開始文字無し");
					}
					inRuby = false;
					rubyStart = -1;
					noTcyPre = noTcy;
					rubyTopStart = -1;
				}
			} else {
				// ルビ開始位置チェック
				if (rubyStart !== -1) {
					// ルビ開始チェック中で漢字以外または英字以外ならキャンセルして出力
					let charTypeChanged = false;
					switch (rubyCharType) {
						case RubyCharType.ALPHA:
							if (!CharUtils.isHalfSpace(ch[i]) || ch[i] === '>') charTypeChanged = true;
							break;
						case RubyCharType.FULLALPHA:
							if (!(CharUtils.isFullAlpha(ch[i]) || CharUtils.isFullNum(ch[i]))) charTypeChanged = true;
							break;
						case RubyCharType.KANJI:
							if (!CharUtils.isKanji(ch, i)) charTypeChanged = true;
							break;
						case RubyCharType.HIRAGANA:
							if (!CharUtils.isHiragana(ch[i])) charTypeChanged = true;
							break;
						case RubyCharType.KATAKANA:
							if (!CharUtils.isKatakana(ch[i])) charTypeChanged = true;
							break;
						default:
					}
					if (charTypeChanged) {
						// rubyStartから前までを出力
						this.convertTcyText(buf, ch, rubyStart, i, noTcyPre);
						rubyStart = -1;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.NULL;
					}
				}
				// ルビが終了したか開始されていない
				if (rubyStart === -1) {
					// ルビ中でなく漢字
					if (CharUtils.isKanji(ch, i)) {
						rubyStart = i;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.KANJI;
					} else if (CharUtils.isHiragana(ch[i])) {
						// ひらがな
						rubyStart = i;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.HIRAGANA;
					} else if (CharUtils.isKatakana(ch[i])) {
						// カタカナ
						rubyStart = i;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.KATAKANA;
					} else if (CharUtils.isHalfSpace(ch[i]) && ch[i] !== '>') {
						// 英数字または空白
						rubyStart = i;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.ALPHA;
					} else if (CharUtils.isFullAlpha(ch[i]) || CharUtils.isFullNum(ch[i])) {
						// 全角英数字
						rubyStart = i;
						noTcyPre = noTcy;
						rubyCharType = RubyCharType.FULLALPHA;
					}
					// ルビ中でなく漢字、半角以外は出力 数字と!?は英字扱いになっている
					else {
						this.convertReplacedChar(buf, ch, i, noTcy);
						rubyCharType = RubyCharType.NULL;
					}
				}
			}
		}
		if (rubyStart !== -1) {
			// ルビ開始チェック中で漢字以外ならキャンセルして出力
			this.convertTcyText(buf, ch, rubyStart, end, noTcy);
		}

		return buf;
	}
  
	/** ルビ変換 外部呼び出し用 */
  convertTcyText(text) {
    const buf = [];
    this.convertTcyTextHelper(buf, text.split(''), 0, text.length, false);
    return buf.join('');
  }

  /** １文字フォント用タグを出力 */
  printGlyphFontTag(buf, gaijiFileName, className, baseChar) {
    const gaijiFilePath = `${this.writer.getGaijiFontPath()}${gaijiFileName}`;
    const gaijiFileExists = this.checkIfFileExists(gaijiFilePath);
    if (!gaijiFileExists) return false;

    this.writer.addGaijiFont(className, gaijiFilePath);
    buf.push(`<span class="glyph ${className}">${baseChar}</span>`);
    return true;
  }
  
	/** 縦中横変換してbufに出力
	 * 1文字フォントがある場合もここで出力 */
  async convertTcyText(buf, ch, begin, end, noTcy) {
    for (let i = begin; i < end; i++) {

      let gaijiFileName = null;
      // 4バイト文字
      if (i < end - 1 && this.isHighSurrogate(ch[i])) {
        // 文字コード
        const code = this.toCodePoint(ch[i], ch[i + 1]);
        // TODO 非対応文字チェック

        // 4バイト文字＋IVS(U+E0100～)
        if (i < end - 3 && ch[i + 2] === 0xDB40) {
          const ivsCode = code.toString(16);
          if (this.ivs32FontMap) {
            const className = `u${code.toString(16)}-u${ivsCode}`;
            gaijiFileName = this.ivs32FontMap.get(className);
            if (gaijiFileName) {
              // フォントファイルを出力対象に追加して外字タグ出力
              if (this.printGlyphFontTag(buf, gaijiFileName, className, '〓')) {
                this.logInfo("外字フォント利用(IVS含む)", `${ch[i]}${ch[i + 1]}${ch[i + 2]}${ch[i + 3]}(${gaijiFileName})`);
                i += 3; // IVSの次へ
                continue;
              }
            }
          }
          if (this.utf32FontMap) {
            // 1文字フォントの後ろにIVSがあるかチェック
            gaijiFileName = this.utf32FontMap.get(code);
            if (gaijiFileName) {
              if (this.printGlyphFontTag(buf, gaijiFileName, `u${code.toString(16)}`, '〓')) {
                this.logWarn("外字フォント利用(IVS除外)", `${ch[i]}${ch[i + 1]}(${gaijiFileName}) -${ivsCode}`);
                i += 3; // IVSの次へ
                continue;
              }
            }
          }
          // 4バイト文字とIVSを出力
          /*if (!gaiji32) {
						//4バイト文字を出力しない
						buf.append("〓");
						i+=3; //IVSの次へ
						LogAppender.info(lineNum, "4バイト文字とIVSを除外", "-"+ch[i]+ch[i+1]+"("+Integer.toHexString(code)+"+"+ivsCode+")");
						continue;
					}*/
          if (this.printIvsSSP) {
            if (this.vertical) buf.append(this.chukiMap.get("正立")[0]);
            buf.append(ch[i]);
            buf.append(ch[i + 1]);
            buf.append(ch[i + 2]);
            buf.append(ch[i + 3]);
            if (this.vertical) buf.append(this.chukiMap.get("正立終わり")[0]);
            this.logInfo("拡張漢字＋IVSを出力します", `${ch[i]}${ch[i + 1]}${ch[i + 2]}${ch[i + 3]}(u+${code.toString(16)}+${ivsCode})`);
          } else {
            buf.append(ch[i]);
            buf.append(ch[i + 1]);
            this.logInfo("拡張漢字出力(IVS除外)", `${ch[i]}${ch[i + 1]}(u+${code.toString(16)}) -${ivsCode}`);
          }
          i += 3; // IVSの次へ
          continue;
        }
        // 4バイト文字＋IVS(U+FE00～)
        if (i < end - 2 && ch[i + 2] >= 0xFE00 && ch[i + 2] <= 0xFE0F) {
          if (this.ivs32FontMap) {
            const className = `u${code.toString(16)}-u${ch[i + 2].toString(16)}`;
            gaijiFileName = this.ivs32FontMap.get(className);
            if (gaijiFileName) {
              // フォントファイルを出力対象に追加して外字タグ出力
              if (this.printGlyphFontTag(buf, gaijiFileName, className, '〓')) {
                this.logInfo("外字フォント利用(IVS含む)", `${ch[i]}${ch[i + 1]}${ch[i + 2]}(${gaijiFileName})`);
                i += 2; // IVSの次へ
                continue;
              }
            }
          }
          // 4バイト文字とIVSを出力
          					/*if (!gaiji32) {
						//4バイト文字を出力しない
						buf.append("〓");
						i+=2; //IVSの次へ
						LogAppender.info(lineNum, "4バイト文字とIVSを除外", "-"+ch[i]+ch[i+1]+"("+Integer.toHexString(code)+"+"+(Integer.toHexString(ch[i+2]))+")");
						continue;
					}*/
          if (this.printIvsBMP) {
            if (this.vertical) buf.append(this.chukiMap.get("正立")[0]);
            buf.append(ch[i]);
            buf.append(ch[i + 1]);
            buf.append(ch[i + 2]);
            if (this.vertical) buf.append(this.chukiMap.get("正立終わり")[0]);
            this.logInfo("拡張漢字＋IVSを出力します", `${ch[i]}${ch[i + 1]}${ch[i + 2]}(u+${code.toString(16)}+${ch[i + 2].toString(16)})`);
          } else {
            buf.append(ch[i]);
            buf.append(ch[i + 1]);
            this.logInfo("拡張漢字出力(IVS除外)", `${ch[i]}${ch[i + 1]}(u+${code.toString(16)}) -${ch[i + 2].toString(16)}`);
          }
          i += 2; // IVSの次へ
          continue;
        }
        // IVSなし１文字フォントあり
        if (this.utf32FontMap) {
          gaijiFileName = this.utf32FontMap.get(code);
          if (gaijiFileName) {
            if (this.printGlyphFontTag(buf, gaijiFileName, `u${code.toString(16)}`, '〓')) {
              this.logInfo("外字フォント利用", `${ch[i]}${ch[i + 1]}(${gaijiFileName})`);
              i++; // 次の文字へ
              continue;
            }
          }
        }
        // 通常の4バイト文字
				/*if (!gaiji32) {
					//4バイト文字を出力しない
					buf.append("〓");
				} else {*/
        buf.append(ch[i]);
        buf.append(ch[i + 1]);
        this.logInfo("拡張漢字出力", `${ch[i]}${ch[i + 1]}(u+${code.toString(16)})`);
        i++; // 次の文字へ
        continue;
      }

      // 2バイト文字 U+FFFF以下
      // TODO 非対応文字チェック

      // 2バイト文字＋IVS(U+E0100～)
      if (i < end - 2 && ch[i + 1] === 0xDB40) {
        const ivsCode = this.toCodePoint(ch[i + 1], ch[i + 2]).toString(16);
        if (this.ivs16FontMap) {
          const className = `u${ch[i].toString(16)}-u${ivsCode}`;
          gaijiFileName = this.ivs16FontMap.get(className);
          if (gaijiFileName) {
            if (this.printGlyphFontTag(buf, gaijiFileName, className, '〓')) {
              this.logInfo("外字フォント利用(IVS含む)", `${ch[i]}${ch[i + 1]}${ch[i + 2]}(${gaijiFileName})`);
              i += 2; // IVSの次へ
              continue;
            }
          }
        }
        if (this.utf16FontMap && this.utf16FontMap.has(ch[i])) {
          gaijiFileName = this.utf16FontMap.get(ch[i]);
          if (gaijiFileName) {
            if (this.printGlyphFontTag(buf, gaijiFileName, `u${ch[i].toString(16)}`, '〓')) {
              this.logWarn("外字フォント利用(IVS除外)", `${ch[i]}(${gaijiFileName}) -${ivsCode}`);
              i += 2; // IVSの次へ
              continue;
            }
          }
        }
        // 2バイト文字とIVSを出力
        if (this.printIvsSSP) {
          if (this.vertical) buf.append(this.chukiMap.get("正立")[0]);
          buf.append(ch[i]);
          buf.append(ch[i + 1]);
          buf.append(ch[i + 2]);
          if (this.vertical) buf.append(this.chukiMap.get("正立終わり")[0]);
          this.logInfo("IVSを出力します", `${ch[i]}${ch[i + 1]}${ch[i + 2]}(u+${ch[i].toString(16)}+${ivsCode})`);
        } else {
          buf.append(ch[i]);
          this.logInfo("IVS除外", `${ch[i]}(u+${ch[i].toString(16)}) -${ivsCode}`);
        }
        i += 2; // IVSの次へ
        continue;
      }
     
      // 2バイト文字＋IVS(U+FE00～)
      if (i < end - 1 && ch[i + 1] >= 0xFE00 && ch[i + 1] <= 0xFE0F) {
        if (this.ivs32FontMap != null) {
          const className = "u" + ch[i].toString(16) + "-u" + ch[i + 1].toString(16);
          gaijiFileName = this.ivs32FontMap.get(className);
          if (gaijiFileName != null) {
            if (this.printGlyphFontTag(buf, gaijiFileName, className, "〓")) {
              LogAppender.info(this.lineNum, "外字フォント利用(IVS含む)", "" + ch[i] + "(" + gaijiFileName + ")");
              i++; // IVSの次へ
              continue;
            }
          }
        }
        // IVS無しの1文字フォント
        if (this.utf16FontMap != null && this.utf16FontMap.has(ch[i])) {
          gaijiFileName = this.utf16FontMap.get(ch[i]);
          if (gaijiFileName != null) {
            if (this.printGlyphFontTag(buf, gaijiFileName, "u" + ch[i].toString(16), "〓")) {
              LogAppender.info(this.lineNum, "外字フォント利用(IVS除外)", "" + ch[i] + "(" + gaijiFileName + ") -" + ch[i + 1].toString(16));
              i++; // IVSの次へ
              continue;
            }
          }
        }

        // 2バイト文字とIVSを出力
        if (this.printIvsBMP) {
          buf.append(ch[i]);
          buf.append(ch[i + 1]);
          LogAppender.info(this.lineNum, "IVSを出力します", "" + ch[i] + ch[i + 1] + "(u+" + ch[i].toString(16) + "+" + ch[i + 1].toString(16) + ")");
        } else {
          buf.append(ch[i]);
          LogAppender.info(this.lineNum, "IVS除外", ch[i] + "(u+" + ch[i].toString(16) + ") -" + ch[i + 1].toString(16));
        }
        i++; // IVSの次へ
        continue;
      }

      // IVS無しの1文字フォント
      if (this.utf16FontMap != null && this.utf16FontMap.has(ch[i])) {
        // 通常文字の外字指定 ほぼすべての文字が対象になるので先にcontainsKeyで判定
        gaijiFileName = this.utf16FontMap.get(ch[i]);
        if (gaijiFileName != null) {
          if (this.printGlyphFontTag(buf, gaijiFileName, "u" + ch[i].toString(16), "〓")) {
            LogAppender.info(this.lineNum, "外字フォント利用", "" + ch[i] + "(" + gaijiFileName + ")");
            // 次の文字へ
            continue;
          }
        }
      }

      // 1文字フォントもIVSもない場合
      // 自動縦中横処理
      if (this.vertical && !(this.inYoko || noTcy)) {
        switch (ch[i]) {
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            // 数字2文字を縦横中で出力
            if (this.autoYoko) {
              if (this.autoYokoNum3 && i + 2 < ch.length && CharUtils.isNum(ch[i + 1]) && CharUtils.isNum(ch[i + 2])) {
                // 数字3文字
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 3)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(ch[i + 1]);
                buf.append(ch[i + 2]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                i += 2;
                continue;
              } else if (i + 1 < ch.length && CharUtils.isNum(ch[i + 1])) {
                // 数字2文字
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 2)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(ch[i + 1]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                i++;
                continue;
              } else if (
                this.autoYokoNum1 &&
                (i === 0 || !CharUtils.isNum(ch[i - 1])) &&
                (i + 1 === ch.length || !CharUtils.isNum(ch[i + 1]))
              ) {
                // 数字1文字
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 1)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                continue;
              }
              // begin～end外もチェックする
              // 1月1日のような場合
              if (
                i + 3 < ch.length &&
                ch[i + 1] === "月" &&
                ch[i + 2] >= "0" &&
                ch[i + 2] <= "9" &&
                (ch[i + 3] === "日" || (i + 4 < ch.length && ch[i + 3] >= "0" && ch[i + 3] <= "9" && ch[i + 4] === "日"))
              ) {
                // 1月2日 1月10日 の1を縦中横
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                continue;
              }
              if (
                i > 1 &&
                i + 1 < ch.length &&
                ((ch[i - 1] === "年" && ch[i + 1] === "月") ||
                  (ch[i - 1] === "月" && ch[i + 1] === "日") ||
                  (ch[i - 1] === "第" && (ch[i + 1] === "刷" || ch[i + 1] === "版" || ch[i + 1] === "巻")))
              ) {
                // 年3月 + 月4日 + 第5刷 + 第6版 + 第7巻 の数字１文字縦中横
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                continue;
              }
              if (
                i > 2 &&
                ((ch[i - 2] === "明" && ch[i - 1] === "治") ||
                  (ch[i - 2] === "大" && ch[i - 1] === "正") ||
                  (ch[i - 2] === "昭" && ch[i - 1] === "和") ||
                  (ch[i - 2] === "平" && ch[i - 1] === "成"))
              ) {
                // 月5日 の5を縦中横
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                continue;
              }
            }
            break;
          case "!":
          case "?":
            if (this.autoYoko) {
              if (
                this.autoYokoEQ3 &&
                i + 2 < ch.length &&
                (ch[i + 1] === "!" || ch[i + 1] === "?") &&
                (ch[i + 2] === "!" || ch[i + 2] === "?")
              ) {
                // !? 3文字を縦中横で出力
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 3)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(ch[i + 1]);
                buf.append(ch[i + 2]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                i += 2;
                continue;
              } else if (
                i + 1 < ch.length &&
                ((this.autoYokoEQ2 && (ch[i + 1] === "!" || ch[i + 1] === "?")) ||
                  (this.autoYokoEQ1 && (i === 0 || ch[i - 1] !== "!" || ch[i - 1] !== "?")))
              ) {
                // !? 2文字
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 2)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(ch[i + 1]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                i++;
                continue;
              } else if (this.autoYokoEQ1 && (i === 0 || ch[i - 1] !== "!" || ch[i - 1] !== "?")) {
                // !? 1文字
                // 前後が半角かチェック
                if (!this.checkTcyPrev(ch, i - 1)) break;
                if (!this.checkTcyNext(ch, i + 1)) break;
                buf.append(this.chukiMap.get("縦中横")[0]);
                buf.append(ch[i]);
                buf.append(this.chukiMap.get("縦中横終わり")[0]);
                continue;
              }
            }
            break;
        }
      }
      if (this.vertical) {
          // ひらがな/カタカナ＋濁点/半濁点 結合文字も対応
          if (i + 1 < ch.length && (ch[i + 1] === '゛' || ch[i + 1] === '゜')) {
              if (CharUtils.isHiragana(ch[i]) || CharUtils.isKatakana(ch[i]) || ch[i] === '〻') {
                  // 通常の濁点文字ならその文字で出力
                  if (ch[i + 1] === '゛') {
                      let pos = "うかきくけこさしすせそたちつてとはひふへほゝウカキクケコサシスセソタチツテトハヒフヘホワヰヱヲヽ".indexOf(ch[i]);
                      if (pos >= 0) {
                          let ch2 = "ゔがぎぐげござじずぜぞだぢづでどばびぶべぼゞヴガギグゲゴザジズゼゾダヂヅデドバビブベボヷヸヹヺヾ".charAt(pos);
                          buf.append(ch2);
                          i++;
                          continue;
                      }
                  } else if (ch[i + 1] === '゜') {
                      let pos = "はひふへほハヒフヘホ".indexOf(ch[i]);
                      if (pos >= 0) {
                          let ch2 = "ぱぴぷぺぽパピプペポ".charAt(pos);
                          buf.append(ch2);
                          i++;
                          continue;
                      }
                  }
                  if (this.dakutenType === 1 && !(inYoko || noTcy)) {
                      // 濁点をspanで重ねて表示 ルビ内無効
                      buf.append('<span class="dakuten">');
                      buf.append(ch[i]);
                      buf.append('<span>');
                      if (ch[i + 1] === '゛') buf.append('゛');
                      else buf.append('゜');
                      buf.append('</span></span>');
                      i++;
                      continue;
                  } else if (this.dakutenType === 2) {
                      // 1文字フォントで出力
                      let className = "u" + ch[i].charCodeAt(0).toString(16);
                      if (ch[i + 1] === '゛') className += "-u3099";
                      else className += "-u309a";
                      if (this.printGlyphFontTag(buf, "dakuten/" + className + ".ttf", className, ch[i])) {
                          LogAppender.info(lineNum, "濁点フォント利用", "" + ch[i] + ch[i + 1]);
                          i++;
                          continue;
                      }
                  }
              }
          }

          // 英字縦中横
          // if (autoAlpha2 ) {
          //
          // }
      }
      // 自動縦中横で出力していたらcontinueしていてここは実行されない
      this.convertReplacedChar(buf, ch, i, noTcy);
  }
  }
  
  	/** 自動縦中横の前の半角チェック タグは無視
	 * @param i 縦中横文字の前の文字の位置 */
    checkTcyPrev(ch, i) {
      while (i >= 0) {
          if (ch[i] === '>') {
              do {
                  i--;
              } while (i >= 0 && ch[i] !== '<');
              i--;
              continue;
          }
          if (ch[i] === ' ') {
              i--; // 半角スペースは無視
              continue;
          }
          if (CharUtils.isHalf(ch[i])) return false;
          return true;
      }
      return true;
  }

  /** 自動縦中横の後ろ半角チェック タグは無視
   * @param i 縦中横文字の次の文字の位置 */
  checkTcyNext(ch, i) {
      while (i < ch.length) {
          if (ch[i] === '<') {
              do {
                  i++;
              } while (i < ch.length && ch[i] !== '>');
              i++;
              continue;
          }
          if (ch[i] === ' ') {
              i++; // 半角スペースは無視
              continue;
          }
          if (CharUtils.isHalf(ch[i])) return false;
          return true;
      }
      return true;
  }
 
	/** 出力バッファに文字出力
	 * < と > と & は &lt; &gt; &amp; に置換 */
  #convertReplacedChar(buf, ch, idx, noTcy) {
    // NULL文字なら何も出力しない
    if (ch[idx] === '\0') return;

    // String str = latinConverter.toLatinGlyphString(ch);
    // if (str != null) out.write(str);
    // else out.write(ch);
    let length = buf.length;

    // エスケープ文字を変換
    let escaped = false;
    if (idx > 0) {
        switch (ch[idx]) {
            case '》':
            case '《':
            case '｜':
            case '＃':
            case '※':
                if (ch[idx - 1] === '※') {
                    buf.setLength(length - 1); // 1文字削除
                    escaped = true;
                }
        }
    }

    if (replaceMap !== null) {
        const replaced = replaceMap.get(ch[idx]);
        // 置換して終了
        if (replaced !== null) {
            buf.append(replaced);
            return;
        }
    }

    // エスケープ文字なら2文字前を見る
    if (idx > 1 || (idx === 1 && !escaped)) {
        if (replace2Map !== null) {
            const replaced = replace2Map.get(`${ch[idx - (escaped ? 2 : 1)]}${ch[idx]}`);
            // 置換して終了
            if (replaced !== null) {
                buf.setLength(length - 1); // 1文字削除
                buf.append(replaced);
                return;
            }
        }
    }

    // エスケープ文字を出力
    if (escaped) {
        buf.append(ch[idx]);
        ch[idx] = '　'; // ※※の場合の対策
        return;
    }

    // 文字の間の全角スペースを禁則調整
    if (!(inYoko || noTcy)) {
        switch (this.spaceHyphenation) {
            case 1:
                if (idx > 20 && ch[idx] === '　' && buf.length > 0 && buf.charAt(buf.length - 1) !== '　' && (idx - 1 === ch.length || (idx + 1 < ch.length && ch[idx + 1] !== '　'))) {
                    buf.append('<span class="fullsp"> </span>');
                    return;
                }
                break;
            case 2:
                if (idx > 20 && ch[idx] === '　' && buf.length > 0 && buf.charAt(buf.length - 1) !== '　' && (idx - 1 === ch.length || (idx + 1 < ch.length && ch[idx + 1] !== '　'))) {
                    buf.append(String.fromCharCode(0x2000)).append(String.fromCharCode(0x2000));
                    return;
                }
                // if (idx + 1 < ch.length && ch[idx] !== '　' && +ch[idx + 1] === '　') {
                //     buf.append("<span class=\"withsp\">");
                //     buf.append(ch[idx]);
                //     buf.append("</span>");
                //     ch[idx + 1] = '\0'; // 出力しないNULL文字に変更
                //     return;
                // }
                break;
        }
    }

    // 横組み内は処理しない
    if (this.vertical && !inYoko) {
        switch (ch[idx]) {
            case '≪':
                buf.append('《');
                break;
            case '≫':
                buf.append('》');
                break;
            case '“':
                buf.append('〝');
                break;
            case '”':
                buf.append('〟');
                break;
            // case '〝': ch[i] = '“'; break;
            // case '〟': ch[i] = '”'; break;
            case '―':
                buf.append('─');
                break; // コード違いのダッシュ
            // ローマ数字等 Readerは修正されたけど一応残す
            // 正立しない文字: ¶⇔⇒≡√∇∂∃∠⊥⌒∽∝∫∬∮∑∟⊿≠≦≧∈∋⊆⊇⊂⊃∧∨↑↓→←∀
            // 正立フラグで調整
            case '÷':
            case '±':
            case '∞':
            case '∴':
            case '∵':
            // 正立する文字 Reader最新ファームでは修正された
            case 'Ⅰ':
            case 'Ⅱ':
            case 'Ⅲ':
            case 'Ⅳ':
            case 'Ⅴ':
            case 'Ⅵ':
            case 'Ⅶ':
            case 'Ⅷ':
            case 'Ⅸ':
            case 'Ⅹ':
            case 'Ⅺ':
            case 'Ⅻ':
            case 'ⅰ':
            case 'ⅱ':
            case 'ⅲ':
            case 'ⅳ':
            case 'ⅴ':
            case 'ⅵ':
            case 'ⅶ':
            case 'ⅷ':
            case 'ⅸ':
            case 'ⅹ':
            case 'ⅺ':
            case 'ⅻ':
            case '⓪':
            case '①':
            case '②':
            case '③':
            case '④':
            case '⑤':
            case '⑥':
            case '⑦':
            case '⑧':
            case '⑨':
            case '⑩':
            case '⑪':
            case '⑫':
            case '⑬':
            case '⑭':
            case '⑮':
            case '⑯':
            case '⑰':
            case '⑱':
            case '⑲':
            case '⑳':
            case '㉑':
            case '㉒':
            case '㉓':
            case '㉔':
            case '㉕':
            case '㉖':
            case '㉗':
            case '㉘':
            case '㉙':
            case '㉚':
            case '㉛':
            case '㉜':
            case '㉝':
            case '㉞':
            case '㉟':
            case '㊱':
            case '㊲':
            case '㊳':
            case '㊴':
            case '㊵':
            case '㊶':
            case '㊷':
            case '㊸':
            case '㊹':
            case '㊺':
            case '㊻':
            case '㊼':
            case '㊽':
            case '㊾':
            case '㊿':
            case '△':
            case '▽':
            case '▲':
            case '▼':
            case '☆':
            case '★':
            case '♂':
            case '♀':
            case '♪':
            case '♭':
            case '§':
            case '†':
            case '‡':
            case '‼':
            case '⁇':
            case '⁉':
            case '⁈':
            case '©':
            case '®':
            case '⁑':
            case '⁂':
            case '◐':
            case '◑':
            case '◒':
            case '◓':
            case '▷':
            case '▶':
            case '◁':
            case '◀':
            case '♤':
            case '♠':
            case '♢':
            case '♦':
            case '♡':
            case '♥':
            case '♧':
            case '♣':
            case '❤':
            case '☖':
            case '☗':
            case '☎':
            case '☁':
            case '☂':
            case '☃':
            case '♨':
            case '▱':
            case '⊿':
            case '✿':
            case '☹':
            case '☺':
            case '☻':
            case '✓':
            case '✔':
            case '␣':
            case '⏎':
            case '♩':
            case '♮':
            case '♫':
            case '♬':
            case 'ℓ':
            case '№':
            case '℡':
            case 'ℵ':
            case 'ℏ':
            case '℧':
                // 縦中横の中でなければタグで括る
                if (!noTcy) {
                    buf.append(chukiMap.get('正立')[0]);
                    buf.append(ch[idx]);
                    buf.append(chukiMap.get('正立終わり')[0]);
                } else {
                    buf.append(ch[idx]);
                }
                break;
            default:
                buf.append(ch[idx]);
        }
    } else {
        switch (ch[idx]) {
            case '≪':
                buf.append('《');
                break;
            case '≫':
                buf.append('》');
                break;
            case '―':
                buf.append('─');
                break;
            default:
                buf.append(ch[idx]);
        }
    }
} 
	////////////////////////////////////////////////////////////////
	// 画像単一ページチェック
	/** 前後に改ページを入れて画像を出力
	 * @throws IOException */
  async printImagePage(out, buf, lineNum, srcFileName, dstFileName, imagePageType) {
    // 画像の前に改ページがある場合
    const hasPageBreakTriger = this.pageBreakTrigger !== null && !this.pageBreakTrigger.noChapter;

    // 画像単ページとしてセクション出力
    switch (imagePageType) {
      case PageBreakType.IMAGE_PAGE_W:
        this.setPageBreakTrigger(this.pageBreakImageW);
        this.pageBreakImageW.srcFileName = srcFileName;
        this.pageBreakImageW.dstFileName = dstFileName;
        break;
      case PageBreakType.IMAGE_PAGE_H:
        this.setPageBreakTrigger(this.pageBreakImageH);
        this.pageBreakImageH.srcFileName = srcFileName;
        this.pageBreakImageH.dstFileName = dstFileName;
        break;
      case PageBreakType.IMAGE_PAGE_NOFIT:
        this.setPageBreakTrigger(this.pageBreakImageNoFit);
        this.pageBreakImageNoFit.srcFileName = srcFileName;
        this.pageBreakImageNoFit.dstFileName = dstFileName;
        break;
      default:
        this.setPageBreakTrigger(this.pageBreakImageAuto);
        this.pageBreakImageAuto.srcFileName = srcFileName;
        this.pageBreakImageAuto.dstFileName = dstFileName;
    }
    await this.printLineBuffer(out, buf, lineNum, true);

    if (hasPageBreakTriger) this.setPageBreakTrigger(this.pageBreakNormal);
    else this.setPageBreakTrigger(this.pageBreakNoChapter);
  }
  	////////////////////////////////////////////////////////////////
	// 出力処理

  	/** 改ページ用のトリガを設定
	 * 設定済みだが連続行で書かれていたり空行除外で改行されていない場合は上書きされて無視される
	 * @param trigger 改ページトリガ nullなら改ページ設定キャンセル
	 * //@param 改ページの後ろに文字がある場合に改行を出すならfalse */
   setPageBreakTrigger(trigger) {
    //改ページ前の空行は無視
    this.printEmptyLines = 0;
    this.pageBreakTrigger = trigger;
    if (this.pageBreakTrigger !== null && this.pageBreakTrigger.pageType !== PageBreakType.PAGE_NORMAL) {
      this.skipMiddleEmpty = true;
    }
  }
  	/** 行の文字列を出力
	 * 改ページフラグがあれば改ページ処理を行う
	 * @param out 出力先
	 * @param buf 出力する行
	 * @param noBr pタグで括れない次以降の行で閉じるブロック注記がある場合
	 * //@param chapterLevel Chapterレベル 指定無し=0, 大見出し=1, 中見出し=2, 見出し=2, 小見出し=3 (パターン抽出時は設定に合わせるか目次リストで選択したレベル)
	 * @throws IOException */
    async printLineBuffer(out, buf, lineNum, noBr) {
      let line = buf.toString();
      let length = buf.length;
      //すべて空白は空行にする
      if (CharUtils.isSpace(line)) {
        line = "";
        length = 0;
      }
  
      let idIdx = 1;
      let chapterId = null;
  
      let chapterLineInfo = null;
      //空白除去の時はスペースのみの行は空行扱い
      if (this.removeEmptyLine > 0 && length > 0 && CharUtils.isSpace(line)) {
        line = "";
        length = 0;
      }
      if (length === 0) {
        //空行なら行数をカウント 左右中央の時の本文前の空行は無視
        if (!this.skipMiddleEmpty && !noBr) {
          this.printEmptyLines++;
        }
        //バッファクリア
        buf.setLength(0);
        return;
      }
  
      //バッファ内の文字列出力
      //見出し階層レベル
      chapterLineInfo = this.bookInfo.getChapterLineInfo(lineNum);
  
      //タグの階層をチェック (強制改ページ判別用に先にやっておく)
      let tagStart = 0;
      let tagEnd = 0;
      let inTag = false;
      for (let i = 0; i < length; i++) {
        if (inTag) {
          if (line.charAt(i) === '/' && line.charAt(i + 1) === '>') tagEnd++;
          if (line.charAt(i) === '>') inTag = false;
        } else {
          if (line.charAt(i) === '<') {
            if (i < length - 1 && line.charAt(i + 1) === '/') tagEnd++;
            else tagStart++;
            inTag = true;
          }
        }
      }
  
      if (out !== null) {
        //強制改ページ処理
        //改ページトリガが設定されていない＆タグの外
        if (this.forcePageBreak && this.pageBreakTrigger === null && this.tagLevel === 0) {
          //行単位で強制改ページ
          if (this.pageByteSize > this.forcePageBreakSize) {
            this.setPageBreakTrigger(this.pageBreakNoChapter);
          } else {
            if (this.forcePageBreakEmptyLine > 0 && this.printEmptyLines >= this.forcePageBreakEmptyLine && this.pageByteSize > this.forcePageBreakEmptySize) {
              //空行での分割
              this.setPageBreakTrigger(this.pageBreakNoChapter);
            } else if (this.forcePageBreakChapterLevel > 0 && this.pageByteSize > this.forcePageBreakChapterSize) {
              //章での分割 次の行が見出しで次の行がタグの中になる場合１行前で改ページ
              if (chapterLineInfo !== null) this.setPageBreakTrigger(this.pageBreakNoChapter);
              else if (tagStart - tagEnd > 0 && this.bookInfo.getChapterLevel(lineNum + 1) > 0) this.setPageBreakTrigger(this.pageBreakNoChapter);
            }
          }
        }
  
        //改ページフラグが設定されていて、空行で無い場合
        if (this.pageBreakTrigger !== null) {
          //空ページでの改ページ
          //if (sectionCharLength == 0) {
          //	out.write(chukiMap.get("改行")[0]);
          //}
  
          //改ページ処理
          if (this.pageBreakTrigger.pageType !== PageBreakType.PAGE_NORMAL) {
            //左右中央
            this.writer.nextSection(out, lineNum, this.pageBreakTrigger.pageType, PageBreakType.IMAGE_PAGE_NONE, null);
          } else {
            //その他
            this.writer.nextSection(out, lineNum, PageBreakType.PAGE_NORMAL, this.pageBreakTrigger.imagePageType, this.pageBreakTrigger.srcFileName);
          }
  
          //ページ情報初期化
          this.pageByteSize = 0;
          this.sectionCharLength = 0;
          if (this.tagLevel > 0) console.error(lineNum, "タグが閉じていません");
          this.tagLevel = 0;
          this.lineIdNum = 0;
  
          this.pageBreakTrigger = null;
        }
  
        this.skipMiddleEmpty = false;
        //空行は行数がカウントされているので文字出力前に出力
        if (this.printEmptyLines > 0) {
          const br = this.chukiMap.get("改行")[0];
          let lines = Math.min(this.maxEmptyLine, this.printEmptyLines - this.removeEmptyLine);
          //見出し後3行以内開始の空行は1行は残す
          if (this.lastChapterLine >= lineNum - this.printEmptyLines - 2) {
            lines = Math.max(1, lines);
          }
          for (let i = lines - 1; i >= 0; i--) {
            out.write("<p>");
            out.write(br);
            out.write("</p>\n");
          }
          this.pageByteSize += (br.length + 8) * lines;
          this.printEmptyLines = 0;
        }
  
        this.lineIdNum++;
        if (noBr) {
          //見出し用のID設定
          if (chapterLineInfo !== null) {
            chapterId = `kobo.${this.lineIdNum}.${idIdx++}`;
            if (line.startsWith("<")) {
              //タグがあるのでIDを設定
              line = line.replace(/(<[\d|\w]+)/, `$1 id="${chapterId}"`);
            } else {
              //タグでなければ一文字目をspanに入れる
              out.write(`<span id="${chapterId}">${line.charAt(0)}</span>`);
              this.pageByteSize += (chapterId.length + 20);
              line = line.substring(1);
            }
          }
        } else {
          //改行用のp出力 見出しなら強制ID出力 koboの栞用IDに利用可能なkobo.のIDで出力
          if (this.withMarkId || (chapterLineInfo !== null && !chapterLineInfo.pageBreakChapter)) {
            chapterId = `kobo.${this.lineIdNum}.${idIdx++}`;
            out.write(`<p id="${chapterId}">`);
            this.pageByteSize += (chapterId.length + 14);
          } else {
            out.write("<p>");
            this.pageByteSize += 7;
          }
        }
        out.write(line);
        //ページバイト数加算
        if (this.forcePageBreak) this.pageByteSize += Buffer.byteLength(line, "UTF-8");
  
        //改行のpを閉じる
        if (!noBr) {
          out.write("</p>\n");
        }
  
        //見出しのChapterをWriterに追加 同じ行で数回呼ばれるので初回のみ
        if (chapterLineInfo !== null && this.lastChapterLine !== lineNum) {
          const name = chapterLineInfo.getChapterName();
          if (name !== null && name.length > 0) {
            //自動抽出で+10されているのは1桁のレベルに戻す
            if (chapterLineInfo.pageBreakChapter) {
              this.writer.addChapter(null, name, chapterLineInfo.level % 10);
            } else {
              this.writer.addChapter(chapterId, name, chapterLineInfo.level % 10);
              this.lastChapterLine = lineNum;
            }
          }
        }
  
        this.sectionCharLength += length;
      }
  
      //タグの階層を変更
      this.tagLevel += tagStart - tagEnd;
  
      //バッファクリア
      buf.setLength(0);
    }
}
