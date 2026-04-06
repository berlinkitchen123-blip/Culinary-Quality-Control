
import { Notifications } from "./ui-notifications.js";

// =============================================
// INGREDIENT QUANTITIES — Connected to Inventory
// Shows what kitchen needs vs what's in stock (Epicbase)
// =============================================

// Mock Epicbase inventory data (replace with live API)
const EPICBASE_STOCK = {
    'Cordon Bleu with Green Beans': { stock: 162, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'B&B Butter Chicken with Rice & Naan': { stock: 425, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Phanaeng Chicken curry': { stock: 214, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Low Carb Döner-Teller': { stock: 85, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Spinach Ricotta Tortellini with cream tomato sauce': { stock: 138, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Chicken in champignon sauce with Spatzle': { stock: 127, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Vegan Madras Kofta': { stock: 90, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'B&B Butter Tofu': { stock: 114, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Japanese inspired vegan noodles bowl': { stock: 76, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Test&Tell: High-Protien Thai Peanut Bowl with Chickpea & Tofu': { stock: 9953, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'The Ultimate Vegan Bowl': { stock: 88, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Frijoles Chicken Boost': { stock: 40, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Spicy Tuna Poke Bowl': { stock: 83, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Lasagna Bolognese with Seasonal Veggies': { stock: 153, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Korean BBQ Pulled Pork Burger': { stock: 60, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Thai chicken salad': { stock: 101, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Garden Green Salad with Chicken': { stock: 693, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Thai Coconut curry with Vegan Chicken': { stock: 768, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Chicken': { stock: 18329, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Smashed Medjool Date': { stock: 119, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Soleil de Saumon': { stock: 44, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Spicy Chicken Pizza Sandwich': { stock: 184, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Osaka Gyoza Bowl': { stock: 81, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Mediterranean Cruise': { stock: 126, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Peaches Omelette Salad': { stock: 39, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Zucchini Falafel Wrap': { stock: 82, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Avocado Egg Sandwich': { stock: 37, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Vegetables Tikka Masala': { stock: 123, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Crème a l\'orange': { stock: 990, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Roasted Vegetables': { stock: 812, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Tanzania Kokoa Kamili': { stock: 77, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Minestrone Soup': { stock: 5, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Potato soup with sausages': { stock: 21, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Be-Kind Protein Dark chocolate nut': { stock: 67, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Heat to Eat: Chicken breast with coconut curry': { stock: 56, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Be-kind Honey Roasted Nuts & Sea Salt': { stock: 19, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Chocolate Mousse': { stock: 4883, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Rice': { stock: 597, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Baba Ghanoush': { stock: 99, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Basil Tomato Soup': { stock: 8, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Be-Kind Protein crunchy peanut butter': { stock: 70, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jardin Fire': { stock: 67, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Heat to Eat: Chili sin Carne': { stock: 59, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Be-kind Almond & Mixed Fruits': { stock: 23, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Be-kind Caramel Almond & Sea Salt': { stock: 23, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Fruit Salad Mojito': { stock: 66, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Heat to Eat: Penne with Cheese sauce': { stock: -10, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Balisto Korn Kernel': { stock: 24, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Balisto yogurt berries': { stock: 10, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Ballisto Muesli-Mix': { stock: 31, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Bouche Earlybird Kombucha': { stock: 18, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Bouche Kombucha Hibiskus': { stock: 18, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Chari Tea black': { stock: 21, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Chari Tea Red': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'ChariTea Green': { stock: 5, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'ChariTea Organic': { stock: 23, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Corny Chocolate': { stock: 63, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Corny Chocolate Banana': { stock: 39, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Corny Strawberry Yogurt': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'FJ Rauch Iced Tea Peach': { stock: 32, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'FJ Rauch Iced Tea Pomegranate': { stock: 13, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'FJ Rauch Icetea Green': { stock: 33, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'FJ Rauch Strawberry Juice': { stock: 12, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Franz Josef Rauch Bio Cranberry Lemonade': { stock: 38, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Franz Josef Rauch Bio Maracuja Schorle': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Franz Josef Rauch Cocos Pineapple Fruit Juice Drink': { stock: 23, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Franz Josef Rauch FJR Organic Apple Spritzer naturally cloudy': { stock: 16, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Franz Josef Rauch Orange Juice': { stock: 18, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Hanuta': { stock: 176, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Grapefruit': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Guava': { stock: 22, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Lime': { stock: 14, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Mandarine': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Mango': { stock: 7, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Mexican Cola': { stock: 16, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Pineapple': { stock: 20, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Jarritos Strawberry': { stock: 17, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Knoppers': { stock: 0, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Kombucha Carpe Diem': { stock: 14, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Labneh Mezze': { stock: 13, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'Sultana’s Garden': { stock: 33, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'YFood Drink Classic Chocolate': { stock: 47, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'YFood Drink Cold Brew Coffee': { stock: 51, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'YFood Drink Fresh Berry': { stock: 56, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'YFood Drink Funky Peanuts': { stock: 65, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
    'YFood Drink Salted Caramel': { stock: 62, unit: 'count/kg', reorderLevel: 0, supplier: 'Epicbase Extract', lastDelivery: 'Actuals' },
};

// Today's requirements (calculated from dish menu after cutoff)
const TODAYS_REQUIREMENTS = [
    { name: 'Cordon Bleu with Green Beans', requiredG: 11255, dishes: ['Cordon Bleu with Green Beans (x11255)'] },
    { name: 'B&B Butter Chicken with Rice & Naan', requiredG: 10054, dishes: ['B&B Butter Chicken with Rice & Naan (x10054)'] },
    { name: 'Phanaeng Chicken curry', requiredG: 8247, dishes: ['Phanaeng Chicken curry (x8247)'] },
    { name: 'Low Carb Döner-Teller', requiredG: 6440, dishes: ['Low Carb Döner-Teller (x6440)'] },
    { name: 'Spinach Ricotta Tortellini with cream tomato sauce', requiredG: 6003, dishes: ['Spinach Ricotta Tortellini with cream tomato sauce (x6003)'] },
    { name: 'Chicken in champignon sauce with Spatzle', requiredG: 5588, dishes: ['Chicken in champignon sauce with Spatzle (x5588)'] },
    { name: 'Vegan Madras Kofta', requiredG: 4993, dishes: ['Vegan Madras Kofta (x4993)'] },
    { name: 'B&B Butter Tofu', requiredG: 4376, dishes: ['B&B Butter Tofu (x4376)'] },
    { name: 'Japanese inspired vegan noodles bowl', requiredG: 4376, dishes: ['Japanese inspired vegan noodles bowl (x4376)'] },
    { name: 'Test&Tell: High-Protien Thai Peanut Bowl with Chickpea & Tofu', requiredG: 4286, dishes: ['Test&Tell: High-Protien Thai Peanut Bowl with Chickpea & Tofu (x4286)'] },
    { name: 'The Ultimate Vegan Bowl', requiredG: 4264, dishes: ['The Ultimate Vegan Bowl (x4264)'] },
    { name: 'Frijoles Chicken Boost', requiredG: 3950, dishes: ['Frijoles Chicken Boost (x3950)'] },
    { name: 'Spicy Tuna Poke Bowl', requiredG: 3948, dishes: ['Spicy Tuna Poke Bowl (x3948)'] },
    { name: 'Lasagna Bolognese with Seasonal Veggies', requiredG: 3118, dishes: ['Lasagna Bolognese with Seasonal Veggies (x3118)'] },
    { name: 'Korean BBQ Pulled Pork Burger', requiredG: 3050, dishes: ['Korean BBQ Pulled Pork Burger (x3050)'] },
    { name: 'Thai chicken salad', requiredG: 3050, dishes: ['Thai chicken salad (x3050)'] },
    { name: 'Garden Green Salad with Chicken', requiredG: 2949, dishes: ['Garden Green Salad with Chicken (x2949)'] },
    { name: 'Thai Coconut curry with Vegan Chicken', requiredG: 2264, dishes: ['Thai Coconut curry with Vegan Chicken (x2264)'] },
    { name: 'Chicken', requiredG: 1838, dishes: ['Chicken (x1838)'] },
    { name: 'Smashed Medjool Date', requiredG: 1278, dishes: ['Smashed Medjool Date (x1278)'] },
    { name: 'Soleil de Saumon', requiredG: 1186, dishes: ['Soleil de Saumon (x1186)'] },
    { name: 'Spicy Chicken Pizza Sandwich', requiredG: 1087, dishes: ['Spicy Chicken Pizza Sandwich (x1087)'] },
    { name: 'Osaka Gyoza Bowl', requiredG: 286, dishes: ['Osaka Gyoza Bowl (x286)'] },
    { name: 'Mediterranean Cruise', requiredG: 231, dishes: ['Mediterranean Cruise (x231)'] },
    { name: 'Peaches Omelette Salad', requiredG: 231, dishes: ['Peaches Omelette Salad (x231)'] },
    { name: 'Zucchini Falafel Wrap', requiredG: 220, dishes: ['Zucchini Falafel Wrap (x220)'] },
    { name: 'Avocado Egg Sandwich', requiredG: 187, dishes: ['Avocado Egg Sandwich (x187)'] },
    { name: 'Vegetables Tikka Masala', requiredG: 187, dishes: ['Vegetables Tikka Masala (x187)'] },
    { name: 'Crème a l\'orange', requiredG: 88, dishes: ['Crème a l\'orange (x88)'] },
    { name: 'Roasted Vegetables', requiredG: 77, dishes: ['Roasted Vegetables (x77)'] },
    { name: 'Tanzania Kokoa Kamili', requiredG: 77, dishes: ['Tanzania Kokoa Kamili (x77)'] },
    { name: 'Minestrone Soup', requiredG: 66, dishes: ['Minestrone Soup (x66)'] },
    { name: 'Potato soup with sausages', requiredG: 66, dishes: ['Potato soup with sausages (x66)'] },
    { name: 'Be-Kind Protein Dark chocolate nut', requiredG: 55, dishes: ['Be-Kind Protein Dark chocolate nut (x55)'] },
    { name: 'Heat to Eat: Chicken breast with coconut curry', requiredG: 44, dishes: ['Heat to Eat: Chicken breast with coconut curry (x44)'] },
    { name: 'Be-kind Honey Roasted Nuts & Sea Salt', requiredG: 44, dishes: ['Be-kind Honey Roasted Nuts & Sea Salt (x44)'] },
    { name: 'Chocolate Mousse', requiredG: 44, dishes: ['Chocolate Mousse (x44)'] },
    { name: 'Rice', requiredG: 44, dishes: ['Rice (x44)'] },
    { name: 'Baba Ghanoush', requiredG: 33, dishes: ['Baba Ghanoush (x33)'] },
    { name: 'Basil Tomato Soup', requiredG: 33, dishes: ['Basil Tomato Soup (x33)'] },
    { name: 'Be-Kind Protein crunchy peanut butter', requiredG: 22, dishes: ['Be-Kind Protein crunchy peanut butter (x22)'] },
    { name: 'Jardin Fire', requiredG: 22, dishes: ['Jardin Fire (x22)'] },
    { name: 'Heat to Eat: Chili sin Carne', requiredG: 11, dishes: ['Heat to Eat: Chili sin Carne (x11)'] },
    { name: 'Be-kind Almond & Mixed Fruits', requiredG: 11, dishes: ['Be-kind Almond & Mixed Fruits (x11)'] },
    { name: 'Be-kind Caramel Almond & Sea Salt', requiredG: 11, dishes: ['Be-kind Caramel Almond & Sea Salt (x11)'] },
    { name: 'Fruit Salad Mojito', requiredG: 11, dishes: ['Fruit Salad Mojito (x11)'] },
];

let kitchenUsageLog = {};

export function renderIngredientQtyView() {
    const container = document.getElementById('ingredient-view');
    if (!container) return;

    // Dynamically compute requirements from BossData (which already has buffer+stock logic)
    let requirements = TODAYS_REQUIREMENTS;
    if (window._BossData && window._BossData.activeDishes) {
        requirements = window._BossData.activeDishes.map(d => ({
            name: d.name,
            requiredG: d.ordered,   // raw ordered qty
            buffer: 5,
            stockAvail: d.stock,
            prepTarget: d.qty,      // ordered + 5 buffer - stock
            dishes: [`${d.name} (x${d.qty})`]
        }));
    }

    // Calculate statuses
    const tableRows = requirements.map(req => {
        const stock = EPICBASE_STOCK[req.name] || { stock: 0, unit: 'g', reorderLevel: 0, supplier: 'Unknown' };
        const prepTarget = req.prepTarget || req.requiredG;
        const remaining = stock.stock - prepTarget;
        const used = kitchenUsageLog[req.name] || 0;
        const actualRemaining = stock.stock - used;
        const pctUsed = prepTarget > 0 ? Math.round((used / prepTarget) * 100) : 0;

        let status, statusColor, statusBg;
        if (stock.stock < req.requiredG) {
            status = 'SHORTAGE'; statusColor = 'text-red-600'; statusBg = 'bg-red-50 border-red-200';
        } else if (remaining < stock.reorderLevel) {
            status = 'LOW STOCK'; statusColor = 'text-amber-600'; statusBg = 'bg-amber-50 border-amber-200';
        } else {
            status = 'OK'; statusColor = 'text-emerald-600'; statusBg = 'bg-emerald-50 border-emerald-200';
        }

        return { ...req, stock, remaining, used, actualRemaining, pctUsed, status, statusColor, statusBg };
    }).sort((a, b) => {
        const order = { 'SHORTAGE': 0, 'LOW STOCK': 1, 'OK': 2 };
        return order[a.status] - order[b.status];
    });

    const shortages = tableRows.filter(r => r.status === 'SHORTAGE');
    const lowStock = tableRows.filter(r => r.status === 'LOW STOCK');

    container.innerHTML = `
        <div class="p-8 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-sm font-bold text-slate-800">Ingredient Quantities</h2>
                    <p class="text-[10px] text-slate-400 font-medium">After cutoff — locked quantities • Epicbase stock sync</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700">
                        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                        Epicbase Connected
                    </span>
                </div>
            </div>

            <!-- Alert Cards -->
            ${shortages.length > 0 ? `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <span class="text-[11px] font-bold text-red-700 uppercase tracking-wider">SHORTAGE ALERT — ${shortages.length} items need immediate reorder</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${shortages.map(s => `<span class="px-2 py-1 bg-red-100 border border-red-300 rounded text-[10px] font-bold text-red-800">${s.name} (need ${(s.requiredG / 1000).toFixed(1)}kg, have ${(s.stock.stock / 1000).toFixed(1)}kg)</span>`).join('')}
                </div>
            </div>` : ''}

            ${lowStock.length > 0 ? `
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">LOW STOCK WARNING — ${lowStock.length} items below reorder level</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${lowStock.map(s => `<span class="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-800">${s.name}</span>`).join('')}
                </div>
            </div>` : ''}

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items</p>
                    <p class="text-2xl font-bold text-slate-800">${tableRows.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shortages</p>
                    <p class="text-2xl font-bold ${shortages.length > 0 ? 'text-red-600' : 'text-emerald-600'}">${shortages.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock</p>
                    <p class="text-2xl font-bold ${lowStock.length > 0 ? 'text-amber-600' : 'text-emerald-600'}">${lowStock.length}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All OK</p>
                    <p class="text-2xl font-bold text-emerald-600">${tableRows.filter(r => r.status === 'OK').length}</p>
                </div>
            </div>

            <!-- Main Table -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th class="p-3 pl-5">Ingredient</th>
                                <th class="p-3 text-center">Ordered</th>
                                <th class="p-3 text-center">Buffer</th>
                                <th class="p-3 text-center">Stock</th>
                                <th class="p-3 text-center">Prep Target</th>
                                <th class="p-3 text-center">After Prod</th>
                                <th class="p-3 text-center">Status</th>
                                <th class="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows.map(row => `
                                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors ${row.status === 'SHORTAGE' ? 'bg-red-50/30' : ''}">
                                    <td class="p-3 pl-5">
                                        <p class="text-[11px] font-bold text-slate-800">${row.name}</p>
                                        <p class="text-[9px] text-slate-400">${row.stock.supplier}</p>
                                    </td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-700">${row.requiredG}</td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold text-blue-600">+5</td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold text-slate-500">${row.stock.stock}</td>
                                    <td class="p-3 text-center">
                                        <span class="text-[11px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${row.prepTarget || row.requiredG}</span>
                                    </td>
                                    <td class="p-3 text-center text-[11px] font-mono font-bold ${row.remaining < 0 ? 'text-red-600' : 'text-slate-700'}">${row.remaining}</td>
                                    <td class="p-3 text-center">
                                        <span class="px-2 py-1 text-[9px] font-bold rounded border ${row.statusBg} ${row.statusColor}">${row.status}</span>
                                    </td>
                                    <td class="p-3 text-center">
                                        <button onclick="window.logIngredientUsage('${row.name}', ${row.requiredG})" class="px-2 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                                            Log Usage
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Inventory Person Reminder Table -->
            <div class="bg-white border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-indigo-50 p-4 border-b border-indigo-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        </div>
                        <div>
                            <h3 class="text-[11px] font-bold text-indigo-800">INVENTORY MANAGER REMINDERS</h3>
                            <p class="text-[9px] text-indigo-500">Action items generated from today's production requirements</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 space-y-2" id="inventory-reminders">
                    ${generateReminders(tableRows)}
                </div>
            </div>
        </div>
    `;

    window.logIngredientUsage = (name, fullQty) => {
        kitchenUsageLog[name] = fullQty;
        Notifications.show(`${name}: Full batch usage logged (${(fullQty / 1000).toFixed(1)}kg)`);
        renderIngredientQtyView();
    };
}

function generateReminders(rows) {
    const reminders = [];

    rows.filter(r => r.status === 'SHORTAGE').forEach(r => {
        const deficit = Math.abs(r.remaining);
        reminders.push({
            priority: 'URGENT',
            color: 'red',
            message: `ORDER NOW: ${r.name} — deficit of ${(deficit / 1000).toFixed(1)}kg. Contact ${r.stock.supplier} immediately.`,
            icon: '🔴'
        });
    });

    rows.filter(r => r.status === 'LOW STOCK').forEach(r => {
        reminders.push({
            priority: 'WARNING',
            color: 'amber',
            message: `REORDER SOON: ${r.name} — stock will be ${(r.remaining / 1000).toFixed(1)}kg after today (below ${(r.stock.reorderLevel / 1000).toFixed(1)}kg reorder level). Supplier: ${r.stock.supplier}`,
            icon: '🟡'
        });
    });

    rows.filter(r => r.status === 'OK' && r.remaining < r.stock.reorderLevel * 1.5).forEach(r => {
        reminders.push({
            priority: 'PLAN',
            color: 'blue',
            message: `PLAN AHEAD: ${r.name} — will need reorder within 2 days at current consumption rate. Last delivery: ${r.stock.lastDelivery}`,
            icon: '🔵'
        });
    });

    if (reminders.length === 0) {
        return `<div class="text-center py-6 text-[10px] text-slate-400 font-medium">✅ No action items — all inventory levels healthy</div>`;
    }

    return reminders.map(r => `
        <div class="flex items-start gap-3 p-3 bg-${r.color}-50/50 border border-${r.color}-100 rounded-lg">
            <span class="text-sm flex-shrink-0 mt-0.5">${r.icon}</span>
            <div class="flex-1">
                <span class="text-[9px] font-bold text-${r.color}-700 uppercase tracking-wider">${r.priority}</span>
                <p class="text-[10px] text-${r.color}-800 font-medium mt-0.5">${r.message}</p>
            </div>
        </div>
    `).join('');
}
