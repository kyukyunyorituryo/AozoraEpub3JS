/**
 * 文字変換と判別関連の関数定義クラス
 */

export default class CharUtils {
	/** 全角英数字を半角に変換
	 * @param src 全角文字列
	 * @return 半角文字列 */
  static fullToHalf(src) {
    let result = [];
    for (let char of src) {
      if ('０' <= char && char <= '９') {
        result.push(String.fromCharCode(char.charCodeAt(0) - '０'.charCodeAt(0) + '0'.charCodeAt(0)));
      } else if ('Ａ' <= char && char <= 'ｚ') {
        result.push(String.fromCharCode(char.charCodeAt(0) - 'ａ'.charCodeAt(0) + 'a'.charCodeAt(0)));
      } else {
        result.push(char);
      }
    }
    return result.join('');
  }

  // すべて同じ文字かチェック
  static isSameChars(ch, begin, end) {
    for (let i = begin + 1; i < end; i++) {
      if (ch[begin] !== ch[i]) return false;
    }
    return true;
  }

  // 半角数字かチェック
  static isNum(ch) {
    return '0' <= ch && ch <= '9';
  }

  // 英字かどうかをチェック 拡張ラテン文字含む 半角スペースは含まない
  static isHalfchar(ch) {
    return (0x21 <= ch.charCodeAt(0) && ch.charCodeAt(0) <= 0x02AF);
  }

  static isHalf(chars) {
    for (let ch of chars) {
      if (!CharUtils.isHalfchar(ch)) return false;
    }
    return true;
  }

  // 英字かどうかをチェック 拡張ラテン文字含む 半角スペースを含む
  static isHalfSpaceCh(ch) {
    return (0x20 <= ch.charCodeAt(0) && ch.charCodeAt(0) <= 0x02AF);
  }

  static isHalfSpace(chars) {
    for (let ch of chars) {
      if (!CharUtils.isHalfSpaceCh(ch)) return false;
    }
    return true;
  }

  static isFullAlpha(ch) {
    return ('Ａ' <= ch && ch <= 'Ｚ') || ('ａ' <= ch && ch <= 'ｚ') || ('０' <= ch && ch <= '９') || ch === '＠' || ch === '＿';
  }

  // 半角数字かチェック 全角では
  static isFullNum(ch) {
    return '０' <= ch && ch <= '９';
  }

  // ひらがなかチェック 半角濁点半濁点は全角に変換済
  static isHiragana(ch) {
    return ('ぁ' <= ch && ch <= 'ん') || ['ゕ', 'ゖ', 'ー', 'ゝ', 'ゞ', 'ヽ', 'ヾ', '゛', '゜', 'ι'].includes(ch);
 //濁点処理用の例外
				// || 'ﾞ'==ch || 'ﾟ'== ch;
  }

  // カタカナかチェック 半角濁点半濁点は全角に変換済
  static isKatakana(ch) {
    const katakana = ['ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヵ', 'ㇰ', 'ヶ', 'ㇱ', 'ㇲ', 'ッ', 'ㇳ', 'ㇴ', 'ㇵ', 'ㇶ', 'ㇷ', 'ㇸ', 'ㇹ', 'ㇺ', 'ャ', 'ュ', 'ョ', 'ㇻ', 'ㇼ', 'ㇽ', 'ㇾ', 'ㇿ', 'ヮ', 'ー', 'ゝ', 'ゞ', 'ヽ', 'ヾ', '゛', '゜'];
    return ('ァ' <= ch && ch <= 'ヶ') || katakana.includes(ch);
  }

  static isSpace(line) {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ' && line[i] !== '　' && line[i] !== ' ') return false;
    }
    return true;
  }

  // 英字かどうかをチェック 拡張ラテン文字含む
  static isAlpha(ch) {
    return ('A' <= ch && ch <= 'Z') || ('a' <= ch && ch <= 'z') || (0x80 <= ch.charCodeAt(0) && ch.charCodeAt(0) <= 0x02AF);
  }

	/** 漢字かどうかをチェック
	 * 4バイト文字のも対応
	 * 漢字の間の「ノカケヵヶ」も漢字扱い
	 * IVS文字 U+e0100-e01efも漢字扱い */
  static isKanji(ch, i) {
    if (ch[i] === '゛' || ch[i] === '゜') {
			//二の字点は濁点付きも漢字
      return i > 0 && ch[i - 1] === '〻';
		/*case 'ノ': case 'カ': case 'ケ': case 'ヵ': case 'ヶ':
			//漢字の間にある場合だけ漢字扱い
			if (i==0 || i+1==ch.length) return false;
			return _isKanji(ch, i-1) && _isKanji(ch, i+1);
		*/
    }
    return CharUtils._isKanji(ch, i);
  }
/**
   * カタカナ以外の漢字チェック
   * @param {char[]} ch - 文字の配列
   * @param {number} i - チェックする文字のインデックス
   * @returns {boolean} - 漢字であるかどうか
   */
  static _isKanji(ch, i) {
    const pre = i === 0 ? -1 : ch[i - 1].charCodeAt(0);
    const c = ch[i].charCodeAt(0);
    const suf = i + 1 >= ch.length ? -1 : ch[i + 1].charCodeAt(0);
    
    switch (c) {
      case '〓'.charCodeAt(0): 
      case '〆'.charCodeAt(0):
      case '々'.charCodeAt(0):
      case '〻'.charCodeAt(0):
        return true;
    }
    
    if (0x4E00 <= c && c <= 0x9FFF) return true; // '一' <= ch && ch <= '龠'
    if (0xF900 <= c && c <= 0xFAFF) return true; // CJK互換漢字
    if (0xFE00 <= c && c <= 0xFE0D) return true; // VS1-14 (15,16は絵文字用なので除外)
    // 0x20000-0x2A6DF UTF16({d840,dc00}-{d869,dedf})
    // 0x2A700-0x2B81F UTF16({d869,df00}-{d86e,dc1f})
    // 0x2F800-0x2FA1F UTF16({d87e,dc00}-{d87e,de1f})
    
    if (pre >= 0) {
      if (0xDB40 === pre && 0xDD00 <= c && c <= 0xDDEF) return true; // IVS e0100-e01ef
      if (0xD87E === pre && 0xDC00 <= c && c <= 0xDE1F) return true;
      const code = (pre << 16) | (c & 0xFFFF);
      if (0xD840DC00 <= code && code <= 0xD869DEDF) return true;
      if (0xD869DF00 <= code && code <= 0xD86EDC1F) return true;
    }
    
    if (suf >= 0) {
      if (0xDB40 === c && 0xDD00 <= suf && suf <= 0xDDEF) return true; // IVS e0100-e01ef
      if (0xD87E === c && 0xDC00 <= suf && suf <= 0xDE1F) return true;
      const code = (c << 16) | (suf & 0xFFFF);
      if (0xD840DC00 <= code && code <= 0xD869DEDF) return true;
      if (0xD869DF00 <= code && code <= 0xD86EDC1F) return true;
    }
    
    return false;
 
  }
	////////////////////////////////////////////////////////////////
  // ファイル名に使えない文字を'_'に置換
  static escapeUrlToFile(str) {
    return str.replace(/[?|&]/g, '/').replace(/[:*|<>\"\\]/g, '_');
  }

	////////////////////////////////////////////////////////////////
	/** 前後の空白を除外 */
  static removeSpace(text) {
    return text.replace(/^[ |　]+/, '').replace(/[ |　]+$/, '');
  }

  // タグを除外
  static removeTag(text) {
    return text.replace(/［＃.+?］/g, '').replace(/<[^>]+>/g, '');
  }

	/** ルビを除去 特殊文字のエスケープ文字 ※※ ※《 ※》 等が含まれる */
  static removeRuby(text) {
    let buf = [];
    let inRuby = false;
    for (let i = 0; i < text.length; i++) {
      if (inRuby) {
        if (text[i] === '》' && !CharUtils.isEscapedChar(text, i)) inRuby = false;
      } else {
        if (text[i] === '｜') {
          if (CharUtils.isEscapedChar(text, i)) buf.push(text[i]);
        } else if (text[i] === '《') {
          if (CharUtils.isEscapedChar(text, i)) buf.push(text[i]);
          else inRuby = true;
        } else {
          if (!inRuby) buf.push(text[i]);
        }
      }
    }
    return buf.join('');
  }

  // 文字がエスケープされた特殊文字ならtrue
  static isEscapedChar(ch, idx) {
    let escaped = false;
    for (let i = idx - 1; i >= 0; i--) {
      if (ch[i] === '※') escaped = !escaped;
      else return escaped;
    }
    return escaped;
  }

  // HTML特殊文字をエスケープ
  static escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

	/** 目次やタイトル用の文字列を取得 ルビ関連の文字 ｜《》 は除外済で他の特殊文字は'※'エスケープ
	 * @param maxLength 文字制限 これより大きい文字は短くして...をつける
	 * @prram 記号文字を短縮する */
  static getChapterName(line, maxLength, reduce = true) {
    let name = line.replace(/［＃.+?］/g, '') // 注記除去
                   .replace(/※(※|《|》|［|］|〔|〕|｜)/g, '$1') // エスケープ文字から※除外
                   .replace(/\t/g, ' ')
                   .replace(/^[ |　]+/, '')
                   .replace(/[ |　]+$/, '');
    if (reduce) name = name.replace(/(=|＝|-|―|─)+/g, '$1'); // 連続する記号は1つに
    // タグはimgとaを削除
    name = name.replace(/< *(img|a) [^>]*>/gi, '').replace(/< *\/ *(img|a)(>| [^>]*>)/gi, '');

    if (maxLength === 0) return name;
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  }
	/** imgとaタグ除去用のパターン */
chapterTagOpenPattern = new RegExp("< *(img|a) [^>]*>", "i");
chapterTagClosePattern = new RegExp("< */ *(img|a)(>| [^>]*>)", "i");

	/** 指定されたタグを削除
	 * @param single 単独または開始タグ 属性無し 複数のタグは|でOR条件を指定
	 * @param open 開始タグ 属性値有り 複数のタグは|でOR条件を指定
	 * @param close 終了タグ 複数のタグは|でOR条件を指定 */
  static removeTag(str, single, open, close) {
    if (str.indexOf('<') === -1) return str;

    if (single) str = str.replace(new RegExp(`< *(${single}) */? *?>`, 'gi'), '');
    if (open) str = str.replace(new RegExp(`< *(${open}) [^>]*>`, 'gi'), '');
    if (close) str = str.replace(new RegExp(`< */ *(${close}) *>`, 'gi'), '');

    return str;
  }

  static getChapterName(line, maxLength) {
    return this._getChapterName(line, maxLength, true);
  }
	/** BOMが文字列の先頭にある場合は除去 */
  static removeBOM(str) {
    if (str && str.length > 0) {
      if (str.charCodeAt(0) === 0xFEFF) {
        return str.substring(1);
      } else {
        return str;
      }
    } else {
      return null;
    }
  }

  // Assuming _getChapterName is a private method that you would implement
  static _getChapterName(line, maxLength, reduce) {
    // Implementation of _getChapterName
    // Placeholder implementation
    return line.substring(0, maxLength);
  }
}
