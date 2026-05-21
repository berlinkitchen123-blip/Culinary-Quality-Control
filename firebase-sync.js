/* =====================================================================
   Firebase Realtime Database sync
   ---------------------------------------------------------------------
   Data model:

   /dishes/{dishId}                 — master list (rare changes)
     { id, letter, name, type, spec: {tempMin, tempMax, weightTarget,
       weightTolerance}, warmerId }

   /days/{YYYY-MM-DD}/{dishId}      — per-day readings
     { temp, weight, stock, status, notes:[], updatedAt, updatedBy }

   The app listens to both, merges them into a single in-memory model,
   and writes changes back as soon as the user edits a value.
   ===================================================================== */

import { database } from './firebase-config.js';
import {
    ref,
    onValue,
    set,
    update,
    remove,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

/* ---------- helpers ---------- */

export function todayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

let _connected = false;
let _connListeners = [];

export function onConnectionChange(fn) { _connListeners.push(fn); fn(_connected); }
function emitConn(state) { _connected = state; _connListeners.forEach(fn => fn(state)); }

// Track .info/connected
try {
    onValue(ref(database, '.info/connected'), snap => emitConn(snap.val() === true));
} catch (e) {
    console.warn('Firebase connection probe failed', e);
}

/* ---------- Dishes (master) ---------- */

export function subscribeDishes(callback) {
    return onValue(ref(database, 'dishes'), snap => {
        const val = snap.val() || {};
        // Normalise into an array sorted by letter then id
        const arr = Object.entries(val).map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => (a.letter || '').localeCompare(b.letter || '') || a.id.localeCompare(b.id));
        callback(arr);
    });
}

export async function saveDish(dish) {
    if (!dish.id) throw new Error('Dish requires an id');
    const { id, ...rest } = dish;
    await set(ref(database, `dishes/${id}`), rest);
}

export async function deleteDish(id) {
    await remove(ref(database, `dishes/${id}`));
    // Optionally cascade-delete from today's readings — leave history alone.
}

/* ---------- Day readings ---------- */

export function subscribeDay(dayIso, callback) {
    return onValue(ref(database, `days/${dayIso}`), snap => {
        callback(snap.val() || {});
    });
}

export async function saveReading(dayIso, dishId, partial) {
    const path = `days/${dayIso}/${dishId}`;
    await update(ref(database, path), {
        ...partial,
        updatedAt: serverTimestamp()
    });
}

export async function saveDayMeta(dayIso, partial) {
    await update(ref(database, `days/${dayIso}/_meta`), partial);
}

/* ---------- Seed (one-time) ---------- */
/**
 * Seed the database with the default master list of dishes if /dishes
 * is empty. Idempotent — never overwrites existing data.
 */
export async function seedIfEmpty(defaultDishes) {
    return new Promise((resolve) => {
        const off = onValue(ref(database, 'dishes'), async (snap) => {
            off();
            if (snap.exists() && Object.keys(snap.val() || {}).length > 0) {
                resolve(false);
                return;
            }
            const seed = {};
            for (const d of defaultDishes) {
                const { id, ...rest } = d;
                seed[id] = rest;
            }
            await set(ref(database, 'dishes'), seed);
            resolve(true);
        }, { onlyOnce: true });
    });
}
