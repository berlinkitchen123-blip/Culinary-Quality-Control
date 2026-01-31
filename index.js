

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, update, query, limitToLast, orderByKey } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { GoogleGenAI } from "https://esm.run/@google/genai";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA3O6Dw0Hj06BH_DUupZvUrufi1jjbDi0g",
    authDomain: "quality-control-24.firebaseapp.com",
    databaseURL: "https://quality-control-24-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "quality-control-24",
    storageBucket: "quality-control-24.firebasestorage.app",
    messagingSenderId: "708146875113",
    appId: "1:708146875113:web:a318755bce78ef99ffbe78"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- Application State ---
let state = {
    menu: null,
    checkedData: {},
    prepData: {},
    productionOrders: [],
    selectedDate: new Date().toISOString().split('T')[0],
    productionMode: 'kitchen', // 'kitchen' | 'assembly'
    productionListener: null,
    selectedDish: null,
    selectedPrepItem: null,
    isMenuLoading: true,
    isCheckDataLoading: true,
    currentView: 'prep',
    historicalDishLibrary: [],
    allHistoricalChecks: [],
    isLibraryLoaded: false,
    totalRecordsFound: 0,
    hasFetchedHistory: false,
    isHistoryLoading: false
};

// --- Definitions ---
const PREP_STAGES = [
    { id: 'cooking', label: 'After Cooking', short: 'Cooking', icon: '🔥' },
    { id: 'pre_assembly', label: 'Before Assembly', short: 'Pre-Asm', icon: '⏳' },
    { id: 'post_assembly', label: 'After Assembly', short: 'Post-Asm', icon: '📦' }
];

// --- Chart Instance Tracker ---
window.auditCharts = [];

// --- DOM Element References ---
const DOMElements = {
    loadingIndicator: document.getElementById('loading-indicator'),
    mainView: document.getElementById('main-view'),
    prepView: document.getElementById('prep-view'),
    productionView: document.getElementById('production-view'),
    aiAgentView: document.getElementById('ai-agent-view'),
    dishDetailView: document.getElementById('dish-detail-view'),
    dishGridContainer: document.getElementById('dish-grid-container'),
    prepGridContainer: document.getElementById('prep-grid-container'),
    dishCardContainer: document.getElementById('dish-card-container'),
    dailySummarySection: document.getElementById('daily-summary-section'),
    dailySummaryContainer: document.getElementById('daily-summary-container'),
    dateButtonsContainer: document.getElementById('date-buttons-container'),
    prevWeekBtn: document.getElementById('prev-week-btn'),
    nextWeekBtn: document.getElementById('next-week-btn'),
    welcomePlaceholder: document.getElementById('welcome-placeholder'),
    backToMenuBtn: document.getElementById('back-to-menu-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    settingsCancelBtn: document.getElementById('settings-cancel-btn'),
    settingsSaveBtn: document.getElementById('settings-save-btn'),
    jsonInput: document.getElementById('json-input'),
    productionJsonInput: document.getElementById('production-json-input'),
    settingsError: document.getElementById('settings-error'),
    navDashboardBtn: document.getElementById('nav-dashboard-btn'),
    navPrepBtn: document.getElementById('nav-prep-btn'),
    navAuditBtn: document.getElementById('nav-audit-btn'),
    navProductionBtn: document.getElementById('nav-production-btn'),
    auditResultsContainer: document.getElementById('audit-results-container'),
    // Settings Tabs
    tabProdBtn: document.getElementById('tab-prod-btn'),
    tabMenuBtn: document.getElementById('tab-menu-btn'),
    tabProdContent: document.getElementById('tab-prod-content'),
    tabMenuContent: document.getElementById('tab-menu-content'),
};

// --- Global Intelligence Logic ---

const normalizeName = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^\w\s]/gi, '')
        .replace(/\b(with|rice|chips|salad|side|and|the|of|for|pasta|potato|extra|veg|vege|bb|b&b)\b/g, '')
        .replace(/\b(fresh|classic|traditional|homemade|chef's|special|spicy|hot|sweet|sour|grilled|fried|roasted|steamed|baked)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const isDishMatch = (name1, name2) => {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    if (!n1 || !n2) return false;
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const getWeekId = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
};

const discoverLogs = (node, found = [], dateContext = null) => {
    if (!node || typeof node !== 'object') return found;
    if (node.dishName || node.aiCheckResult || (node.temperatures && node.weights)) {
        if (node.dishName) {
            found.push({
                ...node,
                pathDate: dateContext || node.date || (node.timestamp ? node.timestamp.split('T')[0] : 'Historical')
            });
            return found;
        }
    }
    Object.entries(node).forEach(([key, val]) => {
        const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(key);
        discoverLogs(val, found, isDateKey ? key : dateContext);
    });
    return found;
};

// --- Data Saving Logic ---

function saveCheckData(data) {
    const { capturedImage, ...metaData } = data;
    const updates = {};
    const dishKey = data.dishLetter;

    updates[`quality-checks/${data.date}/${dishKey}`] = metaData;

    if (capturedImage) {
        updates[`check-images/${data.date}/${dishKey}`] = capturedImage;
    }

    return update(ref(database), updates).then(() => {
        state.checkedData[dishKey] = { ...metaData, capturedImage };
    });
}

// --- Kitchen Logic Helpers ---

const PREP_KEYWORDS = ['rice', 'curry', 'sauce', 'gravy', 'dal', 'veg', 'meat', 'chicken', 'base', 'paste', 'stew', 'broth', 'cooked'];

function getPrepIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('rice')) return '🍚';
    if (n.includes('curry') || n.includes('sauce') || n.includes('gravy')) return '🥫';
    if (n.includes('veg')) return '🥦';
    if (n.includes('chicken') || n.includes('meat') || n.includes('beef')) return '🥩';
    if (n.includes('dal') || n.includes('stew')) return '🍲';
    return '🥘';
}

function extractPrepItems(menu) {
    if (!menu || !menu.dishes) return [];
    const uniqueIngredients = new Set();
    const prepItems = [];

    menu.dishes.forEach(dish => {
        (dish.dishIngredients || []).forEach(ing => {
            const name = ing.name.trim();
            const lowerName = name.toLowerCase();
            if (PREP_KEYWORDS.some(k => lowerName.includes(k)) && !uniqueIngredients.has(lowerName)) {
                uniqueIngredients.add(lowerName);
                prepItems.push({
                    id: 'prep_' + normalizeName(name).replace(/\s+/g, '_'),
                    name: name,
                    icon: getPrepIcon(name)
                });
            }
        });
    });
    return prepItems;
}

// --- Real-time Data Listeners ---

function listenToGlobalHistory() {
    state.isHistoryLoading = true;
    if (state.currentView === 'audit') window.renderAuditDishLibrary();

    const historyQuery = query(ref(database, 'quality-checks'), orderByKey());

    onValue(historyQuery, (snapshot) => {
        const data = snapshot.val();
        const logs = discoverLogs(data);
        state.allHistoricalChecks = logs;
        state.totalRecordsFound = logs.length;
        const dishMap = new Map();
        logs.forEach(log => {
            const key = normalizeName(log.dishName);
            if (!dishMap.has(key)) {
                dishMap.set(key, { name: log.dishName, type: log.dishType || 'extras', count: 1 });
            } else {
                dishMap.get(key).count += 1;
            }
        });
        state.historicalDishLibrary = Array.from(dishMap.values()).sort((a, b) => b.count - a.count);
        state.isLibraryLoaded = true;
        state.hasFetchedHistory = true;
        state.isHistoryLoading = false;

        if (state.currentView === 'audit') window.renderAuditDishLibrary();
    });
}

function listenToProductionOrders() {
    if (state.productionListener) {
        state.productionListener(); // Unsubscribe previous
        state.productionListener = null;
    }
    const date = state.selectedDate;
    // Listen to orders for the selected date
    state.productionListener = onValue(ref(database, `production-orders/${date}`), (snapshot) => {
        const val = snapshot.val();
        // Handle both array and object formats from Firebase
        state.productionOrders = val ? (Array.isArray(val) ? val : Object.values(val)) : [];
        if (state.currentView === 'production') renderProductionView();
    });

    // Also listen to cooking checks (HACCP done states)
    onValue(ref(database, `production-checks/${date}`), (snapshot) => {
        state.productionChecks = snapshot.val() || {};
        if (state.currentView === 'production' && state.productionMode === 'kitchen') renderProductionView();
    });
}

// --- KITCHEN LOGIC CORE (PREP CARD) ---
// Defined before usage to prevent ReferenceErrors

function renderIndependentCamera(containerId, initialImage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Unique IDs for this instance
    const vidId = `video-${containerId}`;
    const btnId = `snap-${containerId}`;
    const retakeId = `retake-${containerId}`;
    const imgId = `img-${containerId}`;
    const viewId = `view-${containerId}`;
    const phId = `ph-${containerId}`;
    const previewId = `prev-${containerId}`;

    const render = () => {
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

        // Bind events
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
            if (form) form.dataset.capturedImage = initialImage;
        }

        let stream = null;

        ph.onclick = async () => {
            // Check if inputs are disabled (stage done)
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
            // Basic capture logic
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            img.src = dataUrl;
            if (form) form.dataset.capturedImage = dataUrl;

            // Stop stream
            if (stream) stream.getTracks().forEach(t => t.stop());
            view.classList.add('hidden');
            preview.classList.remove('hidden');
        };

        retake.onclick = () => {
            if (form && form.querySelector('input').disabled) return;
            preview.classList.add('hidden');
            ph.classList.remove('hidden');
            if (form) delete form.dataset.capturedImage;
        };
    };

    render();
}

window.unlockStage = (stageId) => {
    const form = document.getElementById(`form-${stageId}`);
    if (form) {
        form.querySelectorAll('input').forEach(i => i.disabled = false);
        const btn = document.getElementById(`btn-${stageId}`);
        if (btn) {
            btn.disabled = false;
            btn.className = "w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95";
            btn.textContent = "Update Stage";
        }
    }
};

function renderPrepCard() {
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
                        <!-- Camera Section -->
                        <div id="camera-container-${stage.id}" class="aspect-square sm:aspect-video rounded-[1.5rem] bg-slate-950/50 border-2 border-dashed border-slate-700/50 overflow-hidden relative shadow-inner">
                            <!-- Injected via JS -->
                        </div>

                        <!-- Temp & Submit Section -->
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
            <!-- Header -->
            <div class="bg-slate-800/80 rounded-[2.5rem] p-8 sm:p-10 border border-slate-700/50 backdrop-blur-3xl flex items-center gap-6">
                <div class="h-16 w-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center text-3xl shadow-2xl">${item.icon || '🥘'}</div>
                <div>
                    <h3 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">${item.name}</h3>
                    <p class="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-2">Sequential Kitchen Log</p>
                </div>
            </div>

            <!-- Stages Grid -->
            <div class="grid grid-cols-1 gap-4">
                ${stagesHtml}
            </div>
        </div>
    `;

    // Initialize Logic for each stage
    PREP_STAGES.forEach(stage => {
        const data = stagesData[stage.id] || {};
        const form = document.getElementById(`form-${stage.id}`);

        // Init Camera
        renderIndependentCamera(`camera-container-${stage.id}`, data.image);

        // Disable if done
        if (data.timestamp) {
            form.querySelectorAll('input').forEach(i => i.disabled = true);
            document.getElementById(`btn-${stage.id}`).disabled = true;
        }

        // Handle Submit
        form.onsubmit = (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const image = form.dataset.capturedImage || data.image || null; // Logic needs to ensure dataset is set by camera

            if (!image) {
                alert("Please capture an image for this stage.");
                return;
            }
            if (!fd.get('temperature')) {
                alert("Please record temperature.");
                return;
            }

            const payload = {
                temperature: fd.get('temperature'),
                image: image,
                timestamp: new Date().toISOString()
            };

            update(ref(database, `prep-checks/${state.selectedDate}/${item.id}/stages/${stage.id}`), payload)
                .then(() => {
                    // Refresh
                    onValue(ref(database, `prep-checks/${state.selectedDate}`), (snapshot) => {
                        state.prepData = snapshot.val() || {};
                        renderPrepCard();
                    }, { onlyOnce: true });
                });
        };
    });
}
window.renderPrepCard = renderPrepCard;

// --- Production View Logic ---

function parseProductionRecipeItem(str) {
    let name = str;
    let weight = 0;

    // Extract weight like "(150gr)"
    const weightMatch = str.match(/\((\d+(?:\.\d+)?)\s*gr\)/i);
    if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
    }

    // Clean name: everything before " x"
    const splitIndex = str.indexOf(' x');
    if (splitIndex > -1) {
        name = str.substring(0, splitIndex).trim();
    } else {
        const xIndex = str.lastIndexOf('x');
        if (xIndex > -1 && xIndex < str.length - 3) {
            // Simple fallback
            const preX = str.substring(0, xIndex).trim();
            if (preX.length > 2) name = preX;
        }
    }

    return { name, weight, original: str };
}

function formatTime(minutes) {
    if (!minutes && minutes !== 0) return 'ASAP';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// --- Kitchen Aggregation Logic ---
function aggregateKitchenIngredients() {
    const ingredients = {};

    state.productionOrders.forEach(order => {
        if (!order || !order.recipe) return;
        const qty = order.quantity || 1;

        order.recipe.forEach(line => {
            const parsed = parseProductionRecipeItem(line);
            const key = parsed.name.toLowerCase(); // distinct by name

            if (!ingredients[key]) {
                ingredients[key] = {
                    id: key.replace(/\s+/g, '_'),
                    name: parsed.name,
                    totalWeight: 0,
                    icon: getPrepIcon(parsed.name),
                    dishes: []
                };
            }
            ingredients[key].totalWeight += (parsed.weight * qty);
            // Track which dishes need this (for tooltip/intel)
            if (!ingredients[key].dishes.includes(order.name)) {
                ingredients[key].dishes.push(order.name);
            }
        });
    });

    return Object.values(ingredients).sort((a, b) => b.totalWeight - a.totalWeight);
}

function aggregateProductionData() {
    const dishes = {};
    const summary = { hot: 0, cold: 0, total: 0 };

    state.productionOrders.forEach(order => {
        if (!order) return;

        const key = order.name;
        if (!dishes[key]) {
            dishes[key] = {
                name: order.name,
                type: order.type || 'cold',
                count: 0,
                ingredients: {},
                deliveryDate: order.deliveryDate,
                readyBy: order.readyBy
            };
        }

        dishes[key].count += (order.quantity || 1);

        if (order.recipe && Array.isArray(order.recipe)) {
            order.recipe.forEach(line => {
                const parsed = parseProductionRecipeItem(line);
                if (!dishes[key].ingredients[parsed.name]) {
                    dishes[key].ingredients[parsed.name] = {
                        name: parsed.name,
                        unitWeight: parsed.weight,
                        totalWeight: 0
                    };
                }
                dishes[key].ingredients[parsed.name].totalWeight += (parsed.weight * (order.quantity || 1));
            });
        }
    });

    const result = Object.values(dishes);
    result.forEach(d => {
        if (d.type === 'hot') summary.hot += d.count;
        else summary.cold += d.count;
        summary.total += d.count;
    });

    return { dishes: result, summary };
}

// Toggle Production Modes
window.setProductionMode = (mode) => {
    state.productionMode = mode;
    renderProductionView();
};

window.toggleKitchenCheck = (ingId) => {
    const date = state.selectedDate;
    const current = state.productionChecks?.[ingId]?.done || false;
    update(ref(database, `production-checks/${date}/${ingId}`), {
        done: !current,
        timestamp: new Date().toISOString()
    });
};

function renderProductionView() {
    const container = document.getElementById('production-content-container');
    const headerStats = document.getElementById('production-stats');
    const { dishes, summary } = aggregateProductionData(); // Still useful for summary

    // Header with Tabs
    headerStats.innerHTML = `
        <div class="flex flex-col w-full gap-6">
            <!-- Stats -->
            <div class="flex justify-between items-center bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
                <div class="flex gap-4">
                     <div class="px-5 py-3 bg-blue-900/30 border border-blue-500/30 rounded-2xl flex flex-col items-center">
                        <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest">Cold Items</span>
                        <span class="text-2xl font-black text-white leading-none mt-1">${summary.cold}</span>
                    </div>
                    <div class="px-5 py-3 bg-red-900/30 border border-red-500/30 rounded-2xl flex flex-col items-center">
                        <span class="text-[9px] font-black text-red-400 uppercase tracking-widest">Hot Items</span>
                        <span class="text-2xl font-black text-white leading-none mt-1">${summary.hot}</span>
                    </div>
                </div>
                <!-- Mode Switcher -->
                <div class="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                    <button onclick="window.setProductionMode('kitchen')" class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.productionMode === 'kitchen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}">
                        Kitchen (Cooking)
                    </button>
                    <button onclick="window.setProductionMode('assembly')" class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.productionMode === 'assembly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}">
                        Assembly
                    </button>
                </div>
            </div>
        </div>
    `;

    if (state.productionMode === 'kitchen') {
        renderKitchenView(container);
    } else {
        renderAssemblyView(container, dishes);
    }
}

// Toggle Kitchen Details Panel
window.toggleKitchenDetails = (id) => {
    const el = document.getElementById(`kitchen-details-${id}`);
    if (el) el.classList.toggle('hidden');
};

// Toggle Assembly Details Panel
window.toggleProductionDetails = (id) => {
    const el = document.getElementById(`prod-details-${id}`);
    if (el) el.classList.toggle('hidden');
};

function renderKitchenView(container) {
    const ingredients = aggregateKitchenIngredients();

    if (ingredients.length === 0) {
        container.innerHTML = `<div class="text-center py-20 opacity-50 text-[10px] font-black uppercase tracking-widest text-slate-600">No Cooking Tasks Pending</div>`;
        return;
    }

    // Advanced Mock Data for SOPs
    const getSOP = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('chicken')) return {
            temp: '75°C',
            time: '20 min',
            method: 'Oven Roast',
            steps: [
                "Marinate with spices for 30m.",
                "Preheat oven to 200°C.",
                "Roast on tray for 20 minutes.",
                "Check core temp > 75°C.",
                "Hold above 65°C."
            ]
        };
        if (lower.includes('rice')) return {
            temp: '100°C',
            time: '15 min',
            method: 'Steam',
            steps: [
                "Rinse 3 times until water clear.",
                "Ratio 1:1.5 (Rice:Water).",
                "Steam at 100°C for 15 mins.",
                "Fluff with fork immediately."
            ]
        };
        if (lower.includes('potato') || lower.includes('veg')) return {
            temp: '180°C',
            time: '25 min',
            method: 'Roast',
            steps: [
                "Wash and cut into 2cm cubes.",
                "Toss with olive oil & salt.",
                "Roast at 180°C until tender.",
                "Blast chill if for cold salad."
            ]
        };
        return {
            temp: '>65°C',
            time: 'Varies',
            method: 'Heat & Hold',
            steps: [
                "Check expiry date.",
                "Heat strictly to standard.",
                "Record measurements."
            ]
        };
    };

    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            ${ingredients.map(ing => {
        const sop = getSOP(ing.name);
        const isDone = state.productionChecks?.[ing.id]?.done;

        return `
                <div class="bg-slate-900/80 border ${isDone ? 'border-green-500/30' : 'border-slate-800'} rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 shadow-xl relative overflow-hidden group transition-all">
                    <!-- Header (Click to Expand) -->
                    <div class="cursor-pointer" onclick="window.toggleKitchenDetails('${ing.id}')">
                        <div class="flex justify-between items-start mb-4 md:mb-6">
                            <div class="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xl md:text-2xl shadow-inner">
                                ${ing.icon}
                            </div>
                            <div class="text-right">
                                    <span class="text-2xl md:text-3xl font-black text-white tracking-tighter block">${(ing.totalWeight / 1000).toFixed(1)}<span class="text-sm text-slate-500 ml-1">kg</span></span>
                                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Required</span>
                            </div>
                        </div>
                        
                        <h3 class="text-base md:text-lg font-black text-white uppercase italic leading-tight mb-4 pr-10 hover:text-indigo-400 transition-colors">${ing.name} <span class="text-[10px] text-slate-500 ml-2 not-italic font-normal border border-slate-700 px-2 py-0.5 rounded-full inline-block mt-1 md:mt-0">Details &darr;</span></h3>
                        
                        <!-- HACCP Brief -->
                        <div class="bg-slate-950/50 rounded-xl p-3 md:p-4 border border-slate-800/50 mb-0 space-y-2 group-hover:bg-slate-900 transition-colors">
                            <div class="flex justify-between">
                                <span class="text-[9px] text-slate-500 uppercase font-bold">Target Temp</span>
                                <span class="text-[9px] text-orange-400 font-mono font-bold">${sop.temp}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-[9px] text-slate-500 uppercase font-bold">Method</span>
                                <span class="text-[9px] text-indigo-300 font-bold text-right">${sop.method}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Expandable Details -->
                    <div id="kitchen-details-${ing.id}" class="hidden mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-300">
                        <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Cooking Standard (SOP)</p>
                        
                        <div class="space-y-3 mb-6">
                            ${sop.steps.map((step, idx) => `
                                <div class="flex gap-3">
                                    <div class="h-5 w-5 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">${idx + 1}</div>
                                    <p class="text-xs md:text-sm font-medium text-slate-300 leading-tight">${step}</p>
                                </div>
                            `).join('')}
                        </div>

                         <div class="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-[10px] text-slate-400 font-medium italic">
                            Running low? Contact Dispatch immediately.
                        </div>
                    </div>

                    <!-- Action -->
                    <button onclick="window.toggleKitchenCheck('${ing.id}')" class="w-full mt-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95 ${isDone ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-600/30'}">
                        ${isDone ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg> Completed' : 'Mark Produced'}
                    </button>
                    
                    <div class="absolute top-4 right-4 text-slate-700 font-black text-[50px] md:text-[60px] opacity-10 pointer-events-none -rotate-12">
                        ${ing.name.substring(0, 2)}
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
    container.innerHTML = html;
}

function renderAssemblyView(container, dishes) {
    const coldDishes = dishes.filter(d => d.type !== 'hot').sort((a, b) => (a.readyBy || 0) - (b.readyBy || 0));
    const hotDishes = dishes.filter(d => d.type === 'hot').sort((a, b) => (a.readyBy || 0) - (b.readyBy || 0));

    const renderColumn = (title, items, colorTheme) => {
        const borderColor = colorTheme === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';
        const titleColor = colorTheme === 'blue' ? 'text-blue-400' : 'text-red-400';
        const bgHeader = colorTheme === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20';

        let html = `
            <div class="bg-slate-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-slate-800 overflow-hidden h-fit mb-6 md:mb-0">
                <div class="p-5 md:p-6 border-b border-slate-800 ${bgHeader} flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
                    <h3 class="text-lg md:text-xl font-black ${titleColor} uppercase tracking-widest italic">${title} STATION</h3>
                    <span class="text-[10px] font-bold text-slate-500 uppercase bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">${items.length} Dishes</span>
                </div>
                <div class="p-4 md:p-6 space-y-4">
        `;

        if (items.length === 0) {
            html += `<div class="text-center py-10 opacity-50 text-[10px] font-black uppercase tracking-widest text-slate-600">No active orders</div>`;
        } else {
            items.forEach((dish, idx) => {
                const safeId = `${colorTheme}-${idx}`;
                const ingredientsList = Object.values(dish.ingredients).map((ing, i) => `
                    <div class="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 px-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div class="flex items-center gap-3">
                                <div class="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500">${i + 1}</div>
                                <span class="text-[10px] md:text-[11px] font-bold text-slate-300 uppercase tracking-tight">${ing.name}</span>
                        </div>
                        <span class="text-[10px] md:text-[11px] font-mono font-black ${titleColor}">${ing.unitWeight ? ing.unitWeight + 'g' : 'x'}</span>
                    </div>
                `).join('');

                const readyTime = formatTime(dish.readyBy);

                html += `
                    <div class="bg-slate-950 border ${borderColor} rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-xl relative overflow-hidden cursor-pointer hover:border-opacity-100 transition-all group" onclick="window.toggleProductionDetails('${safeId}')">
                        <div class="flex justify-between items-start">
                            <div class="pr-4 flex-1">
                                <h4 class="text-base md:text-lg font-black text-white uppercase leading-none mb-3 group-hover:${titleColor} transition-colors">${dish.name}</h4>
                                <div class="flex flex-wrap gap-2">
                                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800 whitespace-nowrap">Use By: ${readyTime}</span>
                                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 ">${dish.type}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-center justify-center bg-slate-900 rounded-2xl w-12 h-12 md:w-14 md:h-14 border border-slate-800 shadow-inner group-hover:bg-slate-800 transition-colors shrink-0">
                                <span class="text-xl md:text-2xl font-black text-white">${dish.count}</span>
                                <span class="text-[7px] font-bold text-slate-500 uppercase">TO MAKE</span>
                            </div>
                        </div>
                        
                        <div id="prod-details-${safeId}" class="hidden mt-6 pt-6 border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200">
                                <div class="flex justify-between items-center mb-4">
                                <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] inline-block">Assembly Layering</p>
                                <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest cursor-pointer hover:text-white border border-indigo-500/30 px-2 py-1 rounded-lg bg-indigo-500/10">Full Training Mode ></span>
                                </div>
                                
                                <!-- Visual Assembly Guide -->
                                <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                    <div class="h-16 w-24 bg-slate-900 rounded-lg flex-shrink-0 border border-slate-800 flex flex-col items-center justify-center p-2">
                                        <span class="text-[8px] text-slate-500 uppercase font-black text-center mb-1">Step 1</span>
                                        <span class="text-[10px] text-white font-bold">Base</span>
                                    </div>
                                    <div class="h-16 w-6 text-slate-600 flex items-center justify-center">&rarr;</div>
                                    <div class="h-16 w-24 bg-slate-900 rounded-lg flex-shrink-0 border border-slate-800 flex flex-col items-center justify-center p-2">
                                        <span class="text-[8px] text-slate-500 uppercase font-black text-center mb-1">Step 2</span>
                                        <span class="text-[10px] text-white font-bold">Protein</span>
                                    </div>
                                    <div class="h-16 w-6 text-slate-600 flex items-center justify-center">&rarr;</div>
                                    <div class="h-16 w-24 bg-slate-900 rounded-lg flex-shrink-0 border border-slate-800 flex flex-col items-center justify-center p-2">
                                        <span class="text-[8px] text-slate-500 uppercase font-black text-center mb-1">Step 3</span>
                                        <span class="text-[10px] text-white font-bold">Garnish</span>
                                    </div>
                                </div>

                                <div class="bg-slate-900/50 rounded-xl p-2 border border-slate-800/50">
                                ${ingredientsList}
                                </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        return html;
    };

    container.innerHTML = `
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 pb-20">
            ${renderColumn('Cold Assembly', coldDishes, 'blue')}
            ${renderColumn('Hot Assembly', hotDishes, 'red')}
        </div>
    `;
}

// --- Navigation & Core Controllers ---

function showView(viewName) {
    state.currentView = viewName;
    DOMElements.mainView.classList.toggle('hidden', viewName !== 'dashboard');
    DOMElements.prepView.classList.toggle('hidden', viewName !== 'prep');
    DOMElements.aiAgentView.classList.toggle('hidden', viewName !== 'audit');
    DOMElements.dishDetailView.classList.toggle('hidden', viewName !== 'detail');
    DOMElements.productionView.classList.toggle('hidden', viewName !== 'production');

    const active = "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30";
    const activePrep = "bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30";
    const activeProd = "bg-orange-600 text-white shadow-2xl shadow-orange-600/30";
    const inactive = "text-slate-400 hover:text-white";

    DOMElements.navDashboardBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'dashboard' ? active : inactive}`;
    DOMElements.navAuditBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'audit' ? active : inactive}`;
    DOMElements.navPrepBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'prep' ? activePrep : inactive}`;
    DOMElements.navProductionBtn.className = `px-5 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase ${viewName === 'production' ? activeProd : inactive}`;

    if (viewName === 'audit') { window.renderAuditDishLibrary(); }
    if (viewName === 'prep') { renderPrepView(); }
    if (viewName === 'production') { renderProductionView(); }
    if (viewName === 'dashboard') renderApp();
}

function renderPrepView() {
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

function fetchCheckData() {
    state.isCheckDataLoading = true; renderApp();
    listenToProductionOrders(); // Refresh production listeners for new Date
    onValue(ref(database, `quality-checks/${state.selectedDate}`), (snapshot) => { state.checkedData = snapshot.val() || {}; state.isCheckDataLoading = false; renderApp(); });
    onValue(ref(database, `prep-checks/${state.selectedDate}`), (snapshot) => { state.prepData = snapshot.val() || {}; if (state.currentView === 'prep') renderPrepView(); });
}

function fetchMenu() {
    state.isMenuLoading = true; renderApp();
    const weekId = getWeekId(new Date(state.selectedDate + 'T12:00:00Z'));
    onValue(ref(database, `menus/${weekId}`), (snapshot) => {
        state.menu = snapshot.val() || null;
        state.isMenuLoading = false;
        renderApp();
        if (state.currentView === 'prep') renderPrepView();
        if (state.currentView === 'audit') window.renderAuditDishLibrary();
    });
}

DOMElements.navDashboardBtn.onclick = () => showView('dashboard');
DOMElements.navPrepBtn.onclick = () => showView('prep');
DOMElements.navAuditBtn.onclick = () => showView('audit');
DOMElements.navProductionBtn.onclick = () => showView('production');
DOMElements.settingsBtn.onclick = () => DOMElements.settingsModal.classList.remove('hidden');
DOMElements.settingsCloseBtn.onclick = () => DOMElements.settingsModal.classList.add('hidden');
DOMElements.backToMenuBtn.onclick = () => showView(state.currentView === 'detail' && state.selectedPrepItem ? 'prep' : 'dashboard');

// Settings Tab Logic


// --- Mock Data Generator ---
window.generateDemoData = async () => {
    DOMElements.settingsSaveBtn.textContent = "Generating...";
    DOMElements.settingsSaveBtn.disabled = true;

    const ingredientsPool = [
        { name: "Roasted Sweet Potato", weight: 150, icon: "🍠" },
        { name: "Grilled Chicken Breast", weight: 120, icon: "🍗" },
        { name: "Steamed Broccoli", weight: 80, icon: "🥦" },
        { name: "Basmati Rice", weight: 200, icon: "🍚" },
        { name: "Curry Sauce", weight: 100, icon: "🍛" },
        { name: "Mixed Seeds", weight: 20, icon: "🌰" },
        { name: "Feta Cheese", weight: 50, icon: "🧀" },
        { name: "Cherry Tomatoes", weight: 60, icon: "🍅" }
    ];

    const dishTypes = [
        { name: "Vegan Buddha Bowl", type: "cold", ingredients: [0, 2, 3, 5, 7] },
        { name: "Chicken Power Bowl", type: "hot", ingredients: [1, 3, 4, 2] },
        { name: "Feta Salad Box", type: "cold", ingredients: [6, 7, 5, 0] },
        { name: "Clean Lean Chicken", type: "hot", ingredients: [1, 2, 0] },
        { name: "Curry Rice Special", type: "hot", ingredients: [3, 4, 2] }
    ];

    const orders = [];
    const today = new Date().toISOString().split('T')[0];

    // Generate 500 random orders
    for (let i = 0; i < 500; i++) {
        const dish = dishTypes[Math.floor(Math.random() * dishTypes.length)];
        const qty = Math.floor(Math.random() * 5) + 1; // 1-5 per order entry

        // Build recipe strings similar to user format
        const recipe = dish.ingredients.map(idx => {
            const ing = ingredientsPool[idx];
            return `${ing.name} x1 Spoon (${ing.weight}gr)`;
        });

        orders.push({
            id: `demo_${Date.now()}_${i}`,
            name: dish.name,
            type: dish.type,
            quantity: qty,
            deliveryDate: today, // Focus on today for demo
            status: "processing",
            readyBy: 600 + Math.floor(Math.random() * 300), // Random time between 10:00 - 15:00
            recipe: recipe
        });
    }

    try {
        await set(ref(database, `production-orders/${today}`), orders);
        alert(`Generated ${orders.length} demo orders for ${today}. Production View updated.`);
        DOMElements.settingsModal.classList.add('hidden');
        renderProductionView();
    } catch (e) {
        alert("Error generating data: " + e.message);
    } finally {
        DOMElements.settingsSaveBtn.textContent = "Save Changes";
        DOMElements.settingsSaveBtn.disabled = false;
    }
};

const switchSettingsTab = (tab) => {
    if (tab === 'production') {
        DOMElements.tabProdContent.classList.remove('hidden');
        DOMElements.tabMenuContent.classList.add('hidden');

        DOMElements.tabProdBtn.classList.remove('text-slate-500', 'border-transparent');
        DOMElements.tabProdBtn.classList.add('text-orange-400', 'border-orange-500', 'bg-slate-800/30');

        DOMElements.tabMenuBtn.classList.add('text-slate-500', 'border-transparent');
        DOMElements.tabMenuBtn.classList.remove('text-indigo-400', 'border-indigo-500', 'bg-slate-800/30');

        // Ensure Demo Button exists (Lazy Render)
        const container = document.getElementById('tab-prod-content');
        if (container && !document.getElementById('demo-gen-btn')) {
            const btn = document.createElement('button');
            btn.id = 'demo-gen-btn';
            btn.type = "button";
            btn.className = "mt-4 w-full py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-black uppercase tracking-widest rounded-2xl border border-indigo-500/30 transition-all";
            btn.textContent = "⚡ Generate 500 Demo Orders";
            btn.onclick = window.generateDemoData;
            container.appendChild(btn);
        }

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

    // 1. Handle Production JSON if present
    // 1. Handle Production JSON if present
    const prodVal = DOMElements.productionJsonInput.value.trim();
    if (prodVal) {
        try {
            const parsed = JSON.parse(prodVal);
            const rawOrders = Array.isArray(parsed) ? parsed : [parsed];

            // Group by Delivery Date
            const ordersByDate = {};
            rawOrders.forEach(order => {
                const date = order.deliveryDate || state.selectedDate; // Fallback to selected
                if (!ordersByDate[date]) ordersByDate[date] = [];
                ordersByDate[date].push(order);
            });

            // Save each batch
            const promises = Object.entries(ordersByDate).map(([date, orders]) => {
                return set(ref(database, `production-orders/${date}`), orders);
            });

            await Promise.all(promises);
            DOMElements.productionJsonInput.value = '';
            alert(`Imported ${rawOrders.length} orders across ${Object.keys(ordersByDate).length} dates.`);
        } catch (e) {
            console.error(e);
            DOMElements.settingsError.textContent = "Production JSON Invalid format.";
            return;
        }
    }

    // 2. Handle Menu Manifest if present
    const val = DOMElements.jsonInput.value.trim();
    if (val) {
        try {
            const p = JSON.parse(val);
            const dishes = p.dishes.filter(d => d.stickerNo && d.stickerNo !== 'addons').map(d => ({ dishLetter: d.stickerNo, dishName: d.variantName, dishImage: d.webUrl, dishType: ['hot', 'cold'].includes(d.type) ? d.type : 'extras', dishIngredients: (d.ingredients || []).map(i => ({ name: i.name, weight: i.amount + 'g' })), theoreticalWeight: (d.ingredients || []).reduce((sum, ing) => sum + (parseFloat(ing.amount) || 0), 0) }));
            const menuWeekId = getWeekId(new Date(p.startDate + 'T12:00:00Z'));
            await set(ref(database, `menus/${menuWeekId}`), { dishes, startDate: p.startDate });
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

function renderApp() {
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
    renderDateSelector();
}

function renderDateSelector() {
    // Current visible week context
    const viewDate = getStartOfWeek(new Date(state.selectedDate + 'T12:00:00Z'));

    // Generate 5 days (Mon-Fri)
    const weekDays = Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(viewDate);
        d.setDate(viewDate.getDate() + i);
        return d;
    });

    DOMElements.dateButtonsContainer.innerHTML = '';

    // Prev Week Button
    const prevBtn = document.createElement('button');
    prevBtn.className = "flex items-center justify-center w-8 h-16 sm:h-20 rounded-l-[1.25rem] bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 hover:text-white transition-all border-y border-l border-slate-700/50";
    prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>`;
    prevBtn.onclick = () => {
        const d = new Date(state.selectedDate);
        d.setDate(d.getDate() - 7);
        state.selectedDate = d.toISOString().split('T')[0];
        fetchCheckData(); // refresh all data
        if (state.currentView === 'production') renderProductionView(); // refresh prod view if active
    };
    DOMElements.dateButtonsContainer.appendChild(prevBtn);

    // Days Objects
    weekDays.forEach(day => {
        const dayString = day.toISOString().split('T')[0];
        const isSelected = dayString === state.selectedDate;
        const button = document.createElement('button');
        button.className = `flex flex-col items-center justify-center w-12 h-16 sm:w-16 sm:h-20 rounded-[1rem] sm:rounded-[1.25rem] transition-all duration-300 transform active:scale-95 shadow-xl mx-0.5 ${isSelected ? 'bg-indigo-600 text-white shadow-indigo-600/40 ring-2 ring-indigo-400/50 z-10 scale-110' : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 hover:bg-slate-700'}`;
        button.innerHTML = `<span class="text-[9px] sm:text-[10px] uppercase font-black opacity-70 mb-1">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="text-base sm:text-lg font-black">${day.getDate()}</span>`;
        button.onclick = () => {
            state.selectedDate = dayString;
            fetchCheckData();
            if (state.currentView === 'production') renderProductionView();
        };
        DOMElements.dateButtonsContainer.appendChild(button);
    });

    // Next Week Button
    const nextBtn = document.createElement('button');
    nextBtn.className = "flex items-center justify-center w-8 h-16 sm:h-20 rounded-r-[1.25rem] bg-slate-800/50 text-slate-500 hover:bg-slate-700/50 hover:text-white transition-all border-y border-r border-slate-700/50";
    nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>`;
    nextBtn.onclick = () => {
        const d = new Date(state.selectedDate);
        d.setDate(d.getDate() + 7);
        state.selectedDate = d.toISOString().split('T')[0];
        fetchCheckData();
        if (state.currentView === 'production') renderProductionView();
    };
    DOMElements.dateButtonsContainer.appendChild(nextBtn);
}

function renderDishSelectionGrid() {
    DOMElements.dishGridContainer.innerHTML = '';
    const sorted = [...(state.menu.dishes || [])].sort((a, b) => a.dishLetter.localeCompare(b.dishLetter));
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
    const sorted = [...state.menu.dishes].sort((a, b) => a.dishLetter.localeCompare(b.dishLetter));

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
                                <th class="px-2 py-3 text-left w-[38%]">Dish</th>
                                <th class="px-1 py-3 text-center w-[12%]">Temp</th>
                                <th class="px-1 py-3 text-center w-[13%]">Act.W</th>
                                <th class="px-1 py-3 text-center w-[13%]">Theo.W</th>
                                <th class="px-1 py-3 text-center w-[12%]">AI</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/50">
                            ${list.map(dish => {
            const check = state.checkedData[dish.dishLetter];
            const temps = (check?.temperatures || []).map(t => parseFloat(t)).filter(t => !isNaN(t));
            const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) + '°' : '-';
            const weights = (check?.weights || []).map(w => parseFloat(w)).filter(w => !isNaN(w));
            const avgWgt = weights.length ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(0) + 'g' : '-';
            let theo = dish.theoreticalWeight;
            if (!theo) {
                theo = (dish.dishIngredients || []).reduce((sum, ing) => sum + (parseFloat(ing.amount) || parseFloat(ing.weight) || 0), 0);
            }
            const theoStr = theo ? theo.toFixed(0) + 'g' : '-';
            const ai = check?.aiCheckResult?.score || '-';
            const aiClass = check && ai > 7 ? 'text-green-400' : 'text-indigo-400';

            return `
                                    <tr class="hover:bg-slate-700/40 cursor-pointer transition-colors ${!check ? 'opacity-30' : ''}" onclick="window.handleSelectDish('${dish.dishLetter}')">
                                        <td class="px-2 py-3 text-center font-black ${letterColor}">${dish.dishLetter}</td>
                                        <td class="px-2 py-3 ${nameColor} font-bold uppercase truncate italic">${dish.dishName}</td>
                                        <td class="px-1 py-3 text-center font-mono text-orange-300">${avgTemp}</td>
                                        <td class="px-1 py-3 text-center font-mono text-emerald-300">${avgWgt}</td>
                                        <td class="px-1 py-3 text-center font-mono text-slate-500">${theoStr}</td>
                                        <td class="px-1 py-3 text-center font-black ${aiClass}">${ai}</td>
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

function renderDishCard() {
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
                <div id="ai-feedback-container"></div>
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
    container.querySelector('#capture-btn').onclick = () => { const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; canvas.getContext('2d').drawImage(videoEl, 0, 0, 1024, 1024); const dataUrl = canvas.toDataURL('image/jpeg', 0.95); container.querySelector('#preview-img').src = dataUrl; form.dataset.capturedImage = dataUrl; if (stream) stream.getTracks().forEach(t => t.stop()); container.querySelector('#camera-view').classList.add('hidden'); container.querySelector('#image-preview').classList.remove('hidden'); if (form.id === 'dish-form') handleAiCheck(state.selectedDish, dataUrl); };
    container.querySelector('#retake-btn').onclick = () => { if (!form.querySelector('input').disabled) { container.querySelector('#image-preview').classList.add('hidden'); container.querySelector('#camera-placeholder').classList.remove('hidden'); } };
    if (initialImage) { container.querySelector('#preview-img').src = initialImage; form.dataset.capturedImage = initialImage; container.querySelector('#camera-placeholder').classList.add('hidden'); container.querySelector('#image-preview').classList.remove('hidden'); }
}

async function handleAiCheck(dish, capturedImageDataUrl) {
    const feedbackContainer = document.getElementById('ai-feedback-container'); if (!feedbackContainer) return;
    feedbackContainer.innerHTML = `<div class="p-10 sm:p-14 border-2 border-indigo-500/30 bg-indigo-900/10 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col items-center justify-center space-y-6 sm:space-y-8 shadow-2xl backdrop-blur-3xl"><div class="relative w-10 h-10 sm:w-12 sm:h-12"><div class="absolute inset-0 border-4 sm:border-8 border-indigo-500/10 rounded-full"></div><div class="absolute inset-0 border-4 sm:border-8 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div><p class="font-black text-indigo-400 text-[10px] sm:text-[12px] uppercase tracking-[0.6em] animate-pulse italic">Analyzing Visual Compliance</p></div>`;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); let refImgPart = null; try { const refRes = await fetch(dish.dishImage); if (refRes.ok) { const blob = await refRes.blob(); const refBase64 = await new Promise(res => { const fr = new FileReader(); fr.onloadend = () => res(fr.result.split(',')[1]); fr.readAsDataURL(blob); }); refImgPart = { inlineData: { mimeType: 'image/jpeg', data: refBase64 } }; } } catch (e) { console.warn("Reference failed."); }
        const result = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [{ text: `Audit '${dish.dishName}'. JSON: { "score": 1-10, "positives": string[], "improvements": string[], "overall_comment": string }` }, ...(refImgPart ? [refImgPart] : []), { inlineData: { mimeType: 'image/jpeg', data: capturedImageDataUrl.split(',')[1] } }] }, config: { responseMimeType: "application/json", temperature: 0.1 } });
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
    const recent = [...matches].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")).slice(0, 5);
    const avg = (recent.reduce((sum, c) => sum + (c.aiCheckResult?.score || 0), 0) / recent.length).toFixed(1);
    intelContainer.innerHTML = `
        <div class="flex items-center gap-4 animate-in fade-in duration-700">
            <div class="flex items-center gap-1.5">${recent.map(c => `<div class="w-2.5 h-2.5 rounded-full ${c.aiCheckResult?.score > 7 ? 'bg-green-500' : 'bg-indigo-500'} shadow-lg"></div>`).join('')}</div>
            <div class="h-4 w-px bg-slate-800"></div>
            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">${avg} Quality index (${matches.length} Total Logs)</span>
        </div>
    `;
}

// --- INTELLIGENCE ANALYTICS CORE ---

function renderAuditDishLibrary() {
    DOMElements.auditResultsContainer.innerHTML = '';

    // --- CHECK FOR MANUAL FETCH ---
    if (!state.hasFetchedHistory) {
        if (state.isHistoryLoading) {
            DOMElements.auditResultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div class="relative w-20 h-20 mb-8">
                        <div class="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p class="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Downloading Global Archive...</p>
                    <p class="text-slate-600 font-mono text-[9px] mt-2">Connecting to Neural Database</p>
                </div>
            `;
        } else {
            // "Connect to Database" Button State
            DOMElements.auditResultsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 px-6 animate-in fade-in zoom-in-95 duration-500 border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/50">
                    <div class="bg-indigo-600/10 p-8 rounded-[2.5rem] mb-8 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 class="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Analytics Offline</h3>
                    <p class="text-slate-400 mb-10 text-center max-w-md text-sm font-medium leading-relaxed">
                        Historical data connection is suspended to optimize bandwidth. Initiate the sequence to download the full audit history from the central database.
                    </p>
                    <button onclick="window.listenToGlobalHistory()" class="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 border-b-4 border-indigo-900 overflow-hidden">
                        <span class="relative z-10">Initialize Download Sequence</span>
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    </button>
                </div>
            `;
        }
        return;
    }

    // Clear old charts to prevent memory leaks
    if (window.auditCharts) {
        window.auditCharts.forEach(c => c.destroy());
        window.auditCharts = [];
    }

    // 1. Group ALL history by Normalized Name
    const dishStats = {};
    const allDates = new Set();

    state.allHistoricalChecks.forEach(check => {
        const key = normalizeName(check.dishName);
        if (check.pathDate) allDates.add(check.pathDate);

        if (!dishStats[key]) {
            dishStats[key] = {
                name: check.dishName,
                checks: [],
                scores: []
            };
        }
        if (check.timestamp && (!dishStats[key].lastTs || check.timestamp > dishStats[key].lastTs)) {
            dishStats[key].name = check.dishName;
            dishStats[key].lastTs = check.timestamp;
        }
        dishStats[key].checks.push(check);
        if (check.aiCheckResult && typeof check.aiCheckResult.score === 'number') {
            dishStats[key].scores.push(check.aiCheckResult.score);
        }
    });

    // --- GLOBAL HEADER ---
    const dateArray = Array.from(allDates).sort();
    const rangeStart = dateArray.length ? new Date(dateArray[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';
    const rangeEnd = dateArray.length ? new Date(dateArray[dateArray.length - 1]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

    const headerDiv = document.createElement('div');
    headerDiv.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-end border-b border-indigo-500/30 pb-4 mb-8 gap-4">
            <div>
                <h3 class="text-xl font-black text-white italic tracking-tight">Global Knowledge Base</h3>
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                    Database: ${state.allHistoricalChecks.length} Logs • ${rangeStart} — ${rangeEnd}
                </p>
                <div class="flex gap-2 mt-2">
                    ${dateArray.length === 1 ? `<p class="text-[9px] text-red-400 font-bold bg-red-900/20 inline-block px-2 py-1 rounded">NOTICE: Limited history detected. Analytics requires multiple days of data.</p>` : ''}
                    <p class="text-[9px] text-emerald-400 font-bold bg-emerald-900/20 inline-block px-2 py-1 rounded">SCOPE: Full Database</p>
                </div>
            </div>
             <div>
                <span class="px-4 py-2 bg-indigo-900/40 rounded-xl border border-indigo-500/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    ${Object.keys(dishStats).length} Dishes Indexed
                </span>
            </div>
        </div>
    `;
    DOMElements.auditResultsContainer.appendChild(headerDiv);

    const getTopicFrequency = (items) => {
        const counts = {};
        items.forEach(i => {
            if (!i) return;
            const k = i.trim().toLowerCase().replace(/[.,!]/g, '');
            if (!counts[k]) counts[k] = { text: i.trim(), count: 0 };
            counts[k].count++;
        });
        return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    };

    // --- SPLIT LOGIC: ACTIVE MENU vs ARCHIVE ---
    // Iterate state.menu to ensure ALL current menu items are shown, even if no history exists.

    const activeDishes = [];
    const usedStatsKeys = new Set();

    if (state.menu && state.menu.dishes) {
        state.menu.dishes.forEach(menuDish => {
            const key = normalizeName(menuDish.dishName);
            usedStatsKeys.add(key);

            if (dishStats[key]) {
                activeDishes.push({
                    ...dishStats[key],
                    isActive: true
                });
            } else {
                // Dish is in menu but has no history in Firebase
                activeDishes.push({
                    name: menuDish.dishName,
                    checks: [],
                    scores: [],
                    isActive: true,
                    isNew: true
                });
            }
        });
    }

    const archivedDishes = [];
    Object.keys(dishStats).forEach(key => {
        if (!usedStatsKeys.has(key)) {
            archivedDishes.push({
                ...dishStats[key],
                isActive: false
            });
        }
    });

    const createSectionHeader = (title, count, iconSvg, colorClass) => `
        <div class="flex items-center gap-4 mb-6 mt-12 border-b border-slate-800 pb-4 animate-in slide-in-from-left-8 duration-700">
            <div class="p-3 rounded-2xl ${colorClass.replace('bg-', 'bg-opacity-10 text-')} ${colorClass} bg-opacity-10">
                ${iconSvg}
            </div>
            <div>
                <h3 class="text-xl font-black text-white uppercase tracking-wider">${title}</h3>
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">${count} Items</p>
            </div>
        </div>
    `;

    // Render Function
    const renderDishList = (dishes, startIndex) => {
        dishes.forEach((dish, i) => {
            const index = startIndex + i;
            const total = dish.checks.length;

            // Stats Calculation
            let avgScore = 'N/A';
            let tier = 'N';
            let tierColor = 'text-slate-500';
            let tierBg = 'bg-slate-500/10 border-slate-500/20';
            let sortedChecks = [];
            let labels = [];
            let dataPoints = [];
            let goodInsights = [];
            let badInsights = [];
            let allPositives = [];
            let allImprovements = [];

            if (total > 0) {
                const sum = dish.scores.reduce((a, b) => a + b, 0);
                const mean = sum / total;
                avgScore = mean.toFixed(1);

                const variance = dish.scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / total;
                const stdDev = Math.sqrt(variance);

                tier = 'C'; tierColor = 'text-red-500'; tierBg = 'bg-red-500/10 border-red-500/20';
                if (mean >= 9 && stdDev < 1.0) { tier = 'S'; tierColor = 'text-purple-400'; tierBg = 'bg-purple-500/10 border-purple-500/20'; }
                else if (mean >= 8 && stdDev < 2.0) { tier = 'A'; tierColor = 'text-emerald-400'; tierBg = 'bg-emerald-500/10 border-emerald-500/20'; }
                else if (mean >= 6.5) { tier = 'B'; tierColor = 'text-yellow-400'; tierBg = 'bg-yellow-500/10 border-yellow-500/20'; }

                sortedChecks = dish.checks.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
                labels = sortedChecks.map(c => c.timestamp ? new Date(c.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '-');
                dataPoints = sortedChecks.map(c => c.aiCheckResult?.score || 0);

                const goodChecks = sortedChecks.filter(c => c.aiCheckResult?.score >= 8);
                const badChecks = sortedChecks.filter(c => c.aiCheckResult?.score <= 6);

                const getInsights = (checks) => checks.map(c => c.aiCheckResult?.overall_comment || "").filter(c => c.length > 5).slice(0, 3);

                goodInsights = getInsights(goodChecks);
                badInsights = getInsights(badChecks);

                allPositives = getTopicFrequency(sortedChecks.flatMap(c => c.aiCheckResult?.positives || []));
                allImprovements = getTopicFrequency(sortedChecks.flatMap(c => c.aiCheckResult?.improvements || []));
            }

            const card = document.createElement('div');
            card.className = "bg-slate-800/60 rounded-[2.5rem] p-8 border border-slate-700/50 backdrop-blur-md hover:bg-slate-800/80 transition-all relative overflow-hidden mb-8 group";
            const canvasId = `chart-${index}`;

            // Conditional HTML content
            const chartHtml = total > 0
                ? `<div class="h-40 w-full relative"><canvas id="${canvasId}"></canvas></div>`
                : `<div class="h-40 w-full flex items-center justify-center border-2 border-dashed border-slate-700/50 rounded-3xl"><p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No Trend Data Available</p></div>`;

            const deepDiveHtml = total > 0
                ? `
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                        <div class="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                            <div class="flex items-center gap-3 mb-2">
                                 <div class="bg-green-500/20 p-2 rounded-xl text-green-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                 <p class="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">Success Patterns</p>
                            </div>
                            <ul class="space-y-4">
                                ${goodInsights.length ? goodInsights.map(txt => `<li class="text-[10px] text-slate-300 italic border-l-2 border-green-500/30 pl-3 leading-relaxed">"${txt}"</li>`).join('') : '<li class="text-[10px] text-slate-600 italic">Insufficient data</li>'}
                            </ul>
                        </div>
                        <div class="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                             <div class="flex items-center gap-3 mb-2">
                                 <div class="bg-red-500/20 p-2 rounded-xl text-red-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                                 <p class="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Risk Patterns</p>
                            </div>
                            <ul class="space-y-4">
                                ${badInsights.length ? badInsights.map(txt => `<li class="text-[10px] text-slate-300 italic border-l-2 border-red-500/30 pl-3 leading-relaxed">"${txt}"</li>`).join('') : '<li class="text-[10px] text-slate-600 italic">Insufficient data</li>'}
                            </ul>
                        </div>
                    </div>
                `
                : '';

            card.innerHTML = `
                <div class="flex flex-col gap-8 relative z-10">
                    <!-- Header -->
                    <div class="border-b border-white/5 pb-6 flex justify-between items-start">
                        <div>
                            <h3 class="text-2xl font-black text-white italic uppercase tracking-tight">${dish.name}</h3>
                            <div class="flex items-center gap-3 mt-3">
                                ${total > 0 ? `<div class="px-3 py-1 rounded-lg ${tierBg} border text-[9px] font-black ${tierColor} uppercase tracking-widest">Tier ${tier} Reliability</div>` : `<div class="px-3 py-1 rounded-lg bg-slate-700/30 border border-slate-600/30 text-[9px] font-black text-slate-400 uppercase tracking-widest">No History</div>`}
                                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 border-l border-slate-700">${total} Audits</span>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="text-4xl font-black ${total > 0 ? 'text-white' : 'text-slate-700'} font-mono tracking-tighter">${avgScore}</div>
                             <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Avg Score</div>
                        </div>
                    </div>

                    <!-- Trend Graph -->
                    ${chartHtml}

                    <!-- Deep Dive -->
                    ${deepDiveHtml}
                    
                    ${total > 0 ? `
                        <!-- Keywords -->
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                             <div><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Common Strengths</p><div class="flex flex-wrap gap-2">${allPositives.map(p => `<span class="px-3 py-1 bg-green-900/20 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-300 uppercase">${p.text}</span>`).join('') || '<span class="text-slate-600 text-[10px]">N/A</span>'}</div></div>
                             <div><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Common Improvements</p><div class="flex flex-wrap gap-2">${allImprovements.map(p => `<span class="px-3 py-1 bg-yellow-900/20 border border-yellow-500/20 rounded-lg text-[10px] font-bold text-yellow-300 uppercase">${p.text}</span>`).join('') || '<span class="text-slate-600 text-[10px]">N/A</span>'}</div></div>
                        </div>
                        <!-- Log -->
                        <div class="mt-8 border-t border-white/5 pt-8"><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Audit Chronology</p><div class="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">${sortedChecks.map(check => { const score = check.aiCheckResult?.score || 0; const date = check.pathDate || 'Unknown'; const color = score >= 8 ? 'text-green-400' : score <= 6 ? 'text-red-400' : 'text-indigo-400'; return `<div class="flex justify-between items-center p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:bg-slate-900/50 transition-colors"><div class="flex items-center gap-4"><span class="text-[10px] font-mono text-slate-500 font-bold">${date}</span><span class="text-xs font-black ${color}">${score}/10</span></div><p class="text-[10px] text-slate-400 italic truncate max-w-[60%]">${check.aiCheckResult?.overall_comment || "No comment"}</p></div>`; }).join('')}</div></div>
                    ` : ''}
                </div>
            `;
            DOMElements.auditResultsContainer.appendChild(card);

            // Chart Rendering
            if (total > 0 && typeof Chart !== 'undefined') {
                const ctx = document.getElementById(canvasId).getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Quality Score',
                            data: dataPoints,
                            borderColor: '#6366f1',
                            backgroundColor: (context) => {
                                const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
                                bg.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
                                bg.addColorStop(1, 'rgba(99, 102, 241, 0)');
                                return bg;
                            },
                            borderWidth: 2,
                            pointBackgroundColor: '#1e293b',
                            pointBorderColor: '#818cf8',
                            pointRadius: 4,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { min: 0, max: 10, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } } },
                            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9, weight: 'bold' }, maxTicksLimit: 6 } }
                        }
                    }
                });
                window.auditCharts.push(chart);
            }
        });
    };

    if (activeDishes.length > 0) {
        DOMElements.auditResultsContainer.insertAdjacentHTML('beforeend', createSectionHeader("Active Menu Matrix", activeDishes.length, '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', 'bg-emerald-500'));
        renderDishList(activeDishes, 0);
    }

    if (archivedDishes.length > 0) {
        DOMElements.auditResultsContainer.insertAdjacentHTML('beforeend', createSectionHeader("Historical Archive", archivedDishes.length, '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>', 'bg-slate-500'));
        renderDishList(archivedDishes, activeDishes.length);
    }

    if (activeDishes.length === 0 && archivedDishes.length === 0) {
        DOMElements.auditResultsContainer.innerHTML += `<div class="text-center py-20 border-2 border-dashed border-slate-800 rounded-[3rem]"><p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">No Records Found</p></div>`;
    }
}

// Make it available globally
window.renderAuditDishLibrary = renderAuditDishLibrary;
window.listenToGlobalHistory = listenToGlobalHistory;

// Ignition
fetchMenu();
fetchCheckData();
listenToProductionOrders();
showView('prep');