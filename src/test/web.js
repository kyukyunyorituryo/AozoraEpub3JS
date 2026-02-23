/**
 * 文字を出力し、特殊文字を注記に変換
 * @param {Array} bw - 結果を追加する配列
 * @param {string} text - 出力するテキスト
 */
function printText(bw, text) {
    const chars = Array.from(text);  // 文字列を配列に変換
    for (const ch of chars) {
        // 青空特殊文字の変換
        switch (ch) {
            case '《': bw.push("※［＃始め二重山括弧、1-1-52］"); break;
            case '》': bw.push("※［＃終わり二重山括弧、1-1-53］"); break;
            case '［': bw.push("※［＃始め角括弧、1-1-46］"); break;
            case '］': bw.push("※［＃終わり角括弧、1-1-47］"); break;
            case '〔': bw.push("※［＃始め亀甲括弧、1-1-44］"); break;
            case '〕': bw.push("※［＃終わり亀甲括弧、1-1-45］"); break;
            case '｜': bw.push("※［＃縦線、1-1-35］"); break;
            case '＃': bw.push("※［＃井げた、1-1-84］"); break;
            case '※': bw.push("※［＃米印、1-2-8］"); break;
            case '\t': bw.push(' '); break;
            case '\n':
            case '\r':
                // 改行文字は無視する
                break;
            default:
                bw.push(ch);  // その他の文字はそのまま出力
        }
    }
}

// ルビを青空ルビにして出力
function printRuby(bw, ruby) {
    // rubyの子ノードをループ
    ruby.childNodes.forEach(function(childNode) {
        if (childNode.nodeType === Node.ELEMENT_NODE) {
            let element = childNode;
            switch (element.nodeName.toLowerCase()) {
                case 'rp':
                    // 'rp'タグは無視
                    break;
                case 'rt':
                    bw.push('《');
                    printText(bw, element.textContent);
                    bw.push('》');
                    break;
                case 'rb':
                    bw.push('｜');
                    printText(bw, element.textContent);
                    break;
                default:
                    console.log("ruby error");
            }
        } else if (childNode.nodeType === Node.TEXT_NODE) {
            let textNode = childNode;
            bw.push('｜');
            printText(bw, textNode.textContent);
        }
    });
}

/*
function printImage(bw, elem) {
    bw.push(`［＃画像注記：${elem.getAttribute('src')}］`);
}
*/
// 画像をキャッシュして相対パスの注記にする
function printImage(bw, img, imageOutFile = null) {
    let src = img.getAttribute("src");
    if (!src || src.length === 0) return;

    let imagePath = src;
    if (bw) {
        bw.push("［＃挿絵（");
        bw.push("images/" + imagePath);
        bw.push("）入る］\n");
    }
}

// 以下は、必要に応じて定義される補助関数

// URLをファイル名にエスケープする関数
function escapeUrlToFile(url) {
    // 必要に応じてURLを安全なファイル名に変換するロジックを実装
    return url.replace(/[\/:*?"<>|]/g, "_"); // 簡単な例: 一部の特殊文字をアンダースコアに置換
}

// ファイルキャッシュ処理を行う関数
function cacheFile(src, file, referer) {
    // 画像のダウンロード処理を実装
    // 例えば、fetch APIを使用して画像をダウンロードし、fileに保存する
}

function isBlockNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        return ["br", "div", "p", "hr", "table"].includes(tagName);
    }
    return false;
}

// Main class
class NodePrinter {
    constructor() {
        this.startElement = null;
        this.endElement = null;
        this.noHr = false;
    }

    // ノードを出力 子ノード内のテキストも出力
    printNode(bw, parent, noHr = false) {
        this.printNodeWithRange(bw, parent, null, null, noHr);
    }

    // ノードを出力 子ノード内のテキストも出力
    printNodeWithRange(bw, parent, start = null, end = null, noHr = false) {
        this.startElement = start;
        this.endElement = end;
        this.noHr = noHr;
        this._printNode(bw, parent);
    }

    // ノードを出力 再帰用
    _printNode(bw, parent) {
        const childNodes = Array.from(parent.childNodes);

        for (let node of childNodes) {
            if (this.startElement) {
                if (node === this.startElement) {
                    this.startElement = null;
                    continue;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    this._printNode(bw, node);
                }
                continue;
            }

            if (this.endElement && node === this.endElement) {
                return;
            }

            if (node.nodeType === Node.TEXT_NODE) {
                printText(bw, node.wholeText);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const elem = node;

                switch (elem.tagName.toLowerCase()) {
                    case 'br':
                        if (elem.nextSibling) bw.push('\n');
                        break;
                    case 'div':
                        if (elem.previousSibling && !isBlockNode(elem.previousSibling)) bw.push('\n');
                        this._printNode(bw, node); // 子を出力
                        if (elem.nextSibling) bw.push('\n');
                        break;
                    case 'p':
                        //if (elem.previousSibling && !isBlockNode(elem.previousSibling)) bw.push('\n');
                        this._printNode(bw, node); // 子を出力
                         if (elem.nextSibling) bw.push('\n');
                        break;
                    case 'ruby':
                        printRuby(bw, elem);
                        break;
                    case 'img':
                        printImage(bw, elem);
                        break;
                    case 'hr':
                        if (!this.noHr) {
                            bw.push("［＃区切り線］\n");
                        }
                        break;
                    case 'b':
                        bw.push("［＃ここから太字］");
                        this._printNode(bw, node); // 子を出力
                        bw.push("［＃ここで太字終わり］");
                        break;
                    case 'em':
                        bw.push("［＃丸傍点］");
                        this._printNode(bw, node); // 子を出力
                        bw.push("［＃丸傍点終わり］");
                        break;
                    case 'sup':
                        bw.push("［＃上付き小文字］");
                        this._printNode(bw, node); // 子を出力
                        bw.push("［＃上付き小文字終わり］");
                        break;
                    case 'sub':
                        bw.push("［＃下付き小文字］");
                        this._printNode(bw, node); // 子を出力
                        bw.push("［＃下付き小文字終わり］");
                        break;
                    case 'strike':
                    case 's':
                        bw.push("［＃取消線］");
                        this._printNode(bw, node); // 子を出力
                        bw.push("［＃取消線終わり］");
                        break;
                    case 'tr':
                        this._printNode(bw, node); // 子を出力
                        bw.push('\n');
                        break;
                    default:
                        this._printNode(bw, node); // 子を出力
                }
            } else {
                console.log(node.nodeType); // デバッグ用
            }
        }
    }
}

// NodePrinter.jsファイルの内容をインポートする必要はありません。
// このテストコードがNodePrinter.jsと同じファイルにあると仮定します。

function testNodePrinter() {
    // HTML文書を手動で作成
    const dom = document.createElement('div');
    dom.innerHTML = `<div>
            <p>テストテキスト1</p>
            <p><b>太字テキスト</b></p>
            <div>
                <p>テスト<sup>テキ</sup>スト2</p>
            </div>
            <ruby>漢字<rt>かんじ</rt></ruby>
            <img src="image.png" />
            <hr />
        </div>`;

    const printer = new NodePrinter();
    const bw = [];

    // ルートノードを取得してprintNodeメソッドを呼び出し
    const rootNode = dom.querySelector('div');
    printer.printNode(bw, rootNode);

    // 出力されたテキストを一つの文字列に結合
    const output = bw.join('');

    // 結果をチェック

    console.log(bw.join(''));
}

// テストを実行
testNodePrinter();
