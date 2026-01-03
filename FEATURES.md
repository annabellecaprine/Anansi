# Anansi: Feature List by Panel

**As of: January 3, 2026 (v1.6.0)**

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
- **CFG**: LLM provider/model config, API key manager

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
- Project save/load (JSON)
- Project export (.anansi.json)
- **Character Card v2 Export/Import (PNG)**
- Build scripts (download .txt or .zip)
- Toast notifications
- Modal dialogs
- **Collapsible Sidebar**: Clean, persistent navigation categories.
- Guided tours (Help button)
- Panel transitions
- Responsive layout
- Project picker with recent projects

---

*Last updated: January 3, 2026 (v1.5.0)*
