import fs from "fs";
import JSZip from "jszip";

async function main() {
const fileContent = fs.readFileSync("1.zip", null).buffer;
const zip = new JSZip();
await zip.loadAsync(fileContent);
for (const fileName in zip.files) {
  const file = zip.files[fileName];
  if (!file.dir) {
    const content = await file.async('text');
   // console.log(`File: ${fileName}`);
    //console.log(`File: ${fileName}\nContent:\n${content}\n`);
    //console.log(file._data.compressedContent)
    console.log({ "FileName" : fileName , "Content" :content})
  }
 }
 //console.log(zip)
}
main();