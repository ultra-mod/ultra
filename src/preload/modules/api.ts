/// <reference path="../../../vendor/electron.d.ts" />
import type {app} from "electron/main";
import {ipcRenderer} from "electron/renderer";
import {readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdirSync} from "fs";

export const current = __dirname;

export const getPath = (name: Parameters<typeof app.getPath>[0]) => {
    return ipcRenderer.sendSync("ULTRA_GET_PATH", name);
};

export const readFile = (path: string) => {
    return readFileSync(path);
};

export const readdir = (path: string) => {
    return readdirSync(path);
};

export const existsDirent = (path: string) => {
    return existsSync(path);
};

export const getDirentInfo = (path: string) => {
    const stats = statSync(path);

    return {
        ...stats,
        isFile() {return stats.isFile();},
        isDirectory() {return stats.isDirectory();},
        isSymLink() {return stats.isSymbolicLink();}
    };
};

export const writeFile = (path: string, data: Uint8Array) => {
    writeFileSync(path, data);
};

export const createFolder = (path: string, recursive = true) => {
    mkdirSync(path, {recursive});
};
