/**
 * Cloudflare Worker — Bella & Bona AI photo review proxy.
 *
 * The browser sends two photos (reference URL + today's data-URL capture)
 * and this Worker calls Anthropic Claude vision to compare them.
 *
 * Deploy via the Cloudflare dashboard:
 *   Workers & Pages → Create application → Worker → name it bb-ai-review
 *   → Quick edit → paste this whole file → Deploy.
 *   Then: Settings → Variables → "Add variable" → ANTHROPIC_API_KEY = sk-ant-...
 *
 * Or with wrangler:
 *   npm i -g wrangler
 *   wrangler login
 *   wrangler init bb-ai-review --yes
 *   # replace src/index.js with this file
 *   wrangler secret put ANTHROPIC_API_KEY
 *   wrangler deploy
 *
 * The Worker URL (https://bb-ai-review.<your-subdomain>.workers.dev) goes
 * into the app's Settings → Integrations → "AI proxy URL".
 */

const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_VERSION = '2023-06-01';

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
        if (request.method !== 'POST')    return json({ error: 'POST only' }, 405);
        if (!env.ANTHROPIC_API_KEY)       return json({ error: 'ANTHROPIC_API_KEY not configured on Worker' }, 500);

        let body;
        try { body = await request.json(); }
        catch (e) { return json({ error: 'Invalid JSON' }, 400); }
        const { referenceUrl, capturedDataUrl, dishName, ingredients } = body || {};
        if (!referenceUrl || !capturedDataUrl) return json({ error: 'referenceUrl and capturedDataUrl required' }, 400);

        // Fetch + inline the reference image
        let refImage;
        try {
            const refResp = await fetch(referenceUrl);
            if (!refResp.ok) return json({ error: `Reference fetch ${refResp.status}` }, 502);
            const buf = await refResp.arrayBuffer();
            refImage = {
                type: 'base64',
                media_type: refResp.headers.get('content-type') || 'image/jpeg',
                data: arrayBufferToBase64(buf)
            };
        } catch (err) {
            return json({ error: 'Reference fetch failed: ' + err.message }, 502);
        }

        // Decode the captured data URL
        const m = String(capturedDataUrl).match(/^data:([^;]+);base64,(.+)$/);
        if (!m) return json({ error: 'capturedDataUrl must be a base64 data URL' }, 400);
        const capImage = { type: 'base64', media_type: m[1], data: m[2] };

        // Call Anthropic
        const prompt = `You are a kitchen QC inspector. The FIRST image is the reference plating for "${dishName || 'this dish'}". The SECOND image is today's actual dish at the pass. Expected ingredients: ${(ingredients || []).join(', ') || '—'}.

Respond with strict JSON only, no prose:
{
  "score": <0-100 integer>,
  "summary": "<one sentence>",
  "differences": ["<each visible difference>"],
  "missingIngredients": ["<expected but not visible>"],
  "presentationOk": <true|false>
}`;

        const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key':         env.ANTHROPIC_API_KEY,
                'anthropic-version': ANTHROPIC_VERSION,
                'content-type':      'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 800,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: refImage },
                        { type: 'image', source: capImage },
                        { type: 'text',  text: prompt }
                    ]
                }]
            })
        });

        if (!anthropicResp.ok) {
            const err = await anthropicResp.text();
            return json({ error: 'Anthropic ' + anthropicResp.status + ': ' + err.slice(0, 200) }, 502);
        }

        const data = await anthropicResp.json();
        const text = data?.content?.[0]?.text || '{}';
        let parsed = { score: null, summary: text.slice(0, 200), differences: [] };
        try {
            const jsonText = text.match(/\{[\s\S]*\}/)?.[0] || '{}';
            parsed = JSON.parse(jsonText);
        } catch (e) { /* keep fallback */ }

        return json(parsed);
    }
};

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS }
    });
}

function arrayBufferToBase64(buf) {
    let s = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}
