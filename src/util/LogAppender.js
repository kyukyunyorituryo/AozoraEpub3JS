export default class LogAppender {
  static textArea = null;

  static setTextArea(textArea) {
    this.textArea = textArea;
  }

  static println(log) {
    this.append(log);
    this.append("\n");
  }

  static println() {
    this.append("\n");
  }

  static append(log) {
    if (this.textArea) {
      this.textArea.value += log;
      this.textArea.scrollTop = this.textArea.scrollHeight;
    }
    console.log(log);
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

  static error(msg) {
    this.append("[ERROR] ");
    this.append(msg);
    this.append("\n");
  }

  static error(lineNum, msg, desc) {
    this.append("[ERROR] ");
    this.msg(lineNum, msg, desc);
  }

  static error(lineNum, msg) {
    this.append("[ERROR] ");
    this.msg(lineNum, msg, null);
  }

  static warn(lineNum, msg, desc) {
    this.append("[WARN] ");
    this.msg(lineNum, msg, desc);
  }

  static warn(lineNum, msg) {
    this.append("[WARN] ");
    this.msg(lineNum, msg, null);
  }

  static info(lineNum, msg, desc) {
    this.append("[INFO] ");
    this.msg(lineNum, msg, desc);
  }

  static info(lineNum, msg) {
    this.append("[INFO] ");
    this.msg(lineNum, msg, null);
  }
}
