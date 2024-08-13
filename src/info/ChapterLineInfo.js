// ChapterLineInfo.js

export default class ChapterLineInfo {
    /**
     * @param {number} lineNum - 見出しの行番号
     * @param {number} type - 見出し種別
     * @param {boolean} pageBreak - 強制改ページ行かどうか
     * @param {number} level - 見出しレベル
     * @param {boolean} emptyLineNext - 前の行が空行かどうか
     * @param {string} [chapterName=null] - 目次に使う文字列の開始位置
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
            case ChapterLineInfo.TYPE_PAGEBREAK: return ""; //一覧で表示しない
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

    isPattern() {
        switch (this.type) {
            case ChapterLineInfo.TYPE_TITLE:
            case ChapterLineInfo.TYPE_PAGEBREAK:
            case ChapterLineInfo.TYPE_CHUKI_H1:
            case ChapterLineInfo.TYPE_CHUKI_H2:
            case ChapterLineInfo.TYPE_CHUKI_H3: return false;
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
        if (this.chapterName === null) {
            this.chapterName = chapterName;
        } else {
            this.chapterName = `${this.chapterName}　${chapterName}`;
        }
    }
}

// 定数の定義
ChapterLineInfo.TYPE_TITLE = 1;
ChapterLineInfo.TYPE_PAGEBREAK = 2;
ChapterLineInfo.TYPE_CHUKI_H = 10;
ChapterLineInfo.TYPE_CHUKI_H1 = 11;
ChapterLineInfo.TYPE_CHUKI_H2 = 12;
ChapterLineInfo.TYPE_CHUKI_H3 = 13;
ChapterLineInfo.TYPE_CHAPTER_NAME = 21;
ChapterLineInfo.TYPE_CHAPTER_NUM = 22;
ChapterLineInfo.TYPE_PATTERN = 30;

ChapterLineInfo.LEVEL_TITLE = 0;
ChapterLineInfo.LEVEL_SECTION = 1;
ChapterLineInfo.LEVEL_H1 = 1;
ChapterLineInfo.LEVEL_H2 = 2;
ChapterLineInfo.LEVEL_H3 = 3;
