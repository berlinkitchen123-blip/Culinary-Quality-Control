
// =============================================
// ORDER FORECAST & CUTOFF SYSTEM
// =============================================

const CUTOFF_TIME = '14:00'; // 2 PM daily cutoff

const WEEKLY_MENU = [
    { letter: 'A', name: 'Avocado Egg Sandwich', type: 'hot', forecast: 197, ordered: 187, unsold: 0 },
    { letter: 'B', name: 'B&B Butter Chicken with Rice & Naan', type: 'hot', forecast: 10064, ordered: 10054, unsold: 0 },
    { letter: 'C', name: 'B&B Butter Tofu', type: 'hot', forecast: 4386, ordered: 4376, unsold: 0 },
    { letter: 'D', name: 'Chicken in champignon sauce with Spatzle', type: 'hot', forecast: 5598, ordered: 5588, unsold: 0 },
    { letter: 'E', name: 'Cordon Bleu with Green Beans', type: 'hot', forecast: 11265, ordered: 11255, unsold: 0 },
    { letter: 'F', name: 'Frijoles Chicken Boost', type: 'hot', forecast: 3960, ordered: 3950, unsold: 0 },
    { letter: 'G', name: 'Garden Green Salad with Chicken', type: 'cold', forecast: 2959, ordered: 2949, unsold: 0 },
    { letter: 'H', name: 'Heat to Eat: Chicken breast with coconut curry', type: 'hot', forecast: 54, ordered: 44, unsold: 0 },
    { letter: 'I', name: 'Heat to Eat: Chili sin Carne', type: 'hot', forecast: 21, ordered: 11, unsold: 0 },
    { letter: 'J', name: 'Japanese inspired vegan noodles bowl', type: 'hot', forecast: 4386, ordered: 4376, unsold: 0 },
    { letter: 'K', name: 'Korean BBQ Pulled Pork Burger', type: 'hot', forecast: 3060, ordered: 3050, unsold: 0 },
    { letter: 'L', name: 'Lasagna Bolognese with Seasonal Veggies', type: 'hot', forecast: 3128, ordered: 3118, unsold: 0 },
    { letter: 'M', name: 'Low Carb Döner-Teller', type: 'hot', forecast: 6450, ordered: 6440, unsold: 0 },
    { letter: 'N', name: 'Mediterranean Cruise', type: 'hot', forecast: 241, ordered: 231, unsold: 0 },
    { letter: 'O', name: 'Osaka Gyoza Bowl', type: 'hot', forecast: 296, ordered: 286, unsold: 0 },
];

// Historical data for forecasting
const WEEKLY_HISTORY = [
    { week: 'W09', dishes: { A: 189, B: 10046, C: 4383, D: 5589, E: 11261, F: 3959, G: 2952, H: 42, I: 6, J: 4375, K: 3058, L: 3117, M: 6443, N: 228, O: 279, }},
    { week: 'W10', dishes: { A: 181, B: 10059, C: 4373, D: 5590, E: 11264, F: 3951, G: 2941, H: 52, I: 9, J: 4379, K: 3051, L: 3125, M: 6437, N: 221, O: 276, }},
    { week: 'W11', dishes: { A: 193, B: 10063, C: 4375, D: 5595, E: 11261, F: 3942, G: 2954, H: 35, I: 3, J: 4380, K: 3044, L: 3123, M: 6449, N: 224, O: 283, }},
    { week: 'W12', dishes: { A: 187, B: 10054, C: 4376, D: 5588, E: 11255, F: 3950, G: 2949, H: 44, I: 11, J: 4376, K: 3050, L: 3118, M: 6440, N: 231, O: 286, }},
];

export function renderForecastView() {
    const container = document.getElementById('forecast-view');
    if (!container) return;

    const now = new Date();
    const cutoffHour = parseInt(CUTOFF_TIME.split(':')[0]);
    const isCutoffPassed = now.getHours() >= cutoffHour;
    const totalForecast = WEEKLY_MENU.reduce((s, d) => s + d.forecast, 0);
    const totalOrdered = WEEKLY_MENU.reduce((s, d) => s + d.ordered, 0);
    const forecastAccuracy = Math.round((totalOrdered / totalForecast) * 100);

    // Calculate unsold for display
    WEEKLY_MENU.forEach(d => {
        d.unsold = Math.max(0, d.forecast - d.ordered);
    });
    const totalUnsold = WEEKLY_MENU.reduce((s, d) => s + d.unsold, 0);

    container.innerHTML = `
        <div class="p-8 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Order Forecast & Cutoff</h2>
                    <p class="text-[10px] text-slate-400 font-medium">Week 12 • Cutoff at ${CUTOFF_TIME}</p>
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
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forecasted</p>
                    <p class="text-2xl font-bold text-slate-800">${totalForecast}</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Ordered</p>
                    <p class="text-2xl font-bold text-emerald-600">${totalOrdered}</p>
                </div>
                <div class="bg-white border ${totalUnsold > 0 ? 'border-amber-200' : 'border-slate-200'} rounded-xl p-4">
                    <p class="text-[10px] font-bold ${totalUnsold > 0 ? 'text-amber-500' : 'text-slate-400'} uppercase tracking-wider mb-1">Unsold</p>
                    <p class="text-2xl font-bold ${totalUnsold > 0 ? 'text-amber-600' : 'text-slate-300'}">${totalUnsold}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</p>
                    <p class="text-2xl font-bold text-slate-800">${forecastAccuracy}%</p>
                </div>
                <div class="bg-white border border-indigo-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Menu Items</p>
                    <p class="text-2xl font-bold text-indigo-600">${WEEKLY_MENU.length}</p>
                </div>
            </div>

            <!-- Forecast vs Ordered Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Today's Forecast vs Actual Orders</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="p-3 pl-5 w-12">Letter</th>
                                <th class="p-3">Dish</th>
                                <th class="p-3 text-center">Type</th>
                                <th class="p-3 text-center">Forecast</th>
                                <th class="p-3 text-center">Ordered</th>
                                <th class="p-3 text-center">Unsold</th>
                                <th class="p-3">Fill Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${WEEKLY_MENU.map(d => {
                                const fillRate = Math.round((d.ordered / d.forecast) * 100);
                                const fillColor = fillRate >= 90 ? 'bg-emerald-500' : fillRate >= 70 ? 'bg-amber-500' : 'bg-red-500';
                                const typeTag = d.type === 'hot'
                                    ? '<span class="px-1.5 py-0.5 text-[8px] font-bold bg-orange-100 text-orange-700 border border-orange-200 rounded">HOT</span>'
                                    : '<span class="px-1.5 py-0.5 text-[8px] font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded">COLD</span>';

                                return `
                                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td class="p-3 pl-5">
                                            <div class="h-8 w-8 bg-[#022c22] rounded flex items-center justify-center">
                                                <span class="text-[10px] font-bold text-white">${d.letter}</span>
                                            </div>
                                        </td>
                                        <td class="p-3 text-[11px] font-bold text-slate-800">${d.name}</td>
                                        <td class="p-3 text-center">${typeTag}</td>
                                        <td class="p-3 text-center text-[11px] font-mono text-slate-600">${d.forecast}</td>
                                        <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-800">${d.ordered}</td>
                                        <td class="p-3 text-center text-[11px] font-mono ${d.unsold > 0 ? 'text-amber-600 font-bold' : 'text-slate-300'}">${d.unsold > 0 ? d.unsold : '—'}</td>
                                        <td class="p-3">
                                            <div class="flex items-center gap-2">
                                                <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div class="h-full ${fillColor} rounded-full" style="width: ${Math.min(fillRate, 100)}%"></div>
                                                </div>
                                                <span class="text-[10px] font-bold text-slate-600 w-8 text-right">${fillRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Weekly Trend -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
                <h3 class="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-4">4-Week Trend (Top Dishes)</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="p-2">Dish</th>
                                ${WEEKLY_HISTORY.map(w => `<th class="p-2 text-center">${w.week}</th>`).join('')}
                                <th class="p-2 text-center">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${['A', 'B', 'R', 'N', 'O'].map(letter => {
                                const dish = WEEKLY_MENU.find(d => d.letter === letter);
                                const values = WEEKLY_HISTORY.map(w => w.dishes[letter] || 0);
                                const trend = values[values.length - 1] - values[0];
                                const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
                                const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-400';

                                return `
                                    <tr class="border-b border-slate-100">
                                        <td class="p-2 text-[11px] font-bold text-slate-700">${letter} ${dish ? dish.name : ''}</td>
                                        ${values.map(v => `<td class="p-2 text-center text-[11px] font-mono text-slate-600">${v}</td>`).join('')}
                                        <td class="p-2 text-center text-[12px] font-bold ${trendColor}">${trendIcon} ${trend > 0 ? '+' : ''}${trend}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
