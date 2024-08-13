//import com.github.hmdev.info.ImageInfo;
//import com.github.hmdev.util.LogAppender;
import ImageInfo from '../info/ImageInfo.js';
import LogAppender from '../util/LogAppender.js';
import Jimp from 'jimp';

export default class ImageUtils {
 /** 4bitグレースケール時のRGB階調カラーモデル Singleton */
  static GRAY16_COLOR_MODEL;
  /** 8bitグレースケール時のRGB階調カラーモデル Singleton */
  static GRAY256_COLOR_MODEL;

  static NOMBRE_TOP = 1;
  static NOMBRE_BOTTOM = 2;
  static NOMBRE_TOPBOTTOM = 3;

  /** png出力用 */
  static pngImageWriter;
  /** jpeg出力用 */
  static jpegImageWriter;

  /** 4bitグレースケール時のRGB階調カラーモデル取得 */
  static getGray16ColorModel() {
    if (this.GRAY16_COLOR_MODEL == null) {
      const GRAY16_VALUES = [
        0, 17, 34, 51, 68, 85, 102, 119, -120, -103, -86, -69, -52, -35, -18, -1
      ];
      this.GRAY16_COLOR_MODEL = new IndexColorModel(4, GRAY16_VALUES.length, GRAY16_VALUES, GRAY16_VALUES, GRAY16_VALUES);
    }
    return this.GRAY16_COLOR_MODEL;
  }

  /** 8bitグレースケール時のRGB階調カラーモデル取得 */
  static getGray256ColorModel() {
    if (this.GRAY256_COLOR_MODEL == null) {
      const GRAY256_VALUES = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
        64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
        96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
        -128, -127, -126, -125, -124, -123, -122, -121, -120, -119, -118, -117, -116, -115, -114, -113, -112, -111, -110, -109, -108, -107, -106, -105, -104, -103, -102, -101, -100, -99, -98, -97,
        -96, -95, -94, -93, -92, -91, -90, -89, -88, -87, -86, -85, -84, -83, -82, -81, -80, -79, -78, -77, -76, -75, -74, -73, -72, -71, -70, -69, -68, -67, -66, -65,
        -64, -63, -62, -61, -60, -59, -58, -57, -56, -55, -54, -53, -52, -51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40, -39, -38, -37, -36, -35, -34, -33,
        -32, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -21, -20, -19, -18, -17, -16, -15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1
      ];
      this.GRAY256_COLOR_MODEL = new IndexColorModel(8, GRAY256_VALUES.length, GRAY256_VALUES, GRAY256_VALUES, GRAY256_VALUES);
    }
    return this.GRAY256_COLOR_MODEL;
  }

  /** ファイルまたはURLの文字列から画像を読み込む
   * 読み込めなければnull */
  static async loadImage(path) {
    try {
      const image = await Jimp.read(path)
      return image;
    } catch (e) {
      return null;
    }
  }

  static NO_TRANSFORM = { translateX: 0, translateY: 0 };

  /** ストリームから画像を読み込み */
  static async readImage(ext, is) {
      const image = await Jimp.read(is)
    return image;
  }

	/** 大きすぎる画像は縮小して出力
	 * @param is 画像の入力ストリーム srcImageがあれば利用しないのでnull
	 * @param srcImage 読み込み済の場合は画像をこちらに設定 nullならisから読み込む
	 * @param zos 出力先Zipストリーム
	 * @param imageInfo 画像情報
	 * @param jpegQuality jpeg画質 (低画質 0.0-1.0 高画質)
	 * @param maxImagePixels 縮小する画素数
	 * @param maxImageW 縮小する画像幅
	 * @param maxImageH 縮小する画像高さ
	 * @param dispW 画面幅 余白除去後の縦横比補正用
	 * @param dispH 画面高さ 余白除去後の縦横比補正用
	 * @param autoMarginLimitH 余白除去 最大%
	 * @param autoMarginLimitV 余白除去 最大%
	 * @param autoMarginWhiteLevel 白画素として判別する白さ 100が白
	 * @param autoMarginPadding 余白除去後に追加するマージン */
  /** ファイルまたはURLの文字列から画像を読み込む
   * 読み込めなければnull */
  static async writeImage(
    is,
    srcImage,
    zos,
    imageInfo,
    jpegQuality,
    gammaOp,
    maxImagePixels,
    maxImageW,
    maxImageH,
    dispW,
    dispH,
    autoMarginLimitH,
    autoMarginLimitV,
    autoMarginWhiteLevel,
    autoMarginPadding,
    autoMarginNombre,
    nombreSize
  ) {
    try {
      const ext = imageInfo.getExt();

      let imgW = imageInfo.getWidth();
      let imgH = imageInfo.getHeight();
      let w = imgW;
      let h = imgH;
      imageInfo.setOutWidth(imgW);
      imageInfo.setOutHeight(imgH);
      // 余白チェック時に読み込んだ画像のバッファ
      let imgBuf = null;

      // 回転とコントラスト調整なら読み込んでおく
      if (!srcImage && (imageInfo.rotateAngle !== 0 || gammaOp)) {
        srcImage = await this.readImage(ext, is);
      }

      let margin = null;
      if (autoMarginLimitH > 0 || autoMarginLimitV > 0) {
        const startPixel = Math.floor(w * 0.01); // 1%
        const ignoreEdge = Math.floor(w * 0.03); // 3%
        const dustSize = Math.floor(w * 0.01); // 1%

        // 画像がなければ読み込み 変更なしの時にそのまま出力できるように一旦バッファに読み込む
        if (!srcImage) {
          const buffers = [];
          for await (const chunk of is) {
            buffers.push(chunk);
          }
          imgBuf = Buffer.concat(buffers);
          srcImage = await this.readImage(ext, imgBuf);
        }

        margin = this.getPlainMargin(
          srcImage,
          autoMarginLimitH / 100,
          autoMarginLimitV / 100,
          autoMarginWhiteLevel / 100,
          autoMarginPadding / 100,
          startPixel,
          ignoreEdge,
          dustSize,
          autoMarginNombre,
          nombreSize
        );

        if (margin.every((m) => m === 0)) margin = null;

        if (margin) {
          const mw = w - margin[0] - margin[2];
          const mh = h - margin[1] - margin[3];
          const dWH = dispW / dispH;
          const mWH = mw / mh;

          if (w / h < dWH) {
            if (mWH > dWH && mw > dispW) {
              mh = Math.floor(mw / dWH);
              margin[3] = h - margin[1] - mh;
              if (margin[3] < 0) {
                margin[3] = 0;
                margin[1] = h - mh;
              }
            }
          } else {
            if (mWH < dWH && mh > dispH) {
              mw = Math.floor(mh * dWH);
              const mLR = margin[0] + margin[2];
              margin[0] = Math.floor((w - mw) * margin[0] / mLR);
              margin[2] = Math.floor((w - mw) * margin[2] / mLR);
            }
          }

          w = mw;
          h = mh;
        }
      }

      let scale = 1;
      if (maxImagePixels >= 10000) scale = Math.sqrt(maxImagePixels / (w * h)); // 最大画素数指定
      if (maxImageW > 0) scale = Math.min(scale, maxImageW / w); // 最大幅指定
      if (maxImageH > 0) scale = Math.min(scale, maxImageH / h); // 最大高さ指定

      if (scale >= 1 && (!gammaOp || srcImage.type === BufferedImage.TYPE_INT_RGB)) {
        if (!srcImage) {
          // 変更なしならそのままファイル出力
          is.pipe(zos);
        } else {
          if (!margin && imgBuf && imageInfo.rotateAngle === 0) {
            // 余白除去が無く画像も編集されていなければバッファからそのまま出力
            zos.write(imgBuf);
          } else {
            // 編集済の画像なら同じ画像形式で書き出し 余白があれば切り取る
            if (imageInfo.rotateAngle !== 0) {
              const outImage = new BufferedImage(h, w, srcImage.type);
              const g = outImage.createGraphics();
              try {
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, h, w);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
                let x = 0;
                let y = 0;
                let at;
                if (imageInfo.rotateAngle === 90) {
                  at = AffineTransformOp.getQuadrantRotateInstance(1, 0, 0);
                  at.translate(0, -imgH);
                  if (margin) {
                    x = -margin[3];
                    y = -margin[0];
                  }
                } else {
                  at = AffineTransformOp.getQuadrantRotateInstance(-1, 0, 0);
                  at.translate(-imgW, 0);
                  if (margin) {
                    x = -margin[1];
                    y = -margin[2];
                  }
                }
                const ato = new AffineTransformOp(at, AffineTransformOp.TYPE_BICUBIC);
                g.drawImage(srcImage, ato, x, y);
              } finally {
                g.dispose();
              }
              srcImage = outImage; // 入れ替え
            } else if (margin) {
              srcImage = srcImage.getSubimage(margin[0], margin[1], srcImage.width - margin[2] - margin[0], srcImage.height - margin[3] - margin[1]);
            }
            if (gammaOp) {
              const filterdImage = new BufferedImage(srcImage.width, srcImage.height, BufferedImage.TYPE_INT_RGB);
              srcImage = gammaOp.filter(srcImage, filterdImage);
            }
            await this._writeImage(zos, srcImage, ext, jpegQuality);
            imageInfo.setOutWidth(srcImage.width);
            imageInfo.setOutHeight(srcImage.height);
            if (imageInfo.rotateAngle !== 0) {
              LogAppender.println(`画像回転: ${imageInfo.getOutFileName()} (${h},${w})`);
            }
          }
        }
      } else {
        // 縮小
        let scaledW = Math.floor(w * scale + 0.5);
        let scaledH = Math.floor(h * scale + 0.5);
        if (imageInfo.rotateAngle !== 0) {
          scaledW = Math.floor(h * scale + 0.5);
          scaledH = Math.floor(w * scale + 0.5);
        }
        // 画像がなければ読み込み
        if (!srcImage) srcImage = await this.readImage(ext, is);
        let outImage;
        let colorModel;
        let raster;
        switch (gammaOp === null ? srcImage.type : BufferedImage.TYPE_INT_RGB) {
          case BufferedImage.TYPE_BYTE_BINARY:
            colorModel = getGray16ColorModel();
            raster = colorModel.createCompatibleWritableRaster(scaledW, scaledH);
            outImage = new BufferedImage(colorModel, raster, true, null);
            break;
          case BufferedImage.TYPE_BYTE_INDEXED:
            colorModel = srcImage.colorModel;
            raster = colorModel.createCompatibleWritableRaster(scaledW, scaledH);
            outImage = new BufferedImage(colorModel, raster, true, null);
            break;
          case BufferedImage.TYPE_BYTE_GRAY:
            outImage = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_BYTE_GRAY);
            break;
          case BufferedImage.TYPE_USHORT_GRAY:
            outImage = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_USHORT_GRAY);
            break;
          default:
            outImage = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_INT_RGB);
        }
        const g = outImage.createGraphics();
        try {
          if (srcImage.type === BufferedImage.TYPE_BYTE_BINARY && srcImage.type === BufferedImage.TYPE_BYTE_INDEXED && srcImage.type === BufferedImage.TYPE_INT_ARGB) {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, scaledW, scaledH);
          }
          g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
          g.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
          const at = AffineTransformOp.getScaleInstance(scale, scale);
          let x = 0;
          let y = 0;
          if (imageInfo.rotateAngle === 0) {
            if (margin) {
              x = Math.floor(-margin[0] * scale + 0.5);
              y = Math.floor(-margin[1] * scale + 0.5);
            }
          } else if (imageInfo.rotateAngle === 90) {
            at.rotate(Math.toRadians(imageInfo.rotateAngle), 0, 0);
            at.translate(0, -imgH);
            if (margin) {
              x = Math.floor(-margin[3] * scale + 0.5);
              y = Math.floor(-margin[0] * scale + 0.5);
            }
          } else {
            at.quadrantRotate(-1, 0, 0);
            at.translate(-imgW, 0);
            if (margin) {
              x = Math.floor(-margin[1] * scale + 0.5);
              y = Math.floor(-margin[2] * scale + 0.5);
            }
          }
          const ato = new AffineTransformOp(at, AffineTransformOp.TYPE_BICUBIC);
          g.drawImage(srcImage, ato, x, y);
        } finally {
          g.dispose();
        }
        // ImageIO.write(outImage, imageInfo.getExt(), zos);
        // コントラスト調整
        if (gammaOp) {
          let filterdImage = new BufferedImage(outImage.width, outImage.height, BufferedImage.TYPE_INT_RGB);
          outImage = gammaOp.filter(outImage, filterdImage);
          filterdImage = null;
          // インデックス化
          switch (srcImage.type) {
            case BufferedImage.TYPE_BYTE_BINARY:
              colorModel = getGray16ColorModel();
              raster = colorModel.createCompatibleWritableRaster(scaledW, scaledH);
              filterdImage = new BufferedImage(colorModel, raster, true, null);
              break;
            case BufferedImage.TYPE_BYTE_INDEXED:
              colorModel = srcImage.colorModel;
              raster = colorModel.createCompatibleWritableRaster(scaledW, scaledH);
              filterdImage = new BufferedImage(colorModel, raster, true, null);
              break;
            case BufferedImage.TYPE_BYTE_GRAY:
              filterdImage = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_BYTE_GRAY);
              break;
            case BufferedImage.TYPE_USHORT_GRAY:
              filterdImage = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_USHORT_GRAY);
              break;
          }
          if (filterdImage) {
            const g = filterdImage.createGraphics();
            try {
              g.drawImage(outImage, 0, 0, null);
            } finally {
              g.dispose();
            }
            outImage = filterdImage;
          }
        }
        await this._writeImage(zos, outImage, ext, jpegQuality);
        imageInfo.setOutWidth(outImage.width);
        imageInfo.setOutHeight(outImage.height);
        if (scale < 1) {
          LogAppender.append('画像縮小');
          if (imageInfo.rotateAngle !== 0) LogAppender.append('回転');
          LogAppender.println(`: ${imageInfo.getOutFileName()} (${w},${h})→(${scaledW},${scaledH})`);
        }
        zos.flush();
      }
    } catch (e) {
      LogAppender.println(`画像読み込みエラー: ${imageInfo.getOutFileName()}`);
      console.error(e);
    }
  }
	/** 画像を出力 マージン指定があればカット
	 * //@param margin カットするピクセル数(left, top, right, bottom) */
  static async _writeImage(zos, srcImage, ext, jpegQuality) {
    if (ext === 'png') {
      /*//PNGEncoder kindlegenでエラーになるのと色が反映されない
      PngEncoder pngEncoder = new PngEncoder();
      int pngColorType = PngEncoder.COLOR_TRUECOLOR;
      switch (srcImage.getType()) {
      case BufferedImage.TYPE_BYTE_BINARY:
        pngColorType = PngEncoder.COLOR_INDEXED; break;
      case BufferedImage.TYPE_BYTE_INDEXED:
        pngColorType = PngEncoder.COLOR_INDEXED; break;
      case BufferedImage.TYPE_BYTE_GRAY:
        pngColorType = PngEncoder.COLOR_GRAYSCALE; break;
      }
      pngEncoder.setColorType(pngColorType);
      pngEncoder.setCompression(PngEncoder.BEST_COMPRESSION);
      pngEncoder.setIndexedColorMode(PngEncoder.INDEXED_COLORS_AUTO);
      pngEncoder.encode(srcImage, zos);
      */
      // ImageIO.write(srcImage, "PNG", zos);
      const imageWriter = getPngImageWriter();
      imageWriter.setOutput(await ImageIO.createImageOutputStream(zos));
      await imageWriter.write(srcImage);
    } else if (ext === 'jpeg' || ext === 'jpg') {
      const imageWriter = getJpegImageWriter();
      imageWriter.setOutput(await ImageIO.createImageOutputStream(zos));
      const iwp = imageWriter.getDefaultWriteParam();
      if (iwp.canWriteCompressed()) {
        try {
          iwp.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
          iwp.setCompressionQuality(jpegQuality);
          await imageWriter.write(null, new IIOImage(srcImage, null, null), iwp);
        } catch (e) {
          console.error(e);
        }
      } else {
        await imageWriter.write(srcImage);
      }
    } else {
      await ImageIO.write(srcImage, ext, zos);
    }
    await zos.flush();
  }

  static getPngImageWriter() {
    if (pngImageWriter !== null) return pngImageWriter;
    const writers = ImageIO.getImageWritersByFormatName('png');
    pngImageWriter = writers.next().value;
    // jai-imageioのpngの挙動がおかしいのでインストールされていても使わない
    if (writers.hasNext() && pngImageWriter.getClass().getName().endsWith('CLibPNGImageWriter')) {
      pngImageWriter = writers.next().value;
    }
    return pngImageWriter;
  }

  static getJpegImageWriter() {
    if (jpegImageWriter !== null) return jpegImageWriter;
    const writers = ImageIO.getImageWritersByFormatName('jpg');
    jpegImageWriter = writers.next().value;
    return jpegImageWriter;
  }


	/** 余白の画素数取得  左右のみずれ調整
	 * @param image 余白を検出する画像
	 * @param limitH 余白のサイズ横 0.0-1.0
	 * @param limitV 余白のサイズ縦 0.0-1.0
	 * @param whiteLevel 余白と判別する白レベル
	 * @param startPixel 余白をチェック開始しする位置 初回が余白なら中へ違えば外が余白になるまで増やす
	 * @param ignoreEdge 行列のチェック時に両端を無視するピクセル数
	 * @param dustSize ゴミのピクセルサイズ
	 * @return 余白画素数(left, top, right, bottom) */

  static getPlainMargin(image, limitH, limitV, whiteLevel, padding, startPixel, ignoreEdge, dustSize, nombreType, nombreSize) {
    const margin = [0, 0, 0, 0]; // left, top, right, bottom
    const width = image.getWidth();
    const height = image.getHeight();

    // rgbともこれより大きければ白画素とする
    const rgbLimit = Math.floor(256 * whiteLevel);

    // 余白除去後に追加する余白 (削れ過ぎるので最低で1にしておく)
    const paddingH = Math.max(1, Math.floor(width * padding));
    const paddingV = Math.max(1, Math.floor(height * padding));

    // 除去制限をピクセルに変更 上下、左右それぞれでの最大値
    const limitPxH = Math.floor(width * limitH); // 後で合計から中央に寄せる
    const limitPxV = Math.floor(height * limitV) / 2;
    // ノンブルがあった場合の最大マージン
    let limitPxT = Math.floor(height * limitV) / 2;
    let limitPxB = Math.floor(height * limitV) / 2;

    if (nombreType === NOMBRE_TOP || nombreType === NOMBRE_TOPBOTTOM) {
      limitPxT += Math.floor(height * 0.05); // 5%加算
    }
    if (nombreType === NOMBRE_BOTTOM || nombreType === NOMBRE_TOPBOTTOM) {
      limitPxB += Math.floor(height * 0.05); // 5%加算
    }

    const ignoreEdgeR = ignoreEdge;
    // 上
    let coloredPixels = getColoredPixelsH(image, width, startPixel, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
    if (coloredPixels > 0) { // 外側へ
      for (let i = startPixel - 1; i >= 0; i--) {
        coloredPixels = getColoredPixelsH(image, width, i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, 0);
        margin[1] = i;
        if (coloredPixels === 0) break;
      }
    } else { // 内側へ
      margin[1] = startPixel;
      for (let i = startPixel + 1; i <= limitPxT; i++) {
        coloredPixels = getColoredPixelsH(image, width, i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
        if (coloredPixels === 0) margin[1] = i;
        else break;
      }
    }
    // 下
    coloredPixels = getColoredPixelsH(image, width, height - 1 - startPixel, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
    if (coloredPixels > 0) { // 外側へ
      for (let i = startPixel - 1; i >= 0; i--) {
        coloredPixels = getColoredPixelsH(image, width, height - 1 - i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, 0);
        margin[3] = i;
        if (coloredPixels === 0) break;
      }
    } else { // 内側へ
      margin[3] = startPixel;
      for (let i = startPixel + 1; i <= limitPxB; i++) {
        coloredPixels = getColoredPixelsH(image, width, height - 1 - i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
        if (coloredPixels === 0) margin[3] = i;
        else break;
      }
    }

    // ノンブル除去
    let hasNombreT = false;
    let hasNombreB = false;
    if (nombreType === NOMBRE_TOP || nombreType === NOMBRE_TOPBOTTOM) {
      // これ以下ならノンブルとして除去
      const nombreLimit = Math.floor(height * nombreSize) + margin[1];
      const nombreDust = Math.floor(height * 0.005);
      // ノンブル上
      let nombreEnd = 0;
      for (let i = margin[1] + 1; i <= nombreLimit; i++) {
        coloredPixels = getColoredPixelsH(image, width, i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, 0);
        if (coloredPixels === 0) {
          nombreEnd = i;
          if (nombreEnd - margin[1] > nombreDust) break; // ノンブル上のゴミは無視
        }
      }
      if (nombreEnd > margin[1] + height * 0.005 && nombreEnd <= nombreLimit) { // 0.5%-3％以下
        let whiteEnd = nombreEnd;
        const whiteLimit = limitPxT; //+(int)(height*0.05); //5%加算
        for (let i = nombreEnd + 1; i <= whiteLimit; i++) {
          coloredPixels = getColoredPixelsH(image, width, i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
          if (coloredPixels === 0) whiteEnd = i;
          else if (i - nombreEnd > nombreDust) break;
        }
        if (whiteEnd > nombreEnd + height * 0.01) { // 1%より大きい空白
          margin[1] = whiteEnd;
          hasNombreT = true;
        }
      }
    }
    if (nombreType === NOMBRE_BOTTOM || nombreType === NOMBRE_TOPBOTTOM) {
      // これ以下ならノンブルとして除去
      const nombreLimit = Math.floor(height * nombreSize) + margin[3];
      const nombreDust = Math.floor(height * 0.005);
      // ノンブル下
      let nombreEnd = 0;
      for (let i = margin[3] + 1; i <= nombreLimit; i++) {
        coloredPixels = getColoredPixelsH(image, width, height - 1 - i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, 0);
        if (coloredPixels === 0) {
          nombreEnd = i;
          if (nombreEnd - margin[3] > nombreDust) break; // ノンブル下のゴミは無視
        }
      }
      if (nombreEnd > margin[3] + height * 0.005 && nombreEnd <= nombreLimit) { // 0.5%-3％以下
        let whiteEnd = nombreEnd;
        const whiteLimit = limitPxB; //+(int)(height*0.05); //5%加算
        for (let i = nombreEnd + 1; i <= whiteLimit; i++) {
          coloredPixels = getColoredPixelsH(image, width, height - 1 - i, rgbLimit, 0, ignoreEdge, ignoreEdgeR, dustSize);
          if (coloredPixels === 0) whiteEnd = i;
          else if (i - nombreEnd > nombreDust) break;
        }
        if (whiteEnd > nombreEnd + height * 0.01) { // 1%より大きい空白
          margin[3] = whiteEnd;
          hasNombreB = true;
        }
      }
    }

    // 左右にノンブル分反映
    const ignoreTop = Math.max(ignoreEdge, margin[1]);
    const ignoreBottom = Math.max(ignoreEdge, margin[3]);
    // 左
    coloredPixels = getColordPixelsV(image, height, startPixel, rgbLimit, 0, ignoreTop, ignoreBottom, dustSize);
    if (coloredPixels > 0) { // 外側へ
      for (let i = startPixel - 1; i >= 0; i--) {
        coloredPixels = getColordPixelsV(image, height, i, rgbLimit, 0, ignoreTop, ignoreBottom, 0);
        margin[0] = i;
        if (coloredPixels === 0) break;
      }
    } else { // 内側へ
      margin[0] = startPixel;
      for (let i = startPixel + 1; i <= limitPxH; i++) {
        coloredPixels = getColordPixelsV(image, height, i, rgbLimit, 0, ignoreTop, ignoreBottom, dustSize);
        if (coloredPixels === 0) margin[0] = i;
        else break;
      }
    }
    // 右
    coloredPixels = getColordPixelsV(image, height, width - 1 - startPixel, rgbLimit, 0, ignoreTop, ignoreBottom, dustSize);
    if (coloredPixels > 0) { // 外側へ
      for (let i = startPixel - 1; i >= 0; i--) {
        coloredPixels = getColordPixelsV(image, height, width - 1 - i, rgbLimit, 0, ignoreTop, ignoreBottom, 0);
        margin[2] = i;
        if (coloredPixels === 0) break;
      }
    } else { // 内側へ
      margin[2] = startPixel;
      for (let i = startPixel + 1; i <= limitPxH; i++) {
        coloredPixels = getColordPixelsV(image, height, width - 1 - i, rgbLimit, 0, ignoreTop, ignoreBottom, dustSize);
        if (coloredPixels === 0) margin[2] = i;
        else break;
      }
    }
    // 左右のカットは小さい方に合わせる
    // if (margin[0] > margin[2]) margin[0] = margin[2];
    // else margin[2] = margin[0];

    // 左右の合計が制限を超えていたら調整
    if (margin[0] + margin[2] > limitPxH) {
      const rate = limitPxH / (margin[0] + margin[2]);
      margin[0] = Math.floor(margin[0] * rate);
      margin[2] = Math.floor(margin[2] * rate);
    }
    /* if (margin[1]+margin[3] > limitPxV) {
      double rate = (double)limitPxV/(margin[1]+margin[3]);
      margin[1] = (int)(margin[1]*rate);
      margin[3] = (int)(margin[3]*rate);
    } */

    // ノンブルがなければ指定値以下にする
    if (!hasNombreT) margin[1] = Math.min(margin[1], limitPxV);
    if (!hasNombreB) margin[3] = Math.min(margin[3], limitPxV);

    // 余白分広げる
    margin[0] -= paddingH;
    if (margin[0] < 0) margin[0] = 0;
    margin[1] -= paddingV;
    if (margin[1] < 0) margin[1] = 0;
    margin[2] -= paddingH;
    if (margin[2] < 0) margin[2] = 0;
    margin[3] -= paddingV;
    if (margin[3] < 0) margin[3] = 0;
    return margin;
  }

	/** 指定範囲の白い画素数の比率を返す
	 * @param image 比率をチェックする画像
	 * @param w 比率をチェックする幅
	 * @param offsetY 画像内の縦位置
	 * @param limitPixel これよりも黒部分が多かったら終了 値はlimit+1が帰る
	 * @return 白画素の比率 0.0-1.0 */
  static getColoredPixelsH(image, w, offsetY, rgbLimit, limitPixel, ignoreEdgeL, ignoreEdgeR, dustSize) {
    // 白でないピクセル数
    let coloredPixels = 0;

    for (let x = w - 1 - ignoreEdgeR; x >= ignoreEdgeL; x--) {
      if (this.isColored(image.getRGB(x, offsetY), rgbLimit)) {
        // ゴミ除外 ゴミのサイズ分先に移動する
        if (dustSize < 4 || !this.isDust(image, x, image.getWidth(), offsetY, image.getHeight(), dustSize, rgbLimit)) {
          coloredPixels++;
          if (limitPixel < coloredPixels) return coloredPixels;
        }
      }
    }
    return coloredPixels;
  }

  /** 指定範囲の白い画素数の比率を返す
   * @param image 比率をチェックする画像
   * @param h 比率をチェックする高さ
   * @param offsetX 画像内の横位置
   * @param limitPixel これよりも白比率が小さくなったら終了 値はlimit+1が帰る
   * @return 白画素の比率 0.0-1.0 */
  static getColordPixelsV(image, h, offsetX, rgbLimit, limitPixel, ignoreTop, ignoreBotttom, dustSize) {
    // 白でないピクセル数
    let coloredPixels = 0;

    for (let y = h - 1 - ignoreBotttom; y >= ignoreTop; y--) {
      if (this.isColored(image.getRGB(offsetX, y), rgbLimit)) {
        // ゴミ除外 ゴミのサイズ分先に移動する
        if (dustSize < 4 || !this.isDust(image, offsetX, image.getWidth(), y, image.getHeight(), dustSize, rgbLimit)) {
          coloredPixels++;
          if (limitPixel < coloredPixels) return coloredPixels;
        }
      }
    }
    return coloredPixels;
  }

  static isColored(rgb, rgbLimit) {
    return rgbLimit > ((rgb >> 16) & 0xFF) || rgbLimit > ((rgb >> 8) & 0xFF) || rgbLimit > (rgb & 0xFF);
  }

  /** ゴミをチェック */
  static isDust(image, curX, maxX, curY, maxY, dustSize, rgbLimit) {
    if (dustSize === 0) return false;

    // ゴミサイズの縦横2倍の範囲
    const minX = Math.max(0, curX - dustSize - 1);
    maxX = Math.min(maxX, curX + dustSize + 1);
    const minY = Math.max(0, curY - dustSize - 1);
    maxY = Math.min(maxY, curY + dustSize + 1);

    // 現在列
    let h = 1;
    for (let y = curY - 1; y >= minY; y--) {
      if (this.isColored(image.getRGB(curX, y), rgbLimit)) h++; else break;
    }
    for (let y = curY + 1; y < maxY; y++) {
      if (this.isColored(image.getRGB(curX, y), rgbLimit)) h++; else break;
    }
    if (h > dustSize) return false;

    let w = 1;
    for (let x = curX - 1; x >= minX; x--) {
      if (this.isColored(image.getRGB(x, curY), rgbLimit)) w++; else break;
    }
    for (let x = curX + 1; x < maxX; x++) {
      if (this.isColored(image.getRGB(x, curY), rgbLimit)) w++; else break;
    }
    if (w > dustSize) return false;

    // 左
    w = 1; // 黒画素のある幅
    for (let x = curX - 1; x >= minX; x--) {
      h = 0;
      for (let y = maxY - 1; y >= minY; y--) {
        if (this.isColored(image.getRGB(x, y), rgbLimit)) h++;
      }
      if (h > dustSize) return false;
      if (h === 0) break; // すべて白なら抜ける
      w++;
    }
    // 右
    for (let x = curX + 1; x < maxX; x++) {
      h = 0;
      for (let y = maxY - 1; y >= minY; y--) {
        if (this.isColored(image.getRGB(x, y), rgbLimit)) h++;
      }
      if (h > dustSize) return false;
      if (h === 0) break; // すべて白なら抜ける
      w++;
    }
    if (w > dustSize) return false;
    // 上
    h = 1; // 黒画素のある高さ
    for (let y = curY - 1; y >= minY; y--) {
      w = 0;
      for (let x = maxX - 1; x >= minX; x--) {
        if (this.isColored(image.getRGB(x, y), rgbLimit)) w++;
      }
      if (w > dustSize) return false;
      if (w === 0) break; // すべて白なら抜ける
      h++;
    }
    // 下
    for (let y = curY + 1; y < maxY; y++) {
      w = 0;
      for (let x = maxX - 1; x >= minX; x--) {
        if (this.isColored(image.getRGB(x, y), rgbLimit)) w++;
      }
      if (w > dustSize) return false;
      if (w === 0) break; // すべて白なら抜ける
      h++;
    }
    return h <= dustSize;
  }

}
  
  // Usage example
  /*
  (async () => {
    const imageUrl = "https://example.com/image.png";
    const canvas = await ImageUtils.loadImage(imageUrl);
    if (canvas) {
      document.body.appendChild(canvas);
    } else {
      console.log("Image could not be loaded.");
    }
  })();
*/ 