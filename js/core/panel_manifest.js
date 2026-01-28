(function (A) {
    'use strict';

    // Defines all available panels for lazy loading.
    // Dependencies are loaded sequentially before the main panel script.
    // RPG Core Dependency Group (All systems required for the Engine)
    const rpgCoreDeps = [
        'js/core/rpg/index.js',
        // Systems
        'js/core/rpg/systems/context.js',
        'js/core/rpg/systems/cache.js',
        'js/core/rpg/systems/items.js',
        'js/core/rpg/systems/monsters.js',
        'js/core/rpg/systems/classes.js',
        'js/core/rpg/systems/feats.js',
        'js/core/rpg/systems/leveling.js',
        'js/core/rpg/systems/quests.js',
        'js/core/rpg/systems/death.js',
        'js/core/rpg/systems/idle.js',
        'js/core/rpg/systems/autopilot.js',
        // Narrative
        'js/core/rpg/narrative/dialogue.js',
        'js/core/rpg/narrative/memory.js',
        'js/core/rpg/narrative/prompts.js',
        // Engine (Must be last)
        'js/core/rpg/engine.js'
    ];

    A.PanelManifest = {
        // --- Loom (Core) ---
        'project': { label: 'Mission Control', icon: '🚀', category: 'Loom', order: 10 },
        'vault': { label: 'Vault', icon: '🔒', category: 'Loom', order: 20 },
        'guide': { label: 'Guide', icon: '📖', category: 'Loom', order: 30, hidden: true }, // H HIDDEN

        // --- Seeds (Creative Assets) ---
        'actors': {
            label: 'Actors', icon: '👥', category: 'Seeds', order: 10,
            dependencies: ['js/panels/actors/actors-gallery.js', 'js/panels/actors/actors-tabs.js']
        },
        'character': {
            label: 'Character', icon: '👤', category: 'Seeds', order: 20,
            dependencies: [
                'js/panels/character/character-synth.js',
                'js/panels/character/character-solo.js',
                'js/panels/character/character-ensemble.js'
            ]
        },
        'pairs': { label: 'Pairs', icon: '👯', category: 'Seeds', order: 30 },
        'voices': { label: 'Voices', icon: '🎙️', category: 'Seeds', order: 40 },
        'lorebook': {
            label: 'Lorebook', icon: '📜', category: 'Seeds', order: 50,
            dependencies: ['js/panels/lorebook/lorebook-shared.js']
        },

        // --- Weave (Drafting/Events) ---
        'events': { label: 'Events', icon: '📅', category: 'Weave', order: 10 },
        'scoring': { label: 'Scoring', icon: '💯', category: 'Weave', order: 20 },
        'scripts': { label: 'Scripts', icon: '🎭', category: 'Weave', order: 30 },
        'advanced': { label: 'Custom Rules', icon: '⚙️', category: 'Weave', order: 40 },

        // --- Magic (Generative/AI) ---
        'simulator': {
            label: 'The Spindle', icon: '🧶', category: 'Magic', order: 10,
            dependencies: ['js/panels/simulator_lens/index.js', 'js/panels/simulator_live/index.js']
        },
        'microcues': { label: 'MicroCues', icon: '🔬', category: 'Magic', order: 20 },
        'flow_explorer': { label: 'Flow Explorer', icon: '🌊', category: 'Magic', order: 30 },

        // --- Sacred Tools (Specialized) ---
        'parlor': {
            label: 'Spider\'s Parlor', icon: '🕷️', category: 'Sacred Tools', order: 10,
            dependencies: ['js/panels/parlor/parlor-prompts.js', 'js/panels/parlor/parlor-preview.js']
        },
        'nabu': { label: 'Nabu', icon: '✒️', category: 'Sacred Tools', order: 20 },
        'world_weaver': {
            label: 'World Weaver', icon: '🕸️', category: 'Sacred Tools', order: 30,
            dependencies: [
                'js/panels/world_weaver/templates.js',
                'js/panels/world_weaver/llm.js',
                'js/panels/world_weaver/generation.js',
                'js/panels/world_weaver/ui.js',
                'js/panels/world_weaver/steps/step1_archetype.js',
                'js/panels/world_weaver/steps/step2_mode.js',
                'js/panels/world_weaver/steps/step3_details.js'
            ]
        },
        'writers_block': { label: 'Writer\'s Block', icon: '🧠', category: 'Sacred Tools', order: 40 },
        'hinas_guide': {
            label: 'Hina\'s Guide', icon: '🦊', category: 'Sacred Tools', order: 50,
            dependencies: ['js/panels/hinas_guide/hinas-templates.js']
        },

        // --- Deep (Simulation/Analysis) ---
        'sources': { label: 'Sources', icon: '📚', category: 'Deep', order: 10 },
        'tester': { label: 'Tester', icon: '🧪', category: 'Deep', order: 20, hidden: true }, // HIDDEN
        'tokens': { label: 'Tokens', icon: '🪙', category: 'Deep', order: 30 },
        'validator': { label: 'Validator', icon: '✅', category: 'Deep', order: 40, hidden: true }, // HIDDEN

        // --- Forbidden Secrets ---
        'stats': { label: 'Stats', icon: '📊', category: 'Forbidden Secrets', order: 10 },
        'locations': { label: 'Locations', icon: '🌍', category: 'Forbidden Secrets', order: 20 },

        // CORRECTION: ID match for Chronos Chat. 
        // Note: The file js/panels/chronos_chat/index.js registers 'chronos_chat'.
        // So we MUST use 'chronos_chat' as key to prevent duplication.
        // We also need to map the path manually because implicit path is js/panels/chronos_chat/index.js (which matches key).
        'chronos_chat': {
            label: 'Chronos',
            icon: '⏳',
            category: 'Forbidden Secrets',
            subcategory: 'Immersion',
            order: 30
        },
        'chronos_scheduler': {
            label: 'Scheduler',
            icon: '📅',
            category: 'Forbidden Secrets',
            subcategory: 'Immersion',
            order: 40,
            path: 'js/plugins/chronos/chronos_scheduler.js'
        },
        'chronos_settings': {
            label: 'Immersion Config',
            icon: '⚙️',
            category: 'Forbidden Secrets',
            subcategory: 'Immersion',
            order: 50,
            path: 'js/plugins/chronos/chronos_settings.js'
        },

        // --- RPG Experiment ---
        'gamemaster': {
            label: 'Campaign Rules', icon: '🎲', category: 'RPG Experiment', subcategory: 'Game Master', order: 10,
            dependencies: rpgCoreDeps
        },
        'rpg_dm_map': {
            label: 'DM Atlas', icon: '📍', category: 'RPG Experiment', subcategory: 'Game Master', order: 11, gmOnly: true,
            dependencies: rpgCoreDeps
        },
        'rpg_leveling': {
            label: 'Leveling', icon: '🆙', category: 'RPG Experiment', subcategory: 'Game Master', order: 12, gmOnly: true,
            dependencies: rpgCoreDeps
        },
        'rpg_quest_board': {
            label: 'Quest Board', icon: '📜', category: 'RPG Experiment', subcategory: 'Game Master', order: 13, gmOnly: true,
            dependencies: rpgCoreDeps
        },
        'rpg_dialogue': {
            label: 'Dialogue Editor', icon: '💬', category: 'RPG Experiment', subcategory: 'Game Master', order: 14, gmOnly: true,
            dependencies: rpgCoreDeps
        },

        'rpg_play': {
            label: 'Session', icon: '⚔️', category: 'RPG Experiment', order: 20,
            dependencies: rpgCoreDeps
        },
        'rpg_party': {
            label: 'Party', icon: '🛡️', category: 'RPG Experiment', order: 21,
            dependencies: rpgCoreDeps
        },
        'rpg_map': {
            label: 'World Map', icon: '🗺️', category: 'RPG Experiment', order: 22,
            dependencies: rpgCoreDeps
        },
    };
})(window.Anansi);
