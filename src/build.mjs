// Harmony Gym build: node src/build.mjs
// Writes:
//   index.html            the web app served by GitHub Pages (with manifest and icons)
//   dist/standalone.html  the same app as one file, for opening from disk in Chrome
//   dist/artifact.html    page content for a Claude artifact (the host adds <html>/<head>/<body>)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = dirname(fileURLToPath(import.meta.url));
const root = join(src, '..');
const read = f => readFileSync(join(src, f), 'utf8');

const css = read('styles.css');
const js = ['core.js', 'components.js', 'ear.js', 'voicings.js', 'sing.js', 'ui.js'].map(read).join('\n\n');

// Piano samples (Salamander Grand Piano, CC BY 3.0), embedded as base64 so the app is one self-contained page
const sampleFiles = readdirSync(join(src, 'samples')).filter(f => /^\d+\.mp3$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
const samples = '{' + sampleFiles.map(f => `${JSON.stringify(String(parseInt(f)))}: ${JSON.stringify(readFileSync(join(src, 'samples', f)).toString('base64'))}`).join(', ') + '}';

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400..700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Music&text=%E2%99%AD%E2%99%AF%E2%99%AE&display=swap">`;

const body = `<div id="root"></div>
<noscript><p style="padding:24px">Harmony Gym needs JavaScript.</p></noscript>
<script type="application/json" id="piano-samples">${samples}</script>
<script>
(() => {
${js}
})();
</script>`;

const artifact = `<title>Harmony Gym</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
<style>
${css}
</style>
${body}
`;

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Harmony Gym</title>
<meta name="theme-color" content="#f3f4f8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14151d" media="(prefers-color-scheme: dark)">
${fonts}
<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
${css}
</style>
</head>
<body>
${body}
</body>
</html>
`;

const webLinks = '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="icon-192.png">\n<link rel="apple-touch-icon" href="icon-192.png">\n';
const web = standalone.replace('<title>Harmony Gym</title>', '<title>Harmony Gym</title>\n' + webLinks);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'index.html'), web);
writeFileSync(join(root, 'dist', 'standalone.html'), standalone);
writeFileSync(join(root, 'dist', 'artifact.html'), artifact);
console.log(`index.html ${(web.length / 1024).toFixed(0)} KB · ${sampleFiles.length} piano samples`);
