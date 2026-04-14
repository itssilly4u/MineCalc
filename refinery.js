const systemMap = {
    "ST": "Stanton",
    "PY": "Pyro",
    "NX": "Nyx"
};

const systemColors = {
    "Stanton": "#4fa3e3",   // Light Blue
    "Nyx": "#b164e8",       // Vibrant Purple
    "Pyro": "#e88e3c"       // Fiery Orange
};

// Memory for our sorter
let currentSortCol = 'Refinery';
let isSortAsc = true; // true = A-Z or Min-Max, false = Z-A or Max-Min

// The function triggered when clicking a header
window.sortRefineryTable = (col) => {
    if (currentSortCol === col) {
        // Reverse direction if clicking the same column
        isSortAsc = !isSortAsc;
    } else {
        // Change column. Default to A-Z for text, Max-Min for ores.
        currentSortCol = col;
        isSortAsc = (col === 'Refinery' || col === 'System') ? true : false;
    }
    window.generateRefineryTable(); // Re-render
};

window.generateRefineryTable = () => {
    const table = document.getElementById('refinery-table');
    const thead = table.querySelector('thead tr');
    const tbody = document.getElementById('refinery-table-body');

    if (!tbody || !thead || !refineryData || refineryData.length === 0) return;

    // Clear existing headers
    thead.innerHTML = '';

    const ignoreKeys = ["Refinery", "", "__1", "__2"];
    const oreKeys = Object.keys(refineryData[0]).filter(k => !ignoreKeys.includes(k)).sort();

    // 1. Build Interactive Headers
    const buildHeader = (label, sortKey) => {
        const th = document.createElement('th');
        th.style.cursor = 'pointer';
        th.title = `Sort by ${label}`;
        
        // Force the text and arrow to stay on a single line
        th.style.whiteSpace = 'nowrap'; 
        
        th.onclick = () => sortRefineryTable(sortKey);
        
        let arrow = '';
        if (currentSortCol === sortKey) {
            // Using &nbsp; (non-breaking space) instead of a regular space
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

    // 2. Sort the Data Array
    let sortedData = [...refineryData].sort((a, b) => {
        let valA, valB;

        // Determine what we are comparing
        if (currentSortCol === 'System') {
            valA = systemMap[a[""]] || a[""];
            valB = systemMap[b[""]] || b[""];
        } else {
            valA = a[currentSortCol];
            valB = b[currentSortCol];
        }

        // Apply sorting math
        if (valA < valB) return isSortAsc ? -1 : 1;
        if (valA > valB) return isSortAsc ? 1 : -1;
        return 0;
    });

    // 3. Render the Rows
    let htmlRows = "";
    sortedData.forEach(ref => {
        const sysName = systemMap[ref[""]] || ref[""];
        const sysColor = systemColors[sysName] || "var(--text-muted)";
        
        let row = `<tr>
            <td style="font-weight: bold; white-space: nowrap;">${ref.Refinery}</td>
            <td style="color: ${sysColor}; font-weight: bold; font-size: 0.9em;">${sysName}</td>`;

        oreKeys.forEach(ore => {
            const val = ref[ore];
            let colorStr = "";
            let valStr = val + "%";

            if (val > 0) {
                colorStr = 'color: var(--good-stat); font-weight: bold;';
                valStr = '+' + val + '%';
            } else if (val < 0) {
                colorStr = 'color: var(--bad-stat);';
            } else {
                colorStr = 'color: var(--text-muted);';
            }

            // Center align the numbers so they look neat under the headers
            row += `<td style="${colorStr} text-align: center;">${valStr}</td>`;
        });

        row += `</tr>`;
        htmlRows += row;
    });

    tbody.innerHTML = htmlRows;
};