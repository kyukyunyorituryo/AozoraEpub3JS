
// 前回の変換時の履歴
// 表示編集情報
// 使用例 (BookInfoクラスのインスタンスを渡してBookInfoHistoryを作成)
/*
const bookInfo = {
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

const bookInfoHistory = new BookInfoHistory(bookInfo);
console.log(bookInfoHistory);
*/
export default class BookInfoHistory {
/*
	// 表紙編集情報 /
	public CoverEditInfo coverEditInfo;
	/** 表紙ファイル名 フルパスかURL ""なら先頭の挿絵 nullなら表紙無し 
	public String coverFileName;
	/** 表紙に使う挿絵の本文内Index -1なら本文内の挿絵は使わない 
	public int coverImageIndex = -1;
	/** imageにしたとき用の元ファイルの拡張子 
	public String coverExt = null;
	
	public String title;
	public String titleAs;
	public String creator;
	public String creatorAs;
	public String publisher;
	*/

    /**
     * @param {Object} bookInfo - BookInfoオブジェクト
     */
    constructor(bookInfo) {
        /** 表紙編集情報 */
        this.coverEditInfo = bookInfo.coverEditInfo;
        /** 表紙ファイル名 フルパスかURL ""なら先頭の挿絵 nullなら表紙無し */
        this.coverFileName = bookInfo.coverFileName;
        /** 表紙に使う挿絵の本文内Index -1なら本文内の挿絵は使わない */
        this.coverImageIndex = bookInfo.coverImageIndex || -1;
        /** imageにしたとき用の元ファイルの拡張子 */
        this.coverExt = bookInfo.coverExt || null;

        this.title = bookInfo.title;
        this.titleAs = bookInfo.titleAs;
        this.creator = bookInfo.creator;
        this.creatorAs = bookInfo.creatorAs;
        this.publisher = bookInfo.publisher;
    }
}
