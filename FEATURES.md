# Anansi: Feature List by Panel

**As of: January 5, 2026 (v1.6.5)**

---

## 🚀 Key Features

### 🪄 AI Text Assistance (New in v1.6.0)
- **Magic Wand Tool**: Integrated into Project, Character, Actor, Lorebook, and Location panels.
- **Provider Agnostic**: Use Kobold (Local), Gemini, OpenAI, or any compatible API.
- **Context Aware**: Specialized system prompts for Personas, Scenarios, and Descriptions.
- **Privacy Focused**: Keys stored locally; optional usage.

## 🏛️ LOOM (Project Management)

### Project Panel
- Project name/description editing
- Author metadata
- **Cover Image Upload (100x100)**
- **Platform Compatibility Badges**
- Character card statistics overview
- Web integrity summary (Validity checks)
- Quick navigation to core panels

---

## 🌱 SEEDS (Character Building)

### 🕷️ The Spider's Parlor (Creation Wizard)
- **Guided Interview**: Interactive, roleplay-style character creation with Anansi.
- **Quick Weave (Templates)**: Jumpstart with 8+ archetype presets (e.g., The Trickster, The Guardian).
- **Session Persistence**: Auto-saves conversation history/answers; resumes seamlessly on reload.
- **Smart Generation**: Creates Name, Appearance, Personality, Scenario, and First Message.
- **Portrait Upload**: Add visual identity during preview phase.
- **Companion Mode**: Generate matching sidekicks or rivals after the main character.
- **Direct Import**: One-click sync to Actors/Project panels (including portrait).

### Character Panel
- Character name, personality, scenario editing
- Example dialogue management
- **First Message Configuration (with token count)**
- **Alternate Initial Messages (Swipe in Simulator)**
- **Portrait Upload & Preview**
- Token counting for all fields

### Actors Panel
- Multi-actor support (beyond main character)
- **Actor Gallery System**:
  - Up to 20 images per actor
  - SFW/NSFW folder organization
  - Safe mode toggle (blur/hide NSFW)
  - Primary image selection
- **Character Card v2 Support**:
  - Export full actor data to PNG (V2 spec)
  - Import new actors from PNG cards
  - Standalone card fields (Description, Personality, Scenario, First Message)
- Per-actor: name, handle, traits, relationships
- Enable/disable actors
- Automatic ID generation
- Empty state guidance

---

## 🕸️ WEAVE (Content Injection)

### Voices Panel
- Voice rail definitions (baseline + cadence)
- Probability tuning (base chance, content boost)
- Subtone weighting system
- Debug crumb injection toggle
- Per-voice enable/disable

### MicroCues Panel
- Keyword-triggered content injection
- Actor-grouped cue organization
- Global cues support
- Auto-seeding from Actors panel
- Inline editing

### Lorebook Panel
- Entry management with keywords/regexes
- Priority levels (1-20)
- Scan depth configuration
- Entry categories
- Shift/append logic for dynamic content
- Token counting per entry
- **Import/Export support (JSON)**
- **Granular Import Conflict Resolution (Overwrite/Copy/Skip)**

### Scoring Panel
- Stat block definitions (numeric ranges)
- User vs Actor tracking
- Stat references via `{{stats.user.block.key}}`
- Advanced stat expressions

### Custom Rules Panel (Advanced)
- Tree-based rule editor
- Condition builder (AND/OR/nested)
- Action types: append, prepend, set, modify
- Target fields: personality, scenario, etc.
- Enable/disable rules

---

## ✨ MAGIC (Simulation & Export)

### The Spindle (Simulator) Panel

**Simulated Mode:**
- Message history editor
- Source overrides
- Run simulation button
- Diff view (personality/scenario changes)
- Session save/load (double-click to delete)
- Auto-trace logging

**Live Mode (LLM Integration):**
- Real-time chat with AI
- Rich text formatting (*italics*, **bold**, ~~strike~~, `code`)
- Editable messages (both user & AI)
- Timestamps on hover
- Copy/Regenerate/Delete actions
- 🌿 Conversation Branching (fork from any message)
- Branch selector (double-click to delete)
- Session management
- Story export to markdown

**Web Lens Tabs:**
- **STATE**: Current context snapshot
- **CTX**: Full context object view
- **PROMPT**: System prompt inspector with copy
- **TOKENS**: Context window usage (progress bar, breakdown, summarize)
- **VALID**: Integrity validation
- **TRACE**: Script execution trace
- **STATS**: Scoring stat values
- **LOCS**: Location map
- **CFG**: **Consolidated API Configuration** (Provider presets, auto-filled URLs)

**Advanced Features:**
- Per-message injection inspector (ℹ️ button)
- Diff highlighting for personality/scenario changes
- Auto-summarization (compress old messages)
- Context summary management

### Scripts Panel
- Monaco editor with JS syntax highlighting
- System scripts (AURA, EROS, INTENT, PULSE)
- User-defined scripts
- Enable/disable scripts
- Script ordering
- Auto-complete & linting
- **Script Repository (Built-in presets)**
  - RPG Travel System
  - Day/Night Cycle
  - Inventory System
  - API Reference / Cheatsheet

---

## 🔮 DEEP (Advanced Configuration)

### Sources Panel
- Custom variable definitions
- Persistent flag (value survives rounds)
- Default values
- Type configuration

### Tokens Panel
- Token metrics overview
- Estimation algorithms
- Per-field breakdown

### Events Panel
- Time-based content injection
- Condition triggers
- Recurring vs one-time events

### Pairs Panel
- Relationship definitions between actors
- Bidirectional relationship mapping

### Locations Panel
- World map location definitions
- Exit/connection mapping
- **Bi-directional exit auto-linking**
- Location descriptions

### Stats Panel
- Detailed stat block configuration
- Expression-based stat calculations

### Flow Explorer Panel
- Visual rule execution trace
- Group by: Actor, Type, Target
- Pass/fail indicators
- Content inspection modal
- Search/filter

---

## 🔧 Global Features

- Dark/Light theme toggle
- **Keyboard Shortcuts**: `Ctrl/Cmd + S` (Save), `Ctrl/Cmd + B` (Build), `Ctrl/Cmd + N` (New), `Ctrl/Cmd + ,` (Settings), `Ctrl/Cmd + [` (Back), `1-9` (Panel navigation)
- **Panel Navigation History**: Back button and session-based history tracking
- **Sidebar Search**: Real-time panel filtering
- **Unsaved Changes Indicator**: Glowing save button when project is dirty
- Project save/load (JSON)
- Project export (.anansi.json)
- **Character Card v2 Export/Import (PNG)**
- Build scripts (download .txt or .zip)
- **Comprehensive toast notifications** for all major actions
- Modal dialogs
- **Collapsible Sidebar**: Clean, persistent navigation categories.
- **Consistent empty states** with helpful CTAs
- Guided tours (Help button)
- Panel transitions
- Responsive layout
- Project picker with recent projects

## 📜 Change Log

### v1.6.6 - January 6, 2026
- **Fix**: **Character Card Exporter**. Resolved "Invalid PNG tEXt chunk" error when importing Cards into SillyTavern. The exporter now sanitizes source image metadata (removing invalid null bytes from `generation_data` chunks) and correctly preserves the PNG `IEND` header.

### v1.6.5 - January 5, 2026
- **Fix**: **Custom Rules UI**. Added missing configuration inputs for "Count in History" (list selector, operator, threshold) and "Derived Value Check" (metric selector, operator, threshold) conditions.
- **Fix**: **Lorebook UI**. Hidden the deprecated "Logic" button from the entry header to prevent confusion and unnecessary redirects.
- **New Feature**: **Show Thinking**. Added support for displaying Chain of Thought (CoT) reasoning blocks (e.g., DeepSeek R1). Includes a "Thinking" checkbox in the Live Simulator to toggle visibility of `<think>` blocks.

### v1.6.4 - January 5, 2026
- **New Feature**: **Keyboard Shortcuts**. Global shortcuts for common actions:
  - `Ctrl/Cmd + S`: Save Project
  - `Ctrl/Cmd + B`: Build (Export AURA)
  - `Ctrl/Cmd + N`: New Project
  - `Ctrl/Cmd + ,`: Jump to Project Settings
  - `Ctrl/Cmd + [`: Go Back in panel history
  - Number keys `1-9`: Navigate to corresponding visible panel
- **New Feature**: **Panel Navigation History**. Track last 5 visited panels with Back button and keyboard shortcut (`Ctrl/Cmd + [`). Session-only, intelligently avoids duplicates.
- **New Feature**: **Sidebar Search**. Real-time, case-insensitive panel filtering in the left navigation bar.
- **New Feature**: **Unsaved Changes Indicator**. Glowing save button when project has unsaved changes.
- **Improvement**: **Comprehensive Toast Notifications**. Added consistent feedback for create actions across Lorebook, Pairs, Scoring, and Locations panels.
- **Improvement**: **Consistent Empty States**. Applied centralized empty state helper to Voices, Events, and Scoring panels with helpful CTAs.

### v1.6.3 - January 5, 2026
- **New Feature**: **Platform Guides**. Added a Help icon in the Top Bar that opens comprehensive instructions for exporting to platforms like SillyTavern, JanitorAI, and Chub.ai.
- **New Feature**: **Lorebook Mobile Export**. Export lorebooks as `.txt` files to support mobile/tablet devices where `.json` handling is difficult.
- **New Feature**: **Multi-Select Deletion**. Added bulk selection and deletion capability to Lorebook, Actors, Events, Scripts, and Locations panels. Protection for System Scripts included.
- **New Feature**: **About Modal**. Click the Anansi logo to view version info and credits. Customizable via `ABOUT.html`.
- **Fix**: **Lorebook Import**. Added support for Chub.ai "Dictionary" style lorebooks.
- **Fix**: **Lorebook UI**. Entry count now updates immediately upon import.
- **Fix**: **Tokens Panel Scroll**. Added vertical scrolling for reports on smaller screens.
- **Technical**: Improved local file support for About modal (iframe) and added cache-busting.

### v1.6.2 - January 5, 2026
- **New Feature**: **Director's Console**. Collapsible toolbar in Live Chat with Guidance injection field for direct LLM prompt control.
- **New Feature**: **Procedural Avatars**. Character portraits in chat animate based on emotional state (shake, glow, bounce effects).
- **Fix**: JanitorAI lorebook import now correctly reads `key` field (was only checking `keys`/`keywords`).
- **Fix**: Dropdown option visibility in dark mode improved.
- **Fix**: Export generation now correctly handles `character.scenario` injection targets for Lorebook, Events, and Scoring.
- **Fix**: Resolved silent failure during project import caused by masked IndexedDB errors.
- **Fix**: Fixed UI crash (Modal error) occurring after successful project import.
- **Improved**: Enhanced error reporting for import failures to show specific causes (e.g., storage quotas).

### v1.6.0 - January 4, 2026
- **New Feature**: **Script Repository** added to Scripts panel. Includes checked-in presets:
  - *RPG Travel System*: Automated map navigation.
  - *Inventory System*: Basic item tracking.
  - *Day/Night Cycle*: Time tracking.
  - *API Reference*: Internal scripting cheatsheet.
- **New Feature**: **Lorebook Import/Export** (JSON) with **Conflict Resolver** (Overwrite/Copy/Skip).
- **New Feature**: **Bi-directional Location Linking**. Creating an exit automatically links the return path.
- **New Feature**: **Alternate Initial Messages**. Define multiple greetings and swipe through them in the Simulator. Index tracked via `state.sim.greetingIndex`.
- **New Feature**: **Consolidated API Configuration Modal**. Tabbed interface with provider presets (OpenAI, Anthropic, Gemini, Kobold, Chutes, Custom) that auto-fill URLs.
- **New Feature**: **Generation Settings**. Full control over Temperature, Max Tokens, Context Size, Top P/K, Repetition/Frequency/Presence Penalties.
- **Improvement**: **Import/Export Terminology Standardized**. Scripts panel now uses "Import/Export". AURA Bundle merged into Export modal.
- **Fix**: Lorebook Export button now correctly triggers download.
- **Fix**: Lorebook Shift delete button now works correctly.
- **Fix**: Removed missing `utils.js` reference (404 error).
- **Fix**: API key reading now uses consolidated config system.
- **New Feature**: **Character Book Export**. Character Cards now include associated lorebook entries (those with "Associate with Actors" checked) as embedded `character_book` data.
- **Fix**: **Character Book Import**. Importing V2 cards now correctly restores embedded character_book entries (with conflict resolution).

---

*Last updated: January 5, 2026*
