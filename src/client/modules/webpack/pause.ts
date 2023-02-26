import WebpackState from "./state";

export const readySignal = new EventTarget();

export function continueLoading() {
    WebpackState.paused = false;
    readySignal.dispatchEvent(new Event("ready"));
}
