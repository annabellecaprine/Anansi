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
    'rule-block': '⚙️',
    'map_template': '🗺️'
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
    'rule-block': 'Rule Blocks',
    'map_template': 'Map Templates'
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

  /**
   * Translate rule-block data into human-readable text
   */
  function translateRuleBlock(data) {
    const subtype = data.subtype || '';
    const lines = [];

    // Handle Lists
    if (subtype === 'custom-list' || subtype === 'list') {
      const items = (data.itemsText || '').split('\n').filter(s => s.trim());
      lines.push(`📋 List with ${items.length} keywords`);
      if (items.length > 0) {
        lines.push(`Keywords: ${items.slice(0, 5).join(', ')}${items.length > 5 ? '...' : ''}`);
      }
      return lines.join('\n');
    }

    // Handle Derived Values
    if (subtype === 'custom-derived' || subtype === 'derived') {
      lines.push(`📊 Derived Metric`);
      lines.push(`Source: ${data.sourceType || 'listCount'}`);
      lines.push(`Window: Last ${data.window || 10} messages`);
      return lines.join('\n');
    }

    // Handle Scoring Topics
    if (subtype === 'topic') {
      const kw = (data.keywordsText || '').split('\n').filter(s => s.trim());
      lines.push(`🎯 Scoring Topic`);
      lines.push(`Target: ${data.target || 'personality'}`);
      lines.push(`Threshold: ${data.min || 1}+ matches`);
      lines.push(`Keywords: ${kw.slice(0, 5).join(', ')}${kw.length > 5 ? '...' : ''}`);
      return lines.join('\n');
    }

    // Handle Advanced Scoring
    if (subtype === 'advanced') {
      lines.push(`⚡ Advanced Scoring Rule`);
      lines.push(`Target: ${data.target || 'personality'}`);
      const conds = data.conditions || {};
      if (conds.keywordsEnabled) lines.push(`• Keyword condition enabled`);
      if (conds.windowEnabled) lines.push(`• Message window: ${conds.windowMin}-${conds.windowMax}`);
      if (conds.scoringEnabled) lines.push(`• Depends on scoring topic`);
      return lines.join('\n');
    }

    // Handle Rule Chains (custom-chain, rule, chain)
    if (data.chain && Array.isArray(data.chain)) {
      lines.push(`🔗 Logic Chain with ${data.chain.length} block(s)`);

      data.chain.forEach((block, idx) => {
        const blockType = (block.type || 'if').toUpperCase();
        const condCount = (block.conditions || []).length;
        const actionCount = (block.actions || []).length;

        if (block.type === 'else') {
          lines.push(`  ${idx + 1}. ELSE → ${actionCount} action(s)`);
        } else {
          lines.push(`  ${idx + 1}. ${blockType} ${condCount} condition(s) → ${actionCount} action(s)`);

          // Describe conditions briefly
          (block.conditions || []).forEach(c => {
            const condType = c.type || 'unknown';
            if (condType.includes('List')) {
              lines.push(`      • Check list match`);
            } else if (condType === 'derivedNumberComparison') {
              lines.push(`      • Check derived value ${c.op || '>='} ${c.threshold || 0}`);
            } else if (condType === 'messageCountComparison') {
              lines.push(`      • Check message count ${c.op || '>='} ${c.threshold || 0}`);
            }
          });
        }
      });

      return lines.join('\n');
    }

    // Fallback
    return data.contextField || data.content || JSON.stringify(data).slice(0, 200);
  }

  function getItemPreview(item) {
    const data = item.data || {};

    // Use translator for rule-blocks
    if (item.type === 'rule-block') {
      const translated = translateRuleBlock(data);
      return typeof translated === 'string' ? translated : String(translated);
    }

    const val = data.personality || data.description || data.content || '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  async function render(container) {
    container.innerHTML = '';
    container.innerHTML = '';
    container.className = 'panel-container split-view';
    // container.style.display & gap are handled by split-view

    // Load data
    await loadVaultData();

    // --- Left Column: List ---
    const listCol = document.createElement('div');
    listCol.className = 'card split-col';
    // Default to full width (flex:1) - inline style for transition handling
    listCol.style.cssText = 'flex:1; margin-bottom:0; transition: flex 0.2s ease-in-out;';

    listCol.innerHTML = `
      <div class="card-header flex-col gap-sm">
        <div class="flex-row justify-between items-center w-full">
          <strong>🕸️ Vault</strong>
          <div class="flex-row items-center gap-sm">
            <span class="text-xs text-muted">${items.length} items</span>
            <button class="btn btn-ghost btn-sm" id="btn-vault-select">Select</button>
          </div>
        </div>
        
        <!-- Selection Mode Header (hidden by default) -->
        <div id="vault-selection-header" class="hidden w-full p-sm bg-inset rounded-sm">
          <div class="flex-row justify-between items-center">
            <span id="vault-sel-count" class="text-xs font-bold">0 selected</span>
            <button class="btn btn-ghost btn-sm" id="btn-vault-cancel-select">Cancel</button>
          </div>
        </div>
        
        <input type="text" class="input w-full h-7 text-xs" id="vault-search" placeholder="Search..." value="${filters.search}">
      </div>
      
      <div class="flex-row gap-sm p-sm border-b border-subtle bg-elevated">
        <select class="input flex-1 text-xs h-8" id="filter-type">
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
        <select class="input flex-1 text-xs h-8" id="filter-universe">
          <option value="">All Universes</option>
          ${(registry?.universes || []).map(u =>
        `<option value="${u}" ${filters.universe === u ? 'selected' : ''}>${u}</option>`
      ).join('')}
        </select>
      </div>

      <div id="vault-list" class="scroll-list"></div>

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
      

      
      <!-- Selection Footer (hidden by default) -->
      <div class="card-footer" id="vault-footer-selection" style="display:none; padding:8px;">
        <button class="btn btn-primary btn-sm" id="btn-create-from-vault" style="width:100%;" disabled>📦 Create Project from Selection</button>
      </div>
    `;

    // --- Right Column: Detail ---
    const detailCol = document.createElement('div');
    detailCol.className = 'card split-col';
    detailCol.id = 'vault-detail';
    // Default to hidden - inline style for transition handling
    detailCol.style.cssText = 'display:none; margin-bottom:0; width:0; overflow:hidden; transition: width 0.2s;';

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

    listCol.querySelector('#btn-vault-import').onclick = async () => {
      try {
        const { content } = await A.IO.open({ accept: '.vault,.json,.vault.json', as: 'json' });
        if (!content) return;

        // Confirm import
        const itemCount = content.itemCount || (content.items ? content.items.length : 0);
        if (confirm(`Import ${itemCount} items from backup?\nExisting items will be preserved (unless overwritten).`)) {
          const result = await A.VaultDB.importVault(content, { overwrite: true });
          await loadVaultData();
          renderList();
          if (A.UI.Toast) A.UI.Toast.show(`Imported ${result.imported} items (${result.skipped} skipped)`, 'success');
        }
      } catch (err) {
        console.error('[Vault] Import failed:', err);
        if (A.UI.Toast) A.UI.Toast.show('Import failed: Invalid file', 'error');
      }
    };

    function renderList() {
      const listBody = listCol.querySelector('#vault-list');
      listBody.innerHTML = '';

      if (filteredItems.length === 0) {
        listBody.innerHTML = `
          <div class="flex-col items-center justify-center h-full text-muted p-lg text-center">
            <div class="text-3xl mb-sm">🕸️</div>
            <div class="text-sm mb-xs">
              ${items.length === 0 ? 'Vault is empty' : 'No items match your filters'}
            </div>
            <div class="text-xs opacity-70">
              ${items.length === 0
            ? 'Publish Actors or Lorebook entries to populate your Vault.'
            : 'Try adjusting your search or filters.'}
            </div>
          </div>
        `;
        return;
      }

      filteredItems.forEach((item, idx) => {
        const row = document.createElement('div');
        const isSelected = selectionMode && selectedIds.has(item.id);
        const isActive = !selectionMode && selectedId === item.id;

        row.className = 'list-item';
        if (isActive || isSelected) row.classList.add('active');
        if (isSelected) row.style.background = 'rgba(218, 165, 32, 0.15)'; // Special color for selection mode

        const name = getItemName(item);
        const preview = String(getItemPreview(item) || '').substring(0, 60);

        const firstTag = (item.tags && item.tags.length > 0) ? item.tags[0] : '';
        const project = item.universe || item.sourceProjectName || 'Unknown Project';

        row.innerHTML = `
          <div class="flex-col w-full gap-xxs" style="align-items:stretch;">
            <!-- Line 1: Header -->
            <div class="flex-row items-center gap-sm w-full mb-xxs">
              ${selectionMode ? `<input type="checkbox" class="pointer-events-none mr-sm" ${isSelected ? 'checked' : ''}>` : ''}
              <span class="text-sm border border-subtle bg-base rounded-sm px-xs">${TYPE_ICONS[item.type] || '📦'}</span>
              <strong class="text-sm text-primary truncate flex-1">${name}</strong>
              ${firstTag ? `<span class="px-xs py-xxs bg-accent-subtle rounded-xl text-accent border border-accent-subtle text-xxs font-medium whitespace-nowrap">${firstTag}</span>` : ''}
              <span class="text-xxs text-muted opacity-60">v${item.version}</span>
            </div>

            <!-- Line 2: Project -->
            <div class="text-xs font-bold text-accent mb-xxs truncate w-full">
              ${project}
            </div>

            <!-- Line 3: Content Snippet -->
            ${preview ? `<div class="text-xs text-muted opacity-70 truncate w-full italic">
              "${preview}..."
            </div>` : ''}
          </div>
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
          <div class="flex-col items-center justify-center h-full text-muted">
            <div class="text-3xl mb-sm">📋</div>
            <div class="text-xs">Select an item to view details</div>
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
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="btn-pull">📥 Add to Project</button>
            ${item.blockId ? `<button class="btn btn-ghost btn-sm" id="btn-pull-block" style="border-color:cornflowerblue; color:cornflowerblue;">📦 Add Block to Project</button>` : ''}
            <button class="btn btn-ghost btn-sm" id="btn-delete-vault" style="color:var(--status-error);">🗑️ Remove</button>
          </div>
        </div>

          ${item.blockId ? `
          <div style="padding:8px 12px; background:rgba(100, 149, 237, 0.1); border-bottom:1px solid rgba(100, 149, 237, 0.3); display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px;">📦</span>
            <div style="flex:1;">
              <div style="font-size:11px; font-weight:bold; color:cornflowerblue;">Part of Block: ${item.blockName || 'Unknown'}</div>
              <div style="font-size:10px; color:var(--text-muted);" id="block-items-count">Loading block items...</div>
            </div>
          </div>
        ` : ''
        }

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

      // Pull Block button (if exists)
      const btnPullBlock = detailCol.querySelector('#btn-pull-block');
      if (btnPullBlock && item.blockId) {
        btnPullBlock.onclick = async () => {
          try {
            const blockItems = await A.VaultDB.getBlockItems(item.blockId);
            if (blockItems.length === 0) {
              if (A.UI.Toast) A.UI.Toast.show('No items found in this block', 'warning');
              return;
            }

            const confirmed = confirm(
              `Import entire block "${item.blockName}" ?\n\n` +
              `This will add ${blockItems.length} items to your project.`
            );
            if (!confirmed) return;

            let imported = 0;
            for (const blockItem of blockItems) {
              try {
                await pullToProject(blockItem, true); // silent mode
                imported++;
              } catch (err) {
                console.warn('[Vault] Failed to import block item:', blockItem.id, err);
              }
            }

            if (A.UI.Toast) A.UI.Toast.show(`Imported ${imported} items from block "${item.blockName}"`, 'success');
          } catch (err) {
            console.error('[Vault] Block import failed:', err);
            if (A.UI.Toast) A.UI.Toast.show('Failed to import block', 'error');
          }
        };

        // Load block items count
        A.VaultDB.getBlockItems(item.blockId).then(blockItems => {
          const countEl = detailCol.querySelector('#block-items-count');
          if (countEl) {
            const typeCounts = {};
            blockItems.forEach(bi => {
              const t = bi.type || 'unknown';
              typeCounts[t] = (typeCounts[t] || 0) + 1;
            });
            const summary = Object.entries(typeCounts).map(([t, c]) => `${c} ${TYPE_LABELS[t] || t} `).join(', ');
            countEl.textContent = `${blockItems.length} items: ${summary} `;
          }
        }).catch(() => { });
      }

      // Delete button - removes from Vault archive only
      detailCol.querySelector('#btn-delete-vault').onclick = async () => {
        const confirmed = confirm(
          `Remove "${name}" from your Vault archive ?\n\n` +
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

    async function pullToProject(item, silent = false) {
      const state = A.State.get();
      const name = getItemName(item);

      // Helper for unique ID
      const uid = (prefix) => prefix + '_' + Math.random().toString(36).substr(2, 9);

      // Determine target based on type
      let targetPath, idField;
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
        if (!silent && A.UI.Toast) A.UI.Toast.show(`Copied "${name}" to clipboard`, 'success');
        return;
      } else if (item.type === 'rule-block') {
        // Import rule block based on subtype
        const subtype = item.data?.subtype || '';
        const copiedData = JSON.parse(JSON.stringify(item.data));
        copiedData.id = uid('imp');
        copiedData.vaultLink = {
          vaultId: item.id,
          pulledVersion: item.version,
          locallyModified: false,
          lastSyncedAt: new Date().toISOString()
        };

        // Route to correct array based on subtype
        if (subtype === 'custom-list' || subtype === 'list') {
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.lists) state.sbx.lists = [];
          state.sbx.lists.push(copiedData);
        } else if (subtype === 'custom-derived' || subtype === 'derived') {
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.derived) state.sbx.derived = [];
          state.sbx.derived.push(copiedData);
        } else if (subtype === 'custom-chain' || subtype === 'rule' || subtype === 'chain') {
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.rules) state.sbx.rules = [];
          state.sbx.rules.push(copiedData);
        } else if (subtype === 'topic') {
          if (!state.scoring) state.scoring = { topics: [], advanced: [] };
          if (!state.scoring.topics) state.scoring.topics = [];
          state.scoring.topics.push(copiedData);
        } else if (subtype === 'advanced') {
          if (!state.scoring) state.scoring = { topics: [], advanced: [] };
          if (!state.scoring.advanced) state.scoring.advanced = [];
          state.scoring.advanced.push(copiedData);
        } else {
          // Default to rules
          if (!state.sbx) state.sbx = { lists: [], derived: [], rules: [] };
          if (!state.sbx.rules) state.sbx.rules = [];
          state.sbx.rules.push(copiedData);
        }

        A.State.notify();
        if (!silent && A.UI.Toast) A.UI.Toast.show(`Added "${name}" to project`, 'success');
        return;

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
        if (!silent && A.UI.Toast) A.UI.Toast.show(`Added voice "${name}" to project`, 'success');
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

        if (!silent && A.UI.Toast) A.UI.Toast.show(`Added script "${name}" to project`, 'success');
        return;

      } else if (item.type === 'map_template') {
        // Map templates import into Locations panel
        if (!state.weaves) state.weaves = {};

        // Ensure map structure exists
        if (!state.weaves.maps || state.weaves.maps.length === 0) {
          state.weaves.maps = [{ id: 'map_default', name: 'Main Map', type: 'region', locations: [] }];
          state.weaves.activeMap = 'map_default';
        }

        // Use active map or default
        const activeId = state.weaves.activeMap || state.weaves.maps[0].id;
        const targetMap = state.weaves.maps.find(m => m.id === activeId) || state.weaves.maps[0];

        const template = item.data;
        if (!targetMap.locations) targetMap.locations = [];
        const existingIds = new Set(targetMap.locations.map(l => l.id));
        const idMap = {};

        // Generate unique IDs and import locations
        (template.locations || []).forEach(loc => {
          let newId = `${template.id}_${loc.key} `;
          let counter = 1;
          while (existingIds.has(newId)) {
            newId = `${template.id}_${loc.key}_${counter++} `;
          }
          idMap[loc.key] = newId;

          // Grid Layout Logic
          const startCount = targetMap.locations.length;
          const idx = counter; // Use counter or local index for offset
          const gridSize = 40;
          const baseOffset = startCount;
          // Just use simple incrementing offset relative to existing count
          const effectiveIdx = targetMap.locations.length;
          const offsetX = ((effectiveIdx) % 5) * gridSize * 2;
          const offsetY = Math.floor((effectiveIdx) / 5) * gridSize * 2 + (startCount > 0 ? 100 : 0);

          targetMap.locations.push({
            id: newId,
            name: loc.name,
            description: loc.description || '',
            type: loc.type || 'location',
            expandable: loc.expandable || false,
            exits: [], // Use 'exits' schema to match Locations panel
            pos: { x: offsetX, y: offsetY }, // Apply calculated position
            _templateSource: template.id,
            vaultLink: {
              vaultId: item.id,
              pulledVersion: item.version,
              lastSyncedAt: new Date().toISOString()
            }
          });

          existingIds.add(newId);
        });

        // Add connections (Convert template connections to exits)
        (template.connections || []).forEach(conn => {
          const fromId = idMap[conn.from];
          const toId = idMap[conn.to];
          if (fromId && toId) {
            const fromLoc = targetMap.locations.find(l => l.id === fromId);
            if (fromLoc && !fromLoc.exits.includes(toId)) {
              fromLoc.exits.push(toId);
            }
          }
        });

        A.State.notify();
        if (window.renderLocationPanel) window.renderLocationPanel();


        A.State.notify();
        if (!silent && A.UI.Toast) A.UI.Toast.show(`Imported map template "${name}" with ${template.locations?.length || 0} locations`, 'success');
        return;

      } else {
        if (!silent && A.UI.Toast) A.UI.Toast.show(`Pull not yet supported for ${item.type}`, 'warning');
        return;
      }

      // Conflict Detection & Finalize
      const originalId = item.data.id;
      let finalId = null;

      function finalizeImport(useId) {
        const copiedData = JSON.parse(JSON.stringify(item.data));
        copiedData[idField] = useId;

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
        targetPath[useId] = copiedData;
        A.State.notify();

        if (!silent && A.UI.Toast) A.UI.Toast.show(`Added "${name}" to project`, 'success');
      }

      if (targetPath && originalId && targetPath[originalId]) {
        // CONFLICT DETECTED
        if (!silent && A.VaultUI && A.VaultUI.showConflictDialog) {
          return new Promise(resolve => {
            A.VaultUI.showConflictDialog({
              itemName: name,
              existingName: targetPath[originalId].name || 'Existing Item',
              type: item.type,
              onOverwrite: () => {
                finalizeImport(originalId);
                resolve();
              },
              onClone: () => {
                const newId = item.type + '_' + Math.random().toString(36).substr(2, 9);
                finalizeImport(newId);
                resolve();
              }
            });
          });
        } else {
          // Silent mode (e.g. block import) - Default to Clone to prevent dataloss
          finalId = item.type + '_' + Math.random().toString(36).substr(2, 9);
        }
      } else if (originalId) {
        // NO CONFLICT - Use Original ID (Restores State)
        finalId = originalId;
      } else {
        // Fallback (Rare)
        finalId = item.type + '_' + Math.random().toString(36).substr(2, 9);
      }

      if (finalId) finalizeImport(finalId);
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
    category: 'Loom',
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
