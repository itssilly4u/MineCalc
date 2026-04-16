const fs = require('fs');

const API_KEY = process.env.UEX_API_KEY;
if (!API_KEY) {
    console.error("❌ ERROR: No API Key found. Make sure UEX_API_KEY is set in GitHub Secrets.");
    process.exit(1);
} 
const BASE_URL = 'https://api.uexcorp.space/2.0';
const HEADERS = { 
    'Authorization': `Bearer ${API_KEY}`, 
    'Accept': 'application/json',
    'User-Agent': 'MineCalc-AutoUpdater/1.0',
    'Origin': 'https://minecalc.itssilly.xyz' 
};

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

        const commName = fixOreName(row.commodity_name);
        if (commName) {
            const code = commName.substring(0, 4).toUpperCase();
            refineryMap[refName][code] = row.value;
        }
    });
    return Object.values(refineryMap);
}

// --- COMMODITY PRICE PROCESSING LOGIC ---
function processPrices(rawPrices) {
    const priceMap = {};
    rawPrices.forEach(row => {
        const cleanName = fixOreName(row.commodity_name);
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
        priceMap[key].sort((a, b) => b.price - a.price); // Sort highest sell price first
    });

    return priceMap;
}

// --- NEW: ITEM (LASERS/MODULES/GADGETS) BUY PRICE LOGIC ---
function processItemPrices(rawPrices) {
    const priceMap = {};
    rawPrices.forEach(row => {
        if (!row.item_name) return;

        let price = row.price_buy || 0;
        if (price <= 0) return; // Skip if not for sale

        let location = row.city_name || row.space_station_name || row.outpost_name || "Unknown";
        
        // CLEANUP: Filter out redundant location/system names from the terminal string
        if (row.terminal_name) {
            let parts = row.terminal_name.split(' - ').map(p => p.trim());
            
            let shopParts = parts.filter(p => {
                // 1. Exact matches with the location or system
                if (p === location || p === row.star_system_name) return false;
                
                // 2. Lagrange point overlap (e.g. drop "MIC-L1" if location already says "MIC-L1 Shallow Frontier")
                if (location.includes(p)) return false;
                
                // 3. The GrimHEX / Green Imperial quirk
                if (p === "GrimHEX" && location.includes("Green Imperial")) return false;
                
                return true;
            });

            if (shopParts.length > 0) {
                location += ` - ${shopParts.join(' - ')}`;
            }
            
            // Optional Polish: Rename long official lore names to what players actually call them
            if (location.includes("Green Imperial Housing Exchange")) {
                location = location.replace("Green Imperial Housing Exchange", "GrimHEX");
            }
        }
        
        let system = row.star_system_name || "Unknown";

        if (!priceMap[row.item_name]) priceMap[row.item_name] = [];
        priceMap[row.item_name].push({ system, location, price });
    });

    Object.keys(priceMap).forEach(key => {
        priceMap[key].sort((a, b) => a.price - b.price); // Sort lowest buy price first
    });

    return priceMap;
}

function safeFloat(v, d = 0) { if (!v) return d; let f = parseFloat(v.toString().replace(/[% ,]/g, '')); return isNaN(f) ? d : f; }

function groupItems(attributesArray) {
    const itemsMap = {};
    attributesArray.forEach(row => {
        if (!itemsMap[row.item_name]) itemsMap[row.item_name] = { Item: row.item_name };
        if (row.value !== null && row.value !== "") itemsMap[row.item_name][row.attribute_name] = row.value;
    });
    return Object.values(itemsMap);
}

// --- UPDATED: MERGING PRICES INTO ATTRIBUTES ---
function processLasers(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    const lasers = [{ name: "None", slots: 0, powerMin: 0, powerMax: 0, extraction: 0, size: 0, shops: [] }];
    grouped.forEach(l => {
        let pm = l['Mining Laser Power'] || '', pmin = 0, pmax = 0;
        if (pm.includes('-')) { pmin = safeFloat(pm.split('-')[0]); pmax = safeFloat(pm.split('-')[1]); }
        else { pmax = safeFloat(pm); pmin = pmax * (safeFloat(l['Throttle min']) / 100); }
        lasers.push({ 
            name: `${l.Item} (S${l.Size || '0'})`, 
            slots: safeFloat(l['Module Slots']), 
            powerMin: pmin, 
            powerMax: pmax, 
            extraction: safeFloat(l['Extraction Laser Power'] || l['Extraction Throughput']), 
            inert: safeFloat(l['Inert Material Level']), 
            resistance: safeFloat(l['Resistance']), 
            instability: safeFloat(l['Laser Instability'] || l.Instability), 
            optimalWin: safeFloat(l['Optimal Charge Window Size']), 
            optCharge: safeFloat(l['Optimal Charge Window Rate']), 
            overcharge: safeFloat(l['Catastrophic Charge Rate']), 
            shatter: safeFloat(l['Shatter Damage']), 
            optRange: safeFloat(l['Optimal Range']), 
            maxRange: safeFloat(l['Maximum Range']), 
            size: safeFloat(l.Size),
            shops: priceMap[l.Item] || [] // Injecting shops here
        });
    });
    return lasers;
}

function processModules(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    const modules = [{ name: "None", power: 0, extraction: 0, uses: 0, shops: [] }];
    grouped.forEach(m => {
        let u = safeFloat(m.Uses);
        modules.push({ 
            name: `${m.Item} ${u > 0 ? '(Active)' : '(Passive)'}`, 
            power: safeFloat(m['Mining Laser Power'], 100) - 100, 
            extraction: safeFloat(m['Extraction Laser Power'], 100) - 100, 
            uses: u, 
            inert: safeFloat(m['Inert Material Level']), 
            resistance: safeFloat(m['Resistance']), 
            instability: safeFloat(m['Laser Instability']), 
            optimalWin: safeFloat(m['Optimal Charge Window Size']), 
            optCharge: safeFloat(m['Optimal Charge Rate']), 
            overcharge: safeFloat(m['Catastrophic Charge Rate']), 
            shatter: safeFloat(m['Shatter Damage']),
            shops: priceMap[m.Item] || [] // Injecting shops here
        });
    });
    return modules;
}

function processGadgets(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    const gadgets = [{ name: "None", shops: [] }];
    grouped.forEach(g => {
        gadgets.push({ 
            name: g.Item, 
            inert: safeFloat(g['Inert Material Level']), 
            resistance: safeFloat(g['Resistance']), 
            instability: safeFloat(g['Laser Instability'] || g.Instability), 
            optimalWin: safeFloat(g['Optimal Charge Window Size']), 
            optCharge: safeFloat(g['Optimal Charge Window Rate']), 
            overcharge: safeFloat(g['Catastrophic Charge Rate']), 
            shatter: safeFloat(g['Shatter Damage']), 
            cluster: safeFloat(g['Cluster Modifier']),
            shops: priceMap[g.Item] || [] // Injecting shops here
        });
    });
    return gadgets;
}

// --- MAIN SCRIPT ---
async function buildData() {
    try {
        console.log("Starting UEX Data Build...");
        
        // Fetch Attributes
        const rawGadgets = await fetchData(`/items_attributes?id_category=28`);
        const rawLasers = await fetchData(`/items_attributes?id_category=29`);
        const rawModules = await fetchData(`/items_attributes?id_category=30`);
        const rawRefinery = await fetchData('/refineries_yields');

        // NEW: Fetch Prices for Items
        console.log("Fetching Equipment Shop Prices...");
        const rawGadgetPrices = await fetchData(`/items_prices?id_category=28`);
        const rawLaserPrices = await fetchData(`/items_prices?id_category=29`);
        const rawModulePrices = await fetchData(`/items_prices?id_category=30`);
        
        // Combine and process item prices
        const allItemPrices = [...rawGadgetPrices, ...rawLaserPrices, ...rawModulePrices];
        const itemPriceMap = processItemPrices(allItemPrices);

        // Fetch Prices for Ores
        console.log("Fetching Ore Market Prices...");
        let allPriceData = [];
        for (const ore of targetOres) {
            try {
                let apiName = ore;
                if (ore === "Aluminium") apiName = "Aluminum";
                if (ore === "Ice") apiName = "Pressurized Ice"; 
                
                const priceData = await fetchData(`/commodities_prices?commodity_name=${encodeURIComponent(apiName)}`);
                if (Array.isArray(priceData)) allPriceData = allPriceData.concat(priceData);
                await new Promise(res => setTimeout(res, 200));
            } catch (err) { console.warn(`⚠️ Price fetch failed for: ${ore}`); }
        }

        // Pass the itemPriceMap down into your processing logic
        const finalLasers = processLasers(rawLasers, itemPriceMap);
        const finalModules = processModules(rawModules, itemPriceMap);
        const finalGadgets = processGadgets(rawGadgets, itemPriceMap);
        
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
    } catch (error) { 
        console.error("❌ Script Failed:", error); 
        process.exit(1);
    }
}

buildData();