import fs from "fs";
import sharp from "sharp";

export default class ImageInfo {
  /** 画像の情報を生成
   * @param {string} ext png jpg gif webp など
   */
  constructor(ext, width, height) {
    this.id = null;                // ファイルID
    this.outFileName = null;       // 出力ファイル名
    this.ext = ext ? ext.toLowerCase() : null;

    this.width = width ?? -1;
    this.height = height ?? -1;

    this.outWidth = -1;
    this.outHeight = -1;

    this.isCover = false;
    this.rotateAngle = 0;
  }

  // =========================
  // static 生成メソッド
  // =========================

  /** ファイルから画像情報を生成 */
  static async getImageInfoFromFile(imageFile) {
    const buffer = await fs.promises.readFile(imageFile);
    return await ImageInfo.getImageInfo(buffer);
  }

  /** 画像ストリーム / Buffer から画像情報を生成 */
  static async getImageInfo(input) {
    if (!input) return null;

    try {
      const metadata = await sharp(input).metadata();

      if (!metadata || !metadata.format) return null;

      return new ImageInfo(
        metadata.format,      // png jpeg webp gif avif など
        metadata.width,
        metadata.height
      );

    } catch (e) {
      return null;
    }
  }

  /** 既に幅高さが分かっている場合 */
  static getImageInfoFromRaw(ext, width, height) {
    return new ImageInfo(ext, width, height);
  }

  // =========================
  // getter / setter
  // =========================

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getOutFileName() {
    return this.outFileName;
  }

  setOutFileName(file) {
    this.outFileName = file;
  }

  setExt(ext) {
    this.ext = ext?.toLowerCase();
  }

  getExt() {
    return this.ext;
  }

  /** mime形式(image/png)を返す */
  getFormat() {
    if (!this.ext) return null;
    return "image/" + (this.ext === "jpg" ? "jpeg" : this.ext);
  }

  getIsCover() {
    return this.isCover;
  }

  setIsCover(isCover) {
    this.isCover = isCover;
  }

  getWidth() {
    return this.width;
  }

  setWidth(width) {
    this.width = width;
  }

  getHeight() {
    return this.height;
  }

  setHeight(height) {
    this.height = height;
  }

  getOutWidth() {
    return this.outWidth;
  }

  setOutWidth(outWidth) {
    this.outWidth = outWidth;
  }

  getOutHeight() {
    return this.outHeight;
  }

  setOutHeight(outHeight) {
    this.outHeight = outHeight;
  }
}