import Logger from "@logger"

type StandardListener = (...data: any[]) => void;

export default class Module {
    logger: Logger;
    logLabel: string;
    listeners: {
        [event: string]: Set<Function>
    };

    constructor() {
        this.logger = new Logger("ultra:" + this.logLabel ?? this.constructor.name);
    }

    error(...message: any[]) {return this.logger.error.apply(this.logger, message);}
    log(...message: any[]) {return this.logger.log.apply(this.logger, message);}
    info(...message: any[]) {return this.logger.info.apply(this.logger, message);}
    debug(...message: any[]) {return this.logger.debug.apply(this.logger, message);}
    warn(...message: any[]) {return this.logger.warn.apply(this.logger, message);}

    on(event: string, listener: StandardListener) {
        this.listeners[event] ??= new Set;

        this.listeners[event].add(listener);
    }

    off(event: string, listener: StandardListener) {
        return this.listeners[event]?.delete(listener);
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]?.size) return;

        const listeners = Array.from(this.listeners[event]);

        for (const listener of listeners) {
            listener(...args);
        }
    }
}
