/*
 * Anansi Panel: RPG Map
 * File: js/panels/rpg_map.js
 * Category: RPG Experiment
 * Purpose: Visual World Map (Read-Only View of Locations).
 * Based on: js/panels/locations.js
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
                ln.setAttribute('stroke-width', '2'); // Thicker for map view
                ln.setAttribute('opacity', '0.3');
                g.appendChild(ln);
            });
        });
    }

    function renderNodes(infoPanel) {
        const g = G.gNodes;
        if (!g) return;
        while (g.firstChild) g.removeChild(g.firstChild);

        const state = A.State.get();
        const locs = state.weaves?.locations || [];
        // TODO: Get active player location from state.rpg.location?
        // const currentLoc = state.rpg.location; 

        locs.forEach(n => {
            const p = n.pos || { x: 0, y: 0 };
            const grp = elNS('g');
            grp.setAttribute('data-id', n.id);
            grp.setAttribute('transform', `translate(${p.x},${p.y})`);
            grp.style.cursor = 'pointer';

            const isSel = (G.selection === n.id);

            // Circle
            const c = elNS('circle');
            c.setAttribute('r', '20'); // Larger nodes
            c.setAttribute('fill', isSel ? 'var(--accent-primary)' : 'var(--bg-elevated)');
            c.setAttribute('stroke', isSel ? 'white' : 'var(--border-default)');
            c.setAttribute('stroke-width', '2');
            grp.appendChild(c);

            // Icon/Label inside?
            const labelInit = (n.name || "?").substring(0, 2).toUpperCase();
            const txt = elNS('text');
            txt.setAttribute('dy', '5');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('font-size', '10');
            txt.setAttribute('fill', isSel ? 'white' : 'var(--text-primary)');
            txt.setAttribute('font-weight', 'bold');
            txt.textContent = labelInit;
            grp.appendChild(txt);

            // Full Label under
            const t = elNS('text');
            t.setAttribute('y', '35');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-size', '12');
            t.setAttribute('fill', 'var(--text-primary)');
            t.setAttribute('font-weight', 'bold');
            t.style.textShadow = '0 1px 2px black';
            t.textContent = n.name || n.id;
            grp.appendChild(t);

            // Click Handler
            grp.onclick = (e) => {
                e.stopPropagation();
                G.selection = n.id;
                renderAll(infoPanel);

                // Update Info Panel
                if (infoPanel) {
                    infoPanel.innerHTML = `
                        <div style="font-size:16px; font-weight:bold; margin-bottom:8px;">${n.name}</div>
                        <div style="font-size:12px; line-height:1.5; color:var(--text-secondary); margin-bottom:12px;">
                            ${n.description || "No description available."}
                        </div>
                        ${n.image ? `<img src="${n.image}" style="width:100%; border-radius:4px; margin-bottom:12px;">` : ''}
                        
                        <div style="font-size:10px; font-weight:bold; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Connections</div>
                        <div style="display:flex; flex-wrap:wrap; gap:4px;">
                            ${(n.exits || []).map(eid => {
                        const l = locs.find(x => x.id === eid);
                        return `<span style="background:var(--bg-base); border:1px solid var(--border-subtle); padding:2px 6px; border-radius:4px; font-size:10px;">${l ? l.name : eid}</span>`;
                    }).join('')}
                        </div>
                    `;
                }
            };

            g.appendChild(grp);
        });
    }

    function renderAll(infoPanel) {
        if (!G.svg) return;
        renderVport();
        renderEdges();
        renderNodes(infoPanel);
    }

    function render(container) {
        const state = A.State.get();
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.locations) state.weaves.locations = [];

        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.padding = '0';
        container.style.overflow = 'hidden';

        // Header
        const header = document.createElement('div');
        header.className = 'panel-toolbar';
        header.style.padding = '12px 16px';
        header.style.background = 'var(--bg-elevated)';
        header.style.borderBottom = '1px solid var(--border-subtle)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        header.innerHTML = `
            <div style="font-weight:bold; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span>🗺️</span> World Map
            </div>
            <button class="btn btn-sm btn-ghost" id="map-recenter">Recenter</button>
        `;
        container.appendChild(header);

        // Body: Map + Info Overlay
        const bodyV = document.createElement('div');
        bodyV.style.flex = '1';
        bodyV.style.position = 'relative';
        bodyV.style.overflow = 'hidden';
        bodyV.style.background = 'var(--bg-base)';
        // Add a faint grid pattern CSS?
        bodyV.style.backgroundImage = 'radial-gradient(var(--border-subtle) 1px, transparent 1px)';
        bodyV.style.backgroundSize = '20px 20px';

        // Info Overlay (Bottom Left)
        const infoPanel = document.createElement('div');
        infoPanel.style.position = 'absolute';
        infoPanel.style.bottom = '16px';
        infoPanel.style.left = '16px';
        infoPanel.style.width = '300px';
        infoPanel.style.background = 'var(--bg-elevated)';
        infoPanel.style.border = '1px solid var(--border-subtle)';
        infoPanel.style.borderRadius = '8px';
        infoPanel.style.padding = '16px';
        infoPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        infoPanel.style.pointerEvents = 'auto'; // allow clicking inside
        infoPanel.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">Select a location...</div>`;

        // SVG Container
        const svgC = document.createElement('div');
        svgC.style.width = '100%';
        svgC.style.height = '100%';
        svgC.innerHTML = `
            <svg width="100%" height="100%" style="display:block;">
                <g id="vport">
                    <g id="edges"></g>
                    <g id="nodes"></g>
                </g>
            </svg>
        `;

        bodyV.appendChild(svgC);
        bodyV.appendChild(infoPanel);
        container.appendChild(bodyV);

        // --- Wiring ---
        G.svg = svgC.querySelector('svg');
        G.vport = svgC.querySelector('#vport');
        G.gEdges = svgC.querySelector('#edges');
        G.gNodes = svgC.querySelector('#nodes');

        // Initial Center
        const r = container.getBoundingClientRect(); // rough guess
        if (G.width === 0) { G.width = 800; G.height = 600; } // Default if rect fails
        G.tx = G.width / 2; G.ty = G.height / 2;
        G.zoom = 1;

        // Pan/Zoom Logic
        G.svg.onwheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const before = clientToWorld(e.clientX, e.clientY);
            G.zoom = Math.max(0.1, Math.min(5, G.zoom * factor));
            const after = clientToWorld(e.clientX, e.clientY);
            G.tx += (after.x - before.x) * G.zoom;
            G.ty += (after.y - before.y) * G.zoom;
            renderAll(infoPanel);
        };

        let panning = false;
        let panStart = { x: 0, y: 0 };
        G.svg.onmousedown = (e) => {
            panning = true;
            panStart = { x: e.clientX, y: e.clientY, tx: G.tx, ty: G.ty };
        };
        window.onmousemove = (e) => {
            if (panning) {
                G.tx = panStart.tx + (e.clientX - panStart.x);
                G.ty = panStart.ty + (e.clientY - panStart.y);
                renderAll(infoPanel);
            }
        };
        window.onmouseup = () => { panning = false; };

        header.querySelector('#map-recenter').onclick = () => {
            const rect = bodyV.getBoundingClientRect();
            G.tx = rect.width / 2; G.ty = rect.height / 2;
            G.zoom = 1;
            renderAll(infoPanel);
        };

        // Initial Layout
        setTimeout(() => {
            const rect = bodyV.getBoundingClientRect();
            if (rect.width) {
                G.width = rect.width;
                G.height = rect.height;
                G.tx = G.width / 2;
                G.ty = G.height / 2;
            }
            renderAll(infoPanel);
        }, 100);
    }

    A.registerPanel('rpg_map', {
        label: 'Map',
        subtitle: 'World Overview',
        category: 'RPG Experiment',
        icon: '🗺️',
        render: render
    });

})(window.Anansi);
