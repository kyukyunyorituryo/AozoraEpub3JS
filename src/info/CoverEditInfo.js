// CoverEditInfo.js

export default class CoverEditInfo {
    /**
     * @param {number} panelWidth - パネルの幅
     * @param {number} panelHeight - パネルの高さ
     * @param {number} fitType - フィットタイプ
     * @param {number} scale - スケール
     * @param {number} offsetX - X方向のオフセット
     * @param {number} offsetY - Y方向のオフセット
     * @param {number} visibleWidth - 可視幅
     */
    constructor(panelWidth, panelHeight, fitType, scale, offsetX, offsetY, visibleWidth) {
        this.panelWidth = panelWidth;
        this.panelHeight = panelHeight;
        this.fitType = fitType;
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.visibleWidth = visibleWidth;
    }
}
