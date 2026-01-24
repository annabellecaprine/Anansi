/*
 * Anansi Tour System
 * File: js/core/tour.js
 * Purpose: Guided help tours for panels.
 */

(function (A) {
    'use strict';

    const Tour = {
        active: false,
        currentStep: 0,
        currentConfig: null,
        els: {},

        activePanelId: null, // Track which panel we are touring

        // --- Configuration Registry ---
        // Populated by panel modules or defined here centrally
        configs: {},

        register: function (panelId, steps) {
            this.configs[panelId] = steps;
        },

        // --- Lifecycle ---
        start: function (panelId) {
            const config = this.configs[panelId];
            if (!config || !config.length) {
                if (A.UI.Toast) A.UI.Toast.show(`No tour available for panel: "${panelId}"`, 'warning');
                return;
            }

            this.activePanelId = panelId;
            this.currentConfig = config;
            this.currentStep = 0;
            this.active = true;

            this.createOverlay();
            this.renderStep();

            // Add global key listener for Escape
            document.addEventListener('keydown', this.handleKey);
            window.addEventListener('resize', this.handleResize);
            window.addEventListener('scroll', this.handleScroll, { capture: true });
        },

        end: function () {
            this.active = false;
            this.currentConfig = null;
            this.currentStep = 0;
            this.removeOverlay();
            document.removeEventListener('keydown', this.handleKey);
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('scroll', this.handleScroll, { capture: true });
        },

        // --- Rendering ---
        createOverlay: function () {
            if (this.els.overlay) return;

            // 1. Dimmed Background
            const overlay = document.createElement('div');
            overlay.className = 'tour-overlay';

            // 2. Highlight Box (The "cutout" or glow frame)
            const highlight = document.createElement('div');
            highlight.className = 'tour-highlight';

            // 3. Popup Card
            const popup = document.createElement('div');
            popup.className = 'tour-popup card'; // Reuse 'card' styling base
            popup.innerHTML = `
                <div class="tour-header">
                    <strong id="tour-step-title"></strong>
                    <button class="btn btn-ghost btn-sm" id="tour-close-x">&times;</button>
                </div>
                <div class="tour-body" id="tour-step-content"></div>
                <div class="tour-footer">
                    <span id="tour-step-counter" class="text-muted" style="font-size:11px;"></span>
                    <div class="tour-actions">
                        <button class="btn btn-secondary btn-sm" id="tour-btn-prev">Previous</button>
                        <button class="btn btn-primary btn-sm" id="tour-btn-next">Next</button>
                    </div>
                </div>
            `;

            // Append
            overlay.appendChild(highlight);
            overlay.appendChild(popup);
            document.body.appendChild(overlay);

            // Bindings
            /** @type {HTMLElement} */ (popup.querySelector('#tour-close-x')).onclick = () => this.end();
            /** @type {HTMLElement} */ (popup.querySelector('#tour-btn-prev')).onclick = () => this.prev();
            /** @type {HTMLElement} */ (popup.querySelector('#tour-btn-next')).onclick = () => this.next();

            // Allow clicking overlay to exit? Maybe safer to require explicit exit
            // overlay.onclick = (e) => { if (e.target === overlay) this.end(); };

            this.els = { overlay, highlight, popup };

            // Re-bind internal refs
            this.els.title = popup.querySelector('#tour-step-title');
            this.els.content = popup.querySelector('#tour-step-content');
            this.els.counter = popup.querySelector('#tour-step-counter');
            this.els.btnPrev = popup.querySelector('#tour-btn-prev');
            this.els.btnNext = popup.querySelector('#tour-btn-next');
        },

        removeOverlay: function () {
            if (this.els.overlay && this.els.overlay.parentNode) {
                this.els.overlay.parentNode.removeChild(this.els.overlay);
            }
            this.els = {};
        },

        renderStep: function () {
            if (!this.active || !this.currentConfig) return;

            const step = this.currentConfig[this.currentStep];

            // Update Content
            this.els.title.textContent = step.title;
            this.els.content.innerHTML = step.content;
            this.els.counter.textContent = `${this.currentStep + 1} of ${this.currentConfig.length}`;

            // Button States
            this.els.btnPrev.disabled = this.currentStep === 0;
            this.els.btnNext.textContent = this.currentStep === this.currentConfig.length - 1 ? 'Finish' : 'Next';

            // Positioning
            this.positionOverlay(step.target);
        },

        positionOverlay: function (selector) {
            const target = document.querySelector(selector);

            if (!target) {
                // If target not found, center popup and hide highlight
                this.els.highlight.style.opacity = '0';
                this.centerPopup();
                return;
            }

            // Scroll into view (use auto to ensure rect is calculated correctly immediately)
            target.scrollIntoView({ behavior: 'auto', block: 'center' });

            // WAIT for scroll to finish layout
            // We use setTimeout + rAF to ensure browser has repainted
            setTimeout(() => {
                requestAnimationFrame(() => {
                    const rect = target.getBoundingClientRect();

                    // Highlight Box
                    // Add some padding
                    const pad = 4;
                    this.els.highlight.style.width = (rect.width + pad * 2) + 'px';
                    this.els.highlight.style.height = (rect.height + pad * 2) + 'px';
                    this.els.highlight.style.top = (rect.top - pad) + 'px';
                    this.els.highlight.style.left = (rect.left - pad) + 'px';
                    this.els.highlight.style.opacity = '1';

                    // Popup placement logic (Recalculate logic here or delegate)
                    this.positionPopup(rect);
                });
            }, 10);
        },

        positionPopup: function (rect) {
            const popupRect = this.els.popup.getBoundingClientRect();
            const margin = 12;

            const viewW = window.innerWidth;
            const viewH = window.innerHeight;

            let top, left;

            // Try Bottom
            if (rect.bottom + popupRect.height + margin < viewH) {
                top = rect.bottom + margin;
                left = rect.left; // align left edge
                // Clamp left
                if (left + popupRect.width > viewW) left = viewW - popupRect.width - margin;
            }
            // Try Top
            else if (rect.top - popupRect.height - margin > 0) {
                top = rect.top - popupRect.height - margin;
                left = rect.left;
                if (left + popupRect.width > viewW) left = viewW - popupRect.width - margin;
            }
            // Try Right
            else if (rect.right + popupRect.width + margin < viewW) {
                top = rect.top;
                left = rect.right + margin;
            }
            // Fallback: Center
            else {
                this.centerPopup();
                return;
            }

            this.els.popup.style.top = top + 'px';
            this.els.popup.style.left = left + 'px';
            this.els.popup.style.transform = 'none'; // remove centering transform
        },

        centerPopup: function () {
            this.els.popup.style.top = '50%';
            this.els.popup.style.left = '50%';
            this.els.popup.style.transform = 'translate(-50%, -50%)';
        },

        // --- Navigation ---
        next: function () {
            if (this.currentStep < this.currentConfig.length - 1) {
                this.currentStep++;
                this.renderStep();
            } else {
                this.end();
            }
        },

        prev: function () {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.renderStep();
            }
        },

        // --- Event Handlers ---
        handleKey: function (e) {
            if (e.key === 'Escape') {
                Tour.end();
            } else if (e.key === 'ArrowRight') {
                Tour.next();
            } else if (e.key === 'ArrowLeft') {
                Tour.prev();
            }
        },

        handleResize: function () {
            if (Tour.active) Tour.renderStep(); // Recalculate positions
        },

        handleScroll: function () {
            if (Tour.active) {
                // Throttle? For now, raw call is fine as renderStep is cheap (mostly DOM reads)
                // or we could use rAF here too.
                requestAnimationFrame(() => {
                    if (Tour.active && Tour.currentConfig) {
                        // We just need to reposition, not re-render text
                        // But renderStep calls positionOverlay, so it's simplest to reuse
                        Tour.renderStep();
                    }
                });
            }
        }
    };

    // Bind handleKey/Resize context
    Tour.handleKey = Tour.handleKey.bind(Tour);
    Tour.handleResize = Tour.handleResize.bind(Tour);
    Tour.handleScroll = Tour.handleScroll.bind(Tour);

    A.UI.Tour = Tour;

})(window.Anansi);
