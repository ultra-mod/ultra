import {whenReady} from "./patcher";
import WebpackState from "./state";

const exoticExports = new Set(["Z", "ZP", "default"]);
const targetTypes = new Set(["object", "function"]);

export type ModuleFilter = (m: any, i: string, s: Function) => boolean;

export namespace Filters {
    export const byProps = (...props: string[]) => (m: any) => m && props.every(prop => m[prop] !== undefined);
    export const byStore = (storeName: string) => (m: any) => m && m?._dispatchToken && m?.getName() === storeName;
}

const safeAccess = (obj: any, key: string) => {
    try {return obj[key];}
    catch {return null;}
};

export function getModule(filter: ModuleFilter, options: {deep?: boolean, all?: boolean, depth?: number} = {} as any) {
    const keys = Object.keys(WebpackState.require.c);
    const found = [];

    for (let i = 0; i < keys.length; i++) {
        const moduleId = keys[i];
        const {exports} = WebpackState.require.c[moduleId];
        const source = WebpackState.require.m[moduleId];

        if (!targetTypes.has(typeof exports) ||
            exports === window ||
            exports === document.documentElement ||
            exports[Symbol.toStringTag] === "DOMTokenList"
        ) continue;

        if (filter(exports, moduleId, source)) {
            if (options.all) {
                found.push(exports);
            } else {
                return exports;
            }
        }

        for (const id of exoticExports) {
            if (!targetTypes.has(typeof exports[id])) continue;
            if (!filter(exports[id], moduleId, source)) continue;

            if (options.all) found.push(exports[id]);
            else return exports[id];
        }

        if (options.deep) {
            const keys = Object.keys(exports);

            for (const key of keys) {
                if (filter(safeAccess(exports, key), moduleId, source)) {
                    if (options.all) {
                        found.push(safeAccess(exports, key));
                    } else {
                        return safeAccess(exports, key)
                    }
                }
            }
        }
    }

    return options.all ? found : found[0];
}

export function lazy<T>(filter: ModuleFilter, options: {bypass?: boolean} & Parameters<typeof getModule>[1] = {bypass: false}) {
    let cache = null;

    let _promise = whenReady.then(() => {
        cache ??= getModule(filter, options);
    });

    return new Proxy({}, {
        get(_, key) {
            if (key === "_promise") return _promise;
            if (!cache && !options.bypass) return null;
            if (!cache) cache = getModule(filter, options);
            return cache?.[key];
        },
        set(_, key, value) {
            if (!cache && !options.bypass) return null;
            if (!cache) cache = getModule(filter, options);
            return cache[key] = value;
        }
    }) as unknown as T;
}

export function getStore(name: string) {
    return getModule(Filters.byStore(name));
}

export function getByProps(...props: string[]) {
    return getModule(Filters.byProps(...props));
}

