/*
 * Anansi Core: AURA Transformers
 * File: js/core/aura_transformers.js
 * Purpose: Transform Anansi state data into AURA.js compatible formats.
 */

(function (A) {
    'use strict';

    const AuraTransformers = {

        /**
         * Transform Anansi actors into ENTITY_DB format.
         * AURA expects: { "entity_name": { gender: "M/F/N", aliases: [], tags: [] } }
         */
        buildEntityDB: function (state) {
            const entityDB = {};

            if (!state?.nodes?.actors?.items) return entityDB;

            Object.values(state.nodes.actors.items).forEach(actor => {
                if (!actor.name) return;

                // Key is lowercase for matching
                const key = actor.name.toLowerCase();

                entityDB[key] = {
                    gender: actor.gender || 'N',
                    aliases: (actor.aliases || []).map(a => a.toLowerCase()),
                    tags: actor.tags || []
                };
            });

            return entityDB;
        },

        /**
         * Transform Anansi pairs into RELATIONSHIP_DB format.
         * AURA expects: [{ pair: ["entity1", "entity2"], tags: [], injection: "" }]
         */
        buildRelationshipDB: function (state) {
            const relationshipDB = [];

            if (!state?.nodes?.pairs?.items) return relationshipDB;
            if (!state?.nodes?.actors?.items) return relationshipDB;

            const actors = state.nodes.actors.items;

            Object.values(state.nodes.pairs.items).forEach(pair => {
                if (!pair.actor1 || !pair.actor2) return;

                const actor1 = actors[pair.actor1];
                const actor2 = actors[pair.actor2];
                if (!actor1 || !actor2) return;

                // Base relationship entry
                const entry = {
                    pair: [actor1.name.toLowerCase(), actor2.name.toLowerCase()],
                    tags: pair.type ? [pair.type.toUpperCase()] : [],
                    injection: pair.content || '',
                    target: pair.target || 'personality'
                };

                relationshipDB.push(entry);

                // Add emotional shift entries
                if (pair.shifts && pair.shifts.length > 0) {
                    pair.shifts.forEach(shift => {
                        if (!shift.emotion || !shift.content) return;

                        relationshipDB.push({
                            pair: [actor1.name.toLowerCase(), actor2.name.toLowerCase()],
                            tags: [shift.emotion.toUpperCase()],
                            injection: shift.content,
                            target: pair.target || 'personality'
                        });
                    });
                }
            });

            return relationshipDB;
        },

        /**
         * Transform Anansi lorebook entries into DYNAMIC_LORE format.
         * AURA expects entries registered via registerLoreEntry()
         */
        buildLoreEntries: function (state) {
            const loreEntries = [];

            if (!state?.weaves?.lorebook?.entries) return loreEntries;

            Object.values(state.weaves.lorebook.entries).forEach(entry => {
                if (entry.enabled === false) return;

                const auraEntry = {
                    tag: entry.id || entry.uuid,
                    keywords: entry.keywords || [],
                    triggers: entry.tags || [], // Emit tags
                    priority: entry.priority || 50,
                    probability: (entry.probability !== undefined ? entry.probability : 100) / 100,
                    group: entry.inclusionGroup || null,
                    groupWeight: entry.groupWeight || 100,
                    minMessages: entry.minMessages || 0
                };

                // Injection target
                const target = entry.injectionTarget || 'personality';
                auraEntry[target] = entry.content || '';

                // Text gates
                if (entry.requireTags?.length > 0) {
                    auraEntry.andAnyTags = entry.requireTags;
                }
                if (entry.blocksTags?.length > 0) {
                    auraEntry.notAnyTags = entry.blocksTags;
                }

                // Emotion gates
                if (entry.emotionGates) {
                    if (entry.emotionGates.andAny?.length > 0) {
                        auraEntry.andAnyEmotion = entry.emotionGates.andAny;
                    }
                    if (entry.emotionGates.andAll?.length > 0) {
                        auraEntry.andAllEmotion = entry.emotionGates.andAll;
                    }
                    if (entry.emotionGates.notAny?.length > 0) {
                        auraEntry.notAnyEmotion = entry.emotionGates.notAny;
                    }
                    if (entry.emotionGates.notAll?.length > 0) {
                        auraEntry.notAllEmotion = entry.emotionGates.notAll;
                    }
                }

                // Intent gates
                if (entry.intentGates?.allowedIntents?.length > 0) {
                    auraEntry.andAnyIntent = entry.intentGates.allowedIntents;
                }

                // Entity gates
                if (entry.entityGates?.restrictToActors?.length > 0) {
                    const actorNames = entry.entityGates.restrictToActors
                        .map(id => state.nodes?.actors?.items?.[id]?.name?.toLowerCase())
                        .filter(Boolean);
                    if (actorNames.length > 0) {
                        auraEntry.requireEntities = actorNames;
                    }
                }

                // EROS gates
                if (entry.erosGates) {
                    if (entry.erosGates.currentVibe?.min !== null) {
                        auraEntry.erosMin = entry.erosGates.currentVibe.min;
                    }
                    if (entry.erosGates.currentVibe?.max !== null) {
                        auraEntry.erosMax = entry.erosGates.currentVibe.max;
                    }
                    if (entry.erosGates.longTermMin !== null) {
                        auraEntry.erosLTMin = entry.erosGates.longTermMin;
                    }
                }

                loreEntries.push(auraEntry);

                // Add shift entries as children
                if (entry.shifts && entry.shifts.length > 0) {
                    entry.shifts.forEach((shift, idx) => {
                        const shiftEntry = {
                            tag: `${entry.id || entry.uuid}_shift_${idx}`,
                            keywords: shift.keywords || [],
                            triggers: shift.tags || [],
                            priority: (entry.priority || 50) + 1, // Slightly higher priority
                            probability: 1
                        };

                        // Shift target (inherits from parent or uses its own)
                        const shiftTarget = entry.injectionTarget || 'personality';
                        shiftEntry[shiftTarget] = shift.content || shift.text || '';

                        // Shift gates
                        if (shift.requireTags?.length > 0) {
                            shiftEntry.andAnyTags = shift.requireTags;
                        }
                        if (shift.blocksTags?.length > 0) {
                            shiftEntry.notAnyTags = shift.blocksTags;
                        }

                        // Parent tag as trigger requirement
                        shiftEntry.andAnyTags = shiftEntry.andAnyTags || [];
                        shiftEntry.andAnyTags.push(entry.id || entry.uuid);

                        loreEntries.push(shiftEntry);
                    });
                }
            });

            return loreEntries;
        },

        /**
         * Transform Anansi events into AURA emotion override entries.
         * Maps to the emotion sections in AURA.js (lines 122-195)
         */
        buildEmotionEntries: function (state) {
            const emotionEntries = [];

            if (!state?.aura?.events?.items) return emotionEntries;

            Object.values(state.aura.events.items).forEach(event => {
                if (!event.enabled) return;

                const entry = {
                    tag: event.id,
                    keywords: event.keywords || [],
                    triggers: event.emitTags || [],
                    priority: event.priority || 50
                };

                // Event targets
                if (event.personality) entry.personality = event.personality;
                if (event.scenario) entry.scenario = event.scenario;

                // Emotion gate (if set)
                if (event.emotion) {
                    entry.andAnyEmotion = [event.emotion.toUpperCase()];
                }

                emotionEntries.push(entry);
            });

            return emotionEntries;
        },

        /**
         * Transform Anansi scoring rules into AURA weighted entries.
         */
        buildScoringEntries: function (state) {
            const scoringEntries = [];

            if (!state?.aura?.scoring?.items) return scoringEntries;

            Object.values(state.aura.scoring.items).forEach(rule => {
                if (!rule.enabled) return;

                const entry = {
                    tag: rule.id,
                    keywords: rule.keywords || [],
                    priority: rule.weight || 50,
                    probability: 1
                };

                if (rule.text) {
                    entry.personality = rule.text;
                }

                scoringEntries.push(entry);
            });

            return scoringEntries;
        },

        /**
         * Generate the complete transformed data for injection into AURA.js
         */
        buildAll: function (state) {
            return {
                entityDB: AuraTransformers.buildEntityDB(state),
                relationshipDB: AuraTransformers.buildRelationshipDB(state),
                loreEntries: [
                    ...AuraTransformers.buildLoreEntries(state),
                    ...AuraTransformers.buildEmotionEntries(state),
                    ...AuraTransformers.buildScoringEntries(state)
                ]
            };
        },

        /**
         * Serialize ENTITY_DB to JavaScript code string
         */
        serializeEntityDB: function (entityDB) {
            return 'const ENTITY_DB = ' + JSON.stringify(entityDB, null, 2) + ';';
        },

        /**
         * Serialize RELATIONSHIP_DB to JavaScript code string
         */
        serializeRelationshipDB: function (relationshipDB) {
            return 'const RELATIONSHIP_DB = ' + JSON.stringify(relationshipDB, null, 2) + ';';
        },

        /**
         * Serialize lore entries to JavaScript code string using registerLoreEntry()
         */
        serializeLoreEntries: function (loreEntries) {
            if (!loreEntries.length) return '// No lorebook entries';

            const lines = loreEntries.map(entry => {
                return 'registerLoreEntry(' + JSON.stringify(entry, null, 2) + ');';
            });

            return lines.join('\n\n');
        },

        /**
         * Build the Voice Client Script (Moved from panels/voices.js)
         */
        buildVoicesScript: function (state) {
            const data = state?.weaves?.voices;
            const voices = (data && data.voices) ? data.voices : [];
            const activeVoices = voices.filter(v => v.enabled);

            if (!activeVoices.length) return '// No active voices';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
            const toLines = (s) => String(s || '').split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(l => l);
            const emitArray = (arr) => '[' + arr.map(jsStr).join(',') + ']';
            const emitSubtones = (subtones) => {
                if (!subtones || !subtones.length) return '[]';
                return '[' + subtones.map((st, i) =>
                    `{label:${jsStr(st.label || ('Subtone ' + (i + 1)))},weight:${(+st.weight || 0)},rail:${jsStr(st.rail || '')}}`
                ).join(',') + ']';
            };

            let s = '/* === VOICE RAILS (Client) =========================================== */\n\n';
            s += 'var VOICES_CFG = {\n';
            s += '  enabled: true,\n';
            s += `  debug: ${data && data.debug ? 'true' : 'false'},\n`;
            s += '  voices: [\n';

            s += activeVoices.map(v => {
                const att = v.attempt || {};

                return `    {
      enabled: ${v.enabled},
      tag: ${jsStr(v.tag || 'V')},
      characterName: ${jsStr(v.characterName)},
      chatName: ${jsStr(v.chatName)},
      handle: ${jsStr(v.handle)},
      attempt: {
        baseChance: ${att.baseChance || 0.6},
        contentBoost: ${att.contentBoost || 0.15},
        softPenalty: ${att.softPenalty || 0.20}
      },
      baselineMarker: ${jsStr(v.baselineMarker || '[VOICE]')},
      baselineRail: ${jsStr(v.baselineRail)},
      cadenceRail: ${jsStr(v.cadenceRail)},
      subtones: ${emitSubtones(v.subtones)}
    }`;
            }).join(',\n');

            s += '\n  ]\n};\n\n';

            // Engine Logic (Client Script using AURA Library)
            s += `(function(){
  // Dependencies: AURA (Global)
  if (typeof AURA === 'undefined') { console.warn('VOICES: AURA lib missing'); return; }
  if (!VOICES_CFG || !VOICES_CFG.enabled) return;
  if (!context || !context.chat) return;

  var utils = AURA.utils;
  
  // 1. Prepare Inputs
  var msg = (typeof SBX_R !== 'undefined') ? SBX_R.msgLower(context) : (context.chat.length ? context.chat[context.chat.length-1].mes : '').toLowerCase();
  
  // Shim context
  if (!context.character) context.character = {};
  if (typeof context.character.personality !== "string") context.character.personality = "";
  if (typeof context.character.scenario !== "string") context.character.scenario = "";

  function debugCrumb(vcfg, crumb){
    if (!VOICES_CFG.debug) return;
    context.character.scenario += " [" + (vcfg.tag||"VR") + ":" + crumb + "]";
  }

  function pickSubtone(subtones){
    if (!subtones || !subtones.length) return null;
    var sum = subtones.reduce((acc,s) => acc + (s.weight||0), 0);
    if (sum <= 0) return subtones[0];
    var r = Math.random() * sum;
    var acc = 0;
    for (var i=0;i<subtones.length;i++){
      var w = subtones[i].weight||0;
      if (w<=0) continue;
      acc += w;
      if (r <= acc) return subtones[i];
    }
    return subtones[subtones.length-1];
  }

  function runVoice(vcfg){
    if (!vcfg || !vcfg.enabled) return;

    // A. Check Context Gates (using AURA.gates if implemented, or simple text check for now)
    // The original logic didn't have heavy gating, just simple chance.
    // Future expansion: if (vcfg.block && !AURA.gates.checkWords(vcfg, msg)) return;

    // 1. One-time Baseline Injection
    if (vcfg.baselineMarker && vcfg.baselineRail && context.character.personality.indexOf(vcfg.baselineMarker) === -1){
      context.character.personality += " " + vcfg.baselineRail;
      debugCrumb(vcfg, "BASE");
    }

    // 2. Cadence Rail (Always)
    if (vcfg.cadenceRail) context.character.personality += " " + vcfg.cadenceRail;

    // 3. Attempt Logic
    // Use AURA.utils.hasTerm for any keyword checks if added later
    var chance = vcfg.attempt.baseChance;
    
    // Example usage of AURA utils for content boost (if configured)
    // if (vcfg.ctx.contentWords.some(w => utils.hasTerm(msg, w))) chance += vcfg.attempt.contentBoost;
    // (We keep original logic for now but this demonstrates integration)

    if (Math.random() < chance) {
       debugCrumb(vcfg, "ATT:Y");
       var st = pickSubtone(vcfg.subtones);
       if (st && st.rail) {
         debugCrumb(vcfg, "ST:" + (st.label||"?"));
         context.character.personality += " " + st.rail;
       }
    } else {
       debugCrumb(vcfg, "ATT:N");
       // Example soft penalty logic would go here
    }
  }

  VOICES_CFG.voices.forEach(runVoice);
})();`;

            return s;
        },

        /**
         * Build the MicroCues Client Script
         */
        buildMicrocuesScript: function (state) {
            const data = state?.aura?.microcues;
            const entries = (data && data.items) ? Object.values(data.items) : [];

            if (!entries.length) return '// No MicroCues entries';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
            const emitArray = (arr) => '[' + (arr || []).map(jsStr).join(',') + ']';

            let s = '/* === MICROCUES (Client) ============================================= */\n\n';
            s += 'var MICROCUES_CFG = {\n';
            s += '  enabled: true,\n';
            s += '  entries: [\n';

            s += entries.map(e => {
                const restrictActors = emitArray(e.entityGates?.restrictToActors);
                const emotionAndAny = emitArray(e.emotionGates?.andAny);
                return `    {
      id: ${jsStr(e.id)},
      title: ${jsStr(e.title)},
      content: ${jsStr(e.content)},
      entityGates: { restrictToActors: ${restrictActors} },
      emotionGates: { andAny: ${emotionAndAny} }
    }`;
            }).join(',\n');

            s += '\n  ]\n};\n\n';

            // Engine Logic (Client)
            s += `(function(){
  // Dependencies: AURA
  if (typeof AURA === 'undefined') return;
  if (!MICROCUES_CFG || !MICROCUES_CFG.enabled) return;
  if (!context) return;
  
  // Get current emotion from PULSE/EROS/INTENT signals
  var currentEmotion = (context.emotions && context.emotions.current) ? context.emotions.current.toUpperCase() : 'NEUTRAL';

  MICROCUES_CFG.entries.forEach(function(entry){
    
    // Emotion Gate - check if current emotion matches any required emotions
    var reqEmotions = entry.emotionGates.andAny || [];
    if (reqEmotions.length > 0) {
       var match = reqEmotions.some(function(e){ return e === currentEmotion; });
       if (!match) return;
    }

    // Injection
    if (context.character && typeof context.character.personality === 'string') {
      context.character.personality += ' ' + entry.content;
      if (AURA.utils && AURA.utils.dbg) AURA.utils.dbg("MicroCues: Injected [" + entry.title + "]");
    }
  });

})();`;

            return s;
        },

        /**
         * Build the Custom Rules (SBX) Client Script
         */
        buildCustomRulesScript: function (state) {
            const sbx = state?.sbx;
            if (!sbx) return '// No Custom Rules state';

            const rules = sbx.rules || [];
            const activeRules = rules.filter(r => r.enabled !== false); // default true

            if (!activeRules.length) return '// No active Custom Rules';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';

            let s = '/* === CUSTOM RULES (SBX) ============================================= */\n\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined") return;\n';
            s += '  if (!context) return;\n\n';

            // 1. Runtime Helpers (SBX Logic)
            s += `  var SBX = {
    lists: ${JSON.stringify(sbx.lists || [])},
    derived: ${JSON.stringify(sbx.derived || [])},
    
    // Check if any word from list is in text (History Lookup)
    anyInList: function(listId, windowSize) {
      if (!listId) return false;
      var list = this.lists.find(function(l){ return l.id === listId; });
      if (!list) return false;
      var terms = (list.itemsText || "").split(/\\n/).map(function(t){ return t.trim().toLowerCase(); }).filter(function(t){ return t; });
      if (!terms.length) return false;
      
      // Get history window
      var msgs = context.chat || [];
      var limit = Math.min(msgs.length, windowSize || 10);
      var text = "";
      for (var i=0; i<limit; i++) {
         text += " " + (msgs[msgs.length - 1 - i].mes || "").toLowerCase();
      }
      
      // Use AURA util if avail, else manual
      if (AURA.utils && AURA.utils.hasTerm) {
         return terms.some(function(t){ return AURA.utils.hasTerm(text, t); });
      }
      return terms.some(function(t){ return text.indexOf(t) !== -1; });
    },

    // Check message count
    msgCount: function() {
       return (context.chat || []).length;
    },

    // Get Derived Value
    getDerived: function(derId) {
       var d = this.derived.find(function(i){ return i.id === derId; });
       if (!d) return 0;
       
       if (d.sourceType === 'listCount') {
          // Count occurrences of list terms in window
          var list = this.lists.find(function(l){ return l.id === d.listId; });
          if (!list) return 0;
          var terms = (list.itemsText || "").split(/\\n/).map(function(t){ return t.trim().toLowerCase(); }).filter(function(t){ return t; });
          if (!terms.length) return 0;

          var msgs = context.chat || [];
          var limit = Math.min(msgs.length, d.window || 10);
          var text = "";
          for (var i=0; i<limit; i++) { text += " " + (msgs[msgs.length - 1 - i].mes || "").toLowerCase(); }
          
          var count = 0;
          terms.forEach(function(t){
              var pos = 0;
              while(true) {
                 pos = text.indexOf(t, pos);
                 if (pos >= 0) { count++; pos += t.length; } else break;
              }
          });
          return count;
       }
       return 0;
    }
  };\n\n`;

            // 2. Compile Rules
            activeRules.forEach((rule, rIdx) => {
                s += `  // Rule: ${rule.name || ('Rule ' + rIdx)}\n`;
                s += `  (function(){\n`;

                // Chain
                const chain = rule.chain || [];
                chain.forEach((block, bIdx) => {
                    const type = block.type || 'if';
                    const conds = block.conditions || [];

                    // Compile Condition Logic
                    let expr = 'true';
                    if (conds.length > 0) {
                        const parts = conds.map(c => {
                            if (c.type === 'anyInList') {
                                return `SBX.anyInList("${c.listId}", 10)`; // Default window 10
                            } else if (c.type === 'messageCountComparison') {
                                return `SBX.msgCount() ${c.op || '>='} ${c.threshold || 0}`;
                            } else if (c.type === 'derivedNumberComparison') {
                                return `SBX.getDerived("${c.derivedId}") ${c.op || '>='} ${c.threshold || 0}`;
                            } else if (c.type === 'lastUserMessageLength') {
                                // Assume context.chat has items
                                return `((context.chat && context.chat.length && context.chat[context.chat.length-1].mes) ? context.chat[context.chat.length-1].mes.length : 0) ${c.op || '>='} ${c.threshold || 0}`;
                            }
                            return 'true'; // Fallback
                        });
                        // Join: For now support 'AND' as default for block conditions
                        expr = parts.join(' && ');
                    }

                    // Structure
                    if (type === 'if') {
                        s += `    if (${expr}) {\n`;
                    } else if (type === 'elseif') {
                        s += `    } else if (${expr}) {\n`;
                    } else if (type === 'else') {
                        s += `    } else {\n`;
                    }

                    // Actions
                    const actions = block.actions || [];
                    actions.forEach(act => {
                        const txt = jsStr(act.text);
                        if (act.target === 'character.scenario') {
                            s += `      context.character.scenario = (context.character.scenario||"") + "\\n" + ${txt};\n`;
                        } else {
                            s += `      context.character.personality = (context.character.personality||"") + " " + ${txt};\n`;
                        }
                    });
                });

                // Close chain
                if (chain.length > 0) s += `    }\n`;

                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Build the Scoring (Basic + Advanced) Client Script
         */
        buildScoringScript: function (state) {
            const scoring = state?.scoring;
            if (!scoring) return '// No Scoring state';

            const topics = scoring.topics || [];     // Basic
            const advanced = scoring.advanced || []; // Advanced

            const activeTopics = topics.filter(t => t.enabled);
            const activeAdvuanced = advanced.filter(t => t.enabled);

            if (!activeTopics.length && !activeAdvuanced.length) return '// No active Scoring rules';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';

            let s = '/* === SCORING (Basic & Advanced) ========================================= */\n\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined") return;\n';
            s += '  if (!context) return;\n\n';

            // Helpers
            s += `  var S_UTIL = {
    countKeywords: function(text, terms, opts) {
       if (!terms || !terms.length) return 0;
       var count = 0;
       var haystack = (text || "").toLowerCase(); // simple lowercase for now
       terms.forEach(function(t){
          // Simple substring count for parity with basic logic
          var pos = 0;
          var step = t.length;
          while (true) {
             pos = haystack.indexOf(t, pos);
             if (pos >= 0) { count++; pos += step; } else { break; }
          }
       });
       return count;
    },
    
    // Check Basic Topic
    checkTopic: function(topic, msgs) {
       var terms = (topic.keywordsText || "").split(/[\\n,]+/).map(function(t){ return t.trim().toLowerCase(); }).filter(function(t){ return t; });
       if (!terms.length) return false;
       
       // Scan Depth
       var limit = Math.min(msgs.length, topic.depth || 10);
       var text = "";
       for (var i=0; i<limit; i++) {
          text += " " + (msgs[msgs.length - 1 - i].mes || "").toLowerCase();
       }
       
       var count = this.countKeywords(text, terms);
       if (count < (topic.min || 1)) return false;
       if (topic.useMax && count > (topic.max || 100)) return false;
       return true;
    }
  };\n\n`;

            // 1. Basic Topics
            activeTopics.forEach(t => {
                s += `  // Basic: ${t.name}\n`;
                s += `  if (S_UTIL.checkTopic(${JSON.stringify(t)}, context.chat || [])) {\n`;
                s += `    var txt = ${jsStr(t.contextField)};\n`;
                if (t.target === 'character.scenario') {
                    s += `    context.character.scenario = (context.character.scenario||"") + "\\n" + txt;\n`;
                } else {
                    s += `    context.character.personality = (context.character.personality||"") + " " + txt;\n`;
                }
                s += `  }\n\n`;
            });

            // 2. Advanced Rules
            // These can depend on Basic Topics, so we run them after? Or they are independent checks?
            // Advanced rule has 'conditions': keywords, window, scoringTopicId
            activeAdvuanced.forEach(adv => {
                s += `  // Advanced: ${adv.name}\n`;
                s += `  (function(){\n`;
                s += `     var pass = true;\n`;
                const c = adv.conditions;

                // Condition 1: Keywords
                if (c.keywordsEnabled) {
                    s += `     if (pass) { \n`;
                    s += `        var kwText = ${jsStr(c.keywordsText)};\n`;
                    s += `        var kwTerms = kwText.split(/[\\n,]+/).map(function(k){return k.trim().toLowerCase();}).filter(function(k){return k;});\n`;
                    // Check in full history? or last window? Advanced panel doc doesn't specify scope, assume history or define 'scan window'?
                    // The panel has "Condition 2: Msg Window". Implicitly Keywords apply to... ? usually 'last message' or 'history'.
                    // Let's assume History for broad catch.
                    s += `        var histText = (context.chat||[]).map(function(m){return m.mes||"";}).join(" ").toLowerCase();\n`;
                    s += `        var kwCount = S_UTIL.countKeywords(histText, kwTerms);\n`;
                    s += `        if (kwCount < 1) pass = false;\n`;
                    s += `     }\n`;
                }

                // Condition 2: Window
                if (c.windowEnabled) {
                    s += `     if (pass) { \n`;
                    s += `        var winCount = (context.chat||[]).length;\n`;
                    s += `        if (winCount < ${c.windowMin || 1}) pass = false;\n`;
                    if (c.windowUseMax) {
                        s += `        if (winCount > ${c.windowMax || 100}) pass = false;\n`;
                    }
                    s += `     }\n`;
                }

                // Condition 3: Scoring Dependency
                if (c.scoringEnabled && c.scoringTopicId) {
                    // We need to re-verify the dependent topic or check a flag? 
                    // For simplicity, we re-run the check logic for that topic ID provided we have state access
                    // But 't' is local. Ideally, we shouldn't rely on state here.
                    // We'll iterate topics data embedded in script? Too heavy.
                    // Alternative: We optimistically check it if we can find it in the 'topics' array above.
                    const targetTopic = topics.find(t => t.id === c.scoringTopicId);
                    if (targetTopic) {
                        s += `     if (pass) { \n`;
                        s += `        if (!S_UTIL.checkTopic(${JSON.stringify(targetTopic)}, context.chat||[])) pass = false;\n`;
                        s += `     }\n`;
                    }
                }

                s += `     if (pass) {\n`;
                s += `        var txt = ${jsStr(adv.contextField)};\n`;
                if (adv.target === 'character.scenario') {
                    s += `        context.character.scenario = (context.character.scenario||"") + "\\n" + txt;\n`;
                } else {
                    s += `        context.character.personality = (context.character.personality||"") + " " + txt;\n`;
                }
                s += `     }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Build the Events (Logic & Probability) Client Script
         */
        buildEventsScript: function (state) {
            const events = state?.aura?.events?.items || {};
            const probability = state?.aura?.probability?.groups || [];

            const activeEvents = Object.values(events).filter(e => e.enabled);
            const activeGroups = probability.filter(g => g.enabled);

            if (!activeEvents.length && !activeGroups.length) return '// No active Events';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';

            let s = '/* === EVENTS (Logic & Chaos) ========================================= */\n\n';
            s += '(function(){\n';
            s += '  if (typeof AURA === "undefined") return;\n';
            s += '  if (!context) return;\n\n';

            // 1. Logic Events
            activeEvents.forEach(ev => {
                s += `  // Event: ${ev.label || ev.id}\n`;
                s += `  (function(){\n`;
                // Probability check first
                if (ev.probability !== undefined && ev.probability < 100) {
                    s += `    if (Math.random() * 100 > ${ev.probability}) return;\n`;
                }
                // Condition
                s += `    var text = (context.chat && context.chat.length) ? context.chat[context.chat.length-1].mes : "";\n`;
                s += `    var state = { flags: {}, stats: {} }; // Mock or bind to real state if available?\n`;
                // Note: In client script, 'state' is usually ephemeral or needs a persistence layer. 
                // For now, we assume local scope or if AURA exposes global persistence.

                s += `    if (${ev.condition || 'true'}) {\n`;
                s += `       ${ev.effect || ''}\n`;
                s += `    }\n`;
                s += `  })();\n\n`;
            });

            // 2. Probability Groups (Chaos)
            activeGroups.forEach(grp => {
                s += `  // Chaos Group: ${grp.name || 'Group'}\n`;
                s += `  (function(){\n`;
                s += `     if (Math.random() * 100 > ${grp.triggerChancePct || 15}) return;\n`;

                // Baked items
                const items = (grp.items || []).map(i => ({ w: i.weight || 1, t: i.text, n: i.name }));
                if (!items.length) return;

                s += `     var items = ${JSON.stringify(items)};\n`;
                s += `     var total = items.reduce(function(a,b){return a + b.w;}, 0);\n`;
                s += `     var roll = Math.random() * total;\n`;
                s += `     var sum = 0; var pick = null;\n`;
                s += `     for (var i=0; i<items.length; i++) { sum += items[i].w; if (roll < sum) { pick = items[i]; break; } }\n`;
                s += `     if (pick) {\n`;
                s += `        var txt = pick.t;\n`;
                if (grp.target === 'character.scenario') {
                    s += `        context.character.scenario = (context.character.scenario||"") + "\\n" + txt;\n`;
                } else {
                    s += `        context.character.personality = (context.character.personality||"") + " " + txt;\n`;
                }
                s += `     }\n`;
                s += `  })();\n\n`;
            });

            s += '})();';
            return s;
        },

        /**
         * Build the Actor Cues Client Script
         * Injects cue text based on detected PULSE/EROS/INTENT tags
         */
        buildActorCuesScript: function (state) {
            if (!state?.nodes?.actors?.items) return '// No actors with cues';

            const actors = state.nodes.actors.items;
            const actorsWithCues = Object.values(actors).filter(a =>
                a.traits?.pulseCues || a.traits?.erosCues || a.traits?.intentCues
            );

            if (!actorsWithCues.length) return '// No actor cues defined';

            const jsStr = (s) => '"' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';

            let s = '/* === ACTOR CUES (Physical Expression) ================================= */\n\n';
            s += 'var ACTOR_CUES_CFG = {\n';
            s += '  enabled: true,\n';
            s += '  actors: {\n';

            actorsWithCues.forEach((actor, idx) => {
                const name = actor.name.toLowerCase();
                const T = actor.traits || {};

                s += `    ${jsStr(name)}: {\n`;

                // PULSE Cues
                if (T.pulseCues && Object.keys(T.pulseCues).length > 0) {
                    s += '      pulse: {\n';
                    Object.entries(T.pulseCues).forEach(([tag, parts]) => {
                        const partsJson = JSON.stringify(parts || {});
                        s += `        ${jsStr(tag)}: ${partsJson},\n`;
                    });
                    s += '      },\n';
                }

                // EROS Cues
                if (T.erosCues && Object.keys(T.erosCues).length > 0) {
                    s += '      eros: {\n';
                    Object.entries(T.erosCues).forEach(([tag, parts]) => {
                        const partsJson = JSON.stringify(parts || {});
                        s += `        ${jsStr(tag)}: ${partsJson},\n`;
                    });
                    s += '      },\n';
                }

                // INTENT Cues
                if (T.intentCues && Object.keys(T.intentCues).length > 0) {
                    s += '      intent: {\n';
                    Object.entries(T.intentCues).forEach(([tag, parts]) => {
                        const partsJson = JSON.stringify(parts || {});
                        s += `        ${jsStr(tag)}: ${partsJson},\n`;
                    });
                    s += '      },\n';
                }

                s += `    }${idx < actorsWithCues.length - 1 ? ',' : ''}\n`;
            });

            s += '  }\n};\n\n';

            // Engine Logic
            s += `(function(){
  if (typeof AURA === 'undefined') return;
  if (!ACTOR_CUES_CFG || !ACTOR_CUES_CFG.enabled) return;
  if (!context) return;

  var activeActors = (context.activeActors || []).map(function(a){ return a.toLowerCase(); });
  if (!activeActors.length) return;

  // Get current tags from AURA systems
  var pulseTags = (context.pulse && context.pulse.activeTags) || [];
  var erosTags = (context.eros && context.eros.activeTags) || [];
  var intentTags = (context.intent && context.intent.activeTags) || [];

  // Helper to build cue string from parts
  function buildCueString(parts) {
    if (!parts) return '';
    var pieces = [];
    if (parts.basic) pieces.push(parts.basic);
    if (parts.ears) pieces.push(parts.ears);
    if (parts.tail) pieces.push(parts.tail);
    if (parts.wings) pieces.push(parts.wings);
    if (parts.horns) pieces.push(parts.horns);
    return pieces.join(', ');
  }

  // Process each active actor
  activeActors.forEach(function(actorName) {
    var actorCues = ACTOR_CUES_CFG.actors[actorName];
    if (!actorCues) return;

    var injections = [];

    // PULSE cues
    if (actorCues.pulse) {
      pulseTags.forEach(function(tag) {
        var tagLower = tag.toLowerCase();
        if (actorCues.pulse[tagLower]) {
          var cueStr = buildCueString(actorCues.pulse[tagLower]);
          if (cueStr) injections.push(cueStr);
        }
      });
    }

    // EROS cues
    if (actorCues.eros) {
      erosTags.forEach(function(tag) {
        var tagLower = tag.toLowerCase();
        if (actorCues.eros[tagLower]) {
          var cueStr = buildCueString(actorCues.eros[tagLower]);
          if (cueStr) injections.push(cueStr);
        }
      });
    }

    // INTENT cues
    if (actorCues.intent) {
      intentTags.forEach(function(tag) {
        var tagLower = tag.toLowerCase();
        if (actorCues.intent[tagLower]) {
          var cueStr = buildCueString(actorCues.intent[tagLower]);
          if (cueStr) injections.push(cueStr);
        }
      });
    }

    // Inject combined cues
    if (injections.length > 0 && context.character) {
      var cueText = '[' + actorName + ' cues: ' + injections.join('; ') + ']';
      context.character.personality = (context.character.personality || '') + ' ' + cueText;
    }
  });
})();`;

            return s;
        }
    };

    // Expose globally for AURA.js to call
    window.buildEntityDB = AuraTransformers.buildEntityDB;
    window.buildRelationshipDB = AuraTransformers.buildRelationshipDB;

    A.AuraTransformers = AuraTransformers;

})(window.Anansi);
