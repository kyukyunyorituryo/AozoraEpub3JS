//const CharUtils = require('../util/CharUtils.js'); // CharUtilsをrequire

/** 目次用の章の情報を格納（仮） */
export default class ChapterInfo {
    /** xhtmlファイルのセクション毎の連番ID */
    sectionId;
    /** 章ID 見出し行につけたspanのID */
    chapterId;
    /** 章名称 */
    chapterName;
    
    /** 目次階層レベル */
    chapterLevel;
    
    /** 出力前に階層化開始タグを入れる回数 通常は1回 */
    levelStart = 0;
    /** 出力後に階層化終了タグを入れる回数 */
    levelEnd = 0;
    /** navPointを閉じる回数 */
    navClose = 1;

    constructor(sectionId, chapterId, chapterName, chapterLevel) {
        this.sectionId = sectionId;
        this.chapterId = chapterId;
        this.chapterName = chapterName;
        this.chapterLevel = chapterLevel;
    }

    getSectionId() {
        return this.sectionId;
    }

    setSectionId(sectionId) {
        this.sectionId = sectionId;
    }

    getChapterId() {
        return this.chapterId;
    }

    setChapterId(chapterId) {
        this.chapterId = chapterId;
    }

    getChapterName() {
        return this.chapterName;
    }

    setChapterName(chapterName) {
        this.chapterName = chapterName;
    }

    getNoTagChapterName() {
        return CharUtils.removeTag(this.chapterName);
    }

    getChapterLevel() {
        return this.chapterLevel;
    }

    /** Velocityでループするために配列を返す */
    getLevelStart() {
        if (this.levelStart === 0) return null;
        return new Array(this.levelStart).fill(0);
    }

    /** Velocityでループするために配列を返す */
    getLevelEnd() {
        if (this.levelEnd === 0) return null;
        return new Array(this.levelEnd).fill(0);
    }

    /** Velocityでループするために配列を返す */
    getNavClose() {
        if (this.navClose <= 0) return null;
        return new Array(this.navClose).fill(0);
    }

    /**
     * 目次の階層情報を設定する。
     *
     * @param navNest
     * @param ncxNest
     * @param chapterInfos
     * @param insertTitleToc
     */
    static setTocNestLevel(navNest, ncxNest, chapterInfos, insertTitleToc) {
        if (chapterInfos.length < 1) {
            return;
        }

        //表題のレベルを2つめと同じにする
        if (insertTitleToc && chapterInfos.length >= 2) {
            chapterInfos[0].chapterLevel = chapterInfos[1].chapterLevel;
        }

        // 見出しレベルをコピーする
        const levels = chapterInfos.map(chapterInfo => chapterInfo.chapterLevel);

        // 目次の階層レベルの設定
        for (let i = 0; i < chapterInfos.length; i++) {
            let count = 0;

            //現在のレベルを取得
            let curr_level = levels[i];
            // 親の数を数える
            for (let j = i - 1; j >= 0; j--) {
                if (levels[j] < curr_level) {
                    count++;
                    // 親のレベルを現在のレベルにする
                    curr_level = levels[j];
                }
            }
            // 親の数がそのノードの深さ（レベル）となる
            chapterInfos[i].chapterLevel = count;
        }

        // Velocity用のフィールド設定
        let curr = chapterInfos[0];
        curr.levelStart = 0;

        let prev = curr;

        // ループは 2番目の要素から開始
        for (let i = 1; i < chapterInfos.length; i++) {
            curr = chapterInfos[i];

            const diff = curr.chapterLevel - prev.chapterLevel;
            if (diff > 0) {
                // 前より深い場合
                curr.levelStart = diff;
                prev.levelEnd = 0;
            } else {
                // 前より深くない場合
                curr.levelStart = 0;
                prev.levelEnd = -diff;
            }
            prev = curr;
        }
        curr.levelEnd = curr.chapterLevel;

        if (ncxNest) {
            prev = null;
            for (let i = 0; i < chapterInfos.length; i++) {
                curr = chapterInfos[i];
                curr.navClose = curr.levelEnd + 1;
                if (curr.levelStart > 0 && prev) {
                    //前が親ノードなら、前のノードの navClose を 0 にする
                    prev.navClose = 0;
                }
                prev = curr;
            }
        }
    }

    toString() {
        return `{chapterLevel: ${this.chapterLevel}, levelStart: ${this.levelStart}, levelEnd: ${this.levelEnd}, navClose: ${this.navClose}, sectionId: "${this.sectionId}", chapterId: "${this.chapterId}", chapterName: "${this.chapterName}"}`;
    }
}