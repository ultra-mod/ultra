module.exports = Object.fromEntries(
    process.argv.slice(2).reduce((args, arg) => {
        if (arg.indexOf("-") !== 0 && args.length > 0) {
            arg.includes(",") && (arg = arg.split(","));
            args[args.length - 1][1] = arg;
        } else {
            while (arg.indexOf("-") === 0) arg = arg.slice(1);
            args.push([arg, true]);
        }
    
        return args;
    }, [])
);
