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
    "Quantanium", "Stileron", "Savrilium", "Riccite", "Ouratite", "Lindinium", 
    "Taranite", "Gold", "Borase", "Beryl", "Bexalite", "Tungsten", "Torite", 
    "Titanium", "Laranite", "Aslarite", "Agricium", "Aluminium", "Copper", 
    "Corundum", "Hephaestanite", "Ice", "Iron", "Quartz", "Silicon", "Tin"
];

// --- SECURITY: Input Validation ---
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    const hasHtmlTags = /<\/?\s*[a-z][^>]*>/gi.test(str);
    const hasEventHandlers = /on\w+\s*=/gi.test(str);
    const hasJavascript = /javascript:/gi.test(str);

    if (hasHtmlTags || hasEventHandlers || hasJavascript) {
        console.error("\n🚨 SECURITY ALERT: Potential code injection detected in UEX API data!");
        console.error(`Blocked string: "${str}"`);
        console.error("Aborting build to protect the live website.\n");
        process.exit(1);
    }
    return str.trim();
}

function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}

function fixOreName(name) {
    if (!name) return "";
    let n = name.replace(/\(.*\)/g, '').trim(); 
    if (n === "Aluminum") return "Aluminium";
    if (n === "Raw" || n === "Raw Ice" || n === "Pressurized Ice") return "Ice";
    if (n === "Quantainium") return "Quantanium"; 
    return n;
}

async function fetchData(endpoint) {
    console.log(`Fetching: ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: HEADERS });
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status} on ${endpoint}`);
    const result = await response.json();
    return result.data || result; 
}

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

// --- SHARED LOCATION REGISTRY (ores + equipment) --------------------------------
// Both price processors register every location they encounter here. After both
// have run, finalizeLocations() sorts them alphabetically (system, then location)
// and assigns each a stable index (locIdx = array position). Using one shared,
// alphabetically-ordered registry is what keeps the generated `locations` array
// byte-stable across builds — when only a price changes, the array itself does
// not reshuffle, so GitHub diffs stop showing location strings jumping around.
const locationRegistry = new Map(); // key -> { system, location }
const locKey = (system, location) => `${system}\u0001${location}`;

function registerLocation(system, location) {
    const key = locKey(system, location);
    if (!locationRegistry.has(key)) locationRegistry.set(key, { system, location });
    return key;
}

function finalizeLocations() {
    const arr = Array.from(locationRegistry.values());
    arr.sort((a, b) => {
        const s = a.system.localeCompare(b.system, 'en', { sensitivity: 'base' });
        if (s !== 0) return s;
        return a.location.localeCompare(b.location, 'en', { sensitivity: 'base' });
    });
    const keyToIdx = new Map();
    arr.forEach((loc, i) => {
        loc.locIdx = i; // keep the inline field consistent with the array index
        keyToIdx.set(locKey(loc.system, loc.location), i);
    });
    return { locations: arr, keyToIdx };
}

function processPrices(rawPrices) {
    const priceMap = {};
    rawPrices.forEach(row => {
        const cleanName = fixOreName(row.commodity_name);
        if (!cleanName) return;

        let price = row.price_sell || 0;
        if (price <= 0) return;

        let location = row.city_name || row.space_station_name || row.outpost_name || row.poi_name || "Unknown";

        if (row.terminal_name) {
            if (row.terminal_name.includes("Trade and Development Division") || row.terminal_name.includes("TDD")) location += " - TDD";
            else if (row.terminal_name.includes("Admin")) location += " - Admin";
            else if (row.terminal_name.includes("Central Business District") || row.terminal_name.includes("CBD")) location += " - CBD";
        }
        let system = row.star_system_name || "Unknown";

        const key = registerLocation(system, location);
        if (!priceMap[cleanName]) priceMap[cleanName] = [];
        priceMap[cleanName].push({ locKey: key, price });
    });

    return priceMap;
}

function processItemPrices(rawPrices) {
    const priceMap = {};
    rawPrices.forEach(row => {
        if (!row.item_name) return;

        let price = row.price_buy || 0;
        if (price <= 0) return;

        let location = row.city_name || row.space_station_name || row.outpost_name || "Unknown";

        if (row.terminal_name) {
            let parts = row.terminal_name.split(' - ').map(p => p.trim());
            let shopParts = parts.filter(p => {
                if (p === location || p === row.star_system_name) return false;
                if (location.includes(p)) return false;
                if (p === "GrimHEX" && location.includes("Green Imperial")) return false;
                return true;
            });
            if (shopParts.length > 0) {
                location += ` - ${shopParts.join(' - ')}`;
            }
            if (location.includes("Green Imperial Housing Exchange")) {
                location = location.replace("Green Imperial Housing Exchange", "GrimHEX");
            }
        }

        let system = row.star_system_name || "Unknown";
        const key = registerLocation(system, location);

        if (!priceMap[row.item_name]) priceMap[row.item_name] = [];
        priceMap[row.item_name].push({ locKey: key, price: price });
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

function processLasers(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    grouped.sort((a, b) => a.Item.localeCompare(b.Item));
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
            shops: priceMap[l.Item] || [] 
        });
    });
    return lasers;
}

function processModules(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    grouped.sort((a, b) => a.Item.localeCompare(b.Item));
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
            optCharge: safeFloat(m['Optimal Charge Window Rate']), 
            overcharge: safeFloat(m['Catastrophic Charge Rate']), 
            shatter: safeFloat(m['Shatter Damage']),
            shops: priceMap[m.Item] || [] 
        });
    });
    return modules;
}

function processGadgets(rawAttributes, priceMap) {
    const grouped = groupItems(rawAttributes);
    grouped.sort((a, b) => a.Item.localeCompare(b.Item));
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
            shops: priceMap[g.Item] || [] 
        });
    });
    return gadgets;
}

async function buildData() {
    try {
        console.log("Starting UEX Data Build...");
        const rawGadgets = await fetchData(`/items_attributes?id_category=28`);
        const rawLasers = await fetchData(`/items_attributes?id_category=29`);
        const rawModules = await fetchData(`/items_attributes?id_category=30`);
        const rawRefinery = await fetchData('/refineries_yields');

        console.log("Fetching Equipment Shop Prices...");
        const rawGadgetPrices = await fetchData(`/items_prices?id_category=28`);
        const rawLaserPrices = await fetchData(`/items_prices?id_category=29`);
        const rawModulePrices = await fetchData(`/items_prices?id_category=30`);
        
        const allItemPrices = [...rawGadgetPrices, ...rawLaserPrices, ...rawModulePrices];
        const priceMap = processItemPrices(allItemPrices);
        const finalRefinery = processRefinery(rawRefinery);

        // Fetch Ore Prices
        let allPriceData = [];
        for (const ore of targetOres) {
            try {
                let apiName = ore;
                if (ore === "Aluminium") apiName = "Aluminum";
                if (ore === "Ice") apiName = "Pressurized Ice"; 
                if (ore === "Quantanium") apiName = "Quantainium";
                const priceData = await fetchData(`/commodities_prices?commodity_name=${encodeURIComponent(apiName)}`);
                if (Array.isArray(priceData)) allPriceData = allPriceData.concat(priceData);
                await new Promise(res => setTimeout(res, 200));
            } catch (err) { console.warn(`⚠️ Price fetch failed for: ${ore}`); }
        }
        const finalPrices = processPrices(allPriceData);

        // Both processors have now registered every location. Finalize the shared
        // registry (alphabetical: system, then location) and resolve each price
        // list to its stable locIdx. Both ores and equipment are sorted by locIdx
        // (alphabetical) so that a price-only change keeps the list order byte-
        // identical and GitHub diffs stay clean.
        const { locations: finalLocations, keyToIdx } = finalizeLocations();
        for (const item of Object.keys(priceMap)) {
            priceMap[item] = priceMap[item]
                .map(x => ({ locIdx: keyToIdx.get(x.locKey), price: x.price }))
                .sort((a, b) => a.locIdx - b.locIdx);
        }
        for (const ore of Object.keys(finalPrices)) {
            finalPrices[ore] = finalPrices[ore]
                .map(x => ({ locIdx: keyToIdx.get(x.locKey), price: x.price }))
                .sort((a, b) => a.locIdx - b.locIdx);
        }

        // Resolve the equipment price map first so these capture the final locIdx
        // values when they copy `shops`.
        const finalLasers = processLasers(rawLasers, priceMap);
        const finalModules = processModules(rawModules, priceMap);
        const finalGadgets = processGadgets(rawGadgets, priceMap);

        const sanitizedLasers = sanitizeObject(finalLasers);
        const sanitizedModules = sanitizeObject(finalModules);
        const sanitizedGadgets = sanitizeObject(finalGadgets);
        const sanitizedRefinery = sanitizeObject(finalRefinery);
        const sanitizedPrices = sanitizeObject(finalPrices);

        const fileContent = `
// AUTO-GENERATED UEX DATA
const locations = ${JSON.stringify(sanitizeObject(finalLocations), null, 2)};
const lasers = ${JSON.stringify(sanitizedLasers, null, 2)};
const modules = ${JSON.stringify(sanitizedModules, null, 2)};
const gadgets = ${JSON.stringify(sanitizedGadgets, null, 2)};
const refineryData = ${JSON.stringify(sanitizedRefinery, null, 2)};
const pricingData = ${JSON.stringify(sanitizedPrices, null, 2)};
        `;

        fs.writeFileSync('./game-data.js', fileContent.trim());
        console.log("✅ Successfully saved all data to 'game-data.js'!");
    } catch (error) { 
        console.error("❌ Script Failed:", error); 
        process.exit(1);
    }
}

buildData();
