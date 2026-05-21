/* =====================================================================
   Warmer view — live warmer slot temperatures
   ===================================================================== */

const warmerData = [
    {
        id: '01', set: '75', dispatch: '08:30',
        slots: {
            TL: { label: 'TL', temp: '66', status: 'ok',   dish: 'Dish A' },
            TM: { label: 'TM', temp: '66', status: 'ok',   dish: 'Dish A' },
            TR: { label: 'TR', temp: '65', status: 'ok',   dish: 'Dish A' },
            BL: { label: 'BL', temp: '70', status: 'ok',   dish: 'Dish A' },
            BM: { label: 'BM', temp: '65', status: 'ok',   dish: 'Dish A' },
            BR: { label: 'BR', temp: '61', status: 'warn', dish: 'Dish A' }
        }
    },
    {
        id: '02', set: '75', dispatch: '08:35',
        slots: {
            TM: { label: 'TM', temp: '59', status: 'fail', dish: 'Dish A' },
            TR: { label: 'TR', temp: '58', status: 'fail', dish: 'Dish A' },
            BL: { label: 'BL', temp: '59', status: 'fail', dish: 'Dish B' },
            BM: { label: 'BM', temp: '57', status: 'fail', dish: 'Dish B' },
            BR: { label: 'BR', temp: '53', status: 'fail', dish: 'Dish B' }
        }
    },
    {
        id: '03', set: '65', dispatch: '08:40',
        slots: {
            TM: { label: 'TM', temp: '55', status: 'fail', dish: 'Dish C' },
            TR: { label: 'TR', temp: '53', status: 'fail', dish: 'Dish C' },
            BL: { label: 'BL', temp: '59', status: 'fail', dish: 'Dish C' },
            BM: { label: 'BM', temp: '52', status: 'fail', dish: 'Dish C' },
            BR: { label: 'BR', temp: '58', status: 'fail', dish: 'Dish C' }
        }
    }
];

const slotOrder = ['TL','TM','TR','BL','BM','BR'];

export function renderWarmerView() {
    const container = document.getElementById('hot-dish-grid');
    if (!container) return;

    container.className = 'grid cols-3 gap-5';
    container.style.cssText = '';

    container.innerHTML = warmerData.map(w => `
        <article class="warmer-card">
            <div class="warmer-head">
                <span class="id">Warmer ${w.id}</span>
                <div style="display:flex; gap: 8px; flex-direction:column; align-items:end;">
                    <span class="chip"><span class="dot"></span>Set ${w.set}°C</span>
                    <span class="caption">Dispatch ${w.dispatch}</span>
                </div>
            </div>
            <div class="warmer-grid">
                ${slotOrder.map(key => {
                    const slot = w.slots[key];
                    if (!slot) {
                        return `<div class="slot is-empty"><span class="slot-label">${key}</span><span class="caption">—</span></div>`;
                    }
                    return `
                        <div class="slot is-${slot.status === 'ok' ? 'ok' : slot.status === 'warn' ? 'warn' : 'fail'}">
                            <span class="slot-label">${slot.label}</span>
                            <span class="slot-temp">${slot.temp}°</span>
                            <span class="slot-dish">${slot.dish}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </article>
    `).join('');
}
