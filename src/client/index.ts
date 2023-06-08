import Webpack from "@webpack";
import ThemesManager from "./modules/addons/themes";
import PluginsManager from "./modules/addons/plugins";
import {StringUtils, path} from "@utilities";

import "@settings/core";
import "./global";

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



ThemesManager.initialize();
PluginsManager.initialize();

Webpack.continueLoading();
