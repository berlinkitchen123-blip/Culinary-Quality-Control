// =============================================
// QUALITY CONTROL MODULE (3-Dish Random Check)
// =============================================

export function renderAuditDishLibrary() {
    const container = document.getElementById('audit-content-container');
    if (!container) return;

    if (!window._BossData || !window._BossData.activeDishes || window._BossData.activeDishes.length < 3) {
        container.innerHTML = `<div class="p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Waiting for 3+ dishes to populate Quality Pipeline...</div>`;
        return;
    }

    // Randomly select 3 dishes from today's active menu
    const shuffled = [...window._BossData.activeDishes].sort(() => 0.5 - Math.random());
    const qcDishes = shuffled.slice(0, 3);
    
    let qcHtml = `
        <div class="mb-8 flex justify-between items-end">
            <div>
                <h2 class="text-xl font-bold text-white tracking-tight uppercase italic">Daily Quality Audit</h2>
                <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] mt-1">Randomized 3-Dish Compliance Check</p>
            </div>
            <button onclick="window.showView('audit')" class="bg-slate-900 border border-white/10 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xl">
                Refresh Audit
            </button>
        </div>
        <div class="space-y-8">
    `;

    qcDishes.forEach((dish, idx) => {
        const expectedTotalWeight = dish.ingredientsList.reduce((acc, curr) => acc + curr.weight, 0);

        qcHtml += `
            <div class="glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/5">
                <!-- Header -->
                <div class="bg-slate-950/80 border-b border-white/5 p-5 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="h-10 w-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center font-bold text-emerald-400 shadow-inner">${dish.letter}</div>
                        <div>
                            <h3 class="font-bold text-lg text-white">${dish.name}</h3>
                            <span class="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">Target: ${dish.qty} | Stock: ${dish.stock}</span>
                        </div>
                    </div>
                    <span class="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-4 py-1.5 rounded-full border border-emerald-500/20 tracking-widest">
                        AUDIT #${idx + 1}
                    </span>
                </div>

                <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Visual Comparison -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 italic">Visual Validation</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <span class="text-[9px] font-bold text-slate-400 mb-2 block opacity-60">Spec Image</span>
                                <img src="${dish.image}" class="w-full h-32 object-cover rounded-xl border border-white/5 grayscale hover:grayscale-0 transition-all duration-500" />
                            </div>
                            <div>
                                <span class="text-[9px] font-bold text-slate-400 mb-2 block opacity-60">Active Capture</span>
                                <div class="w-full h-32 bg-black/40 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all group">
                                    <span class="text-[9px] font-bold text-slate-600 uppercase group-hover:text-emerald-500 tracking-tighter">Tap to Photo</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-2 mt-6">
                             <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">Auditor Comments</h4>
                             <textarea rows="3" class="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-medium text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-700" placeholder="Enter deviations or observations..."></textarea>
                        </div>
                    </div>

                    <!-- Ingredient Validation -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 italic">Standard Spec Check</h4>
                        <div class="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                            ${dish.ingredientsList.map((ing, i) => `
                                <label class="flex items-center gap-4 p-3 bg-white/5 hover:bg-emerald-500/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/20 group">
                                    <input type="checkbox" class="w-4 h-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer">
                                    <div class="flex-1 flex justify-between items-center">
                                        <span class="text-[11px] font-bold text-slate-300 group-hover:text-white">${ing.name}</span>
                                        <span class="text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-0.5 rounded-lg">${ing.weight}g</span>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center px-2">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated Weight</span>
                            <span class="text-lg font-bold text-white italic">${expectedTotalWeight}g</span>
                        </div>
                    </div>

                    <!-- Measurements -->
                    <div class="space-y-6">
                        <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 italic">Compliance Tests</h4>
                        
                        <div class="space-y-3">
                            <h5 class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] pl-1">Probe Temps (°C)</h5>
                            <div class="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="P1" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none text-center" />
                                <input type="number" placeholder="P2" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none text-center" />
                                <input type="number" placeholder="P3" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none text-center" />
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h5 class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] pl-1">Sample Weight Deviations (g)</h5>
                            <div class="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="S-A" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-blue-400 focus:ring-1 focus:ring-blue-500 outline-none text-center" />
                                <input type="number" placeholder="S-B" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-blue-400 focus:ring-1 focus:ring-blue-500 outline-none text-center" />
                                <input type="number" placeholder="S-C" class="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-blue-400 focus:ring-1 focus:ring-blue-500 outline-none text-center" />
                            </div>
                        </div>
                        
                        <div class="pt-2">
                            <button class="w-full bg-white text-slate-950 font-bold text-[10px] py-4 rounded-xl uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl shadow-white/5">Log Audit Results</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    qcHtml += `</div>
        <div class="mt-12 flex justify-end pb-12">
             <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl shadow-2xl shadow-emerald-600/20 font-bold tracking-[0.3em] uppercase text-[11px] transition-all active:scale-95 italic" onclick="alert('QC Data successfully archived.')">
                 Sign-Off Final Audit
             </button>
        </div>
    `;

    container.innerHTML = qcHtml;
}

