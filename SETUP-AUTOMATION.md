# AI photo review + 10:00 AM Teams report — setup

The Culinary QC prototype ships with the UI hooks already wired. To make them
work end-to-end you need three pieces of plumbing, all kept outside the
browser so secrets never leak:

1. **An AI proxy** — a small server endpoint that receives two photos from
   the browser and asks the Anthropic Claude API to compare them.
2. **A Microsoft Teams Power Automate webhook** — a URL the browser can POST
   to from anywhere, which then posts the report into the
   `Report Quality Control` channel.
3. **A GitHub Actions scheduled job** — runs at 10:00 Berlin time, pulls
   today's data from Firebase, optionally re-runs AI review on dishes that
   still need it, and POSTs the report to the same Teams webhook.

Once these three are in place, paste the AI proxy URL and the Teams webhook
URL into Settings → Integrations and you're done.

---

## 1 · MS Teams "Power Automate" webhook

This is the easiest piece. Microsoft retired the old Office 365 connectors
in late 2024 — the supported replacement is a Power Automate flow with a
"When a HTTP request is received" trigger.

1. Open <https://make.powerautomate.com>.
2. **+ Create → Automated cloud flow → skip → blank flow**.
3. Trigger: **"When a HTTP request is received"**. In the JSON schema box,
   paste:
   ```json
   {
     "type": "object",
     "properties": {
       "type": { "type": "string" },
       "attachments": { "type": "array" }
     }
   }
   ```
4. Add a step: **"Post adaptive card in a chat or channel"**.
   - Post as: **Flow bot**
   - Post in: **Channel**
   - Team: **Bella & Bona** (or whichever)
   - Channel: **Report Quality Control**
   - Adaptive Card: drag the **Body** content from the trigger.
5. Save the flow. Copy the **HTTP POST URL** from the trigger step — this
   is your Teams webhook URL.

Paste it into Settings → Integrations → "MS Teams Power Automate webhook URL".

Now you can press **"Send today's report to Teams"** on the Placement page
and the channel should receive a card immediately.

---

## 2 · AI proxy (Anthropic Claude vision)

This is a tiny Firebase Cloud Function (you can use any HTTP-callable
runtime — Cloudflare Workers, Vercel, Netlify Functions, AWS Lambda).
The Anthropic API does not allow CORS calls from a browser, so a proxy is
required.

### Set up Firebase Functions

```bash
npm i -g firebase-tools
firebase login
firebase init functions      # pick existing project: quality-control-24, JS, no eslint
cd functions
npm i @anthropic-ai/sdk
```

### `functions/index.js`

```js
const functions = require('firebase-functions');
const Anthropic = require('@anthropic-ai/sdk').default;

exports.aiReview = functions
    .runWith({ secrets: ['ANTHROPIC_API_KEY'] })
    .https.onRequest(async (req, res) => {
        // CORS
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') return res.status(204).send('');
        if (req.method !== 'POST') return res.status(405).send('POST only');

        try {
            const { referenceUrl, capturedDataUrl, dishName, ingredients } = req.body || {};
            if (!referenceUrl || !capturedDataUrl) return res.status(400).json({ error: 'missing photos' });

            // Fetch the reference image and inline it as base64
            const refResp = await fetch(referenceUrl);
            const refBuf = Buffer.from(await refResp.arrayBuffer());
            const refB64 = refBuf.toString('base64');
            const refMime = refResp.headers.get('content-type') || 'image/jpeg';

            // The captured photo is already a data URL "data:image/jpeg;base64,..."
            const m = capturedDataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!m) return res.status(400).json({ error: 'bad capturedDataUrl' });
            const capMime = m[1];
            const capB64 = m[2];

            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

            const result = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 800,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: refMime, data: refB64 } },
                        { type: 'image', source: { type: 'base64', media_type: capMime, data: capB64 } },
                        {
                            type: 'text',
                            text: `You are a kitchen QC inspector. The FIRST image is the reference plating for "${dishName}". The SECOND image is today's actual dish at the pass. Expected ingredients: ${(ingredients || []).join(', ') || '—'}.

Compare and respond with strict JSON only (no prose):
{
  "score": <0-100>,
  "summary": "<one sentence>",
  "differences": ["<each visible difference>"],
  "missingIngredients": ["<expected but not visible>"],
  "presentationOk": <true|false>
}`
                        }
                    ]
                }]
            });

            // Pull JSON out of the response
            const text = result.content?.[0]?.text || '{}';
            let parsed = { score: null, summary: text.slice(0, 200), differences: [] };
            try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch (e) {}
            return res.status(200).json(parsed);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: String(err.message || err) });
        }
    });
```

### Deploy + secret

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions:aiReview
```

The deploy URL (looks like `https://europe-west1-quality-control-24.cloudfunctions.net/aiReview`) goes into Settings → Integrations → "AI proxy URL".

Press **"Review with AI"** on any dish with both a reference image and a
captured photo, and Claude's verdict (score + summary + list of differences)
will land in the modal and on the dish record.

---

## 3 · 10:00 AM auto-report (GitHub Actions cron)

This part runs without anyone having the page open. It uses GitHub Actions
because the static site is already on GitHub — no extra hosting, no cost.

### Repository secrets

Settings → Secrets and variables → Actions → New repository secret:
- `FIREBASE_DATABASE_URL` = `https://quality-control-24-default-rtdb.europe-west1.firebasedatabase.app`
- `FIREBASE_DB_SECRET` = a legacy database secret from Firebase console (Project settings → Service accounts → Database secrets). Used to authenticate REST reads.
- `ANTHROPIC_API_KEY` = your Anthropic key (so the cron can run AI review on dishes that don't yet have one).
- `TEAMS_WEBHOOK_URL` = the Power Automate URL from step 1.

### `.github/workflows/daily-report.yml`

```yaml
name: Daily QC report (10:00 Berlin)

on:
  schedule:
    # 10:00 CEST = 08:00 UTC (summer). 10:00 CET = 09:00 UTC (winter).
    # Run at both — the script bails if it's not the right local hour.
    - cron: '0 8 * * 1-5'
    - cron: '0 9 * * 1-5'
  workflow_dispatch: {} # allow manual trigger

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm i @anthropic-ai/sdk
      - name: Send report
        env:
          FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
          FIREBASE_DB_SECRET: ${{ secrets.FIREBASE_DB_SECRET }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
          TZ: Europe/Berlin
        run: node scripts/daily-report.mjs
```

### `scripts/daily-report.mjs`

```js
import Anthropic from '@anthropic-ai/sdk';

const { FIREBASE_DATABASE_URL, FIREBASE_DB_SECRET, ANTHROPIC_API_KEY, TEAMS_WEBHOOK_URL } = process.env;

const now = new Date();
if (now.getHours() !== 10) { console.log('Not 10:00 Berlin local — skipping'); process.exit(0); }

const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const date = `${yyyy}-${mm}-${dd}`;

function isoYearWeek(d) {
    const target = new Date(d);
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThu = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    const wk = 1 + Math.ceil((firstThu - target.valueOf()) / 604800000);
    return `${target.getFullYear()}-${String(wk).padStart(2, '0')}`;
}

async function fetchJson(path) {
    const r = await fetch(`${FIREBASE_DATABASE_URL}/${path}.json?auth=${FIREBASE_DB_SECRET}`);
    return r.ok ? r.json() : null;
}

const week = isoYearWeek(now);
const menu = await fetchJson(`menus/${week}`);
const checks = await fetchJson(`quality-checks/${date}`) || {};
const storage = await fetchJson('storage') || {};

if (!menu || !menu.dishes) {
    console.log('No menu for', week);
    process.exit(0);
}

// Optional: run AI review on any dish that has both photos but no aiReview yet.
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
for (const d of menu.dishes) {
    const c = checks[d.dishLetter];
    if (!c || !c.capturedImage || !d.dishImage || c.aiReview) continue;
    // ... same Claude call as the proxy above (omitted for brevity) ...
}

// Build the markdown report and POST to Teams (see the same code in
// the in-browser sendReportToTeamsNow()).

const lines = ['# Bella & Bona QC — ' + date, ''];
for (const d of menu.dishes) {
    const c = checks[d.dishLetter] || {};
    lines.push(`- **${d.dishLetter} ${d.variantName || d.dishName}** — Asm ${c.assembly?.temp ?? '—'}° / QC ${avg(c.temperatures)?.toFixed?.(1) ?? '—'}° / Dispatch ${c.dispatch?.temp ?? '—'}° · ${c.placement ? placementText(c.placement, storage) : 'no placement'}${c.aiReview ? ' · AI ' + (c.aiReview.score ?? '?') + '/100' : ''}`);
}

function avg(arr) { if (!arr) return null; const n = arr.filter(x => x != null).map(Number).filter(Number.isFinite); return n.length ? n.reduce((a,b)=>a+b,0)/n.length : null; }
function placementText(p, s) {
    if (p.type === 'warmer') {
        const w = (Object.entries(s.warmers || {}).find(([id])=>id===p.containerId) || [])[1];
        return (w?.name || 'Warmer') + ' · ' + (p.compartment || '');
    }
    const f = (Object.entries(s.fridges || {}).find(([id])=>id===p.containerId) || [])[1];
    return f?.name || 'Fridge';
}

await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        type: 'message',
        attachments: [{
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard', version: '1.4',
                body: [
                    { type: 'TextBlock', size: 'Large', weight: 'Bolder', text: 'Bella & Bona QC — ' + date },
                    { type: 'TextBlock', text: lines.join('\n'), wrap: true, fontType: 'Monospace' }
                ]
            }
        }]
    })
});

console.log('Sent', menu.dishes.length, 'dishes to Teams');
```

Commit the workflow + the script and push. Settings → Actions → "Daily QC
report" → **Run workflow** to test it manually before tomorrow's first
scheduled run.

---

## Quick checklist for tomorrow at the kitchen

1. Configure warmers + fridges in Settings (with the real layouts).
2. Open Settings → Integrations:
   - Paste the **AI proxy URL** (Firebase Cloud Function deploy URL).
   - Paste the **Teams Power Automate URL**.
3. Tighten your Firebase Realtime Database rules — the public-write default
   is convenient for development but should be locked down before production
   use. Example rules that allow only authenticated writes:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
4. Press **"Send today's report to Teams"** once to confirm the webhook
   actually drops a card in the channel.

After that, the GitHub Actions cron will take over and post a fresh card
every weekday at 10:00 Berlin time.
