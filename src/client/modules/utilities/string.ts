const StringUtils = {
    replaceByIndex: (str: string, start: number, len: number, rep: string) => str.slice(0, start) + rep + str.slice(start + len)
};

export default StringUtils;
