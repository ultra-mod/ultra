import Storage from "@storage";
import BaseManager, {Addon, AddonErrorCodes} from "./base";
import {StringUtils, path} from "@utilities";

const {UltraNative} = window;

export default class PluginsManager extends BaseManager {
    displayName = "PluginsManager";
    short = "plugins";
    langExtension = "js";
    states: string[] = [];
    
    constructor() {
        super();

        this.states = Storage.getPluginStates();
        this.#attachListeners();
        this.initialize();
    }

    #attachListeners() {
        this.on("addon-loaded", this.onPluginLoaded.bind(this));
    }

    runPlugin(addon: Addon) {
        const hasPreload = addon.type === "zip" ? "preload.js" in addon.contents : UltraNative.existsDirent(path.join(addon.path, "preload.js"));

        if (hasPreload) {
            let preloadContents: string; {
                if (addon.type === "zip") preloadContents = StringUtils.fromBinary(addon.contents["preload.js"]);
                else preloadContents = StringUtils.fromBinary(UltraNative.readFile(path.join(addon.path, "preload.js")));
            }

            this.compile(addon.name, path.join(addon.path, "preload.js"), preloadContents);
        }
    }

    compile(name: string, location: string, contents: string) {
        try {
            const exports = {};
            const fn = new Function(["exports", "require", "module"].join(), contents + `\n//# sourceURL=${JSON.stringify(location).slice(1, -1)}`);

            fn.call(exports, exports, this.#makeRequire(name, location.slice(0, location.lastIndexOf(path.sep))), {exports});

            return exports;
        } catch (error) {
            this.fail([`Failed to compile ${path.basename(location)}`, error], AddonErrorCodes.ERR_COMPILE, name);
        }
    }

    #makeRequire(name: string, location: string) {
        const cache = new Map();

        return (mod: string) => {
            let resolved: string;
            if (mod.indexOf("./") === 0) {
                resolved = path.join(location, mod.slice(2));
            }

            if (!path.extname(resolved)) {
                const ext = [".json", ".js"].find(ext => UltraNative.existsDirent(path.join(location, resolved + ext)));

                if (!ext) {
                    throw new Error(`Cannot find module "${mod}"`);
                }

                resolved = path.join(location, resolved + ext);
            }

            if (!UltraNative.existsDirent(resolved)) {
                throw new Error(`Cannot find module "${mod}"`);
            }

            const module = (() => {
                switch (path.extname(resolved)) {
                    case ".json": return JSON.parse(StringUtils.fromBinary(UltraNative.readFile(resolved))); 
                    case ".js": return this.compile(name, location, StringUtils.fromBinary(UltraNative.readFile(resolved)));
                    default: throw new Error(`Cannot find module "${mod}"`);
                }
            })();

            cache.set(resolved, module);

            return resolved;
        };
    }

    onPluginLoaded(addon: Addon) {
        if (this.states.includes(addon.id)) {
            this.runPlugin(addon);
        }
    }
}
