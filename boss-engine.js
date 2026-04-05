import { RAW_DATA } from './raw-data.js';

export const BossEngine = {
    operators: [
        { id: 'asm1', name: 'Stefan Koch', assignedDishes: [] },
        { id: 'asm2', name: 'Elena Weber', assignedDishes: [] },
        { id: 'asm3', name: 'Amir Yilmaz', assignedDishes: [] }
    ],
    
    init() {
        console.log("Boss Engine: Initializing autonomous pipeline with Real Client Data.");
        this.processDay('tue'); // Start with default loaded logic
    },

    processDay(dayCode) {
        // dayCode = 'mon', 'tue', 'wed', 'thu', 'fri'
        console.log(`Boss Engine: Processing full operational workflow for ${dayCode.toUpperCase()}`);
        
        let dailyActiveDishes = [];
        let totalItemsToPrep = 0;

        RAW_DATA.forEach(item => {
            // "chek number of dish order on monday, same number of dish have to prepare whol week for everyday"
            // Find the base required quantity from the first actively scheduled day (typically Tue since Mon is 0 in exports)
            let requiredQty = 0;
            if (item.orders) {
                requiredQty = item.orders.mon || item.orders.tue || item.orders.wed || item.orders.thu || item.orders.fri || 0;
            }

            if (requiredQty > 0) {
                dailyActiveDishes.push({
                    name: item.name,
                    qty: requiredQty,
                    type: (!item.name.toLowerCase().includes('salad') && !item.name.toLowerCase().includes('mousse')) ? 'hot' : 'cold',
                    letter: item.name.substring(0,2).toUpperCase() + Math.floor(Math.random() * 100)
                });
                totalItemsToPrep += requiredQty;
            }
        });

        // Optimize and split workload to operators smoothly without human input
        this.operators.forEach(op => op.assignedDishes = []); // reset
        
        // Sorting by largest orders first for fair balancing
        dailyActiveDishes.sort((a,b) => b.qty - a.qty);

        dailyActiveDishes.forEach((dish, idx) => {
            const opIndex = idx % this.operators.length;
            this.operators[opIndex].assignedDishes.push(dish);
        });

        // Generate dynamic Kitchen Stations based on exact load
        const hots = dailyActiveDishes.filter(d => d.type === 'hot');
        const colds = dailyActiveDishes.filter(d => d.type === 'cold');

        const kitchenStations = [
            { id: 'st1', name: 'High-Volume Hot', operator: 'Marco Rossi', type: 'hot', tasks: hots.slice(0, 5).map(d => ({ ingredient: d.name, targetKg: (d.qty * 0.25).toFixed(1), status: 'cooking' })) },
            { id: 'st3', name: 'Secondary Hot', operator: 'Anna Verdi', type: 'grain', tasks: hots.slice(5, 10).map(d => ({ ingredient: d.name, targetKg: (d.qty * 0.25).toFixed(1), status: 'waiting' })) },
            { id: 'st4', name: 'Cold Prep', operator: 'Elena Weber', type: 'cold', tasks: colds.map(d => ({ ingredient: d.name, targetKg: (d.qty * 0.25).toFixed(1), status: 'done' })) }
        ];

        // Generate exact Production Orders matching daily flow
        const productionLine = [];
        dailyActiveDishes.forEach((dish, i) => {
            productionLine.push({
                id: `prod-${dayCode}-${i}`,
                name: dish.name,
                type: dish.type,
                count: dish.qty,
                deliveryDate: dayCode.toUpperCase(),
                readyBy: 11 * 60 + 30, // Default ready target 11:30 
                ingredients: [
                    { name: "Base Core Ingredient", totalWeight: dish.qty * 200 }
                ]
            });
        });

        window._BossData = {
            dayCode,
            activeDishes: dailyActiveDishes,
            operators: this.operators,
            kitchenStations,
            productionLine,
            totalItemsToPrep
        };

        // Notify app to re-render naturally
        if (window.renderDishAssignView && document.getElementById('dish-assign-view') && !document.getElementById('dish-assign-view').classList.contains('hidden')) {
            window.renderDishAssignView();
        }
        if (window.renderKitchenOverview && document.getElementById('kitchen-overview-view') && !document.getElementById('kitchen-overview-view').classList.contains('hidden')) {
            window.renderKitchenOverview();
        }
        if (window.renderForecastView && document.getElementById('forecast-view') && !document.getElementById('forecast-view').classList.contains('hidden')) {
            window.renderForecastView();
        }
        if (window.renderProductionView && document.getElementById('production-content-container')) {
            window.renderProductionView();
        }
    }
};
