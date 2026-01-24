/*
 * World Weaver: Generation & Review
 * File: js/panels/world_weaver/generation.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    // ===================================================================
    // MULTI-STEP CHARACTER GENERATION (Phase 7)
    // ===================================================================

    /**
     * Build context summary from session categories
     * @param {Object} session - World Weaver session
     * @returns {string} - Formatted context summary
     */
    function buildContextSummary(session) {
        const T = A.WorldWeaver.Templates;
        if (!T) return '';

        return Object.entries(session.categories)
            .filter(([_, cat]) => cat.summary)
            .map(([key, cat]) => `## ${T.CATEGORIES[key]?.label || key}\n${cat.summary}`)
            .join('\n\n');
    }

    /**
     * Step 0: Focus Context (Create Dossier)
     * Distills world context into a specific character dossier
     * @param {Object} session - World Weaver session
     * @param {string} targetName - Name of character to focus on
     * @returns {string} - Focused context string
     */
    async function summarizeContextFor(session, targetName) {
        const fullContext = buildContextSummary(session);
        // Add recent chat history for specifics (last 20 messages)
        const history = session.chatHistory.slice(-20).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const prompt = `Unify the world context and chat history into a focused dossier for a character named "${targetName}".
        
WORLD CONTEXT:
${fullContext}

RECENT CHAT:
${history}

Task: Extract every known fact, trait, relationship, and scenario detail about "${targetName}".
If details are missing, infer them logically from the world context (e.g. if they are a "Knight", infer they have armor/duty).

Return a concise summary (max 400 words) that will serve as the "Truth" for generating this character's profile. Do not include meta-text.`;

        try {
            const dossier = await A.LLM.generate(prompt, [], { maxTokens: 1024, temperature: 0.6 });
            return `FOCUSED DOSSIER FOR ${targetName.toUpperCase()}:\n${dossier}\n\n(Derived from World Context)`;
        } catch (e) {
            console.warn("Focus Context failed, falling back to full context:", e);
            return fullContext;
        }
    }

    /**
     * Step 1: Generate character identity
     * @returns {Object} - { name, gender, pronouns, aliases, tags }
     */
    async function generateIdentity(session, character, contextSummary) {
        const T = A.WorldWeaver.Templates;
        const genre = T.GENRE_TEMPLATES.find(g => g.id === session.genre) || T.GENRE_TEMPLATES[5];

        const prompt = `You are a character designer for a ${genre.label} story.
Generate ONLY the identity fields for this character.

${contextSummary ? `Context:\n${contextSummary}` : 'No context provided yet - create a compelling character.'}

Return ONLY this JSON:
{
  "name": "Full Name",
  "gender": "Male|Female|Neutral",
  "pronouns": "he/him|she/her|they/them",
  "aliases": ["Nickname1", "Title"],
  "tags": ["AURA_TAG1", "AURA_TAG2", "AURA_TAG3"]
}

AURA tags should reflect personality archetypes (e.g., NOBLE, SARCASTIC, WOUNDED, TACTICAL, CHEERFUL, MYSTERIOUS).`;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 1024, temperature: 0.7 });
                return A.JSONRepair.repairAndParse(response);
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Identity generation failed: ${e.message}`);
            }
        }
    }

    /**
     * Step 2: Generate character appearance
     * @returns {Object} - { appearance: { hair, eyes, build, description, appendages } }
     */
    async function generateAppearance(session, character, contextSummary) {
        const T = A.WorldWeaver.Templates;
        const genre = T.GENRE_TEMPLATES.find(g => g.id === session.genre) || T.GENRE_TEMPLATES[5];
        const isFantasy = ['fantasy', 'scifi'].includes(session.genre);

        // Get pronouns for consistent pronoun usage
        const pronouns = character.pronouns || 'they/them';
        const pronounParts = pronouns.split('/');
        const subjective = pronounParts[0] || 'they'; // he/she/they
        const possessive = pronounParts.length > 1 ? (subjective === 'he' ? 'his' : subjective === 'she' ? 'her' : 'their') : 'their';

        const prompt = `You are designing the appearance for ${character.name}, a ${character.gender || 'character'} in a ${genre.label} story.
Character uses ${pronouns} pronouns.
Character tags: ${(character.tags || []).join(', ')}

${contextSummary ? `Context:\n${contextSummary}` : ''}

Generate ONLY appearance details. Use ${subjective}/${possessive} pronouns consistently in the description.

Return ONLY this JSON:
{
  "hair": "Hair style and color",
  "eyes": "Eye color and notable features",
  "build": "Body type and physique",
  "description": "2-3 sentences describing overall appearance, scars, distinguishing features (use ${subjective}/${possessive} pronouns)",
  "appendages": { "ears": { "present": false }, "tail": { "present": false }, "wings": { "present": false }, "horns": { "present": false } }
}

For fantasy/sci-fi/supernatural characters (including hybrids, imps, demons, etc), set relevant appendages to present:true and ADD a "style" description (e.g. "pointed", "leathery").
For realistic human characters, keep all appendages present:false.`;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 1024, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return { appearance: result };
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Appearance generation failed: ${e.message}`);
            }
        }
    }

    /**
     * Step 3: Generate character card fields
     * @returns {Object} - { cardFields: { personality, description, scenario, firstMessage, mes_example } }
     */
    async function generateCardFields(session, character, contextSummary) {
        const appearance = character.appearance || {};
        const appearanceDesc = `${appearance.build || 'average build'}, ${appearance.hair || 'hair'}, ${appearance.eyes || 'eyes'} `;

        // Get pronouns for consistent usage
        const pronouns = character.pronouns || 'they/them';
        const pronounParts = pronouns.split('/');
        const subjective = pronounParts[0] || 'they';
        const objective = pronounParts.length > 1 ? (subjective === 'he' ? 'him' : subjective === 'she' ? 'her' : 'them') : 'them';
        const possessive = pronounParts.length > 1 ? (subjective === 'he' ? 'his' : subjective === 'she' ? 'her' : 'their') : 'their';

        const prompt = `You are writing a character card for ${character.name}.
            Identity: ${character.gender || 'Neutral'} (${pronouns})
        Appearance: ${appearanceDesc}
        Tags: ${(character.tags || []).join(', ')}

${contextSummary ? `World Context:\n${contextSummary}` : ''}

        IMPORTANT: Use ${subjective} /${objective}/${possessive} pronouns CONSISTENTLY throughout all fields.

Generate the character card fields.

Return ONLY this JSON:
        {
            "personality": "2-3 paragraphs describing personality, demeanor, quirks, and behavior patterns (use ${subjective}/${possessive} pronouns)",
                "description": "Full character description including background, motivations, and current situation (use ${subjective}/${possessive} pronouns)",
                    "scenario": "The setting and context for interactions with this character",
                        "firstMessage": "An opening line or action from ${character.name} to start a conversation",
                            "mes_example": "<START>\\n{{char}}: Example line from ${character.name}\\n{{user}}: Example response\\n{{char}}: Another line"
        } `;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 2048, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return { cardFields: result };
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Card fields generation failed: ${e.message} `);
            }
        }
    }

    /**
     * Step 4: Generate character quirks
     * @returns {Object} - { quirks: { activationChance, physical, mental, emotional } }
     */
    async function generateQuirks(session, character, contextSummary) {
        // Get pronouns for template instructions
        const pronouns = character.pronouns || 'they/them';
        const pronounParts = pronouns.split('/');
        const subjective = pronounParts[0] || 'they';
        const possessive = pronounParts.length > 1 ? (subjective === 'he' ? 'his' : subjective === 'she' ? 'her' : 'their') : 'their';

        const prompt = `Generate behavioral quirks for ${character.name}(${character.gender || 'character'}, ${pronouns}).
            Tags: ${(character.tags || []).join(', ')}

Quirks are small, character - defining mannerisms triggered by AURA emotional tags.

IMPORTANT TEMPLATE USAGE:
        - {{ name }
    } will be replaced with "${character.name}"
    - {{ pos }
} will be replaced with "${possessive}"(possessive pronoun)
- Use third person(${subjective} / ${possessive}) when describing actions

Examples:
- Physical: "{{name}}'s hand moves to {{pos}} weapon" → "${character.name}'s hand moves to ${possessive} weapon"
    - Mental: "{{name}} mentally catalogues exits" → "${character.name} mentally catalogues exits"
        - Emotional: "{{pos}} voice softens" → "${possessive} voice softens"

Return ONLY this JSON:
{
    "activationChance": 20,
        "physical": [
            { "text": "{{name}} does something physical", "tags": ["TAG1"] }
        ],
            "mental": [
                { "text": "{{name}} thinks or realizes something", "tags": ["TAG2"] }
            ],
                "emotional": [
                    { "text": "{{name}}'s emotion shows subtly", "tags": ["TAG3"] }
                ]
}

Generate 1 - 2 quirks per category.Each quirk MUST have 1 - 2 tags from this EXACT list(NO other tags allowed):
JOY, SADNESS, ANGER, FEAR, DISGUST, SURPRISE, TRUST, ANTICIPATION, LOVE, AWE, CONTEMPT, OPTIMISM, QUESTION, COMMAND, STATEMENT, GREETING, FAREWELL, ROMANCE, TENSION, CONFLICT, NARRATIVE, DISCLOSURE

Do NOT use: DANGER, HAPPY, SCARED, or any other tags not in the above list.`;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 1536, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return { quirks: result };
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Quirks generation failed: ${e.message} `);
            }
        }
    }

    /**
     * Step 5: Generate internal notes
     * @returns {Object} - { notes: string }
     */
    async function generateNotes(session, character, contextSummary) {
        const prompt = `Summarize ${character.name} in 2 - 3 sentences for internal notes.
Focus on: role in the story, key conflicts, and relationship dynamics.

Character summary:
- Name: ${character.name}
- Tags: ${(character.tags || []).join(', ')}
- Personality: ${character.cardFields?.personality?.substring(0, 200) || 'Not yet defined'}

Return ONLY this JSON:
{
    "content": "Internal notes here."
} `;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 512, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return { notes: result.content };
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Notes generation failed: ${e.message} `);
            }
        }
    }

    /**
     * Step 6: Generate cues (PULSE, EROS, INTENT)
     * @returns {Object} - Updated traits with pulseCues, erosCues, intentCues
     */
    async function generateCues(session, character, contextSummary) {
        const appearance = character.appearance || {};
        const appendages = appearance.appendages || {};

        // Determine which appendages are present
        const presentAppendages = [];
        ['ears', 'tail', 'wings', 'horns'].forEach(part => {
            if (appendages[part]?.present) {
                presentAppendages.push(part);
            }
        });

        const hasAppendages = presentAppendages.length > 0;
        const pronouns = character.pronouns || 'they/them';
        const pronounParts = pronouns.split('/');
        const subjective = pronounParts[0] || 'they';
        const possessive = pronounParts.length > 1 ? (pronounParts[0] === 'he' ? 'his' : pronounParts[0] === 'she' ? 'her' : 'their') : 'their';

        const appendageFields = hasAppendages ? presentAppendages.map(p => `"${p}": ""`).join(', ') : '';

        const categories = [
            { id: 'pulseCues', name: 'PULSE (Emotional)', items: 'joy, sadness, anger, fear, romance, neutral, confusion, positive, negative', example: '"joy": { "basic": "..." }' },
            { id: 'erosCues', name: 'EROS (Intimacy)', items: 'platonic, tension, romance, physical, passion, explicit, conflict, aftercare', example: '"platonic": { "basic": "..." }' },
            { id: 'intentCues', name: 'INTENT (Actions)', items: 'question, disclosure, command, promise, conflict, smalltalk, meta, narrative', example: '"question": { "basic": "..." }' }
        ];

        const generatedTraits = {
            pulseCues: {},
            erosCues: {},
            intentCues: {}
        };

        // Helper to generate one category
        const generateCategory = async (cat) => {
            const prompt = `Generate ${cat.name} cues for ${character.name} (${character.gender || 'character'}, ${pronouns}).
            
Context:
- Personality: ${character.cardFields?.personality?.substring(0, 150) || 'Not defined'}
${hasAppendages ? `- Has: ${presentAppendages.join(', ')}` : ''}

Items to generate: ${cat.items}

Format:
- "basic": General behavior. Use "${character.name}" frequently instead of just pronouns. Write complete sentences.
${hasAppendages ? presentAppendages.map(p => `- "${p}": How ${possessive} ${p} react (e.g., "${character.name}'s ${p} twitch")`).join('\n') : ''}

Return ONLY this JSON keys for ${cat.id}:
{
  "${cat.id}": {
     ${cat.example}
     ... (generate all items: ${cat.items})
  }
}`;

            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 2048, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return result[cat.id] || {};
            } catch (e) {
                console.error(`Failed to generate ${cat.name}:`, e);
                return {};
            }
        };

        // Execute distinct calls (Sequential to avoid rate limits)
        for (const cat of categories) {
            generatedTraits[cat.id] = await generateCategory(cat);
        }

        return {
            pulseCues: generatedTraits.pulseCues,
            erosCues: generatedTraits.erosCues,
            intentCues: generatedTraits.intentCues
        };
    }

    /**
     * Show progress modal for multi-step generation
     * @returns {Object} - Modal controller with methods
     */
    function showProgressModal(retryCallback = null) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center;';

        modal.innerHTML = `
            <div style="background:var(--bg-surface); padding:32px; border-radius:12px; width:450px; max-width:90vw; box-shadow:0 8px 32px rgba(0,0,0,0.4);">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                    <span style="font-size:28px;">🕸️</span>
                    <h3 style="margin:0; color:var(--text-primary); font-size:18px;">Generating Character</h3>
                </div>
                
                <div id="progress-steps" style="margin:20px 0; display:flex; flex-direction:column; gap:12px;"></div>
                
                <div id="progress-status" style="color:var(--text-muted); font-size:13px; margin-top:16px; padding:12px; background:var(--bg-elevated); border-radius:6px; min-height:20px;"></div>
                
                <div id="progress-error" style="display:none; margin-top:16px; padding:12px; background:var(--status-error-bg, rgba(239,68,68,0.1)); border:1px solid var(--status-error); border-radius:6px; color:var(--status-error);"></div>
                
                <div id="progress-actions" style="margin-top:20px; display:flex; gap:8px; justify-content:flex-end;">
                    <button id="progress-cancel" class="btn btn-ghost" style="padding:8px 16px;">Cancel</button>
                </div>
            </div>
    `;

        document.body.appendChild(modal);

        const steps = ['Identity', 'Appearance', 'Card Fields', 'Quirks', 'Notes', 'Cues'];
        const stepsEl = modal.querySelector('#progress-steps');

        stepsEl.innerHTML = steps.map((s, i) => `
            <div class="step-item" data-idx="${i}" style="display:flex; align-items:center; gap:12px; padding:10px; background:var(--bg-elevated); border-radius:6px; border:1px solid var(--border-subtle); transition:all 0.3s ease;">
                <span class="step-icon" style="font-size:20px; flex-shrink:0;">⏳</span>
                <span style="flex:1; font-size:14px; color:var(--text-secondary);">${s}</span>
                <span class="step-status" style="font-size:11px; color:var(--text-muted); opacity:0;"></span>
            </div>
    `).join('');

        let cancelled = false;

        modal.querySelector('#progress-cancel').onclick = () => {
            if (confirm('Cancel character generation? Progress will be lost.')) {
                cancelled = true;
                sessionStorage.removeItem('ww_partial_character');
                modal.remove();
            }
        };

        return {
            updateStatus: (stepIdx, stepName) => {
                modal.querySelectorAll('.step-item').forEach((el, i) => {
                    const icon = el.querySelector('.step-icon');
                    const status = el.querySelector('.step-status');

                    if (i < stepIdx) {
                        // Completed steps
                        icon.textContent = '✓';
                        el.style.borderColor = 'var(--accent-primary)';
                        el.style.background = 'var(--bg-surface)';
                        status.textContent = 'Complete';
                        status.style.opacity = '1';
                        status.style.color = 'var(--accent-primary)';
                    } else if (i === stepIdx) {
                        // Current step
                        icon.textContent = '⟳';
                        el.style.borderColor = 'var(--accent-primary)';
                        el.style.background = 'var(--accent-soft, var(--bg-surface))';
                        el.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)';
                        status.textContent = 'Working...';
                        status.style.opacity = '1';
                        status.style.color = 'var(--accent-primary)';
                    } else {
                        // Pending steps
                        icon.textContent = '⏳';
                        el.style.borderColor = 'var(--border-subtle)';
                        el.style.background = 'var(--bg-elevated)';
                        el.style.boxShadow = 'none';
                        status.textContent = '';
                        status.style.opacity = '0';
                    }
                });

                modal.querySelector('#progress-status').innerHTML = `<strong>Step ${stepIdx + 1}/6:</strong> ${stepName}...`;
            },

            showError: (message, { retryStep, partialData }) => {
                const errorEl = modal.querySelector('#progress-error');
                errorEl.style.display = 'block';
                errorEl.innerHTML = `
                    <div style="display:flex; align-items:start; gap:8px;">
                        <span style="font-size:18px;">❌</span>
                        <div style="flex:1;">
                            <div style="font-weight:600; margin-bottom:4px;">Generation Failed</div>
                            <div style="font-size:12px; opacity:0.9;">${message}</div>
                        </div>
                    </div>
    `;

                const actionsEl = modal.querySelector('#progress-actions');
                actionsEl.innerHTML = `
    < button id = "retry-step" class="btn btn-secondary" style = "padding:8px 16px;" >🔄 Retry Step ${retryStep + 1}</button >
        <button id="use-partial" class="btn btn-ghost" style="padding:8px 16px;">Use Partial Data</button>
`;

                modal.querySelector('#retry-step').onclick = () => {
                    modal.remove();
                    if (retryCallback && typeof retryCallback === 'function') {
                        retryCallback(retryStep, partialData);
                    } else {
                        if (A.UI?.Toast?.show) A.UI.Toast.show('Retry not available', 'warning');
                    }
                };

                modal.querySelector('#use-partial').onclick = () => {
                    modal.remove();
                    // Show review modal with partial data
                    showReviewModal(partialData, 'character', null);
                    sessionStorage.removeItem('ww_partial_character');
                };
            },

            close: () => {
                modal.remove();
            },

            isCancelled: () => cancelled
        };
    }

    /**
     * Step 5: Generate internal notes
     * @returns {Object} - { notes: string }
     */
    async function generateNotes(session, character, contextSummary) {
        const prompt = `Summarize ${character.name} in 2 - 3 sentences for internal notes.
Focus on: role in the story, key conflicts, and relationship dynamics.

Character summary:
- Name: ${character.name}
- Tags: ${(character.tags || []).join(', ')}
- Personality: ${character.cardFields?.personality?.substring(0, 200) || 'Not yet defined'}

Return ONLY this JSON:
{
    "content": "Internal notes here."
} `;

        let attempts = 0;
        while (attempts <= 2) {
            try {
                const response = await A.LLM.generate(prompt, [], { maxTokens: 512, temperature: 0.7 });
                const result = A.JSONRepair.repairAndParse(response);
                return { notes: result.content };
            } catch (e) {
                if (attempts < 2) {
                    attempts++;
                    continue;
                }
                throw new Error(`Notes generation failed: ${e.message} `);
            }
        }
    }

    /**
     * Show resume prompt when partial character exists
     * @returns {Promise<{action: 'resume'|'fresh'|'cancel', partialData?: Object, resumeStep?: number}>}
     */
    function showResumePrompt(partialData) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center;';

            // Determine which step we're on based on what data exists
            let resumeStep = 0;
            if (partialData.name) resumeStep = 1; // Identity done
            if (partialData.appearance) resumeStep = 2; // Appearance done
            if (partialData.cardFields) resumeStep = 3; // Card done
            if (partialData.quirks) resumeStep = 4; // Quirks done
            if (partialData.notes) resumeStep = 5; // Notes done

            const stepNames = ['Identity', 'Appearance', 'Card Fields', 'Quirks', 'Notes', 'Cues'];
            const completedSteps = stepNames.slice(0, resumeStep).join(', ') || 'None';

            modal.innerHTML = `
                <div style="background:var(--bg-surface); padding:28px; border-radius:12px; width:420px; max-width:90vw; box-shadow:0 8px 32px rgba(0,0,0,0.4);">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                        <span style="font-size:28px;">💾</span>
                        <h3 style="margin:0; color:var(--text-primary); font-size:18px;">Resume Previous Generation?</h3>
                    </div>
                    
                    <div style="background:var(--bg-elevated); padding:16px; border-radius:8px; margin-bottom:20px;">
                        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:8px;">Found partial character:</div>
                        <div style="font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">${partialData.name || 'Unnamed Character'}</div>
                        <div style="font-size:11px; color:var(--text-muted);">Completed: ${completedSteps}</div>
                        <div style="font-size:11px; color:var(--accent-primary); margin-top:4px;">Will resume at: Step ${resumeStep + 1} (${stepNames[resumeStep] || 'Complete'})</div>
                    </div>
                    
                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                        <button id="resume-cancel" class="btn btn-ghost" style="padding:8px 16px;">Cancel</button>
                        <button id="resume-fresh" class="btn btn-secondary" style="padding:8px 16px;">🔄 Start Fresh</button>
                        <button id="resume-continue" class="btn btn-primary" style="padding:8px 16px; background:var(--accent); color:white;">▶️ Resume</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#resume-cancel').onclick = () => {
                modal.remove();
                resolve({ action: 'cancel' });
            };

            modal.querySelector('#resume-fresh').onclick = () => {
                modal.remove();
                sessionStorage.removeItem('ww_partial_character');
                resolve({ action: 'fresh' });
            };

            modal.querySelector('#resume-continue').onclick = () => {
                modal.remove();
                resolve({ action: 'resume', partialData, resumeStep });
            };
        });
    }

    /**
     * Run the 6-step pipeline for a single character
     * @param {Object} session - Current world weaver session
     * @param {string} contextSummary - Focused context for generation
     * @param {Function} progressCallback - Called on each step (stepIdx, totalSteps, stepName) => boolean
     * @param {number} startFromStep - Step index to resume from (default: 0)
     * @param {Object} existingCharacter - Partial character to resume (default: new character)
     */
    async function runGenerationPipeline(session, contextSummary, progressCallback, startFromStep = 0, existingCharacter = null) {
        const character = existingCharacter || {
            id: `actor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        };

        const steps = [
            { name: 'Identity', fn: generateIdentity },
            { name: 'Appearance', fn: generateAppearance },
            { name: 'Card Fields', fn: generateCardFields },
            { name: 'Quirks', fn: generateQuirks },
            { name: 'Notes', fn: generateNotes },
            { name: 'Cues', fn: generateCues }
        ];

        for (let i = startFromStep; i < steps.length; i++) {
            if (progressCallback && progressCallback(i, steps.length, steps[i].name) === false) return null;

            const step = steps[i];
            const result = await step.fn(session, character, contextSummary);
            Object.assign(character, result);

            // Save partial state
            sessionStorage.setItem('ww_partial_character', JSON.stringify(character));
        }

        return character;
    }

    /**
     * Multi-step character generation orchestrator (Supports Batch)
     */
    async function generateCharacterMultiStep(session, sessions, targetList = []) {
        const targets = targetList.length > 0 ? targetList : ["Protagonist"];
        const isBatch = targets.length > 1;

        // Check for partial character (resume detection) - only for single generation
        let resumeState = null;
        if (!isBatch) {
            const partialRaw = sessionStorage.getItem('ww_partial_character');
            if (partialRaw) {
                try {
                    const partialData = JSON.parse(partialRaw);
                    const resumeChoice = await showResumePrompt(partialData);

                    if (resumeChoice.action === 'cancel') {
                        return; // User cancelled
                    } else if (resumeChoice.action === 'resume') {
                        resumeState = {
                            character: resumeChoice.partialData,
                            startStep: resumeChoice.resumeStep
                        };
                    }
                    // 'fresh' action clears storage and continues with resumeState = null
                } catch (e) {
                    console.warn('[WorldWeaver] Could not parse partial character, starting fresh:', e);
                    sessionStorage.removeItem('ww_partial_character');
                }
            }
        }

        // Track state for retry
        let currentTargetIdx = 0;
        let currentStep = resumeState?.startStep || 0;
        let currentFocusedContext = null;

        // Retry callback - called when user clicks "Retry Step X"
        const retryCallback = async (failedStep, partialData) => {
            console.log(`[WorldWeaver] Retrying from step ${failedStep} with partial:`, partialData);
            // Recursively call with resume state
            const retryResumeState = {
                character: partialData,
                startStep: failedStep
            };
            await runWithResumeState(retryResumeState);
        };

        // Main generation logic (extracted for reuse in retry)
        async function runWithResumeState(rState) {
            const progressModal = showProgressModal(retryCallback);
            const results = [];
            const startStep = rState?.startStep || 0;
            const existingChar = rState?.character || null;

            try {
                for (let tIdx = currentTargetIdx; tIdx < targets.length; tIdx++) {
                    currentTargetIdx = tIdx;
                    const targetName = targets[tIdx].name || targets[tIdx];

                    // Step 0: Focus Context (skip if resuming with context already cached)
                    if (!currentFocusedContext || tIdx > 0 || !rState) {
                        progressModal.updateStatus(0, isBatch ? `[${tIdx + 1}/${targets.length}] Analyzing ${targetName}...` : 'Analyzing context...');
                        currentFocusedContext = await summarizeContextFor(session, targetName);
                    }

                    // Only use resume state for the first character in this run
                    const useExistingChar = (tIdx === 0 && existingChar) ? existingChar : null;
                    const useStartStep = (tIdx === 0 && rState) ? startStep : 0;

                    const char = await runGenerationPipeline(
                        session,
                        currentFocusedContext,
                        (stepIdx, totalSteps, stepName) => {
                            if (progressModal.isCancelled()) return false;
                            currentStep = stepIdx; // Track for error reporting

                            const label = isBatch
                                ? `[${tIdx + 1}/${targets.length}] ${targetName}: ${stepName}`
                                : stepName;

                            progressModal.updateStatus(stepIdx, label);
                            return true;
                        },
                        useStartStep,
                        useExistingChar
                    );

                    if (!char) { // Cancelled
                        progressModal.close();
                        return;
                    }

                    results.push(char);
                }

                sessionStorage.removeItem('ww_partial_character');
                progressModal.close();

                // Handling Results
                if (results.length === 1 && !isBatch) {
                    showReviewModal(results[0], 'character', session);
                } else {
                    // Batch: Auto-import all results
                    let importedCount = 0;
                    results.forEach(char => {
                        try {
                            importGeneratedContent(char, 'character', session, A);
                            importedCount++;
                        } catch (e) {
                            console.error(`Failed to import ${char.name}:`, e);
                        }
                    });

                    if (A.UI?.Toast?.show) {
                        A.UI.Toast.show(`Batch Complete: Imported ${importedCount} characters!`, 'success');
                    } else {
                        alert(`Batch Generation Complete! Imported ${importedCount} characters into the Gallery.`);
                    }
                }

            } catch (err) {
                console.error('[WorldWeaver] Multi-step generation failed:', err);
                // Get partial data from sessionStorage for retry
                let partialData = null;
                try {
                    const raw = sessionStorage.getItem('ww_partial_character');
                    partialData = raw ? JSON.parse(raw) : null;
                } catch (e) { /* ignore */ }

                progressModal.showError(err.message, { retryStep: currentStep, partialData });
            }
        }

        // Start generation (with optional resume state)
        await runWithResumeState(resumeState);
    }

    // ===================================================================
    // LEGACY SINGLE-STEP GENERATION
    // ===================================================================


    async function handleGeneration(session, sessions, type) {
        // Dependencies
        const T = A.WorldWeaver.Templates;
        // Check dependencies (safeguard)
        if (!T) return console.error("Templates not loaded");

        if (A.UI?.Toast?.show) A.UI.Toast.show(`Generating ${type}...`, 'info');

        // Build context
        const contextSummary = Object.entries(session.categories)
            .filter(([_, cat]) => cat.summary)
            .map(([key, cat]) => `## ${T.CATEGORIES[key]?.label || key}\n${cat.summary}`)
            .join('\n\n');

        switch (type) {
            case 'character':
                if (A.UI?.Toast?.show) A.UI.Toast.show('Generating Character Profile...', 'info');
                try {
                    const charPrompt = `
You are an expert character designer.
Based on the following world context, generate a detailed MAIN CHARACTER profile.
Return ONLY valid JSON:
{
    "name": "Name",
    "description": "Short physical description and vibe (1-2 sentences)",
    "summary": "Detailed background, role, and personality summary",
    "traits": ["Trait 1", "Trait 2", "Trait 3"],
    "scenario": "The setting, environment context, and any specific rules for this encounter",
    "first_message": "The opening line or action from the character to start the roleplay",
    "notes": "Additional notes on conflict, goals, and relationships"
}

=== CONTEXT ===
${contextSummary}
`;
                    let charData;
                    let charAttempts = 0;
                    const maxCharAttempts = 2;
                    let charHistory = [];

                    while (charAttempts <= maxCharAttempts) {
                        try {
                            const charResponse = await A.LLM.generate(charPrompt, charHistory, { maxTokens: 2048, temperature: 0.7 });
                            charData = A.JSONRepair.repairAndParse(charResponse);
                            break; // Success
                        } catch (e) {
                            console.warn(`[WorldWeaver] Character Gen Attempt ${charAttempts + 1} failed:`, e);
                            if (charAttempts < maxCharAttempts) {
                                charAttempts++;
                                charHistory.push({ role: 'model', content: e.originalText || "(Invalid JSON)" });
                                charHistory.push({
                                    role: 'user',
                                    content: `SYSTEM: The previous response was invalid JSON. Error: ${e.message}. Please fix the format and respond with ONLY the valid JSON object.`
                                });
                            } else {
                                console.error('Character generation failed after retries:', e);
                                if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate character after retries', 'error');
                                return; // Hard fail
                            }
                        }
                    }
                    showReviewModal(charData, 'character', session);
                } catch (err) {
                    console.error('Character generation failed:', err);
                    if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate character', 'error');
                }
                break;

            case 'world':
                if (A.UI?.Toast?.show) A.UI.Toast.show('Generating World Lorebook...', 'info');
                try {
                    const worldPrompt = `
 You are an expert world builder.
 Based on the following world context, generate key LOREBOOK ENTRIES.
 Focus on the most important rules, locations, factions, and mechanics.
 Return ONLY valid JSON:
 {
     "entries": [
         {
             "title": "Entry Title",
             "keys": ["key1", "key2"],
             "content": "Detailed description of this aspect of the world.",
             "category": "World | Location | Faction | Mechanic | Rule | History"
         }
     ]
 }
 
 === CONTEXT ===
 ${contextSummary}
 `;
                    let worldData;
                    let worldAttempts = 0;
                    const maxWorldAttempts = 2;
                    let worldHistory = [];

                    while (worldAttempts <= maxWorldAttempts) {
                        try {
                            const worldResponse = await A.LLM.generate(worldPrompt, worldHistory, { maxTokens: 4096, temperature: 0.7 });
                            worldData = A.JSONRepair.repairAndParse(worldResponse);
                            break; // Success
                        } catch (e) {
                            console.warn(`[WorldWeaver] World Gen Attempt ${worldAttempts + 1} failed:`, e);
                            if (worldAttempts < maxWorldAttempts) {
                                worldAttempts++;
                                worldHistory.push({ role: 'model', content: e.originalText || "(Invalid JSON)" });
                                worldHistory.push({
                                    role: 'user',
                                    content: `SYSTEM: The previous response was invalid JSON. Error: ${e.message}. Please fix the format and respond with ONLY the valid JSON object.`
                                });
                            } else {
                                console.error('World generation failed after retries:', e);
                                if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate world lore after retries', 'error');
                                return; // Hard fail
                            }
                        }
                    }
                    showReviewModal(worldData, 'world', session);
                } catch (err) {
                    console.error('World generation failed:', err);
                    if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate world lore', 'error');
                }
                break;

            case 'export':
                const markdown = `# ${session.name}
 
 **Genre:** ${T.GENRE_TEMPLATES.find(t => t.id === session.genre)?.label || 'Free Form'}
 **Content Rating:** ${T.CONTENT_RATINGS.find(r => r.id === session.contentRating)?.label || 'SFW'}
 **Created:** ${new Date(session.createdAt).toLocaleDateString()}
 
 ---
 
 ${contextSummary}
 
 ---
 
 ## Chat History
 
 ${session.chatHistory.map(m => m.role === 'user' ? `**You:** ${m.content}` : `**AI:** ${m.question || m.content}`).join('\n\n')}
 `;
                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}_world.md`;
                a.click();
                URL.revokeObjectURL(url);
                if (A.UI?.Toast?.show) A.UI.Toast.show('World document exported!', 'success');
                break;
        }
    }

    function showReviewModal(data, type, session) {
        const modal = document.createElement('div');
        modal.className = 'anansi-modal';
        // Inline styles to ensure visibility and high z-index
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px);
        `;

        let previewContent = '';
        let editableData = JSON.parse(JSON.stringify(data)); // Deep copy

        if (type === 'character') {
            previewContent = renderCharacterPreview(editableData);
        } else if (type === 'world') {
            previewContent = renderLorebookPreview(editableData);
        }

        modal.innerHTML = `
            <div class="anansi-modal-content" style="
                width: 800px; max-width: 90vw; height: 80vh; 
                background: var(--bg-surface); border-radius: 12px; 
                border: 1px solid var(--border-subtle); display: flex; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6); overflow: hidden;
            ">
                <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated);">
                    <h3 style="margin: 0;">👁️ Review Generated Content</h3>
                    <div style="font-size: 12px; color: var(--text-muted);">Please verify before importing</div>
                </div>
                
                <div class="ww-review-body" style="flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-surface);">
                    ${previewContent}
                </div>

                <div style="padding: 16px; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn-secondary" style="background: transparent; border: 1px solid var(--border-subtle); padding: 8px 16px; color: var(--text-muted); cursor: pointer; border-radius: 6px;">Discard</button>
                    <button class="btn-primary" style="background: var(--accent); border: none; padding: 8px 16px; color: white; cursor: pointer; border-radius: 6px; font-weight: 600;">Confirm & Import</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event Listeners for Edit (Simple binding)
        const body = modal.querySelector('.ww-review-body');

        // Character Edits
        if (type === 'character') {
            body.querySelectorAll('[contenteditable]').forEach(el => {
                el.addEventListener('input', () => {
                    const field = el.dataset.field;
                    if (field) editableData[field] = el.innerText;
                });
            });
        }
        // Lorebook Edits
        if (type === 'world') {
            body.querySelectorAll('.ww-lore-entry').forEach((entryEl, idx) => {
                const titleEl = entryEl.querySelector('.ww-lore-title');
                const contentEl = entryEl.querySelector('.ww-lore-content');

                titleEl.addEventListener('input', () => {
                    editableData.entries[idx].title = titleEl.innerText;
                });
                contentEl.addEventListener('input', () => {
                    editableData.entries[idx].content = contentEl.innerText;
                });
            });
        }

        modal.querySelector('.btn-secondary').onclick = () => modal.remove();
        modal.querySelector('.btn-primary').onclick = () => {
            importGeneratedContent(editableData, type, session, A);
            modal.remove();
            if (A.UI?.Toast?.show) A.UI.Toast.show('Content imported successfully!', 'success');
        };
    }

    function renderCharacterPreview(data) {
        // Access nested fields properly
        const cardFields = data.cardFields || {};
        const appearance = data.appearance || {};
        const quirks = data.quirks || {};

        return `
            <div style="display: flex; gap: 24px;">
                <div style="flex: 0 0 200px; display: flex; flex-direction: column; gap: 12px;">
                    <div style="width: 100%; aspect-ratio: 2/3; background: var(--bg-dark); border: 2px dashed var(--border-subtle); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                        No Avatar
                    </div>
                    ${data.tags ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${data.tags.map(t => `
                                <span style="background: var(--accent-primary); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${t}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: var(--accent); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Name</div>
                        <div contenteditable="true" data-field="name" style="font-size: 24px; font-weight: 700; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 4px;">${data.name || 'Unnamed'}</div>
                    </div>
                    
                    ${data.gender || data.pronouns ? `
                    <div style="display: flex; gap: 16px;">
                        ${data.gender ? `<div style="font-size: 12px;"><span style="color: var(--text-muted);">Gender:</span> ${data.gender}</div>` : ''}
                        ${data.pronouns ? `<div style="font-size: 12px;"><span style="color: var(--text-muted);">Pronouns:</span> ${data.pronouns}</div>` : ''}
                    </div>
                    ` : ''}
                    
                    ${appearance.hair || appearance.eyes || appearance.build ? `
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Appearance</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${[appearance.hair, appearance.eyes, appearance.build].filter(Boolean).join(' • ')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Personality</div>
                        <div contenteditable="true" data-field="personality" style="color: var(--text-secondary); line-height: 1.5; border: 1px transparent solid; padding: 4px; border-radius: 4px;">${cardFields.personality || 'Not provided'}</div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Description</div>
                        <div contenteditable="true" data-field="description" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); white-space: pre-wrap; line-height: 1.6;">${cardFields.description || 'Not provided'}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Scenario (Context & Rules)</div>
                        <div contenteditable="true" data-field="scenario" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 12px;">${cardFields.scenario || 'Not provided'}</div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">First Message (Opening)</div>
                        <div contenteditable="true" data-field="firstMessage" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); font-style: italic;">${cardFields.firstMessage || 'Not provided'}</div>
                    </div>
                    
                    ${quirks && (quirks.physical?.length || quirks.mental?.length || quirks.emotional?.length) ? `
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Quirks</div>
                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                            ${quirks.physical?.map(q => `<div>💪 ${q.text} <span style="color: var(--text-muted); font-size: 10px;">(${q.tags.join(', ')})</span></div>`).join('') || ''}
                            ${quirks.mental?.map(q => `<div>🧠 ${q.text} <span style="color: var(--text-muted); font-size: 10px;">(${q.tags.join(', ')})</span></div>`).join('') || ''}
                            ${quirks.emotional?.map(q => `<div>❤️ ${q.text} <span style="color: var(--text-muted); font-size: 10px;">(${q.tags.join(', ')})</span></div>`).join('') || ''}
                        </div>
                    </div>
                    ` : ''}

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Notes</div>
                        <div contenteditable="true" data-field="notes" style="font-style: italic; color: var(--text-muted);">${data.notes || 'No notes'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLorebookPreview(data) {
        if (!data.entries || data.entries.length === 0) return '<div style="text-align:center; color: var(--text-muted);">No entries generated.</div>';

        return `
            <div style="display: grid; gap: 16px;">
                ${data.entries.map((entry, idx) => `
                    <div class="ww-lore-entry" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden;">
                        <div style="padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                            <span contenteditable="true" class="ww-lore-title" style="font-weight: 600; color: var(--accent);">${entry.title}</span>
                            <span style="font-size: 10px; background: var(--bg-base); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${entry.category || 'General'}</span>
                        </div>
                        <div contenteditable="true" class="ww-lore-content" style="padding: 16px; color: var(--text-secondary); line-height: 1.6; font-size: 14px;">${entry.content}</div>
                        <div style="padding: 8px 16px; border-top: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; gap: 6px;">
                            ${(entry.keys || []).map(k => `<span style="font-size: 10px; color: var(--text-muted);">#${k}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function importGeneratedContent(data, type, session, A) {
        const state = A.State.get();

        if (type === 'character') {
            const actorId = `char_${Date.now()}`;
            const finalId = data.id || actorId;

            // Extract nested fields properly
            const cardFields = data.cardFields || {};
            const appearance = data.appearance || {};
            const quirks = data.quirks || { activationChance: 20, physical: [], mental: [], emotional: [] };

            const newActor = {
                id: finalId,
                name: data.name || 'Unnamed',

                // Identity fields
                gender: data.gender || 'N',
                pronouns: data.pronouns || 'they/them',
                aliases: data.aliases || [],
                tags: data.tags || ['Generated', 'WorldWeaver'],

                // Card fields (nested in cardFields object)
                cardFields: {
                    personality: cardFields.personality || '',
                    description: cardFields.description || '',
                    scenario: cardFields.scenario || '',
                    firstMessage: cardFields.firstMessage || '',
                    mes_example: cardFields.mes_example || ''
                },

                // Appearance (nested in traits.appearance)
                traits: {
                    appearance: {
                        hair: appearance.hair || '',
                        eyes: appearance.eyes || '',
                        build: appearance.build || '',
                        description: appearance.description || '',
                        appendages: appearance.appendages || {}
                    },
                    pulseCues: data.pulseCues || {},
                    erosCues: data.erosCues || {},
                    intentCues: data.intentCues || {}
                },

                // Quirks system
                quirks: {
                    activationChance: quirks.activationChance || 20,
                    physical: quirks.physical || [],
                    mental: quirks.mental || [],
                    emotional: quirks.emotional || []
                },

                // Metadata
                notes: data.notes || '',
                gallery: { primary: null, showNsfw: false, images: [] },
                type: 'character',
                creator_notes: `Generated by World Weaver from session: ${session?.name || 'Unknown'}`
            };

            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            state.nodes.actors.items[finalId] = newActor;
        }
        else if (type === 'world') {
            if (!state.weaves) state.weaves = {};
            if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };

            let count = 0;
            const timestamp = Date.now();

            (data.entries || []).forEach((entry, idx) => {
                const id = entry.id || `lore_${timestamp}_${idx}`;
                const uuid = crypto.randomUUID();

                state.weaves.lorebook.entries[id] = {
                    id: id,
                    title: entry.title,
                    keywords: entry.keys || entry.keywords || [],
                    content: entry.content,
                    enabled: true,
                    priority: 50,
                    category: (entry.category || 'uncategorized').toLowerCase(),
                    requireTags: [],
                    blocksTags: [],
                    tags: ['Generated'],
                    shifts: [],
                    uuid: uuid
                };
                count++;
            });
        }

        A.State.notify();
    }

    function showGenerationOptions(session, sessions, A) {
        // Reuse constants
        // Actually, UI calls this. We can move this function to UI or export it.
        // It's cleaner here as it's the entry point to generation.
        // But UI constructs the modal.
        // ... Wait, I put showGenerationOptions in UI.js in the previous thought.
        // So I ONLY need handleGeneration here exposed?
        // Yes. Let's export only handleGeneration for now.
        // But wait, the previous `UI.js` I planned called `showGenerationOptions`.
        // I will implement `showGenerationOptions` in `ui.js` as planned and just export `handleGeneration` here.
        // But `generation.js` has the templates dependency so `handleGeneration` needs `T`.
    }

    // Expose
    A.WorldWeaver.Generation = {
        handleGeneration,
        generateCharacterMultiStep,
        // Individual step functions (for testing)
        generateIdentity,
        generateAppearance,
        generateCardFields,
        generateQuirks,
        generateNotes,
        generateCues,
        // Utility
        importGeneratedContent
    };

})(window.Anansi);
