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

// --- GLOBAL EVENT LISTENERS & INITIALIZATION ---
window.onclick = (e) => { 
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select').forEach(el => { 
            el.classList.remove('open'); 
            el.querySelector('.cs-options').style.display='none'; 
        }); 
    }
};

window.onload = loadData;

document.addEventListener('DOMContentLoaded', function() {
    generateOreTable();
    
    const sigInput = document.getElementById('signatureInput');
    if (sigInput) {
        sigInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                findOres();
            }
        });
    }
});