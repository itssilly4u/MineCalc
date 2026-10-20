/* ==========================================================================
   CUSTOM MODULES — TEMPORARY UEX BRIDGE
   ==========================================================================
   A staging area for Star Citizen modules that exist in-game but are not yet
   in the auto-generated `game-data.js` (the UEX pipeline).

   HOW IT WORKS
   -----------
   * This file loads AFTER `game-data.js` and BEFORE `calculator.js` / `app.js`.
   * It appends every module defined below to the shared `modules` array so the
     modules are fully usable immediately (seat dropdowns, hover tooltips, the
     cart, and the calculation engine) — no other code changes needed.
   * AUTOMATIC OVERRIDE: before adding a module, we check whether a module with
     the SAME NAME already exists in `modules` (i.e. UEX has since added it to
     `game-data.js`). If it does, we SKIP our temporary copy and let the official
     game-data.js entry win (including its real prices and shops).

   So: drop any brand-new module into `customModules` below, and the moment UEX
   ships one with the matching name, the app automatically switches to the
   official data and this temporary entry is ignored. No cleanup required.

   NOTE ON CRAFT-ONLY MODULES
   --------------------------
   These temporary modules have no price and can only be crafted, so `shops` is
   an empty array (`[]`). The cart already renders empty shops as a disabled
   selector (see CartSystem.render in app.js), which we relabel to
   "Crafted — not sold in shops" via the `crafted: true` flag.

   SCHEMA
   ------
   Keep the same field names as `modules` in game-data.js:
     name, power, extraction, uses, inert, resistance, instability,
     optimalWin, optCharge, overcharge, shatter, cluster, shops
   `uses > 0` marks a module as Active (it lands in the "Active Modules" group);
   `uses === 0` marks it Passive. `duration` (seconds) and `crafted` are
   optional extras that only affect the UI, not the calculations.
   ========================================================================== */

const customModules = [
    // --- Deluge Module (Passive) -------------------------------------------
    {
        "name": "Deluge Module (Passive)",
        "power": 15,        // Mining Laser Power: +15%
        "extraction": 0,
        "uses": 0,          // Passive
        "inert": 0,
        "resistance": -15.5,// Deposit Resistance: -15.5%
        "instability": 0,
        "optimalWin": 0,
        "optCharge": 0,
        "overcharge": 0,
        "shatter": 0,
        "cluster": 0,
        "crafted": true,
        "shops": []
    },

    // --- Overrun Module (Passive) ------------------------------------------
    {
        "name": "Overrun Module (Passive)",
        "power": 0,
        "extraction": 0,
        "uses": 0,          // Passive
        "inert": 0,
        "resistance": -25,  // Deposit Resistance: -25%
        "instability": 0,
        "optimalWin": 0,
        "optCharge": 0,
        "overcharge": 0,
        "shatter": -10,     // Shatter Damage: -10%
        "cluster": 0,
        "crafted": true,
        "shops": []
    },

    // --- Clearcut Module (Active) ------------------------------------------
    {
        "name": "Clearcut Module (Active)",
        "power": 15,        // Mining Laser Power: +15%
        "extraction": 0,
        "uses": 6,          // Active: 6 charges
        "inert": 0,
        "resistance": 0,
        "instability": 0,
        "optimalWin": 30,   // Optimal Charge Window Size: +30%
        "optCharge": 0,
        "overcharge": 0,
        "shatter": 0,
        "cluster": 0,
        "duration": 30,     // Duration: 30 seconds (informational, not used in math)
        "crafted": true,
        "shops": []
    }
];

// --- Merge: append any module that is NOT already in game-data.js ---------
(function mergeCustomModules() {
    // `modules` is a top-level const array declared in game-data.js; it is
    // visible to all classic scripts on the page. Guard against it being absent
    // (e.g. this file loaded out of order) so nothing throws.
    if (typeof modules === 'undefined' || !Array.isArray(modules)) return;

    const normalize = (n) => (n || '').toString().trim().toLowerCase();
    const existingNames = new Set(modules.map(m => normalize(m.name)));

    for (const cm of customModules) {
        const key = normalize(cm.name);
        // If UEX has already added this module (same name) to game-data.js, the
        // official entry wins — skip our temporary copy entirely.
        if (existingNames.has(key)) continue;
        modules.push(cm);
        existingNames.add(key);
    }
})();
