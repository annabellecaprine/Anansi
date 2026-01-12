/*
 * Anansi Panel: The Spindle (Logic Simulator & Debugger)
 * File: js/panels/simulator.js
 * Purpose: Main panel registration and mode switching. 
 *          Delegates to simulator-llm.js, simulator-lens.js, and simulator-live.js.
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

  function render(container, context) {
    // Context override for Lens
    if (context && context.activeLens) {
      localStorage.setItem('anansi_sim_active_lens', context.activeLens);
    }

    // Initialize specific SIM state if missing or incomplete
    const _s = A.State.get();

    if (_s) {
      if (!_s.sim) _s.sim = {};
      if (!_s.sim.history) _s.sim.history = [];
      if (!_s.sim.activeTags) _s.sim.activeTags = [];
      if (!_s.sim.simSources) _s.sim.simSources = {};
      if (!_s.sim.simMessages) _s.sim.simMessages = [];
      if (!_s.sim.actors) _s.sim.actors = [];
      if (!_s.sim.emotions) _s.sim.emotions = { current: 'NEUTRAL', all: [] };
      if (!_s.sim.eros) _s.sim.eros = { currentVibe: 0, longTerm: 0 };
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
    modeHeader.style.flexDirection = 'column';
    modeHeader.style.gap = '8px';
    modeHeader.style.marginBottom = '8px';
    modeHeader.innerHTML = `
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm spindle-mode-btn" data-mode="simulated" style="flex:1;">Simulated</button>
        <button class="btn btn-sm spindle-mode-btn" data-mode="live" style="flex:1;">Live</button>
      </div>
      <div style="font-size:11px; color:var(--text-muted); padding:8px 12px; background:var(--bg-surface); border-radius:6px; line-height:1.4;">
        <strong style="color:var(--text-secondary);">Simulated</strong>: Dry-run with mock responses (fast, no API needed). 
        <strong style="color:var(--text-secondary);">Live</strong>: Real LLM calls using your API key.
      </div>
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
      updateTour();
    }

    function updateTour() {
      if (!A.UI.Tour) return;

      if (currentMode === 'simulated') {
        A.UI.Tour.register('simulator', [
          { target: '#sim-sources-list', title: 'Source Overrides', content: 'Manually inject values for any defined Source.' },
          { target: '#sim-msg-list', title: 'Context Injection', content: 'Draft a mock conversation history to seed the simulation.' },
          { target: '#btn-run-sim', title: 'Recall (Execute)', content: 'Runs the Logic Engine without calling the LLM.' },
          { target: '#sim-diff-view', title: 'State Impact', content: 'See exactly how inputs changed the world state.' }
        ]);
      } else {
        A.UI.Tour.register('simulator', [
          { target: '#sim-chat-log', title: 'Live Spindle', content: 'A real-time chat interface with the AI.' },
          { target: '#sim-input', title: 'Weaving', content: 'Type your message here. The AI responds based on current Persona, Scenario, and Context.' },
          { target: '#btn-run-all', title: 'Trace Debugging', content: 'Run a full logic trace on the current state without generating a reply.' }
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
        // Delegate to SimulatorLive module
        if (A.SimulatorLive && A.SimulatorLive.renderLiveMode) {
          A.SimulatorLive.renderLiveMode(contentArea, { updateGlobalLens, activeLens });
        } else {
          contentArea.innerHTML = '<div class="empty-state">Live mode module not loaded.</div>';
        }
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
            { k: 'arc', l: 'Arc' },
            { k: 'context', l: 'Ctx' },
            { k: 'prompt', l: 'Prompt' },
            { k: 'tokens', l: 'Tokens' },
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
        // Delegate to SimulatorLens module
        if (A.SimulatorLens && A.SimulatorLens.renderLensContent) {
          A.SimulatorLens.renderLensContent(inner, activeLens, { updateGlobalLens });
        }
      });
    };

    // --- SIMULATED MODE ---
    function renderSimulatedMode(target) {
      target.style.display = 'grid';
      target.style.gridTemplateColumns = '35% 65%';
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

      // Message History
      const msgCard = document.createElement('div');
      msgCard.className = 'card';
      msgCard.style.flex = '0 0 auto';
      msgCard.style.maxHeight = '30%';
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

      // Execution Log
      const runCard = document.createElement('div');
      runCard.className = 'card';
      runCard.style.flex = '1';
      runCard.style.display = 'flex';
      runCard.style.flexDirection = 'column';
      runCard.style.marginBottom = '0';
      runCard.style.minHeight = '0';
      runCard.style.flex = '0 0 auto';
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
          </div>
        </div>
      `;
      rightCol.appendChild(runCard);

      // State Impact (Diff)
      const diffCard = document.createElement('div');
      diffCard.className = 'card';
      diffCard.style.marginBottom = '0';
      diffCard.style.flex = '0 0 35%';
      diffCard.style.display = 'flex';
      diffCard.style.flexDirection = 'column';
      diffCard.style.minHeight = '160px';
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

      // Populate and bind
      renderSourcesConfig();
      renderMessageHistory();
      updateGlobalLens();

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

      // Session Management
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

      const flowBtn = runCard.querySelector('#btn-flow-explorer');
      if (flowBtn) flowBtn.onclick = () => A.UI.switchPanel('flow-explorer');

      runCard.querySelector('#btn-run-sim').onclick = () => {
        runSimulation();
        updateGlobalLens();
        renderDiffPanel(diffCard.querySelector('#sim-diff-view'));
      };
    }

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
      if (diff.fields && diff.fields.length) {
        html += `<div style="font-weight:bold; font-size:10px; margin-bottom:8px; color:var(--text-secondary); text-transform:uppercase;">Context Updates</div>`;
        diff.fields.forEach(f => {
          if (f.type === 'append') {
            html += `<div style="margin-bottom:8px; border-left:3px solid var(--accent-primary); padding-left:8px;">
              <span style="color:var(--accent-primary); font-weight:bold; font-size:10px;">${f.key.toUpperCase()}</span>
              <span style="color:var(--text-muted); font-size:9px;">+${f.addedLength} chars</span>
              <div style="background:var(--bg-surface); padding:6px; border-radius:4px; margin-top:4px; font-family:var(--font-mono); white-space:pre-wrap;">${f.val}</div>
            </div>`;
          } else if (f.type === 'modify') {
            html += `<div style="margin-bottom:8px; border-left:3px solid var(--status-warning); padding-left:8px;">
              <span style="color:var(--status-warning); font-weight:bold; font-size:10px;">${f.key.toUpperCase()}</span> modified
            </div>`;
          }
        });
      }

      if (diff.tags && diff.tags.length) {
        html += `<div style="font-weight:bold; font-size:10px; margin-top:12px; margin-bottom:8px; color:var(--text-secondary); text-transform:uppercase;">Tags Emitted</div>`;
        html += `<div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${diff.tags.map(t => `<span style="background:rgba(60, 177, 121, 0.2); border:1px solid var(--status-success); color:var(--status-success); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:bold;">${t}</span>`).join('')}
        </div>`;
      }

      container.innerHTML = html || '<div style="color:var(--text-muted); font-style:italic; opacity:0.6;">Scripts ran, but no context changes were detected.</div>';
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
            <div style="font-size:11px;">No sources defined</div>
            <div style="font-size:9px; opacity:0.7;">Add in Sources Panel</div>
          </div>
        `;
        return;
      }

      sourceKeys.forEach(key => {
        const src = sources[key];
        const currentVal = state.sim.simSources[key] ?? '';
        const isPersistent = src.persistent || false;

        const row = document.createElement('div');
        row.style.marginBottom = '12px';
        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <label style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">
                ${src.label || key} <code style="font-size:9px; color:grey;">${src.kind}</code>
              </label>
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

      list.querySelectorAll('.sim-source-input').forEach(input => {
        input.oninput = input.onchange = () => {
          const state = A.State.get();
          state.sim.simSources[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value;
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
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7; padding:16px;">
            <div style="margin-bottom:16px;">Start a Conversation</div>
            <button class="btn btn-secondary" id="btn-add-first-msg">Add Message</button>
          </div>
        `;
        const startBtn = list.querySelector('#btn-add-first-msg');
        if (startBtn) startBtn.onclick = () => addMessage('user');
        return;
      }

      messages.forEach((msg, idx) => {
        const row = document.createElement('div');
        row.style.padding = '8px 12px';
        row.style.borderBottom = '1px solid var(--border-subtle)';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'flex-start';
        row.innerHTML = `
          <div style="cursor:pointer; min-width:40px; font-size:10px; font-weight:bold; color:${msg.role === 'user' ? 'var(--accent-primary)' : 'var(--status-success)'}; text-transform:uppercase; margin-top:4px;" class="sim-msg-role" data-idx="${idx}">
            ${msg.role}
          </div>
          <textarea class="input sim-msg-content" data-idx="${idx}" rows="2" style="flex:1; font-size:11px;" placeholder="Message content...">${msg.content}</textarea>
          <button class="btn btn-ghost btn-sm sim-msg-del" data-idx="${idx}" style="color:var(--status-error); padding:2px 6px;">✕</button>
        `;
        list.appendChild(row);
      });

      list.querySelectorAll('.sim-msg-role').forEach(div => {
        div.onclick = () => {
          const state = A.State.get();
          const idx = parseInt(div.dataset.idx);
          state.sim.simMessages[idx].role = state.sim.simMessages[idx].role === 'user' ? 'ai' : 'user';
          A.State.notify();
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
    }

    function addMessage(role = 'user') {
      const state = A.State.get();
      if (!state.sim.simMessages) state.sim.simMessages = [];
      state.sim.simMessages.push({ role, content: '' });
      A.State.notify();
      renderMessageHistory();

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
      output.innerHTML = '';

      const simState = A.State.get();
      const turnNumber = (simState.sim?.executionLog?.length || 0) + 1;
      const lastMsg = (simState.sim?.simMessages || []).slice(-1)[0];
      const userMessage = lastMsg?.content || '(No message)';
      if (A.FlowLogger) A.FlowLogger.startTurn(turnNumber, userMessage);

      // Use simulator-llm.js processRound
      const result = A.Simulator.processRound("", simState.sim?.simMessages || []);

      const logs = result.logs;
      const context = result.context;
      const diff = result.diff;

      if (A.Tester) {
        A.Tester.clear();
        A.Tester.log('system', `Simulation Run #${turnNumber}`);
        A.Tester.log('info', `User Message: ${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}`);
        logs.forEach(log => A.Tester.log('info', log));
        A.Tester.log('system', 'Simulation Complete');
      }

      // Persistence write-back
      const sourceDefs = simState.strands && simState.strands.sources ? simState.strands.sources.items : {};
      Object.keys(sourceDefs).forEach(key => {
        if (sourceDefs[key].persistent && context.hasOwnProperty(key)) {
          const oldVal = simState.sim.simSources[key];
          const newVal = context[key];
          if (oldVal !== newVal) {
            simState.sim.simSources[key] = newVal;
            if (A.UI.Toast) A.UI.Toast.show(`Updated persistent source: ${sourceDefs[key].label || key}`, 'success');
          }
        }
      });

      const sourcesList = contentArea.querySelector('#sim-sources-list');
      if (sourcesList && sourcesList.isConnected) renderSourcesConfig();

      simState.sim.lastDiff = diff;
      A.State.notify();

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

    // Initial render
    updateModeButtons();
    renderContent();
  }

  A.registerPanel('simulator', {
    label: 'The Spindle',
    subtitle: 'Logic Simulator',
    category: 'Magic',
    render: render
  });

})(window.Anansi);
