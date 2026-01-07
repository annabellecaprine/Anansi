/*
 * Anansi Panel: Vault Browser
 * File: js/panels/vault.js
 * Category: Seeds
 * Purpose: Browse, search, and manage items in the Vault (cross-project asset library)
 */

(function (A) {
  'use strict';

  // Persistent state
  let items = [];
  let filteredItems = [];
  let selectedId = null;
  let selectionMode = false;
  let selectedIds = new Set();
  let filters = {
    type: '',
    universe: '',
    search: '',
    tags: []
  };
  let registry = null;

  // Type icons
  const TYPE_ICONS = {
    actor: '🧑',
    lorebook: '📜',
    script: '🎭',
    location: '📍',
    event: '⚡',
    pair: '💑',
    'scenario-block': '📝',
    'rule-block': '⚙️'
  };

  // Type labels
  const TYPE_LABELS = {
    actor: 'Actors',
    lorebook: 'Lorebook',
    script: 'Scripts',
    location: 'Locations',
    event: 'Events',
    pair: 'Pairs',
    'scenario-block': 'Scenario Blocks',
    'rule-block': 'Rule Blocks'
  };

  async function loadVaultData() {
    try {
      registry = await A.VaultDB.getRegistry();
      items = await A.VaultDB.list();
      applyFilters();
    } catch (err) {
      console.error('[Vault] Failed to load vault data:', err);
      items = [];
      filteredItems = [];
    }
  }

  function applyFilters() {
    filteredItems = items.filter(item => {
      // Type filter
      if (filters.type) {
        if (filters.type.includes(':')) {
          const [mainType, subType] = filters.type.split(':');
          if (item.type !== mainType || item.data?.subtype !== subType) return false;
        } else {
          if (item.type !== filters.type) return false;
        }
      }

      // Universe filter
      if (filters.universe && item.universe !== filters.universe) return false;

      // Tag filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(t => (item.tags || []).includes(t));
        if (!hasAllTags) return false;
      }

      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const data = item.data || {};
        const searchFields = [
          data.name,
          data.title,
          data.personality,
          data.description,
          item.universe,
          item.sourceProjectName,
          ...(item.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(query)) return false;
      }

      return true;
    });

    // Sort by updatedAt descending
    filteredItems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function formatDate(isoString) {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getItemName(item) {
    const data = item.data || {};
    return data.name || data.title || 'Untitled';
  }

  function getItemPreview(item) {
    const data = item.data || {};
    const val = data.personality || data.description || data.content || '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  async function render(container) {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.gap = '16px';
    container.style.height = '100%';

    // Load data
    await loadVaultData();

    // --- Left Column: List ---
    const listCol = document.createElement('div');
    listCol.className = 'card';
    // Default to full width (flex:1)
    listCol.style.cssText = 'flex:1; display:flex; flex-direction:column; height:100%; margin-bottom:0; transition: flex 0.2s ease-in-out;';

    listCol.innerHTML = `
      <div class="card-header" style="flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <strong>🕸️ Vault</strong>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; color:var(--text-muted);">${items.length} items</span>
            <button class="btn btn-ghost btn-sm" id="btn-vault-select">Select</button>
          </div>
        </div>
        
        <!-- Selection Mode Header (hidden by default) -->
        <div id="vault-selection-header" style="display:none; width:100%; padding:8px; background:var(--bg-inset); border-radius:var(--radius-sm);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span id="vault-sel-count" style="font-size:11px; font-weight:bold;">0 selected</span>
            <button class="btn btn-ghost btn-sm" id="btn-vault-cancel-select">Cancel</button>
          </div>
        </div>
        
        <input type="text" class="input" id="vault-search" placeholder="Search..." 
               value="${filters.search}" style="width:100%; height:28px; font-size:12px;">
      </div>
      
      <div style="display:flex; gap:8px; padding:8px 12px; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated);">
        <select class="input" id="filter-type" style="flex:1; font-size:11px; height:32px;">
          <option value="">All Types</option>
          ${(() => {
        // Dynamic Subtype extraction
        const extendedTypes = new Set();
        // Base types
        Object.keys(TYPE_LABELS).forEach(t => extendedTypes.add(t));

        // Scan items for subtypes
        const subtypeMap = {};
        items.forEach(i => {
          if (i.data?.subtype) {
            const key = `${i.type}:${i.data.subtype}`;
            subtypeMap[key] = { type: i.type, subtype: i.data.subtype };
          }
        });

        let opts = Object.entries(TYPE_LABELS).map(([k, v]) =>
          `<option value="${k}" ${filters.type === k ? 'selected' : ''}>${TYPE_ICONS[k] || '📦'} ${v}</option>`
        ).join('');

        // Add divider if we have subtypes
        if (Object.keys(subtypeMap).length > 0) {
          opts += `<option disabled>──────────</option>`;
          opts += Object.entries(subtypeMap).map(([key, info]) => {
            const label = `${TYPE_ICONS[info.type] || '📦'} ${info.subtype}`;
            // If existing filter matches key (e.g. 'scenario-block:personality')
            return `<option value="${key}" ${filters.type === key ? 'selected' : ''}>${label}</option>`;
          }).join('');
        }
        return opts;
      })()}
        </select>
        <select class="input" id="filter-universe" style="flex:1; font-size:11px; height:32px;">
          <option value="">All Universes</option>
          ${(registry?.universes || []).map(u =>
        `<option value="${u}" ${filters.universe === u ? 'selected' : ''}>${u}</option>`
      ).join('')}
        </select>
      </div>

      <div id="vault-list" style="flex:1; overflow-y:auto;"></div>

      <!-- Standard Footer -->
      <div class="card-footer" id="vault-footer-standard" style="display:flex; justify-content:space-between; align-items:center; padding:8px;">
        <div style="font-size:10px; color:var(--text-muted);">
           Updated: ${registry ? formatDate(registry.lastUpdatedAt) : 'Never'}
        </div>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-ghost btn-sm" id="btn-vault-import" title="Import Vault Backup">📤 Import</button>
          <button class="btn btn-ghost btn-sm" id="btn-vault-export" title="Export Vault Backup">📥 Export</button>
        </div>
      </div>
      
      <input type="file" id="vault-import-input" accept=".vault,.json" style="display:none;">
      
      <!-- Selection Footer (hidden by default) -->
      <div class="card-footer" id="vault-footer-selection" style="display:none; padding:8px;">
        <button class="btn btn-primary btn-sm" id="btn-create-from-vault" style="width:100%;" disabled>📦 Create Project from Selection</button>
      </div>
    `;

    // --- Right Column: Detail ---
    const detailCol = document.createElement('div');
    detailCol.className = 'card';
    detailCol.id = 'vault-detail';
    // Default to hidden
    detailCol.style.cssText = 'display:none; flex-direction:column; height:100%; margin-bottom:0; width:0; overflow:hidden; transition: width 0.2s;';

    container.appendChild(listCol);
    container.appendChild(detailCol);

    // --- Event Handlers ---
    const searchInput = listCol.querySelector('#vault-search');
    const typeSelect = listCol.querySelector('#filter-type');
    const universeSelect = listCol.querySelector('#filter-universe');

    searchInput.oninput = (e) => {
      filters.search = e.target.value;
      applyFilters();
      renderList();
    };

    typeSelect.onchange = (e) => {
      filters.type = e.target.value;
      applyFilters();
      renderList();
    };

    universeSelect.onchange = (e) => {
      filters.universe = e.target.value;
      applyFilters();
      renderList();
    };

    // --- Selection Mode Handlers ---
    const updateSelectionUI = () => {
      const selHeader = listCol.querySelector('#vault-selection-header');
      const selCount = listCol.querySelector('#vault-sel-count');
      const footerStd = listCol.querySelector('#vault-footer-standard');
      const footerSel = listCol.querySelector('#vault-footer-selection');
      const createBtn = listCol.querySelector('#btn-create-from-vault');
      const selectBtn = listCol.querySelector('#btn-vault-select');

      if (selectionMode) {
        selHeader.style.display = 'block';
        selectBtn.style.display = 'none';
        footerStd.style.display = 'none';
        footerSel.style.display = 'block';
        selCount.textContent = `${selectedIds.size} selected`;
        createBtn.disabled = selectedIds.size === 0;
      } else {
        selHeader.style.display = 'none';
        selectBtn.style.display = '';
        footerStd.style.display = '';
        footerSel.style.display = 'none';
      }
    };

    listCol.querySelector('#btn-vault-select').onclick = () => {
      selectionMode = true;
      selectedIds.clear();
      updateSelectionUI();
      renderList();
    };

    listCol.querySelector('#btn-vault-cancel-select').onclick = () => {
      selectionMode = false;
      selectedIds.clear();
      updateSelectionUI();
      renderList();
    };

    listCol.querySelector('#btn-create-from-vault').onclick = async () => {
      if (selectedIds.size === 0) return;
      await createProjectFromSelection();
    };

    async function createProjectFromSelection() {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      if (selectedItems.length === 0) return;

      // Prompt for project name
      const defaultName = selectedItems[0].universe || 'New Project from Vault';
      const projectName = prompt('Enter a name for the new project:', defaultName);
      if (!projectName) return;

      try {
        // Create new project with default state
        const newState = A.State.createDefault();
        newState.meta.name = projectName;
        newState.meta.id = A.ProjectDB.generateId();
        newState.meta.created = new Date().toISOString();
        newState.meta.modified = new Date().toISOString();

        // Add actors
        const actors = selectedItems.filter(i => i.type === 'actor');
        actors.forEach(item => {
          const newId = 'actor_' + Math.random().toString(36).substr(2, 9);
          const copiedData = JSON.parse(JSON.stringify(item.data));
          copiedData.id = newId;
          copiedData.vaultLink = {
            vaultId: item.id,
            pulledVersion: item.version,
            locallyModified: false,
            lastSyncedAt: new Date().toISOString(),
            universe: item.universe,
            tags: item.tags
          };
          newState.nodes.actors.items[newId] = copiedData;
        });

        // Add lorebook entries
        const loreEntries = selectedItems.filter(i => i.type === 'lorebook');
        loreEntries.forEach(item => {
          const newId = item.type + '_' + Math.random().toString(36).substr(2, 9);
          const copiedData = JSON.parse(JSON.stringify(item.data));
          copiedData.id = newId;
          copiedData.vaultLink = {
            vaultId: item.id,
            pulledVersion: item.version,
            locallyModified: false,
            lastSyncedAt: new Date().toISOString(),
            universe: item.universe,
            tags: item.tags
          };
          newState.weaves.lorebook.entries[newId] = copiedData;
        });

        // Save and switch to new project
        await A.ProjectDB.save(newState);
        A.ProjectDB.setCurrentId(newState.meta.id);
        A.State.set(newState);
        A.State.notify();

        // Exit selection mode
        selectionMode = false;
        selectedIds.clear();
        updateSelectionUI();
        renderList();

        if (A.UI.Toast) {
          A.UI.Toast.show(`Created project "${projectName}" with ${selectedItems.length} items`, 'success');
        }

        // Switch to project panel
        if (A.UI.switchPanel) {
          A.UI.switchPanel('project');
        }
      } catch (err) {
        console.error('[Vault] Create project failed:', err);
        if (A.UI.Toast) A.UI.Toast.show('Failed to create project', 'error');
      }
    }

    // --- Import/Export Handlers ---
    listCol.querySelector('#btn-vault-export').onclick = () => {
      // Export all items
      A.VaultDB.exportVault({})
        .catch(err => {
          console.error('[Vault] Export failed:', err);
          if (A.UI.Toast) A.UI.Toast.show('Export failed', 'error');
        });
    };

    const importInput = listCol.querySelector('#vault-import-input');
    listCol.querySelector('#btn-vault-import').onclick = () => {
      importInput.click();
    };

    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          // Confirm import
          if (confirm(`Import ${data.itemCount} items from backup?\nExisting items will be preserved (unless overwritten).`)) {
            const result = await A.VaultDB.importVault(data, { overwrite: true });
            await loadVaultData();
            renderList();
            if (A.UI.Toast) A.UI.Toast.show(`Imported ${result.imported} items (${result.skipped} skipped)`, 'success');
          }
        } catch (err) {
          console.error('[Vault] Import failed:', err);
          if (A.UI.Toast) A.UI.Toast.show('Import failed: Invalid file', 'error');
        }
        importInput.value = ''; // Reset
      };
      reader.readAsText(file);
    };

    function renderList() {
      const listBody = listCol.querySelector('#vault-list');
      listBody.innerHTML = '';

      if (filteredItems.length === 0) {
        listBody.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; 
                      height:100%; color:var(--text-muted); padding:20px; text-align:center;">
            <div style="font-size:32px; margin-bottom:12px;">🕸️</div>
            <div style="font-size:13px; margin-bottom:8px;">
              ${items.length === 0 ? 'Vault is empty' : 'No items match your filters'}
            </div>
            <div style="font-size:11px; opacity:0.7;">
              ${items.length === 0
            ? 'Publish Actors or Lorebook entries to populate your Vault.'
            : 'Try adjusting your search or filters.'}
            </div>
          </div>
        `;
        return;
      }

      filteredItems.forEach(item => {
        const row = document.createElement('div');
        const isSelected = selectionMode && selectedIds.has(item.id);
        row.style.cssText = `
          padding:10px 12px; border-bottom:1px solid var(--border-subtle); cursor:pointer;
          ${!selectionMode && selectedId === item.id ? 'background:var(--bg-surface); border-left:3px solid var(--accent-primary);' : ''}
          ${isSelected ? 'background:rgba(218, 165, 32, 0.15); border-left:3px solid var(--accent-primary);' : ''}
        `;

        const name = getItemName(item);
        const preview = getItemPreview(item).substring(0, 60);

        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            ${selectionMode ? `<input type="checkbox" style="pointer-events:none;" ${isSelected ? 'checked' : ''}>` : ''}
            <span style="font-size:14px;">${TYPE_ICONS[item.type] || '📦'}</span>
            <strong style="font-size:12px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${name}
            </strong>
            
            <!-- Tags as Pills -->
            <div style="flex:1; display:flex; gap:6px; overflow:hidden; margin-left:8px;">
              ${(item.tags || []).map(t => `
                <span style="font-size:10px; padding:2px 10px; background:rgba(218, 165, 32, 0.1); border:1px solid rgba(218, 165, 32, 0.2); border-radius:12px; color:var(--accent-primary); white-space:nowrap; font-weight:500;">
                  ${t}
                </span>
              `).join('')}
            </div>

            <span style="font-size:10px; color:var(--text-muted); opacity:0.8;">
              v${item.version}
            </span>
            ${item.data?.subtype ? `<span style="font-size:9px; padding:2px 6px; background:var(--bg-inset); border:1px solid var(--border-subtle); border-radius:8px; color:var(--text-secondary); margin-left:4px;">${item.data.subtype}</span>` : ''}
          </div>
          <div style="font-size:10px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${selectionMode ? 'margin-left:24px;' : ''}">
            ${item.universe ? `<span style="color:var(--accent-primary);">${item.universe}</span> • ` : ''}
            ${item.sourceProjectName || 'Unknown Project'}
          </div>
          ${preview ? `<div style="font-size:10px; color:var(--text-muted); margin-top:4px; opacity:0.7; 
                                    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${selectionMode ? 'margin-left:24px;' : ''}">
            ${preview}...
          </div>` : ''}
        `;

        row.onclick = () => {
          if (selectionMode) {
            if (selectedIds.has(item.id)) {
              selectedIds.delete(item.id);
            } else {
              selectedIds.add(item.id);
            }
            updateSelectionUI();
            renderList();
          } else {
            selectedId = item.id;
            updateLayout();
            renderList();
            renderDetail(item);
          }
        };

        listBody.appendChild(row);
      });
    }

    function renderDetail(item) {
      if (!item) {
        detailCol.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; 
                      height:100%; color:var(--text-muted);">
            <div style="font-size:32px; margin-bottom:12px;">📋</div>
            <div style="font-size:13px;">Select an item to view details</div>
          </div>
        `;
        return;
      }

      const name = getItemName(item);
      const data = item.data || {};

      detailCol.innerHTML = `
        <div class="card-header" style="flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; flex:1;">
            <span style="font-size:20px;">${TYPE_ICONS[item.type] || '📦'}</span>
            <div>
              <div style="font-weight:bold; font-size:14px;">${name}</div>
              <div style="font-size:10px; color:var(--text-muted);">
                 ${TYPE_LABELS[item.type] || item.type}
                 ${item.data?.subtype ? `<span style="margin-left:8px; padding:1px 4px; border:1px solid var(--border-subtle); border-radius:4px;">${item.data.subtype}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary btn-sm" id="btn-pull">📥 Add to Project</button>
            <button class="btn btn-ghost btn-sm" id="btn-delete-vault" style="color:var(--status-error);">🗑️ Remove from Archive</button>
          </div>
        </div>

        <div class="card-body" style="flex:1; overflow-y:auto;">
          <!-- Metadata -->
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-bottom:16px;">
            <div>
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Source Project</div>
              <div style="font-size:12px;">${item.sourceProjectName || 'Unknown'}</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Universe</div>
              <div style="font-size:12px; color:var(--accent-primary);">${item.universe || '—'}</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Version</div>
              <div style="font-size:12px;">v${item.version} (${formatDate(item.updatedAt)})</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Published</div>
              <div style="font-size:12px;">${formatDate(item.publishedAt)}</div>
            </div>
          </div>

          <!-- Tags -->
          ${item.tags && item.tags.length > 0 ? `
            <div style="margin-bottom:16px;">
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Tags</div>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${item.tags.map(t => `
                  <span style="font-size:10px; padding:2px 8px; background:var(--bg-inset); 
                               border-radius:10px; color:var(--text-secondary);">${t}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Content Preview -->
          <div style="margin-bottom:16px;">
            <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Preview</div>
            <div style="background:var(--bg-inset); padding:12px; border-radius:var(--radius-md); 
                        font-size:12px; max-height:200px; overflow-y:auto; white-space:pre-wrap;">
              ${getItemPreview(item) || '<em style="color:var(--text-muted);">No preview available</em>'}
            </div>
          </div>

          <!-- Version History -->
          ${item.versionHistory && item.versionHistory.length > 0 ? `
            <div>
              <div style="font-size:10px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Version History</div>
              <div style="background:var(--bg-inset); padding:8px; border-radius:var(--radius-md); max-height:120px; overflow-y:auto;">
                ${item.versionHistory.slice().reverse().map(v => `
                  <div style="font-size:11px; padding:4px 0; border-bottom:1px solid var(--border-subtle);">
                    <strong>v${v.version}</strong> 
                    <span style="color:var(--text-muted);">— ${formatDate(v.timestamp)}</span>
                    ${v.message ? `<div style="color:var(--text-secondary); margin-top:2px;">${v.message}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      // Pull button
      detailCol.querySelector('#btn-pull').onclick = () => pullToProject(item);

      // Delete button - removes from Vault archive only
      detailCol.querySelector('#btn-delete-vault').onclick = async () => {
        const confirmed = confirm(
          `Remove "${name}" from your Vault archive?\n\n` +
          `⚠️ This only removes it from the archive.\n` +
          `Any copies in projects are NOT affected.`
        );
        if (confirmed) {
          try {
            await A.VaultDB.delete(item.id);
            selectedId = null;
            await loadVaultData();
            renderList();
            renderDetail(null);
            if (A.UI.Toast) A.UI.Toast.show(`Removed "${name}" from Vault archive`, 'info');
          } catch (err) {
            console.error('[Vault] Delete failed:', err);
            if (A.UI.Toast) A.UI.Toast.show('Failed to remove from Vault', 'error');
          }
        }
      };
    }

    async function pullToProject(item) {
      const state = A.State.get();
      const name = getItemName(item);

      // Determine target based on type
      let targetPath, existingItems, idField;
      if (item.type === 'actor') {
        if (!state.nodes) state.nodes = {};
        if (!state.nodes.actors) state.nodes.actors = { items: {} };
        targetPath = state.nodes.actors.items;
        idField = 'id';
      } else if (item.type === 'lorebook') {
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };
        targetPath = state.weaves.lorebook.entries;
        idField = 'id';
      } else if (item.type === 'scenario-block') {
        // Copy to clipboard
        const content = item.data?.content || '';
        navigator.clipboard.writeText(content);
        if (A.UI.Toast) A.UI.Toast.show(`Copied "${name}" to clipboard`, 'success');
        if (A.UI.Toast) A.UI.Toast.show(`Copied "${name}" to clipboard`, 'success');
        return; // Don't add to project nodes
      } else if (item.type === 'rule-block') {
        // Copy to clipboard or warn? Rule blocks are complex.
        if (A.UI.Toast) A.UI.Toast.show(`Importing rule logic...`, 'info');
        // TODO: Implement rule block import to Advanced/Scoring
      } else if (item.type === 'voice-config') {
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.voices) state.weaves.voices = { voices: [], debug: false, enabled: true };

        const copiedData = JSON.parse(JSON.stringify(item.data));

        // Add vaultLink
        copiedData.vaultLink = {
          vaultId: item.id,
          pulledVersion: item.version,
          locallyModified: false,
          lastSyncedAt: new Date().toISOString(),
          universe: item.universe,
          tags: item.tags
        };

        state.weaves.voices.voices.push(copiedData);
        A.State.notify();
        if (A.UI.Toast) A.UI.Toast.show(`Added voice "${name}" to project`, 'success');
        return;

      } else if (item.type === 'script') {
        // Scripts use the Scripts manager instead of direct state path
        const copiedData = JSON.parse(JSON.stringify(item.data));
        const newId = A.Scripts.create(copiedData.name || 'Imported Script', copiedData.source?.code || '');

        // Add vaultLink
        A.Scripts.update(newId, {
          vaultLink: {
            vaultId: item.id,
            pulledVersion: item.version,
            locallyModified: false,
            lastSyncedAt: new Date().toISOString(),
            universe: item.universe,
            tags: item.tags
          }
        });

        if (A.UI.Toast) A.UI.Toast.show(`Added script "${name}" to project`, 'success');
        return;

      } else {
        if (A.UI.Toast) A.UI.Toast.show(`Pull not yet supported for ${item.type}`, 'warning');
        return;
      }

      // Generate new ID to avoid conflicts
      const newId = item.type + '_' + Math.random().toString(36).substr(2, 9);
      const copiedData = JSON.parse(JSON.stringify(item.data));
      copiedData[idField] = newId;

      // Add vaultLink to track source
      copiedData.vaultLink = {
        vaultId: item.id,
        pulledVersion: item.version,
        locallyModified: false,
        lastSyncedAt: new Date().toISOString(),
        universe: item.universe,
        tags: item.tags
      };

      // Add to project
      targetPath[newId] = copiedData;
      A.State.notify();

      if (A.UI.Toast) A.UI.Toast.show(`Added "${name}" to project`, 'success');
    }

    // --- Dynamic Layout Helper ---
    function updateLayout() {
      if (selectedId) {
        listCol.style.flex = '0 0 320px';
        detailCol.style.display = 'flex';
        // Small timeout to allow display:flex to apply before width transition if needed
        requestAnimationFrame(() => {
          detailCol.style.width = 'auto';
          detailCol.style.flex = '1';
        });
      } else {
        listCol.style.flex = '1';
        detailCol.style.display = 'none';
        detailCol.style.width = '0';
      }
    }

    // --- Global Key Handler for ESC ---
    const handleKeydown = (e) => {
      if (!container.isConnected) {
        document.removeEventListener('keydown', handleKeydown);
        return;
      }
      if (e.key === 'Escape') {
        if (selectionMode) {
          selectionMode = false;
          selectedIds.clear();
          updateSelectionUI();
          renderList();
        } else if (selectedId) {
          selectedId = null;
          updateLayout();
          renderList();
          renderDetail(null);
        }
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Initial render
    updateLayout();
    renderList();
    renderDetail(null);
  }

  A.registerPanel('vault', {
    label: 'Vault',
    subtitle: 'Archive',
    category: 'Seeds',
    render: render
  });

  // Local Tour Registration (Fallback)
  if (A.UI && A.UI.Tour) {
    A.UI.Tour.register('vault', [
      {
        target: '#vault-search',
        title: 'Search & Filtering',
        content: 'Find assets by name, tag, or content. You can also filter by <strong>Universe</strong> to keep your assets organized.'
      },
      {
        target: '#filter-type',
        title: 'Content Discovery',
        content: 'Filter by Actors, Lore, Scripts, or even specific subtypes like "Personality" or "Voice".'
      },
      {
        target: '#vault-list',
        title: 'Your Archive',
        content: 'The list shows your stored assets. The ✅ icon means an item is in sync, while 🔄 indicates a local update is available.'
      },
      {
        target: '#btn-pull',
        title: 'Pull into Project',
        content: 'Click <strong>Pull to Project</strong> to import an asset from your Vault. It will be added to your current workspace instantly.'
      }
    ]);
  }

})(window.Anansi);
