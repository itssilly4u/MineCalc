// --- HELPER FUNCTIONS ---
// We need this on the frontend to safely parse user input from the HTML boxes
function safeFloat(v, d=0) { 
    if (!v) return d; 
    let f = parseFloat(v.toString().replace(/[% ,]/g, '')); 
    return isNaN(f) ? d : f; 
}

function calcMulti(arr) { 
    if (!arr.length) return 0; 
    let p = 1; 
    arr.forEach(v => p *= (1 + (v/100))); 
    return (p - 1) * 100; 
}

function updateStat(id, val, inv, suf='%') {
    let el = document.getElementById(id); 
    if (!el) return;
    let d = val.toFixed(1).replace('.0', '');
    el.innerText = (val === 0 ? '0' : (val > 0 ? '+' + d : d)) + suf;
    el.style.color = val === 0 ? 'var(--text-main)' : ((val > 0 ? !inv : inv) ? 'var(--good-stat)' : 'var(--bad-stat)');
}

// --- MAIN CALCULATOR ---
function calculate() {
    let tMax = 0, tMin = 0;
    let fleetRes = [], fleetInst = []; 
    let gadgetRes = [], gadgetInst = []; 
    let win = [], chg = [], over = [], shat = [], clust = [];

    // 1. Process Ships & Lasers
    document.querySelectorAll('.setup-card').forEach(card => {
        let opId = card.dataset.opid;
        
        // If operator is toggled off, reset local stats and skip
        if (card.classList.contains('off')) {
            let extEl = document.getElementById(`op-ext-${opId}`);
            let inertEl = document.getElementById(`op-inert-${opId}`);
            if (extEl) extEl.innerText = '0.0';
            if (inertEl) inertEl.innerText = '0%';
            return;
        }

        let laserEl = document.getElementById(`cs-laser-${opId}`);
        if (!laserEl) return;
        
        let l = lasers[laserEl.dataset.value];
        if (!l || l.name === "None") return;

        let pMod = 0, eMod = 0, opInert = [l.inert || 0];
        let seatWin = 0, seatChg = 0, seatOver = 0, seatShat = 0, seatClust = 0;

        // Process Modules for this seat
        [1,2,3].forEach(m => {
            let modEl = document.getElementById(`cs-mod${m}-${opId}`);
            if (!modEl) return;
            
            let mod = modules[modEl.dataset.value];
            if (!mod || mod.name === "None") return;
            
            pMod += mod.power || 0; 
            eMod += mod.extraction || 0; 
            opInert.push(mod.inert || 0);
            
            if (mod.resistance) fleetRes.push(mod.resistance); 
            if (mod.instability) fleetInst.push(mod.instability);
            
            if (mod.optimalWin) seatWin += mod.optimalWin; 
            if (mod.optCharge) seatChg += mod.optCharge;
            if (mod.overcharge) seatOver += mod.overcharge; 
            if (mod.shatter) seatShat += mod.shatter;
            if (mod.cluster) seatClust += mod.cluster;
        });

        // Add to Fleet Totals
        tMax += (l.powerMax || 0) * (1 + pMod/100); 
        tMin += (l.powerMin || 0) * (1 + pMod/100);
        
        if (l.resistance) fleetRes.push(l.resistance); 
        if (l.instability) fleetInst.push(l.instability);

        let finalSeatWin = ((1 + (l.optimalWin || 0)/100) * (1 + seatWin/100)) - 1;
        if (finalSeatWin !== 0) win.push(finalSeatWin * 100);
        
        let finalSeatChg = ((1 + (l.optCharge || 0)/100) * (1 + seatChg/100)) - 1;
        if (finalSeatChg !== 0) chg.push(finalSeatChg * 100);
        
        let finalSeatOver = ((1 + (l.overcharge || 0)/100) * (1 + seatOver/100)) - 1;
        if (finalSeatOver !== 0) over.push(finalSeatOver * 100);
        
        let finalSeatShat = ((1 + (l.shatter || 0)/100) * (1 + seatShat/100)) - 1;
        if (finalSeatShat !== 0) shat.push(finalSeatShat * 100);

        let finalSeatClust = ((1 + (l.cluster || 0)/100) * (1 + seatClust/100)) - 1;
        if (finalSeatClust !== 0) clust.push(finalSeatClust * 100);

        // Update Local HTML Stats
        const extDisplay = document.getElementById(`op-ext-${opId}`);
        if (extDisplay) extDisplay.innerText = ((l.extraction || 0) * (1 + eMod/100)).toFixed(1);
        
        updateStat(`op-inert-${opId}`, calcMulti(opInert), true);
        
        const optRangeDisplay = document.getElementById(`op-optrange-${opId}`);
        if (optRangeDisplay) optRangeDisplay.innerText = (l.optRange || 0) + 'm';
        
        const maxRangeDisplay = document.getElementById(`op-maxrange-${opId}`);
        if (maxRangeDisplay) maxRangeDisplay.innerText = (l.maxRange || 0) + 'm';
    });

    // 2. Process Gadgets
    document.querySelectorAll('.gadget-select').forEach(el => {
        let g = gadgets[el.dataset.value];
        if (g && g.name !== "None") {
            if (g.resistance) gadgetRes.push(g.resistance); 
            if (g.instability) gadgetInst.push(g.instability);
            if (g.optimalWin) win.push(g.optimalWin); 
            if (g.optCharge) chg.push(g.optCharge);
            if (g.overcharge) over.push(g.overcharge); 
            if (g.shatter) shat.push(g.shatter);
            if (g.cluster) clust.push(g.cluster);
        }
    });

    // 3. Output Fleet Modifiers
    const totalResMod = calcMulti([...fleetRes, ...gadgetRes]);
    const totalInstMod = calcMulti([...fleetInst, ...gadgetInst]);

    const maxPowerDisplay = document.getElementById('res-max-power');
    if (maxPowerDisplay) maxPowerDisplay.innerText = Math.round(tMax).toLocaleString();
    
    const minPowerDisplay = document.getElementById('res-min-power');
    if (minPowerDisplay) minPowerDisplay.innerText = Math.round(tMin).toLocaleString();
    
    updateStat('res-resistance', totalResMod, true);
    updateStat('res-instability', totalInstMod, true);
    updateStat('res-opt-win', calcMulti(win), false);
    updateStat('res-opt-charge', calcMulti(chg), false);
    updateStat('res-overcharge', calcMulti(over), true);
    updateStat('res-shatter', calcMulti(shat), true);
    updateStat('res-cluster', calcMulti(clust), false);

    // 4. Calculate Rock Stats based on user input
    const rockMassInput = document.getElementById('rock-mass');
    const rockResInput = document.getElementById('rock-res');
    const rockInstInput = document.getElementById('rock-inst');
    const gadgetsScanned = document.getElementById('gadgets-scanned');

    if (!rockMassInput || !rockResInput || !rockInstInput) return; // Failsafe

    const inputMass = safeFloat(rockMassInput.value);
    const inputRes = safeFloat(rockResInput.value);
    const inputInst = safeFloat(rockInstInput.value);
    const scannedWithGadgets = gadgetsScanned ? gadgetsScanned.checked : false;

    const pStatus = document.getElementById('crack-power-status');
    const pReqDisplay = document.getElementById('crack-power-required');
    const iStatus = document.getElementById('crack-inst-status');
    const iFinalDisplay = document.getElementById('crack-inst-final');

    if (inputMass > 0) {
        // Evaluate Resistance & Power
        let resModToApply = scannedWithGadgets ? calcMulti(fleetRes) : totalResMod;
        let effectiveRes = inputRes * (1 + resModToApply / 100);

        if (effectiveRes >= 100) {
            pStatus.innerText = "Impossible";
            pStatus.style.backgroundColor = "var(--impossible)";
            pStatus.style.color = "white";
            pReqDisplay.innerText = "Required Power: ∞ (Resist ≥ 100%)";
        } else {
            effectiveRes = Math.max(0, effectiveRes);
            const requiredPower = (inputMass / (1 - (effectiveRes * 0.01))) / 5;
            pReqDisplay.innerText = "Required Power: " + Math.round(requiredPower).toLocaleString();

            if (tMax < requiredPower) {
                pStatus.innerText = "Impossible";
                pStatus.style.backgroundColor = "var(--impossible)";
                pStatus.style.color = "white";
            } else if (tMin > requiredPower) {
                pStatus.innerText = "Too Much Power (Min)";
                pStatus.style.backgroundColor = "var(--overpower)";
                pStatus.style.color = "white";
            } else if (tMax < requiredPower * 1.1 || tMax > requiredPower * 2.5) {
                pStatus.innerText = "Difficult";
                pStatus.style.backgroundColor = "var(--difficult)";
                pStatus.style.color = "black";
            } else {
                pStatus.innerText = "Crackable";
                pStatus.style.backgroundColor = "var(--crackable)";
                pStatus.style.color = "white";
            }
        }

        // Evaluate Instability
        let instModToApply = scannedWithGadgets ? calcMulti(fleetInst) : totalInstMod;
        let finalInst = Math.max(0, inputInst * (1 + instModToApply / 100));

        iFinalDisplay.innerText = "Final Instability: " + Math.round(finalInst).toLocaleString();

        if (finalInst < 101) {
            iStatus.innerText = "Stable";
            iStatus.style.backgroundColor = "var(--crackable)";
            iStatus.style.color = "white";
        } else if (finalInst < 301) {
            iStatus.innerText = "Unstable";
            iStatus.style.backgroundColor = "var(--difficult)";
            iStatus.style.color = "black";
        } else {
            iStatus.innerText = "Extreme";
            iStatus.style.backgroundColor = "var(--impossible)";
            iStatus.style.color = "white";
        }
        
    } else {
        // Reset state if Mass is 0
        if (pStatus) {
            pStatus.innerText = "Awaiting Input";
            pStatus.style.backgroundColor = "var(--bg-color)";
        }
        if (iStatus) {
            iStatus.innerText = "Awaiting Input";
            iStatus.style.backgroundColor = "var(--bg-color)";
        }
    }
}

// Make globally available if called by HTML
window.calculate = calculate;