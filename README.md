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
* **📖 Signature & Rarity Intelligence**
  * Custom-built signature database for remote scanning.
  * Smart-logic that calculates cluster multiples while strictly enforcing in-game rarity caps (Legendary, Epic, etc.).
* **💹 Market & Refinery Integration**
  * Regularly updated data pipeline providing fresh market prices and refinery yields. *(Note: A fully automated 12-hour cloud synchronization via GitHub Actions is currently in active development!)*
  * **Interactive Price cards:** Contextual market data for every ore, featuring regional "Best Price" tooltips and expanded outlet lists.

## 🛠️ Tech Stack

* **Logic Engine:** Vanilla JavaScript (Math-intensive simulation logic).
* **UI/UX:** HTML5 & CSS3 with a focus on scannability and "at-a-glance" data.
* **Automation:** Node.js script engine for rapid data processing and synchronization.

## 🏆 Data Sources

MineCalc's intelligence is powered by baseline statistics and market pricing graciously provided by the **[UEX Corp API](https://uexcorp.space/)**. Their community-driven data serves as the foundation for the calculations performed by the MineCalc engine.

## 🤝 Connect

* **Discord:** itss_illy
* **GitHub:** [@itssilly4u](https://github.com/itssilly4u)
* **Website:** [itssilly.xyz](https://itssilly.xyz)