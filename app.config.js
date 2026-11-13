const packageJson = require('./package.json');

// Set via eas.json's "development" build profile `env` block (NOT
// EAS_BUILD_PROFILE — that's only injected in the remote build worker, not
// during eas-cli's local pre-build config resolution, which is when
// credentials/bundle id registration happens). A distinct bundle id lets the
// dev-client build install side-by-side with the App Store build on device.
const isDevelopmentBuild = process.env.APP_VARIANT === 'development';

// FORK IDENTITY (not upstream): this fork installs beside the App Store qRemote,
// so it needs its own display name and bundle ID. Both can be overridden from
// the environment (the build-ipa workflow exposes them as repo variables).
// Keep the name a single alphanumeric word: expo prebuild derives the Xcode
// project/scheme/.app name from it, and spaces/punctuation make that fragile.
const FORK_NAME = process.env.APP_NAME || 'qRemoteX';
const FORK_BUNDLE_ID = process.env.APP_BUNDLE_ID || 'com.2k16lyfe.qremotex';

module.exports = {
  expo: {
    name: FORK_NAME,
    slug: 'qremote',
    version: packageJson.version, // Single source of truth: package.json
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'qremote',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0A',
    },
    // NOTE: ios/ is generated, not committed (untracked since #154). `npm run
    // xcode` runs `expo prebuild -p ios`, which APPLIES the `ios.infoPlist`
    // block below to the generated project — this is the authoritative place
    // for native Info.plist configuration (see AGENTS.md "iOS Native
    // Workflow"). Hand-edits made directly under ios/ are machine-local and
    // can be rewritten by the next prebuild.
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDevelopmentBuild ? 'com.taylorcox75.expogo' : FORK_BUNDLE_ID,
      appStoreUrl: 'https://apps.apple.com/us/app/qremote-for-qbittorrent/id6756276747',
      infoPlist: {
        // Must be false: RN's StatusBar API (expo-status-bar / FocusAwareStatusBar)
        // is a no-op when iOS uses view-controller-based status bar appearance,
        // leaving the bar stuck on the system appearance (white icons in light mode).
        UIViewControllerBasedStatusBarAppearance: false,
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
        CFBundleURLTypes: [
          {
            CFBundleURLName: `${FORK_BUNDLE_ID}.magnet`,
            CFBundleURLSchemes: ['magnet'],
          },
        ],
        // Required (true, not just present — ITMS-90737 only requires the key
        // exist, but `false` demotes the app to a Share-Sheet-only receiver,
        // dropping it from Files' direct "Open In" / tap-to-open listing).
        // `true` means iOS hands the app a security-scoped reference to the
        // file at its original location instead of a sandboxed copy; reading
        // that from JS is a race the async Linking bridge usually loses (the
        // scope can lapse before app/_layout.tsx's handler runs) — see the
        // withNativeTorrentFileCopy plugin below, which copies the file
        // natively inside the native open-URL callback (while the scope is
        // still guaranteed valid) so JS only ever sees a plain, already-owned
        // copy.
        LSSupportsOpeningDocumentsInPlace: true,
        // Register as an "Open In" handler for .torrent files (issues #88, #125).
        // LSHandlerRank must be Owner (paired with the EXPORTED declaration
        // below) for Files' tap-to-open and "Always Open With" to list the
        // app — as a mere Alternate viewer of an unowned type, iOS fell back
        // to QuickLook Preview and showed "No Apps Available" (#125).
        CFBundleDocumentTypes: [
          {
            CFBundleTypeName: 'BitTorrent Document',
            CFBundleTypeRole: 'Viewer',
            LSHandlerRank: 'Owner',
            LSItemContentTypes: ['org.bittorrent.torrent', 'com.bittorrent.torrent'],
          },
        ],
        // EXPORTED, not imported (#125): "imported" tells iOS another app
        // owns this type definition — but no installed app exports a torrent
        // UTI, so the type was effectively unowned and Files offered no
        // open-with handlers. Exporting makes qRemote the canonical definer.
        // Conformance to public.content (alongside public.data) is also
        // required for Files' open-with eligibility — public.data alone only
        // gets the type into the share sheet.
        UTExportedTypeDeclarations: [
          {
            UTTypeIdentifier: 'org.bittorrent.torrent',
            UTTypeConformsTo: ['public.data', 'public.content'],
            UTTypeDescription: 'BitTorrent Document',
            UTTypeTagSpecification: {
              'public.filename-extension': ['torrent'],
              'public.mime-type': ['application/x-bittorrent'],
            },
          },
        ],
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-localization',
      'expo-secure-store',
      'expo-sharing',
      'expo-status-bar',
      './plugins/withNativeTorrentFileCopy',
    ],
    extra: {
      router: {},
      eas: {
        projectId: 'e2539074-777d-46d3-ae9e-9e584f9e9bb0',
      },
    },
    // FORK: OTA updates are disabled. Upstream's config pointed expo-updates at
    // taylorcox75's EAS project with EXUpdatesCheckOnLaunch=ALWAYS; left on, this
    // fork could download upstream's JS bundle over its own changes.
    updates: {
      enabled: false,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    owner: 'taylorcox75',
  },
};
