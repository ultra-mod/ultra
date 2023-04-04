import {Module} from "@structs";
import {StringUtils, path} from "@utilities";

const {UltraNative} = window;

export enum Failures {
    ERR_CREATE_FOLDER,
    ADDON_ERROR
};

export enum AddonErrorCodes {
    INVALID_ADDON,
    ERR_COMPILE,
    MISSING_CONFIG_FILE,
    CORRUPT_CONFIG,
    ENTRY_POINT_MISSING
}

// TODO: Add proper addon interface
type Addon = any;

export type AddonError = {
    type: string;
    error: string | string[];
    code: AddonErrorCodes;
    name: string;
};

export default class BaseManager extends Module {
    displayName: string;
    short: string;
    path: string;
    currError: Error;
    addonErrors: Set<AddonError>;
    prefix: string;
    #addons: Map<string, Addon>;
    langExtension: string;

    constructor() {
        super();
        this.logLabel = this.short;
        this.path = path.join(UltraNative.getPath("appData"), "ultra", this.short);
        this.prefix = this.short.slice(0, -1);

        this.#sanityCheck();
    }

    #sanityCheck() {
        if (!UltraNative.existsDirent(this.path)) {
            try {
                UltraNative.createFolder(this.path);
            } catch (error) {
                this.error(`Failed to create default ${this.short}s folder:`, error);
                this.emit("failure", {
                    code: Failures.ERR_CREATE_FOLDER
                });
                this.currError = error;
            }
        }
    }

    #loadAddons() {
        const dirents = UltraNative.readdir(this.path);

        for (const dirent of dirents) {
            const location = path.join(this.path, dirent);
            const info = UltraNative.getDirentInfo(location);

            if (info.isDirectory()) {
                this.#loadFolderAddon(location);
            }
            else if (path.extname(dirent) === ".zip") {
                this.#loadBundledAddon(location);
            }
            else {
                this.#fail(
                    `Could not identify ${dirent}`,
                    AddonErrorCodes.INVALID_ADDON,
                    dirent
                );
            }
        }
    }

    
    #fail(error: any | any[], code: AddonErrorCodes, name: string) {
        this.error(...(Array.isArray(error) ? error : [error]));
        this.addonErrors.add({
            code,
            error,
            type: this.prefix,
            name
        });
        
        this.emit("failure", {
            code: Failures.ADDON_ERROR,
            addon: name,
            internalCode: code,
            error
        });
    }
    
    #loadBundledAddon(location: string) {
        
    }

    #loadFolderAddon(location: string) {
        const dirent = path.basename(location);
        const dirents = new Set(UltraNative.readdir(location));

        if (!dirents.has("config.json")) {
            this.#fail(
                `Addon ${dirent} missing "config.json" file.`,
                AddonErrorCodes.MISSING_CONFIG_FILE,
                dirent
            );
            return;
        }

        let config: any; try {
            config = JSON.parse(StringUtils.fromBinary(UltraNative.readFile(path.join(location, "config.json"))));
        } catch (error) {
            this.#fail(
                [`Addon ${dirent}'s config is corrupt!`, error],
                AddonErrorCodes.CORRUPT_CONFIG,
                dirent
            );
            return;
        }

        if (!config.main || !dirents.has(`index.${this.langExtension}`)) {
            this.#fail(
                `Addon ${dirent}'s entry point is missing. This means there's no "index.${this.langExtension}" file or it's unspecified in the config.json`,
                AddonErrorCodes.ENTRY_POINT_MISSING,
                dirent
            );
            return;
        }

        if (!config.main && dirents.has(`index.${this.langExtension}`)) {
            config.main = `index.${this.langExtension}`;
        }

        config.path = location;

        this.#addons.set(dirent.replaceAll(" ", "-"), config);

        return config;
    }

    loadFile() {

    }
}
