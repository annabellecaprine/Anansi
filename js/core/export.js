/*
 * Anansi Core: Export
 * File: js/core/export.js
 * Purpose: Compile Project to Target Payload.
 */

(function (A) {
    'use strict';

    const Export = {
        // Generate the internal representation for the renderer
        _makeIR: function (state) {
            if (!state) return null;

            // Filter enabled scripts and sort by order
            const scripts = Object.values(state.strands.scripts)
                .filter(s => s.enabled)
                .sort((a, b) => a.order - b.order)
                .map(s => ({
                    name: s.name,
                    code: s.source.code,
                    // meta: { ... } (Future: Triggers, etc)
                }));

            return {
                meta: {
                    name: state.meta.name,
                    version: '1.0.0', // Generated
                    author: state.meta.author || 'Anansi User',
                    description: state.meta.description || '',
                    generatedAt: new Date().toISOString()
                },
                env: state.environment.id,
                weaves: state.weaves, // Includes lorebook, voices, events, etc.
                scripts: scripts
            };
        },

        // Main entry point: Build and Download
        build: function () {
            const state = A.State.get();
            if (!state) return;

            // NEW: Use AuraBuilder for merged export
            if (A.AuraBuilder) {
                try {
                    // Token/char warning check
                    const previewOutput = A.AuraBuilder.preview(state);
                    const totalChars = previewOutput.length;
                    const ratio = state.sim?.tokenRatio || 4;
                    const estTokens = Math.ceil(totalChars / ratio);

                    if (estTokens > 32000) {
                        const confirmed = confirm(`⚠️ Warning: Project is large (~${estTokens.toLocaleString()} tokens). This might exceed some LLM context windows or cause slow responses. Proceed with export?`);
                        if (!confirmed) return;
                    }

                    // Build and download
                    A.AuraBuilder.download(state);
                    if (A.UI?.Toast) A.UI.Toast.show('Script exported successfully!', 'success');
                    return;
                } catch (e) {
                    console.error('[Export] AuraBuilder failed:', e);
                    // Fall through to legacy export
                }
            }

            // LEGACY FALLBACK: Adapter-based export
            const envId = state.environment.id;
            const adapter = A.Adapters[envId];

            if (!adapter) {
                alert(`No adapter found for environment: ${envId}`);
                return;
            }

            if (!adapter.render) {
                alert(`Adapter ${adapter.meta?.name || envId} does not support Build/Export yet.`);
                return;
            }

            // 1. Create IR
            const ir = Export._makeIR(state);

            // 1.5 - Phase 4.3: Token/Char Warnings
            const totalChars = JSON.stringify(ir).length;
            const ratio = state.sim?.tokenRatio || 4;
            const estTokens = Math.ceil(totalChars / ratio);

            if (estTokens > 32000) {
                const confirmed = confirm(`⚠️ Warning: Project is large (~${estTokens.toLocaleString()} tokens). This might exceed some LLM context windows or cause slow responses. Proceed with export?`);
                if (!confirmed) return;
            }

            // 2. Render locally via Adapter
            try {
                const output = adapter.render(ir);

                // 3. Download
                const blob = new Blob([output], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');

                // Sanitize filename
                const safeName = state.meta.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const ext = adapter.meta?.extension || 'js';

                a.href = url;
                a.download = `${safeName}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);

                console.log(`[Export] Built ${safeName}.${ext}`);
            } catch (e) {
                console.error('[Export] Build failed:', e);
                alert('Build failed: ' + e.message);
            }
        }
    };

    A.Export = Export;

})(window.Anansi);
