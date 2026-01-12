/*
 * Anansi UI - Modal & Toast Utilities
 * File: js/core/ui-modal.js
 * Purpose: Modal dialogs, toast notifications, and button flash helpers.
 * Extracted from ui.js for better maintainability.
 */

(function (A) {
    'use strict';

    // Ensure UI namespace exists
    if (!A.UI) A.UI = {};

    // --- Modal Utility ---
    A.UI.Modal = {
        show: function (config) {
            // config: { title, content, actions: [{label, class, onclick}], onClose, width, height }
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);';

            const modal = document.createElement('div');
            modal.className = 'card modal-content';
            modal.style = `width:${config.width || 480}px; max-width:90%; position:relative; box-shadow:var(--shadow-soft);`;

            // Handle content as string or DOM element
            const contentIsElement = config.content instanceof HTMLElement;
            const bodyStyle = config.height
                ? `height:${config.height}; overflow:hidden;`
                : `max-height:70vh; overflow-y:auto;`;

            modal.innerHTML = `
                <div class="card-header">
                    <strong>${config.title || 'Dialog'}</strong>
                    <button class="btn btn-ghost btn-sm" id="modal-close-x">&times;</button>
                </div>
                <div class="card-body modal-body" style="${bodyStyle}">
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

})(window.Anansi);
