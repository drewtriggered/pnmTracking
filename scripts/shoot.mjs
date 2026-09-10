// Dev-only screenshot helper for the design review. Drives the installed
// Chrome via puppeteer-core against the running `vite dev` preview.
// Usage: node scripts/shoot.mjs [url] [outDir]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5173/preview.html';
const OUT = process.argv[3] ?? '.impeccable/review';
mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--disable-gpu'],
});

async function shoot(name, width, deviceScaleFactor) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(
    `${name}: ${width}px  scrollW=${metrics.scrollW} clientW=${metrics.clientW}` +
      (metrics.scrollW > metrics.clientW + 1 ? '  ⚠ HORIZONTAL OVERFLOW' : '  ok'),
  );
  await page.close();
}

await shoot('desktop', 1440, 1);
await shoot('mobile', 390, 2);
await browser.close();
