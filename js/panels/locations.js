/*
 * Anansi Panel: Locations (Forbidden Secrets)
 * File: js/panels/locations.js
 * Description: Persistent Location Manager with Node Map Visualization
 */

(function (A) {
    'use strict';

    // --- Graph State ---
    const G = {
        svg: null, vport: null, gGrid: null, gEdges: null, gNodes: null,
        width: 0, height: 0, zoom: 1, tx: 0, ty: 0, gridSize: 40,
        dragging: null, opts: { snap: true, showIds: false },
        selection: null
    };

    // Multi-Select State
    let selectionMode = false;
    let selectedIds = new Set();

    function elNS(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }
    function clientToSVGPoint(x, y) {
        if (!G.svg) return { x: 0, y: 0 };
        const pt = G.svg.createSVGPoint();
        pt.x = x; pt.y = y;
        return pt.matrixTransform(G.svg.getScreenCTM().inverse());
    }
    function clientToWorld(x, y) {
        const p = clientToSVGPoint(x, y);
        return { x: (p.x - G.tx) / G.zoom, y: (p.y - G.ty) / G.zoom };
    }

    // --- Render Helpers ---
    function renderVport() {
        if (G.vport) G.vport.setAttribute('transform', `translate(${G.tx},${G.ty}) scale(${G.zoom})`);
    }

    function renderGrid() {
        const g = G.gGrid;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        // Simple Grid Dots or Lines? Lines are cleaner for "blueprint" feel
        const w = G.width, h = G.height, gs = G.gridSize * G.zoom;

        // Optimization: Only render visible grid?
        // Let's do a simple pattern def instead? No, stick to manual lines for control if needed, 
        // but pattern IS better for performance. Let's use simple lines for now.

        // Actually, let's keep it simple: Just a background color in CSS, 
        // and maybe a large crosshair at 0,0.
        const origin = elNS('path');
        origin.setAttribute('d', 'M-50,0 L50,0 M0,-50 L0,50');
        origin.setAttribute('stroke', 'var(--border-subtle)');
        origin.setAttribute('vector-effect', 'non-scaling-stroke'); // Keep thin
        G.vport.appendChild(origin); // Add to vport so it moves
    }

    function renderEdges() {
        const g = G.gEdges;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        const state = A.State.get();
        const locs = state.weaves?.locations || [];

        locs.forEach(a => {
            const p1 = a.pos || { x: 0, y: 0 };
            (a.exits || []).forEach(bid => {
                const b = locs.find(l => l.id === bid);
                if (!b) return;
                const p2 = b.pos || { x: 0, y: 0 };

                const ln = elNS('line');
                ln.setAttribute('x1', p1.x); ln.setAttribute('y1', p1.y);
                ln.setAttribute('x2', p2.x); ln.setAttribute('y2', p2.y);
                ln.setAttribute('stroke', 'var(--text-muted)');
                ln.setAttribute('stroke-width', '1');
                ln.setAttribute('opacity', '0.5');
                // Marker?
                g.appendChild(ln);
            });
        });
    }

    function renderNodes() {
        const g = G.gNodes;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        const state = A.State.get();
        const locs = state.weaves?.locations || [];

        locs.forEach(n => {
            const p = n.pos || { x: 0, y: 0 };
            const grp = elNS('g');
            grp.setAttribute('data-id', n.id);
            grp.setAttribute('transform', `translate(${p.x},${p.y})`);
            grp.style.cursor = 'grab';

            const isSel = (G.selection === n.id);

            // Circle
            const c = elNS('circle');
            c.setAttribute('r', '15');
            c.setAttribute('fill', 'var(--bg-elevated)');
            c.setAttribute('stroke', isSel ? 'var(--accent-primary)' : 'var(--border-default)');
            c.setAttribute('stroke-width', isSel ? '2' : '1');
            grp.appendChild(c);

            // Label
            const t = elNS('text');
            t.setAttribute('y', '26');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-size', '10');
            t.setAttribute('fill', 'var(--text-secondary)');
            t.textContent = n.name || n.id;
            grp.appendChild(t);

            // Interactions
            grp.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                G.selection = n.id;
                G.dragging = { id: n.id, start: { ...p }, mouse: clientToWorld(e.clientX, e.clientY) };
                renderAll(); // For selection update
                A.State.notify(); // Update list selection
            };

            g.appendChild(grp);
        });
    }

    function renderAll() {
        if (!G.svg) return;
        renderVport();
        renderEdges();
        renderNodes();
        // Grid is static relative to vport usually if done via pattern, but here we redraw if needed.
        // Simple 0,0 crosshair is enough for now.
    }

    // --- Panel Render ---
    function render(container) {
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.locations) state.weaves.locations = [];

        // Layout
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '300px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        // --- Left: List & Editor ---
        const leftCol = document.createElement('div');
        // Change from simple flex/scroll to structured container
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.height = '100%';
        leftCol.style.overflow = 'hidden'; // Inner containers handle scroll

        leftCol.innerHTML = `
            <div class="card" id="loc-header" style="padding:12px; display:flex; flex-direction:column; gap:8px; flex-shrink:0; border-bottom:1px solid var(--border-subtle); margin-bottom:0;">
                <div id="header-std-act" style="display:flex; gap:8px;">
                     <input class="input" id="new-loc-name" placeholder="New Location Name" style="flex:1;">
                     <button class="btn btn-primary btn-sm" id="btn-add-loc">+</button>
                </div>
                <!-- Optional: Add handy filter or just space? -->
            </div>
            
            <div id="loc-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:12px;"></div>
            
            <div class="card" id="loc-footer" style="padding:8px; border-top:1px solid var(--border-subtle); flex-shrink:0; margin-top:0;">
                 <div id="footer-std-act">
                    <button class="btn btn-ghost btn-sm" id="btn-select-mode" style="width:100%;">Select...</button>
                 </div>
                 <div id="footer-sel-act" style="display:none; flex-direction:column; gap:8px;">
                    <button class="btn btn-sm" id="btn-del-multi" style="width:100%; background:var(--status-error); color:white;">Delete Selected (0)</button>
                    <button class="btn btn-ghost btn-sm" id="btn-cancel-select" style="width:100%;">Cancel Selection</button>
                 </div>
            </div>
        `;

        container.appendChild(leftCol);

        // --- Right: Map ---
        const mapCard = document.createElement('div');
        mapCard.className = 'card';
        mapCard.style.padding = '0';
        mapCard.style.display = 'flex';
        mapCard.style.flexDirection = 'column';
        mapCard.style.overflow = 'hidden';
        mapCard.style.position = 'relative';

        mapCard.innerHTML = `
            <div class="card-header" style="border-bottom:1px solid var(--border-subtle); padding:8px 12px; display:flex; justify-content:space-between;">
                <strong>Node Map</strong>
                <div style="display:flex; gap:8px;">
                     <button class="btn btn-ghost btn-sm" id="btn-reset-view">Center</button>
                     <label style="font-size:11px; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-snap" checked> Snap</label>
                </div>
            </div>
            <div id="svg-container" style="flex:1; background:var(--bg-base); position:relative; overflow:hidden;">
                <svg width="100%" height="100%" style="display:block;">
                    <g id="vport">
                        <g id="edges"></g>
                        <g id="nodes"></g>
                    </g>
                </svg>
            </div>
        `;
        container.appendChild(mapCard);

        // --- Wiring DOM ---
        G.svg = mapCard.querySelector('svg');
        G.vport = mapCard.querySelector('#vport');
        G.gEdges = mapCard.querySelector('#edges');
        G.gNodes = mapCard.querySelector('#nodes');
        G.opts.snap = true;

        // Reset View logic
        const r = G.svg.getBoundingClientRect();
        G.width = r.width; G.height = r.height;
        // Default center if 0,0
        if (G.tx === 0 && G.ty === 0) {
            G.tx = G.width / 2; G.ty = G.height / 2;
        }

        // --- Interactions ---
        // 1. Pan/Zoom
        G.svg.onwheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const before = clientToWorld(e.clientX, e.clientY);
            G.zoom = Math.max(0.1, Math.min(5, G.zoom * factor));
            const after = clientToWorld(e.clientX, e.clientY);
            G.tx += (after.x - before.x) * G.zoom;
            G.ty += (after.y - before.y) * G.zoom;
            renderAll();
        };

        let panning = false;
        let panStart = { x: 0, y: 0 };

        G.svg.onmousedown = (e) => {
            if (e.target.closest('g[data-id]')) return; // Node click handled separately
            panning = true;
            panStart = { x: e.clientX, y: e.clientY, tx: G.tx, ty: G.ty };
        };

        window.onmousemove = (e) => {
            if (panning) {
                G.tx = panStart.tx + (e.clientX - panStart.x);
                G.ty = panStart.ty + (e.clientY - panStart.y);
                renderAll();
            } else if (G.dragging) {
                const pt = clientToWorld(e.clientX, e.clientY);
                let nx = G.dragging.start.x + (pt.x - G.dragging.mouse.x);
                let ny = G.dragging.start.y + (pt.y - G.dragging.mouse.y);

                if (G.opts.snap) {
                    const s = G.gridSize;
                    nx = Math.round(nx / s) * s;
                    ny = Math.round(ny / s) * s;
                }

                const node = state.weaves.locations.find(l => l.id === G.dragging.id);
                if (node) {
                    node.pos = { x: nx, y: ny };
                    // Rerender specific node or all? All for edges
                    renderAll();
                }
            }
        };

        window.onmouseup = () => {
            panning = false;
            if (G.dragging) {
                A.State.notify(); // Commit move
                G.dragging = null;
            }
        };

        // UI Controls
        mapCard.querySelector('#btn-reset-view').onclick = () => {
            const r = G.svg.getBoundingClientRect();
            G.tx = r.width / 2; G.ty = r.height / 2;
            G.zoom = 1;
            renderAll();
        };
        mapCard.querySelector('#chk-snap').onchange = (e) => { G.opts.snap = e.target.checked; };

        // --- Multi-Select Handlers ---
        const updateFooterState = () => {
            const fStd = leftCol.querySelector('#footer-std-act');
            const fSel = leftCol.querySelector('#footer-sel-act');

            if (selectionMode) {
                fStd.style.display = 'none';
                fSel.style.display = 'flex';
                fSel.querySelector('#btn-del-multi').textContent = `Delete Selected (${selectedIds.size})`;
                fSel.querySelector('#btn-del-multi').disabled = selectedIds.size === 0;
                fSel.querySelector('#btn-del-multi').style.opacity = selectedIds.size === 0 ? '0.5' : '1';
                // Disable Add Input?
                leftCol.querySelector('#new-loc-name').disabled = true;
                leftCol.querySelector('#btn-add-loc').disabled = true;
            } else {
                fStd.style.display = 'block';
                fSel.style.display = 'none';
                leftCol.querySelector('#new-loc-name').disabled = false;
                leftCol.querySelector('#btn-add-loc').disabled = false;
            }
        };

        leftCol.querySelector('#btn-select-mode').onclick = () => {
            selectionMode = true;
            selectedIds.clear();
            updateFooterState();
            renderList();
        };
        leftCol.querySelector('#btn-cancel-select').onclick = () => {
            selectionMode = false;
            selectedIds.clear();
            updateFooterState();
            renderList();
        };
        leftCol.querySelector('#btn-del-multi').onclick = () => {
            if (selectedIds.size === 0) return;
            if (confirm(`Delete ${selectedIds.size} locations?`)) {
                let count = 0;
                // Delete logic: need to remove from list AND clear exits pointing to them
                state.weaves.locations = state.weaves.locations.filter(l => {
                    if (selectedIds.has(l.id)) {
                        count++;
                        return false;
                    }
                    return true;
                });

                // Cleanup Exits
                state.weaves.locations.forEach(l => {
                    if (l.exits) {
                        l.exits = l.exits.filter(eid => !selectedIds.has(eid));
                    }
                });

                selectionMode = false;
                selectedIds.clear();
                G.selection = null;

                A.State.notify();
                if (A.UI.Toast) A.UI.Toast.show(`Deleted ${count} locations.`, 'success');
                updateFooterState();
                renderList();
                renderAll();
            }
        };

        // --- List Rendering ---
        const listEl = leftCol.querySelector('#loc-list');
        const renderList = () => {
            listEl.innerHTML = '';
            state.weaves.locations.forEach((loc, idx) => {
                const isSel = (G.selection === loc.id);
                const el = document.createElement('div');
                el.className = 'card';
                el.style.padding = '12px';
                if (isSel && !selectionMode) el.style.border = '1px solid var(--accent-primary)';
                if (selectionMode && selectedIds.has(loc.id)) {
                    el.style.border = '1px solid var(--accent-primary)';
                    el.style.backgroundColor = 'rgba(218, 165, 32, 0.1)';
                }

                el.style.flexShrink = '0'; // Prevent squashing

                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                        ${selectionMode ? `<input type="checkbox" style="margin-right:8px; pointer-events:none;" ${selectedIds.has(loc.id) ? 'checked' : ''}>` : ''}
                        <input class="input loc-name" value="${loc.name}" style="font-weight:bold; width:100%;" ${selectionMode ? 'disabled' : ''}>
                        <div style="font-size:10px; color:var(--text-muted); margin-left:8px; align-self:center; cursor:pointer; font-family:var(--font-mono); opacity:0.7;" title="Click to copy ID" onclick="navigator.clipboard.writeText('${loc.id}'); Anansi.UI.Toast.show('ID copied', 'info');">Ref</div>
                    </div>
                    <textarea class="input loc-desc" placeholder="Description..." rows="2" style="width:100%; font-size:11px; margin-bottom:8px;" ${selectionMode ? 'disabled' : ''}>${loc.description || ''}</textarea>
                    
                    <div style="margin-bottom:8px;">
                         <div style="font-size:10px; color:var(--text-muted);">EXITS</div>
                         <div class="exits-list" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:4px;"></div>
                         <select class="input loc-add-exit" style="width:100%; font-size:10px;">
                            <option value="">+ Add Exit</option>
                            ${state.weaves.locations.filter(l => l.id !== loc.id).map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                         </select>
                    </div>

                    <div class="loc-image-section" style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
                        <input type="file" class="input loc-img-upload" accept="image/*" style="display:none;">
                        <div class="loc-img-preview" style="width:40px; height:40px; background:var(--bg-base); border-radius:4px; border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; flex-shrink:0;" title="Click to upload image">
                            ${loc.image ? `<img src="${loc.image}" style="width:100%; height:100%; object-fit:cover;">` : '<span style="font-size:16px;">📷</span>'}
                        </div>
                        <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                            ${loc.image ? `
                                <div style="display:flex; gap:8px;">
                                    <div style="font-size:10px; color:var(--accent-primary); cursor:pointer;" onclick="document.querySelector('.loc-img-upload').click()">Change Image</div>
                                    <div style="font-size:10px; color:var(--text-muted); cursor:pointer;" class="btn-remove-img">Remove</div>
                                </div>
                            ` : `<div style="font-size:10px; color:var(--text-muted); font-style:italic;">No image set</div>`}
                        </div>
                    </div>

                    <div style="text-align:right;">
                        <button class="btn btn-ghost btn-sm loc-del" style="color:var(--status-error);">Delete</button>
                    </div>
                `;

                // Attach AI Assistant to Description
                if (A.UI.Assistant) {
                    A.UI.Assistant.attach(el.querySelector('.loc-desc'), {
                        label: 'Location Description',
                        system: 'You are a world-building expert. Describe this location\'s atmosphere, appearance, and significance.'
                    });
                }

                // Sub-renders
                const exList = el.querySelector('.exits-list');
                (loc.exits || []).forEach((eid, exIdx) => {
                    const tag = document.createElement('span');
                    const targetName = state.weaves.locations.find(l => l.id === eid)?.name || eid;
                    tag.style.cssText = "background:var(--bg-elevated); border:1px solid var(--border-subtle); font-size:10px; padding:2px 6px; border-radius:4px; cursor:pointer;";
                    tag.textContent = `${targetName} ×`;
                    tag.onclick = () => {
                        loc.exits.splice(exIdx, 1);
                        renderList(); // Refresh UI
                        renderAll(); // Refresh Map
                        updateLens();
                        A.State.notify();
                    };
                    exList.appendChild(tag);
                });

                // Bindings
                el.onclick = (e) => {
                    if (selectionMode) {
                        e.preventDefault(); e.stopPropagation();
                        if (selectedIds.has(loc.id)) selectedIds.delete(loc.id); else selectedIds.add(loc.id);
                        updateFooterState();
                        renderList();
                        return;
                    }

                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
                        G.selection = loc.id;
                        renderList(); // Highlight selection
                        renderAll();
                    }
                };

                el.querySelector('.loc-name').oninput = (e) => { loc.name = e.target.value; renderAll(); updateLens(); };
                el.querySelector('.loc-name').onchange = () => { A.State.notify(); if (A.UI.Toast) A.UI.Toast.show('Name saved', 'info'); };

                el.querySelector('.loc-desc').onchange = (e) => {
                    loc.description = e.target.value;
                    A.State.notify();
                    updateLens();
                    if (A.UI.Toast) A.UI.Toast.show('Description saved', 'info');
                };

                const selEx = el.querySelector('.loc-add-exit');
                selEx.onchange = (e) => {
                    if (e.target.value) {
                        const targetId = e.target.value;
                        if (!loc.exits) loc.exits = [];

                        // 1. Add Forward Link
                        if (!loc.exits.includes(targetId)) {
                            loc.exits.push(targetId);

                            // 2. Add Backward Link (Bi-directional)
                            const targetLoc = state.weaves.locations.find(l => l.id === targetId);
                            if (targetLoc) {
                                if (!targetLoc.exits) targetLoc.exits = [];
                                if (!targetLoc.exits.includes(loc.id)) {
                                    targetLoc.exits.push(loc.id);
                                    if (A.UI.Toast) A.UI.Toast.show(`Auto-linked "${targetLoc.name}" back to "${loc.name}"`, 'info');
                                }
                            }
                        }

                        renderList(); // Show new tag
                        renderAll(); // Show new edge
                        updateLens();
                        A.State.notify();
                        if (A.UI.Toast) A.UI.Toast.show('Exit added (Bi-directional)', 'success');
                    }
                };

                el.querySelector('.loc-del').onclick = () => {
                    if (confirm('Delete location?')) {
                        state.weaves.locations.splice(idx, 1);
                        renderList(); // Remove from list
                        renderAll(); // Remove nodes/edges
                        updateLens();
                        A.State.notify();
                        if (A.UI.Toast) A.UI.Toast.show('Location deleted', 'info');
                    }
                };

                // Image Upload Logic
                const imgPreview = el.querySelector('.loc-img-preview');
                const fileInput = el.querySelector('.loc-img-upload');

                imgPreview.onclick = (e) => {
                    e.stopPropagation();
                    if (loc.image) {
                        // Open Lightbox
                        const lightbox = document.createElement('div');
                        lightbox.style.position = 'fixed';
                        lightbox.style.top = '0';
                        lightbox.style.left = '0';
                        lightbox.style.width = '100vw';
                        lightbox.style.height = '100vh';
                        lightbox.style.background = 'rgba(0,0,0,0.9)';
                        lightbox.style.zIndex = '9999';
                        lightbox.style.display = 'flex';
                        lightbox.style.alignItems = 'center';
                        lightbox.style.justifyContent = 'center';
                        lightbox.style.cursor = 'zoom-out';

                        const img = document.createElement('img');
                        img.src = loc.image;
                        img.style.maxWidth = '90%';
                        img.style.maxHeight = '90%';
                        img.style.objectFit = 'contain';
                        img.style.borderRadius = '8px';
                        img.style.boxShadow = '0 0 40px rgba(0,0,0,0.5)';

                        lightbox.appendChild(img);
                        document.body.appendChild(lightbox);

                        lightbox.onclick = () => document.body.removeChild(lightbox);
                    } else {
                        // Trigger Upload
                        fileInput.click();
                    }
                };

                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        loc.image = evt.target.result;
                        A.State.notify();
                        renderList(); // Refresh to show image
                        if (A.UI.Toast) A.UI.Toast.show('Image uploaded', 'success');
                    };
                    reader.readAsDataURL(file);
                };

                const removeBtn = el.querySelector('.btn-remove-img');
                if (removeBtn) {
                    removeBtn.onclick = () => {
                        delete loc.image;
                        A.State.notify();
                        renderList();
                        if (A.UI.Toast) A.UI.Toast.show('Image removed', 'info');
                    };
                }

                // Append list item
                listEl.appendChild(el);
            });
        };

        // Add New Location
        leftCol.querySelector('#btn-add-loc').onclick = () => {
            const inp = leftCol.querySelector('#new-loc-name');
            const name = inp.value.trim();
            if (!name) return;

            // Calc Center
            const cx = (G.width / 2 - G.tx) / G.zoom;
            const cy = (G.height / 2 - G.ty) / G.zoom;

            const newLoc = {
                id: 'LOC_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                name: name,
                description: '',
                exits: [],
                pos: { x: Math.round(cx), y: Math.round(cy) }
            };

            state.weaves.locations.push(newLoc);
            inp.value = '';
            G.selection = newLoc.id;
            if (A.UI.Toast) A.UI.Toast.show(`Location "${name}" created`, 'success');
            renderList(); // Fix: Actually update the list UI!
            renderAll();
            updateLens();
            A.State.notify();
        };

        // --- Lens Logic ---
        function updateLens() {
            A.UI.setLens((lensRoot) => {
                const locs = state.weaves.locations;
                lensRoot.innerHTML = '<div style="padding:12px; font-family:var(--font-mono); font-size:11px;">';

                lensRoot.innerHTML += '<div style="margin-bottom:12px; font-weight:bold; color:var(--accent-primary); border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">Location References</div>';

                if (!locs.length) {
                    lensRoot.innerHTML += '<div style="color:var(--text-muted); font-style:italic;">No locations yet.</div>';
                } else {
                    locs.forEach(loc => {
                        // We provide a consistent reference format. Assuming context.locations is an Array, 
                        // direct path access isn't perfect, BUT providing the ID is the critical "Reference".
                        // If the user uses a helper like `loc('ID')`, this ID is what they need.

                        lensRoot.innerHTML += `
                             <div style="margin-bottom:8px; background:var(--bg-elevated); padding:8px; border-radius:4px; border:1px solid var(--border-subtle);">
                                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                     <strong style="color:var(--text-main);">${loc.name}</strong>
                                     <button class="btn btn-ghost btn-xs" style="font-size:9px; padding:2px 4px; height:auto;" onclick="navigator.clipboard.writeText('${loc.id}'); Anansi.UI.Toast.show('ID Copied', 'info');">Copy ID</button>
                                 </div>
                                 
                                 <div style="display:flex; gap:4px; align-items:center; background:var(--bg-base); padding:4px; border-radius:2px; margin-bottom:4px;">
                                     <div style="color:var(--text-muted); font-size:9px; width:20px;">ID:</div>
                                     <code style="color:var(--accent-secondary); font-size:10px; cursor:pointer;" onclick="navigator.clipboard.writeText('${loc.id}'); Anansi.UI.Toast.show('ID Copied', 'info');">${loc.id}</code>
                                 </div>

                                 <div style="display:flex; gap:4px; align-items:center; background:var(--bg-base); padding:4px; border-radius:2px;">
                                     <div style="color:var(--text-muted); font-size:9px; width:20px;">Ref:</div>
                                     <code style="color:var(--text-main); font-size:9px; cursor:pointer;" onclick="navigator.clipboard.writeText('locations.find(l=>l.id==\\'${loc.id}\\')'); Anansi.UI.Toast.show('JS Path Copied', 'info');">JS Find...</code>
                                 </div>
                             </div>
                         `;
                    });
                }
                lensRoot.innerHTML += '</div>';
            });
        }

        // Initial Render
        renderList();
        renderAll();
        updateLens(); // Set initial lens content
    }

    A.registerPanel('locations', {
        label: 'Locations',
        subtitle: 'Node Map',
        category: 'Forbidden Secrets',
        render: render
    });

})(window.Anansi);

// Tour Registration
if (window.Anansi.UI && window.Anansi.UI.Tour) {
    window.Anansi.UI.Tour.register('locations', [
        {
            target: '#loc-list',
            title: 'Forbidden Locations',
            content: 'This panel manages the physical or abstract spaces in your world. Define nodes and how they connect.'
        },
        {
            target: '#svg-container',
            title: 'The Node Map',
            content: 'A visual graph of your locations. You can drag nodes to rearrange them (hold Shift to snap). Scroll to zoom.'
        },
        {
            target: '#btn-add-loc',
            title: 'Creating Space',
            content: 'Enter a name and click + to spawn a new location node in the center of the current view.'
        },
        {
            target: '.exits-list', // Might not exist if empty, fallback safe?
            title: 'Connections',
            content: 'Link locations together by adding Exits. These create edges on the map and allow traversal in the simulation.'
        }
    ]);
}
