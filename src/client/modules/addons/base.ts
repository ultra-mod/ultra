import Storage from "@storage";
import {Module} from "@structs";
import {StringUtils, path} from "@utilities";
import {unzipSync} from "fflate";

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
    ENTRY_POINT_MISSING,
    CORRUPT_ZIP,
    ALREADY_EXISTS
}

// TODO: Add proper addon interface
export type Addon = any;

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
    currError: Error = null;
    addonErrors: Set<AddonError> = new Set();
    prefix: string;
    addons: Map<string, Addon> = new Map();
    langExtension: string;
    states: string[];

    initialize() {
        this.logLabel = this.short;
        this.path = path.join(UltraNative.getPath("appData"), "ultra", this.short);
        this.prefix = this.short.slice(0, -1);
        this.#sanityCheck();
        this.#attachEvents();

        if (!this.currError) {
            this.#loadAddons();
        }
    }

    // Stubs
    stop(id: string) {}
    start(id: string) {}

    isEnabled(id: string) {return this.states.includes(id);}

    enable(id: string) {
        const data = Storage.data[this.short];

        if (data.includes(id)) throw "Addon already enabled.";
        if (!this.addons.has(id)) throw "Addon doesn't exist.";

        data.push(id);
        Storage.writeData(this.short);
        this.states = data;

        this.emit("addon-state-change", id);
    }

    disable(id: string) {
        const data = Storage.data[this.short];

        if (!data.includes(id)) throw "Addon already disabled.";
        if (!this.addons.has(id)) throw "Addon doesn't exist.";

        data.splice(data.indexOf(id), 1);
        Storage.writeData(this.short);
        this.states = data;

        this.emit("addon-state-change", id);
    }

    #attachEvents() {
        this.on("addon-loaded", addon => {
            this.logger.info(`${addon.name} was loaded!`);
        });

        this.on("addon-state-change", id => {
            const name = this.addons.get(id)?.name;

            if (this.isEnabled(id)) {
                this.start(id);
                this.logger.info(`${name} was enabled!`);
            } else {
                this.stop(id);
                this.logger.info(`${name} was disabled!`);
            }
        });
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

    getZipPath(zip: any, path: string) {
        if (path.includes("../")) throw `Not allowed to access parent`;
        if (path.indexOf("./") === 0) path = path.slice(2);

        return path.split(/\\|\//).reduce((curr, piece) => curr?.[piece], zip);
    }

    #loadAddons() {
        const dirents = UltraNative.readdir(this.path);

        for (const dirent of dirents) {
            // Skip dot files/folders (.git etc.)
            if (dirent.indexOf(".") === 0) continue;

            const location = path.join(this.path, dirent);
            
            this.loadAddon(location, dirent);
        }

        this.logger.info(`Loaded all ${this.short}!`);
    }

    loadAddon(location: string, dirent: string, showToast: boolean = true) {
        const info = UltraNative.getDirentInfo(location);

        let addon: Addon;

        if (info.isDirectory()) {
            addon = this.#loadFolderAddon(location);
        }
        else if (path.extname(dirent) === ".zip") {
            addon = this.#loadBundledAddon(location);
        }
        else {
            return; // Skip them for now.
            // TODO: Make this show a warning in client / a setting to ignore
            this.fail(
                `Could not identify ${dirent}`,
                AddonErrorCodes.INVALID_ADDON,
                dirent
            );
            return;
        }

        if (addon) {
            this.emit("addon-loaded", addon, showToast);
        }

        return addon;
    }

    unloadAddon(id: string, showToast: boolean) {
        if (!this.addons.has(id)) throw new Error(`No such addon "${id}"`);

        const addon = this.addons.get(id);
        this.emit("addon-unloaded", addon, showToast);

        this.addons.delete(id);
    }

    reloadAddon(id: string) {
        if (!this.addons.has(id)) throw new Error(`No such addon "${id}"`);
        const addon = this.addons.get(id);

        this.unloadAddon(addon.path, false);
        const success = !!this.loadAddon(addon.path, path.basename(addon.path), false);
        if (success) this.emit("addon-reloaded", addon.name);
    }
    
    fail(error: any | any[], code: AddonErrorCodes, name: string) {
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
        const dirent = path.basename(location);
        const contents = UltraNative.readFile(location);

        let unzipped; try {
            unzipped = unzipSync(contents);
        } catch (error) {
            this.fail(
                `Addon ${dirent} is a corrupted zip!`,
                AddonErrorCodes.CORRUPT_ZIP,
                dirent
            );
            return;
        }

        const config = this.#analyzeAddon(
            dirent,
            new Set(Object.keys(unzipped)),
            {
                location,
                readFile: (file: string) => unzipped[file]
            }
        );

        if (config) {
            config.type = "zip";
            config.contents = unzipped;
        }

        return config;
    }

    #loadFolderAddon(location: string) {
        return this.#analyzeAddon(
            path.basename(location),
            new Set(UltraNative.readdir(location)),
            {
                location,
                readFile: (file: string) => UltraNative.readFile(path.join(location, file))
            }
        );
    }

    #analyzeAddon(dirent: string, dirents: Set<string>, opts: {location: string, readFile: Function} = {} as any) {
        if (!dirents.has("config.json")) {
            this.fail(
                `Addon ${dirent} missing "config.json" file.`,
                AddonErrorCodes.MISSING_CONFIG_FILE,
                dirent
            );
            return;
        }

        let config: any; try {
            config = JSON.parse(StringUtils.fromBinary(opts.readFile("config.json")));
        } catch (error) {
            this.fail(
                [`Addon ${dirent}'s config is corrupt!`, error],
                AddonErrorCodes.CORRUPT_CONFIG,
                dirent
            );
            return;
        }

        if (!config.main || !dirents.has(`index.${this.langExtension}`)) {
            this.fail(
                `Addon ${dirent}'s entry point is missing. This means there's no "index.${this.langExtension}" file or it's unspecified in the config.json`,
                AddonErrorCodes.ENTRY_POINT_MISSING,
                dirent
            );
            return;
        }

        if (!config.main && dirents.has(`index.${this.langExtension}`)) {
            config.main = `index.${this.langExtension}`;
        }

        config.path = opts.location;

        const id = (config.id || config.name).replaceAll(" ", "-").toLowerCase();
        
        if (this.addons.has(id)) {
            this.fail(
                `A ${this.short} with the id "${id}" already exists!`,
                AddonErrorCodes.ALREADY_EXISTS,
                id
            );
            return;
        }

        this.addons.set(id, config);

        return config;
    }
}
