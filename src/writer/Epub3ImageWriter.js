import { v4 as uuidv4 } from 'uuid';

import AozoraEpub3Converter from '../converter/AozoraEpub3Converter.js';
import PageBreakType from '../converter/PageBreakType.js';
import ImageInfoReader from '../image/ImageInfoReader.js';
import ImageUtils from '../image/ImageUtils.js';
import BookInfo from '../info/BookInfo.js';
import ChapterInfo from '../info/ChapterInfo.js';
import ChapterLineInfo from '../info/ChapterLineInfo.js';
import GaijiInfo from '../info/GaijiInfo.js';
import ImageInfo from '../info/ImageInfo.js';
import SectionInfo from '../info/SectionInfo.js';
import CharUtils from '../util/CharUtils.js';
import LogAppender from '../util/LogAppender.js';
import Epub3Writer from '../writer/Epub3Writer.js';
/** ePub3用のファイル一式をZipで固めたファイルを生成.
 * 画像のみのZipの場合こちらで画像専用の処理を行う
 */
export default class Epub3ImageWriter extends Epub3Writer {
  /** コピーのみのファイル */
  static TEMPLATE_FILE_NAMES_VERTICAL_IMAGE = [
    'META-INF/container.xml',
    `${Epub3Writer.OPS_PATH}${Epub3Writer.CSS_PATH}vertical_image.css`
  ];
  static TEMPLATE_FILE_NAMES_HORIZONTAL_IMAGE = [
    'META-INF/container.xml',
    `${Epub3Writer.OPS_PATH}${Epub3Writer.CSS_PATH}horizontal_image.css`
  ];
  static TEMPLATE_FILE_NAMES_SVG_IMAGE = [
    'META-INF/container.xml',
    `${Epub3Writer.OPS_PATH}${Epub3Writer.CSS_PATH}fixed-layout-jp.css`
  ];

  getTemplateFiles() {
    //if (this.isSvgImage)
    return Epub3ImageWriter.TEMPLATE_FILE_NAMES_SVG_IMAGE;
    //if (!this.bookInfo.vertical) return Epub3ImageWriter.TEMPLATE_FILE_NAMES_HORIZONTAL_IMAGE;
    //if (this.bookInfo != null && this.bookInfo.vertical) return Epub3ImageWriter.TEMPLATE_FILE_NAMES_VERTICAL_IMAGE;
    //return Epub3ImageWriter.TEMPLATE_FILE_NAMES_VERTICAL_IMAGE;
  }

  /** 出力先ePubのZipストリーム */
  zos;

  /** コンストラクタ
   * //@param templatePath epubテンプレート格納パス文字列 最後は"/"
   */
  constructor(jarPath) {
    super(jarPath);
  }

  /** 本文を出力する
   * setFileNamesで sortedFileNames が設定されている必要がある
   * @throws RarException */
  async writeSections(converter, src, bw, srcFile, srcExt, zos) {
    const vecFileName = [];
    //ファイル名取得してImageInfoのIDを設定
    let pageNum = 0;
    for (const srcFilePath of this.imageInfoReader.getImageFileNames()) {
      if (this.canceled) return;
      pageNum++;
      vecFileName.push(this.getImageFilePath(srcFilePath.trim(), pageNum));
    }

    //画像を出力して出力サイズを取得
    zos.setLevel(0);
    //サブパスの文字長
    let archivePathLength = 0;
    if (this.bookInfo.textEntryName != null) archivePathLength = this.bookInfo.textEntryName.indexOf('/') + 1;

    if (srcExt === 'rar') {
      const archive = new Archive(fs.readFileSync(srcFile));
      try {
        for (const fileHeader of archive.getFileHeaders()) {
          if (!fileHeader.isDirectory()) {
            let entryName = fileHeader.getFileName();
            entryName = entryName.replace(/\\/g, '/');
            //アーカイブ内のサブフォルダは除外
            const srcImageFileName = entryName.substring(archivePathLength);
            const is = await archive.getStream(fileHeader);
            try {
              await this.writeArchiveImage(srcImageFileName, is);
            } finally {
              is.close();
            }
          }
          if (this.canceled) return;
        }
      } finally {
        archive.close();
      }
    } else {
      const zis = new ZipArchiveInputStream(fs.createReadStream(srcFile, { highWaterMark: 65536 }), 'MS932', false);
      try {
        let entry;
        while ((entry = await zis.getNextEntry()) != null) {
          //アーカイブ内のサブフォルダは除外
          const srcImageFileName = entry.getName().substring(archivePathLength);
          await this.writeArchiveImage(srcImageFileName, zis);
          if (this.canceled) return;
        }
      } finally {
        zis.close();
      }
    }

    //画像xhtmlを出力
    zos.setLevel(9);
    pageNum = 0;
    for (const srcFilePath of this.imageInfoReader.getImageFileNames()) {
      if (this.canceled) return;
      const fileName = vecFileName[pageNum++];
      if (fileName != null) {
        if (this.bookInfo.imageOnly) {
          this.printSvgImageSection(srcFilePath);
        } else {
          this.startImageSection(srcFilePath);
          bw.write(converter.getChukiValue('画像')[0].replace('%s', fileName));
          bw.write(converter.getChukiValue('画像終わり')[0]);
          bw.flush();
          this.endSection();
        }
      }
      if (this.jProgressBar != null) this.jProgressBar.value = this.jProgressBar.value + 1;
      if (this.canceled) return;
    }
  }

  /** セクション開始.
   * @throws IOException */
  async startImageSection(srcImageFilePath) {
    this.sectionIndex++;
    const sectionId = decimalFormat.format(this.sectionIndex);
    //package.opf用にファイル名
    const sectionInfo = new SectionInfo(sectionId);

    //画像専用指定
    sectionInfo.setImagePage(true);
    //画像サイズが横長なら幅に合わせる
    const imageInfo = this.imageInfoReader.getImageInfo(srcImageFilePath);
    if (imageInfo != null) {
      if (imageInfo.getWidth() / imageInfo.getHeight() >= this.dispW / this.dispH) {
        if (this.rotateAngle !== 0 && this.dispW < this.dispH && imageInfo.getHeight() / imageInfo.getWidth() < this.dispW / this.dispH) { //縦長画面で横長
          imageInfo.rotateAngle = this.rotateAngle;
          if (this.imageSizeType !== SectionInfo.IMAGE_SIZE_TYPE_AUTO) sectionInfo.setImageFitH(true);
        } else {
          //高さでサイズ調整する場合は高さの%指定
          if (this.imageSizeType === SectionInfo.IMAGE_SIZE_TYPE_HEIGHT) sectionInfo.setImageHeight((imageInfo.getHeight() / imageInfo.getWidth()) * (this.dispW / this.dispH));
          else if (this.imageSizeType === SectionInfo.IMAGE_SIZE_TYPE_ASPECT) sectionInfo.setImageFitW(true);
        }
      } else {
        if (this.rotateAngle !== 0 && this.dispW > this.dispH && imageInfo.getHeight() / imageInfo.getWidth() > this.dispW / this.dispH) { //横長画面で縦長
          imageInfo.rotateAngle = this.rotateAngle;
          //高さでサイズ調整する場合は高さの%指定
          if (this.imageSizeType === SectionInfo.IMAGE_SIZE_TYPE_HEIGHT) sectionInfo.setImageHeight((imageInfo.getHeight() / imageInfo.getWidth()) * (this.dispW / this.dispH));
          else if (this.imageSizeType === SectionInfo.IMAGE_SIZE_TYPE_ASPECT) sectionInfo.setImageFitW(true);
        } else {
          if (this.imageSizeType !== SectionInfo.IMAGE_SIZE_TYPE_AUTO) sectionInfo.setImageFitH(true);
        }
      }
    }

    this.sectionInfos.push(sectionInfo);
    if (this.sectionIndex === 1 || this.sectionIndex % 5 === 0) this.addChapter(null, `${this.sectionIndex}`, 0); //目次追加
    super.zos.putArchiveEntry(new ZipArchiveEntry(`${OPS_PATH}${XHTML_PATH}${sectionId}.xhtml`));
    //ヘッダ出力
    const bw = fs.createWriteStream(super.zos, { encoding: 'UTF-8' });
    //出力開始するセクションに対応したSectionInfoを設定
    this.velocityContext.put('sectionInfo', sectionInfo);
    Velocity.getTemplate(`${this.templatePath}${OPS_PATH}${XHTML_PATH}${XHTML_HEADER_VM}`).merge(this.velocityContext, bw);
    bw.end();
  }

  /** SVGでセクション出力 */
  async printSvgImageSection(srcImageFilePath) {
    this.sectionIndex++;
    const sectionId = decimalFormat.format(this.sectionIndex);
    //package.opf用にファイル名
    const sectionInfo = new SectionInfo(sectionId);
    const imageInfo = this.imageInfoReader.getImageInfo(srcImageFilePath);

    //画像専用指定
    sectionInfo.setImagePage(true);
    this.sectionInfos.push(sectionInfo);
    if (this.sectionIndex === 1 || this.sectionIndex % 5 === 0) this.addChapter(null, `${this.sectionIndex}`, 0); //目次追加
    super.zos.putArchiveEntry(new ZipArchiveEntry(`${OPS_PATH}${XHTML_PATH}${sectionId}.xhtml`));
    //ヘッダ出力
    const bw = fs.createWriteStream(super.zos, { encoding: 'UTF-8' });
    //出力開始するセクションに対応したSectionInfoを設定
    this.velocityContext.put('sectionInfo', sectionInfo);
    this.velocityContext.put('imageInfo', imageInfo);
    Velocity.getTemplate(`${this.templatePath}${OPS_PATH}${XHTML_PATH}${SVG_IMAGE_VM}`).merge(this.velocityContext, bw);
    bw.end();
  }

  async getImageFilePath(srcImageFileName, lineNum) {
    let isCover = false;
    this.imageIndex++; //xhtmlと画像ファイル名の番号を合わせるため先に++
    let ext = '';
    try { ext = srcImageFileName.substring(srcImageFileName.lastIndexOf('.') + 1).toLowerCase(); } catch (e) { }
    const imageId = decimalFormat.format(this.imageIndex);
    const imageFileName = `${IMAGES_PATH}${imageId}.${ext}`;
    let imageInfo;
    try {
      imageInfo = this.imageInfoReader.getImageInfo(srcImageFileName);
      imageInfo.setId(imageId);
      imageInfo.setOutFileName(`${imageId}.${ext}`);
      if (!imageInfo.getExt().match(/^(png|jpeg|gif|jpg)$/)) {
        LogAppender.error(lineNum, '画像フォーマットエラー', srcImageFileName);
        return null;
      }
      if (this.imageIndex - 1 === bookInfo.coverImageIndex) {
        imageInfo.setIsCover(true);
        isCover = true;
      }
      this.imageInfos.push(imageInfo);

    } catch (e) {
      e.printStackTrace();
      return null;
    }
    //先頭に表紙ページ移動の場合でカバーページならnullを返して本文中から削除
    if (bookInfo.insertCoverPage && isCover) return null;
    return `../${imageFileName}`;
  }
}


