/*
 * World Weaver: Templates & Constants
 * File: js/panels/world_weaver/templates.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    const GENRE_TEMPLATES = [
        {
            id: 'fantasy',
            label: 'Fantasy',
            icon: '⚔️',
            preSeeds: {
                worldRules: 'Magic exists. Consider: magic systems, races/species, medieval-to-renaissance tech level.',
                setting: 'This world may have kingdoms, guilds, ancient ruins, mystical forests.'
            },
            questionFocus: ['magic system', 'political structure', 'non-human races', 'prophecies or legends']
        },
        {
            id: 'scifi',
            label: 'Sci-Fi',
            icon: '🚀',
            preSeeds: {
                worldRules: 'Advanced technology exists. Consider: FTL travel, AI, cybernetics, aliens.',
                setting: 'Space stations, colony worlds, megacities, corporate dystopias.'
            },
            questionFocus: ['technology level', 'alien species', 'societal structure', 'human augmentation']
        },
        {
            id: 'romance',
            label: 'Romance',
            icon: '💕',
            preSeeds: {
                coreExperience: 'Focus on emotional connection and relationship development.',
                mechanics: 'Consider: trust/affection tracking, relationship milestones.'
            },
            questionFocus: ['relationship dynamic', 'emotional barriers', 'romantic tension', 'character chemistry']
        },
        {
            id: 'horror',
            label: 'Horror',
            icon: '👻',
            preSeeds: {
                worldRules: 'Something is wrong. The threat may be supernatural, psychological, or cosmic.',
                guardrails: 'Maintain tension and dread. The horror should feel inescapable.'
            },
            questionFocus: ['nature of the threat', 'isolation factors', 'psychological horror vs gore', 'survival odds']
        },
        {
            id: 'sliceoflife',
            label: 'Slice of Life',
            icon: '🌸',
            preSeeds: {
                worldRules: 'Realistic modern setting. No supernatural elements unless specified.',
                coreExperience: 'Focus on everyday interactions, personal growth, relationships.'
            },
            questionFocus: ['daily routines', 'social circles', 'personal struggles', 'small victories']
        },
        {
            id: 'freeform',
            label: 'Free Form',
            icon: '🎨',
            preSeeds: {},
            questionFocus: []
        }
    ];

    const CATEGORIES = {
        coreExperience: { label: 'Core Experience', weight: 20, icon: '🎯' },
        worldRules: { label: 'World Rules', weight: 20, icon: '⚙️' },
        setting: { label: 'Setting/Situation', weight: 15, icon: '🏔️' },
        cast: { label: 'Cast & Characters', weight: 15, icon: '👥' },
        storyArc: { label: 'Story Arc', weight: 15, icon: '📖' },
        mechanics: { label: 'Mechanics', weight: 10, icon: '🎲' },
        guardrails: { label: 'Guardrails', weight: 5, icon: '🚧' }
    };

    const CONTENT_RATINGS = [
        { id: 'sfw', label: 'SFW', description: 'Clean language, fade-to-black' },
        { id: 'nsfw_themes', label: 'NSFW (Themes)', description: 'Dark, violent, mature psychological' },
        { id: 'adult', label: 'Adult (18+)', description: 'Explicit content allowed' }
    ];

    // Expose
    A.WorldWeaver.Templates = {
        GENRE_TEMPLATES,
        CATEGORIES,
        CONTENT_RATINGS
    };

})(window.Anansi);
