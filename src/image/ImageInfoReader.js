import fs from 'fs';
import path from 'path';
import JSZip from "jszip";
import unrar from "node-unrar-js";
//import { getImageInfo } from './ImageUtils.js';
import FileNameComparator from '../util/FileNameComparator.js';
import LogAppender from '../util/LogAppender.js';
import ImageInfo from '../info/ImageInfo.js';

/**
 * 画像情報を格納するクラス
 * 画像取得関連のメソッドもここで定義
 */
export default class ImageInfoReader {
    /**
     * @param {boolean} isFile - 画像が圧縮ファイル内でなくファイルならtrue
     * @param {File} srcFile - 変換するtxtまたは圧縮ファイル
     */
    constructor(isFile, srcFile) {
        this.isFile = isFile;
        this.srcFile = srcFile;
        this.srcParentPath = path.dirname(srcFile) + '/';
        this.archiveTextParentPath = '';
        this.imageFileNames = [];
        this.imageFileInfos = new Map();
    }

    /**
     * zipの場合はzip内のtxtのentryNameと親のパスを設定
     * @param {string} archiveTextEntry
     */
    setArchiveTextEntry(archiveTextEntry) {
        const idx = archiveTextEntry.lastIndexOf('/');
        if (idx > -1) {
            this.archiveTextParentPath = archiveTextEntry.substring(0, idx + 1);
        }
    }

    /**
     * 画像ファイルを取得
     * @param {string} fileName
     * @returns {File}
     */
    getImageFile(fileName) {
        return path.join(this.srcParentPath, fileName);
    }

    /**
     * 画像出力順にImageInfoを格納 zipの場合は後で並び替える
     * @param {string} imageFileName
     */
    addImageFileName(imageFileName) {
        this.imageFileNames.push(path.join(this.archiveTextParentPath, imageFileName));
    }

    /**
     * 名前順で並び替え
     */
    sortImageFileNames() {
        this.imageFileNames.sort(new FileNameComparator());
    }

    /**
     * 指定位置の画像ファイル名を取得
     * @param {number} idx
     * @returns {string}
     */
    getImageFileName(idx) {
        return this.imageFileNames.get(idx);
    }

    /**
     * 画像ファイル名のVectorを取得
     * @returns {Vector}
     */
    getImageFileNames() {
        return this.imageFileNames;
    }

    /**
     * 画像情報のカウント
     * @returns {number}
     */
    countImageFileInfos() {
        return this.imageFileInfos.size;
    }

    /**
     * テキスト内の画像順で格納された画像ファイル名の件数
     * @returns {number}
     */
    countImageFileNames() {
        return this.imageFileNames.size();
    }

    /**
     * 指定した順番の画像情報を取得
     * @param {number} idx
     * @returns {ImageInfo}
     * @throws {IOException}
     */
    getImageInfo(idx) {
        if (this.imageFileNames.size() - 1 < idx) return null;
        return this.getImageInfo(this.imageFileNames.get(idx));
    }

    /**
     * ImageInfoを取得
     * @param {string} srcImageFileName
     * @returns {ImageInfo}
     * @throws {IOException}
     */
    getImageInfo(srcImageFileName) {
        return this._getImageInfo(srcImageFileName);
    }

    /**
     * ImageInfoを取得
     * @param {string} srcImageFileName
     * @returns {ImageInfo}
     * @throws {IOException}
     */
    getCollectImageInfo(srcImageFileName) {
        let imageInfo = this._getImageInfo(srcImageFileName);
        if (!imageInfo) {
            imageInfo = this._getImageInfo(this.correctExt(srcImageFileName));
        }
        return imageInfo;
    }

    /**
     * 拡張子修正
     * @param {string} srcImageFileName
     * @returns {string}
     * @throws {IOException}
     */
    correctExt(srcImageFileName) {
        if (this.hasImage(srcImageFileName)) return srcImageFileName;

        const extensions = ['png', 'jpg', 'jpeg', 'gif', 'PNG', 'JPG', 'JPEG', 'GIF', 'Png', 'Jpg', 'Jpeg', 'Gif'];

        for (let ext of extensions) {
            srcImageFileName = srcImageFileName.replace(/\.\w+$/, `.${ext}`);
            if (this.hasImage(srcImageFileName)) return srcImageFileName;
        }
        return null;
    }

    /**
     * 画像が存在するかを確認
     * @param {string} srcImageFileName
     * @returns {boolean}
     */
    hasImage(srcImageFileName) {
        if (this.imageFileInfos.has(srcImageFileName)) return true;
        if (this.isFile) {
            const imageFile = path.join(this.srcParentPath, srcImageFileName);
            return fs.existsSync(imageFile);
        } else {
            return this.imageFileInfos.has(path.join(this.archiveTextParentPath, srcImageFileName));
        }
    }

    /**
     * ImageInfoを取得
     * @param {string} srcImageFileName
     * @returns {ImageInfo}
     * @throws {IOException}
     */
    _getImageInfo(srcImageFileName) {
        let imageInfo = this.imageFileInfos.get(srcImageFileName);
        if (imageInfo) return imageInfo;

        if (this.isFile) {
            const imageFile = path.join(this.srcParentPath, srcImageFileName);
            if (fs.existsSync(imageFile)) {
                imageInfo = ImageInfo.getImageInfo(imageFile);
                if (imageInfo) {
                    this.imageFileInfos.set(srcImageFileName, imageInfo);
                    return imageInfo;
                }
            }
        } else {
            imageInfo = this.imageFileInfos.get(path.join(this.archiveTextParentPath, srcImageFileName));
            return imageInfo;
        }
        return null;
    }

    /**
     * zip内の画像情報をすべて読み込み
     * @param {File} srcFile
     * @param {boolean} addFileName
     * @throws {IOException}
     */
    async loadZipImageInfos(srcFile, addFileName) {
        const fileContent = fs.readFileSync(srcFile).buffer;
        const zip = new JSZip();
        await zip.loadAsync(fileContent);
        try {
            let idx = 0;
            for (let entry of zip.files) {
                const file = zip.files[entry];
                if (idx++ % 10 === 0) LogAppender.append(".");
                if (!file.dir) {
                const entryName = file.name;
                const lowerName = entryName.toLowerCase();
                if (['.png', '.jpg', '.jpeg', '.gif'].some(ext => lowerName.endsWith(ext))) {
                    try {
                        const imageInfo = await ImageInfo.getImageInfo(file._data.compressedContent);
                        if (imageInfo) {
                            this.imageFileInfos.set(entryName, imageInfo);
                            if (addFileName) this.addImageFileName(entryName);
                        }
                    } catch (e) {
                        LogAppender.error(`画像が読み込めませんでした: ${srcFile.getPath()}`);
                        console.error(e);
                    }
                }
            }
            }
        } finally {
            LogAppender.println();
        }
    }

    /**
     * rar内の画像情報をすべて読み込み
     * @param {File} srcFile
     * @param {boolean} addFileName
     * @throws {IOException}
     */
    async loadRarImageInfos(srcFile, addFileName) {
        const buf = Uint8Array.from(fs.readFileSync(srcFile)).buffer;
        const extractor = await unrar.createExtractorFromData({ data: buf });
      
        const list = extractor.getFileList();
        const listArcHeader = list.arcHeader; // archive header
        const fileHeaders = [...list.fileHeaders]; // load the file headers
        try {
            let idx = 0;
            for (let fileHeader of fileHeaders) {
                if (idx++ % 10 === 0) LogAppender.append(".");
                    const entryName = fileHeader.name.replace('\\', '/');
                    const lowerName = entryName.toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.gif'].some(ext => lowerName.endsWith(ext))) {
                        let imageInfo = null;
                        try {
                            const extracted = extractor.extract({ files: [fileHeader] });
                            const files = [...extracted.files]; //load the files
                            files[0].extraction;
                            const buffer = files[0].extraction;
                            imageInfo = ImageInfo.getImageInfo(buffer);
                            if (imageInfo) {
                                this.imageFileInfos.set(entryName, imageInfo);
                                if (addFileName) this.addImageFileName(entryName);
                            } else {
                                LogAppender.println();
                                LogAppender.error(`画像が読み込めませんでした: ${entryName}`);
                            }
                        } catch (e) {
                            LogAppender.println();
                            LogAppender.error(`画像が読み込めませんでした: ${entryName}`);
                            console.error(e);
                        }
                    }
                
            }
        } finally {
            LogAppender.println();
        }
    }

    /**
     * 圧縮ファイル内の画像で画像注記以外の画像も表紙に選択できるように追加
     */
    addNoNameImageFileName() {
        const names = [];
        for (let imageFileName of this.imageFileInfos.keys()) {
            if (this.imageFileInfos.get(imageFileName)) {
                names.push(imageFileName);
            }
        }
        names.sort(new FileNameComparator());
        for (let imageFileName of names) {
            this.imageFileNames.add(imageFileName);
        }
    }

    /** 指定した順番の画像情報を取得 */
    async getImageByIndex(idx) {
        return await this.getImage(this.imageFileNames[idx]);
    }

    /** ファイル名から画像を取得
     * 拡張子変更等は外側で修正しておく
     * ファイルシステムまたはZipファイルから指定されたファイル名の画像を取得
     * @param srcImageFileName ファイル名 Zipならエントリ名
     * ※先頭からシークされるので遅い?
     */
    async getImage(srcImageFileName) {
        if (this.isFile) {
            let file = path.join(this.srcParentPath, srcImageFileName);
            if (!fs.existsSync(file)) {
                // 拡張子修正
                srcImageFileName = this.correctExt(srcImageFileName);
                file = path.join(this.srcParentPath, srcImageFileName);
                if (!fs.existsSync(file)) return null;
            }

            const bis = createReadStream(file, { bufferSize: 8192 });
            try {
                return await readImage(path.extname(srcImageFileName).toLowerCase(), bis);
            } finally {
                bis.close();
            }
        } else {
            if (this.srcFile.endsWith('.rar')) {
                const buf = Uint8Array.from(fs.readFileSync(this.srcFile)).buffer;
                const extractor = await unrar.createExtractorFromData({ data: buf });
              
                const list = extractor.getFileList();
                const listArcHeader = list.arcHeader; // archive header
                const fileHeaders = [...list.fileHeaders]; // load the file headers
                for (let fileHeader of fileHeaders) {
                    if (!fileHeader.flags.directory) {
                        let entryName = fileHeader.name.replace(/\\/g, '/');
                        if (srcImageFileName === entryName) {
                        const extracted = extractor.extract({ files: [fileHeader] });
                        const files = [...extracted.files]; //load the files                    
                        return await readImage(path.extname(srcImageFileName).toLowerCase(), files[0].extraction);
                        }
                    }
                }
            } else {
      try {
        const fileContent = fs.readFileSync(this.srcFile, null).buffer;
        const zip = new JSZip();
        await zip.loadAsync(fileContent);
        let entry = zip.files[srcImageFileName];
        if (entry === null) {
            srcImageFileName = this.correctExt(srcImageFileName);
            entry = zip.files[srcImageFileName];
            if (entry === null) return null;
        }
            const is = entry._data.compressedContent
                const fileExtension = srcImageFileName.substring(srcImageFileName.lastIndexOf('.') + 1).toLowerCase();
                return await readImage(fileExtension, is);

        } catch (e) {
            console.error(e);
        }
            }
        }
        return null;
    }

}
