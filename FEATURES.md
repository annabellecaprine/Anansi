# Features of Anansi v1.18

Anansi is a professional-grade narrative simulation engine and character authoring suite. It bridges the gap between static character cards, dynamic AI personalities, and fully simulated tabletop RPG worlds.

---

## 🌍 World Weaver 2.0
*The Collaborative World Architect*
A guided interview partner that helps you build entire worlds from scratch.
- **Brainstorm Mode**: A creative sandbox with "Spark" functionality for generating wild twists and "Yes, and..." co-authoring.
- **Living Lore**: Automatically detects new entities (factions, places, people) in your chat and suggests adding them to your world bible instantly.
- **Structured Dossiers**: Generates deep psychological profiles giving characters authentic voices, internal conflicts, and grounded histories.
- **World Bible Export**: Compiles your entire world (Rules, Setting, Cast, Plot) into a beautifully formatted Markdown Bible.

---

## ⚔️ The RPG Engine
*A Complete Tabletop Simulator*
Turn your narrative into a playable Game Mastered experience.
- **Combat System**: Full turn-based combat with Initiative, Action Economy (Main/Bonus), and automated Monster AI.
- **Quest System**: Create multi-stage quest chains with Kill, Fetch, Visit, and Talk objectives.
- **Loot & Economy**: Manage Gold, Shops, and randomized Loot Tables. Drop "Corpse Containers" on death.
- **Bestiary**: A database of Monsters and NPCs with auto-leveling and equipment slots.
- **Leveling**: Configurable XP curves (D&D 5e, Linear, Custom) with automated Class Benefits and Stat growth.

---

## 🗺️ Hina's Travel Guide
*Dynamic Map Builder*
- **Procedural Mapping**: Generate connected world maps based on genre templates (Hub & Spoke, Grid, Linear).
- **Dynamic Gates**: Locations can open/close based on Time of Day or Logic Keys (e.g. "VIP Pass").
- **Visual Editor**: Drag-and-drop location nodes, assign encounters, and link loot tables.

---

## 🕰️ Chronos & The Simulator
*The Narrative Runtime*
- **Chronos Chat**: An immersive roleplay interface that respects World State, Time of Day, and Location.
- **The Spindle**: A transparent debugging environment. See the raw prompt, logic injections, and decision trees in real-time.
- **Living Simulation**: NPCs have independent states, memories, and dispositions that persist between conversations.

---

## 🧠 AURA Logic System
*No-Code Narrative Logic*
- **Visual Scripting**: Create complex "If/Else" triggers based on user keywords, message sentiment, or story flags.
- **MicroCues**: Subtle behavioral biases (e.g. *Shyness*, *Aggression*) that influence AI output without breaking character.
- **Event Engine**: Trigger world-changing events, text injections, or stat shifts based on narrative milestones.
- **AuraBuilder**: Export your logic as standalone payloads for use in other frontends.

---

## 🛠️ The Creative Studio
- **Writer's Block**: AI writing assistant with "Brainstorm" and "Edit" modes for drafting prose.
- **Spider's Parlor**: Advanced Prompt Engineering workbench for tuning the underlying LLM instructions.
- **Nabu**: A rule generator that turns natural language requirements into strict JSON logic.
- **The Vault**: A cross-project asset library. Share Actors, Rules, and Maps between different stories.

---

## 🔌 Technical & Deployment
- **Offline First**: All data is stored locally via IndexedDB. Your world is yours.
- **Universal Export**: One-click adapters for SillyTavern, JanitorAI, and Chub.ai.
- **Mobile Native**: Fully responsive design with touch-optimized controls and Android APK support.
- **OpenRouter & Local LLM**: agnostic backend support for cloud or local AI models.
