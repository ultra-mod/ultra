module.exports = require("./build_info.old.json");

const ultraMain = process.env.ULTRA_MAIN;
const ultraPreload = process.env.ULTRA_PRELOAD;

queueMicrotask(() => {
    require(ultraMain);

    const electron = require("electron");

    electron.ipcMain.on("ULTRA_GET_PRELOAD", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        event.returnValue = win?.__originalPreload ?? "NOT_FOUND";
    });

    class BrowserWindow extends electron.BrowserWindow {
        constructor(options) {
            const originalPreload = options.webPreferences.preload;
            options.webPreferences.preload = ultraPreload;

            super(...arguments);
            this.__originalPreload = originalPreload;

        }
    }
    
    const electronPath = require.resolve("electron");
    delete require.cache[electronPath].exports;
    require.cache[electronPath].exports = {
        ...electron,
        BrowserWindow
    };
    
    require(ultraMain);
});
