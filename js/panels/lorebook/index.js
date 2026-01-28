/*
 * Anansi Panel: Lorebook (Advanced)
 * File: js/panels/lorebook.js
 * Category: Weave
 * Parity: MythOS/Studio
 * Description: Manages world knowledge entries with advanced logic (Aura Tags, Shifts, Emissions).
 * 
 * Dependencies: js/plugins/lorebook/lorebook-shared.js (must load first)
 */

(function (A) {
  'use strict';

  // --- Import from Shared Module ---
  const CATEGORIES = A.Lorebook.CATEGORIES;
  const ACTIVATION = A.Lorebook.ACTIVATION;
  const EMOTIONS = A.Lorebook.EMOTIONS;
  const INTENTS = A.Lorebook.INTENTS;
  const EROS_LEVELS = A.Lorebook.EROS_LEVELS;
  const AURA_TAGS = A.Lorebook.AURA_TAGS;
  const uuidv4 = A.Lorebook.uuidv4;
  const jsStr = A.Lorebook.jsStr;
  const generateScript = A.Lorebook.generateScript;
  const renderTagPicker = A.Lorebook.renderTagPicker;

  // --- Persistent State ---
  // These variables persist across re-renders of the panel.
  let currentId = null;
  let editingShiftIndex = null;
  let filter = '';

  // --- Main Panel Render ---
  function render(container, context) {
    container.innerHTML = ''; // Clear previous render
    const state = A.State.get();

    // State for Multi-Select
    let selectionMode = false;
    let selectedIds = new Set();

    // Ensure Data Structure
    if (!state.weaves) state.weaves = {};
    if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };

    // Layout Containers
    // Layout Containers
    container.className = 'panel-sidebar-layout';
    container.style.gridTemplateColumns = '320px 1fr';

    // Left: List
    const listCol = document.createElement('div');
    listCol.className = 'card flex-col min-h-0 mb-0';

    listCol.innerHTML = `
      <div class="card-header">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <strong>Lorebook</strong>
            <div id="lore-count-display" style="font-size:10px;">${Object.keys(state.weaves.lorebook.entries).length} entries</div>
        </div>
      </div>
      <div style="padding:8px; border-bottom:1px solid var(--border-subtle); display:flex; gap:8px;">
        <input type="text" class="input" id="search-lore" placeholder="Search..." style="font-size:12px; flex:1;" value="${filter}">
        <div style="display:flex; align-items:center; gap:4px; title='Scan Depth (Messages to check)'">
            <label style="font-size:10px; color:var(--text-muted); white-space:nowrap;">Depth:</label>
            <input type="number" class="input" id="scan-depth" style="width:40px; font-size:11px; padding:2px;" min="1" max="10" value="${state.weaves.lorebook.scanDepth || 3}">
        </div>
      </div>
      <div class="card-body p-0 flex-1 scroll-y pr-xs" id="lore-list"></div>
      <div class="card-footer" id="lore-footer" style="display:flex; flex-direction:column; gap:8px;">
        <!-- Standard Actions -->
        <div id="footer-standard" style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn btn-primary btn-sm" id="btn-add-lore" style="width:100%;">+ Add Entry</button>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-ghost btn-sm" id="btn-select-mode" style="flex:1; font-size:10px;">Select...</button>
                <button class="btn btn-ghost btn-sm" id="btn-import-lore" style="flex:1; font-size:10px;">Import</button>
                <button class="btn btn-ghost btn-sm" id="btn-export-lore" style="flex:1; font-size:10px;">Export</button>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-view-script" style="font-size:10px;">View Script →</button>

        </div>

        <!-- Selection Actions -->
        <div id="footer-selection" style="display:none; flex-direction:column; gap:8px;">
            <button class="btn btn-sm" id="btn-del-multi" style="width:100%; background:var(--status-error); color:white;">Delete Selected (0)</button>
            <button class="btn btn-ghost btn-sm" id="btn-cancel-select" style="width:100%;">Cancel Selection</button>
        </div>
      </div>
    `;

    // Right: Editor
    const editorCol = document.createElement('div');
    editorCol.className = 'card flex-col min-h-0 mb-0 p-0 overflow-hidden';
    editorCol.id = 'lore-editor';

    container.appendChild(listCol);
    container.appendChild(editorCol);

    // --- Event Handlers (Import/Export) ---

    // Import
    // Import
    listCol.querySelector('#btn-import-lore').onclick = async () => {
      try {
        const { content } = await A.IO.open({ accept: '.json,.txt', as: 'text' });
        if (!content) return;

        try {
          if (A.Converter) {
            const imported = A.Converter.importLorebook(content);
            const importedKeys = Object.keys(imported);
            const count = importedKeys.length;

            if (count > 0) {
              const existingKeys = Object.keys(state.weaves.lorebook.entries);
              const collisions = importedKeys.filter(k => existingKeys.includes(k));

              if (collisions.length > 0) {
                // State for decisions: { [id]: 'skip' | 'overwrite' | 'copy' }
                const decisions = {};
                collisions.forEach(k => decisions[k] = 'skip'); // Default to safe skip

                // Render Resolver Modal
                const overlay = document.createElement('div');
                overlay.className = 'modal';

                const modal = document.createElement('div');
                modal.className = 'modal-content';
                modal.style.width = '600px'; // Override max-width for specific size if needed
                modal.style.height = '80vh';

                // Header
                const header = document.createElement('div');
                header.className = 'modal-header';
                header.innerHTML = `
                        <div>
                            <h3 class="m-0 text-base">Import Conflicts</h3>
                            <div class="text-xs text-muted mt-xs">${collisions.length} existing entries found. ${count - collisions.length} new entries ready.</div>
                        </div>
                        <div style="font-size:11px; display:flex; gap:8px;">
                            <span style="color:var(--text-muted);">Set All:</span>
                            <a href="#" id="bulk-overwrite" style="color:var(--status-warning);">Overwrite</a>
                            <a href="#" id="bulk-copy" style="color:var(--accent-primary);">Copy</a>
                            <a href="#" id="bulk-skip" style="color:var(--text-muted);">Skip</a>
                        </div>
                     `;

                // List
                const listBody = document.createElement('div');
                listBody.className = 'modal-body bg-base p-0 flex-1';

                const renderConflictList = () => {
                  listBody.innerHTML = collisions.map(id => {
                    const entry = imported[id];
                    const action = decisions[id];
                    let actionColor = 'var(--text-muted)';
                    if (action === 'overwrite') actionColor = 'var(--status-warning)';
                    if (action === 'copy') actionColor = 'var(--accent-primary)';

                    return `
                                <div class="conflict-row" data-id="${id}" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--border-subtle); gap:12px;">
                                    <div style="flex:1; overflow:hidden;">
                                        <div style="font-weight:bold; font-size:13px; color:var(--text-primary); white-space:nowrap; text-overflow:ellipsis;">${entry.title || 'Untitled'}</div>
                                        <div style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">${id}</div>
                                    </div>
                                    <div style="display:flex; gap:2px; background:var(--bg-elevated); padding:2px; border-radius:4px;">
                                        ${['overwrite', 'copy', 'skip'].map(act => `
                                            <button class="btn-conflict-act" data-id="${id}" data-act="${act}" 
                                                style="
                                                    padding:4px 8px; font-size:10px; border:none; background:${action === act ? actionColor : 'transparent'}; 
                                                    color:${action === act ? (act === 'overwrite' ? 'var(--bg-base)' : 'white') : 'var(--text-muted)'}; 
                                                    border-radius:2px; cursor:pointer; font-weight:bold;
                                                ">
                                                ${act.charAt(0).toUpperCase() + act.slice(1)}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                             `;
                  }).join('');

                  // Re-bind row events
                  listBody.querySelectorAll('.btn-conflict-act').forEach(btn => {
                    /** @type {HTMLButtonElement} */ (btn).onclick = (e) => {
                      decisions[btn.dataset.id] = btn.dataset.act;
                      renderConflictList(); // Re-render to update toggle states
                    };
                  });
                };

                renderConflictList();

                // Footer
                const footer = document.createElement('div');
                footer.className = 'modal-footer';
                footer.innerHTML = `
                        <button id="btn-resolve-cancel" class="btn btn-ghost">Cancel Import</button>
                        <button id="btn-resolve-apply" class="btn btn-primary">Complete Import</button>
                     `;

                modal.appendChild(header);
                modal.appendChild(listBody);
                modal.appendChild(footer);
                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                // Bulk Actions
                const setAll = (act) => {
                  collisions.forEach(k => decisions[k] = act);
                  renderConflictList();
                };
                /** @type {HTMLAnchorElement} */ (modal.querySelector('#bulk-overwrite')).onclick = (e) => { e.preventDefault(); setAll('overwrite'); };
                /** @type {HTMLAnchorElement} */ (modal.querySelector('#bulk-copy')).onclick = (e) => { e.preventDefault(); setAll('copy'); };
                /** @type {HTMLAnchorElement} */ (modal.querySelector('#bulk-skip')).onclick = (e) => { e.preventDefault(); setAll('skip'); };

                // Cancel
                /** @type {HTMLButtonElement} */ (modal.querySelector('#btn-resolve-cancel')).onclick = () => {
                  overlay.remove();
                  if (A.UI.Toast) A.UI.Toast.show('Import cancelled.', 'info');
                };

                // Apply
                /** @type {HTMLButtonElement} */ (modal.querySelector('#btn-resolve-apply')).onclick = () => {
                  let added = 0;
                  let updated = 0;
                  let skipped = 0;

                  // 1. Process Safe Entries (Non-collisions)
                  importedKeys.forEach(k => {
                    if (!collisions.includes(k)) {
                      state.weaves.lorebook.entries[k] = imported[k];
                      added++;
                    }
                  });

                  // 2. Process Conflicts based on decisions
                  collisions.forEach(k => {
                    const act = decisions[k];
                    const entry = imported[k];

                    if (act === 'overwrite') {
                      state.weaves.lorebook.entries[k] = entry;
                      updated++;
                    } else if (act === 'copy') {
                      const newId = A.ProjectDB.generateId();
                      entry.id = newId;
                      entry.uuid = A.ProjectDB.generateId();
                      state.weaves.lorebook.entries[newId] = entry;
                      added++;
                    } else {
                      skipped++;
                    }
                  });

                  finalizeImport(`Import Complete: ${added} added, ${updated} updated, ${skipped} skipped.`);
                  overlay.remove();
                };

                return; // Wait for user interaction
              }

              // Default path (No Collisions)
              Object.assign(state.weaves.lorebook.entries, imported);
              finalizeImport(`Imported ${count} entries.`);
            } else {
              if (A.UI.Toast) A.UI.Toast.show('No valid entries found in file.', 'warning');
            }
          } else {
            A.UI.Toast.show('Converter module missing!', 'error');
          }
        } catch (err) {
          console.error(err);
          if (A.UI.Toast) A.UI.Toast.show('Import failed: ' + err.message, 'error');
        }
      } catch (err) {
        // console.error(err);
      }
    };

    // Helper to finish up
    const finalizeImport = (msg) => {
      A.State.notify();
      renderList();
      if (A.UI.Toast) A.UI.Toast.show(msg, 'success');
    };

    // Export
    // Export
    // Export
    listCol.querySelector('#btn-export-lore').onclick = () => {
      // Create Format Selection Modal
      const overlay = document.createElement('div');
      overlay.className = 'modal';

      const modal = document.createElement('div');
      modal.className = 'modal-content flex-col gap-md p-md';
      modal.style.width = '300px';

      modal.innerHTML = `
            <h3 style="margin:0; font-size:16px;">Export Lorebook</h3>
            <div style="font-size:12px; color:var(--text-secondary);">Select file format:</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button class="btn btn-secondary" id="exp-json">
                    <div style="font-weight:bold;">JSON (.json)</div>
                    <div style="font-size:10px; opacity:0.7;">Standard Anansi format</div>
                </button>
                <button class="btn btn-secondary" id="exp-txt">
                    <div style="font-weight:bold;">Text (.txt)</div>
                    <div style="font-size:10px; opacity:0.7;">Mobile/Tablet compatible</div>
                </button>
            </div>
            <button class="btn btn-ghost btn-sm" id="exp-cancel" style="margin-top:4px;">Cancel</button>
        `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const performExport = async (ext) => {
        const entries = state.weaves.lorebook.entries;
        const filename = `lorebook_export_${new Date().getTime()}.${ext}`;
        // Note: For 'txt', the original logic just JSON.stringified it anyway?
        // Line 348: new Blob([JSON.stringify({ entries: entries }, null, 2)], { type: 'application/json' });
        // So it was always JSON.
        // We will keep it as JSON content.
        const content = { entries: entries };
        await A.IO.save(content, filename, 'application/json');

        overlay.remove();
        if (A.UI.Toast) A.UI.Toast.show(`Lorebook exported as .${ext}`, 'success');
      };

      /** @type {HTMLButtonElement} */ (modal.querySelector('#exp-json')).onclick = () => performExport('json');
      /** @type {HTMLButtonElement} */ (modal.querySelector('#exp-txt')).onclick = () => performExport('txt');
      /** @type {HTMLButtonElement} */ (modal.querySelector('#exp-cancel')).onclick = () => overlay.remove();
    };

    // --- Multi-Select Handlers ---
    const updateFooterState = () => {
      const std = /** @type {HTMLElement} */ (listCol.querySelector('#footer-standard'));
      const sel = /** @type {HTMLElement} */ (listCol.querySelector('#footer-selection'));
      if (selectionMode) {
        std.style.display = 'none';
        sel.style.display = 'flex';
        /** @type {HTMLButtonElement} */ (sel.querySelector('#btn-del-multi')).textContent = `Delete Selected (${selectedIds.size})`;
        /** @type {HTMLButtonElement} */ (sel.querySelector('#btn-del-multi')).disabled = selectedIds.size === 0;
        /** @type {HTMLButtonElement} */ (sel.querySelector('#btn-del-multi')).style.opacity = selectedIds.size === 0 ? '0.5' : '1';
      } else {
        std.style.display = 'flex';
        sel.style.display = 'none';
      }
    };

    /** @type {HTMLButtonElement} */ (listCol.querySelector('#btn-select-mode')).onclick = () => {
      selectionMode = true;
      selectedIds.clear();
      updateFooterState();
      renderList();
    };

    /** @type {HTMLButtonElement} */ (listCol.querySelector('#btn-cancel-select')).onclick = () => {
      selectionMode = false;
      selectedIds.clear();
      updateFooterState();
      renderList();
    };

    /** @type {HTMLButtonElement} */ (listCol.querySelector('#btn-del-multi')).onclick = () => {
      if (selectedIds.size === 0) return;
      if (confirm(`Delete ${selectedIds.size} entries? This cannot be undone.`)) {
        let count = 0;
        selectedIds.forEach(id => {
          if (state.weaves.lorebook.entries[id]) {
            delete state.weaves.lorebook.entries[id];
            count++;
          }
        });
        selectionMode = false;
        selectedIds.clear();
        A.State.notify();
        if (A.UI.Toast) A.UI.Toast.show(`Deleted ${count} entries.`, 'success');

        // Re-renders implicitly via State notify, but we ensure mode reset
        updateFooterState();
        renderList();
        renderEditor(); // Clear editor if currentId was deleted
      }
    };

    // Handle Context
    if (context && context.createNew) {
      setTimeout(() => {
        const addBtn = listCol.querySelector('#btn-add-lore');
        if (addBtn) addBtn.click();
      }, 50);
    }

    // --- Sub-Renderers ---

    const renderList = () => {
      const listBody = listCol.querySelector('#lore-list');
      listBody.innerHTML = '';

      const entries = Object.values(state.weaves.lorebook.entries);

      // Update Count
      const countDisplay = listCol.querySelector('#lore-count-display');
      if (countDisplay) countDisplay.textContent = entries.length + ' entries';

      // Ensure sortOrder exists
      let needsSave = false;
      const sortedByOrder = [...entries].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      // If we have no sortOrder, initialize it based on title or Priority
      if (entries.length > 0 && entries.every(e => e.sortOrder === undefined)) {
        // First time initialization
        entries.sort((a, b) => a.title.localeCompare(b.title));
        entries.forEach((e, i) => {
          e.sortOrder = i * 10;
          needsSave = true;
        });
      }

      if (needsSave) {
        A.State.notify(); // Persist initial order
      }

      // Final Sort: SortOrder ASC -> Priority DESC -> Title ASC
      entries.sort((a, b) => {
        const sA = a.sortOrder !== undefined ? a.sortOrder : 999999;
        const sB = b.sortOrder !== undefined ? b.sortOrder : 999999;
        if (sA !== sB) return sA - sB;

        const pA = a.priority !== undefined ? a.priority : 50;
        const pB = b.priority !== undefined ? b.priority : 50;
        if (pA !== pB) return pB - pA;

        return (a.title || '').localeCompare(b.title || '');
      });

      // Filter
      const filtered = entries.filter(e => {
        if (!filter) return true;
        const txt = (e.title + ' ' + (e.keywords || []).join(' ')).toLowerCase();
        return txt.includes(filter.toLowerCase());
      });

      if (!filtered.length) {
        listBody.innerHTML = '<div style="padding:16px; color:gray; text-align:center;">No entries found.</div>';
        return;
      }

      const moveEntry = (id, direction) => {
        const index = entries.findIndex(e => e.id === id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= entries.length) return;

        // Swap
        const itemA = entries[index];
        const itemB = entries[newIndex];

        // Swap sortOrder is not enough if values are messy, better to re-normalize all
        // But for a simple swap, we can swap their position in array and re-assign all sortOrders
        const temp = entries[index];
        entries[index] = entries[newIndex];
        entries[newIndex] = temp;

        // Re-assign all sortOrders to clean numbers
        entries.forEach((e, i) => {
          e.sortOrder = i * 10;
        });

        A.State.notify();
        renderList();
      };

      filtered.forEach((e, i) => {
        const row = document.createElement('div');
        row.className = 'list-item';

        if (e.id === currentId && !selectionMode) {
          row.classList.add('active');
        }

        // Selection Styles
        if (selectionMode && selectedIds.has(e.id)) {
          row.style.backgroundColor = 'rgba(218, 165, 32, 0.1)'; // Gold tint
          row.style.borderColor = 'var(--accent-primary)';
        }

        // Reordering UI (Only when not filtering)
        let arrows = '';
        if (!filter && !selectionMode) {
          const isFirst = i === 0;
          const isLast = i === filtered.length - 1;
          arrows = `
             <div style="display:flex; flex-direction:column; margin-right:8px;">
                 <div class="move-up" style="font-size:10px; line-height:1; cursor:pointer; opacity:${isFirst ? 0.2 : 0.7};" title="Move Up">▲</div>
                 <div class="move-down" style="font-size:10px; line-height:1; cursor:pointer; opacity:${isLast ? 0.2 : 0.7}; margin-top:2px;" title="Move Down">▼</div>
             </div>`;
        }

        const enabled = e.enabled !== false;

        // Logic Indicator
        let hasLogic = false;
        if (state.sbx && state.sbx.rules) {
          hasLogic = state.sbx.rules.some(r => r.boundTo === e.uuid);
        }

        // Vault sync badge
        let syncBadge = '';
        if (e.vaultLink && e.vaultLink.vaultId) {
          if (e.vaultLink.locallyModified) {
            syncBadge = '<span title="Modified - Push to sync" style="font-size:10px; margin-left:6px; color:var(--status-warning);">🔄</span>';
          } else {
            syncBadge = '<span title="Synced with Vault" style="font-size:10px; margin-left:6px; color:var(--text-muted);">✅</span>';
          }
        }

        row.innerHTML = `
          <div style="display:flex; align-items:center;">
             ${arrows}
             <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; font-size:12px; display:flex; align-items:center; ${!enabled ? 'color:var(--text-muted); text-decoration:line-through;' : ''}">
                        ${selectionMode ?
            `<input type="checkbox" style="margin-right:8px; pointer-events:none;" ${selectedIds.has(e.id) ? 'checked' : ''}>`
            : ''}
                        ${hasLogic ? '<span style="color:var(--accent-primary); margin-right:4px;">⚡</span>' : ''}${e.title || 'Untitled'}${syncBadge}
                    </span>
                    <span style="font-size:10px; padding:2px 4px; border-radius:4px; background:var(--bg-base); color:var(--text-muted);">${e.category || 'uncategorized'}</span>
                </div>
                <div style="font-size:10px; color:var(--text-muted); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; margin-left:${selectionMode ? '24px' : '0'};">
                    ${(e.keywords || []).join(', ')}
                </div>
             </div>
          </div>
        `;

        row.onclick = () => {
          if (selectionMode) {
            if (selectedIds.has(e.id)) selectedIds.delete(e.id);
            else selectedIds.add(e.id);
            updateFooterState();
            renderList(); // Re-render to update checks
          } else if (e.id !== currentId) {
            currentId = e.id;
            editingShiftIndex = null;
            renderList();
            renderEditor();
          }
        };

        if (arrows) {
          const upBtn = /** @type {HTMLElement} */ (row.querySelector('.move-up'));
          const downBtn = /** @type {HTMLElement} */ (row.querySelector('.move-down'));
          // Prevent selection when clicking arrows
          if (upBtn) upBtn.onclick = (ev) => { ev.stopPropagation(); moveEntry(e.id, -1); };
          if (downBtn) downBtn.onclick = (ev) => { ev.stopPropagation(); moveEntry(e.id, 1); };
        }

        listBody.appendChild(row);
      });
    };

    const renderEditor = () => {
      editorCol.innerHTML = '';
      if (!currentId || !state.weaves.lorebook.entries[currentId]) {
        const hasEntries = Object.keys(state.weaves.lorebook.entries).length > 0;
        if (!hasEntries) {
          editorCol.innerHTML = '';
          editorCol.appendChild(A.UI.createEmptyStateElement({
            title: 'Lorebook Empty',
            message: 'The Lorebook stores all your world knowledge, factions, and story details.',
            actionLabel: '+ Create First Entry',
            onAction: () => document.getElementById('btn-add-lore').click()
          }));
        } else {
          editorCol.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.5;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <div>Select an entry to edit</div>
                </div>
            `;
        }
        return;
      }

      const entry = state.weaves.lorebook.entries[currentId];

      // Defaults
      if (!entry.uuid) entry.uuid = uuidv4();
      if (!entry.keywords) entry.keywords = [];
      if (!entry.shifts) entry.shifts = [];
      if (!entry.requireTags) entry.requireTags = [];
      if (!entry.blocksTags) entry.blocksTags = [];
      if (!entry.tags) entry.tags = [];

      // Logic Count
      let logicCount = 0;
      if (state.sbx && state.sbx.rules) {
        logicCount = state.sbx.rules.filter(r => r.boundTo === entry.uuid).length;
      }

      // Styles
      editorCol.innerHTML = `
        <style>
          .l-row { display: flex; gap: 8px; margin-bottom: 8px; align-items:center; }
          .l-col { flex: 1; display:flex; flex-direction:column; }
          .l-lab { font-size: 10px; font-weight:bold; color:var(--text-muted); margin-bottom:2px; text-transform:uppercase; }
          .l-sec { border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 12px; }
        </style>
      `;

      // Header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `
        <div style="flex:1;">
          <input class="input" id="inp-title" value="${entry.title || ''}" placeholder="e.g., The Crimson Order, Magic System" style="font-weight:bold; font-size:14px;">
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-ghost btn-sm" id="btn-logic" style="display:none; color:var(--accent-primary); font-weight:bold; ${logicCount > 0 ? 'background:var(--accent-soft);' : ''}">⚡ Logic ${logicCount > 0 ? '(' + logicCount + ')' : ''}</button>
          <label style="display:flex; align-items:center; gap:4px; font-size:12px;"><input type="checkbox" id="chk-en" ${entry.enabled !== false ? 'checked' : ''}> Enabled</label>
          <button class="btn btn-secondary btn-sm" id="btn-vault-lore">📤 Vault</button>
          <button class="btn btn-ghost btn-sm" id="btn-del" style="color:var(--status-error);">Delete</button>
        </div>
      `;

      // Logic Hook
      /** @type {HTMLElement} */ (header.querySelector('#btn-logic')).onclick = () => {
        if (logicCount === 0) {
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.rules) state.sbx.rules = [];
          state.sbx.rules.push({
            id: 'rule_' + uuidv4().split('-')[0],
            name: (entry.title || 'Entry') + ' Logic',
            enabled: true,
            boundTo: entry.uuid,
            chain: [{
              id: 'blk_' + uuidv4().split('-')[0],
              type: 'if', join: 'and', conditions: [],
              actions: [{ target: 'context.entry.content', mode: 'replace', text: entry.content || '' }]
            }]
          });
          A.State.notify();
        }
        if (A.UI && A.UI.switchPanel) A.UI.switchPanel('advanced', { boundTo: entry.uuid, boundName: entry.title });
      };

      // Delete Hook
      /** @type {HTMLElement} */ (header.querySelector('#btn-del')).onclick = () => {
        if (confirm('Delete this entry?')) {
          delete state.weaves.lorebook.entries[currentId];
          currentId = null;
          A.State.notify();
          renderList();
          renderEditor();
        }
      };

      // Vault Hook - Publish to Vault
      /** @type {HTMLElement} */ (header.querySelector('#btn-vault-lore')).onclick = async () => {
        // Get existing universes and tags for autocomplete
        let universes = [];
        let existingTags = [];
        try {
          universes = await A.VaultDB.getUniverses();
          existingTags = await A.VaultDB.getTags();
        } catch (e) {
          console.warn('[Lorebook] Could not load vault data:', e);
        }

        // Check if already published
        const isUpdate = entry.vaultLink && entry.vaultLink.vaultId;

        // Create Publish Modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-backdrop"></div>
          <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
              <h3>${isUpdate ? '📤 Push Update to Vault' : '📤 Publish to Vault'}</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <div class="mb-md">
                <strong>Lorebook Entry:</strong> ${entry.title || 'Untitled'}
              </div>

              <div class="mb-md">
                <label class="label">Source Project</label>
                <div class="text-secondary text-sm">${state.meta?.name || 'Untitled Project'}</div>
              </div>

              <div class="mb-md">
                <label class="label">Universe</label>
                <input type="text" id="vault-universe" class="input w-full" list="universe-list" 
                       placeholder="e.g., Obsidian Chronicles" 
                       value="${entry.vaultLink?.universe || ''}">
                <datalist id="universe-list">
                  ${universes.map(u => `<option value="${u}">`).join('')}
                </datalist>
                <div class="text-xs text-muted mt-xs">Group related items by universe</div>
              </div>

              <div class="mb-md">
                <label class="label">Tags</label>
                <input type="text" id="vault-tags" class="input w-full" 
                       placeholder="worldbuilding, magic-system, faction" 
                       value="${(entry.vaultLink?.tags || []).join(', ')}">
                <div class="text-xs text-muted mt-xs">Comma-separated tags for filtering</div>
              </div>

              ${isUpdate ? `
              <div class="mb-md">
                <label class="label">Commit Message</label>
                <input type="text" id="vault-message" class="input w-full" 
                       placeholder="What changed?">
              </div>
              ` : ''}

              <div class="p-sm bg-inset rounded-md text-xs text-muted">
                ${isUpdate
            ? '⚠️ This will update the existing Vault entry and increment the version.'
            : 'ℹ️ This creates a snapshot in your Vault. Future changes require a new Push.'}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" id="vault-cancel">Cancel</button>
              <button class="btn btn-primary" id="vault-confirm">${isUpdate ? '📤 Push Update' : '📤 Publish'}</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Focus universe input
        setTimeout(() => modal.querySelector('#vault-universe').focus(), 100);

        // Close handlers
        const closeModal = () => modal.remove();
        /** @type {HTMLElement} */ (modal.querySelector('.modal-backdrop')).onclick = closeModal;
        /** @type {HTMLElement} */ (modal.querySelector('.modal-close')).onclick = closeModal;
        /** @type {HTMLElement} */ (modal.querySelector('#vault-cancel')).onclick = closeModal;

        // Confirm handler
        /** @type {HTMLElement} */ (modal.querySelector('#vault-confirm')).onclick = async () => {
          const universe = /** @type {HTMLInputElement} */ (modal.querySelector('#vault-universe')).value.trim();
          const tagsStr = /** @type {HTMLInputElement} */ (modal.querySelector('#vault-tags')).value;
          const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
          const message = /** @type {HTMLInputElement} */ (modal.querySelector('#vault-message'))?.value || '';

          try {
            let vaultItem;
            if (isUpdate) {
              // Push update
              vaultItem = await A.VaultDB.push(entry.vaultLink.vaultId, entry, message);

              // Update metadata if changed
              if (universe !== entry.vaultLink.universe || JSON.stringify(tags) !== JSON.stringify(entry.vaultLink.tags)) {
                await A.VaultDB.updateMetadata(vaultItem.id, { universe, tags });
              }
            } else {
              // New publish
              vaultItem = await A.VaultDB.publish('lorebook', entry, {
                sourceProjectId: state.meta?.id,
                sourceProjectName: state.meta?.name || 'Untitled Project',
                universe: universe,
                tags: tags,
                message: 'Initial publish'
              });
            }

            // Update entry with vaultLink
            entry.vaultLink = {
              vaultId: vaultItem.id,
              pulledVersion: vaultItem.version,
              locallyModified: false,
              lastSyncedAt: new Date().toISOString(),
              universe: universe,
              tags: tags
            };
            A.State.notify();

            closeModal();
            if (A.UI.Toast) {
              A.UI.Toast.show(
                isUpdate ? `Pushed "${entry.title}" v${vaultItem.version} to Vault` : `Published "${entry.title}" to Vault`,
                'success'
              );
            }
          } catch (err) {
            console.error('[Vault] Publish failed:', err);
            if (A.UI.Toast) A.UI.Toast.show('Failed to publish to Vault', 'error');
          }
        };
      };

      // Inputs Hook
      header.querySelector('#inp-title').onchange = (e) => {
        entry.title = e.target.value;
        // Mark as locally modified if linked to vault
        if (entry.vaultLink && entry.vaultLink.vaultId) {
          entry.vaultLink.locallyModified = true;
        }
        A.State.notify();
        renderList();
        if (A.UI.Toast) A.UI.Toast.show('Title updated', 'info');
      };

      /** @type {HTMLInputElement} */ (header.querySelector('#chk-en')).onchange = (e) => {
        entry.enabled = /** @type {HTMLInputElement} */ (e.target).checked;
        A.State.notify();
      };

      editorCol.appendChild(header);

      // Body
      const body = document.createElement('div');
      body.className = 'card-body';
      Object.assign(body.style, { overflowY: 'auto', flex: '1', minHeight: '0', paddingBottom: '60px' });

      // Options
      const catOpts = CATEGORIES.map(c => `<option value="${c}" ${c === (entry.category || 'uncategorized') ? 'selected' : ''}>${c}</option>`).join('');
      const actOpts = ACTIVATION.map(a => `<option value="${a}" ${a === (entry.activationMode || 'standard') ? 'selected' : ''}>${a}</option>`).join('');

      // Target Options
      let startItems = (state.strands && state.strands.sources && state.strands.sources.items) ? Object.values(state.strands.sources.items) : [];
      let targets = startItems.filter(i => (i.access && i.access.toLowerCase().includes('write'))).map(i => i.id);
      if (targets.length === 0) targets.push('lore');
      const tgtOpts = targets.map(t => `<option value="${t}" ${t === (entry.injectionTarget || 'lore') ? 'selected' : ''}>${t}</option>`).join('');

      body.innerHTML = `
        <div class="l-row">
           <div class="l-col" style="flex:0 0 140px;">
             <label class="l-lab">Category</label>
             <select class="input" id="sel-cat">${catOpts}</select>
           </div>
           <div class="l-col" style="flex:0 0 140px;">
             <label class="l-lab">Target</label>
             <select class="input" id="sel-tgt">${tgtOpts}</select>
           </div>
           <div class="l-col">
             <label class="l-lab" title="Triggers this entry when these words appear in chat">Keywords <span style="opacity:0.5; cursor:help;">(?)</span></label>
             <input class="input" id="inp-keys" value="${(entry.keywords || []).join(', ')}" placeholder="e.g., magic, spell, crimson order">
           </div>
        </div>
        <div class="l-col" style="margin-bottom:12px;">
           <label class="l-lab">Content</label>
           <div id="quill-content" style="height:180px;"></div>
        </div>

        <!-- Actor Association (Flow Explorer Metadata) -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Associate with Actors (Flow Explorer Only)</div>
          <div id="actor-associations" style="display:flex; flex-wrap:wrap; gap:8px; padding:4px; max-height:100px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:4px;">
            <!-- Populated by JS -->
          </div>
        </div>
        
        <!-- Logic & Prob -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Logic & Probability</div>
          <div class="l-row">
            <div class="l-col"><label class="l-lab">Priority</label><input type="number" class="input" id="inp-prio" value="${entry.priority !== undefined ? entry.priority : 50}"></div>
            <div class="l-col"><label class="l-lab">Probability %</label><input type="number" class="input" id="inp-prob" value="${entry.probability !== undefined ? entry.probability : 100}" min="0" max="100"></div>
            <div class="l-col"><label class="l-lab">Ins. Order</label><input type="number" class="input" id="inp-ins" value="${entry.insertion_order || 100}"></div>
          </div>
          <div class="l-row">
            <div class="l-col"><label class="l-lab">Min Messages</label><input type="number" class="input" id="inp-minm" value="${entry.minMessages || 0}"></div>
            <div class="l-col"><label class="l-lab">Group ID</label><input class="input" id="inp-grp" value="${entry.inclusionGroup || ''}"></div>
            <div class="l-col"><label class="l-lab">Group Weight</label><input type="number" class="input" id="inp-grpw" value="${entry.groupWeight || 100}"></div>
          </div>
        </div>

        <!-- Matching -->
        <div class="l-sec">
          <div class="l-lab" style="margin-bottom:8px;">Keys & Matching</div>
          <div class="l-row">
             <div class="l-col" style="flex:2;"><label class="l-lab">Secondary Keys</label><input class="input" id="inp-keys2" value="${entry.secondaryKeys || ''}"></div>
             <div class="l-col" style="flex:1;"><label class="l-lab" title="Override Global Depth">Scan Depth</label><input type="number" class="input" id="inp-depth" value="${entry.scanDepth || ''}" placeholder="Default"></div>
          </div>
          <div class="l-row" style="gap:16px;">
             <label style="font-size:11px;"><input type="checkbox" id="chk-whole" ${entry.matchWholeWords ? 'checked' : ''}> Whole Words</label>
             <label style="font-size:11px;"><input type="checkbox" id="chk-case" ${entry.caseSensitive ? 'checked' : ''}> Case Sensitive</label>
             <label style="font-size:11px;"><input type="checkbox" id="chk-kpri" ${entry.keyMatchPriority ? 'checked' : ''}> Key Priority</label>
          </div>
        </div>

        <!-- Activation -->
        <div class="l-sec">
          <div class="l-lab">Activation Logic</div>
          <div class="l-row">
             <div class="l-col" style="flex:0 0 120px;">
                <label class="l-lab">Mode</label>
                <select class="input" id="sel-act">${actOpts}</select>
             </div>
             <div class="l-col">
                <label class="l-lab">Script (JS)</label>
                <input class="input" id="inp-script" value="${entry.activationScript || ''}" placeholder="Condition...">
             </div>
          </div>
        </div>
      `;

      // Bind Basic Fields
      const bind = (sel, field, parse) => {
        const el = body.querySelector(sel);
        if (el) el.onchange = (e) => {
          entry[field] = parse ? parse(e.target.value) : e.target.value;
          // Mark as locally modified if linked to vault
          if (entry.vaultLink && entry.vaultLink.vaultId) {
            entry.vaultLink.locallyModified = true;
          }
          A.State.notify();
        };
      };

      bind('#sel-cat', 'category');
      bind('#sel-tgt', 'injectionTarget');
      bind('#inp-keys', 'keywords', (v) => v.split(',').map(s => s.trim()).filter(s => s));
      bind('#inp-prio', 'priority', parseInt);
      bind('#inp-prob', 'probability', parseInt);
      bind('#inp-ins', 'insertion_order', parseInt);
      bind('#inp-minm', 'minMessages', parseInt);
      bind('#inp-grp', 'inclusionGroup');
      bind('#inp-grpw', 'groupWeight', parseInt);

      bind('#inp-grpw', 'groupWeight', parseInt);
      bind('#inp-depth', 'scanDepth', (v) => v ? parseInt(v) : ''); // Use empty string for default

      bind('#inp-keys2', 'secondaryKeys');
      bind('#sel-act', 'activationMode');
      bind('#inp-script', 'activationScript');

      const bindChk = (sel, field) => {
        const el = body.querySelector(sel);
        if (el) el.onchange = (e) => { entry[field] = e.target.checked; A.State.notify(); };
      };
      bindChk('#chk-whole', 'matchWholeWords');
      bindChk('#chk-case', 'caseSensitive');
      bindChk('#chk-kpri', 'keyMatchPriority');

      // Populate Actor Associations
      const assocActors = Object.values(state.nodes?.actors?.items || {});
      const actorAssocList = body.querySelector('#actor-associations');
      if (assocActors.length === 0) {
        actorAssocList.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:4px;">No actors found.</div>';
      } else {
        if (!entry.associatedActors) entry.associatedActors = [];

        assocActors.forEach(actor => {
          const isChecked = entry.associatedActors.includes(actor.id);
          const lbl = document.createElement('label');
          lbl.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:11px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px; border:1px solid var(--border-subtle); cursor:pointer; user-select:none;';
          if (isChecked) lbl.style.borderColor = 'var(--accent-primary)';

          lbl.innerHTML = `<input type="checkbox" style="margin:0;" ${isChecked ? 'checked' : ''}> ${actor.name || 'Unknown'}`;

          lbl.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
              entry.associatedActors.push(actor.id);
              lbl.style.borderColor = 'var(--accent-primary)';
            } else {
              entry.associatedActors = entry.associatedActors.filter(id => id !== actor.id);
              lbl.style.borderColor = 'var(--border-subtle)';
            }
            A.State.notify();
          };
          actorAssocList.appendChild(lbl);
        });
      }

      // --- ADVANCED GATES SECTION ---
      // Initialize gate structures if missing
      if (!entry.emotionGates) entry.emotionGates = { andAny: [], andAll: [], notAny: [], notAll: [] };
      if (!entry.erosGates) entry.erosGates = { currentVibe: { min: null, max: null }, longTermMin: null };
      if (!entry.intentGates) entry.intentGates = { allowedIntents: [] };
      if (!entry.entityGates) entry.entityGates = { restrictToActors: [] };

      const gatesSec = document.createElement('div');
      gatesSec.className = 'l-sec';
      gatesSec.innerHTML = `<div class="l-lab" style="margin-bottom:8px;">Advanced Gates</div>`;

      // Helper: Collapsible Section
      const createCollapsible = (title, content, defaultOpen = false) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;';

        const header = document.createElement('div');
        header.style.cssText = 'padding:8px 12px;background:var(--bg-elevated);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:bold;';
        header.innerHTML = `<span>${title}</span><span class="toggle-icon">${defaultOpen ? '▼' : '▶'}</span>`;

        const body = document.createElement('div');
        body.style.cssText = `padding:12px;display:${defaultOpen ? 'block' : 'none'};background:var(--bg-base);`;
        body.appendChild(content);

        header.onclick = () => {
          const isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          header.querySelector('.toggle-icon').textContent = isOpen ? '▶' : '▼';
        };

        wrapper.appendChild(header);
        wrapper.appendChild(body);
        return wrapper;
      };

      // === EMOTION GATES ===
      const emotionContent = document.createElement('div');
      const emotionRows = [
        { label: 'Require ANY', key: 'andAny', color: 'var(--accent-primary)' },
        { label: 'Require ALL', key: 'andAll', color: 'var(--status-warning)' },
        { label: 'Block if ANY', key: 'notAny', color: 'var(--status-error)' },
        { label: 'Block if ALL', key: 'notAll', color: 'var(--status-error)' }
      ];
      emotionRows.forEach(({ label, key, color }) => {
        const row = document.createElement('div');
        row.className = 'l-row';
        row.style.marginBottom = '8px';

        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = `font-size:10px;color:${color};min-width:80px;`;
        labelSpan.textContent = label;
        row.appendChild(labelSpan);

        const pickerContainer = document.createElement('div');
        pickerContainer.style.flex = '1';
        renderTagPicker(pickerContainer, '', entry.emotionGates[key], () => A.State.notify());
        row.appendChild(pickerContainer);

        emotionContent.appendChild(row);
      });
      gatesSec.appendChild(createCollapsible('🎭 Emotion Gates', emotionContent, entry.emotionGates.andAny.length > 0 || entry.emotionGates.notAny.length > 0));

      // === EROS GATES ===
      const erosContent = document.createElement('div');
      erosContent.innerHTML = `
        <div class="l-row" style="gap:16px;margin-bottom:8px;">
          <div class="l-col">
            <label class="l-lab">Current Vibe Min</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-vibe-min" min="0" max="10" value="${entry.erosGates.currentVibe.min ?? 0}" style="flex:1;">
              <span id="eros-vibe-min-label" style="font-size:10px;min-width:90px;">${entry.erosGates.currentVibe.min !== null ? EROS_LEVELS[entry.erosGates.currentVibe.min] || entry.erosGates.currentVibe.min : 'Any'}</span>
            </div>
          </div>
          <div class="l-col">
            <label class="l-lab">Current Vibe Max</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-vibe-max" min="0" max="10" value="${entry.erosGates.currentVibe.max ?? 10}" style="flex:1;">
              <span id="eros-vibe-max-label" style="font-size:10px;min-width:90px;">${entry.erosGates.currentVibe.max !== null ? EROS_LEVELS[entry.erosGates.currentVibe.max] || entry.erosGates.currentVibe.max : 'Any'}</span>
            </div>
          </div>
        </div>
        <div class="l-row">
          <div class="l-col" style="max-width:200px;">
            <label class="l-lab">Long-Term Min</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="range" id="eros-lt-min" min="0" max="10" value="${entry.erosGates.longTermMin ?? 0}" style="flex:1;">
              <span id="eros-lt-label" style="font-size:10px;min-width:90px;">${entry.erosGates.longTermMin !== null ? EROS_LEVELS[entry.erosGates.longTermMin] || entry.erosGates.longTermMin : 'Any'}</span>
            </div>
          </div>
          <div class="l-col" style="font-size:10px;color:var(--text-muted);padding-top:16px;">
            EROS measures romantic/arousal levels from 0 (NONE) to 10 (TRANSCENDENCE)
          </div>
        </div>
      `;

      // Bind EROS sliders
      setTimeout(() => {
        const vibeMin = /** @type {HTMLInputElement} */ (erosContent.querySelector('#eros-vibe-min'));
        const vibeMax = /** @type {HTMLInputElement} */ (erosContent.querySelector('#eros-vibe-max'));
        const ltMin = /** @type {HTMLInputElement} */ (erosContent.querySelector('#eros-lt-min'));

        if (vibeMin) {
          vibeMin.oninput = (e) => {
            const val = parseInt(/** @type {HTMLInputElement} */(e.target).value);
            entry.erosGates.currentVibe.min = val === 0 ? null : val;
            erosContent.querySelector('#eros-vibe-min-label').textContent = val === 0 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          vibeMin.onchange = () => A.State.notify();
        }
        if (vibeMax) {
          vibeMax.oninput = (e) => {
            const val = parseInt(/** @type {HTMLInputElement} */(e.target).value);
            entry.erosGates.currentVibe.max = val === 10 ? null : val;
            erosContent.querySelector('#eros-vibe-max-label').textContent = val === 10 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          vibeMax.onchange = () => A.State.notify();
        }
        if (ltMin) {
          ltMin.oninput = (e) => {
            const val = parseInt(/** @type {HTMLInputElement} */(e.target).value);
            entry.erosGates.longTermMin = val === 0 ? null : val;
            erosContent.querySelector('#eros-lt-label').textContent = val === 0 ? 'Any' : (EROS_LEVELS[val] || val);
          };
          ltMin.onchange = () => A.State.notify();
        }
      }, 0);

      gatesSec.appendChild(createCollapsible('💕 EROS Gates', erosContent, entry.erosGates.currentVibe.min !== null || entry.erosGates.longTermMin !== null));

      // === INTENT GATES ===
      const intentContent = document.createElement('div');
      intentContent.innerHTML = `<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">Select intents that will allow this entry to fire. Leave empty to allow all.</div>`;

      const intentCheckboxes = document.createElement('div');
      intentCheckboxes.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

      INTENTS.forEach(intent => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;';
        const checked = entry.intentGates.allowedIntents.includes(intent);
        label.innerHTML = `<input type="checkbox" data-intent="${intent}" ${checked ? 'checked' : ''}> ${intent}`;
        label.querySelector('input').onchange = (e) => {
          if (e.target.checked) {
            if (!entry.intentGates.allowedIntents.includes(intent)) {
              entry.intentGates.allowedIntents.push(intent);
            }
          } else {
            entry.intentGates.allowedIntents = entry.intentGates.allowedIntents.filter(i => i !== intent);
          }
          A.State.notify();
        };
        intentCheckboxes.appendChild(label);
      });
      intentContent.appendChild(intentCheckboxes);

      gatesSec.appendChild(createCollapsible('💬 Intent Gates', intentContent, entry.intentGates.allowedIntents.length > 0));

      // === ENTITY GATES ===
      const entityContent = document.createElement('div');
      entityContent.innerHTML = `
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">
          <strong>Restrict to Actors:</strong> This entry only fires when selected actors are <em>mentioned</em> in recent chat messages.
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:12px;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);border-left:3px solid var(--accent-primary);">
          <strong>How detection works:</strong> AURA scans chat for actor <strong>names</strong> and <strong>aliases</strong>. 
          Pronouns (he/she/they) are resolved to the last mentioned actor of that gender.
          <br><em>Example: If "Aria" is selected, the entry fires when "aria", her aliases, or "she" (after mentioning Aria) appear in chat.</em>
        </div>
      `;

      // Get actors from state
      const actors = state.nodes?.actors?.items ? Object.values(state.nodes.actors.items) : [];

      if (actors.length === 0) {
        entityContent.innerHTML += `<div style="font-size:11px;color:var(--text-muted);font-style:italic;">No actors defined. Create actors in the Nodes panel.</div>`;
      } else {
        const actorCheckboxes = document.createElement('div');
        actorCheckboxes.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';

        actors.forEach(actor => {
          const label = document.createElement('label');
          label.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;';
          const checked = entry.entityGates.restrictToActors.includes(actor.id);
          label.innerHTML = `<input type="checkbox" data-actor="${actor.id}" ${checked ? 'checked' : ''}> ${actor.name || actor.id}`;
          label.querySelector('input').onchange = (e) => {
            if (e.target.checked) {
              if (!entry.entityGates.restrictToActors.includes(actor.id)) {
                entry.entityGates.restrictToActors.push(actor.id);
              }
            } else {
              entry.entityGates.restrictToActors = entry.entityGates.restrictToActors.filter(id => id !== actor.id);
            }
            A.State.notify();
          };
          actorCheckboxes.appendChild(label);
        });
        entityContent.appendChild(actorCheckboxes);
      }

      gatesSec.appendChild(createCollapsible('👤 Entity Gates', entityContent, entry.entityGates.restrictToActors.length > 0));

      body.appendChild(gatesSec);

      // --- TAG GATES SECTION (Original Aura Logic) ---
      const auraSec = document.createElement('div');
      auraSec.className = 'l-sec';
      auraSec.innerHTML = `<div class="l-lab" style="margin-bottom:8px;">Tag Logic & Shifts</div>`;

      // Tag Pickers
      const rowTags = document.createElement('div');
      rowTags.className = 'l-row';
      renderTagPicker(rowTags, 'Requires Tags', entry.requireTags, () => A.State.notify());
      renderTagPicker(rowTags, 'Blocks Tags', entry.blocksTags, () => A.State.notify());
      auraSec.appendChild(rowTags);

      const rowEmit = document.createElement('div');
      rowEmit.className = 'l-row';
      renderTagPicker(rowEmit, 'Emits Tags', entry.tags, () => A.State.notify());
      auraSec.appendChild(rowEmit);

      // Shifts UI
      const shiftsDiv = document.createElement('div');
      shiftsDiv.className = 'l-col';
      shiftsDiv.style.marginTop = '8px';

      renderShifts(shiftsDiv, entry);
      auraSec.appendChild(shiftsDiv);

      body.appendChild(auraSec);
      editorCol.appendChild(body);

      // Initialize Quill for Content field (MUST happen after body is attached to DOM)
      if (A.QuillManager && typeof Quill !== 'undefined') {
        A.QuillManager.init('quill-content', {
          placeholder: 'Enter lorebook entry content...',
          onChange: (quill, html) => {
            entry.content = html;
            A.State.notify();
            // Debounce toast for content to avoid spam, or just rely on auto-save assurance. 
            // For rich text, a "Saved" indicator is often better than a toast. 
            // We'll skip toast here to avoid spamming while typing.
          }
        });
        // Set initial content
        A.QuillManager.setHTML('quill-content', entry.content || '');
      }

      // Attach AI Assistant to Entry Content
      if (A.UI.Assistant && A.QuillManager) {
        A.UI.Assistant.attach(document.getElementById('quill-content'), {
          label: 'Lore Entry',
          system: 'You are a world-building expert. Write or improve this lorebook entry. Focus on detail, history, and consistency.',
          getValue: () => A.QuillManager.getText('quill-content'),
          setValue: (val) => A.QuillManager.setText('quill-content', val)
        });
      }
    };

    // --- Sub-Helper: Shifts Render ---
    function renderShifts(container, entry) {
      container.innerHTML = '';
      const shifts = entry.shifts || []; // Safety

      // MODE: EDITING
      if (typeof editingShiftIndex === 'number' && shifts[editingShiftIndex]) {
        const shift = shifts[editingShiftIndex];

        // Ensure Data Structure (Fixing keys vs keywords consistency)
        if (!shift.keywords) shift.keywords = shift.keys || [];
        delete shift.keys; // Migrate if present
        if (!shift.requireTags) shift.requireTags = [];
        if (!shift.blocksTags) shift.blocksTags = [];
        if (!shift.tags) shift.tags = [];

        const form = document.createElement('div');
        Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

        // Form Header
        const head = document.createElement('div');
        Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' });
        head.innerHTML = `
           <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
           <button class="btn btn-ghost btn-sm" id="btn-del-shift" style="color:var(--status-error);">Delete</button>
        `;
        /** @type {HTMLElement} */ (head.querySelector('#btn-back')).onclick = (e) => {
          e.stopPropagation();
          editingShiftIndex = null;
          renderEditor(); // Re-render to show list view
        };
        /** @type {HTMLElement} */ (head.querySelector('#btn-del-shift')).onclick = (e) => {
          e.stopPropagation();
          if (confirm('Delete this shift?')) {
            entry.shifts.splice(editingShiftIndex, 1);
            editingShiftIndex = null;
            A.State.notify();
            renderEditor(); // Re-render to show list view
          }
        };
        form.appendChild(head);

        // Fields (create as DOM elements to avoid destroying event handlers)
        const fieldsDiv = document.createElement('div');
        fieldsDiv.innerHTML = `
           <div class="l-col">
              <label class="l-lab">Trigger Keys (comma)</label>
              <input class="input" id="inp-sh-keys" value="${(shift.keywords || []).join(', ')}">
           </div>
           <div class="l-col">
              <label class="l-lab">Shifted Content</label>
              <textarea class="input" id="inp-sh-content" style="height:60px; font-family:var(--font-mono); resize:none;">${shift.content || ''}</textarea>
           </div>
        `;
        form.appendChild(fieldsDiv);

        /** @type {HTMLInputElement} */ (fieldsDiv.querySelector('#inp-sh-keys')).onchange = (e) => {
          shift.keywords = /** @type {HTMLInputElement} */ (e.target).value.split(',').map(s => s.trim()).filter(Boolean);
          A.State.notify();
        };
        /** @type {HTMLTextAreaElement} */ (fieldsDiv.querySelector('#inp-sh-content')).onchange = (e) => {
          shift.content = /** @type {HTMLTextAreaElement} */ (e.target).value;
          A.State.notify();
        };

        // Add token counter to shift content
        const shiftTextarea = form.querySelector('#inp-sh-content');
        if (shiftTextarea) {
          const label = shiftTextarea.previousElementSibling;
          if (label) A.Utils.addTokenCounter(shiftTextarea, label);

          if (A.UI.Assistant) {
            A.UI.Assistant.attach(shiftTextarea, {
              label: 'Shift Content',
              system: 'You are a world-building expert. Write or improve this lore shift content.'
            });
          }
        }

        container.appendChild(form);

        // Render Tag Pickers (append to form)
        renderTagPicker(form, 'Requires Tags', shift.requireTags, () => A.State.notify());
        renderTagPicker(form, 'Blocks Tags', shift.blocksTags, () => A.State.notify());
        renderTagPicker(form, 'Emits Tags', shift.tags, () => A.State.notify());

        return;
      }

      // MODE: LIST
      const head = document.createElement('div');
      Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
      head.innerHTML = `
        <label class="l-lab">Shifts (${shifts.length})</label>
        <button class="btn btn-ghost btn-sm" id="btn-add-shift" style="color:var(--accent-primary);">+ Add Shift</button>
      `;

      head.querySelector('#btn-add-shift').onclick = (e) => {
        e.stopPropagation();
        const newShift = { keywords: [], content: '', requireTags: [], blocksTags: [], tags: [] };
        entry.shifts.push(newShift);
        editingShiftIndex = entry.shifts.length - 1;
        A.State.notify();
        renderEditor(); // Re-render to show edit form
      };

      container.appendChild(head);

      if (shifts.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'font-size:11px; color:var(--text-muted); padding:8px; border:1px dashed var(--border-subtle); border-radius:var(--radius-md); text-align:center;';
        emptyMsg.textContent = 'No shifts defined.';
        container.appendChild(emptyMsg);
        return;
      }

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '4px' });

      shifts.forEach((sh, idx) => {
        const row = document.createElement('div');
        Object.assign(row.style, {
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', padding: '8px', cursor: 'pointer'
        });
        row.innerHTML = `
          <div style="font-size:11px; font-weight:bold; color:var(--text-primary); margin-bottom:2px;">Keys: ${(sh.keywords || sh.keys || []).join(', ') || '(No Keys)'}</div>
          <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sh.content || '(No Content)'}</div>
          <div style="font-size:9px; color:var(--text-muted); margin-top:4px; display:flex; gap:4px;">
              ${(sh.requireTags || []).length ? `<span style="color:var(--accent-primary);">Req: ${sh.requireTags.length}</span>` : ''}
              ${(sh.blocksTags || []).length ? `<span style="color:var(--status-error);">Blk: ${sh.blocksTags.length}</span>` : ''}
              ${(sh.tags || []).length ? `<span style="color:var(--text-main);">Emit: ${sh.tags.length}</span>` : ''}
          </div>
        `;
        row.onclick = (e) => {
          e.stopPropagation();
          editingShiftIndex = idx;
          renderEditor(); // Re-render to show edit form
        };
        list.appendChild(row);
      });
      container.appendChild(list);
    }

    // --- Init ---
    // List Listeners
    listCol.querySelector('#btn-add-lore').onclick = () => {
      const id = 'lore_' + uuidv4().split('-')[0];
      state.weaves.lorebook.entries[id] = {
        id: id, title: 'New Entry', keywords: [], content: '', enabled: true,
        priority: 50, category: 'uncategorized',
        requireTags: [], blocksTags: [], tags: [], shifts: [], uuid: uuidv4()
      };
      currentId = id;
      A.State.notify();
      if (A.UI.Toast) A.UI.Toast.show('New lorebook entry created', 'success');
      renderList();
      renderEditor();
    };

    listCol.querySelector('#search-lore').oninput = (e) => {
      filter = e.target.value;
      renderList();
    };

    /** @type {HTMLInputElement} */ (listCol.querySelector('#scan-depth')).onchange = (e) => {
      let val = parseInt(/** @type {HTMLInputElement} */(e.target).value) || 3;
      if (val < 1) val = 1;
      if (val > 20) val = 20;
      state.weaves.lorebook.scanDepth = val;
      // No immediate rerender needed, just state update
    };

    // View Script button - navigates to Scripts panel
    /** @type {HTMLElement} */ (listCol.querySelector('#btn-view-script')).onclick = () => {
      A.State.notify();
      if (A.UI && A.UI.switchPanel) {
        // Navigate to scripts panel (AuraBuilder will handle the merge)
        A.UI.switchPanel('scripts');
        if (A.UI.Toast) A.UI.Toast.show('Lorebook content merges into AURA.js on export', 'info');
      }
    };

    // Run Initial Renders
    renderList();
    renderEditor();
  }

  A.registerPanel('lorebook', {
    label: 'Lorebook',
    subtitle: 'World Knowledge',
    category: 'Seeds',
    render: render
  });

})(window.Anansi);
