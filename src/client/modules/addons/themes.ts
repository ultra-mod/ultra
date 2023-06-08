import BaseManager from "./base";

const ThemesManager = new class ThemesManager extends BaseManager {
    displayName = "ThemesManager";
    short = "themes";
    langExtension = "css";
    
    constructor() {
        super();
    }
}

export default ThemesManager;
