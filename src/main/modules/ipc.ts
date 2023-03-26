import {ipcMain, app} from "electron";

function handleGetPath(event: Electron.IpcMainEvent, name: Parameters<typeof app.getPath>[0]) {
    event.returnValue = app.getPath(name);
}

export function registerEvents() {
    ipcMain.on("ULTRA_GET_PATH", handleGetPath);
}
