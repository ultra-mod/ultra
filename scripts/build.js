const {build, context} = require("esbuild");
const {resolve} = require("node:path");

const argv = require("./_argv");

const {i: name, w: watch = false} = argv;

if (name == null || watch == null) {
    throw `Missing arguments.`;
}

const runBuild = name => {
    const options = require(resolve("./src", name, "esbuild"));

    context({
        entryPoints: [resolve("./src", name, options.input)],
        bundle: true,
        platform: options.type ?? "node",
        format: options.type === "browser" ? "iife" : "cjs",
        outfile: resolve("./dist", name + ".js"),
        tsconfig: resolve("./src", name, "tsconfig.json"),
        external: ["electron"],
        target: "esNext",
        write: true,
        plugins: [
            ...(options.plugins ?? []),
            {
                name: "Console logging plugin",
                setup(build) {
                    let start = Date.now();
                    build.onStart(() => {
                        start = Date.now();
                    });

                    build.onEnd(() => {
                        console.log(`Rebuild ${name} in ${(Date.now() - start).toFixed(0)}ms`);
                    });
                }
            }
        ].filter(Boolean),
        // ...(options.plugins && {plugins: options.plugins}),
        treeShaking: true,
    }).then(ctx => {
        if (!watch) queueMicrotask(() => ctx.dispose());
        return ctx.watch();
    });
}

if (Array.isArray(name)) {
    name
        .filter(Boolean)
        .forEach(runBuild);
    
    if (watch) {
        console.log(`Watching ${name.join(", ")}`);
    }
} else runBuild(name);

