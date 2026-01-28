# Changelog

All notable changes to Anansi will be documented in this file.

## v1.21.0 - 2026-01-27
### Architecture (Phase 6: Strict Isolation)
- **RPG Engine Refactor**: Migrated the legacy monolithic RPG plugin (`js/plugins/rpg`) to a clean, modular Core architecture (`js/core/rpg` and `js/panels/rpg_*`).
- **Loader Infrastructure**: Implemented `A.UI.loadPanel(id)` and `loader.js` to support future lazy-loading. (Currently operating in pass-through mode for RPG stability).
- **Manifest Authority**: Introduced `panel_manifest.js` as the single source of truth for panel metadata (Icon, Label, Category, Order).
- **Smart Merge System**: Rewrote `A.registerPanel` to strictly enforce Manifest metadata (Order/Category) over legacy file configurations, putting an end to "Jumping Tabs".

### Navigation Overhaul
- **Reorganized Experience**: Restructured the entire sidebar into a cohesive narrative flow:
  - **Loom**: Mission Control, Vault
  - **Seeds**: Actors, Character, Pairs, Voices, Lorebook
  - **Weave**: Events, Scoring, Scripts, Custom Rules
  - **Magic**: The Spindle, MicroCues, Flow Explorer
  - **Sacred Tools**: Spider's Parlor, Nabu, World Weaver, Writer's Block, Hina's Guide
  - **Deep**: Sources, Tokens
  - **Forbidden Secrets**: Stats, Locations, Immersion (Chronos)
- **Deduplication**: Resolved `Chronos` panel duplication by unifying IDs across Manifest and File logic.
- **Cleanup**: Removed non-functional placeholder panels (Guide, Validator, Tester) from the main menu.

## v1.20.0 - 2026-01-27
### Codebase Standardization (Audit)
- **Architecture**:
  - **Modular Panels**: Migrated 100% of panels to a scalable directory structure (`js/panels/[name]/index.js`).
  - **Plugin Consolidation**: Merged "owned" plugins (Actors, Lorebook, Character, Parlor, Hina's Guide) into their respective panel modules.
  - **CSS Standardization**: Introduced `css/panels.css` and refactored the `Stats` panel to use utility classes instead of inline styles.
- **Modernization**:
  - **Legacy Cleanup**: Removed `var` usage and `.bak` files.
  - **Notifications**: Replaced all blocking `alert()` calls with the non-blocking `A.UI.Toast` system.
- **Fixes**:
  - **Regression Fix**: Restored `Tester` and `Validator` functionality after module migration.
  - **Layout Repair (Batch 5)**:
    - **Global Lens Rescope**: Replaced empty "Sim State" with a **Project Overview** (Mission Control) for non-simulation panels.
    - **Double Scrollbars**: Resolved `overflow` conflicts in Character and Simulator panels.
    - **Sidebar Consistency**: Enforced standardized widths for Lorebook, Voices, and Spider's Parlor sidebars.
    - **Spider's Parlor**: Fixed CSS glitch (missing `.hidden` class) and updated grid structure.

## v1.19.0 - 2026-01-27
### Architecture
- **Centralized I/O**: Refactored the entire application to use a unified `A.IO` service, standardizing file import/export operations across all panels (Project, Vault, Actors, Lorebook, Scripts, Writer's Block, Simulator, Character).

### Bug Fixes
- **Character Quirks**: Fixed an issue where "Quirks" were not being correctly saved to or loaded from Character Cards.

## v1.18.0 - 2026-01-25
### World Weaver 2.0 (Generation Overhaul)
- **Features**:
  - **Brainstorm Mode**: A new creative sandbox mode. Toggle "Build" vs "Brainstorm" in the sidebar. Features a "Spark" button for creative twists and freeform "Yes, and..." co-authoring.
  - **Living Lore**: The Secretary now actively scans chat for new proper nouns (Entities) and offers "Suggestion Chips" to instantly add them to the correct category.
  - **Generation Overhaul**: Completely rewrote the character generation pipeline to solve "thin personality" issues.
    - **Structured Dossier**: Replaced the 400-word summary with a limitless "Structured Profile" (Identity, Psychology, Physicality, History, Dynamics).
    - **Field Separation**: Strict prompt engineering prevents description/personality bleed.
    - **Verbosity Sliders**: New UI controls for "Information Density" and "Writing Style" (Standard vs Literate).
  - **Structured Export**: The "Download World Bible" button now produces a clean, formatted Markdown file based on the Structured Dossier, rather than a raw note dump.

## v1.17.2 - 2026-01-25
### World Weaver V2 Polish
- **Core Functionality**:
  - FIX: **Premature Completion**: Implemented strict auto-pivot logic and confidence clamping. The AI now actively switches to neglected topics (like Mechanics) instead of declaring the session complete when empty fields remain.
  - FIX: **Sidebar Crash**: Resolved a `ReferenceError` that caused the Sidebar Category and Back buttons to crash the UI after a chat update.
  - FIX: **Lorebook Generation**: Restored the missing "Generate World Lorebook" option to the output menu.
  - FIX: **Custom Tags**: Context modal now correctly displays the custom flavor tags from the setup wizard.
  - FIX: **Protagonist Naming**: System now correctly extracts and displays the protagonist's name in single-character mode.

- **UI Polish**:
  - CHANGE: **Sidebar Compact Mode**: Aggressively tightened sidebar row spacing (margin/padding) to eliminate unnecessary scrollbars on standard screens.
  - CHANGE: **Badge Visibility**: Fixed an issue where the category badge (e.g., `[📖 Story Arc]`) was missing from chat messages due to case-sensitivity mismatches.
  - CHANGE: **Interaction Safety**: Implemented a "Smart Lock" on the sidebar. Clicking categories while the AI is thinking now opens the Details modal (read-only) instead of interrupting the generation stream.

## v1.17.1 - 2026-01-25
### World Weaver Stabilization & Refactor
- **Critical Fixes**:
  - FIX: **Session Persistence**: Resolved crash loop where reloading the page sent users back to Step 1. Active session now persists via localStorage.
  - FIX: **Chat Crash (seeds)**: Fixed TypeError in LLM module caused by legacy property name (`preSeeds` → `seeds`).
  - FIX: **Variable Mismatch**: Corrected references from old data model (`GENRE_TEMPLATES`/`genre`) to new V2 naming (`WORLD_ARCHETYPES`/`worldArchetype`).
  - FIX: **Container Reference**: Fixed `ReferenceError: container is not defined` in sidebar click handlers.

- **UI Improvements**:
  - NEW: **Session Deletion**: Added trash icon to "Continue Session" list for removing invalid/corrupted sessions.
  - NEW: **Thinking Indicator**: Restored status line showing "📝 Updating Notes..." and "🤔 Thinking..." during LLM operations.
  - NEW: **Markdown Formatting**: Chat messages now render bold, italics, and code formatting with high-contrast styling.
  - NEW: **Invalid Date Fix**: Sessions with missing timestamps now show "Just now" instead of "Invalid Date".

- **Interview Flow**:
  - CHANGE: **Dialogue Questions**: AI now includes follow-up questions naturally in the response text (removed separate Question Chips).
  - CHANGE: **Balanced Coverage**: Protagonist Mode now requires establishing world context (setting, rules) before deep-diving into character details.
  - CHANGE: **Strict JSON**: Hardened LLM prompt to prevent prose outside the JSON response.

## v1.17.0 - 2026-01-25
### World Weaver Writing Style (Phase 13)
- **Collaborative Style Definition**: Added a new **"Writing Style"** category to the World Weaver interview process.
  - **Explicit Preferences**: The AI now actively asks for and respects user preferences for **POV** (First/Third), **Tense** (Past/Present), and **Tone**.
  - **Active Listening**: The extraction engine specifically listens for style keywords and persists them to the session notes.
  - **Smart Generation**: The Character Generator prioritizes these explicit user settings over generic defaults, ensuring the final character card matches the desired roleplay voice.
  - **Automatic Migration**: Existing sessions are automatically upgraded to include the new category, preserving backward compatibility.

## v1.16.1 - 2026-01-24
### World Weaver UI & Layout Fixes
- **Protagonist Mode Polish**:
  - NEW: **Protagonist Indicator** in sidebar (shows `🎭 [Name]`) for immediate context.
  - NEW: **Auto-Anchor** now pre-fills the Protagonist notes instantly when importing an actor.
  - NEW: **1-Click Generation** skips the intermediary selection modal in Protagonist mode.
  - NEW: **Weighted Progress** now values the Protagonist category at 30% (vs 15%) for more satisfying progression.
  - UX: Renamed "Cast" checkbox/category to "Protagonist" when in single-character mode.

- **Mobile Layout & Styling**:
  - FIX: Resolved critical mobile layout bug where top content was cut off (Switch to `margin: auto` safe centering).
  - UI: Redesigned **Story Focus** toggle into distinct, highlighted "Cards" for better clarity and touch targets.

- **System Fixes**:
  - FIX: **Tour.js Race Condition**: Fixed an issue (Firefox/Mobile) where the help tour highlight would appear off-screen due to layout race conditions. Added async positioning and scroll tracking for robust grounding.
  - FIX: **World Weaver HTML Injection**: Resolved a bug where the "Retry Step" button was improperly rendered as raw text code `&lt; button` due to a malformed HTML tag in the error handler.
  - FIX: **iOS API Entry**: Disabled "Smart Punctuation" and auto-correct on API Key input fields to prevent iOS from corrupting keys with curly quotes.

- **UI Improvements**:
  - **API Config Shortcut**: Added a permanent "key" icon to the top toolbar for quick access to API settings from any panel.
  - **OpenRouter Support**: Added OpenRouter as a dedicated provider option in the API Configuration menu, with pre-filled Base URL and recommended fast default models.

## v1.16.0 - 2026-01-24
### World Weaver Architecture (Phase 12)
- **Sequential Pipeline ("Active Listening")**: Refactored the core LLM logic to run in two distinct serial stages:
  1.  **Secretary Mode (Extraction)**: Reads user input and current notes, identifying new facts and rewriting category notes to be concise and deduplicated.
  2.  **Director Mode (Interview)**: Reads the *updated* notes and generates a context-aware response, solving the "Amnesia" and "Logic Loop" issues.
  
- **Director Mode (Auto-Focus)**:
  - **Constraint Logic**: The system now strictly prohibits the AI from asking "anything else?" if the current category is incomplete. It must ask a specific rubric-based question ("Gap Analysis").
  - **Auto-Rotation**: If the current category is >80% confident, the Director automatically switches focus to the next incomplete category to ensure 100% world coverage.
  - **Completion State**: If >70% confident and no questions remain, the system explicitly prompts the user to "Generate Output".
  
- **Quality of Life**:
  - **"N/A" Handling**: Explicitly handles "No" or "Skip" responses by marking categories as 100% complete (Green) instead of leaving them empty.
  - **Deduplication**: The Secretary now actively merges similar bullet points (e.g. "Freya is trusting" + "Freya depends on user" -> "Freya's trusting nature creates dependency").
  - **Persona Guardrails**: Strict rules preventing the AI from creating/defining the {User}'s internal thoughts or actions.
  - **Generation Context Fix**: Resolved a critical issue where the final character generation ignored the Scratchpad Notes, causing it to hallucinate details. It now explicitly consumes the full notes history.
  - **Generation Targeting**: Fixed an issue where the generator would mistakenly create a profile for the User Persona ("Elliot Harper") instead of the main NPC. It now explicitly targets the primary non-user character (e.g. Freya).

v1.15.0 - 2026-01-24
### World Weaver Multi-Cast (Phase 8)
- **Multi-Cast Management**: Full support for ensemble storytelling.
  - **Styles**: Toggle between "Protagonist" (Single) and "Ensemble" (Group) focus.
  - **Cast List**: Sidebar management for identified actors.
  - **Batch Generation**: Auto-extract potential cast members from context and generate them sequentially.
  
- **Multi-Step Pipeline (Enhanced)**:
  - **Resume Logic**: Auto-detects interrupted generations and allows resuming from the last successful step (Identity, Appearance, Card, Quirks, Notes, Cues).
  - **Retry Handling**: Built-in error recovery for individual steps.
  
- **Quality of Life**:
  - **Session Deletion**: Added ability to delete sessions from the start screen.
  - **Layout Fixes**: Improved scrolling and centering on the setup screen.
  - **Developer Tools**: Hidden test suite (`Ctrl+Shift+T`) for validating generation pipelines.

## v1.14.0 - 2026-01-23
### Multi-Step Character Generator (Phase 7)
- **6-Step Pipeline**: Implemented a comprehensive prompt chain: Identity, Appearance, Card Fields, Quirks, Notes, and Cues.
- **Appendage Awareness**: Automatically detects features like "wings" or "tail" from user prompts (e.g., "Imp with wings") and generates specific behavioral cues for them. context-aware descriptions.
- **Full Cues Generation**: Refactored to generate **ALL** system cues (9 Pulse, 8 Eros, 8 Intent) using 3 sequential LLM calls to avoid token limits and truncated output.
- **Context Injection**: Prompts now override genre defaults (e.g. allowing fantasy appendages in 'Modern' settings if requested).

### Architecture & Stability
- **LLM Robustness**: Updated `JSONRepair` to strip `<thinking>`, `<thought>`, and `<thoughts>` tags, fixing crashes with reasoning models.
- **Error Handling**: Fixed `ReferenceError: subjective` and `history.push` crashes in generation logic.
- **UI Rendering**: Fixed malformed HTML strings that caused "code text" to appear on screen during generation.
- **Prompt Engineering**: Improved instruction quality to enforce varied sentence structure and proper name usage.

## v1.13.0 - 2026-01-23
### World Weaver (Major Feature)
- **New Panel**: "World Weaver" - An AI-powered guided setup and brainstorming tool for collaborative world-building.
- **Structured Ideation**: Break down world creation into logical steps: Core Experience, World Rules, Setting/Situation, Main Character, Story Arc, Mechanics, and Guardrails.
- **Smart Generation**: Generates comprehensive world lore, character cards, and scenario details from a single genre/rating/summary input.
- **Scratchpad Memory**: Persistent per-category notes that both the user and AI can edit. AI "learns" from the user and records key decisions into the scratchpad.
- **Visual Progress**: Real-time progress indicators using high-fidelity SVG visualizations for each category's development.
- **Character Synthesis**: Automatically generates and imports multi-field character data (Description, Personality, Scenario, First Message, Greeting).
- **Lorebook Integration**: Generates and imports structured Lorebook entries for consistent world rules and setting elements.

### Architecture & Infrastructure
- **Modular Panel Design**: Refactored `world-weaver.js` into a multi-module architecture (`ui.js`, `llm.js`, `generation.js`, `templates.js`) for better maintainability.
- **Robust JSON Parsing**: Implemented aggressive LLM output repair and sanitization (stripping `<think>` blocks, fixing unquoted keys) for reliable AI tools.
- **UI Resilience**: Fixed several UI rendering crashes and improved DOM stability during long AI generation tasks.

## v1.12.2 - 2026-01-21
### New Features
- **Token Limits Configuration**: New "Token Limits by Context" section in LLM Configuration panel.
  - **Global Default**: Single slider (512 to 128K) applies to all tools unless overridden.
  - **Per-Tool Overrides**: Checkbox + slider for each tool (Simulator, Nabu, Advanced Workshop, Magic Wand, Writer's Block, Hina's Guide, Chronos Chat, Spider's Parlor).
  - Added `A.UI.getMaxTokensFor(tool)` helper for consistent token limit retrieval.

### Infrastructure
- All LLM-using tools now respect user-configured token limits instead of hardcoded values.
- Supports high-context models like DeepSeek (128K+).

## v1.12.1 - 2026-01-20
### New Features
- **Advanced Workshop**: New rule type in Temple of Nabu for comprehensive character optimization methodology.
  - Supports field-level targeting (description, personality, scenario, first_messages) or full-card optimization.
  - Injects current character data and associated Lorebook entries as context.
  - Enforces strict field separation (physical vs psychological) and word count requirements.
  - Displays AI reasoning/analysis before showing generated content.

### Infrastructure
- **LLM Token Limits**: Increased default `maxTokens` from 1024 to 4096. Advanced Workshop requests 8192 tokens for verbose output.
- **Dynamic Token Override**: `A.LLM.generate()` now accepts `maxTokens` in config overrides for per-request control.

## v1.12.0 - 2026-01-19
### Housekeeping
- **Orphan Cleanup**: Deleted 7 unused files (`adapters.js`, `aura_lib.js`, `json-repair.js`, non-minified library duplicates).
- **Missing Panel Fix**: Added `gamemaster.js` to script loading (was orphaned).

## v1.11.9 - 2026-01-19
### Architecture
- **Phase 4 Complete**: Core modules (`js/core/**/*`) now pass TypeScript checking with 0 errors.
- **Type Safety**: Configured `jsconfig.json` to focus on core infrastructure, with panels as incremental future work.

## v1.11.8 - 2026-01-19
### Architecture
- **Actor Select Component**: Created `A.UI.Components.ActorSelect` for reusable actor dropdown UI. Supports filtering, exclusions, and change callbacks.

## v1.11.7 - 2026-01-19
### Infrastructure
- **Event Bus**: Created `A.Events` module (`js/core/events.js`) for application-wide publish/subscribe communication.
  - API: `on()`, `off()`, `once()`, `emit()`, `clear()`
  - Emits `panel:switched` and `state:changed` events for decoupled module integration.

## v1.11.6 - 2026-01-19
### Infrastructure
- **Error Boundaries**: Implemented robust error handling for Panel rendering. Crashed panels now display a "Panel Crashed" diagnostic screen with stack trace and a "Retry" button, preventing the entire application from freezing.
- **Reliability**: `switchPanel` navigation is now wrapped in `try/catch` with automatic recovery options.

## v1.11.5 - 2026-01-19
### Type Safety (Panels)
- **Panel Compliance**: Extended `checkJs` validation to `js/panels/`.
- **Chronos Chat**: Resolved type errors in `chronos_chat.js`, addressing logic around `onchange` and `onclick` events for the control bar and web lens.
- **RPG Dialogue**: Fixed `onclick` interactions and node logic in `rpg_dialogue_panel.js`.
- **Pairs**: Resolved type casting issues in shift tagging logic.

## v1.11.4 - 2026-01-19
### New Features
- **Pick Random Action**: New action type in Custom Rules for randomly selecting items from a List. Supports configurable count range (min-max for variability), prefix text, separator (comma/pipe/newline/and), and target field. Use cases include scavenger hunts, random party names, item quests, and more.

### UI/UX Improvements
- **Navigation Reorganization**: Overhauled UI navigation categories for improved workflow:
  - **Loom**: Project, Vault, Guide
  - **Seeds**: Actors → Character → Pairs → Voices → Lorebook (ordered)
  - **Weave**: Events, Scoring, Scripts, Custom Rules
  - **Magic**: Simulator, MicroCues, Flow Explorer
  - **Sacred Tools**: Spider's Parlor, Nabu, Hina's Guide, Writer's Block
  - **Deep**: Sources, Tester, Tokens, Validator
  - **Forbidden Secrets**: Stats, Locations + Immersion subcategory (Chronos panels)
  - **RPG Experiment**: Unchanged

### Architecture Improvements (Phase 1)
- **JSDoc Documentation**: Added comprehensive JSDoc to core APIs (`state.js`, `anansi.js`, `ui.js`) including type definitions for `ProjectMeta`, `Actor`, `AnansiState`, `PanelConfig`
- **Inline Event Handler Removal**: Created new `A.UI.createEmptyStateElement()` function with proper DOM event listeners; deprecated `getEmptyStateHTML()`. Migrated 7 panels (actors, voices, events, lorebook, scoring, microcues, scripts) to use the new pattern

### Type Safety
- **Core**: Enabled `checkJs` for all `js/core` files to type-check vanilla JavaScript.
- **Global Types**: Created `types.d.ts` to define global variables (`Anansi`, `esprima`, `Quill`).
- **Fixes**: Resolved over 50 type errors in `ui.js`, `ui-api-config.js`, `vault-db.js`, and `aura_transformers.js` (mostly DOM element casting and logic fixes).

### Architecture Improvements (Phase 2)
- **File Splitting**: Extracted shared modules to reduce large file sizes:
  - `lorebook.js`: 1641 → 1285 lines (22% reduction) → new `lorebook-shared.js`
  - `hinas_guide.js`: 1380 → 1109 lines (20% reduction) → new `hinas-templates.js`

### Bug Fixes
- **Hina's Travel Guide**: Fixed template preview modal showing blank content (incorrect Modal API usage)

## v1.11.3 - 2026-01-18
### Bug Fixes
- **Identity Split Restoration**: Restored the separated Gender & Pronouns fields that were accidentally removed. Actors now have distinct Gender and Pronouns dropdowns with Custom options for non-standard entries.
- **Custom Pronouns**: The Quirk Engine correctly parses custom pronoun sets (e.g., "ne/nem/nir") in slash-separated format.
- **Persistence**: Character Card v2 exports/imports now include the `pronouns` property.

## v1.11.2 - 2026-01-17
### Bug Fixes
- **Nabu Resilience**: Implemented robust JSON parsing and retry logic for the Nabu AI Rule Generator. It now automatically repairs common LLM formatting errors (missing quotes, trailing commas) and retries generation if the output is invalid.

## v1.11.1 - 2026-01-16
### Actor Identity & Pronouns
- **Identity Split**: Separated the combined "Gender & Pronouns" field into two dedicated fields in the Actor Editor.
- **Custom Pronouns**: The Quirk Engine now supports custom pronoun sets (e.g., "ne/nem/nir") via slash-separated strings.
- **Persistence**: Updated Character Card v2 serialization to include the new pronouns property, ensuring full portability.

## v1.11.0 - 2026-01-13
### Dynamic World Update
- **Map Dynamic Connections**: Hina's Travel Guide now supports Time-based gates (e.g., Parks closed at night) and Logic-based gates (e.g., VIP Keycard required).
- **Chronos Core**: Updates to movement validation to respect new connection types (Closed/Locked status).
- **Nabu Formats**: Added "Personality Format" selector to Nabu Generator (Prose, List/W++, Hybrid).
- **Quality of Life**: Added "Enable Dynamic Connections" checkbox to Map Wizard; Logic Gates are opt-in.

## v1.10.3 - 2026-01-12
### SurgeonFish Update
- **Hina's Travel Guide**: Implemented state persistence for the Map Builder. Inputs and wizard steps are now saved when tabbing away.
- **Clear Form**: Added a "Clear Form" button to the wizard to manually reset state.

## v1.10.2 - 2026-01-12
### Chronos & State Fixes
- **Prompt Conflict Resolution**: Fixed an issue where the "World State" header would override pending transitions. The system now dynamically switches the header to "PREVIOUS WORLD STATE" during time/weather shifts, ensuring the LLM respects the change.
- **Nuclear Purge**: Added a **"Purge All History & State"** button to Chronos Settings. This performs a deep clean of all simulation artifacts (Active Tags, Present Actors, History), solving issues with "phantom characters" persisting between sessions.
- **Stability**: Fixed stale state references in UI event handlers.

### Code Architecture
- **Simulator Refactor**: Split the monolithic `simulator.js` into modular components: `simulator-llm.js` (Logic), `simulator-live.js` (UI), and `simulator-lens.js` (Sidebar).
- **Panel Modularization**: Refactored `actors.js`, `character.js`, and `parlor.js` into sub-modules (e.g., `actors-gallery.js`, `character-solo.js`) to improve maintainability and performance.
- **UI API**: Standardized UI component usage via `ui-components.js` and `ui-modal.js`.

## v1.10.1 - 2026-01-12
### Chronos Panel Enhancements
- **Personas**: Added a User Persona tool (👤) to the Chronos chat bar. Players can now define their Name and Description, which are injected into the narration prompt for better personalization.
- **Narrator Constraints**: Enforced strict "Prose-Only" rules. The AI is now explicitly forbidden from using "Narrator:" prefixes or writing actions/dialogue for the player.
- **Logic Engine Parity**: Integrated the full Simulator `processRound` flow into Chronos. This enables active tag detection, lorebook lookup, and genre enforcement within the Chronos panel.
- **Context Management**: Fixed "context bleed" where Simulator memories leaked into Chronos. Added a **"Clear Global Context"** button to settings for manual memory cleanup.


## v1.10.0 - 2026-01-11
### Major Release: RPG Completeness
This release delivers the **RPG Feature Complete** milestone, enabling fully autonomous storylines and GM-designed campaigns.

#### Story Progression
- **Story Flags**: New `RPG.Story.setFlag()` / `getFlag()` API for tracking arbitrary campaign state.
- **Victory Conditions**: Define winning states based on Quest Completion, Flags, or Item possession. Triggers a victory celebration modal.
- **Quest Chains**: Quests can now require other quests (`requires: []`), flags, or specific items before being offered.

#### Dialogue System
- **Conversation Trees**: New `RPG.Dialogue` system supporting branching dialogues, choices, conditions (flags/quests), and actions (shop/quest/gift).
- **Dialogue Panel**: Dedicated **Dialogues** panel in "RPG Experiment" for visually authoring NPC conversation trees.
- **Editor**: Nodes can trigger shops, offer quests, set flags, or give items.

#### Leveling & Growth
- **XP System**: Full XP tracking with configurable level-up thresholds (Presets: Linear, Exponential, D&D 5e, Custom).
- **Auto-Leveling**: Characters automatically gain levels when XP threshold is met.
- **Class Templates**: Leveling up automatically applies class benefits (HP, Stat bonuses, Feats) based on class progression tables.
- **Leveling Panel**: New GM panel for configuring XP curves and viewing party progress.

#### Gameplay Systems
- **Death & Respawn**: "Total Party Kill" (TPK) logic implemented. Characters die, drop a corpse container with their inventory, and respawn at the start location.
- **Corpse Retrieval**: Players can interact with their corpse to recover lost items.
- **Quest Turn-In**: Implemented explicit "Turn In" mechanic (return to NPC) distinct from auto-completion.
- **Auto-Pilot V2**: Enhanced bot AI now autonomously handles quests (accept/turn-in), shopping (healing), dialogue (auto-advance), and corpse runs.
- **Party Panel Fix**: Resolved rendering crash in Party Panel.

#### UI Updates
- **New Panels**: Added **Dialogues** and **Leveling** panels.
- **Notifications**: Added Toast notifications for Quest Acceptance, Completion, Level Up, and Gold accumulation.

---

## v1.9.6 - 2026-01-11
### New Features
- **Hina's Travel Guide (Beta)**: Added a comprehensive Map Builder panel.
    - **Map Wizard**: Generate custom map layouts based on Genre, Scale, and Structure.
    - **Template Library**: Includes 5 starter templates (Hub & Spoke, Linear, Grid, etc.).
    - **Smart Import**: Auto-layout system arranges imported locations in a tidy grid.
    - **Vault Integration**: Publish and share your custom Map Templates with other projects.
    - **AI Enrichment**: Now active! Procedurally generates atmospheric descriptions, hidden DM secrets, and suggestions for Loot and Encounters.
    - **Virtual GM**: Engine now supports autonomous Combat triggers, Ad-Hoc Spawning (for AI monsters), and Real Loot distribution.
    - **Auto-Pilot**: New "Sim Mode" allows a bot to play the game autonomously for stress-testing and world simulation.
    - **Quest System**: Full quest support with Kill, Fetch, Visit, and Talk objectives.
        - **Quest Board**: New GM panel for creating and managing quest templates.
        - **Quest Givers**: Any NPC or Object can now offer quests via interaction.
        - **Quest Log**: Player-facing UI for tracking objective progress.
    - **AI Quest Generation**: Hina's Travel Guide now automatically dreams up Main Quests for generated maps.
- **UI & Visualization**:
    - Fixed emoji rendering issues in Hina's Guide.
    - Added "Map Template" content type support to Vault.

### Bug Fixes
- **Vault Import**: Resolved critical issue where imported maps would stack all locations on a single tile.
- **System Stability**: Fixed potential state conflicts during complex imports.


---

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
- **Hina's Travel Guide**: New map building wizard in Forbidden Secrets. Browse pre-made templates, import them to your project, or export your current locations as a template to the Vault.

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
