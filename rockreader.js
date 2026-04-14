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
window.showSignatureTip = (baseSig, rarity) => {
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

window.toggleSignatureRow = (cell, baseSig, rarity) => {
    const tr = cell.closest('tr');
    const nextTr = tr.nextElementSibling;
    
    // If it's already open, close it
    if (nextTr && nextTr.classList.contains('sig-details-row')) {
        nextTr.remove();
        return;
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
    detailRow.innerHTML = `<td colspan="7" style="padding: 15px; border-bottom: 1px solid var(--border);">${html}</td>`;
    tr.after(detailRow);
}

function generateOreTable() {
    const tbody = document.getElementById('ore-table-body');
    if (!tbody || typeof ores === 'undefined') return;

    const colorize = (word) => {
        let cssClass = '';
        if (word === 'Extreme') cssClass = 'rating-extreme';
        else if (word === 'High') cssClass = 'rating-high';
        else if (word === 'Medium') cssClass = 'rating-medium';
        else if (word === 'Low') cssClass = 'rating-low';
        else if (word === 'Very Low') cssClass = 'rating-very-low';
        return `<span class="${cssClass}">${word}</span>`;
    };

    const getInstRating = (val) => colorize(val >= 1000 ? 'Extreme' : val >= 600 ? 'High' : val > 50 ? 'Medium' : 'Low');
    const getResRating = (val) => colorize(val >= 95 ? 'Extreme' : val >= 60 ? 'High' : val >= 30 ? 'Medium' : val >= 10 ? 'Low' : 'Very Low');
    const getDensRating = (val) => {
        let word = val >= 2500 ? 'Very Large' : val >= 1200 ? 'Large' : val >= 800 ? 'Medium' : val >= 300 ? 'Small' : 'Very Small';
        
        let cssClass = '';
        if (word === 'Very Large') cssClass = 'rating-extreme';
        else if (word === 'Large') cssClass = 'rating-high';
        else if (word === 'Medium') cssClass = 'rating-medium';
        else if (word === 'Small') cssClass = 'rating-low';
        else if (word === 'Very Small') cssClass = 'rating-very-low';
        
        return `<span class="${cssClass}">${word}</span>`;
    };

    let htmlOres = "";
    let htmlSpecials = "";

    ores.forEach(ore => {
        if (!ore.rarity) {
            htmlSpecials += `
                <tr data-signature="${ore.signature}" data-rarity="Special">
                    <td style="color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Special</td>
                    <td class="ore-name-cell" style="font-weight: bold;">${ore.name}</td>
                    <td style="color: var(--text-muted); font-weight: bold; font-size: 1.1em;">${ore.signature}</td>
                    <td style="color: var(--text-muted);">N/A</td>
                    <td style="color: var(--text-muted);">N/A</td>
                    <td style="color: var(--text-muted);">N/A</td>
                    <td style="font-size: 0.85em; color: var(--text-muted);">-</td>
                </tr>
            `;
            return;
        }

        let subOres = ore.secondary || "-";
        if (ore.tertiary) subOres += `, ${ore.tertiary}`;

        htmlOres += `
            <tr data-signature="${ore.signature}" data-rarity="${ore.rarity}">
                <td class="rarity-${ore.rarity.toLowerCase()}">${ore.rarity}</td>
                
                <td class="ore-name-cell">
                    <div class="name-badge-wrapper" style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-weight: bold; line-height: 1.2;">
                            ${ore.name} 
                            ${ore.locationNote ? `<span style="font-size:0.7em; color:var(--accent); display:block; font-weight: normal;">(${ore.locationNote})</span>` : ''}
                        </div>
                    </div>
                </td>
                
                <td class="sig-clickable" style="color: var(--accent); font-weight: bold; font-size: 1.1em;" 
                    onmouseenter="showSignatureTip(${ore.signature}, '${ore.rarity}')" 
                    onmouseleave="hidePreview()" 
                    onclick="toggleSignatureRow(this, ${ore.signature}, '${ore.rarity}')" 
                    title="Click or hover to expand clusters">
                    ${ore.signature}
                </td>
                
                <td style="cursor: help;" onmouseenter="showGadgetTip('${ore.name.replace(/'/g, "\\'")}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">
                    ${getInstRating(ore.instability)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.instability})</span>
                </td>
                
                <td style="cursor: help;" onmouseenter="showGadgetTip('${ore.name.replace(/'/g, "\\'")}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">
                    ${getResRating(ore.resistance)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.resistance})</span>
                </td>
                
                <td style="cursor: help;" onmouseenter="showGadgetTip('${ore.name.replace(/'/g, "\\'")}', '${ore.instability}', '${ore.resistance}', '${ore.density}')" onmouseleave="hidePreview()">
                    ${getDensRating(ore.density)} <span style="color: var(--text-muted); font-size: 0.8em;">(${ore.density})</span>
                </td>

                <td style="font-size: 0.85em; color: var(--text-muted);">${subOres}</td>
            </tr>
        `;
    });

    tbody.innerHTML = htmlOres + htmlSpecials;
}

function findOres() {
    const inputSignatureStr = document.getElementById('signatureInput').value;
    const signature = parseInt(inputSignatureStr);
    const tbody = document.getElementById('ore-table-body');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr[data-signature]');

    rows.forEach(row => {
        row.classList.remove('highlight-match');
        const badge = row.querySelector('.cluster-badge');
        if (badge) badge.remove();
    });

    if (isNaN(signature) || signature <= 0) return;

    const _sys_checksum_verify = () => {
    const s = "color:#ffcc00; font-weight:bold;";
    const m = "Original Source: itssilly.xyz";
        if (!window.log_init) {
            console.log(`%c[MineCalc] %c${m}`, s, "color:#a0a0a0;");
            window.log_init = true;
        }
    };

    let matchFound = false;

    rows.forEach(row => {
        const baseSig = parseInt(row.getAttribute('data-signature'));
        const rarity = row.getAttribute('data-rarity');
        const maxMulti = getMaxMulti(rarity);

        if (baseSig && signature % baseSig === 0) {
            const count = signature / baseSig;
            
            if (count <= maxMulti) {
                row.classList.add('highlight-match');
                const nameWrapper = row.querySelector('.name-badge-wrapper');
                nameWrapper.insertAdjacentHTML('beforeend', `<span class="cluster-badge">${count}x Cluster</span>`);
                matchFound = true;
            }
        }
    });

    if (matchFound) {
        const firstMatch = tbody.querySelector('.highlight-match');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            _sys_checksum_verify();
        }
    }
}