/*
 * Render the daily.html cross-city dashboard with headless Chrome,
 * print to PDF, and email it.
 *
 * Two delivery modes (auto-selected):
 *   1. Gmail SMTP via nodemailer — preferred, free, no DNS.
 *      Requires:
 *        GMAIL_USER          — full mailbox, e.g. Harsh@bellabona.com
 *        GMAIL_APP_PASSWORD  — 16-char app password from Google Account
 *   2. Resend API — fallback if Gmail vars are missing (needs verified domain).
 *      Requires:
 *        RESEND_API_KEY      — from resend.com/api-keys
 *
 * Always required:
 *   PRESET            — "yesterday" | "this-week" | ...
 *   RECIPIENT         — primary "To" address
 *   CC                — comma-separated CC list (optional)
 *   SENDER            — "From" name+addr ("Harsh@bellabona.com" or "Harsh <Harsh@bellabona.com>")
 *   SUBJECT_PREFIX    — defaults to "Quality check report"
 *   SNAPSHOT_BASE_URL — defaults to the GitHub Pages URL
 */
import puppeteer from 'puppeteer';

const PRESET = process.env.PRESET || 'yesterday';
const SUBJECT_PREFIX = process.env.SUBJECT_PREFIX || 'Quality check report';
const BASE = process.env.SNAPSHOT_BASE_URL || 'https://berlinkitchen123-blip.github.io/Culinary-Quality-Control/daily.html';
const URL = `${BASE}?preset=${encodeURIComponent(PRESET)}`;
const RECIPIENT = process.env.RECIPIENT || '';
const CC = (process.env.CC || '').split(',').map(s => s.trim()).filter(Boolean);
const SENDER = process.env.SENDER || process.env.GMAIL_USER || 'qc@bellabona.com';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

if(!RECIPIENT) throw new Error('Missing RECIPIENT env var');
if(!GMAIL_APP_PASSWORD && !RESEND_API_KEY){
    throw new Error('No delivery method configured. Set either GMAIL_USER + GMAIL_APP_PASSWORD (preferred), or RESEND_API_KEY.');
}

const presetLabel = (p) => ({
    'today': 'Today',
    'yesterday': 'Yesterday',
    'this-week': 'This week (Mon–Fri)',
    'last-week': 'Last week',
    'this-month': 'This month',
    'last-month': 'Last month'
}[p] || p);

console.log(`[snapshot] preset=${PRESET}  url=${URL}`);
console.log(`[snapshot] mode=${GMAIL_APP_PASSWORD ? 'gmail-smtp' : 'resend'}  from=${SENDER}  to=${RECIPIENT}  cc=[${CC.join(', ')}]`);

const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new'
});

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1320, height: 1700, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.log('[page error]', e.message));
    page.on('console', (msg) => { if(msg.type() === 'error') console.log('[page console error]', msg.text()); });

    console.log('[snapshot] opening page…');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('[snapshot] waiting for both cities to load…');
    await page.waitForFunction(() => {
        const host = document.getElementById('cities');
        if(!host) return false;
        const html = host.innerHTML;
        if(html.includes('Loading')) return false;
        return /pct|class="err"/.test(html);
    }, { timeout: 45000 });

    await new Promise(r => setTimeout(r, 1500));
    await page.emulateMediaType('print');

    console.log('[snapshot] rendering PDF…');
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '8mm', bottom: '12mm', left: '8mm' }
    });
    console.log(`[snapshot] PDF size: ${pdf.length} bytes`);

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

    if(GMAIL_APP_PASSWORD){
        // --- Gmail SMTP ---
        const { default: nodemailer } = await import('nodemailer');
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: GMAIL_USER || SENDER, pass: GMAIL_APP_PASSWORD }
        });
        try {
            await transporter.verify();
            console.log('[snapshot] SMTP connection verified');
        } catch(err){
            console.error('[snapshot] SMTP verify failed:', err.message);
            throw err;
        }
        const info = await transporter.sendMail({
            from: SENDER,
            to: RECIPIENT,
            cc: CC.length ? CC.join(', ') : undefined,
            subject,
            html,
            text,
            attachments: [{ filename, content: pdf, contentType: 'application/pdf' }]
        });
        console.log(`[snapshot] ✓ sent via Gmail SMTP — id ${info.messageId}`);
    } else {
        // --- Resend (fallback, requires domain verification) ---
        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);
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
        console.log(`[snapshot] ✓ sent via Resend — id ${res.data?.id || '(no id)'}`);
    }
} finally {
    await browser.close();
}
