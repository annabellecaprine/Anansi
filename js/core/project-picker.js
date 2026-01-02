/*
 * Anansi Core: Project Picker
 * File: js/core/project-picker.js
 * Purpose: Modal UI for managing multiple projects
 */

(function (A) {
    'use strict';

    const ProjectPicker = {

        /**
         * Show the project picker modal
         */
        show: async function () {
            const projects = await A.ProjectDB.list();
            const currentId = A.ProjectDB.getCurrentId();
            const count = projects.length;
            const max = A.ProjectDB.getMaxProjects();

            const content = document.createElement('div');
            content.className = 'project-picker';
            content.innerHTML = `
                <div class="project-picker-header">
                    <div class="project-picker-actions">
                        <button class="btn btn-primary btn-sm" id="pp-new" ${count >= max ? 'disabled' : ''}>
                            + New Project
                        </button>
                        <button class="btn btn-ghost btn-sm" id="pp-import">
                            📥 Import File
                        </button>
                        <input type="file" id="pp-import-input" accept=".json,.anansi.json" style="display:none" />
                    </div>
                    <div class="project-picker-count">
                        ${count} / ${max} slots used
                    </div>
                </div>
                ${count >= max ? `
                    <div class="project-picker-warning">
                        ⚠️ Project slots full. Download or delete a project to make room.
                    </div>
                ` : ''}
                <div class="project-picker-list" id="pp-list">
                    ${ProjectPicker._renderProjectsHTML(projects, currentId)}
                </div>
            `;

            // Add styles
            if (!document.getElementById('project-picker-styles')) {
                const style = document.createElement('style');
                style.id = 'project-picker-styles';
                style.textContent = `
                    .project-picker { min-width: 400px; max-width: 500px; }
                    .project-picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle); }
                    .project-picker-actions { display: flex; gap: 8px; }
                    .project-picker-count { font-size: 12px; color: var(--text-muted); }
                    .project-picker-warning { background: var(--status-warning); color: var(--bg-primary); padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 12px; }
                    .project-picker-list { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                    .project-picker-empty { text-align: center; padding: 32px; color: var(--text-muted); }
                    .project-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-subtle); border-radius: 6px; background: var(--bg-elevated); transition: border-color 0.1s; }
                    .project-card:hover { border-color: var(--accent-primary); }
                    .project-card.current { border-color: var(--accent-primary); border-width: 2px; }
                    .project-card-info { flex: 1; }
                    .project-card-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; }
                    .project-card-name .star { color: var(--status-warning); }
                    .project-card-meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
                    .project-card-actions { display: flex; gap: 6px; }
                `;
                document.head.appendChild(style);
            }

            // Show modal
            A.UI.Modal.show({
                title: '📁 Projects',
                content: content,
                width: 520
            });

            // Bind events
            ProjectPicker._bindEvents(content);

            // Initial bind of list events
            ProjectPicker._bindListEvents(content);
        },

        /**
         * Render a single project card
         */
        _renderProjectCard: function (project, isCurrent) {
            const timeAgo = ProjectPicker._formatTimeAgo(project.lastModified);
            return `
                <div class="project-card ${isCurrent ? 'current' : ''}" data-id="${project.id}">
                    <div class="project-card-info">
                        <div class="project-card-name">
                            ${isCurrent ? '<span class="star">⭐</span>' : ''}
                            ${ProjectPicker._escapeHtml(project.name)}
                        </div>
                        <div class="project-card-meta">
                            ${project.actorCount} actors · ${project.lorebookCount} lore · ${timeAgo}
                        </div>
                    </div>
                    <div class="project-card-actions">
                        ${!isCurrent ? `<button class="btn btn-ghost btn-sm pp-open" data-id="${project.id}">Open</button>` : ''}
                        <button class="btn btn-ghost btn-sm pp-download" data-id="${project.id}" title="Download">💾</button>
                        <button class="btn btn-ghost btn-sm pp-delete" data-id="${project.id}" title="Delete" style="color:var(--status-error);">🗑️</button>
                    </div>
                </div>
            `;
        },

        /**
         * Bind event handlers
         */
        _bindEvents: function (container) {
            // New Project
            container.querySelector('#pp-new')?.addEventListener('click', async () => {
                await ProjectPicker._createNewProject();
            });

            // Import
            container.querySelector('#pp-import')?.addEventListener('click', () => {
                container.querySelector('#pp-import-input')?.click();
            });

            container.querySelector('#pp-import-input')?.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    await ProjectPicker._importProject(file);
                }
            });

            // Open buttons
            container.querySelectorAll('.pp-open').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await ProjectPicker._openProject(btn.dataset.id);
                });
            });

            // Download buttons
            container.querySelectorAll('.pp-download').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await A.ProjectDB.exportProject(btn.dataset.id);
                });
            });

            // Delete buttons
            container.querySelectorAll('.pp-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await ProjectPicker._deleteProject(btn.dataset.id);
                });
            });
        },

        /**
         * Re-render just the project list
         */
        _refreshList: async function () {
            const listEl = document.getElementById('pp-list');
            const countEl = document.querySelector('.project-picker-count');
            const newBtn = document.getElementById('pp-new');

            if (!listEl) return;

            const projects = await A.ProjectDB.list();
            const currentId = A.ProjectDB.getCurrentId();
            const count = projects.length;
            const max = A.ProjectDB.getMaxProjects();

            // Update header stats
            if (countEl) countEl.textContent = `${count} / ${max} slots used`;

            // Update New button state
            if (newBtn) {
                if (count >= max) newBtn.setAttribute('disabled', 'true');
                else newBtn.removeAttribute('disabled');
            }

            // Update warning
            const existingWarning = document.querySelector('.project-picker-warning');
            if (count >= max && !existingWarning) {
                const warning = document.createElement('div');
                warning.className = 'project-picker-warning';
                warning.innerHTML = '⚠️ Project slots full. Download or delete a project to make room.';
                listEl.parentNode.insertBefore(warning, listEl);
            } else if (count < max && existingWarning) {
                existingWarning.remove();
            }

            // Update list content
            listEl.innerHTML = ProjectPicker._renderProjectsHTML(projects, currentId);

            // Re-bind events for list items
            ProjectPicker._bindListEvents(listEl);
        },

        /**
         * Generate HTML for the projects list
         */
        _renderProjectsHTML: function (projects, currentId) {
            if (projects.length === 0) {
                return `
                    <div class="project-picker-empty">
                        No projects yet. Create one to get started!
                    </div>
                `;
            }
            return projects.map(p => ProjectPicker._renderProjectCard(p, p.id === currentId)).join('');
        },

        /**
         * Bind events for list items (Open/Delete buttons)
         */
        _bindListEvents: function (container) {
            container.querySelectorAll('#pp-open').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await ProjectPicker._openProject(btn.dataset.id);
                });
            });

            container.querySelectorAll('#pp-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await ProjectPicker._deleteProject(btn.dataset.id);
                });
            });
        },

        /**
         * Create a new project
         */
        _createNewProject: async function () {
            // Check capacity
            const isFull = await A.ProjectDB.isFull();
            if (isFull) {
                A.UI.Toast.show('Project slots full. Delete a project first.', 'warning');
                return;
            }

            // Save current project first
            const currentState = A.State.get();
            await A.ProjectDB.save(currentState);
            const currentId = currentState.meta.id;

            // Create new project state (without loading it)
            const newProjectState = {
                meta: {
                    id: A.ProjectDB.generateId(),
                    name: 'Untitled Project',
                    env: 'JAI',
                    created: Date.now(),
                    modified: Date.now()
                },
                actors: { list: [] },
                weaves: {
                    lorebook: { entries: {}, scanDepth: 3 },
                    voices: { enabled: true, debug: false, voices: [] },
                    events: { list: [] }
                },
                scoring: { enabled: false, rules: [] },
                advanced: { enabled: false, rules: [] },
                sbx: { rules: [] },
                strands: {
                    sources: { items: {} },
                    scripts: { items: {}, order: [] }
                },
                sim: {}
            };

            // Apply Default Sources (Fix for detached Sources panel)
            console.log('[ProjectPicker] Checking Adapters:', A.Adapters);
            if (A.Adapters && A.Adapters['jai']) { // Default env is 'jai'
                console.log('[ProjectPicker] Found JAI adapter. Injecting defaults...');
                const defaults = A.Adapters['jai'].getDefaultSources();
                console.log('[ProjectPicker] Defaults:', defaults);
                defaults.forEach(src => {
                    newProjectState.strands.sources.items[src.id] = src;
                });
                console.log('[ProjectPicker] Injected sources:', Object.keys(newProjectState.strands.sources.items));
            } else {
                console.warn('[ProjectPicker] JAI Adapter NOT found.');
            }

            // Save the new project to DB (but don't switch to it yet)
            await A.ProjectDB.save(newProjectState);
            const newProjectId = newProjectState.meta.id;

            // Refresh the list to show the new project
            await ProjectPicker._refreshList();

            // Prompt user to switch
            A.UI.Modal.show({
                title: 'Switch to New Project?',
                content: `
                    <div style="padding: 12px;">
                        <p>A new project "<strong>Untitled Project</strong>" has been created.</p>
                        <p style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">
                            Would you like to switch to it now, or continue working on your current project?
                        </p>
                    </div>
                `,
                actions: [
                    {
                        label: 'Switch to New Project',
                        class: 'btn-primary',
                        onclick: async () => {
                            // Load the new project
                            const project = await A.ProjectDB.get(newProjectId);
                            A.State.load(project.data);
                            A.ProjectDB.setCurrentId(newProjectId);

                            // Close ALL modals
                            const overlays = document.querySelectorAll('.modal-overlay');
                            overlays.forEach(o => o.remove());

                            A.UI.refresh();
                            A.UI.Toast.show('Switched to new project', 'success');
                            return true; // Allow modal to close
                        }
                    },
                    {
                        label: 'Stay on Current Project',
                        class: 'btn-secondary',
                        onclick: async () => {
                            // Close ALL modals (prompt and project picker)
                            const overlays = document.querySelectorAll('.modal-overlay');
                            overlays.forEach(o => o.remove());

                            A.UI.Toast.show('New project created', 'info');
                            return true; // Allow modal to close
                        }
                    }
                ]
            });
        },

        /**
         * Open an existing project
         */
        _openProject: async function (id) {
            // Save current project first
            await A.ProjectDB.save(A.State.get());

            // Load selected project
            const project = await A.ProjectDB.get(id);
            if (!project) {
                A.UI.Toast.show('Project not found', 'error');
                return;
            }

            // Load into state and set as current
            A.State.load(project.data);
            A.ProjectDB.setCurrentId(id);

            // Close ALL modals
            const overlays = document.querySelectorAll('.modal-overlay');
            overlays.forEach(o => o.remove());

            // Force UI refresh
            A.UI.refresh();
            A.UI.Toast.show(`Opened "${project.name}"`, 'success');
        },

        /**
         * Delete a project
         */
        _deleteProject: async function (id) {
            const projects = await A.ProjectDB.list();
            const project = projects.find(p => p.id === id);

            if (!project) {
                A.UI.Toast.show('Project not found', 'error');
                return;
            }

            const currentId = A.ProjectDB.getCurrentId();

            // Confirm
            if (!confirm(`Delete "${project.name}"?\n\nThis cannot be undone. Consider downloading first.`)) {
                return;
            }

            // If deleting current project, need to handle specially
            if (id === currentId) {
                // Find another project to switch to
                const otherProject = projects.find(p => p.id !== id);

                if (otherProject) {
                    // Load other project first
                    const other = await A.ProjectDB.get(otherProject.id);
                    A.State.load(other.data);
                    A.ProjectDB.setCurrentId(otherProject.id);
                } else {
                    // This is the only project, create a new one
                    A.State.reset();
                    const newState = A.State.get();
                    newState.meta.id = A.ProjectDB.generateId();
                    await A.ProjectDB.save(newState);
                }
            }

            // Delete the project
            await A.ProjectDB.delete(id);

            // Update the list in place
            await ProjectPicker._refreshList();

            // Also refresh main UI in case we switched current project
            A.UI.refresh();

            A.UI.Toast.show('Project deleted', 'info');
        },

        /**
         * Import a project from file
         */
        _importProject: async function (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.meta) data.meta = {};
                    const importName = data.meta.name || 'Untitled Project';

                    // Check for existing project with same name
                    const projects = await A.ProjectDB.list();
                    const existing = projects.find(p => p.name.toLowerCase() === importName.toLowerCase());

                    if (existing) {
                        // Prompt user: replace or create copy?
                        const choice = confirm(
                            `A project named "${importName}" already exists.\n\n` +
                            `Click OK to UPDATE the existing project.\n` +
                            `Click Cancel to create a COPY instead.`
                        );

                        if (choice) {
                            // Replace existing - use same ID
                            data.meta.id = existing.id;
                        } else {
                            // Create copy - check capacity first
                            const isFull = await A.ProjectDB.isFull();
                            if (isFull) {
                                A.UI.Toast.show('Project slots full. Delete a project first.', 'warning');
                                return;
                            }
                            data.meta.id = A.ProjectDB.generateId();
                            data.meta.name = importName + ' (Copy)';
                        }
                    } else {
                        // New project - check capacity
                        const isFull = await A.ProjectDB.isFull();
                        if (isFull) {
                            A.UI.Toast.show('Project slots full. Delete a project first.', 'warning');
                            return;
                        }
                        data.meta.id = A.ProjectDB.generateId();
                    }

                    // Save current first
                    await A.ProjectDB.save(A.State.get());

                    // Save imported project
                    await A.ProjectDB.save(data);

                    // Load it
                    A.State.load(data);

                    // Refresh
                    A.UI.Modal.close();
                    A.UI.refresh();

                    const action = existing && data.meta.id === existing.id ? 'Updated' : 'Imported';
                    A.UI.Toast.show(`${action} "${data.meta.name}"`, 'success');

                } catch (err) {
                    console.error('[ProjectPicker] Import failed:', err);
                    A.UI.Toast.show('Failed to import project', 'error');
                }
            };
            reader.readAsText(file);
        },

        /**
         * Format timestamp as relative time
         */
        _formatTimeAgo: function (timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);

            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

            return new Date(timestamp).toLocaleDateString();
        },

        /**
         * Escape HTML entities
         */
        _escapeHtml: function (str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    A.ProjectPicker = ProjectPicker;

})(window.Anansi);
