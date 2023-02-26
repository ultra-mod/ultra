import WebpackState from "./state";
import * as Patcher from "./patcher";
import {continueLoading} from "./pause";

const Webpack = {
    state: WebpackState,
    patcher: Patcher,
    continueLoading
};

export default Webpack;
