/**
 * Anansi RPG: Prompt Template System
 * File: js/plugins/rpg/rpg_prompts.js
 * Purpose: Centralized, customizable prompt management for LLM interactions
 * Inspired by LlamaTale's prompt_templates system
 */

(function (RPG) {
    'use strict';

    RPG.Prompts = {
        /**
         * Template library - all prompts in one place
         * Use {placeholder} syntax for variable substitution
         */
        templates: {
            // ===== COMBAT =====
            COMBAT: `Describe this combat action in 2-3 vivid sentences.

Action: {action}
Attacker: {attacker_name} ({attacker_class})
Defender: {defender_name} ({defender_class})
Weapon: {weapon}
Result: {result}
Damage: {damage}
Tone: {tone}

Write a dramatic narration:`,

            COMBAT_DEATH: `Describe the defeat of {defender_name} in 1-2 sentences.
They were struck by {attacker_name}'s {weapon}.
Final blow dealt {damage} damage.
Tone: {tone}

Narration:`,

            // ===== DIALOGUE =====
            DIALOGUE: `You are {npc_name}, a {npc_class}.

Personality: {personality}
Your attitude toward the speaker: {sentiment}

{memory_context}

The speaker says: "{player_input}"

Respond as {npc_name} in 1-3 sentences. Stay in character. Do not break the fourth wall.

{npc_name}:`,

            DIALOGUE_GREETING: `You are {npc_name}, a {npc_class}.
Personality: {personality}
Attitude toward approaching person: {sentiment}
Location: {location}

Someone approaches. Write a brief greeting (1-2 sentences) as {npc_name}.

{npc_name}:`,

            // ===== IDLE ACTIONS =====
            IDLE_ACTION: `Generate a brief idle action for an NPC.

Character: {npc_name}, a {occupation}
Personality: {personality}
Location: {location}

Write what {npc_name} does in 10-20 words. Present tense, third person.
The action should be immersive flavor (adjusting gear, looking around, muttering, etc).

Rules:
- Do NOT start combat
- Do NOT give items to anyone
- Do NOT change any game state
- Do NOT interact with the player directly

Action:`,

            // ===== REACTIONS =====
            REACTION: `{npc_name} witnesses the following event:
"{event}"

Their personality: {personality}
Their sentiment toward the actor: {sentiment}

How does {npc_name} react? Write 1-2 sentences in third person.

Reaction:`,

            // ===== SCENE DESCRIPTIONS =====
            SCENE: `Describe this RPG scene in 2-4 atmospheric sentences.

Location: {location_name}
Description: {location_desc}
Present: {entities_present}
Time: {time_of_day}
Mood: {world_mood}

Scene:`,

            SCENE_ENTER: `The party enters {location_name}.
Description: {location_desc}
Visible: {entities_present}
Atmosphere: {world_mood}

Write 2-3 sentences describing what they see and feel upon entering.

Narration:`,

            // ===== WORLD BUILDING =====
            LOCATION_GENERATE: `Generate a location for a {genre} RPG.

Connected to: {connected_location}
Direction: {direction}
World mood: {world_mood}
Theme hints: {theme_hints}

Provide:
- Name (2-4 words)
- Description (2-3 sentences)
- Possible encounters (comma-separated list)

Format as JSON: {"name": "", "description": "", "encounters": []}`,

            NPC_GENERATE: `Create an NPC for a {genre} RPG.

Location: {location}
Role needed: {role}
World mood: {world_mood}

Provide:
- Name
- Class/Occupation
- Brief personality (2-3 traits)
- Appearance (1-2 sentences)

Format as JSON: {"name": "", "class": "", "personality": "", "appearance": ""}`,

            // ===== QUESTS =====
            QUEST_HINT: `{npc_name} wants to give the player a hint about their quest.

Quest: {quest_objective}
Progress: {quest_progress}
NPC personality: {personality}

Write a 1-2 sentence hint as {npc_name}.

{npc_name}:`,

            // ===== COMBAT NARRATIVE =====
            INITIATIVE_START: `Combat begins! Describe the tension as combatants prepare.

Participants: {participants}
Location: {location}
Atmosphere: {atmosphere}

Write 2-3 sentences setting the scene for battle.

Narration:`,

            TURN_ANNOUNCE: `It is now {character_name}'s turn to act.
They are a {character_class} with {hp} HP remaining.
Current round: {round}

Write a brief (1 sentence) announcement of their turn.

Announcement:`
        },

        /**
         * Render a template with variable substitution
         * @param {string} templateName - Name of template to use
         * @param {object} values - Key-value pairs for substitution
         * @returns {string} Rendered prompt
         */
        render: function (templateName, values = {}) {
            let template = this.templates[templateName];

            if (!template) {
                console.warn(`[RPG.Prompts] Unknown template: ${templateName}`);
                return '';
            }

            // Substitute all {placeholder} occurrences
            for (const [key, value] of Object.entries(values)) {
                const pattern = new RegExp(`\\{${key}\\}`, 'g');
                template = template.replace(pattern, value ?? '');
            }

            // Clean up any remaining unsubstituted placeholders
            template = template.replace(/\{[a-z_]+\}/gi, '');

            return template.trim();
        },

        /**
         * Override or add a template
         * @param {string} name - Template name
         * @param {string} content - Template content
         */
        setTemplate: function (name, content) {
            this.templates[name] = content;
            console.log(`[RPG.Prompts] Template "${name}" updated`);
        },

        /**
         * Get a template without rendering
         * @param {string} name - Template name
         * @returns {string|null}
         */
        getTemplate: function (name) {
            return this.templates[name] || null;
        },

        /**
         * List all available template names
         * @returns {string[]}
         */
        listTemplates: function () {
            return Object.keys(this.templates);
        },

        /**
         * Export all templates as JSON (for backup/customization)
         * @returns {string}
         */
        exportTemplates: function () {
            return JSON.stringify(this.templates, null, 2);
        },

        /**
         * Import templates from JSON
         * @param {string|object} data - JSON string or object
         */
        importTemplates: function (data) {
            try {
                const templates = typeof data === 'string' ? JSON.parse(data) : data;
                Object.assign(this.templates, templates);
                console.log('[RPG.Prompts] Templates imported successfully');
            } catch (e) {
                console.error('[RPG.Prompts] Failed to import templates:', e);
            }
        },

        /**
         * Quick helper: Render combat action
         */
        combat: function (action, attacker, defender, result, damage, weapon = 'weapon') {
            return this.render('COMBAT', {
                action: action,
                attacker_name: attacker.name,
                attacker_class: attacker.class || 'combatant',
                defender_name: defender.name,
                defender_class: defender.class || 'combatant',
                weapon: weapon,
                result: result,
                damage: damage,
                tone: 'heroic fantasy'
            });
        },

        /**
         * Quick helper: Render dialogue
         */
        dialogue: function (npc, playerInput, sentiment = 'neutral', memoryContext = '') {
            return this.render('DIALOGUE', {
                npc_name: npc.name,
                npc_class: npc.class || npc.occupation || 'person',
                personality: npc.personality || '',
                sentiment: sentiment,
                memory_context: memoryContext,
                player_input: playerInput
            });
        },

        /**
         * Quick helper: Render idle action
         */
        idle: function (npc, location = 'the area') {
            return this.render('IDLE_ACTION', {
                npc_name: npc.name,
                occupation: npc.class || npc.occupation || 'person',
                personality: npc.personality || '',
                location: location
            });
        }
    };

    console.log('[RPG] Prompt template system loaded');

})(window.RPG || (window.RPG = {}));
