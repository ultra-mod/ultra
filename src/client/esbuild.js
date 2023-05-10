const {readFile, writeFile} = require("fs/promises");
const path = require("path");
const sass = require("sass");

module.exports = {
    input: "./index.ts",
    type: "browser",
    plugins: [
        {
            name: "Sass Plugin",
            setup(build) {
                const contents = [];

                build.onEnd(async () => {
                    const location = path.resolve(process.cwd(), "dist", "style.css");
                    await writeFile(location, contents.join("\n"));
                    while (contents.length) contents.pop();
                });

                // build.onResolve({filter: /\.s[ac]ss$/}, async args => (console.log(args) || {
                //     path: (await build.resolve(args.path, {kind: "import-statement"})).path,
                //     namespace: "sass-file"
                // }));

                build.onLoad({filter: /\.s[ac]ss$/}, async args => {
                    const content = await readFile(args.path, "utf8");
                    contents.push(`/* ${path.basename(args.path)} */`, (await sass.compileStringAsync(content)).css);

                    return {
                        contents: "export {}",
                        loader: "js"
                    }
                });
            }
        }
    ]
};
