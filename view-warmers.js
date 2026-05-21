/**
 * Warmer Management View
 * Replicating Sheet 3 of the QC Report
 */

const warmerData = [
    { 
        id: '01', set: '75', dispatch: '08:30', 
        slots: {
            TL: { label: 'TL', temp: '66', status: 'ok', dish: 'Dish A' },
            TM: { label: 'TM', temp: '66', status: 'ok', dish: 'Dish A' },
            TR: { label: 'TR', temp: '65', status: 'ok', dish: 'Dish A' },
            BL: { label: 'BL', temp: '70', status: 'ok', dish: 'Dish A' },
            BM: { label: 'BM', temp: '65', status: 'ok', dish: 'Dish A' },
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

export function renderWarmerView() {
    const grid = document.getElementById('hot-dish-grid');
    if (!grid) return;

    // Reset grid classes for warmer layout
    const parentContainer = grid.parentElement;
    parentContainer.classList.remove('flex', 'flex-col');
    parentContainer.classList.add('grid', 'grid-cols-1', 'lg:grid-cols-2', 'xl:grid-cols-3', 'gap-6');

    grid.innerHTML = warmerData.map(warmer => {
        return `
            <div class="glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col shadow-2xl">
                <!-- Warmer Header -->
                <div class="bg-indigo-900/40 p-4 border-b border-white/5">
                    <div class="flex justify-between items-center text-white">
                        <h3 class="font-black italic text-sm tracking-tighter uppercase">Warmer No. ${warmer.id}</h3>
                        <div class="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                            Set: ${warmer.set}°C | Dispatch: ${warmer.dispatch}
                        </div>
                    </div>
                </div>

                <!-- Warmer Grid (Slots) -->
                <div class="p-4 grid grid-cols-3 gap-2 bg-black/20">
                    ${['TL', 'TM', 'TR', 'BL', 'BM', 'BR'].map(slotKey => {
                        const slot = warmer.slots[slotKey] || { label: slotKey, temp: '—', status: 'empty' };
                        const colorClass = getStatusColors(slot.status);
                        
                        return `
                            <div class="${colorClass.bg} ${colorClass.border} border rounded-lg p-3 flex flex-col items-center justify-center min-h-[90px] transition-all hover:bg-white/5">
                                <span class="text-[8px] font-bold text-slate-500 uppercase self-start mb-1">${slot.label}</span>
                                <span class="text-xl font-black ${colorClass.text} italic tracking-tighter">${slot.temp}${slot.temp !== '—' ? '°C' : ''}</span>
                                <span class="text-[7px] font-black uppercase mt-1 ${colorClass.text}">${slot.status}</span>
                                ${slot.dish ? `<span class="text-[8px] font-bold text-slate-500 mt-2">${slot.dish}</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusColors(status) {
    switch (status) {
        case 'ok': return { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' };
        case 'warn': return { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400' };
        case 'fail': return { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400' };
        default: return { bg: 'bg-white/2', border: 'border-white/5', text: 'text-slate-700' };
    }
}
