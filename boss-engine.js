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
            // Find the base required quantity from the first actively scheduled day (typically Tue since Mon is 0 in exports)
            let rawOrderedQty = 0;
            if (item.orders) {
                rawOrderedQty = item.orders.mon || item.orders.tue || item.orders.wed || item.orders.thu || item.orders.fri || 0;
            }

            if (rawOrderedQty > 0) {
                const stock = item.stock || 0;
                // Buffer for +5 dish, subtract leftover stock so next day they will not cook unnecessary
                let prepTarget = Math.max(0, rawOrderedQty + 5 - stock);
                
                // Categorization Logic
                let category = 'Hot';
                const lowerName = item.name.toLowerCase();
                if (lowerName.includes('salad') || lowerName.includes('mousse') || lowerName.includes('poke')) {
                    category = 'Cold';
                } else if (lowerName.includes('sauce') || lowerName.includes('dressing') || lowerName.includes('bread') || lowerName.includes('rice')) {
                    category = 'Add-ons';
                } else if (prepTarget > 5000) { // High volume items marked as Catering for demo
                    category = 'Catering';
                }

                dailyActiveDishes.push({
                    name: item.name,
                    ordered: rawOrderedQty,
                    stock: stock,
                    qty: prepTarget, // The exact number kitchen needs to prepare
                    category: category,
                    type: (category === 'Cold') ? 'cold' : 'hot',
                    letter: item.name.substring(0,2).toUpperCase() + Math.floor(Math.random() * 100),
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
                    comments: ['Portion size was a bit small', 'Customer requested extra sauce', 'Perfectly cooked last time'],
                    ingredientsList: [
                        { name: 'Core Protein', weight: 150 },
                        { name: 'Base Grain', weight: 100 },
                        { name: 'Sauce/Dressing', weight: 50 },
                        { name: 'Garnish', weight: 10 }
                    ]
                });
                totalItemsToPrep += prepTarget;
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
