export default class LogAppender {

  static buffer = "";

  static append(log) {
    if (log == null) return;
    this.buffer += String(log);
  }

  static println(log = "") {
    if (log) this.append(log);
    console.log(this.buffer);
    this.buffer = "";
  }

  static flush() {
    if (this.buffer.length > 0) {
      console.log(this.buffer);
      this.buffer = "";
    }
  }

  static printStackTrace(e) {
    if (!e) return;
    console.error(e.stack || e.toString());
  }

  static msg(lineNum, msg, desc) {
    this.append(msg);
    this.append(` (${lineNum + 1})`);
    if (desc) {
      this.append(" : ");
      this.append(desc);
    }
  }

  static error(...args) {
    this.append("[ERROR] ");

    if (args.length === 1) {
      this.append(args[0]);
    } else if (args.length === 2) {
      this.msg(args[0], args[1]);
    } else if (args.length === 3) {
      this.msg(args[0], args[1], args[2]);
    }

    this.println(); // ここでまとめて出力
  }

  static warn(lineNum, msg, desc = null) {
    this.append("[WARN] ");
    this.msg(lineNum, msg, desc);
    this.println();
  }

  static info(lineNum, msg, desc = null) {
    this.append("[INFO] ");
    this.msg(lineNum, msg, desc);
    this.println();
  }
}
