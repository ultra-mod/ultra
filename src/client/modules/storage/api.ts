import Storage from "@storage";

export function get<T>(addon: string, keyOrValue?: string | T): T {
    const data = Storage.getData(addon, typeof keyOrValue === "string" ? undefined : keyOrValue);
    return typeof keyOrValue === "string" ? data?.[keyOrValue] : data;
}

export function set(addon: string, ...args: [string, any] | [any]) {
    let data = Object.assign({}, get(addon));

    if (args.length === 1) {
        data = args[0];
    } else if (args.length === 2) {
        data[args[0]] = args[1];
    }

    return Storage.setData(addon, data);;
}
