
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { renderApp } from "./view-dashboard.js";
import { renderPrepView } from "./view-prep.js";
import { renderProductionView } from "./view-production.js";
import { renderHygieneGrid } from "./view-hygiene.js";

// Page initialization
export function showView(viewName) {
    state.currentView = viewName;
    
    // Toggle View Containers
    const visibilityMap = {
        'dashboard': DOMElements.mainView,
        'production': DOMElements.productionView,
        'prep': DOMElements.prepView,
        'hygiene': DOMElements.hygieneView,
        'compliance': DOMElements.complianceView,
        'audit': DOMElements.analyticsView,
    };

    Object.entries(visibilityMap).forEach(([key, container]) => {
        if (container) container.classList.toggle('hidden', viewName !== key);
    });

    // Sidebar State
    const activeClass = "text-emerald-400 bg-emerald-500/10 shadow-inner";
    const inactiveClass = "text-white/40 hover:text-white";

    const navButtons = {
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
        'audit': DOMElements.navAuditBtn
    };

    Object.entries(navButtons).forEach(([name, btn]) => {
        if (btn) btn.className = `p-2 rounded-md transition-all ${viewName === name ? activeClass : inactiveClass}`;
    });

    // Sub-view rendering
    if (viewName === 'dashboard') renderApp();
    if (viewName === 'prep') renderPrepView();
    if (viewName === 'hygiene') renderHygieneGrid();
    if (viewName === 'production') renderProductionView();

    // Titles
    const titles = {
        'dashboard': 'Assign Line Preparation',
        'ingredient': 'Ingredient Inventory',
        'kitchen': 'Kitchen Command Center',
        'dish': 'Dish Assignment Logic',
        'forecast': 'Forecast Analysis',
        'production': 'Production Management',
        'prep': 'Kitchen Operation Log',
        'thermal': 'Thermal Validation Grid',
        'hygiene': 'Hygiene Compliance',
        'compliance': 'Quality Compliance',
        'audit': 'Audit & Metrics'
    };
    if (DOMElements.pageTitle) DOMElements.pageTitle.innerText = titles[viewName] || 'Command Center';
}

// Attach Event Listeners Safely
const navMap = [
    { btn: DOMElements.navDashboardBtn, view: 'dashboard' },
    { btn: DOMElements.navIngredientBtn, view: 'ingredient' },
    { btn: DOMElements.navKitchenBtn, view: 'kitchen' },
    { btn: DOMElements.navDishBtn, view: 'dish' },
    { btn: DOMElements.navForecastBtn, view: 'forecast' },
    { btn: DOMElements.navProductionBtn, view: 'production' },
    { btn: DOMElements.navPrepBtn, view: 'prep' },
    { btn: DOMElements.navThermalBtn, view: 'thermal' },
    { btn: DOMElements.navHygieneBtn, view: 'hygiene' },
    { btn: DOMElements.navComplianceBtn, view: 'compliance' },
    { btn: DOMElements.navAuditBtn, view: 'audit' }
];

navMap.forEach(item => {
    if (item.btn) item.btn.onclick = () => showView(item.view);
});

// Toggles
if (DOMElements.toggleDailyBtn) {
    DOMElements.toggleDailyBtn.onclick = () => {
        DOMElements.toggleDailyBtn.classList.replace('text-slate-500', 'bg-white');
        DOMElements.toggleWeeklyBtn.classList.replace('bg-white', 'text-slate-500');
    };
}
if (DOMElements.toggleWeeklyBtn) {
    DOMElements.toggleWeeklyBtn.onclick = () => {
        DOMElements.toggleWeeklyBtn.classList.replace('text-slate-500', 'bg-white');
        DOMElements.toggleDailyBtn.classList.replace('bg-white', 'text-slate-500');
    };
}

// Ready
document.addEventListener('DOMContentLoaded', () => {
    showView('dashboard');
    if (DOMElements.headerDateDisplay) {
        DOMElements.headerDateDisplay.innerText = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
});
