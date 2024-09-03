import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import ejs from 'ejs';

//テンプレートファイルの読み込み
var opftemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/package.ejs'), 'utf-8');
var navtemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/xhtml_nav.ejs'), 'utf-8');
var toctemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/toc.ncx.ejs'), 'utf-8');
var covertemplete = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/cover.ejs'), 'utf-8');
console.log(covertemplete)
/*
//ejsテンプレートエンジン　ページファイル
var nav = ejs.render(navtemplete, {
    bookInfo: "",
    title: data.title,
    cover:data.index[0][1],
    data: data,
    mokuji:mokuji
})
//console.log(nav)

if(data.author2==null)data.author2=''
var opf = ejs.render(opftemplete, {
    uuid4:uuid4,
    title: data.title,
    creator1: data.author1 ,
    creator2: data.author2 ,
    date:date,
    panel_view:data.panel_view,
    page_direction:data.page_direction,
    cover_ext:data.cover_file.ext,
    type:data.cover_file.type,
    data:data
})
//console.log(opf)
var tocncx = ejs.render(toctemplete, {
    uuid4:uuid4,
    creator1: data.author1 ,
    title: data.title,
    cover:data.index[0][1],
    toc1:"目次",
    data: data,
    mokuji:mokuji
})
//console.log(tocncx)
*/
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
/*
var pages = [];
for(let i in data.files) {
pages[i] = ejs.render(pagetemplete, {
    title: data.title,
    width: data.width,
    height: data.height,
    image:data.files[i].file_id +"."+data.files[i].ext,
})};
//console.log(pages[0])
*/