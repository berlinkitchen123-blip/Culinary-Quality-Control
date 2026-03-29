
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";

// Mock Data to match Lovable Prototype
const MOCK_INGREDIENTS = [
    { id: 'i1', name: 'Steamed Basmati Rice', type: 'Grain', letter: 'R' },
    { id: 'i2', name: 'Butter Chicken Sauce', type: 'Sauce', letter: 'S' },
    { id: 'i3', name: 'Kofta Balls', type: 'Protein', letter: 'K' },
    { id: 'i4', name: 'Leipziger Allerlei', type: 'Vegetable', letter: 'V' },
    { id: 'i5', name: 'Mashed Potatoes', type: 'Side', letter: 'P' },
    { id: 'i6', name: 'Creamy Polenta', type: 'Side', letter: 'C' },
    { id: 'i7', name: 'Duck Ragu', type: 'Protein', letter: 'D' },
    { id: 'i8', name: 'Steamed Quinoa', type: 'Grain', letter: 'Q' },
    { id: 'i9', name: 'Pearl Barley', type: 'Grain', letter: 'B' },
    { id: 'i10', name: 'Sushi Rice', type: 'Grain', letter: 'U' },
    { id: 'i11', name: 'Seared Tuna', type: 'Protein', letter: 'T' }
];

const MOCK_OPERATORS = [
    { id: 'op1', name: 'Marco Rossi', ingredients: [] },
    { id: 'op2', name: 'Luigi Bianchi', ingredients: [] },
    { id: 'op3', name: 'Anna Verdi', ingredients: [] },
    { id: 'op4', name: 'Giuseppe Neri', ingredients: [] },
    { id: 'op5', name: 'Maria Conti', ingredients: [] }
];

export function renderApp() {
    const ingredientsList = document.getElementById('ingredients-list');
    const operatorsGrid = document.getElementById('operators-grid');
    const availableCount = document.getElementById('available-count');
    const operatorsCount = document.getElementById('operators-count');

    if (!ingredientsList || !operatorsGrid) return;

    // Reset
    ingredientsList.innerHTML = '';
    operatorsGrid.innerHTML = '';

    // Render Ingredients
    MOCK_INGREDIENTS.forEach(ing => {
        const card = document.createElement('div');
        card.className = "bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-colors shadow-sm group";
        card.draggable = true;
        card.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify(ing));
            e.currentTarget.classList.add('opacity-50');
        };
        card.ondragend = (e) => { e.currentTarget.classList.remove('opacity-50'); };

        card.innerHTML = `
            <div class="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center border border-slate-200 shadow-inner group-hover:bg-emerald-50">
                <span class="text-xs font-bold text-slate-500 group-hover:text-emerald-600">${ing.letter}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-[11px] font-bold text-slate-800 truncate">${ing.name}</p>
                <p class="text-[9px] text-slate-400 font-medium uppercase tracking-wider">${ing.type}</p>
            </div>
        `;
        ingredientsList.appendChild(card);
    });

    // Render Operators
    MOCK_OPERATORS.forEach(op => {
        const card = document.createElement('div');
        card.className = "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[220px] transition-all";
        
        card.ondragover = (e) => {
            e.preventDefault();
            card.classList.add('border-emerald-500', 'bg-emerald-50/10');
        };
        card.ondragleave = () => {
            card.classList.remove('border-emerald-500', 'bg-emerald-50/10');
        };
        card.ondrop = (e) => {
            e.preventDefault();
            card.classList.remove('border-emerald-500', 'bg-emerald-50/10');
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
            handleAssign(op.id, data);
        };

        card.innerHTML = `
            <div class="bg-[#022c22] p-4 flex items-center gap-3">
                <div class="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-white/80 border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                    <h3 class="text-[12px] font-bold text-white tracking-tight">${op.name}</h3>
                    <p class="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">${op.ingredients.length} ingredients assigned</p>
                </div>
            </div>
            <div class="flex-1 p-6 bg-[#fdf2f8]/30 flex flex-col items-center justify-center gap-3 border-t border-slate-100">
                ${op.ingredients.length === 0 ? `
                    <p class="text-[11px] text-slate-400 font-medium italic">Drop ingredients here</p>
                ` : `
                    <div class="w-full flex flex-wrap gap-2">
                        ${op.ingredients.map(ing => `
                            <div class="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                ${ing.name}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
        operatorsGrid.appendChild(card);
    });

    if (availableCount) availableCount.innerText = `${MOCK_INGREDIENTS.length} ingredients`;
    if (operatorsCount) operatorsCount.innerText = `${MOCK_OPERATORS.length} operators`;
}

function handleAssign(opId, ingredient) {
    const op = MOCK_OPERATORS.find(o => o.id === opId);
    if (!op.ingredients.find(i => i.id === ingredient.id)) {
        op.ingredients.push(ingredient);
        renderApp(); // Re-render for reactivity
    }
}
