/**
 * Daily QC report — runs at 10:00 Berlin every weekday via GitHub Actions.
 *
 * What it does
 *   1. Reads today's quality-checks + the active menu + storage config from
 *      Firebase Realtime Database via the REST API (auth via a legacy DB
 *      secret stored in GitHub Actions secrets).
 *   2. For each dish that has both a reference image and a captured photo
 *      but no aiReview yet, calls Anthropic Claude vision to compare them
 *      and saves the verdict back to Firebase.
 *   3. Compiles an end-of-day report and POSTs it to a Microsoft Teams
 *      Power Automate webhook so it appears in the "Report Quality Control"
 *      channel.
 *
 * Required env vars
 *   FIREBASE_DATABASE_URL  e.g. https://quality-control-24-default-rtdb.europe-west1.firebasedatabase.app
 *   FIREBASE_DB_SECRET     legacy database secret from Firebase console
 *   ANTHROPIC_API_KEY      sk-ant-...
 *   TEAMS_WEBHOOK_URL      Power Automate "When a HTTP request is received" URL
 *   TZ                     should be Europe/Berlin (set in the workflow)
 */

import Anthropic from '@anthropic-ai/sdk';

const {
    FIREBASE_DATABASE_URL,
    FIREBASE_DB_SECRET,
    ANTHROPIC_API_KEY,
    TEAMS_WEBHOOK_URL
} = process.env;

if (!FIREBASE_DATABASE_URL || !FIREBASE_DB_SECRET) die('FIREBASE_DATABASE_URL and FIREBASE_DB_SECRET are required');
if (!TEAMS_WEBHOOK_URL) die('TEAMS_WEBHOOK_URL is required');

function die(msg) { console.error('FATAL:', msg); process.exit(1); }
function pad(n) { return String(n).padStart(2, '0'); }

const now = new Date();

// Guard: only run at 10:00 Berlin local time (workflow fires at both 08:00
// and 09:00 UTC to cover CET and CEST). For a manual trigger, skip the guard.
if (process.env.GITHUB_EVENT_NAME === 'schedule' && now.getHours() !== 10) {
    console.log(`Local hour is ${now.getHours()} — not 10:00 Berlin time, skipping.`);
    process.exit(0);
}

const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
console.log('Running daily QC report for', date);

function isoYearWeek(d) {
    const target = new Date(d.valueOf());
    target.setHours(0, 0, 0, 0);
    const dayNr = (target.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThu = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    const wk = 1 + Math.ceil((firstThu - target.valueOf()) / 604800000);
    return `${target.getFullYear()}-${String(wk).padStart(2, '0')}`;
}

async function fbGet(path) {
    const r = await fetch(`${FIREBASE_DATABASE_URL}/${path}.json?auth=${FIREBASE_DB_SECRET}`);
    if (!r.ok) throw new Error(`Firebase GET ${path} → ${r.status}`);
    return r.json();
}
async function fbPatch(path, body) {
    const r = await fetch(`${FIREBASE_DATABASE_URL}/${path}.json?auth=${FIREBASE_DB_SECRET}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`Firebase PATCH ${path} → ${r.status}`);
}

function avg(arr) {
    if (!arr) return null;
    const n = arr.filter(x => x != null).map(Number).filter(Number.isFinite);
    return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}

function isCold(d) { return (d.dishType || d.type) === 'cold'; }

const HOT_MIN = 65, COLD_MAX = 8;
function tempStatusFor(v, d) {
    if (v == null) return 'empty';
    if (isCold(d)) return v <= COLD_MAX ? 'pass' : (v <= COLD_MAX + 2 ? 'watch' : 'hold');
    return v >= HOT_MIN ? 'pass' : (v >= HOT_MIN - 3 ? 'watch' : 'hold');
}

function placementText(p, storage) {
    if (!p) return '—';
    if (p.type === 'warmer') {
        const w = storage.warmers?.[p.containerId];
        return `${w?.name || 'Warmer'} · ${p.compartment || ''}`.trim();
    }
    const f = storage.fridges?.[p.containerId];
    return f?.name || 'Fridge';
}

// === Load data ============================================================
const wk = isoYearWeek(now);
const [menu, checksRaw, storageRaw] = await Promise.all([
    fbGet(`menus/${wk}`),
    fbGet(`quality-checks/${date}`),
    fbGet('storage')
]);
const checks = checksRaw || {};
const storage = storageRaw || { warmers: {}, fridges: {} };

if (!menu || !menu.dishes) {
    console.log('No menu for week', wk, '— nothing to report');
    process.exit(0);
}

// Production menus carry variantName / type / stickerNo; the QC prototype
// rewrites them on import. Tolerate both shapes here.
function normaliseDish(d) {
    return {
        dishLetter: d.dishLetter || d.stickerNo,
        dishName:   d.dishName   || d.variantName,
        dishType:   d.dishType   || d.type,
        dishImage:  d.dishImage  || d.webUrl,
        dishIngredients: d.dishIngredients || (Array.isArray(d.ingredients) ? d.ingredients.map(i => ({ name: i?.ingredient?.name || i?.name, weight: i?.amount })) : [])
    };
}
const dishes = (Array.isArray(menu.dishes) ? menu.dishes : Object.values(menu.dishes || {}))
    .map(normaliseDish)
    .filter(d => d.dishLetter && (d.dishLetter || '').toLowerCase() !== 'addons');

console.log(`Found ${dishes.length} main dishes on the menu.`);

// === Run AI review on any dish missing one ================================
if (ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    let reviewed = 0;
    for (const d of dishes) {
        const c = checks[d.dishLetter];
        if (!c || !c.capturedImage || !d.dishImage) continue;
        if (c.aiReview && c.aiReview.score != null) continue; // already reviewed
        try {
            const refResp = await fetch(d.dishImage);
            if (!refResp.ok) { console.warn(`Reference fetch failed for ${d.dishLetter}: ${refResp.status}`); continue; }
            const refBuf = Buffer.from(await refResp.arrayBuffer());
            const refMime = refResp.headers.get('content-type') || 'image/jpeg';
            const m = (c.capturedImage || '').match(/^data:([^;]+);base64,(.+)$/);
            if (!m) { console.warn(`Bad capturedImage for ${d.dishLetter}`); continue; }
            const ai = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 800,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: refMime, data: refBuf.toString('base64') } },
                        { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
                        { type: 'text', text: `You are a kitchen QC inspector. The FIRST image is the reference plating for "${d.dishName}". The SECOND image is today's actual dish at the pass. Expected ingredients: ${(d.dishIngredients || []).map(x => x.name).filter(Boolean).join(', ') || '—'}.\n\nRespond with strict JSON only (no prose):\n{ "score": <0-100>, "summary": "<one sentence>", "differences": ["<each visible difference>"], "missingIngredients": ["<expected but not visible>"], "presentationOk": <true|false> }` }
                    ]
                }]
            });
            const text = ai.content?.[0]?.text || '{}';
            let parsed = {};
            try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch (e) { parsed = { score: null, summary: text.slice(0, 200) }; }
            const review = { ...parsed, ts: `${pad(now.getHours())}:${pad(now.getMinutes())}`, date };
            await fbPatch(`quality-checks/${date}/${d.dishLetter}`, { aiReview: review });
            checks[d.dishLetter] = { ...(checks[d.dishLetter] || {}), aiReview: review };
            reviewed++;
            console.log(`AI reviewed ${d.dishLetter}: ${review.score}/100`);
        } catch (err) {
            console.warn(`AI review failed for ${d.dishLetter}:`, err.message);
        }
    }
    console.log(`AI-reviewed ${reviewed} new dishes.`);
} else {
    console.log('ANTHROPIC_API_KEY not set — skipping AI review.');
}

// === Compile report =======================================================
const items = dishes.map(d => {
    const c = checks[d.dishLetter] || {};
    const aT = c.assembly?.temps ? avg(c.assembly.temps) : (c.assembly?.temp ?? null);
    const qT = avg(c.temperatures);
    const dT = c.dispatch?.temp ?? null;
    const w = avg(c.weights);
    // Status = worst of any stage that has a reading
    const stages = [
        { v: aT, t: 'assembly' },
        { v: qT, t: 'qc' },
        { v: dT, t: 'dispatch' }
    ].filter(s => s.v != null);
    let status = 'empty';
    for (const s of stages) {
        const st = tempStatusFor(s.v, d);
        if (st === 'hold' || (st === 'watch' && status !== 'hold')) status = st;
        else if (st === 'pass' && status === 'empty') status = 'pass';
    }
    return { d, c, aT, qT, dT, w, status };
});

const summary = {
    date,
    total: items.length,
    pass: items.filter(x => x.status === 'pass').length,
    watch: items.filter(x => x.status === 'watch').length,
    hold: items.filter(x => x.status === 'hold').length,
    logged: items.filter(x => x.status !== 'empty').length
};

const lines = [];
lines.push(`### Bella & Bona — Culinary QC report`);
lines.push(`**${date}** · Generated ${pad(now.getHours())}:${pad(now.getMinutes())} Berlin time`);
lines.push('');
lines.push(`**Pass ${summary.pass} · Watch ${summary.watch} · Hold ${summary.hold} · Logged ${summary.logged} / ${summary.total}**`);
lines.push('');
lines.push(`| # | Dish | Asm°C | QC°C | Disp°C | Wt | Placement | AI | Status |`);
lines.push(`|---|------|-------|------|--------|----|-----------|----|--------|`);
for (const it of items) {
    const f = (v, t) => v != null ? `${typeof v === 'number' ? v.toFixed(1) : v}°${t ? ` (${t})` : ''}` : '—';
    const ai = it.c.aiReview ? `${it.c.aiReview.score ?? '?'}/100${it.c.aiReview.summary ? ` — ${(it.c.aiReview.summary || '').slice(0, 60)}` : ''}` : '—';
    const place = placementText(it.c.placement, storage);
    lines.push(`| ${it.d.dishLetter} | ${(it.d.dishName || '').replace(/\|/g, '·')} | ${f(it.aT, it.c.assembly?.time)} | ${f(it.qT, it.c.qcTime)} | ${f(it.dT, it.c.dispatch?.time)} | ${it.w != null ? Math.round(it.w) + 'g' : '—'} | ${place} | ${ai.replace(/\|/g, '·')} | ${it.status.toUpperCase()} |`);
}

const markdown = lines.join('\n');

// === Post to Teams ========================================================
const card = {
    type: 'message',
    attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                { type: 'TextBlock', size: 'Large', weight: 'Bolder', text: 'Bella & Bona — Daily QC report' },
                { type: 'TextBlock', text: `${date} · generated ${pad(now.getHours())}:${pad(now.getMinutes())} Berlin time`, isSubtle: true, wrap: true },
                { type: 'FactSet', facts: [
                    { title: 'Pass',  value: String(summary.pass) },
                    { title: 'Watch', value: String(summary.watch) },
                    { title: 'Hold',  value: String(summary.hold) },
                    { title: 'Logged', value: `${summary.logged} / ${summary.total}` }
                ]},
                { type: 'TextBlock', text: markdown, wrap: true, fontType: 'Monospace' }
            ]
        }
    }]
};

const teamsRes = await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
});

if (!teamsRes.ok && teamsRes.status !== 202) {
    console.error('Teams webhook returned', teamsRes.status, await teamsRes.text());
    process.exit(1);
}
console.log(`Posted to Teams (status ${teamsRes.status}).`);
