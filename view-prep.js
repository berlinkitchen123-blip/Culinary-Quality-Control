
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { database } from "./firebase-config.js";
import { state, PREP_STAGES } from "./state.js";
import { DOMElements } from "./dom-elements.js";
import { extractPrepItems } from "./utils.js";
import { showView } from "./index.js"; // Circular import handled by module loading usually, but prefer callbacks. We will export a setter if needed, or better, just import showView from index.js as it is the controller.

// Helper for Camera
function renderIndependentCamera(containerId, initialImage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const vidId = `video-${containerId}`;
    const btnId = `snap-${containerId}`;
    const retakeId = `retake-${containerId}`;
    const imgId = `img-${containerId}`;
    const viewId = `view-${containerId}`;
    const phId = `ph-${containerId}`;
    const previewId = `prev-${containerId}`;

    container.innerHTML = `
        <div id="${phId}" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-800/50 transition-colors z-10 group-hover:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
            <span class="text-[9px] font-black uppercase tracking-widest">Tap to Photo</span>
        </div>
        
        <div id="${viewId}" class="absolute inset-0 bg-black hidden z-20">
            <video id="${vidId}" autoplay playsinline class="w-full h-full object-cover"></video>
            <button type="button" id="${btnId}" class="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white/20 bg-emerald-500 shadow-xl active:scale-95 transition-all"></button>
        </div>

        <div id="${previewId}" class="absolute inset-0 hidden z-30 group">
            <img id="${imgId}" class="w-full h-full object-cover" />
            <button type="button" id="${retakeId}" class="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg backdrop-blur-md text-[9px] font-black uppercase tracking-wider hover:bg-red-500/80 transition-colors">Retake</button>
        </div>
    `;
    
    const ph = document.getElementById(phId);
    const view = document.getElementById(viewId);
    const video = document.getElementById(vidId);
    const snap = document.getElementById(btnId);
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    const retake = document.getElementById(retakeId);
    const form = container.closest('form');

    if (initialImage) {
        img.src = initialImage;
        preview.classList.remove('hidden');
        ph.classList.add('hidden');
        if(form) form.dataset.capturedImage = initialImage;
    }

    let stream = null;

    ph.onclick = async () => {
        if (form && form.querySelector('input').disabled) return;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            ph.classList.add('hidden');
            view.classList.remove('hidden');
        } catch (e) {
            alert("Camera access denied or unavailable.");
        }
    };

    snap.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        img.src = dataUrl;
        if(form) form.dataset.capturedImage = dataUrl;
        if (stream) stream.getTracks().forEach(t => t.stop());
        view.classList.add('hidden');
        preview.classList.remove('hidden');
    };

    retake.onclick = () => {
         if (form && form.querySelector('input').disabled) return;
         preview.classList.add('hidden');
         ph.classList.remove('hidden');
         if(form) delete form.dataset.capturedImage;
    };
}

window.unlockStage = (stageId) => {
    const form = document.getElementById(`form-${stageId}`);
    if (form) {
        form.querySelectorAll('input').forEach(i => i.disabled = false);
        const btn = document.getElementById(`btn-${stageId}`);
        if(btn) {
            btn.disabled = false;
            btn.className = "w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95";
            btn.textContent = "Update Stage";
        }
    }
};

export function renderPrepCard() {
    const item = state.selectedPrepItem; if (!item) return;
    const saved = state.prepData[item.id] || {};
    const stagesData = saved.stages || {};

    let stagesHtml = '';
    
    PREP_STAGES.forEach(stage => {
        const data = stagesData[stage.id] || {};
        const isDone = !!data.timestamp;
        
        stagesHtml += `
            <div class="bg-slate-800/50 rounded-[2rem] border border-slate-700/50 p-6 sm:p-8 relative overflow-hidden group">
                ${isDone ? '<div class="absolute top-0 right-0 p-4"><div class="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div></div>' : ''}
                
                <h4 class="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <span class="text-2xl">${stage.icon}</span> ${stage.label}
                </h4>

                <form id="form-${stage.id}" class="space-y-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div id="camera-container-${stage.id}" class="aspect-square sm:aspect-video rounded-[1.5rem] bg-slate-950/50 border-2 border-dashed border-slate-700/50 overflow-hidden relative shadow-inner">
                        </div>
                        <div class="flex flex-col justify-between gap-6">
                            <label class="block">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2 mb-2 block">Core Temp (°C)</span>
                                <input type="number" inputmode="decimal" step="any" name="temperature" value="${data.temperature || ''}" placeholder="--" class="block w-full px-6 py-5 bg-slate-950/80 border border-slate-700 rounded-[1.5rem] text-4xl text-emerald-400 font-mono font-black focus:border-emerald-500 outline-none transition-all text-center">
                            </label>
                            <button type="submit" id="btn-${stage.id}" class="w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all ${isDone ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95'}">
                                ${isDone ? 'Stage Complete' : 'Confirm Stage'}
                            </button>
                            ${isDone ? `<button type="button" onclick="window.unlockStage('${stage.id}')" class="text-[9px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors text-center">Unlock to Edit</button>` : ''}
                        </div>
                    </div>
                </form>
            </div>
        `;
    });

    DOMElements.dishCardContainer.innerHTML = `
        <div class="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
            <div class="bg-slate-800/80 rounded-[2.5rem] p-8 sm:p-10 border border-slate-700/50 backdrop-blur-3xl flex items-center gap-6">
                <div class="h-16 w-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center text-3xl shadow-2xl">${item.icon || '🥘'}</div>
                <div>
                    <h3 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">${item.name}</h3>
                    <p class="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-2">Sequential Kitchen Log</p>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4">
                ${stagesHtml}
            </div>
        </div>
    `;

    PREP_STAGES.forEach(stage => {
        const data = stagesData[stage.id] || {};
        const form = document.getElementById(`form-${stage.id}`);
        renderIndependentCamera(`camera-container-${stage.id}`, data.image);

        if (data.timestamp) {
            form.querySelectorAll('input').forEach(i => i.disabled = true);
            document.getElementById(`btn-${stage.id}`).disabled = true;
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const image = form.dataset.capturedImage || data.image || null;
            
            if (!image) { alert("Please capture an image for this stage."); return; }
            if (!fd.get('temperature')) { alert("Please record temperature."); return; }

            const payload = {
                temperature: fd.get('temperature'),
                image: image,
                timestamp: new Date().toISOString()
            };

            update(ref(database, `prep-checks/${state.selectedDate}/${item.id}/stages/${stage.id}`), payload)
                .then(() => {
                     onValue(ref(database, `prep-checks/${state.selectedDate}`), (snapshot) => { 
                        state.prepData = snapshot.val() || {}; 
                        renderPrepCard(); 
                    }, { onlyOnce: true });
                });
        };
    });
}

export function renderPrepView() {
    DOMElements.prepGridContainer.innerHTML = '';
    const itemsFromMenu = extractPrepItems(state.menu);
    const items = itemsFromMenu.length > 0 ? itemsFromMenu : [
        { id: 'prep_rice', name: 'Steamed Basmati Rice', icon: '🍚' },
        { id: 'prep_sauce_red', name: 'Tomato/Curry Base', icon: '🥫' },
        { id: 'prep_veg', name: 'Roasted Seasonal Veg', icon: '🥦' }
    ];
    
    items.forEach(item => {
        const savedItem = state.prepData[item.id] || {};
        const stages = savedItem.stages || {};
        const completedCount = PREP_STAGES.filter(s => stages[s.id]).length;
        const isFullyDone = completedCount === 3;
        
        const btn = document.createElement('button');
        btn.className = `group relative flex flex-col items-center justify-center p-5 bg-slate-800/40 border border-slate-700/50 rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all backdrop-blur-md`;
        btn.onclick = () => { 
            state.selectedPrepItem = item; 
            showView('detail'); 
            renderPrepCard(); 
        };
        
        let statusBadge = '';
        if (isFullyDone) {
            statusBadge = '<div class="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-2 text-white shadow-2xl ring-4 ring-slate-900 z-10"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="5" d="M5 13l4 4L19 7"></path></svg></div>';
        } else if (completedCount > 0) {
            statusBadge = `<div class="absolute -top-1 -right-1 bg-yellow-500 rounded-full h-8 w-8 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-2xl ring-4 ring-slate-900 z-10">${completedCount}/3</div>`;
        }

        btn.innerHTML = `
            ${statusBadge}
            <div class="mb-3 h-14 w-14 rounded-2xl flex items-center justify-center text-2xl bg-emerald-600/10 border border-emerald-500/20 shadow-inner group-hover:bg-emerald-600/20 transition-all">${item.icon || '🥘'}</div>
            <p class="font-black text-[10px] text-slate-200 px-1 text-center line-clamp-2 uppercase h-8 flex items-center group-hover:text-white leading-tight italic tracking-tighter">${item.name}</p>
            ${isFullyDone ? `<span class="mt-1 text-[9px] font-mono text-emerald-400 font-bold">ALL STAGES DONE</span>` : `<span class="mt-1 text-[8px] font-mono text-slate-600 uppercase font-bold tracking-widest">${completedCount === 0 ? 'Pending' : 'In Progress'}</span>`}
        `;
        DOMElements.prepGridContainer.appendChild(btn);
    });
}
