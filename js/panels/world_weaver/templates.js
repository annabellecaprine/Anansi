/*
 * World Weaver: Templates & Constants
 * File: js/panels/world_weaver/templates.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    const WORLD_ARCHETYPES = [
        {
            id: 'fantasy',
            label: 'Fantasy',
            icon: '⚔️',
            description: 'Magic, mythical creatures, and ancient echoes.',
            seeds: {
                worldRules: 'Magic exists (consider system/cost). Tech level often medieval/renaissance.',
                setting: 'Kingdoms, ruins, guilds, or mystical wilds.'
            }
        },
        {
            id: 'scifi',
            label: 'Sci-Fi',
            icon: '🚀',
            description: 'Advanced tech, space travel, and future horizons.',
            seeds: {
                worldRules: 'High technology (AI, FTL, cybernetics). Science dictates reality.',
                setting: 'Space stations, colony worlds, megacities, or starships.'
            }
        },
        {
            id: 'modern',
            label: 'Modern',
            icon: '🏙️',
            description: 'Contemporary world, realistic or hidden supernatural.',
            seeds: {
                worldRules: 'Laws of physics apply. Technology is current-day.',
                setting: 'Real-world cities, towns, or institutions.'
            }
        },
        {
            id: 'historical',
            label: 'Historical',
            icon: '📜',
            description: 'A specific past era of Earth history.',
            seeds: {
                worldRules: 'Strict historical accuracy (no magic/scifi unless specified).',
                setting: 'Specific historical period (e.g., Victorian, Sengoku, Wild West).'
            }
        }
    ];

    const STORY_MODES = [
        {
            id: 'sliceoflife',
            label: 'Slice of Life',
            icon: '🌸',
            description: 'Daily life, relationships, and personal growth.',
            questionFocus: ['daily routines', 'social circles', 'personal struggles', 'small victories'],
            seeds: {
                coreExperience: 'Focus: Intimacy, routine, and character dynamics.',
            }
        },
        {
            id: 'epic',
            label: 'Epic / Adventure',
            icon: '🌍',
            description: 'Grand scales, high stakes, and hero\'s journeys.',
            questionFocus: ['the great threat', 'the call to action', 'factions at war', 'the destiny'],
            seeds: {
                coreExperience: 'Focus: High stakes, travel, and changing the world.',
                storyArc: 'A journey that alters the fate of nations or worlds.'
            }
        },
        {
            id: 'mystery',
            label: 'Mystery / Noir',
            icon: '🕵️',
            description: 'Secrets, investigations, and uncovering the truth.',
            questionFocus: ['the crime', 'the conspiracy', 'suspicion', 'clues'],
            seeds: {
                coreExperience: 'Focus: Tension, curiosity, and the unknown.',
                setting: 'Shadows, secrets, and things hidden in plain sight.'
            }
        },
        {
            id: 'horror',
            label: 'Horror / Thriller',
            icon: '👻',
            description: 'Fear, survival, and confronting the darkness.',
            questionFocus: ['nature of the threat', 'isolation factors', 'survival odds', 'the unknown'],
            seeds: {
                coreExperience: 'Focus: Dread, tension, and survival.',
                guardrails: 'Maintain an atmosphere of unease or terror.'
            }
        },
        {
            id: 'romance',
            label: 'Romance',
            icon: '💕',
            description: 'Love, passion, and emotional bonds.',
            questionFocus: ['relationship dynamic', 'obstacles to love', 'attraction', 'emotional growth'],
            seeds: {
                coreExperience: 'Focus: Emotional connection and chemistry.',
                mechanics: 'Tracking: Trust, Affection, or Relationship Milestones.'
            }
        }
    ];

    const CATEGORIES = {
        coreExperience: {
            label: 'Core Experience',
            weight: 20,
            icon: '🎯',
            subFacets: ['Goal/Conflict', 'Tone/Atmosphere', 'Intended Audience']
        },
        worldRules: {
            label: 'World Rules',
            weight: 20,
            icon: '⚙️',
            subFacets: ['Physics/Magic', 'Technology Level', 'Economy/Resources', 'Cosmology']
        },
        setting: {
            label: 'Setting/Situation',
            weight: 15,
            icon: '🏔️',
            subFacets: ['Geography/Location', 'Era/Time Period', 'Society/Culture', 'Immediate Situation']
        },
        cast: {
            label: 'Cast & Characters',
            weight: 15,
            icon: '👥',
            subFacets: ['Protagonist Identity', 'Key Relationships', 'Antagonists', 'Supporting Cast']
        },
        storyArc: {
            label: 'Story Arc',
            weight: 15,
            icon: '📖',
            subFacets: ['Inciting Incident', 'Rising Action', 'Climax/Goal', 'Resolution']
        },
        writingStyle: {
            label: 'Writing Style',
            weight: 10,
            icon: '✍️',
            subFacets: ['Perspective (POV)', 'Tense', 'Voice/Diction', 'Pacing']
        },
        mechanics: {
            label: 'Mechanics',
            weight: 10,
            icon: '🎲',
            subFacets: ['Attributes/Stats', 'Tracking Systems', 'Progression', 'Safety Tools']
        },
        guardrails: {
            label: 'Guardrails',
            weight: 5,
            icon: '🚧',
            subFacets: ['Content Limits', 'Veils', 'Lines', 'Safety Protocols']
        }
    };

    const CONTENT_RATINGS = [
        { id: 'sfw', label: 'SFW', description: 'Clean language, fade-to-black' },
        { id: 'nsfw_themes', label: 'NSFW (Themes)', description: 'Dark, violent, mature psychological' },
        { id: 'adult', label: 'Adult (18+)', description: 'Explicit content allowed' }
    ];

    // Helper to merge facets from Archetype + Mode
    function combineFacets(arch, mode) {
        // Base categories
        const facets = {};
        Object.keys(CATEGORIES).forEach(k => {
            facets[k] = [...CATEGORIES[k].subFacets];
        });

        // Use seeds to flavor (Logic simplified for now)
        // In V2, we might add specific sub-facets based on Arch/Mode
        return facets;
    }

    function getIntroMessage(arch, mode) {
        const firstCatKey = Object.keys(CATEGORIES)[0];
        const firstCatLabel = CATEGORIES[firstCatKey].label;
        return `Welcome to the World Weaver. You have selected **${arch.label}** with a focus on **${mode.label}**.\n\n` +
            `I am ready to help you build this world. Tell me about your protagonist, or let's start defining the **${firstCatLabel}**...`;
    }

    // Expose
    A.WorldWeaver.Templates = {
        WORLD_ARCHETYPES,
        STORY_MODES,
        CATEGORIES,
        CONTENT_RATINGS,
        combineFacets,
        getIntroMessage
    };

})(window.Anansi);
