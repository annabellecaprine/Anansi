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
        'pairs': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><circle cx="12" cy="19" r="3"></circle><line x1="12" y1="8" x2="12" y2="16"></line></svg>',
        'parlor': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>'
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
            // Dual-purpose hamburger: Desktop = ProjectPicker, Mobile = Nav Drawer
            if (this.els.btnProjects) {
                this.els.btnProjects.onclick = () => {
                    if (window.innerWidth < 768) {
                        // Mobile: Toggle navigation drawer
                        this.els.appShell.classList.toggle('nav-open');
                    } else {
                        // Desktop: Show project picker
                        if (A.ProjectPicker) A.ProjectPicker.show();
                    }
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

            // Mobile: Project name opens ProjectPicker
            const projectHeader = document.getElementById('project-header');
            if (projectHeader) {
                projectHeader.onclick = () => {
                    if (window.innerWidth < 768 && A.ProjectPicker) {
                        A.ProjectPicker.show();
                    }
                };
            }

            // Mobile: Click overlay to close nav drawer
            this.els.appShell.addEventListener('click', (e) => {
                if (window.innerWidth < 768 && this.els.appShell.classList.contains('nav-open')) {
                    // Check if click is on the overlay (the ::before pseudo-element area)
                    const nav = document.querySelector('.web-navigator');
                    if (nav && !nav.contains(e.target) && !this.els.btnProjects.contains(e.target)) {
                        this.els.appShell.classList.remove('nav-open');
                    }
                }
            });

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

            // Load sidebar state
            const collapsedState = JSON.parse(localStorage.getItem('anansi_sidebar_collapsed') || '{}');

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

                const isCollapsed = collapsedState[cat];

                // Render Header
                const header = document.createElement('div');
                header.className = 'nav-header';
                header.style.padding = '8px 12px 2px 12px';
                header.style.fontSize = '10px';
                header.style.fontWeight = 'bold';
                header.style.color = 'var(--text-muted)';
                header.style.textTransform = 'uppercase';
                header.style.letterSpacing = '1px';
                header.style.cursor = 'pointer';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.userSelect = 'none';

                header.innerHTML = `
                    <span>${cat}</span>
                    <span class="nav-chevron" style="transition: transform 0.2s; transform: ${isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'}; font-size: 8px;">▼</span>
                `;

                container.appendChild(header);

                // Render Items Container
                const list = document.createElement('div');
                list.className = 'nav-group';
                list.style.display = isCollapsed ? 'none' : 'flex';
                list.style.flexDirection = 'column';
                list.style.gap = '2px';

                // Toggle Handler
                header.onclick = () => {
                    const wasCollapsed = list.style.display === 'none';
                    const newState = wasCollapsed ? 'flex' : 'none';
                    list.style.display = newState;

                    const chevron = header.querySelector('.nav-chevron');
                    if (chevron) chevron.style.transform = newState === 'none' ? 'rotate(-90deg)' : 'rotate(0deg)';

                    // Save
                    const currentStored = JSON.parse(localStorage.getItem('anansi_sidebar_collapsed') || '{}');
                    currentStored[cat] = (newState === 'none');
                    localStorage.setItem('anansi_sidebar_collapsed', JSON.stringify(currentStored));
                };

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

        refresh: function () {
            this.refreshNav();
            this.switchPanel(activePanelId);
            // Trigger state update to refresh header
            const state = A.State.get();
            if (state) {
                this.els.displayName.textContent = state.meta.name + (state.isDirty ? ' •' : '');
                this.updateIntegrityBadge(state);
            }
        },

        switchPanel: function (id, context) {
            try {
                activePanelId = id;
                this.refreshNav(); // Update active state

                // Mobile: Auto-close nav drawer on panel switch
                if (window.innerWidth < 768 && this.els.appShell) {
                    this.els.appShell.classList.remove('nav-open');
                }

                // Persist active panel to localStorage
                localStorage.setItem('anansi_active_panel', id);

                const section = A.getNavSections().find(s => s.id === id);
                if (!section) {
                    console.error(`[UI] Panel not found: ${id}`);
                    return;
                }

                if (this.els.panelTitle) this.els.panelTitle.textContent = section.label;
                if (this.els.panelSubtitle) this.els.panelSubtitle.textContent = section.subtitle || '';

                // Clear global lens on panel switch by default unless specific panels handle it
                // Wrapped in try-catch to prevent lens errors from blocking panel load
                try {
                    if (id !== 'simulator' && id !== 'scripts') {
                        this.setLens(null);
                    }
                } catch (e) {
                    console.warn(`[UI] Lens reset failed: ${e.message}`);
                }

                // CRITICAL: Clear inline styles from previous panel to prevent layout bleed
                if (this.els.panelRoot) {
                    this.els.panelRoot.removeAttribute('style');
                    this.els.panelRoot.innerHTML = '';
                    if (section.render) {
                        try {
                            section.render(this.els.panelRoot, context);
                        } catch (renderErr) {
                            console.error(`[UI] Failed to render panel ${id}:`, renderErr);
                            this.els.panelRoot.innerHTML = `<div class="empty-state error-state">
                                <div style="color:var(--status-error); margin-bottom:8px;">Panel Crash</div>
                                <div style="font-size:11px; font-family:monospace;">${renderErr.message}</div>
                            </div>`;
                        }
                    } else {
                        this.els.panelRoot.innerHTML = `<div class="empty-state">Unable to load panel.</div>`;
                    }
                }
            } catch (err) {
                console.error(`[UI] switchPanel critical failure:`, err);
                if (A.UI.Toast) A.UI.Toast.show(`Nav Error: ${err.message}`, 'error');
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

            // Mobile: Use slide-out drawer with lens-open class
            if (window.innerWidth < 768) {
                shell.classList.toggle('lens-open');
                return;
            }

            // Desktop: Use collapse behavior
            const isCollapsed = force !== undefined ? force : !shell.classList.contains('lens-collapsed');

            if (isCollapsed) {
                shell.classList.add('lens-collapsed');
            } else {
                shell.classList.remove('lens-collapsed');
            }
            localStorage.setItem('anansi_lens_collapsed', isCollapsed);
        }
    };

    // Mobile: Click overlay to close lens drawer
    document.addEventListener('click', (e) => {
        const shell = document.getElementById('app-shell');
        if (window.innerWidth < 768 && shell && shell.classList.contains('lens-open')) {
            const lens = document.querySelector('.web-lens');
            const lensBtn = document.getElementById('btn-toggle-lens');
            if (lens && !lens.contains(e.target) && lensBtn && !lensBtn.contains(e.target)) {
                shell.classList.remove('lens-open');
            }
        }
    });

    // Extend UI with toggleTheme if missing (was in original file, ensuring it's kept)
    UI.toggleTheme = function () {
        const body = document.body;
        const current = body.getAttribute('data-theme');
        body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
    };

    UI.updateIntegrityBadge = function (state) {
        if (!state || !A.Validator) return;
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
                    btn.onclick = async () => {
                        const result = await act.onclick(modal);
                        if (result !== false) this.hide(overlay);
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

    // --- Empty State Utility ---
    A.UI.getEmptyStateHTML = function (title, message, actionLabel, actionOnClickStr) {
        // actionOnClickStr should be a string for inline onclick, e.g., "Anansi.UI.switchPanel(\'actors\')"
        const buttonHtml = actionLabel ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="${actionOnClickStr}">${actionLabel} →</button>` : '';

        return `
            <div class="empty-state-card" style="margin:auto; max-width:400px; text-align:center; padding:40px 20px;">
                <div style="opacity:0.2; margin-bottom:16px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <circle cx="12" cy="16" r="1"></circle>
                    </svg>
                </div>
                <div style="font-size:16px; font-weight:600; color:var(--text-main); margin-bottom:8px;">${title}</div>
                <div style="font-size:13px; color:var(--text-muted); line-height:1.5;">${message}</div>
                ${buttonHtml}
            </div>
        `;
    };

    /**
     * Renders an empty state into a container if the items array is empty.
     * Returns true if empty state was rendered.
     */
    A.UI.renderEmptyState = function (container, items, title, message, action) {
        if (!items || Object.keys(items).length === 0) {
            container.innerHTML = A.UI.getEmptyStateHTML(title, message, action?.label, action?.onclick);
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.justifyContent = 'center';
            container.style.height = '100%';
            return true;
        }
        return false;
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

    // --- API Key Manager (Global) ---
    // --- Provider Presets ---
    const PROVIDER_PRESETS = {
        openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', needsKey: true },
        anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-haiku-20240307', needsKey: true },
        gemini: { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash', needsKey: true },
        kobold: { name: 'Kobold (Local)', baseUrl: 'http://localhost:5001/api/v1', defaultModel: 'local', needsKey: false },
        chutes: { name: 'Chutes AI', baseUrl: 'https://llm.chutes.ai/v1', defaultModel: 'deepseek-ai/DeepSeek-V3', needsKey: true },
        custom: { name: 'Custom', baseUrl: '', defaultModel: '', needsKey: true }
    };

    A.UI.showApiKeyManager = function () {
        // Load saved configs from localStorage
        let configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');
        let activeId = localStorage.getItem('anansi_active_config_id') || '';

        // Migration: If old keys exist, migrate them
        const oldKeys = JSON.parse(localStorage.getItem('anansi_api_keys') || 'null');
        if (oldKeys && configs.length === 0) {
            Object.keys(oldKeys).forEach((name, idx) => {
                configs.push({
                    id: 'migrated_' + idx,
                    name: name,
                    provider: 'custom',
                    model: '',
                    baseUrl: '',
                    apiKey: oldKeys[name]
                });
            });
            localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));
            localStorage.removeItem('anansi_api_keys');
        }

        // Ensure at least one config exists
        if (configs.length === 0) {
            configs.push({ id: 'default', name: 'Default (Gemini)', provider: 'gemini', model: 'gemini-2.0-flash', baseUrl: '', apiKey: '' });
            localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));
            activeId = 'default';
            localStorage.setItem('anansi_active_config_id', activeId);
        }

        const saveConfigs = () => localStorage.setItem('anansi_llm_configs', JSON.stringify(configs));

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'api-config-overlay';
        overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;

        const modal = document.createElement('div');
        modal.style.cssText = `background:var(--bg-panel);border-radius:var(--radius-lg);border:1px solid var(--border-default);width:550px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);`;

        let currentView = 'list'; // 'list' or 'add'
        let editingConfig = null;

        const render = () => {
            modal.innerHTML = '';

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'padding:16px;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;';
            header.innerHTML = `
                <h3 style="margin:0;font-size:16px;color:var(--text-primary);">API Configuration</h3>
                <button id="modal-close" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;">×</button>
            `;
            modal.appendChild(header);

            // Body
            const body = document.createElement('div');
            body.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';

            if (currentView === 'list') {
                // Load generation settings
                const defaultGenSettings = { temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384, repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0 };
                const genSettings = { ...defaultGenSettings, ...JSON.parse(localStorage.getItem('anansi_gen_settings') || '{}') };

                // --- LIST VIEW ---
                body.innerHTML = `
                    <details open style="margin-bottom:16px;padding:12px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
                        <summary style="cursor:pointer;font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:bold;">Generation Settings</summary>
                        <div style="margin-top:12px;display:flex;flex-direction:column;gap:16px;">
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Temperature</label>
                                    <span id="temp-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.temperature}</span>
                                </div>
                                <input type="range" id="gen-temp" min="0" max="2" step="0.1" value="${genSettings.temperature}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>0</span><span>1</span><span>2</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Controls randomness. Lower = focused, higher = creative.</div>
                            </div>
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Max Tokens</label>
                                    <span id="maxtok-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.maxTokens === 0 ? 'Unlimited' : genSettings.maxTokens}</span>
                                </div>
                                <input type="range" id="gen-max-tokens" min="0" max="8192" step="256" value="${genSettings.maxTokens}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>0</span><span>4K</span><span>8K</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Response length limit. 0 = unlimited.</div>
                            </div>
                            
                            <div class="form-group">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <label class="label" style="font-size:10px;margin:0;">Context Size</label>
                                    <span id="ctx-val" style="font-size:11px;color:var(--accent-primary);font-weight:bold;">${genSettings.contextSize}</span>
                                </div>
                                <input type="range" id="gen-ctx" min="1024" max="131072" step="1024" value="${genSettings.contextSize}" style="width:100%;">
                                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);"><span>1K</span><span>64K</span><span>128K</span></div>
                                <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">Memory window. Lower if you get errors.</div>
                            </div>
                            
                            <details style="padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                                <summary style="cursor:pointer;font-size:10px;color:var(--text-muted);text-transform:uppercase;">Advanced Settings</summary>
                                <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Top P</label>
                                            <span id="topp-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.topP}</span>
                                        </div>
                                        <input type="range" id="gen-top-p" min="0" max="1" step="0.05" value="${genSettings.topP}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Top K</label>
                                            <span id="topk-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.topK === 0 ? 'Off' : genSettings.topK}</span>
                                        </div>
                                        <input type="range" id="gen-top-k" min="0" max="100" step="1" value="${genSettings.topK}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Repetition Penalty</label>
                                            <span id="rep-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.repetitionPenalty}</span>
                                        </div>
                                        <input type="range" id="gen-rep" min="1" max="2" step="0.05" value="${genSettings.repetitionPenalty}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Frequency Penalty</label>
                                            <span id="freq-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.frequencyPenalty}</span>
                                        </div>
                                        <input type="range" id="gen-freq" min="0" max="2" step="0.1" value="${genSettings.frequencyPenalty}" style="width:100%;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <label class="label" style="font-size:10px;margin:0;">Presence Penalty</label>
                                            <span id="pres-val" style="font-size:11px;color:var(--accent-primary);">${genSettings.presencePenalty}</span>
                                        </div>
                                        <input type="range" id="gen-pres" min="0" max="2" step="0.1" value="${genSettings.presencePenalty}" style="width:100%;">
                                    </div>
                                </div>
                            </details>
                            
                        </div>
                    </details>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Saved Configurations (${configs.length})</div>
                        <button id="btn-add-config" class="btn btn-primary btn-sm">+ Add Configuration</button>
                    </div>
                    <div id="configs-list" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <div style="margin-top:16px;padding:12px;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:var(--status-warning);margin-bottom:4px;">⚠️ Note</div>
                        <div style="font-size:11px;color:var(--text-muted);">API keys are stored in your browser's localStorage. They are never sent to any server except the configured provider.</div>
                    </div>
                `;

                // Bind generation settings
                const saveGenSettings = () => {
                    const settings = {
                        temperature: parseFloat(body.querySelector('#gen-temp').value),
                        maxTokens: parseInt(body.querySelector('#gen-max-tokens').value) || 0,
                        topP: parseFloat(body.querySelector('#gen-top-p').value),
                        topK: parseInt(body.querySelector('#gen-top-k').value) || 0,
                        contextSize: parseInt(body.querySelector('#gen-ctx').value) || 16384,
                        repetitionPenalty: parseFloat(body.querySelector('#gen-rep').value),
                        frequencyPenalty: parseFloat(body.querySelector('#gen-freq').value),
                        presencePenalty: parseFloat(body.querySelector('#gen-pres').value)
                    };
                    localStorage.setItem('anansi_gen_settings', JSON.stringify(settings));
                };

                // Slider bindings with live value display
                const bindSlider = (id, valId, formatter = v => v) => {
                    const slider = body.querySelector(id);
                    const valSpan = body.querySelector(valId);
                    if (slider && valSpan) {
                        slider.oninput = (e) => {
                            valSpan.textContent = formatter(e.target.value);
                            saveGenSettings();
                        };
                    }
                };
                bindSlider('#gen-temp', '#temp-val');
                bindSlider('#gen-max-tokens', '#maxtok-val', v => v === '0' ? 'Unlimited' : v);
                bindSlider('#gen-ctx', '#ctx-val');
                bindSlider('#gen-top-p', '#topp-val');
                bindSlider('#gen-top-k', '#topk-val', v => v === '0' ? 'Off' : v);
                bindSlider('#gen-rep', '#rep-val');
                bindSlider('#gen-freq', '#freq-val');
                bindSlider('#gen-pres', '#pres-val');

                const list = body.querySelector('#configs-list');
                configs.forEach(cfg => {
                    const isActive = cfg.id === activeId;
                    const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
                    const row = document.createElement('div');
                    row.style.cssText = `display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border:1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'};border-radius:var(--radius-md);`;
                    row.innerHTML = `
                        <div style="flex:1;">
                            <div style="font-size:13px;font-weight:bold;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                                ${cfg.name}
                                ${isActive ? '<span style="font-size:9px;padding:2px 6px;background:var(--accent-primary);color:white;border-radius:4px;">ACTIVE</span>' : ''}
                            </div>
                            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${preset.name} • ${cfg.model || preset.defaultModel}</div>
                        </div>
                        <div style="display:flex;gap:4px;">
                            ${!isActive ? `<button class="btn btn-ghost btn-sm btn-activate" data-id="${cfg.id}" style="font-size:10px;">Activate</button>` : ''}
                            <button class="btn btn-ghost btn-sm btn-edit" data-id="${cfg.id}" style="font-size:10px;">Edit</button>
                            <button class="btn btn-ghost btn-sm btn-delete" data-id="${cfg.id}" style="font-size:10px;color:var(--status-error);">Delete</button>
                            <button class="btn btn-ghost btn-sm btn-copy" data-id="${cfg.id}" style="font-size:10px;">Copy</button>
                            <button class="btn btn-ghost btn-sm btn-test" data-id="${cfg.id}" style="font-size:10px;">Test</button>
                        </div>
                    `;
                    list.appendChild(row);
                });

                modal.appendChild(body);

                // Bind list events
                body.querySelector('#btn-add-config').onclick = () => { editingConfig = null; currentView = 'add'; render(); };
                body.querySelectorAll('.btn-activate').forEach(btn => {
                    btn.onclick = () => {
                        activeId = btn.dataset.id;
                        localStorage.setItem('anansi_active_config_id', activeId);
                        render();
                        if (A.State && A.State.notify) A.State.notify(); // Refresh CFG lens
                        if (A.UI.Toast) A.UI.Toast.show('Configuration activated', 'success');
                    };
                });
                body.querySelectorAll('.btn-edit').forEach(btn => {
                    btn.onclick = () => {
                        editingConfig = configs.find(c => c.id === btn.dataset.id);
                        currentView = 'add';
                        render();
                    };
                });
                body.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.onclick = () => {
                        if (confirm('Delete this configuration?')) {
                            configs = configs.filter(c => c.id !== btn.dataset.id);
                            if (activeId === btn.dataset.id && configs.length > 0) activeId = configs[0].id;
                            saveConfigs();
                            localStorage.setItem('anansi_active_config_id', activeId);
                            render();
                        }
                    };
                });
                // Copy button
                body.querySelectorAll('.btn-copy').forEach(btn => {
                    btn.onclick = () => {
                        const original = configs.find(c => c.id === btn.dataset.id);
                        if (original) {
                            const copy = { ...original, id: 'cfg_' + Date.now(), name: original.name + ' (Copy)' };
                            configs.push(copy);
                            saveConfigs();
                            render();
                            if (A.UI.Toast) A.UI.Toast.show('Configuration copied', 'success');
                        }
                    };
                });
                // Test button
                body.querySelectorAll('.btn-test').forEach(btn => {
                    btn.onclick = async () => {
                        const cfg = configs.find(c => c.id === btn.dataset.id);
                        if (!cfg) return;
                        const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
                        const baseUrl = cfg.baseUrl || preset.baseUrl;
                        const model = cfg.model || preset.defaultModel;
                        const apiKey = cfg.apiKey;

                        btn.textContent = '...';
                        btn.disabled = true;

                        try {
                            let success = false;
                            if (cfg.provider === 'gemini') {
                                // Gemini uses different endpoint
                                const url = `${baseUrl}/models/${model}?key=${apiKey}`;
                                const res = await fetch(url);
                                success = res.ok;
                            } else {
                                // OpenAI-compatible
                                const url = `${baseUrl}/chat/completions`;
                                const res = await fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${apiKey}`
                                    },
                                    body: JSON.stringify({
                                        model: model,
                                        messages: [{ role: 'user', content: 'Hi' }],
                                        max_tokens: 1
                                    })
                                });
                                success = res.ok || res.status === 400; // 400 can mean "bad request but connection works"
                            }
                            if (success) {
                                if (A.UI.Toast) A.UI.Toast.show('Connection successful!', 'success');
                            } else {
                                if (A.UI.Toast) A.UI.Toast.show('Connection failed. Check your settings.', 'error');
                            }
                        } catch (e) {
                            if (A.UI.Toast) A.UI.Toast.show('Connection error: ' + e.message, 'error');
                        }
                        btn.textContent = 'Test';
                        btn.disabled = false;
                    };
                });

            } else {
                // --- ADD/EDIT VIEW ---
                const isEdit = !!editingConfig;
                const cfg = editingConfig || { id: '', name: '', provider: 'openai', model: '', baseUrl: '', apiKey: '' };

                body.innerHTML = `
                    <button id="btn-back" class="btn btn-ghost btn-sm" style="margin-bottom:12px;">← Back to List</button>
                    <h4 style="margin:0 0 16px 0;font-size:14px;">${isEdit ? 'Edit Configuration' : 'Add New Configuration'}</h4>
                    
                    <div style="margin-bottom:16px;">
                        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;">Provider</div>
                        <div id="provider-tabs" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
                    </div>

                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">Configuration Name</label>
                        <input id="cfg-name" class="input" value="${cfg.name}" placeholder="My OpenAI Key">
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">Model</label>
                        <input id="cfg-model" class="input" value="${cfg.model}" placeholder="e.g., gpt-4o-mini">
                    </div>
                    <div class="form-group" id="url-group" style="margin-bottom:12px;display:none;">
                        <label class="label" style="font-size:11px;">Base URL</label>
                        <input id="cfg-url" class="input" value="${cfg.baseUrl}" placeholder="https://api.example.com/v1">
                    </div>
                    <div class="form-group" id="key-group" style="margin-bottom:12px;">
                        <label class="label" style="font-size:11px;">API Key</label>
                        <input id="cfg-key" class="input" type="password" value="${cfg.apiKey}" placeholder="sk-...">
                    </div>

                    <button id="btn-save-config" class="btn btn-primary" style="width:100%;margin-top:8px;">${isEdit ? 'Save Changes' : 'Add Configuration'}</button>
                `;

                modal.appendChild(body);

                // Provider tabs
                const tabsContainer = body.querySelector('#provider-tabs');
                let selectedProvider = cfg.provider || 'openai';

                const renderProviderTabs = () => {
                    tabsContainer.innerHTML = Object.keys(PROVIDER_PRESETS).map(key => {
                        const p = PROVIDER_PRESETS[key];
                        const isSelected = key === selectedProvider;
                        return `<button class="btn btn-sm provider-tab" data-provider="${key}" style="font-size:10px;${isSelected ? 'background:var(--accent-primary);color:white;' : ''}">${p.name}</button>`;
                    }).join('');

                    // Update field visibility
                    const preset = PROVIDER_PRESETS[selectedProvider];
                    body.querySelector('#url-group').style.display = selectedProvider === 'custom' ? 'block' : 'none';
                    body.querySelector('#key-group').style.display = preset.needsKey ? 'block' : 'none';
                    if (!isEdit) {
                        body.querySelector('#cfg-model').placeholder = preset.defaultModel || 'Model ID';
                    }

                    // Bind tab clicks
                    tabsContainer.querySelectorAll('.provider-tab').forEach(tab => {
                        tab.onclick = () => {
                            selectedProvider = tab.dataset.provider;
                            renderProviderTabs();
                        };
                    });
                };
                renderProviderTabs();

                // Back button
                body.querySelector('#btn-back').onclick = () => { currentView = 'list'; editingConfig = null; render(); };

                // Save button
                body.querySelector('#btn-save-config').onclick = () => {
                    const name = body.querySelector('#cfg-name').value.trim();
                    const model = body.querySelector('#cfg-model').value.trim() || PROVIDER_PRESETS[selectedProvider].defaultModel;
                    const apiKey = body.querySelector('#cfg-key').value.trim();
                    const baseUrl = body.querySelector('#cfg-url').value.trim() || PROVIDER_PRESETS[selectedProvider].baseUrl;

                    if (!name) { alert('Please enter a configuration name.'); return; }

                    if (isEdit) {
                        editingConfig.name = name;
                        editingConfig.provider = selectedProvider;
                        editingConfig.model = model;
                        editingConfig.baseUrl = baseUrl;
                        editingConfig.apiKey = apiKey;
                    } else {
                        configs.push({
                            id: 'cfg_' + Date.now(),
                            name, provider: selectedProvider, model, baseUrl, apiKey
                        });
                    }
                    saveConfigs();
                    if (A.UI.Toast) A.UI.Toast.show(isEdit ? 'Configuration updated' : 'Configuration added', 'success');
                    currentView = 'list';
                    editingConfig = null;
                    render();
                };
            }

            // Close button
            modal.querySelector('#modal-close').onclick = () => overlay.remove();
        };

        render();
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    };

    // Helper to get active LLM config
    A.UI.getActiveLLMConfig = function () {
        const configs = JSON.parse(localStorage.getItem('anansi_llm_configs') || '[]');
        const activeId = localStorage.getItem('anansi_active_config_id') || '';
        const cfg = configs.find(c => c.id === activeId) || configs[0] || null;
        if (!cfg) return null;
        const preset = PROVIDER_PRESETS[cfg.provider] || PROVIDER_PRESETS.custom;
        return {
            provider: cfg.provider,
            model: cfg.model || preset.defaultModel,
            baseUrl: cfg.baseUrl || preset.baseUrl,
            apiKey: cfg.apiKey
        };
    };

    // Helper to get generation settings
    A.UI.getGenerationSettings = function () {
        const defaults = { temperature: 0.7, maxTokens: 0, topP: 1.0, topK: 0, contextSize: 16384, repetitionPenalty: 1.0, frequencyPenalty: 0, presencePenalty: 0 };
        return { ...defaults, ...JSON.parse(localStorage.getItem('anansi_gen_settings') || '{}') };
    };

})(window.Anansi);

