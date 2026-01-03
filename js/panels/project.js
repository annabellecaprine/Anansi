/*
 * Anansi Panel: Project (Mission Control Dashboard)
 * File: js/panels/project.js
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();
    if (!state) return;

    // --- Helpers ---
    const getCount = (path, def = {}) => {
      try {
        const parts = path.split('.');
        let cur = state;
        for (const p of parts) cur = cur[p];
        return Object.keys(cur || def).length;
      } catch (e) { return 0; }
    };

    // Calculate Token Metrics
    const getTokenMetrics = () => {
      if (!A.TokenMetrics) return { total: 0, permanent: 0, temporary: 0, injectable: 0 };
      const metrics = A.TokenMetrics.getBreakdown();
      return {
        total: metrics.permanent.tokens + metrics.temporary.tokens + metrics.injectable.tokens,
        permanent: metrics.permanent.tokens,
        temporary: metrics.temporary.tokens,
        injectable: metrics.injectable.tokens
      };
    };

    const tokenMetrics = getTokenMetrics();

    container.style.padding = 'var(--space-4)';
    container.style.height = '100%';
    container.style.overflowY = 'auto'; // Dashboard scrolls

    // --- Template ---
    container.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Header / Welcome -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
            <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 4px;">Mission Control</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: -0.5px;">${state.meta.name || 'Untitled Project'}</h1>
                <span class="badge" style="background:var(--bg-elevated); font-family:var(--font-mono); margin-top: 8px; display: inline-block;">${state.meta.id ? state.meta.id.substring(0, 8) : 'LOCAL'}</span>
            </div>
            <!-- Project Cover Image -->
            <div style="flex-shrink: 0; text-align: center;">
                <div id="project-cover-preview" style="
                    width: 100px;
                    height: 100px;
                    background: var(--bg-inset);
                    border: 2px dashed var(--border-subtle);
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    cursor: pointer;
                " title="Click to upload project cover">
                    ${state.meta.cover?.data
        ? `<img src="${state.meta.cover.data}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<span style="color: var(--text-muted); font-size: 9px; text-align: center;">Project<br>Cover</span>`
      }
                </div>
                <input type="file" id="cover-input" accept="image/png,image/jpeg,image/webp" style="display: none;">
            </div>
        </div>

        <!-- Stats Row -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            ${renderTokenCard(tokenMetrics)}
            
            ${renderStatCard('Actors', getCount('nodes.actors.items'), 'Active Nodes',
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')}
            
            ${renderStatCard('Scripts', A.Scripts ? A.Scripts.getAll().length : 0, 'Logic Modules',
          '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>')}
            
            ${renderStatCard('Integrity', 'Stable', 'System Status',
            '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>', 'color:var(--status-success);')}
        </div>

        <!-- Main Content Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            
            <!-- Left: Metadata & Settings -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
                
                <div class="card">
                    <div class="card-header"><strong>Project Metadata</strong></div>
                    <div class="card-body">
                         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group">
                              <label class="label">Project Name</label>
                              <input type="text" class="input" id="inp-proj-name" value="${state.meta.name || ''}">
                            </div>
                            <div class="form-group">
                              <label class="label">Author</label>
                              <input type="text" class="input" id="inp-proj-author" value="${state.meta.author || ''}">
                            </div>
                          </div>
                          <div class="form-group">
                            <label class="label">Manifesto (Description)</label>
                            <textarea class="input" id="inp-proj-desc" style="min-height: 80px; resize: vertical;" placeholder="What is this project about?">${state.meta.description || ''}</textarea>
                          </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><strong>Platform Compatibility</strong></div>
                    <div class="card-body">
                         <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <span class="badge" style="background: var(--status-success); color: white; padding: 6px 12px;">✓ JanitorAI</span>
                            <span class="badge" style="background: var(--status-success); color: white; padding: 6px 12px;">✓ SillyTavern</span>
                            <span class="badge" style="background: var(--status-success); color: white; padding: 6px 12px;">✓ Chub.ai</span>
                            <span class="badge" style="background: var(--status-success); color: white; padding: 6px 12px;">✓ Kobold</span>
                         </div>
                         <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;">
                            Character Card v2 format compatible with most platforms.
                         </div>
                    </div>
                </div>

            </div>

            <!-- Right: Quick Actions & Health -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
                
                <div class="card">
                    <div class="card-header"><strong>Quick Actions</strong></div>
                    <div class="card-body" style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn btn-secondary" onclick="Anansi.UI.switchPanel('actors', { createNew: true })">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Create Actor
                            </span>
                        </button>
                        <button class="btn btn-secondary" onclick="Anansi.UI.switchPanel('lorebook', { createNew: true })">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                New Lore Entry
                            </span>
                        </button>
                        <button class="btn btn-secondary" onclick="Anansi.UI.switchPanel('scripts', { createNew: true })">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                                Write Script
                            </span>
                        </button>
                        <div style="height:1px; background:var(--border-subtle); margin: 8px 0;"></div>
                        <button class="btn btn-primary" onclick="Anansi.UI.switchPanel('simulator')">
                            <span style="display:flex; align-items:center; gap:8px; justify-content:center;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Run Simulator
                            </span>
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><strong>Integration Status</strong></div>
                    <div class="card-body">
                         <div id="health-check" style="color:var(--text-muted); font-size:13px; font-style:italic;">Scanning...</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><strong>Setup Progress</strong></div>
                    <div class="card-body" style="font-size:12px;">
                        ${renderSetupChecklist(state)}
                    </div>
                </div>

            </div>
        </div>

      </div>
    `;

    // --- Helper Component: Token Card (with breakdown) ---
    function renderTokenCard(metrics) {
      return `
            <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 4px; position:relative; overflow:hidden;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; z-index:1;">Total Tokens</div>
                <div style="font-size: 24px; font-weight: 300; color: var(--text-primary); z-index:1;">${metrics.total.toLocaleString()}</div>
                <div style="font-size: 9px; color: var(--text-muted); z-index:1; display:flex; gap:8px; flex-wrap:wrap;">
                  <span style="color:var(--accent-primary);">●${metrics.permanent} Perm</span>
                  <span style="color:var(--status-warning);">●${metrics.temporary} Temp</span>
                  <span style="color:var(--status-success);">●${metrics.injectable} Inj</span>
                </div>
                
                <div style="position: absolute; right: -10px; bottom: -10px; opacity: 0.05; color: var(--text-primary); transform: rotate(-15deg);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
            </div>
        `;
    }

    // --- Helper Component: Stat Card ---
    function renderStatCard(label, value, sub, iconSvg, valueStyle = '') {
      return `
            <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 4px; position:relative; overflow:hidden;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; z-index:1;">${label}</div>
                <div style="font-size: 24px; font-weight: 300; color: var(--text-primary); ${valueStyle} z-index:1;">${value}</div>
                <div style="font-size: 10px; color: var(--text-muted); opacity: 0.7; z-index:1;">${sub}</div>
                
                <div style="position: absolute; right: -10px; bottom: -10px; opacity: 0.05; color: var(--text-primary); transform: rotate(-15deg);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
            </div>
        `;
    }

    // --- Helper Component: Setup Progress Checklist ---
    function renderSetupChecklist(state) {
      const hasCharacter = !!(state.character && (state.character.name || state.character.persona));
      const actorCount = Object.keys(state.nodes?.actors?.items || {}).length;
      const loreCount = Object.keys(state.weaves?.lorebook?.entries || {}).length;
      const hasVoices = (state.weaves?.voices?.voices || []).length > 0;

      const checkRow = (done, label, hint, panelId) => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:6px 8px; border-radius:6px; background:${done ? 'transparent' : 'var(--bg-surface)'}; cursor:pointer;" 
             onclick="Anansi.UI.switchPanel('${panelId}')">
          <span style="width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:50%; 
                       background:${done ? 'var(--status-success)' : 'var(--bg-elevated)'}; 
                       color:${done ? 'white' : 'var(--text-muted)'}; font-size:11px;">
            ${done ? '✓' : '○'}
          </span>
          <div style="flex:1;">
            <div style="font-weight:500; color:${done ? 'var(--text-primary)' : 'var(--text-secondary)'};">${label}</div>
            <div style="font-size:10px; color:var(--text-muted);">${hint}</div>
          </div>
          ${!done ? '<span style="font-size:10px; color:var(--accent-primary);">→</span>' : ''}
        </div>
      `;

      return `
        ${checkRow(hasCharacter, 'Define Main Character', 'Set name, persona, and example dialogue', 'character')}
        ${checkRow(actorCount > 0, 'Create Actors', actorCount > 0 ? `${actorCount} actor${actorCount > 1 ? 's' : ''} defined` : 'Add NPCs and secondary characters', 'actors')}
        ${checkRow(loreCount > 0, 'Add Lorebook Entries', loreCount > 0 ? `${loreCount} entr${loreCount > 1 ? 'ies' : 'y'} defined` : 'World info, factions, locations', 'lorebook')}
        ${checkRow(hasVoices, 'Configure Voices', hasVoices ? 'Voice profiles active' : 'Speaking styles for actors', 'voices')}
      `;
    }


    // --- Events & Logic ---
    const notifySave = () => {
      if (A.UI.Toast) A.UI.Toast.show('Project metadata saved', 'success');
      A.State.notify();
    };

    container.querySelector('#inp-proj-name').onchange = (e) => { A.State.updateMeta({ name: e.target.value }); notifySave(); };
    container.querySelector('#inp-proj-author').onchange = (e) => { A.State.updateMeta({ author: e.target.value }); notifySave(); };
    container.querySelector('#inp-proj-desc').onchange = (e) => { A.State.updateMeta({ description: e.target.value }); notifySave(); };

    // Cover image upload
    const coverPreview = container.querySelector('#project-cover-preview');
    const coverInput = container.querySelector('#cover-input');
    coverPreview.onclick = () => coverInput.click();
    coverInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        A.State.updateMeta({ cover: { type: 'dataUrl', data: ev.target.result, mimeType: file.type } });
        coverPreview.innerHTML = `<img src="${ev.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        if (A.UI.Toast) A.UI.Toast.show('Project cover updated', 'success');
        A.State.notify();
      };
      reader.readAsDataURL(file);
    };

    // Dynamic Integrity Check
    if (A.Validator) {
      const issues = A.Validator.run(state);
      const errors = issues.filter(i => i.severity === 'error').length;
      const warn = issues.filter(i => i.severity === 'warning').length;

      const healthEl = container.querySelector('#health-check');
      if (errors > 0) {
        healthEl.innerHTML = `<span style="color:var(--status-error);">● ${errors} Critical Issues</span>`;
      } else if (warn > 0) {
        healthEl.innerHTML = `<span style="color:var(--status-warning);">● ${warn} Warnings</span>`;
      } else {
        healthEl.innerHTML = `<span style="color:var(--status-success);">● All Systems Nominal</span>`;
      }
    }

    // --- Web Lens Injection ---
    renderLens();

    function renderLens() {
      // 1. Gather Data
      // Voices
      const voices = (state.weaves && state.weaves.voices && state.weaves.voices.voices) ? state.weaves.voices.voices : [];
      const voicesEnabled = voices.filter(v => v.enabled).length;

      // Scoring
      const scoringBasic = (state.scoring && state.scoring.topics) ? state.scoring.topics : [];
      const scoringAdv = (state.scoring && state.scoring.advanced) ? state.scoring.advanced : [];

      // Logic (SBX)
      const lists = (state.sbx && state.sbx.lists) ? state.sbx.lists : [];
      const derived = (state.sbx && state.sbx.derived) ? state.sbx.derived : [];
      const rules = (state.sbx && state.sbx.rules) ? state.sbx.rules : [];
      const globalRules = rules.filter(r => !r.boundTo);
      const boundRules = rules.filter(r => r.boundTo);

      // Sources
      const sources = (state.strands && state.strands.sources && state.strands.sources.items) ? Object.values(state.strands.sources.items) : [];
      const sysSources = sources.filter(s => s.kind !== 'custom');
      const custSources = sources.filter(s => s.kind === 'custom');

      // 2. Build HTML
      const lensHtml = `
        <div style="padding: 16px; display:flex; flex-direction:column; gap:24px;">
            
           <!-- Header -->
           <div style="text-align:center; padding-bottom:8px; border-bottom:1px solid var(--border-subtle);">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary);">Project Overview</div>
              <div style="font-size:18px; font-weight:300;">Lens Data</div>
           </div>

           <!-- Section: Voices -->
           <div>
              <div style="font-size:11px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">The Choir</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Active Voices</span>
                  <span style="font-family:var(--font-mono);">${voicesEnabled} <span style="color:var(--text-muted);">/ ${voices.length}</span></span>
              </div>
              <div style="font-size:10px; color:var(--text-muted); font-style:italic;">
                 Runtime audio/text injection modules.
              </div>
           </div>

           <!-- Section: Judgement -->
           <div>
              <div style="font-size:11px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Judgement</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Scoring Topics</span>
                  <span style="font-family:var(--font-mono);">${scoringBasic.length}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Complex Logic</span>
                  <span style="font-family:var(--font-mono);">${scoringAdv.length}</span>
              </div>
           </div>

           <!-- Section: Logic Engine -->
           <div>
              <div style="font-size:11px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Logic Engine</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Custom Lists</span>
                  <span style="font-family:var(--font-mono);">${lists.length}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Derived Metrics</span>
                  <span style="font-family:var(--font-mono);">${derived.length}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Global Rules</span>
                  <span style="font-family:var(--font-mono);">${globalRules.length}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Bound Rules</span>
                  <span style="font-family:var(--font-mono);">${boundRules.length}</span>
              </div>
           </div>

           <!-- Section: Data Strands -->
           <div>
              <div style="font-size:11px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Data Strands</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>System Sources</span>
                  <span style="font-family:var(--font-mono);">${sysSources.length}</span>
              </div>
               <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Custom Sources</span>
                  <span style="font-family:var(--font-mono);">${custSources.length}</span>
              </div>
           </div>

           <div style="margin-top:20px; text-align:center;">
             <div style="font-size:10px; color:var(--text-muted);">Last Updated</div>
             <div style="font-size:11px; font-family:var(--font-mono);">${new Date().toLocaleTimeString()}</div>
           </div>

        </div>
      `;

      if (A.UI && A.UI.setLens) {
        A.UI.setLens((container) => {
          container.innerHTML = lensHtml;
        });
      }
    }
  }

  A.registerPanel('project', {
    label: 'Project',
    subtitle: 'The Loom',
    category: 'Loom',
    render: render
  });

})(window.Anansi);
