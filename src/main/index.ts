/// <reference path="../../vendor/electron.d.ts" />

import {app} from "electron";
import {registerDevtools} from "./modules/reactdevtools";
import {registerEvents} from "./modules/ipc";

registerEvents();

app.once("ready", () => {
    registerDevtools();
});
