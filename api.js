
import { ref, onValue, update, query, orderByKey, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { database } from "./firebase-config.js";
import { state } from "./state.js";
import { getWeekId, discoverLogs, normalizeName } from "./utils.js";

const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

function notify() {
    listeners.forEach(cb => cb());
}

export function saveCheckData(data) {
    const { capturedImage, ...metaData } = data;
    const updates = {};
    const dishKey = data.dishLetter;
    
    updates[`quality-checks/${data.date}/${dishKey}`] = metaData;
    
    if (capturedImage) {
        updates[`check-images/${data.date}/${dishKey}`] = capturedImage;
    }

    return update(ref(database), updates).then(() => {
        state.checkedData[dishKey] = { ...metaData, capturedImage };
        // We don't necessarily need to full notify here as UI is often updated optimistically or via onValue
    });
}

export function listenToGlobalHistory(callback) {
    state.isHistoryLoading = true;
    if(callback) callback(); 

    onValue(ref(database), (snapshot) => {
        const data = snapshot.val() || {};
        const qualityData = data['quality-checks'] || {};
        const hygieneData = data['hygiene-checks'] || {};
        
        const qualityLogs = discoverLogs(qualityData);
        const hygieneLogs = discoverLogs(hygieneData);
        
        const allLogs = [...qualityLogs, ...hygieneLogs];
        state.allHistoricalChecks = allLogs;
        state.totalRecordsFound = allLogs.length;
        
        const dishMap = new Map();
        qualityLogs.forEach(log => {
            const key = normalizeName(log.dishName);
            if (!dishMap.has(key)) {
                dishMap.set(key, { name: log.dishName, type: log.dishType || 'extras', count: 1 });
            } else {
                dishMap.get(key).count += 1;
            }
        });
        state.historicalDishLibrary = Array.from(dishMap.values()).sort((a,b) => b.count - a.count);
        state.isLibraryLoaded = true;
        state.hasFetchedHistory = true;
        state.isHistoryLoading = false;
        
        if(callback) callback();
    });
}

export function listenToProductionOrders(callback) {
    onValue(ref(database, 'production-orders'), (snapshot) => {
        const val = snapshot.val();
        state.productionOrders = Array.isArray(val) ? val : (val ? [val] : []);
        if(callback) callback();
    });
}

export function fetchCheckData() { 
    state.isCheckDataLoading = true; 
    notify(); // update loading state
    onValue(ref(database, `quality-checks/${state.selectedDate}`), (snapshot) => { 
        state.checkedData = snapshot.val() || {}; 
        state.isCheckDataLoading = false; 
        notify(); 
    }); 
    onValue(ref(database, `prep-checks/${state.selectedDate}`), (snapshot) => { 
        state.prepData = snapshot.val() || {}; 
        notify(); 
    }); 
    onValue(ref(database, `hygiene-checks/${state.selectedDate}`), (snapshot) => { 
        state.hygieneData = snapshot.val() || {}; 
        notify(); 
    }); 
}

export function fetchMenu() { 
    state.isMenuLoading = true; 
    notify(); 
    const weekId = getWeekId(new Date(state.selectedDate + 'T12:00:00Z')); 
    onValue(ref(database, `menus/${weekId}`), (snapshot) => { 
        state.menu = snapshot.val() || null; 
        state.isMenuLoading = false; 
        notify();
    }); 
}

export async function updateProductionOrders(data) {
     await set(ref(database, 'production-orders'), data);
}

export async function updateMenu(weekId, data) {
    await set(ref(database, `menus/${weekId}`), data);
}
