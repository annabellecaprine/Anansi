/*
 * Anansi Panel: Platform Guide
 * File: js/panels/guide.js
 */

(function (A) {
    'use strict';

    function render(container) {
        container.style.padding = 'var(--space-6)';
        container.style.height = '100%';
        container.style.overflowY = 'auto'; // Native scrolling

        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <h1 style="font-family: var(--font-serif); border-bottom: 2px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 24px; color: var(--accent-primary);">
                    Platform Export Guides
                </h1>

                <p style="color: var(--text-secondary); margin-bottom: 32px;">
                    Learn how to export your Anansi project for various AI platforms.  
                    Note that Anansi may exceed the native capabilities of some runtimes; export methods reflect best-fit compatibility.
                </p>

                <!-- SillyTavern / Agnaistic -->
                <div class="card" style="margin-bottom: 32px;">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 32px;
                                height: 32px;
                                background: var(--bg-elevated);
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: var(--accent-secondary);
                            ">ST</div>
                            <strong>SillyTavern / Agnaistic</strong>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="
                            background: rgba(124, 108, 255, 0.1);
                            border-left: 3px solid var(--accent-primary);
                            padding: 12px;
                            font-size: 13px;
                            border-radius: 4px;
                            margin-bottom: 16px;
                        ">
                            Best for V2 Character Card import and metadata preservation.
                        </div>
                        <ol style="padding-left: 20px; line-height: 1.6; font-size: 14px; color: var(--text-main);">
                            <li>Click the <strong>Export</strong> button in the Top Bar.</li>
                            <li>Select <strong>V2 Character Card (.png)</strong>.</li>
                            <li>Save the PNG image to your device.</li>
                            <li>
                                Import the PNG into SillyTavern or Agnaistic.
                                Character data and associated lore are embedded as metadata.
                            </li>
                            <li style="margin-top: 8px; font-style: italic;">
                                Note: Embedded scripts may be preserved for reference, but execution depends on platform support and configuration.
                            </li>
                        </ol>
                    </div>
                </div>

                <!-- JanitorAI -->
                <div class="card" style="margin-bottom: 32px;">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 32px;
                                height: 32px;
                                background: var(--bg-elevated);
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: var(--accent-secondary);
                            ">JAI</div>
                            <strong>JanitorAI</strong>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="
                            background: rgba(124, 108, 255, 0.1);
                            border-left: 3px solid var(--accent-primary);
                            padding: 12px;
                            font-size: 13px;
                            border-radius: 4px;
                            margin-bottom: 16px;
                        ">
                            Recommended Method: Scripts (Beta) Upload
                        </div>
                        <ol style="padding-left: 20px; line-height: 1.6; font-size: 14px; color: var(--text-main);">
                            <li>Create your JanitorAI character as normal.</li>
                            <li>
                                In Anansi, open the <strong>Scripts</strong> panel and export
                                <strong>All Scripts</strong> as a ZIP.
                            </li>
                            <li>On JanitorAI, open <strong>Scripts (Beta)</strong>.</li>
                            <li>Upload the exported ZIP from Anansi.</li>
                            <li>
                                Attach the uploaded scripts to your character in the exact order
                                listed in the <code>README.txt</code> included in the ZIP.
                            </li>
                        </ol>
                        <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary); opacity: 0.85;">
                            Tip: Script order matters. Later scripts may depend on state created by earlier ones.
                        </div>
                    </div>
                </div>

                <!-- Chub.ai -->
                <div class="card" style="margin-bottom: 32px;">
                    <div class="card-header">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 32px;
                                height: 32px;
                                background: var(--bg-elevated);
                                border-radius: 4px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: var(--accent-secondary);
                            ">CH</div>
                            <strong>Chub.ai</strong>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="
                            background: rgba(124, 108, 255, 0.1);
                            border-left: 3px solid var(--accent-primary);
                            padding: 12px;
                            font-size: 13px;
                            border-radius: 4px;
                            margin-bottom: 16px;
                        ">
                            Lorebook Sharing
                        </div>
                        <ol style="padding-left: 20px; line-height: 1.6; font-size: 14px; color: var(--text-main);">
                            <li>Open the <strong>Lorebook</strong> panel in Anansi.</li>
                            <li>Click the <strong>Export</strong> button in the footer.</li>
                            <li>Select <strong>JSON (Standard)</strong>.</li>
                            <li>
                                On Chub.ai, use the <strong>Import Lorebook</strong> feature
                                and select your exported JSON file.
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
    }

    A.registerPanel('guide', {
        label: 'Platform Guides',
        subtitle: 'Export Instructions',
        category: 'Loom',
        hidden: true,
        render: render
    });

})(window.Anansi);
