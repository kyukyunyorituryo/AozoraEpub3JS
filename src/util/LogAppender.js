export default class LogAppender {
  static textArea = null;
/*
  static setTextArea(textArea) {
    this.textArea = textArea;
  }
*/
  static println(log) {
    if(log)this.append(log);
    this.append("\n");
  }

  static append(log) {
    /*
    if (this.textArea) {
      this.textArea.value += log;
      this.textArea.scrollTop = this.textArea.scrollHeight;
    }
      */
    process.stdout.write(log);
  }

  static printStackTrace(e) {
    e.stack.split("\n").forEach(ste => {
      this.append(ste);
      this.append("\n");
    });
  }

  static msg(lineNum, msg, desc) {
    this.append(msg);
    this.append(` (${lineNum + 1})`);
    if (desc) {
      this.append(" : ");
      this.append(desc);
    }
    this.append("\n");
  }



  static error(...args) {
    if(args.length==1){
      this.append("[ERROR] ");
      this.append(args[0]);
      this.append("\n");
    }
    if(args.length==2){
      this.append("[ERROR] ");
      this.msg(args[0], args[1], null);
    }
    if(args.length==3){
      this.append("[ERROR] ");
      this.msg(args[0], args[1], args[2])
    }
  }

  static warn(lineNum, msg, desc = null) {
    this.append('[WARN] ');
    this.msg(lineNum, msg, desc);
}

static info(lineNum, msg, desc = null) {
    this.append('[INFO] ');
    this.msg(lineNum, msg, desc);
}
}
