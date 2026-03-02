export default class ChapterLineInfo {

  // ===== 定数 =====
  static TYPE_TITLE = 1;
  static TYPE_PAGEBREAK = 2;
  static TYPE_CHUKI_H = 10;
  static TYPE_CHUKI_H1 = 11;
  static TYPE_CHUKI_H2 = 12;
  static TYPE_CHUKI_H3 = 13;
  static TYPE_CHAPTER_NAME = 21;
  static TYPE_CHAPTER_NUM = 22;
  static TYPE_PATTERN = 30;

  static LEVEL_TITLE = 0;
  static LEVEL_SECTION = 1;
  static LEVEL_H1 = 1;
  static LEVEL_H2 = 2;
  static LEVEL_H3 = 3;

  /**
   * @param {number} lineNum
   * @param {number} type
   * @param {boolean} pageBreak
   * @param {number} level
   * @param {boolean} emptyLineNext
   * @param {string|null} chapterName
   */
  constructor(lineNum, type, pageBreak, level, emptyLineNext, chapterName = null) {
    this.lineNum = lineNum;
    this.type = type;
    this.pageBreakChapter = pageBreak;
    this.level = level;
    this.emptyNext = emptyLineNext;
    this.chapterName = chapterName;
  }

  toString() {
    return this.chapterName;
  }

  getTypeId() {
    switch (this.type) {
      case ChapterLineInfo.TYPE_TITLE: return "題";
      case ChapterLineInfo.TYPE_PAGEBREAK: return "";
      case ChapterLineInfo.TYPE_CHUKI_H: return "見";
      case ChapterLineInfo.TYPE_CHUKI_H1: return "大";
      case ChapterLineInfo.TYPE_CHUKI_H2: return "中";
      case ChapterLineInfo.TYPE_CHUKI_H3: return "小";
      case ChapterLineInfo.TYPE_CHAPTER_NAME: return "章";
      case ChapterLineInfo.TYPE_CHAPTER_NUM: return "数";
      case ChapterLineInfo.TYPE_PATTERN: return "他";
    }
    return "";
  }

  static getChapterType(typeId) {
    switch (typeId) {
      case '題': return ChapterLineInfo.TYPE_TITLE;
      case '改': return ChapterLineInfo.TYPE_PAGEBREAK;
      case '見': return ChapterLineInfo.TYPE_CHUKI_H;
      case '大': return ChapterLineInfo.TYPE_CHUKI_H1;
      case '中': return ChapterLineInfo.TYPE_CHUKI_H2;
      case '小': return ChapterLineInfo.TYPE_CHUKI_H3;
      case '章': return ChapterLineInfo.TYPE_CHAPTER_NAME;
      case '数': return ChapterLineInfo.TYPE_CHAPTER_NUM;
      case '他': return ChapterLineInfo.TYPE_PATTERN;
    }
    return 0;
  }

  static getLevel(type) {
    switch (type) {
      case ChapterLineInfo.TYPE_TITLE: return ChapterLineInfo.LEVEL_TITLE;
      case ChapterLineInfo.TYPE_PAGEBREAK: return ChapterLineInfo.LEVEL_SECTION;
      case ChapterLineInfo.TYPE_CHUKI_H1: return ChapterLineInfo.LEVEL_H1;
      case ChapterLineInfo.TYPE_CHUKI_H2: return ChapterLineInfo.LEVEL_H2;
      case ChapterLineInfo.TYPE_CHUKI_H3: return ChapterLineInfo.LEVEL_H3;
      case ChapterLineInfo.TYPE_CHAPTER_NUM: return ChapterLineInfo.LEVEL_H2;
    }
    return ChapterLineInfo.LEVEL_H1;
  }

  /** 章名や数字やパターンでマッチした行ならtrue */
  isPattern() {
    switch (this.type) {
      case ChapterLineInfo.TYPE_TITLE:
      case ChapterLineInfo.TYPE_PAGEBREAK:
      case ChapterLineInfo.TYPE_CHUKI_H1:
      case ChapterLineInfo.TYPE_CHUKI_H2:
      case ChapterLineInfo.TYPE_CHUKI_H3:
        return false;
    }
    return true;
  }

  getChapterName() {
    return this.chapterName;
  }

  setChapterName(chapterName) {
    this.chapterName = chapterName;
  }

  joinChapterName(chapterName) {
    if (this.chapterName == null) {
      this.chapterName = chapterName;
    } else {
      this.chapterName = this.chapterName + "　" + chapterName;
    }
  }
}