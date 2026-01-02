/**
 * Gate Types and Defaults
 * File: js/core/gate_types.js
 * Purpose: Defines available gate types, emotion vocabulary, and default structures.
 */

(function (A) {
    'use strict';

    // Emotion vocabulary (matching AURA)
    const EMOTIONS = [
        'JOY', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE',
        'TRUST', 'ANTICIPATION', 'LOVE', 'SUBMISSION', 'AWE',
        'DISAPPROVAL', 'REMORSE', 'CONTEMPT', 'AGGRESSIVENESS', 'OPTIMISM'
    ];

    // EROS levels (matching AURA 0-10 scale)
    const EROS_LEVELS = {
        NONE: 0,
        AWARENESS: 1,
        INTEREST: 2,
        ATTRACTION: 3,
        TENSION: 4,
        FLIRTATION: 5,
        DESIRE: 6,
        INTIMACY: 7,
        PASSION: 8,
        INTENSITY: 9,
        TRANSCENDENCE: 10
    };

    // Intent types (matching AURA)
    const INTENTS = [
        'QUESTION', 'COMMAND', 'STATEMENT', 'EXCLAMATION',
        'GREETING', 'FAREWELL', 'AFFIRMATION', 'NEGATION'
    ];

    // Default gate structures for new entries
    function createDefaultGates() {
        return {
            // Existing tag gates (already supported)
            requireTags: [],
            blocksTags: [],

            // Emotion gates (AURA parity)
            emotionGates: {
                andAny: [],   // requires ANY of these emotions
                andAll: [],   // requires ALL of these emotions
                notAny: [],   // blocks if ANY of these emotions present
                notAll: []    // blocks if ALL of these emotions present
            },

            // EROS gates (Romance/Arousal)
            erosGates: {
                currentVibe: { min: null, max: null },  // null = no restriction
                longTermMin: null                        // null = no restriction
            },

            // Intent gates
            intentGates: {
                allowedIntents: []  // empty = all intents allowed
            },

            // Entity restrictions
            entityGates: {
                restrictToActors: []  // empty = all actors allowed
            },

            // Probability (0-100)
            probability: 100
        };
    }

    // Merge gates from loaded data with defaults
    function mergeGatesWithDefaults(entryGates) {
        const defaults = createDefaultGates();
        if (!entryGates) return defaults;

        return {
            requireTags: entryGates.requireTags || defaults.requireTags,
            blocksTags: entryGates.blocksTags || defaults.blocksTags,
            emotionGates: {
                andAny: entryGates.emotionGates?.andAny || defaults.emotionGates.andAny,
                andAll: entryGates.emotionGates?.andAll || defaults.emotionGates.andAll,
                notAny: entryGates.emotionGates?.notAny || defaults.emotionGates.notAny,
                notAll: entryGates.emotionGates?.notAll || defaults.emotionGates.notAll
            },
            erosGates: {
                currentVibe: {
                    min: entryGates.erosGates?.currentVibe?.min ?? defaults.erosGates.currentVibe.min,
                    max: entryGates.erosGates?.currentVibe?.max ?? defaults.erosGates.currentVibe.max
                },
                longTermMin: entryGates.erosGates?.longTermMin ?? defaults.erosGates.longTermMin
            },
            intentGates: {
                allowedIntents: entryGates.intentGates?.allowedIntents || defaults.intentGates.allowedIntents
            },
            entityGates: {
                restrictToActors: entryGates.entityGates?.restrictToActors || defaults.entityGates.restrictToActors
            },
            probability: entryGates.probability ?? defaults.probability
        };
    }

    // Export
    A.GateTypes = {
        EMOTIONS,
        EROS_LEVELS,
        INTENTS,
        createDefaultGates,
        mergeGatesWithDefaults
    };

})(window.Anansi);
