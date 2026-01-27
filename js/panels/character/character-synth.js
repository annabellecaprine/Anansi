/*
 * Anansi Plugin: Character Synthesis
 * File: js/plugins/character/character-synth.js
 * 
 * Logic for combining multiple actors into a single character card.
 */

(function (A) {
    'use strict';

    // Ensure namespace
    A.Character = A.Character || {};
    A.Character.Synth = {};

    function synthesizePersonality(actorIds, state) {
        const actors = actorIds
            .map(id => state.nodes?.actors?.items?.[id])
            .filter(Boolean);

        if (!actors.length) return '';

        let output = '### CAST PROFILES\n';
        actors.forEach(actor => {
            output += `\n---\n**[${actor.name || 'Unnamed'}]**\n`;
            if (actor.role) output += `*Role:* ${actor.role}\n`;
            const description = actor.appearance || actor.description || actor.traits?.description || actor.cardFields?.description;
            if (description) {
                output += `*Appearance:* ${description}\n`;
            }

            const personality = actor.personality || actor.traits?.personality || actor.cardFields?.personality;
            if (personality) output += `*Personality:* ${personality}\n`;

            if (actor.quirks) {
                if (typeof actor.quirks === 'string') {
                    output += `*Quirks:* ${actor.quirks}\n`;
                } else if (typeof actor.quirks === 'object') {
                    // Flatten V2 Quirks
                    const qList = [];
                    ['physical', 'mental', 'emotional'].forEach(cat => {
                        if (Array.isArray(actor.quirks[cat])) {
                            actor.quirks[cat].forEach(q => {
                                if (q && q.text) qList.push(q.text.replace(/\{\{name\}\}/gi, actor.name || 'Character'));
                            });
                        }
                    });
                    if (qList.length) output += `*Quirks:* ${qList.join(' ')}\n`;
                }
            }
            // Include traits if available as array
            if (actor.traits && Array.isArray(actor.traits) && actor.traits.length) {
                output += `*Traits:* ${actor.traits.join(', ')}\n`;
            }
        });

        return output.trim();
    }

    function synthesizeScenario(actorIds, state, options = {}) {
        const actors = actorIds
            .map(id => state.nodes?.actors?.items?.[id])
            .filter(Boolean);

        if (!actors.length) return '';

        // Get pairs involving any of the selected actors
        const pairs = [];
        if (state.nodes?.pairs?.items) {
            Object.values(state.nodes.pairs.items).forEach(pair => {
                const a1 = state.nodes?.actors?.items?.[pair.actor1];
                const a2 = state.nodes?.actors?.items?.[pair.actor2];
                if (a1 && a2 && actorIds.includes(pair.actor1) && actorIds.includes(pair.actor2)) {
                    pairs.push({
                        actor1: a1.name || 'Unknown',
                        actor2: a2.name || 'Unknown',
                        type: pair.type || '',
                        summary: pair.content || pair.description || `${pair.type || 'Related'}`
                    });
                }
            });
        }

        let output = `You are a character simulation engine portraying multiple distinct characters in one scene.

## GLOBAL RULES
- Only ONE character speaks per response unless explicitly requested.
- Always prefix dialogue/actions with the speaking character's name: "Name: ..."
- Never write as or control {{user}}.
- Keep each character's personality, voice, and knowledge separate.
- If multiple characters could respond, choose the most narratively relevant one.

## ACTOR REGISTRY
${actors.map(a => `[${a.name || 'Unknown'}]`).join(' ')}`;

        if (pairs.length) {
            output += '\n\n## CAST DYNAMICS';
            pairs.forEach(p => {
                output += `\n**${p.actor1} ↔ ${p.actor2}**: ${p.summary}`;
            });
        }

        if (options.includeMoodTags && state.meta?.moodTags?.length) {
            output += `\n\n## NARRATIVE TONE\n${state.meta.moodTags.join(', ')}`;
        }

        if (options.includeNarrator) {
            output += `\n\n## NARRATOR ROLE
The Narrator may provide scene descriptions, transitions, and environmental details. 
Use sparingly for pacing. Format: *Narrator: [description]*`;
        }

        return output;
    }

    function synthesizeExamples(actorIds, state) {
        const actors = actorIds
            .map(id => state.nodes?.actors?.items?.[id])
            .filter(Boolean);

        if (!actors.length) return '';

        let output = '### ACTOR VOICE SAMPLES\n';
        actors.forEach(actor => {
            const examples = actor.exampleDialogue || actor.examples || actor.cardFields?.mes_example || actor.imported?.examples;
            if (examples) {
                output += `\n[${actor.name || 'Unknown'} Example]\n`;
                output += examples.trim() + '\n';
            }
        });

        return output.trim();
    }

    function getFirstMessageOptions(actorIds, state) {
        const options = [];
        const actors = actorIds
            .map(id => state.nodes?.actors?.items?.[id])
            .filter(Boolean);

        actors.forEach(actor => {
            const sources = [];

            // 1. Primary Editor Field
            if (actor.cardFields?.firstMessage) sources.push(actor.cardFields.firstMessage);

            // 2. Base field (Legacy array or string)
            if (actor.firstMessage) {
                if (Array.isArray(actor.firstMessage)) {
                    actor.firstMessage.forEach(m => sources.push(m));
                } else {
                    sources.push(actor.firstMessage);
                }
            }

            // 3. Imported metadata
            if (actor.imported?.firstMessage) sources.push(actor.imported.firstMessage);

            // Unique, non-empty greetings
            const uniqueGreetings = [...new Set(sources)].filter(s => typeof s === 'string' && s.trim());

            uniqueGreetings.forEach((greeting, idx) => {
                options.push({
                    label: actor.name || 'Actor',
                    count: uniqueGreetings.length > 1 ? `(${idx + 1}/${uniqueGreetings.length})` : '',
                    content: greeting,
                    actorId: actor.id
                });
            });
        });

        // Always add Custom 
        options.push({
            label: 'Custom',
            count: '',
            content: '',
            actorId: null,
            isCustom: true
        });

        return options;
    }

    function buildCardData(state, mode, personality, scenario, examples, firstMessage) {
        const charState = state.character;
        const isEnsemble = mode === 'ensemble';
        const modeState = isEnsemble ? charState.ensemble : charState.solo;

        // Determine character name (use override if set, otherwise synthesize from actors)
        let name = modeState.characterName || '';
        if (!name) {
            if (isEnsemble) {
                const actors = charState.ensemble.selectedActorIds
                    .map(id => state.nodes?.actors?.items?.[id])
                    .filter(Boolean);
                name = actors.length > 1
                    ? actors.map(a => a.name || 'Unnamed').join(' & ')
                    : (actors[0]?.name || 'Ensemble');
            } else {
                const actor = state.nodes?.actors?.items?.[charState.solo.selectedActorId];
                name = actor?.name || 'Character';
            }
        }

        // Build standard V2 card format
        return {
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: name,
                description: personality,
                personality: '',
                scenario: scenario,
                first_mes: firstMessage,
                mes_example: examples,
                creator_notes: `Generated by Anansi (${isEnsemble ? 'Ensemble' : 'Solo'} Mode)`,
                system_prompt: '',
                post_history_instructions: '',
                alternate_greetings: [],
                tags: [],
                creator: state.meta?.author || 'Anansi',
                character_version: '1.0',
                extensions: {}
            }
        };
    }

    async function exportCardAsPng(state, mode, personality, scenario, examples, firstMessage, portraitData) {
        try {
            const cardData = buildCardData(state, mode, personality, scenario, examples, firstMessage);

            // Convert data URL to blob
            const response = await fetch(portraitData);
            const blob = await response.blob();

            // Embed card data into PNG
            if (!A.CardEncoder?.embed) {
                throw new Error('Card encoder not available');
            }

            const cardPng = await A.CardEncoder.embed(blob, cardData);

            // Download
            const url = URL.createObjectURL(cardPng);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cardData.data.name.replace(/[^a-z0-9]/gi, '_')}_card.png`;
            a.click();
            URL.revokeObjectURL(url);

            if (A.UI?.Toast) A.UI.Toast.show(`Exported: ${cardData.data.name}`, 'success');
        } catch (err) {
            console.error('[Character2] Export error:', err);
            if (A.UI?.Toast) A.UI.Toast.show('Export failed: ' + err.message, 'error');
        }
    }

    // Exports
    A.Character.Synth.synthesizePersonality = synthesizePersonality;
    A.Character.Synth.synthesizeScenario = synthesizeScenario;
    A.Character.Synth.synthesizeExamples = synthesizeExamples;
    A.Character.Synth.getFirstMessageOptions = getFirstMessageOptions;
    A.Character.Synth.buildCardData = buildCardData;
    A.Character.Synth.exportCardAsPng = exportCardAsPng;

})(window.Anansi);
