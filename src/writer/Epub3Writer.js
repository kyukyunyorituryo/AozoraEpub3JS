import { v4 as uuidv4 } from 'uuid';
import ejs from 'ejs';
import JSZip from "jszip";
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

/** ePub3用のファイル一式をZipで固めたファイルを生成.
 * 本文は改ページでセクション毎に分割されて xhtml/以下に 0001.xhtml 0002.xhtml の連番ファイル名で格納
 * 画像は images/以下に 0001.jpg 0002.png のようにリネームして格納
 */
export default class Epub3Writer {
    /** MIMETYPEパス */
    static MIMETYPE_PATH = "mimetype";

    /** ORBパス */
    static OPS_PATH = "item/";
    /** 画像格納パス */
    static IMAGES_PATH = "image/";
    /** CSS格納パス */
    static CSS_PATH = "style/";
    /** xhtml格納パス */
    static XHTML_PATH = "xhtml/";

    /** フォントファイル格納パス */
    static FONTS_PATH = "fonts/";
    /** 外字フォント格納パス */
    static GAIJI_PATH = "gaiji/";

    /** 縦書きcss */
    //	final static String VERTICAL_TEXT_CSS = "vertical_text.css";
    /** 縦書きcss Velocityテンプレート */
    //	final static String VERTICAL_TEXT_CSS_EJS = "vertical_text.ejs";
    /** 横書きcss */
    //	final static String HORIZONTAL_TEXT_CSS = "horizontal_text.css";
    /** 横書きcss Velocityテンプレート */
    //	final static String HORIZONTAL_TEXT_CSS_EJS = "horizontal_text.ejs";
    /** 共用css */
    static TEXT_CSS = "text.css";
    // 共用css Velocityテンプレート
    static TEXT_CSS_EJS = "text.ejs";

    // xhtmlヘッダVelocityテンプレート
    static XHTML_HEADER_EJS = "xhtml_header.ejs";
    // xhtmlフッタVelocityテンプレート
    static XHTML_FOOTER_EJS = "xhtml_footer.ejs";

    // タイトルページxhtml
    static TITLE_FILE = "title.xhtml";
    // タイトル縦中央 Velocityテンプレート
    static TITLE_M_EJS = "title_middle.ejs";
    // タイトル横書き Velocityテンプレート
    static TITLE_H_EJS = "title_horizontal.ejs";

    // navファイル
    static XHTML_NAV_FILE = "nav.xhtml";
    // navファイル Velocityテンプレート
    static XHTML_NAV_EJS = "xhtml_nav.ejs";

    // 表紙XHTMLファイル
    static COVER_FILE = "cover.xhtml";
    // 表紙ページ Velocityテンプレート
    static COVER_EJS = "cover.ejs";

    // SVG画像ページ Velocityテンプレート
    static SVG_IMAGE_EJS = "svg_image.ejs";

    // opfファイル
    static PACKAGE_FILE = "standard.opf";
    // opfファイル Velocityテンプレート
    static PACKAGE_EJS = "package.ejs";

    // tocファイル
    static TOC_FILE = "toc.ncx";
    // tocファイル Velocityテンプレート
    static TOC_EJS = "toc.ncx.ejs";
    // コピーのみのファイル
    /*
    TEMPLATE_FILE_NAMES_VERTICAL = [
        "META-INF/container.xml",
        // `${OPS_PATH}${CSS_PATH}vertical_text.css`,
        `${OPS_PATH}${CSS_PATH}vertical_middle.css`,
        `${OPS_PATH}${CSS_PATH}vertical_image.css`,
        `${OPS_PATH}${CSS_PATH}vertical_font.css`,
        `${OPS_PATH}${CSS_PATH}vertical.css`,
        `${OPS_PATH}${CSS_PATH}fixed-layout-jp.css`,
        `${OPS_PATH}${CSS_PATH}book-style.css`,
        `${OPS_PATH}${CSS_PATH}style-reset.css`,
        `${OPS_PATH}${CSS_PATH}style-standard.css`,
        `${OPS_PATH}${CSS_PATH}style-advance.css`,
    ];
    
    TEMPLATE_FILE_NAMES_HORIZONTAL = [
        "META-INF/container.xml",
        // `${OPS_PATH}${CSS_PATH}horizontal_text.css`,
        `${OPS_PATH}${CSS_PATH}horizontal_middle.css`,
        `${OPS_PATH}${CSS_PATH}horizontal_image.css`,
        `${OPS_PATH}${CSS_PATH}horizontal_font.css`,
        `${OPS_PATH}${CSS_PATH}horizontal.css`,
        `${OPS_PATH}${CSS_PATH}fixed-layout-jp.css`
    ];
    */

    static TEMPLATE_FILE_NAMES_STANDARD = [
        "META-INF/container.xml",
        //Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "vertical_text.css",
        //Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "middle.css",
        //Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "image.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "font.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "aozora.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "fixed-layout-jp.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "book-style.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "style-reset.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "style-standard.css",
        Epub3Writer.OPS_PATH + Epub3Writer.CSS_PATH + "style-advance.css",
    ];

    getTemplateFiles() {
        // if (this.bookInfo && this.bookInfo.vertical) return TEMPLATE_FILE_NAMES_VERTICAL;
        // return TEMPLATE_FILE_NAMES_HORIZONTAL;
        return Epub3Writer.TEMPLATE_FILE_NAMES_STANDARD;
    }

    ////////////////////////////////
    // Properties
    /** 画面サイズ 横 */
    dispW = 600;
    /** 画面サイズ 縦 */
    dispH = 800;

    /** 画像最大幅 0は指定なし */
    maxImageW = 0;
    /** 画像最大高さ 0は指定なし */
    maxImageH = 0;
    /** 最大画素数 10000未満は指定なし */
    maxImagePixels = 0;

    /** 画像拡大表示倍率 0なら無効 */
    imageScale = 1;

    /** 画像回り込み設定 0:なし 1:上 2:下 */
    imageFloatType = 0;
    /** 画像回り込み幅 幅高さが以下なら回り込み */
    imageFloatW = 0;
    /** 画像回り込み高さ 幅高さが以下なら回り込み */
    imageFloatH = 0;

    /** 縦横指定サイズ以上を単ページ化する時の横 */
    singlePageSizeW = 400;
    /** 縦横指定サイズ以上を単ページ化する時の縦 */
    singlePageSizeH = 600;
    /** 縦に関係なく横がこれ以上なら単ページ化 */
    singlePageWidth = 550;

    /** 単ページ表示時のサイズ指定方法 */
    imageSizeType = SectionInfo.IMAGE_SIZE_TYPE_HEIGHT;

    /** 単ページで画像を拡大する */
    fitImage = true;

    /** 画像を縦横比に合わせて回転する 右 90 左 -90 */
    rotateAngle = 0;

    /** 余白自動調整 横 除去% */
    autoMarginLimitH = 0;
    /** 余白自動調整 縦 除去% */
    autoMarginLimitV = 0;
    /** 余白の白画素判別レベル 黒:0～白:100 */
    autoMarginWhiteLevel = 100;
    /** 余白除去後に追加する余白 */
    autoMarginPadding = 0;
    /** ノンブル除去種別 */
    autoMarginNombre = 0;
    /** ノンブルの大きさ */
    autoMarginNombreSize = 0.03;

    /** 表紙サイズ 横 */
    coverW = 600;
    /** 表紙サイズ 縦 */
    coverH = 800;

    /** jpeg圧縮率 */
    jpegQuality = 0.8;

    /** ガンマフィルタ */
    gammaOp = null;

    /** nav.xhtml階層化 */
    navNest = false;
    /** toc.ncx階層化 */
    ncxNest = false;

    /** svgタグのimageでxhtml出力 */
    isSvgImage = false;

    /** 拡張子に.mobiが選択されていてkindlegenがある場合 */
    isKindle = false;

    /** page余白 単位含む */
    pageMargin = ["0", "0", "0", "0"];
    /** body余白 */
    bodyMargin = ["0", "0", "0", "0"];
    /** 行の高さ em */
    lineHeight = null;
    /** 文字サイズ % */
    fontSize = 100;
    /** 太字注記を太字ゴシックで表示 */
    boldUseGothic = true;
    /** ゴシック体注記を太字ゴシックで表示 */
    gothicUseBold = true;

    // Properties
    zos;
    /** ファイル名桁揃え用 */
    static decimalFormat = new Intl.NumberFormat('ja', {
        minimumIntegerDigits: 4,
        useGrouping: false
    });
    /** 更新日時フォーマット 2011-06-29T12:00:00Z */
    dateFormat(date) {
        const dateformat = new Date(date)
        const dateFor = new Intl.DateTimeFormat('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
            hour12: false
        }).format(dateformat);
        const time = dateFor + 'Z';
        return time
    }

    /** セクション番号自動追加用インデックス */
    sectionIndex = 0;
    /** 画像番号自動追加用インデックス */
    imageIndex = 0;

    /** 改ページでセクション分割されたセクション番号(0001)を格納 カバー画像(cover)等も含む */
    sectionInfos = [];
    /** 章の名称を格納(仮) */
    chapterInfos = [];

    /** 外字フォント情報 */
    vecGaijiInfo = [];
    /** 外字フォント重複除去 */
    gaijiNameSet = new Set();

    /** 画像情報リスト Velocity埋め込み */
    imageInfos = [];

    /** 出力対象のファイル名 (青空テキストの挿絵注記で追加され 重複出力のチェックに利用) */
    outImageFileNames = new Set();

    /** Velocity変数格納コンテキスト */
    velocityContext;
    //EJS変数格納コンテキスト
    ejsData = {};
    /** テンプレートパス */
    templatePath;

    /** 出力中の書籍情報 */
    bookInfo;
    /** 出力中の画像情報 */
    imageInfoReader;

    /** プログレスバー AozoraConverterからも使う 利用しない場合はnull */
    jProgressBar;

    /** 処理キャンセルフラグ */
    canceled = false;
    /**
     * コンストラクタ
     * @param {string} templatePath - epubテンプレート格納パス文字列 最後は"/"
     */
    constructor(templatePath) {
        this.templatePath = templatePath;
        // 初回実行時のみ有効
        //        Velocity.init();
        this.sectionInfos = [];
        this.chapterInfos = [];
        this.vecGaijiInfo = [];
        this.gaijiNameSet = new Set();
        this.imageInfos = [];
        this.outImageFileNames = new Set();
    }

    /** プログレスバー設定 */
    setProgressBar(jProgressBar) {
        this.jProgressBar = jProgressBar;
    }

    /** 画像のリサイズ用パラメータを設定 */
    setImageParam(dispW, dispH, coverW, coverH,
        resizeW, resizeH,
        singlePageSizeW, singlePageSizeH, singlePageWidth,
        imageSizeType, fitImage, isSvgImage, rotateAngle,
        imageScale, imageFloatType, imageFloatW, imageFloatH,
        jpegQuality, gamma,
        autoMarginLimitH, autoMarginLimitV, autoMarginWhiteLevel, autoMarginPadding, autoMarginNombre, nombreSize) {

        this.dispW = dispW;
        this.dispH = dispH;

        this.maxImageW = resizeW;
        this.maxImageH = resizeH;

        this.singlePageSizeW = singlePageSizeW;
        this.singlePageSizeH = singlePageSizeH;
        this.singlePageWidth = singlePageWidth;

        // 0なら無効
        this.imageScale = imageScale;
        this.imageFloatType = imageFloatType;
        this.imageFloatW = imageFloatW;
        this.imageFloatH = imageFloatH;

        this.imageSizeType = imageSizeType;
        this.fitImage = fitImage;
        this.isSvgImage = isSvgImage;
        this.rotateAngle = rotateAngle;

        this.coverW = coverW;
        this.coverH = coverH;

        this.jpegQuality = jpegQuality;

        if (gamma !== 1) {
            let table = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                table[i] = Math.min(255, Math.round(255 * Math.pow((i / 255), 1 / gamma)));
            }
            this.gammaOp = new LookupOp(new ByteLookupTable(0, table), null);
        } else {
            this.gammaOp = null;
        }

        this.autoMarginLimitH = autoMarginLimitH;
        this.autoMarginLimitV = autoMarginLimitV;
        this.autoMarginWhiteLevel = autoMarginWhiteLevel;
        this.autoMarginPadding = autoMarginPadding;
        this.autoMarginNombre = autoMarginNombre;
        this.autoMarginNombreSize = nombreSize;
    }

    setTocParam(navNest, ncxNest) {
        this.navNest = navNest;
        this.ncxNest = ncxNest;
    }

    setStyles(pageMargin, bodyMargin, lineHeight, fontSize, boldUseGothic, gothicUseBold) {
        this.pageMargin = pageMargin;
        this.bodyMargin = bodyMargin;
        this.lineHeight = lineHeight;
        this.fontSize = fontSize;
        this.boldUseGothic = boldUseGothic;
        this.gothicUseBold = gothicUseBold;
    }



    /** 処理を中止 */
    cancel() {
        this.canceled = true;
    }
    //ZIPファイルにテンプレートファイルの一括追加
    /*
    async writeFile(zos, fileName) {
        return new Promise((resolve, reject) => {
            zos.putArchiveEntry(new ZipArchiveEntry(fileName), async (err) => {
                if (err) return reject(err);
                //customファイル優先
                let file = path.join(this.templatePath, fileName);
                const idx = fileName.lastIndexOf('/');
                if (idx > 0) {
                    const customFile = path.join(this.templatePath, fileName.substring(0, idx) + '_custom/', fileName.substring(idx + 1));
                    if (fs.existsSync(customFile)) file = customFile;
                }

                const readStream = fs.createReadStream(file);
                readStream.pipe(zos, { end: false });
                readStream.on('end', () => {
                    zos.closeArchiveEntry((err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
                readStream.on('error', reject);
            });
        });
    }
        */
    async  writeFile(zos, fileName) {
        // JSZipにファイルを追加する前に、カスタムファイルを優先的に使用するか確認
        let filePath = this.templatePath + fileName;
        const idx = fileName.lastIndexOf('/');
        
        // カスタムファイルの存在を確認し、もしあれば優先
        if (idx > 0) {
            const customFilePath = this.templatePath + fileName.substring(0, idx) + "_custom/" + fileName.substring(idx + 1);            
            const customFileExists = await fs.existsSync(customFilePath);
            if (customFileExists) {
                filePath = customFilePath;
            }
        }
    
        // ファイルを読み込んでZIPに追加
        const fileData = await readFile(filePath); // ファイルの内容をバイナリデータとして読み込む
        zos.file(fileName, fileData); // JSZipにファイルを追加
    }
    /** epubファイルを出力
     * @param converter 青空文庫テキスト変換クラス 画像のみの場合と切り替えて利用する
     * @param src 青空文庫テキストファイルの入力Stream
     * @param srcFile 青空文庫テキストファイル zip時の画像取得用
     * @param epubFile 出力ファイル .epub拡張子
     * @param bookInfo 書籍情報と縦横書き指定
     * @param imageInfoReader 画像情報リーダー
     * @throws IOException
     */
    async write(converter, src, srcFile, srcExt, epubFile, bookInfo, imageInfoReader) {
        try {
            this.canceled = false;
            this.bookInfo = bookInfo;
            this.imageInfoReader = imageInfoReader;
            // インデックス初期化
            this.sectionIndex = 0;
            this.imageIndex = 0;
            this.sectionInfos = [];
            this.chapterInfos = [];
            this.vecGaijiInfo = [];
            this.gaijiNameSet = new Set();
            this.imageInfos = [];
            this.outImageFileNames = new Set();

            // Velocity用 共通コンテキスト設定
            //           this.velocityContext = new VelocityContext();

            // IDはタイトル著作者のハッシュで適当に生成
            let title = bookInfo.title || '';
            let creator = bookInfo.creator || '';
            if (!bookInfo.creator) bookInfo.creator = null;

            // 固有ID
            //this.velocityContext.put('identifier', uuidv4((title + '-' + creator).getBytes()));
            this.ejsData.identifier = uuidv4((title + '-' + creator).getBytes());
            // 表紙の目次表示名
            //this.velocityContext.put('cover_name', '表紙');
            this.ejsData.cover_name = '表紙';

            // タイトル &<>はエスケープ
            //this.velocityContext.put('title', CharUtils.escapeHtml(title));
            this.ejsData.title = CharUtils.escapeHtml(title);
            // タイトル読み &<>はエスケープ
            //if (bookInfo.titleAs) this.velocityContext.put('titleAs', CharUtils.escapeHtml(bookInfo.titleAs));
            if (bookInfo.titleAs) this.ejsData.titleAs = CharUtils.escapeHtml(bookInfo.titleAs);
            // 著者 &<>はエスケープ
            //this.velocityContext.put('creator', CharUtils.escapeHtml(creator));
            this.ejsData.creator = CharUtils.escapeHtml(creator);
            // 著者読み &<>はエスケープ
            //if (bookInfo.creatorAs) this.velocityContext.put('creatorAs', CharUtils.escapeHtml(bookInfo.creatorAs));
            if (bookInfo.creatorAs) this.ejsData.creatorAs = CharUtils.escapeHtml(bookInfo.creatorAs);
            // 刊行者情報
            //if (bookInfo.publisher) this.velocityContext.put('publisher', bookInfo.publisher);
            if (bookInfo.publisher) this.ejsData.publisher = CharUtils.bookInfo.publisher;
            // 言語 &<>はエスケープ
            if (!bookInfo.language) bookInfo.language = 'ja';
            //this.velocityContext.put('language', CharUtils.escapeHtml(bookInfo.language));
            this.ejsData.language = CharUtils.escapeHtml(bookInfo.language);

            // 書籍情報
            //this.velocityContext.put('bookInfo', bookInfo);
            this.ejsData.bookInfo = bookInfo;

            // 更新日時
            //this.velocityContext.put('modified', dateFormat(bookInfo.modified));
            this.ejsData.modified = dateFormat(bookInfo.modified);

            // 目次階層化
            //this.velocityContext.put('navNest', this.navNest);
            this.ejsData.navNest = this.navNest;

            // 端末種別
            //if (this.isKindle) this.velocityContext.put('kindle', true);
            if (this.isKindle) this.ejsData.kindle = this.true;

            // SVG画像出力
            //if (this.isSvgImage) this.velocityContext.put('svgImage', true);
            if (this.isSvgImage) this.ejsData.svgImage = this.true;


            // スタイル
            //            this.velocityContext.put('pageMargin', this.pageMargin);
            //            this.velocityContext.put('bodyMargin', this.bodyMargin);
            //            this.velocityContext.put('lineHeight', this.lineHeight);
            //            this.velocityContext.put('fontSize', this.fontSize);
            //            this.velocityContext.put('boldUseGothic', this.boldUseGothic);
            //            this.velocityContext.put('gothicUseBold', this.gothicUseBold);
            this.ejsData.pageMargin = this.pageMargin;
            this.ejsData.bodyMargin = this.bodyMargin;
            this.ejsData.lineHeight = this.lineHeight;
            this.ejsData.fontSize = this.fontSize;
            this.ejsData.boldUseGothic = this.boldUseGothic;
            this.ejsData.gothicUseBold = this.gothicUseBold;

            // 出力先ePubのZipストリーム生成
            const zos = new JSZip();
           // const output = createWriteStream(epubFile);
            //zos.outputStream.pipe(output);

            /*　一番最後にZip生成
            zos
                .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                .pipe(fs.createWriteStream(epubFile))
                .on('finish', function () {
                    // JSZip generates a readable stream with a "end" event,
                    // but is piped here in a writable stream which emits a "finish" event.
                    console.log(epubFile + "に出力されました。");
                });
*/
            // mimetypeは非圧縮
            zos.file("mimetype", "application/epub+zip");

            // テンプレートのファイルを格納
            for (const fileName of this.getTemplateFiles()) {
                await this.writeFile(zos, fileName);
            }

            // サブパスの文字長
            let archivePathLength = 0;
            if (this.bookInfo.textEntryName) {
                archivePathLength = this.bookInfo.textEntryName.indexOf('/') + 1;
            }

            // zip出力用Writer
            //let bw = new BufferedWriter(new OutputStreamWriter(zos, 'UTF-8'));

            // 本文を出力
            await this.writeSections(converter, src, bw, srcFile, srcExt, zos);
            if (this.canceled) return;

            // 外字のcssを格納
           // this.velocityContext.put('vecGaijiInfo', this.vecGaijiInfo);
            this.ejsData.vecGaijiInfo=this.vecGaijiInfo;
            // スタイルと外字のcssを格納
            /*
            if (!bookInfo.imageOnly && bookInfo.vertical) {
                zos.putArchiveEntry(new ZipArchiveEntry(OPS_PATH + CSS_PATH + VERTICAL_TEXT_CSS));
                bw = new BufferedWriter(new OutputStreamWriter(zos, "UTF-8"));
                Velocity.mergeTemplate(templatePath + OPS_PATH + CSS_PATH + VERTICAL_TEXT_CSS_EJS, "UTF-8", velocityContext, bw);
                bw.flush();
                zos.closeArchiveEntry();
            } else if(!bookInfo.imageOnly){
                zos.putArchiveEntry(new ZipArchiveEntry(OPS_PATH + CSS_PATH + HORIZONTAL_TEXT_CSS));
                bw = new BufferedWriter(new OutputStreamWriter(zos, "UTF-8"));
                Velocity.mergeTemplate(templatePath + OPS_PATH + CSS_PATH + HORIZONTAL_TEXT_CSS_EJS, "UTF-8", velocityContext, bw);
                bw.flush();
                zos.closeArchiveEntry();
            }
            */
        } catch (error) {
            console.error(error);
        } finally {
            try {
                if (zos !== null) zos.end();
            } catch (error) {
                console.error(error);
            }
            // メンバ変数解放
            this.velocityContext = null;
            this.bookInfo = null;
            this.imageInfoReader = null;
        }

        if (!bookInfo.imageOnly) {
            const textCssEntry = `${OPS_PATH}${CSS_PATH}${TEXT_CSS}`;
            //zos.addFile(Buffer.from(''), textCssEntry);
            
            //const bw = fs.createWriteStream(textCssEntry, { encoding: 'utf8' });
            //Velocity.mergeTemplate(`${templatePath}${OPS_PATH}${CSS_PATH}${TEXT_CSS_EJS}`, 'UTF-8', this.velocityContext, bw);
            //bw.end();
            
            const bw =fs.readFileSync(path.resolve(__dirname, `${templatePath}${OPS_PATH}${CSS_PATH}${TEXT_CSS_EJS}`), 'utf-8');
            const text_css=ejs.render(bw,this.ejsData)      
            zos.file(textCssEntry, text_css); 
        }

        // 表紙をテンプレート＋メタ情報から生成 先に出力すると外字画像出力で表紙の順番が狂う
        if (!bookInfo.imageOnly && (bookInfo.titlePageType === BookInfo.TITLE_MIDDLE || bookInfo.titlePageType === BookInfo.TITLE_HORIZONTAL)) {
            let vmFilePath = `${templatePath}${OPS_PATH}${XHTML_PATH}${TITLE_M_EJS}`;
            if (bookInfo.titlePageType === BookInfo.TITLE_HORIZONTAL) {
                converter.vertical = false;
                vmFilePath = `${templatePath}${OPS_PATH}${XHTML_PATH}${TITLE_H_EJS}`;
            }

            // ルビと外字画像注記と縦中横注記(縦書きのみ)のみ変換する
            let line = bookInfo.getTitleText();
            //if (line) this.velocityContext.put('TITLE', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.TITLE=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getSubTitleText();
            //if (line) this.velocityContext.put('SUBTITLE', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.SUBTITLE=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getOrgTitleText();
            //if (line) this.velocityContext.put('ORGTITLE', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.ORGTITLE=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getSubOrgTitleText();
            //if (line) this.velocityContext.put('SUBORGTITLE', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.SUBORGTITLE=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getCreatorText();
            //if (line) this.velocityContext.put('CREATOR', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.CREATOR=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getSubCreatorText();
            //if (line) this.velocityContext.put('SUBCREATOR', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.SUBCREATOR=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getSeriesText();
            //if (line) this.velocityContext.put('SERIES', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.SERIES=converter.convertTitleLineToEpub3(line);
            line = bookInfo.getPublisherText();
            //if (line) this.velocityContext.put('PUBLISHER', converter.convertTitleLineToEpub3(line));
            if (line) this.ejsData.PUBLISHER=converter.convertTitleLineToEpub3(line);

            // package.opf内で目次前に出力
            const titleFileEntry = `${OPS_PATH}${XHTML_PATH}${TITLE_FILE}`;
            //zos.addFile(Buffer.from(''), titleFileEntry);
           // const bw = fs.createWriteStream(titleFileEntry, { encoding: 'utf8' });
            //Velocity.mergeTemplate(vmFilePath, 'UTF-8', this.velocityContext, bw);
            //bw.end();
            const bw =fs.readFileSync(path.resolve(__dirname, vmFilePath), 'utf-8');
            const zosdata=ejs.render(bw,this.ejsData)      
            zos.file(titleFileEntry, zosdata); 

            //this.velocityContext.put('title_page', true);
            this.ejsData.title_page=true;
            // 表題行を目次に出力するならtitle.xhtmlを追加 （本文内の行はchapterinfosに追加されていない）
            const titleLineInfo = bookInfo.getChapterLineInfo(bookInfo.titleLine);
            if (titleLineInfo) {
                this.chapterInfos.unshift(new ChapterInfo('title', null, bookInfo.title, ChapterLineInfo.LEVEL_TITLE));
            }
        }

        if (this.canceled) return;

        // 表紙データと表示の画像情報
        let coverImageBytes = null;
        let coverImageInfo = null;
        if (bookInfo.coverFileName && bookInfo.coverFileName.length > 0) {
            // 外部画像ファイルを表紙にする
            // 表紙情報をimageInfosに追加
            try {
                // 表紙設定解除
                for (const imageInfo2 of this.imageInfos) {
                    imageInfo2.setIsCover(false);
                }
                const bis = bookInfo.coverFileName.startsWith('http')
                    ? (await fetch(bookInfo.coverFileName)).body
                    : fs.createReadStream(bookInfo.coverFileName, { bufferSize: 8192 });
                const baos = [];
                for await (const chunk of bis) {
                    baos.push(chunk);
                }
                coverImageBytes = Buffer.concat(baos);
                bis.close();
                const bais = Buffer.from(coverImageBytes);
                coverImageInfo = ImageInfo.getImageInfo(bais);
                const ext = this.isKindle || coverImageInfo.getExt() === 'jpeg' ? 'jpg' : coverImageInfo.getExt();
                coverImageInfo.setId('0000');
                coverImageInfo.setOutFileName(`0000.${ext}`);
                if (!['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                    LogAppender.println(`表紙画像フォーマットエラー: ${bookInfo.coverFileName}`);
                    coverImageInfo = null;
                } else {
                    coverImageInfo.setIsCover(true);
                    this.imageInfos.unshift(coverImageInfo);
                }
            } catch (e) {
                console.error(e);
            }
        } else if (bookInfo.coverImage) {
            // 表紙画像が編集されていた場合
            // すべてのページの表紙設定解除
            for (const imageInfo2 of this.imageInfos) {
                imageInfo2.setIsCover(false);
            }
            // プレビューでトリミングされた表紙
            let ext = 'jpg';
            if (bookInfo.coverExt) {
                ext = bookInfo.coverExt;
            } else if (bookInfo.coverImageIndex > -1) {
                const imageInfo = imageInfoReader.getImageInfo(bookInfo.coverImageIndex);
                if (imageInfo) ext = imageInfo.getExt();
            }
            if (this.isKindle || ext === 'jpeg') ext = 'jpg';
            coverImageInfo = ImageInfo.getImageInfo(ext, bookInfo.coverImage);
            coverImageInfo.setId('0000');
            coverImageInfo.setOutFileName(`0000.${ext}`);
            coverImageInfo.setIsCover(true);
            this.imageInfos.unshift(coverImageInfo);
        } else {
            // 本文にないzip内の表紙を出力対象に追加 (テキストからの相対パス)
            if (bookInfo.coverImageIndex > -1 && imageInfoReader.countImageFileNames() > bookInfo.coverImageIndex) {
                if (srcExt !== 'txt') {
                    const imageFileName = imageInfoReader.getImageFileName(bookInfo.coverImageIndex);
                    if (imageFileName) {
                        const imageInfo = imageInfoReader.getImageInfo(imageFileName);
                        if (imageInfo) {
                            const relativeImageFileName = imageFileName.substring(archivePathLength);
                            this.outImageFileNames.add(relativeImageFileName);
                            // 表紙フラグも設定
                            for (const imageInfo2 of this.imageInfos) {
                                imageInfo2.setIsCover(false);
                            }
                            imageInfo.setIsCover(true);
                            if (!this.imageInfos.includes(imageInfo)) this.imageInfos.push(imageInfo);
                        }
                    }
                }
            }
        }
        // 表紙ページ出力 先頭画像表示時は画像出力時にカバー指定するので出力しない
        if (bookInfo.insertCoverPage) {
            // 追加用の情報取得にのみ使う
            let insertCoverInfo = coverImageInfo;
            if (insertCoverInfo === null && bookInfo.coverImageIndex > -1) {
                // 本文中の挿絵の場合
                insertCoverInfo = imageInfoReader.getImageInfo(bookInfo.coverImageIndex);
                if (insertCoverInfo !== null) {
                    insertCoverInfo.setIsCover(true);
                    if (!bookInfo.imageOnly && insertCoverInfo.getId() === null) {
                        // zip内の画像で追加処理されていない
                        this.imageIndex++;
                        const imageId = this.imageIndex.toString().padStart(4, '0');
                        insertCoverInfo.setId(imageId);
                        let ext = insertCoverInfo.getExt();
                        if (this.isKindle) ext = 'jpg';
                        insertCoverInfo.setOutFileName(`${imageId}.${ext}`);
                    }
                }
            }
            if (insertCoverInfo !== null) {
                const sectionInfo = new SectionInfo('cover-page');
                if (this.imageSizeType !== SectionInfo.IMAGE_SIZE_TYPE_AUTO) {
                    // 画像が横長なら幅100% それ以外は高さ100%
                    if (insertCoverInfo.getWidth() / insertCoverInfo.getHeight() >= this.coverW / this.coverH) {
                        sectionInfo.setImageFitW(true);
                    } else {
                        sectionInfo.setImageFitH(true);
                    }
                } else {
                    sectionInfo.setImageFitW(false);
                    sectionInfo.setImageFitH(false);
                }
                //this.velocityContext.put('sectionInfo', sectionInfo);
                this.ejsData.sectionInfo=sectionInfo;
                
                //this.velocityContext.put('coverImage', insertCoverInfo);
                this.ejsData.coverImage=insertCoverInfo;
                //zos.addFile(Buffer.from(''), `${OPS_PATH}${XHTML_PATH}${COVER_FILE}`);
                //const bw = fs.createWriteStream(`${OPS_PATH}${XHTML_PATH}${COVER_FILE}`, { encoding: 'utf8' });
                //Velocity.mergeTemplate(`${templatePath}${OPS_PATH}${XHTML_PATH}${COVER_EJS}`, 'UTF-8', this.velocityContext, bw);
                //bw.end();
                const bw =fs.readFileSync(path.resolve(__dirname, `${templatePath}${OPS_PATH}${XHTML_PATH}${COVER_EJS}`), 'utf-8');
                const zosdata=ejs.render(bw,this.ejsData)      
                zos.file(`${OPS_PATH}${XHTML_PATH}${COVER_FILE}`, zosdata); 
            } else {
                // 画像がなかったら表紙ページ無し
                bookInfo.insertCoverPage = false;
            }
        }

        // package.opf 出力
        //this.velocityContext.put('sections', this.sectionInfos);
        this.ejsData.sections=this.sectionInfos;
        //this.velocityContext.put('images', this.imageInfos);
        this.ejsData.images=this.imageInfos;        
        //this.velocityContext.put('vecGaijiInfo', this.vecGaijiInfo);
        this.ejsData.vecGaijiInfo=this.vecGaijiInfo;

        zos.addFile(Buffer.from(''), `${OPS_PATH}${PACKAGE_FILE}`);
        //const bw = fs.createWriteStream(`${OPS_PATH}${PACKAGE_FILE}`, { encoding: 'utf8' });
        //Velocity.mergeTemplate(`${templatePath}${OPS_PATH}${PACKAGE_EJS}`, 'UTF-8', this.velocityContext, bw);
        //bw.end();
        const bw =fs.readFileSync(path.resolve(__dirname, `${templatePath}${OPS_PATH}${PACKAGE_EJS}`), 'utf-8');
        const zosdata=ejs.render(bw,this.ejsData)      
        zos.file(`${OPS_PATH}${PACKAGE_FILE}`, zosdata); 

        // nullを除去
        for (let i = this.chapterInfos.length - 1; i >= 0; i--) {
            if (this.chapterInfos[i].getChapterName() === null) {
                this.chapterInfos.splice(i, 1);
            }
        }

        const insertTitleToc = bookInfo !== null && bookInfo.insertTitleToc;

        // 目次の階層情報を設定
        ChapterInfo.setTocNestLevel(this.navNest, this.ncxNest, this.chapterInfos, insertTitleToc);

        let ncxDepth = 1;
        if (this.ncxNest) {
            for (const chapterInfo of this.chapterInfos) {
                ncxDepth = Math.max(ncxDepth, chapterInfo.getChapterLevel() + 1);
            }
        }

        // velocityに設定
        if (ncxDepth < 1) ncxDepth = 1;
        //this.velocityContext.put('ncx_depth', ncxDepth);
        this.ejsData.ncx_depth=ncxDepth;

        // 出力前に縦中横とエスケープ処理
        if (!bookInfo.imageOnly) {
            converter.vertical = bookInfo.tocVertical;
            const spaceHyphenation = converter.getSpaceHyphenation();
            converter.setSpaceHyphenation(0);
            const buf = [];
            for (const chapterInfo of this.chapterInfos) {
                buf.length = 0;
                let converted = CharUtils.escapeHtml(chapterInfo.getChapterName());
                if (bookInfo.tocVertical) {
                    converted = converter.convertTcyText(converted);
                }
                chapterInfo.setChapterName(converted);
            }
            // 戻す
            converter.vertical = bookInfo.vertical;
            converter.setSpaceHyphenation(spaceHyphenation);
        }
        // navファイル
        this.velocityContext.chapters = this.chapterInfos;
        //zos.putArchiveEntry(new ZipArchiveEntry(`${this.OPSPATH}${this.XHTML_NAV_FILE}`));
        //bw = fs.createWriteStream(`${this.templatePath}${this.OPSPATH}${this.XHTML_NAV_FILE}`, { encoding: 'utf8' });
        //Velocity.render(fs.readFileSync(`${this.templatePath}${this.OPSPATH}${this.XHTML_PATH}${this.XHTML_NAV_EJS}`, 'utf8'), this.velocityContext, bw);
        //bw.end();
        //zos.closeArchiveEntry();
        bw =fs.readFileSync(path.resolve(__dirname,`${this.templatePath}${this.OPSPATH}${this.XHTML_PATH}${this.XHTML_NAV_EJS}`), 'utf-8');
        zosdata=ejs.render(bw,this.ejsData)      
        zos.file(`${this.OPSPATH}${this.XHTML_NAV_FILE}`, zosdata); 

        // tocファイル
        this.velocityContext.chapters = this.chapterInfos;
        //zos.putArchiveEntry(new ZipArchiveEntry(`${this.OPSPATH}${this.TOC_FILE}`));
        //bw = fs.createWriteStream(`${this.templatePath}${this.OPSPATH}${this.TOC_FILE}`, { encoding: 'utf8' });
        //Velocity.render(fs.readFileSync(`${this.templatePath}${this.OPSPATH}${this.TOC_EJS}`, 'utf8'), this.velocityContext, bw);
        //bw.end();
        //zos.closeArchiveEntry();

        bw =fs.readFileSync(path.resolve(__dirname,`${this.templatePath}${this.OPSPATH}${this.TOC_EJS}`), 'utf-8');
        zosdata=ejs.render(bw,this.ejsData)      
        zos.file(`${this.OPSPATH}${this.TOC_FILE}`, zosdata); 

        if (src) src.close();

        if (this.canceled) return;
        // プログレスバーにテキスト進捗分を追加
        if (this.jProgressBar && !bookInfo.imageOnly) this.jProgressBar.value = bookInfo.totalLineNum / 10;

        // フォントファイル格納
        if (!bookInfo.imageOnly) {
            const fontsPath = new File(`${this.templatePath}${this.OPSPATH}${this.FONTS_PATH}`);
            if (fontsPath.exists()) {
                for (const fontFile of fontsPath.listFiles()) {
                    const outFileName = `${this.OPSPATH}${this.FONTS_PATH}${fontFile.getName()}`;
                    //zos.putArchiveEntry(new ZipArchiveEntry(outFileName));
                    //const fis = fs.createReadStream(`${this.templatePath}${outFileName}`);
                    //fis.pipe(zos);
                    //fis.close();
                    //zos.closeArchiveEntry();
 
                    zos.file(`${this.templatePath}${outFileName}`, await fs.read(path.resolve(__dirname,outFileName))); 
            
                }
            }
        }

        // 外字ファイル格納
        for (const gaijiInfo of this.vecGaijiInfo) {
            const gaijiFile = gaijiInfo.getFile();
            if (gaijiFile.exists()) {
                const outFileName = `${this.OPSPATH}${this.GAIJI_PATH}${gaijiFile.getName()}`;
                //zos.putArchiveEntry(new ZipArchiveEntry(outFileName));
                //const fis = fs.createReadStream(gaijiFile);
                //fis.pipe(zos);
                //fis.close();
                //zos.closeArchiveEntry();

                zos.file(gaijiFile, await fs.read(path.resolve(__dirname,outFileName))); 
            }
        }

        //zos.setLevel(0);
        //////////////////////////////////////////////////////////////////////////////////////////////////
        // 表紙指定があればそれを入力に設定 先頭画像のisCoverはfalseになっている
        // プレビューで編集された場合はここで追加する
        ////////////////////////////////
        // 表紙編集時のイメージ出力
        if (this.coverImageInfo) {
            try {
                // kindleの場合は常にjpegに変換
                if (this.isKindle) {
                    let imgExt = this.coverImageInfo.getExt();
                    if (!imgExt.startsWith('jp')) {
                        if (!bookInfo.coverImage) {
                            const bais = new Buffer.from(this.coverImageBytes);
                            bookInfo.coverImage = ImageUtils.readImage(imgExt, bais);
                            bais.close();
                        }
                        this.coverImageInfo.setExt('jpeg');
                    }
                }
                if (bookInfo.coverImage) {
                    // プレビューで編集されている場合
                    zos.putArchiveEntry(new ZipArchiveEntry(`${this.OPSPATH}${this.IMAGES_PATH}${this.coverImageInfo.getOutFileName()}`));
                    this.writeCoverImage(bookInfo.coverImage, zos, this.coverImageInfo);
                    zos.closeArchiveEntry();
                    bookInfo.coverImage = null; // 同じ画像が使われている場合は以後はファイルから読み込ませる
                } else {
                    const bais = new Buffer.from(this.coverImageBytes);
                    zos.putArchiveEntry(new ZipArchiveEntry(`${this.OPSPATH}${this.IMAGES_PATH}${this.coverImageInfo.getOutFileName()}`));
                    this.writeCoverImage(bais, zos, this.coverImageInfo);
                    zos.closeArchiveEntry();
                    bais.close();
                }
                this.imageInfos.shift(); // カバー画像は出力済みなので削除
                if (this.jProgressBar) this.jProgressBar.value += 10;
            } catch (e) {
                e.printStackTrace();
                LogAppender.error(`表紙画像取得エラー: ${bookInfo.coverFileName}`);
            }
        }
        if (this.canceled) return;
        try {
            // 本文画像出力 (画像のみの場合は出力済)
            if (srcExt === 'txt') {
                //////////////////////////////////
                // txtの場合はファイルシステムから取得
                for (let srcImageFileName of imageInfoReader.getImageFileNames()) {
                    srcImageFileName = imageInfoReader.correctExt(srcImageFileName); // 拡張子修正
                    if (this.outImageFileNames.has(srcImageFileName)) {
                        const imageInfo = imageInfoReader.getImageInfo(srcImageFileName);
                        if (!imageInfo) {
                            LogAppender.println(`[WARN] 画像ファイルなし: ${srcImageFileName}`);
                        } else {
                            const imageFile = imageInfoReader.getImageFile(srcImageFileName);
                            if (imageFile.exists()) {
                                const fis = fs.createReadStream(imageFile);
                                zos.putArchiveEntry(new ZipArchiveEntry(`${this.OPSPATH}${this.IMAGES_PATH}${imageInfo.getOutFileName()}`));
                                await this.writeImage(fis, zos, imageInfo);
                                zos.closeArchiveEntry();
                                fis.close();
                                this.outImageFileNames.delete(srcImageFileName);
                            }
                        }
                    }
                    if (this.canceled) return;
                    if (this.jProgressBar) this.jProgressBar.value += 10;
                }
            } else if (!bookInfo.imageOnly) {
                if (srcExt === 'rar') {
                    //////////////////////////////////
                    // Rar
                    const archive = new Archive(srcFile);
                    try {
                        for (const fileHeader of archive.getFileHeaders()) {
                            if (!fileHeader.isDirectory()) {
                                let entryName = fileHeader.getFileName();
                                entryName = entryName.replace('\\', '/');
                                // アーカイブ内のサブフォルダは除外してテキストからのパスにする
                                const srcImageFileName = entryName.substring(archivePathLength);
                                if (this.outImageFileNames.has(srcImageFileName)) {
                                    const is = archive.getInputStream(fileHeader);
                                    try {
                                        await this.writeArchiveImage(srcImageFileName, is);
                                    } finally {
                                        is.close();
                                    }
                                }
                            }
                        }
                    } finally {
                        archive.close();
                    }
                } else {
                    //////////////////////////////////
                    // Zip
                    const zis = new ZipArchiveInputStream(new BufferedInputStream(fs.createReadStream(srcFile), 65536), 'MS932', false);
                    try {
                        let entry;
                        while ((entry = zis.getNextEntry())) {
                            // アーカイブ内のサブフォルダは除外してテキストからのパスにする
                            const srcImageFileName = entry.getName().substring(archivePathLength);
                            if (this.outImageFileNames.has(srcImageFileName)) {
                                await this.writeArchiveImage(srcImageFileName, zis);
                            }
                        }
                    } finally {
                        zis.close();
                    }
                }
            }

            // エラーがなければ100%
            if (this.jProgressBar) this.jProgressBar.value = this.jProgressBar.getMaximum();

        } catch (e) {
            e.printStackTrace();
        } finally {
            try {
                // ePub3出力ファイルを閉じる
                if (zos) zos.close();
            } catch (e) {
                e.printStackTrace();
            }
            // メンバ変数解放
            this.velocityContext = null;
            this.bookInfo = null;
            this.imageInfoReader = null;
        }
    }

    /** アーカイブ内の画像を出力 */
    async writeArchiveImage(srcImageFileName, is) {
        srcImageFileName = this.imageInfoReader.correctExt(srcImageFileName); // 拡張子修正
        const imageInfo = this.imageInfoReader.getImageInfo(srcImageFileName);
        // Zip内テキストの場合はidと出力ファイル名が登録されていなければ出力しない。
        if (imageInfo) {
            if (imageInfo.getId()) {
                // 回転チェック
                if (imageInfo.getWidth() / imageInfo.getHeight() >= this.dispW / this.dispH) {
                    if (this.rotateAngle !== 0 && this.dispW < this.dispH && imageInfo.getHeight() / imageInfo.getWidth() < this.dispW / this.dispH) { // 縦長画面で横長
                        imageInfo.rotateAngle = this.rotateAngle;
                    }
                } else {
                    if (this.rotateAngle !== 0 && this.dispW > this.dispH && imageInfo.getHeight() / imageInfo.getWidth() > this.dispW / this.dispH) { // 横長画面で縦長
                        imageInfo.rotateAngle = this.rotateAngle;
                    }
                }
                this.zos.putArchiveEntry(new ZipArchiveEntry(this.OPS_PATH + this.IMAGES_PATH + imageInfo.getOutFileName()));
                // Zip, Rarからの直接読み込みは失敗するので一旦バイト配列にする
                const baos = new ByteArrayOutputStream();
                const bufferedInputStream = new BufferedInputStream(is, 16384);
                await bufferedInputStream.transferTo(baos);
                const bytes = baos.toByteArray();
                baos.close();
                const bais = new ByteArrayInputStream(bytes);
                await this.writeImage(bais, this.zos, imageInfo);
                bais.close();
                this.zos.closeArchiveEntry();
            }
            if (this.canceled) return;
            if (this.jProgressBar) this.jProgressBar.setValue(this.jProgressBar.getValue() + 10);
        }
    }

    /** 表紙画像を出力 編集済の画像なのでリサイズしない */
    async writeCoverImage(srcImage, zos, imageInfo) {
        imageInfo.rotateAngle = 0; // 回転させない
        await ImageUtils.writeImage(null, srcImage, zos, imageInfo, this.jpegQuality, this.gammaOp,
            0, 0, 0, this.dispW, this.dispH,
            0, 0, 0, 0, 0, 0);
    }

    /** 表紙画像を出力 */
    async writeCoverImage(is, zos, imageInfo) {
        imageInfo.rotateAngle = 0; // 回転させない
        await ImageUtils.writeImage(is, null, zos, imageInfo, this.jpegQuality, this.gammaOp,
            0, this.coverW, this.coverH, this.dispW, this.dispH,
            0, 0, 0, 0, 0, 0);
    }

    /** 画像を出力 */
    async writeImage(is, zos, imageInfo) {
        await ImageUtils.writeImage(is, null, zos, imageInfo, this.jpegQuality, this.gammaOp,
            this.maxImagePixels, this.maxImageW, this.maxImageH, this.dispW, this.dispH,
            this.autoMarginLimitH, this.autoMarginLimitV, this.autoMarginWhiteLevel, this.autoMarginPadding, this.autoMarginNombre, this.autoMarginNombreSize);
    }

    /** 画像を出力 */
    async writeImage(srcImage, zos, imageInfo) {
        await ImageUtils.writeImage(null, srcImage, zos, imageInfo, this.jpegQuality, this.gammaOp,
            this.maxImagePixels, this.maxImageW, this.maxImageH, this.dispW, this.dispH,
            this.autoMarginLimitH, this.autoMarginLimitV, this.autoMarginWhiteLevel, this.autoMarginPadding, this.autoMarginNombre, this.autoMarginNombreSize);
    }

    /** 本文を出力する */
    async writeSections(converter, src, bw, srcFile, srcExt, zos) {
        // this.startSection(0, bookInfo.startMiddle);

        // ePub3変換して出力
        // 改ページ時にnextSection() を、画像出力時にgetImageFilePath() 呼び出し
        converter.vertical = this.bookInfo.vertical;
        await converter.convertTextToEpub3(bw, src, this.bookInfo);
        bw.flush();

        this.endSection();
    }


    /** 次のチャプター用のZipArchiveEntryに切替え
     * チャプターのファイル名はcpaterFileNamesに追加される (0001)
     * @throws IOException */
    async nextSection(bw, lineNum, pageType, imagePageType, srcImageFilePath) {
        //タイトル置き換え時は出力しない
        if (this.sectionIndex > 0) {
            await bw.flush();
            await this.endSection();
        }
        await this.startSection(lineNum, pageType, imagePageType, srcImageFilePath);
    }

    /** セクション開始.
     * @throws IOException */
    async startSection(lineNum, pageType, imagePageType, srcImageFilePath) {
        this.sectionIndex++;
        let sectionId = this.decimalFormat.format(this.sectionIndex);
        // package.opf用にファイル名
        let sectionInfo = new SectionInfo(sectionId);
        // 次の行が単一画像なら画像専用指定
        switch (imagePageType) {
            case PageBreakType.IMAGE_PAGE_W:
                // 幅100％指定
                sectionInfo.setImagePage(true);
                sectionInfo.setImageFitW(true);
                break;
            case PageBreakType.IMAGE_PAGE_H:
                // 高さ100%指定
                sectionInfo.setImagePage(true);
                sectionInfo.setImageFitH(true);
                break;
            case PageBreakType.IMAGE_PAGE_NOFIT:
                sectionInfo.setImagePage(true);
                break;
        }
        if (pageType === PageBreakType.PAGE_MIDDLE) sectionInfo.setMiddle(true);
        else if (pageType === PageBreakType.PAGE_BOTTOM) sectionInfo.setBottom(true);
        this.sectionInfos.add(sectionInfo);
        // セクション開始は名称がnullなので改ページ処理で文字列が設定されなければ出力されない 階層レベルは1
        // this.addChapter(null, null, 1);

        this.zos.putArchiveEntry(new ZipArchiveEntry(this.OPS_PATH + this.XHTML_PATH + sectionId + ".xhtml"));

        // ヘッダ出力
        let bw = new BufferedWriter(new OutputStreamWriter(this.zos, "UTF-8"));
        // 出力開始するセクションに対応したSectionInfoを設定
        this.velocityContext.put("sectionInfo", sectionInfo);
        Velocity.mergeTemplate(this.templatePath + this.OPS_PATH + this.XHTML_PATH + this.XHTML_HEADER_EJS, "UTF-8", this.velocityContext, bw);
        await bw.flush();
    }

    /** セクション終了.
     * @throws IOException */
    async endSection() {
        // フッタ出力
        let bw = new BufferedWriter(new OutputStreamWriter(this.zos, "UTF-8"));
        Velocity.mergeTemplate(this.templatePath + this.OPS_PATH + this.XHTML_PATH + this.XHTML_FOOTER_EJS, "UTF-8", this.velocityContext, bw);
        await bw.flush();

        this.zos.closeArchiveEntry();
    }

    /** 章を追加 */
    addChapter(chapterId, name, chapterLevel) {
        let sectionInfo = this.sectionInfos.lastElement();
        this.chapterInfos.add(new ChapterInfo(sectionInfo.sectionId, chapterId, name, chapterLevel));
    }

    /** 外字用フォントを追加 */
    addGaijiFont(className, gaijiFile) {
        if (this.gaijiNameSet.contains(className)) return;
        this.vecGaijiInfo.add(new GaijiInfo(className, gaijiFile));
        this.gaijiNameSet.add(className);
    }

    /** 連番に変更した画像ファイル名を返却.
     * 重複していたら前に出力したときの連番ファイル名を返す
     * 返り値はxhtmlからの相対パスにする (../images/0001.jpg)
     * 変更前と変更後のファイル名はimageFileNamesに格納される (images/0001.jpg)
     * @return 画像タグを出力しない場合はnullを返す
     * @throws IOException */
    getImageFilePath(srcImageFileName, lineNum) {
        let isCover = false;

        let imageInfo = this.imageInfoReader.getImageInfo(srcImageFileName);
        // 拡張子修正
        if (imageInfo === null) {
            // 画像があるかチェック
            let altImageFileName = this.imageInfoReader.correctExt(srcImageFileName);
            imageInfo = this.imageInfoReader.getImageInfo(altImageFileName);
            if (imageInfo !== null) {
                LogAppender.warn(lineNum, "画像拡張子変更", srcImageFileName);
                srcImageFileName = altImageFileName;
            }
        }
        this.imageIndex++; // 0001から開始 (本文内の順番に合せるため、ファイルが無くてもカウント)
        if (imageInfo !== null) {
            let imageId = imageInfo.getId();
            // 画像は未だ出力されていない
            if (imageId === null) {
                imageId = this.decimalFormat.format(this.imageIndex);
                this.imageInfos.add(imageInfo);
                this.outImageFileNames.add(srcImageFileName);
                if (this.imageIndex - 1 === this.bookInfo.coverImageIndex) {
                    // imageInfo.setIsCover(true);
                    isCover = true;
                }
            }
            let outImageFileName = imageId + "." + imageInfo.getExt().replaceFirst("jpeg", "jpg");
            imageInfo.setId(imageId);
            imageInfo.setOutFileName(outImageFileName);

            // 先頭に表紙ページ移動の場合でカバーページならnullを返して本文中から削除
            if (this.bookInfo.insertCoverPage && isCover) return null;
            return "../" + this.IMAGES_PATH + outImageFileName;
        } else {
            LogAppender.warn(lineNum, "画像ファイルなし", srcImageFileName);
        }
        return null;
    }

    isCoverImage() {
        return (this.imageIndex === this.bookInfo.coverImageIndex);
    }

    /** 現在の出力済画像枚数を返す 0なら未出力 */
    getImageIndex() {
        return this.imageIndex;
    }

    /** 画像が単一ページ画像にできるかチェック
     * @param srcFilePath テキスト内の画像相対パス文字列
     * @throws IOException */
    getImagePageType(srcFilePath, tagLevel, lineNum, hasCaption) {
        try {
            let imageInfo = this.imageInfoReader.getImageInfo(srcFilePath);
            // 拡張子修正
            if (imageInfo === null) imageInfo = this.imageInfoReader.getImageInfo(this.imageInfoReader.correctExt(srcFilePath));

            if (imageInfo === null) return PageBreakType.IMAGE_PAGE_NONE;

            let imageOrgWidth = imageInfo.getWidth();
            let imageOrgHeight = imageInfo.getHeight();
            let imageWidth = imageOrgWidth;
            let imageHeight = imageOrgHeight;
            if (this.imageScale > 0) {
                imageWidth *= this.imageScale;
                imageHeight *= this.imageScale;
            }

            // 回り込みサイズ以下
            if (this.imageFloatType !== 0 &&
                (imageOrgWidth >= 64 || imageOrgHeight >= 64) &&
                imageOrgWidth <= this.imageFloatW && imageOrgHeight <= this.imageFloatH) {
                if (this.imageFloatType === 1) {
                    if (imageWidth > this.dispW) return PageBreakType.IMAGE_INLINE_TOP_W;
                    return PageBreakType.IMAGE_INLINE_TOP;
                } else {
                    if (imageWidth > this.dispW) return PageBreakType.IMAGE_INLINE_BOTTOM_W;
                    return PageBreakType.IMAGE_INLINE_BOTTOM;
                }
            }
            // 指定サイズ以下なら単ページ化 (タグ外かつキャプションが無い場合のみ)
            if (imageOrgWidth >= this.singlePageWidth || imageOrgWidth >= this.singlePageSizeW && imageOrgHeight >= this.singlePageSizeH) {
                if (tagLevel === 0) {
                    if (!hasCaption) {
                        if (imageWidth <= this.dispW && imageHeight < this.dispH) {
                            // 画面より小さい場合
                            if (!this.fitImage) return PageBreakType.IMAGE_PAGE_NOFIT;
                        } else {
                            // 画面より大きく、サイズ指定無し
                            if (this.imageSizeType === SectionInfo.IMAGE_SIZE_TYPE_AUTO) return PageBreakType.IMAGE_PAGE_NOFIT;
                        }
                        // 拡大または縮小指定
                        // 画面より横長
                        if (imageWidth / imageHeight > (this.dispW / this.dispH)) {
                            if (this.rotateAngle !== 0 && this.dispW < this.dispH && imageWidth > imageHeight * 1.1) { // 縦長画面で110%以上横長
                                imageInfo.rotateAngle = this.rotateAngle;
                                if (imageHeight / imageWidth > (this.dispW / this.dispH)) return PageBreakType.IMAGE_PAGE_W; // 回転後画面より横長
                                return PageBreakType.IMAGE_PAGE_H;
                            } else {
                                return PageBreakType.IMAGE_PAGE_W;
                            }
                        }
                        // 画面より縦長
                        else {
                            if (this.rotateAngle !== 0 && this.dispW > this.dispH && imageWidth * 1.1 < imageHeight) { // 横長画面で110%以上縦長
                                imageInfo.rotateAngle = this.rotateAngle;
                                if (imageHeight / imageWidth > (this.dispW / this.dispH)) return PageBreakType.IMAGE_PAGE_W; // 回転後画面より横長
                                return PageBreakType.IMAGE_PAGE_H;
                            } else {
                                return PageBreakType.IMAGE_PAGE_H;
                            }
                        }
                    } else {
                        LogAppender.warn(lineNum, "キャプションがあるため画像単ページ化されません");
                    }
                } else {
                    LogAppender.warn(lineNum, "タグ内のため画像単ページ化できません");
                }
            }

            // 単ページ化も回り込みもない
            if (imageWidth > this.dispW) { // 横がはみ出している
                if (imageWidth / imageHeight > (this.dispW / this.dispH)) return PageBreakType.IMAGE_INLINE_W;
                else return PageBreakType.IMAGE_INLINE_H; // 縦の方が長い
            }
            if (imageHeight > this.dispH) return PageBreakType.IMAGE_INLINE_H; // 縦がはみ出している

        } catch (e) {
            console.error(e);
        }
        return PageBreakType.IMAGE_PAGE_NONE;
    }

    /** 画像の画面内の比率を取得 表示倍率指定反映後
     * @return 画面幅にタイする表示比率% 倍率1の場合は0 小さい画像は-1を返す */
    getImageWidthRatio(srcFilePath, hasCaption) {
        // 0なら無効
        if (this.imageScale === 0) return 0;

        let ratio = 0;
        try {
            let imageInfo = this.imageInfoReader.getImageInfo(srcFilePath);
            if (imageInfo !== null) {
                // 外字や数式は除外 行方向に64px以下
                if (this.bookInfo.vertical) {
                    if (imageInfo.getWidth() <= 64) return -1;
                } else if (imageInfo.getHeight() <= 64) return -1;

                // 回転時は縦横入れ替え
                let imgW = imageInfo.getWidth();
                let imgH = imageInfo.getHeight();
                if (imageInfo.rotateAngle === 90 || imageInfo.rotateAngle === 270) {
                    imgW = imageInfo.getHeight();
                    imgH = imageInfo.getWidth();
                }
                let wRatio = (imgW / this.dispW) * this.imageScale * 100;
                let hRatio = (imgH / this.dispH) * this.imageScale * 100;
                // 縦がはみ出ている場合は調整
                if (hasCaption) {
                    // キャプションがある場合は高さを90%にする
                    if (hRatio >= 90) {
                        wRatio *= 100 / hRatio;
                        wRatio *= 0.9;
                    }
                } else if (hRatio >= 100) {
                    wRatio *= 100 / hRatio;
                }
                ratio = wRatio;
            }
        } catch (e) {
            console.error(e);
        }
        return Math.min(100, ratio);
    }

    // 外字画像の縦と横の長さを比較して、同じなら0、横長なら1、縦長なら2を返す。
    getImageOrientation(srcFilePath) {
        let wide = 0;
        try {
            let imageInfo = this.imageInfoReader.getImageInfo(srcFilePath);
            if (imageInfo !== null) {
                // 外字や数式は除外 行方向に64px以下
                if (this.bookInfo.vertical) {
                    if (imageInfo.getWidth() <= 64) return -1;
                } else if (imageInfo.getHeight() <= 64) return -1;

                // 回転時は縦横入れ替え
                let imgW = imageInfo.getWidth();
                let imgH = imageInfo.getHeight();
                if (imageInfo.rotateAngle === 90 || imageInfo.rotateAngle === 270) {
                    imgW = imageInfo.getHeight();
                    imgH = imageInfo.getWidth();
                }
                if (imgW === imgH) {
                    wide = 0;
                } else if (imgW > imgH) {
                    wide = 1;
                } else {
                    wide = 2;
                }
            }
        } catch (e) {
            console.error(e);
        }
        return wide;
    }

    /** Kindleかどうかを設定 Kindleなら例外処理を行う */
    setIsKindle(isKindle) {
        this.isKindle = isKindle;

    }

    /** 外字フォントファイルが格納されているテンプレートパスを取得 */
    getGaijiFontPath() {
        return Epub3Writer.GAIJI_PATH;
    }
}




//export { Epub3Writer };
//module.exports = Epub3Writer