
// =============================================
// THERMAL VALIDATION — All temperature records
// Consolidates HACCP cooking + assembly temps
// =============================================

const THERMAL_RECORDS = [
    { id: 't0', stage: 'Cooking', ingredient: 'High-Volume Hot (Chicken)', operator: 'Marco Rossi', temp: 85.5, target: 75, weight: 12500, type: 'hot', time: '08:00', status: 'pass', hasPhoto: true },
    { id: 't1', stage: 'Cooking', ingredient: 'Secondary Hot (Rice)', operator: 'Anna Verdi', temp: 78.5, target: 72, weight: 8000, type: 'hot', time: '09:00', status: 'pass', hasPhoto: true },
    { id: 't2', stage: 'Assembly', ingredient: 'Cordon Bleu with Green Beans', operator: 'Stefan Koch', temp: 72.5, target: 65, weight: 315, type: 'hot', time: '10:00', status: 'pass', hasPhoto: true },
    { id: 't3', stage: 'Assembly', ingredient: 'B&B Butter Chicken with Rice & Naan', operator: 'Stefan Koch', temp: 73.5, target: 65, weight: 420, type: 'hot', time: '10:00', status: 'pass', hasPhoto: true },
    { id: 't4', stage: 'Assembly', ingredient: 'Phanaeng Chicken curry', operator: 'Stefan Koch', temp: 74.5, target: 65, weight: 380, type: 'hot', time: '10:00', status: 'pass', hasPhoto: true },
];

export function renderThermalView() {
    const container = document.getElementById('thermal-view');
    if (!container) return;

    const passes = THERMAL_RECORDS.filter(r => r.status === 'pass').length;
    const fails = THERMAL_RECORDS.filter(r => r.status === 'fail').length;
    const cookingRecords = THERMAL_RECORDS.filter(r => r.stage === 'Cooking');
    const assemblyRecords = THERMAL_RECORDS.filter(r => r.stage === 'Assembly');
    const complianceRate = Math.round((passes / THERMAL_RECORDS.length) * 100);

    container.innerHTML = `
        <div class="p-8 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Thermal Validation</h2>
                    <p class="text-[10px] text-slate-400 font-medium">HACCP temperature records — Cooking & Assembly stages</p>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Records</p>
                    <p class="text-2xl font-bold text-slate-800">${THERMAL_RECORDS.length}</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Compliance Rate</p>
                    <p class="text-2xl font-bold ${complianceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}">${complianceRate}%</p>
                </div>
                <div class="bg-white border border-emerald-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Pass</p>
                    <p class="text-2xl font-bold text-emerald-600">${passes}</p>
                </div>
                <div class="bg-white border ${fails > 0 ? 'border-red-200' : 'border-slate-200'} rounded-xl p-4">
                    <p class="text-[10px] font-bold ${fails > 0 ? 'text-red-500' : 'text-slate-400'} uppercase tracking-wider mb-1">Fail</p>
                    <p class="text-2xl font-bold ${fails > 0 ? 'text-red-600' : 'text-slate-300'}">${fails}</p>
                </div>
            </div>

            <!-- Cooking Stage Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
                    <span class="text-sm">🔥</span>
                    <h3 class="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Cooking Stage — HACCP Records</h3>
                    <span class="ml-auto text-[10px] text-orange-600 font-bold">${cookingRecords.length} records</span>
                </div>
                ${renderThermalTable(cookingRecords)}
            </div>

            <!-- Assembly Stage Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
                    <span class="text-sm">📦</span>
                    <h3 class="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Assembly Stage — HACCP Records</h3>
                    <span class="ml-auto text-[10px] text-blue-600 font-bold">${assemblyRecords.length} records</span>
                </div>
                ${renderThermalTable(assemblyRecords)}
            </div>
        </div>
    `;
}

function renderThermalTable(records) {
    return `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th class="p-3 pl-5">Time</th>
                        <th class="p-3">Item</th>
                        <th class="p-3">Operator</th>
                        <th class="p-3 text-center">Temp (°C)</th>
                        <th class="p-3 text-center">Weight (g)</th>
                        <th class="p-3 text-center">Target</th>
                        <th class="p-3 text-center">Type</th>
                        <th class="p-3 text-center">Result</th>
                        <th class="p-3 text-center">Photo</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => {
                        const isPass = r.status === 'pass';
                        const rowBg = isPass ? '' : 'bg-red-50/50';
                        const tempColor = isPass ? 'text-emerald-600' : 'text-red-600';
                        const typeTag = r.type === 'hot'
                            ? '<span class="px-1.5 py-0.5 text-[8px] font-bold bg-orange-100 text-orange-700 border border-orange-200 rounded">HOT</span>'
                            : '<span class="px-1.5 py-0.5 text-[8px] font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded">COLD</span>';
                        const resultTag = isPass
                            ? '<span class="px-2 py-1 text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">✓ PASS</span>'
                            : '<span class="px-2 py-1 text-[8px] font-bold bg-red-50 text-red-700 border border-red-200 rounded">✗ FAIL</span>';

                        return `
                            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors ${rowBg}">
                                <td class="p-3 pl-5 text-[11px] font-mono font-bold text-slate-600">${r.time}</td>
                                <td class="p-3 text-[11px] font-bold text-slate-800">${r.ingredient}</td>
                                <td class="p-3 text-[11px] text-slate-600">${r.operator}</td>
                                <td class="p-3 text-center text-[12px] font-mono font-bold ${tempColor}">${r.temp}°</td>
                                <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-700">${r.weight >= 1000 ? (r.weight/1000).toFixed(1)+'kg' : r.weight+'g'}</td>
                                <td class="p-3 text-center text-[11px] font-mono text-slate-400">${r.type === 'hot' ? '≥' : '≤'} ${r.target}°</td>
                                <td class="p-3 text-center">${typeTag}</td>
                                <td class="p-3 text-center">${resultTag}</td>
                                <td class="p-3 text-center">${r.hasPhoto ? '<span class="text-emerald-500 text-[10px]">📸</span>' : '<span class="text-slate-300 text-[10px]">—</span>'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
