
/**
 * LogicEngine
 * 
 * Implements the "Aura-style" selection pipeline for Lorebook entries.
 * 
 * Pipeline:
 * 1. Normalize Input
 * 2. Pass 1: Select entries based on Keywords OR Active Tags (State)
 * 3. Pass 2: Select entries triggered by tags from Pass 1 (Chaining)
 * 4. Process Shifts (Sub-entries) for all selected entries
 * 
 * Returns: Array of activated entries (including shifts).
 */

class LogicEngine {
    constructor() {
        this.stopWords = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "at", "by", "for", "with"]);
        this.regexCache = new Map();
    }

    /**
     * Main Entry Point
     * @param {string} text - The latest user/ai message text.
     * @param {Array} lorebook - Array of lorebook entries.
     * @param {Object} state - Current state with extended gate context:
     *   {
     *     tags: Set/Array,           // Active tags
     *     emotions: { current: string, all: string[] },  // Emotional state
     *     eros: { currentVibe: number, longTerm: number },  // EROS levels 0-10
     *     intent: string,            // Current intent type
     *     actors: string[]           // Active actor IDs
     *   }
     */
    process(text, lorebook, state = {}) {
        const activeTags = new Set(state.tags || []);
        const contextText = (text || "").toLowerCase();

        const selectedEntries = [];
        const triggeredTags = new Set();

        // --- Pass 1: Direct & State Activation ---
        for (const entry of lorebook) {
            if (!entry.enabled) continue;

            const isHit = this.checkActivation(entry, contextText, activeTags);
            if (isHit) {
                // Check All Constraints (Gates)
                if (this.checkAllGates(entry, activeTags, state)) {
                    selectedEntries.push(entry);

                    // Collect Output Tags
                    if (entry.tags && Array.isArray(entry.tags)) {
                        entry.tags.forEach(t => triggeredTags.add(t));
                    }
                }
            }
        }

        // --- Pass 2: Tag Chaining ---
        if (triggeredTags.size > 0) {
            const combinedTags = new Set([...activeTags, ...triggeredTags]);
            for (const entry of lorebook) {
                if (!entry.enabled || selectedEntries.includes(entry)) continue;

                if (this.isTagDependent(entry)) {
                    if (this.checkAllGates(entry, combinedTags, state)) {
                        selectedEntries.push(entry);
                    }
                }
            }
        }

        // --- Pass 3: Shifts (Sub-Entries) ---
        const finalOutput = [];

        for (const entry of selectedEntries) {
            finalOutput.push({ type: 'entry', data: entry });

            if (entry.shifts && Array.isArray(entry.shifts)) {
                for (const shift of entry.shifts) {
                    if (this.checkActivation(shift, contextText, activeTags) &&
                        this.checkAllGates(shift, activeTags, state)) {
                        finalOutput.push({ type: 'shift', parent: entry.id, data: shift });
                    }
                }
            }
        }

        return finalOutput;
    }

    /**
     * Checks if an entry should activate based on Keywords OR AlwaysOn
     */
    checkActivation(entry, text, activeTags) {
        if (entry.alwaysOn) return true;

        if (entry.keywords && entry.keywords.length > 0) {
            if (this.hasKeyword(text, entry.keywords)) return true;
        }

        return false;
    }

    /**
     * Master gate check - runs all gate types
     */
    checkAllGates(entry, activeTags, state = {}) {
        // Tag gates (existing)
        if (!this.checkTagGates(entry, activeTags)) return false;

        // Emotion gates (new)
        if (!this.checkEmotionGates(entry, state)) return false;

        // EROS gates (new)
        if (!this.checkErosGates(entry, state)) return false;

        // Intent gates (new)
        if (!this.checkIntentGates(entry, state)) return false;

        // Entity gates (new)
        if (!this.checkEntityGates(entry, state)) return false;

        // Probability check (new) - last check, after all conditions pass
        if (!this.checkProbability(entry)) return false;

        return true;
    }

    /**
     * Checks "Requires" and "Blocks" tag gates (legacy)
     */
    checkTagGates(entry, activeTags) {
        // Block Tags (Fail Fast)
        if (entry.blocksTags && entry.blocksTags.length > 0) {
            if (entry.blocksTags.some(t => activeTags.has(t))) return false;
        }

        // Require Tags (ANY match)
        if (entry.requireTags && entry.requireTags.length > 0) {
            const hasAny = entry.requireTags.some(t => activeTags.has(t));
            if (!hasAny) return false;
        }

        return true;
    }

    /**
     * Checks emotion gates: andAny, andAll, notAny, notAll
     * @param {Object} entry - Entry with emotionGates property
     * @param {Object} state - State with emotions: { current: string, all: string[] }
     */
    checkEmotionGates(entry, state) {
        const gates = entry.emotionGates;
        if (!gates) return true;

        const activeEmotions = new Set(state.emotions?.all || []);
        if (state.emotions?.current) {
            activeEmotions.add(state.emotions.current);
        }

        // andAny: requires ANY of these emotions
        if (gates.andAny && gates.andAny.length > 0) {
            const hasAny = gates.andAny.some(e => activeEmotions.has(e));
            if (!hasAny) return false;
        }

        // andAll: requires ALL of these emotions
        if (gates.andAll && gates.andAll.length > 0) {
            const hasAll = gates.andAll.every(e => activeEmotions.has(e));
            if (!hasAll) return false;
        }

        // notAny: blocks if ANY of these emotions present
        if (gates.notAny && gates.notAny.length > 0) {
            const hasAny = gates.notAny.some(e => activeEmotions.has(e));
            if (hasAny) return false;
        }

        // notAll: blocks only if ALL of these emotions present
        if (gates.notAll && gates.notAll.length > 0) {
            const hasAll = gates.notAll.every(e => activeEmotions.has(e));
            if (hasAll) return false;
        }

        return true;
    }

    /**
     * Checks EROS gates: currentVibe range, longTermMin
     * @param {Object} entry - Entry with erosGates property
     * @param {Object} state - State with eros: { currentVibe: number, longTerm: number }
     */
    checkErosGates(entry, state) {
        const gates = entry.erosGates;
        if (!gates) return true;

        const eros = state.eros || { currentVibe: 0, longTerm: 0 };

        // currentVibe range check
        if (gates.currentVibe) {
            const { min, max } = gates.currentVibe;
            if (min !== null && min !== undefined && eros.currentVibe < min) return false;
            if (max !== null && max !== undefined && eros.currentVibe > max) return false;
        }

        // longTermMin check
        if (gates.longTermMin !== null && gates.longTermMin !== undefined) {
            if (eros.longTerm < gates.longTermMin) return false;
        }

        return true;
    }

    /**
     * Checks intent gates: allowedIntents
     * @param {Object} entry - Entry with intentGates property
     * @param {Object} state - State with intent: string
     */
    checkIntentGates(entry, state) {
        const gates = entry.intentGates;
        if (!gates) return true;

        // If no allowed intents specified, allow all
        if (!gates.allowedIntents || gates.allowedIntents.length === 0) return true;

        // Check if current intent is in allowed list
        const currentIntent = state.intent || '';
        return gates.allowedIntents.includes(currentIntent);
    }

    /**
     * Checks entity gates: restrictToActors
     * @param {Object} entry - Entry with entityGates property
     * @param {Object} state - State with actors: string[]
     */
    checkEntityGates(entry, state) {
        const gates = entry.entityGates;
        if (!gates) return true;

        // If no actor restrictions, allow all
        if (!gates.restrictToActors || gates.restrictToActors.length === 0) return true;

        // Check if any required actor is present
        const activeActors = new Set(state.actors || []);
        return gates.restrictToActors.some(actorId => activeActors.has(actorId));
    }

    /**
     * Probability check - random roll against entry's probability setting
     * @param {Object} entry - Entry with probability property (0-100)
     */
    checkProbability(entry) {
        const probability = entry.probability;

        // No probability set or 100% = always pass
        if (probability === undefined || probability === null || probability >= 100) {
            return true;
        }

        // 0% = never pass
        if (probability <= 0) return false;

        // Random roll
        return Math.random() * 100 < probability;
    }

    hasKeyword(text, keys) {
        for (const key of keys) {
            if (!key) continue;
            const normKey = key.toLowerCase().trim();
            if (text.includes(normKey)) return true;
        }
        return false;
    }

    isTagDependent(entry) {
        return (!entry.keywords || entry.keywords.length === 0) && (entry.requireTags && entry.requireTags.length > 0);
    }

    /**
     * Legacy checkGates - kept for backwards compatibility
     * @deprecated Use checkAllGates instead
     */
    checkGates(entry, activeTags) {
        return this.checkTagGates(entry, activeTags);
    }
}

// ============================================================================
// AURA Bridge: Transformer Functions
// Converts Anansi state data to AURA.js ENTITY_DB / RELATIONSHIP_DB format
// ============================================================================

/**
 * Builds ENTITY_DB from Anansi actors state
 * @param {Object} state - Anansi state (from A.State.get())
 * @returns {Object} ENTITY_DB format: { "name": { gender, aliases, lore } }
 */
function buildEntityDB(state) {
    const db = {};
    const actors = state?.nodes?.actors?.items || {};

    Object.values(actors).forEach(actor => {
        if (!actor.name) return;

        const key = actor.name.toLowerCase().trim();
        if (!key) return;

        db[key] = {
            gender: actor.gender || 'N',
            aliases: (actor.aliases || []).map(a => a.toLowerCase().trim()).filter(Boolean),
            lore: actor.notes ? [{
                keywords: [key],
                personality: actor.notes,
                priority: 3
            }] : []
        };
    });

    return db;
}

/**
 * Builds RELATIONSHIP_DB from Anansi pairs state
 * @param {Object} state - Anansi state (from A.State.get())
 * @returns {Array} RELATIONSHIP_DB format: [{ pair, requireTags, injection, group }]
 */
function buildRelationshipDB(state) {
    const actors = state?.nodes?.actors?.items || {};
    const pairs = state?.nodes?.pairs?.items || {};

    return Object.values(pairs).map(pair => {
        // Resolve actor names from IDs
        const actor1Name = (actors[pair.actor1]?.name || '').toLowerCase().trim();
        const actor2Name = (actors[pair.actor2]?.name || '').toLowerCase().trim();

        // Skip if either actor not found
        if (!actor1Name || !actor2Name) return null;

        // Build requireTags from shifts
        const requireTags = (pair.shifts || [])
            .map(s => (s.emotion || '').toUpperCase().trim())
            .filter(Boolean);

        return {
            pair: [actor1Name, actor2Name],
            requireTags: requireTags,
            injection: pair.content || '',
            group: pair.groupId || null
        };
    }).filter(Boolean);
}

// Export transformer functions
if (typeof window !== 'undefined') {
    window.buildEntityDB = buildEntityDB;
    window.buildRelationshipDB = buildRelationshipDB;
}

// Export singleton or class
if (typeof window !== 'undefined') {
    window.LogicEngine = new LogicEngine();
}
if (typeof module !== 'undefined') {
    module.exports = LogicEngine;
}
