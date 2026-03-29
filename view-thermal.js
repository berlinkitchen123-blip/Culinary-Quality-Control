
// =============================================
// THERMAL VALIDATION — All temperature records
// Consolidates HACCP cooking + assembly temps
// =============================================

const THERMAL_RECORDS = [
    // Cooking stage temps
    { id: 't1', stage: 'Cooking', ingredient: 'Chicken Thigh Pieces', operator: 'Giuseppe Neri', temp: 78.5, target: 75, type: 'hot', time: '07:25', status: 'pass', hasPhoto: true },
    { id: 't2', stage: 'Cooking', ingredient: 'Grilled Chicken Breast', operator: 'Elena Weber', temp: 74.1, target: 75, type: 'hot', time: '07:20', status: 'fail', hasPhoto: true },
    { id: 't3', stage: 'Cooking', ingredient: 'Mashed Potatoes', operator: 'Maria Conti', temp: 72.0, target: 65, type: 'hot', time: '06:50', status: 'pass', hasPhoto: true },
    { id: 't4', stage: 'Cooking', ingredient: 'Mixed Salad Greens', operator: 'Elena Weber', temp: 4.2, target: 7, type: 'cold', time: '05:55', status: 'pass', hasPhoto: true },
    { id: 't5', stage: 'Cooking', ingredient: 'Steamed Basmati Rice', operator: 'Anna Verdi', temp: 82.3, target: 75, type: 'hot', time: '07:45', status: 'pass', hasPhoto: false },
    { id: 't6', stage: 'Cooking', ingredient: 'Pearl Barley', operator: 'Anna Verdi', temp: 76.1, target: 75, type: 'hot', time: '08:10', status: 'pass', hasPhoto: true },
    { id: 't7', stage: 'Cooking', ingredient: 'Butter Chicken Sauce', operator: 'Marco Rossi', temp: 88.5, target: 75, type: 'hot', time: '08:15', status: 'pass', hasPhoto: true },
    { id: 't8', stage: 'Cooking', ingredient: 'Seared Tuna', operator: 'Elena Weber', temp: 63.0, target: 63, type: 'hot', time: '07:55', status: 'pass', hasPhoto: true },

    // Assembly stage temps
    { id: 't9', stage: 'Assembly', ingredient: 'Dish A — Chicken Balsamic', operator: 'Stefan Koch', temp: 5.1, target: 7, type: 'cold', time: '09:15', status: 'pass', hasPhoto: true },
    { id: 't10', stage: 'Assembly', ingredient: 'Dish R — Butter Chicken', operator: 'Elena Weber', temp: 68.2, target: 65, type: 'hot', time: '09:30', status: 'pass', hasPhoto: true },
    { id: 't11', stage: 'Assembly', ingredient: 'Dish O — Schnitzel Plate', operator: 'Amir Yilmaz', temp: 62.5, target: 65, type: 'hot', time: '09:45', status: 'fail', hasPhoto: true },
    { id: 't12', stage: 'Assembly', ingredient: 'Dish N — Thai CC Chicken', operator: 'Stefan Koch', temp: 71.0, target: 65, type: 'hot', time: '10:00', status: 'pass', hasPhoto: false },
    { id: 't13', stage: 'Assembly', ingredient: 'Dish B — Tuna Deopbap', operator: 'Amir Yilmaz', temp: 3.8, target: 7, type: 'cold', time: '10:15', status: 'pass', hasPhoto: true },
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
                        <th class="p-3 text-center">Measured</th>
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
                                <td class="p-3 text-center text-[12px] font-mono font-bold ${tempColor}">${r.temp}°C</td>
                                <td class="p-3 text-center text-[11px] font-mono text-slate-400">${r.type === 'hot' ? '≥' : '≤'} ${r.target}°C</td>
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
