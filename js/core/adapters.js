/*
 * Anansi Core: Adapters
 * File: js/core/adapters.js
 * Purpose: Define environment adapters for default sources.
 */

(function (A) {
    'use strict';

    A.Adapters = {
        'jai': {
            id: 'jai',
            name: 'JAI Environment',
            getDefaultSources: function () {
                return [
                    { id: 'cam_main', label: 'Main Camera', kind: 'video', access: 'read-only', enabled: true },
                    { id: 'mic_main', label: 'Microphone', kind: 'audio', access: 'read-only', enabled: true },
                    { id: 'screen_main', label: 'Screen Share', kind: 'video', access: 'read-only', enabled: false }
                ];
            }
        }
    };

})(window.Anansi);
