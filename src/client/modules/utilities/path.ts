export const sep = navigator.userAgent.includes("Windows") ? "\\" : "/";

export function join(...paths: string[]) {
    return paths.filter(Boolean).join(sep);
}

export function extname(dirent: string) {
    const idx = dirent.lastIndexOf(".");
    return idx > -1 ? dirent.slice(idx) : "";
}

export function basename(dirent: string) {
    const idx = dirent.lastIndexOf(sep);
    return idx > -1 ? dirent.slice(idx + 1) : dirent;
}
