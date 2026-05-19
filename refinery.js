const systemMap = {
    "ST": "Stanton",
    "PY": "Pyro",
    "NX": "Nyx",
    "NY": "Nyx" 
};

const systemColors = {
    "Stanton": "var(--text-stanton)",
    "Nyx": "var(--text-nyx)",
    "Pyro": "var(--text-pyro)"
};

let currentSortCol = 'Refinery';
let isSortAsc = true; 

function sortRefineryTable(col) {
    if (currentSortCol === col) {
        isSortAsc = !isSortAsc;
    } else {
        currentSortCol = col;
        isSortAsc = (col === 'Refinery' || col === 'System') ? true : false;
    }
    generateRefineryTable(); 
}

function generateRefineryTable() {
    const table = document.getElementById('refinery-table');
    if (!table) return; 
    
    const thead = table.querySelector('thead tr');
    const tbody = document.getElementById('refinery-table-body');

    if (!tbody || !thead || !refineryData || refineryData.length === 0) return;

    thead.innerHTML = '';

    const ignoreKeys = ["Refinery", ""]; 
    const oreSet = new Set();
    
    refineryData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!ignoreKeys.includes(key)) oreSet.add(key);
        });
    });
    
    const oreKeys = Array.from(oreSet).sort();

    const buildHeader = (label, sortKey) => {
        const th = document.createElement('th');
        th.style.cursor = 'pointer';
        
        let displayTitle = label;

        if (label.toUpperCase() === 'CONS') {
            displayTitle = "Construction Materials";
        } 

        else if (typeof ores !== 'undefined' && sortKey !== 'Refinery' && sortKey !== 'System') {
            const match = ores.find(o => o.name.toUpperCase().startsWith(label.substring(0, 4).toUpperCase()));
            if (match) displayTitle = match.name;
        }

        th.title = `Sort by ${displayTitle}`;
        th.style.whiteSpace = 'nowrap'; 
        th.onclick = () => sortRefineryTable(sortKey);
        
        let arrow = '';
        if (currentSortCol === sortKey) {
            arrow = isSortAsc ? '&nbsp;<span style="font-size:0.8em">▲</span>' : '&nbsp;<span style="font-size:0.8em">▼</span>';
            th.style.color = 'var(--accent)'; 
        }
        
        if (sortKey !== 'Refinery' && sortKey !== 'System') th.style.textAlign = 'center';
        
        th.innerHTML = label + arrow;
        thead.appendChild(th);
    };

    buildHeader('Refinery', 'Refinery');
    buildHeader('System', 'System');
    oreKeys.forEach(ore => buildHeader(ore, ore));

    let sortedData = [...refineryData].sort((a, b) => {
        let valA, valB;

        if (currentSortCol === 'System') {
            valA = systemMap[a[""]] || a[""];
            valB = systemMap[b[""]] || b[""];
        } else {
            valA = a[currentSortCol];
            valB = b[currentSortCol];
        }

        if (currentSortCol === 'Refinery' || currentSortCol === 'System') {
            valA = valA ? valA.toString().toLowerCase() : "";
            valB = valB ? valB.toString().toLowerCase() : "";
        } else {
            valA = valA === undefined ? 0 : parseFloat(valA);
            valB = valB === undefined ? 0 : parseFloat(valB);
        }

        if (valA < valB) return isSortAsc ? -1 : 1;
        if (valA > valB) return isSortAsc ? 1 : -1;
        return 0;
    });

    let htmlRows = "";
    sortedData.forEach(ref => {
        const sysCode = ref[""]; 
        const sysName = systemMap[sysCode] || sysCode || "Unknown";
        const sysColor = systemColors[sysName] || "var(--text-muted)";
        
        let row = `<tr>
            <td style="font-weight: bold; white-space: nowrap;">${ref.Refinery}</td>
            <td style="color: ${sysColor}; font-weight: bold; font-size: 0.9em;">${sysName}</td>`;

        oreKeys.forEach(ore => {
            const val = ref[ore];
            let colorStr = "";
            let valStr = "0%";

            if (val !== undefined && val !== null) {
                if (val > 0) {
                    colorStr = 'color: var(--good-stat); font-weight: bold;';
                    valStr = '+' + val + '%';
                } else if (val < 0) {
                    colorStr = 'color: var(--bad-stat);';
                    valStr = val + '%';
                } else {
                    colorStr = 'color: var(--text-muted);';
                }
            } else {
                colorStr = 'color: var(--text-muted);';
            }

            row += `<td style="${colorStr} text-align: center;">${valStr}</td>`;
        });

        row += `</tr>`;
        htmlRows += row;
    });

    tbody.innerHTML = htmlRows;
}

window.sortRefineryTable = sortRefineryTable;
window.generateRefineryTable = generateRefineryTable;