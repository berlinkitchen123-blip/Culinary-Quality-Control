
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { renderApp } from "./view-dashboard.js";
import { renderPrepView } from "./view-prep.js";
import { renderProductionView } from "./view-production.js";
import { renderHygieneGrid } from "./view-hygiene.js";
import { renderAuditDishLibrary } from "./view-analytics.js";
import { renderComplianceReport } from "./view-compliance.js";
import { renderLogisticsReport } from "./view-logistics.js";
import { renderDishAssignView } from "./view-dish-assign.js";
import { renderIngredientQtyView } from "./view-ingredient-qty.js";
import { renderKitchenOverview } from "./view-kitchen-overview.js";
import { renderThermalView } from "./view-thermal.js";
import { renderForecastView } from "./view-forecast.js";
import { renderAssemblerView } from "./view-assembler.js";
import { BossEngine } from "./boss-engine.js";

// =============================================
// VIEW CONTROLLER
// =============================================
export function showView(viewName) {
    state.currentView = viewName;

    const views = {
        'dashboard': DOMElements.mainView,
        'production': DOMElements.productionView,
        'prep': DOMElements.prepView,
        'hygiene': DOMElements.hygieneView,
        'detail': DOMElements.dishDetailView,
        'audit': DOMElements.aiAgentView,
        'compliance': DOMElements.complianceView,
        'logistics': DOMElements.logisticsView,
        'ingredient': DOMElements.ingredientView,
        'kitchen': DOMElements.kitchenView,
        'dish': DOMElements.dishAssignView,
        'forecast': DOMElements.forecastView,
        'thermal': DOMElements.thermalView,
    };

    Object.entries(views).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', viewName !== key);
    });

    // Sidebar highlighting
    const activeClass = "text-emerald-400 bg-emerald-500/10 shadow-inner";
    const inactiveClass = "text-white/40 hover:text-white";

    const navMap = {
        'dashboard': DOMElements.navDashboardBtn,
        'forecast': DOMElements.navForecastBtn,
        'ingredient': DOMElements.navIngredientBtn,
        'kitchen': DOMElements.navKitchenBtn,
        'thermal': DOMElements.navThermalBtn,
        'dish': DOMElements.navDishBtn,
        'assembler': DOMElements.navAssemblerBtn,
        'audit': DOMElements.navAuditBtn,
        'prep': DOMElements.navPrepBtn,
        'hygiene': DOMElements.navHygieneBtn,
        'compliance': DOMElements.navComplianceBtn,
    };

    Object.entries(navMap).forEach(([name, btn]) => {
        if (btn) {
            btn.className = `p-2 rounded-md transition-all ${viewName === name ? activeClass : inactiveClass}`;
        }
    });

    // Render view
    switch (viewName) {
        case 'dashboard': renderApp(); break;
        case 'forecast': renderForecastView(); break;
        case 'ingredient': renderIngredientQtyView(); break;
        case 'kitchen': renderKitchenOverview(); break;
        case 'thermal': renderThermalView(); break;
        case 'dish': renderDishAssignView(); break;
        case 'assembler': renderAssemblerView(); break; // New view
        case 'audit': renderAuditDishLibrary(); break;
        case 'prep': renderPrepView(); break;
        case 'hygiene': renderHygieneGrid(); break;
        case 'compliance': renderComplianceReport(); break;
    }

    // Page Title
    const titles = {
        'dashboard': 'Assign Line Preparation',
        'forecast': 'Order Forecast & Cutoff',
        'ingredient': 'Ingredient Quantities',
        'kitchen': 'Kitchen Assign',
        'thermal': 'Thermal & Weight Log',
        'dish': 'Manager: Assign Dishes',
        'assembler': 'Assembler Personal View',
        'audit': 'Quality Control',
        'prep': 'HACCP Log',
        'hygiene': 'Hygiene Audit',
        'compliance': 'Temperature Compliance',
        'detail': 'Item Detail',
    };
    if (DOMElements.pageTitle) DOMElements.pageTitle.innerText = titles[viewName] || 'Command Center';
}

window.showView = showView;

// =============================================
// SIDEBAR EVENT LISTENERS
// =============================================
[
    ['navDashboardBtn', 'dashboard'],
    ['navIngredientBtn', 'ingredient'],
    ['navKitchenBtn', 'kitchen'],
    ['navDishBtn', 'dish'],
    ['navForecastBtn', 'forecast'],
    ['navProductionBtn', 'production'],
    ['navPrepBtn', 'prep'],
    ['navThermalBtn', 'thermal'],
    ['navHygieneBtn', 'hygiene'],
    ['navComplianceBtn', 'compliance'],
    ['navAuditBtn', 'audit'],
].forEach(([key, view]) => {
    if (DOMElements[key]) DOMElements[key].onclick = () => showView(view);
});

// =============================================
// DAILY / WEEKLY TOGGLE
// =============================================
if (DOMElements.toggleDailyBtn && DOMElements.toggleWeeklyBtn) {
    DOMElements.toggleDailyBtn.onclick = () => {
        DOMElements.toggleDailyBtn.className = "px-4 py-1.5 bg-white shadow-sm rounded text-slate-800";
        DOMElements.toggleWeeklyBtn.className = "px-4 py-1.5 text-slate-500 hover:text-slate-700";
    };
    DOMElements.toggleWeeklyBtn.onclick = () => {
        DOMElements.toggleWeeklyBtn.className = "px-4 py-1.5 bg-white shadow-sm rounded text-slate-800";
        DOMElements.toggleDailyBtn.className = "px-4 py-1.5 text-slate-500 hover:text-slate-700";
    };
}

// =============================================
// DETAIL BACK BUTTON
// =============================================
if (DOMElements.detailBackBtn) {
    DOMElements.detailBackBtn.onclick = () => {
        if (state.selectedPrepItem) showView('prep');
        else if (state.selectedHygieneItem) showView('hygiene');
        else showView('dashboard');
    };
}

// =============================================
// DAY SELECTOR (AGENT DRIVEN)
// =============================================
function getWeekdayDate(dayCode) {
    const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const targetDay = dayMap[dayCode];
    const diff = targetDay - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate;
}

function formatDateDisplay(dayCode) {
    const date = getWeekdayDate(dayCode);
    const label = dayCode.toUpperCase();
    const formatted = date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();
    return `${label}, ${formatted}`;
}

const dayTabs = document.querySelectorAll('.day-tab');
dayTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        const selectedDay = e.target.getAttribute('data-day'); // 'mon', 'tue', etc.
        
        // Visual toggle
        dayTabs.forEach(t => t.className = "day-tab px-3 py-1.5 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700");
        e.target.className = "day-tab px-3 py-1.5 text-[10px] font-bold rounded shadow-sm bg-white text-slate-800";
        if (DOMElements.headerDateDisplay) {
            DOMElements.headerDateDisplay.innerText = formatDateDisplay(selectedDay);
        }

        // AGENT PROCESSING
        BossEngine.processDay(selectedDay);
    });
});

// =============================================
// INIT
// =============================================
// Determine today's weekday and auto-select the correct tab
const todayDayIndex = new Date().getDay(); // 0=Sun...6=Sat
const dayCodeMap = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
const todayCode = dayCodeMap[todayDayIndex] || 'mon'; // fallback to mon on weekends

BossEngine.processDay(todayCode); // Boot with today's data
showView('dashboard');

// Highlight today's tab and show today's real date
dayTabs.forEach(t => {
    if (t.getAttribute('data-day') === todayCode) {
        t.className = "day-tab px-3 py-1.5 text-[10px] font-bold rounded shadow-sm bg-white text-slate-800";
    } else {
        t.className = "day-tab px-3 py-1.5 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700";
    }
});
if (DOMElements.headerDateDisplay) {
    DOMElements.headerDateDisplay.innerText = formatDateDisplay(todayCode);
}

// =============================================
// GLOBAL DISH MODAL
// =============================================
window.showDishModal = (letterCode) => {
    if (!window._BossData || !window._BossData.activeDishes) return;
    const dish = window._BossData.activeDishes.find(d => d.letter === letterCode);
    if (!dish) return;

    const modal = document.getElementById('modal-container');
    if (!modal) return;

    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 transition-transform flex flex-col max-h-[90vh]">
            <div class="relative h-48 w-full bg-slate-100 flex-shrink-0">
                <img src="${dish.image}" class="w-full h-full object-cover" alt="Dish image" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                    <h3 class="text-xl font-black text-white leading-tight">${dish.name}</h3>
                </div>
                <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="absolute top-4 right-4 h-8 w-8 bg-slate-900/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-slate-900/80 transition-colors">
                    ✕
                </button>
            </div>
            
            <div class="p-6 space-y-6 flex-1 overflow-y-auto">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col items-center">
                        <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Target to Prepare</span>
                        <span class="text-3xl font-black text-emerald-700">${dish.qty}</span>
                    </div>
                    <div class="bg-blue-50 rounded-xl p-3 border border-blue-100 flex flex-col items-center">
                        <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Leftover Stock</span>
                        <span class="text-3xl font-black text-blue-700">${dish.stock}</span>
                    </div>
                </div>

                <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Recent Feedback</h4>
                    <ul class="space-y-2">
                        ${dish.comments.map(c => `<li class="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2"><span>💬</span> ${c}</li>`).join('')}
                    </ul>
                </div>

                <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Bill of Materials</h4>
                    <ul class="space-y-2">
                        ${dish.ingredientsList.map(i => `
                            <li class="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                <span class="font-bold text-slate-700">${i.name}</span>
                                <span class="font-mono text-slate-500">${(i.weight * dish.qty).toLocaleString()}g</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
