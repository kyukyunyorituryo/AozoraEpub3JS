import ImageUtils from '../image/ImageUtils.js';
import CharUtils from '../util/CharUtils.js';


export default class BookInfo {
  constructor() {
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
    this.modified = null;

    /** 縦書きならtrue */
    this.vertical = true;

    /** 右から左ならtrue */
    this.rtl = false;

    /** 入力ファイル */
    this.srcFile = null;
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


  clear() {
    if (this.mapImageSectionLine) this.mapImageSectionLine.clear();
    if (this.mapPageBreakLine) this.mapPageBreakLine.clear();
    if (this.mapNoPageBreakLine) this.mapNoPageBreakLine.clear();
    if (this.mapIgnoreLine) this.mapIgnoreLine.clear();
  }

  /* public void addSectionInfo(SectionInfo sectionInfo)
  {
    this.vecSectionInfo.add(sectionInfo);
  }
  public SectionInfo getLastSectionInfo()
  {
    return vecSectionInfo.lastElement();
  }*/

  /** 画像単体ページの行数を保存 */
  addImageSectionLine(lineNum, imageFileName) {
    if (!this.mapImageSectionLine) this.mapImageSectionLine = new Map();
    this.mapImageSectionLine.set(lineNum, imageFileName);
  }

  /** 画像単体ページの行ならtrue */
  isImageSectionLine(lineNum) {
    if (!this.mapImageSectionLine) return false;
    return this.mapImageSectionLine.has(lineNum);
  }

  /** 画像単体ページの行の画像ファイル名を返却 */
  getImageSectionFileName(lineNum) {
    if (!this.mapImageSectionLine) return null;
    return this.mapImageSectionLine.get(lineNum);
  }

  /** 強制改ページ行数を保存 */
  addPageBreakLine(lineNum) {
    if (!this.mapPageBreakLine) this.mapPageBreakLine = new Set();
    this.mapPageBreakLine.add(lineNum);
  }

  /** 強制改ページ行ならtrue */
  isPageBreakLine(lineNum) {
    if (!this.mapPageBreakLine) return false;
    return this.mapPageBreakLine.has(lineNum);
  }

  /** 改ページしない行数を保存 */
  addNoPageBreakLine(lineNum) {
    if (!this.mapNoPageBreakLine) this.mapNoPageBreakLine = new Set();
    this.mapNoPageBreakLine.add(lineNum);
  }

  /** 改ページしない行ならtrue */
  isNoPageBreakLine(lineNum) {
    if (!this.mapNoPageBreakLine) return false;
    return this.mapNoPageBreakLine.has(lineNum);
  }


  /** 出力しない行数を保存 */
  addIgnoreLine(lineNum) {
    if (!this.mapIgnoreLine) this.mapIgnoreLine = new Set();
    this.mapIgnoreLine.add(lineNum);
  }

  /** 出力しない行ならtrue */
  isIgnoreLine(lineNum) {
    if (!this.mapIgnoreLine) return false;
    return this.mapIgnoreLine.has(lineNum);
  }

  /** 見出し行と階層レベルを保存 */
  addChapterLineInfo(chapterLineInfo) {
    if (!this.mapChapterLine) this.mapChapterLine = new Map();
    this.mapChapterLine.set(chapterLineInfo.lineNum, chapterLineInfo);
  }

  /** 見出し行と削除 */
  removeChapterLineInfo(lineNum) {
    if (this.mapChapterLine) this.mapChapterLine.delete(lineNum);
  }

  /** 見出し行の情報取得 */
  getChapterLineInfo(lineNum) {
    if (!this.mapChapterLine) return null;
    return this.mapChapterLine.get(lineNum);
  }

  /** 見出し行なら目次階層レベルを返す */
  getChapterLevel(lineNum) {
    if (!this.mapChapterLine) return 0;
    const info = this.mapChapterLine.get(lineNum);
    return info ? info.level : 0;
  }

  /** 行番号順に並び替えた目次一覧リストを生成して返す */
  getChapterLineInfoList() {
    const list = [];
    if (!this.mapChapterLine) return list;

    const lines = Array.from(this.mapChapterLine.keys()).sort((a, b) => a - b);
    for (const lineNum of lines) {
      list.push(this.mapChapterLine.get(lineNum));
    }
    return list;
  }

  /** 目次ページの自動抽出見出しを除外 */
  excludeTocChapter() {
    if (!this.mapChapterLine) return;
    //前2行と後ろ2行が自動抽出見出しの行を抽出 間の行は空行のみ許可
    const excludeLine = new Set();
    for (const lineNum of this.mapChapterLine.keys()) {
      if (this.isPattern(lineNum)) {
        let prevIsPattern = false;
        if (this.isPattern(lineNum - 1)) prevIsPattern = true;
        else if (this.mapChapterLine.get(lineNum).emptyNext && this.isPattern(lineNum - 2)) prevIsPattern = true; //前が空行の場合のみ
        let nextIsPattern = false;
        if (this.isPattern(lineNum + 1)) nextIsPattern = true;
        else if (this.isPattern(lineNum + 2)) nextIsPattern = true;
        if (prevIsPattern && nextIsPattern) excludeLine.add(lineNum);
      }
    }
    //先頭と最後
    const excludeLine2 = new Set();
    for (const lineNum of this.mapChapterLine.keys()) {
      if (!excludeLine.has(lineNum) && this.isPattern(lineNum)) {
        if (excludeLine.has(lineNum - 1)) excludeLine2.add(lineNum);
        else if (this.mapChapterLine.get(lineNum).emptyNext && excludeLine.has(lineNum - 2)) excludeLine2.add(lineNum);
        else if (excludeLine.has(lineNum + 1)) excludeLine2.add(lineNum);
        else if (excludeLine.has(lineNum + 2)) excludeLine2.add(lineNum);
      }
    }
    for (const lineNum of excludeLine) {
      this.mapChapterLine.delete(lineNum);
    }
    for (const lineNum of excludeLine2) {
      this.mapChapterLine.delete(lineNum);
    }
  }

  isPattern(num) {
    const chapterLineInfo = this.getChapterLineInfo(num);
    if (!chapterLineInfo) return false;
    return chapterLineInfo.isPattern();
  }
}

class ChapterLineInfo {
  constructor(lineNum, level, emptyNext) {
    this.lineNum = lineNum;
    this.level = level;
    this.emptyNext = emptyNext;
  }

  isPattern() {
    // Implement the pattern matching logic here.
    // For now, we'll just return a dummy value.
    return true;
  }


  getTitle() {
    return this.title;
  }

  setTitle(title) {
    this.title = title;
  }

  getTitleLine() {
    return this.titleLine;
  }

  setTitleLine(titleLine) {
    this.titleLine = titleLine;
  }

  getCreator() {
    return this.creator;
  }

  setCreator(creator) {
    this.creator = creator;
  }

  getCreatorLine() {
    return this.creatorLine;
  }

  setCreatorLine(creatorLine) {
    this.creatorLine = creatorLine;
  }

  getPublished() {
    return this.published;
  }

  setPublished(published) {
    this.published = published;
  }

  getModified() {
    return this.modified;
  }

  setModified(modified) {
    this.modified = modified;
  }

  isVertical() {
    return this.vertical;
  }

  setVertical(vertical) {
    this.vertical = vertical;
  }

  isRtl() {
    return this.rtl;
  }

  setRtl(rtl) {
    this.rtl = rtl;
  }

  getCoverFileName() {
    return this.coverFileName;
  }

  setCoverFileName(coverFileName) {
    this.coverFileName = coverFileName;
  }

  isInsertCoverPage() {
    return this.insertCoverPage;
  }

  isInsertCoverPageToc() {
    return this.insertCoverPageToc;
  }

  isInsertTitlePage() {
    return this.insertTitlePage;
  }

  setInsertTitlePage(insertTitlePage) {
    this.insertTitlePage = insertTitlePage;
  }

  isInsertTocPage() {
    return this.insertTocPage;
  }

  setInsertTocPage(insertTocPage) {
    this.insertTocPage = insertTocPage;
  }

  isTocVertical() {
    return this.tocVertical;
  }

  setTocVertical(tocVertical) {
    this.tocVertical = tocVertical;
  }

  isImageOnly() {
    return this.imageOnly;
  }

  setImageOnly(imageOnly) {
    this.imageOnly = imageOnly;
  }

  getLanguage() {
    return this.language;
  }

  setLanguage(language) {
    this.language = language;
  }

  getTitleText() {
    if (this.titleLine === -1) return null;
    try {
      return this.metaLines[this.titleLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getSubTitleText() {
    if (this.subTitleLine === -1) return null;
    try {
      return this.metaLines[this.subTitleLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getOrgTitleText() {
    if (this.orgTitleLine === -1) return null;
    try {
      return this.metaLines[this.orgTitleLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getSubOrgTitleText() {
    if (this.subOrgTitleLine === -1) return null;
    try {
      return this.metaLines[this.subOrgTitleLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getCreatorText() {
    if (this.creatorLine === -1) return null;
    try {
      return this.metaLines[this.creatorLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getSubCreatorText() {
    if (this.subCreatorLine === -1) return null;
    try {
      return this.metaLines[this.subCreatorLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getSeriesText() {
    if (this.seriesLine === -1) return null;
    try {
      return this.metaLines[this.seriesLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getPublisherText() {
    if (this.publisherLine === -1) return null;
    try {
      return this.metaLines[this.publisherLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
  }

  getLanguageText() {
    if (this.languageLine === -1) return null;
    try {
      return this.metaLines[this.languageLine - this.metaLineStart];
    } catch (e) {
      return null;
    }
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

    if (titleType !== TitleType.NONE) {
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

      if (linesLength > 0 && titleType === TitleType.TITLE_ONLY) {
        this.titleLine = metaLineStart;
        this.title = metaLines[0 + arrIndex];
        this.titleEndLine = metaLineStart;
      } else if (linesLength > 0 && titleType === TitleType.TITLE_AUTHOR_ONLY) {
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
                  titleType !== TitleType.SUBTITLE_AUTHOR &&
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
  /** 本文内のタイトル再読み込み */
  reloadMetadata(titleType, pubFirst) {
    this.setMetaInfo(titleType, pubFirst, this.metaLines, this.metaLineStart, this.firstCommentLineNum);
  }


  /** ファイルまたはURLの文字列から画像を読み込んで表紙イメージとして設定 */
  loadCoverImage(path) {
    this.coverImage = ImageUtils.loadImage(path);
  }
}



/** タイトル記載種別 */
BookInfo.TitleType = {
  TITLE_AUTHOR: 'TITLE_AUTHOR',
  AUTHOR_TITLE: 'AUTHOR_TITLE',
  SUBTITLE_AUTHOR: 'SUBTITLE_AUTHOR',
  TITLE_ONLY: 'TITLE_ONLY',
  TITLE_AUTHOR_ONLY: 'TITLE_AUTHOR_ONLY',
  NONE: 'NONE',
  titleTypeNames: ["表題 → 著者名", "著者名 → 表題", "表題 → 著者名(副題優先)", "表題のみ(1行)", "表題+著者のみ(2行)", "なし"],
  indexOf: function(idx) {
    return Object.values(this)[idx];
  },
  hasTitleAuthor: function(type) {
    switch (type) {
      case this.TITLE_ONLY:
      case this.NONE:
        return false;
      default:
        return true;
    }
  },
  hasTitle: function(type) {
    return type !== this.NONE;
  },
  hasAuthor: function(type) {
    switch (type) {
      case this.TITLE_ONLY:
      case this.NONE:
        return false;
      default:
        return true;
    }
  },
  titleFirst: function(type) {
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

/** 表題は出力しない  */
BookInfo.TITLE_NONE = -1;
/** 表題は別ページにせずそのまま出力  */
BookInfo.TITLE_NORMAL = 0;
/** 表題ページを左右中央 コメント行前の8行まで
 * コメント行がない場合と9行以上の場合は無効になる */
BookInfo.TITLE_MIDDLE = 1;
/** 表題ページ横書き */
BookInfo.TITLE_HORIZONTAL = 2;

//module.exports = BookInfo;


//メソッドを関数化した
/**
 * ファイル名からタイトルと著者名を取得
 * @param {string} fileName ファイル名
 * @returns {Array<string|null>} タイトルと著者名を格納した配列
 */
export function getFileTitleCreator(fileName) {
  // ファイル名からタイトル取得
  let titleCreator = [null, null];
  let noExtName = fileName
    .replace(/\.\w+$/, '')
    .replace(/\.\w+$/, '');

  // 後ろの括弧から校正情報等を除外
  noExtName = noExtName
    .replace(/（/g, '(')
    .replace(/）/g, ')');
  noExtName = noExtName
    .replace(/\(青空[^\)]*\)/g, '')
    .replace(/\([^\)]*(校正|軽量|表紙|挿絵|補正|修正|ルビ|Rev|rev)[^\)]*\)/g, '');

  let m = noExtName.match(/[\[［](.+?)[\]］][ 　]*(.*)[ 　]*$/);
  if (m) {
    titleCreator[0] = m[2];
    titleCreator[1] = m[1];
  } else {
    m = noExtName.match(/^(.*?)( |　)*(\(|（)/);
    if (m) {
      titleCreator[0] = m[1];
    } else {
      // 一致しなければ拡張子のみ除外
      titleCreator[0] = noExtName;
    }
  }

  // trimして長さが0ならnullにする
  if (titleCreator[0] != null) {
    titleCreator[0] = titleCreator[0].trim();
    if (titleCreator[0].length === 0) titleCreator[0] = null;
  }
  if (titleCreator[1] != null) {
    titleCreator[1] = titleCreator[1].trim();
    if (titleCreator[1].length === 0) titleCreator[1] = null;
  }

  return titleCreator;
}

