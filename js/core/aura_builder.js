/*
 * Anansi Core: AURA Builder
 * File: js/core/aura_builder.js
 * Purpose: Build final AURA.js with injected Anansi content.
 */

(function (A) {
    'use strict';

    // Injection markers - these define where to insert content in AURA.js
    const MARKERS = {
        ENTITY_DB_START: '//#region DYNAMIC_RELATIONSHIP',
        ENTITY_DB_REPLACE: 'const ENTITY_DB = (function () {',
        RELATIONSHIP_DB_REPLACE: 'const RELATIONSHIP_DB = (function () {',
        LORE_ENTRIES_START: '//#region AUTHOR_ENTRIES_LOREBOOK',
        LORE_ENTRIES_INSERT: 'const DYNAMIC_LORE = [',
    };

    const AuraBuilder = {

        /**
         * Get the AURA.js template source
         */
        getTemplate: function () {
            // Get from SystemData (inlined) or from state
            if (A.SystemData && A.SystemData.sys_aura) {
                return A.SystemData.sys_aura;
            }

            // Fallback: get from scripts
            const scripts = A.Scripts?.getAll() || [];
            const auraScript = scripts.find(s => s.id === 'sys_aura');
            if (auraScript && auraScript.source?.code) {
                return auraScript.source.code;
            }

            console.error('[AuraBuilder] Could not find AURA.js template');
            return null;
        },

        /**
         * Get a specific System Script by ID
         */
        getSystemScript: function (id) {
            if (A.SystemData && A.SystemData[id]) {
                if (A.SystemData[id] === undefined) return null; // Safety
                return A.SystemData[id];
            }
            return null;
        },


        /**
         * Build the final AURA.js with Stacked content
         */
        build: function (state) {
            const libCode = AuraBuilder.getTemplate();
            if (!libCode) {
                // Return safe fallback instead of throwing to prevent UI crash
                return '// AURA Library not found. Run build_system_data.py';
            }

            // Get transformers
            const transformers = A.AuraTransformers;
            if (!transformers) {
                return '// AuraTransformers not loaded';
            }

            // Build all transformed data
            const data = transformers.buildAll(state);

            // === STACK CONSTRUCTION ===
            let output = '/* === AURA LIBRARY (Core) === */\n' + libCode + '\n\n';

            // 1. Data Globals (Entities, Relationships) - Accessible to all scripts
            output += '/* === GLOBAL DATA === */\n';
            output += AuraBuilder._buildEntityDBCode(data.entityDB) + '\n';
            output += AuraBuilder._buildRelationshipDBCode(data.relationshipDB) + '\n\n';

            // 2. Voices Client Script
            // Uses generated logic from transformers
            if (transformers.buildVoicesScript) {
                output += transformers.buildVoicesScript(state) + '\n\n';
            }

            // 3. Microcues Client Script
            if (transformers.buildMicrocuesScript) {
                output += transformers.buildMicrocuesScript(state) + '\n\n';
            }

            // 4. Custom Rules (SBX) Script
            if (transformers.buildCustomRulesScript) {
                output += transformers.buildCustomRulesScript(state) + '\n\n';
            }

            // 5. Scoring (Basic/Adv) Script
            if (transformers.buildScoringScript) {
                output += transformers.buildScoringScript(state) + '\n\n';
            }

            // 6. Events (Logic/Chaos) Script
            if (transformers.buildEventsScript) {
                output += transformers.buildEventsScript(state) + '\n\n';
            }

            // 7. Actor Cues (Physical Expression) Script
            if (transformers.buildActorCuesScript) {
                output += transformers.buildActorCuesScript(state) + '\n\n';
            }

            // 8. Lore Client Script
            // Wraps standard entries in a Client Loop that uses AURA.gates
            output += AuraBuilder._buildLoreClientScript(data.loreEntries) + '\n\n';

            // 9. Header Prepend
            const header = AuraBuilder._buildHeader(state);
            return header + '\n\n' + output;
        },

        /**
         * Build Lore Client Script (Runner)
         * Wraps the raw registration calls in an execution loop
         */
        _buildLoreClientScript: function (loreEntries) {
            if (!loreEntries || loreEntries.length === 0) return '// No Lore Entries';

            // Use the standard serialization for the data part
            // But we need to define the 'registerLoreEntry' function locally or globally for it to work
            const entriesCode = AuraBuilder._buildLoreEntriesCode(loreEntries);

            return `/* === LORE CLIENT SCRIPT === */
(function(){
  // Dependencies
  if (typeof AURA === 'undefined') return;
  if (!context || !context.character) return;
  
  var LORE_ENTRIES = [];
  function registerLoreEntry(e) { LORE_ENTRIES.push(e); }

  // --- ENTRIES ---
${entriesCode}

  // --- EXECUTION LOOP ---
  var msg = (context.chat && context.chat.length) ? context.chat[context.chat.length-1].mes : '';
  // Normalize once for perf
  // Note: AURA.gates expects raw strings usually and handles normalization, 
  // but if we want to optimize we could pass normalized text.
  // For now, standard pass.

  LORE_ENTRIES.forEach(function(entry){
      if (AURA.gates.checkWords(entry, msg) && AURA.gates.checkTags(entry, {}, 'Tags')) {
          // Injection Logic
          var content = entry.personality || entry.content || "";
          if (content) {
              context.character.personality = (context.character.personality || "") + "\\n" + content;
              if (AURA.utils && AURA.utils.dbg) AURA.utils.dbg("Injected Lore: " + entry.tag);
          }
      }
  });

})();`;
        },

        /**
         * Build static ENTITY_DB code
         */
        _buildEntityDBCode: function (entityDB) {
            const json = JSON.stringify(entityDB, null, 2);
            return `const ENTITY_DB = ${json};`;
        },

        /**
         * Build static RELATIONSHIP_DB code
         */
        _buildRelationshipDBCode: function (relationshipDB) {
            const json = JSON.stringify(relationshipDB, null, 2);
            return `const RELATIONSHIP_DB = ${json};`;
        },

        /**
         * Build lore entries registration code
         */
        _buildLoreEntriesCode: function (loreEntries) {
            if (!loreEntries || loreEntries.length === 0) {
                return '// No lorebook entries configured';
            }

            const lines = ['// === ANANSI GENERATED ENTRIES ==='];

            loreEntries.forEach((entry, idx) => {
                lines.push('');
                lines.push(`// Entry ${idx + 1}: ${entry.tag || 'Unknown'}`);
                lines.push('registerLoreEntry(' + JSON.stringify(entry, null, 2) + ');');
            });

            return lines.join('\n');
        },

        /**
         * Build header comment for generated file
         */
        _buildHeader: function (state) {
            const now = new Date().toISOString();
            const projectName = state?.meta?.name || 'Unnamed Project';
            const author = state?.meta?.author || 'Anansi';

            return `/* ============================================================================
   AURA SYSTEM SCRIPT
   Generated by Anansi Web Builder
   
   Project: ${projectName}
   Author: ${author}
   Generated: ${now}
   
   This file was automatically generated. Manual edits will be overwritten
   on the next export.
   ========================================================================== */`;
        },

        /**
         * Replace a section matching regex with new content
         */
        _replaceSection: function (source, regex, replacement) {
            if (regex.test(source)) {
                return source.replace(regex, replacement);
            }
            console.warn('[AuraBuilder] Section not found for replacement:', regex);
            return source;
        },

        /**
         * Insert content after a matching pattern
         */
        _insertAfter: function (source, regex, content) {
            const match = source.match(regex);
            if (match) {
                const idx = source.indexOf(match[0]);
                return source.slice(0, idx) + content + source.slice(idx + match[0].length);
            }
            console.warn('[AuraBuilder] Pattern not found for insertion:', regex);
            return source;
        },

        /**
         * Build and download the complete script bundle
         */
        download: function (state) {
            try {
                const output = AuraBuilder.build(state || A.State.get());

                // Create download
                const blob = new Blob([output], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');

                const safeName = (state?.meta?.name || 'anansi_aura')
                    .replace(/[^a-z0-9]/gi, '_')
                    .toLowerCase();

                a.href = url;
                a.download = `${safeName}_aura.js`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('[AuraBuilder] Downloaded:', `${safeName}_aura.js`);
                return true;
            } catch (e) {
                console.error('[AuraBuilder] Build failed:', e);
                if (A.UI?.Toast) A.UI.Toast.show('Build failed: ' + e.message, 'error');
                return false;
            }
        },

        /**
         * Get a preview of the built output (for UI display)
         */
        preview: function (state) {
            try {
                return AuraBuilder.build(state || A.State.get());
            } catch (e) {
                return '// Error building preview: ' + e.message;
            }
        }
    };

    A.AuraBuilder = AuraBuilder;

})(window.Anansi);
