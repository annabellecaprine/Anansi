/*
 * Anansi Core: Vault UI Shared Components
 * File: js/core/vault-ui.js
 * Purpose: Shared modals for Publishing and Importing Vault items.
 */

(function (A) {
  'use strict';

  const VaultUI = {
    /**
     * Show the Publish to Vault dialog
     * @param {Object} options
     * @param {string} options.type - Item type (e.g. 'scenario-block', 'rule-block')
     * @param {string} options.subtype - Optional subtype (e.g. 'event', 'scoring')
     * @param {string} options.title - Dialog title
     * @param {Object} options.payload - The data to save
     * @param {string} options.defaultName - Initial name
     * @param {string} options.contentPreview - String to show in preview box
     * @param {Function} options.onSuccess - Callback on success
     */
    showPublishDialog: async function (options) {
      const { type, subtype, title, payload, defaultName, contentPreview, onSuccess } = options;

      if (!payload && A.UI?.Toast) return A.UI.Toast.show('Cannot publish empty content', 'warning');

      // Load existing blocks for dropdown
      let existingBlocks = {};
      try {
        existingBlocks = await A.VaultDB.getBlocks();
      } catch (e) { console.warn('[VaultUI] Could not load blocks:', e); }

      const blockOptions = Object.values(existingBlocks)
        .map(b => `<option value="${b.id}">${b.name}</option>`)
        .join('');

      const dialog = document.createElement('div');
      dialog.className = 'modal-backdrop';
      dialog.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9000; display:flex; align-items:center; justify-content:center;';

      const safePreview = (contentPreview || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300);
      const safeName = (defaultName || 'Untitled').replace(/"/g, '&quot;');

      dialog.innerHTML = `
        <div class="card" style="width:420px; box-shadow:0 4px 20px rgba(0,0,0,0.5); background:var(--bg-surface);">
          <div class="card-header"><strong>${title || '📤 Publish to Vault'}</strong></div>
          <div class="card-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="label">Name</label>
              <input type="text" class="input" id="pub-name" value="${safeName}">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="label">Rule Block (Optional)</label>
              <div style="display:flex; gap:8px;">
                <select class="input" id="pub-block" style="flex:1;">
                  <option value="">None (standalone item)</option>
                  ${blockOptions}
                </select>
                <button class="btn btn-ghost btn-sm" id="btn-new-block" title="Create new block">+ New</button>
              </div>
              <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Items in the same block can be imported together.</div>
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="label">Tags (comma separated)</label>
              <input type="text" class="input" id="pub-tags" placeholder="e.g. magic, aggressive, utility">
            </div>
            <div class="form-group">
              <label class="label">Content Preview</label>
              <div style="font-size:11px; color:var(--text-muted); max-height:80px; overflow:hidden; white-space:pre-wrap; border:1px solid var(--border-subtle); padding:4px; border-radius:4px; background:var(--bg-base);">${safePreview}</div>
            </div>
          </div>
          <div class="card-footer" style="display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn btn-ghost" id="btn-cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-pub-confirm">Publish</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // New Block button handler
      dialog.querySelector('#btn-new-block').onclick = async () => {
        const blockName = prompt('Enter a name for the new Rule Block:');
        if (!blockName || !blockName.trim()) return;

        try {
          const newBlock = await A.VaultDB.createBlock(null, blockName.trim());
          const select = dialog.querySelector('#pub-block');
          const opt = document.createElement('option');
          opt.value = newBlock.id;
          opt.textContent = newBlock.name;
          select.appendChild(opt);
          select.value = newBlock.id;
          if (A.UI.Toast) A.UI.Toast.show(`Created block: ${newBlock.name}`, 'success');
        } catch (err) {
          console.error('[VaultUI] Create block failed:', err);
          if (A.UI.Toast) A.UI.Toast.show('Failed to create block', 'error');
        }
      };

      dialog.querySelector('#btn-cancel').onclick = () => dialog.remove();

      dialog.querySelector('#btn-pub-confirm').onclick = async () => {
        const name = dialog.querySelector('#pub-name').value.trim() || 'Untitled';
        const blockId = dialog.querySelector('#pub-block').value || null;
        const tagsInput = dialog.querySelector('#pub-tags').value;
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        // Auto-tags
        if (type === 'scenario-block') tags.push('block');
        if (type === 'rule-block') tags.push('rule');
        if (subtype) tags.push(subtype);

        // Get block name if block selected
        let blockName = null;
        if (blockId && existingBlocks[blockId]) {
          blockName = existingBlocks[blockId].name;
        } else if (blockId) {
          // Might be newly created, refetch
          const blocks = await A.VaultDB.getBlocks();
          if (blocks[blockId]) blockName = blocks[blockId].name;
        }

        const btn = dialog.querySelector('#btn-pub-confirm');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        try {
          const state = A.State.get();

          // Construct Data Package
          const dataPackage = {
            name: name,
            ...payload
          };

          if (subtype) dataPackage.subtype = subtype;

          await A.VaultDB.publish(
            type,
            dataPackage,
            {
              universe: 'Universal',
              tags: tags,
              blockId: blockId,
              blockName: blockName,
              sourceProjectName: state.meta?.name || 'Unknown Project',
              sourceProjectId: state.meta?.id || null
            }
          );

          if (A.UI.Toast) A.UI.Toast.show('Published to Vault!', 'success');
          dialog.remove();
          if (onSuccess) onSuccess();
        } catch (err) {
          console.error(err);
          btn.disabled = false;
          btn.textContent = 'Publish';
          if (A.UI.Toast) A.UI.Toast.show('Publish failed: ' + err.message, 'error');
        }
      };
    },

    /**
     * Show the Block Picker dialog
     * @param {Object} options
     * @param {string} options.type - Item type to filter by (e.g. 'scenario-block')
     * @param {Function} options.onSelect - Callback(itemData)
     * @param {string} options.title - Dialog title
     */
    showBlockPickerDialog: function (options) {
      const { type, onSelect, title } = options;

      const dialog = document.createElement('div');
      dialog.className = 'modal-backdrop';
      dialog.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9000; display:flex; align-items:center; justify-content:center;';

      dialog.innerHTML = `
         <div class="card" style="width:600px; height:500px; display:flex; flex-direction:column; box-shadow:0 4px 20px rgba(0,0,0,0.5); background:var(--bg-surface);">
           <div class="card-header" style="justify-content:space-between;">
             <strong>${title || '📥 Select from Vault'}</strong>
             <button class="btn btn-ghost btn-sm" id="btn-close">✕</button>
           </div>
           <div class="card-body" style="padding:8px; display:flex; flex-direction:column; gap:8px; overflow:hidden;">
              <div style="display:flex; gap:8px;">
                 <input type="text" class="input" id="picker-search" placeholder="Search items..." style="flex:1;">
                 <select class="input" id="picker-group-filter" style="width:150px;">
                    <option value="">All Groups</option>
                 </select>
              </div>
              <div id="picker-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
                <div style="padding:20px; text-align:center; color:var(--text-muted);">Loading...</div>
              </div>
           </div>
         </div>
       `;

      document.body.appendChild(dialog);

      const listEl = dialog.querySelector('#picker-list');
      const groupSelect = dialog.querySelector('#picker-group-filter');
      let allItems = [];
      let groups = new Set();

      const renderPickerList = (query = '', groupFilter = '') => {
        query = query.toLowerCase();
        const filtered = allItems.filter(b => {
          const name = (b.data?.name || 'Untitled').toLowerCase();
          const contentStr = JSON.stringify(b.data || {}).toLowerCase();
          const tags = (b.tags || []).join(' ').toLowerCase();
          const group = (b.data?.group || '').toLowerCase();

          const matchesQuery = name.includes(query) || contentStr.includes(query) || tags.includes(query);
          const matchesGroup = !groupFilter || group === groupFilter.toLowerCase();

          return matchesQuery && matchesGroup;
        });

        listEl.innerHTML = '';
        if (filtered.length === 0) {
          listEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);">No items found.</div>';
          return;
        }

        filtered.forEach(b => {
          const row = document.createElement('div');
          row.className = 'picker-row';
          row.style.cssText = 'padding:8px; border:1px solid var(--border-subtle); border-radius:4px; cursor:pointer; display:flex; flex-direction:column; gap:4px; transition: background 0.2s;';

          // Subtype Badge
          const subtype = b.data?.subtype ? `<span style="font-size:9px; background:var(--bg-base); border:1px solid var(--border-subtle); padding:1px 4px; border-radius:3px;">${b.data.subtype}</span>` : '';
          const groupBadge = b.data?.group ? `<span style="font-size:9px; background:var(--accent-primary); color:white; padding:1px 4px; border-radius:3px;">${b.data.group}</span>` : '';

          // Content Preview (Text vs Object)
          let preview = '';
          if (typeof b.data?.content === 'string') {
            preview = b.data.content.slice(0, 100);
          } else if (b.data?.payload) {
            preview = JSON.stringify(b.data.payload).slice(0, 100);
          } else {
            preview = JSON.stringify(b.data).slice(0, 100);
          }

          row.innerHTML = `
               <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong>${(b.data?.name || 'Untitled').replace(/</g, '&lt;')}</strong>
                    ${groupBadge}
                    ${subtype}
                  </div>
                  <span style="font-size:10px; color:var(--text-muted);">${(b.tags || []).join(', ')}</span>
               </div>
               <div style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                 ${preview.replace(/</g, '&lt;')}
               </div>
             `;

          row.onmouseover = () => row.style.background = 'var(--bg-elevated)';
          row.onmouseout = () => row.style.background = 'transparent';
          row.onclick = () => {
            onSelect(b.data);
            dialog.remove();
          };
          listEl.appendChild(row);
        });
      };

      // Load items
      A.VaultDB.list().then(items => {
        allItems = items.filter(i => i.type === type);

        // Extract Groups
        allItems.forEach(i => {
          if (i.data?.group) groups.add(i.data.group);
        });

        // Populate Group Select
        groups.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g;
          opt.textContent = g;
          groupSelect.appendChild(opt);
        });

        renderPickerList();
      }).catch(err => {
        listEl.innerHTML = `<div style="color:var(--status-error);">Error loading vault: ${err.message}</div>`;
      });

      const searchInput = dialog.querySelector('#picker-search');
      searchInput.oninput = (e) => renderPickerList(e.target.value, groupSelect.value);
      groupSelect.onchange = (e) => renderPickerList(searchInput.value, e.target.value);

      dialog.querySelector('#btn-close').onclick = () => dialog.remove();
    },

    /**
     * Show Conflict Resolution Dialog
     * @param {Object} options
     * @param {string} options.itemName - Name of item being imported
     * @param {string} options.existingName - Name of existing item
     * @param {string} options.type - Item type
     * @param {Function} options.onOverwrite - Callback for overwrite
     * @param {Function} options.onClone - Callback for clone
     */
    showConflictDialog: function (options) {
      const { itemName, existingName, type, onOverwrite, onClone } = options;

      const dialog = document.createElement('div');
      dialog.className = 'modal-backdrop';
      dialog.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9100; display:flex; align-items:center; justify-content:center;';

      dialog.innerHTML = `
        <div class="card" style="width:400px; box-shadow:0 4px 25px rgba(0,0,0,0.6); background:var(--bg-surface); border:1px solid var(--border-subtle);">
          <div class="card-header" style="background:var(--bg-inset); border-bottom:1px solid var(--border-subtle);">
            <strong style="color:var(--status-warning);">⚠️ ID Conflict Detected</strong>
          </div>
          <div class="card-body" style="padding:16px; display:flex; flex-direction:column; gap:12px;">
            <div style="font-size:13px; line-height:1.4;">
              An actor with this ID already exists in your project.
            </div>
            
            <div style="background:var(--bg-base); padding:8px 12px; border-radius:4px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:var(--text-muted);">Incoming:</span>
                <strong>${itemName}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted);">Existing:</span>
                <strong>${existingName}</strong>
              </div>
            </div>

            <div style="font-size:12px; color:var(--text-secondary);">
              How would you like to proceed?
            </div>
          </div>
          <div class="card-footer" style="padding:12px; display:flex; flex-direction:column; gap:8px;">
            <button class="btn" id="btn-overwrite" style="background:var(--status-warning); color:var(--bg-base); justify-content:center;">
              Overwrite Existing
              <span style="font-size:10px; opacity:0.8; margin-left:8px;">(Revert/Update)</span>
            </button>
            <button class="btn btn-secondary" id="btn-clone" style="justify-content:center;">
              Create Copy
              <span style="font-size:10px; opacity:0.8; margin-left:8px;">(New ID)</span>
            </button>
            <button class="btn btn-ghost" id="btn-cancel" style="justify-content:center; margin-top:4px;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.querySelector('#btn-overwrite').onclick = () => {
        dialog.remove();
        if (onOverwrite) onOverwrite();
      };

      dialog.querySelector('#btn-clone').onclick = () => {
        dialog.remove();
        if (onClone) onClone();
      };

      dialog.querySelector('#btn-cancel').onclick = () => {
        dialog.remove();
      };
    }
  };

  A.VaultUI = VaultUI;

})(window.Anansi);
