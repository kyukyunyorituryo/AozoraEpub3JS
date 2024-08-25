import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import PropertiesReader from 'properties-reader';
//import { ZipFile } from 'yazl';
import Archive from 'node-unrar-js';
import AozoraEpub3Converter from  './converter/AozoraEpub3Converter.js';
import ImageInfoReader from './image/ImageInfoReader.js';
import BookInfo from './info/BookInfo.js';
import SectionInfo from './info/SectionInfo.js';
import Detector from  './util/Detector.js';
import LogAppender from  './util/LogAppender.js';
//import Epub3ImageWriter from './writer/Epub3ImageWriter.js';
import Epub3Writer from  './writer/Epub3Writer.js';

/** コマンドライン実行用mainとePub3変換関数 */
export default class AozoraEpub3 {
    static VERSION = "1.1.1b24Q";

    /** コマンドライン実行用 */
    async main(args) {
        let jarPath = process.env['NODE_PATH'] || '';
        let idx = jarPath.indexOf(';');
        if (idx > 0) jarPath = jarPath.substring(0, idx);
        if (!jarPath.endsWith('.jar')) jarPath = '';
        else jarPath = jarPath.substring(0, jarPath.lastIndexOf(path.sep) + 1);
        //this.cachePath = new File(jarPath+".cache");
        //this.webConfigPath = new File(jarPath+"web");

        /** ePub3出力クラス */
        let epub3Writer;
        /** ePub3画像出力クラス */
        let epub3ImageWriter;

        /** 設定ファイル */
        let props;
        /** 設定ファイル名 */
        const propFileName = "AozoraEpub3.ini";
        /** 出力先パス */
        let dstPath = null;

        const helpMsg = `AozoraEpub3 [-options] input_files(txt,zip,cbz)\nversion : ${AozoraEpub3.VERSION}`;
        try {
            // コマンドライン オプション設定
            const options = new Command();
            options
                .option('-h, --help', 'show usage')
                .option('-i, --ini <file>', '指定したiniファイルから設定を読み込みます (コマンドラインオプション以外の設定)')
                .option('-t <type>', '本文内の表題種別\n[0:表題→著者名] (default)\n[1:著者名→表題]\n[2:表題→著者名(副題優先)]\n[3:表題のみ]\n[4:なし]')
                .option('-tf', '入力ファイル名を表題に利用')
                .option('-c, --cover <file>', '表紙画像\n[0:先頭の挿絵]\n[1:ファイル名と同じ画像]\n[ファイル名 or URL]')
                .option('--ext <extension>', '出力ファイル拡張子\n[.epub] (default)\n[.kepub.epub]')
                .option('-of', '出力ファイル名を入力ファイル名に合せる')
                .option('-d, --dst <path>', '出力先パス')
                .option('--enc <encoding>', '入力ファイルエンコード標準は自動認識\n[MS932]\n[UTF-8]')
                // .option('--id', '栞用ID出力 (for Kobo)')
                // .option('--tcy', '自動縦中横有効')
                // .option('--g4', '4バイト文字変換')
                // .option('--tm', '表題を左右中央')
                // .option('--cp', '表紙画像ページ追加')
                .option('--hor', '横書き (指定がなければ縦書き)')
                .option('--device <device>', '端末種別(指定した端末向けの例外処理を行う)\n[kindle]')
                .parse(args);

            const commandLine = options.opts();
            const fileNames = options.args;

            // オプションの後ろをファイル名に設定
            if (fileNames.length === 0) {
                options.help();
                return;
            }

            // ヘルプ出力
            if (commandLine.help) {
                options.help();
                return;
            }

            let propFileName = 'AozoraEpub3.ini';
            let dstPath = null;
            let jarPath = process.env.NODE_PATH || '';

            if (!jarPath.endsWith('.jar')) {
                jarPath = '';
            } else {
                jarPath = jarPath.substring(0, jarPath.lastIndexOf(path.sep) + 1);
            }

            // iniファイル確認
            if (commandLine.ini) {
                propFileName = commandLine.ini;
                const file = new File(propFileName);
                if (!file.isFile()) {
                    LogAppender.error(`-i : ini file not exist. ${file.getAbsolutePath()}`);
                    return;
                }
            }

            // 出力パス確認
            if (commandLine.dst) {
                dstPath = new File(commandLine.dst);
                if (!dstPath.isDirectory()) {
                    LogAppender.error(`-d : dst path not exist. ${dstPath.getAbsolutePath()}`);
                    return;
                }
            }

            // ePub出力クラス初期化
            let epub3Writer = new Epub3Writer(`${jarPath}template/`);
            let epub3ImageWriter = new Epub3ImageWriter(`${jarPath}template/`);

            // propsから読み込み
            let props = {};
            try {
                props = PropertiesReader(propFileName).path();
            } catch (e) { }

            let titleIndex = 0; // 表題

            // コマンドラインオプション以外
            let coverPage = props['CoverPage'] === '1'; // 表紙追加
            let titlePage = BookInfo.TITLE_NONE;
            if (props['TitlePageWrite'] === '1') {
                try {
                    titlePage = parseInt(props['TitlePage']);
                } catch (e) { }
            }
            let withMarkId = props['MarkId'] === '1';
            let commentPrint = props['CommentPrint'] === '1';
            let commentConvert = props['CommentConvert'] === '1';
            let autoYoko = props['AutoYoko'] === '1';
            let autoYokoNum1 = props['AutoYokoNum1'] === '1';
            let autoYokoNum3 = props['AutoYokoNum3'] === '1';
            let autoYokoEQ1 = props['AutoYokoEQ1'] === '1';
            let spaceHyp = 0;
            try {
                spaceHyp = parseInt(props['SpaceHyphenation']);
            } catch (e) { }
            let tocPage = props['TocPage'] === '1'; // 目次追加
            let tocVertical = props['TocVertical'] === '1'; // 目次縦書き
            let coverPageToc = props['CoverPageToc'] === '1';
            let removeEmptyLine = 0;
            try {
                removeEmptyLine = parseInt(props['RemoveEmptyLine']);
            } catch (e) { }
            let maxEmptyLine = 0;
            try {
                maxEmptyLine = parseInt(props['MaxEmptyLine']);
            } catch (e) { }

            // 画面サイズと画像リサイズ
            let dispW = 600; try { dispW = parseInt(props.getProperty("DispW")); } catch (e) { }
            let dispH = 800; try { dispH = parseInt(props.getProperty("DispH")); } catch (e) { }
            let coverW = 600; try { coverW = parseInt(props.getProperty("CoverW")); } catch (e) { }
            let coverH = 800; try { coverH = parseInt(props.getProperty("CoverH")); } catch (e) { }
            let resizeW = 0; if ("1".equals(props.getProperty("ResizeW"))) try { resizeW = parseInt(props.getProperty("ResizeNumW")); } catch (e) { }
            let resizeH = 0; if ("1".equals(props.getProperty("ResizeH"))) try { resizeH = parseInt(props.getProperty("ResizeNumH")); } catch (e) { }
            let singlePageSizeW = 480; try { singlePageSizeW = parseInt(props.getProperty("SinglePageSizeW")); } catch (e) { }
            let singlePageSizeH = 640; try { singlePageSizeH = parseInt(props.getProperty("SinglePageSizeH")); } catch (e) { }
            let singlePageWidth = 600; try { singlePageWidth = parseInt(props.getProperty("SinglePageWidth")); } catch (e) { }
            let imageScale = 1; try { imageScale = parseFloat(props.getProperty("ImageScale")); } catch (e) { }
            let imageFloatType = 0; try { imageFloatType = parseInt(props.getProperty("ImageFloatType")); } catch (e) { }
            let imageFloatW = 0; try { imageFloatW = parseInt(props.getProperty("ImageFloatW")); } catch (e) { }
            let imageFloatH = 0; try { imageFloatH = parseInt(props.getProperty("ImageFloatH")); } catch (e) { }
            let imageSizeType = SectionInfo.IMAGE_SIZE_TYPE_HEIGHT; try { imageSizeType = parseInt(props.getProperty("ImageSizeType")); } catch (e) { }
            let fitImage = "1".equals(props.getProperty("FitImage"));
            let svgImage = "1".equals(props.getProperty("SvgImage"));
            let rotateImage = 0; if ("1".equals(props.getProperty("RotateImage"))) rotateImage = 90; else if ("2".equals(props.getProperty("RotateImage"))) rotateImage = -90;
            let jpegQualty = 0.8; try { jpegQualty = parseInt(props.getProperty("JpegQuality")) / 100; } catch (e) { }
            let gamma = 1.0; if ("1".equals(props.getProperty("Gamma"))) try { gamma = parseFloat(props.getProperty("GammaValue")); } catch (e) { }
            let autoMarginLimitH = 0;
            let autoMarginLimitV = 0;
            let autoMarginWhiteLevel = 80;
            let autoMarginPadding = 0;
            let autoMarginNombre = 0;
            let nobreSize = 0.03;
            if ("1".equals(props.getProperty("AutoMargin"))) {
                try { autoMarginLimitH = parseInt(props.getProperty("AutoMarginLimitH")); } catch (e) { }
                try { autoMarginLimitV = parseInt(props.getProperty("AutoMarginLimitV")); } catch (e) { }
                try { autoMarginWhiteLevel = parseInt(props.getProperty("AutoMarginWhiteLevel")); } catch (e) { }
                try { autoMarginPadding = parseFloat(props.getProperty("AutoMarginPadding")); } catch (e) { }
                try { autoMarginNombre = parseInt(props.getProperty("AutoMarginNombre")); } catch (e) { }
                try { autoMarginPadding = parseFloat(props.getProperty("AutoMarginNombreSize")); } catch (e) { }
            }
            epub3Writer.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
                imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
            epub3ImageWriter.setImageParam(dispW, dispH, coverW, coverH, resizeW, resizeH, singlePageSizeW, singlePageSizeH, singlePageWidth, imageSizeType, fitImage, svgImage, rotateImage,
                imageScale, imageFloatType, imageFloatW, imageFloatH, jpegQualty, gamma, autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nobreSize);
            // 目次階層化設定
            epub3Writer.setTocParam("1".equals(props.getProperty("NavNest")), "1".equals(props.getProperty("NcxNest")));

            // スタイル設定
            let pageMargin = [];
            try { pageMargin = props.getProperty("PageMargin").split(","); } catch (e) { }
            if (pageMargin.length !== 4) pageMargin = ["0", "0", "0", "0"];
            else {
                let pageMarginUnit = props.getProperty("PageMarginUnit") === "0" ? "em" : "%";
                for (let i = 0; i < 4; i++) { pageMargin[i] += pageMarginUnit; }
            }
            let bodyMargin = [];
            try { bodyMargin = props.getProperty("BodyMargin").split(","); } catch (e) { }
            if (bodyMargin.length !== 4) bodyMargin = ["0", "0", "0", "0"];
            else {
                let bodyMarginUnit = props.getProperty("BodyMarginUnit") === "0" ? "em" : "%";
                for (let i = 0; i < 4; i++) { bodyMargin[i] += bodyMarginUnit; }
            }
            let lineHeight = 1.8; try { lineHeight = parseFloat(props.getProperty("LineHeight")); } catch (e) { }
            let fontSize = 100; try { fontSize = parseInt(props.getProperty("FontSize")); } catch (e) { }
            let boldUseGothic = "1".equals(props.getProperty("BoldUseGothic"));
            let gothicUseBold = "1".equals(props.getProperty("gothicUseBold"));
            epub3Writer.setStyles(pageMargin, bodyMargin, lineHeight, fontSize, boldUseGothic, gothicUseBold);
            // 自動改ページ
            let forcePageBreakSize = 0;
            let forcePageBreakEmpty = 0;
            let forcePageBreakEmptySize = 0;
            let forcePageBreakChapter = 0;
            let forcePageBreakChapterSize = 0;
            if (props.getProperty("PageBreak") === "1") {
                try {
                    try { forcePageBreakSize = parseInt(props.getProperty("PageBreakSize")) * 1024; } catch (e) { }
                    if (props.getProperty("PageBreakEmpty") === "1") {
                        try { forcePageBreakEmpty = parseInt(props.getProperty("PageBreakEmptyLine")); } catch (e) { }
                        try { forcePageBreakEmptySize = parseInt(props.getProperty("PageBreakEmptySize")) * 1024; } catch (e) { }
                    }
                    if (props.getProperty("PageBreakChapter") === "1") {
                        forcePageBreakChapter = 1;
                        try { forcePageBreakChapterSize = parseInt(props.getProperty("PageBreakChapterSize")) * 1024; } catch (e) { }
                    }
                } catch (e) { }
            }

            let maxLength = 64; try { maxLength = parseInt(props.getProperty("ChapterNameLength")); } catch (e) { }
            let insertTitleToc = props.getProperty("TitleToc") === "1";
            let chapterExclude = props.getProperty("ChapterExclude") === "1";
            let chapterUseNextLine = props.getProperty("ChapterUseNextLine") === "1";
            let chapterSection = !props.hasOwnProperty("ChapterSection") || props.getProperty("ChapterSection") === "1";
            let chapterH = props.getProperty("ChapterH") === "1";
            let chapterH1 = props.getProperty("ChapterH1") === "1";
            let chapterH2 = props.getProperty("ChapterH2") === "1";
            let chapterH3 = props.getProperty("ChapterH3") === "1";
            let sameLineChapter = props.getProperty("SameLineChapter") === "1";
            let chapterName = props.getProperty("ChapterName") === "1";
            let chapterNumOnly = props.getProperty("ChapterNumOnly") === "1";
            let chapterNumTitle = props.getProperty("ChapterNumTitle") === "1";
            let chapterNumParen = props.getProperty("ChapterNumParen") === "1";
            let chapterNumParenTitle = props.getProperty("ChapterNumParenTitle") === "1";
            let chapterPattern = "";
            if (props.getProperty("ChapterPattern") === "1") chapterPattern = props.getProperty("ChapterPatternText");

            // オプション指定を反映
            let useFileName = false; // 表題に入力ファイル名利用
            let coverFileName = null;
            let encType = "AUTO"; // 文字コードの初期設定を空に
            let outExt = ".epub";
            let autoFileName = true; // ファイル名を表題に利用
            let vertical = true;
            let targetDevice = null;

            if (commandLine.hasOption("t")) try { titleIndex = parseInt(commandLine.getOptionValue("t")); } catch (e) { }
            if (commandLine.hasOption("tf")) useFileName = true;
            if (commandLine.hasOption("c")) coverFileName = commandLine.getOptionValue("c");
            if (commandLine.hasOption("enc")) encType = commandLine.getOptionValue("enc");
            if (commandLine.hasOption("ext")) outExt = commandLine.getOptionValue("ext");
            if (commandLine.hasOption("of")) autoFileName = false;
            if (commandLine.hasOption("hor")) vertical = false;
            if (commandLine.hasOption("device")) {
                targetDevice = commandLine.getOptionValue("device");
                if (targetDevice.toLowerCase() === "kindle") {
                    epub3Writer.setIsKindle(true);
                }
            }

            // 変換クラス生成とパラメータ設定
            const aozoraConverter = new AozoraEpub3Converter(epub3Writer, jarPath);
            // 挿絵なし
            aozoraConverter.setNoIllust(props.getProperty("NoIllust") === "1");
            // 栞用span出力
            aozoraConverter.setWithMarkId(withMarkId);
            // 変換オプション設定
            aozoraConverter.setAutoYoko(autoYoko, autoYokoNum1, autoYokoNum3, autoYokoEQ1);
            // 文字出力設定
            let dakutenType = 0; try { dakutenType = parseInt(props.getProperty("DakutenType")); } catch (e) { }
            let printIvsBMP = props.getProperty("IvsBMP") === "1";
            let printIvsSSP = props.getProperty("IvsSSP") === "1";

            aozoraConverter.setCharOutput(dakutenType, printIvsBMP, printIvsSSP);
            // 全角スペースの禁則
            aozoraConverter.setSpaceHyphenation(spaceHyp);
            // コメント
            aozoraConverter.setCommentPrint(commentPrint, commentConvert);

            aozoraConverter.setRemoveEmptyLine(removeEmptyLine, maxEmptyLine);

            // 強制改ページ
            aozoraConverter.setForcePageBreak(forcePageBreakSize, forcePageBreakEmpty, forcePageBreakEmptySize, forcePageBreakChapter, forcePageBreakChapterSize);
            // 目次設定
            aozoraConverter.setChapterLevel(maxLength, chapterExclude, chapterUseNextLine, chapterSection,
                chapterH, chapterH1, chapterH2, chapterH3, sameLineChapter,
                chapterName,
                chapterNumOnly, chapterNumTitle, chapterNumParen, chapterNumParenTitle,
                chapterPattern);
            ////////////////////////////////
            // 各ファイルを変換処理
            ////////////////////////////////
            for (const fileName of fileNames) {
                LogAppender.println("--------");
                const srcFile = new File(fileName);
                if (!srcFile || !srcFile.isFile()) {
                    LogAppender.error("file not exist. " + srcFile.getAbsolutePath());
                    continue;
                }

                let ext = srcFile.getName();
                ext = ext.substring(ext.lastIndexOf('.') + 1).toLowerCase();

                let coverImageIndex = -1;
                if (coverFileName != null) {
                    if (coverFileName === "0") {
                        coverImageIndex = 0;
                        coverFileName = "";
                    } else if (coverFileName === "1") {
                        coverFileName = AozoraEpub3.getSameCoverFileName(srcFile); // 入力ファイルと同じ名前+.jpg/.png
                    }
                }

                // zipならzip内のテキストを検索
                let txtCount = 1;
                let imageOnly = false;
                let isFile = ext === "txt";
                if (ext === "zip" || ext === "txtz") {
                    try {
                        txtCount = await AozoraEpub3.countZipText(srcFile);
                    } catch (e) {
                        console.error(e);
                    }
                    if (txtCount === 0) { txtCount = 1; imageOnly = true; }
                } else if (ext === "rar") {
                    try {
                        txtCount = await AozoraEpub3.countRarText(srcFile);
                    } catch (e) {
                        console.error(e);
                    }
                    if (txtCount === 0) { txtCount = 1; imageOnly = true; }
                } else if (ext === "cbz") {
                    imageOnly = true;
                }

                for (let txtIdx = 0; txtIdx < txtCount; txtIdx++) {
                    const imageInfoReader = new ImageInfoReader(isFile, srcFile);

                    let bookInfo = null;
                    // 文字コード判別
                    let encauto = "";

                    encauto = AozoraEpub3.getTextCharset(srcFile, ext, imageInfoReader, txtIdx);
                    if (encauto === "SHIFT_JIS") encauto = "MS932";
                    if (encType === "AUTO") encType = encauto;
                    if (!imageOnly) {
                        bookInfo = AozoraEpub3.getBookInfo(srcFile, ext, txtIdx, imageInfoReader, aozoraConverter, encType, BookInfo.TitleType.indexOf(titleIndex), false);
                        bookInfo.vertical = vertical;
                        bookInfo.insertTocPage = tocPage;
                        bookInfo.setTocVertical(tocVertical);
                        bookInfo.insertTitleToc = insertTitleToc;
                        aozoraConverter.vertical = vertical;
                        // 表題ページ
                        bookInfo.titlePageType = titlePage;
                    }

                    let writer = epub3Writer;
                    if (!isFile) {
                        if (ext === "rar") {
                            await imageInfoReader.loadRarImageInfos(srcFile, imageOnly);
                        } else {
                            await imageInfoReader.loadZipImageInfos(srcFile, imageOnly);
                        }
                        if (imageOnly) {
                            LogAppender.println("画像のみのePubファイルを生成します");
                            // 画像出力用のBookInfo生成
                            bookInfo = new BookInfo(srcFile);
                            bookInfo.imageOnly = true;
                            // Writerを画像出力用派生クラスに入れ替え
                            writer = epub3ImageWriter;

                            if (imageInfoReader.countImageFileInfos() === 0) {
                                LogAppender.error("画像がありませんでした");
                                return;
                            }
                            // 名前順で並び替え
                            imageInfoReader.sortImageFileNames();
                        }
                    }

                    // 表題の見出しが非表示で行が追加されていたら削除
                    if (!bookInfo.insertTitleToc && bookInfo.titleLine >= 0) {
                        bookInfo.removeChapterLineInfo(bookInfo.titleLine);
                    }

                    // 先頭からの場合で指定行数以降なら表紙無し
                    if (coverFileName === "") {
                        try {
                            const maxCoverLine = parseInt(props.getProperty("MaxCoverLine"));
                            if (maxCoverLine > 0 && bookInfo.firstImageLineNum >= maxCoverLine) {
                                coverImageIndex = -1;
                                coverFileName = null;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    // 表紙設定
                    bookInfo.insertCoverPageToc = coverPageToc;
                    bookInfo.insertCoverPage = coverPage;
                    bookInfo.coverImageIndex = coverImageIndex;
                    if (coverFileName != null && !coverFileName.startsWith("http")) {
                        let coverFile = new File(coverFileName);
                        if (!coverFile.exists()) {
                            coverFileName = srcFile.getParent() + "/" + coverFileName;
                            if (!new File(coverFileName).exists()) {
                                coverFileName = null;
                                LogAppender.println("[WARN] 表紙画像ファイルが見つかりません : " + coverFile.getAbsolutePath());
                            }
                        }
                    }
                    bookInfo.coverFileName = coverFileName;

                    const titleCreator = BookInfo.getFileTitleCreator(srcFile.getName());
                    if (titleCreator != null) {
                        if (useFileName) {
                            if (titleCreator[0] && titleCreator[0].trim().length > 0) bookInfo.title = titleCreator[0];
                            if (titleCreator[1] && titleCreator[1].trim().length > 0) bookInfo.creator = titleCreator[1];
                        } else {
                            // テキストから取得できていない場合
                            if (!bookInfo.title || bookInfo.title.length === 0) bookInfo.title = titleCreator[0] ?? "";
                            if (!bookInfo.creator || bookInfo.creator.length === 0) bookInfo.creator = titleCreator[1] ?? "";
                        }
                    }

                    const outFile = getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt);
                    await AozoraEpub3.convertFile(
                        srcFile, ext, outFile,
                        aozoraConverter, writer,
                        encType, bookInfo, imageInfoReader, txtIdx
                    );
                }
            }

        } catch (e) {
            console.error(e);
        }

    }
    
	/** 出力ファイルを生成 */
    static getOutFile(srcFile, dstPath, bookInfo, autoFileName, outExt) {
        // 出力ファイル
        if (dstPath === null) dstPath = srcFile.getAbsoluteFile().getParentFile();
        let outFileName = "";
        if (autoFileName && (bookInfo.creator != null || bookInfo.title != null)) {
          outFileName = dstPath.getAbsolutePath() + "/";
          if (bookInfo.creator != null && bookInfo.creator.length > 0) {
            let str = bookInfo.creator.replace(/[\\\/\:\*\?\<\>\|\\"\t]/g, "");
            if (str.length > 64) str = str.substring(0, 64);
            outFileName += "[" + str + "] ";
          }
          if (bookInfo.title != null) {
            outFileName += bookInfo.title.replace(/[\\\/\:\*\!\?\<\>\|\\"\t]/g, "");
          }
          if (outFileName.length > 250) outFileName = outFileName.substring(0, 250);
        } else {
          outFileName = dstPath.getAbsolutePath() + "/" + srcFile.getName().replace(/\.[^\.]+$/, "");
        }
        if (outExt.length === 0) outExt = ".epub";
        const outFile = new File(outFileName + outExt);
        // 書き込み許可設定
        outFile.setWritable(true);
    
        return outFile;
      }
    
      /** 前処理で一度読み込んでタイトル等の情報を取得 */
      static async getBookInfo(srcFile, ext, txtIdx, imageInfoReader, aozoraConverter, encType, titleType, pubFirst) {
        try {
          const textEntryName = [null];
          const is = await AozoraEpub3.getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx);
          if (is === null) return null;
    
          // タイトル、画像注記、左右中央注記、目次取得
          const src = new BufferedReader(new InputStreamReader(is, encType));
          const bookInfo = await aozoraConverter.getBookInfo(srcFile, src, imageInfoReader, titleType, pubFirst);
          is.close();
          bookInfo.textEntryName = textEntryName[0];
          return bookInfo;
    
        } catch (e) {
          console.error(e);
          LogAppender.append("エラーが発生しました : ");
          LogAppender.println(e.message);
        }
        return null;
      }
      
	/** ファイルを変換
	 * @param srcFile 変換するファイル
//	 * @param dstPath 出力先パス */
static async convertFile(srcFile, ext, outFile, aozoraConverter, epubWriter, encType, bookInfo, imageInfoReader, txtIdx) {
    try {
      const time = Date.now();
      LogAppender.append('変換開始 : ');
      LogAppender.println(srcFile.getPath());

      // 入力Stream再オープン
      let src = null;
      if (!bookInfo.imageOnly) {
        src = fs.createReadStream(srcFile, { encoding: encType });
      }

      // ePub書き出し srcは中でクローズされる
      await epubWriter.write(aozoraConverter, src, srcFile, ext, outFile, bookInfo, imageInfoReader);

      LogAppender.append(`変換完了[${((Date.now() - time) / 1000).toFixed(1)}s] : `);
      LogAppender.println(outFile.getPath());
    } catch (e) {
      console.error(e);
      LogAppender.println(`エラーが発生しました : ${e.message}`);
      // LogAppender.printStackTrace(e);
    }
  }

  /** 入力ファイルからStreamオープン
   *
   * @param {File} srcFile
   * @param {string} ext
   * @param {ImageInfoReader} imageInfoReader
   * @param {string[]} textEntryName
   * @param {number} txtIdx テキストファイルのZip内の位置
   * @return {Promise<InputStream>} テキストファイルのストリーム (close()は呼び出し側ですること)
   * @throws {Error}
   */
  static async getTextInputStream(srcFile, ext, imageInfoReader, textEntryName, txtIdx) {
    if (ext === 'txt') {
      return fs.createReadStream(srcFile);
    } else if (ext === 'zip' || ext === 'txtz') {
      const zis = new ZipArchiveInputStream(fs.createReadStream(srcFile), 'MS932', false);
      let entry;
      while ((entry = await zis.getNextEntry()) !== null) {
        const entryName = entry.getName();
        if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
          if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
          if (textEntryName) textEntryName[0] = entryName;
          return zis;
        }
      }
      LogAppender.append('zip内にtxtファイルがありません: ');
      LogAppender.println(srcFile.getName());
      return null;
    } else if (ext === 'rar') {
      const archive = new Archive(srcFile);
      try {
        let fileHeader = await archive.nextFileHeader();
        while (fileHeader !== null) {
          if (!fileHeader.isDirectory()) {
            let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
            entryName = entryName.replace(/\\/g, '/');
            if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
              if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
              if (textEntryName) textEntryName[0] = entryName;
              const tmpFile = fs.mkdtempSync('rarTmp');
              fs.createReadStream(archive.getInputStream(fileHeader)).pipe(fs.createWriteStream(tmpFile));
              return fs.createReadStream(tmpFile);
            }
          }
          fileHeader = await archive.nextFileHeader();
        }
      } finally {
        await archive.close();
      }
      LogAppender.append('rar内にtxtファイルがありません: ');
      LogAppender.println(srcFile.getName());
      return null;
    } else {
      LogAppender.append('txt, zip, rar, txtz, cbz のみ変換可能です: ');
      LogAppender.println(srcFile.getPath());
    }
    return null;
  }
  	/** 入力ファイルから文字コードを判別
	 *
	 * @param srcFile
	 * @param ext
	 * @param imageInfoReader
	 * @param txtIdx テキストファイルのZip内の位置
	 * @return テキストファイルのストリーム (close()は呼び出し側ですること)
	 * @throws RarException
	 */
      static async getTextCharset(srcFile, ext, imageInfoReader, txtIdx) {
        let cs = '';
        if (ext === 'txt') {
          const is = fs.createReadStream(srcFile);
          cs = await Detector.getCharset(is);
          return cs;
        } else if (ext === 'zip' || ext === 'txtz') {
          const zis = new ZipArchiveInputStream(fs.createReadStream(srcFile), 'MS932', false);
          let entry;
          while ((entry = await zis.getNextEntry()) !== null) {
            const entryName = entry.getName();
            if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
              if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
              cs = await Detector.getCharset(zis);
              return cs;
            }
          }
          LogAppender.append('zip内にtxtファイルがありません: ');
          LogAppender.println(srcFile.getName());
          return null;
        } else if (ext === 'rar') {
          const archive = new Archive(srcFile);
          try {
            let fileHeader = await archive.nextFileHeader();
            while (fileHeader !== null) {
              if (!fileHeader.isDirectory()) {
                let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
                entryName = entryName.replace(/\\/g, '/');
                if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt' && txtIdx-- === 0) {
                  if (imageInfoReader) imageInfoReader.setArchiveTextEntry(entryName);
                  const tmpFile = fs.mkdtempSync('rarTmp');
                  const fos = fs.createWriteStream(tmpFile);
                  const is = await archive.getInputStream(fileHeader);
                  await new Promise((resolve, reject) => {
                    is.pipe(fos);
                    is.on('end', resolve);
                    is.on('error', reject);
                  });
                  const bis = fs.createReadStream(tmpFile, { highWaterMark: 65536 });
                  cs = await Detector.getCharset(bis);
                  return cs;
                }
              }
              fileHeader = await archive.nextFileHeader();
            }
          } finally {
            await archive.close();
          }
          LogAppender.append('rar内にtxtファイルがありません: ');
          LogAppender.println(srcFile.getName());
          return null;
        } else {
          LogAppender.append('txt, zip, rar, txtz, cbz のみ変換可能です: ');
          LogAppender.println(srcFile.getPath());
        }
        return null;
      }
    
      /** Zipファイル内のテキストファイルの数を取得 */
      static async countZipText(zipFile) {
        let txtCount = 0;
        const zis = new ZipArchiveInputStream(fs.createReadStream(zipFile), 'MS932', false);
        try {
          let entry;
          while ((entry = await zis.getNextEntry()) !== null) {
            const entryName = entry.getName();
            if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt') txtCount++;
          }
        } finally {
          await zis.close();
        }
        return txtCount;
      }
    
      /** Ripファイル内のテキストファイルの数を取得 */
      static async countRarText(rarFile) {
        let txtCount = 0;
        const archive = new Archive(rarFile);
        try {
          for (const fileHeader of archive.getFileHeaders()) {
            if (!fileHeader.isDirectory()) {
              let entryName = fileHeader.getFileName() || fileHeader.getFileName().toString();
              entryName = entryName.replace(/\\/g, '/');
              if (entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase() === 'txt') txtCount++;
            }
          }
        } finally {
          await archive.close();
        }
        return txtCount;
      }
    
      /** 入力ファイルと同じ名前の画像を取得
       * png, jpg, jpegの順で探す  */
      static getSameCoverFileName(srcFile) {
        let baseFileName = srcFile.getPath();
        baseFileName = baseFileName.substring(0, baseFileName.lastIndexOf('.') + 1);
        const extensions = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'Png', 'Jpg', 'Jpeg'];
        for (const ext of extensions) {
          const coverFileName = `${baseFileName}${ext}`;
          if (fs.existsSync(coverFileName)) return coverFileName;
        }
        return null;
      }
}
