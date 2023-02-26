import {WEBPACK_CHUNK_NAME} from "@constants";
import {StringUtils, predefine} from "@utilities";
import WebpackState from "./state";
import {readySignal} from "./pause";

export enum PatchType {
    Regex,
    Factory
}

export type BasePatch = {
    _ran?: boolean,
    type: PatchType,
    once?: boolean,
    variables?: {
        [key: string]: () => any
    }
};

export type RegexPatch = BasePatch & {
    type: PatchType.Regex,
    regex: RegExp,
    groups?: boolean,
    replacements?: string[],
    replace?: string
};

export type FactoryPatch = BasePatch & {
    type: PatchType.Factory,
    predicate(factory: string): boolean;
    apply(factory: string): string;
};

export type Patch = RegexPatch | FactoryPatch;

export const patches = new Set<Patch>();

export let originalPush = (module: any) => {throw new Error("Something went fatally wrong.");}

let registry = {};

Object.defineProperty(window, "$$ultra_registry", {value: registry});

export function addPatch(patch: Patch) {
    // TODO: Implement this
    // if (!WebpackState.loading) console.warn("Regex patch was applied late, might not work as good.");

    patches.add(patch);
}

namespace Patcher {
    function collectPatches(moduleFactory: string) {
        const found = [] as Patch[];
    
        for (const patch of Array.from(patches)) {
            if (patch.once && patch._ran) continue;

            if (patch.once) patch._ran = true;

            if (patch.type === PatchType.Regex) {
                const matches = patch.regex.test(moduleFactory);
    
                if (matches) {
                    found.push(patch);
                }
            } else if (patch.type === PatchType.Factory) {
                if (patch.predicate(moduleFactory)) {
                    found.push(patch);
                }
            }
        }
    
        return found;
    }
    
    export function applyRegexPatch(patch: RegexPatch, moduleFactory: string) {
        const {regex} = patch;
        if (patch.groups && patch.replacements) {
            const replacements = patch.replacements;

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
        } else {
            moduleFactory = moduleFactory.replace(patch.regex, patch.replace);
        }

        return moduleFactory;
    }

    export function applyFactoryPatch(patch: FactoryPatch, moduleFactory: string) {
        return patch.apply(moduleFactory);
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
                    if (patch.type === PatchType.Regex) {
                        string = applyRegexPatch(patch, string);
                    } else if (patch.type === PatchType.Factory) {
                        string = applyFactoryPatch(patch, string);
                    }

                    if (patch.variables) {
                        Object.assign(variables, patch.variables);
                    }
                }

                function importVar(name) {
                    return (<any>window).$$ultra_registry[id][name]();
                }

                registry[id] = variables;

                try {
                    modules[id] = window.eval(`{const id = ${id}; const importVar = ${importVar}; \n` + string + `}\n//# sourceURL=${id}.patched.js`);
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
    throw new Error("Seems like ultra has started too early.");
} else {
    predefine(window, WEBPACK_CHUNK_NAME, handleGlobal);
}
