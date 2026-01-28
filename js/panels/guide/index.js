/*
 * Anansi Panel: Platform Guide
 * File: js/panels/guide.js
 */

(function (A) {
    'use strict';

    function render(container) {
        container.className = 'panel-container h-full scroll-y p-lg';

        container.innerHTML = `
            <div style="max-width: 800px;" class="mx-auto">
                <h1 class="font-serif border-b pb-md mb-lg text-accent text-xl font-bold">
                    Platform Export Guides
                </h1>

                <p class="text-secondary mb-lg">
                    Learn how to export your Anansi project for various AI platforms.  
                    Note that Anansi may exceed the native capabilities of some runtimes; export methods reflect best-fit compatibility.
                </p>

                <!-- SillyTavern / Agnaistic -->
                <div class="card mb-lg">
                    <div class="card-header">
                        <div class="flex-row gap-md">
                            <div class="w-8 h-8 bg-elevated rounded-sm center-content font-bold text-secondary">ST</div>
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
                <div class="card mb-lg">
                    <div class="card-header">
                        <div class="flex-row gap-md">
                            <div class="w-8 h-8 bg-elevated rounded-sm center-content font-bold text-secondary">JAI</div>
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
                <div class="card mb-lg">
                    <div class="card-header">
                        <div class="flex-row gap-md">
                            <div class="w-8 h-8 bg-elevated rounded-sm center-content font-bold text-secondary">CH</div>
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
        render: render
    });

})(window.Anansi);
