/// <reference path="../../vendor/electron.d.ts" />

import {app, session} from "electron";
import path from "path";
import fs from "fs";

app.once("ready", () => {
    const location = path.resolve(__dirname, "..", "vendor", "RDT");
    
    if (!fs.existsSync(location)) return;

    session.defaultSession.loadExtension(path.resolve(__dirname, "..", "vendor", "RDT")).then(() => {
        console.log("ReactDevTools installed!");
    });
});
