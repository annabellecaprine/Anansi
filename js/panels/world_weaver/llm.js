/*
 * World Weaver: LLM Logic
 * File: js/panels/world_weaver/llm.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    async function evaluateAndRespond(session, sessions, onStatusUpdate) {
        // Dependencies
        const T = A.WorldWeaver.Templates;
        const GENRE_TEMPLATES = T.GENRE_TEMPLATES;
        const CONTENT_RATINGS = T.CONTENT_RATINGS;
        const CATEGORIES = T.CATEGORIES;

        // Initialize turn count
        session.turnCount = (session.turnCount || 0) + 1;

        // --- STEP 0: DIRECTOR MODE (Auto-Focus) ---
        // If current focus is "done" (high confidence), force a switch to keep momentum.
        if (session.currentFocus && session.categories[session.currentFocus]) {
            const currentConf = session.categories[session.currentFocus].confidence || 0;
            if (currentConf > 80) {
                // Find next incomplete category
                const sequence = Object.keys(CATEGORIES);
                const nextFocus = sequence.find(k => {
                    const c = session.categories[k];
                    return (c.confidence || 0) < 80; // Find anything that isn't finished
                });

                if (nextFocus && nextFocus !== session.currentFocus) {
                    console.log(`[WorldWeaver] Director Mode: Switching Focus from ${session.currentFocus} (${currentConf}%) to ${nextFocus}`);
                    session.currentFocus = nextFocus;
                }
            }
        }

        // --- STEP 1: ACTIVE LISTENING (Extraction) ---
        // Notify UI of "Updating Notes" state
        // We assume the caller (index.js) can handle status updates if we yield or callback?
        // Since this is async, we can't easily push UI updates mid-stream without a callback.
        // But we can just run it. The UI "Thinking" state covers it.
        // TODO: Ideally we'd emit an event here.
        if (onStatusUpdate) onStatusUpdate("📝 Updating Notes...");

        await extractFacts(session, sessions);

        // --- STEP 2: INTERVIEW (Response) ---
        if (onStatusUpdate) onStatusUpdate("🤔 Thinking...");

        const template = GENRE_TEMPLATES.find(t => t.id === session.genre) || GENRE_TEMPLATES[5];
        const ratingInfo = CONTENT_RATINGS.find(r => r.id === session.contentRating) || CONTENT_RATINGS[0];

        // Build context
        const contextParts = [];

        // 1. Add pre-seeds
        if (Object.keys(template.preSeeds).length > 0) {
            contextParts.push('PRE-SEEDED CONTEXT:\n' + Object.entries(template.preSeeds).map(([k, v]) => `- ${CATEGORIES[k]?.label || k}: ${v}`).join('\n'));
        }

        // 2. Add imported actor if present (Priority Context)
        if (session.importedActor) {
            const a = session.importedActor;
            let actorContext = `IMPORTED ACTOR PROFILE (Definitive Source for Main Character):\n`;
            actorContext += `Name: ${a.name}\n`;
            if (a.gender) actorContext += `Gender: ${a.gender}\n`;
            if (a.pronouns) actorContext += `Pronouns: ${a.pronouns}\n`;

            // Description & Summary
            if (a.description) actorContext += `Description: ${a.description}\n`;
            if (a.summary && a.summary !== a.description) actorContext += `Summary: ${a.summary}\n`;

            // Traits / Personality
            if (a.traits) {
                if (typeof a.traits === 'string') {
                    actorContext += `Traits: ${a.traits}\n`;
                } else {
                    Object.entries(a.traits).forEach(([k, v]) => {
                        actorContext += `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}\n`;
                    });
                }
            }

            if (a.notes) actorContext += `Notes: ${a.notes}\n`;
            contextParts.push(actorContext);
        }

        // 3. Add chat history (Sliding Window: Last 20 messages)
        // We rely on the Scratchpad for older context.
        const recentHistory = session.chatHistory.slice(-20);

        recentHistory.forEach(msg => {
            if (msg.role === 'user') {
                contextParts.push(`USER: ${msg.content}`);
            } else if (msg.role === 'assistant') {
                let text = `ESTABLISHED: ${msg.content}`;
                // Include questions so the AI knows what it asked
                if (msg.questions && msg.questions.length > 0) {
                    const qText = msg.questions.map(q => q.text).join(' | ');
                    text += `\n(Asked: ${qText})`;
                } else if (msg.question) {
                    text += `\n(Asked: ${msg.question})`;
                }
                contextParts.push(text);
            }
        });

        // 4. Add Scratchpad Notes (Persistent Memory)
        let notesContext = "=== CURRENT WORLD NOTES (SCRATCHPAD) ===\n";
        let hasNotes = false;
        if (session.categories) {
            Object.entries(session.categories).forEach(([key, data]) => {
                if (data.notes && data.notes.trim()) {
                    notesContext += `[${CATEGORIES[key]?.label || key}]: ${data.notes}\n`;
                    hasNotes = true;
                }
            });
        }
        if (!hasNotes) notesContext += "(No notes yet. Start writing observations here.)\n";
        contextParts.push(notesContext);

        // Dynamic System Prompt Construction
        const isAdult = session.contentRating === 'adult';
        const isProtagonistMode = session.storyFocus === 'protagonist';
        // const isNSFW = session.contentRating === 'nsfw' || isAdult; 

        // Guardrails: Conversational Approach
        // We do NOT inject a hard block here unless defined in settings (which we removed).
        // Instead, the persona instructions handle the negotiation.

        const personality = isAdult
            ? "You are an experienced, open-minded Genre Editor. The user has opted into Adult content, so you are comfortable discussing mature themes, dark topics, and erotica professionally and creatively. You do not shy away from details."
            : "You are an experienced Genre Editor and collaborative World-Builder.";

        // Mode-specific rules for Protagonist vs Ensemble
        const storyFocusRules = isProtagonistMode
            ? `
=== STORY FOCUS: PROTAGONIST MODE ===
This is a SINGLE CHARACTER focus session. You are helping build ONE main character card.

**CRITICAL DISTINCTION - {User} vs Protagonist:**
- **{User}** = The PLAYER. The human who will chat with the finished character. You do NOT define {User}.
- **Protagonist** = The CHARACTER CARD being built. This is the NPC/bot the player will interact with.
- You are building the PROTAGONIST (the character card), NOT defining {User}.
- Example: If building "Freya the vampire", FREYA is the protagonist. {User} is whoever plays with her later.

**PROTAGONIST MODE RULES:**
1. **SINGLE CHARACTER FOCUS**: All character development centers on ONE protagonist being built (the NPC).
   - Do NOT track multiple cast members. Ignore the 'identifiedCast' output field.
   - The "Cast" category should only contain notes about THIS protagonist (the character card).
2. **ANTI-BLEED GUARDRAIL**: When the user mentions OTHER people (e.g., "The protagonist's boss wears a toupee"), 
   those traits belong to THOSE other people, NOT the protagonist.
   - Record info about other characters under "Setting" or "World Rules" as relationship/world context.
   - Example: "Freya's rival, Victor, is cunning" → Note under Setting: "World includes Victor (Freya's cunning rival)"
   - Do NOT assign Victor's traits to Freya.
3. **DEEP FOCUS**: Ask detailed questions about the protagonist's (the NPC's) personality, backstory, motivations, and appearance.
   - Other NPCs are backdrop. Don't spend questions exploring them unless the user explicitly asks.
   - NEVER ask about {User}'s traits - {User} is undefined until gameplay.
`
            : `
=== STORY FOCUS: ENSEMBLE MODE ===
This is an ENSEMBLE CAST session. You are helping build a GROUP of significant character cards.

**CRITICAL DISTINCTION - {User} vs Cast:**
- **{User}** = The PLAYER. The human who will chat with the finished characters. You do NOT define {User}.
- **Cast** = The CHARACTER CARDS being built. These are NPCs/bots the player will interact with.
- NEVER include {User} as a cast member. {User} is the player, not a character.

**ENSEMBLE MODE RULES:**
1. **TRACK SIGNIFICANT CHARACTERS**: Add characters to 'identifiedCast' who have:
   - Repeated mentions (appear in multiple messages)
   - Direct plot involvement (conflict, relationship, story role)
   - Named AND characterized (not just "the shopkeeper")
   - NEVER add {User} - they are the player, not a character
2. **SIGNIFICANCE FILTERING**: 
   - Mark as "major": Core cast members central to the story
   - Mark as "minor": Recurring but secondary roles
   - Do NOT add characters mentioned only in passing (e.g., "someone's boss" mentioned once)
3. **ENSEMBLE DEPTH**: All "major" cast members deserve exploration.
   - Ask about relationships BETWEEN cast members.
   - Develop distinct arcs/motivations for each major character.
`;

        const systemPrompt = `${personality}
Your goal is to be a true creative partner. Do not just strictly "interview" the user.
Engage in a back-and-forth dialogue. Restate your understanding often to show you are listening.
Build upon their ideas ("Yes, and...").

=== SESSION CONTEXT ===
Genre: ${template.label}
Content Rating: ${ratingInfo.label} (${ratingInfo.description})
Story Focus: ${isProtagonistMode ? 'PROTAGONIST (Single Character)' : 'ENSEMBLE (Multiple Characters)'}
CURRENT FOCUS: ${CATEGORIES[session.currentFocus]?.label || 'General'}
${storyFocusRules}
=== YOUR BEHAVIORAL RULES ===
1. **RESTATE CONTEXT**: When the user introduces new major elements (a character, a faction, a tone), explicitly summarize it back to them in your own words to confirm alignment. "So, you're picturing a gritty, neon-soaked underworld where..."
2. **USE THE SCRATCHPAD**: You have a "World Notes" scratchpad. USE IT.
   - If the user establishes a fact (e.g. "Magic needs blood"), WRITE IT DOWN in the \`concept_updates\`.
   - CRITICAL: You have a limited memory window. If you do not save a user's answer to the scratchpad, YOU WILL FORGET IT.
   - Prioritize capturing facts over conversational fluff.
3. **COLLABORATIVE SAFETY**: If the user's request touches on complex or potentially extreme themes (darkness, trauma, taboos) and no boundaries are set, PAUSE and have a "meta-conversation".
   - Ask: "This is getting into darker territory. Are there any specific lines or veils you want to establish for this story?"
   - Do this naturally, like an editor checking in with a writer.
5. **RESPECT PLAYER AGENCY**: You are the Game Master/Editor, NOT the Player.
   - NEVER describe the User's internal thoughts, feelings, or actions.
   - Stop your response at the point where the User needs to react.
   - Use the 'response' field for reaction, analysis, and setting the scene.
   - Put your driving questions/suggestions into the 'questions' array. This ensures they appear as interactive UI elements.
7. **THE {USER} VARIABLE - THIS IS NOT THE PROTAGONIST**:
   - {User} = The PLAYER who will use the finished character card. NOT a character you are building.
   - The PROTAGONIST/CAST you are building = The NPC(s)/bot(s) the player ({User}) will interact with.
   - Do NOT ask questions about {User}'s traits, appearance, or backstory - they are undefined.
   - Do NOT confuse {User} with the character being built. They are opposite roles.

=== SMART ANALYSIS RULES ===
1. **IMPORTED ACTOR PRIORITY**: If an "IMPORTED ACTOR PROFILE" is present, treat that character as the anchor. All world-building should revolve around them.
2. **IMMEDIATE SCENARIO**: If the user sets a scene, jump right in. Don't ask for high-level "goals" if the goal is obviously "survive this encounter".
3. **ADULT CONTENT**: "No limits" is a valid boundary if the user says so.
4. **MAINTAIN STATE**: If a category was previously "Complete", do not mark it as "Empty" unless you have a specific reason to downgrade it. Look at the whole context.

=== CATEGORY RUBRICS ===

**Core Experience (20%)** - COMPLETE when:
- Primary goal is clear (Story vs. Game vs. Erotica) OR a Scenario is active
- Tone is established

**World Rules (20%)** - COMPLETE when:
- Physics/magic/tech basics defined
- (For NSFW) Anatomy/Biology rules defined if relevant

**Setting/Situation (15%)** - COMPLETE when:
- Location/Era defined
- Initial situation established

**${isProtagonistMode ? 'Protagonist' : 'Cast'} (15%)** - COMPLETE when:
${isProtagonistMode
                ? `- The single main character has Name/Appearance/Archetypes defined
- OR Defined via IMPORTED ACTOR PROFILE`
                : `- Major ensemble members identified
- Relationships between cast members established`}

**Story Arc (15%)** - COMPLETE when:
- Conflict/Tension defined
- OR The "loop"/encounter structure is clear

**Writing Style (10%)** - COMPLETE when:
- POV (First vs Third) is defined
- Verb Tense (Past vs Present) is defined
- Tone/Voice is established

**Mechanics (10%)** - COMPLETE when:
- Tracking systems (Stats, Trust, Corruption, etc.)

=== SCORING RULES ===
1. **"N/A" MEANS 100%**: If the user says "No magic", "No mechanics", or "Skip this", mark confidence as **100**. It is "Complete by Omission". Do not leave it at 0.
2. **CLOSING THE GAP**: If Confidence is < 80% for the CURRENT FOCUS, you **MUST** ask a question from the Rubric. Do not say "Anything else?". Ask specifically: "How do we handle [Missing Element]?"

=== OUTPUT FORMAT ===
Return a SINGLE JSON object. Do not include any text outside the JSON.
{
  "response": "Your conversational reaction and scene setting ONLY. Do NOT include follow-up questions here.",
  "analysis": "Brief 1-2 sentence summary of current state (for internal use).",
  "categories": {
    "coreExperience": { 
        "confidence": 0-100, 
        "summary": "...", 
        "concept_updates": "Text to APPEND to the scratchpad. Capture facts, rules, and decisions here." 
    },
    // ... other categories (worldRules, setting, cast, storyArc, mechanics, guardrails)
  },
  ${isProtagonistMode
                ? '// Note: identifiedCast is NOT used in Protagonist mode'
                : `"identifiedCast": [
      { "name": "Name", "role": "Role/Archetype", "significance": "major/minor" } 
  ],`}
  "overallProgress": 0-100,
  "highestPriority": "categoryKey",
  "deepMiningPoint": "The most interesting unexplored tension or opportunity",
  "questions": [
    {
        "text": "The explicit follow-up question to ask the user",
        "category": "categoryKey",
        "suggestion": "A helpful example or starting point",
        "importance": "critical|helpful|polish"
    }
  ]
}`;

        const userMessage = `=== ACCUMULATED CONTEXT ===
            ${contextParts.join('\n\n')}

Please evaluate and generate questions.`;

        try {
            const maxTokens = A.UI?.getMaxTokensFor?.('worldWeaver') || session.settings.tokenBudget || 4096;
            let parsed;
            let attempts = 0;
            const maxAttempts = 2; // Initial + 1 retry
            let history = [{ role: 'user', content: userMessage }];

            while (attempts <= maxAttempts) {
                try {
                    const responseText = await A.LLM.generate(
                        systemPrompt,
                        history,
                        { maxTokens: maxTokens, temperature: 0.7 }
                    );

                    if (!responseText) throw new Error('Empty LLM response');

                    parsed = A.JSONRepair.repairAndParse(responseText);
                    // If we get here, it parsed!
                    break;

                } catch (parseErr) {
                    console.warn(`[WorldWeaver] Attempt ${attempts + 1} failed:`, parseErr);
                    if (attempts < maxAttempts) {
                        attempts++;
                        // Push error context to history for retry
                        history.push({ role: 'model', content: parseErr.originalText || "(Invalid JSON)" });
                        history.push({
                            role: 'user',
                            content: `SYSTEM: The previous response was invalid JSON. Error: ${parseErr.message}. Please fix the format and respond with ONLY the valid JSON object according to the schema.`
                        });
                    } else {
                        console.error('[WorldWeaver] RAW LLM RESPONSE (Final Failure):', parseErr.originalText);
                        throw new Error("I had trouble parsing that. Please try again or rephrase your last idea.");
                    }
                }
            }

            // --- UPDATE SESSION with Analysis Results ---
            if (parsed.categories) {
                // Helper to find the matching session key (Fuzzy Match)
                const findSessionKey = (llmKey) => {
                    const normalizedLLM = llmKey.toLowerCase().replace(/[^a-z]/g, ''); // coreexperience
                    return Object.keys(session.categories).find(k => k.toLowerCase() === normalizedLLM);
                };

                Object.entries(parsed.categories).forEach(([llmKey, data]) => {
                    const sessionKey = findSessionKey(llmKey);

                    if (sessionKey && session.categories[sessionKey]) {
                        // Smart Merge / High Water Mark Logic
                        // Only update if:
                        // 1. New confidence is higher than old confidence
                        // 2. OR New confidence is substantial (>30%) (allowing for corrections)
                        // 3. OR Old confidence was 0

                        // Parse safely to int
                        let newConf = parseInt(data.confidence);
                        if (isNaN(newConf)) newConf = 0;

                        const oldConf = session.categories[sessionKey].confidence || 0;

                        // Strict High Water Mark Logic
                        // Only update if new confidence is higher. Never regress.
                        if (newConf > oldConf) {
                            session.categories[sessionKey].confidence = newConf;
                            // Only update summary if provided and non-empty
                            if (data.summary) session.categories[sessionKey].summary = data.summary;
                        }

                        // Update Scratchpad Notes
                        if (data.concept_updates && data.concept_updates.trim()) {
                            const newNote = data.concept_updates.trim();
                            // Initialize if missing
                            if (!session.categories[sessionKey].notes) session.categories[sessionKey].notes = '';

                            // Deduplicate: exact string match
                            if (!session.categories[sessionKey].notes.includes(newNote)) {
                                // Append with separator
                                if (session.categories[sessionKey].notes.length > 0) {
                                    session.categories[sessionKey].notes += '\n\n';
                                }
                                session.categories[sessionKey].notes += `• ${newNote}`;
                            }
                        }

                        // Status Update Logic (Based on the potentially preserved confidence)
                        const finalConf = session.categories[sessionKey].confidence;
                        if (finalConf > 70) session.categories[sessionKey].status = 'completed';
                        else if (finalConf > 20) session.categories[sessionKey].status = 'in_progress';
                        else session.categories[sessionKey].status = 'empty';
                    }
                });
            }

            // Extract Identified Cast (Ensemble Mode Only)
            // In Protagonist mode, we don't track multiple cast members
            if (session.storyFocus !== 'protagonist' && parsed.identifiedCast && Array.isArray(parsed.identifiedCast)) {
                if (!session.cast) session.cast = [];

                parsed.identifiedCast.forEach(c => {
                    // Dedup by name
                    const exists = session.cast.find(ex => ex.name.toLowerCase() === c.name.toLowerCase());
                    if (!exists) {
                        session.cast.push({
                            name: c.name,
                            role: c.role || 'Unknown',
                            significance: c.significance || 'minor',
                            addedAt: new Date().toISOString()
                        });
                    }
                });
            }

            // High Water Mark for Overall Progress
            // We calculate this deterministically based on category confidence (weighted)
            // rather than trusting the LLM's 'overallProgress' which can be hallucinated.
            const calculateProgress = (s) => {
                const weights = s.storyFocus === 'protagonist'
                    ? { coreExperience: 0.15, worldRules: 0.15, setting: 0.15, cast: 0.30, storyArc: 0.15, mechanics: 0.10, guardrails: 0 }
                    : { coreExperience: 0.20, worldRules: 0.20, setting: 0.15, cast: 0.15, storyArc: 0.15, mechanics: 0.10, guardrails: 0.05 };

                let total = 0;
                let maxPossible = 0;

                Object.entries(weights).forEach(([key, weight]) => {
                    if (weight > 0) {
                        const conf = s.categories[key]?.confidence || 0;
                        total += (conf * weight);
                        maxPossible += (100 * weight);
                    }
                });

                return Math.round(total); // 0-100
            };

            const computedProgress = calculateProgress(session);
            // We take the higher of the computed progress OR what was there before (no regression)
            // But we ignore the LLM's parsed.overallProgress entirely now as it's less accurate.
            session.overallProgress = Math.max(session.overallProgress || 0, computedProgress);

            // --- PREVENT QUESTION LOOPS ---
            if (parsed.questions && parsed.questions.length > 0) {
                // Get last 3 assistant messages to check for repetition
                const recentAssistant = session.chatHistory.filter(m => m.role === 'assistant').slice(-3);
                const recentQTexts = new Set();

                recentAssistant.forEach(m => {
                    if (m.questions) m.questions.forEach(q => recentQTexts.add(q.text.toLowerCase()));
                    if (m.question) recentQTexts.add(m.question.toLowerCase());
                });

                // Filter out duplicates
                parsed.questions = parsed.questions.filter(q => {
                    if (recentQTexts.has(q.text.toLowerCase())) {
                        console.warn('[WorldWeaver] Dropped duplicate question:', q.text);
                        return false;
                    }
                    return true;
                });
            }

            // Fallback if all questions were filtered (Silent AI Fix)
            if (!parsed.questions || parsed.questions.length === 0) {
                const currentConf = session.categories[session.currentFocus]?.confidence || 0;
                if (currentConf > 70) {
                    // Everything seems done (or this category is done and no auto-switch happened)
                    parsed.questions = [{
                        text: "It looks like we've covered this topic. Ready to generate your world?",
                        category: session.currentFocus,
                        suggestion: "Click 'Generate Output' in the sidebar to finish.",
                        importance: "polish"
                    }];
                } else {
                    const currentLabel = CATEGORIES[session.currentFocus]?.label || 'this topic';
                    parsed.questions = [{
                        text: `Is there anything else you'd like to establish about ${currentLabel}?`,
                        category: session.currentFocus,
                        suggestion: "You can add more details or move on.",
                        importance: "helpful"
                    }];
                }
            }

            // Auto-switch focus if current is complete
            if (parsed.highestPriority && CATEGORIES[parsed.highestPriority]) {
                const currentConf = session.categories[session.currentFocus]?.confidence || 0;
                if (currentConf > 70) {
                    session.currentFocus = parsed.highestPriority;
                }
            }

            // Add assistant response to history
            const finalResponse = parsed.response || "I'm listening...";
            session.chatHistory.push({
                role: 'assistant',
                content: finalResponse,
                timestamp: Date.now(),
                question: parsed.questions?.[0]?.text || null,
                // Internal metadata
                analysis: parsed.analysis,
                questions: parsed.questions,
                deepMiningPoint: parsed.deepMiningPoint
            });

            // Save
            if (A.WorldWeaver.UI && A.WorldWeaver.UI.saveSessions) {
                const allSessions = A.WorldWeaver.UI.loadSessions();
                allSessions[session.id] = session;
                A.WorldWeaver.UI.saveSessions(allSessions);
            } else {
                // Fallback if UI not loaded
                const SESSIONS_KEY = 'anansi_world_weaver_sessions';
                const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
                allSessions[session.id] = session;
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
            }

            return parsed;

        } catch (err) {
            console.error('[WorldWeaver] Evaluation failed:', err);
            throw err;
        }
    }

    async function extractFacts(session, sessions) {
        console.log('[WorldWeaver] Active Listening: Extracting facts...');

        // 1. Get recent user message
        const lastUserMsg = session.chatHistory.filter(m => m.role === 'user').pop();
        if (!lastUserMsg) return; // Nothing to extract from

        // 2. Collect current notes
        let noteContent = '';
        const categoriesWithNotes = [];
        Object.entries(session.categories).forEach(([key, data]) => {
            if (data.notes && data.notes.trim()) {
                noteContent += `\n[${key.toUpperCase()}]:\n${data.notes}\n`;
                categoriesWithNotes.push(key);
            }
        });

        // 3. Determine mode-specific extraction rules
        const isProtagonistMode = session.storyFocus === 'protagonist';

        const modeRules = isProtagonistMode
            ? `
MODE: PROTAGONIST (Single Character Focus)
- Focus ONLY on facts about THE main protagonist being built.
- When other characters are mentioned (e.g., "Bob's boss wears a toupee"), 
  DO NOT merge their traits into the protagonist.
- File other characters' traits under [SETTING] as world/relationship context.
  Example: "Bob's boss Captain Murphy - demanding, wears toupee" → goes to [SETTING]
- The [CAST] category should ONLY contain protagonist details.`
            : `
MODE: ENSEMBLE (Multiple Characters)
- Track facts about ALL significant characters.
- The [CAST] category should list details for each major ensemble member.
- Minor/passing characters (mentioned once) can go to [SETTING] as background.`;

        // 4. Prompt for Extraction
        const prompt = `You are a Senior Editor organizing a World Bible.
Your job is to read the USER'S last message and REWRITE the World Notes to be concise and non-repetitive.
${modeRules}

EXISTING NOTES:
${noteContent || '(No notes yet)'}

USER MESSAGE:
"${lastUserMsg.content}"

TASK:
1. Identify new facts in the User Message.
2. MERGE them into the Existing Notes.
3. CONSOLIDATE duplicates. (e.g. If specific "Trust" and generalized "Dependence" both exist, combine them into one strong bullet).
4. REWRITE vague entries to be specific.
5. Sort into the correct [CATEGORY]. If missing, ADD IT.
   
VALID CATEGORIES:
- [COREEXPERIENCE] (Goals, Tone, Themes)
- [WORLDRULES] (Physics, Magic, Technology)
- [SETTING] (Locations, Era, Situation${isProtagonistMode ? ', OTHER characters as world context' : ''})
- [CAST] (${isProtagonistMode ? 'Protagonist details ONLY' : 'All significant characters'})
- [STORYARC] (Plots, Conflicts)
- [WRITINGSTYLE] (POV, Tense, Tone, Voice)
- [MECHANICS] (Stats, Systems)
- [GUARDRAILS] (Safety, Limits, Boundaries)

6. Return the FULL set of notes (Old + New, cleaned up).

Return ONLY the full updated notes text (Categories + Bullets).`;

        try {
            // Use lower temp for extraction accuracy
            const updatedNotes = await A.LLM.generate(prompt, [], { maxTokens: 2048, temperature: 0.1 });

            // Parse back into categories
            if (!updatedNotes || !updatedNotes.includes('[')) return; // Formatting fail check

            const sections = updatedNotes.split(/\[([A-Z]+)\]:/i);
            for (let i = 1; i < sections.length; i += 2) {
                const keyName = sections[i].toLowerCase();
                const content = sections[i + 1].trim();

                // Find matching session key
                const sessionKey = Object.keys(session.categories).find(k => k.toLowerCase() === keyName);
                if (sessionKey) {
                    session.categories[sessionKey].notes = content;
                }
            }
            console.log('[WorldWeaver] Notes updated via Active Listening.');

        } catch (e) {
            console.warn('[WorldWeaver] Extraction failed:', e);
        }
    }

    // Expose
    A.WorldWeaver.LLM = {
        evaluateAndRespond
    };

})(window.Anansi);
