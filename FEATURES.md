# Anansi: The Scriptorium Engine

Anansi is a comprehensive Narrative, RPG, and Logic engine designed for complex interactive storytelling, world-building, and agentic simulation. It combines the creativity of a Writer's Room with the systems of a Tabletop RPG and the logic of a Simulation Game.

---

## 1. Narrative & Agents (The Cast)
*Tools for breathing life into characters and their relationships.*

### **Actors & Character Designer**
*   **Designer Panel**: Full character creation suite including physical appearance, personality traits, and custom metadata.
*   **Gallery**: Grid view of all project actors with filtering and quick-edit access.
*   **Voice Tuner**: Configure Text-to-Speech (TTS) settings per actor using 11Labs or local engines. Supports "Subtones" (whisper, shout, emotional inflections).
*   **Relationships (Pairs)**: Define directed relationships (A -> B dynamics) with relationship strength/type tracking.
*   **Microcues**: AI-driven personality signals that subtly influence dialogue generation based on traits.

---

## 2. Living World (The Stage)
*Tools for environment, lore, and geography.*

### **World Weaver**
*   **Map Editor**: Dynamic map editor and viewer.
*   **Pins & Layers**: Place locations, NPCs, and events on custom map images.
*   **Fog of War**: Reveal areas as the story progresses.
*   **Templates**: Import/Export map logic and layouts.

### **Hina's Guide**
*   **Context-Aware Lore**: Injects relevant lore into the LLM context based on current location, active actors, and conversation topics.
*   **Lorebook**: Database of world facts, history, items, and magic systems.
*   **Smart Retrieval**: Vector-based or keyword-based lookup for relevant story details.

---

## 3. RPG Engine (The Game)
*Systems to gamify the narrative experience.*

### **Game Master (GM)**
*   **Rulesets**: Configurable core mechanics (D20, D6, Narrative Only).
*   **Stats Engine**: Custom stat tracking (HP, Mana, Reputation, etc.) with real-time updates.
*   **Lockdown Mode**: Restrict player actions during critical narrative beats.

### **RPG Play**
*   **Context Action Bar**: Dynamic buttons that change based on context (Combat, Exploration, Social).
*   **Selectors**:
    *   **Move**: Navigate between World Weaver locations.
    *   **Interact**: Trigger events or examine objects.
    *   **Talk**: Initiate conversations with specific Actors.
    *   **Attack/Ability**: Combat executions with dice rolls.
*   **Modes**:
    *   **MUD Mode**: Button/Command-driven classic RPG interface.
    *   **Freeform**: Pure narrative input for creative freedom.
*   **LLM Narration**: AI narrator that describes results of actions and dice rolls.

### **Dialogue & Quest Logic**
*   **Dialogue Trees**: Node-based visual editor for branching conversations.
    *   **Conditions**: Unlock branches based on Stats, Flags, or Inventory.
    *   **Actions**: Trigger Quests, Open Shops, Give Items, or update Quest Steps.
    *   **Shops**: Define merchant inventories and prices.
*   **Quest System**: Track active, completed, and failed quests with multi-stage objectives.
*   **Leveling**: XP curves and Party Views to track progression.

---

## 4. Logic & Simulation (The Brain)
*The AURA engine that powers cause and effect.*

### **The Spindle (Simulator)**
*   **Live vs Simulated**: Switch between real LLM calls and "Dry Run" simulations to test logic without API costs.
*   **Diff View**: See exactly how a turn changed the world state (Stats modified, Flags set).
*   **Flow Explorer**: Visual graph of the narrative flow and logic branching.
*   **Context Injection**: Manually seed conversation history to test specific scenarios.

### **Chronos (Time & Space)**
*   **Time Tracking**: Manage Day/Night cycles, specific dates, and time slots.
*   **Weather System**: Track weather conditions (Rain, Storm, Clear) and intensity.
*   **Presence System**: dynamic tracking of which Actors are "Present", "Nearby", or "Elsewhere" based on Location.
*   **Lens**: Web-based sidebar showing real-time actor locations.

### **Advanced Logic Editor**
*   **Custom Lists**: Define keyword lists (e.g., "Fire Spells", "Royalty").
*   **Derived Metrics**: Create stats based on narrative frequency (e.g., "Aggression" = count of "Attack" keywords in last 10 turns).
*   **Rule Chains**: Visual programming interface for complex logic:
    *   `IF target.hp < 10 AND weather == 'storm' THEN trigger_event('desperate_escape')`
    *   Supports `ElseIf`, `Else`, Random Pickers, and Shifts.

### **Events (Logos & Chaos)**
*   **Logos (Logic Events)**: deterministic triggers based on state (e.g., "If Reputation > 50, Unlock Palace").
*   **Chaos (Probability)**: Random event injections to spice up the narrative (e.g., 5% chance of ambush when travelling).

---

## 5. Creative Studio (The Muse)
*Tools for inspiration, asset management, and export.*

### **The Spider's Parlor**
*   **Character Creator**: Interactive "interview" with Anansi to generate detailed Character Cards.
*   **Templates**: Quick-start archetypes for Romance, Horror, Adventure, etc.
*   **Ensemble Support**: Generate entire casts with defined relationships in one go.

### **Writer's Block**
*   **AI Writing Assistant**: Specialized modes for Brainstorming and Editing.
*   **Context Aware**: summarizing older context to maintain continuity.
*   **Session Management**: Save/Load brainstorming sessions and branch ideas.

### **The Vault**
*   **Asset Browser**: Cross-project library for sharing Actors, Maps, Scripts, and Logic.
*   **Filters**: Smart filtering by Universe, Type, and Tags.
*   **Pull/Push**: Easily move assets between projects or share with the community.

### **Nabu (The Scribe)**
*   **Project Management**: Dashboard for switching universes and backing up data.
*   **Export Tools**:
    *   **Publish to JSON**: Export actors and lore for external sharing.
    *   **Rule Generation**: Convert free-text descriptions into formal AURA logic rules.
    *   **Logs**: View debug logs for troubleshooting simulation issues.

---
*Generated by Anansi v2.0 Audit*
