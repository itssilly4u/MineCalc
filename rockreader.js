// --- ROCK READER MULTIPLIER MATH ---
function getMaxMulti(rarity) {
    if(rarity === 'Legendary') return 2;
    if(rarity === 'Epic') return 3;
    if(rarity === 'Rare') return 4;
    if(rarity === 'Uncommon') return 5;
    if(rarity === 'Common') return 6;
    if(rarity === 'Special') return 50; 
    return 1;
}

// --- LOCATION DATA HELPER ---
function getOreLocations(oreName) {
    let results = {};
    if (typeof locationDB === 'undefined') return results;
    
    for (const [locName, data] of Object.entries(locationDB)) {
        if (data.ship && data.ship.includes(oreName)) {
            if (!results[data.system]) results[data.system] = [];
            results[data.system].push(locName);
        }
    }
    return results;
}

function getSystemClass(systemName) {
    const lower = systemName.toLowerCase();
    if (['pyro', 'nyx', 'stanton'].includes(lower)) return `sys-${lower}`;
    return 'sys-unknown';
}

// --- LOCATION HOVER AND DROPDOWNS ---
function showLocationTip(oreName) {
    const locs = getOreLocations(oreName);
    
    if (!locs || Object.keys(locs).length === 0) {
        if (window.tooltipEl) {
            window.tooltipEl.innerHTML = `<h4 class="tooltip-header">Spawn Locations</h4><div class="sys-unknown">No known locations for ${oreName}.</div>`;
            window.tooltipEl.style.display = 'block';
        }
        return;
    }

    let html = `<h4 class="tooltip-header">Known Locations</h4><div class="tooltip-row-container">`;

    // --- Custom System Sort Order ---
    const systemOrder = { "Stanton": 1, "Pyro": 2, "Nyx": 3 };
    
    const sortedSystems = Object.entries(locs).sort((a, b) => {
        const weightA = systemOrder[a[0]] || 99; 
        const weightB = systemOrder[b[0]] || 99;
        return weightA - weightB;
    });

    for (const [sys, arr] of sortedSystems) {
        const sysClass = typeof getSystemClass === 'function' ? getSystemClass(sys) : 'sys-unknown';
        
        const sortedLocs = arr.sort(); 
        const displayArr = sortedLocs.slice(0, 3);
        const extra = sortedLocs.length > 3 ? `, <span class="sys-unknown" style="font-style:italic;">+${sortedLocs.length - 3} more</span>` : '';

        html += `<div class="tooltip-row">
                    <span class="tooltip-sys-label ${sysClass}">[${sys.toUpperCase()}]</span> 
                    <span style="color:var(--text-main);">${displayArr.join(', ')}${extra}</span>
                 </div>`;
    }
    
    html += `</div><div class="tooltip-footer">Click to view all locations</div>`;

    if (window.tooltipEl) {
        window.tooltipEl.innerHTML = html;
        window.tooltipEl.style.display = 'block';
    }
}

function toggleLocationRow(cell, oreName) {
    const tr = cell.closest('tr');
    const nextTr = tr.nextElementSibling;
    
    if (nextTr && (nextTr.classList.contains('loc-details-row') || nextTr.classList.contains('sig-details-row') || nextTr.classList.contains('price-details-row'))) {
        const wasLoc = nextTr.classList.contains('loc-details-row');
        nextTr.remove();
        if (wasLoc) return; 
    }

    const locs = getOreLocations(oreName);
    if (!locs || Object.keys(locs).length === 0) return;

    let html = `<div class="detail-row-wrapper"><div class="detail-row-header">Known Scan Locations</div><div class="detail-cards-container">`;

    // --- Custom System Sort Order ---
    const systemOrder = { "Stanton": 1, "Pyro": 2, "Nyx": 3 };
    
    const sortedSystems = Object.entries(locs).sort((a, b) => {
        const weightA = systemOrder[a[0]] || 99; 
        const weightB = systemOrder[b[0]] || 99;
        return weightA - weightB;
    });

    for (const [sys, arr] of sortedSystems) {
        const sysClass = typeof getSystemClass === 'function' ? getSystemClass(sys) : 'sys-unknown';
        
        // FIX: Removed the inline width styles so it uses your CSS grid!
        html += `
            <div class="detail-card">
                <div class="card-sys-header ${sysClass}">${sys} SYSTEM</div>
                <div class="card-content-chips">
        `;
        
        arr.sort().forEach(loc => {
            html += `<span class="loc-chip">${loc}</span>`;
        });

        html += `</div></div>`;
    }
    
    html += `</div></div>`;

    const detailRow = document.createElement('tr');
    detailRow.className = 'loc-details-row';
    detailRow.innerHTML = `<td colspan="100%" style="padding: 0; border-bottom: 1px solid var(--border);">${html}</td>`;
    tr.after(detailRow);
}

// --- SIGNATURE HOVER AND DROPDOWNS ---
function showSignatureTip(baseSig, rarity) {
    const max = getMaxMulti(rarity);
    let html = `<h4 class="tooltip-header">${rarity} Multiples</h4>
                <div class="sys-unknown" style="font-size: 0.8em; margin-bottom: 8px;">Max cluster size: ${max}x</div>
                <div class="detail-cards-container" style="gap:8px;">`;
    
    for(let i=1; i<=max; i++) {
        html += `<span class="loc-chip">${i}x: <span class="price-val" style="font-size:1em;">${baseSig * i}</span></span>`;
    }
    
    html += `</div><div class="tooltip-footer">Click to see all clusters</div>`;
    
    if (window.tooltipEl) {
        window.tooltipEl.innerHTML = html;
        window.tooltipEl.style.display = 'block';
    }
}

function toggleSignatureRow(cell, baseSig, rarity) {
    const tr = cell.closest('tr');
    const nextTr = tr.nextElementSibling;
    
    if (nextTr && (nextTr.classList.contains('sig-details-row') || nextTr.classList.contains('price-details-row') || nextTr.classList.contains('loc-details-row'))) {
        const wasSig = nextTr.classList.contains('sig-details-row');
        nextTr.remove();
        if (wasSig) return; 
    }
    
    const max = getMaxMulti(rarity);
    let html = `<div class="detail-row-wrapper"><div class="detail-row-header">${rarity} Limits</div><div class="detail-cards-container">`;
    for(let i=1; i<=max; i++) {
        html += `<div class="detail-card center-text">
                    <div class="sys-unknown" style="font-size:0.75em; text-transform:uppercase;">${i}x Cluster</div>
                    <div class="price-val">${baseSig * i}</div>
                 </div>`;
    }
    html += `</div></div>`;

    const detailRow = document.createElement('tr');
    detailRow.className = 'sig-details-row';
    detailRow.innerHTML = `<td colspan="100%" style="padding: 0; border-bottom: 1px solid var(--border);">${html}</td>`;
    tr.after(detailRow);
}

// --- PRICE HOVER AND DROPDOWNS ---
function showPriceTip(oreName) {
    if (typeof pricingData === 'undefined' || !pricingData[oreName] || pricingData[oreName].length === 0) {
        if (window.tooltipEl) {
            window.tooltipEl.innerHTML = `<h4 class="tooltip-header">No Market Data</h4><div class="sys-unknown">Prices unavailable for ${oreName}.</div>`;
            window.tooltipEl.style.display = 'block';
        }
        return;
    }

    const prices = pricingData[oreName];
    const bestPrices = {};
    prices.forEach(p => {
        if (!bestPrices[p.system] || p.price > bestPrices[p.system].price) {
            bestPrices[p.system] = p;
        }
    });

    let html = `<h4 class="tooltip-header">Best Regional Prices</h4><div class="tooltip-row-container">`;

    Object.keys(bestPrices).forEach(sys => {
        const data = bestPrices[sys];
        const displayLoc = data.location.replace("Green Imperial Housing Exchange", "Grim HEX");
        const sysClass = getSystemClass(sys);

        html += `<div class="tooltip-row">
                    <span class="tooltip-sys-label ${sysClass}">[${sys}]</span> 
                    <span class="price-val" style="font-size:1em; margin-right:5px;">${data.price.toLocaleString()} <span class="price-unit">aUEC</span></span> 
                    <span class="sys-unknown">(${displayLoc})</span>
                 </div>`;
    });
    
    html += `</div><div class="tooltip-footer">Click to see all places to sell</div>`;

    if (window.tooltipEl) {
        window.tooltipEl.innerHTML = html;
        window.tooltipEl.style.display = 'block';
    }
}

function togglePriceRow(cell, oreName, showAll = false, btnEl = null) {
    let tr;
    if (btnEl) {
        tr = btnEl.closest('.price-details-row').previousElementSibling;
    } else {
        tr = cell.closest('tr');
    }

    const nextTr = tr.nextElementSibling;
    
    if (nextTr && (nextTr.classList.contains('sig-details-row') || nextTr.classList.contains('price-details-row') || nextTr.classList.contains('loc-details-row'))) {
        const wasPrice = nextTr.classList.contains('price-details-row');
        nextTr.remove();
        if (wasPrice && !showAll && !btnEl) return; 
    }

    if (typeof pricingData === 'undefined' || !pricingData[oreName]) return;
    const sortedPrices = [...pricingData[oreName]].sort((a, b) => b.price - a.price);
    
    const displayPrices = showAll ? sortedPrices : sortedPrices.slice(0, 5);
    const hasMore = sortedPrices.length > 5;

    let html = `
    <div class="detail-row-wrapper">
        <div class="detail-row-header">
            <span>Market Outlets (${showAll ? 'All' : 'Top 5'} of ${sortedPrices.length})</span>
            ${showAll && hasMore ? `<span class="show-less-btn" onclick="togglePriceRow(null, '${oreName.replace(/'/g, "\\'")}', false, this)">[ Show Less ]</span>` : ''}
        </div>
        <div class="detail-cards-container">
    `;

    displayPrices.forEach(p => {
        const displayLoc = p.location.replace("Green Imperial Housing Exchange", "Grim HEX");
        const sysClass = getSystemClass(p.system);

        html += `
            <div class="detail-card">
                <div class="card-sys-header ${sysClass}">${p.system}</div>
                <div class="price-loc" title="${p.location}">${displayLoc}</div>
                <div class="price-val">${p.price.toLocaleString()} <span class="price-unit">aUEC/SCU</span></div>
            </div>`;
    });

    if (hasMore && !showAll) {
        html += `
            <div class="show-more-card" onclick="togglePriceRow(null, '${oreName.replace(/'/g, "\\'")}', true, this)">
                + See All ${sortedPrices.length} Locations
            </div>`;
    }
    html += `</div></div>`;

    const detailRow = document.createElement('tr');
    detailRow.className = 'price-details-row';
    detailRow.innerHTML = `<td colspan="100%" style="padding: 0; border-bottom: 1px solid var(--border);">${html}</td>`;
    tr.after(detailRow);
}

// --- TABLE GENERATION ---
function generateOreTable() {
    const tbody = document.getElementById('ore-table-body');
    if (!tbody || typeof ores === 'undefined') return;

    const colorize = (word) => {
        let cssClass = (word === 'Extreme' ? 'rating-extreme' : word === 'High' ? 'rating-high' : word === 'Medium' ? 'rating-medium' : word === 'Low' ? 'rating-low' : 'rating-very-low');
        return `<span class="${cssClass}">${word}</span>`;
    };

    const getInstRating = (val) => colorize(val >= 1000 ? 'Extreme' : val >= 600 ? 'High' : val > 50 ? 'Medium' : 'Low');
    const getResRating = (val) => colorize(val >= 95 ? 'Extreme' : val >= 60 ? 'High' : val >= 30 ? 'Medium' : val >= 10 ? 'Low' : 'Very Low');
    const getDensRating = (val) => {
        let word = val >= 2500 ? 'Very Large' : val >= 1200 ? 'Large' : val >= 800 ? 'Medium' : val >= 300 ? 'Small' : 'Very Small';
        let cssClass = (word === 'Very Large' ? 'rating-extreme' : word === 'Large' ? 'rating-high' : word === 'Medium' ? 'rating-medium' : word === 'Small' ? 'rating-low' : 'rating-very-low');
        return `<span class="${cssClass}">${word}</span>`;
    };

    let htmlOres = "";
    let htmlSpecials = "";

    ores.forEach(ore => {
        const safeName = ore.name.replace(/'/g, "\\'");
        
        if (!ore.rarity) {
            htmlSpecials += `<tr data-signature="${ore.signature}" data-rarity="Special">
                <td class="sys-unknown" style="font-weight: bold; text-transform: uppercase;">Special</td>
                <td class="ore-name-cell" style="font-weight: bold;">${ore.name}</td>
                <td class="sys-unknown" style="font-weight: bold; font-size: 1.1em;">${ore.signature}</td>
                <td colspan="4" class="sys-unknown" style="text-align: center;">N/A</td>
                <td class="sys-unknown" style="text-align: center;">-</td>
                <td class="sys-unknown" style="font-size: 0.85em;">-</td>
            </tr>`;
            return;
        }

        let subOres = ore.secondary || "-";
        if (ore.tertiary) subOres += `, ${ore.tertiary}`;

        let priceCellHtml = `<td class="sys-unknown" style="text-align: center;">N/A</td>`;
        if (typeof pricingData !== 'undefined' && pricingData[ore.name] && pricingData[ore.name].length > 0) {
            const bestPriceValue = pricingData[ore.name][0].price; 
            const formattedPrice = bestPriceValue.toLocaleString();

            priceCellHtml = `
            <td class="price-clickable" onmouseenter="showPriceTip('${safeName}')" onmouseleave="hidePreview()" onclick="togglePriceRow(this, '${safeName}')">
                <div class="price-val" style="text-align: center;">
                    ${formattedPrice} <span class="price-unit">aUEC</span> <span class="sys-unknown" style="font-size:0.8em;">📊</span>
                </div>
            </td>`;
        }

        const locs = getOreLocations(ore.name);
        const hasLocs = Object.keys(locs).length > 0;
        let locCellHtml = `<td class="sys-unknown" style="text-align: center;">Unknown</td>`;
        
        if (hasLocs) {
            locCellHtml = `
            <td class="loc-clickable" style="text-align: center;" onmouseenter="showLocationTip('${safeName}')" onmouseleave="hidePreview()" onclick="toggleLocationRow(this, '${safeName}')">
                <span class="action-badge">📍 View</span>
            </td>`;
        }

        htmlOres += `<tr data-signature="${ore.signature}" data-rarity="${ore.rarity}">
            <td class="rarity-${ore.rarity.toLowerCase()}">${ore.rarity}</td>
            <td class="ore-name-cell"><div class="name-badge-wrapper" style="display: flex; align-items: center; gap: 15px;"><div style="font-weight: bold; line-height: 1.2;">${ore.name} ${ore.locationNote ? `<span style="font-size:0.7em; color:var(--accent); display:block; font-weight: normal;">(${ore.locationNote})</span>` : ''}</div></div></td>
            <td class="sig-clickable" style="color: var(--accent); font-weight: bold; font-size: 1.1em;" onmouseenter="showSignatureTip(${ore.signature}, '${ore.rarity}')" onmouseleave="hidePreview()" onclick="toggleSignatureRow(this, ${ore.signature}, '${ore.rarity}')">${ore.signature}</td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getInstRating(ore.instability)} <span class="sys-unknown" style="font-size: 0.8em;">(${ore.instability})</span></td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getResRating(ore.resistance)} <span class="sys-unknown" style="font-size: 0.8em;">(${ore.resistance})</span></td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getDensRating(ore.density)} <span class="sys-unknown" style="font-size: 0.8em;">(${ore.density})</span></td>
            ${priceCellHtml}
            ${locCellHtml}
            <td class="sys-unknown" style="font-size: 0.85em;">${subOres}</td>
        </tr>`;
    });
    
    tbody.innerHTML = htmlOres + htmlSpecials;
}

function findOres() {
    const sig = parseInt(document.getElementById('signatureInput').value);
    const rows = document.querySelectorAll('#ore-table-body tr[data-signature]');
    rows.forEach(r => { r.classList.remove('highlight-match'); const b = r.querySelector('.cluster-badge'); if (b) b.remove(); });
    if (isNaN(sig) || sig <= 0) return;
    let matchFound = false;
    rows.forEach(row => {
        const baseSig = parseInt(row.getAttribute('data-signature'));
        const rarity = row.getAttribute('data-rarity');
        const max = getMaxMulti(rarity);
        if (baseSig && sig % baseSig === 0 && (sig / baseSig) <= max) {
            row.classList.add('highlight-match');
            row.querySelector('.name-badge-wrapper').insertAdjacentHTML('beforeend', `<span class="cluster-badge">${sig / baseSig}x Cluster</span>`);
            matchFound = true;
        }
    });
    if (matchFound) document.querySelector('.highlight-match').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Bind everything globally
window.showLocationTip = showLocationTip;
window.toggleLocationRow = toggleLocationRow;
window.showSignatureTip = showSignatureTip;
window.toggleSignatureRow = toggleSignatureRow;
window.showPriceTip = showPriceTip;
window.togglePriceRow = togglePriceRow;
window.generateOreTable = generateOreTable;
window.findOres = findOres;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof generateOreTable === 'function') generateOreTable();
    if (typeof generateRefineryTable === 'function') generateRefineryTable();
});