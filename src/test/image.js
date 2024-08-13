import jimp from 'jimp';
async function main() {
    // ファイル読み込み
    const image = await jimp.read('');
    // 画像サイズを取得
    console.log('width:'+image.bitmap.width);
    console.log('height:'+image.bitmap.height);
}
main();