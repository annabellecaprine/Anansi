/*
 * Anansi Panel: MicroCue Lorebook
 * File: js/panels/microcues.js
 * Category: Weave
 * Logic: Generates narrative cues from Actor PULSE/EROS/INTENT cues.
 * Updated: Uses new pulseCues/erosCues/intentCues schema from Actors panel.
 */

(function (A) {
    'use strict';

    // --- Seeder Logic ---
    const Seeder = {
        // Emotion keys from PULSE system
        pulseKeys: ['joy', 'sadness', 'anger', 'fear', 'trust', 'disgust', 'anticipation', 'surprise'],
        // Eros levels
        erosKeys: ['flirting', 'tension', 'intimacy', 'afterglow'],
        // Intent types
        intentKeys: ['comfort', 'tease', 'confront', 'protect'],

        exists: function (x) { return x != null && x !== ''; },

        // Format appearance string
        formatAppearance: function (a) {
            const ap = a.appearance || {};
            const bits = [];
            if (Seeder.exists(ap.hair)) bits.push('hair: ' + ap.hair);
            if (Seeder.exists(ap.eyes)) bits.push('eyes: ' + ap.eyes);
            if (Seeder.exists(ap.build)) bits.push('build: ' + ap.build);

            const ad = ap.appendages || {};
            const parts = [];
            ['ears', 'tail', 'wings', 'horns'].forEach(p => {
                if (ad[p] && ad[p].present) parts.push(p + ':' + (ad[p].style || ''));
            });

            if (parts.length) bits.push(parts.join(', '));
            if (Seeder.exists(ap.description)) bits.push(ap.description);

            return bits.join(' • ');
        },

        // Build cue content from the cue object (basic + body parts)
        buildCueContent: function (cue) {
            if (!cue) return null;
            const parts = [];
            if (Seeder.exists(cue.basic)) parts.push(cue.basic);
            if (Seeder.exists(cue.ears)) parts.push('ears: ' + cue.ears);
            if (Seeder.exists(cue.tail)) parts.push('tail: ' + cue.tail);
            if (Seeder.exists(cue.wings)) parts.push('wings: ' + cue.wings);
            if (Seeder.exists(cue.horns)) parts.push('horns: ' + cue.horns);
            return parts.length > 0 ? parts.join(' • ') : null;
        },

        upsertEntry: function (entries, key, content, actorId, emotionTag, cueType) {
            // key: {actor, state, type}
            // emotionTag: uppercase tag for gating (e.g., 'JOY', 'EROS_INTIMACY')
            // cueType: 'base', 'pulse', 'eros', or 'intent'
            const id = cueType + '_' + key.state + '_' + key.actor;
            const safeId = id.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

            // Build emotion gates based on cue type
            const emotionGates = { andAny: [] };
            if (emotionTag) {
                emotionGates.andAny = [emotionTag];
            }

            if (entries[safeId]) {
                entries[safeId].content = content;
                entries[safeId].updated = true;
                entries[safeId].actorId = actorId;
                entries[safeId].emotionGates = emotionGates;
                entries[safeId].cueType = cueType;
            } else {
                entries[safeId] = {
                    id: safeId,
                    title: `${key.actor} [${cueType.toUpperCase()}: ${key.state}]`,
                    content: content,
                    generated: true,
                    actorId: actorId,
                    enabled: true,
                    cueType: cueType,
                    emotionGates: emotionGates
                };
            }
            return safeId;
        },

        generate: function (state) {
            // Ensure correct data structures
            if (!state.nodes) state.nodes = {};
            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            if (!state.nodes.actors.items) state.nodes.actors.items = {};
            if (!state.aura) state.aura = {};
            if (!state.aura.microcues) state.aura.microcues = { items: {} };
            if (!state.aura.microcues.items) state.aura.microcues.items = {};

            const actors = state.nodes.actors.items;
            const entries = state.aura.microcues.items;
            const validActorIds = new Set(Object.keys(actors));

            // Track active IDs generated in this pass
            const activeEntryIds = new Set();

            // Generate/update entries for existing actors
            Object.values(actors).forEach(actor => {
                const actorKey = actor.name || actor.id;
                const actorId = actor.id;
                const traits = actor.traits || {};

                // 0. Base Cues (Appearance & Voice) - Always present
                const appText = Seeder.formatAppearance(traits);
                if (appText) {
                    const id = Seeder.upsertEntry(entries, { actor: actorKey, state: 'Appearance' }, appText, actorId, null, 'base');
                    activeEntryIds.add(id);
                }

                const sp = traits.speech || {};
                const voiceParts = [];
                if (Seeder.exists(sp.tone)) voiceParts.push('tone: ' + sp.tone);
                if (Seeder.exists(sp.pacing)) voiceParts.push('pacing: ' + sp.pacing);
                if (Seeder.exists(sp.verbosity)) voiceParts.push('verbosity: ' + sp.verbosity);
                if (Seeder.exists(sp.diction)) voiceParts.push('diction: ' + sp.diction);
                if (voiceParts.length) {
                    const id = Seeder.upsertEntry(entries, { actor: actorKey, state: 'Voice' }, voiceParts.join(' • '), actorId, null, 'base');
                    activeEntryIds.add(id);
                }

                // 1. PULSE Cues (emotion-based)
                const pulseCues = traits.pulseCues || {};
                Object.entries(pulseCues).forEach(([emotion, cue]) => {
                    const content = Seeder.buildCueContent(cue);
                    if (content) {
                        const emotionTag = emotion.toUpperCase(); // 'joy' -> 'JOY'
                        const id = Seeder.upsertEntry(entries, { actor: actorKey, state: emotion }, content, actorId, emotionTag, 'pulse');
                        activeEntryIds.add(id);
                    }
                });

                // 2. EROS Cues (intimacy-based)
                const erosCues = traits.erosCues || {};
                Object.entries(erosCues).forEach(([level, cue]) => {
                    const content = Seeder.buildCueContent(cue);
                    if (content) {
                        const erosTag = 'EROS_' + level.toUpperCase(); // 'intimacy' -> 'EROS_INTIMACY'
                        const id = Seeder.upsertEntry(entries, { actor: actorKey, state: level }, content, actorId, erosTag, 'eros');
                        activeEntryIds.add(id);
                    }
                });

                // 3. INTENT Cues (behavior-based)
                const intentCues = traits.intentCues || {};
                Object.entries(intentCues).forEach(([intent, cue]) => {
                    const content = Seeder.buildCueContent(cue);
                    if (content) {
                        const intentTag = 'INTENT_' + intent.toUpperCase(); // 'comfort' -> 'INTENT_COMFORT'
                        const id = Seeder.upsertEntry(entries, { actor: actorKey, state: intent }, content, actorId, intentTag, 'intent');
                        activeEntryIds.add(id);
                    }
                });
            });

            // Prune stale entries (entries that appear to be generated but weren't regenerated this pass)
            // Also prune entries belonging to deleted actors (though the logic above implies implicitly they won't be in activeEntryIds)
            Object.keys(entries).forEach(entryId => {
                const entry = entries[entryId];
                // Only prune entries that are marked as generated. User manual entries (if any supported) should stay?
                // For now, assuming all microcues are generated.
                if (entry.generated && !activeEntryIds.has(entryId)) {
                    delete entries[entryId];
                }
            });

            return Object.keys(entries).length;
        }
    };

    // --- Script Generation ---
    function generateScript(items) {
        const entryList = Object.values(items || {});
        if (!entryList.length) {
            return `console.warn("MicroCues: No entries generated. Add PULSE/EROS/INTENT cues in Actors panel.");`;
        }

        let s = '/* === MICROCUES (Generated from Actor Cues) ========================= */\n\n';
        s += 'var MICROCUES_CFG = {\n';
        s += '  enabled: true,\n';
        s += '  entries: [\n';

        s += entryList.map(e => {
            const emotionAndAny = JSON.stringify(e.emotionGates?.andAny || []);
            // Only include basic fields needed for runtime
            // Using minimal property set to keep script clean
            return `    {
      id: ${JSON.stringify(e.id)},
      title: ${JSON.stringify(e.title)},
      content: ${JSON.stringify(e.content)},
      cueType: ${JSON.stringify(e.cueType || 'pulse')},
      emotionGates: { andAny: ${emotionAndAny} }
    }`;
        }).join(',\n');

        s += '\n  ]\n};\n\n';

        // Gate-based runtime logic - emotion gates only
        s += `(function(){
  if (!MICROCUES_CFG || !MICROCUES_CFG.enabled) return;
  if (!context) return;
  
  // Get current emotion state from PULSE/EROS/INTENT signals
  var currentEmotion = (context.emotions && context.emotions.current) ? context.emotions.current.toUpperCase() : 'NEUTRAL';
  var activeTags = context.activeTags || [];
  
  console.log("MicroCues: Scanning " + MICROCUES_CFG.entries.length + " cues against signals");

  MICROCUES_CFG.entries.forEach(function(entry){
    // Emotion Gate: Check if any required tag matches
    var reqEmotions = entry.emotionGates.andAny || [];
    if (reqEmotions.length > 0) {
      // Check against currentEmotion OR activeTags
      var emotionMatch = reqEmotions.some(function(tag){ 
        return tag === currentEmotion || activeTags.indexOf(tag) !== -1;
      });
      if (!emotionMatch) return;
    }
    
    // Gate passed - inject content
    if (context.character && typeof context.character.personality === 'string') {
      context.character.personality += ' ' + entry.content;
      console.info("MicroCues: Injected [" + entry.title + "]");
    }
  });
})();`;

        return s;
    }


    // --- UI ---
    function render(container) {
        const state = A.State.get();

        // Schema Check
        if (state && !state.aura) state.aura = {};
        if (state && !state.aura.microcues) state.aura.microcues = { items: {} };

        // Layout
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = 'var(--space-4)';

        // Header
        const header = document.createElement('div');
        header.className = 'card';
        header.style.marginBottom = '0';
        header.innerHTML = `
      <div class="card-header">
        <strong>MicroCue Generator</strong>
        <span id="cue-count" style="font-size:11px; color:var(--text-muted);"></span>
      </div>
      <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:12px; color:var(--text-muted);">
          Auto-generated from Actor PULSE/EROS/INTENT cues. Updates when actors change.
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost btn-sm" id="btn-view-script" style="font-size:10px;">View Script →</button>
        </div>
      </div>
    `;

        // List
        const listCard = document.createElement('div');
        listCard.className = 'card';
        listCard.style.flex = '1';
        listCard.style.marginBottom = '0';
        listCard.style.display = 'flex';
        listCard.style.flexDirection = 'column';
        listCard.style.overflow = 'hidden';

        listCard.innerHTML = `
      <div class="card-header">
        <strong>Active Cues</strong>
      </div>
      <div class="card-body" id="cue-list" style="padding:0; flex:1; overflow-y:auto; background:var(--bg-elevated);"></div>
    `;

        container.appendChild(header);
        container.appendChild(listCard);

        // Logic
        const listBody = listCard.querySelector('#cue-list');
        const countSpan = header.querySelector('#cue-count');

        function refreshList() {
            const currentState = A.State.get();
            if (!currentState) return;

            // Ensure schema
            if (!currentState.aura) currentState.aura = {};
            if (!currentState.aura.microcues) currentState.aura.microcues = { items: {} };

            const items = Object.values(currentState.aura.microcues.items);

            // Update count
            countSpan.textContent = items.length > 0 ? `(${items.length} cues)` : '';

            listBody.innerHTML = '';
            if (items.length === 0) {
                listBody.innerHTML = A.UI.getEmptyStateHTML(
                    'No MicroCues Generated',
                    'MicroCues are automatically generated from your Actors\' PULSE, EROS, and INTENT cues.<br>Add cues in the <strong>Actors</strong> panel to see them appear here.',
                    'Go to Actors',
                    "Anansi.UI.switchPanel('actors')"
                );
                return;
            }

            // 1. Group by Actor Name (using title prefix or actorId)
            // Ideally we use actor name. We can traverse actors again or rely on title parsing.
            // But we have actorId in the entry structure now (upsertEntry added it).
            const actors = currentState.nodes?.actors?.items || {};
            const byActor = {};

            items.forEach(item => {
                const actorId = item.actorId;
                // Fallback name if actor deleted but cue remains (though pruner removes them)
                const actorName = actors[actorId]?.name || 'Unknown Actor';
                if (!byActor[actorName]) byActor[actorName] = [];
                byActor[actorName].push(item);
            });

            // 2. Render each Actor Group
            Object.keys(byActor).sort().forEach(actorName => {
                const actorItems = byActor[actorName];

                // Top-Level Actor Section (Default Open)
                const actorSection = document.createElement('details');
                actorSection.open = true;
                actorSection.style.marginBottom = '2px';
                actorSection.style.border = '1px solid var(--border-subtle)';
                actorSection.style.borderRadius = '4px';
                actorSection.style.overflow = 'hidden';

                const actorSummary = document.createElement('summary');
                actorSummary.style.cssText = 'padding:10px 12px; font-weight:bold; cursor:pointer; background:var(--bg-elevated); color:var(--text-primary); outline:none; font-size:13px;';
                actorSummary.textContent = `${actorName} (${actorItems.length})`;
                actorSection.appendChild(actorSummary);

                const actorContent = document.createElement('div');
                actorContent.style.background = 'var(--bg-base)';

                // 3. Group by Type within Actor
                const grouped = { base: [], pulse: [], eros: [], intent: [] };
                actorItems.forEach(item => {
                    const type = item.cueType || 'base';
                    if (!grouped[type]) grouped[type] = [];
                    grouped[type].push(item);
                });

                const typeLabels = { base: '👤 BASE', pulse: '🎭 PULSE', eros: '💋 EROS', intent: '🎯 INTENT' };
                const typeColors = { base: 'var(--text-muted)', pulse: 'var(--accent-primary)', eros: 'var(--status-warning)', intent: 'var(--status-info)' };

                Object.entries(grouped).forEach(([type, typeItems]) => {
                    if (typeItems.length === 0) return;

                    // Inner Type Section
                    const typeSection = document.createElement('details');
                    // Base cues expanded by default, others collapsed
                    if (type === 'base') typeSection.open = true;

                    typeSection.style.borderTop = '1px solid var(--border-subtle)';

                    const typeSummary = document.createElement('summary');
                    typeSummary.style.cssText = 'padding:8px 12px 8px 24px; font-size:11px; font-weight:bold; cursor:pointer; color:' + typeColors[type] + ';';
                    // Indented summary
                    typeSummary.textContent = typeLabels[type] + ` (${typeItems.length})`;
                    typeSection.appendChild(typeSummary);

                    const typeContent = document.createElement('div');

                    typeItems.forEach(item => {
                        const row = document.createElement('div');
                        row.style.padding = '6px 12px 6px 32px'; // Extra indent for rows
                        row.style.borderTop = '1px solid var(--border-subtle)'; // Separator between rows
                        row.style.fontSize = '12px';

                        // Build gate info display
                        const emotions = item.emotionGates?.andAny || [];
                        const emotionPills = emotions.map(e =>
                            `<span style="background:var(--accent-soft); color:${typeColors[type]}; padding:1px 6px; border-radius:3px; font-size:9px; margin-right:4px;">${e}</span>`
                        ).join('');

                        // Clean title - remove actor prefix if redundant? title is "Actor [TYPE: State]"
                        // Let's show just the state part if possible, or keep full title for clarity
                        // Actually the title `Actor [TYPE: State]` is a bit redundant inside Actor group.
                        // Let's extract just the relevant part if we can, or just show title.
                        // Title format: `${key.actor} [${cueType.toUpperCase()}: ${key.state}]`
                        // Let's just show the item.content primarily? No, title is useful.
                        // Let's just use item.title for now.

                        row.innerHTML = `
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                            <span style="font-weight:bold; color:var(--text-primary); font-size:11px;">${item.title.split('[')[1]?.replace(']', '') || item.title}</span>
                            <span>${emotionPills}</span>
                          </div>
                          <div style="color:var(--text-secondary); font-family:var(--font-mono); font-size:11px;">${item.content}</div>
                        `;
                        typeContent.appendChild(row);
                    });

                    typeSection.appendChild(typeContent);
                    actorContent.appendChild(typeSection);
                });

                actorSection.appendChild(actorContent);
                listBody.appendChild(actorSection);
            });
        }

        // DEPRECATED: syncScript - Content now exports via AuraBuilder merge
        function syncScript() {
            // No-op: MicroCues content merges into AURA.js on export
        }

        // Full sync: regenerate from actors, update script, refresh UI
        function fullSync() {
            const currentState = A.State.get();
            if (!currentState) return;
            Seeder.generate(currentState);
            syncScript();
            refreshList();
        }

        // Bind Buttons
        header.querySelector('#btn-view-script').onclick = () => {
            syncScript();
            if (A.UI && A.UI.switchPanel) {
                A.UI.switchPanel('scripts', { selectScript: 'gen_microcues' });
            }
        };

        // Subscribe to state changes for auto-sync
        A.State.subscribe(() => {
            fullSync();
        });

        // Initial sync
        fullSync();
    }

    A.registerPanel('microcues', {
        label: 'MicroCues',
        subtitle: 'Narrative Threads',
        category: 'Weave',
        render: render
    });

})(window.Anansi);
