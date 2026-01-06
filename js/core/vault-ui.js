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
    showPublishDialog: function (options) {
      const { type, subtype, title, payload, defaultName, contentPreview, onSuccess } = options;

      if (!payload && A.UI?.Toast) return A.UI.Toast.show('Cannot publish empty content', 'warning');

      const dialog = document.createElement('div');
      dialog.className = 'modal-backdrop';
      dialog.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9000; display:flex; align-items:center; justify-content:center;';

      const safePreview = (contentPreview || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300);
      const safeName = (defaultName || 'Untitled').replace(/"/g, '&quot;');

      dialog.innerHTML = `
        <div class="card" style="width:400px; box-shadow:0 4px 20px rgba(0,0,0,0.5); background:var(--bg-surface);">
          <div class="card-header"><strong>${title || '📤 Publish to Vault'}</strong></div>
          <div class="card-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="label">Name</label>
              <input type="text" class="input" id="pub-name" value="${safeName}">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="label">System / Group (Optional)</label>
              <input type="text" class="input" id="pub-group" placeholder="e.g. Combat, Inventory">
              <div style="font-size:10px; color:var(--text-muted);">Used for grouping related rules.</div>
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

      dialog.querySelector('#btn-cancel').onclick = () => dialog.remove();

      dialog.querySelector('#btn-pub-confirm').onclick = async () => {
        const name = dialog.querySelector('#pub-name').value.trim() || 'Untitled';
        const group = dialog.querySelector('#pub-group').value.trim();
        const tagsInput = dialog.querySelector('#pub-tags').value;
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        // Auto-tags
        if (type === 'scenario-block') tags.push('block');
        if (type === 'rule-block') tags.push('rule');
        if (subtype) tags.push(subtype);
        if (group) tags.push(`group:${group}`);

        const btn = dialog.querySelector('#btn-pub-confirm');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        try {
          const state = A.State.get();

          // Construct Data Package
          const dataPackage = {
            name: name,
            content: payload.content || payload, // For text blocks, payload is { content: ... } or just raw? 
            // Actually, let's standardize: payload IS the data object.
            // For Rule Blocks: payload is existing object.
            // For Scenario Blocks: payload is { content, category }.
            ...payload
          };

          // Add Group metadata to data if provided
          if (group) dataPackage.group = group;
          if (subtype) dataPackage.subtype = subtype;

          await A.VaultDB.publish(
            type,
            dataPackage,
            {
              universe: 'Universal',
              tags: tags,
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
    }
  };

  A.VaultUI = VaultUI;

})(window.Anansi);
