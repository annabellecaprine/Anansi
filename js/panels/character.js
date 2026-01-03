/*
 * Anansi Panel: Character (Seed State)
 * File: js/panels/character.js
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();

    if (!state) {
      container.innerHTML = '<div class="empty-state" style="padding:2em; text-align:center; color:var(--text-muted);">No project loaded.</div>';
      return;
    }

    // Ensure seed exists (migration for existing projects)
    if (state && !state.seed) {
      state.seed = { characterName: '', chatName: '', persona: '', scenario: '', examples: '', firstMessage: '', portrait: null };
    }
    // Migration: rename old 'name' field to 'chatName'
    if (state.seed.name !== undefined && state.seed.chatName === undefined) {
      state.seed.chatName = state.seed.name;
      delete state.seed.name;
    }
    // Ensure new fields exist
    if (state.seed.characterName === undefined) state.seed.characterName = '';
    if (state.seed.chatName === undefined) state.seed.chatName = '';
    if (state.seed.firstMessage === undefined) state.seed.firstMessage = '';
    if (state.seed.portrait === undefined) state.seed.portrait = null;

    // Set container layout for consistency with other panels
    container.style.height = '100%';
    container.style.overflowY = 'auto';

    const portraitSrc = state.seed.portrait?.data || '';

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding-bottom: var(--space-6);">
        <div class="panel-header" style="margin-bottom: var(--space-4);">
          <div>
            <h2 class="panel-title">Character Creation</h2>
            <div class="panel-subtitle">Define the Seed State of your bot.</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: var(--space-4);">
          <div class="card-header"><strong>Profile Image</strong></div>
          <div class="card-body" style="display: flex; gap: var(--space-4); align-items: flex-start;">
            <div id="portrait-preview" style="
              width: 150px;
              height: 200px;
              background: var(--bg-inset);
              border: 2px dashed var(--border-subtle);
              border-radius: var(--radius-md);
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              flex-shrink: 0;
            ">
              ${portraitSrc
        ? `<img src="${portraitSrc}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<span style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 8px;">No image</span>`
      }
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="file" id="portrait-input" accept="image/png,image/jpeg,image/webp" style="display: none;">
              <button class="btn btn-sm" id="btn-upload-portrait">📷 Upload Portrait</button>
              <button class="btn btn-ghost btn-sm" id="btn-remove-portrait" ${!portraitSrc ? 'disabled' : ''}>🗑️ Remove</button>
              <div style="font-size: 10px; color: var(--text-muted); max-width: 150px;">
                PNG, JPG, or WebP. Max 500KB recommended.
              </div>
            </div>
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
              <label class="label">Initial Message</label>
              <textarea id="char-firstmessage" class="input" style="height: 120px; resize: vertical; font-size: 13px;" placeholder="The first message the character sends when starting a conversation...">${escapeHtml(state.seed.firstMessage || '')}</textarea>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">The character's opening message. Use *asterisks* for actions, "quotes" for speech.</div>
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

    // Helper for HTML escaping
    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Bindings
    const update = (field, val) => {
      state.seed[field] = val;
      A.State.notify();
    };

    container.querySelector('#char-charname').oninput = e => update('characterName', e.target.value);
    container.querySelector('#char-chatname').oninput = e => update('chatName', e.target.value);
    container.querySelector('#char-firstmessage').oninput = e => update('firstMessage', e.target.value);
    container.querySelector('#char-examples').oninput = e => update('examples', e.target.value);

    // Portrait upload handling
    const portraitInput = container.querySelector('#portrait-input');
    const btnUpload = container.querySelector('#btn-upload-portrait');
    const btnRemove = container.querySelector('#btn-remove-portrait');
    const portraitPreview = container.querySelector('#portrait-preview');

    btnUpload.onclick = () => portraitInput.click();

    portraitInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 500 * 1024) {
        if (A.UI?.Toast) A.UI.Toast.show('Image is larger than 500KB. Consider compressing it.', 'warning');
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        state.seed.portrait = {
          type: 'dataUrl',
          data: ev.target.result,
          mimeType: file.type
        };
        A.State.notify();
        // Update preview
        portraitPreview.innerHTML = `<img src="${ev.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        btnRemove.disabled = false;
      };
      reader.readAsDataURL(file);
    };

    btnRemove.onclick = () => {
      state.seed.portrait = null;
      A.State.notify();
      portraitPreview.innerHTML = `<span style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 8px;">No image</span>`;
      btnRemove.disabled = true;
    };

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

    // Add token counters
    const firstMsgTextarea = container.querySelector('#char-firstmessage');
    if (firstMsgTextarea && A.Utils?.addTokenCounter) {
      const firstMsgLabel = firstMsgTextarea.closest('.form-group')?.querySelector('.label');
      if (firstMsgLabel) A.Utils.addTokenCounter(firstMsgTextarea, firstMsgLabel);
    }

    const examplesTextarea = container.querySelector('#char-examples');
    if (examplesTextarea && A.Utils?.addTokenCounter) {
      const examplesLabel = examplesTextarea.closest('.form-group')?.querySelector('.label');
      if (examplesLabel) A.Utils.addTokenCounter(examplesTextarea, examplesLabel);
    }

    // Attach AI Assistant
    if (A.UI.Assistant) {
      // Persona (Quill)
      A.UI.Assistant.attach(document.getElementById('quill-persona'), {
        label: 'Persona',
        system: 'You are an expert character designer. Improve the persona description. Focus on personality, quirks, and background.',
        getValue: () => A.QuillManager.getText('quill-persona'),
        setValue: (val) => A.QuillManager.setText('quill-persona', val)
      });

      // Scenario (Quill)
      A.UI.Assistant.attach(document.getElementById('quill-scenario'), {
        label: 'Scenario',
        system: 'You are an expert scenario writer. Improve the scenario description. Focus on the setting, current situation, and goals.',
        getValue: () => A.QuillManager.getText('quill-scenario'),
        setValue: (val) => A.QuillManager.setText('quill-scenario', val)
      });

      // First Message
      if (firstMsgTextarea) {
        A.UI.Assistant.attach(firstMsgTextarea, {
          label: 'First Message',
          system: 'You are a roleplay character. Improve this introductory message. Keep it engaging and true to the character\'s voice.'
        });
      }

      // Examples
      if (examplesTextarea) {
        A.UI.Assistant.attach(examplesTextarea, {
          label: 'Example Dialogue',
          system: 'You are a dialogue expert. Write or improve these example dialogue pairs to showcase the character\'s voice and mannerisms.'
        });
      }
    }
  }

  A.registerPanel('character', {
    label: 'Character',
    subtitle: 'Seed State',
    category: 'Seeds',
    render: render
  });

})(window.Anansi);

