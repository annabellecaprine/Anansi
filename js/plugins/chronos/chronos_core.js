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

    function isAdjacent(state, locA, locB) {
        const locs = getLocations(state);
        const loc = locs[locA];
        if (!loc) return false;

        // Connections are in 'exits' field
        const exits = loc.exits || loc.connections || [];
        return exits.some(exit => {
            const exitId = typeof exit === 'string' ? exit : exit.id;
            return exitId === locB;
        });
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
            } else if (isAdjacent(state, userLocId, pos.location)) {
                nearby.push(entry);
            } else {
                elsewhere.push(entry);
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
            enabled: chronos.userLocation != null,
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

        // Header
        lines.push('');
        lines.push('═══════════════════════════════════════════════════════════');
        lines.push('WORLD STATE (Authoritative — Do Not Contradict)');
        lines.push('═══════════════════════════════════════════════════════════');
        lines.push('');

        // Time
        const time = chronosContext.time;
        lines.push(`【TIME】 ${time.label} (${time.hours || ''})`);

        // Weather
        const weather = chronosContext.weather;
        if (weather && weather.condition !== 'clear') {
            const desc = weather.description || DEFAULT_WEATHER_PRESETS[weather.condition]?.description || '';
            lines.push(`【WEATHER】 ${weather.intensity} ${weather.condition}${desc ? ' — ' + desc : ''}`);
        } else if (weather) {
            lines.push(`【WEATHER】 Clear and pleasant`);
        }

        // Location
        const loc = chronosContext.userLocation;
        if (loc) {
            lines.push(`【LOCATION】 ${loc.name}`);
            if (loc.description) {
                lines.push(`            ${loc.description}`);
            }
        }

        // Present in scene
        lines.push('');
        lines.push('【PRESENT IN SCENE】');
        if (chronosContext.actorsPresent.length === 0) {
            lines.push('  (No one else is here)');
        } else {
            chronosContext.actorsPresent.forEach(a => {
                const availNote = a.available ? '' : ' [occupied, may not respond]';
                lines.push(`  • ${a.name} — ${a.activity}${availNote}`);
            });
        }

        // Nearby
        if (chronosContext.actorsNearby.length > 0) {
            lines.push('');
            lines.push('【NEARBY (can be heard/glimpsed, not directly interacted with unless User goes there)】');
            chronosContext.actorsNearby.forEach(a => {
                lines.push(`  • ${a.name} — In ${a.locationName}, ${a.activity}`);
            });
        }

        // Constraints (based on level)
        if (level !== 'minimal') {
            lines.push('');
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('NARRATOR CONSTRAINTS');
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('');
            lines.push('YOU MAY:');
            lines.push('  ✓ Describe the current location and ambient details');
            lines.push('  ✓ Have PRESENT actors speak and react naturally within their activity');
            lines.push('  ✓ Reference sounds or glimpses from NEARBY actors');
            lines.push('  ✓ Describe weather effects appropriate to the conditions');
            lines.push('');
            lines.push('YOU MAY NOT:');
            lines.push('  ✗ Move any actor to a different location');
            lines.push('  ✗ Have NEARBY actors enter the scene unless User explicitly goes to them');
            lines.push('  ✗ Introduce actors not listed as Present or Nearby');
            lines.push('  ✗ Change the time of day or weather conditions');

            if (level === 'strict') {
                lines.push('  ✗ Have PRESENT actors leave the scene for any reason');
                lines.push('  ✗ Reference actors listed as elsewhere');
            }
        }

        // Pending Transitions (narrate these changes in response)
        const pending = chronosContext.pendingChanges;
        if (pending) {
            lines.push('');
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('⚡ PENDING TRANSITIONS — NARRATE THESE IN YOUR RESPONSE');
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('');
            lines.push('The following changes are about to occur. Naturally weave the transition into your narrative:');
            lines.push('');

            if (pending.time) {
                lines.push(`  → Time is shifting to ${pending.time.label}`);
            }
            if (pending.weather) {
                const intensityLabel = pending.intensity ? `${pending.intensity} ` : '';
                lines.push(`  → Weather is changing to ${intensityLabel}${pending.weather.label}`);
            } else if (pending.intensity) {
                lines.push(`  → Weather intensity is changing to ${pending.intensity}`);
            }
            if (pending.location) {
                lines.push(`  → User is moving to ${pending.location.name}`);
            }

            lines.push('');
            lines.push('Describe this transition naturally (e.g., "As the sun dips toward the horizon...", "The first drops of rain begin to fall...")');
        }

        lines.push('');

        return lines.join('\n');
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

        // Defaults (for UI)
        DEFAULT_TIME_SLOTS,
        DEFAULT_WEATHER_PRESETS,
        DEFAULT_INTENSITY_LEVELS
    };

    console.log('[Chronos] Core module loaded');

})(window.Anansi);
