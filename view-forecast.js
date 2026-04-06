
// =============================================
// ORDER FORECAST & CUTOFF SYSTEM
// =============================================

const CUTOFF_TIME = '14:00'; // 2 PM daily cutoff

export function renderForecastView() {
    const container = document.getElementById('forecast-view');
    if (!container) return;

    // Use BossData if available, else fallback to empty
    let menuItems = [];
    if (window._BossData && window._BossData.activeDishes) {
        menuItems = window._BossData.activeDishes.map(d => ({
            letter: d.letter,
            name: d.name,
            type: d.type,
            ordered: d.ordered,
            stock: d.stock,
            buffer: 5,
            prepTarget: d.qty
        }));
    }

    const now = new Date();
    const cutoffHour = parseInt(CUTOFF_TIME.split(':')[0]);
    const isCutoffPassed = now.getHours() >= cutoffHour;
    const totalOrdered = menuItems.reduce((s, d) => s + d.ordered, 0);
    const totalPrepTarget = menuItems.reduce((s, d) => s + d.prepTarget, 0);
    const totalStock = menuItems.reduce((s, d) => s + d.stock, 0);

    container.innerHTML = `
        <div class="p-4 md:p-8 space-y-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Order Forecast & Cutoff</h2>
                    <p class="text-[10px] text-slate-400 font-medium">Week 12 • Cutoff at ${CUTOFF_TIME} • Day: ${window._BossData ? window._BossData.dayCode.toUpperCase() : 'N/A'}</p>
                </div>
                <div class="flex items-center gap-3">
                    ${isCutoffPassed
                        ? `<span class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-[10px] font-bold text-red-700">
                            <span class="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5"></span>
                            CUTOFF PASSED — Orders locked
                           </span>`
                        : `<span class="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700">
                            <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                            ORDERS OPEN — Cutoff at ${CUTOFF_TIME}
                           </span>`
                    }
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Ordered</p>
                    <p class="text-2xl font-bold text-slate-800">${totalOrdered.toLocaleString()}</p>
                </div>
                <div class="bg-white border border-blue-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Buffer (+5 each)</p>
                    <p class="text-2xl font-bold text-blue-600">+${menuItems.length * 5}</p>
                </div>
                <div class="bg-white border border-amber-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Stock Deducted</p>
                    <p class="text-2xl font-bold text-amber-600">-${totalStock.toLocaleString()}</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Prep Target</p>
                    <p class="text-2xl font-bold text-emerald-600">${totalPrepTarget.toLocaleString()}</p>
                </div>
                <div class="bg-white border border-indigo-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Active Dishes</p>
                    <p class="text-2xl font-bold text-indigo-600">${menuItems.length}</p>
                </div>
            </div>

            <!-- Forecast Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Daily Prep Calculation: Ordered + Buffer(5) - Stock = Prep Target</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50/80 border-b border-slate-200">
                                <th class="px-4 md:px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-2/5">Menu Item</th>
                                <th class="px-4 md:px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ordered</th>
                                <th class="px-4 md:px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock</th>
                                <th class="px-4 md:px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Buffer</th>
                                <th class="px-4 md:px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prep Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${menuItems.map((dish) => `
                            <tr class="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer" onclick="window.showDishModal('${dish.letter}')">
                                <td class="px-4 md:px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 rounded bg-[#022c22] flex items-center justify-center flex-shrink-0">
                                            <span class="text-[10px] font-bold text-white">${dish.letter}</span>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <p class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">${dish.name}</p>
                                                <span class="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 hover:bg-slate-200" title="View details">ℹ️</span>
                                            </div>
                                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border ${dish.type === 'hot' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200'}">${dish.type === 'hot' ? 'HOT' : 'COLD'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 md:px-6 py-4">
                                     <span class="text-xs font-bold text-slate-800">${dish.ordered.toLocaleString()}</span>
                                </td>
                                <td class="px-4 md:px-6 py-4">
                                    <span class="text-xs font-bold text-red-600">-${dish.stock.toLocaleString()}</span>
                                </td>
                                <td class="px-4 md:px-6 py-4">
                                    <span class="text-xs font-bold text-blue-600">+5</span>
                                </td>
                                <td class="px-4 md:px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${dish.prepTarget.toLocaleString()}</span>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Summary -->
            <div class="bg-slate-900 text-white rounded-xl p-6">
                <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Daily Summary Formula</h3>
                <div class="flex flex-col sm:flex-row items-center gap-4 text-center">
                    <div class="flex-1">
                        <p class="text-3xl font-black">${totalOrdered.toLocaleString()}</p>
                        <p class="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Ordered</p>
                    </div>
                    <span class="text-2xl font-bold text-blue-400">+</span>
                    <div class="flex-1">
                        <p class="text-3xl font-black text-blue-400">${menuItems.length * 5}</p>
                        <p class="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Buffer</p>
                    </div>
                    <span class="text-2xl font-bold text-red-400">−</span>
                    <div class="flex-1">
                        <p class="text-3xl font-black text-red-400">${totalStock.toLocaleString()}</p>
                        <p class="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Stock/Leftover</p>
                    </div>
                    <span class="text-2xl font-bold text-slate-500">=</span>
                    <div class="flex-1">
                        <p class="text-3xl font-black text-emerald-400">${totalPrepTarget.toLocaleString()}</p>
                        <p class="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Prep Target</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
