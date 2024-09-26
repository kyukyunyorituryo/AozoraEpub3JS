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
var title_h = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/title_horizontal.ejs'), 'utf-8');
var title_m = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/title_middle.ejs'), 'utf-8');
var header = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/xhtml_header.ejs'), 'utf-8');
var footer = fs.readFileSync(path.resolve(__dirname, '../template/item/xhtml/xhtml_footer.ejs'), 'utf-8');

const title="タイトル";

var bookInfo={
    TocVertical:false,
    InsertCoverPage:true,
    InsertTocPage:true,
    ImageOnly:false,
}
var sectionInfo={
    SectionId:"0001",
}
var chapters=[{
    ChapterName:"目次1",
    LevelStart:1,
    ChapterId:"chap",
    SectionId:"0001",
},{
    ChapterName:"目次1",
    LevelStart:1,
    SectionId:"0001",
}]
var sections=[{
    SectionId:"0001",
},{
    SectionId:"0002",
}]
var images=[{
    IsCover:true,
    Format:"image/jpeg",
    Id:"cover",
    OutFileName:"cover.jpg"
}]


//ejsテンプレートエンジン　ページファイル


//if(data.author2==null)data.author2=''
var opf = ejs.render(opftemplete, {
    title: title,
    titleAs:false,
    creator: "著者" ,
    creatorAs:false,
    publisher:false,
    language:"ja",
    identifier:"27588",
    modified:"20240925",
    bookInfo:bookInfo,
    images:false,
    title_page:true,
    vecGaijiInfo:false,
    images:images,
    sections:sections
})
//console.log(opf)
var nav = ejs.render(navtemplete, {
    bookInfo: bookInfo,
    title: title,
    title_page:true,
    sectionInfo:sectionInfo,
    chapters:chapters,
    cover_name:"表紙",
    navNest:true,
})
//console.log(nav)
var tocncx = ejs.render(toctemplete, {
    bookInfo: bookInfo,
    title: title,
    title_page:true,
    sectionInfo:sectionInfo,
    chapters:chapters,
    cover_name:"表紙",
    navNest:true,    
    identifier:"27588",
    ncx_depth:2
})
//console.log(tocncx)
/**/
var coverImage={
    Width:1200,
    Height:1000,
    OutFileName:"cover.jpg"
}
var coverxhtml = ejs.render(covertemplete, {
    title: title,
    coverImage:coverImage,
    covername: "カバー"
})
//console.log(coverxhtml)
var title_horizontal = ejs.render(title_h, {
    title: title,
    SERIES:"coverImage",
    TITLE: title,
    SUBTITLE:"",
    CREATOR:"",
    SUBCREATOR:"",
    PUBLISHER:""
})
//console.log(title_horizontal)
var title_middle = ejs.render(title_m, {
    kindle:true,
    bookInfo: bookInfo,
    title: title,
    SERIES:"coverImage",
    ORGTITLE:"",
    SUBORGTITLE:"",
    TITLE: title,
    SUBTITLE:"",
    CREATOR:"",
    SUBCREATOR:"",
    PUBLISHER:""
})
//console.log(title_middle)
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
