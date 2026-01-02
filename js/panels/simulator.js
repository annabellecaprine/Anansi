
/*
 * Anansi Panel: The Spindle (Logic Simulator & Debugger)
 * File: js/panels/simulator.js
 * Modes: Simulated (logic-only) | Live (LLM integration)
 */

(function (A) {
  'use strict';

  // Helper: Escape HTML for safe display in Prompt Inspector
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function render(container) {
    // Initialize specific SIM state if missing or incomplete
    const _s = A.State.get();

    if (_s) {
      if (!_s.sim) _s.sim = {};
      if (!_s.sim.history) _s.sim.history = [];
      if (!_s.sim.activeTags) _s.sim.activeTags = [];
      if (!_s.sim.simSources) _s.sim.simSources = {};
      if (!_s.sim.simMessages) _s.sim.simMessages = [];
      if (!_s.sim.actors) _s.sim.actors = [];
    }

    // Get current mode from localStorage
    let currentMode = localStorage.getItem('anansi_spindle_mode') || 'live';
    setTimeout(updateTour, 100); // Init tour steps

    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--space-4)';
    container.style.overflow = 'hidden';

    // --- Mode Toggle Header ---
    const modeHeader = document.createElement('div');
    modeHeader.style.display = 'flex';
    modeHeader.style.gap = '8px';
    modeHeader.style.marginBottom = '8px';
    modeHeader.innerHTML = `
      <button class="btn btn-sm spindle-mode-btn" data-mode="simulated" style="flex:1;">Simulated</button>
      <button class="btn btn-sm spindle-mode-btn" data-mode="live" style="flex:1;">Live</button>
    `;
    container.appendChild(modeHeader);

    // --- Content Container ---
    const contentArea = document.createElement('div');
    contentArea.style.flex = '1';
    contentArea.style.display = 'flex';
    contentArea.style.flexDirection = 'column';
    contentArea.style.overflow = 'hidden';
    contentArea.id = 'spindle-content';
    container.appendChild(contentArea);

    // Update mode button styles
    function updateModeButtons() {
      modeHeader.querySelectorAll('.spindle-mode-btn').forEach(btn => {
        const isActive = btn.dataset.mode === currentMode;
        btn.className = `btn btn-sm spindle-mode-btn ${isActive ? 'btn-primary' : 'btn-ghost'}`;
      });
    }

    // Switch mode
    function switchMode(mode) {
      currentMode = mode;
      localStorage.setItem('anansi_spindle_mode', mode);
      updateModeButtons();
      renderContent();
      updateTour(); // Update tour steps for new mode
    }

    function updateTour() {
      if (!A.UI.Tour) return;

      if (currentMode === 'simulated') {
        A.UI.Tour.register('simulator', [
          {
            target: '#sim-sources-list',
            title: 'Source Overrides',
            content: 'Manually inject values for any defined Source. Useful for testing specific conditions without full context.'
          },
          {
            target: '#sim-msg-list',
            title: 'Context Injection',
            content: 'Draft a mock conversation history to seed the simulation. You can roleplay both User and AI sides.'
          },
          {
            target: '#btn-run-sim',
            title: 'Recall (Execute)',
            content: 'Runs the Logic Engine (Neural Stack) on the current inputs. It does NOT call the LLM, but processes all logic gates.'
          },
          {
            target: '#sim-diff-view',
            title: 'State Impact',
            content: 'See exactly how these inputs changed the world state. Tracks Context updates and Tag emissions.'
          }
        ]);
      } else {
        // Live Mode
        A.UI.Tour.register('simulator', [
          {
            target: '#sim-chat-log',
            title: 'Live Spindle',
            content: 'A real-time chat interface with the AI. It uses the actual Logic Engine and State for every reply.'
          },
          {
            target: '#sim-input',
            title: 'Weaving',
            content: 'Type your message here. The AI will respond based on the current Persona, Scenario, and Context.'
          },
          {
            target: '#btn-run-all',
            title: 'Trace Debugging',
            content: 'Run a full logic trace on the current state without generating a reply, useful for checking gate logic.'
          }
        ]);
      }
    }

    // Bind mode buttons
    modeHeader.querySelectorAll('.spindle-mode-btn').forEach(btn => {
      btn.onclick = () => switchMode(btn.dataset.mode);
    });

    // Render content based on mode
    function renderContent() {
      contentArea.innerHTML = '';
      if (currentMode === 'simulated') {
        renderSimulatedMode(contentArea);
      } else {
        renderLiveMode(contentArea);
      }
    }

    // --- LENS LOGIC (Shared) ---
    let activeLens = localStorage.getItem('anansi_sim_active_lens') || 'state';

    const switchLens = (key) => {
      activeLens = key;
      localStorage.setItem('anansi_sim_active_lens', key);
      updateGlobalLens();
    };

    const updateGlobalLens = () => {
      A.UI.setLens((lensRoot) => {
        lensRoot.innerHTML = `
          <div class="lens-tabs" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
            ${[
            { k: 'state', l: 'State' },
            { k: 'context', l: 'Ctx' },
            { k: 'prompt', l: 'Prompt' },   // NEW: Prompt Inspector
            { k: 'tokens', l: 'Tokens' },   // NEW: Token Visualizer
            { k: 'integrity', l: 'Valid' },
            { k: 'trace', l: 'Trace' },
            { k: 'stats', l: 'Stats' },
            { k: 'locations', l: 'Locs' },
            { k: 'config', l: 'Cfg' }
          ].map(o => `
              <button class="btn btn-ghost btn-sm lens-tab-btn ${activeLens === o.k ? 'active' : ''}"
                      style="font-size:10px; padding:4px 8px; white-space:nowrap; ${activeLens === o.k ? 'background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-subtle);' : ''}"
                      data-lens="${o.k}">${o.l.toUpperCase()}</button>
            `).join('')}
          </div>
          <div id="lens-inner-content"></div>
        `;

        lensRoot.querySelectorAll('.lens-tab-btn').forEach(btn => {
          btn.onclick = () => switchLens(btn.dataset.lens);
        });

        const inner = lensRoot.querySelector('#lens-inner-content');
        renderLensContent(inner, activeLens);
      });
    };

    // --- SIMULATED MODE ---
    function renderSimulatedMode(target) {
      target.style.display = 'grid';
      target.style.gridTemplateColumns = '35% 65%'; // Adjusted split for better log verification
      target.style.gap = 'var(--space-4)';
      target.style.height = '100%';
      target.style.overflow = 'hidden';

      // Left: Sources Configuration
      const sourcesCard = document.createElement('div');
      sourcesCard.className = 'card';
      sourcesCard.style.display = 'flex';
      sourcesCard.style.flexDirection = 'column';
      sourcesCard.style.marginBottom = '0';
      sourcesCard.style.height = '100%';
      sourcesCard.innerHTML = `
        <div class="card-header">
          <strong>Sources Override</strong>
          <button class="btn btn-ghost btn-sm" id="btn-reset-sources" title="Reset all overrides">Reset</button>
        </div>
        <div class="card-body" id="sim-sources-list" style="flex:1; overflow-y:auto; padding:12px;"></div>
      `;
      target.appendChild(sourcesCard);

      // Right: Results & Controls
      const rightCol = document.createElement('div');
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.gap = 'var(--space-4)';
      rightCol.style.overflow = 'hidden';
      rightCol.style.height = '100%';

      // 1. Message History (Compact)
      const msgCard = document.createElement('div');
      msgCard.className = 'card';
      msgCard.style.flex = '0 0 auto';
      msgCard.style.maxHeight = '30%'; // Limit height
      msgCard.style.display = 'flex';
      msgCard.style.flexDirection = 'column';
      msgCard.style.marginBottom = '0';
      msgCard.innerHTML = `
        <div class="card-header" style="flex-wrap:wrap; gap:8px;">
          <strong>Message Context</strong>
          <div style="display:flex; gap:4px; align-items:center;">
            <select class="input" id="sim-session-select" style="font-size:10px; padding:2px 6px; width:auto; min-width:100px;">
              <option value="">-- Sessions --</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="btn-load-session" title="Load selected session">Load</button>
            <button class="btn btn-ghost btn-sm" id="btn-save-session" title="Save current as session">Save</button>
            <div style="width:1px; height:16px; background:var(--border-subtle); margin:0 4px;"></div>
            <button class="btn btn-ghost btn-sm" id="btn-add-msg">+ Msg</button>
            <button class="btn btn-ghost btn-sm" id="btn-clear-msgs" style="color:var(--status-error);">Reset</button>
          </div>
        </div>
        <div class="card-body" id="sim-msg-list" style="flex:1; overflow-y:auto; padding:0;"></div>
      `;
      rightCol.appendChild(msgCard);

      // 2. Execution Log
      const runCard = document.createElement('div');
      runCard.className = 'card';
      runCard.style.flex = '1'; // Primary flex
      runCard.style.display = 'flex';
      runCard.style.flexDirection = 'column';
      runCard.style.marginBottom = '0';
      runCard.style.minHeight = '0'; // Flex scroll fix
      runCard.style.flex = '0 0 auto'; // Don't grow, just fit content
      runCard.innerHTML = `
        <div class="card-header" style="background:var(--ink-700); border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:8px;">
             <strong>Simulation</strong>
             <span id="sim-run-time" style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);"></span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm" id="btn-flow-explorer">📊 Flow Explorer</button>
            <button class="btn btn-primary btn-sm" id="btn-run-sim">▶ Recall</button>
          </div>
        </div>
        <div class="card-body" id="sim-output" style="padding:12px; background:var(--bg-app);">
          <div style="color:var(--text-muted); text-align:center; font-size:12px;">
             Set sources and messages, then click <strong>Recall</strong> to run simulation.
             <br><span style="font-size:11px;">View detailed execution log in <a href="#" onclick="Anansi.UI.switchPanel('flow-explorer'); return false;" style="color:var(--accent-primary);">Flow Explorer</a>.</span>
          </div>
        </div>
      `;
      rightCol.appendChild(runCard);

      // 3. State Impact (Diff) - Now Resizable / Flex
      // User complaint: "cuts off after two lines". We need to give it more height or make it draggable.
      // Let's make it a substantial fixed percentage or flex-grow.
      const diffCard = document.createElement('div');
      diffCard.className = 'card';
      diffCard.style.marginBottom = '0';
      diffCard.style.flex = '0 0 35%'; // Give it 35% of the height strictly
      diffCard.style.display = 'flex';           // Enable flex layout for children
      diffCard.style.flexDirection = 'column';   // Vertical stack
      diffCard.style.minHeight = '160px';        // Absolute minimum
      diffCard.innerHTML = `
        <div class="card-header" style="border-top:2px solid var(--accent-primary);">
          <strong>State Impact</strong>
          <span style="font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Context Delta</span>
        </div>
        <div class="card-body" id="sim-diff-view" style="flex:1; overflow-y:auto; padding:12px; font-size:11px; background:var(--ink-800);">
           <div style="color:var(--text-muted); font-style:italic; opacity:0.6;">No changes recorded.</div>
        </div>
      `;
      rightCol.appendChild(diffCard);


      target.appendChild(rightCol);

      // Populate Sources
      renderSourcesConfig();
      renderMessageHistory();

      // Ensure Lens is active (still keep Lens for deep inspection if needed, but primary diff is now visible)
      updateGlobalLens();

      // Bind events
      sourcesCard.querySelector('#btn-reset-sources').onclick = () => {
        const state = A.State.get();
        state.sim.simSources = {};
        A.State.notify();
        renderSourcesConfig();
      };

      msgCard.querySelector('#btn-add-msg').onclick = () => addMessage('user');
      msgCard.querySelector('#btn-clear-msgs').onclick = () => {
        const state = A.State.get();
        state.sim.simMessages = [];
        A.State.notify();
        renderMessageHistory();
      };

      // --- Session Management (Simulated Mode) ---
      const sessionSelect = msgCard.querySelector('#sim-session-select');

      const refreshSessionList = () => {
        const state = A.State.get();
        if (!state.sim.chatSessions) state.sim.chatSessions = {};
        const sessions = Object.keys(state.sim.chatSessions);

        sessionSelect.innerHTML = `<option value="">-- Sessions (${sessions.length}) --</option>`;
        sessions.forEach(name => {
          const session = state.sim.chatSessions[name];
          const msgCount = session.messages?.length || 0;
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${name} (${msgCount} msgs)`;
          sessionSelect.appendChild(opt);
        });
      };

      refreshSessionList();

      msgCard.querySelector('#btn-save-session').onclick = () => {
        const state = A.State.get();
        if (!state.sim.chatSessions) state.sim.chatSessions = {};

        const name = prompt('Session name:', `Session ${Object.keys(state.sim.chatSessions).length + 1}`);
        if (!name) return;

        state.sim.chatSessions[name] = {
          messages: JSON.parse(JSON.stringify(state.sim.simMessages || [])),
          savedAt: new Date().toISOString(),
          mode: 'simulated'
        };

        A.State.notify();
        refreshSessionList();
        if (A.UI.Toast) A.UI.Toast.show(`Session "${name}" saved`, 'success');
      };

      msgCard.querySelector('#btn-load-session').onclick = () => {
        const name = sessionSelect.value;
        if (!name) {
          if (A.UI.Toast) A.UI.Toast.show('Select a session first', 'warning');
          return;
        }

        const state = A.State.get();
        const session = state.sim.chatSessions?.[name];
        if (!session) {
          if (A.UI.Toast) A.UI.Toast.show('Session not found', 'error');
          return;
        }

        state.sim.simMessages = JSON.parse(JSON.stringify(session.messages || []));
        A.State.notify();
        renderMessageHistory();
        if (A.UI.Toast) A.UI.Toast.show(`Loaded "${name}"`, 'success');
      };

      // Flow Explorer button
      const flowBtn = runCard.querySelector('#btn-flow-explorer');
      if (flowBtn) {
        flowBtn.onclick = () => A.UI.switchPanel('flow-explorer');
      }

      runCard.querySelector('#btn-run-sim').onclick = () => {
        runSimulation();
        // Update Lens after Run
        updateGlobalLens();
        // Update Local Diff View
        const diffEl = diffCard.querySelector('#sim-diff-view');
        renderDiffPanel(diffEl);
      };
    }

    // Helper to render Diff in the panel
    function renderDiffPanel(container) {
      if (!container) return;
      container.innerHTML = '';

      const state = A.State.get();
      const diff = state.sim.lastDiff;

      if (!diff) {
        container.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">No changes detected.</div>';
        return;
      }

      let html = '';

      // Fields
      if (diff.fields && diff.fields.length) {
        html += `<div style="font-weight:bold; font-size:10px; margin-bottom:8px; color:var(--text-secondary); text-transform:uppercase;">Context Updates</div>`;
        diff.fields.forEach(f => {
          if (f.type === 'append') {
            html += `<div style="margin-bottom:8px; border-left:3px solid var(--accent-primary); padding-left:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                           <span style="color:var(--accent-primary); font-weight:bold; font-size:10px;">${f.key.toUpperCase()}</span>
                           <span style="color:var(--text-muted); font-size:9px;">+${f.addedLength} chars</span>
                        </div>
                        <div style="background:var(--bg-surface); padding:6px; border-radius:4px; margin-top:4px; font-family:var(--font-mono); color:var(--text-main); white-space:pre-wrap; border:1px solid var(--border-subtle);">${f.val}</div>
                     </div>`;
          } else if (f.type === 'modify') {
            html += `<div style="margin-bottom:8px; border-left:3px solid var(--status-warning); padding-left:8px;">
                        <span style="color:var(--status-warning); font-weight:bold; font-size:10px;">${f.key.toUpperCase()}</span> 
                        <span style="color:var(--text-secondary);">modified</span>
                        <div style="font-size:9px; color:var(--text-muted);">Length: ${f.oldLen} → ${f.newLen}</div>
                     </div>`;
          }
        });
      }

      // Tags
      if (diff.tags && diff.tags.length) {
        html += `<div style="font-weight:bold; font-size:10px; margin-top:12px; margin-bottom:8px; color:var(--text-secondary); text-transform:uppercase;">Tags Emitted</div>`;
        html += `<div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${diff.tags.map(t => `<span style="background:rgba(60, 177, 121, 0.2); border:1px solid var(--status-success); color:var(--status-success); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold;">${t}</span>`).join('')}
             </div>`;
      }

      if (!html) {
        container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; opacity:0.6;">Scripts ran, but no context changes were detected.</div>';
      } else {
        container.innerHTML = html;
      }
    }

    function renderSourcesConfig() {
      const state = A.State.get();
      const list = contentArea.querySelector('#sim-sources-list');

      if (!list) return;
      list.innerHTML = '';

      const sources = state.strands && state.strands.sources ? state.strands.sources.items : {};
      const sourceKeys = Object.keys(sources);

      if (sourceKeys.length === 0) {
        list.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100px; color:var(--text-muted); opacity:0.7;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <div style="font-size:11px;">No sources defined</div>
            <div style="font-size:9px; opacity:0.7;">Add in Sources Panel</div>
          </div>
        `;
        return;
      }

      sourceKeys.forEach(key => {
        const src = sources[key];
        const currentVal = state.sim.simSources[key] ?? '';
        // READ PERSISTENCE FROM DEFINITION (Read-Only indicator)
        const isPersistent = src.persistent || false;

        const row = document.createElement('div');
        row.style.marginBottom = '12px';

        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <label style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">
                ${src.label || key} <code style="font-size:9px; color:grey;">${src.kind}</code>
              </label>
              <!-- Indicator Only -->
              ${isPersistent ? '<span style="font-size:9px; color:var(--accent-secondary); border:1px solid var(--accent-secondary); padding:0 3px; border-radius:3px;">KEEP</span>' : ''}
          </div>
          ${src.kind === 'boolean'
            ? `<label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" class="sim-source-input" data-key="${key}" ${currentVal ? 'checked' : ''}> Enabled</label>`
            : src.kind === 'number'
              ? `<input type="number" class="input sim-source-input" data-key="${key}" value="${currentVal}" style="width:100%;">`
              : `<textarea class="input sim-source-input" data-key="${key}" rows="2" style="width:100%; font-size:11px;">${currentVal}</textarea>`
          }
        `;
        list.appendChild(row);
      });

      // Bind inputs (Value)
      list.querySelectorAll('.sim-source-input').forEach(input => {
        input.oninput = input.onchange = () => {
          const state = A.State.get();
          const key = input.dataset.key;
          state.sim.simSources[key] = input.type === 'checkbox' ? input.checked : input.value;
        };
      });
    }

    function renderMessageHistory() {
      const state = A.State.get();
      const list = contentArea.querySelector('#sim-msg-list');
      if (!list) return;
      list.innerHTML = '';

      const messages = state.sim.simMessages || [];

      if (messages.length === 0) {
        list.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <div style="margin-bottom:16px;">Start a Conversation</div>
            <button class="btn btn-secondary" id="btn-add-first-msg">Add Message</button>
          </div>
        `;

        const startBtn = list.querySelector('#btn-add-first-msg');
        if (startBtn) startBtn.onclick = () => addMessage('user');
        return;
      }

      messages.forEach((msg, idx) => {
        console.log("Render Message Item:", idx, msg.role);
        const row = document.createElement('div');

        // Debug visibility
        setTimeout(() => {
          const rect = row.getBoundingClientRect();
          const style = window.getComputedStyle(row);
          console.log(`Message Row [${idx}]: Display=${style.display}, Visibility=${style.visibility}, H=${rect.height}, W=${rect.width}, DOM=${row.isConnected}`);
        }, 100);

        row.style.padding = '8px 12px';
        row.style.borderBottom = '1px solid var(--border-subtle)';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'flex-start';
        // Highlight logic to show "Newest" if it was just added? Not strictly necessary but nice.
        row.innerHTML = `
          <div style="cursor:pointer; min-width:40px; font-size:10px; font-weight:bold; color:${msg.role === 'user' ? 'var(--accent-primary)' : 'var(--status-success)'}; text-transform:uppercase; margin-top:4px;" title="Click to toggle role" class="sim-msg-role" data-idx="${idx}">
            ${msg.role}
          </div>
          <textarea class="input sim-msg-content" data-idx="${idx}" rows="2" style="flex:1; font-size:11px; font-family:var(--font-primary);" placeholder="Message content...">${msg.content}</textarea>
          <button class="btn btn-ghost btn-sm sim-msg-del" data-idx="${idx}" style="color:var(--status-error); padding:2px 6px;">✕</button>
        `;
        list.appendChild(row);
      });

      // Bind
      list.querySelectorAll('.sim-msg-role').forEach(div => {
        div.onclick = () => {
          const state = A.State.get();
          const idx = parseInt(div.dataset.idx);
          state.sim.simMessages[idx].role = state.sim.simMessages[idx].role === 'user' ? 'ai' : 'user';
          A.State.notify(); // Re-render to update color
          renderMessageHistory();
        };
      });

      list.querySelectorAll('.sim-msg-content').forEach(ta => {
        ta.oninput = () => {
          const state = A.State.get();
          state.sim.simMessages[parseInt(ta.dataset.idx)].content = ta.value;
        };
      });

      list.querySelectorAll('.sim-msg-del').forEach(btn => {
        btn.onclick = () => {
          const state = A.State.get();
          state.sim.simMessages.splice(parseInt(btn.dataset.idx), 1);
          A.State.notify();
          renderMessageHistory();
        };
      });

      // Ensure we are scrolled to the bottom to see new messages
      // list.scrollTop = list.scrollHeight; 
      // Actually, let's only scroll if we are near the bottom or if a new message was added?
      // For now, simpler is better.
    }

    function addMessage(role = 'user') {
      const state = A.State.get();
      if (!state.sim.simMessages) state.sim.simMessages = [];
      state.sim.simMessages.push({ role, content: '' });
      A.State.notify();
      renderMessageHistory();

      // Auto-focus and scroll to new message
      setTimeout(() => {
        const list = contentArea.querySelector('#sim-msg-list');
        if (!list) return;
        const textareas = list.querySelectorAll('textarea');
        if (textareas.length) {
          const last = textareas[textareas.length - 1];
          last.focus();
          last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }


    function runSimulation() {
      const output = contentArea.querySelector('#sim-output');
      if (!output) return;

      output.innerHTML = ''; // Clear previous run

      // Start flow logging for this turn
      const simState = A.State.get();
      const turnNumber = (simState.sim?.executionLog?.length || 0) + 1;
      const lastMsg = (simState.sim?.simMessages || []).slice(-1)[0];
      const userMessage = lastMsg?.content || '(No message)';
      if (A.FlowLogger) A.FlowLogger.startTurn(turnNumber, userMessage);

      // --- SIMULATED MODE: Re-uses processRound logic for consistency ---
      const result = processRound("", simState.sim?.simMessages || []);

      const logs = result.logs;
      const context = result.context;
      const diff = result.diff;
      const snapshot = result.snapshot;

      // --- PERSISTENCE WRITE-BACK ---
      // --- PERSISTENCE WRITE-BACK ---
      const sourceDefs = simState.strands && simState.strands.sources ? simState.strands.sources.items : {};

      Object.keys(sourceDefs).forEach(key => {
        if (sourceDefs[key].persistent && context.hasOwnProperty(key)) {
          // Write back from Context (Final State) to State (Input Field)
          const oldVal = simState.sim.simSources[key];
          const newVal = context[key];
          if (oldVal !== newVal) {
            simState.sim.simSources[key] = newVal;
            if (A.UI.Toast) A.UI.Toast.show(`Updated persistent source: ${sourceDefs[key].label || key}`, 'success');
          }
        }
      });

      // Force UI refresh if needed (e.g. if we are looking at the sources list)
      const sourcesList = contentArea.querySelector('#sim-sources-list');
      if (sourcesList && sourcesList.isConnected) renderSourcesConfig();

      // Update State with Diff from processRound
      simState.sim.lastDiff = diff;
      A.State.notify();

      // Show simple success message (detailed logs in Flow Explorer)
      // Read from saved log since currentTurn is cleared by endTurn()
      const lastLog = simState.sim?.executionLog?.slice(-1)[0];
      const entries = lastLog?.entries || [];
      const passedCount = entries.filter(e => e.passed).length;
      const failedCount = entries.filter(e => !e.passed).length;

      output.innerHTML = `
        <div style="text-align:center; padding:8px;">
          <div style="color:var(--status-success); font-size:14px; margin-bottom:4px;">✓ Simulation Complete</div>
          <div style="font-size:11px; color:var(--text-muted);">
            <span style="color:var(--status-success);">${passedCount} passed</span> · 
            <span style="color:var(--status-error);">${failedCount} did not trigger</span>
          </div>
          <div style="margin-top:6px;">
            <a href="#" onclick="Anansi.UI.switchPanel('flow-explorer'); return false;" style="color:var(--accent-primary); font-size:11px;">View Details in Flow Explorer →</a>
          </div>
        </div>
      `;
    }

    // Subscription for external updates
    A.State.subscribe(() => {
      if (currentMode === 'simulated' && contentArea.isConnected) {
        // Smart update for sources list (only if keys changed)
        const state = A.State.get();
        const list = contentArea.querySelector('#sim-sources-list');
        if (list) {
          const existingKeys = Array.from(list.querySelectorAll('.sim-source-input')).map(el => el.dataset.key).sort().join(',');
          const stateKeys = Object.keys(state.strands?.sources?.items || {}).sort().join(',');
          if (existingKeys !== stateKeys) {
            renderSourcesConfig();
          }
        }
      }
    });

    // --- LIVE MODE (existing functionality) ---
    function renderLiveMode(target) {
      target.style.display = 'flex';
      target.style.flexDirection = 'column';
      target.style.gap = 'var(--space-4)';
      target.style.overflow = 'hidden';

      // Chat Area
      const chatCol = document.createElement('div');
      chatCol.className = 'card';
      chatCol.style.display = 'flex';
      chatCol.style.flexDirection = 'column';
      chatCol.style.padding = '0';
      chatCol.style.minHeight = '0';
      chatCol.style.flex = '1';

      chatCol.innerHTML = `
        <div class="card-header" style="flex-wrap:wrap; gap:8px;">
          <strong>The Spindle (Live)</strong>
          <div style="display: flex; gap: 8px; align-items:center;">
            <select class="input" id="live-session-select" style="font-size:10px; padding:2px 6px; width:auto; min-width:100px;">
              <option value="">-- Sessions --</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="btn-live-load" title="Load session">Load</button>
            <button class="btn btn-ghost btn-sm" id="btn-live-save" title="Save session">Save</button>
            <div style="width:1px; height:16px; background:var(--border-subtle);"></div>
            <select class="input" id="branch-select" style="font-size:10px; padding:2px 6px; width:auto; min-width:80px; background:var(--bg-elevated);">
              <option value="main">🌿 main</option>
            </select>
            <div style="width:1px; height:16px; background:var(--border-subtle);"></div>
            <button class="btn btn-ghost btn-sm" id="btn-run-all" title="Run Full Simulation Trace">Run Trace</button>
            <button class="btn btn-ghost btn-sm" id="btn-export-story" title="Export as Story">Export</button>
            <button class="btn btn-ghost btn-sm" id="btn-clear-chat" style="color:var(--status-error);">Clear</button>
          </div>
        </div>
        <div class="card-body" id="sim-chat-log" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:8px; background: var(--bg-surface);"></div>
        <div class="card-footer" style="padding:12px;">
          <div style="display:flex; gap:8px; align-items:flex-end;">
            <textarea class="input" id="sim-input" placeholder="Weave a message... (Shift+Enter for new line)" style="flex:1; resize:none; min-height:36px; max-height:120px; line-height:1.4;" rows="1"></textarea>
            <button class="btn btn-primary" id="sim-send" style="height:36px;">Send</button>
          </div>
        </div>
      `;
      target.appendChild(chatCol);


      // Lens Integration (Scoped to Live Mode)
      // let activeLens = localStorage.getItem('anansi_sim_active_lens') || 'state'; // MOVED

      // const switchLens = (key) => { // MOVED
      //   activeLens = key;
      //   localStorage.setItem('anansi_sim_active_lens', key);
      //   updateGlobalLens();
      // };

      // const updateGlobalLens = () => { // MOVED
      //   A.UI.setLens((lensRoot) => {
      //     lensRoot.innerHTML = `
      //     <div class="lens-tabs" style="display:flex; gap:2px; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
      //       ${['state', 'context', 'diff', 'integrity', 'trace', 'config'].map(k => `
      //         <button class="btn btn-ghost btn-sm lens-tab-btn ${activeLens === k ? 'active' : ''}"
      //                 style="font-size:10px; padding:4px 8px; ${activeLens === k ? 'background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-subtle);' : ''}"
      //                 data-lens="${k}">${k.toUpperCase()}</button>
      //       `).join('')}
      //     </div>
      //     <div id="lens-inner-content"></div>
      //   `;

      //     lensRoot.querySelectorAll('.lens-tab-btn').forEach(btn => {
      //       btn.onclick = () => switchLens(btn.dataset.lens);
      //     });

      //     const inner = lensRoot.querySelector('#lens-inner-content');
      //     renderLensContent(inner, activeLens);
      //   });
      // };

      // Trigger global lens update
      updateGlobalLens();

      // --- Chat Logic ---
      const chatLog = chatCol.querySelector('#sim-chat-log');
      const input = chatCol.querySelector('#sim-input');
      const sendBtn = chatCol.querySelector('#sim-send');

      const refreshChat = () => {
        const state = A.State.get();
        const history = state.sim.history || [];

        chatLog.innerHTML = '';
        chatLog.className = 'card-body chat-log';

        history.forEach((msg, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = `chat-message chat-message-${msg.role}`;
          wrapper.dataset.index = idx;

          const bubble = document.createElement('div');
          bubble.className = `chat-bubble chat-bubble-${msg.role}`;

          // Role label
          const roleLabel = document.createElement('div');
          roleLabel.className = 'chat-role';
          roleLabel.textContent = msg.role.toUpperCase();
          if (msg.edited) {
            const editedTag = document.createElement('span');
            editedTag.className = 'chat-edited';
            editedTag.textContent = '(edited)';
            roleLabel.appendChild(editedTag);
          }
          bubble.appendChild(roleLabel);

          // Message content (formatted)
          const content = document.createElement('div');
          content.className = 'chat-content';
          content.innerHTML = A.ChatFormatter ? A.ChatFormatter.format(msg.content) : msg.content;
          bubble.appendChild(content);

          // Timestamp (relative)
          if (msg.timestamp) {
            const ts = document.createElement('span');
            ts.className = 'chat-timestamp';
            ts.textContent = getRelativeTime(msg.timestamp);
            bubble.appendChild(ts);
          }

          // Actions toolbar
          const actions = document.createElement('div');
          actions.className = 'chat-actions';
          actions.innerHTML = `
            <button class="chat-action-btn" data-action="edit" title="Edit">✏️</button>
            <button class="chat-action-btn" data-action="copy" title="Copy">📋</button>
            <button class="chat-action-btn" data-action="fork" title="Fork from here">🌿</button>
            ${msg.role === 'model' ? '<button class="chat-action-btn" data-action="regenerate" title="Regenerate">🔄</button>' : ''}
            <button class="chat-action-btn danger" data-action="delete" title="Delete">🗑️</button>
          `;
          wrapper.appendChild(actions);
          wrapper.appendChild(bubble);
          chatLog.appendChild(wrapper);
        });

        // Bind action buttons
        chatLog.querySelectorAll('.chat-action-btn').forEach(btn => {
          btn.onclick = (e) => handleMessageAction(e.target.dataset.action, parseInt(e.target.closest('.chat-message').dataset.index));
        });

        chatLog.scrollTop = chatLog.scrollHeight;
      };

      // Relative time helper
      function getRelativeTime(timestamp) {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      }

      // Message action handler
      function handleMessageAction(action, index) {
        const state = A.State.get();
        const msg = state.sim.history[index];
        if (!msg) return;

        if (action === 'edit') {
          openEditModal(index, msg);
        } else if (action === 'copy') {
          const text = A.ChatFormatter ? A.ChatFormatter.toPlainText(msg.content) : msg.content;
          navigator.clipboard.writeText(text);
          if (A.UI.Toast) A.UI.Toast.show('Copied to clipboard', 'success');
        } else if (action === 'delete') {
          const msgCount = state.sim.history.length - index;
          const confirmMsg = msgCount > 1
            ? `Delete this message and ${msgCount - 1} subsequent message(s)?`
            : 'Delete this message?';
          if (confirm(confirmMsg)) {
            state.sim.history = state.sim.history.slice(0, index);
            A.State.notify();
            refreshChat();
          }
        } else if (action === 'regenerate') {
          regenerateMessage(index);
        } else if (action === 'fork') {
          // Create a new branch from this point
          const branchName = prompt('Branch name:', `branch-${Date.now().toString(36)}`);
          if (!branchName) return;

          // Initialize branches structure if needed
          if (!state.sim.branches) {
            state.sim.branches = {
              'main': {
                history: JSON.parse(JSON.stringify(state.sim.history)),
                createdAt: new Date().toISOString()
              }
            };
            state.sim.activeBranch = 'main';
          }

          // Save current branch state
          state.sim.branches[state.sim.activeBranch].history = JSON.parse(JSON.stringify(state.sim.history));

          // Create new branch from this point (include messages up to and including selected)
          const branchHistory = state.sim.history.slice(0, index + 1);
          state.sim.branches[branchName] = {
            history: JSON.parse(JSON.stringify(branchHistory)),
            parentBranch: state.sim.activeBranch,
            forkIndex: index,
            createdAt: new Date().toISOString()
          };

          // Switch to new branch
          state.sim.activeBranch = branchName;
          state.sim.history = JSON.parse(JSON.stringify(branchHistory));

          A.State.notify();
          refreshChat();
          refreshBranchSelect();
          if (A.UI.Toast) A.UI.Toast.show(`Created branch "${branchName}"`, 'success');
        }
      }

      // Edit modal
      function openEditModal(index, msg) {
        const state = A.State.get();
        A.UI.Modal.show({
          title: `Edit ${msg.role.toUpperCase()} Message`,
          content: `
            <textarea id="edit-msg-content" class="input chat-edit-textarea" style="width:100%; min-height:120px;">${msg.content}</textarea>
          `,
          actions: [
            { label: 'Cancel', class: 'btn-ghost', onclick: () => true },
            {
              label: 'Save', class: 'btn-primary', onclick: (modal) => {
                const newContent = modal.querySelector('#edit-msg-content').value;
                state.sim.history[index].content = newContent;
                state.sim.history[index].edited = true;
                A.State.notify();
                refreshChat();
                if (A.UI.Toast) A.UI.Toast.show('Message updated', 'success');
                return true;
              }
            }
          ]
        });
      }

      // Regenerate AI message
      async function regenerateMessage(index) {
        const state = A.State.get();
        // Remove everything from this index onwards
        state.sim.history = state.sim.history.slice(0, index);
        A.State.notify();
        refreshChat();

        // Trigger a new AI response
        if (state.sim.history.length > 0) {
          const lastUserMsg = [...state.sim.history].reverse().find(m => m.role === 'user');
          if (lastUserMsg) {
            // Re-run the sendMessage logic would be complex, so just notify user
            if (A.UI.Toast) A.UI.Toast.show('Send a new message to regenerate', 'info');
          }
        }
      }


      // Initialize after definition
      refreshChat();

      const sendMessage = async () => {
        const txt = input.value.trim();
        if (!txt) return;

        // 0. Push User Message
        const state = A.State.get();
        state.sim.history.push({ role: 'user', content: txt, timestamp: new Date().toISOString() });
        input.value = '';
        refreshChat();

        sendBtn.disabled = true;
        sendBtn.textContent = 'Weaving...'; // Processing Scripts

        try {
          // 1. PROCESS ROUND (Actions 2, 4, 5)
          // This runs the Neural Stack (P->I->E->A) and returns the mutated Final State
          const roundResult = processRound(txt, state.sim.history);

          // Debug Log Scripts
          if (A.Tester) {
            roundResult.logs.forEach(l => A.Tester.log('system', l));
          }
          if (activeLens === 'trace') updateGlobalLens();

          const finalContext = roundResult.context;

          // --- PERSISTENCE WRITE-BACK ---
          const sourceDefs = state.strands && state.strands.sources ? state.strands.sources.items : {};

          Object.keys(sourceDefs).forEach(key => {
            if (sourceDefs[key].persistent && finalContext.hasOwnProperty(key)) {
              // Write back from Context (Final State) to State (Input Field)
              const oldVal = state.sim.simSources[key];
              const newVal = finalContext[key];
              if (oldVal !== newVal) {
                state.sim.simSources[key] = newVal;
                if (A.UI.Toast) A.UI.Toast.show(`Updated persistent source: ${sourceDefs[key].label || key}`, 'success');
              }
            }
          });

          // No need to force render here

          // 2. BUILD SYSTEM PROMPT (Action 6)
          // Uses the MUTATED Final State (e.g. if EROS changed Scenario, LLM sees it)

          // Helper: Strip internal AURA tags that shouldn't be sent to LLM
          const stripAuraTags = (text) => {
            if (!text) return '';
            // Remove [WORD], [WORD.WORD], [LT_WORD] patterns (AURA internal tags)
            return text.replace(/\[\s*(?:LT_)?[A-Z_]+(?:\.[A-Z_]+)?\s*\]/gi, '').replace(/\s+/g, ' ').trim();
          };

          let systemPrompt = `You are playing the role of ${finalContext.character.name}.\n`;
          if (finalContext.character.personality) systemPrompt += `[Personality: ${stripAuraTags(finalContext.character.personality)}]\n`;
          if (finalContext.character.scenario) systemPrompt += `[Scenario: ${stripAuraTags(finalContext.character.scenario)}]\n`;
          if (finalContext.tags && finalContext.tags.length) systemPrompt += `[Active Tags: ${finalContext.tags.join(', ')}]\n`;

          // Append Logic Engine Hints (Lorebook)
          if (finalContext.system_notes) {
            systemPrompt += `\n[Context Notes]:\n${finalContext.system_notes}\n`;
          }

          // Append Logic Engine Hints (Lorebook)
          if (state.sim.lastLogicResult) {
            const lore = state.sim.lastLogicResult.filter(r => r.type === 'entry').map(r => r.data.content).join('\n---\n');
            if (lore && !finalContext.system_notes) systemPrompt += `\n[Context Notes]:\n${lore}\n`;
          }

          // Append Context Summary (from auto-summarization)
          if (state.sim.contextSummary) {
            systemPrompt += `\n[Earlier Context]:\n${state.sim.contextSummary}\n`;
          }

          sendBtn.textContent = 'Thinking...'; // Calling LLM

          // Store system prompt for Prompt Inspector
          state.sim.lastSystemPrompt = systemPrompt;

          // 3. CALL LLM (Action 7)
          const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash-exp"}');
          const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{}');
          const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';
          const apiKey = keys[activeKeyName];

          if (!apiKey) throw new Error("No API Key.");

          const responseText = await callLLM(config.provider, config.model, apiKey, systemPrompt, state.sim.history);

          state.sim.history.push({ role: 'model', content: responseText, timestamp: new Date().toISOString() });
          refreshChat();

        } catch (e) {
          console.error(e);
          A.UI.Toast.show(e.message, 'error');
          state.sim.history.push({ role: 'system', content: `[Error: ${e.message}]`, timestamp: new Date().toISOString() });
          refreshChat();
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
      };

      sendBtn.onclick = sendMessage;
      input.onkeydown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      };

      chatCol.querySelector('#btn-clear-chat').onclick = () => {
        const state = A.State.get();
        state.sim.history = [];
        A.State.notify();
        refreshChat();
      };

      // --- Branch Management ---
      const branchSelect = chatCol.querySelector('#branch-select');

      function refreshBranchSelect() {
        const state = A.State.get();
        const branches = state.sim?.branches || {};
        const activeBranch = state.sim?.activeBranch || 'main';

        // Ensure at least 'main' exists
        if (!branches.main) {
          branches.main = { history: state.sim.history || [], createdAt: new Date().toISOString() };
          state.sim.branches = branches;
          state.sim.activeBranch = 'main';
        }

        branchSelect.innerHTML = '';
        Object.keys(branches).forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          const msgCount = branches[name].history?.length || 0;
          opt.textContent = `🌿 ${name} (${msgCount})`;
          if (name === activeBranch) opt.selected = true;
          branchSelect.appendChild(opt);
        });
      }

      branchSelect.onchange = () => {
        const state = A.State.get();
        const targetBranch = branchSelect.value;
        const currentBranch = state.sim.activeBranch || 'main';

        if (targetBranch === currentBranch) return;

        // Save current branch state
        if (!state.sim.branches) state.sim.branches = {};
        state.sim.branches[currentBranch] = {
          ...state.sim.branches[currentBranch],
          history: JSON.parse(JSON.stringify(state.sim.history))
        };

        // Load target branch
        const target = state.sim.branches[targetBranch];
        if (target) {
          state.sim.history = JSON.parse(JSON.stringify(target.history || []));
          state.sim.activeBranch = targetBranch;
          A.State.notify();
          refreshChat();
          if (A.UI.Toast) A.UI.Toast.show(`Switched to "${targetBranch}"`, 'info');
        }
      };

      // Initialize branch select
      refreshBranchSelect();

      chatCol.querySelector('#btn-run-all').onclick = async () => {
        if (A.Tester) {
          A.Tester.clearTrace();
          A.Tester.log('system', 'Running full simulation trace...');
          await A.Tester.runAllScripts();
          A.State.notify(); // Re-render lens to show trace
        }
      };

      // --- Story Export ---
      chatCol.querySelector('#btn-export-story').onclick = () => {
        const state = A.State.get();
        const history = state.sim?.history || [];

        if (!history.length) {
          if (A.UI.Toast) A.UI.Toast.show('No messages to export', 'warning');
          return;
        }

        // Get character name for the story
        const characterName = state.character?.char?.name || 'Character';

        // Convert chat to prose
        const storyLines = [];
        storyLines.push(`# Story Export`);
        storyLines.push(`*Featuring: ${characterName}*`);
        storyLines.push('');
        storyLines.push('---');
        storyLines.push('');

        history.forEach(msg => {
          if (msg.role === 'system') return; // Skip system messages

          let content = msg.content || '';

          // Convert *action* to italics (already markdown-style)
          // Leave formatting as-is since we're exporting to markdown

          if (msg.role === 'user') {
            // User messages as their perspective
            storyLines.push(content);
          } else if (msg.role === 'model') {
            // AI messages as the character
            storyLines.push(content);
          }

          storyLines.push(''); // Add spacing between messages
        });

        const storyText = storyLines.join('\n');

        // Create download
        const blob = new Blob([storyText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `story_${characterName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (A.UI.Toast) A.UI.Toast.show('Story exported successfully', 'success');
      };

      // --- Live Session Management ---
      const liveSessionSelect = chatCol.querySelector('#live-session-select');

      const refreshLiveSessionList = () => {
        const state = A.State.get();
        if (!state.sim.chatSessions) state.sim.chatSessions = {};
        const sessions = Object.entries(state.sim.chatSessions)
          .filter(([_, s]) => s.mode === 'live')
          .map(([name, s]) => ({ name, ...s }));

        liveSessionSelect.innerHTML = `<option value="">-- Sessions (${sessions.length}) --</option>`;
        sessions.forEach(s => {
          const msgCount = s.messages?.length || 0;
          const opt = document.createElement('option');
          opt.value = s.name;
          opt.textContent = `${s.name} (${msgCount} msgs)`;
          liveSessionSelect.appendChild(opt);
        });
      };

      refreshLiveSessionList();

      chatCol.querySelector('#btn-live-save').onclick = () => {
        const state = A.State.get();
        if (!state.sim.chatSessions) state.sim.chatSessions = {};

        const name = prompt('Session name:', `Live ${Object.keys(state.sim.chatSessions).length + 1}`);
        if (!name) return;

        state.sim.chatSessions[name] = {
          messages: JSON.parse(JSON.stringify(state.sim.history || [])),
          savedAt: new Date().toISOString(),
          mode: 'live'
        };

        A.State.notify();
        refreshLiveSessionList();
        if (A.UI.Toast) A.UI.Toast.show(`Session "${name}" saved`, 'success');
      };

      chatCol.querySelector('#btn-live-load').onclick = () => {
        const name = liveSessionSelect.value;
        if (!name) {
          if (A.UI.Toast) A.UI.Toast.show('Select a session first', 'warning');
          return;
        }

        const state = A.State.get();
        const session = state.sim.chatSessions?.[name];
        if (!session) {
          if (A.UI.Toast) A.UI.Toast.show('Session not found', 'error');
          return;
        }

        state.sim.history = JSON.parse(JSON.stringify(session.messages || []));
        A.State.notify();
        refreshChat();
        if (A.UI.Toast) A.UI.Toast.show(`Loaded "${name}"`, 'success');
      };
    }

    // --- Helper Logic (Shared/Hoisted) ---

    // Note: These need to be accessible to renderLensContent, so they are defined here in the scope of render()

    function renderLensContent(lensContent, activeLens) {
      const state = A.State.get();
      lensContent.innerHTML = '';

      if (activeLens === 'state') {
        // --- State Tab ---
        lensContent.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:16px;">
                <!-- Tags Section -->
                <section>
                  <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px; display:flex; justify-content:space-between;">
                    <span>Active Tags</span>
                    <span id="sim-tag-count" style="color:var(--accent-primary);">${state.sim.activeTags.length}</span>
                  </div>
                  <div id="sim-tags" style="display: flex; flex-wrap: wrap; gap: 4px; background: var(--bg-surface); padding: 8px; border-radius: 4px; border: 1px solid var(--border-subtle); min-height: 48px;"></div>
                  <input class="input" id="sim-add-tag" placeholder="+ Add Tag" style="margin-top: 8px; font-size: 10px; padding: 4px;">
                </section>

                <!-- Emotions Section -->
                <section>
                  <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px;">Emotion State</div>
                  <label class="l-lab" style="font-size:9px;">Current Mood</label>
                  <select class="input" id="sim-emo-current" style="font-size:11px; margin-bottom:4px;"></select>
                  <label class="l-lab" style="font-size:9px; margin-top:4px;">Active Pulses</label>
                  <div id="sim-emo-all" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; background:var(--bg-surface); padding:4px; border-radius:4px; min-height:24px;"></div>
                  <div style="margin-top:8px;">
                    <input class="input" id="sim-add-emo" placeholder="+ Pulse Emotion" style="font-size: 10px; padding: 4px;" list="dl-emotions">
                    <datalist id="dl-emotions"></datalist>
                  </div>
                </section>

                <!-- EROS Section -->
                <section>
                  <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px;">EROS Levels</div>
                  <div class="form-group" style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-secondary); margin-bottom:4px;">
                      <span>Vibe (current)</span>
                      <span id="val-eros-vibe">${state.sim.eros?.currentVibe || 0}</span>
                    </div>
                    <input type="range" class="input" id="sim-eros-vibe" min="0" max="10" step="1" value="${state.sim.eros?.currentVibe || 0}" style="padding:0; height:12px;">
                    <div id="lbl-eros-vibe" style="font-size:9px; color:var(--accent-primary); text-align:right; font-weight:bold;">NONE</div>
                  </div>
                  <div class="form-group">
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-secondary); margin-bottom:4px;">
                      <span>Long-term Relationship</span>
                      <span id="val-eros-long">${state.sim.eros?.longTerm || 0}</span>
                    </div>
                    <input type="range" class="input" id="sim-eros-long" min="0" max="10" step="1" value="${state.sim.eros?.longTerm || 0}" style="padding:0; height:12px;">
                  </div>
                </section>

                <!-- Intent Section -->
                <section>
                  <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px;">Current Intent</div>
                  <select class="input" id="sim-intent" style="font-size:11px;"></select>
                </section>

                <!-- Actors Section -->
                <section>
                  <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px;">Active Actors</div>
                  <div id="sim-actors" style="display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto; padding:8px; border:1px solid var(--border-subtle); border-radius:4px; background:var(--bg-surface);"></div>
                </section>
              </div>
            `;

        renderTags(lensContent.querySelector('#sim-tags'));
        renderEmotions(lensContent);
        renderEros(lensContent);
        renderIntents(lensContent);
        renderActors(lensContent);

        const tagInput = lensContent.querySelector('#sim-add-tag');
        if (tagInput) {
          tagInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
              const t = e.target.value.trim().toUpperCase();
              if (t && !state.sim.activeTags.includes(t)) {
                state.sim.activeTags.push(t);
                A.State.notify();
              }
              e.target.value = '';
            }
          };
        }

      } else if (activeLens === 'context') {
        // --- Context Tab ---
        const lastResult = state.sim.lastLogicResult || [];
        const loreHits = lastResult.filter(r => r.type === 'entry').map(r => r.data.title || r.data.id).join(', ') || 'None';

        lensContent.innerHTML = `
                  <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                      <div style="font-weight:bold; color:var(--text-muted); text-transform:uppercase; font-size:10px; margin-bottom:4px;">Lorebook Hits</div>
                      <div style="color:var(--accent-primary); font-size:11px; font-weight:bold;">${loreHits}</div>
                    </div>
                    <div>
                      <div style="font-weight:bold; color:var(--text-muted); text-transform:uppercase; font-size:10px; margin-bottom:4px;">Full Content Context</div>
                      <div id="ctx-preview" style="background:var(--bg-surface); padding:8px; border-radius:4px; border:1px solid var(--border-subtle); font-family:var(--font-mono); font-size:10px; white-space:pre-wrap; max-height:400px; overflow-y:auto;">Loading preview...</div>
                    </div>
                  </div>
                `;

        let previewText = "";
        if (state.seed && state.seed.persona) previewText += `--- PERSONA ---\n${state.seed.persona}\n\n`;
        if (state.seed && state.seed.scenario) previewText += `--- SCENARIO ---\n${state.seed.scenario}\n\n`;

        lastResult.forEach(res => {
          previewText += `[${res.type.toUpperCase()}: ${res.data.title || res.data.id}]\n${res.data.content}\n\n`;
        });

        lensContent.querySelector('#ctx-preview').textContent = previewText || "No context data available. Send a message to generate context.";

      } else if (activeLens === 'integrity') {
        const issues = A.Validator ? A.Validator.run(state) : [];
        if (issues.length === 0) {
          lensContent.innerHTML = '<div style="color: var(--status-success); text-align: center; padding: 20px;">All strands intact. Integrity 100%.</div>';
        } else {
          issues.forEach(issue => {
            const div = document.createElement('div');
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid var(--border-subtle)';
            div.style.color = issue.severity === 'error' ? 'var(--status-error)' : 'var(--status-warning)';
            div.innerHTML = `<strong>${issue.severity.toUpperCase()}:</strong> ${issue.message}`;
            lensContent.appendChild(div);
          });
        }

      } else if (activeLens === 'trace') {
        const log = A.Tester ? A.Tester.getTrace() : [];
        if (log.length === 0) {
          lensContent.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">No trace data. Run a simulation.</div>';
        } else {
          log.forEach(entry => {
            const row = document.createElement('div');
            row.style.padding = '4px 0';
            row.style.borderBottom = '1px solid #333';
            row.style.fontFamily = 'var(--font-mono)';
            row.style.fontSize = '10px';
            let color = '#ccc';
            if (entry.type === 'error') color = 'var(--status-error)';
            if (entry.type === 'system') color = 'var(--accent-primary)';
            row.innerHTML = `<span style="color:#666;">[${new Date(entry.timestamp).toLocaleTimeString()}]</span> <span style="color:${color}">${entry.message}</span>`;
            lensContent.appendChild(row);
          });
          lensContent.scrollTop = lensContent.scrollHeight;
        }

      } else if (activeLens === 'stats') {
        const stats = state.weaves?.stats || { blocks: [], values: {} };
        lensContent.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';

        if (!stats.blocks?.length) {
          lensContent.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No stats defined. Go to Forbidden Secrets > Stats to configure.</div>';
        } else {
          lensContent.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Stat References</div>';

          // Helper
          const renderGroup = (targetId, targetLabel) => {
            let html = `<div style="margin-top:12px; margin-bottom:8px; font-weight:bold; font-size:10px; color:var(--text-muted); text-transform:uppercase;">${targetLabel}</div>`;

            stats.blocks.forEach(blk => {
              html += `<div style="margin-left:8px; margin-bottom:8px;">`;
              html += `<div style="color:var(--text-secondary); font-size:10px; margin-bottom:4px; font-weight:bold;">${blk.label} <span style="opacity:0.5;">(${blk.id})</span></div>`;

              const vals = (stats.values[targetId] && stats.values[targetId][blk.id]) || {};

              blk.defs.forEach(def => {
                const val = vals[def.key] ?? def.min;
                html += `
                              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; background:var(--bg-elevated); padding:4px 6px; border-radius:4px;">
                                 <code style="color:var(--text-main); font-weight:bold;">{{stats.${targetId}.${blk.id}.${def.key}}}</code>
                                 <span style="color:var(--text-muted); font-size:10px;">${val}</span>
                              </div>
                          `;
              });
              html += `</div>`;
            });
            return html;
          };

          // User
          lensContent.innerHTML += renderGroup('user', 'User Identity');

          // Find an actor example
          const actors = Object.keys(stats.values).filter(k => k !== 'user');
          if (actors.length > 0) {
            lensContent.innerHTML += renderGroup(actors[0], `Actor Example (${actors[0]})`);
            if (actors.length > 1) {
              lensContent.innerHTML += `<div style="margin-top:8px; font-style:italic; color:var(--text-muted); font-size:10px;">+ ${actors.length - 1} other actors (use ID)</div>`;
            }
          }
        }
        lensContent.innerHTML += '</div>';

      } else if (activeLens === 'locations') {
        const locs = state.weaves?.locations || [];
        lensContent.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';

        if (!locs.length) {
          lensContent.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No locations defined. Go to Forbidden Secrets > Locations.</div>';
        } else {
          lensContent.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">World Map</div>';

          locs.forEach(loc => {
            const exits = (loc.exits || []).map(eid => {
              const t = locs.find(x => x.id === eid);
              return t ? (t.name || t.id) : eid;
            }).join(', ');

            lensContent.innerHTML += `
                    <div style="margin-bottom:12px; background:var(--bg-elevated); padding:8px; border-radius:4px; border:1px solid var(--border-subtle);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <strong style="color:var(--text-main);">${loc.name}</strong>
                            <span style="color:var(--text-muted); font-size:9px;">${loc.id}</span>
                        </div>
                        <div style="color:var(--text-secondary); white-space:pre-wrap; margin-bottom:6px;">${loc.description || '<em style="opacity:0.5">No description</em>'}</div>
                        <div style="font-size:10px;">
                            <span style="color:var(--text-muted); font-weight:bold;">EXITS:</span> 
                            <span style="color:var(--accent-secondary);">${exits || 'None'}</span>
                        </div>
                    </div>
                `;
          });
        }
        lensContent.innerHTML += '</div>';

      } else if (activeLens === 'prompt') {
        // PROMPT INSPECTOR - Show the last system prompt sent to LLM
        const lastPrompt = state.sim?.lastSystemPrompt || null;

        lensContent.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';
        lensContent.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">System Prompt Inspector</div>';

        if (!lastPrompt) {
          lensContent.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No prompt captured yet. Send a message to see the system prompt.</div>';
        } else {
          // Token estimate for the prompt
          const promptTokens = A.Utils?.estimateTokens ? A.Utils.estimateTokens(lastPrompt) : Math.ceil(lastPrompt.length / 4);
          lensContent.innerHTML += `<div style="margin-bottom:8px; padding:6px 8px; background:var(--bg-elevated); border-radius:4px; display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Estimated Tokens:</span>
            <span style="color:var(--accent-secondary); font-weight:bold;">${promptTokens.toLocaleString()}</span>
          </div>`;

          // The prompt itself in a scrollable code block
          lensContent.innerHTML += `<pre style="background:var(--ink-900); padding:12px; border-radius:6px; white-space:pre-wrap; word-break:break-word; max-height:400px; overflow-y:auto; border:1px solid var(--border-subtle); color:var(--text-primary);">${escapeHtml(lastPrompt)}</pre>`;

          // Copy button
          lensContent.innerHTML += `<button class="btn btn-ghost btn-sm" id="btn-copy-prompt" style="margin-top:8px; width:100%;">📋 Copy Prompt</button>`;
        }
        lensContent.innerHTML += '</div>';

        // Bind copy button
        const copyBtn = lensContent.querySelector('#btn-copy-prompt');
        if (copyBtn) {
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(lastPrompt);
            if (A.UI.Toast) A.UI.Toast.show('Prompt copied to clipboard', 'success');
          };
        }

      } else if (activeLens === 'tokens') {
        // TOKEN VISUALIZER - Show context window usage
        const lastPrompt = state.sim?.lastSystemPrompt || '';
        const history = state.sim?.history || [];

        // Estimate tokens
        const estimateTokens = A.Utils?.estimateTokens ? A.Utils.estimateTokens : (t => Math.ceil(String(t).length / 4));
        const promptTokens = estimateTokens(lastPrompt);
        const historyText = history.map(m => m.content || '').join(' ');
        const historyTokens = estimateTokens(historyText);
        const totalTokens = promptTokens + historyTokens;

        // Assume 8K context window (configurable in future)
        const maxTokens = 8000;
        const usagePercent = Math.min(100, Math.round((totalTokens / maxTokens) * 100));
        const remaining = Math.max(0, maxTokens - totalTokens);

        // Color based on usage
        let barColor = 'var(--status-success)';
        if (usagePercent > 70) barColor = 'var(--status-warning)';
        if (usagePercent > 90) barColor = 'var(--status-error)';

        lensContent.innerHTML = `
          <div style="padding:12px;">
            <div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Context Window Usage</div>
            
            <!-- Progress Bar -->
            <div style="background:var(--bg-elevated); border-radius:8px; overflow:hidden; height:24px; margin-bottom:12px; border:1px solid var(--border-subtle);">
              <div style="width:${usagePercent}%; height:100%; background:${barColor}; transition:width 0.3s ease;"></div>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:12px;">
              <span style="color:var(--text-muted);">${usagePercent}% Used</span>
              <span style="color:var(--text-primary); font-weight:bold;">${totalTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens</span>
            </div>
            
            <!-- Breakdown -->
            <div style="font-size:11px; font-family:var(--font-mono); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; padding:6px 8px; background:var(--bg-surface); border-radius:4px;">
                <span style="color:var(--text-muted);">System Prompt</span>
                <span style="color:var(--accent-primary);">${promptTokens.toLocaleString()}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding:6px 8px; background:var(--bg-surface); border-radius:4px;">
                <span style="color:var(--text-muted);">Chat History (${history.length} msgs)</span>
                <span style="color:var(--accent-secondary);">${historyTokens.toLocaleString()}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding:6px 8px; background:var(--bg-elevated); border-radius:4px; border:1px solid var(--border-subtle);">
                <span style="color:var(--text-primary); font-weight:bold;">Remaining</span>
                <span style="color:${remaining < 500 ? 'var(--status-error)' : 'var(--status-success)'}; font-weight:bold;">${remaining.toLocaleString()}</span>
              </div>
            </div>
            
            ${usagePercent > 80 ? '<div style="margin-top:12px; padding:8px; background:rgba(255,200,0,0.1); border-left:3px solid var(--status-warning); font-size:11px; color:var(--status-warning);">⚠️ Context window is filling up. Consider summarizing or clearing older messages.</div>' : ''}
            
            <!-- Summarize Controls -->
            ${history.length > 4 ? `
              <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border-subtle);">
                <div style="font-size:10px; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; font-weight:bold;">Context Management</div>
                <button class="btn btn-secondary btn-sm" id="btn-summarize-history" style="width:100%;">📝 Summarize Oldest Messages</button>
                <div style="font-size:9px; color:var(--text-muted); margin-top:4px; text-align:center;">Compresses first half of chat history into a summary</div>
              </div>
            ` : ''}
            
            ${state.sim?.contextSummary ? `
              <div style="margin-top:12px; padding:8px; background:var(--bg-surface); border-radius:4px; border:1px solid var(--border-subtle);">
                <div style="font-size:9px; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Active Summary</div>
                <div style="font-size:11px; color:var(--text-secondary); white-space:pre-wrap;">${escapeHtml(state.sim.contextSummary)}</div>
                <button class="btn btn-ghost btn-sm" id="btn-clear-summary" style="margin-top:8px; font-size:10px; width:100%;">Clear Summary</button>
              </div>
            ` : ''}
          </div>
        `;

        // Bind summarize button
        const summarizeBtn = lensContent.querySelector('#btn-summarize-history');
        if (summarizeBtn) {
          summarizeBtn.onclick = () => {
            const currentState = A.State.get();
            const currentHistory = currentState.sim?.history || [];

            if (currentHistory.length < 5) {
              if (A.UI.Toast) A.UI.Toast.show('Not enough messages to summarize', 'warning');
              return;
            }

            // Take first half of messages to summarize
            const splitPoint = Math.floor(currentHistory.length / 2);
            const toSummarize = currentHistory.slice(0, splitPoint);
            const toKeep = currentHistory.slice(splitPoint);

            // Build a simple summary
            const summaryParts = [];
            toSummarize.forEach(msg => {
              const preview = (msg.content || '').slice(0, 100);
              const role = msg.role === 'user' ? 'User' : msg.role === 'model' ? 'Character' : 'System';
              if (preview) summaryParts.push(`${role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
            });

            // Create context summary
            currentState.sim.contextSummary = `[Earlier in conversation (${toSummarize.length} messages)]\n${summaryParts.join('\n')}`;

            // Replace history with only kept messages
            currentState.sim.history = toKeep;

            A.State.notify();
            updateGlobalLens(); // Refresh to show new state
            if (typeof refreshChat === 'function') refreshChat();

            if (A.UI.Toast) A.UI.Toast.show(`Summarized ${toSummarize.length} messages`, 'success');
          };
        }

        // Bind clear summary button
        const clearSummaryBtn = lensContent.querySelector('#btn-clear-summary');
        if (clearSummaryBtn) {
          clearSummaryBtn.onclick = () => {
            const currentState = A.State.get();
            delete currentState.sim.contextSummary;
            A.State.notify();
            updateGlobalLens();
            if (A.UI.Toast) A.UI.Toast.show('Summary cleared', 'info');
          };
        }

      } else if (activeLens === 'config') {
        const config = JSON.parse(localStorage.getItem('anansi_sim_config') || '{"provider":"gemini","model":"gemini-2.0-flash"}');
        const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{"Default":""}');
        const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';

        lensContent.innerHTML = `
                  <div style="display:flex; flex-direction:column; gap:12px;">
                    <section>
                      <div style="font-weight:bold; margin-bottom:8px; color:var(--text-muted); text-transform:uppercase; font-size:10px;">LLM Provider</div>
                      <div class="form-group">
                        <label class="label" style="font-size:10px;">Provider</label>
                        <select class="input" id="sim-provider" style="font-size:11px;">
                          <option value="gemini" ${config.provider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                          <option value="openai" ${config.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                          <option value="kobold" ${config.provider === 'kobold' ? 'selected' : ''}>Kobold (Local)</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label" style="font-size:10px;">Model ID</label>
                        <input class="input" id="sim-model" value="${config.model || 'gemini-2.0-flash'}" style="font-size:11px;">
                      </div>
                    </section>
                    
                    <button class="btn btn-secondary btn-sm" id="btn-manage-keys" style="width:100%; margin-top:8px;">Manage API Keys</button>
                    <button class="btn btn-ghost btn-sm" id="sim-reset-config" style="width:100%; margin-top:8px; font-size:10px;">Reset Settings</button>
                  </div>
                `;

        // Simplified Config Logic for Brevity (Full implementation requires saving logic)
        const p = lensContent.querySelector('#sim-provider');
        const m = lensContent.querySelector('#sim-model');

        const saveConfig = () => {
          localStorage.setItem('anansi_sim_config', JSON.stringify({
            provider: p.value,
            model: m.value
          }));
        };

        p.onchange = m.onchange = saveConfig;

        lensContent.querySelector('#btn-manage-keys').onclick = () => showKeyManagerModal();
        lensContent.querySelector('#sim-reset-config').onclick = () => {
          if (confirm('Reset?')) {
            localStorage.removeItem('anansi_sim_config');
            A.State.notify();
          }
        };
      }
    }

    function showKeyManagerModal() {
      // Get current keys from localStorage
      const keys = JSON.parse(localStorage.getItem('anansi_api_keys') || '{"Default":""}');
      const activeKeyName = localStorage.getItem('anansi_active_key_name') || 'Default';

      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'key-manager-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
      `;

      // Modal container
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: var(--bg-base); border-radius: var(--radius-lg);
        border: 1px solid var(--border-default); padding: 24px;
        min-width: 400px; max-width: 500px; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;

      // Render modal content
      const renderModalContent = () => {
        const keyNames = Object.keys(keys);

        modal.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px; color:var(--text-primary);">API Key Manager</h3>
            <button id="modal-close" style="background:none; border:none; color:var(--text-muted); font-size:20px; cursor:pointer;">×</button>
          </div>
          
          <div style="margin-bottom:16px; padding:12px; background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">ACTIVE KEY</div>
            <select id="active-key-select" class="input" style="width:100%;">
              ${keyNames.map(name => `<option value="${name}" ${name === activeKeyName ? 'selected' : ''}>${name}</option>`).join('')}
            </select>
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">SAVED KEYS (${keyNames.length})</div>
            <div id="keys-list" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">
              ${keyNames.map(name => `
                <div class="key-row" data-name="${name}" style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
                  <div style="flex:1;">
                    <div style="font-size:12px; font-weight:bold; color:var(--text-primary);">${name}</div>
                    <div style="font-size:10px; color:var(--text-muted);">${keys[name] ? '••••••••' + keys[name].slice(-4) : '(not set)'}</div>
                  </div>
                  <button class="btn-edit-key btn btn-ghost btn-sm" data-name="${name}" style="font-size:10px;">Edit</button>
                  ${name !== 'Default' ? `<button class="btn-del-key btn btn-ghost btn-sm" data-name="${name}" style="font-size:10px; color:var(--status-error);">Delete</button>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div style="border-top:1px solid var(--border-subtle); padding-top:16px;">
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">ADD NEW KEY</div>
            <div style="display:flex; gap:8px; margin-bottom:8px;">
              <input id="new-key-name" class="input" placeholder="Key Name" style="flex:1;">
              <input id="new-key-value" class="input" type="password" placeholder="API Key" style="flex:2;">
            </div>
            <button id="btn-add-key" class="btn btn-primary btn-sm" style="width:100%;">+ Add Key</button>
          </div>
        `;

        // Bind events
        modal.querySelector('#modal-close').onclick = () => overlay.remove();

        modal.querySelector('#active-key-select').onchange = (e) => {
          localStorage.setItem('anansi_active_key_name', e.target.value);
        };

        modal.querySelectorAll('.btn-edit-key').forEach(btn => {
          btn.onclick = () => {
            const name = btn.dataset.name;
            const newValue = prompt(`Enter new API key for "${name}":`, keys[name] || '');
            if (newValue !== null) {
              keys[name] = newValue;
              localStorage.setItem('anansi_api_keys', JSON.stringify(keys));
              renderModalContent();
            }
          };
        });

        modal.querySelectorAll('.btn-del-key').forEach(btn => {
          btn.onclick = () => {
            const name = btn.dataset.name;
            if (confirm(`Delete key "${name}"?`)) {
              delete keys[name];
              localStorage.setItem('anansi_api_keys', JSON.stringify(keys));
              // If we deleted the active key, switch to Default
              if (localStorage.getItem('anansi_active_key_name') === name) {
                localStorage.setItem('anansi_active_key_name', 'Default');
              }
              renderModalContent();
            }
          };
        });

        modal.querySelector('#btn-add-key').onclick = () => {
          const nameInput = modal.querySelector('#new-key-name');
          const valueInput = modal.querySelector('#new-key-value');
          const name = nameInput.value.trim();
          const value = valueInput.value.trim();

          if (!name) {
            alert('Please enter a key name.');
            return;
          }
          if (keys[name]) {
            alert('A key with this name already exists.');
            return;
          }

          keys[name] = value;
          localStorage.setItem('anansi_api_keys', JSON.stringify(keys));
          renderModalContent();
        };
      };

      renderModalContent();
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };
    }

    // Dummy implementations for render helpers to prevent errors if they weren't copied fully
    // If they exist in original file, this might duplicate, but we are replacing the end of file.
    // Ideally we should have kept them.

    function renderTags(target) {
      if (!target) return;
      const state = A.State.get();
      target.innerHTML = (state.sim.activeTags || []).map(t =>
        `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:2px 6px; border-radius:4px; font-size:10px; cursor:pointer;" data-tag="${t}">${t} ×</span>`
      ).join('');
      target.querySelectorAll('span').forEach(sp => {
        sp.onclick = () => {
          state.sim.activeTags = state.sim.activeTags.filter(x => x !== sp.dataset.tag);
          A.State.notify();
        };
      });
    }

    function renderEmotions(container) {
      const state = A.State.get();
      const curSel = container.querySelector('#sim-emo-current');
      const allBoxes = container.querySelector('#sim-emo-all');
      const addInp = container.querySelector('#sim-add-emo');
      const dl = container.querySelector('#dl-emotions');

      const emotions = A.EMOTIONS || [];

      // Current Mood Dropdown
      curSel.innerHTML = emotions.map(e => `<option value="${e}" ${e === state.sim.emotions.current ? 'selected' : ''}>${e}</option>`).join('');
      curSel.onchange = (e) => {
        state.sim.emotions.current = e.target.value;
        A.State.notify();
      };

      // Datalist for Pulses
      dl.innerHTML = emotions.map(e => `<option value="${e}">`).join('');

      // Active Pulses
      allBoxes.innerHTML = (state.sim.emotions.all || []).map(e =>
        `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:1px 4px; border-radius:4px; font-size:9px; cursor:pointer;" data-emo="${e}">${e} ×</span>`
      ).join('');

      allBoxes.querySelectorAll('span').forEach(sp => {
        sp.onclick = () => {
          state.sim.emotions.all = state.sim.emotions.all.filter(x => x !== sp.dataset.emo);
          A.State.notify();
        };
      });

      // Add Pulse
      addInp.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const val = e.target.value.trim().toUpperCase();
          if (val && !state.sim.emotions.all.includes(val)) {
            state.sim.emotions.all.push(val);
            A.State.notify();
          }
          e.target.value = '';
        }
      };
    }

    function renderEros(container) {
      const state = A.State.get();
      const vibeInp = container.querySelector('#sim-eros-vibe');
      const longInp = container.querySelector('#sim-eros-long');
      const vibeVal = container.querySelector('#val-eros-vibe');
      const longVal = container.querySelector('#val-eros-long');
      const vibeLbl = container.querySelector('#lbl-eros-vibe');

      const levels = A.EROS_LEVELS || {};

      const updateLabs = () => {
        if (!vibeVal) return;
        vibeVal.textContent = vibeInp.value;
        longVal.textContent = longInp.value;
        const lv = Object.entries(levels).find(([k, v]) => v == vibeInp.value);
        vibeLbl.textContent = lv ? lv[0] : '';
      };

      if (vibeInp) {
        [vibeInp, longInp].forEach(inp => {
          inp.oninput = updateLabs;
          inp.onchange = () => {
            state.sim.eros.currentVibe = parseInt(vibeInp.value);
            state.sim.eros.longTerm = parseInt(longInp.value);
            A.State.notify();
          };
        });
        updateLabs();
      }
    }

    function renderIntents(container) {
      const state = A.State.get();
      const sel = container.querySelector('#sim-intent');
      const intents = A.INTENTS || [];

      if (sel) {
        sel.innerHTML = intents.map(i => `<option value="${i}" ${i === state.sim.intent ? 'selected' : ''}>${i}</option>`).join('');
        sel.onchange = (e) => {
          state.sim.intent = e.target.value;
          A.State.notify();
        };
      }
    }

    function renderActors(container) {
      const state = A.State.get();
      const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];

      if (actors.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:10px;">No actors defined.</div>';
        return;
      }

      container.innerHTML = actors.map(a => `
                <label style="display:flex; align-items:center; gap:8px; font-size:11px; cursor:pointer;">
                    <input type="checkbox" data-id="${a.id}" ${state.sim.actors.includes(a.id) ? 'checked' : ''}>
                    <span>${a.name || a.id}</span>
                </label>
            `).join('');

      container.querySelectorAll('input').forEach(chk => {
        chk.onchange = (e) => {
          const id = e.target.dataset.id;
          if (e.target.checked) {
            if (!state.sim.actors.includes(id)) state.sim.actors.push(id);
          } else {
            state.sim.actors = state.sim.actors.filter(x => x !== id);
          }
          A.State.notify();
        };
      });
    }

    function renderTags(target) {
      if (!target) return;
      const state = A.State.get();
      target.innerHTML = (state.sim.activeTags || []).map(t =>
        `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:2px 6px; border-radius:4px; font-size:10px; cursor:pointer;" data-tag="${t}">${t} ×</span>`
      ).join('');
      target.querySelectorAll('span').forEach(sp => {
        sp.onclick = () => {
          state.sim.activeTags = state.sim.activeTags.filter(x => x !== sp.dataset.tag);
          A.State.notify();
        };
      });
    }
  }



  A.registerPanel('simulator', {
    label: 'The Spindle',
    subtitle: 'Logic Simulator',
    category: 'Magic',
    render: render
  });

  // --- CORE LOGIC: THE ROUND ---
  function processRound(userText, history) {
    try {
      const state = A.State.get();
      const logs = [];

      // 1. ACTION 2: RESET WRITABLE FIELDS (Build Context from Source of Truth)
      // Resolve Sources
      const definedSources = (state.strands && state.strands.sources && state.strands.sources.items) ? state.strands.sources.items : {};
      const rawSources = {};

      // Merge keys
      const allSourceKeys = new Set([
        ...Object.keys(definedSources),
        ...Object.keys(state.sim.simSources || {}),
        'character.name', 'character.personality', 'character.scenario', 'user.name'
      ]);

      allSourceKeys.forEach(key => {
        const src = definedSources[key] || { id: key, defaultValue: '' };
        let val = state.sim?.simSources?.[key]; // Priority 1: Sim

        if (!val) { // Priority 2: Seed
          if (!state.seed) state.seed = {}; // Safeguard
          if (key === 'character.name' || key === 'name') val = state.seed.name;
          else if (key === 'character.personality' || key === 'personality') val = state.seed.persona;
          else if (key === 'character.scenario' || key === 'scenario') val = state.seed.scenario;
          else if (key === 'user.name') val = state.meta?.author || 'User';
        }
        if (!val && val !== '') val = src.defaultValue; // Priority 3: Default
        rawSources[key] = val || '';
      });

      // Construct Chat History with Legacy Support
      const chatHistory = history.map(m => {
        const txt = m.content || '';
        return {
          role: m.role,
          content: txt,
          mes: txt,      // Lorebook Legacy
          message: txt,  // SBX Legacy
          name: m.role === 'user' ? (rawSources['user.name'] || 'User') : (rawSources['character.name'] || 'Char')
        };
      });

      // 3. Final Context Construction
      const hybridChat = [...chatHistory];
      hybridChat.last_messages = chatHistory;

      const context = {
        // Standard Aliases
        chat: hybridChat,
        messages: chatHistory,

        // Flatten Sources
        ...rawSources,
        sources: rawSources,

        // Shim for Character Object (Writable targets)
        character: {
          name: rawSources['character.name'] || rawSources.name || 'Unknown',
          personality: rawSources['character.personality'] || rawSources.personality || '',
          description: rawSources['character.description'] || rawSources.description || '',
          scenario: rawSources['character.scenario'] || rawSources.scenario || '',
          example: rawSources['character.exampleDialogs'] || rawSources.example || ''
        },

        tags: [...(state.sim?.activeTags || [])],
        // Inject Stats
        stats: state.weaves?.stats?.values || {},
        // Inject Locations
        locations: state.weaves?.locations || [],
        // Inject Actors
        actors: [...(state.sim?.actors || [])]
      };

      // Snapshot for Diffing
      const snapshot = JSON.parse(JSON.stringify(context));

      // NOTE: All rule evaluation (lorebook, microcues, voices, events, etc.)
      // now happens inside the instrumented AURA script built by AuraSimBuilder.
      // This ensures correct execution order (e.g., emotion signals available for lorebook).

      // 2. ACTION 4: RUN SCRIPTS SEQUENTIALLY
      let scripts = A.Scripts.getAll();
      const executionOrder = ['sys_pulse', 'sys_intent', 'sys_eros', 'sys_aura'];

      scripts.sort((a, b) => {
        const aIdx = executionOrder.indexOf(a.id);
        const bIdx = executionOrder.indexOf(b.id);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return 0;
      });

      // Dynamic Stack Injection (sys_aura) - Use INSTRUMENTED SimBuilder for accurate logging
      if (A.AuraSimBuilder) {
        const auraScript = scripts.find(s => s.id === 'sys_aura');
        if (auraScript && auraScript.enabled) {
          try {
            const dynamicCode = A.AuraSimBuilder.build(state);
            scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
            logs.push("AURA Stack Compiled (Instrumented)");
          } catch (e) { logs.push("AURA SimBuild Failed: " + e.message); }
        }
      } else if (A.AuraBuilder) {
        // Fallback to regular builder if SimBuilder not available
        const auraScript = scripts.find(s => s.id === 'sys_aura');
        if (auraScript && auraScript.enabled) {
          try {
            const dynamicCode = A.AuraBuilder.build(state);
            scripts = scripts.map(s => s.id === 'sys_aura' ? { ...s, source: { code: dynamicCode } } : s);
            logs.push("AURA Stack Compiled");
          } catch (e) { logs.push("AURA Build Failed: " + e.message); }
        }
      }

      // Execute
      const scriptLogs = [];

      scripts.forEach(script => {
        if (!script.enabled) return;
        const logger = {
          log: (...args) => scriptLogs.push(`[${script.name}] ${args.join(' ')}`),
          warn: (...args) => scriptLogs.push(`[${script.name}] WARN: ${args.join(' ')}`),
          error: (...args) => scriptLogs.push(`[${script.name}] ERROR: ${args.join(' ')}`),
          info: (...args) => scriptLogs.push(`[${script.name}] INFO: ${args.join(' ')}`)
        };
        try {
          const runFn = new Function('context', 'console', 'A', `
                        "use strict";
                        try { ${script.source.code} } 
                        catch (e) { console.error(e.message); }
                    `);
          runFn(context, logger, A);
        } catch (err) {
          scriptLogs.push(`[${script.name}] CRITICAL: ${err.message}`);
        }
      });

      // Log script execution results
      if (A.FlowLogger) {
        scripts.forEach(script => {
          A.FlowLogger.log({
            name: script.name,
            type: 'script',
            passed: script.enabled,
            reason: script.enabled ? 'Script executed' : 'Script disabled'
          });
        });
        A.FlowLogger.endTurn();
      }

      // 3. ACTION 5: FINAL STATE ACHIEVED
      return {
        context: context,
        logs: scriptLogs,
        snapshot: snapshot,
        diff: calculateDiff(snapshot, context)
      };

    } catch (err) {
      console.error("[LogicEngine] Critical Error in processRound:", err);
      if (A.UI && A.UI.Toast) A.UI.Toast.show("Logic Engine Crash: " + err.message, 'error');
      // Return a safe fallback to prevent infinite loops or UI freeze
      return {
        context: {},
        logs: ["CRITICAL EXECUTION FAILURE: " + err.message],
        snapshot: {},
        diff: { fields: [], tags: [] }
      };
    }
  }

  function calculateDiff(snapshot, context) {
    const diff = { fields: [], tags: [] };
    ['personality', 'scenario', 'example', 'description'].forEach(k => {
      const oldVal = snapshot.character[k] || '';
      const newVal = context.character[k] || '';
      if (oldVal !== newVal) {
        if (newVal.startsWith(oldVal)) {
          diff.fields.push({ type: 'append', key: k, val: newVal.substring(oldVal.length), addedLength: newVal.length - oldVal.length });
        } else {
          diff.fields.push({ type: 'modify', key: k });
        }
      }
    });
    return diff;
  }

  // --- API CLIENT ---
  async function callLLM(provider, model, key, system, history) {
    console.log(`[LLM] Calling ${provider} (${model})...`);

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const payload = {
        contents: contents,
        system_instruction: { parts: [{ text: system }] },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024
        }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || resp.statusText);
      }

      const data = await resp.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
    }

    if (provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [
        { role: 'system', content: system },
        ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
      ];

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.9
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || resp.statusText);
      }

      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "(No response)";
    }

    throw new Error(`Unknown provider: ${provider}`);
  }

})(window.Anansi);
