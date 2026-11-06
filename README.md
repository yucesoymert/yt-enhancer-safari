# YT Enhancer (Safari)

Safari extension for YouTube on macOS: automatic Picture-in-Picture and an Enhancer-style toolbar
(loop, volume boost, cinema/theater mode, speed, screenshot, default quality, keyboard shortcuts).
The UI is in Turkish.

Built for my own daily use, so features follow my needs rather than a roadmap. Fork it and adapt it to yours.
Not affiliated with YouTube or Google.

## Features

- Auto PiP when you switch tabs / minimize the window, or (optional) when the player scrolls out of view.
- Optional: closing PiP with X keeps the video playing in the background tab, without bringing Safari to the front.
  (PiP's own "back to tab" button always activates Safari; that is macOS behaviour.)
- Toolbar under the player and ⌘⇧ shortcuts: loop, volume boost up to 4x, cinema/theater mode, PiP, speed, screenshot.
- Ctrl + wheel / pinch for speed, ⌥ + wheel for volume, default speed and quality.

## Install

Needs a Mac with Xcode. A free Apple ID is enough (Xcode > Settings > Accounts, add it to get a "Personal Team").

1. Fork/clone this repo.
2. Find your Team ID: Xcode > Settings > Accounts > your team, or `security find-identity -v -p codesigning`
   (the 10-character code in parentheses).
3. Build and open the app, using your own reverse-DNS prefix (bundle ids are unique per Apple account):

```sh
xcodebuild -project "xcode/YT Enhancer/YT Enhancer.xcodeproj" -scheme "YT Enhancer" -configuration Debug \
  -derivedDataPath xcode/build DEVELOPMENT_TEAM=YOUR_TEAM_ID BUNDLE_PREFIX=com.yourname \
  CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates build
open "xcode/build/Build/Products/Debug/YT Enhancer.app"
```

4. Safari > Settings > Extensions: enable **YT Enhancer** and allow it on `www.youtube.com`.

After changing the code, run the same command again and reload the YouTube tab.

Quick try without Xcode: Safari > Settings > Advanced > "Show features for web developers", then
Developer > Add Temporary Extension… and pick the `extension/` folder. It is removed when Safari quits.

## Layout

- `extension/`: the web extension (plain JS, no build step). Settings are in the toolbar popup.
- `xcode/`: the macOS app wrapper from `safari-web-extension-converter`. It references `extension/` instead of copying it.
- `node check.js`: tests for the pure JS helpers.

## Notes

- Safari ignores `"world": "MAIN"` in the manifest, so `main.js` (quality setting) is registered from `background.js`
  with `scripting.registerContentScripts`.
- If you re-run the converter, set the bundle ids back to `$(BUNDLE_PREFIX).ytenhancer` and `$(BUNDLE_PREFIX).ytenhancer.Extension`.
