import Webpack from "@webpack";
import Settings from "@settings";
import {predefine} from "@utilities";
import "./types";
import ThemesManager from "./modules/addons/themes";
import PluginsManager from "./modules/addons/plugins";

window.ultra = {
    webpack: Webpack,
    settings: Settings,
    managers: {
        themes: new ThemesManager(),
        plugins: new PluginsManager()
    }
};

// Temporary
predefine(window, "GLOBAL_ENV", (env: typeof window.GLOBAL_ENV) => {
    env.RELEASE_CHANNEL = "staging";
    Webpack.continueLoading();
});
