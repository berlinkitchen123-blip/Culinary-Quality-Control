
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

// =============================================
// VIEW CONTROLLER
// =============================================
export function showView(viewName) {
    state.currentView = viewName;

    // All view containers mapped by route name
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

    // Hide all, show the target
    Object.entries(views).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', viewName !== key);
    });

    // Sidebar highlighting
    const activeClass = "text-emerald-400 bg-emerald-500/10 shadow-inner";
    const inactiveClass = "text-white/40 hover:text-white";

    const navMap = {
        'dashboard': DOMElements.navDashboardBtn,
        'ingredient': DOMElements.navIngredientBtn,
        'kitchen': DOMElements.navKitchenBtn,
        'dish': DOMElements.navDishBtn,
        'forecast': DOMElements.navForecastBtn,
        'production': DOMElements.navProductionBtn,
        'prep': DOMElements.navPrepBtn,
        'thermal': DOMElements.navThermalBtn,
        'hygiene': DOMElements.navHygieneBtn,
        'compliance': DOMElements.navComplianceBtn,
        'audit': DOMElements.navAuditBtn,
    };

    Object.entries(navMap).forEach(([name, btn]) => {
        if (btn) btn.className = `p-2 rounded-md transition-all ${viewName === name ? activeClass : inactiveClass}`;
    });

    // Render the appropriate view
    switch (viewName) {
        case 'dashboard': renderApp(); break;
        case 'prep': renderPrepView(); break;
        case 'hygiene': renderHygieneGrid(); break;
        case 'production': renderProductionView(); break;
        case 'audit': renderAuditDishLibrary(); break;
        case 'compliance': renderComplianceReport(); break;
        case 'logistics': renderLogisticsReport(); break;
        case 'dish': renderDishAssignView(); break;
    }

    // Page Title
    const titles = {
        'dashboard': 'Assign Line Preparation',
        'ingredient': 'Ingredient Quantities',
        'kitchen': 'Kitchen Command Center',
        'dish': 'Dish Assignment',
        'forecast': 'Order Forecast & Cutoff',
        'production': 'Production Management',
        'prep': 'Kitchen Log (HACCP)',
        'thermal': 'Thermal Validation',
        'hygiene': 'Hygiene Audit',
        'compliance': 'Temperature Compliance',
        'audit': 'Quality Analytics',
        'detail': 'Item Detail',
    };
    if (DOMElements.pageTitle) DOMElements.pageTitle.innerText = titles[viewName] || 'Command Center';
}

// Expose globally so view modules can call it without circular import
window.showView = showView;

// =============================================
// SIDEBAR EVENT LISTENERS
// =============================================
const sidebarBindings = [
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
];

sidebarBindings.forEach(([key, view]) => {
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
// INIT
// =============================================
showView('dashboard');
if (DOMElements.headerDateDisplay) {
    const now = new Date();
    DOMElements.headerDateDisplay.innerText = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();
}
