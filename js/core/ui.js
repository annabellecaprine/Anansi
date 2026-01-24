/*
 * Anansi UI Core
 * File: js/core/ui.js
 * Purpose: Layout manager, Navigation, and Panel Rendering.
 * 
 * Manages the application shell, sidebar navigation, panel switching,
 * and the lens (side panel) system.
 */

(function (A) {
    'use strict';

    /** @type {string} Currently active panel ID */
    let activePanelId = 'project';

    /** @type {string} Search filter for sidebar */
    let navSearchTerm = '';

    /** @type {string[]} History of visited panels for back navigation */
    let panelHistory = [];

    /** @type {number} Maximum panels to keep in history */
    const MAX_HISTORY = 5;

    // Pagination State
    let navPage = 0;
    const NAV_PAGE_SIZE = 3;

    // Define Category Order (Updated structure)
    const categoryOrder = ['Loom', 'Seeds', 'Weave', 'Magic', 'Sacred Tools', 'Deep', 'Forbidden Secrets', 'RPG Experiment'];

    const ICONS = {
        'project': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        'sources': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        'character': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
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
        'parlor': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
        'nabu': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M7 7h10M7 11h8M7 15h6M7 19h4"/></svg>'
    };

    /**
     * UI management singleton.
     * Handles navigation, panel rendering, and application shell.
     * @namespace
     */
    const UI = {
        /**
         * Initialize the UI system.
         * Sets up DOM references, event handlers, and renders initial state.
         */
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
                btnBack: document.getElementById('btn-back'),
                lensRoot: document.getElementById('lens-root'),
                appShell: document.getElementById('app-shell')
            };

            // PostMessage Listener for Cross-Origin (iframe) Unlocking
            window.addEventListener('message', (event) => {
                // Security check? In local app, origins might be null or file://. 
                // We'll trust the payload structure.
                if (event.data && event.data.type === 'ANANSI_UNLOCK' && event.data.payload === 'dungeonmaster') {
                    console.log("[UI] Received Unlock Command");
                    localStorage.setItem('anansi_gm_unlocked', 'true');

                    if (A.UI.Toast) A.UI.Toast.show("Features Unlocked. Reloading...", "success");

                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            });

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


            // About Modal (Clicking Logo)
            const logo = /** @type {HTMLElement} */ (document.querySelector('.app-logo'));
            if (logo) {
                logo.style.cursor = 'pointer';
                logo.title = 'About Anansi';
                logo.onclick = () => {
                    // Use iframe to support local file:// access where fetch() is blocked
                    const cacheBust = '?v=' + (A.VERSION || Date.now());
                    const frameHtml = `
                        <iframe src="ABOUT.html${cacheBust}" 
                                style="width:100%; height:400px; border:none; display:block;"
                                title="About Anansi">
                        </iframe>`;

                    A.UI.Modal.show({
                        title: 'About',
                        content: frameHtml,
                        width: 520
                    });
                };
            }

            this.els.btnNew.onclick = () => {
                if (confirm('Create new project? Unsaved changes will be lost.')) {
                    A.State.reset();
                    if (A.UI.Toast) A.UI.Toast.show('New project created', 'info');
                }
            };

            this.els.btnExport.onclick = () => {
                A.IO.exportToFile();
                // Toast appears in IO.exportToFile, no need for duplicate
            };
            this.els.btnBuild.onclick = () => {
                A.Export.build();
                // Toast confirmation handled in Export.build method
            };

            this.els.btnImport.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.anansi.json';
                input.onchange = (e) => {
                    const target = /** @type {HTMLInputElement} */ (e.target);
                    if (target.files && target.files[0]) {
                        A.IO.importFromFile(target.files[0]);
                        // Toast appears in IO.importFromFile on success
                    }
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

            // Global Guides Binding
            const btnGuide = document.getElementById('btn-global-guide');
            if (btnGuide) {
                btnGuide.onclick = () => {
                    UI.switchPanel('guide');
                };
            }

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

                // Refresh Nav if Mode Changes (e.g. Import Player Mode)
                if (state.meta?.mode !== this.lastMode) {
                    this.lastMode = state.meta?.mode;
                    this.refreshNav();
                }

                this.els.displayName.textContent = state.meta.name + (state.isDirty ? ' •' : '');
                this.updateIntegrityBadge(state);

                // Update save button visual state
                if (state.isDirty) {
                    this.els.btnSave.classList.add('btn-unsaved');
                } else {
                    this.els.btnSave.classList.remove('btn-unsaved');
                }
            });

            // Global Keyboard Shortcuts
            document.addEventListener('keydown', (e) => {
                // Detect Ctrl (Windows/Linux) or Cmd (Mac)
                const cmdKey = e.metaKey || e.ctrlKey;

                // Ignore if typing in an input field
                const activeEl = /** @type {HTMLElement | null} */ (document.activeElement);
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                    return;
                }

                // Save: Ctrl+S
                if (cmdKey && e.key === 's') {
                    e.preventDefault();
                    A.IO.save(A.State.get());
                    if (A.UI.Toast) A.UI.Toast.show('Project saved!', 'success');
                    if (A.UI.flashSuccess) A.UI.flashSuccess(this.els.btnSave);
                }

                // New Panel: Ctrl+Alt+N
                if (cmdKey && e.altKey && e.key === 'n') {
                    // Placeholder for future shortcut
                }

                // Ctrl/Cmd + B → Build (AURA export)
                else if (cmdKey && e.key === 'b') {
                    e.preventDefault();
                    if (this.els.btnBuild) this.els.btnBuild.click();
                }

                // Ctrl/Cmd + N → New Project
                else if (cmdKey && e.key === 'n') {
                    e.preventDefault();
                    if (this.els.btnNew) this.els.btnNew.click();
                }

                // Ctrl/Cmd + , → Project Settings
                else if (cmdKey && e.key === ',') {
                    e.preventDefault();
                    this.switchPanel('project');
                }

                // Ctrl/Cmd + [ → Back
                else if (cmdKey && e.key === '[') {
                    e.preventDefault();
                    this.goBack();
                }

                // Number keys 1-9 → Jump to panels (if not in input)
                else if (!cmdKey && e.key >= '1' && e.key <= '9') {
                    const index = parseInt(e.key) - 1;
                    const allPanels = this.panels.filter(p => !p.hidden);
                    if (allPanels[index]) {
                        e.preventDefault();
                        this.switchPanel(allPanels[index].id);
                    }
                }
            });

            // Bind search input
            const navSearchInput = document.getElementById('nav-search-input');
            if (navSearchInput) {
                navSearchInput.addEventListener('input', (e) => {
                    const target = /** @type {HTMLInputElement} */ (e.target);
                    navSearchTerm = target.value.toLowerCase();
                    this.refreshNav();
                });
            }

            // Bind back button
            if (this.els.btnBack) {
                this.els.btnBack.onclick = () => this.goBack();
            }

            // --- RPG EXPERIMENT PLACEHOLDERS ---
            // Register placeholder panels for the new RPG category
            const rpgPanels = [
                { id: 'rpg_party', label: 'Party', desc: 'Hero management' }, // Player facing
                { id: 'rpg_monsters', label: 'Monsters', desc: 'Bestiary and Stat blocks', gmOnly: true },
                { id: 'rpg_map', label: 'Map', desc: 'Locations' }, // Player facing? Or GM? Usually shared. "Hina's Guide" handles map building.
                { id: 'rpg_dm_map', label: 'DM Map', desc: 'World building', gmOnly: true },
                { id: 'rpg_armory', label: 'Armory', desc: 'Items & Spells', gmOnly: true }
            ];

            rpgPanels.forEach(p => {
                // Use a slight hack to check if registered, though Anansi.js doesn't expose 'isRegistered'. 
                // We'll just register safely.
                const existing = A.getNavSections().find(s => s.id === p.id);
                if (!existing) {
                    A.registerPanel(p.id, {
                        label: p.label,
                        category: 'RPG Experiment',
                        icon: '🎲',
                        render: (container) => {
                            container.innerHTML = `
                                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.5;">
                                    <div style="font-size:32px;">🚧</div>
                                    <h3>${p.label}</h3>
                                    <p>${p.desc}</p>
                                    <div style="font-size:11px;">Coming soon to the RPG Experiment.</div>
                                </div>
                            `;
                        }
                    });
                }
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
            const totalPages = Math.ceil(categoryOrder.length / NAV_PAGE_SIZE);

            // Render Pagination Header (Only if not searching)
            if (!navSearchTerm) {
                const pageControl = document.createElement('div');
                pageControl.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:4px 8px; background:var(--bg-elevated); border-bottom:1px solid var(--border-subtle); margin-bottom:2px; position:sticky; top:0; z-index:10;";

                const btnPrev = document.createElement('button');
                btnPrev.textContent = "◀";
                btnPrev.style.cssText = "background:transparent; border:none; color:var(--text-secondary); cursor:pointer; padding:4px 8px; font-size:10px;";
                btnPrev.disabled = navPage === 0;
                btnPrev.style.opacity = navPage === 0 ? "0.3" : "1";
                btnPrev.onclick = () => {
                    if (navPage > 0) {
                        navPage--;
                        this.refreshNav();
                    }
                };

                const label = document.createElement('span');
                label.style.cssText = "font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase;";
                label.textContent = `Page ${navPage + 1} / ${totalPages}`;

                const btnNext = document.createElement('button');
                btnNext.textContent = "▶";
                btnNext.style.cssText = "background:transparent; border:none; color:var(--text-secondary); cursor:pointer; padding:4px 8px; font-size:10px;";
                btnNext.disabled = navPage >= totalPages - 1;
                btnNext.style.opacity = navPage >= totalPages - 1 ? "0.3" : "1";
                btnNext.onclick = () => {
                    if (navPage < totalPages - 1) {
                        navPage++;
                        this.refreshNav();
                    }
                };

                pageControl.appendChild(btnPrev);
                pageControl.appendChild(label);
                pageControl.appendChild(btnNext);
                container.appendChild(pageControl);
            }

            // Determine visible categories
            const visibleCategories = navSearchTerm
                ? categoryOrder
                : categoryOrder.slice(navPage * NAV_PAGE_SIZE, (navPage + 1) * NAV_PAGE_SIZE);

            visibleCategories.forEach(cat => {
                const groupItems = groups[cat];
                if (!groupItems || groupItems.length === 0) return;

                // LOCK: Hide RPG Experiment if not unlocked
                const isGmUnlocked = localStorage.getItem('anansi_gm_unlocked') === 'true';
                if (cat === 'RPG Experiment' && !isGmUnlocked) {
                    return;
                }

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

                    const chevron = /** @type {HTMLElement | null} */ (header.querySelector('.nav-chevron'));
                    if (chevron) chevron.style.transform = newState === 'none' ? 'rotate(-90deg)' : 'rotate(0deg)';

                    // Save
                    const currentStored = JSON.parse(localStorage.getItem('anansi_sidebar_collapsed') || '{}');
                    currentStored[cat] = (newState === 'none');
                    localStorage.setItem('anansi_sidebar_collapsed', JSON.stringify(currentStored));
                };

                // Sort items by order
                groupItems.sort((a, b) => (a.order || 99) - (b.order || 99));

                // Helper to render a generic item button
                const renderBtn = (section, containerDiv) => {
                    // Check for Player Mode Lock
                    const state = A.State.get();
                    if (state && state.meta && state.meta.mode === 'player' && section.gmOnly) {
                        return;
                    }

                    // Check for hidden property
                    if (section.hidden) {
                        if (section.id === 'gamemaster') {
                            const isUnlocked = localStorage.getItem('anansi_gm_unlocked') === 'true';
                            if (!isUnlocked) return;
                        } else {
                            return;
                        }
                    }

                    const btn = document.createElement('button');
                    btn.className = `nav-item ${section.id === activePanelId ? 'active' : ''}`;
                    btn.style.paddingLeft = '12px';
                    btn.style.display = 'flex';
                    btn.style.alignItems = 'center';
                    btn.style.gap = '8px';

                    // Use registered icon (emoji) or lookup SVG
                    // Detect if icon is an SVG string or simple text
                    let iconContent = '';
                    // 1. Check if ID matches a known SVG icon first (prioritize standard icons)
                    if (ICONS[section.id]) {
                        iconContent = ICONS[section.id];
                    }
                    // 2. Check explicitly provided SVG string
                    else if (section.icon && section.icon.includes('<svg')) {
                        iconContent = section.icon;
                    }
                    // 3. Fallback to assuming it's an emoji/text if it's a short string
                    else if (section.icon && !section.icon.includes('<') && section.icon.length < 10) {
                        iconContent = `<span style="font-size:14px; line-height:1;">${section.icon}</span>`;
                    }
                    // 4. Default fallback
                    else {
                        iconContent = ICONS['advanced'];
                    }

                    btn.innerHTML = `
             <span class="nav-icon" style="opacity:${section.id === activePanelId ? 1 : 0.6}; transition:opacity 0.2s; display:flex; align-items:center;">${iconContent}</span>
             <span class="nav-item-label">${section.label}</span>
           `;
                    btn.onclick = () => UI.switchPanel(section.id);
                    containerDiv.appendChild(btn);
                };

                // If searching, render flat list
                if (navSearchTerm) {
                    groupItems.forEach(section => {
                        const label = (section.label || '').toLowerCase();
                        if (label.includes(navSearchTerm)) {
                            renderBtn(section, list);
                        }
                    });
                } else {
                    // Normal rendering with subcategories
                    const mainItems = groupItems.filter(s => !s.subcategory);
                    const subcats = {};
                    groupItems.filter(s => s.subcategory).forEach(s => {
                        if (!subcats[s.subcategory]) subcats[s.subcategory] = [];
                        subcats[s.subcategory].push(s);
                    });

                    // Render main (top-level) items first
                    mainItems.forEach(s => renderBtn(s, list));

                    // Render Subcategories
                    Object.keys(subcats).forEach(subName => {
                        const subGroup = subcats[subName];

                        // Subcategory Header (Collapsible)
                        const subHeader = document.createElement('div');
                        const isSubCollapsed = (JSON.parse(localStorage.getItem('anansi_sub_collapsed') || '{}')[subName]) === true;

                        subHeader.style.cssText = 'padding:6px 12px 6px 12px; font-size:10px; font-weight:bold; color:var(--text-muted); cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-top:4px;';
                        subHeader.innerHTML = `<span>${subName}</span><span class="sub-chev" style="font-size:8px; transform:${isSubCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span>`;

                        const subList = document.createElement('div');
                        subList.style.display = isSubCollapsed ? 'none' : 'flex';
                        subList.style.flexDirection = 'column';
                        subList.style.gap = '2px';
                        subList.style.marginLeft = '8px'; // Indent sub-items
                        subList.style.borderLeft = '1px solid var(--border-subtle)';

                        // Populate
                        subGroup.forEach(s => renderBtn(s, subList));

                        // Toggle
                        subHeader.onclick = () => {
                            const was = subList.style.display === 'none';
                            const newVal = was ? 'flex' : 'none';
                            subList.style.display = newVal;
                            const sc = /** @type {HTMLElement | null} */ (subHeader.querySelector('.sub-chev'));
                            if (sc) sc.style.transform = newVal === 'none' ? 'rotate(-90deg)' : 'rotate(0deg)';

                            // Persist
                            const store = JSON.parse(localStorage.getItem('anansi_sub_collapsed') || '{}');
                            store[subName] = (newVal === 'none');
                            localStorage.setItem('anansi_sub_collapsed', JSON.stringify(store));
                        };

                        list.appendChild(subHeader);
                        list.appendChild(subList);
                    });
                }

                container.appendChild(list);
            });
        },

        /**
         * Refresh navigation and re-render the current panel.
         */
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

        /**
         * Switch to a different panel by ID.
         * Updates navigation, renders the panel, and manages history.
         * 
         * @param {string} id - Panel ID to switch to
         * @param {Object} [context] - Optional context to pass to panel render function
         */
        switchPanel: function (id, context) {
            try {
                // Track panel history (skip if it's the same panel)
                if (id !== activePanelId) {
                    // Add current panel to history before switching
                    if (activePanelId && !panelHistory.includes(activePanelId)) {
                        panelHistory.push(activePanelId);
                        // Keep only last MAX_HISTORY panels
                        if (panelHistory.length > MAX_HISTORY) {
                            panelHistory.shift();
                        }
                    }

                    // Update back button visibility
                    if (this.els.btnBack) {
                        this.els.btnBack.style.display = panelHistory.length > 0 ? 'inline-flex' : 'none';
                    }
                }

                activePanelId = id;

                // Auto-Pagination: Ensure the new panel is visible
                if (!navSearchTerm) {
                    const sections = A.getNavSections();
                    const target = sections.find(s => s.id === id);
                    if (target && target.category) {
                        const catIndex = categoryOrder.indexOf(target.category);
                        if (catIndex !== -1) {
                            const neededPage = Math.floor(catIndex / NAV_PAGE_SIZE);
                            if (neededPage !== navPage) {
                                navPage = neededPage;
                            }
                        }
                    }
                }

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
                            // Emit panel switch event for interested listeners
                            if (A.Events) A.Events.emit('panel:switched', { id, context });
                        } catch (renderErr) {
                            console.error(`[UI] Failed to render panel ${id}:`, renderErr);
                            this.renderErrorState(this.els.panelRoot, renderErr, () => {
                                // Retry callback: recursively call switchPanel to retry rendering
                                this.switchPanel(id, context);
                            });
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

        /**
         * Set the lens (side panel) content.
         * @param {function(HTMLElement): void|null} renderFn - Function to render lens content, or null to clear
         */
        setLens: function (renderFn) {
            this.els.lensRoot.innerHTML = '';
            if (!renderFn) {
                this.els.lensRoot.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-style:italic; font-size:12px;">No active lens for this panel.</div>`;
                return;
            }
            renderFn(this.els.lensRoot);
        },

        /**
         * Navigate back to the previous panel in history.
         */
        goBack: function () {
            if (panelHistory.length === 0) return;

            const previousPanel = panelHistory.pop();

            // Update back button visibility
            if (this.els.btnBack) {
                this.els.btnBack.style.display = panelHistory.length > 0 ? 'inline-flex' : 'none';
            }

            // Switch to previous panel without adding to history
            const temp = activePanelId;
            activePanelId = previousPanel;
            this.switchPanel(previousPanel);
            activePanelId = temp; // Prevent switchPanel from re-adding to history
        },

        /**
         * Toggle the lens panel visibility.
         * @param {boolean} [force] - Force open (true) or closed (false)
         */
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
            localStorage.setItem('anansi_lens_collapsed', String(isCollapsed));
        },

        /**
         * Render a standardized error state into a container.
         * @param {HTMLElement} container - Target container
         * @param {Error} error - The error object
         * @param {(e: Event) => void} [retryCallback] - Optional callback for retry button
         */
        renderErrorState: function (container, error, retryCallback) {
            container.innerHTML = `
                <div class="empty-state error-state" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:32px; text-align:center;">
                    <div style="font-size:48px; margin-bottom:16px;">💥</div>
                    <div style="font-size:18px; font-weight:bold; color:var(--status-error); margin-bottom:8px;">Panel Crashed</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">The application encountered an unexpected error.</div>
                    <div style="background:var(--bg-deep); padding:12px; border-radius:6px; font-family:monospace; font-size:11px; max-width:600px; overflow:auto; margin-bottom:24px; border:1px solid var(--border-subtle); text-align:left; width:100%;">
                        <div style="color:var(--status-error); font-weight:bold; margin-bottom:4px;">${error.name || 'Error'}</div>
                        <div>${error.message || 'Unknown error'}</div>
                        ${error.stack ? `<div style="margin-top:8px; opacity:0.6; white-space:pre-wrap;">${error.stack.split('\n').slice(0, 3).join('\n')}...</div>` : ''}
                    </div>
                    <div style="display:flex; gap:12px;">
                        ${retryCallback ? '<button id="err-retry-btn" class="btn btn-primary">🔄 Retry Panel</button>' : ''}
                        <button id="err-reload-btn" class="btn btn-ghost">Reload App</button>
                    </div>
                </div>
            `;

            if (retryCallback) {
                const retryBtn = container.querySelector('#err-retry-btn');
                if (retryBtn) /** @type {HTMLElement} */ (retryBtn).onclick = retryCallback;
            }

            const reloadBtn = container.querySelector('#err-reload-btn');
            if (reloadBtn) /** @type {HTMLElement} */ (reloadBtn).onclick = () => window.location.reload();
        }
    };

    // Mobile: Click overlay to close lens drawer
    document.addEventListener('click', (e) => {
        const shell = document.getElementById('app-shell');
        if (window.innerWidth < 768 && shell && shell.classList.contains('lens-open')) {
            const lens = document.querySelector('.web-lens');
            const lensBtn = document.getElementById('btn-toggle-lens');
            const target = /** @type {Node} */ (e.target);
            if (lens && !lens.contains(target) && lensBtn && !lensBtn.contains(target)) {
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

    // Note: Modal, Toast, flashSuccess, Components (TagInput), EmptyState, 
    // GlobalOverviewLens, and API Config are now in separate files:
    // - js/core/ui-modal.js
    // - js/core/ui-components.js
    // - js/core/ui-api-config.js

    // @ts-ignore - Anansi is a global defined in anansi.js
})(window.Anansi);
