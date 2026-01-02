/*
 * Anansi Keyboard Shortcuts
 * File: js/core/shortcuts.js
 * Purpose: Global keyboard shortcut system
 */

(function (A) {
    'use strict';

    const Shortcuts = {
        registry: {},
        enabled: true,

        /**
         * Register a keyboard shortcut
         * @param {string} combo - Key combination (e.g., 'ctrl+s', 'ctrl+shift+1', '?')
         * @param {object} config - { action: Function, label: string, category?: string }
         */
        register(combo, config) {
            this.registry[combo.toLowerCase()] = config;
        },

        /**
         * Initialize keyboard listener
         */
        init() {
            // Define default shortcuts
            this.registerDefaults();

            document.addEventListener('keydown', (e) => {
                if (!this.enabled) return;

                // Skip if typing in input/textarea (unless it's a global shortcut)
                const tag = e.target.tagName.toLowerCase();
                const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

                // Build combo string
                const combo = this.buildCombo(e);
                const handler = this.registry[combo];

                if (!handler) return;

                // Some shortcuts only work outside inputs
                if (isInput && !handler.global) return;

                e.preventDefault();
                e.stopPropagation();
                handler.action();
            });

            console.log('[Shortcuts] Initialized with', Object.keys(this.registry).length, 'bindings');
        },

        /**
         * Build combo string from keyboard event
         */
        buildCombo(e) {
            const parts = [];
            if (e.ctrlKey || e.metaKey) parts.push('ctrl');
            if (e.altKey) parts.push('alt');
            if (e.shiftKey) parts.push('shift');

            // Normalize key
            let key = e.key.toLowerCase();
            if (key === ' ') key = 'space';
            if (key === 'escape') key = 'esc';

            // Avoid duplicating modifier keys
            if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
                parts.push(key);
            }

            return parts.join('+');
        },

        /**
         * Register default shortcuts
         */
        registerDefaults() {
            // Global shortcuts (work even in inputs)
            this.register('ctrl+s', {
                action: () => {
                    if (A.IO && A.IO.saveNow) {
                        A.IO.saveNow().then(() => {
                            if (A.UI.Toast) A.UI.Toast.show('Project saved', 'success');
                        });
                    } else if (A.UI.Toast) {
                        A.UI.Toast.show('Project saved to memory', 'success');
                    }
                },
                label: 'Save Project',
                category: 'Project',
                global: true
            });

            this.register('ctrl+shift+n', {
                action: () => {
                    if (confirm('Create new project? Unsaved changes will be lost.')) {
                        A.State.reset();
                        if (A.UI.Toast) A.UI.Toast.show('New project created', 'info');
                    }
                },
                label: 'New Project',
                category: 'Project',
                global: true
            });

            // Panel navigation (Ctrl+1-9)
            const panels = ['project', 'character', 'actors', 'lorebook', 'voices', 'events', 'scripts', 'simulator', 'sources'];
            panels.forEach((panelId, idx) => {
                if (idx < 9) {
                    this.register(`ctrl+${idx + 1}`, {
                        action: () => A.UI.switchPanel(panelId),
                        label: `Go to ${panelId.charAt(0).toUpperCase() + panelId.slice(1)}`,
                        category: 'Navigation'
                    });
                }
            });

            // Simulator shortcuts
            this.register('ctrl+enter', {
                action: () => {
                    // Find and click the Run button
                    const runBtn = document.querySelector('#btn-run-sim') || document.querySelector('#sim-send');
                    if (runBtn) runBtn.click();
                },
                label: 'Run Simulation',
                category: 'Simulator',
                global: true
            });

            // Toggle Lens
            this.register('ctrl+l', {
                action: () => A.UI.toggleLens(),
                label: 'Toggle Lens',
                category: 'View'
            });

            // Toggle Theme
            this.register('ctrl+shift+t', {
                action: () => A.UI.toggleTheme(),
                label: 'Toggle Theme',
                category: 'View'
            });

            // Help
            this.register('?', {
                action: () => this.showHelp(),
                label: 'Show Shortcuts',
                category: 'Help',
                global: true
            });

            this.register('f1', {
                action: () => this.showHelp(),
                label: 'Show Shortcuts',
                category: 'Help'
            });

            // Escape to close modals
            this.register('esc', {
                action: () => {
                    const overlay = document.querySelector('.modal-overlay');
                    if (overlay) overlay.click();
                },
                label: 'Close Modal',
                category: 'UI',
                global: true
            });
        },

        /**
         * Show help modal with all shortcuts
         */
        showHelp() {
            const categories = {};

            Object.entries(this.registry).forEach(([combo, config]) => {
                const cat = config.category || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ combo, ...config });
            });

            const content = Object.entries(categories).map(([cat, shortcuts]) => `
        <div style="margin-bottom:16px;">
          <div style="font-weight:bold; font-size:12px; color:var(--accent-primary); margin-bottom:8px; text-transform:uppercase;">${cat}</div>
          ${shortcuts.map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid var(--border-subtle);">
              <span style="font-size:12px;">${s.label}</span>
              <kbd style="background:var(--bg-surface); padding:2px 8px; border-radius:4px; font-family:var(--font-mono); font-size:11px; border:1px solid var(--border-default);">${s.combo.toUpperCase()}</kbd>
            </div>
          `).join('')}
        </div>
      `).join('');

            A.UI.Modal.show({
                title: 'Keyboard Shortcuts',
                content: `<div style="max-height:60vh; overflow-y:auto;">${content}</div>`,
                actions: [
                    { label: 'Close', primary: true, onClick: (close) => close() }
                ]
            });
        },

        /**
         * Temporarily disable shortcuts (e.g., when Monaco is focused)
         */
        disable() {
            this.enabled = false;
        },

        enable() {
            this.enabled = true;
        }
    };

    A.Shortcuts = Shortcuts;

})(window.Anansi);
