import * as API from "./modules/api";
import {contextBridge} from "electron/renderer";

contextBridge.exposeInMainWorld("UltraNative", API);

console.log("We do a little preload.");
