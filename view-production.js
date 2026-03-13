
import { state } from "./state.js";
import { aggregateProductionData, formatTime } from "./utils.js";

window.toggleProductionDetails = (safeId) => {
    const el = document.getElementById(`prod-details-${safeId}`);
    if (el) {
        el.classList.toggle('hidden');
    }
};

export function renderProductionView() {
    // Filter production orders by the selected date
    const dateFilteredOrders = state.productionOrders.filter(order => order.deliveryDate === state.selectedDate);

    const { dishes, summary } = aggregateProductionData(dateFilteredOrders);
    const container = document.getElementById('production-content-container');
    const headerStats = document.getElementById('production-stats');
    
    headerStats.innerHTML = `
        <div class="px-5 py-3 bg-blue-900/30 border border-blue-500/30 rounded-2xl flex flex-col items-center">
            <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest">Cold</span>
            <span class="text-2xl font-black text-white leading-none mt-1">${summary.cold}</span>
        </div>
        <div class="px-5 py-3 bg-red-900/30 border border-red-500/30 rounded-2xl flex flex-col items-center">
            <span class="text-[9px] font-black text-red-400 uppercase tracking-widest">Hot</span>
            <span class="text-2xl font-black text-white leading-none mt-1">${summary.hot}</span>
        </div>
    `;

    const coldDishes = dishes.filter(d => d.type !== 'hot').sort((a,b) => (a.readyBy || 0) - (b.readyBy || 0));
    const hotDishes = dishes.filter(d => d.type === 'hot').sort((a,b) => (a.readyBy || 0) - (b.readyBy || 0));

    const renderColumn = (title, items, colorTheme) => {
        const borderColor = colorTheme === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';
        const titleColor = colorTheme === 'blue' ? 'text-blue-400' : 'text-red-400';
        const bgHeader = colorTheme === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20';

        let html = `
            <div class="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden h-fit">
                <div class="p-6 border-b border-slate-800 ${bgHeader} flex justify-between items-center">
                    <h3 class="text-xl font-black ${titleColor} uppercase tracking-widest italic">${title} STATION</h3>
                    <span class="text-[10px] font-bold text-slate-500 uppercase bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">${items.length} SKUs</span>
                </div>
                <div class="p-6 space-y-4">
        `;

        if (items.length === 0) {
            html += `<div class="text-center py-10 opacity-50 text-[10px] font-black uppercase tracking-widest text-slate-600">No active orders</div>`;
        } else {
            items.forEach((dish, idx) => {
                const safeId = `${colorTheme}-${idx}`;
                const ingredientsList = Object.values(dish.ingredients).map(ing => `
                    <div class="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 px-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div class="flex items-center gap-3">
                             <div class="h-1.5 w-1.5 rounded-full bg-${colorTheme}-500"></div>
                             <span class="text-[11px] font-bold text-slate-300 uppercase tracking-tight">${ing.name}</span>
                        </div>
                        <span class="text-[11px] font-mono font-black ${titleColor}">${ing.totalWeight.toFixed(0)}g</span>
                    </div>
                `).join('');

                const readyTime = formatTime(dish.readyBy);
                
                html += `
                    <div class="bg-slate-950 border ${borderColor} rounded-[2rem] p-6 shadow-xl relative overflow-hidden cursor-pointer hover:border-opacity-100 transition-all group" onclick="window.toggleProductionDetails('${safeId}')">
                        <div class="flex justify-between items-start">
                            <div class="pr-4">
                                <h4 class="text-lg font-black text-white uppercase leading-none mb-3 group-hover:${titleColor} transition-colors">${dish.name}</h4>
                                <div class="flex gap-2">
                                     <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800">Ready: ${readyTime}</span>
                                     <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800">Date: ${dish.deliveryDate || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-center justify-center bg-slate-900 rounded-2xl w-14 h-14 border border-slate-800 shadow-inner group-hover:bg-slate-800 transition-colors">
                                <span class="text-2xl font-black text-white">${dish.count}</span>
                                <span class="text-[7px] font-bold text-slate-500 uppercase">QTY</span>
                            </div>
                        </div>
                        
                        <div id="prod-details-${safeId}" class="hidden mt-6 pt-6 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                             <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Batch Requirements</p>
                             <div class="bg-slate-900/50 rounded-xl p-2 border border-slate-800/50">
                                ${ingredientsList}
                             </div>
                        </div>
                        
                        <div class="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">Tap for Details</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div></div>`;
        return html;
    };

    container.innerHTML = `
        ${renderColumn('Cold', coldDishes, 'blue')}
        ${renderColumn('Hot', hotDishes, 'red')}
    `;
}
