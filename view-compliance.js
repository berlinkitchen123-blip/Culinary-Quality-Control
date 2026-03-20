const hotData = [
    { name: 'N Thai CC Chicken', m: 55.9, t: 57.3, w: 65.7, th: 57.3 },
    { name: 'O Schnitzel', m: 52.2, t: 61.3, w: 64.8, th: 60.3 },
    { name: 'P Pumpkin Curry', m: 63.6, t: 54.7, w: 73.1, th: 61.0 },
    { name: 'Q African Stew', m: 60.6, t: 55.7, w: 66.5, th: 61.0 },
    { name: 'R Butter Chicken', m: 59.7, t: 61.3, w: 72.4, th: 61.3 },
    { name: 'S Egg Paneer', m: 62.2, t: 51.7, w: 55.8, th: 59.0 },
    { name: 'T Gyoza Hot Bowl', m: 59.7, t: 56.7, w: 63.8, th: 53.0 },
    { name: 'U Lasagna Bologn.', m: 54.5, t: 54.0, w: 65.5, th: 56.3 },
    { name: 'V Chili con Carne', m: 60.6, t: 52.0, w: 76.5, th: 58.3 },
    { name: 'W Falafel Burger', m: 62.4, t: 47.3, w: 56.6, th: 47.7 },
    { name: 'X Thai CC Chickpeas', m: 56.7, t: 48.0, w: 44.3, th: 52.7 },
];

const coldData = [
    { name: 'M Doner Kebab', m: 5.0, t: 6.0, w: 6.2, th: 7.3 },
    { name: 'A Chicken Balsamic', m: 4.3, t: 5.0, w: 3.6, th: 6.7 },
    { name: 'B Tuna Deopbap', m: 4.7, t: 5.3, w: 3.5, th: 2.7 },
    { name: 'C Moroccan Barley', m: 5.7, t: 5.7, w: 4.1, th: null },
    { name: 'D Herbed Quinoa', m: 5.3, t: 2.7, w: 6.0, th: 7.0 },
    { name: 'E Pumpkin Hummus', m: 4.7, t: 5.7, w: 7.1, th: 5.3 },
    { name: 'F Feta & Eggplant', m: 6.3, t: 3.7, w: 5.2, th: 6.3 },
    { name: 'G Vegan Thai Peanut', m: 5.0, t: 4.0, w: 3.3, th: null },
    { name: 'H Garden Green', m: 6.0, t: 7.7, w: 3.5, th: 1.7 },
    { name: 'I Chicken Parmesan', m: 4.3, t: 4.7, w: 5.0, th: null },
    { name: 'J Italian Pesto', m: 6.0, t: 4.7, w: 3.5, th: 4.7 },
    { name: 'K Feta Mushroom', m: 5.3, t: 8.3, w: 4.6, th: 3.0 },
    { name: 'L Pesto Egg-Plant', m: 6.3, t: 4.7, w: 4.7, th: 3.7 },
    { name: 'Y Pesto Mozzarella', m: 4.7, t: 4.3, w: 4.8, th: 6.3 },
];

const getHotColor = (val) => {
    if (val === null || val === undefined) return '#e2e8f0';
    if (val >= 65) return '#4ade80';
    if (val >= 62) return '#fbbf24';
    if (val >= 53) return '#f97316';
    return '#ef4444';
};

const getColdColor = (val) => {
    if (val === null || val === undefined) return '#e2e8f0';
    if (val <= 5) return '#4ade80';
    if (val <= 7) return '#f97316';
    return '#ef4444';
};

const getLightColor = (val, isHot) => {
    if (val === null || val === undefined) return 'rgba(241, 245, 249, 1)';
    const hex = isHot ? getHotColor(val) : getColdColor(val);
    if (hex === '#4ade80') return 'rgba(74, 222, 128, 0.2)';
    if (hex === '#fbbf24') return 'rgba(251, 191, 36, 0.2)';
    if (hex === '#f97316') return 'rgba(249, 115, 22, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
};

export function renderComplianceReport() {
    const container = document.getElementById('compliance-view');
    if (!container) return;

    container.innerHTML = \`
        <div class="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans w-full mx-auto" style="color-scheme: light;">
            <!-- Header -->
            <div class="bg-[#2453c0] text-white p-6 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row justify-between md:items-center">
                <div>
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <span>🌡️</span> Berlin Kitchen — Week 12 Temperature Compliance
                    </h1>
                    <p class="mt-2 text-blue-100 text-sm">
                        CCP At-Dispatch temperatures · Mon 16 Mar — Thu 19 Mar 2026 · Friday pending
                    </p>
                </div>
                <div class="mt-4 md:mt-0 text-right text-xs text-blue-200 leading-tight">
                    <p>Generated: 19 March 2026</p>
                    <p>Bella Bona Berlin</p>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-5 rounded-2xl border-t-4 border-purple-500 shadow-sm flex flex-col justify-center">
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OVERALL COMPLIANCE</div>
                    <div class="text-3xl font-bold text-purple-600 mb-1">54%</div>
                    <div class="text-xs text-slate-400">52 of 97 assessed</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border-t-4 border-orange-500 shadow-sm flex flex-col justify-center">
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">HOT DISHES</div>
                    <div class="text-3xl font-bold text-orange-500 mb-1">11%</div>
                    <div class="text-xs text-slate-400">5 of 44 · target ≥ 65°C</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border-t-4 border-blue-500 shadow-sm flex flex-col justify-center">
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">COLD DISHES</div>
                    <div class="text-3xl font-bold text-blue-500 mb-1">89%</div>
                    <div class="text-xs text-slate-400">47 of 53 · target ≤ 7°C</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex flex-col justify-center">
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">BEST DAY</div>
                    <div class="text-3xl font-bold text-emerald-600 mb-1">Wed</div>
                    <div class="text-xs text-slate-400">18 / 25 = 72%</div>
                </div>
            </div>

            <!-- Daily Breakdown -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">MONDAY 16.03</div>
                    <div class="text-2xl font-bold text-orange-500 mb-3">52%</div>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full rounded-full bg-orange-500" style="width: 52%"></div>
                    </div>
                    <div class="text-[10px] text-slate-400">13 / 25 pass</div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">TUESDAY 17.03</div>
                    <div class="text-2xl font-bold text-red-500 mb-3">48%</div>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full rounded-full bg-red-500" style="width: 48%"></div>
                    </div>
                    <div class="text-[10px] text-slate-400">12 / 25 pass</div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">WEDNESDAY 18.03</div>
                    <div class="text-2xl font-bold text-green-500 mb-3">72%</div>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full rounded-full bg-green-500" style="width: 72%"></div>
                    </div>
                    <div class="text-[10px] text-slate-400">18 / 25 pass</div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">THURSDAY 19.03</div>
                    <div class="text-2xl font-bold text-red-500 mb-3">41%</div>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full rounded-full bg-red-500" style="width: 41%"></div>
                    </div>
                    <div class="text-[10px] text-slate-400">9 / 22 pass · 3 no data</div>
                </div>
                <div class="bg-slate-50 p-4 rounded-xl shadow-sm border border-dashed border-slate-300">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">FRIDAY 20.03</div>
                    <div class="text-2xl font-bold text-slate-300 mb-3">—</div>
                    <div class="h-2 w-full bg-slate-200 rounded-full mb-2"></div>
                    <div class="text-[10px] text-slate-400">Data pending</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div class="mb-6">
                    <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <span>🔥</span> HOT Dishes — CCP At-Dispatch Temperature (avg °C)
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">Target ≥ 65°C at dispatch. Each bar = average of 3 probe readings. Green dashed line = 65°C target.</p>
                    <div class="flex items-center gap-4 mt-4 text-xs font-medium text-slate-600">
                        <span class="font-bold text-slate-800">Colour guide:</span>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#4ade80] rounded"></div> ≥ 65°C — Compliant ✓</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#fbbf24] rounded"></div> 62–64.9°C — Just below target</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#f97316] rounded"></div> 53–61.9°C — Below target</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#ef4444] rounded"></div> &lt; 53°C — Far below target</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-slate-200 rounded"></div> No data</div>
                    </div>
                    <div class="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-medium">
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] rounded-sm"></div> Mon 16.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] rounded-sm"></div> Tue 17.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#4ade80] rounded-sm"></div> Wed 18.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] rounded-sm"></div> Thu 19.03</div>
                    </div>
                </div>
                <div class="h-[400px] w-full relative">
                    <canvas id="hot-compliance-chart"></canvas>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div class="mb-6">
                    <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <span>❄️</span> COLD Dishes — CCP At-Dispatch Temperature (avg °C)
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">Target ≤ 7°C at dispatch. Each bar = average of 3 probe readings. Blue dashed line = 7°C target.</p>
                    <div class="flex items-center gap-4 mt-4 text-xs font-medium text-slate-600">
                        <span class="font-bold text-slate-800">Colour guide:</span>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#4ade80] rounded"></div> ≤ 5°C — Well within target</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#f97316] rounded"></div> 5–7°C — Near limit (PASS)</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-[#ef4444] rounded"></div> &gt; 7°C — Exceeds target (FAIL)</div>
                        <div class="flex items-center gap-1"><div class="w-4 h-4 bg-slate-200 rounded"></div> No data</div>
                    </div>
                    <div class="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-medium">
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#4ade80] rounded-sm"></div> Mon 16.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] rounded-sm"></div> Tue 17.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#f97316] rounded-sm"></div> Wed 18.03</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-[#ef4444] rounded-sm"></div> Thu 19.03</div>
                    </div>
                </div>
                <div class="h-[400px] w-full relative">
                    <canvas id="cold-compliance-chart"></canvas>
                </div>
            </div>

            <!-- Heatmap -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                <div class="p-5 border-b border-slate-100">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <span>📋</span> Dish-Level Compliance Heatmap — Mon to Thu
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Average CCP temperature at dispatch per dish per day. Cell colour = proximity to compliance target. Same colour scale as charts above.</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                <th class="p-3 w-1/3">Dish</th>
                                <th class="p-3 text-center">Type</th>
                                <th class="p-3 text-center">Mon 16.03</th>
                                <th class="p-3 text-center">Tue 17.03</th>
                                <th class="p-3 text-center">Wed 18.03</th>
                                <th class="p-3 text-center">Thu 19.03</th>
                            </tr>
                        </thead>
                        <tbody id="heatmap-body">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    \`;

    // Render Heatmap
    const tbody = document.getElementById('heatmap-body');
    
    const renderCellHtml = (val, th, isHot) => {
        if (val === null) return \`<td class="p-3 text-center text-slate-400 font-medium">—</td>\`;
        const tColor = isHot ? getHotColor(val) : getColdColor(val);
        const isWarn = th && (isHot ? val < 62 : val > 7);
        return \`<td class="p-3 text-center font-bold text-sm border-l border-white" style="background-color: \${getLightColor(val, isHot)}; color: \${tColor}">
            \${val.toFixed(1)}°C \${isWarn ? '<span class="text-yellow-500">⚠️</span>' : ''}
        </td>\`;
    };
    
    const rowsHtml = [
        ...hotData.map(item => \`<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
            <td class="p-3 text-sm font-bold text-slate-700">\${item.name}</td>
            <td class="p-3 text-xs font-bold text-center text-orange-500">HOT</td>
            \${renderCellHtml(item.m, false, true)}
            \${renderCellHtml(item.t, false, true)}
            \${renderCellHtml(item.w, false, true)}
            \${renderCellHtml(item.th, true, true)}
        </tr>\`),
        ...coldData.map(item => \`<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
            <td class="p-3 text-sm font-bold text-slate-700">\${item.name}</td>
            <td class="p-3 text-xs font-bold text-center text-blue-500">COLD</td>
            \${renderCellHtml(item.m, false, false)}
            \${renderCellHtml(item.t, false, false)}
            \${renderCellHtml(item.w, false, false)}
            \${renderCellHtml(item.th, true, false)}
        </tr>\`)
    ];
    tbody.innerHTML = rowsHtml.join('');

    // Initialize Charts
    if (typeof Chart !== 'undefined') {
        const targetLinePlugin = {
            id: 'targetLine',
            afterDraw: (chart) => {
                const yVal = chart.config.options.plugins.targetLine.value;
                const color = chart.config.options.plugins.targetLine.color;
                if (yVal) {
                    const yAxis = chart.scales.y;
                    const ctx = chart.ctx;
                    ctx.save();
                    const yPixel = yAxis.getPixelForValue(yVal);
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(chart.chartArea.left, yPixel);
                    ctx.lineTo(chart.chartArea.right, yPixel);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    ctx.fillStyle = color;
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(yVal + '°C target', chart.chartArea.right + 5, yPixel + 4);
                    ctx.restore();
                }
            }
        };
        
        Chart.register(targetLinePlugin);

        if (window.hotReportChart) window.hotReportChart.destroy();
        const hotCtx = document.getElementById('hot-compliance-chart');
        window.hotReportChart = new Chart(hotCtx, {
            type: 'bar',
            data: {
                labels: hotData.map(d => d.name),
                datasets: [
                    { label: 'Mon 16.03', data: hotData.map(d => d.m), backgroundColor: hotData.map(d => getHotColor(d.m)), borderRadius: 4 },
                    { label: 'Tue 17.03', data: hotData.map(d => d.t), backgroundColor: hotData.map(d => getHotColor(d.t)), borderRadius: 4 },
                    { label: 'Wed 18.03', data: hotData.map(d => d.w), backgroundColor: hotData.map(d => getHotColor(d.w)), borderRadius: 4 },
                    { label: 'Thu 19.03', data: hotData.map(d => d.th), backgroundColor: hotData.map(d => getHotColor(d.th)), borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 30, max: 85, title: { display: true, text: 'Temperature (°C)' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10, family: 'sans-serif' } } }
                },
                plugins: { 
                    legend: { display: false },
                    targetLine: { value: 65, color: '#16a34a' } 
                }
            }
        });

        if (window.coldReportChart) window.coldReportChart.destroy();
        const coldCtx = document.getElementById('cold-compliance-chart');
        window.coldReportChart = new Chart(coldCtx, {
            type: 'bar',
            data: {
                labels: coldData.map(d => d.name),
                datasets: [
                    { label: 'Mon 16.03', data: coldData.map(d => d.m), backgroundColor: coldData.map(d => getColdColor(d.m)), borderRadius: 4 },
                    { label: 'Tue 17.03', data: coldData.map(d => d.t), backgroundColor: coldData.map(d => getColdColor(d.t)), borderRadius: 4 },
                    { label: 'Wed 18.03', data: coldData.map(d => d.w), backgroundColor: coldData.map(d => getColdColor(d.w)), borderRadius: 4 },
                    { label: 'Thu 19.03', data: coldData.map(d => d.th), backgroundColor: coldData.map(d => getColdColor(d.th)), borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 12, title: { display: true, text: 'Temperature (°C)' } },
                    x: { grid: { display: false }, ticks: { font: { size: 10, family: 'sans-serif' } } }
                },
                plugins: { 
                    legend: { display: false },
                    targetLine: { value: 7, color: '#3b82f6' }
                }
            }
        });
    }
}
