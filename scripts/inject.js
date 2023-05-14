const fs = require("fs");
const path = require("path");
const argv = require("./_argv");

const release = argv.release ?? argv.r;

if (!release) {
    console.error("❌ Please choose a discord release via --release <name> or -r <name>");
    process.exit(1);
}

const folderName = {
    stable: "Discord",
    ptb: "DiscordPTB",
    canary: "DiscordCanary",
    development: "DiscordDevelopment",
}[release];

const appData = process.platform === "win32"
    ? process.env.LOCALAPPDATA
    : process.platform === "darwin"
        ? path.join(process.env.HOME, "Library", "Application Support")
        : process.env.XDG_CONFIG_HOME
            ? process.env.XDG_CONFIG_HOME
            : path.join(process.env.HOME, ".config");

const discordPath = path.resolve(appData, folderName);

if (!fs.existsSync(discordPath)) {
    console.error(`❌ Couldn't find release channel "${release}". Please use one of ${Object.keys(folderName).join(", ")}`);
    process.exit(1);
}

console.log("✅ Found discord release folder");

const discordVersion = fs.readdirSync(discordPath)
    .filter(e => e.indexOf("app-") === 0)
    .at(-1);

if (!fs.existsSync(path.join(discordPath, discordVersion, "modules"))) {
    console.error(`❌ Corrupt ${folderName} installation detected!`);
    process.exit(1);
}

console.log(`⌛ Installing to app version ${discordVersion}`);

const resourcesPath = path.join(discordPath, discordVersion, "resources");
const buildInfo = path.join(resourcesPath, "build_info.json");

if (!fs.existsSync(buildInfo)) {
    console.error("❌ Can't find build_info.json file, discord installation too old or corrupt!");
    process.exit(1);
}

const newPath = path.join(resourcesPath, "build_info.old.json");
const patchedPath = path.join(resourcesPath, "build_info.json.js");
const preload = path.resolve(process.cwd(), "preload.js");
const main = path.resolve(process.cwd(), "main.js");

let contents = fs.readFileSync(path.resolve(__dirname, "injector.js"), "utf8");

contents = contents.replace("process.env.ULTRA_PRELOAD", JSON.stringify(preload));
contents = contents.replace("process.env.ULTRA_MAIN", JSON.stringify(main));

fs.writeFileSync(patchedPath, contents);
fs.renameSync(buildInfo, newPath);

console.log(`✅ Successfully injected ultra into ${folderName} v${discordVersion.slice(4)}`);
