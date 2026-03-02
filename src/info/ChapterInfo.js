/** 目次用の章の情報を格納（仮） */
export default class ChapterInfo {

  constructor(sectionId, chapterId, chapterName, chapterLevel) {
    this.sectionId = sectionId;
    this.chapterId = chapterId;
    this.chapterName = chapterName;
    this.chapterLevel = chapterLevel;

    this.levelStart = 0;
    this.levelEnd = 0;
    this.navClose = 1;
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
    // CharUtils.removeTag 相当（簡易版）
    return this.chapterName
      ? this.chapterName.replace(/<[^>]*>/g, '')
      : null;
  }

  getChapterLevel() {
    return this.chapterLevel;
  }

  // Velocity用（EJSでも使える）
  getLevelStart() {
    if (this.levelStart === 0) return null;
    return new Array(this.levelStart);
  }

  getLevelEnd() {
    if (this.levelEnd === 0) return null;
    return new Array(this.levelEnd);
  }

  getNavClose() {
    if (this.navClose <= 0) return null;
    return new Array(this.navClose);
  }

  /**
   * 目次の階層情報を設定
   */
  static setTocNestLevel(navNest, ncxNest, chapterInfos, insertTitleToc) {

    if (!chapterInfos || chapterInfos.length === 0) return;

    // 表題のレベルを2つめと同じにする
    if (insertTitleToc && chapterInfos.length >= 2) {
      chapterInfos[0].chapterLevel =
        chapterInfos[1].chapterLevel;
    }

    // レベル配列コピー
    const levels = chapterInfos.map(c => c.chapterLevel);

    //----------------------------------------------
    // 目次階層レベル計算
    //----------------------------------------------
    for (let i = 0; i < chapterInfos.length; i++) {
      let count = 0;
      let currLevel = levels[i];

      for (let j = i - 1; j >= 0; j--) {
        if (levels[j] < currLevel) {
          count++;
          currLevel = levels[j];
        }
      }

      chapterInfos[i].chapterLevel = count;
    }

    //----------------------------------------------
    // levelStart / levelEnd 設定
    //----------------------------------------------
    let curr = chapterInfos[0];
    curr.levelStart = 0;

    let prev = curr;

    for (let i = 1; i < chapterInfos.length; i++) {
      curr = chapterInfos[i];

      const diff = curr.chapterLevel - prev.chapterLevel;

      if (diff > 0) {
        curr.levelStart = diff;
        prev.levelEnd = 0;
      } else {
        curr.levelStart = 0;
        prev.levelEnd = -diff;
      }

      prev = curr;
    }

    curr.levelEnd = curr.chapterLevel;

    //----------------------------------------------
    // ncx navClose 設定
    //----------------------------------------------
    if (ncxNest) {
      prev = null;

      for (const chapterInfo of chapterInfos) {
        curr = chapterInfo;
        curr.navClose = curr.levelEnd + 1;

        if (curr.levelStart > 0 && prev != null) {
          prev.navClose = 0;
        }

        prev = curr;
      }
    }
  }

  toString() {
    return `{chapterLevel: ${this.chapterLevel}, ` +
      `levelStart: ${this.levelStart}, ` +
      `levelEnd: ${this.levelEnd}, ` +
      `navClose: ${this.navClose}, ` +
      `sectionId: "${this.sectionId}", ` +
      `chapterId: "${this.chapterId}", ` +
      `chapterName: "${this.chapterName}"}`;
  }
}