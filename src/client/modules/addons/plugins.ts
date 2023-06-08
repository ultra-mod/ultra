import Storage from "@storage";
import BaseManager, {Addon, AddonErrorCodes} from "./base";
import {StringUtils, path} from "@utilities";

const {UltraNative} = window;

const PluginManager = new class PluginsManager extends BaseManager {
    displayName = "PluginsManager";
    short = "plugins";
    langExtension = "js";
    states: string[] = [];
    
    constructor() {
        super();

        this.states = Storage.getPluginStates();
        this.#attachListeners();
    }

    #attachListeners() {
        this.on("addon-loaded", this.onPluginLoaded.bind(this));
    }

    runPlugin(addon: Addon) {
        let contents: string; {
            if (addon.type === "zip") contents = StringUtils.fromBinary(this.getZipPath(addon.contents, addon.main));
            else contents = StringUtils.fromBinary(UltraNative.readFile(path.join(addon.path, addon.main)));
        }

        addon.instance = this.compile(addon.name, path.join(addon.path, addon.main), contents);

        if (addon.settings) {
            const location = path.join(addon.path, addon.settings);
            const isFile = UltraNative.existsDirent(location);

            if (isFile) {
                addon.settings = this.compile(addon.name, location, StringUtils.fromBinary(UltraNative.readFile(location)));
            }
        }
    }

    compile(name: string, location: string, contents: string) {
        try {
            const module = {exports: {}};
            const fn = new Function(["exports", "require", "module"].join(), contents + `\n//# sourceURL=${JSON.stringify(location).slice(1, -1)}`);

            fn.call(module.exports, module.exports, this.#makeRequire(name, location.slice(0, location.lastIndexOf(path.sep))), module);

            return module.exports;
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
                const ext = [".json", ".js"].find(ext => UltraNative.existsDirent(resolved + ext));

                if (!ext) {
                    throw new Error(`Cannot find module "${mod}"`);
                }

                resolved = resolved + ext;
            }

            if (!UltraNative.existsDirent(resolved)) {
                throw new Error(`Cannot find module "${mod}"`);
            }

            if (cache.has(resolved)) return cache.get(resolved);

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

export default PluginManager;
