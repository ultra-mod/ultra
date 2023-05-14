# Ultra
# Requirements
* pnpm (`npm i -g pnpm`)
# How to setup
* Download ReactDevTools & extract into a `RDT` folder inside the `vendor` folder from https://github.com/mondaychen/react/raw/017f120369d80a21c0e122106bd7ca1faa48b8ee/packages/react-devtools-extensions/ReactDevTools.zip
* This can be used as kernel package (running ontop of other mods) or standalone.
# Building from source
* Meet all [requirements](#requirements)
* Run `pnpm build`
# Local development
* Meet all [requirements](#requirements)
* Run `pnpm dev`
# Standalone installation
* Make sure to meet all [requirements](#requirements)
* Run the snippet from below.
```ps
pnpm inject --release <stable|canary|development>
```
Hint: There'a also a shortcut for `--release` which is `-r`.
