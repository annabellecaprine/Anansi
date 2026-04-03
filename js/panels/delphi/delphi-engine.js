/*
 * Anansi Core: Temple of Delphi - Diagnostic Engine
 * File: js/panels/delphi/delphi-engine.js
 * Purpose: Persona diagnostic analysis - prompt building, LLM evaluation, history tracking.
 */

(function (A) {
    'use strict';

    const HISTORY_KEY = 'anansi_delphi_history';
    const MAX_HISTORY = 50;

    // --- DEPTH TIER PROMPTS ---

    const DEPTH_PROMPTS = {
        surface: `You are a character design analyst. You will receive a character definition (personality and scenario fields). Do NOT roleplay as this character. Provide a concise diagnostic:

1. **DOMINANCE HIERARCHY**: List the top 5 traits/descriptors by signal strength. For each, state what behavioral pattern it produces. Rank from strongest to weakest.

2. **TRIGGER PHRASES** (Top 3): Identify the 3 phrases most likely to create strong or unintended behavioral pulls (hostility, passivity, robotic speech, angst spirals, tone locks, etc.). For each, state what it triggers.

Keep your response concise and structured. Use markdown formatting.`,

        casual: `You are a character design analyst. You will receive a character definition (personality and scenario fields), and optionally a conversation history showing the character in action. Do NOT roleplay as this character. Provide a structured diagnostic:

1. **TRAIT INTERPRETATION MAP**: For each significant trait or descriptor in the personality/scenario, explain:
   - How you interpret it
   - What behavioral pattern it produces in your output
   - Whether it skews positive, negative, or neutral

2. **DOMINANCE HIERARCHY**: Rank ALL traits by signal strength. Which dominate your interpretation? Which get overshadowed or ignored?

3. **TRIGGER PHRASES & SKEW WARNINGS**: Identify specific phrases that create strong behavioral pulls. Flag any that might produce unintended effects:
   - Hostility magnets (phrases that make the character overly aggressive)
   - Passivity triggers (phrases that make them too submissive)
   - Tone locks (phrases that force robotic, clinical, or one-note speech)
   - Angst traps (phrases that cause unsolicited tragic backstory)
   - Positivity overrides (phrases that negate intended edge)

4. **CONTRADICTIONS**: Flag traits that compete with each other. Explain which one wins in ambiguous situations and why.

Use markdown formatting with headers and bullet points.`,

        deep: `You are a character design analyst. You will receive a character definition (personality and scenario fields), and optionally a conversation history showing the character in action. Do NOT roleplay as this character. Provide an exhaustive diagnostic:

1. **TRAIT INTERPRETATION MAP**: For EVERY trait, descriptor, and behavioral instruction in the personality and scenario, explain:
   - Your exact interpretation
   - The behavioral pattern it produces
   - Positive/negative/neutral skew
   - Signal strength (1-10)

2. **DOMINANCE HIERARCHY**: Rank ALL traits by signal strength. Explain WHY certain traits dominate (word choice, placement, repetition, emotional weight).

3. **TRIGGER PHRASES & SKEW WARNINGS**: Identify ALL phrases that create behavioral pulls:
   - Hostility magnets
   - Passivity triggers
   - Tone locks (robotic, clinical, one-note speech patterns)
   - Angst traps (unsolicited tragedy)
   - Positivity overrides
   - Relationship distortions (misreading dynamics)
   For each, explain the mechanism and suggest an alternative phrasing.

4. **CONTRADICTIONS**: Flag ALL competing traits. For each pair:
   - Which wins in ambiguous situations
   - What the LLM defaults to when confused
   - How to resolve the contradiction if the author wants both

5. **RECOMMENDATIONS**: Provide specific rewording suggestions to better achieve the apparent authorial intent:
   - Show BEFORE and AFTER text for each suggestion
   - Explain why the change works
   - Note which traits the change strengthens or weakens

6. **SECTION-BY-SECTION SCORING**:
   - Personality Coherence: X/10
   - Scenario Clarity: X/10
   - Trait Balance: X/10
   - Behavioral Predictability: X/10
   - Overall Persona Strength: X/10

Use markdown formatting with headers, bullet points, and bold for emphasis.`
    };

    const Delphi = {

        /**
         * Compile persona data from the current project state.
         * @param {Object} state - Anansi state
         * @param {'standalone'|'midchat'} mode
         * @param {Array} [chatHistory] - Chat history for mid-chat mode
         * @returns {Object} { personality, scenario, characterName, actorSummary, cues, voices }
         */
        compilePersonaData: function (state, mode, chatHistory) {
            const result = {
                characterName: '',
                personality: '',
                scenario: '',
                actorSummary: '',
                cues: '',
                voices: '',
                chatHistory: []
            };

            // Get character data
            const compiled = state.character?.compiled;
            const seed = state.seed || {};

            result.characterName = compiled?.name || seed.name || seed.characterName || 'Unknown';
            result.personality = compiled?.personality || seed.persona || '';
            result.scenario = compiled?.scenario || seed.scenario || '';

            if (mode === 'midchat' && chatHistory && chatHistory.length > 0) {
                // Run processRound to get post-injection state
                try {
                    const roundResult = A.Simulator.processRound(
                        chatHistory[chatHistory.length - 1]?.content || '',
                        chatHistory,
                        'input'
                    );
                    const ctx = roundResult.context;
                    result.personality = ctx.character?.personality || result.personality;
                    result.scenario = ctx.character?.scenario || result.scenario;
                    result.chatHistory = chatHistory;
                } catch (e) {
                    console.warn('[Delphi] processRound failed, using raw data:', e);
                }
            }

            // Gather actor cue info
            const charId = state.character?.char?.id;
            if (charId && state.nodes?.actors?.items?.[charId]) {
                const actor = state.nodes.actors.items[charId];
                const lines = [];

                if (actor.profile) {
                    if (actor.profile.gender) lines.push(`Gender: ${actor.profile.gender}`);
                    if (actor.profile.tags?.length) lines.push(`Tags: ${actor.profile.tags.join(', ')}`);
                }

                // Cues summary
                if (actor.cues) {
                    const cueSections = ['pulse', 'eros', 'intent'];
                    cueSections.forEach(section => {
                        const cueData = actor.cues[section];
                        if (cueData) {
                            const entries = Object.entries(cueData)
                                .filter(([_, v]) => v && typeof v === 'object' && v.basic)
                                .map(([tag, v]) => `  ${tag}: "${v.basic}"`);
                            if (entries.length) {
                                lines.push(`${section.toUpperCase()} Cues:`);
                                lines.push(...entries);
                            }
                        }
                    });
                }

                // Quirks
                if (actor.quirks?.list?.length) {
                    lines.push(`Quirks: ${actor.quirks.list.map(q => q.text || q).join('; ')}`);
                }

                result.actorSummary = lines.join('\n');
            }

            // Gather voice info
            if (state.nodes?.voices?.items) {
                const voiceEntries = Object.values(state.nodes.voices.items);
                if (voiceEntries.length) {
                    const voiceLines = voiceEntries.map(v => {
                        const parts = [`Voice: ${v.name || 'Unnamed'}`];
                        if (v.diction) parts.push(`  Diction: ${v.diction}`);
                        if (v.cadence) parts.push(`  Cadence: ${v.cadence}`);
                        if (v.forbidden?.length) parts.push(`  Forbidden: ${v.forbidden.join(', ')}`);
                        if (v.vocabulary?.length) parts.push(`  Vocabulary: ${v.vocabulary.join(', ')}`);
                        return parts.join('\n');
                    });
                    result.voices = voiceLines.join('\n\n');
                }
            }

            return result;
        },

        /**
         * Build the full diagnostic prompt for the LLM.
         * @param {Object} personaData - Output of compilePersonaData
         * @param {'surface'|'casual'|'deep'} depth
         * @returns {string} The system prompt
         */
        buildDiagnosticPrompt: function (personaData, depth) {
            const basePrompt = DEPTH_PROMPTS[depth] || DEPTH_PROMPTS.casual;

            let dataBlock = `\n\n--- CHARACTER DEFINITION ---\n`;
            dataBlock += `Character Name: ${personaData.characterName}\n\n`;

            if (personaData.personality) {
                dataBlock += `[PERSONALITY]\n${personaData.personality}\n\n`;
            }

            if (personaData.scenario) {
                dataBlock += `[SCENARIO]\n${personaData.scenario}\n\n`;
            }

            if (personaData.actorSummary) {
                dataBlock += `[ACTOR METADATA & CUES]\n${personaData.actorSummary}\n\n`;
            }

            if (personaData.voices) {
                dataBlock += `[VOICE DEFINITIONS]\n${personaData.voices}\n\n`;
            }

            dataBlock += `--- END CHARACTER DEFINITION ---`;

            return basePrompt + dataBlock;
        },

        /**
         * Run a diagnostic evaluation.
         * @param {Object} options
         * @param {'standalone'|'midchat'} options.mode
         * @param {'surface'|'casual'|'deep'} options.depth
         * @param {Object} [options.llmConfig] - Override LLM config (provider, model, apiKey, baseUrl)
         * @returns {Promise<Object>} { report, personaData, depth, mode, timestamp, model, provider }
         */
        evaluate: async function (options = {}) {
            const { mode = 'standalone', depth = 'casual', llmConfig } = options;

            const state = A.State.get();
            const chatHistory = mode === 'midchat' ? (state.sim?.history || []) : [];
            const personaData = Delphi.compilePersonaData(state, mode, chatHistory);

            if (!personaData.personality && !personaData.scenario) {
                throw new Error('No personality or scenario data found. Load a project with a character defined.');
            }

            const systemPrompt = Delphi.buildDiagnosticPrompt(personaData, depth);

            // Build history for LLM call
            const llmHistory = [];

            // If mid-chat, include a summary of recent conversation
            if (mode === 'midchat' && chatHistory.length > 0) {
                const recentMsgs = chatHistory.slice(-6);
                const chatSummary = recentMsgs.map(m =>
                    `${m.role === 'user' ? 'USER' : 'CHARACTER'}: ${(m.content || '').substring(0, 200)}`
                ).join('\n');
                llmHistory.push({
                    role: 'user',
                    content: `Here is the recent conversation this character has been having:\n\n${chatSummary}\n\nPlease analyze the character definition provided in the system prompt and provide your diagnostic report.`
                });
            } else {
                llmHistory.push({
                    role: 'user',
                    content: 'Please analyze the character definition provided in the system prompt and provide your diagnostic report.'
                });
            }

            // Get LLM config
            const config = llmConfig || (A.UI?.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null);
            if (!config || !config.apiKey) {
                throw new Error('No API key configured. Open API Configuration to set one up.');
            }

            const maxTokens = A.UI?.getMaxTokensFor?.('delphi') || A.UI?.getGenerationSettings?.()?.globalMaxTokens || 4096;

            const response = await A.Simulator.callLLM(
                config.provider,
                config.model,
                config.apiKey,
                systemPrompt,
                llmHistory,
                config.baseUrl
            );

            const result = {
                report: response,
                personaData: {
                    characterName: personaData.characterName,
                    personalityPreview: (personaData.personality || '').substring(0, 200),
                    scenarioPreview: (personaData.scenario || '').substring(0, 200)
                },
                depth: depth,
                mode: mode,
                provider: config.provider,
                model: config.model,
                timestamp: new Date().toISOString()
            };

            // Save to history
            Delphi.saveHistory(result);

            return result;
        },

        /**
         * Run evaluation against multiple LLM providers.
         * @param {Object} options - Same as evaluate, but runs against all configured providers
         * @returns {Promise<Array>} Array of results, one per provider
         */
        evaluateMulti: async function (options = {}) {
            const configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');

            if (configs.length < 2) {
                throw new Error('Cross-model comparison requires at least 2 LLM configurations. Add more in API Configuration.');
            }

            const results = [];
            const errors = [];

            for (const cfg of configs) {
                if (!cfg.apiKey && A.UI?.PROVIDER_PRESETS?.[cfg.provider]?.needsKey) {
                    errors.push({ provider: cfg.provider, model: cfg.model, name: cfg.name, error: 'No API key' });
                    continue;
                }

                const preset = A.UI?.PROVIDER_PRESETS?.[cfg.provider] || {};
                try {
                    const result = await Delphi.evaluate({
                        ...options,
                        llmConfig: {
                            provider: cfg.provider,
                            model: cfg.model || preset.defaultModel,
                            apiKey: cfg.apiKey,
                            baseUrl: cfg.baseUrl || preset.baseUrl
                        }
                    });
                    result.configName = cfg.name;
                    results.push(result);
                } catch (e) {
                    errors.push({ provider: cfg.provider, model: cfg.model, name: cfg.name, error: e.message });
                }
            }

            return { results, errors };
        },

        /**
         * Run an interactive consultation about a diagnostic report.
         * @param {Object} options
         * @param {string} options.report - The diagnostic report text
         * @param {Object} options.personaData - Compiled persona data (from evaluate result)
         * @param {Array} options.chatHistory - Previous consultation messages [{role, content}]
         * @param {string} options.userMessage - The user's new question
         * @param {Object} [options.llmConfig] - Override LLM config
         * @returns {Promise<string>} LLM response text
         */
        consult: async function (options = {}) {
            const { report, personaData, chatHistory = [], userMessage, llmConfig } = options;

            if (!report || !userMessage) {
                throw new Error('A diagnostic report and a question are required.');
            }

            // Build consultant system prompt with full context
            const systemPrompt = `You are a character design consultant. You have just completed a diagnostic report on a character definition. The user will now ask questions about the report and request specific changes.

RULES:
- When suggesting rewording, always show BEFORE and AFTER text.
- Stay analytical — do NOT roleplay as the character.
- Be specific about which section of the definition to change and why.
- Reference specific traits, phrases, and sections from the report.
- If the user asks to shift a character in a direction, explain which traits to strengthen, weaken, add, or remove.

--- CHARACTER DEFINITION ---
Character Name: ${personaData?.characterName || 'Unknown'}

${personaData?.personalityPreview ? `[PERSONALITY PREVIEW]\n${personaData.personalityPreview}` : ''}

${personaData?.scenarioPreview ? `[SCENARIO PREVIEW]\n${personaData.scenarioPreview}` : ''}
--- END CHARACTER DEFINITION ---

--- DIAGNOSTIC REPORT ---
${report}
--- END DIAGNOSTIC REPORT ---`;

            // Build conversation history for multi-turn
            const llmHistory = [...chatHistory, { role: 'user', content: userMessage }];

            // Get LLM config
            const config = llmConfig || (A.UI?.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null);
            if (!config || !config.apiKey) {
                throw new Error('No API key configured. Open API Configuration to set one up.');
            }

            const response = await A.Simulator.callLLM(
                config.provider,
                config.model,
                config.apiKey,
                systemPrompt,
                llmHistory,
                config.baseUrl
            );

            return response;
        },

        /**
         * Get evaluation history.
         * @returns {Array}
         */
        getHistory: function () {
            try {
                return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            } catch (e) {
                return [];
            }
        },

        /**
         * Save an evaluation result to history.
         * @param {Object} result
         */
        saveHistory: function (result) {
            const history = Delphi.getHistory();
            history.unshift(result);
            if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            } catch (e) {
                // localStorage might be full — trim more aggressively
                history.length = Math.floor(MAX_HISTORY / 2);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
        },

        /**
         * Clear evaluation history.
         */
        clearHistory: function () {
            localStorage.removeItem(HISTORY_KEY);
        }
    };

    A.Delphi = Delphi;
    console.log('[Core] Temple of Delphi Engine registered.');

})(window.Anansi);
