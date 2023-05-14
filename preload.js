const {webFrame, ipcRenderer} = require("electron");
const fs = require("fs");
const path = require("path");

require("./dist/preload");

const location = path.resolve(__dirname, "./dist/client.js");
let script = fs.readFileSync(location, "utf8");

script += `\n//# sourceURL=${location}`;

webFrame.top.executeJavaScript(script);

if (Object.keys(require.cache).indexOf("kernel.asar") === -1) {
    require(ipcRenderer.sendSync("ULTRA_GET_PRELOAD"));
}
