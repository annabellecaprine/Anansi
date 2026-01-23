/*
 * World Weaver: Generation & Review
 * File: js/panels/world_weaver/generation.js
 */

(function (A) {
    'use strict';

    A.WorldWeaver = A.WorldWeaver || {};

    async function handleGeneration(session, sessions, type) {
        // Dependencies
        const T = A.WorldWeaver.Templates;
        // Check dependencies (safeguard)
        if (!T) return console.error("Templates not loaded");

        if (A.UI?.Toast?.show) A.UI.Toast.show(`Generating ${type}...`, 'info');

        // Build context
        const contextSummary = Object.entries(session.categories)
            .filter(([_, cat]) => cat.summary)
            .map(([key, cat]) => `## ${T.CATEGORIES[key]?.label || key}\n${cat.summary}`)
            .join('\n\n');

        switch (type) {
            case 'character':
                if (A.UI?.Toast?.show) A.UI.Toast.show('Generating Character Profile...', 'info');
                try {
                    const charPrompt = `
You are an expert character designer.
Based on the following world context, generate a detailed MAIN CHARACTER profile.
Return ONLY valid JSON:
{
    "name": "Name",
    "description": "Short physical description and vibe (1-2 sentences)",
    "summary": "Detailed background, role, and personality summary",
    "traits": ["Trait 1", "Trait 2", "Trait 3"],
    "scenario": "The setting, environment context, and any specific rules for this encounter",
    "first_message": "The opening line or action from the character to start the roleplay",
    "notes": "Additional notes on conflict, goals, and relationships"
}

=== CONTEXT ===
${contextSummary}
`;
                    let charData;
                    let charAttempts = 0;
                    const maxCharAttempts = 2;
                    let charHistory = [];

                    while (charAttempts <= maxCharAttempts) {
                        try {
                            const charResponse = await A.LLM.generate(charPrompt, charHistory, { maxTokens: 2048, temperature: 0.7 });
                            charData = A.JSONRepair.repairAndParse(charResponse);
                            break; // Success
                        } catch (e) {
                            console.warn(`[WorldWeaver] Character Gen Attempt ${charAttempts + 1} failed:`, e);
                            if (charAttempts < maxCharAttempts) {
                                charAttempts++;
                                charHistory.push({ role: 'model', content: e.originalText || "(Invalid JSON)" });
                                charHistory.push({
                                    role: 'user',
                                    content: `SYSTEM: The previous response was invalid JSON. Error: ${e.message}. Please fix the format and respond with ONLY the valid JSON object.`
                                });
                            } else {
                                console.error('Character generation failed after retries:', e);
                                if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate character after retries', 'error');
                                return; // Hard fail
                            }
                        }
                    }
                    showReviewModal(charData, 'character', session);
                } catch (err) {
                    console.error('Character generation failed:', err);
                    if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate character', 'error');
                }
                break;

            case 'world':
                if (A.UI?.Toast?.show) A.UI.Toast.show('Generating World Lorebook...', 'info');
                try {
                    const worldPrompt = `
 You are an expert world builder.
 Based on the following world context, generate key LOREBOOK ENTRIES.
 Focus on the most important rules, locations, factions, and mechanics.
 Return ONLY valid JSON:
 {
     "entries": [
         {
             "title": "Entry Title",
             "keys": ["key1", "key2"],
             "content": "Detailed description of this aspect of the world.",
             "category": "World | Location | Faction | Mechanic | Rule | History"
         }
     ]
 }
 
 === CONTEXT ===
 ${contextSummary}
 `;
                    let worldData;
                    let worldAttempts = 0;
                    const maxWorldAttempts = 2;
                    let worldHistory = [];

                    while (worldAttempts <= maxWorldAttempts) {
                        try {
                            const worldResponse = await A.LLM.generate(worldPrompt, worldHistory, { maxTokens: 4096, temperature: 0.7 });
                            worldData = A.JSONRepair.repairAndParse(worldResponse);
                            break; // Success
                        } catch (e) {
                            console.warn(`[WorldWeaver] World Gen Attempt ${worldAttempts + 1} failed:`, e);
                            if (worldAttempts < maxWorldAttempts) {
                                worldAttempts++;
                                worldHistory.push({ role: 'model', content: e.originalText || "(Invalid JSON)" });
                                worldHistory.push({
                                    role: 'user',
                                    content: `SYSTEM: The previous response was invalid JSON. Error: ${e.message}. Please fix the format and respond with ONLY the valid JSON object.`
                                });
                            } else {
                                console.error('World generation failed after retries:', e);
                                if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate world lore after retries', 'error');
                                return; // Hard fail
                            }
                        }
                    }
                    showReviewModal(worldData, 'world', session);
                } catch (err) {
                    console.error('World generation failed:', err);
                    if (A.UI?.Toast?.show) A.UI.Toast.show('Failed to generate world lore', 'error');
                }
                break;

            case 'export':
                const markdown = `# ${session.name}
 
 **Genre:** ${T.GENRE_TEMPLATES.find(t => t.id === session.genre)?.label || 'Free Form'}
 **Content Rating:** ${T.CONTENT_RATINGS.find(r => r.id === session.contentRating)?.label || 'SFW'}
 **Created:** ${new Date(session.createdAt).toLocaleDateString()}
 
 ---
 
 ${contextSummary}
 
 ---
 
 ## Chat History
 
 ${session.chatHistory.map(m => m.role === 'user' ? `**You:** ${m.content}` : `**AI:** ${m.question || m.content}`).join('\n\n')}
 `;
                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}_world.md`;
                a.click();
                URL.revokeObjectURL(url);
                if (A.UI?.Toast?.show) A.UI.Toast.show('World document exported!', 'success');
                break;
        }
    }

    function showReviewModal(data, type, session) {
        const modal = document.createElement('div');
        modal.className = 'anansi-modal';
        // Inline styles to ensure visibility and high z-index
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px);
        `;

        let previewContent = '';
        let editableData = JSON.parse(JSON.stringify(data)); // Deep copy

        if (type === 'character') {
            previewContent = renderCharacterPreview(editableData);
        } else if (type === 'world') {
            previewContent = renderLorebookPreview(editableData);
        }

        modal.innerHTML = `
            <div class="anansi-modal-content" style="
                width: 800px; max-width: 90vw; height: 80vh; 
                background: var(--bg-surface); border-radius: 12px; 
                border: 1px solid var(--border-subtle); display: flex; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6); overflow: hidden;
            ">
                <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated);">
                    <h3 style="margin: 0;">👁️ Review Generated Content</h3>
                    <div style="font-size: 12px; color: var(--text-muted);">Please verify before importing</div>
                </div>
                
                <div class="ww-review-body" style="flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-surface);">
                    ${previewContent}
                </div>

                <div style="padding: 16px; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn-secondary" style="background: transparent; border: 1px solid var(--border-subtle); padding: 8px 16px; color: var(--text-muted); cursor: pointer; border-radius: 6px;">Discard</button>
                    <button class="btn-primary" style="background: var(--accent); border: none; padding: 8px 16px; color: white; cursor: pointer; border-radius: 6px; font-weight: 600;">Confirm & Import</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event Listeners for Edit (Simple binding)
        const body = modal.querySelector('.ww-review-body');

        // Character Edits
        if (type === 'character') {
            body.querySelectorAll('[contenteditable]').forEach(el => {
                el.addEventListener('input', () => {
                    const field = el.dataset.field;
                    if (field) editableData[field] = el.innerText;
                });
            });
        }
        // Lorebook Edits
        if (type === 'world') {
            body.querySelectorAll('.ww-lore-entry').forEach((entryEl, idx) => {
                const titleEl = entryEl.querySelector('.ww-lore-title');
                const contentEl = entryEl.querySelector('.ww-lore-content');

                titleEl.addEventListener('input', () => {
                    editableData.entries[idx].title = titleEl.innerText;
                });
                contentEl.addEventListener('input', () => {
                    editableData.entries[idx].content = contentEl.innerText;
                });
            });
        }

        modal.querySelector('.btn-secondary').onclick = () => modal.remove();
        modal.querySelector('.btn-primary').onclick = () => {
            importGeneratedContent(editableData, type, session, A);
            modal.remove();
            if (A.UI?.Toast?.show) A.UI.Toast.show('Content imported successfully!', 'success');
        };
    }

    function renderCharacterPreview(data) {
        return `
            <div style="display: flex; gap: 24px;">
                <div style="flex: 0 0 200px; display: flex; flex-direction: column; gap: 12px;">
                    <div style="width: 100%; aspect-ratio: 2/3; background: var(--bg-dark); border: 2px dashed var(--border-subtle); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                        No Avatar
                    </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: var(--accent); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Name</div>
                        <div contenteditable="true" data-field="name" style="font-size: 24px; font-weight: 700; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 4px;">${data.name}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Description</div>
                        <div contenteditable="true" data-field="description" style="color: var(--text-secondary); line-height: 1.5; border: 1px transparent solid; padding: 4px; border-radius: 4px;">${data.description}</div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Traits</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${(data.traits || []).map(t => `
                                <span style="background: var(--bg-base); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid var(--border-subtle);">${t}</span>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Summary</div>
                        <div contenteditable="true" data-field="summary" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); white-space: pre-wrap; line-height: 1.6;">${data.summary}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Scenario (Context & Rules)</div>
                        <div contenteditable="true" data-field="scenario" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 12px;">${data.scenario || ''}</div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">First Message (Opening)</div>
                        <div contenteditable="true" data-field="first_message" style="background: var(--bg-base); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle); font-style: italic;">${data.first_message || ''}</div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Notes</div>
                        <div contenteditable="true" data-field="notes" style="font-style: italic; color: var(--text-muted);">${data.notes}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLorebookPreview(data) {
        if (!data.entries || data.entries.length === 0) return '<div style="text-align:center; color: var(--text-muted);">No entries generated.</div>';

        return `
            <div style="display: grid; gap: 16px;">
                ${data.entries.map((entry, idx) => `
                    <div class="ww-lore-entry" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden;">
                        <div style="padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                            <span contenteditable="true" class="ww-lore-title" style="font-weight: 600; color: var(--accent);">${entry.title}</span>
                            <span style="font-size: 10px; background: var(--bg-base); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${entry.category || 'General'}</span>
                        </div>
                        <div contenteditable="true" class="ww-lore-content" style="padding: 16px; color: var(--text-secondary); line-height: 1.6; font-size: 14px;">${entry.content}</div>
                        <div style="padding: 8px 16px; border-top: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; gap: 6px;">
                            ${(entry.keys || []).map(k => `<span style="font-size: 10px; color: var(--text-muted);">#${k}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function importGeneratedContent(data, type, session, A) {
        const state = A.State.get();

        if (type === 'character') {
            const actorId = `char_${Date.now()}`;
            const finalId = data.id || actorId;

            const newActor = {
                id: finalId,
                name: data.name || 'Unnamed',
                description: data.description || '',
                summary: data.summary || '',
                traits: data.traits || [],
                notes: data.notes || '',
                gender: data.gender || 'unknown',
                type: 'character',
                system_prompt: '',
                post_history_instructions: '',
                creator_notes: `Generated by World Weaver from session: ${session.name}`,
                tags: ['Generated', 'WorldWeaver'],
                alternate_greetings: [],
                avatar: '',
                scenario: data.scenario || '',
                first_message: data.first_message || ''
            };

            if (!state.nodes.actors) state.nodes.actors = { items: {} };
            state.nodes.actors.items[finalId] = newActor;
        }
        else if (type === 'world') {
            if (!state.weaves) state.weaves = {};
            if (!state.weaves.lorebook) state.weaves.lorebook = { entries: {} };

            let count = 0;
            const timestamp = Date.now();

            (data.entries || []).forEach((entry, idx) => {
                const id = entry.id || `lore_${timestamp}_${idx}`;
                const uuid = crypto.randomUUID();

                state.weaves.lorebook.entries[id] = {
                    id: id,
                    title: entry.title,
                    keywords: entry.keys || entry.keywords || [],
                    content: entry.content,
                    enabled: true,
                    priority: 50,
                    category: (entry.category || 'uncategorized').toLowerCase(),
                    requireTags: [],
                    blocksTags: [],
                    tags: ['Generated'],
                    shifts: [],
                    uuid: uuid
                };
                count++;
            });
        }

        A.State.notify();
    }

    function showGenerationOptions(session, sessions, A) {
        // Reuse constants
        // Actually, UI calls this. We can move this function to UI or export it.
        // It's cleaner here as it's the entry point to generation.
        // But UI constructs the modal.
        // ... Wait, I put showGenerationOptions in UI.js in the previous thought.
        // So I ONLY need handleGeneration here exposed?
        // Yes. Let's export only handleGeneration for now.
        // But wait, the previous `UI.js` I planned called `showGenerationOptions`.
        // I will implement `showGenerationOptions` in `ui.js` as planned and just export `handleGeneration` here.
        // But `generation.js` has the templates dependency so `handleGeneration` needs `T`.
    }

    // Expose
    A.WorldWeaver.Generation = {
        handleGeneration
    };

})(window.Anansi);
