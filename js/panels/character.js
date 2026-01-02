/*
 * Anansi Panel: Character (Seed State)
 * File: js/panels/character.js
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();

    // Ensure seed exists (migration for existing projects)
    if (state && !state.seed) {
      state.seed = { characterName: '', chatName: '', persona: '', scenario: '', examples: '' };
    }
    // Migration: rename old 'name' field to 'chatName'
    if (state.seed.name !== undefined && state.seed.chatName === undefined) {
      state.seed.chatName = state.seed.name;
      delete state.seed.name;
    }
    // Ensure new fields exist
    if (state.seed.characterName === undefined) state.seed.characterName = '';
    if (state.seed.chatName === undefined) state.seed.chatName = '';

    // Set container layout for consistency with other panels
    container.style.height = '100%';
    container.style.overflowY = 'auto';

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding-bottom: var(--space-6);">
        <div class="panel-header" style="margin-bottom: var(--space-4);">
          <div>
            <h2 class="panel-title">Character Creation</h2>
            <div class="panel-subtitle">Define the Seed State of your bot.</div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label class="label">Character Name</label>
              <input type="text" id="char-charname" class="input" placeholder="Full character name" value="${state.seed.characterName || ''}">
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">The character's full name.</div>
            </div>

            <div class="form-group">
              <label class="label">Chat Name</label>
              <input type="text" id="char-chatname" class="input" placeholder="Name used in chat messages" value="${state.seed.chatName || ''}">
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">The name that appears in chat (e.g. "Anansi:" in messages).</div>
            </div>
            
            <div class="form-group">
              <label class="label">Personality / Description</label>
              <div id="quill-persona" style="height: 150px;"></div>
            </div>

            <div class="form-group">
              <label class="label">Scenario / Context</label>
              <div id="quill-scenario" style="height: 100px;"></div>
            </div>

            <div class="form-group">
              <label class="label">Example Dialogue</label>
              <textarea id="char-examples" class="input" style="height: 200px; resize: vertical; font-family: var(--font-mono); font-size: 13px;" placeholder="<START>\nUser: Hello.\nChar: Hi there!">${state.seed.examples || ''}</textarea>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Use proper xml tags if required by your environment.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bindings
    const update = (field, val) => {
      state.seed[field] = val;
      A.State.notify();
    };

    container.querySelector('#char-charname').oninput = e => update('characterName', e.target.value);
    container.querySelector('#char-chatname').oninput = e => update('chatName', e.target.value);
    container.querySelector('#char-examples').oninput = e => update('examples', e.target.value);

    // Initialize Quill editors for rich text fields
    if (A.QuillManager && typeof Quill !== 'undefined') {
      // Persona editor
      A.QuillManager.init('quill-persona', {
        placeholder: 'Describe who they are...',
        onChange: (quill, html) => update('persona', html)
      });
      A.QuillManager.setHTML('quill-persona', state.seed.persona || '');

      // Scenario editor
      A.QuillManager.init('quill-scenario', {
        placeholder: 'Current situation...',
        minimal: true,
        onChange: (quill, html) => update('scenario', html)
      });
      A.QuillManager.setHTML('quill-scenario', state.seed.scenario || '');
    }
  }

  A.registerPanel('character', {
    label: 'Character',
    subtitle: 'Seed State',
    category: 'Seeds',
    render: render
  });

})(window.Anansi);

