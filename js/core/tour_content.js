/*
 * Anansi Tour Content (Consolidated)
 * File: js/core/tour_content.js
 * Purpose: Content definitions for the guided tour system.
 * Updated: January 6, 2026
 */

(function (A) {
    'use strict';

    if (!A.UI || !A.UI.Tour) return;

    // --- LOOM: Project Dashboard ---
    A.UI.Tour.register('project', [
        {
            target: '#nav-container',
            title: 'Welcome to Anansi',
            content: 'This is your navigation hub. Panels are organized by function: <strong>Loom</strong> (Settings), <strong>Seeds</strong> (Entities), <strong>Weave</strong> (Content), and <strong>Magic</strong> (Runtime).'
        },
        {
            target: '#nav-seeds',
            title: 'The Vault',
            content: 'The <strong>Vault</strong> is your cross-project library. Publish characters, lore, or scripts to the Vault to use them in any project.'
        },
        {
            target: '#display-env-badge',
            title: 'Environment Control',
            content: 'Shows your current environment (Local/Cloud). Sync status and integrity warnings appear here.'
        },
        {
            target: '#btn-toggle-lens',
            title: 'Web Lens',
            content: 'Toggle the <strong>Mission Control</strong> sidebar. This lens gives you real-time metrics on your project.'
        }
    ]);


    // --- SEEDS: Character Panel ---
    A.UI.Tour.register('character', [
        {
            target: '#tab-solo',
            title: 'Character Modes',
            content: 'Choose between <strong>Solo Mode</strong> (one main character) and <strong>Ensemble Mode</strong> (a group of characters portraying one entity).'
        },
        {
            target: '#char-name',
            title: 'Identity',
            content: 'Define the name for the final Character Card. This overrides the base Actor name for this specific project.'
        },
        {
            target: '#field-personality',
            title: 'Personality (V2)',
            content: 'Define your character\'s personality. If an actor is selected, this can be <strong>synthesized</strong> automatically based on actor traits.'
        },
        {
            target: '#field-scenario',
            title: 'Scenario',
            content: 'Set the scene and situation. This provides context for the roleplay simulation.'
        },
        {
            target: '#field-firstMessage',
            title: 'First Message',
            content: 'Define the opening message. You can use the carousel to switch between pre-built greetings from different actors.'
        },
        {
            target: '#pub-personality',
            title: 'Publish to Vault',
            content: 'Click 📤 to save specific fields (like a perfect Personality) to your <strong>Vault</strong> library for reuse elsewhere.'
        },
        {
            target: '#export-png',
            title: 'Character Card PNG',
            content: 'Export your character as a standard V2 Character Card. Anansi embeds all logic, lore, and images directly into the PNG.'
        }
    ]);


    // --- SEEDS: Actors Panel ---
    A.UI.Tour.register('actors', [
        {
            target: '#actor-list',
            title: 'Actor Registry',
            content: 'Manage your cast of characters. Actors are the source data for your project entities.'
        },
        {
            target: '#btn-add-actor',
            title: 'Create Actor',
            content: 'Add a new character entity. IDs are auto-generated.'
        },
        {
            target: '#inp-actor-tags',
            title: 'AURA Tags',
            content: 'These are <strong>Logic Triggers</strong>. Use them to gate Lorebook entries or Event triggers (e.g., "human", "royal").'
        },
        {
            target: '.tab-btn[data-tab="gallery"]',
            title: 'Image Gallery',
            content: 'Upload up to 20 images per actor. Organize by SFW/NSFW folders and select a primary image for chat display.'
        },
        {
            target: '.tab-btn[data-tab="card"]',
            title: 'Character Card Import',
            content: 'Import existing character cards to populate this actor\'s data automatically.'
        }
    ]);


    // --- SEEDS: Spider\'s Parlor ---
    A.UI.Tour.register('parlor', [
        {
            target: '#conversation-log',
            title: 'The Spider\'s Parlor',
            content: 'An AI-guided interview to create characters. Anansi asks questions and builds your character from your answers.'
        },
        {
            target: '#sparkle-container',
            title: 'The Weave',
            content: 'Watch the spider dance. The gems glow as your character\'s soul is woven into being.'
        },
        {
            target: '#btn-restart',
            title: 'New Pattern',
            content: 'Mistake in the threads? Restart the interview to weave a fresh character.'
        }
    ]);

    // --- SEEDS: Nabu (AI Rule Generator) ---
    A.UI.Tour.register('nabu', [
        {
            target: '#nabu-request',
            title: 'Nabu, the Scribe',
            content: 'Describe what you want in natural language. Nabu generates lorebook entries, events, and scoring rules.'
        },
        {
            target: '#sel-type',
            title: 'Rule Type',
            content: 'Select the type of rule to generate: Lorebook Entry, Event, MicroCue, Scoring Rule, or Voice.'
        },
        {
            target: '#btn-invoke',
            title: 'Invocation',
            content: 'Click <strong>Invoke the Scribe</strong> to send your request to the AI. Review and inscribe the results when ready.'
        }
    ]);

    // --- SEEDS: Locations ---
    A.UI.Tour.register('locations', [
        {
            target: '#location-list',
            title: 'World Map',
            content: 'Define locations in your world. Each location can have descriptions, images, and exits to other locations.'
        },
        {
            target: '#btn-add-location',
            title: 'Add Location',
            content: 'Create a new location. Exits are <strong>bi-directional</strong> by default—linking A→B automatically creates B→A.'
        },
        {
            target: '#vault-btn',
            title: 'Vault Sync',
            content: 'Publish locations to your Vault to build consistent worlds across different story projects.'
        }
    ]);

    // --- SEEDS: Vault Panel ---
    A.UI.Tour.register('vault', [
        {
            target: '#vault-search',
            title: 'Search & Filtering',
            content: 'Find assets by name, tag, or content. You can also filter by <strong>Universe</strong> to keep your assets organized.'
        },
        {
            target: '#filter-type',
            title: 'Content Discovery',
            content: 'Filter by Actors, Lore, Scripts, or even specific subtypes like "Personality" or "Voice".'
        },
        {
            target: '#vault-list',
            title: 'Your Archive',
            content: 'The list shows your stored assets. The ✅ icon means an item is in sync, while 🔄 indicates a local update is available.'
        },
        {
            target: '#btn-pull',
            title: 'Pull into Project',
            content: 'Click <strong>Pull to Project</strong> to import an asset from your Vault. It will be added to your current workspace instantly.'
        }
    ]);


    // --- WEAVE: Voices Panel ---
    A.UI.Tour.register('voices', [
        {
            target: '#voice-list',
            title: 'The Choir',
            content: 'Voices define how your characters speak. They can be unique to an actor or shared across groups.'
        },
        {
            target: '.v-sec:nth-of-type(1)',
            title: 'Baseline & Cadence',
            content: 'Define the core speech pattern. <strong>Baseline</strong> is injected once per session; <strong>Cadence</strong> per turn.'
        },
        {
            target: '#subtone-list',
            title: 'Emotional Subtones',
            content: 'Variations of a voice (e.g., "Sarcastic", "Whisper"). These are selected dynamically based on weights.'
        }
    ]);

    // --- WEAVE: MicroCues Panel ---
    A.UI.Tour.register('microcues', [
        {
            target: '#cue-list',
            title: 'Micro-Level Triggers',
            content: 'Keyword-triggered content injections. These are auto-generated from Actor PULSE/EROS/INTENT cues.'
        },
        {
            target: '#cue-list details summary',
            title: 'Actor Grouping',
            content: 'Cues are organized by actor. Click an actor\'s name to see their specific emotional baseline and triggers.'
        }
    ]);

    // --- WEAVE: Lorebook Panel ---
    A.UI.Tour.register('lorebook', [
        {
            target: '#lore-list',
            title: 'Lore Entries',
            content: 'The database of world knowledge. Entries are injected into context when their keywords are triggered.'
        },
        {
            target: '#inp-keys',
            title: 'Triggers (Keywords)',
            content: 'Define the words or phrases that activate this entry. Multiple keywords should be comma-separated.'
        },
        {
            target: '#btn-add-shift',
            title: 'Lore Shifts',
            content: 'Advanced: Use shifts to change an entry\'s content dynamically based on current story conditions.'
        },
        {
            target: '#btn-import-lore',
            title: 'Import/Export',
            content: 'Import lorebooks from JSON (SillyTavern compatible). Export your work for backup or sharing.'
        }
    ]);

    // --- WEAVE: Events Panel ---
    A.UI.Tour.register('events', [
        {
            target: '#event-list',
            title: 'Narrative Logic',
            content: 'Define milestones or random occurrences that fire based on conditions.'
        },
        {
            target: '#sel-cond-type',
            title: 'Trigger Conditions',
            content: 'Decide when this event fires: keyword match, flag state, stat threshold, or custom JavaScript.'
        },
        {
            target: '#sel-eff-type',
            title: 'Effects & Actions',
            content: 'Define what happens: add/remove tags, set flags, modify stats, or output a specific message.'
        },
        {
            target: '#btn-vault-pub',
            title: 'Vault Sharing',
            content: 'Publish complex event logic to your Vault to reuse it across other projects.'
        }
    ]);

    // --- WEAVE: Pairs Panel ---
    A.UI.Tour.register('pairs', [
        {
            target: '#pair-list',
            title: 'Relationship Maps',
            content: 'Define how actors relate to each other. This affects dialogue generation and event triggers.'
        },
        {
            target: '#btn-vault-import',
            title: 'Vault Import',
            content: 'Import relationship templates from your Vault to jumpstart character dynamics.'
        }
    ]);

    // --- MAGIC: Scripts Panel ---
    A.UI.Tour.register('scripts', [
        {
            target: '#script-list',
            title: 'Anansi Scripts',
            content: 'Custom JavaScript logic that runs during simulation. Scripts populate the <strong>Neural Stack</strong>.'
        },
        {
            target: '#btn-import-vault',
            title: 'Import Script',
            content: 'Import advanced logic scripts from your Vault library.'
        },
        {
            target: '#script-editor',
            title: 'Code Editor',
            content: 'Edit scripts with syntax highlighting. Monaco provides full IntelliSense for the Anansi API.'
        },
        {
            target: '#btn-publish-vault',
            title: 'Publish Script',
            content: 'Publish your scripts to the Vault to share them across all your Anansi projects.'
        }
    ]);


    // --- MAGIC: Scoring Panel ---
    A.UI.Tour.register('scoring', [
        {
            target: '#sc-list',
            title: 'Scoring Topics',
            content: 'Define how different aspects of the story (Personality, Rapport, Plot Progress) are tracked.'
        },
        {
            target: '#inp-keys',
            title: 'Matching Strategy',
            content: 'Specify keywords that contribute to this score. You can fine-tune sensitivity and word-matching here.'
        },
        {
            target: '#inp-ctx',
            title: 'Dynamic Injections',
            content: 'The content written here will be injected into the simulation when certain scoring thresholds are met.'
        }
    ]);

    // --- MAGIC: Sources Panel ---
    A.UI.Tour.register('sources', [
        {
            target: '#source-list',
            title: 'Data Sources',
            content: 'Define variables that scripts can read and write. Persistent sources survive across sessions.'
        }
    ]);

    // --- MAGIC: Stats Panel ---
    A.UI.Tour.register('stats', [
        {
            target: '#stats-model',
            title: 'Stat Models',
            content: 'Choose a stat model (D&D, Big 5 Personality, VADF, Custom) for actors.'
        },
        {
            target: '#stats-radar',
            title: 'Radar Visualization',
            content: 'View character stats as a radar chart. Adjust values by dragging or using the sliders.'
        }
    ]);

    // --- MAGIC: Advanced Panel ---
    A.UI.Tour.register('advanced', [
        {
            target: '#advanced-lists',
            title: 'Keyword Lists',
            content: 'Define normalized keyword lists that can be referenced by "Any In List" conditions.'
        },
        {
            target: '#advanced-formulas',
            title: 'Custom Formulas',
            content: 'Create computed values based on keyword counts in chat history.'
        }
    ]);

    // --- SILK: Simulator Panel ---
    A.UI.Tour.register('simulator', [
        {
            target: '#sim-mode-toggle',
            title: 'Mode Selection',
            content: 'Toggle between <strong>Simulated</strong> (logic-only) and <strong>Live</strong> (real LLM chat) modes.'
        },
        {
            target: '#sim-input',
            title: 'Neural Stack',
            content: 'Talk to your actors here. The simulation processes your input through all active scripts and gates.'
        },
        {
            target: '#sim-send',
            title: 'Execution',
            content: 'Press <strong>Enter</strong> or click <strong>Send</strong> to trigger the next turn.'
        },
        {
            target: '#sim-chat-log',
            title: 'Context History',
            content: 'View past turns. The AI remembers the context within its token limits.'
        },
        {
            target: '#director-toolbar',
            title: 'Director\'s Console',
            content: 'Inject instructions directly into the LLM prompt for testing logic edge cases.'
        }
    ]);

    // --- SILK: Flow Explorer ---
    A.UI.Tour.register('flow-explorer', [
        {
            target: '#flow-timeline',
            title: 'Execution Timeline',
            content: 'View the order and results of all rule evaluations (lorebook, events, scripts) for each turn.'
        },
        {
            target: '#flow-filter',
            title: 'Filter by Type',
            content: 'Show only specific rule types: Lorebook, MicroCue, Voice, Event, Scoring, or Advanced.'
        }
    ]);

    // --- SILK: Tokens Panel ---
    A.UI.Tour.register('tokens', [
        {
            target: '#token-breakdown',
            title: 'Context Budget',
            content: 'See how your context window is allocated across system prompt, lorebook, and chat history.'
        },
        {
            target: '#token-visualizer',
            title: 'Token Visualizer',
            content: 'Visualize which entries consume the most tokens. Optimize for tight context limits.'
        }
    ]);

})(window.Anansi);
