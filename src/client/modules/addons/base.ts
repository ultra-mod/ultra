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
    currError: Error = null;
    addonErrors: Set<AddonError> = new Set();
    prefix: string;
    #addons: Map<string, Addon> = new Map();
    langExtension: string;

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

    #attachEvents() {
        this.on("addon-loaded", addon => {
            this.logger.info(`${addon.name} was loaded!`);
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

    #loadAddons() {
        const dirents = UltraNative.readdir(this.path);

        for (const dirent of dirents) {
            const location = path.join(this.path, dirent);
            const info = UltraNative.getDirentInfo(location);

            let addon;

            if (info.isDirectory()) {
                addon = this.#loadFolderAddon(location);
            }
            else if (path.extname(dirent) === ".zip") {
                addon = this.#loadBundledAddon(location);
            }
            else {
                this.#fail(
                    `Could not identify ${dirent}`,
                    AddonErrorCodes.INVALID_ADDON,
                    dirent
                );
                continue;
            }

            if (addon) {
                this.emit("addon-loaded", addon);
            }
        }

        this.logger.info(`Loaded all ${this.short}!`);
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
        const dirent = path.basename(location);
        const contents = UltraNative.readFile(location);

        let unzipped; try {
            unzipped = unzipSync(contents);
        } catch (error) {
            this.#fail(
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
            this.#fail(
                `Addon ${dirent} missing "config.json" file.`,
                AddonErrorCodes.MISSING_CONFIG_FILE,
                dirent
            );
            return;
        }

        let config: any; try {
            config = JSON.parse(StringUtils.fromBinary(opts.readFile("config.json")));
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

        config.path = opts.location;

        const id = (config.id || config.name).replaceAll(" ", "-").toLowerCase();
        
        if (this.#addons.has(id)) {
            this.#fail(
                `A ${this.short} with the id "${id}" already exists!`,
                AddonErrorCodes.ALREADY_EXISTS,
                id
            );
            return;
        }

        this.#addons.set(id, config);

        return config;
    }
}
