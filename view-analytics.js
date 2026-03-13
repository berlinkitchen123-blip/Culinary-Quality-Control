
import { state, HYGIENE_TASKS } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { listenToGlobalHistory } from "./api.js";
import { normalizeName } from "./utils.js";

function renderAuditDishLibrary() {
    DOMElements.auditResultsContainer.innerHTML = '';

    if (!state.hasFetchedHistory) {
        if (state.isHistoryLoading) {
            DOMElements.auditResultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div class="relative w-20 h-20 mb-8">
                        <div class="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Downloading Global Archive...</p>
                    <p class="text-slate-600 font-mono text-[9px] mt-2">Connecting to Neural Database</p>
                </div>
            `;
        } else {
            DOMElements.auditResultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 px-6 animate-in fade-in zoom-in-95 duration-500 border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/50">
                    <div class="bg-indigo-600/10 p-8 rounded-[2.5rem] mb-8 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 class="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Analytics Offline</h3>
                    <p class="text-slate-400 mb-10 text-center max-w-md text-sm font-medium leading-relaxed">
                        Historical data connection is suspended to optimize bandwidth. Initiate the sequence to download the full audit history from the central database.
                    </p>
                    <button onclick="window.listenToGlobalHistory()" class="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 border-b-4 border-indigo-900 overflow-hidden">
                        <span class="relative z-10">Initialize Download Sequence</span>
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    </button>
                </div>
            `;
        }
        return;
    }
    
    if (window.auditCharts) {
        window.auditCharts.forEach(c => c.destroy());
        window.auditCharts = [];
    }
    
    const dishStats = {};
    const allDates = new Set();
    
    state.allHistoricalChecks.filter(c => c.logType === 'quality').forEach(check => {
        const key = normalizeName(check.dishName);
        if(check.pathDate) allDates.add(check.pathDate);
        
        if (!dishStats[key]) {
            dishStats[key] = { 
                name: check.dishName, 
                checks: [], 
                scores: [] 
            };
        }
        if (check.timestamp && (!dishStats[key].lastTs || check.timestamp > dishStats[key].lastTs)) {
             dishStats[key].name = check.dishName;
             dishStats[key].lastTs = check.timestamp;
        }
        dishStats[key].checks.push(check);
        if (check.aiCheckResult && typeof check.aiCheckResult.score === 'number') {
            dishStats[key].scores.push(check.aiCheckResult.score);
        }
    });

    const dateArray = Array.from(allDates).sort();
    const rangeStart = dateArray.length ? new Date(dateArray[0]).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A';
    const rangeEnd = dateArray.length ? new Date(dateArray[dateArray.length-1]).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A';
    
    const headerDiv = document.createElement('div');
    headerDiv.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-end border-b border-indigo-500/30 pb-4 mb-8 gap-4">
            <div>
                <h3 class="text-xl font-black text-white italic tracking-tight">Global Knowledge Base</h3>
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                    Database: ${state.allHistoricalChecks.length} Logs • ${rangeStart} — ${rangeEnd}
                </p>
                <div class="flex gap-2 mt-2">
                    ${dateArray.length === 1 ? `<p class="text-[9px] text-red-400 font-bold bg-red-900/20 inline-block px-2 py-1 rounded">NOTICE: Limited history detected. Analytics requires multiple days of data.</p>` : ''}
                    <p class="text-[9px] text-emerald-400 font-bold bg-emerald-900/20 inline-block px-2 py-1 rounded">SCOPE: Full Database</p>
                </div>
            </div>
             <div>
                <span class="px-4 py-2 bg-indigo-900/40 rounded-xl border border-indigo-500/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    ${Object.keys(dishStats).length} Dishes Indexed
                </span>
            </div>
        </div>
    `;
    DOMElements.auditResultsContainer.appendChild(headerDiv);

    renderHygieneAnalytics();

    const getTopicFrequency = (items) => {
        const counts = {};
        items.forEach(i => {
            if(!i) return;
            const k = i.trim().toLowerCase().replace(/[.,!]/g, ''); 
            if (!counts[k]) counts[k] = { text: i.trim(), count: 0 };
            counts[k].count++;
        });
        return Object.values(counts).sort((a,b) => b.count - a.count).slice(0, 5);
    };

    const activeDishes = [];
    const usedStatsKeys = new Set();

    if (state.menu && state.menu.dishes) {
        state.menu.dishes.forEach(menuDish => {
            const key = normalizeName(menuDish.dishName);
            usedStatsKeys.add(key);
            
            if (dishStats[key]) {
                activeDishes.push({
                    ...dishStats[key],
                    isActive: true
                });
            } else {
                activeDishes.push({
                    name: menuDish.dishName,
                    checks: [],
                    scores: [],
                    isActive: true,
                    isNew: true
                });
            }
        });
    }

    const archivedDishes = [];
    Object.keys(dishStats).forEach(key => {
        if (!usedStatsKeys.has(key)) {
            archivedDishes.push({
                ...dishStats[key],
                isActive: false
            });
        }
    });

    const createSectionHeader = (title, count, iconSvg, colorClass) => `
        <div class="flex items-center gap-4 mb-6 mt-12 border-b border-slate-800 pb-4 animate-in slide-in-from-left-8 duration-700">
            <div class="p-3 rounded-2xl ${colorClass.replace('bg-', 'bg-opacity-10 text-')} ${colorClass} bg-opacity-10">
                ${iconSvg}
            </div>
            <div>
                <h3 class="text-xl font-black text-white uppercase tracking-wider">${title}</h3>
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">${count} Items</p>
            </div>
        </div>
    `;

    const renderDishList = (dishes, startIndex) => {
        dishes.forEach((dish, i) => {
            const index = startIndex + i;
            const total = dish.checks.length;
            
            let avgScore = 'N/A';
            let tier = 'N'; 
            let tierColor = 'text-slate-500'; 
            let tierBg = 'bg-slate-500/10 border-slate-500/20';
            let sortedChecks = [];
            let labels = [];
            let dataPoints = [];
            let goodInsights = [];
            let badInsights = [];
            let allPositives = [];
            let allImprovements = [];

            if (total > 0) {
                const sum = dish.scores.reduce((a, b) => a + b, 0);
                const mean = sum / total;
                avgScore = mean.toFixed(1);

                const variance = dish.scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / total;
                const stdDev = Math.sqrt(variance);

                tier = 'C'; tierColor = 'text-red-500'; tierBg = 'bg-red-500/10 border-red-500/20';
                if (mean >= 9 && stdDev < 1.0) { tier = 'S'; tierColor = 'text-purple-400'; tierBg = 'bg-purple-500/10 border-purple-500/20'; }
                else if (mean >= 8 && stdDev < 2.0) { tier = 'A'; tierColor = 'text-emerald-400'; tierBg = 'bg-emerald-500/10 border-emerald-500/20'; }
                else if (mean >= 6.5) { tier = 'B'; tierColor = 'text-yellow-400'; tierBg = 'bg-yellow-500/10 border-yellow-500/20'; }

                sortedChecks = dish.checks.sort((a,b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                labels = sortedChecks.map(c => c.timestamp ? new Date(c.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'}) : '-');
                dataPoints = sortedChecks.map(c => c.aiCheckResult?.score || 0);

                const goodChecks = sortedChecks.filter(c => c.aiCheckResult?.score >= 8);
                const badChecks = sortedChecks.filter(c => c.aiCheckResult?.score <= 6);
                
                const getInsights = (checks) => checks.map(c => c.aiCheckResult?.overall_comment || "").filter(c => c.length > 5).slice(0, 3);

                goodInsights = getInsights(goodChecks);
                badInsights = getInsights(badChecks);
                
                allPositives = getTopicFrequency(sortedChecks.flatMap(c => c.aiCheckResult?.positives || []));
                allImprovements = getTopicFrequency(sortedChecks.flatMap(c => c.aiCheckResult?.improvements || []));
            }

            const card = document.createElement('div');
            card.className = "bg-slate-800/60 rounded-[2.5rem] p-8 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/80 transition-all relative overflow-hidden mb-8 group";
            const canvasId = `chart-${index}`;

            const chartHtml = total > 0 
                ? `<div class="h-40 w-full relative"><canvas id="${canvasId}"></canvas></div>` 
                : `<div class="h-40 w-full flex items-center justify-center border-2 border-dashed border-slate-700/50 rounded-3xl"><p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No Trend Data Available</p></div>`;

            const deepDiveHtml = total > 0
                ? `
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                        <div class="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                            <div class="flex items-center gap-3 mb-2">
                                 <div class="bg-green-500/20 p-2 rounded-xl text-green-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                 <p class="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">Success Patterns</p>
                            </div>
                            <ul class="space-y-4">
                                ${goodInsights.length ? goodInsights.map(txt => `<li class="text-[10px] text-slate-300 italic border-l-2 border-green-500/30 pl-3 leading-relaxed">"${txt}"</li>`).join('') : '<li class="text-[10px] text-slate-600 italic">Insufficient data</li>'}
                            </ul>
                        </div>
                        <div class="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                             <div class="flex items-center gap-3 mb-2">
                                 <div class="bg-red-500/20 p-2 rounded-xl text-red-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                                 <p class="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Risk Patterns</p>
                            </div>
                            <ul class="space-y-4">
                                ${badInsights.length ? badInsights.map(txt => `<li class="text-[10px] text-slate-300 italic border-l-2 border-red-500/30 pl-3 leading-relaxed">"${txt}"</li>`).join('') : '<li class="text-[10px] text-slate-600 italic">Insufficient data</li>'}
                            </ul>
                        </div>
                    </div>
                `
                : '';

            card.innerHTML = `
                <div class="flex flex-col gap-8 relative z-10">
                    <div class="border-b border-white/5 pb-6 flex justify-between items-start">
                        <div>
                            <h3 class="text-2xl font-black text-white italic uppercase tracking-tight">${dish.name}</h3>
                            <div class="flex items-center gap-3 mt-3">
                                ${total > 0 ? `<div class="px-3 py-1 rounded-lg ${tierBg} border text-[9px] font-black ${tierColor} uppercase tracking-widest">Tier ${tier} Reliability</div>` : `<div class="px-3 py-1 rounded-lg bg-slate-700/30 border border-slate-600/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">No History</div>`}
                                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 border-l border-slate-700">${total} Audits</span>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="text-4xl font-black ${total > 0 ? 'text-white' : 'text-slate-700'} font-mono tracking-tighter">${avgScore}</div>
                             <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Avg Score</div>
                        </div>
                    </div>
                    ${chartHtml}
                    ${deepDiveHtml}
                    ${total > 0 ? `
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                             <div><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Common Strengths</p><div class="flex flex-wrap gap-2">${allPositives.map(p => `<span class="px-3 py-1 bg-green-900/20 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-300 uppercase">${p.text}</span>`).join('') || '<span class="text-slate-600 text-[10px]">N/A</span>'}</div></div>
                             <div><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Common Improvements</p><div class="flex flex-wrap gap-2">${allImprovements.map(p => `<span class="px-3 py-1 bg-yellow-900/20 border border-yellow-500/20 rounded-lg text-[10px] font-bold text-yellow-300 uppercase">${p.text}</span>`).join('') || '<span class="text-slate-600 text-[10px]">N/A</span>'}</div></div>
                        </div>
                        <div class="mt-8 border-t border-white/5 pt-8"><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Audit Chronology</p><div class="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">${sortedChecks.map(check => { const score = check.aiCheckResult?.score || 0; const date = check.pathDate || 'Unknown'; const color = score >= 8 ? 'text-green-400' : score <= 6 ? 'text-red-400' : 'text-indigo-400'; return `<div class="flex justify-between items-center p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:bg-slate-900/50 transition-colors"><div class="flex items-center gap-4"><span class="text-[10px] font-mono text-slate-500 font-bold">${date}</span><span class="text-xs font-black ${color}">${score}/10</span></div><p class="text-[10px] text-slate-400 italic truncate max-w-[60%]">${check.aiCheckResult?.overall_comment || "No comment"}</p></div>`; }).join('')}</div></div>
                    ` : ''}
                </div>
            `;
            DOMElements.auditResultsContainer.appendChild(card);

            if (total > 0 && typeof Chart !== 'undefined') {
                const ctx = document.getElementById(canvasId).getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Quality Score',
                            data: dataPoints,
                            borderColor: '#6366f1',
                            backgroundColor: (context) => {
                                const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
                                bg.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
                                bg.addColorStop(1, 'rgba(99, 102, 241, 0)');
                                return bg;
                            },
                            borderWidth: 2,
                            pointBackgroundColor: '#1e293b',
                            pointBorderColor: '#818cf8',
                            pointRadius: 4,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { min: 0, max: 10, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } } },
                            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9, weight: 'bold' }, maxTicksLimit: 6 } }
                        }
                    }
                });
                window.auditCharts.push(chart);
            }
        });
    };

    if (activeDishes.length > 0) {
        DOMElements.auditResultsContainer.insertAdjacentHTML('beforeend', createSectionHeader("Active Menu Matrix", activeDishes.length, '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', 'bg-emerald-500'));
        renderDishList(activeDishes, 0);
    }

    if (archivedDishes.length > 0) {
        DOMElements.auditResultsContainer.insertAdjacentHTML('beforeend', createSectionHeader("Historical Archive", archivedDishes.length, '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>', 'bg-slate-500'));
        renderDishList(archivedDishes, activeDishes.length);
    }
    
    if (activeDishes.length === 0 && archivedDishes.length === 0) {
         DOMElements.auditResultsContainer.innerHTML += `<div class="text-center py-20 border-2 border-dashed border-slate-800 rounded-[3rem]"><p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">No Records Found</p></div>`;
    }
}

function renderHygieneAnalytics() {
    const hygieneLogs = state.allHistoricalChecks.filter(c => c.logType === 'hygiene');
    if (hygieneLogs.length === 0) return;

    const taskStats = {};
    HYGIENE_TASKS.forEach(t => {
        taskStats[t.id] = { name: t.name, icon: t.icon, count: 0, lastLogged: null };
    });

    hygieneLogs.forEach(log => {
        if (taskStats[log.taskId]) {
            taskStats[log.taskId].count++;
            if (!taskStats[log.taskId].lastLogged || log.timestamp > taskStats[log.taskId].lastLogged) {
                taskStats[log.taskId].lastLogged = log.timestamp;
            }
        }
    });

    const section = document.createElement('div');
    section.className = "mt-12 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000";
    section.innerHTML = `
        <div class="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
            <div class="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
                <h3 class="text-xl font-black text-white uppercase tracking-wider">Hygiene Compliance Index</h3>
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Sanitation Audit Summary</p>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${HYGIENE_TASKS.map(task => {
                const stats = taskStats[task.id];
                const lastDate = stats.lastLogged ? new Date(stats.lastLogged).toLocaleDateString() : 'Never';
                return `
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 flex items-center gap-5 hover:bg-slate-800/60 transition-all group">
                        <div class="h-14 w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:bg-indigo-600/20 transition-all">${task.icon}</div>
                        <div>
                            <p class="text-xs font-black text-white uppercase italic tracking-tight">${task.name}</p>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">${stats.count} Logs</span>
                                <span class="text-[8px] font-mono text-slate-500 uppercase">Last: ${lastDate}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    DOMElements.auditResultsContainer.appendChild(section);
}

// Make globally available for button clicks
window.renderAuditDishLibrary = renderAuditDishLibrary;
window.listenToGlobalHistory = listenToGlobalHistory;

export { renderAuditDishLibrary };
