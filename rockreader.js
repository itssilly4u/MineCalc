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


// --- SIGNATURE HOVER AND DROPDOWNS ---
function showSignatureTip(baseSig, rarity) {
    const max = getMaxMulti(rarity);
    let html = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">`;
    for(let i=1; i<=max; i++) {
        html += `<span style="background:var(--bg-color); border:1px solid var(--border); padding:4px 8px; border-radius:4px; font-size:0.9em; color:var(--text-main);">${i}x: <span style="color:var(--accent); font-weight:bold;">${baseSig * i}</span></span>`;
    }
    html += `</div>`;
    
    if (window.tooltipEl) {
        window.tooltipEl.innerHTML = `<h4 style="margin-bottom: 5px; border-bottom: none; padding-bottom: 0;">${rarity} Multiples</h4><div style="font-size:0.8em; color:var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 5px;">Max cluster size: ${max}x</div>${html}`;
        window.tooltipEl.style.display = 'block';
    }
}

function toggleSignatureRow(cell, baseSig, rarity) {
    const tr = cell.closest('tr');
    const nextTr = tr.nextElementSibling;
    
    if (nextTr && (nextTr.classList.contains('sig-details-row') || nextTr.classList.contains('price-details-row'))) {
        const wasSig = nextTr.classList.contains('sig-details-row');
        nextTr.remove();
        if (wasSig) return; 
    }
    
    const max = getMaxMulti(rarity);
    let html = `<div style="display:flex; gap:15px; padding:5px 10px; border-left:3px solid var(--accent); flex-wrap:wrap; align-items: center;">`;
    html += `<span style="color:var(--text-muted); font-size:0.8em; text-transform:uppercase; margin-right:10px;">${rarity} Limits:</span>`;
    for(let i=1; i<=max; i++) {
        html += `<div style="background:var(--bg-color); border:1px solid var(--border); padding:6px 12px; border-radius:6px; text-align:center;">
                    <div style="color:var(--text-muted); font-size:0.75em; text-transform:uppercase;">${i}x Cluster</div>
                    <div style="color:var(--accent); font-weight:bold; font-size:1.1em;">${baseSig * i}</div>
                 </div>`;
    }
    html += `</div>`;

    const detailRow = document.createElement('tr');
    detailRow.className = 'sig-details-row';
    detailRow.innerHTML = `<td colspan="8" style="padding: 15px; border-bottom: 1px solid var(--border);">${html}</td>`;
    tr.after(detailRow);
}

// --- PRICE HOVER AND DROPDOWNS ---
function showPriceTip(oreName) {
    if (typeof pricingData === 'undefined' || !pricingData[oreName] || pricingData[oreName].length === 0) {
        if (window.tooltipEl) {
            window.tooltipEl.innerHTML = `<h4>No Market Data</h4><div style="font-size:0.9em; color:var(--text-muted);">Prices unavailable for ${oreName}.</div>`;
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

    let html = `<h4 style="margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 5px;">Best Regional Prices</h4>
                <div style="display:flex; flex-direction:column; gap:6px; font-size:0.9em;">`;

    Object.keys(bestPrices).forEach(sys => {
        const data = bestPrices[sys];
        // Shorten name for the tooltip
        const displayLoc = data.location.replace("Green Imperial Housing Exchange", "Grim HEX");
        const sysColor = systemColors[sys] || "var(--text-muted)";

        html += `<div>
                    <span style="color:${sysColor}; font-weight:bold; width: 60px; display:inline-block;">${sys}:</span> 
                    <span style="color:var(--accent); font-weight:bold;">${data.price.toLocaleString()} <span style="font-size:0.8em; color:var(--text-main);">aUEC / SCU</span></span> 
                    <span style="color:var(--text-muted); font-size:0.9em;">(${displayLoc})</span>
                 </div>`;
    });
    html += `</div>`;

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
    
    if (nextTr && (nextTr.classList.contains('sig-details-row') || nextTr.classList.contains('price-details-row'))) {
        const wasPrice = nextTr.classList.contains('price-details-row');
        nextTr.remove();
        if (wasPrice && !showAll && !btnEl) return; 
    }

    if (typeof pricingData === 'undefined' || !pricingData[oreName]) return;
    const sortedPrices = [...pricingData[oreName]].sort((a, b) => b.price - a.price);
    
    const displayPrices = showAll ? sortedPrices : sortedPrices.slice(0, 5);
    const hasMore = sortedPrices.length > 5;

    let html = `
    <div style="padding: 10px; border-left: 3px solid var(--accent);">
        <div style="color:var(--text-muted); font-size:0.8em; text-transform:uppercase; margin-bottom:10px; display: flex; justify-content: space-between;">
            <span>Market Outlets (${showAll ? 'All' : 'Top 5'} of ${sortedPrices.length})</span>
            ${showAll && hasMore ? `<span style="cursor: pointer; color: var(--accent); font-weight: bold;" onclick="togglePriceRow(null, '${oreName.replace(/'/g, "\\'")}', false, this)">[ Show Less ]</span>` : ''}
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
    `;

    displayPrices.forEach(p => {
        // Shorten the name here for the cards
        const displayLoc = p.location.replace("Green Imperial Housing Exchange", "Grim HEX");
        const sysColor = systemColors[p.system] || "var(--text-muted)";

        html += `
            <div style="background:var(--bg-color); border:1px solid var(--border); padding:8px 15px; border-radius:6px; flex: 1 1 200px; max-width: 250px;">
                <div style="color:${sysColor}; font-size:0.7em; text-transform:uppercase;">${p.system}</div>
                <div style="color:var(--text-main); font-size:0.85em; font-weight: bold; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.location}">${displayLoc}</div>
                <div style="color:var(--accent); font-weight:bold; font-size:1.1em;">${p.price.toLocaleString()} <span style="font-size:0.7em; color:var(--text-main);">aUEC/SCU</span></div>
            </div>`;
    });

    if (hasMore && !showAll) {
        html += `
            <div onclick="togglePriceRow(null, '${oreName.replace(/'/g, "\\'")}', true, this)" 
                 style="background: rgba(var(--accent-rgb, 255, 204, 0), 0.1); border: 1px dashed var(--accent); padding: 8px 15px; border-radius: 6px; flex: 1 1 200px; max-width: 250px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--accent); font-weight: bold;">
                + See All ${sortedPrices.length} Locations
            </div>`;
    }
    html += `</div></div>`;

    const detailRow = document.createElement('tr');
    detailRow.className = 'price-details-row';
    detailRow.innerHTML = `<td colspan="8" style="padding: 15px; border-bottom: 1px solid var(--border); background-color: rgba(0,0,0,0.1);">${html}</td>`;
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
        
        // Handle "Special" un-mineable things
        if (!ore.rarity) {
            htmlSpecials += `<tr data-signature="${ore.signature}" data-rarity="Special">
                <td style="color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Special</td>
                <td class="ore-name-cell" style="font-weight: bold;">${ore.name}</td>
                <td style="color: var(--text-muted); font-weight: bold; font-size: 1.1em;">${ore.signature}</td>
                <td colspan="4" style="color: var(--text-muted); text-align: center;">N/A</td>
                <td style="font-size: 0.85em; color: var(--text-muted);">-</td>
            </tr>`;
            return;
        }

        let subOres = ore.secondary || "-";
        if (ore.tertiary) subOres += `, ${ore.tertiary}`;

       // --- NEW BEST MARKET PRICE LOGIC ---
        let priceCellHtml = `<td style="color: var(--text-muted); text-align: center;">N/A</td>`;
        
        if (typeof pricingData !== 'undefined' && pricingData[ore.name] && pricingData[ore.name].length > 0) {
            // Get the absolute best price value (already sorted highest to lowest)
            const bestPriceValue = pricingData[ore.name][0].price; 
            const formattedPrice = bestPriceValue.toLocaleString();

            priceCellHtml = `
            <td class="price-clickable" onmouseenter="showPriceTip('${safeName}')" onmouseleave="hidePreview()" onclick="togglePriceRow(this, '${safeName}')">
                <div style="color: var(--accent); font-weight: bold; font-size: 1.1em; text-align: center;">
                    ${formattedPrice} <span style="font-size: 0.7em; color: var(--text-main);">aUEC</span> <span style="font-size: 0.8em; color: var(--text-muted);">📊</span>
                </div>
            </td>`;
        }

        htmlOres += `<tr data-signature="${ore.signature}" data-rarity="${ore.rarity}">
            <td class="rarity-${ore.rarity.toLowerCase()}">${ore.rarity}</td>
            <td class="ore-name-cell"><div class="name-badge-wrapper" style="display: flex; align-items: center; gap: 15px;"><div style="font-weight: bold; line-height: 1.2;">${ore.name} ${ore.locationNote ? `<span style="font-size:0.7em; color:var(--accent); display:block; font-weight: normal;">(${ore.locationNote})</span>` : ''}</div></div></td>
            <td class="sig-clickable" style="cursor: pointer; color: var(--accent); font-weight: bold; font-size: 1.1em;" onmouseenter="showSignatureTip(${ore.signature}, '${ore.rarity}')" onmouseleave="hidePreview()" onclick="toggleSignatureRow(this, ${ore.signature}, '${ore.rarity}')">${ore.signature}</td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getInstRating(ore.instability)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.instability})</span></td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getResRating(ore.resistance)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.resistance})</span></td>
            <td onmouseenter="showGadgetTip('${safeName}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">${getDensRating(ore.density)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.density})</span></td>
            ${priceCellHtml}
            <td style="font-size: 0.85em; color: var(--text-muted);">${subOres}</td>
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
window.showSignatureTip = showSignatureTip;
window.toggleSignatureRow = toggleSignatureRow;
window.showPriceTip = showPriceTip;
window.togglePriceRow = togglePriceRow;
window.generateOreTable = generateOreTable;
window.findOres = findOres;

document.addEventListener('DOMContentLoaded', () => {
    // Generate the Rock Reader table immediately
    if (typeof generateOreTable === 'function') {
        generateOreTable();
    }
    
    // Generate the Refinery table immediately
    // Note: Use whatever function name you have for building the refinery table
    if (typeof generateRefineryTable === 'function') {
        generateRefineryTable();
    }
});