
import { state } from "./state.js";
import { Notifications } from "./ui-notifications.js";

// =============================================
// DISH ASSIGNMENT — Production Assembly Stage
// Kitchen manager assigns dish letters to operators
// =============================================

// Dish menu with letters, ingredient details, process info
export function renderDishAssignView() {
    if (!window._BossData) return;
    const DISH_MENU = window._BossData.activeDishes.map(d => ({...d, category: 'main-dishes', ingredients: [{name:'Base', weight: 200}], process: 'Prep'}));
    const ASSEMBLY_OPERATORS = window._BossData.operators;
    const container = document.getElementById('dish-assign-view');
    if (!container) return;

    container.innerHTML = `
        <div class="flex h-full overflow-hidden">
            <!-- Left: Dish Letters -->
            <aside class="w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/30">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h2 class="text-sm font-bold text-slate-800">Dish Letters</h2>
                            <p class="text-[10px] text-slate-400 font-medium">${DISH_MENU.length} dishes • After cutoff</p>
                        </div>
                    </div>
                    <div class="flex gap-1 bg-slate-100 p-1 rounded-md">
                        <button id="dish-tab-main" class="flex-1 px-3 py-1.5 text-[10px] font-bold rounded bg-white shadow-sm text-slate-800">MAIN DISHES</button>
                        <button id="dish-tab-addons" class="flex-1 px-3 py-1.5 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700">ADD-ONS</button>
                    </div>
                </div>
                <div id="dish-letter-list" class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"></div>
            </aside>

            <!-- Right: Assembly Operators -->
            <section class="flex-1 bg-slate-50/30 overflow-y-auto p-8 custom-scrollbar">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-sm font-bold text-slate-800">Assembly Operators</h2>
                        <p class="text-[10px] text-slate-400 font-medium">${ASSEMBLY_OPERATORS.length} operators on shift</p>
                    </div>
                </div>
                <div id="assembly-operators-grid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"></div>
            </section>
        </div>
    `;

    let activeTab = 'main-dishes';

    const renderDishList = () => {
        const list = document.getElementById('dish-letter-list');
        list.innerHTML = '';
        const filtered = DISH_MENU.filter(d => d.category === activeTab);

        filtered.forEach(dish => {
            const isAssigned = ASSEMBLY_OPERATORS.some(op => op.assignedDishes.find(d => d.letter === dish.letter));
            const card = document.createElement('div');
            card.className = `bg-white border ${isAssigned ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'} rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-all shadow-sm group select-none`;
            card.draggable = true;
            card.ondragstart = (e) => {
                e.dataTransfer.setData("text/plain", JSON.stringify(dish));
                card.classList.add('opacity-50');
            };
            card.ondragend = () => card.classList.remove('opacity-50');

            const typeColor = dish.type === 'hot' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-blue-100 text-blue-600 border-blue-200';

            card.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 bg-[#022c22] rounded-lg flex items-center justify-center shadow-inner flex-shrink-0">
                        <span class="text-sm font-bold text-white">${dish.letter}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-0.5">
                            <p class="text-[11px] font-bold text-slate-800 truncate">${dish.name}</p>
                            <span class="text-[8px] font-bold px-1.5 py-0.5 rounded border ${typeColor} flex-shrink-0">${dish.type.toUpperCase()}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-[9px] text-slate-400 font-medium">${dish.qty} portions</span>
                            <span class="text-[9px] text-slate-400">•</span>
                            <span class="text-[9px] text-slate-400 font-medium">${dish.ingredients.length} ingredients</span>
                        </div>
                    </div>
                    ${isAssigned ? '<span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] flex-shrink-0"></span>' : ''}
                </div>
            `;

            // Click to show recipe details
            card.ondblclick = () => showDishDetail(dish);
            list.appendChild(card);
        });
    };

    const renderOperators = () => {
        const grid = document.getElementById('assembly-operators-grid');
        grid.innerHTML = '';

        ASSEMBLY_OPERATORS.forEach(op => {
            const card = document.createElement('div');
            card.className = "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all min-h-[280px]";

            card.ondragover = (e) => { e.preventDefault(); card.classList.add('border-emerald-500', 'scale-[1.01]'); };
            card.ondragleave = () => card.classList.remove('border-emerald-500', 'scale-[1.01]');
            card.ondrop = (e) => {
                e.preventDefault();
                card.classList.remove('border-emerald-500', 'scale-[1.01]');
                try {
                    const dish = JSON.parse(e.dataTransfer.getData("text/plain"));
                    assignDish(op.id, dish);
                } catch (err) { console.error("Drop failed", err); }
            };

            const totalPortions = op.assignedDishes.reduce((s, d) => s + d.qty, 0);

            card.innerHTML = `
                <div class="bg-[#022c22] p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-white/80 border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div>
                            <h3 class="text-[12px] font-bold text-white tracking-tight">${op.name}</h3>
                            <p class="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">${op.assignedDishes.length} dishes • ${totalPortions} portions</p>
                        </div>
                    </div>
                </div>
                <div class="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    ${op.assignedDishes.length === 0 ? `
                        <div class="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                            <p class="text-[10px] text-slate-400 font-medium">Drop dish letters here</p>
                        </div>
                    ` : op.assignedDishes.map(dish => `
                        <div class="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg group hover:bg-slate-100 transition-colors">
                            <div class="h-8 w-8 bg-[#022c22] rounded flex items-center justify-center flex-shrink-0">
                                <span class="text-[10px] font-bold text-white">${dish.letter}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-[10px] font-bold text-slate-700 truncate">${dish.name}</p>
                                <p class="text-[8px] text-slate-400">${dish.qty} portions • ${dish.type}</p>
                            </div>
                            <button onclick="window.unassignDish('${op.id}','${dish.letter}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
            grid.appendChild(card);
        });
    };

    const assignDish = (opId, dish) => {
        // Remove from any other operator first
        ASSEMBLY_OPERATORS.forEach(op => {
            op.assignedDishes = op.assignedDishes.filter(d => d.letter !== dish.letter);
        });
        const op = ASSEMBLY_OPERATORS.find(o => o.id === opId);
        op.assignedDishes.push(dish);
        Notifications.show(`Assigned ${dish.letter} ${dish.name} to ${op.name}`);
        renderDishList();
        renderOperators();
    };

    window.unassignDish = (opId, dishLetter) => {
        const op = ASSEMBLY_OPERATORS.find(o => o.id === opId);
        op.assignedDishes = op.assignedDishes.filter(d => d.letter !== dishLetter);
        Notifications.show(`Removed ${dishLetter} from ${op.name}`, 'error');
        renderDishList();
        renderOperators();
    };

    const showDishDetail = (dish) => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div class="bg-[#022c22] p-6 rounded-t-2xl flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <span class="text-xl font-bold text-white">${dish.letter}</span>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-white">${dish.name}</h2>
                            <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">${dish.type} DISH • ${dish.qty} PORTIONS</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden');document.getElementById('modal-container').classList.remove('flex')" class="text-white/40 hover:text-white p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div class="p-6 space-y-6">
                    <div>
                        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assembly Process</h3>
                        <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">${dish.process}</p>
                    </div>
                    <div>
                        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ingredients per Portion</h3>
                        <div class="space-y-2">
                            ${dish.ingredients.map(ing => `
                                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <span class="text-[11px] font-bold text-slate-700">${ing.name}</span>
                                    <span class="text-[11px] font-mono font-bold text-emerald-600">${ing.weight}g</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 class="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Total Batch (${dish.qty} portions)</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${dish.ingredients.map(ing => `
                                <div class="flex justify-between text-[10px]">
                                    <span class="text-amber-700">${ing.name}</span>
                                    <span class="font-bold text-amber-900">${(ing.weight * dish.qty / 1000).toFixed(1)}kg</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };
    };

    // Tab Logic
    document.getElementById('dish-tab-main').onclick = () => {
        activeTab = 'main-dishes';
        document.getElementById('dish-tab-main').className = "flex-1 px-3 py-1.5 text-[10px] font-bold rounded bg-white shadow-sm text-slate-800";
        document.getElementById('dish-tab-addons').className = "flex-1 px-3 py-1.5 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700";
        renderDishList();
    };
    document.getElementById('dish-tab-addons').onclick = () => {
        activeTab = 'add-ons';
        document.getElementById('dish-tab-addons').className = "flex-1 px-3 py-1.5 text-[10px] font-bold rounded bg-white shadow-sm text-slate-800";
        document.getElementById('dish-tab-main').className = "flex-1 px-3 py-1.5 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700";
        renderDishList();
    };

    renderDishList();
    renderOperators();
}
