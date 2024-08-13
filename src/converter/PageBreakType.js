/**
 * 改ページ情報
 */

export default class PageBreakType {
    // Image page types
    static IMAGE_PAGE_NONE = 0;
    static IMAGE_PAGE_W = 1;
    static IMAGE_PAGE_H = 2;
    static IMAGE_PAGE_NOFIT = 5;
    static IMAGE_PAGE_AUTO = 10;

    // Inline image types
    static IMAGE_INLINE_W = 11;
    static IMAGE_INLINE_H = 12;
    static IMAGE_INLINE_TOP = 20;
    static IMAGE_INLINE_BOTTOM = 21;
    static IMAGE_INLINE_TOP_W = 25;
    static IMAGE_INLINE_BOTTOM_W = 26;

    // Page types
    static PAGE_NORMAL = 0;
    static PAGE_MIDDLE = 1;
    static PAGE_BOTTOM = 2;

    constructor(ignoreEmptyPage = true, pageType = PageBreakType.PAGE_NORMAL, imagePageType = PageBreakType.IMAGE_PAGE_NONE, noChapter = false) {
        this.ignoreEmptyPage = ignoreEmptyPage;
        this.pageType = pageType;
        this.imagePageType = imagePageType;
        this.noChapter = noChapter;
        this.srcFileName = null;
        this.dstFileName = null;
    }
}
