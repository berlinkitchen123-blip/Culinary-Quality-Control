/*
 * Renders the daily.html?compact=1 page to PDF and saves it locally.
 * Used by the preview workflow — no email is sent.
 *
 * Env vars:
 *   PRESET            — defaults to 'today'
 *   SNAPSHOT_BASE_URL — defaults to GitHub Pages URL
 *   OUT_FILE           — output path, defaults to './preview.pdf'
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

const PRESET = process.env.PRESET || 'today';
const BASE = process.env.SNAPSHOT_BASE_URL || 'https://berlinkitchen123-blip.github.io/Culinary-Quality-Control/daily.html';
const URL = `${BASE}?preset=${encodeURIComponent(PRESET)}&compact=1`;
const OUT = process.env.OUT_FILE || './preview.pdf';

console.log(`[render] preset=${PRESET}  url=${URL}`);

const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new'
});
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.log('[page error]', e.message));

    console.log('[render] opening page…');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('[render] waiting for both cities to load…');
    await page.waitForFunction(() => {
        const host = document.getElementById('cities');
        if(!host) return false;
        const html = host.innerHTML;
        if(html.includes('Loading')) return false;
        return /pct|class="err"/.test(html);
    }, { timeout: 45000 });

    await new Promise(r => setTimeout(r, 1500));
    await page.emulateMediaType('print');

    console.log('[render] producing PDF…');
    const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' }
    });
    await fs.writeFile(OUT, pdf);
    console.log(`[render] ✓ saved ${OUT} — ${pdf.length} bytes`);
} finally {
    await browser.close();
}
