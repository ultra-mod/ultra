import BaseManager from "./base";

export default class PluginsManager extends BaseManager {
    displayName = "PluginsManager";
    short = "plugins";
    langExtension = "js";
    
    constructor() {
        super();

        this.initialize();
    }
}
