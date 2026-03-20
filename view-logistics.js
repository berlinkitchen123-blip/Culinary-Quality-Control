export const mockDriverReports = [
    { driverId: 'drv-1', driverName: 'Paolo Rossi', vehicle: 'Fiat Ducato', avgDispatchTime: '1m 45s', avgFinishingTime: '08:42', totalDeliveries: 128, totalDishes: 1840, errors: 3, mistakes: 5, onTimeRate: 94 },
    { driverId: 'drv-2', driverName: 'Luca Bianchi', vehicle: 'Mercedes Sprinter', avgDispatchTime: '2m 10s', avgFinishingTime: '09:15', totalDeliveries: 112, totalDishes: 1520, errors: 1, mistakes: 2, onTimeRate: 97 },
    { driverId: 'drv-3', driverName: 'Andrea Verdi', vehicle: 'Iveco Daily', avgDispatchTime: '2m 35s', avgFinishingTime: '09:30', totalDeliveries: 95, totalDishes: 1280, errors: 7, mistakes: 12, onTimeRate: 85 },
    { driverId: 'drv-4', driverName: 'Marco Neri', vehicle: 'Fiat Ducato', avgDispatchTime: '1m 55s', avgFinishingTime: '08:55', totalDeliveries: 104, totalDishes: 1650, errors: 2, mistakes: 3, onTimeRate: 96 },
];

export const mockDishReports = [
    { dishName: 'Chicken', letter: 'K', totalDispatched: 320, avgDispatchTime: '1m 20s', errors: 2, mistakes: 1, mostCommonDriver: 'Paolo Rossi' },
    { dishName: 'Prebiotic Power-Gyoza Bowl', letter: 'H', totalDispatched: 285, avgDispatchTime: '1m 45s', errors: 0, mistakes: 1, mostCommonDriver: 'Luca Bianchi' },
    { dishName: 'Spicy Tuna Poke Bowl', letter: 'R', totalDispatched: 210, avgDispatchTime: '1m 30s', errors: 1, mistakes: 0, mostCommonDriver: 'Paolo Rossi' },
    { dishName: 'Thai Coconut Curry', letter: 'T', totalDispatched: 340, avgDispatchTime: '2m 05s', errors: 3, mistakes: 4, mostCommonDriver: 'Andrea Verdi' },
    { dishName: 'Garden Green Salad with Chicken', letter: 'N', totalDispatched: 275, avgDispatchTime: '1m 15s', errors: 0, mistakes: 0, mostCommonDriver: 'Luca Bianchi' },
    { dishName: 'Vegan Cobb Salad', letter: 'V', totalDispatched: 190, avgDispatchTime: '1m 10s', errors: 0, mistakes: 1, mostCommonDriver: 'Marco Neri' },
    { dishName: 'Buddha Bowl with Peanuts', letter: 'S', totalDispatched: 310, avgDispatchTime: '1m 50s', errors: 1, mistakes: 2, mostCommonDriver: 'Paolo Rossi' },
    { dishName: 'Spinach Lentil Wrap', letter: 'U', totalDispatched: 245, avgDispatchTime: '1m 25s', errors: 0, mistakes: 0, mostCommonDriver: 'Andrea Verdi' },
    { dishName: 'Chocolate Mousse', letter: 'M', totalDispatched: 180, avgDispatchTime: '0m 55s', errors: 0, mistakes: 0, mostCommonDriver: 'Luca Bianchi' },
    { dishName: 'Hawaiian Chicken Poke', letter: 'K', totalDispatched: 260, avgDispatchTime: '1m 40s', errors: 2, mistakes: 3, mostCommonDriver: 'Paolo Rossi' },
    { dishName: 'Feta & Eggplant Plate', letter: 'P', totalDispatched: 200, avgDispatchTime: '1m 35s', errors: 1, mistakes: 1, mostCommonDriver: 'Marco Neri' },
];

export function renderLogisticsReport() {
    const container = document.getElementById('logistics-view');
    if (!container) return;

    const totalDeliveries = mockDriverReports.reduce((s, d) => s + d.totalDeliveries, 0);
    const totalDishes = mockDriverReports.reduce((s, d) => s + d.totalDishes, 0);
    const totalErrors = mockDriverReports.reduce((s, d) => s + d.errors, 0);
    const totalMistakes = mockDriverReports.reduce((s, d) => s + d.mistakes, 0);
    const avgOnTimeRate = Math.round(mockDriverReports.reduce((s, d) => s + d.onTimeRate, 0) / mockDriverReports.length);

    container.innerHTML = `
        <div class="flex flex-col h-full bg-[#0f172a] text-slate-200 font-sans">
            <!-- Header -->
            <div class="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="bg-indigo-500/10 p-2 rounded-xl">
                        <svg class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-white uppercase tracking-tight">Logistics Report</h1>
                        <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Performance & Compliance</p>
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Deliveries</p>
                    </div>
                    <p class="text-3xl font-black text-white">${totalDeliveries}</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c.053.164.082.34.082.522 0 1.103-.897 2-2 2H5c-1.103 0-2-.897-2-2 0-.182.029-.358.082-.522V15H2V9h1V4.5A1.5 1.5 0 014.5 3h15A1.5 1.5 0 0121 4.5V9h1v6h-1v.546zM20 9V4.5a.5.5 0 00-.5-.5h-15a.5.5 0 00-.5.5V9h16zM3 10v4h18v-4H3z"/></svg>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Dishes</p>
                    </div>
                    <p class="text-3xl font-black text-white">${totalDishes}</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Errors</p>
                    </div>
                    <p class="text-3xl font-black text-red-500">${totalErrors}</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Mistakes</p>
                    </div>
                    <p class="text-3xl font-black text-amber-500">${totalMistakes}</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                    <div class="flex items-center gap-2 mb-3">
                        <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">On-Time rate</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <p class="text-3xl font-black ${avgOnTimeRate >= 95 ? 'text-emerald-500' : 'text-amber-500'}">${avgOnTimeRate}%</p>
                        <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500" style="width: ${avgOnTimeRate}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="px-6 pb-6 flex-1 overflow-hidden flex flex-col">
                <div class="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 mb-6 self-start">
                    <button id="logistics-tab-drivers" class="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">Drivers</button>
                    <button id="logistics-tab-dishes" class="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-slate-500 hover:text-white">Dishes</button>
                </div>

                <!-- Table Container -->
                <div id="logistics-table-container" class="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-3xl">
                    <!-- Tables injected here -->
                </div>
            </div>
        </div>
    `;

    const setTab = (tab) => {
        const driversBtn = document.getElementById('logistics-tab-drivers');
        const dishesBtn = document.getElementById('logistics-tab-dishes');
        const tableContainer = document.getElementById('logistics-table-container');

        if (tab === 'drivers') {
            driversBtn.className = "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
            dishesBtn.className = "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-slate-500 hover:text-white";
            renderDriversTable(tableContainer);
        } else {
            dishesBtn.className = "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
            driversBtn.className = "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all text-slate-500 hover:text-white";
            renderDishesTable(tableContainer);
        }
    };

    document.getElementById('logistics-tab-drivers').onclick = () => setTab('drivers');
    document.getElementById('logistics-tab-dishes').onclick = () => setTab('dishes');

    setTab('drivers');
}

function renderDriversTable(container) {
    container.innerHTML = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 z-10">
                    <th class="p-5">Driver</th>
                    <th class="p-5 text-center">Avg Dispatch</th>
                    <th class="p-5 text-center">Deliveries</th>
                    <th class="p-5 text-center">Dishes</th>
                    <th class="p-5 text-center text-red-500">Errors</th>
                    <th class="p-5 text-center text-amber-500">Mistakes</th>
                    <th class="p-5 text-center">On-Time rate</th>
                </tr>
            </thead>
            <tbody>
                ${mockDriverReports.map(driver => `
                    <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all group">
                        <td class="p-5">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-black group-hover:border-indigo-500/50 transition-all">
                                    ${driver.driverName.charAt(0)}
                                </div>
                                <div>
                                    <p class="text-sm font-black text-white">${driver.driverName}</p>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase">${driver.vehicle}</p>
                                </div>
                            </div>
                        </td>
                        <td class="p-5 text-center">
                            <span class="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black mono">${driver.avgDispatchTime}</span>
                        </td>
                        <td class="p-5 text-center text-sm font-black text-white">${driver.totalDeliveries}</td>
                        <td class="p-5 text-center text-sm font-black text-white">${driver.totalDishes}</td>
                        <td class="p-5 text-center text-sm font-black ${driver.errors > 0 ? 'text-red-500' : 'text-slate-600'}">${driver.errors}</td>
                        <td class="p-5 text-center text-sm font-black ${driver.mistakes > 0 ? 'text-amber-500' : 'text-slate-600'}">${driver.mistakes}</td>
                        <td class="p-5">
                            <div class="flex items-center justify-center gap-3">
                                <span class="text-xs font-black ${driver.onTimeRate >= 95 ? 'text-emerald-500' : 'text-amber-500'}">${driver.onTimeRate}%</span>
                                <div class="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full ${driver.onTimeRate >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${driver.onTimeRate}%"></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderDishesTable(container) {
    container.innerHTML = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 z-10">
                    <th class="p-5 w-16 text-center">ID</th>
                    <th class="p-5">Dish name</th>
                    <th class="p-5 text-center">Avg Dispatch</th>
                    <th class="p-5 text-center">Total Unit</th>
                    <th class="p-5 text-center text-red-500">Errors</th>
                    <th class="p-5 text-center text-amber-500">Mistakes</th>
                    <th class="p-5">Main driver</th>
                </tr>
            </thead>
            <tbody>
                ${mockDishReports.map(dish => `
                    <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all group">
                        <td class="p-5 text-center">
                            <span class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-black border border-indigo-500/20">${dish.letter}</span>
                        </td>
                        <td class="p-5">
                            <p class="text-sm font-black text-white">${dish.dishName}</p>
                        </td>
                        <td class="p-5 text-center">
                            <span class="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black mono">${dish.avgDispatchTime}</span>
                        </td>
                        <td class="p-5 text-center text-sm font-black text-white">${dish.totalDispatched}</td>
                        <td class="p-5 text-center text-sm font-black ${dish.errors > 0 ? 'text-red-500' : 'text-slate-600'}">${dish.errors}</td>
                        <td class="p-5 text-center text-sm font-black ${dish.mistakes > 0 ? 'text-amber-500' : 'text-slate-600'}">${dish.mistakes}</td>
                        <td class="p-5">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500 border border-slate-700">${dish.mostCommonDriver.charAt(0)}</div>
                                <span class="text-xs font-bold text-slate-400">${dish.mostCommonDriver}</span>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
