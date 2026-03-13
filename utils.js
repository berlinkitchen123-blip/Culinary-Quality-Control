
export const normalizeName = (name) => {
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

export const isDishMatch = (name1, name2) => {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    if (!n1 || !n2) return false;
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
};

export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

export const getWeekId = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
};

export const discoverLogs = (node, found = [], dateContext = null, currentKey = null) => {
    if (!node || typeof node !== 'object') return found;
    
    // Check for Quality Check
    if (node.dishName || node.aiCheckResult || (node.temperatures && node.weights)) {
        if(node.dishName) { 
             found.push({
                ...node,
                logType: 'quality',
                dishLetter: currentKey,
                pathDate: dateContext || node.date || (node.timestamp ? node.timestamp.split('T')[0] : 'Historical')
            });
            return found;
        }
    }

    // Check for Hygiene Check
    if (node.areas && node.timestamp && !node.dishName) {
        found.push({
            ...node,
            logType: 'hygiene',
            taskId: currentKey,
            pathDate: dateContext || (node.timestamp ? node.timestamp.split('T')[0] : 'Historical')
        });
        return found;
    }

    Object.entries(node).forEach(([key, val]) => {
        const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(key);
        discoverLogs(val, found, isDateKey ? key : dateContext, key);
    });
    return found;
};

// Prep Utils
export const PREP_KEYWORDS = ['rice', 'curry', 'sauce', 'gravy', 'dal', 'veg', 'meat', 'chicken', 'base', 'paste', 'stew', 'broth', 'cooked'];

export function getPrepIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('rice')) return '🍚';
    if (n.includes('curry') || n.includes('sauce') || n.includes('gravy')) return '🥫';
    if (n.includes('veg')) return '🥦';
    if (n.includes('chicken') || n.includes('meat') || n.includes('beef')) return '🥩';
    if (n.includes('dal') || n.includes('stew')) return '🍲';
    return '🥘';
}

export function extractPrepItems(menu) {
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

// Production Utils
export function parseProductionRecipeItem(str) {
    let name = str;
    let weight = 0;
    const weightMatch = str.match(/\((\d+(?:\.\d+)?)\s*gr\)/i);
    if (weightMatch) weight = parseFloat(weightMatch[1]);
    const splitIndex = str.indexOf(' x');
    if (splitIndex > -1) {
        name = str.substring(0, splitIndex).trim();
    } else {
        const xIndex = str.lastIndexOf('x');
        if (xIndex > -1 && xIndex < str.length - 3) { 
             const preX = str.substring(0, xIndex).trim();
             if(preX.length > 2) name = preX;
        }
    }
    return { name, weight, original: str };
}

export function formatTime(minutes) {
    if (!minutes && minutes !== 0) return 'ASAP';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function aggregateProductionData(orders) {
    const dishes = {};
    const summary = { hot: 0, cold: 0, total: 0 };
    
    orders.forEach(order => {
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
