import Webpack from "@webpack";
import Settings from "@settings";
import * as utilities from "@utilities";
import ThemesManager from "./modules/addons/themes";
import PluginsManager from "./modules/addons/plugins";
import * as storage from "@storage/api";
import * as apis from "./modules/apis";
import "./types";

window.ultra = {
    webpack: Webpack,
    settings: Settings,
    utilities: utilities,
    storage,
    apis,
    managers: {
        themes: ThemesManager,
        plugins: PluginsManager
    }
};
