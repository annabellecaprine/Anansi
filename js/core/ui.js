/*
 * Anansi UI Core
 * File: js/core/ui.js
 * Purpose: Layout manager, Navigation, and Panel Rendering.
 */

(function (A) {
    'use strict';

    let activePanelId = 'project';
    // Define Category Order (Updated structure)
    const categoryOrder = ['Loom', 'Seeds', 'Weave', 'Magic', 'Deep', 'Forbidden Secrets'];

    const ICONS = {
        'project': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        'sources': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        'character': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        'actors': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        'voices': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
        'microcues': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        'tokens': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
        'lorebook': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        'scoring': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
        'scripts': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
        'simulator': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        'advanced': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        'events': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        'tester': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"></path><path d="M14 2v7.31"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path></svg>',
        'validator': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        'pairs': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><circle cx="12" cy="19" r="3"></circle><line x1="12" y1="8" x2="12" y2="16"></line></svg>'
    };

    const UI = {
        init: function () {
            // DOM Elements
            this.els = {
                navContainer: document.getElementById('nav-container'),
                panelTitle: document.getElementById('panel-title'),
                panelSubtitle: document.getElementById('panel-subtitle'),
                panelRoot: document.getElementById('panel-root'),

                // Buttons
                btnProjects: document.getElementById('btn-toggle-nav'),
                btnNew: document.getElementById('btn-new'),
                btnImport: document.getElementById('btn-import'),
                btnExport: document.getElementById('btn-export'),
                btnBuild: document.getElementById('btn-build'),
                btnTheme: document.getElementById('btn-theme'),
                btnSave: document.getElementById('btn-save'),

                // Displays
                displayName: document.getElementById('display-project-name'),
                displayEnv: document.getElementById('display-env-badge'),
                btnToggleLens: document.getElementById('btn-toggle-lens'),
                btnHelp: document.getElementById('btn-help'),
                lensRoot: document.getElementById('lens-root'),
                appShell: document.getElementById('app-shell')
            };

            // Bind Topbar Actions
            // Project Picker (hamburger menu)
            if (this.els.btnProjects) {
                this.els.btnProjects.onclick = () => {
                    if (A.ProjectPicker) A.ProjectPicker.show();
                };
            }

            this.els.btnNew.onclick = () => {
                if (confirm('Create new project? Unsaved changes will be lost.')) {
                    A.State.reset();
                }
            };

            this.els.btnExport.onclick = () => A.IO.exportToFile();
            this.els.btnBuild.onclick = () => A.Export.build();

            this.els.btnImport.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.anansi.json';
                input.onchange = (e) => {
                    if (e.target.files[0]) A.IO.importFromFile(e.target.files[0]);
                };
                input.click();
            };

            this.els.btnTheme.onclick = () => UI.toggleTheme();
            this.els.btnSave.onclick = () => {
                A.IO.save(A.State.get());
                if (A.UI.Toast) A.UI.Toast.show('Project saved!', 'success');
                if (A.UI.flashSuccess) A.UI.flashSuccess(this.els.btnSave);
            };
            this.els.btnToggleLens.onclick = () => this.toggleLens();

            // Tour Binding
            if (this.els.btnHelp) {
                this.els.btnHelp.onclick = () => {
                    if (A.UI.Tour) A.UI.Tour.start(activePanelId);
                };
            }

            // Lens state from localStorage
            if (localStorage.getItem('anansi_lens_collapsed') === 'true') {
                this.toggleLens(true);
            }

            // Subscribe to State Changes
            A.State.subscribe(state => {
                if (!state) return;
                this.els.displayName.textContent = state.meta.name + (state.isDirty ? ' •' : '');
                this.els.displayEnv.textContent = state.environment.id.toUpperCase();
                this.updateIntegrityBadge(state);
            });

            // Render Initial Nav
            this.refreshNav();

            // Load Initial Panel (restore from localStorage or default to 'project')
            const savedPanel = localStorage.getItem('anansi_active_panel') || 'project';
            this.switchPanel(savedPanel);

            // Initialize Keyboard Shortcuts
            if (A.Shortcuts && A.Shortcuts.init) {
                A.Shortcuts.init();
            }
        },

        refreshNav: function () {
            const container = this.els.navContainer;
            container.innerHTML = '';

            const sections = A.getNavSections();

            // Group by Category
            const groups = {};
            sections.forEach(s => {
                const cat = s.category || 'Deep';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(s);
            });

            // Render Categories in Order
            categoryOrder.forEach(cat => {
                const groupItems = groups[cat];
                if (!groupItems || groupItems.length === 0) return;

                // Render Header
                const header = document.createElement('div');
                header.className = 'nav-header';
                header.style.padding = '8px 12px 2px 12px';
                header.style.fontSize = '10px';
                header.style.fontWeight = 'bold';
                header.style.color = 'var(--text-muted)';
                header.style.textTransform = 'uppercase';
                header.style.letterSpacing = '1px';
                header.textContent = cat;
                container.appendChild(header);

                // Render Items
                const list = document.createElement('div');
                list.className = 'nav-group';
                list.style.display = 'flex';
                list.style.flexDirection = 'column';
                list.style.gap = '2px';

                groupItems.forEach(section => {
                    const btn = document.createElement('button');
                    btn.className = `nav-item ${section.id === activePanelId ? 'active' : ''}`;
                    btn.style.paddingLeft = '12px';
                    btn.style.display = 'flex';
                    btn.style.alignItems = 'center';
                    btn.style.gap = '8px';

                    const iconSvg = ICONS[section.id] || ICONS['advanced'];

                    btn.innerHTML = `
             <span class="nav-icon" style="opacity:${section.id === activePanelId ? 1 : 0.6}; transition:opacity 0.2s;">${iconSvg}</span>
             <span class="nav-item-label">${section.label}</span>
           `;
                    btn.onclick = () => UI.switchPanel(section.id);
                    list.appendChild(btn);
                });

                container.appendChild(list);
            });
        },

        switchPanel: function (id, context) {
            activePanelId = id;
            this.refreshNav(); // Update active state

            // Persist active panel to localStorage
            localStorage.setItem('anansi_active_panel', id);

            const section = A.getNavSections().find(s => s.id === id);
            if (!section) return;

            this.els.panelTitle.textContent = section.label;
            this.els.panelSubtitle.textContent = section.subtitle || '';

            // Clear global lens on panel switch by default unless specific panels handle it
            if (id !== 'simulator' && id !== 'scripts') {
                this.setLens(null);
            }

            // CRITICAL: Clear inline styles from previous panel to prevent layout bleed
            this.els.panelRoot.removeAttribute('style');
            this.els.panelRoot.innerHTML = '';
            if (section.render) {
                section.render(this.els.panelRoot, context);
            } else {
                this.els.panelRoot.innerHTML = `<div class="empty-state">Unable to load panel.</div>`;
            }
        },

        setLens: function (renderFn) {
            this.els.lensRoot.innerHTML = '';
            if (!renderFn) {
                this.els.lensRoot.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-style:italic; font-size:12px;">No active lens for this panel.</div>`;
                return;
            }
            renderFn(this.els.lensRoot);
        },

        toggleLens: function (force) {
            const shell = this.els.appShell;
            const isCollapsed = force !== undefined ? force : !shell.classList.contains('lens-collapsed');

            if (isCollapsed) {
                shell.classList.add('lens-collapsed');
            } else {
                shell.classList.remove('lens-collapsed');
            }
            localStorage.setItem('anansi_lens_collapsed', isCollapsed);
        }
    };

    // Extend UI with toggleTheme if missing (was in original file, ensuring it's kept)
    UI.toggleTheme = function () {
        const body = document.body;
        const current = body.getAttribute('data-theme');
        body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
    };

    UI.updateIntegrityBadge = function (state) {
        if (!A.Validator) return;
        const issues = A.Validator.run(state);
        const hasErrors = issues.some(i => i.severity === 'error');
        const hasWarnings = issues.some(i => i.severity === 'warning');

        const btn = this.els.btnToggleLens;
        if (hasErrors) {
            btn.style.color = 'var(--status-error)';
            btn.title = `Project Integrity: ${issues.filter(i => i.severity === 'error').length} Errors`;
        } else if (hasWarnings) {
            btn.style.color = 'var(--status-warning)';
            btn.title = `Project Integrity: ${issues.filter(i => i.severity === 'warning').length} Warnings`;
        } else {
            btn.style.color = '';
            btn.title = 'Project Integrity: OK';
        }
    };

    A.UI = UI;

    // --- Modal Utility ---
    A.UI.Modal = {
        show: function (config) {
            // config: { title, content, actions: [{label, class, onclick}], onClose }
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

            const modal = document.createElement('div');
            modal.className = 'card modal-content';
            modal.style = `width:${config.width || 480}px; max-width:90%; position:relative; box-shadow:var(--shadow-soft);`;

            // Handle content as string or DOM element
            const contentIsElement = config.content instanceof HTMLElement;
            modal.innerHTML = `
                <div class="card-header">
                    <strong>${config.title || 'Dialog'}</strong>
                    <button class="btn btn-ghost btn-sm" id="modal-close-x">&times;</button>
                </div>
                <div class="card-body modal-body" style="max-height:70vh; overflow-y:auto;">
                    ${contentIsElement ? '' : (config.content || '')}
                </div>
                <div class="card-footer" style="padding:12px; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:8px;">
                    <!-- Actions -->
                </div>
            `;

            // If content is a DOM element, append it
            if (contentIsElement) {
                modal.querySelector('.modal-body').appendChild(config.content);
            }

            const footer = modal.querySelector('.card-footer');
            if (config.actions) {
                config.actions.forEach(act => {
                    const btn = document.createElement('button');
                    btn.className = `btn ${act.class || 'btn-secondary'} btn-sm`;
                    btn.textContent = act.label;
                    btn.onclick = () => {
                        if (act.onclick(modal) !== false) this.hide(overlay);
                    };
                    footer.appendChild(btn);
                });
            } else {
                footer.style.display = 'none';
            }

            const close = () => {
                this.hide(overlay);
                if (config.onClose) config.onClose();
            };

            modal.querySelector('#modal-close-x').onclick = close;
            overlay.onclick = (e) => { if (e.target === overlay) close(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            return overlay;
        },

        hide: function (overlay) {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }
    };

    // --- Toast Utility ---
    A.UI.Toast = {
        show: function (message, type = 'info', duration = 3500) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;

            const icons = {
                success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
                error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
            };

            toast.innerHTML = `
                ${icons[type] || icons.info}
                <span class="toast-message">${message}</span>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    };

    // --- Button Success Flash Helper ---
    A.UI.flashSuccess = function (buttonEl) {
        if (!buttonEl) return;
        buttonEl.classList.add('btn-success-flash');
        setTimeout(() => buttonEl.classList.remove('btn-success-flash'), 600);
    };

    // --- Global Overview Lens ---
    A.UI.renderGlobalOverviewLens = function (container) {
        const state = A.State.get();
        if (!state) {
            container.innerHTML = '<div style="padding:16px; color:var(--text-muted);">No project loaded.</div>';
            return;
        }

        const lorebookCount = Object.keys(state.weaves?.lorebook?.entries || {}).length;
        const actorCount = Object.keys(state.nodes?.actors?.items || {}).length;
        const eventCount = Object.keys(state.aura?.events?.items || {}).length;
        const microcueCount = Object.keys(state.aura?.microcues?.items || {}).length;

        let integrityHtml = '<span style="color:var(--status-success);">✓ OK</span>';
        if (A.Validator) {
            const issues = A.Validator.run(state);
            const errors = issues.filter(i => i.severity === 'error').length;
            const warnings = issues.filter(i => i.severity === 'warning').length;
            if (errors > 0) {
                integrityHtml = `<span style="color:var(--status-error);">✗ ${errors} Error${errors > 1 ? 's' : ''}</span>`;
            } else if (warnings > 0) {
                integrityHtml = `<span style="color:var(--status-warning);">⚠ ${warnings} Warning${warnings > 1 ? 's' : ''}</span>`;
            }
        }

        container.innerHTML = `
            <div style="padding:8px 0;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:12px;">Project Overview</div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;">
                    <div class="card" style="margin:0; padding:12px; text-align:center;">
                        <div style="font-size:20px; font-weight:600; color:var(--accent-primary);">${lorebookCount}</div>
                        <div style="font-size:11px; color:var(--text-muted);">Lore Entries</div>
                    </div>
                    <div class="card" style="margin:0; padding:12px; text-align:center;">
                        <div style="font-size:20px; font-weight:600; color:var(--accent-primary);">${actorCount}</div>
                        <div style="font-size:11px; color:var(--text-muted);">Actors</div>
                    </div>
                    <div class="card" style="margin:0; padding:12px; text-align:center;">
                        <div style="font-size:20px; font-weight:600; color:var(--accent-primary);">${eventCount}</div>
                        <div style="font-size:11px; color:var(--text-muted);">Events</div>
                    </div>
                    <div class="card" style="margin:0; padding:12px; text-align:center;">
                        <div style="font-size:20px; font-weight:600; color:var(--accent-primary);">${microcueCount}</div>
                        <div style="font-size:11px; color:var(--text-muted);">Microcues</div>
                    </div>
                </div>

                <div style="border-top:1px solid var(--border-subtle); padding-top:12px;">
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">Integrity</div>
                    <div style="font-size:13px;">${integrityHtml}</div>
                </div>
            </div>
        `;
    };

    // --- Category Hints for Navigation ---
    const categoryHints = {
        'Loom': 'Project settings',
        'Seed': 'Core character data',
        'Weave': 'World knowledge',
        'Magic': 'Dynamic behaviors',
        'Test': 'Simulation & testing',
        'Advanced': 'Power tools',
        'Deep': 'System internals'
    };

    // Override refreshNav to add hints
    const originalRefreshNav = UI.refreshNav;
    UI.refreshNav = function () {
        originalRefreshNav.call(this);

        // Add data-hint attributes to nav headers
        const headers = this.els.navContainer.querySelectorAll('.nav-header');
        headers.forEach(header => {
            const catName = header.textContent.trim();
            if (categoryHints[catName]) {
                header.setAttribute('data-hint', categoryHints[catName]);
            }
        });
    };

    // Override setLens to use Global Overview as default
    const originalSetLens = UI.setLens;
    UI.setLens = function (renderFn) {
        this.els.lensRoot.innerHTML = '';
        if (!renderFn) {
            // Show Global Overview instead of empty message
            A.UI.renderGlobalOverviewLens(this.els.lensRoot);
            return;
        }
        renderFn(this.els.lensRoot);
    };

    // --- UI Components Namespace ---
    A.UI.Components = {};

    /**
     * Smart Tag Input Component
     * Renders a list of tags as pills + an input field with autocomplete.
     */
    A.UI.Components.TagInput = class TagInput {
        constructor(container, tags, options = {}) {
            this.container = container;
            this.tags = tags || [];
            this.options = options; // { label, onChange, suggestions[], placeholder, color }
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Label
            if (this.options.label) {
                const label = document.createElement('label');
                label.className = 'form-label'; // standardized class if available, else inline style mimic
                label.style.display = 'block';
                label.style.fontSize = '10px';
                label.style.fontWeight = 'bold';
                label.style.color = 'var(--text-muted)';
                label.style.marginBottom = '4px';
                label.style.textTransform = 'uppercase';
                label.textContent = this.options.label;
                this.container.appendChild(label);
            }

            // Wrapper
            const wrap = document.createElement('div');
            Object.assign(wrap.style, {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '4px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                minHeight: '32px',
                background: 'var(--bg-elevated)',
                width: '100%',
                boxSizing: 'border-box'
            });

            // Pills
            this.tags.forEach((tag, idx) => {
                const pill = document.createElement('span');
                const color = this.options.color || 'var(--accent-primary)';
                const bg = this.options.bg || 'var(--accent-soft)';

                Object.assign(pill.style, {
                    background: bg,
                    color: color,
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    userSelect: 'none'
                });

                pill.innerHTML = `<span>${tag}</span>`;

                const closeBtn = document.createElement('span');
                closeBtn.innerHTML = '&times;';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.opacity = '0.6';
                closeBtn.style.fontWeight = 'bold';
                closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
                closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.removeTag(idx);
                };

                pill.appendChild(closeBtn);
                wrap.appendChild(pill);
            });

            // Input
            const input = document.createElement('input');
            Object.assign(input.style, {
                border: 'none',
                background: 'transparent',
                fontSize: '11px',
                color: 'var(--text-main)',
                minWidth: '60px',
                flex: '1',
                outline: 'none',
                padding: '4px'
            });
            input.placeholder = this.options.placeholder || '+ Add...';

            // Datalist for suggestions
            if (this.options.suggestions && this.options.suggestions.length) {
                const listId = 'dl-' + Math.random().toString(36).substr(2, 6);
                input.setAttribute('list', listId);
                const dl = document.createElement('datalist');
                dl.id = listId;
                this.options.suggestions.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    dl.appendChild(opt);
                });
                wrap.appendChild(dl);
            }

            // Events
            const commit = () => {
                const val = input.value.trim();
                if (val) {
                    if (!this.tags.includes(val)) {
                        this.addTag(val);
                    }
                    input.value = '';
                }
            };

            input.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    commit();
                }
                if (e.key === 'Backspace' && input.value === '' && this.tags.length > 0) {
                    this.removeTag(this.tags.length - 1);
                }
            };

            input.onblur = commit;

            wrap.appendChild(input);
            wrap.onclick = () => input.focus();

            this.container.appendChild(wrap);
        }

        addTag(tag) {
            this.tags.push(tag);
            if (this.options.onChange) this.options.onChange(this.tags);
            this.render();
        }

        removeTag(index) {
            this.tags.splice(index, 1);
            if (this.options.onChange) this.options.onChange(this.tags);
            this.render();
        }
    };

})(window.Anansi);

