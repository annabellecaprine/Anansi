# Changelog

All notable changes to Anansi will be documented in this file.

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
