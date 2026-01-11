# Changelog

All notable changes to Anansi will be documented in this file.

## v1.9.5 - 2026-01-10
### Bug Fixes
- **Script Vault Integration**: Fixed scripts publishing to Vault with "[object Object]" instead of name. Scripts now correctly store metadata and can be pulled back into projects.
- **Stats Panel Display**: Stat references now display actor names instead of IDs (e.g., `{{stats.Luna.battle_stats.PUPP}}` instead of `{{stats.actor_xyz.battle_stats.PUPP}}`).
- **Location Node Overlap**: New location nodes now cascade instead of stacking on top of each other.

### Game Master
- **Objects System**: New section for managing quest objects (McGuffins) and container objects (chests/cabinets). Quest objects track discovery/collection status. Containers support lock DC, trap DC, and contents from Armory. All objects can be assigned to locations.
- **Object Interaction**: [INTERACT] button in Play panel now shows objects at current location. Containers can be opened to list contents, with Take/Take All options. Quest items can be collected with Take button.
- **Shop System**: New section for managing merchant shops. Shops have shopkeepers (Actor NPCs), locations, stock with prices/quantities, buyback rate, and currency pool. Enter shops via [INTERACT] → modal UI for browsing, buying, and selling. Shops are non-combat safe spaces.

### Party & Characters
- **Currency System**: Entities now have a `currency` (gold) field, editable in the Character Sheet.
- **Pool Gold**: Party Leader can now collect all gold from other party members with a single click.

---

## v1.9.4 - 2026-01-10
### Bug Fixes & Stability
- **System Data Syntax Fix**: Repaired broken string literal in `system_data.js` that caused `SyntaxError` and prevented system scripts from loading.
- **Zombie Entity Fix**: `RPG.Entities.remove` now synchronizes deletions with global actor state, preventing ghost entries in the Web Lens.
- **Bestiary Cleanup Enhancement**: "Clean Up" button now detects and removes orphaned entities and dead monsters.
- **Cleanup Persistence**: Cleanup now saves changes to IndexedDB, so removed entities stay gone after reload.
- **RPG Play Panel Fix**: Resolved issue where switching modes would duplicate the UI interface instead of refreshing it.
- **Chat Persistence**: Fixed issue where chat history was lost on refresh. Both MUD and Freeform chat logs are now saved and restored.
- **DM Atlas Persistence**: Changes to Encounters, Loot, and Traps are now immediately saved to disk, ensuring data persists when switching tabs.
- **DM Atlas UI**: Removed fixed height constraints on entity lists to improve readability and scrolling.

### Non-Combat MUD Commands
- **[SEARCH]**: Search current location for secrets, loot, and traps with Perception roll.
- **[REST]**: Short rest (25% HP recovery) and long rest (full HP) with enemy proximity check.
- **[LOOT]**: Loot defeated monsters - transfers inventory and currency to party.
- **[EXAMINE]**: Examine objects, NPCs, and location interactables.
- **[INTERACT]**: Interact with location objects (doors, levers, etc.).

### Party Management
- **Party Leader**: Designate a party leader via Party Panel (👑). Leader's name is used for player actions in the Play panel.

### RPG Combat Polish
- **Equipment Detection Fix**: Party Members now correctly link to their RPG Entities to show equipped items in combat, resolving the "Unarmed" bug.
- **Monster Inventory Support**: Attack system now automatically infers equipped weapons from Monster/NPC inventories, allowing bestiary creatures to fight effectively without manual slot assignment.
- **Enhanced Attack UI**: Implemented a guided multi-step attack selector (Type -> Weapon -> Target) for precise combat control.
- **Engine Command Parsing**: Updated RPG Engine to correctly parse complex commands (e.g., "Melee Attack on [Target] using [Weapon]"), ensuring the correct weapon damage dice and rules are applied.
- **Freeform Chat Persistence**: Fixed regression where Freeform RP history was not saving to disk, ensuring narrative context survives page reloads.
- **UI Feedback**: "Send" button now changes to "Thinking..." state during LLM generation to indicate active processing.
- **Smart Monster Inventory**: Bestiary inventory now features a Search/Select dropdown linked to the Armory, automatically populating damage, type, and range properties for monsters.
- **Enhanced Narration Context**: Combat narration now draws from multi-source metadata including Actor profiles (taglines, personality, aliases, physical/biological traits), Monster descriptions, and Weapon details.
- **Genre & Setting Priming**: AI narrator now contextually styles its descriptions based on active campaign settings and GM atmospheric notes.

### Autonomous Narrative Systems (LlamaTale-Inspired)
- **Sentiment System**: NPCs now track relationship states toward other entities (hostile → suspicious → neutral → friendly → loyal). Use `RPG.Entities.getSentiment()`, `setSentiment()`, and `adjustSentiment()`.
- **Event Memory**: NPCs remember witnessed events and conversations (`rpg_memory.js`). Memories are injected into LLM context for coherent long-term interactions.
- **Idle Actions**: Ambient NPC behavior system (`rpg_idle.js`) generates background flavor actions that make scenes feel alive.
- **Prompt Templates**: Centralized, customizable prompt library (`rpg_prompts.js`) for combat narration, dialogue, reactions, and scene descriptions.
- **Response Cache**: LLM response caching (`rpg_cache.js`) with TTL and auto-pruning to reduce redundant API calls.

### UI Improvements
- **Web Lens NPC Section**: Spawned NPCs now appear in their own "👤 NPCs" section instead of Party. Party, NPCs, and Hostiles are now properly categorized.
- **Web Lens Location Filtering**: NPCs now correctly filter by location - only shown when player is at their location.
- **Bestiary Search & Filters**: Added search bar and type filters (All/Monsters/NPCs) to quickly find creatures in the bestiary.
- **DM Atlas Entities Present**: New section showing all NPCs and monsters currently at a location, with spawn button for quick creature placement.

## v1.9.3 - 2026-01-09
###- **Refactoring**:
    - **System Stability**: Refactoring to avoid system complications.
    - **Plugin Isolation**: Consolidated RPG files to `js/plugins/rpg` and removed deprecated `sys_rpg`.
    - **UI Cleanup**: Removed redundant "Roleplay" panel and ensured correct panel registration.
    - **Bug Fix**: Resolved "RPG Engine not available" error by improving engine export/import logic.

## v1.9.2 - 2026-01-08
### Combat System Fixes
- **Turn Order Enforcement**: Active combatant is now strictly enforced during combat. Actions are performed by whoever's turn it is, not based on name matching from input.
- **Modifier Calculation Fix**: Attack rolls and ability checks now correctly use derived stat modifiers (e.g., STR 20 = +5) instead of raw stat values.
- **Flee Check Fix**: Flee attempts now correctly use DEX modifier.
- **Action Economy Overhaul**: Simplified action system now combines Main Actions + Bonus Actions into a single pool. Turn auto-ends when actions reach 0.
- **Action Economy UI**: Added "Main Actions" and "Bonus Actions" fields to Party panel (Quick Edit) and Monster panel (Creature Editor).
- **Spawn Data**: Monsters now spawn with customized action counts from their bestiary template.
- **System Data Regeneration**: Created `build_system_data.mjs` Node.js script as alternative to Python build script.

### Architecture
- **RPG Plugin Isolation**: Moved all RPG code to `js/plugins/rpg/` with error containment. RPG failures no longer crash main application.

## v1.9.1 - 2026-01-08
### Experimental Features
- **RPG Experiment (Beta)**: Added a suite of hidden panels for running tabletop RPG sessions directly within Anansi.
  - **Locked Category**: Access required via secret password (`dungeonmaster`) in the About screen.
  - **Roleplay Panel**: A chat interface coupled with a dice/mechanics engine (`processRound` API).
  - **Party & Monsters**: Panels for managing Hero stats (HP/MP) and a Bestiary with auto-numbered spawn.
  - **Combat Engine**: Full Turn-based combat with Initiative, Rounds, Turns, and auto-termination on team wipe.
  - **Monster AI**: Enemies act autonomously, selecting targets and attacking. Dead actors are skipped.
  - **Auto-Targeting**: If no target is named, the engine selects the first living hostile.
  - **Feats Panel**: A CRUD database for Spells, Abilities, and Passives with structured fields (Target, Effect Dice, Effect Type, Mana Cost).
  - **JRPG Action Menu**: Button-driven combat UI in Roleplay panel. Attack → Weapon → Target flow. Setting-agnostic "Abilities" for spells/powers.
  - **World Map**: A read-only visualization of the Locations graph for players.
  - **DM Map**: A Game Master-exclusive editor for seeding locations with Encounters and Loot.
  - **Armory**: A CRUD database for Weapons, Armor, and Items.

## v1.9.0 - 2026-01-07
### New Features
- **Nested Logic Rules**: "Logic Chains" now support an `Execute Shift` action, allowing rules to trigger other rules for complex, hierarchical decision trees.
- **List Reordering (QoL)**: Added Up/Down arrows to Voices, Scoring Topics, and Logic Rules lists for easier management.
- **The Writer's Block**: AI-powered writing assistant panel in Forbidden Secrets. Features Mode toggle (Brainstorm/Edit), multi-select Genre/Emphasis chips, Actor/Location context injection, branching conversations, session save/load, message pinning, smart context management with sliding window + summarization, and Export to Markdown.
- **Drag-and-Drop Image Upload**: Intuitive image upload support added across Project Cover, Character Portrait, Actor Gallery, and Location editors.
- **Rule Blocks System**: Implemented grouping of vault logic (Lists, Rules, Derived Values, Scoring Topics) into unified 📦 Blocks for batch management and project importing.
- **Quirks System Extension**: Added AURA tag integration with exact-case matching and a standardized selection dropdown for cleaner logic triggers.

### Improvements
- **Centralized Migration Runner**: `State.migrate()` now runs eagerly on load/import, ensuring old project files are fully upgraded to the current schema without requiring panel visits.
- **Centralized Versioning**: Build script now reads version from `package.json` and injects it into `index.html` and `state.js` automatically.
- **UI Polish**: Widened text input fields for Gender, Lorebook Category/Target, and Advanced Rule conditions.
- **Visual Hierarchy**: Added indentation for Actor quirks to distinguish between Physical, Mental, and Emotional categories.
- **Tense Variants**: Updated Cue Presets with proper tense variants for narrative consistency.

### Fixes
- **AURA Matching**: Validated exact-case tag matching in `quirk-engine.js` for strict AURA compatibility.
- **Parlor API**: Resolved "tangled threads" connection error by unifying API client with `A.LLM` service and adding explicit configuration validation.

## v1.8.0 - 2026-01-06
### New Features
- **Character V2 Canonicalization**: Renamed `character2.js` to `character.js` and registered as the primary 'Character' panel. The legacy panel has been removed in favor of this more powerful synthesis engine.
- **Seamless Data Migration**: Automated one-way migration path from legacy `state.seed` to Character V2 overrides. Your existing characters are automatically upgraded on project load without data loss.
- **Backward Compatibility**: The Simulator (The Spindle) now includes dual-mode data resolution, ensuring legacy character data continues to function even if the new Character panel is never opened.
- **Terms of Service**: Added comprehensive `TERMS.html` with non-commercial license, user responsibility, indemnification, warranty disclaimers, and detailed local-first privacy policy.
- **Documentation Split**: Separated high-level feature overviews (`FEATURES.md`) from chronological updates (`CHANGELOG.md`).

### Improvements
- **Vault UX**: Tags are now displayed as prominent "Pills" in the Vault entry stub header for better scannability.
- **Actors Panel**: Renamed "Tags" to "AURA Tags (Logic Triggers)" to distinguish them from organizational Vault tags.
- **Privacy Policy**: Updated Project dashboard with clarified "Local-First" phrasing and explicit AI provider data-flow transparency.
- **Universal Portability**: Added comprehensive export options to Feature highlights (Vault, Projects, and Chat Stories).
- **Scripts Panel**: Full Vault Integration (Publish, Import, and Sync badges).
- **Guided Tours**: Rebuilt tour system for all 20+ panels with accurate selectors, polished content, and Vault onboarding.
- **Character Panel**: Enhanced "First Message" carousel to aggregate greetings from all actor data sources (Editor, Legacy, Imported) with improved labeling.

### Fixes
- **Simulator**: Fixed Story Export to correctly use Character V2 compiled data instead of legacy structures.
- **UI**: Fixed broken comment syntax in `character.js` that caused panel registration failures.
- **Tour System**: Fixed positioning race condition by switching to `behavior: 'auto'` for immediate coordinate calculation.
- **Character Panel**: Fixed `TypeError` crash when processing non-string initial message data.
- **Actors Panel**: Fixed immediate UI refresh for name and list stub after Character Card import.
- **Scripts Panel**: Fixed `ReferenceError` crash when switching to the panel.

## v1.7.2 - 2026-01-06
### Improvements
- **Voices Panel**: Replaced text input with Actor Dropdown for stricter voice-to-actor binding.
- **Deduplication**: Prevented assigning multiple voices to the same actor.

### Fixes
- **Voice Import**: Resolved issue where "Pull from Vault" for (Voices) would silent fail.
- **Auto-Refresh**: Fixed Voices panel not updating list when new items were added remotely.

## v1.7.1 - 2026-01-06
### Improvements
- **Vault UX**: Enhanced layout with collapsible detail pane and dynamic filtering by content subtype.
- **Vault Integration**: Added Vault support for Voices, Pairs, and Custom Rules (Logic).
- **Character Panel**: Improved data synthesis logic to robustly handle legacy and imported actor data.

### Fixes
- **Import**: Fixed issue where imported Character Cards would display empty profiles in the Character V2 panel.
- **UI**: Cleanup of outdated labels in Actors panel.

## v1.7.0 - 2026-01-06
### New Features
- **Anansi Vault**: A centralized snippet library for storing and reusing content across projects.
  - **Vault Panel**: specialized interface for browsing, searching, and managing your Vault library.
  - **Integration**: "Publish to Vault" buttons added to Character, Script, and Location panels.
  - **Import**: Easily import snippets from the Vault directly into your active project.
- **Smart Linking**: Vault items track their origin and version history.
- **Snippet Management**: Organize snippets by Universe and Tags.

### Improvements
- **UI Refresh**: Minor polish to header and tooltips.

### Fixes
- **Performance**: Optimized list rendering for large projects.

## v1.6.3 - 2026-01-05
### Mobile Build
- **Android APK**: Added build config for Android export.
- **Optimizations**: Improved touch handling in Simulator.

## v1.6.2 - 2026-01-05
### Simulator
- **Fix**: Resolved issue where Actors were not appearing in the Simulator panel.
- **Display**: Improved actor avatar rendering in chat bubbles.

## v1.6.1 - 2026-01-05
### Documentation
- **Platform Guides**: Added comprehensive guides for exporting to SillyTavern, JanitorAI, and Chub.ai.
- **Access**: Guide button added to top toolbar.

## v1.6.0 - 2025-12-28
### Logic Engine
- **Persistent Variables**: Scripts can now read/write persistent global variables.
- **Cross-Project Memory**: Variables can persist between different project sessions.

## v1.5.0 - 2025-12-15
### Core
- **Project Database**: Migrated to IndexedDB for robust local storage.
- **Auto-Save**: Background saving is now more reliable.
