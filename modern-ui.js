import { renderLifecycleView } from './view-lifecycle.js';
import { renderWarmerView } from './view-warmers.js';

const mockData = [
    { id: '1', name: 'Indian Butter Chicken', type: 'meat', letter: 'A', status: 'ok', temp: '71.0', stock: '12', weight: '340/320', feedbacks: ['Excellent texture'] },
    { id: '2', name: 'Golden Tofu Coconut Curry', type: 'vegetarian', letter: 'B', status: 'fail', temp: '44.7', stock: '5', weight: '555/495', feedbacks: ['Check marinade'] },
    { id: '3', name: 'Egg Channa Masala', type: 'vegetarian', letter: 'C', status: 'warn', temp: '60.0', stock: '0', weight: '454/520', feedbacks: ['Temperature below spec'] },
    { id: '4', name: 'Murgh Cholay', type: 'meat', letter: 'D', status: 'warn', temp: '62.7', stock: '24', weight: '531/501', feedbacks: ['Standard batch'] }
];

const scorecardData = [
    { label: 'Hot dishes temp', rate: '70%', pass: '7/10 pass', status: 'WARN', color: 'text-amber-400', border: 'border-amber-400/30' },
    { label: 'Cold dishes temp', rate: '93%', pass: '13/14 pass', status: 'OK', color: 'text-emerald-400', border: 'border-emerald-400/30' },
    { label: 'RTE items', rate: '100%', pass: '3/3 pass', status: 'OK', color: 'text-emerald-400', border: 'border-emerald-400/30' },
    { label: 'Weight checks', rate: '71%', pass: 'OK band', status: 'WARN', color: 'text-amber-400', border: 'border-amber-400/30' }
];

const statusStyles = {
    ok: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    error: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/20' }
};

function showView(viewName) {
    // Reset layout
    const grid = document.getElementById('hot-dish-grid');
    const parentContainer = grid.parentElement;
    parentContainer.classList.remove('flex', 'flex-col', 'grid-cols-1', 'lg:grid-cols-2', 'xl:grid-cols-3');
    parentContainer.classList.add('grid', 'grid-cols-2', 'lg:grid-cols-4');
    
    // Clear Scorecard from non-dashboard views
    const existingScorecard = document.getElementById('compliance-scorecard');
    if (existingScorecard) existingScorecard.remove();

    switch(viewName) {
        case 'dashboard': renderDashboard(); break;
        case 'lifecycle': renderLifecycleView(); break;
        case 'warmers': renderWarmerView(); break;
    }

    // Sidebar highlight
    document.querySelectorAll('nav button').forEach(b => {
        b.classList.remove('text-emerald-400', 'bg-emerald-500/10');
        b.classList.add('text-slate-500');
    });
    const active = document.getElementById(`nav-${viewName}`);
    if(active) {
        active.classList.add('text-emerald-400', 'bg-emerald-500/10');
        active.classList.remove('text-slate-500');
    }
}

document.getElementById('nav-dashboard').onclick = () => showView('dashboard');
document.getElementById('nav-lifecycle').onclick = () => showView('lifecycle');
document.getElementById('nav-warmers').onclick = () => showView('warmers');

function renderDashboard() {
    const grid = document.getElementById('hot-dish-grid');
    const table = document.getElementById('summary-table-body');
    if (!grid || !table) return;

    // Inject Scorecard (Sheet 1)
    const container = grid.parentElement.parentElement;
    const scorecardHtml = `
        <div id="compliance-scorecard" class="mb-12">
            <h3 class="text-xs font-black text-slate-600 uppercase tracking-widest italic mb-6">1. COMPLIANCE SCORECARD — Pass rate by category</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                ${scorecardData.map(s => `
                    <div class="pro-card p-6 border ${s.border} text-center flex flex-col items-center">
                        <span class="text-[3rem] font-black ${s.color} leading-none tracking-tighter italic">${s.rate}</span>
                        <span class="text-[10px] font-bold text-white uppercase mt-2">${s.label}</span>
                        <span class="text-[8px] font-bold text-slate-500 mt-1">${s.pass}</span>
                        <span class="mt-4 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black ${s.color}">${s.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    if (!document.getElementById('compliance-scorecard')) {
        grid.parentElement.insertAdjacentHTML('beforebegin', scorecardHtml);
    }

    // Render Hot Dish Cards (Sheet 1 Grid)
    grid.innerHTML = mockData.map(dish => {
        const s = statusStyles[dish.status === 'warn' ? 'warning' : dish.status === 'fail' ? 'error' : 'ok'];
        return `
            <div onclick="showDetail('${dish.id}')" class="pro-card p-6 border ${s.border} ${s.bg} cursor-pointer hover:scale-[1.02] transition-all">
                <div class="flex items-center gap-3 mb-6">
                    <div class="h-8 w-8 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center font-black text-xs text-white">${dish.letter}</div>
                    <span class="text-[9px] font-bold text-white uppercase tracking-tight">${dish.name}</span>
                </div>
                <div class="text-center">
                    <div class="text-4xl font-black ${s.text} italic tracking-tighter leading-none">${dish.temp}°C</div>
                    <div class="text-[9px] font-bold text-slate-500 opacity-60 mt-2">75° 67° 71°</div>
                    <div class="text-[8px] font-black text-slate-500 uppercase mt-4">Warmer #0${dish.id}</div>
                </div>
            </div>
        `;
    }).join('');

    // Table view matching
    const tableRows = mockData.map(dish => {
        const s = statusStyles[dish.status === 'warn' ? 'warning' : dish.status === 'fail' ? 'error' : 'ok'];
        return `
            <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-4">
                        <div class="h-8 w-8 bg-black/40 border border-white/10 rounded flex items-center justify-center font-black text-xs text-slate-400 italic">${dish.letter}</div>
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-white">${dish.name}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5 border-l border-white/5">
                    <span class="status-pill ${s.bg} ${s.text} border ${s.border}">${dish.status.toUpperCase()}</span>
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
    table.innerHTML = tableRows;
}

// Initial Render
showView('dashboard');

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
