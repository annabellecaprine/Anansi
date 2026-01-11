/*
 * Anansi Panel: Hina's Travel Guide
 * File: js/panels/hinas_guide.js
 * Category: Forbidden Secrets
 * Description: Map building wizard with templates, AI enrichment, and Vault integration
 */

(function (A) {
    'use strict';

    // ===========================================
    // DEFAULT TEMPLATES (embedded to avoid CORS issues)
    // ===========================================
    const DEFAULT_TEMPLATES = [
        {
            id: "hub_spoke_interior",
            name: "Hub & Spoke Interior",
            description: "A central location branching to multiple connected zones. Perfect for markets, taverns, guild halls, or space stations.",
            tags: ["interior", "market", "tavern", "guild", "station", "hub"],
            genre: "any",
            scale: "building",
            author: "Anansi",
            locations: [
                { key: "hub", name: "Central Hall", type: "hub", description: "The heart of this establishment, where all paths converge.", expandable: false },
                { key: "branch_1", name: "Northern Wing", type: "room", description: "", expandable: true },
                { key: "branch_2", name: "Eastern Wing", type: "room", description: "", expandable: true },
                { key: "branch_3", name: "Southern Wing", type: "room", description: "", expandable: true },
                { key: "branch_4", name: "Western Wing", type: "room", description: "", expandable: true },
                { key: "back_room", name: "Back Room", type: "restricted", description: "A private area, not meant for casual visitors.", expandable: false }
            ],
            connections: [
                { from: "hub", to: "branch_1" },
                { from: "hub", to: "branch_2" },
                { from: "hub", to: "branch_3" },
                { from: "hub", to: "branch_4" },
                { from: "hub", to: "back_room", hidden: true }
            ]
        },
        {
            id: "linear_journey",
            name: "Linear Journey",
            description: "A straightforward path from start to finish. Ideal for roads, corridors, river routes, or story-driven progressions.",
            tags: ["linear", "road", "corridor", "river", "journey", "path"],
            genre: "any",
            scale: "region",
            author: "Anansi",
            locations: [
                { key: "start", name: "Starting Point", type: "waypoint", description: "Where the journey begins.", expandable: true },
                { key: "waypoint_1", name: "First Waypoint", type: "waypoint", description: "", expandable: true },
                { key: "waypoint_2", name: "Midpoint", type: "waypoint", description: "Halfway through the journey.", expandable: true },
                { key: "waypoint_3", name: "Third Waypoint", type: "waypoint", description: "", expandable: true },
                { key: "destination", name: "Destination", type: "landmark", description: "The end of the road.", expandable: true }
            ],
            connections: [
                { from: "start", to: "waypoint_1" },
                { from: "waypoint_1", to: "waypoint_2" },
                { from: "waypoint_2", to: "waypoint_3" },
                { from: "waypoint_3", to: "destination" }
            ]
        },
        {
            id: "regional_kingdom",
            name: "Regional Kingdom",
            description: "A central seat of power surrounded by settlements and wild territories. Great for fantasy kingdoms, colonies, or faction territories.",
            tags: ["kingdom", "region", "castle", "village", "wilderness", "political"],
            genre: "fantasy",
            scale: "kingdom",
            author: "Anansi",
            locations: [
                { key: "capital", name: "The Capital", type: "city", description: "The seat of power, where rulers hold court.", expandable: true },
                { key: "village_north", name: "Northern Village", type: "village", description: "A hardy settlement near the border.", expandable: true },
                { key: "village_east", name: "Eastern Village", type: "village", description: "A trading post along the main road.", expandable: true },
                { key: "village_south", name: "Southern Village", type: "village", description: "A farming community in fertile lands.", expandable: true },
                { key: "forest", name: "The Deep Woods", type: "wilderness", description: "An ancient forest, home to secrets and danger.", expandable: true },
                { key: "mountains", name: "The High Peaks", type: "wilderness", description: "Treacherous mountains guarding the realm's edge.", expandable: true },
                { key: "ruins", name: "The Old Ruins", type: "landmark", description: "Remnants of a forgotten age, whispered to be haunted.", expandable: true }
            ],
            connections: [
                { from: "capital", to: "village_north" },
                { from: "capital", to: "village_east" },
                { from: "capital", to: "village_south" },
                { from: "village_north", to: "mountains" },
                { from: "village_east", to: "forest" },
                { from: "village_south", to: "forest" },
                { from: "forest", to: "ruins" },
                { from: "mountains", to: "ruins", hidden: true }
            ]
        },
        {
            id: "branching_dungeon",
            name: "Branching Dungeon",
            description: "A classic dungeon layout with an entrance, branching paths, dead ends, and a final boss chamber. Perfect for RPG adventures.",
            tags: ["dungeon", "cave", "labyrinth", "underground", "adventure"],
            genre: "fantasy",
            scale: "building",
            author: "Anansi",
            locations: [
                { key: "entrance", name: "Dungeon Entrance", type: "entrance", description: "The mouth of the dungeon, yawning into darkness.", expandable: false },
                { key: "hall_1", name: "Entry Hall", type: "room", description: "The first chamber, littered with debris.", expandable: false },
                { key: "fork", name: "The Fork", type: "room", description: "The path splits here. Choose wisely.", expandable: false },
                { key: "left_path", name: "Left Passage", type: "corridor", description: "", expandable: true },
                { key: "right_path", name: "Right Passage", type: "corridor", description: "", expandable: true },
                { key: "dead_end", name: "Dead End", type: "trap", description: "A collapsed tunnel. Something glints in the rubble.", expandable: false },
                { key: "treasure_room", name: "Treasure Vault", type: "loot", description: "A hidden cache of valuables, guarded by ancient wards.", expandable: false },
                { key: "boss_antechamber", name: "Antechamber", type: "room", description: "The air grows heavy. Something powerful awaits beyond.", expandable: false },
                { key: "boss_chamber", name: "Boss Chamber", type: "boss", description: "The heart of the dungeon. The final confrontation.", expandable: false }
            ],
            connections: [
                { from: "entrance", to: "hall_1" },
                { from: "hall_1", to: "fork" },
                { from: "fork", to: "left_path" },
                { from: "fork", to: "right_path" },
                { from: "left_path", to: "dead_end" },
                { from: "left_path", to: "treasure_room", hidden: true },
                { from: "right_path", to: "boss_antechamber" },
                { from: "boss_antechamber", to: "boss_chamber" }
            ]
        },
        {
            id: "neighborhood_grid",
            name: "Neighborhood Grid",
            description: "A 2D grid layout with adjacent connections. Ideal for city districts, residential areas, or any zone with spatial structure.",
            tags: ["city", "district", "grid", "neighborhood", "urban"],
            genre: "modern",
            scale: "district",
            author: "Anansi",
            locations: [
                { key: "nw", name: "Northwest Block", type: "block", description: "", expandable: true },
                { key: "n", name: "North Block", type: "block", description: "", expandable: true },
                { key: "ne", name: "Northeast Block", type: "block", description: "", expandable: true },
                { key: "w", name: "West Block", type: "block", description: "", expandable: true },
                { key: "center", name: "Central Plaza", type: "landmark", description: "The heart of the neighborhood, always bustling.", expandable: true },
                { key: "e", name: "East Block", type: "block", description: "", expandable: true },
                { key: "sw", name: "Southwest Block", type: "block", description: "", expandable: true },
                { key: "s", name: "South Block", type: "block", description: "", expandable: true },
                { key: "se", name: "Southeast Block", type: "block", description: "", expandable: true }
            ],
            connections: [
                { from: "nw", to: "n" },
                { from: "nw", to: "w" },
                { from: "n", to: "ne" },
                { from: "n", to: "center" },
                { from: "ne", to: "e" },
                { from: "w", to: "center" },
                { from: "w", to: "sw" },
                { from: "center", to: "e" },
                { from: "center", to: "s" },
                { from: "e", to: "se" },
                { from: "sw", to: "s" },
                { from: "s", to: "se" }
            ]
        }
    ];

    // Template state variables
    let templates = [];
    let templateData = null;

    async function loadTemplates() {
        if (templateData) return templateData;

        // Use embedded templates (avoids CORS issues with file:// protocol)
        templates = DEFAULT_TEMPLATES;
        templateData = { templates: DEFAULT_TEMPLATES };
        return templateData;
    }

    // ===========================================
    // RENDER FUNCTION
    // ===========================================
    async function render(container) {
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflow = 'hidden';
        container.style.background = 'var(--bg-base)';

        // Load templates
        await loadTemplates();

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle);';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2 style="margin:0; font-size:18px; display:flex; align-items:center; gap:8px;">
                        🗺️ Hina's Travel Guide
                    </h2>
                    <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Rapid map generation with templates and AI enrichment</p>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; overflow-y:auto; padding:20px;';
        container.appendChild(content);

        // === SECTION: Map Cabinet (Templates) ===
        const cabinetSection = document.createElement('div');
        cabinetSection.className = 'card';
        cabinetSection.style.cssText = 'padding:20px; margin-bottom:20px;';
        cabinetSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px; display:flex; align-items:center; gap:8px;">
                🗄️ Map Cabinet
                <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(${templates.length} templates available)</span>
            </h3>
            <div id="template-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;"></div>
        `;
        content.appendChild(cabinetSection);

        const templateGrid = cabinetSection.querySelector('#template-grid');
        renderTemplateCards(templateGrid);

        // === SECTION: Custom Builder (Coming Soon) ===
        const builderSection = document.createElement('div');
        builderSection.className = 'card';
        builderSection.style.cssText = 'padding:20px; margin-bottom:20px; opacity:0.6;';
        builderSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px; display:flex; align-items:center; gap:8px;">
                ✏️ Custom Map Builder
                <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(Coming Soon)</span>
            </h3>
            <p style="margin:0; font-size:12px; color:var(--text-muted);">
                Build a map from scratch with a step-by-step wizard. Define your genre, scale, structure, and let AI enrich the details.
            </p>
        `;
        content.appendChild(builderSection);

        // === SECTION: Quick Links ===
        const linksSection = document.createElement('div');
        linksSection.className = 'card';
        linksSection.style.cssText = 'padding:20px; margin-bottom:20px;';
        linksSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px;">🔗 Related Tools</h3>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <button id="btn-goto-locations" class="btn btn-ghost" style="padding:12px 16px;">
                    📍 Locations Panel
                </button>
                <button id="btn-goto-dm-atlas" class="btn btn-ghost" style="padding:12px 16px;">
                    🗺️ DM Atlas
                </button>
                <button id="btn-goto-vault" class="btn btn-ghost" style="padding:12px 16px;">
                    🏛️ Vault
                </button>
            </div>
        `;
        content.appendChild(linksSection);

        // Wire quick links
        linksSection.querySelector('#btn-goto-locations').onclick = () => A.UI.switchPanel('locations');
        linksSection.querySelector('#btn-goto-dm-atlas').onclick = () => A.UI.switchPanel('rpg_dm_map');
        linksSection.querySelector('#btn-goto-vault').onclick = () => A.UI.switchPanel('vault');

        // === SECTION: Publish to Vault ===
        const publishSection = document.createElement('div');
        publishSection.className = 'card';
        publishSection.style.cssText = 'padding:20px;';
        publishSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px;">📤 Publish to Vault</h3>
            <p style="margin:0 0 12px; font-size:12px; color:var(--text-muted);">
                Export your current Locations as a reusable map template and save it to your Vault.
            </p>
            <button id="btn-publish-template" class="btn btn-primary" style="width:100%;">
                📤 Export Current Locations as Template
            </button>
        `;
        content.appendChild(publishSection);

        publishSection.querySelector('#btn-publish-template').onclick = () => showPublishModal();
    }

    // ===========================================
    // PUBLISH MODAL
    // ===========================================
    function showPublishModal() {
        const state = A.State.get();

        // Handle multi-map structure
        let locations = [];
        if (state.weaves?.maps && state.weaves.maps.length > 0) {
            locations = state.weaves.maps[0].locations || [];
        } else if (state.weaves?.locations) {
            locations = state.weaves.locations;
        }

        if (locations.length === 0) {
            if (A.UI?.Toast) A.UI.Toast.show('No locations to export. Add some locations first!', 'warning');
            return;
        }

        const content = `
            <div style="padding:20px;">
                <div style="margin-bottom:16px;">
                    <label class="label">Template Name</label>
                    <input type="text" id="template-name" class="input" style="width:100%;" placeholder="My Custom Map" value="${state.meta?.name || 'Custom'} Map">
                </div>
                <div style="margin-bottom:16px;">
                    <label class="label">Description</label>
                    <textarea id="template-desc" class="input" style="width:100%; height:60px;" placeholder="Describe this map template..."></textarea>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                    <div>
                        <label class="label">Genre</label>
                        <select id="template-genre" class="input" style="width:100%;">
                            <option value="any">Any</option>
                            <option value="fantasy">Fantasy</option>
                            <option value="scifi">Sci-Fi</option>
                            <option value="modern">Modern</option>
                            <option value="horror">Horror</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Scale</label>
                        <select id="template-scale" class="input" style="width:100%;">
                            <option value="building">Building</option>
                            <option value="district">District</option>
                            <option value="region">Region</option>
                            <option value="kingdom">Kingdom</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom:16px; padding:12px; background:var(--bg-inset); border-radius:var(--radius-md);">
                    <div style="font-size:12px; color:var(--text-muted);">
                        📍 <strong>${locations.length}</strong> locations will be exported
                    </div>
                </div>
            </div>
        `;

        const modalOverlay = A.UI.Modal.show({
            title: 'Publish Map Template',
            content: content,
            width: 450,
            actions: [
                {
                    label: '📤 Publish to Vault',
                    class: 'btn-primary',
                    onclick: async (modal) => {
                        const name = modal.querySelector('#template-name').value.trim() || 'Custom Map';
                        const desc = modal.querySelector('#template-desc').value.trim() || '';
                        const genre = modal.querySelector('#template-genre').value;
                        const scale = modal.querySelector('#template-scale').value;

                        await publishToVault(name, desc, genre, scale);
                        return true; // Close modal
                    }
                }
            ]
        });
    }

    // ===========================================
    // PUBLISH TO VAULT
    // ===========================================
    async function publishToVault(name, description, genre, scale) {
        const state = A.State.get();

        // Handle multi-map structure
        let locations = [];
        if (state.weaves?.maps && state.weaves.maps.length > 0) {
            // Use the first map (or could prompt user to choose)
            locations = state.weaves.maps[0].locations || [];
        } else if (state.weaves?.locations) {
            locations = state.weaves.locations;
        }

        if (locations.length === 0) {
            if (A.UI?.Toast) A.UI.Toast.show('No locations to export!', 'warning');
            return;
        }

        const templateId = 'custom_' + Math.random().toString(36).substr(2, 8);
        const templateData = {
            id: templateId,
            name: name,
            description: description,
            tags: ['custom', genre, scale],
            genre: genre,
            scale: scale,
            author: state.meta?.name || 'User',
            locations: locations.map(loc => ({
                key: loc.id,
                name: loc.name,
                type: loc.type || 'location',
                description: loc.description || '',
                expandable: loc.expandable || false
            })),
            connections: []
        };

        // Build connections from location exits/connections
        locations.forEach(loc => {
            // Handle 'exits' array (array of location IDs)
            if (loc.exits && Array.isArray(loc.exits)) {
                loc.exits.forEach(exitId => {
                    templateData.connections.push({
                        from: loc.id,
                        to: exitId,
                        hidden: false
                    });
                });
            }
            // Handle 'connections' array (array of objects with target)
            else if (loc.connections && Array.isArray(loc.connections)) {
                loc.connections.forEach(conn => {
                    templateData.connections.push({
                        from: loc.id,
                        to: conn.target,
                        hidden: conn.hidden || false
                    });
                });
            }
        });

        // Publish to Vault
        try {
            await A.VaultDB.publish('map_template', templateData, {
                sourceProjectId: state.meta?.id,
                sourceProjectName: state.meta?.name || 'Unknown Project',
                universe: state.meta?.universe || '',
                tags: templateData.tags
            });

            if (A.UI?.Toast) {
                A.UI.Toast.show(`✅ Published "${name}" to Vault with ${locations.length} locations!`, 'success');
            }
        } catch (err) {
            console.error('[Hina\'s Guide] Publish failed:', err);
            if (A.UI?.Toast) A.UI.Toast.show('Failed to publish to Vault', 'error');
        }
    }

    // ===========================================
    // TEMPLATE CARD RENDERER
    // ===========================================
    function renderTemplateCards(container) {
        container.innerHTML = '';

        if (templates.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:20px; text-align:center;">No templates found.</div>';
            return;
        }

        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = `
                padding:16px;
                cursor:pointer;
                transition:all 0.2s ease;
                border:1px solid var(--border-subtle);
                background:var(--bg-surface);
            `;

            // Genre icon mapping
            const genreIcons = {
                fantasy: '⚔️',
                scifi: '🚀',
                modern: '🏙️',
                horror: '👻',
                any: '🌐'
            };
            const genreIcon = genreIcons[template.genre] || '🌐';

            // Scale icon mapping
            const scaleIcons = {
                building: '🏠',
                district: '🏘️',
                region: '🏔️',
                kingdom: '👑',
                planet: '🌍'
            };
            const scaleIcon = scaleIcons[template.scale] || '📍';

            card.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:12px;">
                    <div style="font-size:28px; line-height:1;">${genreIcon}</div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${template.name}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">${template.description}</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <span style="font-size:10px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px;">${scaleIcon} ${template.scale}</span>
                            <span style="font-size:10px; padding:2px 6px; background:var(--bg-elevated); border-radius:4px;">📍 ${template.locations.length} locations</span>
                        </div>
                    </div>
                </div>
            `;

            card.onmouseenter = () => {
                card.style.borderColor = 'var(--accent-primary)';
                card.style.background = 'var(--bg-elevated)';
            };
            card.onmouseleave = () => {
                card.style.borderColor = 'var(--border-subtle)';
                card.style.background = 'var(--bg-surface)';
            };

            card.onclick = () => showTemplatePreview(template);

            container.appendChild(card);
        });
    }

    // ===========================================
    // TEMPLATE PREVIEW MODAL
    // ===========================================
    function showTemplatePreview(template) {
        const locationsList = template.locations.map(loc => {
            const expandIcon = loc.expandable ? ' 🔄' : '';
            return `<li style="margin:4px 0;"><strong>${loc.name}</strong>${expandIcon}<br><span style="font-size:11px; color:var(--text-muted);">${loc.description || '(No description)'}</span></li>`;
        }).join('');

        const connectionsList = template.connections.map(conn => {
            const hidden = conn.hidden ? ' (hidden)' : '';
            return `<li style="font-size:11px; margin:2px 0;">${conn.from} → ${conn.to}${hidden}</li>`;
        }).join('');

        const content = `
            <div style="padding:20px; max-height:60vh; overflow-y:auto;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
                    <div style="font-size:40px;">🗺️</div>
                    <div>
                        <h3 style="margin:0; font-size:18px;">${template.name}</h3>
                        <p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">${template.description}</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <h4 style="margin:0 0 8px; font-size:13px;">📍 Locations (${template.locations.length})</h4>
                        <ul style="margin:0; padding-left:20px; font-size:12px;">${locationsList}</ul>
                    </div>
                    <div>
                        <h4 style="margin:0 0 8px; font-size:13px;">🔗 Connections (${template.connections.length})</h4>
                        <ul style="margin:0; padding-left:20px;">${connectionsList}</ul>
                    </div>
                </div>

                <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle); display:flex; gap:12px;">
                    <button id="btn-import-template" class="btn btn-primary" style="flex:1;">📥 Import to Project</button>
                    <button id="btn-enrich-template" class="btn btn-ghost" style="flex:1;" disabled title="Coming in Phase 3">✨ AI Enrich (Soon)</button>
                </div>
            </div>
        `;

        A.UI.Modal.show('Template Preview', content, {
            width: '600px',
            onOpen: (modalEl) => {
                modalEl.querySelector('#btn-import-template').onclick = () => {
                    importTemplateToProject(template);
                    A.UI.Modal.close();
                };
            }
        });
    }

    // ===========================================
    // IMPORT TEMPLATE TO PROJECT
    // ===========================================
    function importTemplateToProject(template) {
        const state = A.State.get();

        // Ensure locations array exists
        if (!state.weaves) state.weaves = {};
        if (!state.weaves.locations) state.weaves.locations = [];

        const existingIds = new Set(state.weaves.locations.map(l => l.id));

        // Generate unique IDs and import locations
        const idMap = {};
        template.locations.forEach(loc => {
            let newId = `${template.id}_${loc.key}`;
            let counter = 1;
            while (existingIds.has(newId)) {
                newId = `${template.id}_${loc.key}_${counter++}`;
            }
            idMap[loc.key] = newId;

            state.weaves.locations.push({
                id: newId,
                name: loc.name,
                description: loc.description || '',
                type: loc.type || 'location',
                expandable: loc.expandable || false,
                connections: [],
                _templateSource: template.id
            });

            existingIds.add(newId);
        });

        // Add connections
        template.connections.forEach(conn => {
            const fromId = idMap[conn.from];
            const toId = idMap[conn.to];
            if (fromId && toId) {
                const fromLoc = state.weaves.locations.find(l => l.id === fromId);
                if (fromLoc) {
                    if (!fromLoc.connections) fromLoc.connections = [];
                    fromLoc.connections.push({
                        target: toId,
                        hidden: conn.hidden || false
                    });
                }
            }
        });

        A.State.notify();

        if (A.UI?.Toast) {
            A.UI.Toast.show(`✅ Imported "${template.name}" with ${template.locations.length} locations!`, 'success');
        }
    }

    // ===========================================
    // PANEL REGISTRATION
    // ===========================================
    A.registerPanel('hinas_guide', {
        label: "Hina's Travel Guide",
        subtitle: 'Map Builder',
        category: 'Forbidden Secrets',
        icon: '🗺️',
        render: render
    });

    // ===========================================
    // CONSOLE HELPERS (for testing)
    // ===========================================
    /**
     * Export current locations as a template object
     * Usage: Anansi.HinasGuide.exportLocationsAsTemplate()
     * Usage: Anansi.HinasGuide.exportLocationsAsTemplate("My Map", "Main Map")
     */
    if (!A.HinasGuide) A.HinasGuide = {};

    // Debug helper
    A.HinasGuide.debugState = function () {
        const state = A.State.get();
        console.log('[Hina\'s Guide] Full weaves structure:', state.weaves);
        console.log('[Hina\'s Guide] Maps:', state.weaves?.maps);
        console.log('[Hina\'s Guide] Locations (legacy):', state.weaves?.locations);
        return state.weaves;
    };

    A.HinasGuide.exportLocationsAsTemplate = function (name = 'Exported Map', mapName = null) {
        const state = A.State.get();

        // Handle multi-map structure
        let locations = [];
        if (state.weaves?.maps && state.weaves.maps.length > 0) {
            // Find the specified map or use the first one
            const targetMap = mapName
                ? state.weaves.maps.find(m => m.name === mapName)
                : state.weaves.maps[0];
            if (targetMap) {
                locations = targetMap.locations || [];
                console.log(`[Hina's Guide] Exporting from map: "${targetMap.name}"`);
            }
        } else if (state.weaves?.locations) {
            // Legacy flat structure
            locations = state.weaves.locations;
        }

        if (locations.length === 0) {
            console.warn('[Hina\'s Guide] No locations to export.');
            console.log('[Hina\'s Guide] Available maps:', state.weaves?.maps?.map(m => m.name) || 'none');
            return null;
        }

        const template = {
            id: 'export_' + Math.random().toString(36).substr(2, 8),
            name: name,
            description: 'Exported from current project',
            tags: ['custom', 'exported'],
            genre: 'any',
            scale: 'region',
            author: state.meta?.name || 'User',
            locations: locations.map(loc => ({
                key: loc.id,
                name: loc.name,
                type: loc.type || 'location',
                description: loc.description || '',
                expandable: loc.expandable || false
            })),
            connections: []
        };

        // Build connections from location exits/connections
        locations.forEach(loc => {
            // Handle 'exits' array (array of location IDs)
            if (loc.exits && Array.isArray(loc.exits)) {
                loc.exits.forEach(exitId => {
                    template.connections.push({
                        from: loc.id,
                        to: exitId,
                        hidden: false
                    });
                });
            }
            // Handle 'connections' array (array of objects with target)
            else if (loc.connections && Array.isArray(loc.connections)) {
                loc.connections.forEach(conn => {
                    template.connections.push({
                        from: loc.id,
                        to: conn.target,
                        hidden: conn.hidden || false
                    });
                });
            }
        });

        console.log('[Hina\'s Guide] Exported template:', template);
        console.log('[Hina\'s Guide] Copy this JSON:', JSON.stringify(template, null, 2));
        return template;
    };

})(window.Anansi);

// ===========================================
// TOUR REGISTRATION
// ===========================================
if (window.Anansi.UI && window.Anansi.UI.Tour) {
    window.Anansi.UI.Tour.register('hinas_guide', [
        {
            target: '#template-grid',
            title: "Hina's Travel Guide",
            content: 'Welcome to the Map Builder! Browse pre-made templates or build custom maps with AI assistance.'
        },
        {
            target: '.card:first-child',
            title: 'Map Templates',
            content: 'Click a template to preview its structure. You can import it directly or enrich it with AI-generated descriptions.'
        }
    ]);
}
