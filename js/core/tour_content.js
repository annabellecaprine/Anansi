/*
 * Anansi Tour Content
 * File: js/core/tour_content.js
 * Purpose: Configuration steps for panel help tours.
 */

(function (A) {
    'use strict';

    if (!A.UI.Tour) return;

    // --- Standard Panels ---

    A.UI.Tour.register('project', [
        {
            target: '#inp-proj-name',
            title: 'Project Details',
            content: 'Define the core identity of your project here. The Project Name and Author fields are used for metadata export.'
        },
        {
            target: '#sel-env',
            title: 'Target Environment',
            content: 'Select the AI backend or platform you are targeting (e.g., JAI, Oobabooga). This adjusts how scripts are formatted.'
        },
        {
            target: '#project-integrity-summary',
            title: 'Project Integrity',
            content: 'A quick health check of your project. It warns you about missing dependencies, broken references, or validation errors.'
        },
        {
            target: '#btn-save',
            title: 'Save & Persist',
            content: 'Don\'t forget to save your work! Anansi saves to your browser\'s local storage, but you should also Export regularly.'
        }
    ]);

    A.UI.Tour.register('sources', [
        {
            target: '.card-body',
            title: 'Data Sources',
            content: 'Manage external text data or static lore files here. Sources can be referenced by the Lorebook or Script engine.'
        }
    ]);

    A.UI.Tour.register('character', [
        {
            target: '#char-charname',
            title: 'Character Identity',
            content: '<b>Character Name</b> is the full display name of your bot.<br><b>Chat Name</b> is the short name used in chat prefixes (e.g., "Anansi: Hello").'
        },
        {
            target: '#quill-persona',
            title: 'Persona',
            content: 'The core personality description. This is the "soul" of your character—who they are, how they think, and their background.'
        },
        {
            target: '#char-examples',
            title: 'Dialogue Examples',
            content: 'Provide few-shot examples of how the character speaks. This is crucial for guiding the AI\'s tone and style.'
        }
    ]);

    A.UI.Tour.register('actors', [
        {
            target: '.list-col',
            title: 'Actors Roster',
            content: 'Manage the cast of characters in your story. Select an actor to edit their details.'
        },
        {
            target: '#inp-name',
            title: 'Actor Profile',
            content: 'Define the actor\'s name and role. The <b>Profile</b> tab holds personality quirks and personal notes.'
        },
        {
            target: '[data-tab="appearance"]',
            title: 'Appearance',
            content: 'Describe physical traits. The <b>Description</b> field allows for open-ended notes that are included in generation.'
        },
        {
            target: '[data-tab="cues"]',
            title: 'Microcues',
            content: 'Cues are small behavioral scripts triggered by this actor. They are synced automatically to the Microcues panel.'
        }
    ]);

    A.UI.Tour.register('voices', [
        {
            target: '.list-col',
            title: 'Voice Profiles',
            content: 'Voices define <i>how</i> a character speaks. Valid for both the main character and NPCs.'
        },
        {
            target: '#inp-charname',
            title: 'Naming',
            content: '<b>Character Name</b> is the internal reference.<br><b>Chat Name</b> is what appears in the chat log.'
        },
        {
            target: '#inp-base',
            title: 'Rails',
            content: '<b>Rails</b> (Baseline & Cadence) are high-priority instructions that "railroad" the model into a specific speaking style.'
        },
        {
            target: '#subtone-list',
            title: 'Subtones',
            content: 'Subtones are variations of the voice (e.g., "Whispering", "Shouting"). The engine picks one based on probability or context.'
        }
    ]);

    A.UI.Tour.register('microcues', [
        {
            target: '#cue-list',
            title: 'Microcues List',
            content: 'Small, conditional snippets of text injected into the prompt. <b>Gate Pills</b> show when they trigger (e.g., specific Emotions or Actors).'
        },
        {
            target: '.card-header',
            title: 'Auto-Generation',
            content: 'Most cues here are automatically generated from your Actors and Voices. You generally don\'t need to create them manually.'
        },
        {
            target: '#btn-view-script',
            title: 'Script Sync',
            content: 'Microcues are compiled into a script. Click here to verify the generated code.'
        }
    ]);

    A.UI.Tour.register('tokens', [
        {
            target: '.card-body',
            title: 'Token Analysis',
            content: 'Estimate the cost and size of your prompt. Useful for optimizing context usage.'
        }
    ]);

    A.UI.Tour.register('simulator', [
        {
            target: '#sim-chat-window',
            title: 'Chat Simulation',
            content: 'Test your bot in a safe sandbox. Use the input box below to send messages.'
        },
        {
            target: '#sim-controls',
            title: 'Controls',
            content: '<b>Regenerate</b> the last reply or <b>Reset</b> the conversation to start fresh.'
        },
        {
            target: '#api-settings', // Assuming ID exists or fallback
            title: 'API Settings',
            content: 'Configure your connection to the LLM (API Key, URL, Model). Settings are saved locally.'
        }
    ]);

    // --- Priority Panels ---

    A.UI.Tour.register('lorebook', [
        {
            target: '#btn-add-lore',
            title: 'Lore Entries',
            content: 'Create world info entries here. Each entry holds knowledge that is injected when relevant <b>Keywords</b> are found.'
        },
        {
            target: '#inp-keys',
            title: 'Keywords',
            content: 'Triggers for this entry. If a user message contains these words, the entry is activated.'
        },
        {
            target: '#btn-logic',
            title: 'Advanced Logic',
            content: 'Click <b>Logic</b> to access advanced Gates (Entity, Emotion, Intent) and Tag rules (Required/Blocked tags).'
        },
        {
            target: '#btn-add-shift', // Found in grep
            title: 'Shifts',
            content: '<b>Shifts</b> are dynamic updates. They can change the entry\'s text based on Time, Location, or Relationship status.'
        }
    ]);

    A.UI.Tour.register('scoring', [
        {
            target: '#btn-add',
            title: 'Scoring Topics',
            content: 'Topics track specific concepts (e.g., "Talking about Magic"). They accumulate points when keywords frame usage.'
        },
        {
            target: '#inp-min',
            title: 'Triggers & Limits',
            content: '<b>Min Events</b>: How many times keywords must appear to activate.<br><b>Scan Depth</b>: How far back in chat history to look.'
        },
        {
            target: '#tab-adv', // Verified tab ID
            title: 'Advanced & Rewards',
            content: 'Use the <b>Advanced</b> tab to create Combined Conditions (Tag logic) and configure <b>Rewards</b> (actions dependent on score).'
        }
    ]);

    A.UI.Tour.register('advanced', [
        {
            target: '#side-list',
            title: 'Custom Rules',
            content: 'The Logic Engine! Create complex "If This Then That" behaviors for your bot here.'
        },
        {
            target: '#tab-rules',
            title: 'Rule Mode',
            content: 'Ensure you are in the <b>Rules</b> tab to define behavioral scripts. Lists and Derived Stats are helper tools.'
        },
        {
            target: '#btn-add-side',
            title: 'Creating Items',
            content: 'Click here to add a new Rule, List, or Stat depending on the active tab.'
        },
        {
            target: '#main-name',
            title: 'Rule Definition',
            content: 'Once a rule is selected, define its <b>Conditions</b> (Triggers) and <b>Actions</b> (Effects) in the main editor area.'
        }
    ]);

    A.UI.Tour.register('scripts', [
        {
            target: '#script-list-col',
            title: 'Script Registry',
            content: 'All executable code lives here. You will see both your manual scripts and system-generated ones.'
        },
        {
            target: '.script-item.locked', // assuming class
            title: 'Generated Scripts',
            content: '<b>Note:</b> Scripts named `AURA`, `VOICES`, or `LORE` are <b>Auto-Generated</b>. Do not edit them here; they will be overwritten. Edit the source panel instead.'
        },
        {
            target: '#btn-add-script',
            title: 'Manual Scripts',
            content: 'You can write custom JavaScript here for unique behaviors that aren\'t covered by the other panels.',
            position: 'right'
        },
        {
            target: '#monaco-container', // Editor ID
            title: 'Code Editor',
            content: 'Use the Monaco editor to write your logic. The `context` object gives you access to chat history, actors, and state.'
        }
    ]);

    // Placeholders for others
    A.UI.Tour.register('events', [{ target: '.card-body', title: 'Events', content: 'Define scheduled or random events here.' }]);
    A.UI.Tour.register('tester', [{ target: '.card-body', title: 'Tester', content: 'A unit testing workbench for specific rule conditions.' }]);
    A.UI.Tour.register('validator', [{ target: '.card-body', title: 'Validator', content: 'Run deep integrity checks on your project to find hidden errors.' }]);

})(window.Anansi);
