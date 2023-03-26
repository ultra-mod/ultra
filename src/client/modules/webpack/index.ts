import WebpackState from "./state";
import * as Patcher from "./patcher";
import * as API from "./api";
import {continueLoading} from "./pause";

const Webpack = {
    state: WebpackState,
    patcher: Patcher,
    continueLoading,
    api: API
};

export default Webpack;
