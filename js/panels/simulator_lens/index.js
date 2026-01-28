/*
 * Anansi Simulator - Lens Content Renderers
 * File: js/panels/simulator-lens.js
 * Purpose: Renders lens panel content for the Simulator (State, Arc, Context, Prompt, Tokens, etc.)
 * Extracted from simulator.js for better maintainability.
 */

(function (A) {
  'use strict';

  // Helper: Escape HTML for safe display
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Main Lens Content Renderer
   * @param {HTMLElement} lensContent - Container to render into
   * @param {string} activeLens - Active lens tab key
   * @param {Object} options - Additional options (updateGlobalLens, refreshChat callbacks)
   */
  function renderLensContent(lensContent, activeLens, options = {}) {
    const state = A.State.get();

    // Safety: Ensure state.sim exists if viewing lens before running simulator
    if (!state.sim) state.sim = {};
    if (!state.sim.activeTags) state.sim.activeTags = [];
    if (!state.sim.emotions) state.sim.emotions = { current: 'NEUTRAL', all: [] };
    if (!state.sim.eros) state.sim.eros = { currentVibe: 0, longTerm: 0 };
    if (!state.sim.history) state.sim.history = [];

    lensContent.innerHTML = '';

    if (activeLens === 'state') {
      renderStateLens(lensContent, state);
    } else if (activeLens === 'arc') {
      renderArcLens(lensContent, state);
    } else if (activeLens === 'context') {
      renderContextLens(lensContent, state);
    } else if (activeLens === 'integrity') {
      renderIntegrityLens(lensContent, state);
    } else if (activeLens === 'trace') {
      renderTraceLens(lensContent);
    } else if (activeLens === 'stats') {
      renderStatsLens(lensContent, state);
    } else if (activeLens === 'locations') {
      renderLocationsLens(lensContent, state);
    } else if (activeLens === 'prompt') {
      renderPromptLens(lensContent, state);
    } else if (activeLens === 'tokens') {
      renderTokensLens(lensContent, state, options);
    } else if (activeLens === 'config') {
      renderConfigLens(lensContent);
    }
  }

  // --- State Lens ---
  function renderStateLens(lensContent, state) {
    lensContent.innerHTML = `
      <div class="flex-col gap-md">
        <!-- Tags Section -->
        <section>
          <div class="text-tiny font-bold text-muted text-uppercase mb-xs flex-row justify-between">
            <span>Active Tags</span>
            <span id="sim-tag-count" class="text-accent">${state.sim.activeTags?.length || 0}</span>
          </div>
          <div id="sim-tags" class="flex-row flex-wrap gap-xs bg-surface p-sm rounded border border-subtle min-h-[48px]"></div>
          <input class="input w-full mt-sm text-tiny p-xs" id="sim-add-tag" placeholder="+ Add Tag">
        </section>

        <!-- Emotions Section -->
        <section>
          <div class="text-tiny font-bold text-muted text-uppercase mb-sm">Emotion State</div>
          <label class="text-tiny text-muted mb-xs block">Current Mood</label>
          <select class="input w-full text-xs" id="sim-emo-current"></select>
          <label class="text-tiny text-muted mt-sm mb-xs block">Active Pulses</label>
          <div id="sim-emo-all" class="flex-row flex-wrap gap-xs bg-surface p-xs rounded min-h-[24px]"></div>
          <div class="mt-sm">
            <input class="input w-full text-tiny p-xs" id="sim-add-emo" placeholder="+ Pulse Emotion" list="dl-emotions">
            <datalist id="dl-emotions"></datalist>
          </div>
        </section>

        <!-- EROS Section -->
        <section>
          <div class="text-tiny font-bold text-muted text-uppercase mb-sm">EROS Levels</div>
          <div class="form-group mb-sm">
            <div class="flex-row justify-between text-tiny text-secondary mb-xs">
              <span>Vibe (current)</span>
              <span id="val-eros-vibe">${state.sim.eros?.currentVibe || 0}</span>
            </div>
            <input type="range" class="input w-full h-3 p-0" id="sim-eros-vibe" min="0" max="10" step="1" value="${state.sim.eros?.currentVibe || 0}">
            <div id="lbl-eros-vibe" class="text-tiny text-accent text-right font-bold">NONE</div>
          </div>
          <div class="form-group">
            <div class="flex-row justify-between text-tiny text-secondary mb-xs">
              <span>Long-term Relationship</span>
              <span id="val-eros-long">${state.sim.eros?.longTerm || 0}</span>
            </div>
            <input type="range" class="input w-full h-3 p-0" id="sim-eros-long" min="0" max="10" step="1" value="${state.sim.eros?.longTerm || 0}">
          </div>
        </section>

        <!-- Intent Section -->
        <section>
          <div class="text-tiny font-bold text-muted text-uppercase mb-sm">Current Intent</div>
          <select class="input w-full text-xs" id="sim-intent"></select>
        </section>

        <!-- Actors Section -->
        <section>
          <div style="font-weight: bold; color: var(--text-muted); text-transform: uppercase; font-size: 10px; margin-bottom: 8px;">Active Actors</div>
          <div id="sim-actors" style="display:flex; flex-direction:column; gap:4px; max-height:120px; overflow-y:auto; padding:8px; border:1px solid var(--border-subtle); border-radius:4px; background:var(--bg-surface);"></div>
        </section>
      </div>
    `;

    renderTags(lensContent.querySelector('#sim-tags'), state);
    renderEmotions(lensContent, state);
    renderEros(lensContent, state);
    renderIntents(lensContent, state);
    renderActors(lensContent.querySelector('#sim-actors'), state);

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
  }

  // --- Arc Lens (Emotional Timeline) ---
  function renderArcLens(lensContent, state) {
    const history = state.sim.history || [];

    if (history.length === 0) {
      lensContent.innerHTML = `
        <div style="text-align:center; padding:24px; color:var(--text-muted);">
          <div style="font-size:32px; margin-bottom:12px;">📊</div>
          <div style="font-size:13px;">No conversation history yet.</div>
          <div style="font-size:11px; opacity:0.7; margin-top:4px;">Send messages in Live mode to see the emotional arc.</div>
        </div>
      `;
      return;
    }

    // Extract emotional data
    const labels = [];
    const erosData = [];
    const pulseData = [];
    const messageData = [];

    history.forEach((msg, idx) => {
      if (msg.role === 'system') return;
      labels.push(`#${idx + 1}`);
      const snapshot = msg.emotionalSnapshot || {};
      erosData.push(snapshot.eros ?? state.sim.eros?.currentVibe ?? 0);
      pulseData.push((snapshot.pulse || []).length);
      messageData.push({
        role: msg.role,
        content: (msg.content || '').substring(0, 50) + '...',
        pulse: snapshot.pulse || [],
        eros: snapshot.eros ?? 0,
        intent: snapshot.intent || 'unknown',
        microcues: snapshot.microcuesFired || []
      });
    });

    lensContent.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="height:160px; position:relative;">
          <canvas id="arc-chart"></canvas>
        </div>
        <div style="border-top:1px solid var(--border-subtle); padding-top:12px;">
          <div style="font-weight:bold; font-size:10px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Message Timeline</div>
          <div id="arc-timeline" style="max-height:200px; overflow-y:auto; font-size:11px;"></div>
        </div>
      </div>
    `;

    // Render Chart
    const ctx = lensContent.querySelector('#arc-chart');
    if (ctx && typeof Chart !== 'undefined') {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'EROS', data: erosData, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.1)', tension: 0.3, fill: true, yAxisID: 'y' },
            { label: 'PULSE (count)', data: pulseData, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.1)', tension: 0.3, fill: true, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
          scales: {
            x: { display: true, ticks: { font: { size: 9 } } },
            y: { type: 'linear', display: true, position: 'left', min: 0, max: 10, title: { display: true, text: 'EROS', font: { size: 9 } }, ticks: { font: { size: 9 } } },
            y1: { type: 'linear', display: true, position: 'right', min: 0, title: { display: true, text: 'PULSE', font: { size: 9 } }, ticks: { font: { size: 9 } }, grid: { drawOnChartArea: false } }
          }
        }
      });
    }

    // Render Timeline
    const timelineEl = lensContent.querySelector('#arc-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = messageData.map((msg, idx) => {
        const roleColor = msg.role === 'user' ? 'var(--accent-primary)' : 'var(--status-success)';
        const pulsePills = msg.pulse.map(p => `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:1px 4px; border-radius:4px; font-size:9px; margin-right:2px;">${p}</span>`).join('');
        const microcuePills = msg.microcues.map(m => `<span style="background:rgba(255,193,7,0.2); color:#ffc107; padding:1px 4px; border-radius:4px; font-size:9px; margin-right:2px;">⚡${m}</span>`).join('');
        return `
          <div style="padding:8px; border-bottom:1px solid var(--border-subtle); ${idx === messageData.length - 1 ? 'border-bottom:none;' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:bold; color:${roleColor}; text-transform:uppercase; font-size:9px;">${msg.role}</span>
              <span style="font-size:9px; color:var(--text-muted);">EROS: ${msg.eros} | Intent: ${msg.intent}</span>
            </div>
            <div style="margin-bottom:4px;">${pulsePills || '<span style="opacity:0.5; font-size:9px;">no emotions</span>'}</div>
            ${microcuePills ? `<div style="margin-bottom:4px;">${microcuePills}</div>` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // --- Context Lens ---
  function renderContextLens(lensContent, state) {
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
  }

  // --- Integrity Lens ---
  function renderIntegrityLens(lensContent, state) {
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
  }

  // --- Trace Lens ---
  function renderTraceLens(lensContent) {
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
  }

  // --- Stats Lens ---
  function renderStatsLens(lensContent, state) {
    const stats = state.weaves?.stats || { blocks: [], values: {} };
    lensContent.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';

    if (!stats.blocks?.length) {
      lensContent.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No stats defined. Go to Forbidden Secrets > Stats to configure.</div>';
    } else {
      lensContent.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Stat References</div>';

      const renderGroup = (targetId, targetLabel) => {
        let html = `<div style="margin-top:12px; margin-bottom:8px; font-weight:bold; font-size:10px; color:var(--text-muted); text-transform:uppercase;">${targetLabel}</div>`;
        stats.blocks.forEach(blk => {
          html += `<div style="margin-left:8px; margin-bottom:8px;">`;
          html += `<div style="color:var(--text-secondary); font-size:10px; margin-bottom:4px; font-weight:bold;">${blk.label} <span style="opacity:0.5;">(${blk.id})</span></div>`;
          const vals = (stats.values[targetId] && stats.values[targetId][blk.id]) || {};
          blk.defs.forEach(def => {
            const val = vals[def.key] ?? def.min;
            html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; background:var(--bg-elevated); padding:4px 6px; border-radius:4px;">
              <code style="color:var(--text-main); font-weight:bold;">{{stats.${targetId}.${blk.id}.${def.key}}}</code>
              <span style="color:var(--text-muted); font-size:10px;">${val}</span>
            </div>`;
          });
          html += `</div>`;
        });
        return html;
      };

      lensContent.innerHTML += renderGroup('user', 'User Identity');
      const actors = Object.keys(stats.values).filter(k => k !== 'user');
      if (actors.length > 0) {
        lensContent.innerHTML += renderGroup(actors[0], `Actor Example (${actors[0]})`);
        if (actors.length > 1) {
          lensContent.innerHTML += `<div style="margin-top:8px; font-style:italic; color:var(--text-muted); font-size:10px;">+ ${actors.length - 1} other actors (use ID)</div>`;
        }
      }
    }
    lensContent.innerHTML += '</div>';
  }

  // --- Locations Lens ---
  function renderLocationsLens(lensContent, state) {
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
  }

  // --- Prompt Lens ---
  function renderPromptLens(lensContent, state) {
    const lastPrompt = state.sim?.lastSystemPrompt || null;

    lensContent.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';
    lensContent.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">System Prompt Inspector</div>';

    if (!lastPrompt) {
      lensContent.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No prompt captured yet. Send a message to see the system prompt.</div>';
    } else {
      const promptTokens = A.Utils?.estimateTokens ? A.Utils.estimateTokens(lastPrompt) : Math.ceil(lastPrompt.length / 4);
      lensContent.innerHTML += `<div style="margin-bottom:8px; padding:6px 8px; background:var(--bg-elevated); border-radius:4px; display:flex; justify-content:space-between;">
        <span style="color:var(--text-muted);">Estimated Tokens:</span>
        <span style="color:var(--accent-secondary); font-weight:bold;">${promptTokens.toLocaleString()}</span>
      </div>`;
      lensContent.innerHTML += `<pre style="background:var(--ink-900); padding:12px; border-radius:6px; white-space:pre-wrap; word-break:break-word; max-height:400px; overflow-y:auto; border:1px solid var(--border-subtle); color:var(--text-primary);">${escapeHtml(lastPrompt)}</pre>`;
      lensContent.innerHTML += `<button class="btn btn-ghost btn-sm" id="btn-copy-prompt" style="margin-top:8px; width:100%;">📋 Copy Prompt</button>`;
    }
    lensContent.innerHTML += '</div>';

    const copyBtn = lensContent.querySelector('#btn-copy-prompt');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(lastPrompt);
        if (A.UI.Toast) A.UI.Toast.show('Prompt copied to clipboard', 'success');
      };
    }
  }

  // --- Tokens Lens ---
  function renderTokensLens(lensContent, state, options = {}) {
    const { updateGlobalLens, refreshChat } = options;
    const lastPrompt = state.sim?.lastSystemPrompt || '';
    const history = state.sim?.history || [];

    const estimateTokens = A.Utils?.estimateTokens ? A.Utils.estimateTokens : (t => Math.ceil(String(t).length / 4));
    const promptTokens = estimateTokens(lastPrompt);
    const historyText = history.map(m => m.content || '').join(' ');
    const historyTokens = estimateTokens(historyText);
    const totalTokens = promptTokens + historyTokens;

    const maxTokens = 8000;
    const usagePercent = Math.min(100, Math.round((totalTokens / maxTokens) * 100));
    const remaining = Math.max(0, maxTokens - totalTokens);

    let barColor = 'var(--status-success)';
    if (usagePercent > 70) barColor = 'var(--status-warning)';
    if (usagePercent > 90) barColor = 'var(--status-error)';

    lensContent.innerHTML = `
      <div style="padding:12px;">
        <div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Context Window Usage</div>
        
        <div style="background:var(--bg-elevated); border-radius:8px; overflow:hidden; height:24px; margin-bottom:12px; border:1px solid var(--border-subtle);">
          <div style="width:${usagePercent}%; height:100%; background:${barColor}; transition:width 0.3s ease;"></div>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:12px;">
          <span style="color:var(--text-muted);">${usagePercent}% Used</span>
          <span style="color:var(--text-primary); font-weight:bold;">${totalTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens</span>
        </div>
        
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

    // Bind actions
    const summarizeBtn = lensContent.querySelector('#btn-summarize-history');
    if (summarizeBtn) {
      summarizeBtn.onclick = () => {
        const currentState = A.State.get();
        const currentHistory = currentState.sim?.history || [];

        if (currentHistory.length < 5) {
          if (A.UI.Toast) A.UI.Toast.show('Not enough messages to summarize', 'warning');
          return;
        }

        const splitPoint = Math.floor(currentHistory.length / 2);
        const toSummarize = currentHistory.slice(0, splitPoint);
        const toKeep = currentHistory.slice(splitPoint);

        const summaryParts = [];
        toSummarize.forEach(msg => {
          const preview = (msg.content || '').slice(0, 100);
          const role = msg.role === 'user' ? 'User' : msg.role === 'model' ? 'Character' : 'System';
          if (preview) summaryParts.push(`${role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
        });

        currentState.sim.contextSummary = `[Earlier in conversation (${toSummarize.length} messages)]\n${summaryParts.join('\n')}`;
        currentState.sim.history = toKeep;

        A.State.notify();
        if (updateGlobalLens) updateGlobalLens();
        if (refreshChat) refreshChat();
        if (A.UI.Toast) A.UI.Toast.show(`Summarized ${toSummarize.length} messages`, 'success');
      };
    }

    const clearSummaryBtn = lensContent.querySelector('#btn-clear-summary');
    if (clearSummaryBtn) {
      clearSummaryBtn.onclick = () => {
        const currentState = A.State.get();
        delete currentState.sim.contextSummary;
        A.State.notify();
        if (updateGlobalLens) updateGlobalLens();
        if (A.UI.Toast) A.UI.Toast.show('Summary cleared', 'info');
      };
    }
  }

  // --- Config Lens ---
  function renderConfigLens(lensContent) {
    const activeConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;

    lensContent.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <section>
          <div style="font-weight:bold; margin-bottom:8px; color:var(--text-muted); text-transform:uppercase; font-size:10px;">Active LLM Configuration</div>
          ${activeConfig ? `
            <div style="padding:12px; background:var(--bg-elevated); border:1px solid var(--accent-primary); border-radius:var(--radius-md);">
              <div style="font-size:13px; font-weight:bold; color:var(--text-primary);">${activeConfig.provider.toUpperCase()}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Model: <strong>${activeConfig.model}</strong></div>
              ${activeConfig.provider === 'custom' ? `<div style="font-size:10px; color:var(--text-muted); margin-top:2px;">URL: ${activeConfig.baseUrl}</div>` : ''}
              <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">API Key: ${activeConfig.apiKey ? '••••••••' + activeConfig.apiKey.slice(-4) : '<span style="color:var(--status-error);">Not set</span>'}</div>
            </div>
          ` : `
            <div style="padding:12px; background:var(--bg-surface); border-radius:var(--radius-md); text-align:center; color:var(--text-muted); font-size:11px;">
              No configuration set. Click below to add one.
            </div>
          `}
        </section>
        
        <button class="btn btn-primary btn-sm" id="btn-manage-keys" style="width:100%;">⚙️ Manage API Configurations</button>
      </div>
    `;

    lensContent.querySelector('#btn-manage-keys').onclick = () => A.UI.showApiKeyManager();
  }

  // --- Helper Functions (Tag, Emotion, Eros, Intent, Actor Renderers) ---

  function renderTags(target, state) {
    if (!target) return;
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

  function renderEmotions(container, state) {
    const curSel = container.querySelector('#sim-emo-current');
    const allBoxes = container.querySelector('#sim-emo-all');
    const addInp = container.querySelector('#sim-add-emo');
    const dl = container.querySelector('#dl-emotions');

    if (!curSel || !state.sim.emotions) return;

    const emotions = A.EMOTIONS || [];

    curSel.innerHTML = emotions.map(e => `<option value="${e}" ${e === state.sim.emotions.current ? 'selected' : ''}>${e}</option>`).join('');
    curSel.onchange = (e) => {
      state.sim.emotions.current = e.target.value;
      A.State.notify();
    };

    dl.innerHTML = emotions.map(e => `<option value="${e}">`).join('');

    allBoxes.innerHTML = (state.sim.emotions.all || []).map(e =>
      `<span style="background:var(--accent-soft); color:var(--accent-primary); padding:1px 4px; border-radius:4px; font-size:9px; cursor:pointer;" data-emo="${e}">${e} ×</span>`
    ).join('');

    allBoxes.querySelectorAll('span').forEach(sp => {
      sp.onclick = () => {
        state.sim.emotions.all = state.sim.emotions.all.filter(x => x !== sp.dataset.emo);
        A.State.notify();
      };
    });

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

  function renderEros(container, state) {
    const vibeInp = container.querySelector('#sim-eros-vibe');
    const longInp = container.querySelector('#sim-eros-long');
    const vibeVal = container.querySelector('#val-eros-vibe');
    const longVal = container.querySelector('#val-eros-long');
    const vibeLbl = container.querySelector('#lbl-eros-vibe');

    if (!vibeInp || !state.sim.eros) return;

    const levels = A.EROS_LEVELS || {};

    const updateLabs = () => {
      if (!vibeVal) return;
      vibeVal.textContent = vibeInp.value;
      longVal.textContent = longInp.value;
      const lv = Object.entries(levels).find(([k, v]) => v == vibeInp.value);
      vibeLbl.textContent = lv ? lv[0] : '';
    };

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

  function renderIntents(container, state) {
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

  function renderActors(container, state) {
    if (!container) return;
    const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];

    if (actors.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:10px;">No actors defined.</div>';
      return;
    }

    container.innerHTML = actors.map(a => `
      <label style="display:flex; align-items:center; gap:8px; font-size:11px; cursor:pointer;">
        <input type="checkbox" data-id="${a.id}" ${state.sim.actors?.includes(a.id) ? 'checked' : ''}>
        <span>${a.name || a.id}</span>
      </label>
    `).join('');

    container.querySelectorAll('input').forEach(chk => {
      chk.onchange = (e) => {
        const id = e.target.dataset.id;
        if (!state.sim.actors) state.sim.actors = [];
        if (e.target.checked) {
          if (!state.sim.actors.includes(id)) state.sim.actors.push(id);
        } else {
          state.sim.actors = state.sim.actors.filter(x => x !== id);
        }
        A.State.notify();
      };
    });
  }

  // --- Project Lens (Global Overview) ---
  function renderProjectLens(lensContent, state) {
    const meta = state.meta || {};
    const actors = state.nodes?.actors?.items ? Object.keys(state.nodes.actors.items).length : 0;
    const scripts = A.Scripts ? A.Scripts.getAll().length : 0;
    const locs = state.nodes?.locations?.items ? Object.keys(state.nodes.locations.items).length : 0;

    // Helper to estimate token count if metrics module available
    let totalTokens = 0;
    if (A.TokenMetrics) {
      const metrics = A.TokenMetrics.getBreakdown();
      totalTokens = metrics.permanent.tokens + metrics.temporary.tokens + metrics.injectable.tokens;
    }

    lensContent.innerHTML = `
      <div class="flex-col gap-md">
        <!-- Project Header -->
        <section class="text-center p-sm bg-surface rounded border border-subtle">
            <div class="text-xs text-uppercase text-muted mb-xs">Mission Control</div>
            <div class="text-lg font-serif mb-xs">${meta.name || 'Untitled Project'}</div>
            <div class="badge font-mono text-tiny">${meta.id ? meta.id.substring(0, 8) : 'LOCAL'}</div>
        </section>

        <!-- Metrics Grid -->
        <section>
            <div class="text-tiny font-bold text-muted text-uppercase mb-sm">Project Metrics</div>
            <div class="panel-grid grid-cols-2 gap-xs">
                <div class="p-xs bg-surface rounded text-center">
                    <div class="text-tiny text-secondary">Actors</div>
                    <div class="text-lg font-bold text-primary">${actors}</div>
                </div>
                <div class="p-xs bg-surface rounded text-center">
                    <div class="text-tiny text-secondary">Scripts</div>
                    <div class="text-lg font-bold text-primary">${scripts}</div>
                </div>
                <div class="p-xs bg-surface rounded text-center">
                    <div class="text-tiny text-secondary">Locations</div>
                    <div class="text-lg font-bold text-primary">${locs}</div>
                </div>
                 <div class="p-xs bg-surface rounded text-center">
                    <div class="text-tiny text-secondary">Tokens</div>
                    <div class="text-lg font-bold text-accent">${totalTokens}</div>
                </div>
            </div>
        </section>

        <!-- Quick Actions -->
        <section>
            <div class="text-tiny font-bold text-muted text-uppercase mb-sm">Quick Actions</div>
            <div class="flex-col gap-xs">
                 <button class="btn btn-sm btn-ghost justify-start" onclick="A.UI.switchPanel('actors')">
                    <span class="mr-sm">👥</span> Create Actor
                 </button>
                 <button class="btn btn-sm btn-ghost justify-start" onclick="A.UI.switchPanel('lorebook')">
                    <span class="mr-sm">📖</span> New Lore Entry
                 </button>
                 <button class="btn btn-sm btn-ghost justify-start" onclick="A.UI.switchPanel('scripts')">
                    <span class="mr-sm">📜</span> Write Script
                 </button>
                 <button class="btn btn-sm btn-primary justify-start mt-xs" onclick="A.UI.switchPanel('simulator')">
                    <span class="mr-sm">▶️</span> Run Simulator
                 </button>
            </div>
        </section>

        <!-- System Status -->
        <section class="mt-auto pt-md border-t border-subtle">
            <div class="flex-row justify-between align-center">
                <span class="text-tiny text-muted">System Integrity</span>
                <span class="text-tiny text-success font-bold">● Nominal</span>
            </div>
        </section>
      </div>
    `;
  }

  // Export
  A.SimulatorLens = {
    renderLensContent: renderLensContent,
    renderProjectLens: renderProjectLens
  };

})(window.Anansi);
