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
window.showTextTip = (text) => {
    window.tooltipEl.innerHTML = `<div style="font-size:0.9em; line-height:1.4;">${text}</div>`;
    window.tooltipEl.style.display = 'block';
}

// --- OPTIMIZED TOOLTIP TRACKING ---
let mouseX = 0;
let mouseY = 0;
let ticking = false;
const ESTIMATED_TIP_WIDTH = 320; // Hardcoded to prevent layout thrashing lag

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (window.tooltipEl && window.tooltipEl.style.display === 'block') {
        // Only fire on visual frames to prevent lag
        if (!ticking) {
            window.requestAnimationFrame(() => {
                let leftPos = mouseX + 15;

                // SMART CHECK: Flip to the left if it hits the right edge of the monitor
                if (leftPos + ESTIMATED_TIP_WIDTH > window.innerWidth) {
                    leftPos = mouseX - ESTIMATED_TIP_WIDTH - 15;
                }

                window.tooltipEl.style.left = leftPos + 'px';
                window.tooltipEl.style.top = (mouseY + 15) + 'px';
                
                ticking = false;
            });
            ticking = true;
        }
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

// --- CART SYSTEM  ---
const CartSystem = {
    isOpen: false,
    showAll: false,
    searchOpen: false, 
    searchTerm: "",    
    pinnedItems: new Set(),
    equippedCounts: {}, 
    selectedShops: {},  
    masterItemList: [],

    init() {
        this.masterItemList = [...lasers, ...modules, ...gadgets].filter(i => i.name !== "None");
        
        this.masterItemList.forEach(item => {
            if (item.shops && item.shops.length > 0) {
                this.selectedShops[item.name] = 0; 
            }
        });

        // Load saved state from browser memory before generating HTML
        this.loadCartState();

        const cartHtml = `
            <button id="mc-cart-btn" onclick="CartSystem.toggle()">🛒 Loadout Cart</button>
            <div id="mc-cart-panel">
                <div class="mc-cart-header">
                    <h3>Shopping Cart</h3>
                    <button class="mc-close-btn" onclick="CartSystem.toggle()">&times;</button>
                </div>
                <div class="mc-cart-controls">
                    <div class="mc-controls-wrapper">
                        <div class="mc-show-all-wrap">
                            <label class="switch">
                                <input type="checkbox" id="mc-show-all" onchange="CartSystem.toggleShowAll()" ${this.showAll ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                            <label for="mc-show-all" style="cursor:pointer; user-select:none;">Show all unequipped</label>
                        </div>
                        <div class="mc-search-container" id="mc-search-container">
                            <input type="text" id="mc-cart-search" placeholder="Search items..." oninput="CartSystem.updateSearch(this.value)">
                            <button class="mc-search-toggle" onclick="CartSystem.toggleSearch()" title="Toggle Search">🔍</button>
                        </div>
                    </div>
                </div>
                <div class="mc-cart-list" id="mc-cart-list"></div>
                <div class="mc-cart-footer">
                    Total: <span id="mc-cart-total" style="color:var(--accent);">0</span> aUEC
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHtml);
        this.render();
    },

    saveCartState() {
        const state = {
            showAll: this.showAll,
            pinnedItems: Array.from(this.pinnedItems), // Sets can't be saved to JSON, so convert to array
            selectedShops: this.selectedShops
        };
        localStorage.setItem('minecalc_cart_state', JSON.stringify(state));
    },

    loadCartState() {
        const saved = localStorage.getItem('minecalc_cart_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.showAll = !!state.showAll;
                if (state.pinnedItems) this.pinnedItems = new Set(state.pinnedItems);
                if (state.selectedShops) this.selectedShops = { ...this.selectedShops, ...state.selectedShops };
            } catch (e) { console.warn("Could not load cart memory"); }
        }
    },

    toggle() {
        this.isOpen = !this.isOpen;
        document.getElementById('mc-cart-panel').classList.toggle('open', this.isOpen);
        if (this.isOpen) this.render();
    },

    toggleShowAll() {
        this.showAll = document.getElementById('mc-show-all').checked;
        if (this.showAll && this.searchTerm !== "") {
            this.updateSearch("");
            document.getElementById('mc-cart-search').value = "";
        }
        this.saveCartState(); // Save memory
        this.render();
    },

    toggleSearch() {
        this.searchOpen = !this.searchOpen;
        const container = document.getElementById('mc-search-container');
        container.classList.toggle('open', this.searchOpen);
        
        if (this.searchOpen) {
            document.getElementById('mc-cart-search').focus();
        } else {
            this.updateSearch("");
            document.getElementById('mc-cart-search').value = "";
        }
    },

    updateSearch(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.render();
    },

    togglePin(itemName) {
        if (this.pinnedItems.has(itemName)) this.pinnedItems.delete(itemName);
        else this.pinnedItems.add(itemName);
        this.saveCartState(); // Save memory
        this.render();
    },

    changeShop(event, itemName, shopIndex) {
        if (event) event.stopPropagation(); 
        this.selectedShops[itemName] = parseInt(shopIndex);
        this.saveCartState(); // Save memory
        this.render();
        hidePreview(); 
    },

    updateEquipped(equippedItemNamesArray) {
        this.equippedCounts = {};
        const safeEquipped = equippedItemNamesArray.map(name => name ? name.toUpperCase().trim() : "");

        this.masterItemList.forEach(item => {
            const upperMasterName = item.name.toUpperCase().trim();
            const count = safeEquipped.filter(name => name === upperMasterName).length;
            if (count > 0) this.equippedCounts[item.name] = count;
        });
        
        this.render();
    },

    render() {
        const listEl = document.getElementById('mc-cart-list');
        if (!listEl) return;

        let html = '';
        let grandTotal = 0;

        let displayItems = this.masterItemList.filter(item => {
            const isEquipped = (this.equippedCounts[item.name] || 0) > 0;
            const isPinned = this.pinnedItems.has(item.name);
            const matchesSearch = item.name.toLowerCase().includes(this.searchTerm);
            
            if (this.searchTerm !== "") return matchesSearch;
            return this.showAll || isEquipped || isPinned;
        });

        displayItems.sort((a, b) => {
            const aPin = this.pinnedItems.has(a.name) ? 1 : 0;
            const bPin = this.pinnedItems.has(b.name) ? 1 : 0;
            if (aPin !== bPin) return bPin - aPin; 
            
            const aEq = (this.equippedCounts[a.name] || 0) > 0 ? 1 : 0;
            const bEq = (this.equippedCounts[b.name] || 0) > 0 ? 1 : 0;
            if (aEq !== bEq) return bEq - aEq; 
            
            return a.name.localeCompare(b.name); 
        });

        if (displayItems.length === 0) {
            let emptyMsg = this.searchTerm !== "" 
                ? `No items found matching "${this.searchTerm}".` 
                : `Your cart is empty.<br>Equip items or click "Show all".`;
                
            listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:20px;">${emptyMsg}</div>`;
            document.getElementById('mc-cart-total').innerText = "0";
            return;
        }

        displayItems.forEach(item => {
            const qty = this.equippedCounts[item.name] || 0;
            const isPinned = this.pinnedItems.has(item.name);
            const shopIdx = this.selectedShops[item.name] || 0;
            
            let currentPrice = 0;
            let displayHtml = "Not sold in shops";
            let shopOptionsHtml = `<div class="cs-option" data-val="0">Not sold in shops</div>`;
            let isDisabled = !item.shops || item.shops.length === 0;

            if (!isDisabled) {
                currentPrice = item.shops[shopIdx] ? item.shops[shopIdx].price : 0;
                let currentLoc = item.shops[shopIdx] ? item.shops[shopIdx].location : "";
                let currentSys = item.shops[shopIdx] ? item.shops[shopIdx].system : "Unknown";
                
                let sysColor = 'var(--text-muted)';
                let sysLower = currentSys.toLowerCase();
                if (sysLower === 'pyro') sysColor = 'var(--text-pyro)';
                else if (sysLower === 'nyx') sysColor = 'var(--text-nyx)';
                else if (sysLower === 'stanton') sysColor = 'var(--text-stanton)';

                let formattedSystem = `<span style="color:${sysColor}; font-weight:bold;">[${currentSys}]</span>`;
                displayHtml = `${currentPrice.toLocaleString()} aUEC - ${formattedSystem} ${escapeHTML(currentLoc)}`;
                
                shopOptionsHtml = item.shops.map((shop, idx) => {
                    let sColor = 'var(--text-muted)';
                    let sLower = shop.system.toLowerCase();
                    if (sLower === 'pyro') sColor = 'var(--text-pyro)';
                    else if (sLower === 'nyx') sColor = 'var(--text-nyx)';
                    else if (sLower === 'stanton') sColor = 'var(--text-stanton)';
                    
                    let shopSys = `<span style="color:${sColor}; font-weight:bold;">[${shop.system}]</span>`;
                    
                    return `<div class="cs-option" style="font-size: 0.85em; text-transform: none;" data-val="${idx}" onclick="CartSystem.changeShop(event, '${item.name}', ${idx})">
                        ${shop.price.toLocaleString()} aUEC - ${shopSys} ${escapeHTML(shop.location)}
                    </div>`;
                }).join('');
            }

            grandTotal += (currentPrice * qty);
            let tipAttr = displayHtml.replace(/"/g, '&quot;'); 

            html += `
                <div class="mc-cart-item ${qty > 0 ? 'equipped' : ''} ${isPinned ? 'pinned' : ''}">
                    <div class="mc-item-header">
                        <span class="mc-item-name">${item.name}</span>
                        <div>
                            ${qty > 0 ? `<span class="mc-item-qty">x${qty}</span>` : ''}
                            <button class="mc-pin-btn ${isPinned ? 'active' : ''}" onclick="CartSystem.togglePin('${item.name}')" title="Pin to top">📌</button>
                        </div>
                    </div>
                    
                    <div class="custom-select ${isDisabled ? 'disabled' : ''}" style="border-color: #444; background: #111;" onclick="toggleCS(this)">
                        <div class="cs-display" style="font-size: 0.8em; text-transform: none; padding: 6px 10px;" onmouseenter="showTextTip(this.dataset.tip)" onmouseleave="hidePreview()" data-tip="${tipAttr}">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 15px;">${displayHtml}</span>
                        </div>
                        <div class="cs-options">${shopOptionsHtml}</div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
        document.getElementById('mc-cart-total').innerText = grandTotal.toLocaleString();
    }
};

// --- UI INITIALIZATION ---
function initUI() {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';
    
    const appContent = document.getElementById('app-content');
    if (appContent) appContent.style.display = 'block';

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

    // 1. Initialize Cart System FIRST so it can read memory
    CartSystem.init();

    // 2. Memory Restoration Logic
    let restored = false;
    const savedFleet = localStorage.getItem('minecalc_fleet_state');
    
    if (savedFleet && typeof addShip === "function") {
        try {
            const parsedFleet = JSON.parse(savedFleet);
            if (parsedFleet.ships && parsedFleet.ships.length > 0) {
                // We found a saved fleet! Rebuild it.
                parsedFleet.ships.forEach(s => addShip(s.shipType || s.type, s.operators, s.customName));
                restored = true;
            }
        } catch (e) { console.warn("Saved fleet was corrupted."); }
    }

    // 3. Fallback to default MOLE if no saved session was found
    if (!restored && typeof addShip === "function") {
        addShip('MOLE');
    }
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