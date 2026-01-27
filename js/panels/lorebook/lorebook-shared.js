/*
 * Anansi Lorebook - Shared Constants & Helpers
 * File: js/plugins/lorebook/lorebook-shared.js
 * Purpose: Shared constants, helper functions, and script generation for Lorebook.
 */

(function (A) {
    'use strict';

    // Ensure namespace exists
    if (!A.Lorebook) A.Lorebook = {};

    // --- Constants & Config ---
    A.Lorebook.CATEGORIES = ['character', 'faction', 'item', 'theme', 'location', 'custom', 'uncategorized'];
    A.Lorebook.ACTIVATION = ['standard', 'immediate', 'cooldown', 'conditional'];

    // Aura Tags (Emotions & Intents) - Extended for AURA parity
    A.Lorebook.EMOTIONS = [
        'JOY', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE',
        'TRUST', 'ANTICIPATION', 'LOVE', 'SUBMISSION', 'AWE',
        'DISAPPROVAL', 'REMORSE', 'CONTEMPT', 'AGGRESSIVENESS', 'OPTIMISM'
    ];

    A.Lorebook.INTENTS = [
        'QUESTION', 'COMMAND', 'STATEMENT', 'EXCLAMATION',
        'GREETING', 'FAREWELL', 'AFFIRMATION', 'NEGATION'
    ];

    A.Lorebook.EROS_LEVELS = {
        0: 'NONE', 1: 'AWARENESS', 2: 'INTEREST', 3: 'ATTRACTION', 4: 'TENSION',
        5: 'FLIRTATION', 6: 'DESIRE', 7: 'INTIMACY', 8: 'PASSION', 9: 'INTENSITY', 10: 'TRANSCENDENCE'
    };

    // Combined for backwards compatibility
    A.Lorebook.AURA_TAGS = [
        ...A.Lorebook.EMOTIONS, ...A.Lorebook.INTENTS,
        'ROMANCE', 'NEUTRAL', 'POSITIVE', 'NEGATIVE',
        'DISCLOSURE', 'PROMISE', 'CONFLICT', 'SMALLTALK', 'META', 'NARRATIVE'
    ];

    // --- Helpers ---
    A.Lorebook.uuidv4 = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    A.Lorebook.jsStr = function (s) {
        return JSON.stringify(s || '');
    };

    /**
     * Render a tag picker component.
     * @param {HTMLElement} parent - Parent element to append to
     * @param {string} label - Label text
     * @param {string[]} tags - Current tags
     * @param {function} onChange - Callback when tags change
     */
    A.Lorebook.renderTagPicker = function (parent, label, tags, onChange) {
        const container = document.createElement('div');
        container.className = 'l-col';
        parent.appendChild(container);

        if (A.UI && A.UI.Components && A.UI.Components.TagInput) {
            new A.UI.Components.TagInput(container, tags, {
                label: label,
                suggestions: A.Lorebook.AURA_TAGS,
                onChange: onChange
            });
        } else {
            container.innerHTML = '<div style="color:red; font-size:10px;">Error: TagInput missing</div>';
        }
    };

    // --- Script Generation ---
    A.Lorebook.generateScript = function (entries) {
        const state = A.State.get();
        const globalDepth = (state.weaves && state.weaves.lorebook) ? (state.weaves.lorebook.scanDepth || 3) : 3;
        const jsStr = A.Lorebook.jsStr;

        const entryList = Object.values(entries || {});
        const activeEntries = entryList.filter(e => e.enabled !== false);

        if (!activeEntries.length) return '/* No enabled lorebook entries. */';

        // Calculate Max Depth needed
        let maxDepth = globalDepth;
        activeEntries.forEach(e => {
            if (e.scanDepth && e.scanDepth > maxDepth) maxDepth = e.scanDepth;
        });

        let s = '/* === LOREBOOK (Generated) =========================================== */\n\n';
        s += 'var LOREBOOK_CFG = {\n';
        s += '  enabled: true,\n';
        s += '  entries: [\n';

        s += activeEntries.map(e => {
            const keywords = (e.keywords || []).map(k => jsStr(k)).join(',');
            const reqTags = (e.requireTags || []).map(t => jsStr(t)).join(',');
            const blkTags = (e.blocksTags || []).map(t => jsStr(t)).join(',');
            const emitTags = (e.tags || []).map(t => jsStr(t)).join(',');

            return `    {
      id: ${jsStr(e.id)},
      title: ${jsStr(e.title)},
      keywords: [${keywords}],
      content: ${jsStr(e.content)},
      priority: ${e.priority || 50},
      category: ${jsStr(e.category || 'uncategorized')},
      requireTags: [${reqTags}],
      blocksTags: [${blkTags}],
      emitTags: [${emitTags}],
      probability: ${e.probability !== undefined ? e.probability : 100},
      scanDepth: ${e.scanDepth || 'null'} 
    }`;
        }).join(',\n');

        s += '\n  ]\n};\n\n';

        // Simple engine logic
        s += `(function(){
  if (!LOREBOOK_CFG || !LOREBOOK_CFG.enabled) return;
  if (!context || !context.chat) return;
  
  var activeTags = context.activeTags || [];
  
  // Logic: Pre-fetch maximum required history
  var globalDepth = ${globalDepth};
  var maxDepth = ${maxDepth};
  var history = context.chat || [];
  
  // Create Master Window (Largest possible window needed)
  var masterWindow = [];
  for (var i = 0; i < maxDepth; i++) {
     if (history.length - 1 - i >= 0) {
        masterWindow.push(history[history.length - 1 - i].mes.toLowerCase());
     }
  }
  
  console.log("Lorebook: Pre-scanned " + masterWindow.length + " msgs (Max Depth: " + maxDepth + ") for " + LOREBOOK_CFG.entries.length + " entries.");
  
  LOREBOOK_CFG.entries.forEach(function(entry){
  
    // Determine effective window for this entry
    // If entry.scanDepth is set, use it. Otherwise use globalDepth.
    var effectiveDepth = entry.scanDepth || globalDepth;
    
    // Slice master window to get just what this entry needs
    // masterWindow is [newest, ..., oldest]
    // effectiveDepth 3 means take first 3 elements of masterWindow
    var scanWindow = masterWindow.slice(0, effectiveDepth);
    
    // Check keywords (against ANY message in its specific window)
    var triggered = entry.keywords.some(function(kw){
        var kwLower = kw.toLowerCase();
        return scanWindow.some(function(msg){ return msg.indexOf(kwLower) !== -1; });
    });

    if (!triggered) return;
    
    // Check required tags
    if (entry.requireTags.length > 0) {
      var hasRequired = entry.requireTags.some(function(t){ return activeTags.indexOf(t) !== -1; });
      if (!hasRequired) return;
    }
    
    // Check blocked tags
    if (entry.blocksTags.length > 0) {
      var isBlocked = entry.blocksTags.some(function(t){ return activeTags.indexOf(t) !== -1; });
      if (isBlocked) return;
    }
    
    // Probability check
    if (Math.random() * 100 > entry.probability) return;
    
    // Inject content
    if (context.character && typeof context.character.personality === 'string') {
      context.character.personality += ' ' + entry.content;
      console.info("Lorebook: Injected [" + entry.title + "] (Depth: " + effectiveDepth + ")");
    } else {
      console.warn("Lorebook: Targeted context.character.personality but it was missing.");
    }
    
    // Emit tags
    entry.emitTags.forEach(function(t){
      if (activeTags.indexOf(t) === -1) {
          activeTags.push(t);
          console.log("Lorebook: Emitted Tag [" + t + "]");
      }
    });
  });
})();`;

        return s;
    };

})(window.Anansi);
