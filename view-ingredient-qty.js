
import { Notifications } from "./ui-notifications.js";

// =============================================
// INGREDIENT QUANTITIES — Connected to Inventory
// Shows what kitchen needs vs what's in stock (Epicbase)
// =============================================

// Mock Epicbase inventory data (replace with live API)
const EPICBASE_STOCK = {
    'Steamed Basmati Rice': { stock: 597000, unit: 'g', reorderLevel: 20000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Butter Chicken Sauce': { stock: 8500, unit: 'g', reorderLevel: 10000, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-29' },
    'Chicken Thigh Pieces': { stock: 18329000, unit: 'g', reorderLevel: 8000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Coconut Curry Sauce': { stock: 5200, unit: 'g', reorderLevel: 8000, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-27' },
    'Mashed Potatoes': { stock: 18000, unit: 'g', reorderLevel: 10000, supplier: 'Kartoffel GmbH', lastDelivery: '2026-03-29' },
    'Breaded Schnitzel': { stock: 6500, unit: 'g', reorderLevel: 5000, supplier: 'FreshMeat DE', lastDelivery: '2026-03-28' },
    'Sushi Rice': { stock: 597000, unit: 'g', reorderLevel: 8000, supplier: 'Asia Import', lastDelivery: '2026-03-26' },
    'Seared Tuna': { stock: 2800, unit: 'g', reorderLevel: 5000, supplier: 'FishMarkt Berlin', lastDelivery: '2026-03-27' },
    'Pearl Barley': { stock: 9000, unit: 'g', reorderLevel: 5000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Mixed Salad Greens': { stock: 4200, unit: 'g', reorderLevel: 3000, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Balsamic Dressing': { stock: 1800, unit: 'g', reorderLevel: 2000, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-28' },
    'Grilled Chicken Breast': { stock: 18329000, unit: 'g', reorderLevel: 6000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Cherry Tomatoes': { stock: 5000, unit: 'g', reorderLevel: 2000, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Parmesan Shavings': { stock: 800, unit: 'g', reorderLevel: 500, supplier: 'ItalDeli', lastDelivery: '2026-03-27' },
    'Sesame Soy Dressing': { stock: 1200, unit: 'g', reorderLevel: 1000, supplier: 'Asia Import', lastDelivery: '2026-03-26' },
    'Edamame': { stock: 3500, unit: 'g', reorderLevel: 2000, supplier: 'Asia Import', lastDelivery: '2026-03-27' },
    'Pickled Ginger': { stock: 600, unit: 'g', reorderLevel: 500, supplier: 'Asia Import', lastDelivery: '2026-03-27' },
    'Roasted Chickpeas': { stock: 4000, unit: 'g', reorderLevel: 2000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Harissa Yoghurt': { stock: 2100, unit: 'g', reorderLevel: 1500, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-28' },
    'Roasted Vegetables': { stock: 812000, unit: 'g', reorderLevel: 4000, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Dark Chocolate Mousse': { stock: 5000, unit: 'g', reorderLevel: 3000, supplier: 'Patisserie Berlin', lastDelivery: '2026-03-28' },
    'Whipped Cream': { stock: 2200, unit: 'g', reorderLevel: 1500, supplier: 'Metro AG', lastDelivery: '2026-03-29' },
    'Pumpkin Curry Sauce': { stock: 3800, unit: 'g', reorderLevel: 5000, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-27' },
    'Roasted Pumpkin Pieces': { stock: 4500, unit: 'g', reorderLevel: 3000, supplier: 'BioFresh', lastDelivery: '2026-03-28' },
    'Chicken Tikka Pieces': { stock: 18329000, unit: 'g', reorderLevel: 6000, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Gravy': { stock: 3000, unit: 'g', reorderLevel: 2000, supplier: 'Bella Bona Prep', lastDelivery: '2026-03-28' },
    'Thai Basil': { stock: 200, unit: 'g', reorderLevel: 150, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Fresh Coriander': { stock: 180, unit: 'g', reorderLevel: 150, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Lemon Wedge': { stock: 1500, unit: 'g', reorderLevel: 500, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Coconut Flakes': { stock: 400, unit: 'g', reorderLevel: 300, supplier: 'Asia Import', lastDelivery: '2026-03-27' },
    'Mixed Seasonal Fruit': { stock: 8000, unit: 'g', reorderLevel: 5000, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Mint Leaves': { stock: 120, unit: 'g', reorderLevel: 100, supplier: 'BioFresh', lastDelivery: '2026-03-29' },
    'Honey Drizzle': { stock: 600, unit: 'g', reorderLevel: 400, supplier: 'Metro AG', lastDelivery: '2026-03-28' },
    'Cocoa Powder': { stock: 300, unit: 'g', reorderLevel: 200, supplier: 'Patisserie Berlin', lastDelivery: '2026-03-27' },
};

// Today's requirements (calculated from dish menu after cutoff)
const TODAYS_REQUIREMENTS = [
    { name: 'Steamed Basmati Rice', requiredG: 41400, dishes: ['N Thai CC Chicken (72×200g)', 'P Pumpkin Curry (40×200g)', 'R Butter Chicken (95×200g)'] },
    { name: 'Butter Chicken Sauce', requiredG: 15200, dishes: ['R Butter Chicken (95×160g)'] },
    { name: 'Chicken Tikka Pieces', requiredG: 11400, dishes: ['R Butter Chicken (95×120g)'] },
    { name: 'Coconut Curry Sauce', requiredG: 10800, dishes: ['N Thai CC Chicken (72×150g)'] },
    { name: 'Chicken Thigh Pieces', requiredG: 8640, dishes: ['N Thai CC Chicken (72×120g)'] },
    { name: 'Grilled Chicken Breast', requiredG: 10200, dishes: ['A Chicken Balsamic (85×120g)'] },
    { name: 'Sushi Rice', requiredG: 11160, dishes: ['B Tuna Deopbap (62×180g)'] },
    { name: 'Seared Tuna', requiredG: 6200, dishes: ['B Tuna Deopbap (62×100g)'] },
    { name: 'Pearl Barley', requiredG: 7200, dishes: ['C Moroccan Barley (45×160g)'] },
    { name: 'Mashed Potatoes', requiredG: 8700, dishes: ['O Schnitzel (58×150g)'] },
    { name: 'Breaded Schnitzel', requiredG: 10440, dishes: ['O Schnitzel (58×180g)'] },
    { name: 'Pumpkin Curry Sauce', requiredG: 6400, dishes: ['P Pumpkin Curry (40×160g)'] },
    { name: 'Mixed Salad Greens', requiredG: 6800, dishes: ['A Chicken Balsamic (85×80g)'] },
    { name: 'Balsamic Dressing', requiredG: 2550, dishes: ['A Chicken Balsamic (85×30g)'] },
    { name: 'Dark Chocolate Mousse', requiredG: 12000, dishes: ['D1 Chocolate Mousse (120×100g)'] },
    { name: 'Mixed Seasonal Fruit', requiredG: 12000, dishes: ['D2 Fruit Salad (80×150g)'] },
];

let kitchenUsageLog = {};

export function renderIngredientQtyView() {
    const container = document.getElementById('ingredient-view');
    if (!container) return;

    // Calculate statuses
    const tableRows = TODAYS_REQUIREMENTS.map(req => {
        const stock = EPICBASE_STOCK[req.name] || { stock: 0, unit: 'g', reorderLevel: 0, supplier: 'Unknown' };
        const remaining = stock.stock - req.requiredG;
        const used = kitchenUsageLog[req.name] || 0;
        const actualRemaining = stock.stock - used;
        const pctUsed = req.requiredG > 0 ? Math.round((used / req.requiredG) * 100) : 0;

        let status, statusColor, statusBg;
        if (stock.stock < req.requiredG) {
            status = 'SHORTAGE'; statusColor = 'text-red-600'; statusBg = 'bg-red-50 border-red-200';
        } else if (remaining < stock.reorderLevel) {
            status = 'LOW STOCK'; statusColor = 'text-amber-600'; statusBg = 'bg-amber-50 border-amber-200';
        } else {
            status = 'OK'; statusColor = 'text-emerald-600'; statusBg = 'bg-emerald-50 border-emerald-200';
        }

        return { ...req, stock, remaining, used, actualRemaining, pctUsed, status, statusColor, statusBg };
    }).sort((a, b) => {
        const order = { 'SHORTAGE': 0, 'LOW STOCK': 1, 'OK': 2 };
        return order[a.status] - order[b.status];
    });

    const shortages = tableRows.filter(r => r.status === 'SHORTAGE');
    const lowStock = tableRows.filter(r => r.status === 'LOW STOCK');

    container.innerHTML = `
        <div class="p-8 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Ingredient Quantities</h2>
                    <p class="text-[10px] text-slate-400 font-medium">After cutoff — locked quantities • Epicbase stock sync</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700">
                        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                        Epicbase Connected
                    </span>
                </div>
            </div>

            <!-- Alert Cards -->
            ${shortages.length > 0 ? `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <span class="text-[11px] font-bold text-red-700 uppercase tracking-wider">SHORTAGE ALERT — ${shortages.length} items need immediate reorder</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${shortages.map(s => `<span class="px-2 py-1 bg-red-100 border border-red-300 rounded text-[10px] font-bold text-red-800">${s.name} (need ${(s.requiredG / 1000).toFixed(1)}kg, have ${(s.stock.stock / 1000).toFixed(1)}kg)</span>`).join('')}
                </div>
            </div>` : ''}

            ${lowStock.length > 0 ? `
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">LOW STOCK WARNING — ${lowStock.length} items below reorder level</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${lowStock.map(s => `<span class="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-800">${s.name}</span>`).join('')}
                </div>
            </div>` : ''}

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items</p>
                    <p class="text-2xl font-bold text-slate-800">${tableRows.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shortages</p>
                    <p class="text-2xl font-bold ${shortages.length > 0 ? 'text-red-600' : 'text-emerald-600'}">${shortages.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock</p>
                    <p class="text-2xl font-bold ${lowStock.length > 0 ? 'text-amber-600' : 'text-emerald-600'}">${lowStock.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All OK</p>
                    <p class="text-2xl font-bold text-emerald-600">${tableRows.filter(r => r.status === 'OK').length}</p>
                </div>
            </div>

            <!-- Main Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="p-3 pl-5">Ingredient</th>
                                <th class="p-3 text-center">Required Today</th>
                                <th class="p-3 text-center">Epicbase Stock</th>
                                <th class="p-3 text-center">After Production</th>
                                <th class="p-3 text-center">Kitchen Used</th>
                                <th class="p-3 text-center">Status</th>
                                <th class="p-3 text-center">Used By</th>
                                <th class="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows.map(row => `
                                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors ${row.status === 'SHORTAGE' ? 'bg-red-50/30' : ''}">
                                    <td class="p-3 pl-5">
                                        <p class="text-[11px] font-bold text-slate-800">${row.name}</p>
                                        <p class="text-[9px] text-slate-400">${row.stock.supplier}</p>
                                    </td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-700">${(row.requiredG / 1000).toFixed(1)}kg</td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-700">${(row.stock.stock / 1000).toFixed(1)}kg</td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold ${row.remaining < 0 ? 'text-red-600' : 'text-slate-700'}">${(row.remaining / 1000).toFixed(1)}kg</td>
                                    <td class="p-3 text-center">
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="text-[11px] font-mono font-bold text-slate-600">${(row.used / 1000).toFixed(1)}kg</span>
                                            <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div class="h-full bg-emerald-500 rounded-full transition-all" style="width: ${Math.min(row.pctUsed, 100)}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-3 text-center">
                                        <span class="px-2 py-1 text-[9px] font-bold rounded border ${row.statusBg} ${row.statusColor}">${row.status}</span>
                                    </td>
                                    <td class="p-3">
                                        <div class="flex flex-wrap gap-1 justify-center">
                                            ${row.dishes.map(d => `<span class="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">${d.split(' ')[0]}</span>`).join('')}
                                        </div>
                                    </td>
                                    <td class="p-3 text-center">
                                        <button onclick="window.logIngredientUsage('${row.name}', ${row.requiredG})" class="px-2 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                                            Log Usage
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Inventory Person Reminder Table -->
            <div class="bg-white border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-indigo-50 p-4 border-b border-indigo-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        </div>
                        <div>
                            <h3 class="text-[11px] font-bold text-indigo-800">INVENTORY MANAGER REMINDERS</h3>
                            <p class="text-[9px] text-indigo-500">Action items generated from today's production requirements</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 space-y-2" id="inventory-reminders">
                    ${generateReminders(tableRows)}
                </div>
            </div>
        </div>
    `;

    window.logIngredientUsage = (name, fullQty) => {
        kitchenUsageLog[name] = fullQty;
        Notifications.show(`${name}: Full batch usage logged (${(fullQty / 1000).toFixed(1)}kg)`);
        renderIngredientQtyView();
    };
}

function generateReminders(rows) {
    const reminders = [];

    rows.filter(r => r.status === 'SHORTAGE').forEach(r => {
        const deficit = Math.abs(r.remaining);
        reminders.push({
            priority: 'URGENT',
            color: 'red',
            message: `ORDER NOW: ${r.name} — deficit of ${(deficit / 1000).toFixed(1)}kg. Contact ${r.stock.supplier} immediately.`,
            icon: '🔴'
        });
    });

    rows.filter(r => r.status === 'LOW STOCK').forEach(r => {
        reminders.push({
            priority: 'WARNING',
            color: 'amber',
            message: `REORDER SOON: ${r.name} — stock will be ${(r.remaining / 1000).toFixed(1)}kg after today (below ${(r.stock.reorderLevel / 1000).toFixed(1)}kg reorder level). Supplier: ${r.stock.supplier}`,
            icon: '🟡'
        });
    });

    rows.filter(r => r.status === 'OK' && r.remaining < r.stock.reorderLevel * 1.5).forEach(r => {
        reminders.push({
            priority: 'PLAN',
            color: 'blue',
            message: `PLAN AHEAD: ${r.name} — will need reorder within 2 days at current consumption rate. Last delivery: ${r.stock.lastDelivery}`,
            icon: '🔵'
        });
    });

    if (reminders.length === 0) {
        return `<div class="text-center py-6 text-[10px] text-slate-400 font-medium">✅ No action items — all inventory levels healthy</div>`;
    }

    return reminders.map(r => `
        <div class="flex items-start gap-3 p-3 bg-${r.color}-50/50 border border-${r.color}-100 rounded-lg">
            <span class="text-sm flex-shrink-0 mt-0.5">${r.icon}</span>
            <div class="flex-1">
                <span class="text-[9px] font-bold text-${r.color}-700 uppercase tracking-wider">${r.priority}</span>
                <p class="text-[10px] text-${r.color}-800 font-medium mt-0.5">${r.message}</p>
            </div>
        </div>
    `).join('');
}
