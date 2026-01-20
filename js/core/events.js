/*
 * Anansi Events
 * File: js/core/events.js
 * Purpose: Application-wide Event Bus for decoupled communication.
 * 
 * Provides a publish/subscribe pattern for cross-module events,
 * reducing direct coupling between panels and components.
 */

(function (A) {
    'use strict';

    /** @type {Object<string, Function[]>} */
    const listeners = {};

    /**
     * Event Bus singleton.
     * Enables decoupled communication between application modules.
     * @namespace
     */
    const Events = {
        /**
         * Subscribe to an event.
         * @param {string} eventName - Name of the event to listen for
         * @param {Function} callback - Function to call when event fires
         * @returns {Function} Unsubscribe function
         */
        on: function (eventName, callback) {
            if (!listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(callback);

            // Return unsubscribe function
            return () => this.off(eventName, callback);
        },

        /**
         * Subscribe to an event, but only fire once.
         * @param {string} eventName - Name of the event to listen for
         * @param {Function} callback - Function to call when event fires
         * @returns {Function} Unsubscribe function
         */
        once: function (eventName, callback) {
            const wrapper = (data) => {
                callback(data);
                this.off(eventName, wrapper);
            };
            return this.on(eventName, wrapper);
        },

        /**
         * Unsubscribe from an event.
         * @param {string} eventName - Name of the event
         * @param {Function} callback - The callback to remove
         */
        off: function (eventName, callback) {
            if (!listeners[eventName]) return;

            const index = listeners[eventName].indexOf(callback);
            if (index > -1) {
                listeners[eventName].splice(index, 1);
            }
        },

        /**
         * Emit an event to all subscribers.
         * @param {string} eventName - Name of the event to fire
         * @param {*} [data] - Optional data to pass to subscribers
         */
        emit: function (eventName, data) {
            if (!listeners[eventName]) return;

            // Create a copy to avoid issues if listeners modify the array
            const callbacks = [...listeners[eventName]];
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`[Events] Error in listener for '${eventName}':`, err);
                }
            });
        },

        /**
         * Remove all listeners for a specific event (or all events).
         * @param {string} [eventName] - Optional event name. If omitted, clears all.
         */
        clear: function (eventName) {
            if (eventName) {
                delete listeners[eventName];
            } else {
                Object.keys(listeners).forEach(key => delete listeners[key]);
            }
        },

        /**
         * Debug: Get count of listeners for an event.
         * @param {string} eventName - Event name to check
         * @returns {number} Number of active listeners
         */
        listenerCount: function (eventName) {
            return listeners[eventName]?.length || 0;
        }
    };

    // Standard event names for documentation
    /**
     * Standard Anansi Events:
     * - 'actor:created' - New actor added
     * - 'actor:updated' - Actor was modified
     * - 'actor:deleted' - Actor was removed
     * - 'lorebook:updated' - Lorebook entry changed
     * - 'panel:switched' - Navigation occurred
     * - 'project:loaded' - New project loaded
     * - 'project:saved' - Project saved
     * - 'vault:synced' - Vault sync completed
     */

    A.Events = Events;

    // @ts-ignore - Anansi is a global defined in anansi.js
})(window.Anansi);
