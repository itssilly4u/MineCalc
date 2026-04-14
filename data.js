// --- GLOBALS & DATA VARIABLES ---
let lasers = [], modules = [], gadgets = [], refineryData = [];
let gadgetOptionsHtml = "";
let modOptionsHtml = "";
let laserOptionsS1 = ""; 
let laserOptionsS2 = ""; 
let laserOptionsGolem = ""; 
let globalIdCounter = 0;

// --- HELPER FUNCTIONS ---
function safeFloat(v, d=0) { if (!v) return d; let f = parseFloat(v.toString().replace(/[% ,]/g, '')); return isNaN(f) ? d : f; }
function escapeHTML(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return Math.abs(hash).toString(16); 
}
function generateId() { 
    globalIdCounter++;
    return 'uid_' + globalIdCounter + '_' + Math.random().toString(36).substr(2, 5); 
}

// --- DATA INITIALIZATION ---
async function loadData() {
    try {
        const [lR, mR, gR, refR] = await Promise.all([
            fetch('UEX - mining-laser-heads.json'), 
            fetch('UEX - mining-modules.json'), 
            fetch('UEX - gadgets.json'),
            fetch('UEX - refinery-yields.json')
        ]);
        const rL = await lR.json(), rM = await mR.json(), rG = await gR.json(), rRef = await refR.json();

        refineryData = rRef;

        lasers.push({ name: "None", slots: 0, powerMin: 0, powerMax: 0, extraction: 0 });
        rL.forEach(l => {
            let pm = l['Mining Laser Power'] || '', pmin = 0, pmax = 0;
            if (pm.includes('-')) { pmin = safeFloat(pm.split('-')[0]); pmax = safeFloat(pm.split('-')[1]); }
            else { pmax = safeFloat(pm); pmin = pmax * (safeFloat(l['Throttle min'])/100); }
            lasers.push({
                name: `${l.Item} (S${l.Size})`, slots: safeFloat(l['Module Slots']), powerMin: pmin, powerMax: pmax, extraction: safeFloat(l['Extraction Laser Power'] || l['Extraction Throughput']),
                inert: safeFloat(l['Inert Material Level']), resistance: safeFloat(l['Resistance']), instability: safeFloat(l['Laser Instability'] || l.Instability), 
                optimalWin: safeFloat(l['Optimal Charge Window Size']), optCharge: safeFloat(l['Optimal Charge Window Rate']), overcharge: safeFloat(l['Catastrophic Charge Rate']), 
                shatter: safeFloat(l['Shatter Damage']), optRange: safeFloat(l['Optimal Range']), maxRange: safeFloat(l['Maximum Range']), size: safeFloat(l.Size)
            });
        });

        modules.push({ name: "None", power: 0, extraction: 0, uses: 0 });
        rM.forEach(m => {
            let u = safeFloat(m.Uses);
            modules.push({
                name: `${m.Item} ${u > 0 ? '(Active)' : '(Passive)'}`, power: safeFloat(m['Mining Laser Power'], 100)-100, extraction: safeFloat(m['Extraction Laser Power'], 100)-100, 
                uses: u, inert: safeFloat(m['Inert Material Level']), resistance: safeFloat(m['Resistance']), instability: safeFloat(m['Laser Instability']), 
                optimalWin: safeFloat(m['Optimal Charge Window Size']), optCharge: safeFloat(m['Optimal Charge Rate']), overcharge: safeFloat(m['Catastrophic Charge Rate']), shatter: safeFloat(m['Shatter Damage'])
            });
        });

        gadgets.push({ name: "None" });
        rG.forEach(g => {
            gadgets.push({
                name: g.Item, inert: safeFloat(g['Inert Material Level']), resistance: safeFloat(g['Resistance']), instability: safeFloat(g['Laser Instability'] || g.Instability), 
                optimalWin: safeFloat(g['Optimal Charge Window Size']), optCharge: safeFloat(g['Optimal Charge Window Rate']), overcharge: safeFloat(g['Catastrophic Charge Rate']), 
                shatter: safeFloat(g['Shatter Damage']), cluster: safeFloat(g['Cluster Modifier'])
            });
        });

        document.getElementById('loading').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        initUI();
    } catch (e) { console.error(e); }
}

function initUI() {
    laserOptionsS1 = `<div class="cs-option" data-val="0" onclick="selectCSOption(event, this, 'laser')">None</div>`;
    laserOptionsS2 = `<div class="cs-option" data-val="0" onclick="selectCSOption(event, this, 'laser')">None</div>`;
    laserOptionsGolem = `<div class="cs-option" data-val="0" onclick="selectCSOption(event, this, 'laser')">None</div>`;
    
    let f2 = lasers.map((l, i) => ({l, i})).filter(o => o.l.size === 2 && o.l.name !== "None");
    if(f2.length) laserOptionsS2 += `<div class="cs-optgroup">Size 2 Lasers</div>` + f2.map(o => `<div class="cs-option" data-val="${o.i}" onmouseenter="showPreview(${o.i}, 'laser')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'laser')">${o.l.name}</div>`).join('');

    let f1 = lasers.map((l, i) => ({l, i})).filter(o => o.l.size === 1 && o.l.name !== "None" && !o.l.name.toLowerCase().includes("pitman"));
    if(f1.length) laserOptionsS1 += `<div class="cs-optgroup">Size 1 Lasers</div>` + f1.map(o => `<div class="cs-option" data-val="${o.i}" onmouseenter="showPreview(${o.i}, 'laser')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'laser')">${o.l.name}</div>`).join('');

    let fGolem = lasers.map((l, i) => ({l, i})).filter(o => o.l.name.toLowerCase().includes("pitman"));
    if(fGolem.length) laserOptionsGolem += `<div class="cs-optgroup">Drake Golem</div>` + fGolem.map(o => `<div class="cs-option" data-val="${o.i}" onmouseenter="showPreview(${o.i}, 'laser')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'laser')">${o.l.name}</div>`).join('');

    modOptionsHtml = `<div class="cs-option" data-val="0" onclick="selectCSOption(event, this, 'module')">None</div>`;
    let actives = modules.map((m, i) => ({m, i})).filter(o => o.m.uses > 0);
    let passives = modules.map((m, i) => ({m, i})).filter(o => o.m.uses === 0 && o.m.name !== "None");
    if (actives.length) { modOptionsHtml += `<div class="cs-optgroup">Active Modules</div>`; actives.forEach(o => modOptionsHtml += `<div class="cs-option" data-val="${o.i}" onmouseenter="showPreview(${o.i}, 'module')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'module')">${o.m.name}</div>`); }
    if (passives.length) { modOptionsHtml += `<div class="cs-optgroup">Passive Modules</div>`; passives.forEach(o => modOptionsHtml += `<div class="cs-option" data-val="${o.i}" onmouseenter="showPreview(${o.i}, 'module')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'module')">${o.m.name}</div>`); }

    gadgetOptionsHtml = gadgets.map((g, i) => `<div class="cs-option" data-val="${i}" onmouseenter="showPreview(${i}, 'gadget')" onmouseleave="hidePreview()" onclick="selectCSOption(event, this, 'gadget')">${g.name}</div>`).join('');

    addShip('MOLE');
    generateRefineryTable();
}
