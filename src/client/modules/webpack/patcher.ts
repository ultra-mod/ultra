import {WEBPACK_CHUNK_NAME} from "@constants";
import {StringUtils, predefine} from "@utilities";
import WebpackState from "./state";
import {readySignal} from "./pause";
import {default as LoggerModule} from "@logger";

export type BasePatch = {
    _ran?: boolean,
    once?: boolean,
    find?: (substring: string, ...args: any[]) => boolean,
    match?: RegExp,
    variables?: {
        [key: string]: () => any
    }
};

export type BasicPatch = BasePatch & {
    regex?: RegExp,
    replacements?: string[],
    apply?(str: string): string;
    replace?: string | ((substring: string, ...args: any[]) => string);
}

export type MultiPatch = BasePatch & {
    patches: BasicPatch[]
}

export type Patch = MultiPatch | BasicPatch;

export const patches = new Set<Patch>();

export let originalPush = (module: any) => {throw new Error("Something went fatally wrong.");}

const Logger = new LoggerModule("webpack");

let registry = {};

Object.defineProperty(window, "$$ultra_registry", {value: registry});

export function addPatch(patch: Patch) {
    // TODO: Implement this
    // if (!WebpackState.loading) console.warn("Regex patch was applied late, might not work as good.");

    patches.add(patch);
}

export const whenReady = new Promise(res => {
    addPatch({
        match: /"UserStore"/,
        regex: /"UserStore"[\s\S]+?CONNECTION_OPEN:function\([\w,]+\)\{/,
        replace: `$&importVar("ready").ready();`,
        variables: {
            ready: () => ({ready: res})
        }
    });
});

namespace Patcher {
    function collectPatches(moduleFactory: string, patchesList = patches) {
        const found = [] as Patch[];
    
        for (const patch of Array.from(patchesList)) {
            if (patch.once && patch._ran) continue;

            if (patch.once) patch._ran = true;

            if ("patches" in patch) {
                const matches = patch.match
                    ? patch.match.test(moduleFactory)
                    : patch.find
                        ? patch.find(moduleFactory)
                        : false;
                
                if (matches) {
                    found.push(...patch.patches);
                }
            } else if ("match" in patch || "regex" in patch) {
                const matches = (patch.match ?? patch.regex).test(moduleFactory);
    
                if (matches) {
                    found.push(patch);
                }
            } else if ("find" in patch) {
                if (patch.find(moduleFactory)) {
                    found.push(patch);
                }
            } else {
                Logger.warn("The following can't be predicated:", patch);
            }
        }
    
        return found;
    }
    
    export function applyPatch(patch: BasicPatch, moduleFactory: string) {
        const {regex} = patch;
        if ("replacements" in patch) {
            const replacements = patch.replacements;

            if (!regex.test(moduleFactory)) {
                console.error("Regex did not match for", patch);
                return moduleFactory;
            }

            const match = regex.exec(moduleFactory) ?? [] as unknown as RegExpExecArray;
            const startIndex = match.index;
            const [full, ...groups] = match;
            
            if (!match) return console.error("Regex did not match."), moduleFactory;
            if (groups.length > replacements.length) return console.error("There's more groups than replacements."), moduleFactory;

            // Reverse it so we don't mess up the start index.
            groups.reverse();
            replacements.reverse();

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                const index = startIndex + full.indexOf(group);

                moduleFactory = StringUtils.replaceByIndex(moduleFactory, index, group.length, replacements[i]);
            }
        } else if ("apply" in patch) {
            moduleFactory = patch.apply(moduleFactory);
        } else if ("replace" in patch) {
            moduleFactory = moduleFactory.replace(patch.regex, patch.replace as string);
        } else {
            Logger.warn(`The following patch could not be identified:`, patch);
        }

        return moduleFactory;
    }

    export function applyPatches(chunk: any) {
        const [, modules] = chunk;
        const ids = Object.keys(modules);
    
        for (const id of ids) {
            const module = modules[id];
            let string = module.toString();
    
            const patches = collectPatches(string);
    
            if (patches.length) {
                let variables = {};
                for (const patch of patches) {

                    string = applyPatch(patch as BasicPatch, string);

                    if (patch.variables) {
                        for (const variable in patch.variables) {
                            const desc = Object.getOwnPropertyDescriptor(patch.variables, variable);

                            if (desc.get) {
                                variables[variable] = () => desc.get();
                            } else {
                                variables[variable] = patch.variables[variable];
                            }
                        }
                    }
                }

                function importVar(name) {
                    return (<any>window).$$ultra_registry[id][name]();
                }

                registry[id] = variables;

                try {
                    modules[id] = window.eval(`{const id = ${id}; const importVar = ${importVar}; \n${string}}\n//# sourceURL=${id}.patched.js`);
                } catch (error) {
                    console.error("Failed to apply patch!", error);
                }
            }
        }
    }
    
    export function handlePush(chunk: any) {
        if (WebpackState.paused) {
            readySignal.addEventListener("ready", () => {
                applyPatches(chunk);
    
                originalPush.apply(this, arguments);
            }, {once: true});
        } else {
            applyPatches(chunk);
    
            return originalPush.apply(this, arguments);
        }
    }
}


function handleGlobal(webpackCache: any) {
    predefine(webpackCache, "push", () => {
        webpackCache.push([[Symbol()], {}, require => {
            WebpackState.require = require;

            require.d = (target: any, exports: any) => {
                for (const key in exports) {
                    if (!exports[key] || target[key]) continue;

                    Object.defineProperty(target, key, {
                        get: () => exports[key](),
                        set: v => {exports[key] = () => v;},
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        }]);

        originalPush = webpackCache.push;
        webpackCache.push = Patcher.handlePush;

        webpackCache.pop();
    });
}

if (WEBPACK_CHUNK_NAME in window) {
    throw new Error("Seems like ultra has started too late.");
} else {
    predefine(window, WEBPACK_CHUNK_NAME, handleGlobal);
}
