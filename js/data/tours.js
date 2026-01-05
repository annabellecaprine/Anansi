/*
 * Anansi Tour Configuration
 * File: js/data/tours.js
 * Purpose: Content definitions for the guided tour system.
 * Updated: January 5, 2026
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
            target: '#display-env-badge',
            title: 'Environment Control',
            content: 'Shows your current environment (Local/Cloud). Sync status and integrity warnings appear here.'
        },
        {
            target: '#btn-toggle-lens',
            title: 'Web Lens',
            content: 'Toggle the <strong>Mission Control</strong> sidebar. This lens gives you real-time metrics on your project.'
        },
        {
            target: '#btn-help',
            title: 'Help & Tours',
            content: 'Click this button on any panel to start a guided tour specific to that tool.'
        }
    ]);

    // --- SEEDS: Character Panel ---
    A.UI.Tour.register('character', [
        {
            target: '#char-name',
            title: 'Character Identity',
            content: 'Define your main character\'s name. This is used as {{char}} in prompts.'
        },
        {
            target: '#char-persona',
            title: 'Personality',
            content: 'Describe your character\'s personality, traits, and behavior patterns. Token count is shown for context management.'
        },
        {
            target: '#char-scenario',
            title: 'Scenario',
            content: 'Set the scene and situation. This provides context for the roleplay.'
        },
        {
            target: '#char-first-message',
            title: 'First Message & Alternates',
            content: 'Define the opening message. You can add <strong>alternate greetings</strong> that users can swipe through in the Simulator.'
        }
    ]);

    // --- SEEDS: Actors Panel ---
    A.UI.Tour.register('actors', [
        {
            target: '#actor-list',
            title: 'Actor Registry',
            content: 'Manage your cast of characters. Actors are automatically available in Voices, MicroCues, and Lorebook association.'
        },
        {
            target: '#btn-add-actor',
            title: 'Create Actor',
            content: 'Add a new character entity. IDs are auto-generated.'
        },
        {
            target: '.tab-btn[data-tab="gallery"]',
            title: 'Image Gallery',
            content: 'Upload up to 20 images per actor. Organize by SFW/NSFW folders and select a primary image for chat display.'
        },
        {
            target: '.tab-btn[data-tab="card"]',
            title: 'Character Card Export',
            content: 'Export actors as <strong>V2 Character Cards</strong> (PNG). Associated lorebook entries are embedded automatically.'
        }
    ]);

    // --- SEEDS: Spider\'s Parlor ---
    A.UI.Tour.register('parlor', [
        {
            target: '#parlor-chat',
            title: 'The Spider\'s Parlor',
            content: 'An AI-guided interview to create characters. Anansi asks questions and builds your character from your answers.'
        },
        {
            target: '#parlor-templates',
            title: 'Quick Weave Templates',
            content: 'Jumpstart with archetype presets: Trickster, Guardian, Scholar, Rebel, and more.'
        },
        {
            target: '#parlor-preview',
            title: 'Live Preview',
            content: 'See your character take shape in real-time. Upload a portrait and review before importing.'
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
            target: '#nabu-type',
            title: 'Rule Type',
            content: 'Select the type of rule to generate: Lorebook Entry, Event, MicroCue, Scoring Rule, or Voice.'
        },
        {
            target: '#nabu-preview',
            title: 'Preview & Import',
            content: 'Review the generated rule before importing it into your project.'
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
            target: '#location-exits',
            title: 'Navigation & Exits',
            content: 'Define which locations connect to this one. Used by RPG-style travel systems.'
        }
    ]);

    // --- WEAVE: Voices Panel ---
    A.UI.Tour.register('voices', [
        {
            target: '#voice-list',
            title: 'The Choir',
            content: 'Runtime data for dialogue injection. Voices tag onto characters to provide unique speech patterns.'
        },
        {
            target: '.v-sec:nth-of-type(2)',
            title: 'Context Phrases',
            content: '<strong>Smart Lists</strong> for Soft Phrases, Teaching Phrases, and context-aware dialogue. Just type and Enter.'
        },
        {
            target: '#subtone-list',
            title: 'Subtones',
            content: 'Variations of a voice (e.g., "Sarcastic", "Whisper"). Selected based on probability weights.'
        }
    ]);

    // --- WEAVE: MicroCues Panel ---
    A.UI.Tour.register('microcues', [
        {
            target: '#microcue-list',
            title: 'Micro-Level Triggers',
            content: 'Keyword-triggered content injections. More granular than lorebook entries.'
        },
        {
            target: '#microcue-actor',
            title: 'Actor Grouping',
            content: 'Cues are organized by actor. Global cues apply to all actors.'
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
            target: '.l-col:nth-child(2)',
            title: 'Smart Activation',
            content: 'Manage <strong>Keywords</strong> (triggers) and <strong>Tags</strong> (metadata) using the smart pill editor.'
        },
        {
            target: '#btn-add-shift',
            title: 'Logic Shifts',
            content: 'Advanced: Add logic gates (EROS, Intent, Emotion) that must pass for this entry to be active.'
        },
        {
            target: '#btn-lore-import',
            title: 'Import/Export',
            content: 'Import lorebooks from JSON (SillyTavern, JanitorAI compatible). Export your work for backup or sharing.'
        }
    ]);

    // --- WEAVE: Events Panel ---
    A.UI.Tour.register('events', [
        {
            target: '#event-list',
            title: 'Event System',
            content: 'Define conditional events that fire based on keywords, tags, EROS levels, or custom conditions.'
        },
        {
            target: '#event-condition',
            title: 'Trigger Conditions',
            content: 'Set when this event fires: keyword match, tag present, EROS threshold, or custom JavaScript.'
        },
        {
            target: '#event-effect',
            title: 'Effects',
            content: 'Define what happens: add/remove tags, inject text, modify EROS, or run custom scripts.'
        }
    ]);

    // --- WEAVE: Pairs Panel ---
    A.UI.Tour.register('pairs', [
        {
            target: '#pair-list',
            title: 'Relationship Maps',
            content: 'Define how actors relate to each other. Affects dialogue generation and event triggers.'
        }
    ]);

    // --- MAGIC: Scripts Panel ---
    A.UI.Tour.register('scripts', [
        {
            target: '#script-list',
            title: 'AURA Scripts',
            content: 'JavaScript files that run during the simulation. Control personality, scenario, and emotion logic.'
        },
        {
            target: '#script-repo',
            title: 'Script Repository',
            content: 'Browse and import pre-built scripts: RPG Travel, Inventory System, Day/Night Cycle, and more.'
        },
        {
            target: '#script-editor',
            title: 'Code Editor',
            content: 'Edit scripts with syntax highlighting. Use the API Reference in the repository for available functions.'
        },
        {
            target: '#btn-export-aura',
            title: 'AURA Bundle Export',
            content: 'Export all scripts, lorebook, and events as a single AURA bundle for distribution.'
        }
    ]);

    // --- MAGIC: Scoring Panel ---
    A.UI.Tour.register('scoring', [
        {
            target: '#scoring-list',
            title: 'Scoring Rules',
            content: 'Define how EROS, emotions, and other values are calculated based on conversation content.'
        },
        {
            target: '#scoring-conditions',
            title: 'Multi-Condition Logic',
            content: 'Combine keyword matching, tag requirements, and context field checks for precise targeting.'
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
            content: 'Toggle between <strong>Simulated</strong> (test scripts) and <strong>Live</strong> (real LLM chat) modes.'
        },
        {
            target: '#director-toolbar',
            title: 'Director\'s Console',
            content: 'The <strong>Guidance</strong> field lets you inject instructions directly into the LLM prompt for testing.'
        },
        {
            target: '#sim-lens-tabs',
            title: 'Web Lenses',
            content: 'Toggle tabs to view: State, Emotional Arc, Context, Script Trace, Prompt Inspector, and more.'
        },
        {
            target: '#sim-chat-log',
            title: 'Chat Interface',
            content: 'Send messages and see AI responses. <strong>Procedural Avatars</strong> animate based on detected emotion.'
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
