# Fork notes

Fork of [taylorcox75/qRemote](https://github.com/taylorcox75/qRemote) (qBittorrent iOS remote, React Native / Expo SDK 58). Adds local notifications, widgets and a Live Activity; built unsigned on GitHub Actions and sideloaded.

## Attribution / license

Upstream's README declares the license as MIT. At the time of forking, the upstream repo contained **no LICENSE file**, so no copyright line is reproduced here: none was invented. Keep the upstream README's License section and this attribution. If you want a proper LICENSE file, ask upstream to add one and copy its copyright line.

## Differences from upstream so far

- `app.config.js`: display name `qRemoteX` and bundle ID `com.2k16lyfe.qremotex` so it installs beside the App Store qRemote. Override with `APP_NAME` / `APP_BUNDLE_ID` (repo variables in Actions). Keep the name a single alphanumeric word.
- `app.config.js`: `updates.enabled: false`. Upstream pointed expo-updates at its own EAS project with check-on-launch ALWAYS, which could replace this fork's JS with upstream's.
- `package.json`: `easBuild: false`, so upstream's `ios-deploy.yml` (EAS build + submit + GitHub release) does not fire on `package.json` pushes. That workflow needs an `EXPO_TOKEN` this fork doesn't have.
- `.github/workflows/build-ipa.yml`: unsigned `.ipa` build.

## Building

Actions > "Build IPA (unsigned)" > Run workflow (also runs on push, except markdown-only changes). Download the `.ipa` artifact (kept 14 days) and sideload it with AltStore, SideStore or Sideloadly, which re-sign with your Apple ID.

## Free Apple ID limits (as far as I know; verify against your sideloading tool)

- Signatures expire after 7 days; the app must be re-signed/refreshed weekly.
- A small cap on simultaneously sideloaded apps and on new App IDs per week. A widget or Live Activity extension counts as its own App ID, which is why extra targets are being kept to a minimum.
- No push/APNs, App Groups or other paid capabilities.

## Verified vs untested

Verified on Linux (not a Mac):
- `expo prebuild -p ios --no-install` succeeds and generates project `qRemoteX` with bundle ID `com.2k16lyfe.qremotex`, display name `qRemoteX`, `EXUpdatesEnabled=false`.
- `tsc --noEmit` clean; eslint + prettier clean on changed files; full jest suite passes (3 suites were killed by the sandbox's memory limit when run in parallel and pass when run serially).
- `actionlint` passes on `build-ipa.yml`.

**Not tested** (needs a macOS runner or a device):
- `pod install`, `xcodebuild` and `.ipa` packaging in `build-ipa.yml`: never run.
- Whether `maxim-lobanov/setup-xcode` `latest-stable` selects an Xcode that SDK 58 accepts (Expo's docs reportedly list 26.4+).
- Sideloading and launching the resulting app.
