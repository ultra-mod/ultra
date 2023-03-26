import WebpackState from "./state";

const safeAccess = (obj: any, key: string) => {
    try {return obj[key];}
    catch {return null;}
};

export function getModule(filter: (m: any, i: string, s: Function) => boolean, options: {deep?: boolean, all?: boolean, depth?: number} = {} as any) {
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
