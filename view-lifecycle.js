/* =====================================================================
   Lifecycle view — dish stage tracking
   ===================================================================== */

const lifecycleData = [
    {
        letter: 'A', name: 'Indian Butter Chicken', warmer: '01',
        stages: {
            assembly: { temp: '71.0', target: '≥65', time: '05:22', status: 'pass' },
            warmer:   { id: '01', set: '75' },
            qc:       { temp: '64.3', range: '60–64', time: '08:10', status: 'warn' },
            dispatch: { temp: '62.0', avg: '62.0',  time: '08:35', status: 'warn' }
        }
    },
    {
        letter: 'B', name: 'Golden Tofu Coconut Curry', warmer: '02',
        stages: {
            assembly: { temp: '44.7', target: '≥65', time: '07:04', status: 'fail' },
            warmer:   { id: '02', set: '75' },
            qc:       { temp: '55.5', range: '<65',  time: '08:10', status: 'fail' },
            dispatch: { temp: '56.3', avg: '56.3', time: '08:35', status: 'fail' }
        }
    },
    {
        letter: 'C', name: 'Egg Channa Masala', warmer: '03',
        stages: {
            assembly: { temp: '54.0', target: '≥65', time: '06:02', status: 'fail' },
            warmer:   { id: '03', set: '65' },
            qc:       { temp: '60.0', range: '60–64', time: '08:10', status: 'warn' },
            dispatch: { temp: '55.4', avg: '55.4', time: '08:40', status: 'fail' }
        }
    }
];

const toneFromStage = (s) => s === 'pass' ? 'pass' : s === 'warn' ? 'warn' : 'fail';

export function renderLifecycleView() {
    const container = document.getElementById('hot-dish-grid');
    if (!container) return;

    container.className = '';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '24px';

    container.innerHTML = lifecycleData.map(dish => `
        <article class="timeline-card">
            <header class="head">
                <div style="display:flex; align-items:center; gap: 12px;">
                    <span class="col-letter">${dish.letter}</span>
                    <span class="col-dish">${dish.name}</span>
                </div>
                <div style="display:flex; gap: 8px;">
                    <span class="chip"><span class="dot"></span>Warmer ${dish.warmer}</span>
                    <span class="chip"><span class="dot"></span>Set ${dish.stages.warmer.set}°C</span>
                </div>
            </header>

            <div class="stages">
                <div class="stage is-${toneFromStage(dish.stages.assembly.status)}">
                    <span class="stage-name">Assembly</span>
                    <span class="stage-figure">${dish.stages.assembly.temp}°</span>
                    <span class="stage-meta">target ${dish.stages.assembly.target} · ${dish.stages.assembly.time}</span>
                </div>
                <div class="stage" style="background: var(--surface-2);">
                    <span class="stage-name">Warmer</span>
                    <span class="stage-figure">#${dish.stages.warmer.id}</span>
                    <span class="stage-meta">set ${dish.stages.warmer.set}°C</span>
                </div>
                <div class="stage is-${toneFromStage(dish.stages.qc.status)}">
                    <span class="stage-name">QC</span>
                    <span class="stage-figure">${dish.stages.qc.temp}°</span>
                    <span class="stage-meta">range ${dish.stages.qc.range} · ${dish.stages.qc.time}</span>
                </div>
                <div class="stage is-${toneFromStage(dish.stages.dispatch.status)}">
                    <span class="stage-name">Dispatch</span>
                    <span class="stage-figure">${dish.stages.dispatch.temp}°</span>
                    <span class="stage-meta">avg ${dish.stages.dispatch.avg}° · ${dish.stages.dispatch.time}</span>
                </div>
            </div>
        </article>
    `).join('');
}
