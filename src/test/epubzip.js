import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import ejs from 'ejs';
import JSZip from "jszip";

var data={
    "url":"C:/Users/user/Downloads/comic/testdata/",
    "output":'C:/Users/user/Downloads/comic/fxlsample/out.epub',
    "title": "タイトル",
    "author1": "著者名1",
    "author2": "著者名２",
    "index": [
        ["cover.jpg", "表紙"],
        ["00001.jpg", "目次"],
        ["00005.jpg", "最終ページ"]
        ],
    "page_direction": "rtl",
    "panel_view": "horizontal-rl"
    }

//テンプレートファイルの読み込み
var opftemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/package.ejs'), 'utf-8');
var navtemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/xhtml_nav.ejs'), 'utf-8');
var toctemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/toc.ncx.ejs'), 'utf-8');
var covertemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/cover.ejs'), 'utf-8');


var coverImage={
    Width:1200,
    Height:1000,
    OutFileName:"cover.jpg"
}
var coverxhtml = ejs.render(covertemplete, {
    title: "タイトル",
    coverImage:coverImage,
    covername: "カバー"
})
console.log(coverxhtml)


import Epub3Writer from  '../writer/Epub3Writer.js';
const epub3Writer = new Epub3Writer(jarPath+"template/");
console.log(epub3Writer)
const TEMPLATE_FILE_NAMES_STANDARD = [
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
//let epub3Writer = new Epub3Writer(`${jarPath}template/`);
//ZIP圧縮
const templatePath = path.resolve(__dirname, '../template/');

var zip = new JSZip();
zip.file("mimetype", "application/epub+zip");
var meta = zip.folder("META-INF");
meta.file("container.xml", containerXML);
var item = zip.folder("item");
item.file("standard.opf", opf);
item.file("nav.xhtml", nav);
item.file("toc.ncx", tocncx);
//画像ファイル生成
var img = zip.folder("item/image");
img.file("cover." + data.cover_file.ext,data.cover_file.data)
for (let i in data.files) {
img.file(data.files[i].file_id+"."+data.files[i].ext,data.files[i].data)
}
var style = zip.folder("item/style");
style.file("fixed-layout-jp.css",css_style)
var xhtml = zip.folder("item/xhtml");
xhtml.file("p-cover.xhtml",coverxhtml);
for (let i in data.files) {
xhtml.file("p-"+ ('0000' + (parseInt(i)+1) ).slice( -3 )+".xhtml", pages[i]);
}

// zip.file("file", content);
// ... and other manipulations

zip
.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
.pipe(fs.createWriteStream(data.output))
.on('finish', function () {
    // JSZip generates a readable stream with a "end" event,
    // but is piped here in a writable stream which emits a "finish" event.
    console.log(data.output+"に出力されました。");
});

