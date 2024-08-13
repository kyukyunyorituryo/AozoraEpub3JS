import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper function to resolve the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//import Epub3Writer from  './writer/Epub3Writer.js';
//import AozoraEpub3Converter from  './converter/AozoraEpub3Converter.js';

//const Epub3Writer = require('./writer/Epub3Writer.js');
//const AozoraEpub3Converter = require('./converter/AozoraEpub3Converter.js');
const jarPath = path.join(__dirname, '/');
//const epub3Writer = new Epub3Writer(jarPath+"template/");
//console.log(epub3Writer)
/*
const ao = new AozoraEpub3Converter(epub3Writer, jarPath);
//console.log(ao)
*/


/*
converterフォルダー
*/


//const JarPath = path.join(__dirname, '/');
import AozoraGaijiConverter from './converter/AozoraGaijiConverter.js';
const gaijiconverter = new AozoraGaijiConverter(jarPath);

// Test chukiUtfMap and chukiAltMap initialization
console.log(gaijiconverter.codeToCharString('U+0041'));
console.log(gaijiconverter.codeToCharString('U+04E02'));
//console.log(gaijiconverter.codeToCharString('※［＃感嘆符三つ］'));
//console.log(gaijiconverter.toUtf('U+04E02'));

import JisConverter from './converter/JisConverter.js';
//const JisConverter = require('./converter/JisConverter.js');
//const jc = new JisConverter();
//console.log(jc)

const converter = JisConverter.getConverter();
console.log(converter.toCharString(0, 0, 1)); // !
console.log(converter.toCharString(1, 4, 87)); // か゚
console.log(converter.toCharString(1, 12, 90)); // null
console.log(converter.toCharString(1, 13, 94)); // ☞
console.log(converter.toCharString(1, 14, 1)); // 俱
console.log(converter.toCharString(1, 16, 1)); // 亜
console.log(converter.toCharString(2, 94, 64)); // 䵷
console.log(converter.toCharString(2, 94, 86)); // 𪚲
console.log(converter.toCharString(1, 90, 16)); // 縈 1-90-16
console.log(converter.toCharString(2, 94, 85));

import LatinConverter from './converter/LatinConverter.js';
const latinConverter = new LatinConverter(jarPath+"chuki_latin.txt");
// 分解表記の文字単体をUTF-8文字に変換

console.log(latinConverter.toLatinCharacter('A&') );
console.log(latinConverter.toLatinCharacter('A`') );
console.log(latinConverter.toLatinCharacter('A\'') );

import PageBreakType from './converter/PageBreakType.js';
const pageBreakType = new PageBreakType();

console.log(pageBreakType );

import RubyCharType from './converter/RubyCharType.js';
//const rubyCharType = new RubyCharType();

console.log(RubyCharType );
/*
imageフォルダー
*/
const imageUrl = 'https://kyukyunyorituryo.github.io/i/densho512.png';
import ImageInfoReader from './image/ImageInfoReader.js';
import ImageUtils from './image/ImageUtils.js';
var imageInfoReader = new ImageInfoReader("png",imageUrl);
var imageutil = new ImageUtils();

import jimp from 'jimp';
(async() => {
  const image = await ImageUtils.loadImage(imageUrl);
      /*/ ファイル読み込み
      const image = await jimp.read('');
      // 画像サイズを取得
      console.log('width:'+image.bitmap.width);
      console.log('height:'+image.bitmap.height);
      */
  console.log(image)


})();
/*
infoフォルダー
*/

import BookInfo from './info/BookInfo.js';
//const BookInfo = require('./info/BookInfo.js');

var bookInfo = new BookInfo();
bookInfo.title = "サンプルタイトル";
bookInfo.creator = "著者名";

console.log(bookInfo);


import BookInfoHistory from './info/BookInfoHistory.js';
//const BookInfoHistory = require('./info/BookInfoHistory.cjs');
bookInfo = {
    coverEditInfo: null,
    coverFileName: 'cover.jpg',
    coverImageIndex: 0,
    coverExt: 'jpg',
    title: 'Sample Title',
    titleAs: 'サンプル タイトル',
    creator: 'Author Name',
    creatorAs: 'オーサー ネーム',
    publisher: 'Sample Publisher'
};
const bi = new BookInfoHistory(bookInfo);
console.log(bi)


import ChapterInfo from './info/ChapterInfo.js';
//const ChapterInfo = require('./info/ChapterInfo.cjs');
const ci = new ChapterInfo();
console.log(ci)

import ChapterLineInfo from './info/ChapterLineInfo.js';
//const ChapterInfo = require('./info/ChapterInfo.cjs');
const cli = new ChapterLineInfo();
console.log(cli)

import CoverEditInfo from './info/CoverEditInfo.js';
//const CoverEditInfo = require('./info/CoverEditInfo.cjs');
const cei = new CoverEditInfo();
console.log(cei)

import GaijiInfo from './info/GaijiInfo.js';
//const CoverEditInfo = require('./info/CoverEditInfo.cjs');
const gi = new GaijiInfo();
console.log(gi)


/*
utilフォルダー
*/
import Detector from  './util/Detector.js';
//const Detector = require('./util/Detector.js');
//C:\Users\Owner\Documents\GitHub\AozoraEpub3JS\README.md
const inputStream="C:/Users/Owner/Documents/GitHub/AozoraEpub3JS/README.md"
console.log(Detector.getCharset(inputStream))


import CharUtils from  './util/CharUtils.js';
//const CharUtils = require('./util/CharUtils.js');
var rt=CharUtils.removeTag("あ<IMG>あ<IMG1>あ<img src=\"\"/>い<A>い<A1>い<AB>う<ab href=\"\">うう<a href=\"\">え<br>え<br/>え</a>お</ab>おお", "br", "img|a", "a")
console.log(rt)

import FileNameComparator from  './util/FileNameComparator.js';
//const FileNameComparator = require('./util/FileNameComparator.js');
const comparator = new FileNameComparator();
 const result = comparator.compare('abc', 'abcd');
console.log(result)
 const result2 = comparator.compare('abc一', 'abc二');
console.log(result2)

import LogAppender from  './util/LogAppender.js';
//const LogAppender = require('./util/LogAppender.js');
const la = new LogAppender();
LogAppender.error(1,"あ")
console.log(la)
/