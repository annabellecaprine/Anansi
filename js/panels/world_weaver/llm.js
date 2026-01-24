/*
 * World Weaver: LLM Logic
 * File: js/panels/world_weaver/llm.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    async function evaluateAndRespond(session, sessions) {
        // Dependencies
        const T = A.WorldWeaver.Templates;
        const GENRE_TEMPLATES = T.GENRE_TEMPLATES;
        const CONTENT_RATINGS = T.CONTENT_RATINGS;
        const CATEGORIES = T.CATEGORIES;

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

        // 3. Add chat history
        session.chatHistory.forEach(msg => {
            if (msg.role === 'user') {
                contextParts.push(`USER: ${msg.content}`);
            } else if (msg.role === 'assistant' && msg.content) {
                contextParts.push(`ESTABLISHED: ${msg.content}`);
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
        // const isNSFW = session.contentRating === 'nsfw' || isAdult; 

        // Guardrails: Conversational Approach
        // We do NOT inject a hard block here unless defined in settings (which we removed).
        // Instead, the persona instructions handle the negotiation.

        const personality = isAdult
            ? "You are an experienced, open-minded Genre Editor. The user has opted into Adult content, so you are comfortable discussing mature themes, dark topics, and erotica professionally and creatively. You do not shy away from details."
            : "You are an experienced Genre Editor and collaborative World-Builder.";

        const systemPrompt = `${personality}
Your goal is to be a true creative partner. Do not just strictly "interview" the user.
Engage in a back-and-forth dialogue. Restate your understanding often to show you are listening.
Build upon their ideas ("Yes, and...").

=== SESSION CONTEXT ===
Genre: ${template.label}
Content Rating: ${ratingInfo.label} (${ratingInfo.description})
CURRENT FOCUS: ${CATEGORIES[session.currentFocus]?.label || 'General'}

=== YOUR BEHAVIORAL RULES ===
1. **RESTATE CONTEXT**: When the user introduces new major elements (a character, a faction, a tone), explicitly summarize it back to them in your own words to confirm alignment. "So, you're picturing a gritty, neon-soaked underworld where..."
2. **USE THE SCRATCHPAD**: You have a "World Notes" scratchpad. USE IT.
   - If the user establishes a fact (e.g. "Magic needs blood"), WRITE IT DOWN in the \`concept_updates\`.
   - Don't just rely on your short-term memory. If it's in the notes, it's true.
3. **COLLABORATIVE SAFETY**: If the user's request touches on complex or potentially extreme themes (darkness, trauma, taboos) and no boundaries are set, PAUSE and have a "meta-conversation".
   - Ask: "This is getting into darker territory. Are there any specific lines or veils you want to establish for this story?"
   - Do this naturally, like an editor checking in with a writer.
5. **RESPECT PLAYER AGENCY**: You are the Game Master/Editor, NOT the Player.
   - NEVER describe the User's internal thoughts, feelings, or actions.
   - Stop your response at the point where the User needs to react.
6. **STRUCTURED INQUIRY**: Do NOT ask your follow-up questions in the main text.
   - Use the 'response' field for reaction, analysis, and setting the scene.
   - Put your driving questions/suggestions into the 'questions' array. This ensures they appear as interactive UI elements.

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

**Main Character (15%)** - COMPLETE when:
- Defined via IMPORTED ACTOR PROFILE
- OR Name/Appearance/Archetypes defined

**Story Arc (15%)** - COMPLETE when:
- Conflict/Tension defined
- OR The "loop"/encounter structure is clear

**Mechanics (10%)** - COMPLETE when:
- Tracking systems (Stats, Trust, Corruption, etc.)

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
  "identifiedCast": [
      { "name": "Name", "role": "Role/Archetype", "significance": "major/minor" } 
  ],
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

                        if (newConf >= oldConf || newConf > 30) {
                            session.categories[sessionKey].confidence = newConf;
                            // Only update summary if provided and non-empty
                            if (data.summary) session.categories[sessionKey].summary = data.summary;
                        }

                        // Update Scratchpad Notes
                        if (data.concept_updates && data.concept_updates.trim()) {
                            const newNote = data.concept_updates.trim();
                            // Initialize if missing
                            if (!session.categories[sessionKey].notes) session.categories[sessionKey].notes = '';

                            // Append with separator
                            if (session.categories[sessionKey].notes.length > 0) {
                                session.categories[sessionKey].notes += '\n\n';
                            }
                            session.categories[sessionKey].notes += `• ${newNote}`;
                        }

                        // Status Update Logic (Based on the potentially preserved confidence)
                        const finalConf = session.categories[sessionKey].confidence;
                        if (finalConf > 80) session.categories[sessionKey].status = 'completed';
                        else if (finalConf > 20) session.categories[sessionKey].status = 'in_progress';
                        else session.categories[sessionKey].status = 'empty';
                    }
                });
            }

            // Extract Identified Cast
            if (parsed.identifiedCast && Array.isArray(parsed.identifiedCast)) {
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

            session.overallProgress = parsed.overallProgress || 0;

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
                questionsList: parsed.questions,
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

    // Expose
    A.WorldWeaver.LLM = {
        evaluateAndRespond
    };

})(window.Anansi);
