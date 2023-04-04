const textConvert = new TextDecoder();
const bufferConvert = new TextEncoder();

const StringUtils = {
    replaceByIndex: (str: string, start: number, len: number, rep: string) => str.slice(0, start) + rep + str.slice(start + len),
    fromBinary: (buf: Buffer | Uint8Array) => textConvert.decode(buf),
    toBinary: (string: string) => bufferConvert.encode(string),
};

export default StringUtils;
