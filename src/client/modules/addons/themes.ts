import BaseManager from "./base";

export default class ThemesManager extends BaseManager {
    displayName = "ThemesManager";
    short = "themes";
    langExtension = "css";
    
    constructor() {
        super();

        this.initialize();
    }
}
