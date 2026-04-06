
// =============================================
// ORDER FORECAST & CUTOFF SYSTEM
// =============================================

const CUTOFF_TIME = '14:00'; // 2 PM daily cutoff

const WEEKLY_MENU = [
    { letter: 'CO0', name: 'Cordon Bleu with Green Beans', type: 'hot', forecast: 11255, ordered: 11255, unsold: 0 },
    { letter: 'B&1', name: 'B&B Butter Chicken with Rice & Naan', type: 'hot', forecast: 10054, ordered: 10054, unsold: 0 },
    { letter: 'PH2', name: 'Phanaeng Chicken curry', type: 'hot', forecast: 8247, ordered: 8247, unsold: 0 },
    { letter: 'LO3', name: 'Low Carb Döner-Teller', type: 'hot', forecast: 6440, ordered: 6440, unsold: 0 },
    { letter: 'SP4', name: 'Spinach Ricotta Tortellini with cream tomato sauce', type: 'hot', forecast: 6003, ordered: 6003, unsold: 0 },
    { letter: 'CH5', name: 'Chicken in champignon sauce with Spatzle', type: 'hot', forecast: 5588, ordered: 5588, unsold: 0 },
    { letter: 'VE6', name: 'Vegan Madras Kofta', type: 'hot', forecast: 4993, ordered: 4993, unsold: 0 },
    { letter: 'B&7', name: 'B&B Butter Tofu', type: 'hot', forecast: 4376, ordered: 4376, unsold: 0 },
    { letter: 'JA8', name: 'Japanese inspired vegan noodles bowl', type: 'hot', forecast: 4376, ordered: 4376, unsold: 0 },
    { letter: 'TE9', name: 'Test&Tell: High-Protien Thai Peanut Bowl with Chickpea & Tofu', type: 'hot', forecast: 4286, ordered: 4286, unsold: 0 },
    { letter: 'TH10', name: 'The Ultimate Vegan Bowl', type: 'hot', forecast: 4264, ordered: 4264, unsold: 0 },
    { letter: 'FR11', name: 'Frijoles Chicken Boost', type: 'hot', forecast: 3950, ordered: 3950, unsold: 0 },
    { letter: 'SP12', name: 'Spicy Tuna Poke Bowl', type: 'hot', forecast: 3948, ordered: 3948, unsold: 0 },
    { letter: 'LA13', name: 'Lasagna Bolognese with Seasonal Veggies', type: 'hot', forecast: 3118, ordered: 3118, unsold: 0 },
    { letter: 'KO14', name: 'Korean BBQ Pulled Pork Burger', type: 'hot', forecast: 3050, ordered: 3050, unsold: 0 },
    { letter: 'TH15', name: 'Thai chicken salad', type: 'cold', forecast: 3050, ordered: 3050, unsold: 0 },
    { letter: 'GA16', name: 'Garden Green Salad with Chicken', type: 'cold', forecast: 2949, ordered: 2949, unsold: 0 },
    { letter: 'TH17', name: 'Thai Coconut curry with Vegan Chicken', type: 'hot', forecast: 2264, ordered: 2264, unsold: 0 },
    { letter: 'CH18', name: 'Chicken', type: 'hot', forecast: 1838, ordered: 1838, unsold: 0 },
    { letter: 'SM19', name: 'Smashed Medjool Date', type: 'hot', forecast: 1278, ordered: 1278, unsold: 0 },
    { letter: 'SO20', name: 'Soleil de Saumon', type: 'hot', forecast: 1186, ordered: 1186, unsold: 0 },
    { letter: 'SP21', name: 'Spicy Chicken Pizza Sandwich', type: 'hot', forecast: 1087, ordered: 1087, unsold: 0 },
    { letter: 'OS22', name: 'Osaka Gyoza Bowl', type: 'hot', forecast: 286, ordered: 286, unsold: 0 },
    { letter: 'ME23', name: 'Mediterranean Cruise', type: 'hot', forecast: 231, ordered: 231, unsold: 0 },
    { letter: 'PE24', name: 'Peaches Omelette Salad', type: 'cold', forecast: 231, ordered: 231, unsold: 0 },
    { letter: 'ZU25', name: 'Zucchini Falafel Wrap', type: 'hot', forecast: 220, ordered: 220, unsold: 0 },
    { letter: 'AV26', name: 'Avocado Egg Sandwich', type: 'hot', forecast: 187, ordered: 187, unsold: 0 },
    { letter: 'VE27', name: 'Vegetables Tikka Masala', type: 'hot', forecast: 187, ordered: 187, unsold: 0 },
    { letter: 'CR28', name: 'Crème a l\'orange', type: 'hot', forecast: 88, ordered: 88, unsold: 0 },
    { letter: 'RO29', name: 'Roasted Vegetables', type: 'hot', forecast: 77, ordered: 77, unsold: 0 },
    { letter: 'TA30', name: 'Tanzania Kokoa Kamili', type: 'hot', forecast: 77, ordered: 77, unsold: 0 },
    { letter: 'MI31', name: 'Minestrone Soup', type: 'hot', forecast: 66, ordered: 66, unsold: 0 },
    { letter: 'PO32', name: 'Potato soup with sausages', type: 'hot', forecast: 66, ordered: 66, unsold: 0 },
    { letter: 'BE33', name: 'Be-Kind Protein Dark chocolate nut', type: 'hot', forecast: 55, ordered: 55, unsold: 0 },
    { letter: 'HE34', name: 'Heat to Eat: Chicken breast with coconut curry', type: 'hot', forecast: 44, ordered: 44, unsold: 0 },
    { letter: 'BE35', name: 'Be-kind Honey Roasted Nuts & Sea Salt', type: 'hot', forecast: 44, ordered: 44, unsold: 0 },
    { letter: 'CH36', name: 'Chocolate Mousse', type: 'cold', forecast: 44, ordered: 44, unsold: 0 },
    { letter: 'RI37', name: 'Rice', type: 'hot', forecast: 44, ordered: 44, unsold: 0 },
    { letter: 'BA38', name: 'Baba Ghanoush', type: 'hot', forecast: 33, ordered: 33, unsold: 0 },
    { letter: 'BA39', name: 'Basil Tomato Soup', type: 'hot', forecast: 33, ordered: 33, unsold: 0 },
    { letter: 'BE40', name: 'Be-Kind Protein crunchy peanut butter', type: 'hot', forecast: 22, ordered: 22, unsold: 0 },
    { letter: 'JA41', name: 'Jardin Fire', type: 'hot', forecast: 22, ordered: 22, unsold: 0 },
    { letter: 'HE42', name: 'Heat to Eat: Chili sin Carne', type: 'hot', forecast: 11, ordered: 11, unsold: 0 },
    { letter: 'BE43', name: 'Be-kind Almond & Mixed Fruits', type: 'hot', forecast: 11, ordered: 11, unsold: 0 },
    { letter: 'BE44', name: 'Be-kind Caramel Almond & Sea Salt', type: 'hot', forecast: 11, ordered: 11, unsold: 0 },
    { letter: 'FR45', name: 'Fruit Salad Mojito', type: 'cold', forecast: 11, ordered: 11, unsold: 0 },
];

// Historical data for forecasting
const WEEKLY_HISTORY = [
    { week: 'W12 (Current)', dishes: { 'CO0': 11255, 'B&1': 10054, 'PH2': 8247, 'LO3': 6440, 'SP4': 6003, 'CH5': 5588, 'VE6': 4993, 'B&7': 4376, 'JA8': 4376, 'TE9': 4286, 'TH10': 4264, 'FR11': 3950, 'SP12': 3948, 'LA13': 3118, 'KO14': 3050, 'TH15': 3050, 'GA16': 2949, 'TH17': 2264, 'CH18': 1838, 'SM19': 1278, 'SO20': 1186, 'SP21': 1087, 'OS22': 286, 'ME23': 231, 'PE24': 231, 'ZU25': 220, 'AV26': 187, 'VE27': 187, 'CR28': 88, 'RO29': 77, 'TA30': 77, 'MI31': 66, 'PO32': 66, 'BE33': 55, 'HE34': 44, 'BE35': 44, 'CH36': 44, 'RI37': 44, 'BA38': 33, 'BA39': 33, 'BE40': 22, 'JA41': 22, 'HE42': 11, 'BE43': 11, 'BE44': 11, 'FR45': 11, }},
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
                            <tr class="bg-slate-50/80 border-b border-slate-200">
                                <th class="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-2/5">Menu Item</th>
                                <th class="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ordered</th>
                                <th class="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock/Leftover</th>
                                <th class="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Buffer</th>
                                <th class="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prep Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(() => {
                                const activeDishes = WEEKLY_MENU.map(d => ({ ...d, stock: d.unsold, qty: d.ordered }));
                                const tableRows = activeDishes.map((dish, i) => `
        <tr class="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer" onclick="window.showDishModal('${dish.letter}')">
            <td class="px-6 py-4">
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
            <td class="px-6 py-4">
                 <span class="text-xs font-bold text-slate-800">${dish.ordered.toLocaleString()}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-bold text-red-600">-${dish.stock.toLocaleString()}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-bold text-blue-600">+5</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <div class="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                         <div class="h-full bg-emerald-500 rounded-full" style="width: 100%"></div>
                    </div>
                    <span class="text-xs font-bold text-emerald-600">${dish.qty.toLocaleString()}</span>
                </div>
            </td>
        </tr>
    `).join('');
                                return tableRows;
                            })()}
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
