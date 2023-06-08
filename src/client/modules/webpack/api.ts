import {whenReady} from "./patcher";
import WebpackState from "./state";

export type ModuleFilter = (m: any, i: string, s: Function) => boolean;

export namespace Filters {
    export const byProps = (...props: string[]) => (m: any) => m && props.every(prop => m[prop] !== undefined);
}

const safeAccess = (obj: any, key: string) => {
    try {return obj[key];}
    catch {return null;}
};

export function getModule(filter: ModuleFilter, options: {deep?: boolean, all?: boolean, depth?: number} = {} as any) {
    const keys = Object.keys(WebpackState.require.c);
    const found = [];

    for (let i = 0; i < keys.length; i++) {
        const id = keys[i];
        const {exports} = WebpackState.require.c[id];
        const source = WebpackState.require.m[id];

        if (!exports || exports === window || exports === document.documentElement || exports[Symbol.toStringTag] === "DOMTokenList") continue;

        if (filter(exports, id, source)) {
            if (options.all) {
                found.push(exports);
            } else {
                return exports;
            }
        }

        if (options.deep) {
            const keys = Object.keys(exports);

            for (const key of keys) {
                if (filter(safeAccess(exports, key), id, source)) {
                    if (options.all) {
                        found.push(safeAccess(exports, key));
                    } else {
                        return safeAccess(exports, key)
                    }
                }
            }
        }
    }

    return found;
}

export function lazy<T>(filter: ModuleFilter, options: {bypass?: boolean} = {bypass: false}) {
    let cache = null;

    let _promise = whenReady.then(() => {
        cache ??= getModule(filter);
    });

    return new Proxy({}, {
        get(_, key) {
            if (key === "_promise") return _promise;
            if (!cache && !options.bypass) return null;
            if (!cache) cache = getModule(filter);
            return cache?.[key];
        },
        set(_, key, value) {
            if (!cache && !options.bypass) return null;
            if (!cache) cache = getModule(filter);
            return cache[key] = value;
        }
    }) as unknown as T;
}
