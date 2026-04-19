# ⛏️ MineCalc

**A high-performance Mining Intelligence Engine and Fleet Management suite for Star Citizen.**

Live version available at: [minecalc.itssilly.xyz](https://minecalc.itssilly.xyz)

---

## 🚀 Overview

MineCalc is a sophisticated "Mining Brain" built to handle the complex variables of Star Citizen's mining ecosystem. While most tools simply list stats, MineCalc uses a **proprietary calculation engine** to simulate real-world mining scenarios, from multi-crew MOLE operations to solo prospecting in the belts of Pyro.

Built with **Zero-Framework Vanilla JS**, it delivers desktop-grade performance with zero lag, even when calculating high-complexity fleet modifiers.

## ✨ Key Features

* **🧠 Advanced Mining Engine**
  * Implements the full **Hybrid Multiplicative** math system used by Star Citizen for calculating Optimal Windows, Charge Rates, and Shatter Damage.
  * Real-time "Crackability" simulation: Instantly analyzes Rock Mass vs. Fleet Power to categorize rocks as *Crackable*, *Difficult*, or *Impossible*.
* **🛸 Multi-Crew Fleet Management**
  * Custom ship builder (MOLE, Prospector) with seat-specific loadouts.
  * Toggle operator seats dynamically to see how crew count affects your total mining throughput.
* **📍 Precision Location Intelligence**
  * System-exclusive ore mapping (Stanton, Pyro, Nyx) strictly enforcing patch-accurate spawn tables.
  * Custom-weighted sorting algorithms (Stanton priority) and multi-line hover tooltips for instant, readable scouting intel.
* **📖 Signature & Rarity Intelligence**
  * Custom-built signature database for remote scanning.
  * Smart-logic that calculates cluster multiples while strictly enforcing in-game rarity caps (Legendary, Epic, etc.).
* **💹 Market & Refinery Integration**
  * **Fully Automated Pipeline:** Market prices and stats are synchronized every 12 hours via a custom GitHub Actions infrastructure.
  * **Interactive Price cards:** Contextual market data for every ore, featuring regional "Best Price" tooltips and gracefully responsive grid layouts.

## 🛠️ Tech Stack

* **Logic Engine:** Vanilla JavaScript (Math-intensive simulation logic).
* **UI/UX:** HTML5 & CSS3 with a focus on Flexbox/Grid scalability and "at-a-glance" data.

## 🏆 Data Sources

Market pricing, trade locations, and equipment statistics (mining lasers, modules, and gadgets) are graciously provided by the **[UEX Corp API](https://uexcorp.space/)**. Their community-driven data ensures your fleet is always outfitted with the most up-to-date hardware and commodity values.

## 🐛 Feedback & Bug Reports

MineCalc is an actively maintained passion project, but the Star Citizen universe changes rapidly! 

**A Note on Locations:** With the introduction of the new Precision Location Intelligence feature, ore spawn tables are now mapped to specific moons and mining bases. Because CIG frequently tweaks these spawn rates and exclusivity rules from patch to patch, there may be locations that are outdated, incorrect, or missing entirely. 

If you spot an inaccurate location, find a bug, or just have a great idea for a new feature, please don't hesitate to reach out. You can open an issue here on GitHub, or contact me directly:

* **Discord:** itss_illy
* **GitHub:** [@itssilly4u](https://github.com/itssilly4u)