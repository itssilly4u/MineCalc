function createOperatorHtml(opId, seatName, laserOptions) {
    return `
        <div class="setup-card" id="card-${opId}" data-opid="${opId}">
            <div class="card-header">
                <h3>${seatName}</h3>
                <label class="switch"><input type="checkbox" checked onchange="toggleOperator('${opId}', this.checked)"><span class="slider"></span></label>
            </div>
            <div class="form-group"><label>Laser Head</label><div class="custom-select" id="cs-laser-${opId}" data-value="0" onclick="toggleCS(this)"><div class="cs-display">None</div><div class="cs-options">${laserOptions}</div></div></div>
            ${[1,2,3].map(m => `<div class="form-group"><label>Module ${m}</label><div class="custom-select disabled" id="cs-mod${m}-${opId}" data-value="0" onclick="toggleCS(this)"><div class="cs-display">None</div><div class="cs-options">${modOptionsHtml}</div></div></div>`).join('')}
            <div class="operator-results">
                <div class="local-stat"><span class="label">Local Ext.</span><span class="value" id="op-ext-${opId}">0.0</span></div>
                <div class="local-stat"><span class="label">Local Inert</span><span class="value" id="op-inert-${opId}">0%</span></div>
                <div class="local-stat"><span class="label">Opt. Range</span><span class="value" id="op-optrange-${opId}">0m</span></div>
                <div class="local-stat"><span class="label">Max Range</span><span class="value" id="op-maxrange-${opId}">0m</span></div>
            </div>
        </div>`;
}

function addShip(type, loadConfig = null, customName = null) {
    const container = document.getElementById('fleet-container');
    const shipId = generateId();
    const shipDiv = document.createElement('div');
    shipDiv.className = 'ship-container';
    shipDiv.id = `ship-${shipId}`;
    shipDiv.dataset.type = type;

    if (type === 'MOLE') { shipDiv.style.order = '1'; } 
    else if (type === 'PROSPECTOR') { shipDiv.style.order = '2'; } 
    else if (type === 'GOLEM') { shipDiv.style.order = '3'; }

    let headerIcon = type === 'MOLE' ? '🟧' : (type === 'PROSPECTOR' ? '🟦' : '🟨');
    let displayName = customName ? escapeHTML(customName) : type;
    
    let operatorsHtml = "";
    let operatorIds = [];

    if (type === 'MOLE') {
        let seats = ['Center Seat', 'Port Seat', 'Starboard Seat'];
        seats.forEach(seat => {
            let opId = generateId();
            operatorIds.push(opId);
            operatorsHtml += createOperatorHtml(opId, seat, laserOptionsS2);
        });
    } else if (type === 'PROSPECTOR') {
        let opId = generateId();
        operatorIds.push(opId);
        operatorsHtml += createOperatorHtml(opId, 'Pilot Seat', laserOptionsS1);
    } else if (type === 'GOLEM') {
        let opId = generateId();
        operatorIds.push(opId);
        operatorsHtml += createOperatorHtml(opId, 'Pilot Seat', laserOptionsGolem);
    }

    shipDiv.innerHTML = `
        <div class="ship-header">
            <div class="ship-title-container">
                <h2>${headerIcon}</h2>
                <span class="ship-title-text" id="title-text-${shipId}" onclick="editShipName('${shipId}')">${displayName}</span>
                <span class="edit-icon" id="edit-icon-${shipId}" onclick="editShipName('${shipId}')">✏️</span>
                <input type="text" class="ship-name-input" id="title-input-${shipId}" value="${displayName}" maxlength="50" onblur="saveShipName('${shipId}')" onkeydown="if(event.key === 'Enter') saveShipName('${shipId}')">
            </div>
            <div class="ship-header-controls">
                <button class="btn btn-export" onclick="exportShip('${shipId}')">Export</button>
                <button class="btn btn-remove" onclick="removeShip('${shipId}')">Remove</button>
            </div>
        </div>
        <div class="setups-grid">${operatorsHtml}</div>
    `;

    container.appendChild(shipDiv);

    if (!loadConfig) {
        let defaultLaser = "None";
        if (type === 'MOLE') {
            let match = lasers.find(l => l.size === 2 && l.name.toLowerCase().includes('arbor'));
            if (match) defaultLaser = match.name;
            loadConfig = [
                { enabled: true, laser: defaultLaser, m1: "None", m2: "None", m3: "None" },
                { enabled: true, laser: defaultLaser, m1: "None", m2: "None", m3: "None" },
                { enabled: true, laser: defaultLaser, m1: "None", m2: "None", m3: "None" }
            ];
        } else if (type === 'PROSPECTOR') {
            let match = lasers.find(l => l.size === 1 && l.name.toLowerCase().includes('arbor'));
            if (match) defaultLaser = match.name;
            loadConfig = [ { enabled: true, laser: defaultLaser, m1: "None", m2: "None", m3: "None" } ];
        } else if (type === 'GOLEM') {
            let match = lasers.find(l => l.name.toLowerCase().includes('pitman'));
            if (match) defaultLaser = match.name;
            loadConfig = [ { enabled: true, laser: defaultLaser, m1: "None", m2: "None", m3: "None" } ];
        }
    }

    if (loadConfig) { 
        applyShipConfig(operatorIds, loadConfig); 
    } else {
        calculate();
    }
}

function clearFleet() {
    if (confirm("Are you sure you want to clear the entire fleet?")) {
        document.getElementById('fleet-container').innerHTML = '';
        calculate();
    }
}

function removeShip(shipId) {
    document.getElementById(`ship-${shipId}`).remove();
    calculate();
}

function editShipName(shipId) {
    document.getElementById(`title-text-${shipId}`).style.display = 'none';
    document.getElementById(`edit-icon-${shipId}`).style.display = 'none';
    let input = document.getElementById(`title-input-${shipId}`);
    input.style.display = 'block';
    input.focus();
    let val = input.value;
    input.value = '';
    input.value = val;
}

function saveShipName(shipId) {
    let input = document.getElementById(`title-input-${shipId}`);
    let text = document.getElementById(`title-text-${shipId}`);
    let icon = document.getElementById(`edit-icon-${shipId}`);

    let newName = input.value.trim();
    if (newName === '') {
        newName = document.getElementById(`ship-${shipId}`).dataset.type;
        input.value = newName;
    }

    text.innerText = newName;
    input.style.display = 'none';
    text.style.display = 'block';
    icon.style.display = 'block';
}

function triggerImport() {
    document.getElementById('import-file').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 15360) {
        alert("❌ File is too large. Valid loadouts are very small files.");
        event.target.value = ""; 
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            alert("❌ Invalid JSON file format! Make sure the file is not corrupted.");
            event.target.value = ""; 
            return;
        }

        try {
            if (data._hash !== undefined) {
                const providedHash = data._hash;
                delete data._hash; 
                if (providedHash !== generateHash(JSON.stringify(data))) {
                    alert("❌ Corrupted File: The contents have been modified or tampered with.");
                    event.target.value = ""; 
                    return;
                }
            }

            let dataType = data.type || (data.ships ? 'FLEET' : 'SHIP');

            if (dataType === 'FLEET' && data.ships) {
                if (data.ships.length > 20) {
                    alert("❌ Import failed: Fleet exceeds the maximum limit of 20 ships.");
                    event.target.value = ""; 
                    return;
                }
                
                if (confirm("Importing a Fleet will overwrite your current setup. Continue?")) {
                    document.getElementById('fleet-container').innerHTML = '';
                    data.ships.forEach(s => {
                        let type = s.shipType || s.type;
                        if (type === 'SHIP' || !type) type = (s.operators && s.operators.length > 1 ? 'MOLE' : 'PROSPECTOR');
                        addShip(type, s.operators, s.customName);
                    });
                }
            } else if (dataType === 'SHIP' || data.operators) {
                let type = data.shipType || data.type;
                if (type === 'SHIP' || !type) type = (data.operators && data.operators.length > 1 ? 'MOLE' : 'PROSPECTOR');
                addShip(type, data.operators, data.customName);
            } else {
                alert("❌ Unrecognized file format. Are you sure this is a Minecalc save?");
            }
        } catch (err) { 
            console.error("Interface Error:", err);
        }
        
        event.target.value = ""; 
    };
    reader.readAsText(file);
}

function exportFleet() {
    let fleet = { type: 'FLEET', ships: [] };
    document.querySelectorAll('.ship-container').forEach(ship => {
        fleet.ships.push(extractShipData(ship));
    });
    downloadJsonWithHash(fleet, 'minecalc-fleet.json');
}

function exportShip(shipId) {
    const ship = document.getElementById(`ship-${shipId}`);
    let data = extractShipData(ship);
    data.type = 'SHIP';
    
    let filename = `minecalc-${data.shipType.toLowerCase()}.json`;
    if (data.customName && data.customName !== data.shipType) {
        let safeName = data.customName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        filename = `${safeName}.json`;
    }
    
    downloadJsonWithHash(data, filename);
}

function extractShipData(shipDiv) {
    let titleText = shipDiv.querySelector('.ship-title-text').innerText;
    let data = { shipType: shipDiv.dataset.type, customName: titleText, operators: [] };
    
    shipDiv.querySelectorAll('.setup-card').forEach(card => {
        let opId = card.dataset.opid;
        let laserId = document.getElementById(`cs-laser-${opId}`).dataset.value;
        data.operators.push({
            enabled: !card.classList.contains('off'),
            laser: lasers[laserId].name,
            m1: modules[document.getElementById(`cs-mod1-${opId}`).dataset.value].name,
            m2: modules[document.getElementById(`cs-mod2-${opId}`).dataset.value].name,
            m3: modules[document.getElementById(`cs-mod3-${opId}`).dataset.value].name
        });
    });
    return data;
}

function downloadJsonWithHash(obj, filename) {
    const jsonString = JSON.stringify(obj);
    obj._hash = generateHash(jsonString); 
    
    const finalStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
    const el = document.createElement('a');
    el.setAttribute("href", finalStr);
    el.setAttribute("download", filename);
    document.body.appendChild(el);
    el.click();
    el.remove();
}

function applyShipConfig(operatorIds, opConfigs) {
    operatorIds.forEach((opId, index) => {
        let conf = opConfigs[index];
        if (!conf) return;

        if (conf.enabled === false) {
            const cardToggle = document.getElementById(`card-${opId}`);
            if (cardToggle) {
                cardToggle.querySelector('.switch input').checked = false;
                cardToggle.classList.add('off');
            }
        }

        const setSelect = (elId, nameToFind, list) => {
            let idx = list.findIndex(i => i.name === nameToFind);
            if (idx > 0) {
                let el = document.getElementById(elId);
                if (el) {
                    el.dataset.value = idx;
                    el.querySelector('.cs-display').innerText = list[idx].name;
                }
            }
        };

        setSelect(`cs-laser-${opId}`, conf.laser, lasers);
        
        let lIdx = lasers.findIndex(i => i.name === conf.laser);
        let currentLaser = lIdx > 0 ? lasers[lIdx] : { slots: 0 };
        
        for (let m=1; m<=3; m++) {
            let el = document.getElementById(`cs-mod${m}-${opId}`);
            if (el) {
                if (m <= currentLaser.slots) {
                    el.classList.remove('disabled');
                } else { 
                    el.classList.add('disabled'); 
                    el.dataset.value = 0; 
                    el.querySelector('.cs-display').innerText = 'None'; 
                }
            }
        }
        
        setSelect(`cs-mod1-${opId}`, conf.m1, modules);
        setSelect(`cs-mod2-${opId}`, conf.m2, modules);
        setSelect(`cs-mod3-${opId}`, conf.m3, modules);
    });
    
    calculate();
}

function toggleCS(container) {
    if (container.classList.contains('disabled')) return;
    let wasOpen = container.classList.contains('open');
    document.querySelectorAll('.custom-select').forEach(el => { el.classList.remove('open'); el.querySelector('.cs-options').style.display = 'none'; });
    if (!wasOpen) { container.classList.add('open'); container.querySelector('.cs-options').style.display = 'block'; }
}

function selectCSOption(e, el, type) {
    e.stopPropagation();
    let c = el.closest('.custom-select');
    c.dataset.value = el.dataset.val;
    c.querySelector('.cs-display').innerText = el.innerText;
    c.classList.remove('open');
    c.querySelector('.cs-options').style.display = 'none';
    hidePreview();
    if (type === 'laser') handleLaserChange(c.id.split('-').pop());
    else calculate();
}

function toggleOperator(opId, state) { document.getElementById(`card-${opId}`).classList.toggle('off', !state); calculate(); }

function handleLaserChange(opId) {
    let l = lasers[document.getElementById(`cs-laser-${opId}`).dataset.value];
    for (let m=1; m<=3; m++) {
        let el = document.getElementById(`cs-mod${m}-${opId}`);
        if (m <= l.slots) el.classList.remove('disabled');
        else { el.classList.add('disabled'); el.dataset.value = 0; el.querySelector('.cs-display').innerText = 'None'; }
    }
    calculate();
}

function addGadgetRow() {
    const list = document.getElementById('gadget-list');
    const row = document.createElement('div');
    row.className = 'gadget-row';
    row.innerHTML = `
        <div class="custom-select gadget-select" data-value="0" onclick="toggleCS(this)">
            <div class="cs-display">None</div>
            <div class="cs-options">${gadgetOptionsHtml}</div>
        </div>
        <button class="btn btn-remove" onclick="this.parentElement.remove(); calculate();">Remove</button>
    `;
    list.appendChild(row);
    calculate();
}

function toggleAccordion(headerElement) {
    headerElement.classList.toggle('active');
    const contentElement = headerElement.nextElementSibling;
    contentElement.style.display = headerElement.classList.contains('active') ? 'block' : 'none';
}