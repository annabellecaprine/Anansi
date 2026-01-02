# Anansi

> *The spider of stories. All stories belong to Anansi — and he weaves them into a web that reaches everywhere.*

Anansi is a **narrative operating system** and **story workbench** designed for authoring, testing, debugging, and exporting bot/character behavior scripts.

## Features

- **Web State** – Single source of truth for all project data
- **Environment Adapters** – Plugin architecture for targeting different platforms (JAI, SillyTavern, etc.)
- **Live Tester** – Real conversational loop testing with detailed traces
- **Validator** – Continuous validation with core and world-specific rules
- **AURA Modules** – Advanced rule authoring (conditions, scoring, events, randomization)
- **Theme Switching** – Light and dark themes with design token system

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
cd Anansi
npm install
```

### Development

```bash
npm run dev
```

The development server will start at `http://localhost:5173`.

### Build

```bash
npm run build
```

Production bundle will be output to `dist/`.

### Type Checking

```bash
npm run check
```

## Project Structure

```
/Anansi
  /css                    # Design system
    tokens.css            # Design tokens (colors, spacing, etc.)
    main.css              # Layout and component styles
  /src
    /core                 # Environment-agnostic backbone
      /types              # Shared TypeScript types
      /state              # Web State model
      /environment        # Adapter registry
      /validation         # Core validators
      /export             # IR pipeline
      /testing            # Tester runner
      /io                 # Persistence
      /util               # Utilities
      /workers            # Web Workers
    /env                  # Environment adapters
      /jai                # JAI adapter (reference)
    /lib                  # Third-party wrappers
    /ui                   # User interface
      /shell              # Layout, routing
      /components         # Reusable components
      /inspectors         # Web Lens views
      /basicpanels        # Core workflow panels
      /advancedpanels     # Power workflow panels
    /modules              # Feature modules (AURA, etc.)
  /assets                 # Icons, logo
  /docs                   # Documentation
```

## Development Phases

1. ✅ **Phase 0** – Repo Skeleton
2. ⬜ **Phase 1** – Web State + Persistence
3. ⬜ **Phase 2** – Environment Adapters
4. ⬜ **Phase 3** – env-jai Skeleton
5. ⬜ **Phase 4** – UI Shell
6. ⬜ **Phase 5** – Validator System
7. ⬜ **Phase 6** – Tester Runner
8. ⬜ **Phase 7** – Scripts System
9. ⬜ **Phase 8** – Export IR
10. ⬜ **Phase 9** – Authoring (Lore, Actors, Microcues)
11. ⬜ **Phase 10** – AURA Modules

## License

TBD
