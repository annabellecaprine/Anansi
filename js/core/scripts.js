/*
 * Anansi Core: Scripts
 * File: js/core/scripts.js
 * Purpose: Manage script assets (CRUD + Ordering).
 */

(function (A) {
    'use strict';

    const systemScripts = [
        { id: 'sys_eros', name: 'SYSTEM: EROS', path: 'js/aura/EROS.js', order: -4, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_intent', name: 'SYSTEM: INTENT', path: 'js/aura/INTENT.js', order: -3, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_pulse', name: 'SYSTEM: PULSE', path: 'js/aura/PULSE.js', order: -2, system: true, enabled: true, source: { code: '// Loading...' } },
        { id: 'sys_aura', name: 'SYSTEM: AURA', path: 'js/aura/AURA.js', order: -1, system: true, enabled: true, source: { code: '// Loading...' } }
    ];

    const Scripts = {
        // Generate a simple ID
        _genId: function () {
            return 'script_' + Math.random().toString(36).substr(2, 9);
        },

        // Load system scripts from pre-loaded data (inlined)
        loadSystem: function () {
            if (!A.SystemData) {
                console.error("Anansi: System Data not found. Run build_system_data.py.");
                // Fallback for development if not built
                // return; 
            }

            for (const script of systemScripts) {
                if (A.SystemData && A.SystemData[script.id]) {
                    script.source.code = A.SystemData[script.id];
                } else if (!script.source.code || script.source.code === '// Loading...') {
                    // Check if we can find it in global scope (legacy fallback)
                    // or just leave as is
                }
            }
            A.State.notify();
        },

        // Create a new script
        create: function (name) {
            const state = A.State.get();
            if (!state) return;

            // Ensure scripts container exists
            if (!state.strands.scripts.items) state.strands.scripts.items = {};

            const id = Scripts._genId();
            const count = Object.keys(state.strands.scripts.items).length;

            const newScript = {
                id: id,
                name: name || 'New Script',
                enabled: true,
                order: count, // Append to end
                source: {
                    type: 'inline',
                    code: '// ' + (name || 'New Script') + '\n\n'
                },
                declared: { reads: [], writes: [] }
            };

            state.strands.scripts.items[id] = newScript;
            A.State.notify(); // Trigger update
            return id;
        },

        // Update script code or meta
        update: function (id, updates) {
            // Prevent updating system scripts
            if (systemScripts.find(s => s.id === id)) return;

            const state = A.State.get();
            if (!state || !state.strands.scripts.items[id]) return;

            Object.assign(state.strands.scripts.items[id], updates);
            A.State.notify();
        },

        // Delete a script
        delete: function (id) {
            // Prevent deleting system scripts
            if (systemScripts.find(s => s.id === id)) return;

            const state = A.State.get();
            if (!state || !state.strands.scripts.items[id]) return;

            delete state.strands.scripts.items[id];
            A.State.notify();
        },

        // Move script up or down in order
        move: function (id, direction) {
            const state = A.State.get();
            if (!state) return;

            // Unified List Strategy
            // 1. Get ALL scripts (System + User)
            const allScripts = Scripts.getAll();

            // 2. Normalize Order (0 to N) to ensure continuity
            allScripts.forEach((s, i) => s.order = i);

            // 3. Find Target
            const currentIndex = allScripts.findIndex(s => s.id === id);
            if (currentIndex === -1) return;

            // 4. Determine Swap Target
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            // 5. Bounds Check
            if (newIndex < 0 || newIndex >= allScripts.length) return;

            // 6. Swap 'order' values
            const scriptA = allScripts[currentIndex];
            const scriptB = allScripts[newIndex];

            const tempOrder = scriptA.order;
            scriptA.order = scriptB.order;
            scriptB.order = tempOrder;

            // 7. Persist
            // System scripts live in 'systemScripts' array (memory). 
            // User scripts live in 'state' (storage).
            // Since we modified the objects references directly, we just need to notify.
            A.State.notify();
        },

        // Get all scripts sorted by order (Unified)
        getAll: function () {
            const state = A.State.get();
            // Start with System Scripts
            let combined = [...systemScripts];

            // Add User Scripts
            if (state && state.strands && state.strands.scripts && state.strands.scripts.items) {
                combined = combined.concat(Object.values(state.strands.scripts.items));
            }

            // Sort by Order
            // System scripts start with negative order, User with positive.
            // But after a move, they might be mixed.
            combined.sort((a, b) => (a.order || 0) - (b.order || 0));

            // DYNAMIC PREVIEW: If AURA is requested, build it fresh
            // This ensures the Scripts panel sees the "Live" version with characters/lore
            const auraScript = combined.find(s => s.id === 'sys_aura');
            if (auraScript && A.AuraBuilder) {
                // Determine if we need to rebuild (simple check: always rebuild for real-time)
                try {
                    // Only rebuild if we have state (avoid crash during init)
                    if (state) {
                        const preview = A.AuraBuilder.preview(state);
                        // We modify the object in the array, but systemScripts[3] remains the template in memory
                        // effectively "overlaying" the preview on this result set.
                        auraScript.source.code = preview;
                    }
                } catch (e) {
                    console.warn('[Scripts] Aura Preview Gen Failed:', e);
                }
            }

            return combined;
        },

        // DEPRECATED: Sync a managed script from a panel
        // No longer used - all content now merges into AURA.js via AuraBuilder
        syncManaged: function (id, name, code) {
            console.warn(`[Scripts.syncManaged] DEPRECATED: "${name}" - Content now exports via AuraBuilder merge.`);
            // No-op: managed scripts are no longer created separately
        }
    };

    // Auto-load system scripts
    setTimeout(() => Scripts.loadSystem(), 100);

    A.Scripts = Scripts;

})(window.Anansi);
