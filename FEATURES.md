# Features & Changelog

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
