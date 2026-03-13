
export const PREP_STAGES = [
    { id: 'cooking', label: 'After Cooking', short: 'Cooking', icon: '🔥' },
    { id: 'pre_assembly', label: 'Before Assembly', short: 'Pre-Asm', icon: '⏳' },
    { id: 'post_assembly', label: 'After Assembly', short: 'Post-Asm', icon: '📦' }
];

export const HYGIENE_TASKS = [
    { id: 'personal_hygiene', name: 'Personal Hygiene', icon: '🧼', areas: ['Hand Washing', 'Clean Uniforms', 'Health Check'] },
    { id: 'morning_shift', name: 'Morning Shift', icon: '☀️', areas: ['Surfaces', 'Sinks', 'Equipment'] },
    { id: 'evening_shift', name: 'Evening Shift', icon: '🌙', areas: ['Floors', 'Waste Bins', 'Deep Clean'] },
    { id: 'pest_control', name: 'Pest Control', icon: '🐜', areas: ['Trap Check', 'Entry Points', 'Sanitation'] },
    { id: 'weekly_deep', name: 'Weekly Deep Clean', icon: '🧹', areas: ['Ventilation', 'Cold Storage', 'Shelving'] }
];

export let state = {
    menu: null,
    checkedData: {},
    prepData: {},
    hygieneData: {},
    productionOrders: [],
    selectedDate: new Date().toISOString().split('T')[0],
    selectedDish: null,
    selectedPrepItem: null,
    selectedHygieneItem: null,
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

// Global Chart Instance Tracker
window.auditCharts = [];
