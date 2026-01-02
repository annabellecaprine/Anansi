/*
 * Anansi Core: AURA SimBuilder
 * File: js/core/aura_simbuilder.js
 * Purpose: Build instrumented AURA.js for Simulator with FlowLogger integration.
 * 
 * This produces a version of AURA with embedded FlowLogger.log() calls
 * so the Flow Explorer can show accurate pass/fail results for all rules.
 * 
 * ONLY used for simulation - production downloads use aura_builder.js
 */

(function (A) {
    'use strict';

    const AuraSimBuilder = {

        /**
         * Build instrumented AURA.js with FlowLogger calls
         */
        build: function (state) {
            const libCode = A.AuraBuilder?.getTemplate();
            if (!libCode) {
                return '// AURA Library not found';
            }

            const transformers = A.AuraTransformers;
            if (!transformers) {
                return '// AuraTransformers not loaded';
            }

            // Build all transformed data
            const data = transformers.buildAll(state);

            // === STACK CONSTRUCTION (Instrumented) ===
            let output = '/* === AURA LIBRARY (Core) === */\n' + libCode + '\n\n';

            // 1. Data Globals
            output += '/* === GLOBAL DATA === */\n';
            output += A.AuraBuilder._buildEntityDBCode(data.entityDB) + '\n';
            output += A.AuraBuilder._buildRelationshipDBCode(data.relationshipDB) + '\n\n';

            // 2. Voices (Instrumented)
            output += this._buildInstrumentedVoicesScript(state) + '\n\n';

            // 3. Microcues (Instrumented)
            output += this._buildInstrumentedMicrocuesScript(state) + '\n\n';

            // 4. Custom Rules (Instrumented)
            output += this._buildInstrumentedCustomRulesScript(state) + '\n\n';

            // 5. Scoring (Instrumented)
            output += this._buildInstrumentedScoringScript(state) + '\n\n';

            // 6. Events (Instrumented)
            output += this._buildInstrumentedEventsScript(state) + '\n\n';

            // 7. Actor Cues (Instrumented)
            output += this._buildInstrumentedActorCuesScript(state) + '\n\n';

            // 8. Lore (Instrumented)
            output += this._buildInstrumentedLoreScript(data.loreEntries) + '\n\n';

            // 9. Pairs (Instrumented - Relationship Logic)
            output += this._buildInstrumentedPairsScript(state) + '\n\n';

            return '/* === AURA (Simulation Mode - Instrumented) === */\n\n' + output;
        },

        // Helper for JS string escaping
        _jsStr: function (s) {
            return '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
        },

        /**
         * Instrumented Pairs (Relationships) Script
         */
        _buildInstrumentedPairsScript: function (state) {
            const pairs = Object.values(state?.nodes?.pairs?.items || {});
            if (!pairs.length) return '// No Pairs';

            const jsStr = this._jsStr;
            let s = '/* === PAIRS (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (!context || !context.actors) return;\n\n';

            pairs.forEach((p, i) => {
                const actor1Name = state.nodes.actors.items[p.actor1]?.name || 'Unknown';
                const actor2Name = state.nodes.actors.items[p.actor2]?.name || 'Unknown';
                const name = `${p.type || 'Relationship'}: ${actor1Name} & ${actor2Name}`;

                s += `  // Pair: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var a1 = ${jsStr(p.actor1 || '')};\n`;
                s += `    var a2 = ${jsStr(p.actor2 || '')};\n`;
                s += `    var passed = context.actors.indexOf(a1) !== -1 && context.actors.indexOf(a2) !== -1;\n`;
                s += `    var reason = passed ? 'Both actors present' : 'One or both actors missing';\n`;
                s += `    var assoc = [a1, a2];\n`;
                s += `    var content = ${jsStr(p.content || '')};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'pair', passed: passed, reason: reason, metadata: { associatedActors: assoc, content: content }});\n`;
                s += `    if (passed && passed) {\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedVoicesScript: function (state) {
            const voices = Object.values(state?.nodes?.voices?.items || {});
            const jsStr = this._jsStr;
            let s = '/* === VOICES (Instrumented) === */\n';
            s += '(function(){\n';

            voices.forEach((v, i) => {
                const actorName = state.nodes.actors.items[v.actorId]?.name || 'Unknown';
                const name = `Voice ${i + 1}: ${actorName}`;

                s += `  (function(){\n`;
                s += `    var passed = ${v.enabled};\n`;
                s += `    var reason = passed ? 'Voice enabled' : 'Voice disabled';\n`;
                s += `    var content = ${jsStr(v.content || '')};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'voice', passed: passed, reason: reason, metadata: { content: content, target: 'Character Personality' }});\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedMicrocuesScript: function (state) {
            const entries = Object.values(state?.aura?.microcues?.items || {});
            if (!entries.length) return '// No MicroCues';

            const jsStr = this._jsStr;
            let s = '/* === MICROCUES (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined" || !context) return;\n';
            s += '  var currentEmotion = (context.emotions && context.emotions.current) ? context.emotions.current.toUpperCase() : "NEUTRAL";\n\n';

            entries.forEach((e, i) => {
                const name = e.title || `MicroCue ${i + 1}`;
                const reqEmotions = e.emotionGates?.andAny || [];

                s += `  // MicroCue: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var passed = true;\n`;
                s += `    var reason = '';\n`;

                if (reqEmotions.length > 0) {
                    s += `    var reqEmotions = ${JSON.stringify(reqEmotions)};\n`;
                    s += `    var emotionMatch = reqEmotions.indexOf(currentEmotion) !== -1;\n`;
                    s += `    if (!emotionMatch) { passed = false; reason = 'Emotion mismatch. Current: ' + currentEmotion + ', Required: ' + reqEmotions.join('/'); }\n`;
                }

                s += `    if (passed) reason = 'Emotion: ' + currentEmotion + ' matched';\n`;
                s += `    var content = ${jsStr(e.content || '')};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'microcue', passed: passed, reason: reason, metadata: { content: content, target: 'Character Personality' }});\n`;
                s += `    if (passed && context.character) {\n`;
                s += `      context.character.personality = (context.character.personality || '') + ' ' + ${jsStr(e.content || '')};\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedCustomRulesScript: function (state) {
            const rules = state?.sbx?.rules || [];
            if (!rules.length) return '// No Custom Rules';

            const jsStr = this._jsStr;
            let s = '/* === CUSTOM RULES (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (!context) return;\n\n';

            rules.forEach((rule, i) => {
                const name = rule.name || `Rule ${i + 1}`;
                const enabled = rule.enabled !== false;

                s += `  // Rule: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var passed = ${enabled};\n`;
                s += `    var reason = passed ? '${(rule.chain || []).length} condition blocks' : 'Rule is disabled';\n`;
                s += `    var assocActors = ${JSON.stringify(rule.associatedActors || [])};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'advanced', passed: passed, reason: reason, metadata: { associatedActors: assocActors, target: 'Context State/Output' }});\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedScoringScript: function (state) {
            const topics = state?.scoring?.topics || [];
            if (!topics.length) return '// No Scoring Topics';

            const jsStr = this._jsStr;
            let s = '/* === SCORING (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (!context || !context.chat) return;\n';
            s += '  var lastMsg = (context.chat.length > 0) ? context.chat[context.chat.length-1].mes || "" : "";\n\n';

            topics.forEach((topic, i) => {
                const name = topic.name || `Topic ${i + 1}`;
                const keywords = (topic.keywordsText || '').split(/[\n,]+/).map(k => k.trim()).filter(k => k);

                s += `  // Scoring: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var enabled = ${topic.enabled ? 'true' : 'false'};\n`;
                s += `    if (!enabled) {\n`;
                s += `      if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'scoring', passed: false, reason: 'Topic is disabled'});\n`;
                s += `      return;\n`;
                s += `    }\n`;
                s += `    var keywords = ${JSON.stringify(keywords)};\n`;
                s += `    var matches = 0;\n`;
                s += `    var msgLower = lastMsg.toLowerCase();\n`;
                s += `    keywords.forEach(function(kw){ if (msgLower.indexOf(kw.toLowerCase()) !== -1) matches++; });\n`;
                s += `    var passed = matches >= ${topic.min || 1};\n`;
                s += `    var reason = 'Found ' + matches + ' matches (min: ${topic.min || 1})';\n`;
                s += `    var assocActors = ${JSON.stringify(topic.associatedActors || [])};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'scoring', passed: passed, reason: reason, metadata: { associatedActors: assocActors, target: 'Score State' }});\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedEventsScript: function (state) {
            const events = Object.values(state?.aura?.events?.items || {});
            if (!events.length) return '// No Events';

            const jsStr = this._jsStr;
            let s = '/* === EVENTS (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (!context) return;\n\n';

            events.forEach((evt, i) => {
                const name = evt.name || `Event ${i + 1}`;
                const enabled = evt.enabled !== false;

                s += `  // Event: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var passed = ${enabled};\n`;
                s += `    var reason = passed ? 'Type: ${evt.eventType || 'standard'}' : 'Event is disabled';\n`;
                s += `    var assocActors = ${JSON.stringify(evt.associatedActors || [])};\n`;
                s += `    var content = ${jsStr(evt.effect || '')};\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'event', passed: passed, reason: reason, metadata: { associatedActors: assocActors, content: content, target: 'Character Personality' }});\n`;
                if (enabled && evt.effect) {
                    s += `    if (passed && context.character) {\n`;
                    s += `      context.character.personality = (context.character.personality || '') + '\\n' + ${jsStr(evt.effect)};\n`;
                    s += `    }\n`;
                }
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedActorCuesScript: function (state) {
            const actors = Object.values(state?.nodes?.actors?.items || {});
            const actorsWithCues = actors.filter(a =>
                Object.keys(a.pulseCues || {}).length > 0 ||
                Object.keys(a.erosCues || {}).length > 0 ||
                Object.keys(a.intentCues || {}).length > 0
            );

            if (!actorsWithCues.length) return '// No Actor Cues';

            const jsStr = this._jsStr;
            let s = '/* === ACTOR CUES (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (!context) return;\n';
            s += '  var activeTags = context.activeTags || [];\n\n';

            actorsWithCues.forEach(actor => {
                const actorName = actor.name || 'Unknown Actor';

                // PULSE
                const pulseCues = Object.entries(actor.pulseCues || {});
                if (pulseCues.length > 0) {
                    s += `  // ${actorName} - PULSE\n`;
                    pulseCues.forEach(([emotion, cue]) => {
                        s += `  (function(){\n`;
                        s += `    var tag = ${jsStr('PULSE_' + emotion.toUpperCase())};\n`;
                        s += `    var passed = activeTags.indexOf(tag) !== -1;\n`;
                        s += `    var reason = passed ? 'Tag ' + tag + ' active' : 'Tag ' + tag + ' not found';\n`;
                        s += `    var content = ${jsStr(cue.content || '')};\n`;
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - PULSE: ' + emotion)}, type: 'actor-cue', passed: passed, reason: reason, metadata: { content: content, target: 'Context Tags' }});\n`;
                        s += `  })();\n`;
                    });
                }

                // EROS
                const erosCues = Object.entries(actor.erosCues || {});
                if (erosCues.length > 0) {
                    s += `  // ${actorName} - EROS\n`;
                    erosCues.forEach(([level, cue]) => {
                        s += `  (function(){\n`;
                        s += `    var tag = ${jsStr('EROS_' + level.toUpperCase())};\n`;
                        s += `    var passed = activeTags.indexOf(tag) !== -1;\n`;
                        s += `    var reason = passed ? 'Tag ' + tag + ' active' : 'Tag ' + tag + ' not found';\n`;
                        s += `    var content = ${jsStr(cue.content || '')};\n`;
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - EROS: ' + level)}, type: 'actor-cue', passed: passed, reason: reason, metadata: { content: content, target: 'Context Tags' }});\n`;
                        s += `  })();\n`;
                    });
                }

                // INTENT
                const intentCues = Object.entries(actor.intentCues || {});
                if (intentCues.length > 0) {
                    s += `  // ${actorName} - INTENT\n`;
                    intentCues.forEach(([intent, cue]) => {
                        s += `  (function(){\n`;
                        s += `    var tag = ${jsStr('INTENT_' + intent.toUpperCase())};\n`;
                        s += `    var passed = activeTags.indexOf(tag) !== -1;\n`;
                        s += `    var reason = passed ? 'Tag ' + tag + ' active' : 'Tag ' + tag + ' not found';\n`;
                        s += `    var content = ${jsStr(cue.content || '')};\n`;
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - INTENT: ' + intent)}, type: 'actor-cue', passed: passed, reason: reason, metadata: { content: content, target: 'Context Tags' }});\n`;
                        s += `  })();\n`;
                    });
                }
            });

            s += '})();';
            return s;
        },

        _buildInstrumentedLoreScript: function (loreEntries) {
            if (!loreEntries || !loreEntries.length) return '// No Lore Entries';

            const jsStr = this._jsStr;
            let s = '/* === LOREBOOK (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined" || !context || !context.character) return;\n';
            s += '  var msg = (context.chat && context.chat.length) ? context.chat[context.chat.length-1].mes || "" : "";\n\n';

            loreEntries.forEach((entry, i) => {
                const name = entry.tag || `Entry ${i + 1}`;
                const keywords = entry.keywords || entry.words || []; // Handle data shape variants

                // Detect Target & Content
                // Transformers map injectionTarget to a key in the entry. We must find it.
                const metaKeys = new Set([
                    'tag', 'keywords', 'triggers', 'priority', 'probability',
                    'group', 'groupWeight', 'minMessages', 'associatedActors',
                    'andAnyTags', 'blocksTags', 'notAnyTags',
                    'andAnyEmotion', 'andAllEmotion', 'notAnyEmotion', 'notAllEmotion',
                    'andAnyIntent', 'requireEntities',
                    'erosMin', 'erosMax', 'erosLTMin',
                    'words', 'content' // exclude 'content' if we prefer specific keys, but fallback uses it
                ]);

                let targetKey = 'personality';
                let contentVal = '';

                // 1. Check Standard Keys
                if (typeof entry.personality === 'string' && entry.personality) { targetKey = 'personality'; contentVal = entry.personality; }
                else if (typeof entry.scenario === 'string' && entry.scenario) { targetKey = 'scenario'; contentVal = entry.scenario; }
                else if (typeof entry.mes_example === 'string' && entry.mes_example) { targetKey = 'mes_example'; contentVal = entry.mes_example; }
                else if (typeof entry.description === 'string' && entry.description) { targetKey = 'description'; contentVal = entry.description; }
                else {
                    // 2. Scan for custom keys or fallbacks
                    // If entry.content exists and wasn't caught above
                    if (entry.content) {
                        targetKey = 'personality'; // standard fallback
                        contentVal = entry.content;
                    } else {
                        // Scan keys
                        for (const k in entry) {
                            if (!metaKeys.has(k) && typeof entry[k] === 'string' && entry[k].length > 0) {
                                targetKey = k;
                                contentVal = entry[k];
                                break;
                            }
                        }
                    }
                }

                // Format friendly text for UI
                let friendlyTarget = 'Character Personality';
                if (targetKey === 'scenario') friendlyTarget = 'Character Scenario';
                else if (targetKey === 'mes_example') friendlyTarget = 'Character Example Dialogue';
                else if (targetKey === 'description') friendlyTarget = 'Character Description';
                else if (targetKey !== 'personality') friendlyTarget = 'Source: ' + targetKey;

                s += `  // Lore: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var entry = ${JSON.stringify(entry)};\n`;
                s += `    var passed = AURA.gates.checkWords(entry, msg) && AURA.gates.checkTags(entry, {}, 'Tags');\n`;
                // Probability
                if (entry.probability !== undefined && entry.probability < 1) { // 0-1 scale
                    s += `    if (passed && Math.random() > ${entry.probability}) passed = false;\n`;
                }

                s += `    var reason = passed ? 'Keywords/Tags matched' : 'Conditions not met';\n`;
                s += `    var assocActors = ${JSON.stringify(entry.associatedActors || [])};\n`;

                // Use detected content
                s += `    var content = ${jsStr(contentVal || '')};\n`;

                // Log with friendly target
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'lorebook', passed: passed, reason: reason, metadata: { associatedActors: assocActors, content: content, target: ${jsStr(friendlyTarget)} }});\n`;

                s += `    if (passed && content) {\n`;
                // Inject to target
                s += `      context.character['${targetKey}'] = (context.character['${targetKey}'] || '') + '\\n' + content;\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        }

    };

    A.AuraSimBuilder = AuraSimBuilder;

})(window.Anansi);
