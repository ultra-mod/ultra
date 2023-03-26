import Webpack from "@webpack";
import Settings from "@settings";
import {predefine} from "@utilities";
import "./types";

window.ultra = {
    webpack: Webpack,
    settings: Settings
};

// Temporary
predefine(window, "GLOBAL_ENV", (env: typeof window.GLOBAL_ENV) => {
    env.RELEASE_CHANNEL = "staging";
    Webpack.continueLoading();
});
