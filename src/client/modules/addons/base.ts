import {Logger, Module} from "@structs";
import {path} from "@utilities";

const {UltraNative} = window;

export enum Failures {
    ERR_CREATE_FOLDER
};

export default class BaseManager extends Module {
    displayName: string;
    short: string;
    path: string;
    currError: Error;

    constructor() {
        super();
        this.logLabel = this.short;
        this.path = path.join(UltraNative.getPath("appData"), "ultra", this.short);

        this.#sanityCheck();
    }

    #sanityCheck() {
        if (!UltraNative.existsDirent(this.path)) {
            try {
                UltraNative.createFolder(this.path);
            } catch (error) {
                this.error(`Failed to create default ${this.short}s folder:`, error);
                this.emit("failure", Failures.ERR_CREATE_FOLDER);
            }
        }
    }

    loadFile() {

    }
}
