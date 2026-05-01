
import { Notifications } from "./ui-notifications.js";

// =============================================
// ASSEMBLER PERSONAL VIEW
// Each assembler sees their own tasks
// Filtered by: All, Hot, Cold, Add-ons, Catering
// =============================================

export function renderAssemblerView() {
    if (!window._BossData) return;
    const container = document.getElementById('assembler-view');
    if (!container) return;

    // We take a default operator for demo if none selected
    if (!window._CurrentAssembler) {
        window._CurrentAssembler = window._BossData.operators[0].id; // Stefan Koch
    }

    const currentOp = window._BossData.operators.find(o => o.id === window._CurrentAssembler);
    let activeTab = window._AssemblerActiveTab || 'All';

    const renderContent = () => {
        const tasks = currentOp.assignedDishes;
        const filteredTasks = activeTab === 'All' ? tasks : tasks.filter(t => t.category === activeTab);

        container.innerHTML = `
            <div class="p-8 space-y-6">
                <!-- Header: Assembler Selector -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-sm font-bold text-slate-800">Assembler Task List</h2>
                        <p class="text-[10px] text-slate-400 font-medium">Viewing tasks for <span class="text-emerald-600 font-bold">${currentOp.name}</span></p>
                    </div>
                    <div class="flex bg-slate-200/50 p-1 rounded-lg gap-1">
                        ${window._BossData.operators.map(op => `
                            <button onclick="window.setAssembler('${op.id}')" 
                                class="px-3 py-1.5 text-[10px] font-bold rounded ${window._CurrentAssembler === op.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}">
                                ${op.name.split(' ')[0]}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Tabs: Categories -->
                <div class="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm gap-1 overflow-x-auto no-scrollbar">
                    ${['All', 'Hot', 'Cold', 'Add-ons', 'Catering'].map(tab => `
                        <button onclick="window.setAssemblerTab('${tab}')" 
                            class="flex-1 min-w-[80px] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-[#022c22] text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}">
                            ${tab}
                        </button>
                    `).join('')}
                </div>

                <!-- Tasks Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredTasks.length === 0 ? `
                        <div class="col-span-full flex flex-col items-center justify-center py-20 opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                            <p class="text-xs font-bold uppercase tracking-widest">No ${activeTab} tasks assigned</p>
                        </div>
                    ` : filteredTasks.map(task => `
                        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div class="h-32 bg-slate-100 relative overflow-hidden">
                                <img src="${task.image}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div class="absolute bottom-3 left-4 flex items-center gap-2">
                                    <div class="h-8 w-8 bg-white/20 backdrop-blur-md rounded flex items-center justify-center border border-white/30">
                                        <span class="text-xs font-bold text-white">${task.letter}</span>
                                    </div>
                                    <p class="text-[11px] font-bold text-white truncate">${task.name}</p>
                                </div>
                                <div class="absolute top-3 right-3">
                                    <span class="px-2 py-1 text-[8px] font-black uppercase tracking-tighter bg-white/90 rounded border border-white shadow-sm">${task.category}</span>
                                </div>
                            </div>
                            <div class="p-4 space-y-4">
                                <div class="flex items-center justify-between text-[10px]">
                                    <span class="text-slate-400 font-medium">Portions to Prep</span>
                                    <span class="text-slate-800 font-bold">${task.qty}</span>
                                </div>
                                
                                <div class="space-y-1">
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ingredients</p>
                                    <div class="flex flex-wrap gap-1">
                                        ${task.ingredientsList.map(ing => `
                                            <span class="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">${ing.name} ${ing.weight}g</span>
                                        `).join('')}
                                    </div>
                                </div>

                                <div class="pt-2 border-t border-slate-100">
                                    <button onclick="window.showAssemblerCompletionModal('${task.letter}')" 
                                        class="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:border-emerald-600 transition-all">
                                        Assemble & Verify
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    window.setAssembler = (id) => {
        window._CurrentAssembler = id;
        renderContent();
    };

    window.setAssemblerTab = (tab) => {
        window._AssemblerActiveTab = tab;
        renderAssemblerView();
    };

    renderContent();
}

window.showAssemblerCompletionModal = (dishLetter) => {
    const dish = window._BossData.activeDishes.find(d => d.letter === dishLetter);
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="bg-[#022c22] p-6 text-white flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                        <span class="text-xl font-black">${dish.letter}</span>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold tracking-tight">${dish.name}</h3>
                        <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Final Completion Task</p>
                    </div>
                </div>
                <button onclick="document.getElementById('modal-container').classList.add('hidden');" class="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>

            <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <!-- Photo Requirement -->
                <div class="space-y-3">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">1. Click Picture of the dish</p>
                    <div class="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 group-hover:text-slate-400 mb-2 transition-colors"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <p class="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">TAP TO CAPTURE</p>
                    </div>
                </div>

                <!-- Customer Context -->
                <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                     <p class="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">Customer Feedback Note</p>
                     <p class="text-[11px] font-medium text-blue-800 leading-relaxed italic">"${dish.comments[0]}"</p>
                </div>

                <!-- Ingredient Checklist -->
                <div class="space-y-3">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">2. Verification Checklist</p>
                    <div class="space-y-2">
                        ${dish.ingredientsList.map(ing => `
                            <label class="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                <span class="text-[11px] font-bold text-slate-700">${ing.name}</span>
                                <div class="flex items-center gap-3">
                                    <span class="text-[10px] font-mono text-slate-400">${ing.weight}g</span>
                                    <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Temp & Weight -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temperature (°C)</label>
                        <input type="number" placeholder="75.0" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Weight (g)</label>
                        <input type="number" placeholder="310" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all">
                    </div>
                </div>
            </div>

            <div class="p-6 bg-slate-50 border-t border-slate-100">
                <button onclick="window.submitDishCompletion('${dish.letter}')" 
                    class="w-full py-4 bg-[#022c22] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-950/20 hover:scale-[0.98] transition-all">
                    Mark Dish as Done
                </button>
            </div>
        </div>
    `;
};

window.submitDishCompletion = (letter) => {
    Notifications.show(`Dish ${letter} successfully verified and logged.`, 'success');
    document.getElementById('modal-container').classList.add('hidden');
    renderAssemblerView();
};
