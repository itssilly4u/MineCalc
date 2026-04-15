// --- UI STATE VARIABLES ---
let gadgetOptionsHtml = "";
let modOptionsHtml = "";
let laserOptionsS1 = ""; 
let laserOptionsS2 = ""; 
let laserOptionsGolem = ""; 
let globalIdCounter = 0;

// --- HELPER FUNCTIONS ---
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

// --- GLOBAL TOOLTIP ELEMENT ---
window.tooltipEl = document.createElement('div');
window.tooltipEl.className = 'item-preview-tooltip';
window.tooltipEl.style.display = 'none';
document.body.appendChild(window.tooltipEl);

document.addEventListener('mousemove', (e) => {
    if (window.tooltipEl && window.tooltipEl.style.display === 'block') {
        window.tooltipEl.style.left = (e.clientX + 15) + 'px';
        window.tooltipEl.style.top = (e.clientY + 15) + 'px';
    }
});

window.hidePreview = () => { 
    if (window.tooltipEl) window.tooltipEl.style.display = 'none'; 
};

// --- FLEET BUILDER & GADGET TOOLTIPS ---
window.showStatTip = (type) => {
    if (type === 'window') {
        window.tooltipEl.innerHTML = `<h4>Mining Limit</h4><div style="font-size:0.9em; line-height:1.4;">Regardless of how many modifiers you stack, the Optimal Charge Window is hard-capped at 50% of the total Window in-game.</div>`;
        window.tooltipEl.style.display = 'block';
    }
}

window.showPreview = (index, type) => {
    // Uses the global arrays loaded from game-data.js
    let item = type === 'laser' ? lasers[index] : (type === 'module' ? modules[index] : gadgets[index]);
    window.tooltipEl.innerHTML = `<h4>${item.name}</h4>${formatStatPreview(item, type)}`;
    window.tooltipEl.style.display = 'block';
}

function formatStatPreview(item, type) {
    if (!item || item.name === "None") return `<div style="color:var(--text-muted);">No modifiers</div>`;
    let html = '';
    const addStat = (label, val, suffix, inv = false, base = false) => {
        if (!val) return;
        let d = parseFloat(val).toFixed(1).replace('.0','');
        if (!base && val > 0) d = '+' + d;
        let c = base ? '' : ((val > 0 ? !inv : inv) ? 'style="color:var(--good-stat);"' : 'style="color:var(--bad-stat);"');
        html += `<div class="preview-stat-row"><span class="preview-label">${label}</span><span ${c}>${d}${suffix}</span></div>`;
    };
    if (type === 'laser') {
        html += `<div class="preview-stat-row"><span class="preview-label">Power</span><span>${Math.round(item.powerMin)}-${Math.round(item.powerMax)}</span></div>`;
        addStat('Module Slots', item.slots, '', false, true);
        addStat('Extraction', item.extraction, '', false, true);
    } else if (type === 'module') {
        addStat('Uses', item.uses, '', false, true);
        addStat('Power', item.power, '%');
        addStat('Extraction', item.extraction, '%');
    }
    addStat('Inert Filter', item.inert, '%', true);
    addStat('Resistance', item.resistance, '%', true);
    addStat('Instability', item.instability, '%', true);
    addStat('Opt. Window', item.optimalWin, '%');
    addStat('Opt. Charge', item.optCharge, '%');
    addStat('Overcharge', item.overcharge, '%', true);
    addStat('Shatter', item.shatter, '%', true);
    addStat('Cluster', item.cluster, '%');
    return html;
}

window.showGadgetTip = (name, inst, res, density) => {
    let rec1 = "OptiMax";
    let reason1 = "Manageable stats. Maximize your cluster bonus!";
    let rec2 = "BoreMax";
    let reason2 = "A safe backup if you want a little extra stability while keeping a cluster bonus.";

    const safeInst = parseFloat(inst) || 0;
    const safeRes = parseFloat(res) || 0;
    const safeDens = parseFloat(density) || 0;

    const isHighInstability = safeInst >= 600;
    const isHighResistance = safeRes >= 60;
    const isHighDensity = safeDens >= 1200; 

    if (isHighInstability && isHighDensity) {
        rec1 = "Waveshift";
        reason1 = "Extreme instability combined with a dense rock! Use this to safely stabilize it.";
        rec2 = "Sabir";
        reason2 = "Focuses on breaking the density/resistance.";
    } 
    else if (isHighResistance || isHighDensity) {
        rec1 = "Sabir";
        reason1 = "High resistance or density. Soften it up so your lasers can break it more easily.";
        
        if (isHighInstability) {
            rec2 = "Waveshift";
            reason2 = "Since the instability is also high, use this as a safer alternative to prevent explosions.";
        } else {
            rec2 = "OptiMax";
            reason2 = "If your laser is strong enough to ignore the resistance, go greedy for the cluster bonus!";
        }
    } 
    else if (isHighInstability && !isHighResistance && !isHighDensity) {
        rec1 = "BoreMax";
        reason1 = "Tames the high instability while still providing a solid cluster bonus.";
        rec2 = "Waveshift";
        reason2 = "Use this if you want pure stability and safety over getting a cluster bonus.";
    }

    window.tooltipEl.innerHTML = `
        <h4 style="margin-bottom: 12px;">Gadget Recommendation</h4>
        <div style="font-size:0.9em; line-height:1.4; display:flex; flex-direction:column; gap:10px;">
            <div style="background-color: rgba(0,0,0,0.2); padding: 8px; border-left: 3px solid var(--good-stat); border-radius: 4px;">
                <span style="color:var(--good-stat); font-size:0.75em; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">Primary</span><br>
                <span style="color:var(--accent); font-weight:bold; font-size:1.1em;">${rec1}</span><br>
                <span style="color:var(--text-muted); font-size:0.85em; margin-top:2px; display:block;">${reason1}</span>
            </div>
            <div style="background-color: rgba(0,0,0,0.2); padding: 8px; border-left: 3px solid var(--difficult); border-radius: 4px;">
                <span style="color:var(--difficult); font-size:0.75em; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">Alternative</span><br>
                <span style="color:var(--text-main); font-weight:bold; font-size:1em;">${rec2}</span><br>
                <span style="color:var(--text-muted); font-size:0.85em; margin-top:2px; display:block;">${reason2}</span>
            </div>
        </div>
    `;
    window.tooltipEl.style.display = 'block';
}

// --- UI INITIALIZATION ---
function initUI() {
    // 1. Hide loading screen instantly
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
    
    const appContent = document.getElementById('app-content');
    if (appContent) appContent.style.display = 'block';

    // 2. Build Dropdowns using game-data.js arrays
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

    // 3. Initialize external modules if they exist
    if (typeof addShip === "function") addShip('MOLE');
}

// --- GLOBAL EVENT LISTENERS ---
window.onclick = (e) => { 
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select').forEach(el => { 
            el.classList.remove('open'); 
            el.querySelector('.cs-options').style.display='none'; 
        }); 
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. Run the UI initialization
    initUI();
    
    // 2. Build the data tables (Only once!)
    if (typeof generateOreTable === "function") generateOreTable();
    if (typeof generateRefineryTable === "function") generateRefineryTable();
    
    // 3. Simulate clicks to open specific sections by default
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        const title = header.querySelector('h2').innerText.toLowerCase();
        
        // We open the Reader and the Analysis
        if (title.includes('rock reader') || title.includes('cracker analysis')) {
            if (!header.classList.contains('active')) {
                header.click();
            }
        }
    });

    // 4. Setup the input listener for the Rock Reader
    const sigInput = document.getElementById('signatureInput');
    if (sigInput) {
        sigInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                if (typeof findOres === "function") findOres();
            }
        });
    }
});