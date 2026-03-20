
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { getWeekId, getStartOfWeek } from "./utils.js";
import { subscribe, fetchMenu, fetchCheckData, updateMenu, updateProductionOrders, listenToProductionOrders } from "./api.js";
import { renderPrepView } from "./view-prep.js";
import { renderProductionView } from "./view-production.js";
import { renderAuditDishLibrary } from "./view-analytics.js";
import { renderApp } from "./view-dashboard.js";
import { renderHygieneGrid } from "./view-hygiene.js";
import { renderComplianceReport } from "./view-compliance.js";
import { renderLogisticsReport } from "./view-logistics.js";

// Main View Controller
export function showView(viewName) {
    state.currentView = viewName;
    DOMElements.mainView.classList.toggle('hidden', viewName !== 'dashboard');
    DOMElements.prepView.classList.toggle('hidden', viewName !== 'prep');
    DOMElements.hygieneView.classList.toggle('hidden', viewName !== 'hygiene');
    DOMElements.aiAgentView.classList.toggle('hidden', viewName !== 'audit');
    DOMElements.dishDetailView.classList.toggle('hidden', viewName !== 'detail');
    DOMElements.productionView.classList.toggle('hidden', viewName !== 'production');
    const compView = document.getElementById('compliance-view');
    if (compView) compView.classList.toggle('hidden', viewName !== 'compliance');
    const logsView = document.getElementById('logistics-view');
    if (logsView) logsView.classList.toggle('hidden', viewName !== 'logistics');

    const active = "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30";
    const activePrep = "bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30";
    const activeHygiene = "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30";
    const activeProd = "bg-orange-600 text-white shadow-2xl shadow-orange-600/30";
    const inactive = "text-slate-400 hover:text-white";

    DOMElements.navDashboardBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'dashboard' ? active : inactive}`;
    DOMElements.navAuditBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'audit' ? active : inactive}`;
    DOMElements.navPrepBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'prep' ? activePrep : inactive}`;
    DOMElements.navHygieneBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'hygiene' ? activeHygiene : inactive}`;
    DOMElements.navProductionBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'production' ? activeProd : inactive}`;
    DOMElements.navLogisticsBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'logistics' ? active : inactive}`;

    const compBtn = document.getElementById('nav-compliance-btn');
    if (compBtn) compBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'compliance' ? active : inactive}`;

    if (viewName === 'audit') { renderAuditDishLibrary(); }
    if (viewName === 'prep') { renderPrepView(); }
    if (viewName === 'hygiene') { renderHygieneGrid(); }
    if (viewName === 'production') { renderProductionView(); }
    if (viewName === 'dashboard') renderApp();
    if (viewName === 'compliance') renderComplianceReport();
    if (viewName === 'logistics') renderLogisticsReport();
}

function renderDateSelector() {
    const viewDate = getStartOfWeek(new Date(state.selectedDate + 'T12:00:00Z'));
    const weekDays = Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(viewDate); d.setDate(viewDate.getDate() + i); return d;
    });
    DOMElements.dateButtonsContainer.innerHTML = '';
    weekDays.forEach(day => {
        const dayString = day.toISOString().split('T')[0];
        const isSelected = dayString === state.selectedDate;
        const button = document.createElement('button');
        button.className = `flex flex-col items-center justify-center w-12 h-16 sm:w-16 sm:h-20 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all duration-300 transform active:scale-90 shadow-xl ${isSelected ? 'bg-indigo-600 text-white shadow-indigo-600/40 ring-4 ring-indigo-400/20' : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'}`;
        button.innerHTML = `<span class="text-[9px] sm:text-[10px] uppercase font-black opacity-70 mb-1">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="text-base sm:text-lg font-black">${day.getDate()}</span>`;
        button.onclick = () => {
            state.selectedDate = dayString;
            renderDateSelector(); // Re-render to update active state

            // Trigger Data Fetches
            fetchCheckData();
            fetchMenu(); // In case week changes

            // Trigger View Updates
            if (state.currentView === 'production') renderProductionView();
            if (state.currentView === 'prep') renderPrepView();
            if (state.currentView === 'dashboard') renderApp();
        };
        DOMElements.dateButtonsContainer.appendChild(button);
    });
}

// Global subscriptions to Data Updates
subscribe(() => {
    if (state.currentView === 'dashboard') renderApp();
    if (state.currentView === 'prep') renderPrepView();
    if (state.currentView === 'hygiene') renderHygieneGrid();
    if (state.currentView === 'production') renderProductionView();
    if (state.currentView === 'logistics') renderLogisticsReport();
    // other views update on activation or internal listeners
});

// Event Listeners
DOMElements.navDashboardBtn.onclick = () => showView('dashboard');
DOMElements.navPrepBtn.onclick = () => showView('prep');
DOMElements.navHygieneBtn.onclick = () => showView('hygiene');
DOMElements.navAuditBtn.onclick = () => showView('audit');
DOMElements.navProductionBtn.onclick = () => showView('production');
DOMElements.navLogisticsBtn.onclick = () => showView('logistics');
const complianceBtn = document.getElementById('nav-compliance-btn');
if (complianceBtn) complianceBtn.onclick = () => showView('compliance');
DOMElements.settingsBtn.onclick = () => DOMElements.settingsModal.classList.remove('hidden');
DOMElements.settingsCloseBtn.onclick = () => DOMElements.settingsModal.classList.add('hidden');
DOMElements.backToMenuBtn.onclick = () => {
    if (state.currentView === 'detail') {
        if (state.selectedPrepItem) {
            showView('prep');
        } else if (state.selectedHygieneItem) {
            showView('hygiene');
        } else {
            showView('dashboard');
        }
    } else {
        showView('dashboard');
    }
};

// Week Navigation Handlers for Date Selector
DOMElements.prevWeekBtn.onclick = () => {
    const d = new Date(state.selectedDate);
    d.setDate(d.getDate() - 7);
    state.selectedDate = d.toISOString().split('T')[0];
    renderDateSelector();
    fetchCheckData();
    fetchMenu();
    if (state.currentView === 'production') renderProductionView();
    if (state.currentView === 'prep') renderPrepView();
    if (state.currentView === 'dashboard') renderApp();
};

DOMElements.nextWeekBtn.onclick = () => {
    const d = new Date(state.selectedDate);
    d.setDate(d.getDate() + 7);
    state.selectedDate = d.toISOString().split('T')[0];
    renderDateSelector();
    fetchCheckData();
    fetchMenu();
    if (state.currentView === 'production') renderProductionView();
    if (state.currentView === 'prep') renderPrepView();
    if (state.currentView === 'dashboard') renderApp();
};

const switchSettingsTab = (tab) => {
    if (tab === 'production') {
        DOMElements.tabProdContent.classList.remove('hidden');
        DOMElements.tabMenuContent.classList.add('hidden');

        DOMElements.tabProdBtn.classList.remove('text-slate-500', 'border-transparent');
        DOMElements.tabProdBtn.classList.add('text-orange-400', 'border-orange-500', 'bg-slate-800/30');

        DOMElements.tabMenuBtn.classList.add('text-slate-500', 'border-transparent');
        DOMElements.tabMenuBtn.classList.remove('text-indigo-400', 'border-indigo-500', 'bg-slate-800/30');
    } else {
        DOMElements.tabProdContent.classList.add('hidden');
        DOMElements.tabMenuContent.classList.remove('hidden');

        DOMElements.tabMenuBtn.classList.remove('text-slate-500', 'border-transparent');
        DOMElements.tabMenuBtn.classList.add('text-indigo-400', 'border-indigo-500', 'bg-slate-800/30');

        DOMElements.tabProdBtn.classList.add('text-slate-500', 'border-transparent');
        DOMElements.tabProdBtn.classList.remove('text-orange-400', 'border-orange-500', 'bg-slate-800/30');
    }
};

DOMElements.tabProdBtn.onclick = () => switchSettingsTab('production');
DOMElements.tabMenuBtn.onclick = () => switchSettingsTab('menu');

DOMElements.settingsSaveBtn.onclick = async () => {
    const prodVal = DOMElements.productionJsonInput.value.trim();
    if (prodVal) {
        try {
            const parsed = JSON.parse(prodVal);
            const dataToSave = Array.isArray(parsed) ? parsed : [parsed];
            await updateProductionOrders(dataToSave);
            DOMElements.productionJsonInput.value = '';
        } catch (e) {
            DOMElements.settingsError.textContent = "Production JSON Invalid format.";
            return;
        }
    }

    const val = DOMElements.jsonInput.value.trim();
    if (val) {
        try {
            const p = JSON.parse(val);
            const dishes = p.dishes.filter(d => d.stickerNo && d.stickerNo !== 'addons').map(d => ({ dishLetter: d.stickerNo, dishName: d.variantName, dishImage: d.webUrl, dishType: ['hot', 'cold'].includes(d.type) ? d.type : 'extras', dishIngredients: (d.ingredients || []).map(i => ({ name: i.name, weight: i.amount + 'g' })), theoreticalWeight: (d.ingredients || []).reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0) }));
            const menuWeekId = getWeekId(new Date(p.startDate + 'T12:00:00Z'));
            await updateMenu(menuWeekId, { dishes, startDate: p.startDate });
            DOMElements.jsonInput.value = '';
            fetchMenu();
        } catch (e) {
            DOMElements.settingsError.textContent = "Menu Manifest Validation Fault.";
            return;
        }
    }

    DOMElements.settingsModal.classList.add('hidden');
    DOMElements.settingsError.textContent = "";
};

// Initial Load
renderDateSelector();
fetchMenu();
fetchCheckData();
listenToProductionOrders();
showView('prep');
