/**
 * Anansi RPG: LLM Response Cache
 * File: js/plugins/rpg/rpg_cache.js
 * Purpose: Reduce redundant LLM API calls by caching repeatable outputs
 * Inspired by LlamaTale's llm_cache system
 */

(function (RPG) {
    'use strict';

    const MAX_CACHE_SIZE = 100;              // Maximum cached entries
    const CACHE_TTL_MS = 30 * 60 * 1000;     // 30 minutes default TTL

    RPG.Cache = {
        _cache: new Map(),
        _stats: {
            hits: 0,
            misses: 0
        },

        /**
         * Generate a hash for a cache key
         * @param {string|object} input - Input to hash
         * @returns {string} Hash string like "cache_abc123"
         */
        hash: function (input) {
            let hash = 0;
            const str = typeof input === 'string' ? input : JSON.stringify(input);

            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0; // Convert to 32-bit integer
            }

            return 'cache_' + Math.abs(hash).toString(36);
        },

        /**
         * Get a value from cache
         * @param {string} key - Cache key
         * @returns {*} Cached value or null if not found/expired
         */
        get: function (key) {
            const entry = this._cache.get(key);

            if (!entry) {
                this._stats.misses++;
                return null;
            }

            // Check TTL expiration
            if (Date.now() - entry.timestamp > (entry.ttl || CACHE_TTL_MS)) {
                this._cache.delete(key);
                this._stats.misses++;
                return null;
            }

            this._stats.hits++;
            return entry.value;
        },

        /**
         * Set a value in cache
         * @param {string} key - Cache key
         * @param {*} value - Value to cache
         * @param {number} ttl - Optional custom TTL in milliseconds
         */
        set: function (key, value, ttl = null) {
            // Evict oldest entry if at capacity
            if (this._cache.size >= MAX_CACHE_SIZE) {
                const oldestKey = this._cache.keys().next().value;
                this._cache.delete(oldestKey);
            }

            this._cache.set(key, {
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            });
        },

        /**
         * Check if key exists and is not expired
         * @param {string} key 
         * @returns {boolean}
         */
        has: function (key) {
            const entry = this._cache.get(key);
            if (!entry) return false;

            if (Date.now() - entry.timestamp > (entry.ttl || CACHE_TTL_MS)) {
                this._cache.delete(key);
                return false;
            }

            return true;
        },

        /**
         * Get from cache or generate and cache the result
         * @param {string} cacheKey - Key for caching
         * @param {Function} generatorFn - Async function to generate value if not cached
         * @param {number} ttl - Optional custom TTL
         * @returns {Promise<*>} Cached or generated value
         */
        getOrGenerate: async function (cacheKey, generatorFn, ttl = null) {
            // Try cache first
            const cached = this.get(cacheKey);
            if (cached !== null) {
                console.log('[RPG.Cache] Hit:', cacheKey);
                return cached;
            }

            console.log('[RPG.Cache] Miss:', cacheKey);

            // Generate new value
            try {
                const result = await generatorFn();
                if (result !== null && result !== undefined) {
                    this.set(cacheKey, result, ttl);
                }
                return result;
            } catch (e) {
                console.error('[RPG.Cache] Generation failed:', e);
                return null;
            }
        },

        /**
         * Synchronous version of getOrGenerate
         * @param {string} cacheKey 
         * @param {Function} generatorFn - Synchronous generator
         * @param {number} ttl 
         * @returns {*}
         */
        getOrGenerateSync: function (cacheKey, generatorFn, ttl = null) {
            const cached = this.get(cacheKey);
            if (cached !== null) {
                return cached;
            }

            const result = generatorFn();
            if (result !== null && result !== undefined) {
                this.set(cacheKey, result, ttl);
            }
            return result;
        },

        /**
         * Delete a specific cache entry
         * @param {string} key 
         */
        delete: function (key) {
            this._cache.delete(key);
        },

        /**
         * Clear all cached entries
         */
        clear: function () {
            this._cache.clear();
            console.log('[RPG.Cache] Cache cleared');
        },

        /**
         * Remove expired entries (garbage collection)
         * @returns {number} Number of entries removed
         */
        prune: function () {
            const now = Date.now();
            let pruned = 0;

            for (const [key, entry] of this._cache) {
                if (now - entry.timestamp > (entry.ttl || CACHE_TTL_MS)) {
                    this._cache.delete(key);
                    pruned++;
                }
            }

            if (pruned > 0) {
                console.log(`[RPG.Cache] Pruned ${pruned} expired entries`);
            }
            return pruned;
        },

        /**
         * Get cache statistics
         * @returns {object}
         */
        stats: function () {
            const total = this._stats.hits + this._stats.misses;
            return {
                size: this._cache.size,
                maxSize: MAX_CACHE_SIZE,
                ttlMinutes: CACHE_TTL_MS / 60000,
                hits: this._stats.hits,
                misses: this._stats.misses,
                hitRate: total > 0 ? (this._stats.hits / total * 100).toFixed(1) + '%' : 'N/A'
            };
        },

        /**
         * Reset statistics
         */
        resetStats: function () {
            this._stats = { hits: 0, misses: 0 };
        },

        /**
         * Cache helper: Location description
         * @param {string} locationId 
         * @param {Function} generator 
         */
        locationDescription: async function (locationId, generator) {
            const key = this.hash(`loc_desc_${locationId}`);
            return this.getOrGenerate(key, generator, 60 * 60 * 1000); // 1 hour TTL
        },

        /**
         * Cache helper: NPC introduction
         * @param {string} npcId 
         * @param {Function} generator 
         */
        npcIntroduction: async function (npcId, generator) {
            const key = this.hash(`npc_intro_${npcId}`);
            return this.getOrGenerate(key, generator, 30 * 60 * 1000); // 30 min TTL
        },

        /**
         * Cache helper: Combat narration (short TTL since dynamic)
         * @param {string} combatHash 
         * @param {Function} generator 
         */
        combatNarration: async function (combatHash, generator) {
            const key = this.hash(`combat_${combatHash}`);
            return this.getOrGenerate(key, generator, 5 * 60 * 1000); // 5 min TTL
        }
    };

    // Auto-prune every 5 minutes
    setInterval(() => {
        if (RPG.Cache._cache.size > 0) {
            RPG.Cache.prune();
        }
    }, 5 * 60 * 1000);

    console.log('[RPG] Response cache system loaded');

})(window.RPG || (window.RPG = {}));
