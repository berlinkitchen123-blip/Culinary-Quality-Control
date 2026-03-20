import React from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell, ResponsiveContainer } from 'recharts';

const hotData = [
    { name: 'N Thai CC Chicken', m: 55.9, t: 57.3, w: 65.7, th: 57.3 },
    { name: 'O Schnitzel', m: 52.2, t: 61.3, w: 64.8, th: 60.3 },
    { name: 'P Pumpkin Curry', m: 63.6, t: 54.7, w: 73.1, th: 61.0 },
    { name: 'Q African Stew', m: 60.6, t: 55.7, w: 66.5, th: 61.0 },
    { name: 'R Butter Chicken', m: 59.7, t: 61.3, w: 72.4, th: 61.3 },
    { name: 'S Egg Paneer', m: 62.2, t: 51.7, w: 55.8, th: 59.0 },
    { name: 'T Gyoza Hot Bowl', m: 59.7, t: 56.7, w: 63.8, th: 53.0 },
    { name: 'U Lasagna Bologn.', m: 54.5, t: 54.0, w: 65.5, th: 56.3 },
    { name: 'V Chili con Carne', m: 60.6, t: 52.0, w: 76.5, th: 58.3 },
    { name: 'W Falafel Burger', m: 62.4, t: 47.3, w: 56.6, th: 47.7 },
    { name: 'X Thai CC Chickpeas', m: 56.7, t: 48.0, w: 44.3, th: 52.7 },
];

const coldData = [
    { name: 'M Doner Kebab', m: 5.0, t: 6.0, w: 6.2, th: 7.3 },
    { name: 'A Chicken Balsamic', m: 4.3, t: 5.0, w: 3.6, th: 6.7 },
    { name: 'B Tuna Deopbap', m: 4.7, t: 5.3, w: 3.5, th: 2.7 },
    { name: 'C Moroccan Barley', m: 5.7, t: 5.7, w: 4.1, th: null },
    { name: 'D Herbed Quinoa', m: 5.3, t: 2.7, w: 6.0, th: 7.0 },
    { name: 'E Pumpkin Hummus', m: 4.7, t: 5.7, w: 7.1, th: 5.3 },
    { name: 'F Feta & Eggplant', m: 6.3, t: 3.7, w: 5.2, th: 6.3 },
    { name: 'G Vegan Thai Peanut', m: 5.0, t: 4.0, w: 3.3, th: null },
    { name: 'H Garden Green', m: 6.0, t: 7.7, w: 3.5, th: 1.7 },
    { name: 'I Chicken Parmesan', m: 4.3, t: 4.7, w: 5.0, th: null },
    { name: 'J Italian Pesto', m: 6.0, t: 4.7, w: 3.5, th: 4.7 },
    { name: 'K Feta Mushroom', m: 5.3, t: 8.3, w: 4.6, th: 3.0 },
    { name: 'L Pesto Egg-Plant', m: 6.3, t: 4.7, w: 4.7, th: 3.7 },
    { name: 'Y Pesto Mozzarella', m: 4.7, t: 4.3, w: 4.8, th: 6.3 },
];

const getHotColor = (val) => {
    if (val === null || val === undefined) return '#e2e8f0';
    if (val >= 65) return '#4ade80'; // Green
    if (val >= 62) return '#fbbf24'; // Yellow
    if (val >= 53) return '#f97316'; // Orange
    return '#ef4444'; // Red
};

const getColdColor = (val) => {
    if (val === null || val === undefined) return '#e2e8f0';
    if (val <= 5) return '#4ade80'; // Green
    if (val <= 7) return '#f97316'; // Orange
    return '#ef4444'; // Red
};

const HotChart = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>🔥</span> HOT Dishes — CCP At-Dispatch Temperature (avg °C)
            </h3>
            <p className="text-sm text-slate-500 mt-1">Target ≥ 65°C at dispatch. Each bar = average of 3 probe readings. Green dashed line = 65°C target.</p>

            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-600">
                <span className="font-bold text-slate-800">Colour guide:</span>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#4ade80] rounded"></div> ≥ 65°C — Compliant ✓</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#fbbf24] rounded"></div> 62–64.9°C — Just below target</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#f97316] rounded"></div> 53–61.9°C — Below target</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#ef4444] rounded"></div> &lt; 53°C — Far below target</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-slate-200 rounded"></div> No data</div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Mon 16.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Tue 17.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Wed 18.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Thu 19.03</div>
            </div>
        </div>

        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} tickMargin={10} />
                    <YAxis domain={[30, 85]} ticks={[30, 40, 50, 60, 70, 80]} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }} />
                    <ReferenceLine y={65} stroke="#16a34a" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: '65°C target', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                    <Bar dataKey="m" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {hotData.map((entry, index) => <Cell key={"cell-hm-" + index} fill={getHotColor(entry.m)} />)}
                    </Bar>
                    <Bar dataKey="t" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {hotData.map((entry, index) => <Cell key={"cell-ht-" + index} fill={getHotColor(entry.t)} />)}
                    </Bar>
                    <Bar dataKey="w" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {hotData.map((entry, index) => <Cell key={"cell-hw-" + index} fill={getHotColor(entry.w)} />)}
                    </Bar>
                    <Bar dataKey="th" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {hotData.map((entry, index) => <Cell key={"cell-hth-" + index} fill={getHotColor(entry.th)} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const ColdChart = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>❄️</span> COLD Dishes — CCP At-Dispatch Temperature (avg °C)
            </h3>
            <p className="text-sm text-slate-500 mt-1">Target ≤ 7°C at dispatch. Each bar = average of 3 probe readings. Blue dashed line = 7°C target.</p>

            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-600">
                <span className="font-bold text-slate-800">Colour guide:</span>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#4ade80] rounded"></div> ≤ 5°C — Well within target</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#f97316] rounded"></div> 5–7°C — Near limit (PASS)</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#ef4444] rounded"></div> &gt; 7°C — Exceeds target (FAIL)</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-slate-200 rounded"></div> No data</div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Mon 16.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> Tue 17.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Wed 18.03</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Thu 19.03</div>
            </div>
        </div>

        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coldData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} tickMargin={10} />
                    <YAxis domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 } }} />
                    <ReferenceLine y={7} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: '7°C target', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }} />
                    <Bar dataKey="m" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {coldData.map((entry, index) => <Cell key={"cell-cm-" + index} fill={getColdColor(entry.m)} />)}
                    </Bar>
                    <Bar dataKey="t" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {coldData.map((entry, index) => <Cell key={"cell-ct-" + index} fill={getColdColor(entry.t)} />)}
                    </Bar>
                    <Bar dataKey="w" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {coldData.map((entry, index) => <Cell key={"cell-cw-" + index} fill={getColdColor(entry.w)} />)}
                    </Bar>
                    <Bar dataKey="th" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {coldData.map((entry, index) => <Cell key={"cell-cth-" + index} fill={getColdColor(entry.th)} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const HeatmapRow = ({ item, isHot }) => {
    const getColor = isHot ? getHotColor : getColdColor;
    const getLightColor = (val) => {
        if (val === null || val === undefined) return 'rgba(241, 245, 249, 1)';
        const hex = getColor(val);
        if (hex === '#4ade80') return 'rgba(74, 222, 128, 0.2)';
        if (hex === '#fbbf24') return 'rgba(251, 191, 36, 0.2)';
        if (hex === '#f97316') return 'rgba(249, 115, 22, 0.2)';
        return 'rgba(239, 68, 68, 0.2)';
    };

    const renderCell = (val, th = false) => {
        if (val === null) return <td className="p-3 text-center text-slate-400 font-medium">—</td>;
        const tColor = getColor(val);
        const isWarn = th && (isHot ? val < 62 : val > 7);
        return (
            <td className="p-3 text-center font-bold text-sm border-l border-white" style={{ backgroundColor: getLightColor(val), color: tColor }}>
                {val.toFixed(1)}°C {isWarn && <span className="text-yellow-500">⚠️</span>}
            </td>
        );
    };

    return (
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
            <td className="p-3 text-sm font-bold text-slate-700">{item.name}</td>
            <td className="p-3 text-xs font-bold text-center" style={{ color: isHot ? '#f97316' : '#3b82f6' }}>{isHot ? 'HOT' : 'COLD'}</td>
            {renderCell(item.m)}
            {renderCell(item.t)}
            {renderCell(item.w)}
            {renderCell(item.th, true)}
        </tr>
    );
};

const ComplianceReport = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans w-full max-w-7xl mx-auto light" style={{ colorScheme: 'light' }}>
            {/* Header */}
            <div className="bg-[#2453c0] text-white p-6 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row justify-between md:items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span>🌡️</span> Berlin Kitchen — Week 12 Temperature Compliance
                    </h1>
                    <p className="mt-2 text-blue-100 text-sm">
                        CCP At-Dispatch temperatures · Mon 16 Mar — Thu 19 Mar 2026 · Friday pending
                    </p>
                </div>
                <div className="mt-4 md:mt-0 text-right text-xs text-blue-200 leading-tight">
                    <p>Generated: 19 March 2026</p>
                    <p>Bella Bona Berlin</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border-t-4 border-purple-500 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">OVERALL COMPLIANCE</div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">54%</div>
                    <div className="text-xs text-slate-400">52 of 97 assessed</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border-t-4 border-orange-500 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">HOT DISHES</div>
                    <div className="text-3xl font-bold text-orange-500 mb-1">11%</div>
                    <div className="text-xs text-slate-400">5 of 44 · target ≥ 65°C</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border-t-4 border-blue-500 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">COLD DISHES</div>
                    <div className="text-3xl font-bold text-blue-500 mb-1">89%</div>
                    <div className="text-xs text-slate-400">47 of 53 · target ≤ 7°C</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">BEST DAY</div>
                    <div className="text-3xl font-bold text-emerald-600 mb-1">Wed</div>
                    <div className="text-xs text-slate-400">18 / 25 = 72%</div>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {[
                    { day: 'MONDAY 16.03', pct: '52%', pass: '13 / 25 pass', c: 'orange-500', width: '52%' },
                    { day: 'TUESDAY 17.03', pct: '48%', pass: '12 / 25 pass', c: 'red-500', width: '48%' },
                    { day: 'WEDNESDAY 18.03', pct: '72%', pass: '18 / 25 pass', c: 'green-500', width: '72%' },
                    { day: 'THURSDAY 19.03', pct: '41%', pass: '9 / 22 pass · 3 no data', c: 'red-500', width: '41%' },
                ].map(item => (
                    <div key={item.day} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{item.day}</div>
                        <div className={"text-2xl font-bold mb-3 text-" + item.c}>{item.pct}</div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div className={"h-full rounded-full bg-" + item.c} style={{ width: item.width }}></div>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.pass}</div>
                    </div>
                ))
                }
                <div className="bg-slate-50 p-4 rounded-xl shadow-sm border border-dashed border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">FRIDAY 20.03</div>
                    <div className="text-2xl font-bold text-slate-300 mb-3">—</div>
                    <div className="h-2 w-full bg-slate-200 rounded-full mb-2"></div>
                    <div className="text-[10px] text-slate-400">Data pending</div>
                </div>
            </div >

            {/* Charts */}
            < HotChart />
            <ColdChart />

            {/* Heatmap */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span>📋</span> Dish-Level Compliance Heatmap — Mon to Thu
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Average CCP temperature at dispatch per dish per day. Cell colour = proximity to compliance target. Same colour scale as charts above.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                <th className="p-3 w-1/3">Dish</th>
                                <th className="p-3 text-center">Type</th>
                                <th className="p-3 text-center">Mon 16.03</th>
                                <th className="p-3 text-center">Tue 17.03</th>
                                <th className="p-3 text-center">Wed 18.03</th>
                                <th className="p-3 text-center">Thu 19.03</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hotData.map((d, i) => <HeatmapRow key={'h' + i} item={d} isHot={true} />)}
                            {coldData.map((d, i) => <HeatmapRow key={'c' + i} item={d} isHot={false} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

// Mount to DOM
const rootEl = document.getElementById('react-compliance-root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(<ComplianceReport />);
}
