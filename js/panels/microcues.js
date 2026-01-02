/*
 * Anansi Panel: MicroCue Lorebook
 * File: js/panels/microcues.js
 * Category: Weave
 * Logic: Generates narrative cues from Actor Traits.
 * Updated: Supports new 'cues_body_parts' schema.
 */

(function (A) {
    'use strict';

    // --- Seeder Logic ---
    const Seeder = {
        keys: ['joy', 'sadness', 'anger', 'fear', 'trust', 'disgust', 'anticipation', 'surprise'],

        exists: function (x) { return x != null && x !== ''; },

        formatAppearance: function (a) {
            const ap = a.appearance || {};
            const bits = [];
            if (Seeder.exists(ap.hair)) bits.push('hair: ' + ap.hair);
            if (Seeder.exists(ap.eyes)) bits.push('eyes: ' + ap.eyes);
            if (Seeder.exists(ap.build)) bits.push('build: ' + ap.build);

            const ad = ap.appendages || {};
            const parts = [];
            if (ad.ears && ad.ears.present) parts.push('ears:' + (ad.ears.style || ''));
            if (ad.tail && ad.tail.present) parts.push('tail:' + (ad.tail.style || ''));
            if (ad.wings && ad.wings.present) parts.push('wings:' + (ad.wings.style || ''));
            if (ad.horns && ad.horns.present) parts.push('horns:' + (ad.horns.style || ''));

            if (parts.length) bits.push(parts.join(', '));

            // Include description if present
            if (Seeder.exists(ap.description)) bits.push(ap.description);

            return bits.join(' • ');
        },

        upsertEntry: function (entries, key, content, actorId, emotionTag) {
            // key: {actor, state, facet}
            // emotionTag: uppercase emotion tag for emotion-gated entries (e.g., 'JOY', 'ANGER')
            const id = key.state + '_' + key.facet + '_' + key.actor;
            const safeId = id.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

            // Build gate structures
            const entityGates = { restrictToActors: [actorId] };
            const emotionGates = { andAny: [], andAll: [], notAny: [], notAll: [] };

            // If this is an emotion-gated entry, set the emotion gate
            if (emotionTag) {
                emotionGates.andAny = [emotionTag];
            }

            if (entries[safeId]) {
                // Update existing entry
                entries[safeId].content = content;
                entries[safeId].updated = true;
                entries[safeId].actorId = actorId;
                entries[safeId].entityGates = entityGates;
                entries[safeId].emotionGates = emotionGates;
            } else {
                // Create new entry with Lorebook-compatible structure
                entries[safeId] = {
                    id: safeId,
                    title: `${key.actor} [${key.state}${key.facet !== 'Emotions' ? ' - ' + key.facet : ''}]`,
                    keywords: [], // No keyword triggering - use gates instead
                    content: content,
                    generated: true,
                    actorId: actorId,
                    enabled: true,
                    priority: 50,
                    probability: 100,
                    // Gate structures (Lorebook parity)
                    entityGates: entityGates,
                    emotionGates: emotionGates,
                    intentGates: { allowedIntents: [] },
                    erosGates: { currentVibe: { min: null, max: null }, longTermMin: null },
                    // Standard Lorebook fields
                    requireTags: [],
                    blocksTags: [],
                    tags: []
                };
            }
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

            // Remove entries for deleted actors
            Object.keys(entries).forEach(entryId => {
                const entry = entries[entryId];
                if (entry.actorId && !validActorIds.has(entry.actorId)) {
                    delete entries[entryId];
                }
            });

            // Generate/update entries for existing actors
            Object.values(actors).forEach(actor => {
                const traits = actor.traits || {};
                const actorKey = actor.name || actor.id;
                const actorId = actor.id;

                // 1. Base Descriptors (no emotion gate - always present when actor is present)
                const appText = Seeder.formatAppearance(traits);
                if (appText) {
                    Seeder.upsertEntry(entries, { actor: actorKey, state: 'Base', facet: 'Appearance' }, appText, actorId, null);
                }

                // Voice (no emotion gate)
                const sp = traits.speech || {};
                const voiceParts = [];
                if (Seeder.exists(sp.tone)) voiceParts.push('tone: ' + sp.tone);
                if (Seeder.exists(sp.pacing)) voiceParts.push('pacing: ' + sp.pacing);
                if (Seeder.exists(sp.verbosity)) voiceParts.push('verbosity: ' + sp.verbosity);
                if (Seeder.exists(sp.diction)) voiceParts.push('diction: ' + sp.diction);

                if (voiceParts.length) {
                    Seeder.upsertEntry(entries, { actor: actorKey, state: 'Base', facet: 'Voice' }, voiceParts.join(' • '), actorId, null);
                }

                // 2. Emotion Cues (with emotion gate - uppercase tag)
                Seeder.keys.forEach(emo => {
                    const emotionTag = emo.toUpperCase(); // e.g., 'joy' -> 'JOY'

                    // Standard Cues
                    if (traits.cues && traits.cues[emo]) {
                        Seeder.upsertEntry(entries, { actor: actorKey, state: emo, facet: 'Emotions' }, traits.cues[emo], actorId, emotionTag);
                    }

                    // Body Parts Cues (New Schema)
                    const parts = traits.cues_body_parts && traits.cues_body_parts[emo];
                    if (parts) {
                        const app = traits.appearance || {};
                        const ad = app.appendages || {};

                        if (ad.wings && ad.wings.present && parts.wings) {
                            Seeder.upsertEntry(entries, { actor: actorKey, state: emo, facet: 'Wings' }, parts.wings, actorId, emotionTag);
                        }
                        if (ad.tail && ad.tail.present && parts.tail) {
                            Seeder.upsertEntry(entries, { actor: actorKey, state: emo, facet: 'Tail' }, parts.tail, actorId, emotionTag);
                        }
                        if (ad.ears && ad.ears.present && parts.ears) {
                            Seeder.upsertEntry(entries, { actor: actorKey, state: emo, facet: 'Ears' }, parts.ears, actorId, emotionTag);
                        }
                        if (ad.horns && ad.horns.present && parts.horns) {
                            Seeder.upsertEntry(entries, { actor: actorKey, state: emo, facet: 'Horns' }, parts.horns, actorId, emotionTag);
                        }
                    }
                });
            });

            return Object.keys(entries).length;
        }
    };

    // --- Script Generation ---
    function generateScript(items) {
        const entryList = Object.values(items || {});
        if (!entryList.length) {
            return `console.warn("MicroCues: No entries generated. Add Actors with Traits/Voices to populate.");`;
        }

        let s = '/* === MICROCUES (Generated) =========================================== */\n\n';
        s += 'var MICROCUES_CFG = {\n';
        s += '  enabled: true,\n';
        s += '  entries: [\n';

        s += entryList.map(e => {
            const restrictActors = JSON.stringify(e.entityGates?.restrictToActors || []);
            const emotionAndAny = JSON.stringify(e.emotionGates?.andAny || []);
            return `    {
      id: ${JSON.stringify(e.id)},
      title: ${JSON.stringify(e.title)},
      content: ${JSON.stringify(e.content)},
      entityGates: { restrictToActors: ${restrictActors} },
      emotionGates: { andAny: ${emotionAndAny} }
    }`;
        }).join(',\n');

        s += '\n  ]\n};\n\n';

        // Gate-based runtime logic
        s += `(function(){
  if (!MICROCUES_CFG || !MICROCUES_CFG.enabled) return;
  if (!context) return;
  
  // Get active actor IDs and current emotion from context
  var activeActors = context.activeActors || [];
  var currentEmotion = (context.emotions && context.emotions.current) ? context.emotions.current.toUpperCase() : 'NEUTRAL';
  
  console.log("MicroCues: Scanning " + MICROCUES_CFG.entries.length + " cues against Emotion [" + currentEmotion + "]");

  MICROCUES_CFG.entries.forEach(function(entry){
    // Entity Gate: Check if required actor is present
    var reqActors = entry.entityGates.restrictToActors || [];
    if (reqActors.length > 0) {
      var actorPresent = reqActors.some(function(id){ return activeActors.indexOf(id) !== -1; });
      if (!actorPresent) return; // Actor not present, skip
    }
    
    // Emotion Gate: Check if any required emotion matches current
    var reqEmotions = entry.emotionGates.andAny || [];
    if (reqEmotions.length > 0) {
      var emotionMatch = reqEmotions.some(function(emo){ return emo === currentEmotion; });
      if (!emotionMatch) return; // Emotion not matched, skip
    }
    
    // ALL gates passed - inject content
    if (context.character && typeof context.character.personality === 'string') {
      context.character.personality += ' ' + entry.content;
      console.info("MicroCues: Injected [" + entry.title + "]");
    } else {
      console.warn("MicroCues: Targeted context.character.personality but it was missing.");
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
          Auto-generated from Actor Traits. Updates automatically when actors change.
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
                listBody.innerHTML = '<div style="padding:20px; text-align:center; color:gray;">No cues generated.<br>Add Actor Traits (Appearance, Speech, Cues) to generate entries.</div>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('div');
                row.style.padding = '8px 12px';
                row.style.borderBottom = '1px solid var(--border-subtle)';
                row.style.fontSize = '12px';

                // Build gate info display
                const emotions = item.emotionGates?.andAny || [];
                const emotionPills = emotions.map(e =>
                    `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:1px 6px; border-radius:3px; font-size:9px; margin-right:4px;">🎭 ${e}</span>`
                ).join('');

                const hasEntityGate = (item.entityGates?.restrictToActors || []).length > 0;
                const entityPill = hasEntityGate
                    ? `<span style="background:var(--bg-surface); color:var(--text-muted); padding:1px 6px; border-radius:3px; font-size:9px;">👤 Actor</span>`
                    : '';

                row.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span style="font-weight:bold; color:var(--accent-primary);">${item.title}</span>
            <span>${emotionPills}${entityPill}</span>
          </div>
          <div style="color:var(--text-primary); font-family:var(--font-mono); font-size:11px;">${item.content}</div>
        `;
                listBody.appendChild(row);
            });
        }

        // Sync generated script to Scripts panel
        function syncScript() {
            const currentState = A.State.get();
            if (!currentState || !currentState.aura || !currentState.aura.microcues) return;
            const code = generateScript(currentState.aura.microcues.items);
            A.Scripts.syncManaged('gen_microcues', 'GENERATED: MicroCues', code);
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
