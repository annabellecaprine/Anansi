/*
 * World Weaver: Entry Point
 * File: js/panels/world_weaver/index.js
 */

(function (A) {
    'use strict';

    if (!A.WorldWeaver || !A.WorldWeaver.UI) {
        console.error('[WorldWeaver] Failed to load dependencies. Panel not registered.');
        return;
    }

    A.registerPanel('world_weaver', {
        label: 'World Weaver',
        icon: '🕸️',
        render: A.WorldWeaver.UI.render
    });

    console.log('[WorldWeaver] Panel registered successfully.');

})(window.Anansi);
