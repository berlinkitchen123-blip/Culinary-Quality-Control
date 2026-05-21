/**
 * Dish Lifecycle Tracking View
 * Replicating Sheet 4 of the QC Report
 */

const lifecycleData = [
    { 
        letter: 'A', name: 'Indian Butter Chicken', warmer: '01', 
        stages: {
            assembly: { temp: '71.0', target: '≥65', time: '05:22', status: 'pass' },
            warmer: { id: '#01', set: '75' },
            qc: { temp: '64.3', range: '60-64', time: '08:10', status: 'warn' },
            dispatch: { temp: '62.0', avg: '62.0', time: '08:35', status: 'warn' }
        }
    },
    { 
        letter: 'B', name: 'Golden Tofu Coconut Curry', warmer: '02', 
        stages: {
            assembly: { temp: '44.7', target: '<65', time: '07:04', status: 'fail' },
            warmer: { id: '#02', set: '75' },
            qc: { temp: '55.5', range: '<65', time: '08:10', status: 'fail' },
            dispatch: { temp: '56.3', avg: '56.3', time: '08:35', status: 'fail' }
        }
    },
    { 
        letter: 'C', name: 'Egg Channa Masala', warmer: '03', 
        stages: {
            assembly: { temp: '54.0', target: '<65', time: '06:02', status: 'fail' },
            warmer: { id: '#03', set: '65' },
            qc: { temp: '60.0', range: '60-64', time: '08:10', status: 'warn' },
            dispatch: { temp: '55.4', avg: '55.4', time: '08:40', status: 'fail' }
        }
    }
];

export function renderLifecycleView() {
    const container = document.getElementById('hot-dish-grid'); // Reusing grid container for now
    if (!container) return;

    // Change layout to full-width stacking
    const parentContainer = container.parentElement;
    parentContainer.classList.remove('grid-cols-2', 'lg:grid-cols-4');
    parentContainer.classList.add('flex', 'flex-col', 'gap-8');

    container.innerHTML = lifecycleData.map(dish => {
        return `
            <div class="pro-card p-0 overflow-hidden border border-white/5 shadow-2xl">
                <!-- Dish Header -->
                <div class="bg-black/60 border-b border-white/5 p-4 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-black text-xs border border-blue-500/30">${dish.letter}</div>
                        <h3 class="text-sm font-black text-white italic uppercase tracking-tighter">${dish.name}</h3>
                    </div>
                    <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Warmer #${dish.warmer} | Set: ${dish.stages.warmer.set}°C
                    </div>
                </div>

                <!-- Timeline Row -->
                <div class="p-6 grid grid-cols-4 gap-4 relative">
                    <!-- Progress Lines (Connectors) -->
                    <div class="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2 z-0 hidden lg:block"></div>

                    <!-- Stage 1: Assembly -->
                    ${renderStageCard('ASSEMBLY', dish.stages.assembly, 'emerald')}

                    <!-- Stage 2: To Warmer -->
                    <div class="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center z-10">
                        <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">TO WARMER</span>
                        <div class="text-2xl font-black text-slate-700">——</div>
                        <span class="text-[9px] font-bold text-slate-500 mt-1">#${dish.warmer}</span>
                    </div>

                    <!-- Stage 3: QC Check -->
                    ${renderStageCard('QC CHECK', dish.stages.qc, dish.stages.qc.status === 'warn' ? 'amber' : 'rose')}

                    <!-- Stage 4: Dispatch -->
                    ${renderStageCard('DISPATCH', dish.stages.dispatch, dish.stages.dispatch.status === 'warn' ? 'amber' : 'rose')}
                </div>
            </div>
        `;
    }).join('');
}

function renderStageCard(label, data, color) {
    const colorMap = {
        emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
        amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
        rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-400' }
    };
    const c = colorMap[color] || colorMap.emerald;

    return `
        <div class="${c.bg} ${c.border} border rounded-2xl p-4 z-10 flex flex-col items-center">
            <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">${label}</span>
            <span class="text-2xl font-black text-white italic tracking-tighter">${data.temp}°C</span>
            <div class="flex items-center gap-2 mt-2">
                <span class="text-[8px] font-bold text-slate-400">${data.time}</span>
                <span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${c.badge}">${data.status}</span>
            </div>
        </div>
    `;
}
