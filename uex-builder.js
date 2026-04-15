const fs = require('fs');

const API_KEY = process.env.UEX_API_KEY;
if (!API_KEY) {
    console.error("❌ ERROR: No API Key found. Make sure UEX_API_KEY is set in GitHub Secrets.");
    process.exit(1);
} 
const BASE_URL = 'https://api.uexcorp.space/2.0';
const HEADERS = { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' };

const targetOres = [
    "Quantainium", "Stileron", "Savrilium", "Riccite", "Ouratite", "Lindinium", 
    "Taranite", "Gold", "Borase", "Beryl", "Bexalite", "Tungsten", "Torite", 
    "Titanium", "Laranite", "Aslarite", "Agricium", "Aluminium", "Copper", 
    "Corundum", "Hephaestanite", "Ice", "Iron", "Quartz", "Silicon", "Tin"
];

// Helper to fix UEX naming quirks at the source
function fixOreName(name) {
    if (!name) return "";
    let n = name.replace(/\(.*\)/g, '').trim(); // Remove (Raw), (Ore), etc.
    if (n === "Aluminum") return "Aluminium";
    if (n === "Raw" || n === "Raw Ice" || n === "Pressurized Ice") return "Ice";
    return n;
}

// Fetch helper
async function fetchData(endpoint) {
    console.log(`Fetching: ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: HEADERS });
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status} on ${endpoint}`);
    const result = await response.json();
    return result.data || result; 
}

// --- REFINERY PIVOT LOGIC ---
function processRefinery(rawRefinery) {
    const refineryMap = {};
    rawRefinery.forEach(row => {
        let refName = row.city_name || row.space_station_name || "Unknown";
        if (refName.includes(" Station")) refName = refName.replace(" Station", "");
        if (refName.includes("-L")) refName = refName.split(" ")[0]; 

        if (!refineryMap[refName]) {
            refineryMap[refName] = {
                Refinery: refName,
                "": row.star_system_name ? row.star_system_name.substring(0, 2).toUpperCase() : ""
            };
        }

        const commName = fixOreName(row.commodity_name); // Standardize name here
        if (commName) {
            const code = commName.substring(0, 4).toUpperCase();
            refineryMap[refName][code] = row.value;
        }
    });
    return Object.values(refineryMap);
}

// --- PRICE PROCESSING LOGIC ---
function processPrices(rawPrices) {
    const priceMap = {};
    rawPrices.forEach(row => {
        const cleanName = fixOreName(row.commodity_name); // Standardize name here
        if (!cleanName) return;

        let price = row.price_sell || 0;
        let location = row.city_name || row.space_station_name || row.outpost_name || row.poi_name || "Unknown";
        
        if (row.terminal_name) {
            if (row.terminal_name.includes("Trade and Development Division") || row.terminal_name.includes("TDD")) location += " - TDD";
            else if (row.terminal_name.includes("Admin")) location += " - Admin";
            else if (row.terminal_name.includes("Central Business District") || row.terminal_name.includes("CBD")) location += " - CBD";
        }
        let system = row.star_system_name || "Unknown";

        if (price > 0) {
            if (!priceMap[cleanName]) priceMap[cleanName] = [];
            priceMap[cleanName].push({ system, location, price });
        }
    });

    Object.keys(priceMap).forEach(key => {
        priceMap[key].sort((a, b) => b.price - a.price);
    });

    return priceMap;
}

// (Lasers, Modules, Gadgets processing functions stay exactly as they were...)
function safeFloat(v, d = 0) { if (!v) return d; let f = parseFloat(v.toString().replace(/[% ,]/g, '')); return isNaN(f) ? d : f; }
function groupItems(attributesArray) {
    const itemsMap = {};
    attributesArray.forEach(row => {
        if (!itemsMap[row.item_name]) itemsMap[row.item_name] = { Item: row.item_name };
        if (row.value !== null && row.value !== "") itemsMap[row.item_name][row.attribute_name] = row.value;
    });
    return Object.values(itemsMap);
}
function processLasers(rawAttributes) {
    const grouped = groupItems(rawAttributes);
    const lasers = [{ name: "None", slots: 0, powerMin: 0, powerMax: 0, extraction: 0, size: 0 }];
    grouped.forEach(l => {
        let pm = l['Mining Laser Power'] || '', pmin = 0, pmax = 0;
        if (pm.includes('-')) { pmin = safeFloat(pm.split('-')[0]); pmax = safeFloat(pm.split('-')[1]); }
        else { pmax = safeFloat(pm); pmin = pmax * (safeFloat(l['Throttle min']) / 100); }
        lasers.push({ name: `${l.Item} (S${l.Size || '0'})`, slots: safeFloat(l['Module Slots']), powerMin: pmin, powerMax: pmax, extraction: safeFloat(l['Extraction Laser Power'] || l['Extraction Throughput']), inert: safeFloat(l['Inert Material Level']), resistance: safeFloat(l['Resistance']), instability: safeFloat(l['Laser Instability'] || l.Instability), optimalWin: safeFloat(l['Optimal Charge Window Size']), optCharge: safeFloat(l['Optimal Charge Window Rate']), overcharge: safeFloat(l['Catastrophic Charge Rate']), shatter: safeFloat(l['Shatter Damage']), optRange: safeFloat(l['Optimal Range']), maxRange: safeFloat(l['Maximum Range']), size: safeFloat(l.Size) });
    });
    return lasers;
}
function processModules(rawAttributes) {
    const grouped = groupItems(rawAttributes);
    const modules = [{ name: "None", power: 0, extraction: 0, uses: 0 }];
    grouped.forEach(m => {
        let u = safeFloat(m.Uses);
        modules.push({ name: `${m.Item} ${u > 0 ? '(Active)' : '(Passive)'}`, power: safeFloat(m['Mining Laser Power'], 100) - 100, extraction: safeFloat(m['Extraction Laser Power'], 100) - 100, uses: u, inert: safeFloat(m['Inert Material Level']), resistance: safeFloat(m['Resistance']), instability: safeFloat(m['Laser Instability']), optimalWin: safeFloat(m['Optimal Charge Window Size']), optCharge: safeFloat(m['Optimal Charge Rate']), overcharge: safeFloat(m['Catastrophic Charge Rate']), shatter: safeFloat(m['Shatter Damage']) });
    });
    return modules;
}
function processGadgets(rawAttributes) {
    const grouped = groupItems(rawAttributes);
    const gadgets = [{ name: "None" }];
    grouped.forEach(g => {
        gadgets.push({ name: g.Item, inert: safeFloat(g['Inert Material Level']), resistance: safeFloat(g['Resistance']), instability: safeFloat(g['Laser Instability'] || g.Instability), optimalWin: safeFloat(g['Optimal Charge Window Size']), optCharge: safeFloat(g['Optimal Charge Window Rate']), overcharge: safeFloat(g['Catastrophic Charge Rate']), shatter: safeFloat(g['Shatter Damage']), cluster: safeFloat(g['Cluster Modifier']) });
    });
    return gadgets;
}

// --- MAIN SCRIPT ---
async function buildData() {
    try {
        console.log("Starting UEX Data Build...");
        const rawGadgets = await fetchData(`/items_attributes?id_category=28`);
        const rawLasers = await fetchData(`/items_attributes?id_category=29`);
        const rawModules = await fetchData(`/items_attributes?id_category=30`);
        const rawRefinery = await fetchData('/refineries_yields');

        console.log("Fetching Market Prices...");
        let allPriceData = [];
        for (const ore of targetOres) {
            try {
                // We fetch using mapped names for the API
                let apiName = ore;
                if (ore === "Aluminium") apiName = "Aluminum";
                if (ore === "Ice") apiName = "Pressurized Ice"; 
                
                const priceData = await fetchData(`/commodities_prices?commodity_name=${encodeURIComponent(apiName)}`);
                if (Array.isArray(priceData)) allPriceData = allPriceData.concat(priceData);
                await new Promise(res => setTimeout(res, 200));
            } catch (err) { console.warn(`⚠️ Price fetch failed for: ${ore}`); }
        }

        const finalLasers = processLasers(rawLasers);
        const finalModules = processModules(rawModules);
        const finalGadgets = processGadgets(rawGadgets);
        const finalRefinery = processRefinery(rawRefinery);
        const finalPrices = processPrices(allPriceData);

        const fileContent = `
// AUTO-GENERATED UEX DATA
const lasers = ${JSON.stringify(finalLasers, null, 2)};
const modules = ${JSON.stringify(finalModules, null, 2)};
const gadgets = ${JSON.stringify(finalGadgets, null, 2)};
const refineryData = ${JSON.stringify(finalRefinery, null, 2)};
const pricingData = ${JSON.stringify(finalPrices, null, 2)};
        `;

        fs.writeFileSync('./game-data.js', fileContent.trim());
        console.log("✅ Successfully saved all data to 'game-data.js'!");
    } catch (error) { console.error("❌ Script Failed:", error); 
        process.exit(1);
    }
}

buildData();