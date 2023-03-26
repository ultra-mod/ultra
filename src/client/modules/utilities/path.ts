export const sep = navigator.userAgent.includes("Windows") ? "\\" : "/";

export function join(...paths: string[]) {
    return paths.filter(Boolean).join(sep);
}
