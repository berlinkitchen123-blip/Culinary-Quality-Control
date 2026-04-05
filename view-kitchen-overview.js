
// =============================================
// KITCHEN OVERVIEW — Live status of all operations
// =============================================

const KITCHEN_STATIONS = [
    { id: 'st1', name: 'Hot Station A', operator: 'Marco Rossi', type: 'hot', tasks: [ { ingredient: 'Cordon Bleu with Green Beans', targetKg: 2813.8, status: 'cooking', startTime: '06:30', estFinish: '08:15' }, { ingredient: 'B&B Butter Chicken with Rice & Naan', targetKg: 2513.5, status: 'cooking', startTime: '06:30', estFinish: '08:15' }, { ingredient: 'Phanaeng Chicken curry', targetKg: 2061.8, status: 'cooking', startTime: '06:30', estFinish: '08:15' }, { ingredient: 'Low Carb Döner-Teller', targetKg: 1610.0, status: 'cooking', startTime: '06:30', estFinish: '08:15' } ] },
    { id: 'st3', name: 'Rice & Grain Station', operator: 'Anna Verdi', type: 'grain', tasks: [  ] },
    { id: 'st4', name: 'Cold Prep Station', operator: 'Elena Weber', type: 'cold', tasks: [  ] },
];

export function renderKitchenOverview() {
    const container = document.getElementById('kitchen-view');
    if (!container) return;

    const allTasks = KITCHEN_STATIONS.flatMap(s => s.tasks);
    const done = allTasks.filter(t => t.status === 'done').length;
    const cooking = allTasks.filter(t => t.status === 'cooking').length;
    const waiting = allTasks.filter(t => t.status === 'waiting').length;
    const total = allTasks.length;
    const pct = Math.round((done / total) * 100);

    container.innerHTML = `
        <div class="p-8 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Kitchen Command Center</h2>
                    <p class="text-[10px] text-slate-400 font-medium">Live cooking status • All ingredients</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[10px] font-bold text-emerald-600">LIVE</span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Kitchen Progress</span>
                    <span class="text-lg font-bold text-slate-800">${pct}%</span>
                </div>
                <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style="width: ${pct}%"></div>
                </div>
                <div class="flex items-center justify-between mt-3">
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span> Done: ${done}</span>
                        <span class="flex items-center gap-1.5 text-[10px] font-bold text-amber-600"><span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> Cooking: ${cooking}</span>
                        <span class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><span class="h-2 w-2 rounded-full bg-slate-300"></span> Waiting: ${waiting}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">${total} total ingredients</span>
                </div>
            </div>

            <!-- Station Cards -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                ${KITCHEN_STATIONS.map(station => {
                    const stDone = station.tasks.filter(t => t.status === 'done').length;
                    const stTotal = station.tasks.length;
                    const typeColors = {
                        'hot': { border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🔥' },
                        'cold': { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: '❄️' },
                        'grain': { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🌾' },
                    };
                    const tc = typeColors[station.type] || typeColors.hot;

                    return `
                        <div class="bg-white border ${tc.border} rounded-xl overflow-hidden shadow-sm">
                            <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">${tc.icon}</span>
                                    <div>
                                        <h3 class="text-[11px] font-bold text-slate-800">${station.name}</h3>
                                        <p class="text-[9px] text-slate-400 font-medium">${station.operator} • ${stDone}/${stTotal} done</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 text-[8px] font-bold rounded border ${tc.badge}">${station.type.toUpperCase()}</span>
                            </div>
                            <div class="p-3 space-y-2">
                                ${station.tasks.map(task => {
                                    const statusConfig = {
                                        'done': { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'DONE' },
                                        'cooking': { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700', label: 'COOKING' },
                                        'waiting': { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-300', text: 'text-slate-500', label: 'QUEUED' },
                                    };
                                    const sc = statusConfig[task.status];

                                    return `
                                        <div class="flex items-center justify-between p-2.5 ${sc.bg} border ${sc.border} rounded-lg">
                                            <div class="flex items-center gap-2.5 min-w-0">
                                                <span class="h-2 w-2 rounded-full ${sc.dot} flex-shrink-0"></span>
                                                <div class="min-w-0">
                                                    <p class="text-[10px] font-bold text-slate-700 truncate">${task.ingredient}</p>
                                                    <p class="text-[8px] text-slate-400">${task.targetKg}kg${task.startTime ? ' • Started ' + task.startTime : ''}</p>
                                                </div>
                                            </div>
                                            <div class="text-right flex-shrink-0 ml-2">
                                                <span class="text-[8px] font-bold ${sc.text} uppercase">${sc.label}</span>
                                                ${task.temp ? `<p class="text-[9px] font-mono font-bold text-emerald-600">${task.temp}°C</p>` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
