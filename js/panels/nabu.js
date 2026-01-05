/*
 * Anansi Panel: Temple of Nabu - AI Rule Generator
 * File: js/panels/nabu.js
 * Category: Sacred Tools
 * Description: AI-powered rule generator supporting Lorebook, Actor, Relationship, Voice, and Event.
 */

(function (A) {
  'use strict';

  // --- Constants ---
  const RULE_TYPES = {
    lorebook: { label: 'Lorebook Entry', icon: '📜', desc: 'World knowledge, factions, lore' },
    actor: { label: 'Actor (Character)', icon: '🎭', desc: 'Character details and personality' },
    pair: { label: 'Relationship Pair', icon: '💫', desc: 'How two actors interact' },
    voice: { label: 'Voice Rail', icon: '🎙️', desc: 'Speech patterns and tone' },
    event: { label: 'Logic Event', icon: '⚡', desc: 'Triggered actions and effects' }
  };

  const CATEGORIES = ['character', 'faction', 'item', 'theme', 'location', 'custom', 'uncategorized'];
  const AURA_FLAGS = {
    PULSE: ['joy', 'sadness', 'anger', 'fear', 'romance', 'neutral'],
    EROS: ['platonic', 'tension', 'romance', 'passion', 'explicit'],
    INTENT: ['question', 'disclosure', 'command', 'promise', 'conflict', 'narrative']
  };

  // --- LLM Prompts per Rule Type ---
  const PROMPTS = {
    lorebook: (req, opts) => `You are Nabu, the Scribe. Create a Lorebook entry:
REQUEST: ${req}
${opts.actor ? `Associated Actor: ${opts.actor.name}` : ''}

Respond with JSON only:
{"title": "...", "keywords": ["word1","word2","word3"], "category": "${CATEGORIES.join('/')}", "content": "2-3 paragraphs using {{char}} and {{user}}", "priority": 50}`,

    actor: (req, opts) => `You are Nabu, the Scribe. Create a complete Character Actor:
REQUEST: ${req}

Respond with JSON only. Ensure rigorous detail.
{
  "name": "Character Name",
  "role": "main/supporting/minor",
  "gender": "M/F/N",
  "aliases": ["Alias1", "Title"],
  "tags": ["tag1", "tag2"],
  "cardFields": {
    "personality": "Comprehensive personality traits, demeanor, and quirks...",
    "description": "Full physical, mental, and outfit description...",
    "scenario": "Current setting and context...",
    "firstMessage": "Opening chat message..."
  },
  "appearance": {
    "hair": "color/style", "eyes": "color/shape", "build": "body type", 
    "description": "Additional visual details",
    "appendages": { 
        "ears": {"present": false, "style": "ONLY set true for non-human ears (elf, cat, etc)"}, 
        "tail": {"present": false, "style": "ONLY set true if present"}, 
        "wings": {"present": false, "style": "ONLY set true if present"}, 
        "horns": {"present": false, "style": "ONLY set true if present"} 
    }
  }
}`,

    pair: (req, opts) => `You are Nabu, the Scribe. Create a Relationship Pair definition:
REQUEST: ${req}
${opts.actors?.length ? `Available Actors: ${opts.actors.map(a => a.name).join(', ')}` : ''}

Describe how two characters relate. Respond with JSON only:
{"actor1Name": "First Character", "actor2Name": "Second Character", "type": "Rivals/Lovers/Friends/Enemies/Siblings/etc", "content": "2-3 paragraphs describing their dynamic, history, and how they interact when together"}`,

    voice: (req, opts) => `You are Nabu, the Scribe. Create a Voice Rail for speech patterns:
REQUEST: ${req}
${opts.actor ? `For Actor: ${opts.actor.name}` : ''}

Respond with JSON only:
{"characterName": "Name", "baselineRail": "Core voice description - how they typically speak", "cadenceRail": "Rhythm and pacing patterns", "subtones": [{"label": "Mood Name", "weight": 50, "rail": "How voice changes in this mood"}]}`,

    event: (req, opts) => `You are Nabu, the Scribe. Create a Logic Event:
REQUEST: ${req}

Respond with JSON only:
{"label": "Event Name", "probability": 100, "condition": "keyword or situation that triggers this", "effect": "What happens when triggered - narrative or mechanical effect"}`
  };

  // --- Render Function ---
  function render(container) {
    container.style.height = '100%';
    container.style.overflow = 'hidden';

    const state = A.State.get();
    const actors = Object.values(state.nodes?.actors?.items || {});

    // Local state
    let selectedType = 'lorebook';
    let selectedActorId = '';
    let selectedPulse = [];
    let selectedEros = [];
    let selectedIntent = [];

    container.innerHTML = `
      <div class="nabu-layout" style="
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: var(--space-4);
        height: 100%;
        padding: var(--space-4);
      ">
        <!-- Left: Visual & Options -->
        <div class="nabu-left" style="
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          overflow-y: auto;
        ">
          <!-- Tablet Visual -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: var(--space-3);
            background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(139, 90, 43, 0.08) 100%);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-subtle);
            position: relative;
          ">
            <div style="
              position: absolute;
              width: 100px;
              height: 120px;
              background: radial-gradient(ellipse, rgba(205, 133, 63, 0.25) 0%, transparent 70%);
              border-radius: 30%;
              top: 8px;
              animation: tablet-pulse 4s ease-in-out infinite;
            "></div>
            
            <div style="
              width: 80px;
              height: 100px;
              background: linear-gradient(145deg, #8B7355 0%, #6B5344 50%, #5a4636 100%);
              border-radius: 8px 8px 12px 12px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 1;
            ">
              <div id="cuneiform-display" style="font-size: 16px; color: rgba(50, 35, 25, 0.8);">𒀭𒈾𒁍</div>
            </div>
            
            <h3 style="margin: 8px 0 2px 0; font-size: 12px; font-weight: 300; letter-spacing: 1px; text-transform: uppercase; position: relative; z-index: 1;">Temple of Nabu</h3>
          </div>
          
          <!-- Rule Type Selector -->
          <div style="
            background: var(--bg-surface);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
            padding: var(--space-3);
          ">
            <label style="font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 6px;">Rule Type</label>
            <select id="sel-type" class="input" style="width: 100%; font-size: 12px;">
              ${Object.entries(RULE_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
            </select>
            <div id="type-desc" style="font-size: 10px; color: var(--text-muted); margin-top: 4px; font-style: italic;">${RULE_TYPES.lorebook.desc}</div>
          </div>
          
          <!-- Actor Selection (conditional) -->
          <div id="actor-section" style="
            background: var(--bg-surface);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
            padding: var(--space-3);
          ">
            <label style="font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 6px;">Associate with Actor</label>
            <select id="sel-actor" class="input" style="width: 100%; font-size: 11px;">
              <option value="">None</option>
              ${actors.map(a => `<option value="${a.id}">${a.name || 'Unnamed'}</option>`).join('')}
            </select>
          </div>
          
          <!-- AURA Tags (for Lorebook) -->
          <div id="aura-section" style="
            background: var(--bg-surface);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
            padding: var(--space-3);
            flex: 1;
          ">
            <div style="font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">AURA Tags</div>
            
            <div style="margin-bottom: 8px;">
              <label style="font-size: 9px; color: var(--accent-primary); display: block; margin-bottom: 3px;">PULSE</label>
              <div id="pulse-tags" style="display: flex; flex-wrap: wrap; gap: 3px;">
                ${AURA_FLAGS.PULSE.map(tag => `<button class="aura-tag-btn" data-type="pulse" data-tag="${tag}">${tag}</button>`).join('')}
              </div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <label style="font-size: 9px; color: #e57373; display: block; margin-bottom: 3px;">EROS</label>
              <div id="eros-tags" style="display: flex; flex-wrap: wrap; gap: 3px;">
                ${AURA_FLAGS.EROS.map(tag => `<button class="aura-tag-btn" data-type="eros" data-tag="${tag}">${tag}</button>`).join('')}
              </div>
            </div>
            
            <div>
              <label style="font-size: 9px; color: #81c784; display: block; margin-bottom: 3px;">INTENT</label>
              <div id="intent-tags" style="display: flex; flex-wrap: wrap; gap: 3px;">
                ${AURA_FLAGS.INTENT.map(tag => `<button class="aura-tag-btn" data-type="intent" data-tag="${tag}">${tag}</button>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Input & Preview -->
        <div class="nabu-right" style="
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          min-height: 0;
        ">
          <!-- Input Section -->
          <div style="
            background: var(--bg-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-subtle);
            padding: var(--space-4);
          ">
            <label style="font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">
              <span id="input-label">Describe Your Lorebook Entry</span>
            </label>
            <textarea id="nabu-request" class="input" style="
              width: 100%;
              height: 100px;
              resize: vertical;
              font-size: 13px;
              line-height: 1.5;
            " placeholder="Describe what you want to create..."></textarea>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
              <button id="btn-invoke" class="btn btn-primary" style="
                background: linear-gradient(135deg, #CD853F 0%, #8B6914 100%);
                border: none;
                padding: 10px 24px;
                font-weight: 600;
              ">🏛️ Invoke the Scribe</button>
            </div>
          </div>
          
          <!-- Preview Section -->
          <div id="nabu-preview" style="
            flex: 1;
            min-height: 200px;
            background: var(--bg-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-subtle);
            overflow-y: auto;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="text-align: center; color: var(--text-muted); opacity: 0.4;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px;">
                <rect x="3" y="2" width="18" height="20" rx="2"/>
                <path d="M7 7h10M7 11h8M7 15h6M7 19h4"/>
              </svg>
              <p style="font-size: 12px; margin: 0;">Your inscription will appear here...</p>
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes tablet-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.03); }
        }
        @keyframes inscribing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .aura-tag-btn {
          font-size: 9px;
          padding: 3px 7px;
          border-radius: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .aura-tag-btn:hover { border-color: var(--accent-primary); color: var(--text-primary); }
        .aura-tag-btn.selected { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
      </style>
    `;

    // --- Wire Event Handlers ---
    const typeSelect = container.querySelector('#sel-type');
    const typeDesc = container.querySelector('#type-desc');
    const inputLabel = container.querySelector('#input-label');
    const actorSection = container.querySelector('#actor-section');
    const auraSection = container.querySelector('#aura-section');
    const requestInput = container.querySelector('#nabu-request');

    // Update UI based on rule type
    const updateTypeUI = () => {
      const type = RULE_TYPES[selectedType];
      typeDesc.textContent = type.desc;
      inputLabel.textContent = `Describe Your ${type.label}`;

      // Show/hide sections based on type
      actorSection.style.display = ['lorebook', 'voice'].includes(selectedType) ? 'block' : 'none';
      auraSection.style.display = selectedType === 'lorebook' ? 'block' : 'none';

      // Update placeholder
      const placeholders = {
        lorebook: 'A secret society called the Crimson Hand that operates in shadows...',
        actor: 'A mysterious witch who lives in the forest, feared but secretly kind...',
        pair: 'Two rival mages who were once best friends but had a falling out...',
        voice: 'A gruff warrior who speaks in short, direct sentences...',
        event: 'When the player mentions magic, reveal a hidden prophecy...'
      };
      requestInput.placeholder = placeholders[selectedType] || 'Describe what you want...';
    };

    typeSelect.onchange = (e) => {
      selectedType = e.target.value;
      updateTypeUI();
    };

    // AURA Tag Toggle
    container.querySelectorAll('.aura-tag-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.type;
        const tag = btn.dataset.tag;
        const list = type === 'pulse' ? selectedPulse : type === 'eros' ? selectedEros : selectedIntent;

        const idx = list.indexOf(tag);
        if (idx === -1) {
          list.push(tag);
          btn.classList.add('selected');
        } else {
          list.splice(idx, 1);
          btn.classList.remove('selected');
        }
      };
    });

    // Actor Selection
    container.querySelector('#sel-actor').onchange = (e) => {
      selectedActorId = e.target.value;
    };

    // Invoke Button
    container.querySelector('#btn-invoke').onclick = async () => {
      const request = requestInput.value.trim();
      if (!request) {
        if (A.UI?.Toast) A.UI.Toast.show('Please describe what you want to create', 'warning');
        return;
      }

      const previewDiv = container.querySelector('#nabu-preview');
      const invokeBtn = container.querySelector('#btn-invoke');
      const cuneiformDisplay = container.querySelector('#cuneiform-display');

      const selectedActor = selectedActorId ? actors.find(a => a.id === selectedActorId) : null;

      // Build prompt for selected type
      const promptFn = PROMPTS[selectedType];
      const systemPrompt = promptFn(request, {
        actor: selectedActor,
        actors: actors,
        pulse: selectedPulse,
        eros: selectedEros,
        intent: selectedIntent
      });

      // Show loading state
      invokeBtn.disabled = true;
      invokeBtn.innerHTML = '✨ Inscribing...';
      cuneiformDisplay.style.animation = 'inscribing 1s ease-in-out infinite';

      previewDiv.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary);">
          <div style="font-size: 32px; animation: inscribing 1s ease-in-out infinite;">𒁹𒀭𒈾</div>
          <p style="font-size: 12px; margin-top: 12px;">The Scribe is writing...</p>
        </div>
      `;

      try {
        const response = await A.LLM.generate(systemPrompt, [{ role: 'user', content: request }]);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No valid JSON in response');

        const entry = JSON.parse(jsonMatch[0]);
        renderPreview(previewDiv, entry, selectedActor);

      } catch (err) {
        console.error('[Nabu] Generation error:', err);
        previewDiv.innerHTML = `
          <div style="text-align: center; color: var(--status-error);">
            <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
            <p style="font-size: 12px;">${err.message}</p>
            <button class="btn btn-ghost btn-sm" id="btn-retry" style="margin-top: 12px;">Try Again</button>
          </div>
        `;
        previewDiv.querySelector('#btn-retry').onclick = () => invokeBtn.click();
      } finally {
        invokeBtn.disabled = false;
        invokeBtn.innerHTML = '🏛️ Invoke the Scribe';
        cuneiformDisplay.style.animation = '';
      }
    };

    // --- Preview Renderer (type-aware) ---
    function renderPreview(previewDiv, entry, actor) {
      previewDiv.style.alignItems = 'stretch';
      previewDiv.style.justifyContent = 'flex-start';

      const typeInfo = RULE_TYPES[selectedType];
      let fieldsHtml = '';

      // Render different fields based on type
      if (selectedType === 'lorebook') {
        fieldsHtml = `
          <div style="margin-bottom: 12px;"><div class="prev-label">Keywords</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${(entry.keywords || []).map(k => `<span class="prev-tag">${k}</span>`).join('')}
            </div>
          </div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Content</div>
            <div class="prev-content">${entry.content || ''}</div>
          </div>`;
      } else if (selectedType === 'actor') {
        const cf = entry.cardFields || {};
        fieldsHtml = `
          <div style="margin-bottom: 12px;"><div class="prev-label">Role</div><div style="font-size: 12px;">${entry.role || 'unspecified'}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Gender</div><div style="font-size: 12px;">${entry.gender || 'N'}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Personality</div><div class="prev-content">${cf.personality || ''}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Description</div><div class="prev-content">${cf.description || ''}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Appearance</div>
             <div style="display:flex; gap:8px; font-size:11px; margin-bottom:4px;">
                <span><strong>Hair:</strong> ${entry.appearance?.hair || '-'}</span>
                <span><strong>Eyes:</strong> ${entry.appearance?.eyes || '-'}</span>
             </div>
          </div>
          `;
      } else if (selectedType === 'pair') {
        fieldsHtml = `
          <div style="margin-bottom: 12px;"><div class="prev-label">Actors</div><div style="font-size: 12px;">${entry.actor1Name} & ${entry.actor2Name}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Relationship Type</div><div style="font-size: 12px;">${entry.type || 'unspecified'}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Dynamic</div><div class="prev-content">${entry.content || ''}</div></div>`;
      } else if (selectedType === 'voice') {
        fieldsHtml = `
          <div style="margin-bottom: 12px;"><div class="prev-label">Character</div><div style="font-size: 12px;">${entry.characterName || ''}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Baseline</div><div class="prev-content">${entry.baselineRail || ''}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Cadence</div><div class="prev-content">${entry.cadenceRail || ''}</div></div>
          ${entry.subtones?.length ? `<div style="margin-bottom: 12px;"><div class="prev-label">Subtones</div>
            ${entry.subtones.map(s => `<div style="font-size: 11px; padding: 4px; background: var(--bg-elevated); border-radius: 4px; margin-bottom: 4px;"><strong>${s.label}</strong> (${s.weight}%): ${s.rail}</div>`).join('')}
          </div>` : ''}`;
      } else if (selectedType === 'event') {
        fieldsHtml = `
          <div style="margin-bottom: 12px;"><div class="prev-label">Probability</div><div style="font-size: 12px;">${entry.probability || 100}%</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Trigger Condition</div><div class="prev-content">${entry.condition || ''}</div></div>
          <div style="margin-bottom: 12px;"><div class="prev-label">Effect</div><div class="prev-content">${entry.effect || ''}</div></div>`;
      }

      previewDiv.innerHTML = `
        <style>
          .prev-label { font-size: 10px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
          .prev-tag { font-size: 10px; padding: 3px 8px; background: var(--bg-elevated); border-radius: 10px; }
          .prev-content { font-size: 12px; line-height: 1.5; padding: 8px; background: var(--bg-inset); border-radius: var(--radius-sm); max-height: 120px; overflow-y: auto; white-space: pre-wrap; }
        </style>
        <div style="padding: var(--space-4); width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <span style="margin-right: 8px;">${typeInfo.icon}</span>
              <strong style="font-size: 15px;">${entry.title || entry.name || entry.label || 'Generated'}</strong>
              ${entry.category ? `<span style="font-size: 10px; color: var(--text-muted); margin-left: 8px; padding: 2px 6px; background: var(--bg-elevated); border-radius: 6px;">${entry.category}</span>` : ''}
            </div>
            <span style="font-size: 10px; color: var(--status-success);">✓ Generated</span>
          </div>
          
          ${fieldsHtml}
          
          ${actor ? `<div style="font-size: 10px; color: var(--text-muted); margin-bottom: 12px;">🎭 ${actor.name}</div>` : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
            <button class="btn btn-ghost" id="btn-regenerate" style="font-size: 11px;">↻ Retry</button>
            <button class="btn btn-primary" id="btn-inscribe" style="background: linear-gradient(135deg, #CD853F 0%, #8B6914 100%); border: none;">✓ Add to ${typeInfo.label}</button>
          </div>
        </div>
      `;

      previewDiv.querySelector('#btn-regenerate').onclick = () => container.querySelector('#btn-invoke').click();
      previewDiv.querySelector('#btn-inscribe').onclick = () => inscribeEntry(entry, actor);
    }

    // --- Inscribe to State (type-aware) ---
    function inscribeEntry(entry, actor) {
      const state = A.State.get();
      const typeInfo = RULE_TYPES[selectedType];
      let addedName = '';

      if (selectedType === 'lorebook') {
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };
        const id = 'lore_' + crypto.randomUUID().split('-')[0];
        state.weaves.lorebook.entries[id] = {
          id, uuid: crypto.randomUUID(), title: entry.title, keywords: entry.keywords || [],
          content: entry.content, category: entry.category || 'uncategorized', priority: entry.priority || 50,
          enabled: true, probability: 100, requireTags: [], blocksTags: [], tags: [],
          associatedActors: actor ? [actor.id] : []
        };
        addedName = entry.title;

      } else if (selectedType === 'actor') {
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.actors) state.nodes.actors = { items: {} };
        const id = 'actor_' + crypto.randomUUID().split('-')[0];

        // Detailed Mapping for Actors
        state.nodes.actors.items[id] = {
          id,
          name: entry.name,
          gender: entry.gender || 'N',
          role: entry.role || 'supporting',
          aliases: entry.aliases || [],
          tags: entry.tags || [],
          cardFields: entry.cardFields || {
            personality: entry.personality || '',
            description: entry.description || '',
            scenario: entry.scenario || '',
            firstMessage: entry.firstMessage || ''
          },
          traits: {
            appearance: entry.appearance || {}
          },
          gallery: { images: [], folders: ['default'], showNsfw: false }
        };
        addedName = entry.name;

      } else if (selectedType === 'pair') {
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.pairs) state.nodes.pairs = { items: {} };
        // Try to match actor names to IDs
        const findActor = (name) => actors.find(a => a.name?.toLowerCase() === name?.toLowerCase())?.id || '';
        const id = 'pair_' + crypto.randomUUID().split('-')[0];
        state.nodes.pairs.items[id] = {
          id, actor1: findActor(entry.actor1Name), actor2: findActor(entry.actor2Name),
          type: entry.type || '', target: 'personality', content: entry.content || '', shifts: []
        };
        addedName = `${entry.actor1Name} & ${entry.actor2Name}`;

      } else if (selectedType === 'voice') {
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.voices) state.weaves.voices = { voices: [], debug: false };
        state.weaves.voices.voices.push({
          enabled: true, characterName: entry.characterName || '', chatName: '',
          tag: 'V', handle: '', baselineMarker: '[VOICE]', baselineRail: entry.baselineRail || '',
          cadenceRail: entry.cadenceRail || '', attempt: { baseChance: 0.6, contentBoost: 0.15 },
          subtones: entry.subtones || []
        });
        addedName = entry.characterName;

      } else if (selectedType === 'event') {
        if (!state.aura) state.aura = {};
        if (!state.aura.events) state.aura.events = { items: {} };
        const id = 'ev_' + crypto.randomUUID().split('-')[0];
        state.aura.events.items[id] = {
          id, label: entry.label || 'New Event', enabled: true,
          probability: entry.probability || 100, condition: entry.condition || 'true', effect: entry.effect || ''
        };
        addedName = entry.label;
      }

      A.State.notify();
      if (A.UI?.Toast) A.UI.Toast.show(`Added: ${addedName}`, 'success');

      // Show success
      const previewDiv = container.querySelector('#nabu-preview');
      previewDiv.innerHTML = `
        <div style="text-align: center; color: var(--status-success);">
          <div style="font-size: 40px; margin-bottom: 16px;">✓</div>
          <p style="font-size: 16px; font-weight: 500; margin: 0;">${addedName}</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Added to ${typeInfo.label}</p>
          <button class="btn btn-secondary" id="btn-another" style="margin-top: 20px;">Create Another</button>
        </div>
      `;

      previewDiv.querySelector('#btn-another').onclick = () => {
        requestInput.value = '';
        previewDiv.style.alignItems = 'center';
        previewDiv.style.justifyContent = 'center';
        previewDiv.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); opacity: 0.4;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px;">
              <rect x="3" y="2" width="18" height="20" rx="2"/>
              <path d="M7 7h10M7 11h8M7 15h6M7 19h4"/>
            </svg>
            <p style="font-size: 12px; margin: 0;">Your inscription will appear here...</p>
          </div>
        `;
      };
    }

    // Initialize
    updateTypeUI();
  }

  // Register panel
  A.registerPanel('nabu', {
    label: 'Temple of Nabu',
    subtitle: 'AI Rule Generator',
    category: 'Sacred Tools',
    render: render
  });

})(window.Anansi);
