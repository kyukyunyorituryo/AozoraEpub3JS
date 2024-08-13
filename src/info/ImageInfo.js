// ImageInfo.js

import fs from 'fs';
import path from 'path';
//const sharp = require('sharp');

export default class ImageInfo {
    /**
     * @param {string} ext - 画像フォーマット (png, jpg, gif)
     * @param {number} width - 画像の幅
     * @param {number} height - 画像の高さ
     */
    constructor(ext, width, height) {
        this.id = '';
        this.outFileName = '';
        this.ext = ext.toLowerCase();
        this.width = width;
        this.height = height;
        this.outWidth = -1;
        this.outHeight = -1;
        this.isCover = false;
        this.rotateAngle = 0;
    }

    /**
     * ファイルから画像情報を取得する
     * @param {string} imageFile - 画像ファイルのパス
     * @returns {Promise<ImageInfo>}
     */
    static async getImageInfo(imageFile) {
        const image = sharp(imageFile);
        const metadata = await image.metadata();
        return new ImageInfo(metadata.format, metadata.width, metadata.height);
    }

    /**
     * 画像ストリームから画像情報を取得する
     * @param {Buffer} buffer - 画像データのバッファ
     * @returns {Promise<ImageInfo>}
     */
    static async getImageInfoFromBuffer(buffer) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        return new ImageInfo(metadata.format, metadata.width, metadata.height);
    }

    /**
     * 画像形式を設定する
     * @param {string} ext - 画像フォーマット
     */
    setExt(ext) {
        this.ext = ext;
    }

    /**
     * 画像形式を取得する
     * @returns {string}
     */
    getExt() {
        return this.ext;
    }

    /**
     * mime形式の形式フォーマット文字列を取得する
     * @returns {string}
     */
    getFormat() {
        return `image/${this.ext === 'jpg' ? 'jpeg' : this.ext}`;
    }

    /**
     * 画像のIDを設定する
     * @param {string} id
     */
    setId(id) {
        this.id = id;
    }

    /**
     * 画像のIDを取得する
     * @returns {string}
     */
    getId() {
        return this.id;
    }

    /**
     * 出力ファイル名を設定する
     * @param {string} file
     */
    setOutFileName(file) {
        this.outFileName = file;
    }

    /**
     * 出力ファイル名を取得する
     * @returns {string}
     */
    getOutFileName() {
        return this.outFileName;
    }

    /**
     * カバー画像かどうかを設定する
     * @param {boolean} isCover
     */
    setIsCover(isCover) {
        this.isCover = isCover;
    }

    /**
     * カバー画像かどうかを取得する
     * @returns {boolean}
     */
    getIsCover() {
        return this.isCover;
    }

    /**
     * 画像の幅を設定する
     * @param {number} width
     */
    setWidth(width) {
        this.width = width;
    }

    /**
     * 画像の幅を取得する
     * @returns {number}
     */
    getWidth() {
        return this.width;
    }

    /**
     * 画像の高さを設定する
     * @param {number} height
     */
    setHeight(height) {
        this.height = height;
    }

    /**
     * 画像の高さを取得する
     * @returns {number}
     */
    getHeight() {
        return this.height;
    }

    /**
     * 出力画像の幅を設定する
     * @param {number} outWidth
     */
    setOutWidth(outWidth) {
        this.outWidth = outWidth;
    }

    /**
     * 出力画像の幅を取得する
     * @returns {number}
     */
    getOutWidth() {
        return this.outWidth;
    }

    /**
     * 出力画像の高さを設定する
     * @param {number} outHeight
     */
    setOutHeight(outHeight) {
        this.outHeight = outHeight;
    }

    /**
     * 出力画像の高さを取得する
     * @returns {number}
     */
    getOutHeight() {
        return this.outHeight;
    }
}
