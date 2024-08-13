// Detector.js
import encoding from 'encoding-japanese';
import  fs from 'fs';

export default class Detector {
    static getCharset(inputStream) {
        try {
            const data = fs.readFileSync(inputStream);
            const detectedEncoding = encoding.detect(data);
            return detectedEncoding;
          } catch (err) {
            throw new Error(`Error reading file: ${err.message}`);
          }
    }
}
