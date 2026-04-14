# ⛏️ MineCalc

**An advanced, standalone Mining Fleet Builder and Rock Cracker Calculator for Star Citizen.**

Live version available at: [minecalc.itssilly.xyz](https://minecalc.itssilly.xyz)

---

## 🚀 Overview

MineCalc is a lightweight, blazing-fast web tool designed for Star Citizen miners. Whether you are running a solo Prospector or managing a multi-crew MOLE fleet, MineCalc allows you to theory-craft loadouts, calculate complex in-game mining modifiers and analyze rock crackability on the fly. 

Built with pure HTML, CSS, and Vanilla JavaScript—no frameworks, no build steps and zero lag.

## ✨ Key Features

* **🛸 Dynamic Fleet Builder**
  * Add, rename, and manage multiple ships (ARGO MOLE, MISC Prospector, Drake Golem).
  * Toggle individual operator seats on or off to calculate total fleet power dynamically.
* **⚙️ Advanced Loadout Customization**
  * Equip Lasers, Active/Passive Modules, and Gadgets.
  * Accurately calculates Star Citizen's unique **Hybrid Multiplicative** math system for stats like Optimal Window, Charge Rates, Shatter, and Cluster modifiers.
* **🪨 Rock Cracker Analysis**
  * Input scanned Rock Mass, Resistance, and Instability.
  * Instantly tells you if a rock is *Crackable*, *Difficult* or *Impossible* based on your current fleet loadout.
  * Smart toggle to account for whether gadgets were applied *before* or *after* the initial rock scan.
* **📖 Rock Reader & Signature Database**
  * Live-search database for remote cluster signatures (e.g., typing `11610` instantly highlights the match).
  * Automatically calculates cluster multiples (e.g., "3x Cluster") while strictly respecting in-game rarity limits (Legendary 2x, Epic 3x, etc.).
  * Expandable UI to view all possible cluster sizes and ratings at a glance.
* **💾 Secure Import & Export**
  * Export individual ships or your entire fleet layout to a lightweight `.json` file.
  * Includes a background security check to prevent corrupted or maliciously edited files from breaking the UI upon import.

## 🏆 Credits & Data Source

A massive thank you to **[UEX Corp](https://uexcorp.space/)** for providing the raw item statistics. MineCalc relies entirely on their fantastic community database for the baseline numbers (Lasers, Modules, Gadgets and Refinery Data) that power the calculator.

## 🤝 Connect

* **Discord:** itss_illy
* **GitHub:** [@itssilly4u](https://github.com/itssilly4u)
* **Website:** [itssilly.xyz](https://itssilly.xyz)
