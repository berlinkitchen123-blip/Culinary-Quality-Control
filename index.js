
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { renderApp } from "./view-dashboard.js";
import { renderPrepView } from "./view-prep.js";
import { renderProductionView } from "./view-production.js";
import { renderHygieneGrid } from "./view-hygiene.js";

// Main View Controller
export function showView(viewName) {
    state.currentView = viewName;
    
    // Toggle Section visibility
    DOMElements.mainView.classList.toggle('hidden', viewName !== 'dashboard');
    if (DOMElements.productionView) DOMElements.productionView.classList.toggle('hidden', viewName !== 'production');
    if (DOMElements.prepView) DOMElements.prepView.classList.toggle('hidden', viewName !== 'prep');
    if (DOMElements.hygieneView) DOMElements.hygieneView.classList.toggle('hidden', viewName !== 'hygiene');

    // Sidebar Icon Highlighting
    const active = "text-emerald-400 bg-emerald-500/10 shadow-inner";
    const inactive = "text-white/40 hover:text-white";

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
        if (btn) btn.className = `p-2 rounded-md transition-all ${viewName === name ? active : inactive}`;
    });

    // Content Loading based on view
    if (viewName === 'dashboard') renderApp();
    if (viewName === 'prep') renderPrepView();
    if (viewName === 'hygiene') renderHygieneGrid();
    if (viewName === 'production') renderProductionView();
    
    // Update Page Title
    const titles = {
        'dashboard': 'Assign Line Preparation',
        'ingredient': 'Ingredient Quantities',
        'kitchen': 'Kitchen Overview',
        'dish': 'Dish Assignment',
        'forecast': 'Order Forecast',
        'production': 'Production Line',
        'prep': 'Kitchen Log',
        'thermal': 'Thermal Validation',
        'hygiene': 'Hygiene Audit',
        'compliance': 'Compliance Control',
        'audit': 'Analytics Center'
    };
    if (DOMElements.pageTitle) DOMElements.pageTitle.innerText = titles[viewName] || 'Command Center';
}

// Global Event Listeners for Nav
DOMElements.navDashboardBtn.onclick = () => showView('dashboard');
DOMElements.navIngredientBtn.onclick = () => showView('ingredient');
DOMElements.navKitchenBtn.onclick = () => showView('kitchen');
DOMElements.navDishBtn.onclick = () => showView('dish');
DOMElements.navForecastBtn.onclick = () => showView('forecast');
DOMElements.navProductionBtn.onclick = () => showView('production');
DOMElements.navPrepBtn.onclick = () => showView('prep');
DOMElements.navThermalBtn.onclick = () => showView('thermal');
DOMElements.navHygieneBtn.onclick = () => showView('hygiene');
DOMElements.navComplianceBtn.onclick = () => showView('compliance');
DOMElements.navAuditBtn.onclick = () => showView('audit');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showView('dashboard');
    if (DOMElements.headerDateDisplay) {
        DOMElements.headerDateDisplay.innerText = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
});
