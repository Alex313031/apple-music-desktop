# Apple Music Desktop &nbsp;<img src="./Logo.png" width="48">

An [Electron](https://www.electronjs.org/) app that provides a native Apple Music experience for Linux & Windows

## About this fork

Fork of [Alex313031/apple-music-desktop](https://github.com/Alex313031/apple-music-desktop) with a number of bug fixes and security hardening on top of upstream 2.3.0, submitted upstream as [PR #28](https://github.com/Alex313031/apple-music-desktop/pull/28). The main changes:

* Fixed a renderer freeze when a video element is present on the page
* Fixed a startup crash caused by malformed `windowDetails` in config.json
* App no longer hangs forever if Widevine fails to initialize
* `contextIsolation` + sandbox enabled for all windows loading remote content, `@electron/remote` removed
* Window size is remembered along with position
* Assorted cleanup: deduplicated URL/user agent logic, fixed miniplayer maximize check, listener leak on site switch, dead code removal

If the PR is merged upstream this fork will track upstream again.

It has an "About" Window that lists the App Version, [Electron](https://www.electronjs.org/), [Chromium](https://www.chromium.org/), [Node](https://nodejs.org/), and [V8](https://v8.dev/) versions for the given Electron version in the package.json.

It has many menu items, adding on top of the default ones, and a tray icon which you can use to focus the app or minimize it to the tray.

## Screenshot
![Screenshot](assets/screenshot.png)

## Installation

See the [Releases](https://github.com/Alex313031/apple-music-desktop/releases).

## Building

Requires Node.js 18 or later (the included `.nvmrc` pins Node 20). It is recommended to use [nvm](https://github.com/nvm-sh/nvm) for installing/managing node versions.
Yarn can also be used.

```bash
git clone https://github.com/mews-se/apple-music-desktop.git
cd apple-music-desktop
nvm install # Only use if you are using nvm
npm install # Install needed npm deps
npm run start # Run the app
npm run dev # Run the app in development mode
```

## TODO

See [TODO.txt](TODO.txt)
