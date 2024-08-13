// SectionInfo.js

export default class SectionInfo {
    /**
     * @param {string} sectionId - セクションID
     */
    constructor(sectionId) {
        this.sectionId = sectionId;
        this.imagePage = false;
        this.imageHeight = -1;
        this.imageFitW = false;
        this.imageFitH = false;
        this.isMiddle = false;
        this.isBottom = false;
        this.startLine = 0;
        this.endLine = 0;
    }

    static get IMAGE_SIZE_TYPE_AUTO() {
        return 1;
    }

    static get IMAGE_SIZE_TYPE_HEIGHT() {
        return 2;
    }

    static get IMAGE_SIZE_TYPE_ASPECT() {
        return 3;
    }

    getSectionId() {
        return this.sectionId;
    }

    setSectionId(sectionId) {
        this.sectionId = sectionId;
    }

    isImagePage() {
        return this.imagePage;
    }

    setImagePage(imagePage) {
        this.imagePage = imagePage;
    }

    getImageHeight() {
        return this.imageHeight;
    }

    setImageHeight(imageHeight) {
        this.imageHeight = imageHeight;
    }

    getImageHeightPercent() {
        return Math.round(this.imageHeight * 1000) / 10.0;
    }

    getImageHeightPadding() {
        return Math.round((1 - this.imageHeight) * 1000) / 20.0;
    }

    isImageFitW() {
        return this.imageFitW;
    }

    setImageFitW(imageFitW) {
        this.imageFitW = imageFitW;
    }

    isImageFitH() {
        return this.imageFitH;
    }

    setImageFitH(imageFitH) {
        this.imageFitH = imageFitH;
    }

    isMiddle() {
        return this.isMiddle;
    }

    setMiddle(isMiddle) {
        this.isMiddle = isMiddle;
    }

    isBottom() {
        return this.isBottom;
    }

    setBottom(isBottom) {
        this.isBottom = isBottom;
    }

    getStartLine() {
        return this.startLine;
    }

    setStartLine(startLine) {
        this.startLine = startLine;
    }

    getEndLine() {
        return this.endLine;
    }

    setEndLine(endLine) {
        this.endLine = endLine;
    }
}