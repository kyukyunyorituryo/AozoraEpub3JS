import fs from "fs";
import unrar from "node-unrar-js";

async function main() {
  // Read the archive file into a typedArray
  const buf = Uint8Array.from(fs.readFileSync("a.rar")).buffer;
  const extractor = await unrar.createExtractorFromData({ data: buf });

  const list = extractor.getFileList();
  const listArcHeader = list.arcHeader; // archive header
  const fileHeaders = [...list.fileHeaders]; // load the file headers

  const extracted = extractor.extract({ files: ["1.txt"] });
  // extracted.arcHeader  : archive header
  const files = [...extracted.files]; //load the files
  files[0].fileHeader; // file header
  files[0].extraction; // Uint8Array content, createExtractorFromData only
  console.log(files)
  const text = new TextDecoder().decode(files[0].extraction);
  console.log(text)
}
main();