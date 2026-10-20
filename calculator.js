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

// --- SEAT COMPUTATION (single source of truth for calculate() and seat tooltips) ---
function computeSeat(card) {
    const opId = card.dataset.opid;
    const seat = {
        opId,
        active: !card.classList.contains('off'),
        laser: null,
        modules: [],
        quality: 0,
        powerMin: 0,
        powerMax: 0,
        finalExt: 0,
        finalInert: 0,
        optRange: 0,
        maxRange: 0,
        finalWin: 0,
        finalChg: 0,
        finalOver: 0,
        finalShat: 0,
        finalClust: 0
    };

    const laserEl = document.getElementById(`cs-laser-${opId}`);
    if (!laserEl) return seat;

    const l = lasers[laserEl.dataset.value];
    if (!l || l.name === "None") return seat;
    seat.laser = l;

    const qualEl = document.getElementById(`qual-num-${opId}`);
    const qualBonus = qualEl ? (parseFloat(qualEl.value) || 0) : 0;
    seat.quality = qualBonus;

    // Collect Modules for this seat
    [1,2,3].forEach(m => {
        const modEl = document.getElementById(`cs-mod${m}-${opId}`);
        if (!modEl) return;

        const mod = modules[modEl.dataset.value];
        if (!mod || mod.name === "None") return;
        seat.modules.push(mod);
    });

    let pMod = qualBonus, eModPos = qualBonus, eModNeg = 0;
    const opInert = [l.inert || 0];
    let seatWin = 0, seatChg = 0, seatOver = 0, seatShat = 0, seatClust = 0;

    seat.modules.forEach(mod => {
        pMod += mod.power || 0;
        if (mod.extraction) { if (mod.extraction > 0) eModPos += mod.extraction; else eModNeg += Math.abs(mod.extraction); }
        opInert.push(mod.inert || 0);
        if (mod.optimalWin) seatWin += mod.optimalWin;
        if (mod.optCharge) seatChg += mod.optCharge;
        if (mod.overcharge) seatOver += mod.overcharge;
        if (mod.shatter) seatShat += mod.shatter;
        if (mod.cluster) seatClust += mod.cluster;
    });

    seat.powerMin = (l.powerMin || 0) * (1 + pMod/100);
    seat.powerMax = (l.powerMax || 0) * (1 + pMod/100);
    seat.finalExt = Math.max(0, (l.extraction || 0) * (1 + eModPos/100) * (1 - eModNeg/100));
    seat.finalInert = calcMulti(opInert);
    seat.optRange = l.optRange || 0;
    seat.maxRange = l.maxRange || 0;
    seat.finalWin = (((1 + (l.optimalWin || 0)/100) * (1 + seatWin/100)) - 1) * 100;
    seat.finalChg = (((1 + (l.optCharge || 0)/100) * (1 + seatChg/100)) - 1) * 100;
    seat.finalOver = (((1 + (l.overcharge || 0)/100) * (1 + seatOver/100)) - 1) * 100;
    seat.finalShat = (((1 + (l.shatter || 0)/100) * (1 + seatShat/100)) - 1) * 100;
    seat.finalClust = (((1 + (l.cluster || 0)/100) * (1 + seatClust/100)) - 1) * 100;
    return seat;
}

// --- MAIN CALCULATOR ---
function calculate() {
    let tMax = 0, tMin = 0;
    let fleetRes = [], fleetInst = []; 
    let gadgetRes = [], gadgetInst = []; 
    let win = [], chg = [], over = [], shat = [], clust = [];

    // 1. Process Ships & Lasers
    document.querySelectorAll('.setup-card').forEach(card => {
        let s = computeSeat(card);
        let opId = s.opId;

        // No laser equipped — nothing to show, reset local stats and skip
        if (!s.laser) {
            let extEl = document.getElementById(`op-ext-${opId}`);
            let inertEl = document.getElementById(`op-inert-${opId}`);
            let optEl = document.getElementById(`op-optrange-${opId}`);
            let maxEl = document.getElementById(`op-maxrange-${opId}`);
            if (extEl) extEl.innerText = '0.0';
            if (inertEl) inertEl.innerText = '0%';
            if (optEl) optEl.innerText = '0m';
            if (maxEl) maxEl.innerText = '0m';
            return;
        }

        // Add to Fleet Totals — only if this seat is active
        if (s.active) {
            tMax += s.powerMax;
            tMin += s.powerMin;

            if (s.laser.resistance) fleetRes.push(s.laser.resistance); 
            if (s.laser.instability) fleetInst.push(s.laser.instability);
            s.modules.forEach(mod => {
                if (mod.resistance) fleetRes.push(mod.resistance); 
                if (mod.instability) fleetInst.push(mod.instability);
            });

            if (s.finalWin !== 0) win.push(s.finalWin);
            if (s.finalChg !== 0) chg.push(s.finalChg);
            if (s.finalOver !== 0) over.push(s.finalOver);
            if (s.finalShat !== 0) shat.push(s.finalShat);
            if (s.finalClust !== 0) clust.push(s.finalClust);
        }

        // Update Local HTML Stats — always shown, even when the seat is toggled off
        const extDisplay = document.getElementById(`op-ext-${opId}`);
        if (extDisplay) extDisplay.innerText = s.finalExt.toFixed(1);
        
        updateStat(`op-inert-${opId}`, s.finalInert, true);
        
        const optRangeDisplay = document.getElementById(`op-optrange-${opId}`);
        if (optRangeDisplay) optRangeDisplay.innerText = s.optRange + 'm';
        
        const maxRangeDisplay = document.getElementById(`op-maxrange-${opId}`);
        if (maxRangeDisplay) maxRangeDisplay.innerText = s.maxRange + 'm';
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

// --- SEAT TOOLTIP (hover on the per-seat stat row) ---
window.showSeatTip = (opId) => {
    const card = document.querySelector(`.setup-card[data-opid="${opId}"]`);
    if (!card) return;
    const s = computeSeat(card);

    const row = (label, value, suffix = '', inv = false, base = false) => {
        let d;
        if (typeof value === 'number') d = parseFloat(value).toFixed(1).replace(/\.0$/, '');
        else d = value;
        if (!base && typeof value === 'number' && value > 0) d = '+' + d;
        const c = (typeof value === 'number' && value !== 0 && !base) ? ((value > 0 ? !inv : inv) ? 'style="color:var(--good-stat);"' : 'style="color:var(--bad-stat);"') : '';
        return `<div class="preview-stat-row"><span class="preview-label">${label}</span><span ${c}>${d}${suffix}</span></div>`;
    };
    let html = `<h4 class="tooltip-header">Seat Stats</h4>`;

    html += row('Power', `${Math.round(s.powerMin)}-${Math.round(s.powerMax)}`, '', false, true);
    html += row('Opt. Window', s.finalWin, '%', false);
    html += row('Opt. Charge', s.finalChg, '%', false);
    html += row('Overcharge', s.finalOver, '%', true);
    html += row('Shatter', s.finalShat, '%', true);
    html += row('Cluster', s.finalClust, '%', false);

    window.tooltipEl.innerHTML = html;
    window.tooltipEl.style.display = 'block';
};

// Make globally available if called by HTML
window.calculate = calculate;