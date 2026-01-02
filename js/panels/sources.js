/*
 * Anansi Panel: Sources
 * File: js/panels/sources.js
 * Purpose: Manage Data Sources (Strands)
 */

(function (A) {
  'use strict';

  function render(container) {
    const state = A.State.get();
    if (!state) {
      container.innerHTML = '<div class="empty-state">No project loaded.</div>';
      return;
    }
    if (!state.strands) state.strands = {};
    if (!state.strands.sources) state.strands.sources = { items: {} };
    // Ensuring items is an object, not array, based on previous code.
    // If it's an array in some states, we might need migration, but assuming structure:
    // items: { 'id': { id, label, kind, access } }

    const items = Object.values(state.strands.sources.items || {});

    // Layout
    container.style.height = '100%';
    container.style.display = 'grid';
    container.style.gridTemplateRows = 'auto 1fr';
    container.style.gap = '16px';
    container.style.padding = '4px';

    // --- Header / Creation Form ---
    const header = document.createElement('div');
    header.className = 'card';
    header.style.padding = '16px';

    header.innerHTML = `
      <div style="font-weight:bold; margin-bottom:12px; font-size:14px;">Add Custom Source</div>
      <div style="display:flex; gap:10px; align-items:flex-end;">
        <div style="flex:1;">
          <label class="sc-lab">Source Label</label>
          <input class="input" id="new-label" placeholder="e.g. User Inventory">
        </div>
        <div style="width:120px;">
          <label class="sc-lab">Field Key</label>
          <input class="input" id="new-key" placeholder="inventory">
        </div>
        <div style="width:150px;">
          <label class="sc-lab">Access Pattern</label>
          <input class="input" id="new-access" value="{{custom.key}}" disabled style="opacity:0.7;">
        </div>
        <button class="btn btn-primary" id="btn-add">Add</button>
      </div>
      <div style="margin-top:8px; font-size:11px; color:var(--text-muted);">
        Defines a new data field that can be populated by the system or scripts. 
        Reference using <code style="color:var(--accent-primary);">{{custom.key}}</code>
      </div>
    `;

    // Interaction
    const inpLabel = header.querySelector('#new-label');
    const inpKey = header.querySelector('#new-key');
    const inpAccess = header.querySelector('#new-access');

    // Auto-update Access
    inpKey.oninput = () => {
      const cleanKey = inpKey.value.replace(/[^a-zA-Z0-9_]/g, '');
      inpAccess.value = `{{custom.${cleanKey}}}`;
    };

    // Persistence Checkbox
    const persistDiv = document.createElement('div');
    persistDiv.style.marginTop = '12px';
    persistDiv.innerHTML = `
      <label style="font-size:12px; display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" id="new-persist">
        <span style="font-weight:bold;">Make Persistent</span>
        <span style="color:var(--text-muted); font-weight:normal;">(Values changed by scripts are saved back to source)</span>
      </label>
    `;
    // Insert before the hint text (which is the last child of header currently)
    header.insertBefore(persistDiv, header.lastElementChild);

    header.querySelector('#btn-add').onclick = () => {
      const label = inpLabel.value.trim();
      let key = inpKey.value.trim().replace(/[^a-zA-Z0-9_]/g, '');
      const isPersistent = header.querySelector('#new-persist').checked;

      if (!label || !key) {
        if (A.UI.Toast) A.UI.Toast.show('Label and Key are required.', 'warning');
        return;
      }

      // Check duplications
      if (state.strands.sources.items[key]) {
        if (A.UI.Toast) A.UI.Toast.show('Source Key already exists.', 'error');
        return;
      }

      // Add Item
      state.strands.sources.items[key] = {
        id: key,
        label: label,
        kind: 'custom',
        persistent: isPersistent,
        access: `{{custom.${key}}}`
      };

      A.State.notify(); // Persist
      render(container); // Redraw
      if (A.UI.Toast) A.UI.Toast.show('Source added successfully!', 'success');
    };

    container.appendChild(header);


    // --- List View ---
    const listCard = document.createElement('div');
    listCard.className = 'card';
    listCard.style.display = 'flex';
    listCard.style.flexDirection = 'column';
    listCard.style.overflow = 'hidden';

    let listContent = '';

    if (items.length === 0) {
      listContent = '<div class="muted" style="padding:20px; text-align:center;">No sources defined.</div>';
    } else {
      items.forEach(src => {
        const isSystem = src.kind !== 'custom';
        listContent += `
          <div style="padding:12px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
             <div>
               <div style="font-weight:bold; font-size:13px; display:flex; align-items:center; gap:8px;">
                 ${src.label}
                 ${isSystem
            ? '<span style="font-size:9px; background:var(--bg-elevated); padding:2px 6px; border-radius:4px; text-transform:uppercase; color:var(--text-muted);">System</span>'
            : '<span style="font-size:9px; background:var(--accent-soft); padding:2px 6px; border-radius:4px; text-transform:uppercase; color:var(--accent-primary);">Custom</span>'}
               </div>
               <div style="font-size:11px; font-family:monospace; color:var(--text-muted); margin-top:4px;">
                  ID: ${src.id} &nbsp;&bull;&nbsp; Ref: <span style="color:var(--text-primary);">${src.access}</span>
               </div>
             </div>
             ${!isSystem ? `<button class="btn btn-ghost btn-sm btn-del" data-id="${src.id}" style="color:var(--status-error);">Delete</button>` : ''}
          </div>
        `;
      });
    }

    listCard.innerHTML = `
       <div class="card-header">
         <strong>Registered Sources</strong>
         <span class="badge" style="margin-left:auto;">${items.length}</span>
       </div>
       <div class="card-body" style="padding:0; overflow-y:auto;">
         ${listContent}
       </div>
    `;

    // Bind Deletes
    listCard.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm(`Delete source "${id}"? This may break scripts referencing it.`)) {
          delete state.strands.sources.items[id];
          A.State.notify();
          render(container);
        }
      };
    });

    container.appendChild(listCard);
  }

  A.registerPanel('sources', {
    label: 'Sources',
    subtitle: 'Strands',
    category: 'Deep',
    render: render
  });

})(window.Anansi);
