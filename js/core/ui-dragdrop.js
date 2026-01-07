/*
 * Anansi Core: Drag-Drop Helper
 * File: js/core/ui-dragdrop.js
 * Purpose: Reusable drag-and-drop image upload functionality
 */

(function (A) {
    'use strict';

    if (!A.UI) A.UI = {};

    /**
     * Make an element accept dropped images
     * @param {HTMLElement} element - The drop target
     * @param {Object} options - Configuration
     * @param {Function} options.onDrop - Callback receiving File[] of dropped images
     * @param {string} [options.accept='image/*'] - MIME type filter
     */
    A.UI.makeDraggable = function (element, options = {}) {
        if (!element) return;

        const accept = options.accept || 'image/';

        element.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.add('drag-over');
        };

        element.ondragleave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-over');
        };

        element.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-over');

            const files = [...e.dataTransfer.files].filter(f => f.type.startsWith(accept));

            if (files.length && options.onDrop) {
                options.onDrop(files);
            }
        };
    };

})(window.Anansi);
