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

        // === SECTION: Custom Map Builder (Wizard) ===
        const builderSection = document.createElement('div');
        builderSection.className = 'card';
        builderSection.style.cssText = 'padding:20px; margin-bottom:20px;';

        // Determine visibility based on persistent step
        const showStep1 = wizardState.step === 1 ? 'block' : 'none';
        const showStep2 = wizardState.step === 2 ? 'block' : 'none';

        builderSection.innerHTML = `
            <h3 style="margin:0 0 16px; font-size:14px; display:flex; align-items:center; gap:8px;">
                ✏️ Custom Map Builder
                <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">(Create from scratch)</span>
            </h3>
            
            <div id="wizard-container">
                <!-- Step 1: Basic Info -->
                <div id="wizard-step-1" class="wizard-step" style="display:${showStep1};">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                        <div>
                            <label class="label">Map Name</label>
                            <input type="text" id="wizard-name" class="input" style="width:100%;" placeholder="My Custom Map">
                        </div>
                        <div>
                            <label class="label">Genre</label>
                            <select id="wizard-genre" class="input" style="width:100%;">
                                <option value="fantasy">⚔️ Fantasy</option>
                                <option value="scifi">🚀 Sci-Fi</option>
                                <option value="modern">🏙️ Modern</option>
                                <option value="horror">👻 Horror</option>
                                <option value="any">🌐 Any/Generic</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                        <div>
                            <label class="label">Scale</label>
                            <select id="wizard-scale" class="input" style="width:100%;">
                                <option value="building">🏠 Building (rooms, floors)</option>
                                <option value="district">🏘️ District (streets, blocks)</option>
                                <option value="region">🏔️ Region (areas, zones)</option>
                                <option value="kingdom">👑 Kingdom (cities, territories)</option>
                            </select>
                        </div>
                        <div>
                            <label class="label">Structure</label>
                            <select id="wizard-structure" class="input" style="width:100%;">
                                <option value="hub">🎯 Hub & Spoke (central + branches)</option>
                                <option value="linear">➡️ Linear (A → B → C)</option>
                                <option value="grid">🔲 Grid (2D layout)</option>
                                <option value="branching">🌳 Branching (forks + dead ends)</option>
                                <option value="freeform">🎨 Freeform (I'll define it)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <label class="label">Number of Locations</label>
                        <input type="range" id="wizard-count" min="3" max="15" value="5" style="width:100%;">
                        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted);">
                            <span>Small (3)</span>
                            <span id="wizard-count-display">5 locations</span>
                            <span>Large (15)</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <label class="label">Key Landmarks (optional, comma-separated)</label>
                        <input type="text" id="wizard-landmarks" class="input" style="width:100%;" placeholder="e.g., The Castle, Dark Forest, Old Mill">
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <label class="label">Tone/Atmosphere Keywords (optional)</label>
                        <input type="text" id="wizard-tone" class="input" style="width:100%;" placeholder="e.g., grim, mysterious, war-torn, peaceful">
                    </div>
                    
                    <div style="display:flex; gap:12px; justify-content:space-between; align-items:center;">
                        <button id="btn-wizard-clear" class="btn btn-ghost" style="color:var(--text-muted); font-size:12px;">❌ Clear Form</button>
                        <button id="btn-wizard-generate" class="btn btn-primary">🎲 Generate Map</button>
                    </div>
                </div>
                
                <!-- Step 2: Preview (hidden until generated) -->
                <div id="wizard-step-2" class="wizard-step" style="display:${showStep2};">
                    <div id="wizard-preview" style="margin-bottom:16px;"></div>
                    <div style="display:flex; gap:12px; justify-content:space-between;">
                        <button id="btn-wizard-back" class="btn btn-ghost">⬅️ Back to Settings</button>
                        <div style="display:flex; gap:12px;">
                            <button id="btn-wizard-regenerate" class="btn btn-ghost">🔄 Regenerate</button>
                            <button id="btn-wizard-commit" class="btn btn-primary">📥 Import to Project</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        content.appendChild(builderSection);

        // Wire up wizard
        wireWizard(builderSection);

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
            <h3 style="margin:0 0 16px; font-size:14px;">📥 Publish to Vault</h3>
            <p style="margin:0 0 12px; font-size:12px; color:var(--text-muted);">
                Export your current Locations as a reusable map template and save it to your Vault.
            </p>
            <button id="btn-publish-template" class="btn btn-primary" style="width:100%;">
                📥 Export Current Locations as Template
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
                    label: '📥 Publish to Vault',
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
    // IMPORT TEMPLATE TO PROJECT
    // ===========================================
    function importTemplateToProject(template) {
        const state = A.State.get();
        let targetMap = null;

        // 1. Resolve Target Map (Prefer A.Locations helper)
        if (A.Locations && A.Locations.getActiveMap) {
            targetMap = A.Locations.getActiveMap(state);
        } else {
            // Manual Fallback
            if (!state.weaves) state.weaves = {};
            if (!state.weaves.maps || state.weaves.maps.length === 0) {
                state.weaves.maps = [{ id: 'map_default', name: 'Main Map', type: 'region', locations: [] }];
                state.weaves.activeMap = 'map_default';
            }
            const activeId = state.weaves.activeMap || state.weaves.maps[0].id;
            targetMap = state.weaves.maps.find(m => m.id === activeId);
        }

        if (!targetMap) {
            console.warn('[Hina] CRITICAL: No map found to import into.');
            if (A.UI?.Toast) A.UI.Toast.show('Error: No target map.', 'error');
            return;
        }

        console.warn(`[Hina] Importing "${template.name}" into Map: "${targetMap.name}" (${targetMap.id})`);

        // 2. Prepare Data
        if (!targetMap.locations) targetMap.locations = [];
        const existingIds = new Set(targetMap.locations.map(l => l.id));
        const idMap = {};
        const startCount = targetMap.locations.length;

        // 3. Import Locations
        template.locations.forEach((loc, idx) => {
            let newId = `${template.id}_${loc.key}`;
            let counter = 1;
            while (existingIds.has(newId)) newId = `${template.id}_${loc.key}_${counter++}`;
            idMap[loc.key] = newId;

            // Grid Layout
            const gridSize = 40;
            const baseOffset = startCount;
            const offsetX = ((baseOffset + idx) % 5) * gridSize * 2;
            const offsetY = Math.floor((baseOffset + idx) / 5) * gridSize * 2 + (startCount > 0 ? 100 : 0);

            const newLoc = {
                id: newId,
                name: loc.name,
                description: loc.description || '',
                type: loc.type || 'location',
                expandable: !!loc.expandable,
                exits: [],
                pos: { x: offsetX, y: offsetY },
                _templateSource: template.id
            };

            // Copy RPG Data (Secrets, Loot, Encounters)
            if (loc.rpg) {
                newLoc.rpg = JSON.parse(JSON.stringify(loc.rpg)); // Deep copy
            }
            // Legacy handling for direct props if any
            if (loc.secret) {
                if (!newLoc.rpg) newLoc.rpg = {};
                if (!newLoc.rpg.secrets) newLoc.rpg.secrets = [];
                newLoc.rpg.secrets.push(loc.secret);
            }

            targetMap.locations.push(newLoc);
            existingIds.add(newId);
        });

        // 4. Connect Exits
        template.connections.forEach(conn => {
            const fromId = idMap[conn.from];
            const toId = idMap[conn.to];
            if (fromId && toId) {
                const fromLoc = targetMap.locations.find(l => l.id === fromId);
                if (fromLoc && !fromLoc.exits.includes(toId)) {
                    fromLoc.exits.push(toId);
                }
            }
        });

        // 5. Import Quest (if any)
        if (template.quest && A.RPGQuests) {
            const quest = JSON.parse(JSON.stringify(template.quest));

            // Remap Objective Targets (specifically for VISIT locations)
            quest.objectives.forEach(obj => {
                if (obj.type === 'VISIT' && idMap[obj.target]) {
                    obj.target = idMap[obj.target];
                }
                // Note: KILL and FETCH targets are usually generic names/IDs (e.g. "Rat") not location IDs, so they stay same.
            });

            A.RPGQuests.accept(quest);
            if (A.UI?.Toast) A.UI.Toast.show(`📜 Quest Accepted: ${quest.title}`, 'info');
        }

        console.warn(`[Hina] Import Success. Locations count: ${startCount} -> ${targetMap.locations.length}`);

        // 6. Save & Notify
        A.State.notify();
        if (window.renderLocationPanel) window.renderLocationPanel();

        if (A.UI?.Toast) A.UI.Toast.show(`✅ Imported "${template.name}" with ${template.locations.length} locations!`, 'success');
    }

    // ===========================================
    // WIZARD WIRING
    // ===========================================
    // ===========================================
    // WIZARD WIRING
    // ===========================================

    // Default initial inputs
    const DEFAULT_WIZARD_INPUTS = {
        name: '',
        genre: 'fantasy',
        scale: 'region',
        structure: 'hub',
        count: 5,
        landmarks: '',
        tone: ''
    };

    // Persisted state for the wizard
    let wizardState = {
        step: 1, // 1: Inputs, 2: Preview
        template: null,
        inputs: { ...DEFAULT_WIZARD_INPUTS }
    };

    function wireWizard(container) {
        // Elements
        const countSlider = container.querySelector('#wizard-count');
        const countDisplay = container.querySelector('#wizard-count-display');

        const inputs = {
            name: container.querySelector('#wizard-name'),
            genre: container.querySelector('#wizard-genre'),
            scale: container.querySelector('#wizard-scale'),
            structure: container.querySelector('#wizard-structure'),
            count: container.querySelector('#wizard-count'),
            landmarks: container.querySelector('#wizard-landmarks'),
            tone: container.querySelector('#wizard-tone')
        };

        const generateBtn = container.querySelector('#btn-wizard-generate');
        const clearBtn = container.querySelector('#btn-wizard-clear');

        const backBtn = container.querySelector('#btn-wizard-back');
        const regenerateBtn = container.querySelector('#btn-wizard-regenerate');
        const commitBtn = container.querySelector('#btn-wizard-commit');

        const step1 = container.querySelector('#wizard-step-1');
        const step2 = container.querySelector('#wizard-step-2');
        const previewEl = container.querySelector('#wizard-preview');

        if (!countSlider) return;

        // --- 1. RESTORE STATE ---
        // Apply saved values to inputs
        Object.keys(inputs).forEach(key => {
            if (inputs[key] && wizardState.inputs[key] !== undefined) {
                inputs[key].value = wizardState.inputs[key];
            }
        });

        // Update labels (specifically for the slider)
        if (inputs.count) {
            countDisplay.textContent = `${inputs.count.value} locations`;
        }

        // If in Step 2, re-render preview
        if (wizardState.step === 2 && wizardState.template) {
            renderPreview(previewEl, wizardState.template);
        }

        // --- 2. BIND LISTENERS (Auto-save) ---
        Object.keys(inputs).forEach(key => {
            if (inputs[key]) {
                const eventType = (key === 'name' || key === 'landmarks' || key === 'tone') ? 'input' : 'change';
                inputs[key].addEventListener(eventType, (e) => {
                    wizardState.inputs[key] = e.target.value;
                    // Special handler for slider display
                    if (key === 'count') {
                        countDisplay.textContent = `${e.target.value} locations`;
                    }
                });
            }
        });

        // --- 3. ACTIONS ---

        // Generate (Go to Step 2)
        generateBtn.onclick = () => {
            const config = {
                name: inputs.name.value.trim() || 'Custom Map',
                genre: inputs.genre.value,
                scale: inputs.scale.value,
                structure: inputs.structure.value,
                count: parseInt(inputs.count.value),
                landmarks: inputs.landmarks.value.split(',').map(s => s.trim()).filter(Boolean),
                tone: inputs.tone.value.trim()
            };

            wizardState.template = generateMapFromConfig(config);
            renderPreview(previewEl, wizardState.template);

            // Update State
            wizardState.step = 2;
            step1.style.display = 'none';
            step2.style.display = 'block';
        };

        // Clear Form
        if (clearBtn) {
            clearBtn.onclick = () => {
                // Reset State
                wizardState.inputs = { ...DEFAULT_WIZARD_INPUTS };
                wizardState.step = 1;
                wizardState.template = null;

                // Reset UI Inputs
                Object.keys(inputs).forEach(key => {
                    if (inputs[key]) inputs[key].value = DEFAULT_WIZARD_INPUTS[key];
                });
                countDisplay.textContent = `${DEFAULT_WIZARD_INPUTS.count} locations`;

                // Ensure Step 1 is visible
                step1.style.display = 'block';
                step2.style.display = 'none';

                if (A.UI?.Toast) A.UI.Toast.show('Form cleared', 'info');
            };
        }

        // Back (Go to Step 1)
        backBtn.onclick = () => {
            wizardState.step = 1;
            step1.style.display = 'block';
            step2.style.display = 'none';
        };

        // Regenerate
        regenerateBtn.onclick = () => {
            generateBtn.click();
        };

        // Import
        commitBtn.onclick = () => {
            if (wizardState.template) {
                importTemplateToProject(wizardState.template);

                // Reset State after successful import
                wizardState.inputs = { ...DEFAULT_WIZARD_INPUTS };
                wizardState.step = 1;
                wizardState.template = null;

                // Reset UI
                Object.keys(inputs).forEach(key => {
                    if (inputs[key]) inputs[key].value = DEFAULT_WIZARD_INPUTS[key];
                });
                countDisplay.textContent = `${DEFAULT_WIZARD_INPUTS.count} locations`;

                step1.style.display = 'block';
                step2.style.display = 'none';
            }
        };
    }

    // ===========================================
    // MAP GENERATION LOGIC
    // ===========================================
    function generateMapFromConfig(config) {
        const { name, genre, scale, structure, count, landmarks, tone } = config;

        const locationTypes = {
            building: ['room', 'hall', 'chamber', 'corridor', 'alcove', 'office', 'storage'],
            district: ['block', 'street', 'plaza', 'alley', 'park', 'market', 'shop'],
            region: ['area', 'zone', 'crossing', 'settlement', 'outpost', 'wilderness', 'waypoint'],
            kingdom: ['city', 'town', 'village', 'fortress', 'territory', 'province', 'capital']
        };

        const nameTemplates = {
            fantasy: ['The {adj} {noun}', '{noun} of {element}', '{adj} {place}', "The {noun}'s Rest"],
            scifi: ['Sector {alpha}', '{noun} Station', 'The {adj} Hub', 'Deck {num}'],
            modern: ['{adj} {place}', 'The {noun}', '{noun} District', 'Downtown {place}'],
            horror: ['The {adj} {noun}', 'Forsaken {place}', '{noun} of Shadows', 'The Fallen {noun}'],
            any: ['The {noun}', '{adj} {place}', 'Central {noun}', '{place} {area}']
        };

        const words = {
            fantasy: {
                adj: ['Ancient', 'Mystic', 'Crystal', 'Golden', 'Shadowed', 'Sacred', 'Hollow', 'Iron', 'Silent', 'Crimson'],
                noun: ['Tower', 'Keep', 'Grove', 'Sanctuary', 'Forge', 'Gate', 'Well', 'Throne', 'Shrine', 'Spire'],
                place: ['Hall', 'Bridge', 'Path', 'Court', 'Garden', 'Chamber', 'Cavern', 'Passage'],
                element: ['Fire', 'Ice', 'Light', 'Darkness', 'Wind', 'Stone', 'Stars', 'Dreams']
            },
            scifi: {
                adj: ['Primary', 'Alpha', 'Quantum', 'Neural', 'Stellar', 'Core', 'Fusion', 'Nano'],
                noun: ['Command', 'Engineering', 'Medical', 'Cargo', 'Reactor', 'Bridge', 'Lab', 'Dock'],
                alpha: ['A1', 'B7', 'C3', 'D9', 'E4', 'F2', 'G8', 'H5'],
                num: ['01', '07', '13', '42', '99', '12', '37', '88']
            },
            modern: {
                adj: ['Grand', 'Old', 'New', 'Central', 'Riverside', 'Highland', 'Western', 'Eastern'],
                noun: ['Square', 'Avenue', 'Street', 'Plaza', 'Center', 'Park', 'Building', 'Office'],
                place: ['Heights', 'Gardens', 'Crossing', 'Station', 'Terminal', 'Market', 'Commons']
            },
            horror: {
                adj: ['Rotting', 'Abandoned', 'Twisted', 'Bleeding', 'Silent', 'Hungry', 'Broken', 'Cursed'],
                noun: ['Asylum', 'Crypt', 'Manor', 'Chapel', 'Pit', 'Grave', 'Cellar', 'Attic'],
                place: ['Woods', 'Hollow', 'Depths', 'Ruins', 'Basement', 'Corridor', 'Chamber']
            },
            any: {
                adj: ['Central', 'Northern', 'Western', 'Upper', 'Lower', 'Hidden', 'Main', 'Old'],
                noun: ['Hub', 'Center', 'Area', 'Zone', 'Point', 'Station', 'Post', 'Base'],
                place: ['Sector', 'Region', 'District', 'Territory', 'Quarter', 'Wing', 'Level']
            }
        };

        function generateName(genreKey, usedNames) {
            const templates = nameTemplates[genreKey] || nameTemplates.any;
            const wordPool = words[genreKey] || words.any;
            let attempts = 0;
            let name;
            do {
                const template = templates[Math.floor(Math.random() * templates.length)];
                name = template.replace(/\{(\w+)\}/g, (match, key) => {
                    const pool = wordPool[key];
                    return pool ? pool[Math.floor(Math.random() * pool.length)] : match;
                });
                attempts++;
            } while (usedNames.has(name) && attempts < 20);
            usedNames.add(name);
            return name;
        }

        const locations = [];
        const usedNames = new Set();
        const types = locationTypes[scale] || locationTypes.region;

        landmarks.forEach((lm, i) => {
            if (i < count) {
                usedNames.add(lm);
                locations.push({
                    key: `loc_${i}`,
                    name: lm,
                    type: types[Math.floor(Math.random() * types.length)],
                    description: '',
                    expandable: true
                });
            }
        });

        for (let i = locations.length; i < count; i++) {
            locations.push({
                key: `loc_${i}`,
                name: generateName(genre, usedNames),
                type: types[Math.floor(Math.random() * types.length)],
                description: '',
                expandable: true
            });
        }

        const connections = generateConnections(locations, structure);

        return {
            id: 'wizard_' + Math.random().toString(36).substr(2, 8),
            name: name,
            description: tone ? `A ${tone} ${scale}` : `A ${genre} ${scale}`,
            tags: ['custom', 'wizard', genre, scale],
            genre: genre,
            scale: scale,
            author: 'Hina\'s Guide',
            locations: locations,
            connections: connections
        };
    }

    function generateConnections(locations, structure) {
        const connections = [];
        const n = locations.length;

        if (n < 2) return connections;

        switch (structure) {
            case 'hub':
                for (let i = 1; i < n; i++) {
                    connections.push({ from: locations[0].key, to: locations[i].key });
                }
                break;
            case 'linear':
                for (let i = 0; i < n - 1; i++) {
                    connections.push({ from: locations[i].key, to: locations[i + 1].key });
                }
                break;
            case 'grid':
                const cols = Math.ceil(Math.sqrt(n));
                for (let i = 0; i < n; i++) {
                    const right = i + 1;
                    const down = i + cols;
                    if (right < n && (right % cols !== 0)) connections.push({ from: locations[i].key, to: locations[right].key });
                    if (down < n) connections.push({ from: locations[i].key, to: locations[down].key });
                }
                break;
            case 'branching':
                for (let i = 0; i < n; i++) {
                    const left = 2 * i + 1;
                    const right = 2 * i + 2;
                    if (left < n) connections.push({ from: locations[i].key, to: locations[left].key });
                    if (right < n) connections.push({ from: locations[i].key, to: locations[right].key });
                }
                break;
            default:
                for (let i = 0; i < n; i++) {
                    const numConnections = Math.floor(Math.random() * 2) + 1;
                    for (let c = 0; c < numConnections; c++) {
                        let target = Math.floor(Math.random() * n);
                        if (target !== i) connections.push({ from: locations[i].key, to: locations[target].key });
                    }
                }
                break;
        }
        return connections;
    }

    // ===========================================
    // WIZARD PREVIEW RENDERER
    // ===========================================
    function renderPreview(container, template) {
        if (!template) return;
        container.innerHTML = `
            <div class="card" style="border:1px solid var(--border-subtle); background:var(--bg-surface); overflow:hidden;">
                <div style="padding:16px; border-bottom:1px solid var(--border-subtle);">
                    <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${template.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${template.description}</div>
                </div>
                <div style="padding:12px 16px; background:var(--bg-inset); border-top:1px solid var(--border-subtle); font-size:11px; color:var(--text-muted);">
                    📍 ${template.locations.length} locations • 🔗 ${template.connections.length} connections
                </div>
            </div>
        `;
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

            const genreIcons = { fantasy: '⚔️', scifi: '🚀', modern: '🏙️', horror: '👻', any: '🌐' };
            const genreIcon = genreIcons[template.genre] || '🌐';
            const scaleIcons = { building: '🏠', district: '🏘️', region: '🏔️', kingdom: '👑', planet: '🌍' };
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
            card.onmouseenter = () => { card.style.borderColor = 'var(--accent-primary)'; card.style.background = 'var(--bg-elevated)'; };
            card.onmouseleave = () => { card.style.borderColor = 'var(--border-subtle)'; card.style.background = 'var(--bg-surface)'; };
            card.onclick = () => showTemplatePreview(template);
            container.appendChild(card);
        });
    }

    // ===========================================
    // AI ENRICHMENT LOGIC
    // ===========================================
    async function enrichTemplate(template) {
        if (!A.LLM) throw new Error('AI system not initialized');

        const llmConfig = A.UI.getActiveLLMConfig ? A.UI.getActiveLLMConfig() : null;
        if (!llmConfig || !llmConfig.apiKey) {
            throw new Error('Please configure an API Key in Settings first.');
        }

        const systemPrompt = `You are an expert Game Master and World Builder. 
Your task is to enrich a procedural map with atmospheric descriptions, hidden secrets, and a MAIN QUEST.
Genre: ${template.genre}
Scale: ${template.scale}
Tone: ${template.description}

You will receive a list of locations. Return a JSON object with the following structure:
{
  "quest": {
      "title": "Quest Title",
      "description": "Brief objective description.",
      "objectives": [
          { "type": "KILL", "target": "MonsterName", "total": 1 },
          { "type": "FETCH", "target": "ItemName", "total": 1 },
          { "type": "VISIT", "target": "LocationID" } 
      ],
      "rewards": [{ "type": "XP", "value": 100 }]
  },
  "locations": {
      "loc_id": {
        "description": "Atmospheric text.",
        "secret": "GM Only secret.",
        "loot": ["Item Name"],
        "encounters": ["Monster Name"]
      }
  }
}`;

        const locationList = template.locations.map(l => `${l.key} (${l.name}): ${l.type}`).join('\n');
        const userPrompt = `Enrich these locations:\n${locationList}`;

        const response = await A.LLM.generate(systemPrompt, [{ role: 'user', content: userPrompt }]);

        // Parse JSON
        let data;
        try {
            // Attempt to extract JSON if wrapped in markdown code blocks
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
            const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : response;
            data = JSON.parse(jsonStr);
        } catch (e) {
            console.error(e);
            throw new Error('Failed to parse AI response. Try again.');
        }

        // Apply enrichment
        // 1. Quest
        if (data.quest) {
            template.quest = data.quest;
            template.quest.id = 'quest_' + Math.random().toString(36).substr(2, 6); // Ensure unique ID
        }

        // 2. Locations
        const locData = data.locations || data; // Fallback if structure mismatch
        let updateCount = 0;

        template.locations.forEach(loc => {
            const info = locData[loc.key];
            if (info) {
                if (info.description) loc.description = info.description;
                if (info.secret) loc.secret = info.secret;

                // Store RPG data
                loc.rpg = {
                    loot: info.loot || [],
                    encounters: (info.encounters || []).map(name => ({ id: name, count: 1 })),
                    secrets: info.secret ? [info.secret] : []
                };
                updateCount++;
            }
        });

        return updateCount;
    }

    // ===========================================
    // TEMPLATE PREVIEW MODAL
    // ===========================================
    function showTemplatePreview(template) {
        const locationsList = template.locations.map(loc => {
            const expandIcon = loc.expandable ? ' 🔄' : '';
            const secretIcon = (loc.rpg && loc.rpg.secrets) ? ' 🤫' : '';
            return `<li style="margin:4px 0;"><strong>${loc.name}</strong>${expandIcon}${secretIcon}<br><span style="font-size:11px; color:var(--text-muted);">${loc.description || '(No description)'}</span></li>`;
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
                        <ul id="preview-loc-list" style="margin:0; padding-left:20px; font-size:12px;">${locationsList}</ul>
                    </div>
                    <div>
                        <h4 style="margin:0 0 8px; font-size:13px;">🔗 Connections (${template.connections.length})</h4>
                        <ul style="margin:0; padding-left:20px;">${connectionsList}</ul>
                    </div>
                </div>
                <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle); display:flex; gap:12px;">
                    <button id="btn-import-template" class="btn btn-primary" style="flex:1;">📥 Import to Project</button>
                    <button id="btn-enrich-template" class="btn btn-ghost" style="flex:1;">✨ AI Enrich</button>
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

                modalEl.querySelector('#btn-enrich-template').onclick = async (e) => {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = '✨ Dreaming...';

                    try {
                        await enrichTemplate(template);
                        // Refresh the view
                        A.UI.Modal.close();
                        showTemplatePreview(template);
                        if (A.UI?.Toast) A.UI.Toast.show('Map enriched with AI imagination!', 'success');
                    } catch (err) {
                        console.error(err);
                        btn.textContent = '❌ Error';
                        if (A.UI?.Toast) A.UI.Toast.show('Enrichment failed: ' + err.message, 'error');
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.textContent = '✨ AI Enrich';
                        }, 2000);
                    }
                };
            }
        });
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
    if (!A.HinasGuide) A.HinasGuide = {};

    // Debug helper
    A.HinasGuide.debugState = function () {
        const state = A.State.get();
        console.log('[Hina] Full weaves structure:', state.weaves);
        console.log('[Hina] Maps:', state.weaves?.maps);
        return state.weaves;
    };

    // Test import helper
    A.HinasGuide.testImport = function () {
        console.warn('[Hina] testImport (Robust) running...');
        const testTemplate = {
            id: 'test_' + Date.now(),
            name: 'Debug Test ' + Math.floor(Math.random() * 999),
            locations: [
                { key: 'A', name: 'TEST A', type: 'waypoint' },
                { key: 'B', name: 'TEST B', type: 'waypoint' }
            ],
            connections: [{ from: 'A', to: 'B' }]
        };
        try {
            importTemplateToProject(testTemplate);
        } catch (err) {
            console.error('[Hina] ERROR:', err);
        }
    };

    A.HinasGuide.exportLocationsAsTemplate = function (name = 'Exported Map', mapName = null) {
        const state = A.State.get();
        let locations = [];
        if (state.weaves?.maps && state.weaves.maps.length > 0) {
            const targetMap = mapName
                ? state.weaves.maps.find(m => m.name === mapName)
                : state.weaves.maps[0];
            if (targetMap) {
                locations = targetMap.locations || [];
                console.log(`[Hina] Exporting from map: "${targetMap.name}"`);
            }
        } else if (state.weaves?.locations) {
            locations = state.weaves.locations;
        }

        if (locations.length === 0) {
            console.warn('[Hina] No locations to export.');
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

        locations.forEach(loc => {
            if (loc.exits && Array.isArray(loc.exits)) {
                loc.exits.forEach(exitId => {
                    template.connections.push({ from: loc.id, to: exitId, hidden: false });
                });
            } else if (loc.connections && Array.isArray(loc.connections)) {
                loc.connections.forEach(conn => {
                    template.connections.push({ from: loc.id, to: conn.target, hidden: conn.hidden || false });
                });
            }
        });

        console.log('[Hina] Exported template:', template);
        console.log('[Hina] Copy this JSON:', JSON.stringify(template, null, 2));
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
