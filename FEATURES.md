# Features of Anansi

Anansi is a professional-grade narrative simulation engine and character authoring suite designed to bridge the gap between static character cards and dynamic, logic-driven AI personalities.

---

## 🏛️ The Anansi Vault
*A centralized, cross-project asset management system.*
The Vault acts as your personal "GitHub" for creative assets, allowing you to build a reusable library of narrative blocks.

- **Localized Asset Library**: Store Actors, Lorebook entries, Voice Configs, and Logic Rules in a persistent database separate from your projects.
- **Publish-Push-Pull Workflow**: 
  - **Publish**: Ship local items to the Vault with unique identifiers.
  - **Pull**: Import Vault assets into any new or existing project.
  - **Push**: Update the master copy in the Vault when you improve an item locally.
- **Universal Organization**: Group your assets into **Universes** (e.g., *Cyberpunk*, *Dark Fantasy*) and use a robust tagging system for instant discovery.
- **Asset Portability**: Export your entire Vault to `.vault` files for backup or sharing.

---

## ✍️ The Writer's Block
*An AI-powered creative assistant for brainstorming and drafting.*
A specialized environment for breaking through creative walls and expanding your narrative.

- **Dual-Mode Workflow**: Toggle between **Brainstorm** (ideation) and **Edit** (refining existing text) modes.
- **Context Injection**: Automatically inject Actor and Location data into your prompts for hyper-relevant suggestions.
- **Genre & Emphasis Chips**: Quickly steer the AI's output with pre-defined genre and stylistic emphasis toggles.
- **Smart Session Management**: Sliding context window with auto-summarization to keep long brainstorming sessions coherent.
- **Markdown Export**: Direct export of your writing sessions for use in external editors.

---

## 🎭 Unified Character Designer
*Deep character synthesis with Actor-driven logic.*
The Character panel replaces traditional text boxes with a structured data engine.

- **Dual-Mode Construction**:
  - **Solo Mode**: Draft a single, high-fidelity character profile.
  - **Ensemble Mode**: Build a cast-based scenario where multiple actors interact.
- **Actor-to-Text Synthesis**: Character personality and scenario fields are automatically generated based on the traits, aliases, and tags of the assigned Actors.
- **One-Way Compilation**: Edits happen in the Designer, but the AI only sees the "Compiled" result, ensuring project-wide consistency and preventing "context drift."
- **Legacy Support**: Older projects are seamlessly migrated into the V2 structure upon loading.

---

## 🌦️ AURA Logic System
*A modular ecosystem for simulating complex narrative states.*
AURA (Anansi Unified Relationship & Ambience) allows you to "code" your character's behavior without writing a single line of JavaScript.

- **Logic Rules (SBX)**: Create "If/Else" chains that respond to message length, keyword counts, and custom variables.
- **Narrative Events**: Trigger specific text injections or "mood shifts" based on user keywords or active tags.
- **Weighted Scoring**: Influence the LLM’s focus by assigning weights to specific narrative concepts.
- **Nested Logic Rules (Chains)**: Rules can now trigger other rules (`Execute Shift`), allowing for complex, hierarchical decision trees.
- **Rule Blocks**: Group related logic (Lists, Rules, Scoring Topics) into **Rule Blocks** for easy project-wide management and one-click importing.
- **AuraBuilder**: Export your logic as a standalone `AURA.js` payload that can run inside frontends like SillyTavern or JanitorAI.

---

## 🗣️ Voice Rails & Subtones
*Giving character speech distinct patterns and cadence.*
The Voices system ensures that your characters don't just "talk," but have a recognizable "voice."

- **Actor-Voice Binding**: Directly link voice configurations to specific Actors in your project.
- **Cadence & Baseline Rails**: Define the underlying rhythm and core speech quirks of a character.
- **Dynamic Subtones**: Use weighted probability to trigger "Subtones" (e.g., *Sarcastic*, *Whispering*, *Aggressive*) that modify speech patterns turn-by-turn.

---

## 🌀 The Spindle (Simulator)
*The ultimate testing ground for narrative logic.*
The Simulator provides a "transparent" chat experience where you can see exactly how your logic is firing.

- **Context Inspector**: View the raw system prompt and see every AURA injection in real-time.
- **Injection Diffs**: Visual highlight of how logic rules transformed the base character card into the final prompt.
- **Live State Toggles**: Manually adjust Stats, Tags, and Active Actors mid-conversation to test different narrative branches.

---

## �️ Deployment & Portability
- **Universal Backup System**: Export and import your entire **Vault** as `.vault` files.
- **Project Portability**: Save and load full **Projects** as `.json` or `.anansi` bundles, containing all actors, lore, and logic.
- **Narrative Archiving**: Export your **Live Chat Stories** directly from the Simulator as formatted Markdown logs.
- **Multi-Platform Adapters**: One-click exports optimized for **SillyTavern**, **JanitorAI**, and **Chub.ai** formats.
- **Guided Tours**: Over 20+ interactive tours to help you master every panel in the engine.
- **Drag-and-Drop Media**: Seamless image uploads for project covers, actors, and locations.
- **Mobile Native**: Full support for Android builds (APK targets) with touch-optimized controls.
- **Private & Local**: All data is stored locally via IndexedDB, ensuring your work is yours alone.
