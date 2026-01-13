/*
 * Anansi Plugin: Chronos Core
 * File: js/plugins/chronos/chronos_core.js
 * Category: Immersion
 * Purpose: State management, context builders, and helper functions for Enhanced RP.
 */

(function (A) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // DEFAULT STATE STRUCTURE
    // ═══════════════════════════════════════════════════════════════════════════

    const DEFAULT_TIME_SLOTS = {
        'dawn': { label: 'Dawn', hours: '5:00 - 7:00', icon: '🌅', order: 0, description: 'The first light of day breaks over the horizon.' },
        'morning': { label: 'Morning', hours: '7:00 - 12:00', icon: '☀️', order: 1, description: 'The sun rises higher, bringing warmth and activity.' },
        'afternoon': { label: 'Afternoon', hours: '12:00 - 17:00', icon: '🌤️', order: 2, description: 'The heart of the day, when the sun is at its peak.' },
        'evening': { label: 'Evening', hours: '17:00 - 21:00', icon: '🌆', order: 3, description: 'The sun begins its descent, casting long shadows.' },
        'night': { label: 'Night', hours: '21:00 - 5:00', icon: '🌙', order: 4, description: 'Darkness blankets the world under starlit skies.' }
    };

    const DEFAULT_WEATHER_PRESETS = {
        'clear': { label: 'Clear', icon: '☀️', description: 'Clear skies and pleasant weather' },
        'cloudy': { label: 'Cloudy', icon: '☁️', description: 'Overcast skies blocking the sun' },
        'rain': { label: 'Rain', icon: '🌧️', description: 'Steady rainfall from grey clouds' },
        'storm': { label: 'Storm', icon: '⛈️', description: 'Thunder and lightning with heavy rain' },
        'snow': { label: 'Snow', icon: '❄️', description: 'Snowfall blanketing the area in white' },
        'fog': { label: 'Fog', icon: '🌫️', description: 'Thick fog limiting visibility' },
        'wind': { label: 'Windy', icon: '💨', description: 'Strong gusts of wind buffeting the area' }
    };

    const DEFAULT_INTENSITY_LEVELS = {
        'light': { label: 'Light', description: 'Barely noticeable, a subtle hint in the air.' },
        'moderate': { label: 'Moderate', description: 'Clearly present but not overwhelming.' },
        'heavy': { label: 'Heavy', description: 'Dominant and hard to ignore, affecting activities.' },
        'extreme': { label: 'Extreme', description: 'Dangerous conditions, visibility or movement severely impacted.' }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function ensureChronosState(state) {
        if (!state.chronos) {
            state.chronos = {
                currentTime: 'afternoon',
                weather: {
                    condition: 'clear',
                    intensity: 'moderate',
                    description: ''
                },
                userLocation: null,
                actorLocations: {},
                schedules: {},
                timeSlots: JSON.parse(JSON.stringify(DEFAULT_TIME_SLOTS)),
                weatherPresets: JSON.parse(JSON.stringify(DEFAULT_WEATHER_PRESETS)),
                intensityLevels: JSON.parse(JSON.stringify(DEFAULT_INTENSITY_LEVELS)),
                pendingChanges: null, // Staged changes to apply on next LLM response
                settings: {
                    autoAdvanceTime: false,
                    showNearbyActors: true,
                    promptConstraintsLevel: 'standard' // minimal, standard, strict
                },
                history: [],
                user: {
                    name: 'Player',
                    description: 'A silent observer.'
                }
            };
        }
        // Ensure new properties exist on older saves
        if (!state.chronos.weatherPresets) {
            state.chronos.weatherPresets = JSON.parse(JSON.stringify(DEFAULT_WEATHER_PRESETS));
        }
        if (!state.chronos.intensityLevels) {
            state.chronos.intensityLevels = JSON.parse(JSON.stringify(DEFAULT_INTENSITY_LEVELS));
        }
        if (!state.chronos.history) {
            state.chronos.history = [];
        }
        if (state.chronos.pendingChanges === undefined) {
            state.chronos.pendingChanges = null;
        }
        if (!state.chronos.user) {
            state.chronos.user = {
                name: state.meta?.author || 'Player',
                description: 'A silent observer.'
            };
        }
        return state.chronos;
    }

    /**
     * Stage changes to be applied on next LLM response
     */
    function stagePendingChange(state, changeType, value) {
        const chronos = ensureChronosState(state);
        if (!chronos.pendingChanges) {
            chronos.pendingChanges = {};
        }
        chronos.pendingChanges[changeType] = value;
    }

    /**
     * Apply all pending changes (call after LLM response)
     */
    function applyPendingChanges(state) {
        const chronos = ensureChronosState(state);
        if (!chronos.pendingChanges) return false;

        const changes = chronos.pendingChanges;
        let hasChanges = false;

        if (changes.time !== undefined) {
            chronos.currentTime = changes.time;
            hasChanges = true;
        }
        if (changes.weather !== undefined) {
            chronos.weather.condition = changes.weather;
            hasChanges = true;
        }
        if (changes.intensity !== undefined) {
            chronos.weather.intensity = changes.intensity;
            hasChanges = true;
        }
        if (changes.location !== undefined) {
            chronos.userLocation = changes.location;
            hasChanges = true;
        }

        chronos.pendingChanges = null;
        return hasChanges;
    }

    /**
     * Clear pending changes without applying
     */
    function clearPendingChanges(state) {
        const chronos = ensureChronosState(state);
        chronos.pendingChanges = null;
    }

    /**
     * Check if there are pending changes
     */
    function hasPendingChanges(state) {
        const chronos = ensureChronosState(state);
        return chronos.pendingChanges !== null && Object.keys(chronos.pendingChanges).length > 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOCATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    // Gets all locations from all maps as a flat object keyed by ID
    function getLocations(state) {
        // Use A.Locations helper if available
        if (A.Locations?.getActiveMap) {
            const activeMap = A.Locations.getActiveMap(state);
            const locs = activeMap?.locations || [];
            // Convert array to object keyed by id for easy lookup
            const result = {};
            locs.forEach(loc => { result[loc.id] = loc; });
            return result;
        }

        // Fallback: try multi-map structure
        if (state.weaves?.maps) {
            const result = {};
            state.weaves.maps.forEach(map => {
                (map.locations || []).forEach(loc => {
                    result[loc.id] = loc;
                });
            });
            return result;
        }

        // Legacy: flat array
        if (Array.isArray(state.weaves?.locations)) {
            const result = {};
            state.weaves.locations.forEach(loc => { result[loc.id] = loc; });
            return result;
        }

        return {};
    }

    // Gets all locations from the active map only (for dropdowns)
    function getActiveMapLocations(state) {
        if (A.Locations?.getActiveMap) {
            const activeMap = A.Locations.getActiveMap(state);
            const locs = activeMap?.locations || [];
            const result = {};
            locs.forEach(loc => { result[loc.id] = loc; });
            return result;
        }
        return getLocations(state);
    }

    function getLocationById(state, locId) {
        const locs = getLocations(state);
        return locs[locId] || null;
    }

    function getConnectedLocations(state, locId) {
        const locs = getLocations(state);
        const loc = locs[locId];
        if (!loc) return [];

        // Connections are in 'exits' field (can be string IDs or objects with {id, type})
        const exits = loc.exits || loc.connections || [];

        return exits
            .map(exit => {
                const exitId = typeof exit === 'string' ? exit : exit.id;
                return locs[exitId] ? { id: exitId, ...locs[exitId] } : null;
            })
            .filter(l => l !== null);
    }

    function getConnection(state, locAId, locBId) {
        const locs = getLocations(state);
        const locA = locs[locAId];
        if (!locA) return null;

        const exits = locA.exits || locA.connections || [];
        // Check for direct object with ID, or string ID matches
        // Standardize: exit can be "locB" or { id: "locB", ... }
        const exit = exits.find(e => {
            const eId = typeof e === 'string' ? e : e.id;
            return eId === locBId;
        });

        if (!exit) return null;

        // If string, return default connection
        if (typeof exit === 'string') {
            return { id: exit, type: 'path', description: 'adjacent', status: 'open' };
        }

        // Clone to avoid mutating state
        const conn = { ...exit };
        conn.status = 'open';

        // 1. Time Check
        if (conn.time) {
            const chronos = ensureChronosState(state);
            const current = chronos.currentTime;
            const validTimes = Array.isArray(conn.time) ? conn.time : [conn.time];
            // If current time is NOT in valid list, it's closed
            if (!validTimes.includes(current)) {
                conn.status = 'closed';
                conn.description = conn.locked_msg || `Closed (${conn.description})`;
            }
        }

        // 2. Condition Check (Logic Gate)
        if (conn.condition) {
            // Check global flags (bucket for quest items/state)
            const flags = state.flags || {};
            // If condition flag is missing/false, it's locked
            if (!flags[conn.condition]) {
                conn.status = 'locked';
                if (conn.locked_msg) conn.description = conn.locked_msg;
            }
        }

        return conn;

    }

    function isAdjacent(state, locA, locB) {
        return !!getConnection(state, locA, locB);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTOR HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getActors(state) {
        return state.nodes?.actors?.items || {};
    }

    function getActorById(state, actorId) {
        const actors = getActors(state);
        return actors[actorId] || null;
    }

    function getActorSchedule(state, actorId) {
        const chronos = ensureChronosState(state);
        return chronos.schedules[actorId] || null;
    }

    function getActorLocationAtTime(state, actorId, timeSlot) {
        const schedule = getActorSchedule(state, actorId);
        if (!schedule) return null;

        const slot = schedule[timeSlot];
        if (!slot) return null;

        return {
            location: slot.location,
            activity: slot.activity || 'present',
            available: slot.available !== false,
            notes: slot.notes || ''
        };
    }

    function getCurrentActorPositions(state) {
        const chronos = ensureChronosState(state);
        const currentTime = chronos.currentTime;
        const positions = {};

        Object.keys(chronos.schedules).forEach(actorId => {
            const pos = getActorLocationAtTime(state, actorId, currentTime);
            if (pos) {
                positions[actorId] = pos;
            }
        });

        return positions;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTEXT BUILDER (For processRound integration)
    // ═══════════════════════════════════════════════════════════════════════════

    function buildChronosContext(state) {
        const chronos = ensureChronosState(state);
        const actors = getActors(state);
        const locations = getLocations(state);

        // Get current time info
        const currentTime = chronos.currentTime || 'afternoon';
        const timeSlot = chronos.timeSlots[currentTime] || DEFAULT_TIME_SLOTS[currentTime] || { label: currentTime };

        // Get actor positions
        const actorPositions = getCurrentActorPositions(state);

        // Get user location info
        const userLocId = chronos.userLocation;
        const userLocData = userLocId ? getLocationById(state, userLocId) : null;

        // Categorize actors by proximity to user
        const present = [];
        const nearby = [];
        const elsewhere = [];

        Object.entries(actorPositions).forEach(([actorId, pos]) => {
            const actor = actors[actorId];
            if (!actor) return;

            // Get actor image if available
            const imgParams = (actor.gallery?.primary && actor.gallery?.images)
                ? actor.gallery.images.find(i => i.id === actor.gallery.primary)
                : null;

            const entry = {
                id: actorId,
                name: actor.name || actorId,
                location: pos.location,
                locationName: locations[pos.location]?.name || pos.location,
                activity: pos.activity,
                available: pos.available,
                notes: pos.notes,
                image: imgParams?.data || null
            };

            if (!userLocId) {
                // No user location set, everyone is "elsewhere"
                elsewhere.push(entry);
            } else if (pos.location === userLocId) {
                present.push(entry);
            } else {
                // Check adjacency and soundproofness
                const conn = getConnection(state, userLocId, pos.location);
                if (conn) {
                    // Status Check
                    if (conn.status === 'closed') {
                        // Time-gated / Closed: Treat as elsewhere (blocked view/audio)
                        elsewhere.push(entry);
                    }
                    else if (conn.soundproof) {
                        // Soundproof: Treat as elsewhere
                        elsewhere.push(entry);
                    }
                    else {
                        // Open/Locked and audible
                        // Add connection flavor
                        let desc = conn.description ? `(via ${conn.description})` :
                            conn.type ? `(via ${conn.type})` : '';

                        // Append Lock status to description for prompt awareness
                        if (conn.status === 'locked') {
                            desc += ' [LOCKED]';
                        }

                        entry.connectionDesc = desc;
                        nearby.push(entry);
                    }
                } else {
                    elsewhere.push(entry);
                }
            }
        });

        // Build pending changes info if any
        const pending = chronos.pendingChanges || null;
        let pendingInfo = null;
        if (pending && Object.keys(pending).length > 0) {
            pendingInfo = {};
            if (pending.time !== undefined) {
                const slot = chronos.timeSlots[pending.time] || DEFAULT_TIME_SLOTS[pending.time];
                pendingInfo.time = { slot: pending.time, label: slot?.label || pending.time };
            }
            if (pending.weather !== undefined) {
                const preset = chronos.weatherPresets[pending.weather] || DEFAULT_WEATHER_PRESETS[pending.weather];
                pendingInfo.weather = { condition: pending.weather, label: preset?.label || pending.weather };
            }
            if (pending.intensity !== undefined) {
                pendingInfo.intensity = pending.intensity;
            }
            if (pending.location !== undefined) {
                const loc = getLocationById(state, pending.location);
                pendingInfo.location = { id: pending.location, name: loc?.name || pending.location };
            }
        }

        return {
            enabled: chronos.userLocation != null || (pendingInfo && Object.keys(pendingInfo).length > 0),
            time: {
                slot: currentTime,
                label: timeSlot.label,
                hours: timeSlot.hours,
                icon: timeSlot.icon
            },
            weather: {
                condition: chronos.weather?.condition || 'clear',
                intensity: chronos.weather?.intensity || 'moderate',
                description: chronos.weather?.description || '',
                icon: DEFAULT_WEATHER_PRESETS[chronos.weather?.condition]?.icon || '☀️'
            },
            userLocation: userLocData ? {
                id: userLocId,
                name: userLocData.name || userLocId,
                description: userLocData.description || ''
            } : null,
            actorsPresent: present,
            actorsNearby: nearby,
            actorsElsewhere: elsewhere,
            settings: chronos.settings || {},
            pendingChanges: pendingInfo
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROMPT BLOCK BUILDER (For system prompt injection)
    // ═══════════════════════════════════════════════════════════════════════════

    function buildChronosPromptBlock(chronosContext, level = 'standard') {
        if (!chronosContext || !chronosContext.enabled) return '';

        const lines = [];

        // 1. STATE SNAPSHOT (The "Mechanical" Truth)
        // This is designed for the LLM to parse as a strict constraint.
        lines.push('*** STATE_SNAPSHOT (Canonical Truth) ***');

        // Time & Weather
        const time = chronosContext.time;
        const weather = chronosContext.weather;
        lines.push(`TIME_ID: ${time.slot} (${time.label})`);
        lines.push(`WEATHER_ID: ${weather.condition} (${weather.intensity})`);

        // Location
        const loc = chronosContext.userLocation;
        const locName = loc ? loc.name : 'Unknown';
        const locId = loc ? loc.id : 'null';
        lines.push(`USER_LOC_ID: ${locId}`);
        lines.push(`USER_LOC_NAME: ${locName}`);

        // Actors Present
        const presentIds = chronosContext.actorsPresent.map(a => a.name).join(', ');
        lines.push(`PRESENT_ACTORS: [${presentIds}]`);

        // Actors Nearby (Grouped by location + connection for clarity)
        const nearbyMap = {};
        chronosContext.actorsNearby.forEach(a => {
            // Include connection desc in the grouping key if present
            const key = a.connectionDesc ? `${a.locationName} ${a.connectionDesc}` : a.locationName;
            if (!nearbyMap[key]) nearbyMap[key] = [];
            nearbyMap[key].push(a.name);
        });
        const nearbyStr = Object.entries(nearbyMap)
            .map(([l, actors]) => `${l}:[${actors.join(', ')}]`)
            .join(' | ');

        lines.push(`NEARBY_MAP: { ${nearbyStr || 'None'} }`);
        lines.push(''); // Spacer


        // 2. DESCRIPTIVE CONTEXT (The "Flavor")
        // This provides the narrative details for the above snapshot.
        lines.push('*** DESCRIPTIVE CONTEXT ***');

        if (loc && loc.description) {
            lines.push(`LOCATION_DESC: "${loc.description}"`);
        }

        if (weather && weather.description) {
            lines.push(`WEATHER_DESC: "${weather.description}"`);
        }

        if (chronosContext.actorsPresent.length > 0) {
            lines.push('ACTIVE_SCENE_ACTORS:');
            chronosContext.actorsPresent.forEach(a => {
                const availNote = a.available ? '' : ' (Occupied)';
                lines.push(` - ${a.name}: ${a.activity}${availNote}`);
            });
        }
        lines.push(''); // Spacer


        // 3. PENDING TRANSITIONS (The "Delta")
        // These MUST be enacted.
        const pending = chronosContext.pendingChanges;
        const isTransitioning = pending && Object.keys(pending).length > 0;

        if (isTransitioning) {
            lines.push('*** STATE_DELTA (Pending Transitions - ENACT THIS) ***');
            if (pending.time) {
                lines.push(`>>> DELTA_TIME: Shift to ${pending.time.label}`);
            }
            if (pending.weather) {
                const intensityLabel = pending.intensity ? `${pending.intensity} ` : '';
                lines.push(`>>> DELTA_WEATHER: Change to ${intensityLabel}${pending.weather.label}`);
            } else if (pending.intensity) {
                lines.push(`>>> DELTA_WEATHER_INTENSITY: Change to ${pending.intensity}`);
            }
            if (pending.location) {
                lines.push(`>>> DELTA_LOCATION: User moves to ${pending.location.name}`);
            }
            lines.push('INSTRUCTION: You MUST narrate these changes occurring.');
            lines.push('');
        }


        // 4. COMPLIANCE CONTRACT (The "Grader")
        if (level !== 'minimal') {
            lines.push('*** COMPLIANCE CONTRACT (Failure Conditions) ***');
            lines.push('1. CRITICAL ERROR: Contradicting the STATE_SNAPSHOT (e.g. claiming it is Night when TIME_ID is Afternoon).');
            lines.push('2. HALLUCINATION: Depicting actors not listed in PRESENT_ACTORS as being in the room.');
            lines.push('3. BOUNDARY VIOLATION: Spawning actors from NEARBY_MAP without an explicit transition event.');

            if (level === 'strict') {
                lines.push('4. STRICT MODE: You must not imply the user leaves the current location unless DELTA_LOCATION is present.');
            }

            if (!isTransitioning) {
                lines.push('5. STASIS: Do not change weather or time unless a DELTA is present.');
            }
        }

        lines.push('');
        return lines.join('\n');
    }

    /**
     * Get a plain text description of pending changes (for injection into chat stream)
     */
    function getPendingDescription(state) {
        const chronos = ensureChronosState(state);
        const pending = chronos.pendingChanges;
        if (!pending || Object.keys(pending).length === 0) return null;

        const parts = [];
        if (pending.time) {
            const slot = chronos.timeSlots[pending.time] || DEFAULT_TIME_SLOTS[pending.time];
            parts.push(`Time shifting to ${slot?.label || pending.time}`);
        }
        if (pending.weather) {
            const preset = chronos.weatherPresets[pending.weather];
            parts.push(`Weather changing to ${pending.weather} (${preset?.description || ''})`);
        } else if (pending.intensity) {
            parts.push(`Weather intensity changing to ${pending.intensity}`);
        }
        if (pending.location) {
            const loc = getLocationById(state, pending.location);
            parts.push(`Moving to location: ${loc?.name || pending.location}`);
        }

        if (parts.length === 0) return null;
        return `[TRANSITION EVENT: ${parts.join('; ')}. Narrate this change/movement in your response.]`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCHEDULE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function setActorSchedule(state, actorId, schedule) {
        const chronos = ensureChronosState(state);
        chronos.schedules[actorId] = schedule;
        return chronos.schedules[actorId];
    }

    function setActorSlot(state, actorId, timeSlot, slotData) {
        const chronos = ensureChronosState(state);
        if (!chronos.schedules[actorId]) {
            chronos.schedules[actorId] = {};
        }
        chronos.schedules[actorId][timeSlot] = slotData;
        return chronos.schedules[actorId];
    }

    function removeActorSchedule(state, actorId) {
        const chronos = ensureChronosState(state);
        delete chronos.schedules[actorId];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIME & WEATHER CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    function setCurrentTime(state, timeSlot) {
        const chronos = ensureChronosState(state);
        chronos.currentTime = timeSlot;
        // Recalculate actor positions
        chronos.actorLocations = getCurrentActorPositions(state);
        return chronos.currentTime;
    }

    function advanceTime(state) {
        const chronos = ensureChronosState(state);
        const slots = Object.entries(chronos.timeSlots || DEFAULT_TIME_SLOTS)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
            .map(([key]) => key);

        const currentIdx = slots.indexOf(chronos.currentTime);
        const nextIdx = (currentIdx + 1) % slots.length;
        return setCurrentTime(state, slots[nextIdx]);
    }

    function setWeather(state, condition, intensity = 'moderate', description = '') {
        const chronos = ensureChronosState(state);
        chronos.weather = { condition, intensity, description };
        return chronos.weather;
    }

    function setUserLocation(state, locationId) {
        const chronos = ensureChronosState(state);
        chronos.userLocation = locationId;
        return chronos.userLocation;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    A.Chronos = {
        // State
        ensureState: ensureChronosState,

        // Locations
        getLocations,
        getActiveMapLocations,
        getLocationById,
        getConnectedLocations,
        isAdjacent,

        // Actors
        getActors,
        getActorById,
        getActorSchedule,
        getActorLocationAtTime,
        getCurrentActorPositions,

        // Context Building
        buildContext: buildChronosContext,
        buildPromptBlock: buildChronosPromptBlock,

        // Schedule Management
        setActorSchedule,
        setActorSlot,
        removeActorSchedule,

        // Time & Weather
        setCurrentTime,
        advanceTime,
        setWeather,
        setUserLocation,

        // Pending Changes (staged transitions)
        stagePendingChange,
        applyPendingChanges,
        clearPendingChanges,
        hasPendingChanges,
        getPendingDescription,

        // Defaults (for UI)
        DEFAULT_TIME_SLOTS,
        DEFAULT_WEATHER_PRESETS,
        DEFAULT_INTENSITY_LEVELS
    };

    console.log('[Chronos] Core module loaded');

})(window.Anansi);
