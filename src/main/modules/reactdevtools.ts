import {session} from "electron";
import path from "path";
import fs from "fs";

export function registerDevtools() {
    const location = path.resolve(__dirname, "..", "vendor", "RDT");
    
    if (!fs.existsSync(location)) return;

    session.defaultSession.loadExtension(path.resolve(__dirname, "..", "vendor", "RDT")).then(() => {
        console.log("ReactDevTools installed!");
    });
}
