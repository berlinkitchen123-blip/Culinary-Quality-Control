/*
 * Render the daily.html cross-city dashboard with headless Chrome,
 * print it to PDF, and email via Resend.
 *
 * Env vars expected (set in GitHub Actions):
 *   RESEND_API_KEY  (required)  — from secrets
 *   PRESET                       — "yesterday" | "this-week" | "today" | …
 *   RECIPIENT                    — primary "To" address
 *   CC                            — comma-separated CC list (optional)
 *   SENDER                        — verified sender, e.g. Harsh@bellabona.com
 *   SUBJECT_PREFIX                — e.g. "Quality check report"
 *   SNAPSHOT_BASE_URL             — defaults to the GitHub Pages URL
 *
 * Usage (locally):
 *   RESEND_API_KEY=re_xxx PRESET=yesterday node send-snapshot.js
 */
import puppeteer from 'puppeteer';
import { Resend } from 'resend';

const PRESET = process.env.PRESET || 'yesterday';
const SUBJECT_PREFIX = process.env.SUBJECT_PREFIX || 'Quality check report';
const BASE = process.env.SNAPSHOT_BASE_URL || 'https://berlinkitchen123-blip.github.io/Culinary-Quality-Control/daily.html';
const URL = `${BASE}?preset=${encodeURIComponent(PRESET)}`;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER = process.env.SENDER || 'qc@bellabona.com';
const RECIPIENT = process.env.RECIPIENT || '';
const CC = (process.env.CC || '').split(',').map(s => s.trim()).filter(Boolean);

if(!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY env var');
if(!RECIPIENT) throw new Error('Missing RECIPIENT env var');

const presetLabel = (p) => ({
    'today': 'Today',
    'yesterday': 'Yesterday',
    'this-week': 'This week (Mon–Fri)',
    'last-week': 'Last week',
    'this-month': 'This month',
    'last-month': 'Last month'
}[p] || p);

console.log(`[snapshot] preset=${PRESET}  url=${URL}`);

const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new'
});
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1320, height: 1700, deviceScaleFactor: 1 });
    // Suppress JS errors in console but log them so we can debug from Actions
    page.on('pageerror', (e) => console.log('[page error]', e.message));
    page.on('console', (msg) => {
        if(msg.type() === 'error') console.log('[page console error]', msg.text());
    });

    console.log('[snapshot] opening page…');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait until the loading placeholders are replaced. Both city cards
    // initially say "Loading…" — when the data lands they're swapped.
    console.log('[snapshot] waiting for both cities to load…');
    await page.waitForFunction(() => {
        const host = document.getElementById('cities');
        if(!host) return false;
        const html = host.innerHTML;
        if(html.includes('Loading')) return false;
        // Make sure both Berlin + Munich cards rendered (look for either
        // a scorecard `.pct` element or an error block — both are valid
        // terminal states).
        return /pct|class="err"/.test(html);
    }, { timeout: 45000 });

    // Tiny grace period so any deferred renders settle
    await new Promise(r => setTimeout(r, 1500));

    // Emulate "print" media so our @media print rules kick in (hides toolbar)
    await page.emulateMediaType('print');

    console.log('[snapshot] rendering PDF…');
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '8mm', bottom: '12mm', left: '8mm' }
    });
    console.log(`[snapshot] PDF size: ${pdf.length} bytes`);

    // Build subject + attachment name
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    const human = today.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const subject = `${SUBJECT_PREFIX} · ${presetLabel(PRESET)} · ${human}`;
    const filename = `bb-qc-${PRESET}-${iso}.pdf`;

    const html = `
        <div style="font-family:Inter,Arial,sans-serif;color:#1f2937;line-height:1.55;font-size:14px;max-width:560px">
            <p style="margin:0 0 12px 0">Hi team,</p>
            <p style="margin:0 0 12px 0">
                Attached is the Bella &amp; Bona QC snapshot for <strong>${presetLabel(PRESET).toLowerCase()}</strong>
                covering both Berlin and Munich kitchens.
            </p>
            <p style="margin:0 0 12px 0">
                Live dashboard (always current, both cities side-by-side):<br/>
                <a href="${URL}" style="color:#2563eb">${URL}</a>
            </p>
            <p style="margin:0;color:#64748b;font-size:12px">
                — Bella &amp; Bona Culinary Operations · automated email
            </p>
        </div>
    `;
    const text = [
        `Hi team,`,
        ``,
        `Attached is the Bella & Bona QC snapshot for ${presetLabel(PRESET).toLowerCase()} covering both Berlin and Munich kitchens.`,
        ``,
        `Live dashboard: ${URL}`,
        ``,
        `— Bella & Bona Culinary Operations`
    ].join('\n');

    const resend = new Resend(RESEND_API_KEY);
    console.log(`[snapshot] sending email   from=${SENDER}  to=${RECIPIENT}  cc=[${CC.join(', ')}]`);
    const res = await resend.emails.send({
        from: SENDER,
        to: [RECIPIENT],
        cc: CC.length ? CC : undefined,
        subject,
        html,
        text,
        attachments: [{ filename, content: pdf.toString('base64') }]
    });

    if(res.error){
        console.error('[snapshot] Resend error:', res.error);
        throw new Error('Resend rejected: ' + JSON.stringify(res.error));
    }
    console.log(`[snapshot] ✓ sent — message id ${res.data?.id || '(no id)'}`);
} finally {
    await browser.close();
}
