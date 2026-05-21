/* =====================================================================
   Culinary Quality Control — UI controller
   Editorial redesign
   ===================================================================== */

import { renderLifecycleView } from './view-lifecycle.js';
import { renderWarmerView } from './view-warmers.js';

/* --------------------------- Data --------------------------- */

let mockData = JSON.parse(localStorage.getItem('qc_master_dishes')) || [
    { id: '1', name: 'Indian Butter Chicken',     type: 'meat',       letter: 'A', status: 'ok',   temp: '71.0', stock: '12', weight: '340/320', feedbacks: ['Excellent texture, sauce balanced.'] },
    { id: '2', name: 'Golden Tofu Coconut Curry', type: 'vegetarian', letter: 'B', status: 'fail', temp: '44.7', stock: '5',  weight: '555/495', feedbacks: ['Below temperature spec — check marinade and warmer set point.'] },
    { id: '3', name: 'Egg Channa Masala',         type: 'vegetarian', letter: 'C', status: 'warn', temp: '60.0', stock: '0',  weight: '454/520', feedbacks: ['Temperature in lower band; portion light.'] },
    { id: '4', name: 'Murgh Cholay',              type: 'meat',       letter: 'D', status: 'warn', temp: '62.7', stock: '24', weight: '531/501', feedbacks: ['Standard batch, monitor.'] }
];

const scorecardData = [
    { label: 'Hot dishes — temp',  rate: '70%',  pass: '7 of 10 pass', tone: 'warn',  status: 'WARN' },
    { label: 'Cold dishes — temp', rate: '93%',  pass: '13 of 14 pass', tone: 'ok',    status: 'OK'   },
    { label: 'Ready-to-eat',       rate: '100%', pass: '3 of 3 pass',  tone: 'ok',    status: 'OK'   },
    { label: 'Weight checks',      rate: '71%',  pass: 'within band',  tone: 'warn',  status: 'WARN' }
];

const toneClass = {
    ok:   'is-ok',
    warn: 'is-warn',
    fail: 'is-fail',
    info: 'is-info'
};

const dishToneFromStatus = (s) => s === 'warn' ? 'warn' : s === 'fail' ? 'fail' : 'ok';
const statusLabel = (s) => s === 'warn' ? 'Watch' : s === 'fail' ? 'Hold' : 'Pass';

/* --------------------------- View routing --------------------------- */

function setActiveNav(viewName) {
    document.querySelectorAll('.sidebar .nav-link').forEach(b => b.classList.remove('is-active'));
    const active = document.getElementById(`nav-${viewName}`);
    if (active) active.classList.add('is-active');
}

function setPageTitle(text) {
    const el = document.getElementById('page-title');
    if (el) el.textContent = text;
}

function showView(viewName) {
    // Reset grid container to a sane default before each view renders.
    const grid = document.getElementById('hot-dish-grid');
    if (grid) {
        const parent = grid.parentElement;
        parent.classList.remove('flex', 'flex-col');
        parent.classList.add('grid');
        grid.className = 'grid cols-4 gap-4';
        grid.innerHTML = '';
    }

    // Remove scorecard if previous view was dashboard.
    const existingScorecard = document.getElementById('compliance-scorecard');
    if (existingScorecard) existingScorecard.remove();

    switch (viewName) {
        case 'dashboard':
            setPageTitle('QC Dashboard · Daily');
            renderDashboard();
            break;
        case 'lifecycle':
            setPageTitle('Lifecycle · Dish Tracking');
            renderLifecycleView();
            break;
        case 'warmers':
            setPageTitle('Warmer Management · Live');
            renderWarmerView();
            break;
    }

    setActiveNav(viewName);
}

document.getElementById('nav-dashboard').onclick  = () => showView('dashboard');
document.getElementById('nav-lifecycle').onclick  = () => showView('lifecycle');
document.getElementById('nav-warmers').onclick    = () => showView('warmers');
if (document.getElementById('nav-settings')) {
    document.getElementById('nav-settings').onclick = () => showSettingsModal();
}

/* --------------------------- Settings modal --------------------------- */

function showSettingsModal() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="modal-panel animate-in" role="dialog" aria-labelledby="settings-title">
            <div class="modal-cover">
                <div class="eyebrow eyebrow-gold">Configuration</div>
                <h3 id="settings-title" class="display-m display-italic" style="margin-top: 8px;">Master settings</h3>
                <p class="lede" style="margin: 12px 0 0 0;">
                    Paste a dish manifest as JSON. The dashboard will refresh against the new pass sheet.
                </p>
                <button class="modal-close" aria-label="Close" onclick="document.getElementById('modal-container').classList.add('hidden')">×</button>
            </div>
            <div style="padding: var(--r-5);">
                <label class="eyebrow" style="display:block; margin-bottom: 10px;">Dish manifest (JSON)</label>
                <textarea id="settings-json-input"
                          spellcheck="false"
                          style="width:100%; height:260px; background: var(--ink-deep); border:1px solid var(--hairline); border-radius: var(--radius-sm); padding: 14px; font-family: var(--font-mono); font-size: 12px; color: var(--gold); line-height: 1.55; resize: vertical; outline: none;">${escapeHtml(JSON.stringify(mockData, null, 2))}</textarea>
                <div style="display:flex; gap: 10px; margin-top: var(--r-5);">
                    <button class="btn btn-ghost" style="flex:1;" onclick="document.getElementById('modal-container').classList.add('hidden')">Cancel</button>
                    <button id="save-settings-btn" class="btn btn-solid-gold" style="flex:1; justify-content:center;">Apply Changes</button>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    document.getElementById('save-settings-btn').onclick = () => {
        try {
            const newDishes = JSON.parse(document.getElementById('settings-json-input').value);
            mockData = newDishes;
            localStorage.setItem('qc_master_dishes', JSON.stringify(newDishes));
            modal.classList.add('hidden');
            showView('dashboard');
        } catch (e) {
            alert('Invalid JSON format. Please check the manifest.');
        }
    };
}

/* --------------------------- Export to clipboard --------------------------- */

if (document.getElementById('export-team-btn')) {
    document.getElementById('export-team-btn').onclick = () => {
        const report = `# BB Daily QC Report — ${new Date().toLocaleDateString()}

Hot pass rate: 70%
Cold pass rate: 93%
Dishes tracked: ${mockData.length}

## Dish logs
${mockData.map(d => `- [${d.letter}] ${d.name} — ${d.temp}°C (${d.status.toUpperCase()})`).join('\n')}
`;
        navigator.clipboard.writeText(report).then(() => {
            alert('Report copied to clipboard.');
        });
    };
}

/* --------------------------- Dashboard --------------------------- */

function renderDashboard() {
    const grid  = document.getElementById('hot-dish-grid');
    const table = document.getElementById('summary-table-body');
    if (!grid || !table) return;

    // Scorecard injected before the grid's section.
    const scorecardHtml = `
        <section id="compliance-scorecard" class="section">
            <div class="section-head">
                <div class="lhs">
                    <span class="index">№ 01·b</span>
                    <h3 class="section-title">Compliance Scorecard</h3>
                </div>
                <div class="meta">Pass rate by category</div>
            </div>
            <div class="grid cols-4 gap-4">
                ${scorecardData.map(s => `
                    <div class="card-stat stat-${s.tone === 'ok' ? 'ok' : 'warn'}">
                        <div class="stat-figure num-display">${s.rate}</div>
                        <div class="stat-label">${s.label}</div>
                        <div class="stat-meta">
                            <span class="status-pill ${toneClass[s.tone]}">${s.status}</span>
                            <span class="caption">${s.pass}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;

    if (!document.getElementById('compliance-scorecard')) {
        // Insert before the grid's <section>
        const gridSection = grid.closest('.section');
        if (gridSection) {
            gridSection.insertAdjacentHTML('beforebegin', scorecardHtml);
        } else {
            grid.parentElement.insertAdjacentHTML('beforebegin', scorecardHtml);
        }
    }

    /* Hot dish cards */
    grid.className = 'grid cols-4 gap-4';
    grid.innerHTML = mockData.map(dish => {
        const tone = dishToneFromStatus(dish.status);
        return `
            <article class="dish-card is-${tone}" onclick="showDetail('${dish.id}')" role="button" tabindex="0">
                <header style="display:flex; align-items:center; justify-content:space-between; gap: 8px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span class="dish-letter">${dish.letter}</span>
                        <span class="dish-name">${escapeHtml(dish.name)}</span>
                    </div>
                    <span class="status-pill ${toneClass[tone]}">${statusLabel(dish.status)}</span>
                </header>
                <div>
                    <div class="dish-temp num-display">${dish.temp}<span style="font-family: var(--font-sans); font-weight: 500; font-size: 18px; letter-spacing: 0; color: var(--mute); margin-left: 4px;">°C</span></div>
                    <div class="caption num" style="margin-top: 4px;">${escapeHtml(dish.weight)} g · stock ${dish.stock}</div>
                </div>
                <div class="dish-meta">
                    <span>Warmer · 0${dish.id}</span>
                    <span>${dish.type === 'meat' ? 'Meat' : 'Veg'}</span>
                </div>
            </article>
        `;
    }).join('');

    /* Summary table */
    table.innerHTML = mockData.map(dish => {
        const tone = dishToneFromStatus(dish.status);
        return `
            <tr onclick="showDetail('${dish.id}')" style="cursor:pointer;">
                <td>
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <span class="col-letter">${dish.letter}</span>
                        <span class="col-dish">${escapeHtml(dish.name)}</span>
                    </div>
                </td>
                <td><span class="status-pill ${toneClass[tone]}">${statusLabel(dish.status)}</span></td>
                <td>
                    <span class="col-numeric">${dish.temp}°C</span>
                    <div class="caption num" style="margin-top: 2px;">${escapeHtml(dish.weight)} g</div>
                </td>
                <td class="col-note">${escapeHtml(dish.feedbacks[0] || '—')}</td>
            </tr>
        `;
    }).join('');
}

/* --------------------------- Detail modal --------------------------- */

window.showDetail = (id) => {
    const dish = mockData.find(d => d.id === id);
    if (!dish) return;
    const tone = dishToneFromStatus(dish.status);
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
        <div class="modal-panel animate-in" role="dialog" aria-labelledby="detail-title">
            <div class="modal-cover">
                <span class="cover-letter">${dish.letter}</span>
                <div class="eyebrow eyebrow-gold">Quality control file</div>
                <h3 id="detail-title" class="display-l display-italic" style="margin-top: 8px;">${escapeHtml(dish.name)}</h3>
                <div style="display:flex; gap: 8px; margin-top: 16px;">
                    <span class="status-pill ${toneClass[tone]}">${statusLabel(dish.status)}</span>
                    <span class="chip"><span class="dot"></span>Warmer 0${dish.id}</span>
                    <span class="chip"><span class="dot"></span>${dish.type === 'meat' ? 'Meat' : 'Vegetarian'}</span>
                </div>
                <button class="modal-close" aria-label="Close" onclick="document.getElementById('modal-container').classList.add('hidden')">×</button>
            </div>

            <div style="padding: var(--r-6) var(--r-5);">
                <div class="grid cols-2 gap-4">
                    <div class="card card-padded">
                        <div class="eyebrow">Measured temperature</div>
                        <div class="num-display ${tone === 'ok' ? '' : ''}" style="font-size: 44px; margin-top: 6px; color: var(--${tone === 'ok' ? 'sage' : tone === 'warn' ? 'mustard' : 'terracotta'});">${dish.temp}<span style="font-family: var(--font-sans); font-weight: 500; font-size: 18px; color: var(--mute); margin-left: 4px;">°C</span></div>
                    </div>
                    <div class="card card-padded">
                        <div class="eyebrow">Weight · actual vs recipe</div>
                        <div class="num-display" style="font-size: 32px; margin-top: 6px;">${escapeHtml(dish.weight)}<span style="font-family: var(--font-sans); font-weight: 500; font-size: 16px; color: var(--mute); margin-left: 4px;">g</span></div>
                        <div class="caption" style="margin-top: 6px;">stock on hand: ${dish.stock}</div>
                    </div>
                </div>

                <hr class="rule" style="margin: var(--r-5) 0;"/>

                <div class="eyebrow">Feedback log</div>
                <div style="display:flex; flex-direction:column; gap: 10px; margin-top: 12px;">
                    ${dish.feedbacks.map(f => `
                        <div style="display:flex; gap: 12px; padding: 14px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: var(--radius-sm);">
                            <span style="color: var(--gold); font-family: var(--font-serif); font-style: italic;">¶</span>
                            <p style="margin: 0; font-family: var(--font-serif); font-style: italic; font-size: 14px; color: var(--cream-dim); line-height: 1.5;">${escapeHtml(f)}</p>
                        </div>
                    `).join('')}
                </div>

                <button class="btn btn-solid-gold" style="margin-top: var(--r-5); width: 100%; justify-content: center; padding: 14px;">
                    Validate &amp; archive
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

/* --------------------------- Helpers --------------------------- */

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* --------------------------- Boot --------------------------- */

// Date display
(function setDate() {
    const el = document.getElementById('date-display');
    if (!el) return;
    const d = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    el.textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
})();

showView('dashboard');
