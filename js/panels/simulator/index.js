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

    // Use standard flex layout that fills available space
    container.className = 'flex-col h-full overflow-hidden gap-md';
    // container.style.height = '100%'; // Redundant with h-full

    // --- Mode Toggle Header ---
    const modeHeader = document.createElement('div');
    modeHeader.className = 'flex-col gap-sm mb-sm';
    modeHeader.innerHTML = `
      <div class="flex-row gap-sm">
        <button class="btn btn-sm spindle-mode-btn flex-1" data-mode="simulated">Simulated</button>
        <button class="btn btn-sm spindle-mode-btn flex-1" data-mode="live">Live</button>
      </div>
      <div class="p-sm bg-surface rounded-md text-xs text-muted leading-snug">
        <strong class="text-secondary">Simulated</strong>: Dry-run with mock responses (fast, no API needed). 
        <strong class="text-secondary">Live</strong>: Real LLM calls using your API key.
      </div>
    `;
    container.appendChild(modeHeader);

    // --- Content Container ---
    const contentArea = document.createElement('div');
    contentArea.className = 'flex-1 flex-col overflow-hidden';
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
        updateGlobalLens(); // Ensure lens is active in Simulated mode
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
          <div class="lens-tabs flex-row flex-wrap gap-xs mb-sm border-b pb-xs">
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
              <button class="btn btn-ghost btn-sm lens-tab-btn ${activeLens === o.k ? 'active' : ''} text-tiny px-sm py-xs items-center justify-center min-w-0"
                      style="white-space:nowrap; ${activeLens === o.k ? 'background:var(--bg-surface); color:var(--text-primary); border:1px solid var(--border-subtle);' : ''}"
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
      target.className = 'panel-grid gap-md h-full overflow-hidden';
      // Use standard grid columns for split view (approx 1/3 - 2/3)
      target.style.gridTemplateColumns = '320px 1fr';

      // Left: Sources Configuration
      const sourcesCard = document.createElement('div');
      sourcesCard.className = 'card flex-col mb-0 h-full';
      sourcesCard.innerHTML = `
        <div class="card-header">
          <strong>Sources Override</strong>
          <button class="btn btn-ghost btn-sm" id="btn-reset-sources" title="Reset all overrides">Reset</button>
        </div>
        <div class="card-body scroll-y p-md flex-1" id="sim-sources-list"></div>
      `;
      target.appendChild(sourcesCard);

      // Right: Results & Controls
      const rightCol = document.createElement('div');
      rightCol.className = 'flex-col gap-md overflow-hidden h-full';

      // Message History
      const msgCard = document.createElement('div');
      msgCard.className = 'card flex-col mb-0 flex-none';
      msgCard.style.maxHeight = '30%';
      msgCard.innerHTML = `
        <div class="card-header flex-wrap gap-sm">
          <strong>Message Context</strong>
          <div class="flex-row gap-xs items-center">
            <select class="input text-xs py-0 px-sm w-auto min-w-[100px]" id="sim-session-select">
              <option value="">-- Sessions --</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="btn-load-session" title="Load selected session">Load</button>
            <button class="btn btn-ghost btn-sm" id="btn-save-session" title="Save current as session">Save</button>
            <div class="border-l border-subtle h-4 mx-sm"></div>
            <button class="btn btn-ghost btn-sm" id="btn-add-msg">+ Msg</button>
            <button class="btn btn-ghost btn-sm text-error" id="btn-clear-msgs">Reset</button>
          </div>
        </div>
        <div class="card-body scroll-y p-0 flex-1" id="sim-msg-list"></div>
      `;
      rightCol.appendChild(msgCard);

      // Execution Log
      const runCard = document.createElement('div');
      runCard.className = 'card flex-1 flex-col mb-0 min-h-0 flex-none';
      runCard.innerHTML = `
        <div class="card-header border-b border-subtle bg-ink-700">
          <div class="flex-row items-center gap-sm">
             <strong>Simulation</strong>
             <span id="sim-run-time" class="text-xs text-muted font-mono"></span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm" id="btn-flow-explorer">📊 Flow Explorer</button>
            <button class="btn btn-primary btn-sm" id="btn-run-sim">▶ Recall</button>
          </div>
        </div>
        <div class="card-body p-md bg-app" id="sim-output">
          <div class="text-muted text-center text-xs">
             Set sources and messages, then click <strong>Recall</strong> to run simulation.
          </div>
        </div>
      `;
      rightCol.appendChild(runCard);

      // State Impact (Diff)
      const diffCard = document.createElement('div');
      diffCard.className = 'card flex-col mb-0 flex-1 min-h-0';
      diffCard.style.minHeight = '160px';
      diffCard.innerHTML = `
        <div class="card-header border-t-accent" style="border-top-width:2px; border-top-style:solid;">
          <strong>State Impact</strong>
          <span class="text-tiny text-muted text-uppercase" style="letter-spacing:0.5px;">Context Delta</span>
        </div>
        <div class="card-body scroll-y p-sm text-xs bg-ink-800 flex-1" id="sim-diff-view">
           <div class="text-muted italic opacity-60">No changes recorded.</div>
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
