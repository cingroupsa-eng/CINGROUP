// Genera los íconos PWA a partir del isotipo vectorial.
// Uso: node scripts/generate-icons.mjs  (requiere Playwright + Chromium)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
import { writeFileSync, mkdirSync } from "node:fs";

const mono = (color) => `
<g fill="${color}">
  <rect x="19" y="28.6" width="15.5" height="2.2" rx="0.6"/>
  <rect x="66" y="28.6" width="16" height="2.2" rx="0.6"/>
  <rect x="24.6" y="29.5" width="2.6" height="40.5"/>
  <polygon points="24.6,29.5 34.2,29.5 52.4,66.5 49.2,72.6"/>
  <polygon points="49.2,72.6 51.6,72.6 72.6,29.5 70.2,29.5"/>
  <rect x="70.2" y="29.5" width="8.6" height="40.5"/>
  <rect x="19" y="69.2" width="14" height="2.2" rx="0.6"/>
  <rect x="64.6" y="69.2" width="18.6" height="2.2" rx="0.6"/>
  <path d="M84 18 L85.4 21.6 L89 23 L85.4 24.4 L84 28 L82.6 24.4 L79 23 L82.6 21.6 Z"/>
</g>`;

const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF4F9A"/><stop offset="100%" stop-color="#F00072"/></linearGradient></defs>`;

// rounded: favicon / any ; square: apple & maskable (el SO recorta)
const svg = ({ rounded = true, scale = 1 }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${grad}
<rect width="100" height="100" ${rounded ? 'rx="24"' : ""} fill="url(#g)"/>
<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${mono("#FFFFFF")}</g></svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/favicon.svg", svg({ rounded: true, scale: 1.05 }));

const targets = [
  { file: "icon-192.png", size: 192, rounded: true, scale: 1 },
  { file: "icon-512.png", size: 512, rounded: true, scale: 1 },
  { file: "icon-maskable-512.png", size: 512, rounded: false, scale: 0.78 },
  { file: "apple-touch-icon.png", size: 180, rounded: false, scale: 0.92 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(t).replace("<svg ", `<svg width="${t.size}" height="${t.size}" `)}</body></html>`
  );
  await page.screenshot({ path: `public/icons/${t.file}`, omitBackground: true, clip: { x: 0, y: 0, width: t.size, height: t.size } });
  console.log("✓", t.file);
}
await browser.close();
