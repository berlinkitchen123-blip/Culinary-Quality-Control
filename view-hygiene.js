
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { database } from "./firebase-config.js";
import { state, HYGIENE_TASKS } from "./state.js";
import { DOMElements } from "./dom-elements.js";
// showView is available as window.showView (set by index.js) to avoid circular imports

// Helper for Camera
function renderHygieneCamera(containerId, initialImage, onCapture) {
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
            <span class="text-[9px] font-black uppercase tracking-widest">Documentation Photo</span>
        </div>
        
        <div id="${viewId}" class="absolute inset-0 bg-black hidden z-20">
            <video id="${vidId}" autoplay playsinline class="w-full h-full object-cover"></video>
            <button type="button" id="${btnId}" class="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white/20 bg-indigo-500 shadow-xl active:scale-95 transition-all"></button>
        </div>

        <div id="${previewId}" class="absolute inset-0 ${initialImage ? '' : 'hidden'} z-30 group">
            <img id="${imgId}" src="${initialImage || ''}" class="w-full h-full object-cover" />
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

    let stream = null;

    ph.onclick = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            ph.classList.add('hidden');
            view.classList.remove('hidden');
        } catch (e) {
            alert("Camera access denied.");
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
        onCapture(dataUrl);
        if (stream) stream.getTracks().forEach(t => t.stop());
        view.classList.add('hidden');
        preview.classList.remove('hidden');
    };

    retake.onclick = () => {
         preview.classList.add('hidden');
         ph.classList.remove('hidden');
         onCapture(null);
    };
}

export function renderHygieneDetail() {
    const item = state.selectedHygieneItem;
    if (!item) return;

    const saved = (state.hygieneData || {})[item.id] || {};
    
    DOMElements.dishCardContainer.innerHTML = `
        <div class="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
            <div class="bg-slate-800/80 rounded-[2.5rem] p-8 sm:p-10 border border-slate-700/50 backdrop-blur-3xl flex items-center gap-6">
                <div class="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-3xl shadow-2xl">${item.icon}</div>
                <div>
                    <h3 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">${item.name}</h3>
                    <p class="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2">Sanitation Protocol</p>
                </div>
            </div>
            
            <div class="bg-slate-800/50 rounded-[2rem] border border-slate-700/50 p-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h4 class="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        Checklist Verification
                    </h4>
                    ${saved.timestamp ? `<span class="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700 text-[9px] font-mono text-slate-400 uppercase tracking-widest">Last Logged: ${new Date(saved.timestamp).toLocaleString()}</span>` : ''}
                </div>
                <form id="hygiene-form" class="space-y-8">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div class="space-y-4">
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2 block">Visual Evidence</span>
                            <div id="hygiene-camera-container" class="aspect-video rounded-[2.5rem] bg-slate-950 border-4 border-dashed border-slate-800 overflow-hidden relative shadow-inner group transition-all hover:border-indigo-500/30"></div>
                        </div>
                        <div class="space-y-8">
                            <div class="space-y-4">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2 block">Sanitation Areas</span>
                                <div class="grid grid-cols-1 gap-3">
                                    ${item.areas.map(area => `
                                        <label class="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all group">
                                            <div class="flex items-center gap-4">
                                                <div class="relative flex items-center">
                                                    <input type="checkbox" name="areas" value="${area}" ${(saved.areas || []).includes(area) ? 'checked' : ''} class="peer h-6 w-6 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all">
                                                </div>
                                                <span class="text-xs sm:text-sm font-black text-slate-300 uppercase italic tracking-tight group-hover:text-white transition-colors">${area}</span>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-700 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <button type="submit" class="group relative w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40 active:scale-95 border-b-8 border-indigo-900 overflow-hidden">
                                <span class="relative z-10">Commit Sanitation Log</span>
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('hygiene-form');
    let capturedImage = saved.image || null;

    renderHygieneCamera('hygiene-camera-container', capturedImage, (img) => {
        capturedImage = img;
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = {
            timestamp: new Date().toISOString(),
            image: capturedImage,
            areas: fd.getAll('areas')
        };

        update(ref(database, `hygiene-checks/${state.selectedDate}/${item.id}`), payload)
            .then(() => {
                onValue(ref(database, `hygiene-checks/${state.selectedDate}`), (snap) => {
                    state.hygieneData = snap.val() || {};
                    renderHygieneDetail();
                }, { onlyOnce: true });
            });
    };
}

export function renderHygieneGrid() {
    const container = DOMElements.hygieneGridContainer;
    if (!container) return;
    
    container.innerHTML = '';
    HYGIENE_TASKS.forEach(item => {
        const saved = (state.hygieneData || {})[item.id];
        const isDone = !!saved;
        
        const btn = document.createElement('button');
        btn.className = `group relative flex flex-col items-center justify-center p-6 bg-slate-800/40 border border-slate-700/50 rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all backdrop-blur-md`;
        btn.onclick = () => {
            state.selectedHygieneItem = item;
            state.selectedDish = null;
            state.selectedPrepItem = null;
            window.showView('detail');
            renderHygieneDetail();
        };
        
        btn.innerHTML = `
            ${isDone ? '<div class="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-2 text-white shadow-2xl ring-4 ring-slate-900 z-10"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="5" d="M5 13l4 4L19 7"></path></svg></div>' : ''}
            <div class="mb-4 h-16 w-16 rounded-2xl flex items-center justify-center text-3xl bg-indigo-600/10 border border-indigo-500/20 shadow-inner group-hover:bg-indigo-600/20 transition-all">${item.icon}</div>
            <p class="font-black text-[11px] text-slate-200 px-1 text-center uppercase leading-tight italic tracking-tighter">${item.name}</p>
            <div class="mt-2 flex flex-col items-center">
                <span class="text-[8px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-400' : 'text-slate-500'}">${isDone ? 'Logged' : 'Pending'}</span>
                ${isDone && saved.timestamp ? `<span class="text-[7px] font-mono text-slate-600 mt-0.5">${new Date(saved.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : ''}
            </div>
        `;
        container.appendChild(btn);
    });
}
