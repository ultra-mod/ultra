import WebpackState from "./state";
import * as Patcher from "./patcher";
import * as API from "./api";
import * as CommonModules from "./common";
import {continueLoading} from "./pause";

export const whenReady = Patcher.whenReady;

const Webpack = {
    state: WebpackState,
    addPatch: Patcher.addPatch,
    continueLoading,
    whenReady: Patcher.whenReady,
    common: CommonModules,
    ...API,
};

export {
    WebpackState as state,
    Patcher,
    continueLoading,
    API,
    CommonModules as common
};

export default Webpack;
