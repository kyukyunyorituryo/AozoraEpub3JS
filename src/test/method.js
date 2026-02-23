
class BookInfo {
 
  // タイトル記載種別の列挙型
  static TitleType = {
    TITLE_AUTHOR: 'TITLE_AUTHOR',
    AUTHOR_TITLE: 'AUTHOR_TITLE',
    SUBTITLE_AUTHOR: 'SUBTITLE_AUTHOR',
    TITLE_ONLY: 'TITLE_ONLY',
    TITLE_AUTHOR_ONLY: 'TITLE_AUTHOR_ONLY',
    NONE: 'NONE',

    titleTypeNames: ["表題 → 著者名", "著者名 → 表題", "表題 → 著者名(副題優先)", "表題のみ(1行)", "表題+著者のみ(2行)", "なし"],

    indexOf(idx) {
      return Object.values(this).slice(0, 6)[idx];  // 列挙型の名前を返すためにsliceを使用
    },

    hasTitleAuthor(type) {
      switch (type) {
        case this.TITLE_ONLY:
        case this.NONE:
          return false;
        default:
          return true;
      }
    },

    hasTitle(type) {
      return type !== this.NONE;
    },

    hasAuthor(type) {
      switch (type) {
        case this.TITLE_ONLY:
        case this.NONE:
          return false;
        default:
          return true;
      }
    },

    titleFirst(type) {
      switch (type) {
        case this.TITLE_AUTHOR:
        case this.SUBTITLE_AUTHOR:
        case this.TITLE_ONLY:
        case this.TITLE_AUTHOR_ONLY:
          return true;
        default:
          return false;
      }
    }
  };

  // 表題ページ種別定数
  static TITLE_NONE = -1;
  static TITLE_NORMAL = 0;
  static TITLE_MIDDLE = 1;
  static TITLE_HORIZONTAL = 2;

  constructor(srcFile) {
    /** タイトル種別 */
    this.titlePageType = 0;

    ////////////////////////////////
    /** タイトル等の行 */
    this.metaLines = [];
    /** タイトル等の開始行番号 */
    this.metaLineStart = 0;

    /** テキストの行数 */
    this.totalLineNum = -1;

    /** タイトル */
    this.title = '';
    /** タイトル行番号 */
    this.titleLine = -1;
    /** タイトル読み */
    this.titleAs = '';

    /** 副題 */
    this.subTitle = '';
    /** 副題番号 */
    this.subTitleLine = -1;

    /** 原題行番号 */
    this.orgTitleLine = -1;
    /** 原副題行番号 */
    this.subOrgTitleLine = -1;

    /** 著作者 */
    this.creator = '';
    /** 著作者行番号 */
    this.creatorLine = -1;
    /** 複著作者行番号 */
    this.subCreatorLine = -1;
    /** 著者読み */
    this.creatorAs = '';

    /** シリーズ名 */
    this.seriesLine = -1;
    /** 刊行者行 */
    this.publisherLine = -1;
    /** 刊行者文字列 */
    this.publisher = '';
    /** 言語行 */
    this.languageLine = -1;
    /** EPUBの言語の指定 */
    this.language = '';

    ////////////////////////////////

    /** タイトル行の最後 */
    this.titleEndLine = -1;

    /** コメント先頭行 */
    this.firstCommentLineNum = -1;

    /** 発刊日時 */
    this.published = null;
    /** 更新日時 */
    this.modified = new Date();

    /** 縦書きならtrue */
    this.vertical = true;

    /** 右から左ならtrue */
    this.rtl = false;

    /** 入力ファイル */
    this.srcFile = srcFile;
    /** 圧縮ファイル内のテキストファイルエントリー名 */
    this.textEntryName = '';

    /** 先頭の画像行番号 */
    this.firstImageLineNum = -1;
    /** 先頭の画像位置 外字等の小さい画像は無視される */
    this.firstImageIdx = -1;

    /** 表紙編集情報 */
    this.coverEditInfo = null;
    /** 表紙ファイル名 フルパスかURL ""なら先頭の挿絵 nullなら表紙無し */
    this.coverFileName = '';
    /** 表紙イメージがトリミングされた場合に設定される coverFileNameより優先される */
    this.coverImage = null;
    /** 表紙に使う挿絵の本文内Index -1なら本文内の挿絵は使わない */
    this.coverImageIndex = -1;
    /** imageにしたとき用の元ファイルの拡張子 */
    this.coverExt = '';

    /** 先頭に表紙ページを追加 */
    this.insertCoverPage = false;
    /** 表紙を目次に入れる */
    this.insertCoverPageToc = false;

    /** 表紙ページを追加した場合は表紙は目次より前に出力 */
    this.insertTitlePage = false;
    /** 目次ページを追加 */
    this.insertTocPage = false;
    /** 目次縦書きならtrue */
    this.tocVertical = false;
    /** 表題を目次に追加 */
    this.insertTitleToc = true;

    /** txtのない画像のみの場合 */
    this.imageOnly = false;

// /** タイトルページの改ページ行 前に改ページがなければ-1 表題がなければ-2 */
    // this.preTitlePageBreak = -2;

    // /** 改ページ単位で区切られたセクションの情報を格納 */
    // this.vecSectionInfo = [];

    /** 画像単体ページ開始行 */
    this.mapImageSectionLine = new Map();
    /** 強制改ページ行 */
    this.mapPageBreakLine = new Set();
    /** 改ページしない行 (［＃ページの左右中央］の前の［＃改ページ］) */
    this.mapNoPageBreakLine = new Set();
    /** 出力ページしない行 (左右中央後の空行と改ページ前の空行) */
    this.mapIgnoreLine = new Set();
    /** 見出し行の情報 */
    this.mapChapterLine = new Map();
  }


  setMetaInfo(titleType, pubFirst, metaLines, metaLineStart, firstCommentLineNum) {
    this.firstCommentLineNum = firstCommentLineNum;

    this.titleLine = -1;
    this.orgTitleLine = -1;
    this.subTitleLine = -1;
    this.subOrgTitleLine = -1;
    this.creatorLine = -1;
    this.subCreatorLine = -1;
    this.publisherLine = -1;
    this.title = "";
    this.titleAs = null;
    this.creator = "";
    this.creatorAs = null;
    this.publisher = null;

    if (titleType !== BookInfo.TitleType.NONE) {
      this.metaLines = metaLines;
      this.metaLineStart = metaLineStart;

      let linesLength = 0;
      for (let i = 0; i < metaLines.length; i++) {
        if (!metaLines[i]) {
          linesLength = i;
          break;
        }
      }

      let arrIndex = 0;
      if (pubFirst && linesLength >= 2) {
        this.publisherLine = metaLineStart;
        this.publisher = metaLines[0];
        metaLineStart++;
        linesLength--;
        arrIndex++;
      }

      if (linesLength > 0 && titleType === BookInfo.TitleType.TITLE_ONLY) {
        this.titleLine = metaLineStart;
        this.title = metaLines[0 + arrIndex];
        this.titleEndLine = metaLineStart;
      } else if (linesLength > 0 && titleType === BookInfo.TitleType.TITLE_AUTHOR_ONLY) {
        this.titleLine = metaLineStart;
        this.title = metaLines[0 + arrIndex];
        this.creator = metaLines[1 + arrIndex];
        this.titleEndLine = metaLineStart + 1;
      } else {
        switch (Math.min(6, linesLength)) {
          case 6:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.orgTitleLine = metaLineStart + 1;
              this.subTitleLine = metaLineStart + 2;
              this.subOrgTitleLine = metaLineStart + 3;
              this.title = `${metaLines[0 + arrIndex]} ${metaLines[2 + arrIndex]}`;
              this.titleEndLine = metaLineStart + 3;
              if (titleType.hasAuthor()) {
                this.creatorLine = metaLineStart + 4;
                this.subCreatorLine = metaLineStart + 5;
                this.creator = metaLines[4 + arrIndex];
                this.titleEndLine = metaLineStart + 5;
              }
            } else {
              this.creatorLine = metaLineStart;
              this.subCreatorLine = metaLineStart + 1;
              this.creator = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart + 1;
              if (titleType.hasTitle()) {
                this.titleLine = metaLineStart + 2;
                this.orgTitleLine = metaLineStart + 3;
                this.subTitleLine = metaLineStart + 4;
                this.subOrgTitleLine = metaLineStart + 5;
                this.title = `${metaLines[2 + arrIndex]} ${metaLines[4 + arrIndex]}`;
                this.titleEndLine = metaLineStart + 5;
              }
            }
            break;
          case 5:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.orgTitleLine = metaLineStart + 1;
              this.subTitleLine = metaLineStart + 2;
              this.title = `${metaLines[0 + arrIndex]} ${metaLines[2 + arrIndex]}`;
              this.titleEndLine = metaLineStart + 2;
              if (titleType.hasAuthor()) {
                this.creatorLine = metaLineStart + 3;
                this.subCreatorLine = metaLineStart + 4;
                this.creator = metaLines[3 + arrIndex];
                this.titleEndLine = metaLineStart + 4;
              }
            } else {
              this.creatorLine = metaLineStart;
              this.creator = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart;
              if (titleType.hasTitle()) {
                this.titleLine = metaLineStart + 1;
                this.orgTitleLine = metaLineStart + 2;
                this.subTitleLine = metaLineStart + 3;
                this.subOrgTitleLine = metaLineStart + 4;
                this.title = `${metaLines[1 + arrIndex]} ${metaLines[3 + arrIndex]}`;
                this.titleEndLine = metaLineStart + 4;
              }
            }
            break;
          case 4:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.subTitleLine = metaLineStart + 1;
              this.title = `${metaLines[0 + arrIndex]} ${metaLines[1 + arrIndex]}`;
              this.titleEndLine = metaLineStart + 1;
              if (titleType.hasAuthor()) {
                this.creatorLine = metaLineStart + 2;
                this.subCreatorLine = metaLineStart + 3;
                this.creator = metaLines[2 + arrIndex];
                this.titleEndLine = metaLineStart + 3;
              }
            } else {
              this.creatorLine = metaLineStart;
              this.subCreatorLine = metaLineStart + 1;
              this.creator = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart + 1;
              if (titleType.hasTitle()) {
                this.titleLine = metaLineStart + 2;
                this.subTitleLine = metaLineStart + 3;
                this.title = `${metaLines[2 + arrIndex]} ${metaLines[3 + arrIndex]}`;
                this.titleEndLine = metaLineStart + 3;
              }
            }
            break;
          case 3:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.subTitleLine = metaLineStart + 1;
              this.title = `${metaLines[0 + arrIndex]} ${metaLines[1 + arrIndex]}`;
              this.titleEndLine = metaLineStart + 1;
              if (titleType.hasAuthor()) {
                if (
                  titleType !== BookInfo.TitleType.SUBTITLE_AUTHOR &&
                  !metaLines[1].startsWith("―") &&
                  (metaLines[2 + arrIndex].endsWith("訳") ||
                    metaLines[2 + arrIndex].endsWith("編纂") ||
                    metaLines[2 + arrIndex].endsWith("校訂"))
                ) {
                  this.titleLine = metaLineStart;
                  this.title = metaLines[0 + arrIndex];
                  this.subTitleLine = -1;
                  this.creatorLine = metaLineStart + 1;
                  this.creator = metaLines[1 + arrIndex];
                  this.subCreatorLine = metaLineStart + 2;
                } else {
                  this.creatorLine = metaLineStart + 2;
                  this.creator = metaLines[2 + arrIndex];
                }
                this.titleEndLine = metaLineStart + 2;
              }
            } else {
              this.creatorLine = metaLineStart;
              this.creator = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart;
              if (titleType.hasTitle()) {
                this.titleLine = metaLineStart + 1;
                this.subTitleLine = metaLineStart + 2;
                this.title = `${metaLines[1 + arrIndex]} ${metaLines[2 + arrIndex]}`;
                this.titleEndLine = metaLineStart + 2;
              }
            }
            break;
          case 2:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.title = metaLines[0 + arrIndex];
              if (titleType.hasAuthor()) {
                if (
                  firstCommentLineNum > 0 &&
                  firstCommentLineNum <= 6 &&
                  metaLines[3 + arrIndex] &&
                  !metaLines[3 + arrIndex].length() &&
                  (!metaLines[4 + arrIndex] || !metaLines[4 + arrIndex].length())
                ) {
                  this.titleLine = metaLineStart;
                  this.subTitleLine = metaLineStart + 1;
                  this.title = `${metaLines[0 + arrIndex]} ${metaLines[1 + arrIndex]}`;
                  this.creatorLine = metaLineStart + 3;
                  this.creator = metaLines[2 + arrIndex];
                  this.titleEndLine = metaLineStart + 3;
                } else {
                  this.creatorLine = metaLineStart + 1;
                  this.creator = metaLines[1 + arrIndex];
                  this.titleEndLine = metaLineStart + 1;
                }
              }
            } else {
              this.creatorLine = metaLineStart;
              this.creator = metaLines[0 + arrIndex];
              if (titleType.hasTitle()) {
                this.titleLine = metaLineStart + 1;
                this.title = metaLines[1 + arrIndex];
              }
              this.titleEndLine = metaLineStart + 1;
            }
            break;
          case 1:
            if (titleType.titleFirst()) {
              this.titleLine = metaLineStart;
              this.title = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart;
              if (titleType.hasAuthor()) {
                if (
                  metaLines[2 + arrIndex] &&
                  !metaLines[2 + arrIndex].length() &&
                  (!metaLines[3 + arrIndex] || !metaLines[3 + arrIndex].length())
                ) {
                  this.creatorLine = metaLineStart + 2;
                  this.creator = metaLines[2 + arrIndex];
                  this.titleEndLine = metaLineStart + 2;
                }
              }
            } else {
              this.creatorLine = metaLineStart;
              this.creator = metaLines[0 + arrIndex];
              this.titleEndLine = metaLineStart;
              if (titleType.hasTitle()) {
                if (
                  metaLines[2 + arrIndex] &&
                  !metaLines[2 + arrIndex].length() &&
                  (!metaLines[3 + arrIndex] || !metaLines[3 + arrIndex].length())
                ) {
                  this.titleLine = metaLineStart + 2;
                  this.title = metaLines[2 + arrIndex];
                  this.titleEndLine = metaLineStart + 2;
                }
              }
            }
            break;
        }
      }

      if (this.creator && (this.creator.startsWith("―") || this.creator.startsWith("【"))) this.creator = null;

      if (this.title) {
        this.title = CharUtils.getChapterName(CharUtils.removeRuby(this.title), 0, false);
      }
      if (this.creator) this.creator = CharUtils.getChapterName(CharUtils.removeRuby(this.creator), 0);
    }
  }
}


 import BookInfo2 from '../info/BookInfo.js';
var filePath = 'C:/Users/Owner/Desktop/test用の青空文庫形式/aozoratest.txt'
const bookInfo = new BookInfo2(filePath);

//bookInfo.setMetaInfo(titleType, pubFirst, this.firstLines, this.firstLineStart, this.firstCommentLineNum);
console.log(bookInfo)
const firstLines = new Array(10);
bookInfo.setMetaInfo('TITLE_AUTHOR', false, firstLines, -1, -1);
console.log(bookInfo)