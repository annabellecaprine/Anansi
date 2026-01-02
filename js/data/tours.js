/*
 * Anansi Tour Configuration
 * File: js/data/tours.js
 * Purpose: Content definitions for the guided tour system.
 */

(function (A) {
    'use strict';

    if (!A.UI || !A.UI.Tour) return;

    // --- Project Dashboard ---
    A.UI.Tour.register('project', [
        {
            target: '#nav-container',
            title: 'Welcome to Anansi',
            content: 'This is your navigation hub. Panels are organized by function: <strong>Loom</strong> (Settings), <strong>Seeds</strong> (Entities), <strong>Weave</strong> (Content), and <strong>Magic</strong> (Runtime).'
        },
        {
            target: '#display-env-badge',
            title: 'Environment Control',
            content: 'Shows your current environment (Local/Cloud). Sync status and integrity warnings appear here.'
        },
        {
            target: '#btn-toggle-lens',
            title: 'Web Lens',
            content: 'Toggle the <strong>Mission Control</strong> sidebar. This lens gives you real-time metrics on your project, including active voices, logic counts, and event listeners.'
        },
        {
            target: '#btn-help',
            title: 'Help & Tours',
            content: 'Click this button on any panel to start a guided tour specific to that tool.'
        }
    ]);

    // --- Actors Panel ---
    A.UI.Tour.register('actors', [
        {
            target: '#actor-list',
            title: 'Actor Registry',
            content: 'Manage your cast of characters here. Characters created here are automatically available in the <strong>Voices</strong> panel.'
        },
        {
            target: '#btn-add-actor',
            title: 'Create Actor',
            content: 'Add a new character entity. IDs are auto-generated.'
        },
        {
            target: '.tab-btn[data-tab="profile"]',
            title: 'Profile & Smart Tags',
            content: 'Use the <strong>Smart Tag</strong> inputs to add Keywords and Quirks. Type a tag and hit Enter or Comma. Click the &times; on a tag to remove it.'
        },
        {
            target: '.tab-btn[data-tab="cues"]',
            title: 'Emotional Cues',
            content: 'Define how this actor physically expresses emotions (Ears, Tail, etc). These drive the simulation description logic.'
        }
    ]);

    // --- Voices Panel ---
    A.UI.Tour.register('voices', [
        {
            target: '#voice-list',
            title: 'The Choir',
            content: 'Runtime data for dialogue injection. Voices tag onto characters to provide unique speech patterns.'
        },
        {
            target: '.v-sec:nth-of-type(2)', // Targeting Context Phrases section
            title: 'Context Phrases',
            content: 'New <strong>Smart Lists</strong> allow you to easily manage Soft Phrases, Teaching Phrases, and other context-aware dialogue injections. Just type and Enter.'
        },
        {
            target: '#subtone-list',
            title: 'Subtones',
            content: 'Subtones are specific variations of a voice (e.g., "Sarcastic", "Whisper"). They are selected based on probability weights during generation.'
        }
    ]);

    // --- Lorebook Panel ---
    A.UI.Tour.register('lorebook', [
        {
            target: '#lore-list',
            title: 'Lore Entries',
            content: 'The database of world knowledge. Entries are injected into context when their keywords are triggered.'
        },
        {
            target: '.l-col:nth-child(2)',
            title: 'Smart Activation',
            content: 'Manage <strong>Keywords</strong> (triggers) and <strong>Tags</strong> (metadata) using the smart pill editor.'
        },
        {
            target: '#btn-add-shift',
            title: 'Logic Shifts',
            content: 'Advanced: Add logic gates (EROS, Intent, Emotion) that must pass for this entry to be active.'
        }
    ]);

})(window.Anansi);
