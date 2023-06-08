import {addPatch} from "@webpack/patcher";
import type {Section} from "./index";

export const interceptors = new Set<(items: Section[]) => void>();

const onFail = (error) => {
    console.error("Failed to patch user settings!", error);
};

declare var importVar: (name: "interceptors") => typeof interceptors;

const patcher = (items) => {
    const interceptors = importVar("interceptors");
    
    try {
        for (const interceptor of [...interceptors]) {
            interceptor(items);
        }
    } catch (error) {
        console.error(error);
    }
};

export function addInterceptor(interceptor: (items: any[]) => void) {
    interceptors.add(interceptor);

    return () => interceptors.delete(interceptor);
}

addPatch({
    find: str => /section:[\s\w.\d]+PROFILE_CUSTOMIZATION/s.test(str),
    apply(str) {
        const variableRegex = /(\w)\s?=\s?\[\{section:[\s\w.,:]+USER_SETTINGS/m;
        const match = variableRegex.exec(str) ?? [] as unknown as RegExpExecArray;
        const matchIndex = match.index;
        const variable = match[1];

        if (!variable) return onFail("Variable couldn't be found."), str;
        const retIndex = str.indexOf(`return ${variable}}`, matchIndex);

        if (retIndex === -1) return onFail("Return Index couldn't be found."), str;

        str = str.slice(0, retIndex) + ";(" + patcher + ")(" + variable + ");" + str.slice(retIndex);

        return str;
    },
    variables: {
        get interceptors() {return interceptors;}
    }
});
