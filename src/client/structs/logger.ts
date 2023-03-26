export default class Logger {
    foreColor = "#0288D1";
    backColor: "rgba(2, 136, 209, .15)";

    constructor(public name: string) {};

    defaultLog(method: Exclude<keyof typeof console, "Console">, message: any[]) {
        console[method].call(null, `%c[${this.name}]%c`, `color: ${this.foreColor}; background-color: ${this.backColor}; border-radius: 4px;`, "", ...message);
    }

    log(...message: any[]) {this.defaultLog("log", message);}
    error(...message: any[]) {this.defaultLog("error", message);}
    warn(...message: any[]) {this.defaultLog("warn", message);}
    info(...message: any[]) {this.defaultLog("info", message);}
    debug(...message: any[]) {this.defaultLog("debug", message);}
}
