# Publishing

The site is a static folder. `index.html` is the university. `campus/` is the older studio app. Nothing here is a store build.

## Prepared, not built

- **Chrome extension.** `manifest.webmanifest` and `sw.js` are the PWA shell. A Chrome extension manifest (`manifest.json` with `action` and `chrome_url_overrides`) is not in this repository. Packaging would wrap these static files. That package is not built.
- **iOS and Android.** A Capacitor project (`capacitor.config`, native `ios/` and `android/` folders) is not in this repository. The static site can be copied into a WebView later. Those native projects are not built.
- **Embed widget.** There is no `embed.js` snippet that mounts one room on another origin. Pages can be linked. A widget build is not included.

## What is built

- The multi-page university, with a service worker cache named `mvcc-university-v1`.
- Downloads under `downloads/`, including diagram SVG, PNG, and HTML, and `downloads/microsoft-voice-university.zip`.
- “Open the studios” points at `campus/index.html`. “View repo” points at `https://github.com/CypherMonkeyLabs/microsoft-voice-cc-lab-free-university-mesmerizing`.
