// GaijiInfo.js

import path from 'path';

export default class GaijiInfo {
    /**
     * @param {string} className - クラス名
     * @param {string} gaijiFile - 外字フォントのファイルパス
     */
    constructor(className, gaijiFile) {
        this.className = className;
        this.gaijiFile = gaijiFile;
    }

    /**
     * ファイル名を取得する
     * @returns {string}
     */
    getFileName() {
        return path.basename(this.gaijiFile);
    }

    /**
     * ファイルパスを取得する
     * @returns {string}
     */
    getFile() {
        return this.gaijiFile;
    }

    /**
     * ファイルパスを設定する
     * @param {string} gaijiFile
     */
    setFile(gaijiFile) {
        this.gaijiFile = gaijiFile;
    }

    /**
     * クラス名を取得する
     * @returns {string}
     */
    getClassName() {
        return this.className;
    }

    /**
     * クラス名を設定する
     * @param {string} className
     */
    setClassName(className) {
        this.className = className;
    }
}
