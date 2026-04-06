// =============================================
// QUALITY CONTROL MODULE (3-Dish Random Check)
// =============================================

export function renderAuditDishLibrary() {
    const container = document.getElementById('audit-content-container');
    if (!container) return;

    if (!window._BossData || !window._BossData.activeDishes || window._BossData.activeDishes.length < 3) {
        container.innerHTML = `<div class="p-10 text-center text-slate-500">Waiting for 3+ dishes to populate Boss Pipeline...</div>`;
        return;
    }

    // Randomly select 3 dishes from today's active menu
    const shuffled = [...window._BossData.activeDishes].sort(() => 0.5 - Math.random());
    const qcDishes = shuffled.slice(0, 3);
    
    let qcHtml = `
        <div class="mb-6 flex justify-between items-end">
            <div>
                <h2 class="text-2xl font-black text-slate-800">Daily Quality Audit</h2>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Randomized 3-Dish Compliance Check</p>
            </div>
            <button onclick="window.showView('audit')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-md text-xs font-bold transition-colors">
                Regenerate Random Audit
            </button>
        </div>
        <div class="space-y-8">
    `;

    qcDishes.forEach((dish, idx) => {
        const expectedTotalWeight = dish.ingredientsList.reduce((acc, curr) => acc + curr.weight, 0);

        qcHtml += `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <!-- Header -->
                <div class="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 bg-slate-800 rounded flex items-center justify-center font-bold text-xs">${dish.letter}</div>
                        <div>
                            <h3 class="font-black text-lg">${dish.name}</h3>
                            <span class="text-[9px] uppercase tracking-widest text-slate-400">Target Qty: ${dish.qty} | Leftover Stock: ${dish.stock}</span>
                        </div>
                    </div>
                    <span class="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full border border-indigo-500/30">
                        AUDIT #${idx + 1}
                    </span>
                </div>

                <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Column 1: Image Comparison -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Visual Comparison</h4>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <span class="text-[9px] font-bold text-slate-500 mb-1 block">Expected (Spec)</span>
                                <img src="${dish.image}" class="w-full h-32 object-cover rounded border border-slate-200" />
                            </div>
                            <div>
                                <span class="text-[9px] font-bold text-slate-500 mb-1 block">Actual (Upload/Capture)</span>
                                <div class="w-full h-32 bg-slate-50 rounded border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase">Tap to Capture</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-2 mt-4">
                             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditor Comments</h4>
                             <textarea rows="3" class="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Enter findings, visual deviations, or general feedback..."></textarea>
                        </div>
                    </div>

                    <!-- Column 2: Bill of Materials & Checkboxes -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Ingredient Spec Validation</h4>
                        <div class="space-y-2">
                            ${dish.ingredientsList.map((ing, i) => `
                                <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                    <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                    <div class="flex-1 flex justify-between items-center">
                                        <span class="text-xs font-bold text-slate-700">${ing.name}</span>
                                        <span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${ing.weight}g</span>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center px-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spec Weight</span>
                            <span class="text-sm font-black text-slate-800">${expectedTotalWeight}g</span>
                        </div>
                    </div>

                    <!-- Column 3: Measurements (Temps & Weights) -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Physical Measurements</h4>
                        
                        <div class="space-y-3">
                            <h5 class="text-[9px] font-bold text-slate-500 uppercase">Temperature Tests (°C)</h5>
                            <div class="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="Probe 1" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                                <input type="number" placeholder="Probe 2" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                                <input type="number" placeholder="Probe 3" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                            </div>
                        </div>

                        <div class="space-y-3 mt-4">
                            <h5 class="text-[9px] font-bold text-slate-500 uppercase">Final Weight Variations (g)</h5>
                            <div class="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="Sample A" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                                <input type="number" placeholder="Sample B" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                                <input type="number" placeholder="Sample C" class="bg-slate-50 border border-slate-200 rounded p-2 text-xs w-full focus:ring-2 focus:border-indigo-500 focus:outline-none" />
                            </div>
                        </div>
                        
                        <div class="pt-6">
                            <button class="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded uppercase tracking-widest hover:bg-slate-800 transition-colors">Submit Dish Audit</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    qcHtml += `</div>
        <div class="mt-8 flex justify-end">
             <button class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg font-black tracking-widest uppercase transition-colors" onclick="alert('QC Data successfully logged to central systems!')">
                 Sign-Off Weekly Audit
             </button>
        </div>
    `;

    container.innerHTML = qcHtml;
}
