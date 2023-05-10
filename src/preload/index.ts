import * as API from "./modules/api";
import {contextBridge} from "electron/renderer";

contextBridge.exposeInMainWorld("UltraNative", API);

window.require = require;
console.log("We do a little preload.");
