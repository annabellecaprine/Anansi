/*
 * Anansi Panel: Scripts
 * File: js/panels/scripts.js
 * Features: Upload, Download, Reorder, Monaco Editor
 */

(function (A) {
    'use strict';

    let currentScriptId = null;
    let monacoEditor = null;
    let searchTerm = ''; // Search Filter

    function render(container, context) {
        // Handle context for auto-selecting a script (e.g., from Voices panel)
        if (context) {
            if (context.selectScript) {
                currentScriptId = context.selectScript;
            }
            if (context.createNew) {
                setTimeout(() => {
                    const addBtn = container.querySelector('#btn-add-script');
                    if (addBtn) addBtn.click();
                }, 50);
            }
        }
        // Layout: Split Pane (List | Editor)
        container.style.height = '100%';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '280px 1fr';
        container.style.gap = 'var(--space-4)';
        container.style.overflow = 'hidden';

        // 1. Script List Column
        const listCol = document.createElement('div');
        listCol.className = 'card';
        listCol.style.display = 'flex';
        listCol.style.flexDirection = 'column';
        listCol.style.height = '100%';
        listCol.style.marginBottom = '0';

        const listHeader = document.createElement('div');
        listHeader.className = 'card-header';
        listHeader.style.flexDirection = 'column';
        listHeader.style.alignItems = 'stretch';
        listHeader.style.gap = '8px';

        listHeader.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>Scripts</strong>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-ghost btn-sm" id="btn-preview-aura" title="Preview AURA Export" style="color:var(--accent-secondary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              AURA
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-repo-script" title="Script Repository (Presets)" style="color:var(--accent-primary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-upload-script" title="Upload Script">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-add-script">+ New</button>
          </div>
      </div>
      <input class="input" id="search-scripts" placeholder="Filter scripts..." style="width:100%; font-size:12px; height:28px;" value="${searchTerm}">
    `;

        const listBody = document.createElement('div');
        listBody.className = 'card-body';
        listBody.style.padding = '0';
        listBody.style.flex = '1';
        listBody.style.overflowY = 'auto';
        listBody.id = 'script-list-container';

        listCol.appendChild(listHeader);
        listCol.appendChild(listBody);

        // Search Bind
        listHeader.querySelector('#search-scripts').oninput = (e) => {
            searchTerm = e.target.value.toLowerCase();
            refreshList();
        };

        // 2. Editor Column
        const editorCol = document.createElement('div');
        editorCol.className = 'card';
        editorCol.style.display = 'flex';
        editorCol.style.flexDirection = 'column';
        editorCol.style.height = '100%';
        editorCol.style.marginBottom = '0';

        const editorHeader = document.createElement('div');
        editorHeader.className = 'card-header';
        editorHeader.style.justifyContent = 'flex-start';
        editorHeader.style.gap = 'var(--space-3)';
        editorHeader.innerHTML = `
      <input type="text" id="script-name-input" class="input" style="width:200px; padding:2px 8px; height:24px;" placeholder="Script Name" disabled>
      <div style="flex:1;"></div>
      <button class="btn btn-ghost btn-sm" id="btn-download-script" title="Download Script" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-delete-script" title="Delete Script" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    `;

        const editorBody = document.createElement('div');
        editorBody.className = 'card-body';
        editorBody.style.flex = '1';
        editorBody.style.padding = '0';
        editorBody.style.position = 'relative';
        editorBody.style.overflow = 'hidden';
        editorBody.style.isolation = 'isolate'; // Create stacking context

        // Monaco container - with proper containment for widgets
        const monacoContainer = document.createElement('div');
        monacoContainer.id = 'monaco-editor-container';
        monacoContainer.style.width = '100%';
        monacoContainer.style.height = '100%';
        monacoContainer.style.position = 'absolute';
        monacoContainer.style.top = '0';
        monacoContainer.style.left = '0';
        monacoContainer.style.zIndex = '1';

        // Placeholder while Monaco loads
        const placeholder = document.createElement('div');
        placeholder.id = 'editor-placeholder';
        placeholder.style.padding = 'var(--space-6)';
        placeholder.style.color = 'var(--text-muted)';
        placeholder.style.fontStyle = 'italic';
        placeholder.textContent = 'Loading editor...';

        editorBody.appendChild(monacoContainer);
        editorBody.appendChild(placeholder);
        editorCol.appendChild(editorHeader);
        editorCol.appendChild(editorBody);

        container.appendChild(listCol);
        container.appendChild(editorCol);

        // --- Initialize Monaco ---
        function initMonaco() {
            if (typeof monaco === 'undefined') {
                // Wait for Monaco to load
                if (window.monacoReady) {
                    window.monacoReady.then(() => initMonaco());
                } else {
                    setTimeout(initMonaco, 100);
                }
                return;
            }

            placeholder.style.display = 'none';

            monacoEditor = monaco.editor.create(monacoContainer, {
                value: '',
                language: 'javascript',
                theme: 'anansi-dark',
                automaticLayout: true,

                // Appearance
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                lineNumbers: 'on',
                roundedSelection: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,

                // Layout
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8
                },
                padding: { top: 16, bottom: 12 },
                wordWrap: 'on',

                // IntelliSense & Suggestions
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                parameterHints: { enabled: true },
                suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showFunctions: true,
                    showVariables: true,
                    showClasses: true,
                    insertMode: 'replace',
                    filterGraceful: true,
                    preview: true
                },

                // Code Features
                folding: true,
                foldingHighlight: true,
                showFoldingControls: 'mouseover',
                matchBrackets: 'always',
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,

                // Editing Aids
                renderWhitespace: 'selection',
                renderLineHighlight: 'line',
                guides: {
                    indentation: true,
                    bracketPairs: true
                },
                colorDecorators: true,

                // Find/Replace
                find: {
                    addExtraSpaceOnTop: false,
                    autoFindInSelection: 'multiline',
                    seedSearchStringFromSelection: 'always'
                },

                // Context Menu
                contextmenu: true,

                // Widgets - FIX: Prevent overflow outside editor
                fixedOverflowWidgets: true,

                readOnly: true // Start disabled until script selected
            });

            // Handle content changes
            monacoEditor.onDidChangeModelContent(() => {
                if (currentScriptId && monacoEditor) {
                    A.Scripts.update(currentScriptId, {
                        source: { code: monacoEditor.getValue(), type: 'inline' }
                    });
                }
            });

            // If a script was already selected, load it
            if (currentScriptId) {
                const scripts = A.Scripts.getAll();
                const script = scripts.find(s => s.id === currentScriptId);
                if (script) {
                    monacoEditor.setValue(script.source.code);
                    monacoEditor.updateOptions({ readOnly: false });
                }
            }
        }

        initMonaco();

        // --- Logic ---

        function refreshList() {
            let scripts = A.Scripts.getAll();

            // Filter
            if (searchTerm) {
                scripts = scripts.filter(s => (s.name || '').toLowerCase().includes(searchTerm));
            }

            listBody.innerHTML = '';

            if (scripts.length === 0) {
                // Determine if it's a search result empty or total empty
                const isSearch = !!searchTerm;
                listBody.innerHTML = A.UI.getEmptyStateHTML(
                    isSearch ? 'No Matches Found' : 'No Scripts',
                    isSearch ? `No scripts matching "${searchTerm}"` : 'Manage your project scripts here.',
                    isSearch ? 'Clear Search' : 'Create New Script',
                    isSearch ? "document.getElementById('search-scripts').value = ''; document.getElementById('search-scripts').dispatchEvent(new Event('input'));" : "document.getElementById('btn-add-script').click()"
                );
                return;
            }

            // === UX: Lock Neural Stack Order & Rename ===
            // 1. Separate Locked vs Movable
            const lockedOrder = ['sys_pulse', 'sys_intent', 'sys_eros'];
            const lockedScripts = [];
            const movableScripts = [];

            // Find valid locked scripts in current list
            lockedOrder.forEach(id => {
                const s = scripts.find(x => x.id === id);
                if (s) lockedScripts.push(s);
            });

            // Find the rest (including sys_aura which is movable)
            scripts.forEach(s => {
                if (!lockedOrder.includes(s.id)) movableScripts.push(s);
            });

            // Recombine for Display
            // Note: If sorting active, matches filter.
            const displayList = [...lockedScripts, ...movableScripts];

            displayList.forEach((script, index) => {
                const isLocked = lockedOrder.includes(script.id);

                // Rename Logic: AURA -> SPIDER_AURA
                let displayName = script.name || 'Untitled';
                if (script.id === 'sys_aura') displayName = 'SPIDER_AURA';

                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.borderBottom = '1px solid var(--border-subtle)';
                item.style.cursor = 'pointer';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.gap = '8px';

                if (script.id === currentScriptId) {
                    item.style.backgroundColor = 'var(--bg-surface)';
                    item.style.borderLeft = script.system ? '3px solid var(--accent-secondary)' : '3px solid var(--accent-primary)';
                    item.style.paddingLeft = '9px';
                }

                const infoDiv = document.createElement('div');
                infoDiv.style.flex = '1';
                infoDiv.style.minWidth = '0';

                // Build badges
                let badges = '';
                if (script.system) {
                    badges += '<span style="font-size:9px; background:var(--bg-base); padding:1px 4px; border-radius:3px; border:1px solid var(--border-subtle); color:var(--text-muted);">🔒 SYS</span>';
                }


                // Safe accessor for code length
                const codeLength = script.source && script.source.code ? script.source.code.length : 0;

                infoDiv.innerHTML = `
          <div style="font-size:13px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:6px;">
            ${displayName}
            ${badges}
          </div>
          <div style="font-size:10px; color:var(--text-muted);">${codeLength} chars</div>
        `;
                infoDiv.onclick = () => selectScript(script.id);

                const reorderDiv = document.createElement('div');
                reorderDiv.style.display = 'flex';
                reorderDiv.style.flexDirection = 'column';
                reorderDiv.style.gap = '2px';

                const upBtn = document.createElement('button');
                upBtn.className = 'btn btn-ghost';
                upBtn.style.padding = '2px 4px';
                upBtn.style.lineHeight = '1';
                upBtn.style.fontSize = '10px';
                upBtn.innerHTML = '▲';
                upBtn.title = 'Move Up';
                // Only disable if it's the absolute first element
                upBtn.disabled = index === 0 || searchTerm !== '';

                if (!upBtn.disabled && !isLocked) {
                    upBtn.onclick = (e) => {
                        e.stopPropagation();
                        A.Scripts.move(script.id, 'up');
                        refreshList();
                        if (A.UI.Toast) A.UI.Toast.show('Script moved up', 'info');
                    };
                }

                const downBtn = document.createElement('button');
                downBtn.className = 'btn btn-ghost';
                downBtn.style.padding = '2px 4px';
                downBtn.style.lineHeight = '1';
                downBtn.style.fontSize = '10px';
                downBtn.innerHTML = '▼';
                downBtn.title = 'Move Down';
                // Only disable if it's the absolute last element
                downBtn.disabled = index === scripts.length - 1 || searchTerm !== '';

                if (!downBtn.disabled && !isLocked) {
                    downBtn.onclick = (e) => {
                        e.stopPropagation();
                        A.Scripts.move(script.id, 'down');
                        refreshList();
                        if (A.UI.Toast) A.UI.Toast.show('Script moved down', 'info');
                    };
                }

                if (isLocked) {
                    upBtn.disabled = true;
                    upBtn.style.opacity = '0.3';
                    downBtn.disabled = true;
                    downBtn.style.opacity = '0.3';
                }

                reorderDiv.appendChild(upBtn);
                reorderDiv.appendChild(downBtn);

                item.appendChild(infoDiv);
                item.appendChild(reorderDiv);

                if (script.id !== currentScriptId) {
                    item.onmouseenter = () => item.style.backgroundColor = 'var(--bg-surface)';
                    item.onmouseleave = () => {
                        if (script.id !== currentScriptId) item.style.backgroundColor = 'transparent';
                    };
                }

                listBody.appendChild(item);
            });
        }

        function selectScript(id) {
            currentScriptId = id;
            refreshList();

            const scripts = A.Scripts.getAll();
            const script = scripts.find(s => s.id === id);

            const nameInput = container.querySelector('#script-name-input');
            const delBtn = container.querySelector('#btn-delete-script');
            const downloadBtn = container.querySelector('#btn-download-script');

            if (script) {
                // System scripts are read-only
                const isReadOnly = !!script.system;
                nameInput.disabled = isReadOnly;
                nameInput.value = script.name;
                delBtn.disabled = isReadOnly;
                downloadBtn.disabled = false;

                if (monacoEditor) {
                    monacoEditor.setValue(script.source.code);
                    monacoEditor.updateOptions({ readOnly: isReadOnly });
                }
            } else {
                nameInput.disabled = true;
                nameInput.value = '';
                delBtn.disabled = true;
                downloadBtn.disabled = true;

                if (monacoEditor) {
                    monacoEditor.setValue('');
                    monacoEditor.updateOptions({ readOnly: true });
                }
            }
        }

        // Event Listeners

        container.querySelector('#btn-add-script').onclick = () => {
            const id = A.Scripts.create('New Script');
            selectScript(id);
        };

        // Preview AURA Export - shows the merged AURA.js with all Anansi content
        container.querySelector('#btn-preview-aura').onclick = () => {
            if (!A.AuraBuilder) {
                if (A.UI?.Toast) A.UI.Toast.show('AuraBuilder not loaded', 'error');
                return;
            }

            const preview = A.AuraBuilder.preview(A.State.get());

            // Create modal with preview
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
            modal.innerHTML = `
                <div style="background:var(--bg-elevated);border-radius:12px;overflow:hidden;max-width:900px;width:95%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid var(--border-subtle);">
                    <div style="padding:16px 20px;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-family:var(--font-serif);font-size:18px;">AURA Export Preview</h3>
                            <span style="font-size:11px;color:var(--text-muted);">This is the merged AURA.js that will be exported</span>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-primary btn-sm" id="preview-download">Download</button>
                            <button class="btn btn-ghost btn-sm" id="preview-close">Close</button>
                        </div>
                    </div>
                    <div style="flex:1;overflow:auto;padding:0;">
                        <pre style="margin:0;padding:16px;font-family:var(--font-mono);font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;background:var(--bg-base);color:var(--text-secondary);min-height:300px;"><code id="preview-code"></code></pre>
                    </div>
                    <div style="padding:12px 20px;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);">
                        <span>Lines: <strong id="preview-lines">0</strong> | Characters: <strong id="preview-chars">0</strong></span>
                        <span style="color:var(--accent-secondary);">✓ Content merged from Actors, Pairs, Lorebook, Events</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Set preview content
            const codeEl = modal.querySelector('#preview-code');
            codeEl.textContent = preview;
            modal.querySelector('#preview-lines').textContent = preview.split('\n').length;
            modal.querySelector('#preview-chars').textContent = preview.length.toLocaleString();

            // Close handlers
            modal.querySelector('#preview-close').onclick = () => modal.remove();
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Download handler
            modal.querySelector('#preview-download').onclick = () => {
                A.AuraBuilder.download(A.State.get());
                modal.remove();
            };
        };

        container.querySelector('#btn-repo-script').onclick = () => {
            const repoPoints = [
                {
                    name: 'RPG Travel System',
                    desc: 'Enables dynamic world navigation. Uses your Locations map to provide cardinal directions (N/S/E/W) and move the user between nodes.',
                    code: `/* 
 * Anansi RPG Travel System
 * ------------------------
 * Dynamically tracks user location and provides navigable exits
 * based on the "Locations" panel map layout.
 */

const RPG = {
    state: {
        currentLocationId: null
    },

    // Initialize or restore state
    init: function() {
        // Try to find a starting location if none set
        if (!this.state.currentLocationId) {
            const locs = Anansi.State.get().weaves.locations || [];
            if (locs.length > 0) {
                this.state.currentLocationId = locs[0].id; // Default to first
            }
        }
    },

    // Get current location validation
    getCurrent: function() {
        const locs = Anansi.State.get().weaves.locations || [];
        return locs.find(l => l.id === this.state.currentLocationId);
    },

    // Travel to a new ID
    travel: function(targetId) {
        const locs = Anansi.State.get().weaves.locations || [];
        const target = locs.find(l => l.id === targetId);
        if (target) {
            this.state.currentLocationId = targetId;
            return \`You travel to \${target.name}.\`;
        }
        return "You cannot go there.";
    },

    // Calculate cardinal direction between two points
    getDirection: function(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? "East" : "West";
        } else {
            return dy > 0 ? "South" : "North";
        }
    },

    // Context Injection for LLM
    getContext: function() {
        const cur = this.getCurrent();
        if (!cur) return "Location: Unknown Void";

        const locs = Anansi.State.get().weaves.locations || [];
        const exits = (cur.exits || []).map(eid => {
            const dest = locs.find(l => l.id === eid);
            if (!dest) return null;
            
            // Calculate heuristic direction from map positions
            const dir = this.getDirection(cur.pos, dest.pos);
            return \`\${dir}: \${dest.name}\`; 
        }).filter(x => x).join(', ');

        return \`[CURRENT LOCATION: \${cur.name}]\n[DESCRIPTION: \${cur.description}]\n[EXITS: \${exits}]\`;
    }
};

// Auto-run init
RPG.init();
`
                },
                {
                    name: 'Day/Night Cycle',
                    desc: 'Simple time tracking system that advances time with every message and changes environment tags.',
                    code: `/*
 * Simple Day/Night Cycle
 */
const Time = {
    hour: 8, // Start at 8 AM
    
    advance: function(hours = 1) {
        this.hour = (this.hour + hours) % 24;
    },
    
    getPhase: function() {
        if (this.hour >= 6 && this.hour < 12) return "Morning";
        if (this.hour >= 12 && this.hour < 18) return "Afternoon";
        if (this.hour >= 18 && this.hour < 22) return "Evening";
        return "Night";
    },
    
    toString: function() {
        return \`[TIME: \${this.hour}:00 (\${this.getPhase()})]\`;
    }
};`
                },
                {
                    name: 'Inventory System',
                    desc: 'Basic item tracking. Add/Remove items and list them in context.',
                    code: `/*
 * Basic Inventory
 */
const Inventory = {
    items: [],
    
    add: function(item) { this.items.push(item); },
    remove: function(item) { 
        const idx = this.items.indexOf(item);
        if (idx > -1) this.items.splice(idx, 1);
    },
    
    list: function() {
        if (this.items.length === 0) return "Empty";
        return this.items.join(", ");
    }
};`
                },
                {
                    name: 'API Reference / Cheatsheet',
                    desc: 'A comprehensive guide to Anansi internal functions and state access. Fully commented out for safety.',
                    code: `/* 
 * ANANSI SCRIPTING API REFERENCE
 * ==============================
 * This guide lists common patterns to access your World State.
 * All code is commented out so it doesn't execute by default.
 * Copy-paste sections you need into your active scripts.
 */

// ------------------------------------------------------------------
// 1. ACCESSING THE GLOBAL STATE
// ------------------------------------------------------------------
/*
   const state = Anansi.State.get();
   // 'state' now holds your entire project:
   // - state.meta (Name, Author)
   // - state.nodes.actors (Characters)
   // - state.weaves.lorebook (Lore Entries)
   // - state.weaves.locations (Map Nodes)
   // - state.weaves.events (Timeline Events)
*/

// ------------------------------------------------------------------
// 2. ACTORS (CHARACTERS)
// ------------------------------------------------------------------
/*
   // Get ALL Actors as an array
   const getAllActors = () => Object.values(Anansi.State.get().nodes.actors.items || {});

   // Find Actor by Name
   const getActor = (name) => {
       return getAllActors().find(a => a.name === name);
   };
   
   // Example: Check an Actor's emotion (if you are using Flux)
   // const hero = getActor('Hero');
   // if (hero) console.log(hero.data?.flux?.emotion);
*/

// ------------------------------------------------------------------
// 3. LOREBOOK ENTRIES
// ------------------------------------------------------------------
/*
   // Get ALL Entries
   const getLoreEntries = () => Object.values(Anansi.State.get().weaves.lorebook.entries || {});
   
   // Find Entry by Title
   const findLore = (title) => {
       return getLoreEntries().find(e => e.title === title);
   };

   // Enable/Disable an Entry programmatically
   const toggleLore = (title, enable) => {
       const entry = findLore(title);
       if (entry) {
           entry.enabled = enable; 
           // Note: State changes in scripts take effect immediately in memory
       }
   };
*/

// ------------------------------------------------------------------
// 4. LOCATIONS (FORBIDDEN SECRETS)
// ------------------------------------------------------------------
/*
   // Get Location by ID
   const getLoc = (id) => (Anansi.State.get().weaves.locations || []).find(l => l.id === id);

   // Get formatted exits for a location
   const getExits = (loc) => {
       return (loc.exits || []).map(eid => {
           const dest = getLoc(eid);
           return dest ? dest.name : eid;
       }).join(', ');
   };
*/

// ------------------------------------------------------------------
// 5. GLOBAL VARIABLES (PERSISTENCE)
// ------------------------------------------------------------------
/*
   // To store variables that persist between messages, attach them 
   // to the window object (carefully) or a dedicated namespace.
   
   if (typeof GameVars === 'undefined') {
       window.GameVars = {
           gold: 100,
           questStage: 0,
           weather: 'Clear'
       };
   }

   // Usage:
   // GameVars.gold -= 10;
*/

// ------------------------------------------------------------------
// 6. SIMULATION CONTEXT INTERFACE
// ------------------------------------------------------------------
/*
   // If you define a function named 'getContext', the Simulator 
   // will call it and inject the return string into the LLM prompt.
   
   /* 
   function getContext() {
       return \`[SYSTEM UPDATE: Validated Tokens: \${GameVars.gold}]\`;
   }
   */
*/`
                }
            ];

            // Show Modal
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';

            modal.innerHTML = `
                 <div style="background:var(--bg-panel); width:500px; max-height:80vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid var(--border-default);">
                    <div style="padding:16px; border-bottom:1px solid var(--border-subtle);">
                        <h3 style="margin:0;">Script Repository</h3>
                        <div style="font-size:12px; color:var(--text-muted);">Pre-made modules to enhance your world.</div>
                    </div>
                    <div style="flex:1; overflow-y:auto; padding:0;">
                        ${repoPoints.map((s, idx) => `
                            <div class="repo-item" style="padding:16px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:start; gap:12px;">
                                <div>
                                    <div style="font-weight:bold; color:var(--accent-primary); margin-bottom:4px;">${s.name}</div>
                                    <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">${s.desc}</div>
                                </div>
                                <button class="btn btn-secondary btn-sm btn-install-repo" data-idx="${idx}" style="white-space:nowrap;">Install</button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="padding:12px; text-align:right; border-top:1px solid var(--border-subtle);">
                        <button class="btn btn-ghost btn-sm" id="btn-close-repo">Close</button>
                    </div>
                 </div>
             `;

            document.body.appendChild(modal);

            modal.querySelector('#btn-close-repo').onclick = () => modal.remove();

            modal.querySelectorAll('.btn-install-repo').forEach(btn => {
                btn.onclick = () => {
                    const s = repoPoints[btn.dataset.idx];
                    const id = A.Scripts.create(s.name);
                    A.Scripts.update(id, { source: { type: 'inline', code: s.code } });
                    selectScript(id);
                    if (A.UI.Toast) A.UI.Toast.show(`Installed "${s.name}"`, 'success');
                    modal.remove();
                };
            });
        };

        container.querySelector('#btn-upload-script').onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js,.txt,.json,.ts,.mjs,.cjs';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const name = file.name.replace(/\.[^.]+$/, '');
                    const id = A.Scripts.create(name);
                    A.Scripts.update(id, {
                        source: { type: 'inline', code: evt.target.result }
                    });
                    selectScript(id);
                    if (A.UI.Toast) A.UI.Toast.show(`Uploaded: ${file.name}`, 'success');
                };
                reader.readAsText(file);
            };
            input.click();
        };

        container.querySelector('#btn-download-script').onclick = () => {
            // Show export choice modal
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000;';
            modal.innerHTML = `
                <div style="background:var(--bg-elevated);border-radius:12px;padding:24px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid var(--border-subtle);">
                    <h3 style="margin:0 0 16px 0;font-family:var(--font-serif);font-size:18px;">Export Scripts</h3>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <button class="btn btn-primary" id="export-selected" ${!currentScriptId ? 'disabled' : ''}>
                            Download Selected Script (.txt)
                        </button>
                        <button class="btn btn-ghost" id="export-all">
                            Download All Scripts (ZIP)
                        </button>
                    </div>
                    <div style="margin-top:16px;text-align:right;">
                        <button class="btn btn-ghost btn-sm" id="export-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#export-cancel').onclick = () => modal.remove();
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            // Download Selected Script as .txt
            modal.querySelector('#export-selected').onclick = () => {
                if (!currentScriptId) return;
                const scripts = A.Scripts.getAll();
                const script = scripts.find(s => s.id === currentScriptId);
                if (!script) return;

                const code = monacoEditor ? monacoEditor.getValue() : (script.source && script.source.code ? script.source.code : '');
                const blob = new Blob([code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (script.name || 'script') + '.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (A.UI.Toast) A.UI.Toast.show(`Downloaded: ${a.download}`, 'success');
                modal.remove();
            };

            // Download All Scripts as ZIP
            modal.querySelector('#export-all').onclick = async () => {
                const scripts = A.Scripts.getAll();
                if (!scripts.length) {
                    if (A.UI.Toast) A.UI.Toast.show('No scripts to export', 'warning');
                    modal.remove();
                    return;
                }

                if (typeof JSZip === 'undefined') {
                    if (A.UI.Toast) A.UI.Toast.show('JSZip not loaded', 'error');
                    modal.remove();
                    return;
                }

                try {
                    const zip = new JSZip();
                    const projectName = A.State.get().meta?.name || 'Anansi Project';

                    // Generate README
                    let readme = `# ${projectName} - Script Bundle\n\n`;
                    readme += `Exported: ${new Date().toISOString()}\n\n`;
                    readme += `## Script Order (Execution Sequence)\n\n`;

                    scripts.forEach((script, idx) => {
                        const flags = [];
                        if (script.system) flags.push('SYSTEM');
                        if (script.managed) flags.push('GENERATED');
                        const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
                        readme += `${idx + 1}. ${script.name || 'Untitled'}${flagStr}\n`;
                    });

                    readme += `\n## Notes\n\n`;
                    readme += `- Scripts should be executed in the order listed above\n`;
                    readme += `- SYSTEM scripts are built-in engine components\n`;
                    readme += `- GENERATED scripts are auto-created from panel configurations\n`;

                    zip.file('README.txt', readme);

                    // Add each script
                    scripts.forEach((script, idx) => {
                        const code = script.source && script.source.code ? script.source.code : '';
                        const safeName = (script.name || 'script_' + idx).replace(/[^a-zA-Z0-9_-]/g, '_');
                        const paddedIdx = String(idx + 1).padStart(2, '0');
                        zip.file(`${paddedIdx}_${safeName}.txt`, code);
                    });

                    const content = await zip.generateAsync({ type: 'blob' });
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'scripts') + '_bundle.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    if (A.UI.Toast) A.UI.Toast.show(`Exported ${scripts.length} scripts as ZIP`, 'success');
                } catch (err) {
                    console.error('ZIP export error:', err);
                    if (A.UI.Toast) A.UI.Toast.show('Export failed: ' + err.message, 'error');
                }
                modal.remove();
            };
        };

        container.querySelector('#btn-delete-script').onclick = () => {
            if (confirm('Delete this script?')) {
                A.Scripts.delete(currentScriptId);
                currentScriptId = null;
                selectScript(null);
                if (A.UI.Toast) A.UI.Toast.show('Script deleted', 'info');
            }
        };

        container.querySelector('#script-name-input').onchange = (e) => {
            if (currentScriptId) {
                if (A.UI.Toast) A.UI.Toast.show('Script renamed', 'success');
            }
        };

        container.querySelector('#script-name-input').oninput = (e) => {
            if (currentScriptId) {
                A.Scripts.update(currentScriptId, { name: e.target.value });
                refreshList();
                container.querySelector('#script-name-input').focus();
            }
        };

        // Initial Load
        refreshList();
        if (currentScriptId) {
            selectScript(currentScriptId);
        }

        // --- Set Web Lens with Editor Shortcuts Guide ---
        A.UI.setLens((lensRoot) => {
            lensRoot.innerHTML = `
                <div style="padding: 8px 0;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px;">
                        Editor Shortcuts
                    </div>
                    
                    <!-- Navigation -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">NAVIGATION</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+G</kbd> Go to Line</div>
                            <div><kbd>Ctrl+P</kbd> Quick Open</div>
                            <div><kbd>F1</kbd> Command Palette</div>
                            <div><kbd>Ctrl+Home/End</kbd> Start/End of File</div>
                        </div>
                    </div>
                    
                    <!-- Editing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">EDITING</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+D</kbd> Select Word</div>
                            <div><kbd>Ctrl+/</kbd> Toggle Comment</div>
                            <div><kbd>Alt+↑/↓</kbd> Move Line</div>
                            <div><kbd>Shift+Alt+↑/↓</kbd> Copy Line</div>
                            <div><kbd>Ctrl+Shift+K</kbd> Delete Line</div>
                            <div><kbd>Ctrl+Enter</kbd> Insert Line Below</div>
                        </div>
                    </div>
                    
                    <!-- Selection -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">SELECTION</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+L</kbd> Select Line</div>
                            <div><kbd>Ctrl+Shift+L</kbd> Select All Occurrences</div>
                            <div><kbd>Alt+Click</kbd> Add Cursor</div>
                            <div><kbd>Ctrl+Alt+↑/↓</kbd> Add Cursors Above/Below</div>
                        </div>
                    </div>
                    
                    <!-- Search -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">SEARCH</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+F</kbd> Find</div>
                            <div><kbd>Ctrl+H</kbd> Replace</div>
                            <div><kbd>F3</kbd> Find Next</div>
                            <div><kbd>Shift+F3</kbd> Find Previous</div>
                        </div>
                    </div>
                    
                    <!-- Code Features -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">CODE FEATURES</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+Space</kbd> Trigger Suggest</div>
                            <div><kbd>Ctrl+Shift+Space</kbd> Parameter Hints</div>
                            <div><kbd>Ctrl+.</kbd> Quick Fix</div>
                            <div><kbd>Ctrl+K Ctrl+F</kbd> Format Selection</div>
                            <div><kbd>Ctrl+[/]</kbd> Indent/Outdent</div>
                        </div>
                    </div>
                    
                    <!-- Folding -->
                    <div>
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; font-weight: 600;">FOLDING</div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><kbd>Ctrl+Shift+[</kbd> Fold Region</div>
                            <div><kbd>Ctrl+Shift+]</kbd> Unfold Region</div>
                            <div><kbd>Ctrl+K Ctrl+0</kbd> Fold All</div>
                            <div><kbd>Ctrl+K Ctrl+J</kbd> Unfold All</div>
                        </div>
                    </div>
                </div>
                
                <style>
                    kbd {
                        display: inline-block;
                        padding: 2px 5px;
                        font-family: var(--font-mono);
                        font-size: 10px;
                        line-height: 1;
                        color: var(--text-secondary);
                        background-color: var(--bg-surface);
                        border: 1px solid var(--border-subtle);
                        border-radius: 3px;
                        box-shadow: 0 1px 0 var(--border-subtle);
                        margin-right: 4px;
                    }
                </style>
            `;
        });
    }

    // Cleanup Monaco when switching panels
    const originalSwitchPanel = A.UI && A.UI.switchPanel;
    if (A.UI) {
        const cleanup = () => {
            if (monacoEditor) {
                monacoEditor.dispose();
                monacoEditor = null;
            }
        };

        // Hook into panel switching to cleanup
        A.once = A.once || {};
        if (!A.once.scriptsCleanupHooked) {
            A.once.scriptsCleanupHooked = true;
            const origSwitch = A.UI.switchPanel.bind(A.UI);
            A.UI.switchPanel = function (id, ctx) {
                cleanup();
                return origSwitch(id, ctx);
            };
        }
    }

    A.registerPanel('scripts', {
        label: 'Scripts',
        subtitle: 'External Threads',
        category: 'Magic',
        render: render
    });

})(window.Anansi);
