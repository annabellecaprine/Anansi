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

            return '/* === AURA (Simulation Mode - Instrumented) === */\n\n' + output;
        },

        // Helper for JS string escaping
        _jsStr: function (s) {
            return '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
        },

        /**
         * Instrumented Voices Script
         */
        _buildInstrumentedVoicesScript: function (state) {
            const voices = state?.weaves?.voices?.voices || [];
            if (!voices.length) return '// No Voices';

            const jsStr = this._jsStr;
            let s = '/* === VOICES (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined" || !context) return;\n\n';

            voices.forEach((v, i) => {
                const name = v.name || `Voice ${i + 1}`;
                s += `  // Voice: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var passed = ${v.enabled ? 'true' : 'false'};\n`;
                s += `    var reason = passed ? 'Voice is active' : 'Voice is disabled';\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'voice', passed: passed, reason: reason});\n`;
                if (v.enabled && v.baselineRail) {
                    s += `    if (passed && context.character) {\n`;
                    s += `      context.character.personality = (context.character.personality || '') + '\\n' + ${jsStr(v.baselineRail)};\n`;
                    s += `    }\n`;
                }
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Instrumented Microcues Script
         */
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

                // Emotion gate only (entity gate removed - not functional)
                if (reqEmotions.length > 0) {
                    s += `    var reqEmotions = ${JSON.stringify(reqEmotions)};\n`;
                    s += `    var emotionMatch = reqEmotions.indexOf(currentEmotion) !== -1;\n`;
                    s += `    if (!emotionMatch) { passed = false; reason = 'Emotion mismatch. Current: ' + currentEmotion + ', Required: ' + reqEmotions.join('/'); }\n`;
                }

                s += `    if (passed) reason = 'Emotion: ' + currentEmotion + ' matched';\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'microcue', passed: passed, reason: reason});\n`;
                s += `    if (passed && context.character) {\n`;
                s += `      context.character.personality = (context.character.personality || '') + ' ' + ${jsStr(e.content || '')};\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Instrumented Custom Rules (SBX) Script
         */
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
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'advanced', passed: passed, reason: reason});\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Instrumented Scoring Script
         */
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
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'scoring', passed: passed, reason: reason});\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Instrumented Events Script
         */
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
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'event', passed: passed, reason: reason});\n`;
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

        /**
         * Instrumented Actor Cues Script
         */
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
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - PULSE: ' + emotion)}, type: 'actor-cue', passed: passed, reason: reason});\n`;
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
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - EROS: ' + level)}, type: 'actor-cue', passed: passed, reason: reason});\n`;
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
                        s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(actorName + ' - INTENT: ' + intent)}, type: 'actor-cue', passed: passed, reason: reason});\n`;
                        s += `  })();\n`;
                    });
                }
            });

            s += '})();';
            return s;
        },

        /**
         * Instrumented Lore Script
         */
        _buildInstrumentedLoreScript: function (loreEntries) {
            if (!loreEntries || !loreEntries.length) return '// No Lore Entries';

            const jsStr = this._jsStr;
            let s = '/* === LOREBOOK (Instrumented) === */\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined" || !context || !context.character) return;\n';
            s += '  var msg = (context.chat && context.chat.length) ? context.chat[context.chat.length-1].mes || "" : "";\n\n';

            loreEntries.forEach((entry, i) => {
                const name = entry.tag || `Entry ${i + 1}`;
                const keywords = entry.words || [];

                s += `  // Lore: ${name}\n`;
                s += `  (function(){\n`;
                s += `    var entry = ${JSON.stringify(entry)};\n`;
                s += `    var passed = AURA.gates.checkWords(entry, msg) && AURA.gates.checkTags(entry, {}, 'Tags');\n`;
                s += `    var reason = passed ? 'Keywords matched: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}' : 'Keywords not found: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}';\n`;
                s += `    if (A && A.FlowLogger) A.FlowLogger.log({name: ${jsStr(name)}, type: 'lorebook', passed: passed, reason: reason});\n`;
                s += `    if (passed) {\n`;
                s += `      var content = entry.personality || entry.content || '';\n`;
                s += `      if (content) context.character.personality = (context.character.personality || '') + '\\n' + content;\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        }
    };

    A.AuraSimBuilder = AuraSimBuilder;

})(window.Anansi);
