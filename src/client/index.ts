import Webpack from "@webpack";
import Settings from "@settings";
import {StringUtils, predefine, path} from "@utilities";
import * as utilities from "@utilities";
import "./types";
import ThemesManager from "./modules/addons/themes";
import PluginsManager from "./modules/addons/plugins";
import "@settings/core";

{
    const {UltraNative} = window;
    const location = path.join(UltraNative.current, "style.css");

    if (UltraNative.existsDirent(location)) {
        const style = document.createElement("style");
        style.textContent = StringUtils.fromBinary(UltraNative.readFile(location));
        style.id = "ultra-styles";
        
        document.addEventListener("DOMContentLoaded", () => {
            document.head.appendChild(style);
        }, {once: true});
    }
}

window.ultra = {
    webpack: Webpack,
    settings: Settings,
    utilities: utilities,
    managers: {
        themes: new ThemesManager(),
        plugins: new PluginsManager()
    }
};

window.ultra.managers.plugins.initialize();
window.ultra.managers.themes.initialize();

Webpack.continueLoading();
