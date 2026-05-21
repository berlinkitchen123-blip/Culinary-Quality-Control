/**
 * 100% Match UI Logic for Culinary QC
 */

const mockData = [
    { id: '1', name: 'Zucchini Gratin', type: 'vegetarian', letter: 'A', status: 'ok', temp: '75.2', stock: '12', weight: '340/320', feedbacks: ['Excellent texture', 'Standard batch'] },
    { id: '2', name: 'Chicken Tikka', type: 'meat', letter: 'B', status: 'warning', temp: '71.5', stock: '5', weight: '210/200', feedbacks: ['Slightly dry', 'Check marinade'] },
    { id: '3', name: 'Red Thai Curry', type: 'spicy', letter: 'C', status: 'error', temp: '68.9', stock: '0', weight: '450/440', feedbacks: ['Temperature below spec', 'Batch discarded'] },
    { id: '4', name: 'Herb Roasted Pork', type: 'heavy', letter: 'D', status: 'ok', temp: '76.0', stock: '24', weight: '250/250', feedbacks: ['Perfect'] }
];

const statusStyles = {
    ok: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    error: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/20' }
};

function renderDashboard() {
    const grid = document.getElementById('hot-dish-grid');
    const table = document.getElementById('summary-table-body');
    if (!grid || !table) return;

    // Render Hot Dish Cards (100% Match)
    grid.innerHTML = mockData.map(dish => {
        const s = statusStyles[dish.status];
        return `
            <div onclick="showDetail('${dish.id}')" class="pro-card p-5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative">
                <div class="absolute top-0 right-0 p-3">
                    <span class="${s.bg} ${s.text} ${s.border} border px-2 py-1 rounded-md text-[8px] font-black tracking-widest">${dish.status.toUpperCase()}</span>
                </div>
                <div class="h-12 w-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center font-black text-xl text-white italic shadow-inner mb-4 transition-all group-hover:bg-white/10">
                    ${dish.letter}
                </div>
                <h4 class="text-sm font-bold text-white tracking-tight leading-tight mb-2">${dish.name}</h4>
                <div class="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <div class="flex flex-col">
                        <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">Temperature</span>
                        <span class="text-xs font-mono font-bold ${s.text}">${dish.temp}°C</span>
                    </div>
                    <div class="flex flex-col border-l border-white/5 pl-3">
                        <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stock</span>
                        <span class="text-xs font-mono font-bold text-slate-300">${dish.stock}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render Table Rows (100% Match)
    table.innerHTML = mockData.map(dish => {
        const s = statusStyles[dish.status];
        return `
            <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-4">
                        <div class="h-8 w-8 bg-black/40 border border-white/10 rounded flex items-center justify-center font-black text-xs text-slate-400 italic">${dish.letter}</div>
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-white">${dish.name}</span>
                            <span class="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">${dish.type}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5 border-l border-white/5">
                    <span class="status-pill ${s.bg} ${s.text} border ${s.border}">${dish.status}</span>
                </td>
                <td class="px-6 py-5 border-l border-white/5">
                    <div class="flex flex-col">
                        <span class="text-xs font-mono font-bold text-white">${dish.temp}°C</span>
                        <span class="text-[9px] font-black text-slate-600 tracking-widest mt-0.5">${dish.weight}g</span>
                    </div>
                </td>
                <td class="px-6 py-5 border-l border-white/5 max-w-xs">
                    <p class="text-xs text-slate-400 italic line-clamp-1">${dish.feedbacks[0] || 'No comments'}</p>
                </td>
            </tr>
        `;
    }).join('');
}

window.showDetail = (id) => {
    const dish = mockData.find(d => d.id === id);
    if (!dish) return;
    const s = statusStyles[dish.status];
    const modal = document.getElementById('modal-container');
    
    modal.innerHTML = `
        <div class="pro-card w-full max-w-lg overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10 animate-in zoom-in-95 duration-200">
            <div class="h-48 bg-black relative flex items-center justify-center border-b border-white/5 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                <span class="text-9xl font-black text-white/5 absolute -bottom-10 -right-5 italic tracking-tighter">${dish.letter}</span>
                <div class="z-20 text-center">
                    <h3 class="text-3xl font-black text-white italic tracking-tighter uppercase">${dish.name}</h3>
                    <p class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-2">Quality Control File</p>
                </div>
                <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="absolute top-6 right-6 h-10 w-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all z-30">✕</button>
            </div>
            <div class="p-8 space-y-8">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-black/40 border border-white/5 rounded-2xl p-5">
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Measured Temp</span>
                        <span class="text-2xl font-mono font-bold ${s.text}">${dish.temp}°C</span>
                    </div>
                    <div class="bg-black/40 border border-white/5 rounded-2xl p-5">
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Weight</span>
                        <span class="text-2xl font-mono font-bold text-white">${dish.weight}g</span>
                    </div>
                </div>
                <div>
                    <h5 class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 italic">Latest Feedback Logs</h5>
                    <div class="space-y-3">
                        ${dish.feedbacks.map(f => `
                            <div class="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300 italic flex gap-3 italic">
                                <span class="text-emerald-500">◆</span> ${f}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">VALIDATE & ARCHIVE</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

// Initial Render
renderDashboard();
