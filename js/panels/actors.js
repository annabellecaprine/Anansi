/*
 * Anansi Panel: Actors (Rich Editor)
 * File: js/panels/actors.js
 * Category: Weave
 */

(function (A) {
    'use strict';

    let currentId = null;
    let activeTab = 'profile'; // profile, appearance, cues
    let searchTerm = ''; // Search Filter

    // State for Multi-Select
    let selectionMode = false;
    let selectedIds = new Set();

    // --- Constants ---
    // AURA Tag Systems (aligned with AURA Black Magic Edition)
    const PULSE_TAGS = ['joy', 'sadness', 'anger', 'fear', 'romance', 'neutral', 'confusion', 'positive', 'negative'];
    const EROS_TAGS = ['platonic', 'tension', 'romance', 'physical', 'passion', 'explicit', 'conflict', 'aftercare'];
    const INTENT_TAGS = ['question', 'disclosure', 'command', 'promise', 'conflict', 'smalltalk', 'meta', 'narrative'];
    const PARTS = ['ears', 'tail', 'wings', 'horns'];

    // AURA Tags for Quirk Triggers (from AURA/Lorebook)
    const AURA_TAGS = [
        'JOY', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE',
        'TRUST', 'ANTICIPATION', 'LOVE', 'AWE', 'CONTEMPT', 'OPTIMISM',
        'QUESTION', 'COMMAND', 'STATEMENT', 'GREETING', 'FAREWELL',
        'ROMANCE', 'TENSION', 'CONFLICT', 'NARRATIVE', 'DISCLOSURE'
    ];

    // HTML escape for textarea content
    function escapeForTextarea(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // --- Gallery Lightbox ---


    // --- Voice Sync Helpers ---
    function syncActorToVoices(actorId, actorName) {
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.voices) state.weaves.voices = { voices: [], debug: false, enabled: true };

        // Check if voice already exists for this actor
        const existingIndex = state.weaves.voices.voices.findIndex(v => v.actorId === actorId);

        if (existingIndex === -1) {
            // Create new voice entry
            state.weaves.voices.voices.push({
                actorId: actorId,
                enabled: true,
                characterName: actorName || 'New Actor',
                chatName: '', // User fills this in
                tag: 'V',
                attempt: { baseChance: 0.6 },
                subtones: []
            });
        } else {
            // Update existing voice name
            state.weaves.voices.voices[existingIndex].characterName = actorName;
        }
    }

    function removeActorFromVoices(actorId) {
        const state = A.State.get();
        if (!state.weaves?.voices?.voices) return;

        const idx = state.weaves.voices.voices.findIndex(v => v.actorId === actorId);
        if (idx !== -1) {
            state.weaves.voices.voices.splice(idx, 1);
        }
    }

    function render(container, context) {
        const state = A.State.get();
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '250px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. List Col
        const listCol = document.createElement('div');
        listCol.className = 'card';
        listCol.style.display = 'flex';
        listCol.style.flexDirection = 'column';
        listCol.style.height = '100%';
        listCol.style.marginBottom = '0';

        listCol.innerHTML = `
      <div class="card-header" style="flex-wrap:wrap; gap:8px;">
        <strong style="flex:1;">Actors</strong>
        <div style="flex:1;"></div>
        <div id="header-actions" style="display:flex; gap:4px;">
            <button class="btn btn-secondary btn-sm" id="btn-add-actor">+ New</button>
            <button class="btn btn-ghost btn-sm" id="btn-select-mode">Select</button>
        </div>
        
        <!-- Selection Actions Header (Alternate) -->
        <div id="header-selection" style="display:none; gap:4px; align-items:center; width:100%;">
             <span id="sel-count" style="font-size:11px; font-weight:bold; flex:1;">0 Selected</span>
             <button class="btn btn-sm btn-ghost" id="btn-cancel-select">Cancel</button>
        </div>

        <input class="input" id="search-actors" placeholder="Search..." style="width:100%; font-size:12px; height:28px;" value="${searchTerm}">
      </div>
      <div class="card-body" id="actor-list" style="padding:0; flex:1; overflow-y:auto;"></div>
      <div class="card-footer" id="footer-actions" style="display:none; padding:8px; border-top:1px solid var(--border-subtle);">
         <button class="btn btn-sm" id="btn-del-multi" style="width:100%; background:var(--status-error); color:white;">Delete Selected</button>
      </div>
    `;

        // ... [Rest of layout identical] ...

        // 2. Editor Col
        const editorCol = document.createElement('div');
        editorCol.className = 'card';
        editorCol.style.display = 'flex';
        editorCol.style.flexDirection = 'column';
        editorCol.style.height = '100%';
        editorCol.style.marginBottom = '0';
        editorCol.style.padding = '0'; // Custom padding management

        // Editor Header
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `
      <input type="text" id="actor-name" class="input" style="width:200px; font-weight:bold;" placeholder="e.g., Seraphine, The Merchant" disabled>
      <div style="flex:1;"></div>
      <button class="btn btn-secondary btn-sm" id="btn-vault-actor" disabled>📤 Vault</button>
      <button class="btn btn-ghost btn-sm" id="btn-del-actor" style="color:var(--status-error);" disabled>Delete</button>
    `;

        // Tabs (removed Voice tab)
        const tabs = document.createElement('div');
        tabs.style.display = 'flex';
        tabs.style.borderBottom = '1px solid var(--border-subtle)';
        tabs.style.background = 'var(--bg-elevated)';

        // const state = A.State.get(); // Duplicate declaration removed

        tabs.innerHTML = `
      <div class="tab-btn active" data-tab="profile">Profile</div>
      <div class="tab-btn" data-tab="appearance">Appearance</div>
      <div class="tab-btn" data-tab="cues">Cues</div>
    `;


        // Tab Styles (apply immediately so tabs look styled before any actor is selected)
        const tabStyle = document.createElement('style');
        tabStyle.textContent = `
          .tab-btn { padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: color 0.1s, border-color 0.1s; }
          .tab-btn:hover { color: var(--text-primary); }
          .tab-btn.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        `;
        tabs.appendChild(tabStyle);

        // Tab Content Area
        const content = document.createElement('div');
        content.className = 'card-body';
        content.style.flex = '1';
        content.style.overflowY = 'auto';
        content.id = 'actor-content';

        editorCol.appendChild(header);
        editorCol.appendChild(tabs);
        editorCol.appendChild(content);

        container.appendChild(listCol);
        container.appendChild(editorCol);

        // --- Logic ---
        // --- Logic ---
        const listBody = listCol.querySelector('#actor-list');
        const nameInput = /** @type {HTMLInputElement} */ (header.querySelector('#actor-name'));
        const delBtn = /** @type {HTMLButtonElement} */ (header.querySelector('#btn-del-actor'));
        const vaultBtn = /** @type {HTMLButtonElement} */ (header.querySelector('#btn-vault-actor'));
        const searchInput = /** @type {HTMLInputElement} */ (listCol.querySelector('#search-actors'));
        const addBtn = /** @type {HTMLButtonElement} */ (listCol.querySelector('#btn-add-actor'));

        // Handle Context
        if (context && context.createNew) {
            // Defer slightly to ensure DOM is ready if needed, though usually sync is fine
            setTimeout(() => addBtn.click(), 50);
        }

        searchInput.oninput = (e) => {
            const target = /** @type {HTMLInputElement} */ (e.target);
            searchTerm = target.value.toLowerCase();
            refreshList();
        };

        // --- Multi-Select Handlers ---
        const updateHeaderState = () => {
            const hId = /** @type {HTMLElement} */ (listCol.querySelector('#header-actions'));
            const hSel = /** @type {HTMLElement} */ (listCol.querySelector('#header-selection'));
            const footer = /** @type {HTMLElement} */ (listCol.querySelector('#footer-actions'));

            if (selectionMode) {
                hId.style.display = 'none';
                hSel.style.display = 'flex';
                footer.style.display = 'block';
                listCol.querySelector('#sel-count').textContent = `${selectedIds.size} Selected`;
                /** @type {HTMLButtonElement} */ (listCol.querySelector('#btn-del-multi')).disabled = selectedIds.size === 0;
                /** @type {HTMLElement} */ (listCol.querySelector('#btn-del-multi')).style.opacity = selectedIds.size === 0 ? '0.5' : '1';
                //search is still visible
            } else {
                hId.style.display = 'flex';
                hSel.style.display = 'none';
                footer.style.display = 'none';
            }
        };

        /** @type {HTMLElement} */ (listCol.querySelector('#btn-select-mode')).onclick = () => {
            selectionMode = true;
            selectedIds.clear();
            updateHeaderState();
            refreshList();
        };

        /** @type {HTMLElement} */ (listCol.querySelector('#btn-cancel-select')).onclick = () => {
            selectionMode = false;
            selectedIds.clear();
            updateHeaderState();
            refreshList();
        };

        /** @type {HTMLElement} */ (listCol.querySelector('#btn-del-multi')).onclick = () => {
            if (selectedIds.size === 0) return;
            if (confirm(`Delete ${selectedIds.size} actors? This cannot be undone.`)) {
                let count = 0;
                const state = A.State.get();
                selectedIds.forEach(id => {
                    if (state.nodes.actors.items[id]) {
                        delete state.nodes.actors.items[id];
                        count++;
                    }
                });
                selectionMode = false;
                selectedIds.clear();
                A.State.notify(); // Implicitly re-renders logic via main loop if strictly bound, but here we manually refresh

                if (A.UI.Toast) A.UI.Toast.show(`Deleted ${count} actors.`, 'success');
                updateHeaderState();
                refreshList();

                // Clear editor if current was deleted
                if (!state.nodes.actors.items[currentId]) {
                    currentId = null;
                    nameInput.value = '';
                    nameInput.disabled = true;
                    content.innerHTML = '<div style="padding:40px; text-align:center; color:gray;">Select or Create an Actor</div>';
                }
            }
        };

        function refreshList() {
            const state = A.State.get();
            if (!state) return;

            // Ensure actors node exists
            if (!state.nodes) state.nodes = {};
            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            if (!state.nodes.actors.items) state.nodes.actors.items = {};

            let actors = Object.values(state.nodes.actors.items);

            // Filter
            if (searchTerm) {
                actors = actors.filter(a => (a.name || '').toLowerCase().includes(searchTerm));
            }

            listBody.innerHTML = '';

            if (actors.length === 0) {
                listBody.innerHTML = `<div style="padding:16px; text-align:center; color:gray;">${searchTerm ? 'No matches.' : 'No actors.'}</div>`;
                return;
            }

            actors.forEach(actor => {
                const importInput = document.createElement('input');
                importInput.type = 'file';
                importInput.accept = '.json,application/json';
                importInput.onchange = (e) => {
                    const file = /** @type {HTMLInputElement} */ (e.target).files[0];
                    if (!file) return;
                };
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.borderBottom = '1px solid var(--border-subtle)';
                item.style.cursor = 'pointer';
                item.style.fontSize = '13px';

                if (actor.id === currentId && !selectionMode) {
                    item.style.backgroundColor = 'var(--bg-surface)';
                    item.style.borderLeft = '3px solid var(--accent-primary)';
                }

                // Selection Styles
                if (selectionMode && selectedIds.has(actor.id)) {
                    item.style.backgroundColor = 'rgba(218, 165, 32, 0.1)';
                    item.style.borderColor = 'var(--accent-primary)';
                    // Force border left logic override or standard border logic
                    item.style.borderLeft = '3px solid var(--accent-primary)';
                }

                // Vault sync badge
                let syncBadge = '';
                if (actor.vaultLink && actor.vaultLink.vaultId) {
                    if (actor.vaultLink.locallyModified) {
                        syncBadge = '<span title="Modified - Push to sync" style="font-size:10px; margin-left:6px; color:var(--status-warning);">🔄</span>';
                    } else {
                        syncBadge = '<span title="Synced with Vault" style="font-size:10px; margin-left:6px; color:var(--text-muted);">✅</span>';
                    }
                }

                item.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        ${selectionMode ?
                        `<input type="checkbox" style="margin-right:8px; pointer-events:none;" ${selectedIds.has(actor.id) ? 'checked' : ''}>`
                        : ''}
                        <strong>${actor.name || 'Unnamed'}</strong>
                        ${syncBadge}
                    </div>
                `;

                item.onclick = () => {
                    if (selectionMode) {
                        if (selectedIds.has(actor.id)) selectedIds.delete(actor.id);
                        else selectedIds.add(actor.id);
                        updateHeaderState();
                        refreshList();
                    } else {
                        selectActor(actor.id);
                    }
                };
                listBody.appendChild(item);
            });
        }

        function selectActor(id) {
            currentId = id;
            refreshList();

            const state = A.State.get();
            const actor = state.nodes.actors.items[id];

            if (actor) {
                nameInput.disabled = false;
                delBtn.disabled = false;
                vaultBtn.disabled = false;
                nameInput.value = actor.name || '';

                // Update vault button based on vaultLink state
                if (actor.vaultLink && actor.vaultLink.vaultId) {
                    // Already published - check if modified
                    if (actor.vaultLink.locallyModified) {
                        vaultBtn.innerHTML = '📤 Push Update';
                        vaultBtn.style.background = 'var(--status-warning)';
                        vaultBtn.style.color = 'var(--bg-base)';
                        vaultBtn.title = 'Modified since last sync - push changes to Vault';
                    } else {
                        vaultBtn.innerHTML = '✅ Synced';
                        vaultBtn.style.background = '';
                        vaultBtn.style.color = 'var(--text-muted)';
                        vaultBtn.title = `Synced with Vault v${actor.vaultLink.pulledVersion}`;
                    }
                } else {
                    // Not published yet
                    vaultBtn.innerHTML = '📤 Vault';
                    vaultBtn.style.background = '';
                    vaultBtn.style.color = '';
                    vaultBtn.title = 'Publish to Vault archive';
                }

                renderTab();
            } else {
                nameInput.disabled = true;
                nameInput.value = '';
                delBtn.disabled = true;
                vaultBtn.disabled = true;
                vaultBtn.innerHTML = '📤 Vault';
                vaultBtn.style.background = '';
                vaultBtn.style.color = '';
                content.innerHTML = '<div style="padding:40px; text-align:center; color:gray; font-size:14px;">Select or Create an Actor</div>';
            }
        }

        // --- Tab Rendering ---
        function renderTab() {
            const state = A.State.get();
            const actor = state.nodes.actors.items[currentId];
            if (!actor) return;

            content.innerHTML = '';

            // Update Tab Buttons
            if (tabs) {
                if (tabs) {
                    tabs.querySelectorAll('.tab-btn').forEach(b => {
                        const btn = /** @type {HTMLElement} */ (b);
                        btn.classList.toggle('active', btn.dataset.tab === activeTab);
                        btn.onclick = () => {
                            activeTab = btn.dataset.tab;
                            renderTab();
                        };
                    });
                }
            }

            if (A.Actors && A.Actors.Tabs && A.Actors.Tabs.render) {
                A.Actors.Tabs.render(content, actor, activeTab);
            } else {
                content.innerHTML = '<div style="color:red; padding:20px;">Error: Actors.Tabs plugin missing.</div>';
            }
        }


        // Events
        /** @type {HTMLElement} */ (listCol.querySelector('#btn-add-actor')).onclick = () => {
            const state = A.State.get();
            // Ensure node
            if (!state.nodes) state.nodes = {};
            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            if (!state.nodes.actors.items) state.nodes.actors.items = {};

            const id = 'actor_' + Math.random().toString(36).substr(2, 9);
            const actorName = 'New Actor';
            state.nodes.actors.items[id] = {
                id: id,
                name: actorName,
                traits: {},
                tags: [],
                notes: ''
            };

            // Auto-create voice entry
            syncActorToVoices(id, actorName);

            A.State.notify();
            if (A.UI.Toast) A.UI.Toast.show('New Actor created', 'success');
            selectActor(id);
        };

        delBtn.onclick = () => {
            if (confirm('Delete actor?')) {
                const state = A.State.get();

                // Remove actor from items
                delete state.nodes.actors.items[currentId];

                // Remove from Voices panel
                removeActorFromVoices(currentId);

                currentId = null;
                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show('Actor deleted', 'info');
                refreshList();
                selectActor(null);
            }
        };

        // Vault Button - Publish to Vault
        vaultBtn.onclick = async () => {
            const state = A.State.get();
            const actor = state.nodes.actors.items[currentId];
            if (!actor) return;

            // Get existing universes and tags for autocomplete
            let universes = [];
            let existingTags = [];
            try {
                universes = await A.VaultDB.getUniverses();
                existingTags = await A.VaultDB.getTags();
            } catch (e) {
                console.warn('[Actors] Could not load vault data:', e);
            }

            // Check if already published
            const isUpdate = actor.vaultLink && actor.vaultLink.vaultId;

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
                    <div class="modal-body" style="padding:20px;">
                        <div style="margin-bottom:16px;">
                            <strong>Actor:</strong> ${actor.name || 'Unnamed Actor'}
                        </div>

                        <div style="margin-bottom:16px;">
                            <label class="label" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;display:block;">Source Project</label>
                            <div style="color:var(--text-secondary);font-size:13px;">${state.meta?.name || 'Untitled Project'}</div>
                        </div>

                        <div style="margin-bottom:16px;">
                            <label class="label" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;display:block;">Universe</label>
                            <input type="text" id="vault-universe" class="input" list="universe-list" 
                                   placeholder="e.g., Obsidian Chronicles" 
                                   value="${actor.vaultLink?.universe || ''}"
                                   style="width:100%;">
                            <datalist id="universe-list">
                                ${universes.map(u => `<option value="${u}">`).join('')}
                            </datalist>
                            <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Group related items by universe</div>
                        </div>

                        <div style="margin-bottom:16px;">
                            <label class="label" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;display:block;">Tags</label>
                            <input type="text" id="vault-tags" class="input" 
                                   placeholder="fantasy, protagonist, dark-themes" 
                                   value="${(actor.vaultLink?.tags || []).join(', ')}"
                                   style="width:100%;">
                            <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Comma-separated tags for filtering</div>
                        </div>

                        ${isUpdate ? `
                        <div style="margin-bottom:16px;">
                            <label class="label" style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;display:block;">Commit Message</label>
                            <input type="text" id="vault-message" class="input" 
                                   placeholder="What changed?" 
                                   style="width:100%;">
                        </div>
                        ` : ''}

                        <div style="padding:12px;background:var(--bg-inset);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);">
                            ${isUpdate
                    ? '⚠️ This will update the existing Vault entry and increment the version.'
                    : 'ℹ️ This creates a snapshot in your Vault. Future changes require a new Push.'}
                        </div>
                    </div>
                    <div class="modal-footer" style="display:flex;gap:8px;justify-content:flex-end;padding:16px;">
                        <button class="btn btn-ghost" id="vault-cancel">Cancel</button>
                        <button class="btn btn-primary" id="vault-confirm">${isUpdate ? '📤 Push Update' : '📤 Publish'}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Focus universe input
            setTimeout(() => /** @type {HTMLInputElement} */(modal.querySelector('#vault-universe')).focus(), 100);

            // Close handlers
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
                        vaultItem = await A.VaultDB.push(actor.vaultLink.vaultId, actor, message);

                        // Update metadata if changed
                        if (universe !== actor.vaultLink.universe || JSON.stringify(tags) !== JSON.stringify(actor.vaultLink.tags)) {
                            await A.VaultDB.updateMetadata(vaultItem.id, { universe, tags });
                        }
                    } else {
                        // New publish
                        vaultItem = await A.VaultDB.publish('actor', actor, {
                            sourceProjectId: state.meta?.id,
                            sourceProjectName: state.meta?.name || 'Untitled Project',
                            universe: universe,
                            tags: tags,
                            message: 'Initial publish'
                        });
                    }

                    // Update actor with vaultLink
                    actor.vaultLink = {
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
                            isUpdate ? `Pushed ${actor.name} v${vaultItem.version} to Vault` : `Published ${actor.name} to Vault`,
                            'success'
                        );
                    }
                } catch (err) {
                    console.error('[Vault] Publish failed:', err);
                    if (A.UI.Toast) A.UI.Toast.show('Failed to publish to Vault', 'error');
                }
            };
        };

        nameInput.oninput = (e) => {
            const state = A.State.get();
            if (state.nodes.actors.items[currentId]) {
                const actor = state.nodes.actors.items[currentId];
                const newName = /** @type {HTMLInputElement} */ (e.target).value;
                actor.name = newName;

                // Mark as locally modified if linked to vault
                if (actor.vaultLink && actor.vaultLink.vaultId) {
                    actor.vaultLink.locallyModified = true;
                    // Update vault button appearance
                    vaultBtn.innerHTML = '📤 Push Update';
                    vaultBtn.style.background = 'var(--status-warning)';
                    vaultBtn.style.color = 'var(--bg-base)';
                }

                // Sync name to Voices panel
                syncActorToVoices(currentId, newName);

                A.State.notify();
                refreshList(); // Update sidebar name
                // Keep focus
                nameInput.focus();
            }
        };

        // Auto-save feedback not typically needed on input, but let's add a "Saved" toast on implicit or explicit save if we had a button.
        // For now, let's just ensure manual actions feel good.
        // Actually, let's add a 'Flash' effect to the sidebar item on change? No, toast is for discrete actions.
        // Actors is auto-save.


        refreshList();
        // Show empty state initially
        // Show empty state initially if list is empty, otherwise standard select prompt
        if (!currentId) {
            const hasActors = state && Object.keys(state.nodes?.actors?.items || {}).length > 0;
            if (!hasActors) {
                content.innerHTML = '';
                content.appendChild(A.UI.createEmptyStateElement({
                    title: 'No Actors Found',
                    message: 'Create your first actor to begin building your cast.',
                    actionLabel: 'Create New Actor',
                    onAction: () => document.getElementById('btn-add-actor').click()
                }));
            } else {
                // Select prompt
                content.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); opacity:0.7;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <div style="margin-bottom:16px;">Select an Actor to edit</div>
                        <button class="btn btn-secondary" onclick="document.getElementById('btn-add-actor').click()">Create New Actor</button>
                    </div>
                `;
            }
        }
    }

    A.registerPanel('actors', {
        label: 'Actors',
        subtitle: 'Nodes',
        category: 'Seeds',
        order: 1,
        render: render
    });

})(window.Anansi);
