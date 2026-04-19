// Data for ores in the Rock Reader app
const ores = [
    // Non-ore standard signatures retained from previous version
    { name: "Debris", signature: 2000 },
    { name: "Ground Vehicle Deposits", signature: 3000 },
    { name: "FPS Mineables", signature: 4000 },

    // Legendary
    { name: "Quantanium", rarity: "Legendary", secondary: "Beryl", signature: 3170, instability: 1000, resistance: 95, density: 2930, locationNote: "Stanton Only" },
    { name: "Stileron", rarity: "Legendary", secondary: "Taranite", signature: 3185, instability: 870, resistance: 60, density: 681, locationNote: "Pyro Only" },
    { name: "Savrilium", rarity: "Legendary", secondary: "Gold", signature: 3200, instability: 1000, resistance: 95, density: 2588, locationNote: "Nyx Only" },

    // Epic
    { name: "Riccite", rarity: "Epic", secondary: "Laranite", signature: 3385, instability: 850, resistance: 95, density: 229, locationNote: "Pyro Only" },
    { name: "Ouratite", rarity: "Epic", secondary: "Agricium", signature: 3370, instability: 600, resistance: 60, density: 158 },
    { name: "Lindinium", rarity: "Epic", secondary: "Tungsten", signature: 3400, instability: 1000, resistance: 95, density: 340, locationNote: "Nyx Only" },

    // Rare
    { name: "Taranite", rarity: "Rare", signature: 3555, instability: 700, resistance: 50, density: 1462 },
    { name: "Gold", rarity: "Rare", secondary: "Borase", tertiary: "Bexalite", signature: 3585, instability: 550, resistance: 50, density: 2768 },
    { name: "Borase", rarity: "Rare", secondary: "Bexalite", tertiary: "Gold", signature: 3570, instability: 40, resistance: 30, density: 645 },
    { name: "Beryl", rarity: "Rare", signature: 3540, instability: 350, resistance: 65, density: 394 },
    { name: "Bexalite", rarity: "Rare", secondary: "Borase", tertiary: "Gold", signature: 3600, instability: 600, resistance: 60, density: 989 },

    // Uncommon
    { name: "Tungsten", rarity: "Uncommon", secondary: "Laranite", signature: 3870, instability: 0, resistance: -40, density: 2766 },
    { name: "Torite", rarity: "Uncommon", signature: 3900, instability: 550, resistance: 25, density: 401 },
    { name: "Titanium", rarity: "Uncommon", secondary: "Agricium", tertiary: "Aslarite", signature: 3855, instability: 0, resistance: 10, density: 645 },
    { name: "Laranite", rarity: "Uncommon", secondary: "Tungsten", signature: 3825, instability: 400, resistance: 50, density: 1648 },
    { name: "Aslarite", rarity: "Uncommon", secondary: "Agricium", tertiary: "Titanium", signature: 3840, instability: 700, resistance: 50, density: 329 },
    { name: "Agricium", rarity: "Uncommon", secondary: "Aslarite", tertiary: "Titanium", signature: 3885, instability: 350, resistance: 50, density: 1032 },

    // Common
    { name: "Aluminium", rarity: "Common", secondary: "Corundum", signature: 4285, instability: 0, resistance: -40, density: 387 },
    { name: "Copper", rarity: "Common", secondary: "Tin", signature: 4240, instability: 50, resistance: -70, density: 1284 },
    { name: "Corundum", rarity: "Common", secondary: "Aluminium", signature: 4225, instability: 50, resistance: 10, density: 576 },
    { name: "Hephaestanite", rarity: "Common", secondary: "Quartz", tertiary: "Silicon", signature: 4180, instability: 550, resistance: 50, density: 459 },
    { name: "Ice", rarity: "Common", signature: 4300, instability: 0, resistance: -50, density: 143 },
    { name: "Iron", rarity: "Common", signature: 4270, instability: 50, resistance: -40, density: 1128 },
    { name: "Quartz", rarity: "Common", secondary: "Hephaestanite", tertiary: "Silicon", signature: 4210, instability: 50, resistance: -70, density: 380 },
    { name: "Silicon", rarity: "Common", secondary: "Hephaestanite", signature: 4255, instability: 50, resistance: -20, density: 335 },
    { name: "Tin", rarity: "Common", secondary: "Copper", signature: 4195, instability: 0, resistance: -20, density: 827 }
];


const locationDB = {
    "Aaron's Halo": { system: "Stanton", ship: ["Beryl", "Aslarite", "Titanium", "Ice", "Silicon", "Aluminium", "Iron", "Copper", "Quantanium"] },
    "Aberdeen": { system: "Stanton", ship: ["Aluminium", "Titanium", "Ouratite", "Quantanium"] },
    "Adir": { system: "Pyro", ship: ["Iron", "Tungsten", "Borase", "Riccite"] },
    "ARC-L1": { system: "Stanton", ship: ["Tungsten", "Taranite", "Corundum", "Aluminium", "Hephaestanite"] },
    "ARC-L2": { system: "Stanton", ship: ["Tungsten", "Taranite", "Corundum", "Aluminium", "Hephaestanite"] },
    "ARC-L3": { system: "Stanton", ship: ["Agricium", "Beryl", "Iron", "Ice", "Copper"] },
    "ARC-L4": { system: "Stanton", ship: ["Tungsten", "Taranite", "Corundum", "Aluminium", "Hephaestanite"] },
    "ARC-L5": { system: "Stanton", ship: ["Aslarite", "Gold", "Iron", "Ice", "Copper"] },
    "Arial": { system: "Stanton", ship: ["Aluminium", "Tin", "Hephaestanite", "Corundum", "Ouratite", "Quantanium"] },
    "Bloom": { system: "Pyro", ship: ["Quartz", "Borase", "Riccite", "Stileron"] },
    "Breaker Stations": { system: "Nyx", ship: ["Savrilium", "Torite"] },
    "Calliope": { system: "Stanton", ship: ["Iron", "Ice", "Hephaestanite", "Quantanium"] },
    "Cellin": { system: "Stanton", ship: ["Quartz", "Agricium", "Taranite", "Quantanium"] },
    "Clio": { system: "Stanton", ship: ["Ice", "Copper", "Taranite", "Quantanium"] },
    "CRU-L1": { system: "Stanton", ship: ["Titanium", "Bexalite", "Iron", "Ice", "Copper"] },
    "CRU-L2": { system: "Stanton", ship: ["Titanium", "Bexalite", "Iron", "Ice", "Copper"] },
    "CRU-L4": { system: "Stanton", ship: ["Aslarite", "Gold", "Iron", "Ice", "Copper"] },
    "CRU-L5": { system: "Stanton", ship: ["Agricium", "Beryl", "Iron", "Ice", "Copper"] },
    "Daymar": { system: "Stanton", ship: ["Quartz", "Agricium", "Silicon", "Quantanium", "Titanium"] },
    "Euterpe": { system: "Stanton", ship: ["Ice", "Copper", "Taranite", "Quantanium"] },
    "Fairo": { system: "Pyro", ship: ["Silicon", "Tungsten", "Gold", "Bexalite"] },
    "Fuego": { system: "Pyro", ship: ["Hephaestanite", "Aslarite", "Borase", "Bexalite"] },
    "Glaciem Ring": { system: "Nyx", ship: ["Torite", "Bexalite", "Ice", "Aluminium", "Iron", "Lindinium", "Savrilium"] },
    "HUR-L1": { system: "Stanton", ship: ["Laranite", "Borase", "Aluminium", "Corundum", "Hephaestanite"] },
    "HUR-L2": { system: "Stanton", ship: ["Tungsten", "Taranite", "Corundum", "Aluminium", "Hephaestanite"] },
    "HUR-L3": { system: "Stanton", ship: ["Titanium", "Bexalite", "Iron", "Ice", "Copper"] },
    "HUR-L4": { system: "Stanton", ship: ["Laranite", "Borase", "Aluminium", "Corundum", "Hephaestanite"] },
    "HUR-L5": { system: "Stanton", ship: ["Torite", "Aluminium", "Corundum", "Hephaestanite"] },
    "Hurston": { system: "Stanton", ship: ["Aluminium", "Tin", "Ouratite", "Quantanium"] },
    "Ignis": { system: "Pyro", ship: ["Tin", "Silicon", "Gold", "Riccite"] },
    "Ita": { system: "Stanton", ship: ["Aluminium", "Tin", "Aslarite", "Quantanium"] },
    "Keeger Belt": { system: "Nyx", ship: ["Torite", "Bexalite", "Ice", "Aluminium", "Iron", "Lindinium", "Savrilium"] },
    "Lyria": { system: "Stanton", ship: ["Iron", "Copper", "Laranite", "Quantanium"] },
    "Magda": { system: "Stanton", ship: ["Aluminium", "Titanium", "Aslarite", "Quantanium"] },
    "MIC-L1": { system: "Stanton", ship: ["Torite", "Aluminium", "Corundum", "Hephaestanite"] },
    "MIC-L2": { system: "Stanton", ship: ["Torite", "Aluminium", "Corundum", "Hephaestanite"] },
    "MIC-L3": { system: "Stanton", ship: ["Aslarite", "Gold", "Iron", "Ice", "Copper"] },
    "MIC-L4": { system: "Stanton", ship: ["Agricium", "Beryl", "Iron", "Ice", "Copper"] },
    "MIC-L5": { system: "Stanton", ship: ["Torite", "Aluminium", "Corundum", "Hephaestanite"] },
    "MicroTech": { system: "Stanton", ship: ["Iron", "Ice", "Hephaestanite", "Quantanium"] },
    "Mining Bases": { system: "Stanton", ship: ["Quantanium", "Beryl", "Titanium", "Aslarite", "Aluminium", "Copper", "Ice", "Iron", "Silicon"] },
    "Monox": { system: "Pyro", ship: ["Hephaestanite", "Iron", "Tin", "Stileron"] },
    "Pyro I": { system: "Pyro", ship: ["Iron", "Copper", "Tin", "Stileron"] },
    "Pyro IV": { system: "Pyro", ship: ["Copper", "Laranite", "Borase", "Stileron"] },
    "RABs and RMBs": { system: "Pyro", ship: ["Torite", "Aluminium", "Corundum", "Quartz", "Tin", "Riccite", "Stileron"] },
    "Terminus": { system: "Pyro", ship: ["Ice", "Copper", "Agricium", "Titanium", "Gold", "Riccite", "Stileron"] },
    "Vatra": { system: "Pyro", ship: ["Iron", "Silicon", "Gold", "Riccite"] },
    "Vuur": { system: "Pyro", ship: ["Hephaestanite", "Agricium", "Aslarite", "Bexalite"] },
    "Wala": { system: "Stanton", ship: ["Iron", "Laranite", "Beryl", "Quantanium"] },
    "Yela": { system: "Stanton", ship: ["Quartz", "Agricium", "Taranite", "Silicon", "Quantanium"] },
    "Yela's Asteroid Belt": { system: "Stanton", ship: ["Titanium", "Iron", "Ice", "Copper", "Ouratite"] }
};