# RPG Experiment — Design Vision & Developer Guide

This document captures the shared vision for the **RPG Experiment** feature on the Anansi Platform. It is intended as a guidance and alignment tool for Anansi and Antigravity developers, emphasizing architecture, intent, and design philosophy rather than final implementation details.

---

## High-Level Concept

**RPG Experiment is a deterministic world-simulation layer with an LLM acting strictly as narrator, not arbiter.**

All mechanical outcomes are resolved by scripts, rules, and data. The LLM’s role is to transform resolved state changes into rich narrative output without altering results.

This separation ensures:
- Mechanical consistency
- Debuggability
- Replayability
- Designer-authored rule control
- Reduced LLM hallucination risk

---

## Core Pillars

### 1. Script-First Resolution
- Stats, actions, effects, and randomness are handled by the logic engine.
- The LLM never determines success, failure, or mechanical consequences.

### 2. Dual-Channel Interaction
- **Action Channel:** Structured, machine-readable player actions.
- **Intent Channel:** Freeform player description for narrative flavor.

### 3. Modal Play
- **RPG Mode:** Turn-based, rule-driven gameplay.
- **Free RP Mode:** LLM-only roleplay with mechanics suspended.
- Players may switch freely between modes.

### 4. DM-as-Author Model
- The DM defines possibility space, not outcomes.
- Encounters, loot, and threats are staged—not puppeteered.

---

## Panel Breakdown

### Game Master Panel (Rules & Global Configuration)

**Purpose:** Define how the RPG layer behaves system-wide.

Possible subsystems:
- Turn structure (initiative, phases)
- Action economy (AP, cooldowns, stamina)
- Resolution rules (dice, RNG, crits)
- Narrative constraints (verbosity, tone)
- LLM permissions and boundaries

This panel is conceptually adjacent to **Scoring + Events + Simulator**, scoped specifically to gameplay.

---

### Roleplay Panel (Primary Interaction Surface)

**Purpose:** Execute turns and deliver narrative output.

#### Input Model
- **Structured Actions:** Button-based JRPG-style menus
- **Player Intent:** Freeform text describing approach or style

#### Turn Flow
1. Player selects actions and writes intent
2. Script engine resolves mechanics
3. A structured resolution payload is produced
4. The LLM receives a constrained system prompt
5. The LLM narrates the outcome

This contract is critical to prevent narrative drift.

---

### Party Panel

**Purpose:** Manage playable characters with mechanical state.

- Stats and derived values
- Equipment and inventory
- Status effects
- Action availability
- Linked to full Actor definitions (voices, lore, cues)

Actors remain narrative entities; Party members are Actors with gameplay context.

---

### Monsters Panel

**Purpose:** Bestiary and enemy templates.

- Base stat blocks
- Abilities and behaviors
- AI tags (aggressive, tactical, cowardly)
- Loot tables

These are templates, not active instances.

---

### Map Panel (Player-Facing)

**Purpose:** Navigable world graph.

- Node-based layout
- Fog-of-war
- Known vs unknown locations
- Traversal paths
- Location tags (safe, hostile, unknown)

Focus is narrative navigation, not tactical grids.

---

### DM Map Panel (Behind-the-Scenes)

**Purpose:** Authorial control over world state.

- Assign monsters to nodes
- Seed loot and secrets
- Define encounter triggers
- Control escalation states

Separation of player knowledge and world truth is intentional.

---

### Armory Panel

**Purpose:** Unified item database.

- Weapons, armor, consumables, quest items
- Equip rules and modifiers
- On-use scripts
- Passive effects
- Narrative tags for LLM flavor

Single source of truth for all items.

---

## Architectural Notes

### Conceptual State Shape

```
state.rpg = {
  mode: 'combat' | 'exploration' | 'rp',
  turn: {
    order: [],
    active: actorId,
    phase: 'action' | 'resolution'
  },
  party: [],
  enemies: [],
  map: {},
  flags: {}
}
```

---

### LLM Prompt Contract (Critical)

```
SYSTEM:
The following events have already occurred and are final.
Do not contradict mechanics or outcomes.

RESOLUTION:
- Player hit Goblin Shaman for 6 damage (critical)
- Goblin Shaman is stunned
- Party morale increased

YOU MAY:
- Describe sensory detail
- Add character reactions
- Expand atmosphere

YOU MAY NOT:
- Change outcomes
- Add new actions
- Undo effects
```

This boundary is essential for system integrity.

---

## Strengths & Risks

### Strengths
- Strong alignment with Anansi’s logic-first philosophy
- Clear LLM boundaries
- Scales from light RP to complex systems
- Highly moddable via scripts

### Risks
- Overengineering early systems
- UX complexity from excessive settings
- Prompt leakage if constraints are unclear

---

## Recommended Next Steps

1. Define the turn resolution payload schema
2. Prototype the Roleplay panel in isolation
3. Start with a single-party, single-enemy encounter
4. Dogfood combat before expanding systems
5. Add Free RP ↔ RPG toggle early

---

**Status:** Conceptual / Pre-Implementation

