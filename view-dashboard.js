
import { state } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { getStartOfWeek, isDishMatch } from "./utils.js";
import { fetchCheckData, saveCheckData } from "./api.js";
import { GoogleGenAI } from "https://esm.run/@google/genai";
import { showView } from "./index.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { database } from "./firebase-config.js";

// Global handleSelectDish
window.handleSelectDish = (dishLetter) => {
    if (!state.menu || !state.menu.dishes) return;
    const dish = state.menu.dishes.find(d => d.dishLetter === dishLetter);
    if (dish) {
        state.selectedDish = dish;
        state.selectedPrepItem = null;
        showView('detail');
        renderDishCard();
    }
};

export function renderApp() {
    DOMElements.loadingIndicator.classList.toggle('hidden', !state.isMenuLoading && !state.isCheckDataLoading);
    DOMElements.mainView.classList.toggle('hidden', state.isMenuLoading || state.isCheckDataLoading || state.currentView !== 'dashboard');
    if (state.menu && state.menu.dishes.length > 0) {
        DOMElements.welcomePlaceholder.classList.add('hidden');
        DOMElements.dishGridContainer.classList.remove('hidden');
        DOMElements.dailySummarySection.classList.remove('hidden');
        renderDishSelectionGrid();
        renderDailySummaryTable();
    } else {
        renderWelcomePlaceholder();
        DOMElements.dailySummarySection.classList.add('hidden');
    }
}

function renderWelcomePlaceholder() {
    DOMElements.welcomePlaceholder.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 animate-in fade-in zoom-in-95 duration-500">
            <div class="bg-slate-800/50 p-6 rounded-[2.5rem] mb-8 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Menu Manifest Missing</h3>
            <p class="text-slate-400 max-w-sm mb-8 text-sm font-medium leading-relaxed">
                No data structure found for the current week. Initialize the system by importing a JSON menu manifest.
            </p>
            <button onclick="document.getElementById('settings-btn').click()" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border-b-4 border-indigo-800">
                Configure System
            </button>
        </div>
    `;
    DOMElements.welcomePlaceholder.classList.remove('hidden');
    DOMElements.dishGridContainer.classList.add('hidden');
}

function renderDishSelectionGrid() {
    DOMElements.dishGridContainer.innerHTML = '';
    const sorted = [...(state.menu.dishes || [])].sort((a,b) => a.dishLetter.localeCompare(b.dishLetter));
    const groups = { cold: sorted.filter(d => d.dishType === 'cold'), hot: sorted.filter(d => d.dishType === 'hot'), extras: sorted.filter(d => d.dishType !== 'cold' && d.dishType !== 'hot') };
    const themes = { hot: 'bg-red-500', cold: 'bg-blue-500', default: 'bg-indigo-600' };

    Object.keys(groups).forEach(type => {
        const list = groups[type];
        if (list.length === 0) return;
        const h = document.createElement('div'); h.className = 'col-span-full text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-8 mb-3 pl-3 border-l-4 border-indigo-500/30'; h.textContent = `${type} BLOCK`;
        DOMElements.dishGridContainer.appendChild(h);
        list.forEach(dish => {
            const isChecked = !!state.checkedData[dish.dishLetter];
            const button = document.createElement('button');
            button.className = `group relative flex flex-col items-center justify-center p-4 sm:p-6 border border-slate-700/50 rounded-[1.75rem] sm:rounded-[2.5rem] bg-slate-800/50 hover:scale-105 active:scale-95 shadow-xl backdrop-blur-md transition-all duration-300`;
            button.onclick = () => { state.selectedDish = dish; state.selectedPrepItem = null; showView('detail'); renderDishCard(); };
            button.innerHTML = `
                ${isChecked ? '<div class="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 text-white shadow-2xl ring-4 ring-slate-900 z-10"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="5" d="M5 13l4 4L19 7"></path></svg></div>' : ''}
                <div class="mb-3 sm:mb-4 h-12 w-12 sm:h-14 sm:w-14 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center text-lg sm:text-xl font-black shadow-2xl ${themes[dish.dishType] || themes.default} text-white uppercase italic">${dish.dishLetter}</div>
                <p class="font-black text-[9px] sm:text-[11px] text-slate-300 px-1 text-center line-clamp-2 uppercase h-8 sm:h-10 flex items-center group-hover:text-white leading-tight">${dish.dishName}</p>
            `;
            DOMElements.dishGridContainer.appendChild(button);
        });
    });
}

function renderDailySummaryTable() {
    if (!state.menu || !state.menu.dishes) return;
    const sorted = [...state.menu.dishes].sort((a,b) => a.dishLetter.localeCompare(b.dishLetter));
    
    const createTableHTML = (list, type) => {
        if (list.length === 0) return '';
        const headerColor = type === 'hot' ? 'bg-red-600/30' : type === 'cold' ? 'bg-blue-600/30' : 'bg-slate-700/50';
        const letterColor = type === 'hot' ? 'text-red-400' : type === 'cold' ? 'text-blue-400' : 'text-white';
        const nameColor = type === 'hot' ? 'text-red-400' : type === 'cold' ? 'text-blue-400' : 'text-slate-300';
        
        return `
            <div class="bg-slate-800/40 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-xl h-full flex flex-col min-h-[150px]">
                <div class="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white border-b border-white/5 ${headerColor}">
                    ${type} Recap
                </div>
                <div class="flex-grow">
                    <table class="w-full divide-y divide-slate-800 text-[9px] sm:text-[10px] table-fixed">
                        <thead class="bg-slate-950/60 text-slate-500 uppercase font-black">
                            <tr>
                                <th class="px-2 py-3 text-center w-[12%]">ID</th>
                                <th class="px-2 py-3 text-left w-[25%]">Dish</th>
                                <th class="px-1 py-3 text-center w-[12%]">Temp</th>
                                <th class="px-1 py-3 text-center w-[12%]">Act.W</th>
                                <th class="px-1 py-3 text-center w-[12%]">AI</th>
                                <th class="px-1 py-3 text-left w-[27%]">AI Insight</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/50">
                            ${list.map(dish => {
                                const check = state.checkedData[dish.dishLetter];
                                const temps = (check?.temperatures || []).map(t => parseFloat(t)).filter(t => !isNaN(t));
                                const avgTemp = temps.length ? (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1) + '°' : '-';
                                const weights = (check?.weights || []).map(w => parseFloat(w)).filter(w => !isNaN(w));
                                const avgWgt = weights.length ? (weights.reduce((a,b)=>a+b,0)/weights.length).toFixed(0) + 'g' : '-';
                                let theo = dish.theoreticalWeight;
                                if (!theo) theo = (dish.dishIngredients || []).reduce((sum, ing) => sum + (parseFloat(ing.amount) || parseFloat(ing.weight) || 0), 0);
                                const ai = check?.aiCheckResult?.score || '-';
                                const aiClass = check && ai > 7 ? 'text-green-400' : 'text-indigo-400';
                                const aiInsight = check?.aiCheckResult?.overall_comment || '';

                                return `
                                    <tr class="hover:bg-slate-700/40 cursor-pointer transition-colors ${!check ? 'opacity-30' : ''}" onclick="window.handleSelectDish('${dish.dishLetter}')">
                                        <td class="px-2 py-3 text-center font-black ${letterColor}">${dish.dishLetter}</td>
                                        <td class="px-2 py-3 ${nameColor} font-bold uppercase truncate italic">${dish.dishName}</td>
                                        <td class="px-1 py-3 text-center font-mono text-orange-300">${avgTemp}</td>
                                        <td class="px-1 py-3 text-center font-mono text-emerald-300">${avgWgt}</td>
                                        <td class="px-1 py-3 text-center font-black ${aiClass}">${ai}</td>
                                        <td class="px-1 py-3 text-left text-slate-500 italic truncate text-[8px] tracking-wide max-w-[100px]">${aiInsight}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    };

    let splitHtml = `
        <div id="cold-summary">${createTableHTML(sorted.filter(d => d.dishType === 'cold'), 'cold')}</div>
        <div id="hot-summary">${createTableHTML(sorted.filter(d => d.dishType === 'hot'), 'hot')}</div>
    `;
    const extras = sorted.filter(d => d.dishType !== 'cold' && d.dishType !== 'hot');
    if (extras.length > 0) splitHtml += `<div class="full-width-section">${createTableHTML(extras, 'additional')}</div>`;
    
    DOMElements.dailySummaryContainer.innerHTML = splitHtml;
}

export function renderDishCard() {
    const dish = state.selectedDish; if (!dish) return;
    const savedData = state.checkedData[dish.dishLetter];
    const formData = savedData || { temperatures: ['', '', ''], weights: ['', '', ''], comment: '', selectedIngredients: [] };
    const headerBg = dish.dishType === 'hot' ? 'bg-red-600/30' : dish.dishType === 'cold' ? 'bg-blue-600/30' : 'bg-indigo-600/30';
    DOMElements.dishCardContainer.innerHTML = `
        <div class="bg-slate-800/80 rounded-[2.5rem] sm:rounded-[4.5rem] shadow-2xl overflow-hidden border border-slate-700/50 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
            <div class="px-6 py-10 sm:px-14 sm:py-12 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start ${headerBg} border-b border-white/5">
                <div>
                    <h3 class="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter italic underline underline-offset-8 decoration-white/20 leading-tight">${dish.dishLetter} — ${dish.dishName}</h3>
                    <div id="historical-intel-container" class="mt-6 sm:mt-8"></div>
                </div>
            </div>
            <form id="dish-form" class="p-6 sm:p-14 space-y-10 sm:space-y-14">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
                    <div class="space-y-4 sm:space-y-5"><p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] pl-6">Neural Blueprint</p><div class="aspect-square rounded-[2rem] sm:rounded-[4rem] overflow-hidden border-4 border-slate-700 shadow-2xl"><img src="${dish.dishImage}" class="w-full h-full object-cover"/></div></div>
                    <div id="camera-container" class="space-y-4 sm:space-y-5"></div>
                </div>
                
                <div id="ai-feedback-container">
                    ${!savedData?.aiCheckResult ? `
                        <div class="p-8 border border-dashed border-indigo-900/40 bg-indigo-950/20 rounded-[2rem] flex flex-col items-center justify-center text-center">
                            <span class="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">AI Analysis Pending</span>
                            <span class="text-slate-600 text-[9px] uppercase tracking-wider">Capture photo to initiate neural audit</span>
                        </div>
                    ` : ''}
                </div>

                <div class="bg-slate-900/80 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-700/50 shadow-inner">
                    <div class="flex items-center justify-between mb-8 sm:mb-10 px-4 sm:px-6 border-b border-slate-800 pb-5 sm:pb-7"><h4 class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Structure Metrics</h4><span class="text-xl sm:text-2xl font-black text-indigo-400 font-mono italic">${dish.theoreticalWeight?.toFixed(0) || '0'}g Target</span></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">${(dish.dishIngredients || []).map(ing => `<label class="flex items-center justify-between p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-800/80 border border-slate-700 cursor-pointer group shadow-xl hover:bg-slate-700/50 transition-colors"><div class="flex items-center gap-4 overflow-hidden"><input type="checkbox" name="selectedIngredients" value="${ing.name}" class="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600 bg-slate-950 rounded-xl" ${(formData.selectedIngredients || []).includes(ing.name) ? 'checked' : ''}><span class="font-bold sm:font-black text-slate-200 text-xs sm:text-sm tracking-tight uppercase italic break-words leading-tight">${ing.name}</span></div><span class="text-[11px] sm:text-[12px] font-black text-slate-500 font-mono opacity-90 ml-3 whitespace-nowrap">${ing.weight}</span></label>`).join('')}</div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-14">
                    <div class="space-y-6 sm:space-y-8"><p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] pl-6">Thermal Logic (°C)</p>${(formData.temperatures || ['', '', '']).map((t, i) => `<input type="number" inputmode="decimal" step="any" name="temperatures" value="${t}" placeholder="Probe ${i + 1}" class="block w-full px-8 py-6 sm:px-10 sm:py-7 bg-slate-950/80 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] text-base sm:text-lg text-indigo-400 font-mono font-black focus:border-indigo-500 outline-none transition-all shadow-inner">`).join('')}</div>
                    <div class="space-y-6 sm:space-y-8"><p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] pl-6">Mass Flux (g)</p>${(formData.weights || ['', '', '']).map((w, i) => `<input type="number" inputmode="decimal" step="any" name="weights" value="${w}" placeholder="Sample ${i + 1}" class="block w-full px-8 py-6 sm:px-10 sm:py-7 bg-slate-950/80 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] text-base sm:text-lg text-indigo-400 font-mono font-black focus:border-indigo-500 outline-none transition-all shadow-inner">`).join('')}</div>
                </div>
                <div class="space-y-5"><h4 class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 sm:mb-6 pl-6">Operational Notes</h4><textarea name="comment" rows="5" placeholder="Detailed observations..." class="block w-full px-8 py-6 sm:px-10 sm:py-8 bg-slate-950/80 border border-slate-800 rounded-[2rem] sm:rounded-[3rem] text-xs sm:text-sm text-slate-200 outline-none transition-all shadow-inner resize-none leading-relaxed italic">${formData.comment || ''}</textarea></div>
                <div class="pt-8 sm:pt-12 flex flex-col sm:flex-row gap-6 sm:gap-8">
                    <button type="button" id="edit-btn" class="flex-1 py-6 sm:py-7 text-[11px] font-black rounded-[2rem] text-slate-300 border border-slate-700 hover:bg-slate-700/50 uppercase tracking-[0.4em] transition-all">Unlock Log</button>
                    <button type="submit" id="submit-btn" class="flex-[2] py-6 sm:py-7 text-[11px] font-black text-white bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/50 hover:bg-indigo-500 uppercase tracking-[0.4em] border-b-8 border-indigo-900 transition-all">Commit State</button>
                </div>
            </form>
        </div>
    `;

    if (savedData && !savedData.capturedImage) {
         const imgRef = ref(database, `check-images/${state.selectedDate}/${dish.dishLetter}`);
         get(imgRef).then((snapshot) => {
             if (snapshot.exists()) {
                 const val = snapshot.val();
                 const preview = document.getElementById('preview-img');
                 const placeholder = document.getElementById('camera-placeholder');
                 const previewContainer = document.getElementById('image-preview');
                 const form = document.getElementById('dish-form');
                 if (preview && placeholder && previewContainer && form) {
                     preview.src = val;
                     form.dataset.capturedImage = val;
                     placeholder.classList.add('hidden');
                     previewContainer.classList.remove('hidden');
                 }
             }
         });
    }

    const form = DOMElements.dishCardContainer.querySelector('#dish-form');
    const setFormDisabled = (disabled) => { form.querySelectorAll('input, textarea').forEach(el => el.disabled = disabled); DOMElements.dishCardContainer.querySelector('#edit-btn').classList.toggle('hidden', !disabled); DOMElements.dishCardContainer.querySelector('#submit-btn').classList.toggle('hidden', disabled); };
    DOMElements.dishCardContainer.querySelector('#edit-btn').onclick = () => setFormDisabled(false);
    form.onsubmit = (e) => {
        e.preventDefault(); const data = new FormData(e.target);
        saveCheckData({ dishLetter: dish.dishLetter, dishName: dish.dishName, dishType: dish.dishType, date: state.selectedDate, capturedImage: e.target.dataset.capturedImage || null, selectedIngredients: data.getAll('selectedIngredients'), temperatures: data.getAll('temperatures'), weights: data.getAll('weights'), comment: data.get('comment'), aiCheckResult: e.target.dataset.aiFeedback ? JSON.parse(e.target.dataset.aiFeedback) : null, timestamp: new Date().toISOString() });
    };
    setFormDisabled(!!savedData);
    renderCameraCapture({ dishName: dish.dishName }, savedData?.capturedImage);
    if (savedData?.aiCheckResult) renderAiFeedback(savedData.aiCheckResult);
    renderHistoricalIntel(dish.dishName);
}

function renderCameraCapture(item, initialImage) {
    const container = document.getElementById('camera-container');
    container.innerHTML = `<p class="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 sm:mb-5 text-center">Specimen Optic Capture</p><div id="camera-placeholder" class="w-full aspect-square rounded-[2rem] sm:rounded-[4rem] bg-slate-950 border-4 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 cursor-pointer overflow-hidden shadow-inner hover:border-indigo-500/50 transition-all"><svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 sm:h-16 sm:w-16 mb-4 sm:mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg><span class="text-[11px] sm:text-[12px] uppercase font-black tracking-widest">Activate Camera</span></div><div id="camera-view" class="w-full aspect-square rounded-[2rem] sm:rounded-[4rem] bg-black hidden relative overflow-hidden"><video id="camera-video" autoplay playsinline class="w-full h-full object-cover"></video><button type="button" id="capture-btn" class="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[8px] sm:border-[10px] border-white/20 bg-indigo-600 shadow-2xl active:scale-90 transition-all"></button></div><div id="image-preview" class="w-full aspect-square rounded-[2rem] sm:rounded-[4rem] relative hidden group border-4 border-slate-700 overflow-hidden shadow-2xl"><img id="preview-img" class="w-full h-full object-cover"/><div class="absolute inset-0 bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xl"><button type="button" id="retake-btn" class="px-10 py-4 sm:px-12 sm:py-5 bg-white text-slate-900 rounded-[1.5rem] sm:rounded-[2rem] text-[11px] sm:text-[12px] font-black uppercase tracking-[0.4em] border-b-4 border-slate-300">Recapture</button></div></div>`;
    const videoEl = container.querySelector('#camera-video'); const form = DOMElements.dishCardContainer.querySelector('form'); let stream = null;
    container.querySelector('#camera-placeholder').onclick = async () => { if (form.querySelector('input').disabled) return; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); videoEl.srcObject = stream; container.querySelector('#camera-placeholder').classList.add('hidden'); container.querySelector('#camera-view').classList.remove('hidden'); } catch (e) { alert("Camera offline."); } };
    container.querySelector('#capture-btn').onclick = () => { const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; canvas.getContext('2d').drawImage(videoEl, 0, 0, 1024, 1024); const dataUrl = canvas.toDataURL('image/jpeg', 0.95); container.querySelector('#preview-img').src = dataUrl; form.dataset.capturedImage = dataUrl; if (stream) stream.getTracks().forEach(t => t.stop()); container.querySelector('#camera-view').classList.add('hidden'); container.querySelector('#image-preview').classList.remove('hidden'); if(form.id === 'dish-form') handleAiCheck(state.selectedDish, dataUrl); };
    container.querySelector('#retake-btn').onclick = () => { if (!form.querySelector('input').disabled) { container.querySelector('#image-preview').classList.add('hidden'); container.querySelector('#camera-placeholder').classList.remove('hidden'); } };
    if (initialImage) { container.querySelector('#preview-img').src = initialImage; form.dataset.capturedImage = initialImage; container.querySelector('#camera-placeholder').classList.add('hidden'); container.querySelector('#image-preview').classList.remove('hidden'); }
}

async function handleAiCheck(dish, capturedImageDataUrl) {
    const feedbackContainer = document.getElementById('ai-feedback-container'); if (!feedbackContainer) return;
    feedbackContainer.innerHTML = `<div class="p-10 sm:p-14 border-2 border-indigo-500/30 bg-indigo-900/10 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col items-center justify-center space-y-6 sm:space-y-8 shadow-2xl backdrop-blur-3xl"><div class="relative w-10 h-10 sm:w-12 sm:h-12"><div class="absolute inset-0 border-4 sm:border-8 border-indigo-500/10 rounded-full"></div><div class="absolute inset-0 border-4 sm:border-8 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div><p class="font-black text-indigo-400 text-[10px] sm:text-[12px] uppercase tracking-[0.6em] animate-pulse italic">Analyzing Visual Compliance</p></div>`;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); let refImgPart = null; try { const refRes = await fetch(dish.dishImage); if (refRes.ok) { const blob = await refRes.blob(); const refBase64 = await new Promise(res => { const fr = new FileReader(); fr.onloadend = () => res(fr.result.split(',')[1]); fr.readAsDataURL(blob); }); refImgPart = { inlineData: { mimeType: 'image/jpeg', data: refBase64 } }; } } catch (e) { console.warn("Reference failed."); }
        const result = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [ { text: `Audit '${dish.dishName}'. JSON: { "score": 1-10, "positives": string[], "improvements": string[], "overall_comment": string }` }, ...(refImgPart ? [refImgPart] : []), { inlineData: { mimeType: 'image/jpeg', data: capturedImageDataUrl.split(',')[1] } } ] }, config: { responseMimeType: "application/json", temperature: 0.1 } });
        const feedbackData = JSON.parse(result.text); document.getElementById('dish-form').dataset.aiFeedback = JSON.stringify(feedbackData); renderAiFeedback(feedbackData);
    } catch (e) { feedbackContainer.innerHTML = `<div class="p-8 border border-red-900/40 bg-red-950/30 rounded-[2rem] text-[10px] text-red-400 uppercase font-black text-center shadow-xl">AI Logic Disconnected</div>`; }
}

function renderAiFeedback(feedbackData) {
    const container = document.getElementById('ai-feedback-container'); if (!container || !feedbackData) return;
    container.innerHTML = `<div class="bg-slate-900/90 border border-slate-700/50 rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-12 duration-700"><div class="px-8 py-6 sm:px-12 sm:py-8 flex justify-between items-center bg-slate-800/80 border-b border-white/5"><span class="text-[9px] sm:text-[11px] font-black uppercase text-indigo-400 tracking-[0.5em]">Neural Insight Logic</span><span class="text-2xl sm:text-3xl font-black text-white bg-indigo-600 px-8 py-3 sm:px-10 sm:py-4 rounded-2xl sm:rounded-3xl italic shadow-2xl border-b-8 border-indigo-800">${feedbackData.score}/10</span></div><div class="p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 text-xs sm:text-sm leading-relaxed italic"><div class="bg-green-500/5 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-green-500/10"><p class="font-black text-green-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Compliance Hits</p><ul class="text-slate-300 space-y-3 sm:space-y-4 font-medium">${(feedbackData.positives || []).map(p => `<li class="flex items-start gap-4"><div class="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5"></div>${p}</li>`).join('') || 'Blueprint matched'}</ul></div><div class="bg-yellow-500/5 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-yellow-500/10"><p class="font-black text-yellow-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Delta Improvements</p><ul class="text-slate-300 space-y-3 sm:space-y-4 font-medium">${(feedbackData.improvements || []).map(i => `<li class="flex items-start gap-4"><div class="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-1.5"></div>${i}</li>`).join('') || 'Peak stability detected'}</ul></div></div><div class="px-8 pb-8 sm:px-12 sm:pb-12"><div class="bg-slate-950/80 p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-800 shadow-inner"><p class="text-[12px] sm:text-[13px] italic text-slate-400 leading-relaxed font-medium">"${feedbackData.overall_comment}"</p></div></div></div>`;
}

async function renderHistoricalIntel(dishName) {
    const intelContainer = document.getElementById('historical-intel-container');
    if (!intelContainer) return;
    const matches = state.allHistoricalChecks.filter(c => isDishMatch(c.dishName, dishName));
    if (matches.length === 0) {
        intelContainer.innerHTML = `<span class="text-slate-500 font-black tracking-widest italic uppercase text-[9px]">Zero Historical Data Points</span>`;
        return;
    }
    const recent = [...matches].sort((a,b) => (b.timestamp || "").localeCompare(a.timestamp || "")).slice(0, 5);
    const avg = (recent.reduce((sum, c) => sum + (c.aiCheckResult?.score || 0), 0) / recent.length).toFixed(1);
    intelContainer.innerHTML = `
        <div class="flex items-center gap-4 animate-in fade-in duration-700">
            <div class="flex items-center gap-1.5">${recent.map(c => `<div class="w-2.5 h-2.5 rounded-full ${c.aiCheckResult?.score > 7 ? 'bg-green-500' : 'bg-indigo-500'} shadow-lg"></div>`).join('')}</div>
            <div class="h-4 w-px bg-slate-800"></div>
            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">${avg} Quality index (${matches.length} Total Logs)</span>
        </div>
    `;
}
