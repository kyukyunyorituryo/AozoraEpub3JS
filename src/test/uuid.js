import { v4 as uuidv4 } from 'uuid';
const title='タイトル'
const creator='著者'
const v4options = {
    random: 
    (new TextEncoder).encode(title + '-' + creator)
   
  };
console.log(uuidv4(v4options));