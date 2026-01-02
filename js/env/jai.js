/*
 * Anansi Adapter: JanitorAI
 * File: js/env/jai.js
 */

(function (A) {
    'use strict';

    // Default sources (Ported from ScriptBuilder 3000 reference)
    const defaults = [
        // Character Group
        { id: 'character.name', label: 'Character Name', kind: 'context', access: 'read', defaultValue: 'Anansi' },
        { id: 'character.chatName', label: 'Chat Name', kind: 'context', access: 'read', defaultValue: 'Anansi' },
        { id: 'character.exampleDialogs', label: 'Example Dialogs', kind: 'context', access: 'readWrite', defaultValue: '' },
        { id: 'character.personality', label: 'Personality', kind: 'context', access: 'readWrite', defaultValue: '' },
        { id: 'character.scenario', label: 'Scenario', kind: 'context', access: 'readWrite', defaultValue: '' },
        { id: 'character.customPromptComplete', label: 'Custom Prompt Complete', kind: 'context', access: 'read', defaultValue: '' },

        // Chat Group
        { id: 'chat.lastMessage', label: 'Last Message', kind: 'context', access: 'read', defaultValue: '' },
        { id: 'chat.lastMessages', label: 'Last Messages (Array)', kind: 'context', access: 'read', defaultValue: [] },
        { id: 'chat.firstMessageDate', label: 'First Message Date', kind: 'context', access: 'read', defaultValue: null },
        { id: 'chat.lastBotMessageDate', label: 'Last Bot Message Date', kind: 'context', access: 'read', defaultValue: null },
        { id: 'chat.messageCount', label: 'Message Count', kind: 'context', access: 'read', defaultValue: 0 },
        { id: 'chat.contextLength', label: 'Context Length', kind: 'context', access: 'read', defaultValue: 0 },
        { id: 'chat.userName', label: 'User Name', kind: 'context', access: 'read', defaultValue: 'User' },
        { id: 'chat.personaName', label: 'Persona Name', kind: 'context', access: 'read', defaultValue: 'Persona' }
    ];

    const JAI = {
        meta: {
            id: 'jai',
            name: 'JanitorAI',
            version: '1.0.0'
        },

        getDefaultSources: function () {
            return defaults;
        }
    };

    A.Adapters = A.Adapters || {};
    A.Adapters['jai'] = JAI;

    console.log('[Env] JAI Adapter registered.');

})(window.Anansi);
