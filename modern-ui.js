/* =====================================================================
   Culinary Quality Control — workflow controller
   Editorial redesign · Firebase-synced daily instrument
   ===================================================================== */

import { renderLifecycleView } from './view-lifecycle.js';
import { renderWarmerView } from './view-warmers.js';
import {
    todayIso,
    subscribeDishes,
    subscribeDay,
    saveDish,
    saveReading,
    deleteDish,
    seedIfEmpty,
    onConnectionChange
} from './firebase-sync.js';

/* ---------------- Defaults / seeds ---------------- */

const DEFAULT_DISHES = [
    { id: 'A', letter: 'A', name: 'Indian Butter Chicken',     type: 'hot-meat', warmerId: '01',
      spec: { tempMin: 65, tempMax: 80, weightTarget: 320, weightTolerance: 25 } },
    { id: 'B', letter: 'B', name: 'Golden Tofu Coconut Curry', type: 'hot-veg',  warmerId: '02',
      spec: { tempMin: 65, tempMax: 80, weightTarget: 495, weightTolerance: 30 } },
    { id: 'C', letter: 'C', name: 'Egg Channa Masala',         type: 'hot-veg',  warmerId: '03',
      spec: { tempMin: 65, tempMax: 80, weightTarget: 520, weightTolerance: 35 } },
    { id: 'D', letter: 'D', name: 'Murgh Cholay',              type: 'hot-meat', warmerId: '04',
      spec: { tempMin: 65, tempMax: 80, weightTarget: 501, weightTolerance: 30 } }
];

/* ---------------- App state ---------------- */

const state = {
    dishes: [],         // master list
    day: {},            // current day's readings, keyed by dish id
    dayIso: todayIso(),
    view: 'dashboard',  // dashboard | lifecycle | warmers
    filter: 'all',      // all | hot | cold | issues
    connected: false,
    unsubDay: null
};

/* ---------------- Threshold logic ---------------- */

function computeStatus(dish, reading) {
    if (!reading || reading.temp == null || reading.temp === '') return 'empty';
    const t = Number(reading.temp);
    if (Number.isNaN(t)) return 'empty';

    const spec = dish.spec || {};
    const isHot = (dish.type || '').startsWith('hot');

    let tempStatus = 'ok';
    if (isHot) {
        const min = spec.tempMin ?? 65;
        if (t >= min) tempStatus = 'ok';
        else if (t >= min - 3) tempStatus = 'warn';
        else tempStatus = 'fail';
    } else {
        // cold / rte
        const max = spec.tempMax ?? 8;
        if (t <= max) tempStatus = 'ok';
        else if (t <= max + 2) tempStatus = 'warn';
        else tempStatus = 'fail';
    }

    // Weight degrade
    let weightStatus = 'ok';
    if (reading.weight != null && reading.weight !== '' && spec.weightTarget) {
        const w = Number(reading.weight);
        if (!Number.isNaN(w)) {
            const diff = Math.abs(w - spec.weightTarget);
            const tol = spec.weightTolerance ?? 25;
            if (diff > tol * 2) weightStatus = 'fail';
            else if (diff > tol) weightStatus = 'warn';
        }
    }

    // Combine — pick worst
    const order = { ok: 0, warn: 1, fail: 2, empty: -1 };
    return Object.entries({ tempStatus, weightStatus })
        .reduce((acc, [_, s]) => order[s] > order[acc] ? s : acc, 'ok');
}

function computeScorecard() {
    let hotPass = 0, hotTot = 0, coldPass = 0, coldTot = 0, rtePass = 0, rteTot = 0;
    let weightOk = 0, weightTot = 0;

    for (const dish of state.dishes) {
        const r = state.day[dish.id] || {};
        const status = computeStatus(dish, r);
        const isHot = (dish.type || '').startsWith('hot');
        const isRte = dish.type === 'rte';
        const isCold = dish.type === 'cold';

        if (r.temp != null && r.temp !== '') {
            if (isHot) { hotTot++; if (status !== 'fail') hotPass++; }
            else if (isCold) { coldTot++; if (status !== 'fail') coldPass++; }
            else if (isRte) { rteTot++; if (status !== 'fail') rtePass++; }
        }

        if (r.weight != null && r.weight !== '' && dish.spec?.weightTarget) {
            weightTot++;
            const diff = Math.abs(Number(r.weight) - dish.spec.weightTarget);
            const tol = dish.spec.weightTolerance ?? 25;
            if (diff <= tol) weightOk++;
        }
    }

    const pct = (n, d) => d === 0 ? '—' : `${Math.round((n / d) * 100)}%`;

    return [
        { label: 'Hot dishes · temp',  rate: pct(hotPass, hotTot),  pass: hotTot  ? `${hotPass} of ${hotTot} pass`  : 'no readings yet', tone: tone(hotPass, hotTot) },
        { label: 'Cold dishes · temp', rate: pct(coldPass, coldTot), pass: coldTot ? `${coldPass} of ${coldTot} pass` : 'no readings yet', tone: tone(coldPass, coldTot) },
        { label: 'Ready-to-eat',       rate: pct(rtePass, rteTot),   pass: rteTot  ? `${rtePass} of ${rteTot} pass`  : 'no readings yet', tone: tone(rtePass, rteTot) },
        { label: 'Weight band',        rate: pct(weightOk, weightTot), pass: weightTot ? `${weightOk} of ${weightTot} ok` : 'no readings yet', tone: tone(weightOk, weightTot) }
    ];
}

function tone(pass, total) {
    if (total === 0) return 'empty';
    const r = pass / total;
    if (r >= 0.95) return 'ok';
    if (r >= 0.8)  return 'warn';
    return 'fail';
}

const statusLabel = (s) => s === 'warn' ? 'Watch' : s === 'fail' ? 'Hold' : s === 'empty' ? '—' : 'Pass';
const toneClass = { ok: 'is-ok', warn: 'is-warn', fail: 'is-fail', empty: 'is-empty', info: 'is-info' };

/* ---------------- Firebase wiring ---------------- */

async function bootstrap() {
    showLoader(true);

    // Seed master list if empty
    await seedIfEmpty(DEFAULT_DISHES);

    // Subscribe to dishes (master) and current day
    subscribeDishes(dishes => {
        // Firebase will return the seeded list. If for some reason it's empty,
        // fall back to defaults so the UI never blanks.
        state.dishes = dishes.length ? dishes : DEFAULT_DISHES;
        render();
    });

    subscribeToDay(state.dayIso);

    onConnectionChange(connected => {
        state.connected = connected;
        const dot = document.getElementById('conn-dot');
        const lbl = document.getElementById('conn-label');
        if (dot && lbl) {
            dot.classList.toggle('offline', !connected);
            lbl.textContent = connected ? 'Live' : 'Offline';
        }
    });

    // Initial render even if subscriptions are slow.
    state.dishes = DEFAULT_DISHES;
    render();
    showLoader(false);
}

function subscribeToDay(iso) {
    if (state.unsubDay) state.unsubDay();
    state.unsubDay = subscribeDay(iso, data => {
        // Strip the _meta key from readings
        const { _meta, ...readings } = data || {};
        state.day = readings;
        render();
    });
}

async function patchReading(dishId, partial) {
    // Optimistic local update for instant feedback
    state.day[dishId] = { ...(state.day[dishId] || {}), ...partial };
    renderDashboardOnly();

    try {
        await saveReading(state.dayIso, dishId, partial);
    } catch (e) {
        toast('Save failed', 'fail');
        console.error(e);
    }
}

/* ---------------- Rendering ---------------- */

function render() {
    setDateText();
    renderSidebarCounts();
    renderAlertBanner();

    if (state.view === 'dashboard') renderDashboardOnly();
    else if (state.view === 'lifecycle') renderLifecycleView();
    else if (state.view === 'warmers') renderWarmerView();
}

function renderDashboardOnly() {
    if (state.view !== 'dashboard') return;
    renderScorecard();
    renderDishGrid();
    renderSummaryTable();
    renderSidebarCounts();
    renderAlertBanner();
}

function renderScorecard() {
    const host = document.getElementById('scorecard-grid');
    if (!host) return;
    host.innerHTML = computeScorecard().map(s => `
        <div class="card-stat stat-${s.tone === 'ok' ? 'ok' : s.tone === 'warn' ? 'warn' : s.tone === 'fail' ? 'fail' : 'brand'}">
            <div class="stat-figure num-display">${s.rate}</div>
            <div class="stat-label">${s.label}</div>
            <div class="stat-meta">
                <span class="status-pill ${toneClass[s.tone === 'empty' ? 'info' : s.tone]}">${s.tone === 'empty' ? 'No data' : s.tone.toUpperCase()}</span>
                <span class="caption">${s.pass}</span>
            </div>
        </div>
    `).join('');
}

function filteredDishes() {
    return state.dishes.filter(d => {
        const r = state.day[d.id] || {};
        const status = computeStatus(d, r);
        if (state.filter === 'all') return true;
        if (state.filter === 'hot') return (d.type || '').startsWith('hot');
        if (state.filter === 'cold') return d.type === 'cold' || d.type === 'rte';
        if (state.filter === 'issues') return status === 'warn' || status === 'fail';
        return true;
    });
}

function renderDishGrid() {
    const grid = document.getElementById('hot-dish-grid');
    if (!grid) return;
    grid.className = 'grid cols-2 gap-3';
    grid.style.cssText = '';

    const dishes = filteredDishes();
    if (dishes.length === 0) {
        grid.innerHTML = `
            <div class="card card-padded" style="grid-column: 1 / -1; text-align: center; padding: var(--r-7);">
                <div class="eyebrow">No dishes match this filter</div>
                <p class="lede" style="margin: 10px 0 18px 0;">Try a different filter, or add a new dish to the pass sheet.</p>
                <button class="btn btn-outline-gold" onclick="window.__qc.openAddDish()">+ Add dish</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = dishes.map(dish => {
        const r = state.day[dish.id] || {};
        const status = computeStatus(dish, r);
        const isHot = (dish.type || '').startsWith('hot');
        const spec = dish.spec || {};

        const tempSpec = isHot
            ? `≥${spec.tempMin ?? 65}°C`
            : `≤${spec.tempMax ?? 8}°C`;
        const weightSpec = spec.weightTarget
            ? `${spec.weightTarget}g ±${spec.weightTolerance ?? 25}`
            : '—';

        const tempStatus = (function() {
            if (r.temp == null || r.temp === '') return 'empty';
            const t = Number(r.temp);
            if (isHot) {
                const min = spec.tempMin ?? 65;
                if (t >= min) return 'ok';
                if (t >= min - 3) return 'warn';
                return 'fail';
            }
            const max = spec.tempMax ?? 8;
            if (t <= max) return 'ok';
            if (t <= max + 2) return 'warn';
            return 'fail';
        })();

        const weightStatus = (function() {
            if (r.weight == null || r.weight === '' || !spec.weightTarget) return 'empty';
            const w = Number(r.weight);
            const diff = Math.abs(w - spec.weightTarget);
            const tol = spec.weightTolerance ?? 25;
            if (diff <= tol) return 'ok';
            if (diff <= tol * 2) return 'warn';
            return 'fail';
        })();

        return `
            <article class="dish-card is-${status === 'empty' ? 'empty' : status}" data-id="${dish.id}">
                <div class="row-head">
                    <div class="row-meta">
                        <span class="dish-letter">${escapeHtml(dish.letter || dish.id)}</span>
                        <div>
                            <div class="dish-name">${escapeHtml(dish.name)}</div>
                            <div class="dish-spec">${escapeHtml(humanType(dish.type))} · ${tempSpec} · ${weightSpec}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span class="status-pill ${toneClass[status]}">${statusLabel(status)}</span>
                        <button class="btn btn-ghost btn-icon" data-action="open-detail" data-id="${dish.id}" aria-label="More">⋯</button>
                    </div>
                </div>

                <div class="row-numbers">
                    <label class="metric is-${tempStatus}">
                        <span class="metric-label">Temperature</span>
                        <span class="metric-value-row">
                            <input class="metric-value num" inputmode="decimal"
                                   data-edit="temp" data-id="${dish.id}"
                                   value="${r.temp ?? ''}" placeholder="—"
                                   aria-label="Temperature for ${escapeHtml(dish.name)}" />
                            <span class="metric-unit">°C</span>
                        </span>
                    </label>

                    <label class="metric is-${weightStatus}">
                        <span class="metric-label">Weight (actual)</span>
                        <span class="metric-value-row">
                            <input class="metric-value num" inputmode="numeric"
                                   data-edit="weight" data-id="${dish.id}"
                                   value="${r.weight ?? ''}" placeholder="—"
                                   aria-label="Weight for ${escapeHtml(dish.name)}" />
                            <span class="metric-unit">g</span>
                        </span>
                    </label>

                    <label class="metric">
                        <span class="metric-label">Stock</span>
                        <span class="metric-value-row">
                            <input class="metric-value num" inputmode="numeric"
                                   data-edit="stock" data-id="${dish.id}"
                                   value="${r.stock ?? ''}" placeholder="—"
                                   aria-label="Stock for ${escapeHtml(dish.name)}" />
                            <span class="metric-unit">pcs</span>
                        </span>
                    </label>
                </div>

                <div class="row-notes">
                    <input class="notes-input" type="text"
                           data-edit="note" data-id="${dish.id}"
                           value="${escapeHtml(noteOf(r))}"
                           placeholder="Chef's note · what should the next shift know?" />
                </div>
            </article>
        `;
    }).join('');

    // Wire up inline edits
    grid.querySelectorAll('[data-edit]').forEach(el => {
        const dishId = el.getAttribute('data-id');
        const field = el.getAttribute('data-edit');

        const commit = () => {
            const val = el.value.trim();
            if (field === 'note') {
                const arr = val ? [val] : [];
                patchReading(dishId, { notes: arr });
            } else {
                const num = val === '' ? null : Number(val);
                if (val !== '' && Number.isNaN(num)) return;  // ignore non-numeric
                patchReading(dishId, { [field]: num });
            }
        };

        el.addEventListener('change', commit);
        el.addEventListener('blur', commit);
        el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
    });

    // Wire detail buttons
    grid.querySelectorAll('[data-action="open-detail"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            showDetail(btn.getAttribute('data-id'));
        });
    });
}

function noteOf(reading) {
    if (!reading) return '';
    if (Array.isArray(reading.notes) && reading.notes.length) return reading.notes[0];
    return '';
}

function humanType(t) {
    return ({ 'hot-meat': 'Hot · meat', 'hot-veg': 'Hot · veg', 'cold': 'Cold', 'rte': 'Ready-to-eat' })[t] || (t || 'Dish');
}

function renderSummaryTable() {
    const tbody = document.getElementById('summary-table-body');
    if (!tbody) return;

    const dateLabel = document.getElementById('summary-date-label');
    if (dateLabel) dateLabel.textContent = humanDate(state.dayIso);

    const rows = state.dishes.map(dish => {
        const r = state.day[dish.id] || {};
        const status = computeStatus(dish, r);
        const tempCell = r.temp != null && r.temp !== '' ? `${r.temp}°C` : '—';
        const weightCell = r.weight != null && r.weight !== '' && dish.spec?.weightTarget
            ? `${r.weight} / ${dish.spec.weightTarget} g`
            : '—';
        return `
            <tr data-id="${dish.id}" style="cursor:pointer;" onclick="window.__qc.showDetail('${dish.id}')">
                <td>
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <span class="col-letter">${escapeHtml(dish.letter || dish.id)}</span>
                        <span class="col-dish">${escapeHtml(dish.name)}</span>
                    </div>
                </td>
                <td><span class="status-pill ${toneClass[status]}">${statusLabel(status)}</span></td>
                <td><span class="col-numeric">${tempCell}</span></td>
                <td><span class="col-numeric">${weightCell}</span></td>
                <td class="col-note">${escapeHtml(noteOf(r) || '—')}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows || `<tr><td colspan="5" style="text-align:center; padding: var(--r-7); color: var(--mute);">No dishes on the pass sheet yet.</td></tr>`;
}

function renderAlertBanner() {
    const host = document.getElementById('alert-banner-host');
    if (!host) return;

    const issues = state.dishes
        .map(d => ({ dish: d, status: computeStatus(d, state.day[d.id] || {}) }))
        .filter(x => x.status === 'fail' || x.status === 'warn');

    if (issues.length === 0) {
        const hasAnyReading = state.dishes.some(d => {
            const r = state.day[d.id] || {};
            return r.temp != null && r.temp !== '';
        });
        if (!hasAnyReading) {
            host.innerHTML = `
                <div class="alert-banner is-ok">
                    <div class="alert-icon">i</div>
                    <div class="alert-body">
                        <div class="alert-title">Ready when you are.</div>
                        <div class="alert-detail">No readings logged yet for ${humanDate(state.dayIso)}. Start by tapping a temperature on any dish below.</div>
                    </div>
                </div>
            `;
        } else {
            host.innerHTML = `
                <div class="alert-banner is-ok">
                    <div class="alert-icon">✓</div>
                    <div class="alert-body">
                        <div class="alert-title">All systems nominal.</div>
                        <div class="alert-detail">Every reading on ${humanDate(state.dayIso)} is within spec.</div>
                    </div>
                </div>
            `;
        }
        return;
    }

    const failCount = issues.filter(i => i.status === 'fail').length;
    const warnCount = issues.filter(i => i.status === 'warn').length;
    const tone = failCount > 0 ? 'fail' : 'warn';

    const summary = [
        failCount ? `${failCount} hold` + (failCount > 1 ? 's' : '') : null,
        warnCount ? `${warnCount} watch` + (warnCount > 1 ? 'es' : '') : null
    ].filter(Boolean).join(' · ');

    const top = issues[0];
    const r = state.day[top.dish.id] || {};
    host.innerHTML = `
        <div class="alert-banner ${tone === 'fail' ? '' : 'is-warn'}">
            <div class="alert-icon">!</div>
            <div class="alert-body">
                <div class="alert-title">${summary} on the pass</div>
                <div class="alert-detail">${escapeHtml(top.dish.name)} reading ${r.temp ?? '—'}°C · ${humanDate(state.dayIso)}.</div>
            </div>
            <button class="btn btn-ghost" onclick="window.__qc.openIssues()">Review</button>
        </div>
    `;
}

function renderSidebarCounts() {
    const total = state.dishes.length;
    const issues = state.dishes.filter(d => {
        const s = computeStatus(d, state.day[d.id] || {});
        return s === 'fail' || s === 'warn';
    });
    const issueCount = issues.length;
    const failCount = issues.filter(d => computeStatus(d, state.day[d.id] || {}) === 'fail').length;

    const t = document.getElementById('count-total');
    const i = document.getElementById('count-issues');
    if (t) t.textContent = String(total);
    if (i) {
        i.textContent = String(issueCount);
        i.classList.remove('is-fail', 'is-warn');
        if (failCount > 0) i.classList.add('is-fail');
        else if (issueCount > 0) i.classList.add('is-warn');
    }
}

/* ---------------- View routing ---------------- */

function setActiveNav(name) {
    document.querySelectorAll('.sidebar .nav-link').forEach(b => b.classList.remove('is-active'));
    const id = ({ dashboard: 'nav-dashboard', lifecycle: 'nav-lifecycle', warmers: 'nav-warmers', issues: 'nav-issues' })[name];
    const el = id && document.getElementById(id);
    if (el) el.classList.add('is-active');
}

function setPageTitle(text) {
    const el = document.getElementById('page-title');
    if (el) el.textContent = text;
}

function showView(name) {
    if (name === 'issues') {
        // Opens drawer instead of switching view
        openIssuesDrawer();
        return;
    }

    state.view = name;

    // Toggle dashboard-only sections + workspace head copy.
    const isDashboard = name === 'dashboard';
    document.querySelectorAll('[data-dashboard-only]').forEach(el => {
        el.style.display = isDashboard ? '' : 'none';
    });
    const meta = document.getElementById('workspace-meta');
    if (meta) meta.style.display = isDashboard ? '' : 'none';
    const idx = document.getElementById('workspace-index');
    const tt  = document.getElementById('workspace-title');

    if (name === 'dashboard') {
        setPageTitle('Pass Sheet · Daily');
        if (idx) idx.textContent = '№ 02';
        if (tt)  tt.textContent  = 'Live Pass Sheet';
        renderDashboardOnly();
    } else if (name === 'lifecycle') {
        setPageTitle('Lifecycle · Dish Tracking');
        if (idx) idx.textContent = 'Movement';
        if (tt)  tt.textContent  = 'Dish lifecycle across stages';
        renderLifecycleView();
    } else if (name === 'warmers') {
        setPageTitle('Warmer Management · Live');
        if (idx) idx.textContent = 'Equipment';
        if (tt)  tt.textContent  = 'Live warmer slot temperatures';
        renderWarmerView();
    }

    setActiveNav(name);
}

/* ---------------- Issues drawer ---------------- */

function openIssuesDrawer() {
    const drawer = document.getElementById('issues-drawer');
    const scrim = document.getElementById('issues-scrim');
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    renderIssuesDrawer();
}

function closeIssuesDrawer() {
    document.getElementById('issues-drawer').classList.remove('is-open');
    document.getElementById('issues-scrim').classList.remove('is-open');
}

function renderIssuesDrawer() {
    const body = document.getElementById('issues-body');
    if (!body) return;

    const issues = state.dishes
        .map(d => ({ dish: d, reading: state.day[d.id] || {}, status: computeStatus(d, state.day[d.id] || {}) }))
        .filter(x => x.status === 'fail' || x.status === 'warn');

    if (issues.length === 0) {
        body.innerHTML = `
            <div class="card card-padded" style="text-align: center; padding: var(--r-6);">
                <div class="eyebrow eyebrow-gold">Nothing on hold</div>
                <p class="lede" style="margin: 12px 0 0 0;">Every reading is within spec for ${humanDate(state.dayIso)}.</p>
            </div>
        `;
        return;
    }

    body.innerHTML = issues.map(({ dish, reading, status }) => `
        <div class="issue-row is-${status}" onclick="window.__qc.showDetail('${dish.id}')" style="cursor:pointer;">
            <span class="issue-letter">${escapeHtml(dish.letter || dish.id)}</span>
            <div class="issue-body">
                <div class="issue-title">${escapeHtml(dish.name)}</div>
                <div class="issue-detail">Temp ${reading.temp ?? '—'}°C · weight ${reading.weight ?? '—'}g · ${escapeHtml(noteOf(reading) || '—')}</div>
            </div>
            <span class="status-pill ${toneClass[status]}">${statusLabel(status)}</span>
        </div>
    `).join('');
}

/* ---------------- Date picker ---------------- */

function setDate(iso) {
    state.dayIso = iso;
    subscribeToDay(iso);
    setDateText();
    document.getElementById('date-input').value = iso;
}

function shiftDate(delta) {
    const d = new Date(state.dayIso + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
}

function setDateText() {
    const text = document.getElementById('date-text');
    const display = document.getElementById('date-display');
    const isToday = state.dayIso === todayIso();
    if (text) text.textContent = isToday ? `${humanDate(state.dayIso)} · today` : humanDate(state.dayIso);
    if (display) display.textContent = humanDate(state.dayIso);
    const todayBtn = document.getElementById('date-today');
    if (todayBtn) todayBtn.style.opacity = isToday ? '0.4' : '1';
}

function humanDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------------- Detail / settings modals ---------------- */

function showDetail(id) {
    const dish = state.dishes.find(d => d.id === id);
    if (!dish) return;
    const r = state.day[id] || {};
    const status = computeStatus(dish, r);
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
        <div class="modal-panel animate-in" role="dialog" aria-labelledby="detail-title">
            <div class="modal-cover">
                <span class="cover-letter">${escapeHtml(dish.letter || dish.id)}</span>
                <div class="eyebrow eyebrow-gold">Quality control file · ${humanDate(state.dayIso)}</div>
                <h3 id="detail-title" class="display-l display-italic" style="margin-top: 8px;">${escapeHtml(dish.name)}</h3>
                <div style="display:flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
                    <span class="status-pill ${toneClass[status]}">${statusLabel(status)}</span>
                    <span class="chip"><span class="dot"></span>${escapeHtml(humanType(dish.type))}</span>
                    ${dish.warmerId ? `<span class="chip"><span class="dot"></span>Warmer ${escapeHtml(dish.warmerId)}</span>` : ''}
                </div>
                <button class="modal-close" aria-label="Close" onclick="window.__qc.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <div class="grid cols-2 gap-3">
                    <div class="field">
                        <label class="field-label">Temperature (°C)</label>
                        <input class="input num" type="number" step="0.1" id="m-temp" value="${r.temp ?? ''}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Weight (g)</label>
                        <input class="input num" type="number" step="1" id="m-weight" value="${r.weight ?? ''}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Stock</label>
                        <input class="input num" type="number" step="1" id="m-stock" value="${r.stock ?? ''}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Warmer</label>
                        <input class="input" id="m-warmer" value="${escapeHtml(dish.warmerId || '')}" />
                    </div>
                </div>

                <div class="field" style="margin-top: var(--r-4);">
                    <label class="field-label">Chef's note</label>
                    <textarea class="textarea" rows="3" id="m-note">${escapeHtml(noteOf(r))}</textarea>
                </div>

                <hr class="rule" style="margin: var(--r-5) 0;"/>

                <div class="eyebrow">Specification</div>
                <div class="grid cols-3 gap-3" style="margin-top: 10px;">
                    <div class="field">
                        <label class="field-label">Type</label>
                        <select class="select" id="m-type">
                            <option value="hot-meat" ${dish.type === 'hot-meat' ? 'selected' : ''}>Hot · meat</option>
                            <option value="hot-veg"  ${dish.type === 'hot-veg'  ? 'selected' : ''}>Hot · veg</option>
                            <option value="cold"     ${dish.type === 'cold'     ? 'selected' : ''}>Cold</option>
                            <option value="rte"      ${dish.type === 'rte'      ? 'selected' : ''}>Ready-to-eat</option>
                        </select>
                    </div>
                    <div class="field">
                        <label class="field-label">Temp min (hot)</label>
                        <input class="input num" type="number" step="0.5" id="m-tempmin" value="${dish.spec?.tempMin ?? 65}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Temp max (cold)</label>
                        <input class="input num" type="number" step="0.5" id="m-tempmax" value="${dish.spec?.tempMax ?? 8}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Weight target (g)</label>
                        <input class="input num" type="number" step="1" id="m-wt" value="${dish.spec?.weightTarget ?? ''}" />
                    </div>
                    <div class="field">
                        <label class="field-label">Weight ± (g)</label>
                        <input class="input num" type="number" step="1" id="m-wtol" value="${dish.spec?.weightTolerance ?? 25}" />
                    </div>
                </div>

                <div style="display:flex; gap: 10px; margin-top: var(--r-5);">
                    <button class="btn btn-danger" id="m-delete">Remove dish</button>
                    <span style="flex:1;"></span>
                    <button class="btn btn-ghost" onclick="window.__qc.closeModal()">Cancel</button>
                    <button class="btn btn-solid-gold" id="m-save">Save</button>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('m-save').onclick = async () => {
        const partial = {
            temp: numOrNull(document.getElementById('m-temp').value),
            weight: numOrNull(document.getElementById('m-weight').value),
            stock: numOrNull(document.getElementById('m-stock').value),
            notes: document.getElementById('m-note').value.trim() ? [document.getElementById('m-note').value.trim()] : []
        };
        const updatedDish = {
            ...dish,
            warmerId: document.getElementById('m-warmer').value.trim() || null,
            type: document.getElementById('m-type').value,
            spec: {
                tempMin: numOrNull(document.getElementById('m-tempmin').value),
                tempMax: numOrNull(document.getElementById('m-tempmax').value),
                weightTarget: numOrNull(document.getElementById('m-wt').value),
                weightTolerance: numOrNull(document.getElementById('m-wtol').value)
            }
        };
        try {
            await Promise.all([
                saveDish(updatedDish),
                saveReading(state.dayIso, dish.id, partial)
            ]);
            toast('Saved', 'ok');
            closeModal();
        } catch (e) {
            toast('Save failed', 'fail');
            console.error(e);
        }
    };

    document.getElementById('m-delete').onclick = async () => {
        if (!confirm(`Remove ${dish.name} from the master list?`)) return;
        try { await deleteDish(dish.id); toast('Removed', 'ok'); closeModal(); }
        catch (e) { toast('Remove failed', 'fail'); console.error(e); }
    };
}

function showAddDish() {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="modal-panel animate-in" role="dialog">
            <div class="modal-cover">
                <div class="eyebrow eyebrow-gold">New dish</div>
                <h3 class="display-m display-italic" style="margin-top: 8px;">Add a dish to the pass sheet</h3>
                <button class="modal-close" aria-label="Close" onclick="window.__qc.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="grid cols-2 gap-3">
                    <div class="field">
                        <label class="field-label">Dish letter</label>
                        <input class="input" id="n-letter" placeholder="E" maxlength="2" />
                    </div>
                    <div class="field">
                        <label class="field-label">Type</label>
                        <select class="select" id="n-type">
                            <option value="hot-meat">Hot · meat</option>
                            <option value="hot-veg">Hot · veg</option>
                            <option value="cold">Cold</option>
                            <option value="rte">Ready-to-eat</option>
                        </select>
                    </div>
                </div>

                <div class="field" style="margin-top: var(--r-3);">
                    <label class="field-label">Dish name</label>
                    <input class="input" id="n-name" placeholder="e.g. Saffron Lentil Stew" />
                </div>

                <div class="grid cols-3 gap-3" style="margin-top: var(--r-3);">
                    <div class="field">
                        <label class="field-label">Temp min (hot)</label>
                        <input class="input num" type="number" step="0.5" id="n-tempmin" value="65" />
                    </div>
                    <div class="field">
                        <label class="field-label">Temp max (cold)</label>
                        <input class="input num" type="number" step="0.5" id="n-tempmax" value="8" />
                    </div>
                    <div class="field">
                        <label class="field-label">Warmer #</label>
                        <input class="input" id="n-warmer" placeholder="05" />
                    </div>
                    <div class="field">
                        <label class="field-label">Weight target (g)</label>
                        <input class="input num" type="number" step="1" id="n-wt" value="300" />
                    </div>
                    <div class="field">
                        <label class="field-label">Weight ± (g)</label>
                        <input class="input num" type="number" step="1" id="n-wtol" value="25" />
                    </div>
                </div>

                <div style="display:flex; gap: 10px; margin-top: var(--r-5);">
                    <span style="flex:1;"></span>
                    <button class="btn btn-ghost" onclick="window.__qc.closeModal()">Cancel</button>
                    <button class="btn btn-solid-gold" id="n-save">Add dish</button>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('n-save').onclick = async () => {
        const letter = (document.getElementById('n-letter').value || '').trim().toUpperCase();
        const name = document.getElementById('n-name').value.trim();
        if (!name) { toast('Name required', 'fail'); return; }
        const id = letter || ('D' + Date.now().toString(36).toUpperCase().slice(-4));
        const dish = {
            id, letter: letter || id,
            name,
            type: document.getElementById('n-type').value,
            warmerId: document.getElementById('n-warmer').value.trim() || null,
            spec: {
                tempMin: numOrNull(document.getElementById('n-tempmin').value),
                tempMax: numOrNull(document.getElementById('n-tempmax').value),
                weightTarget: numOrNull(document.getElementById('n-wt').value),
                weightTolerance: numOrNull(document.getElementById('n-wtol').value)
            }
        };
        try { await saveDish(dish); toast('Dish added', 'ok'); closeModal(); }
        catch (e) { toast('Add failed', 'fail'); console.error(e); }
    };
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
    modal.innerHTML = '';
}

/* ---------------- Export / print ---------------- */

function exportReport() {
    const today = humanDate(state.dayIso);
    const sc = computeScorecard();
    const lines = [
        `# BB Pass Sheet — ${today}`,
        ``,
        `## Scorecard`,
        ...sc.map(s => `- ${s.label}: ${s.rate}  (${s.pass})`),
        ``,
        `## Dishes`,
        ...state.dishes.map(d => {
            const r = state.day[d.id] || {};
            const s = computeStatus(d, r);
            return `- [${d.letter || d.id}] ${d.name} · ${r.temp ?? '—'}°C / ${r.weight ?? '—'}g · ${s.toUpperCase()}  — ${noteOf(r) || ''}`;
        }),
        ``,
        `Generated by Bella & Bona QC.`
    ];
    const txt = lines.join('\n');
    navigator.clipboard.writeText(txt).then(() => toast('Report copied to clipboard', 'ok'));
}

/* ---------------- Helpers ---------------- */

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function numOrNull(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function showLoader(visible) {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.classList.toggle('hidden', !visible);
}

function toast(msg, kind) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const t = document.createElement('div');
    t.className = `toast ${kind === 'fail' ? 'is-fail' : kind === 'ok' ? 'is-ok' : ''}`;
    t.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(msg)}</span>`;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 280ms ease'; }, 1600);
    setTimeout(() => t.remove(), 2000);
}

/* ---------------- Event wiring ---------------- */

function wire() {
    document.getElementById('nav-dashboard').onclick  = () => showView('dashboard');
    document.getElementById('nav-lifecycle').onclick  = () => showView('lifecycle');
    document.getElementById('nav-warmers').onclick    = () => showView('warmers');
    document.getElementById('nav-issues').onclick     = () => showView('issues');
    document.getElementById('nav-settings').onclick   = () => showAddDish();
    document.getElementById('add-dish-btn').onclick   = () => showAddDish();

    // Filters
    ['all','hot','cold','issues'].forEach(f => {
        const el = document.getElementById(`filter-${f}`);
        if (el) el.onclick = () => {
            state.filter = f;
            document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('is-active'));
            el.classList.add('is-active');
            renderDashboardOnly();
        };
    });

    // Date controls
    document.getElementById('date-prev').onclick   = () => shiftDate(-1);
    document.getElementById('date-next').onclick   = () => shiftDate(+1);
    document.getElementById('date-today').onclick  = () => setDate(todayIso());
    const dateInput = document.getElementById('date-input');
    dateInput.value = state.dayIso;
    dateInput.onchange = e => { if (e.target.value) setDate(e.target.value); };

    // Issues drawer close
    document.getElementById('issues-close').onclick = closeIssuesDrawer;
    document.getElementById('issues-scrim').onclick = closeIssuesDrawer;

    // Modal scrim close
    document.getElementById('modal-container').onclick = e => {
        if (e.target.id === 'modal-container') closeModal();
    };

    // Export & print
    document.getElementById('export-team-btn').onclick = exportReport;
    document.getElementById('print-btn').onclick = () => window.print();

    // Keyboard: Tab between dish inputs feels natural already; add Cmd/Ctrl+P trap
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeIssuesDrawer();
        }
    });
}

/* ---------------- Public hooks ---------------- */

window.__qc = {
    showDetail,
    openIssues: openIssuesDrawer,
    openAddDish: showAddDish,
    closeModal
};

/* ---------------- Boot ---------------- */

wire();
bootstrap();
