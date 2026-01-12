/*
 * Anansi UI - Reusable Components
 * File: js/core/ui-components.js
 * Purpose: Shared UI components like TagInput, EmptyState, and GlobalOverviewLens.
 * Extracted from ui.js for better maintainability.
 */

(function (A) {
    'use strict';

    // Ensure UI namespace exists
    if (!A.UI) A.UI = {};

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

    // --- Empty State Utility ---
    A.UI.getEmptyStateHTML = function (title, message, actionLabel, actionOnClickStr) {
        // actionOnClickStr should be a string for inline onclick, e.g., "Anansi.UI.switchPanel('actors')"
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
    A.UI.Components = A.UI.Components || {};

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
                label.className = 'form-label';
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
