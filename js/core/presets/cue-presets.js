/*
 * Anansi Core: Cue Presets
 * File: js/core/presets/cue-presets.js
 * Purpose: Pre-defined cue libraries for PULSE, EROS, and INTENT systems
 */

(function (A) {
    'use strict';

    // Ensure Presets namespace exists
    if (!A.Presets) A.Presets = {};

    /**
     * PULSE Presets - Emotional Expression
     * Each preset defines cues for: joy, sadness, anger, fear, romance, neutral, confusion, positive, negative
     */
    A.Presets.Pulse = {
        expressive: {
            id: 'expressive',
            label: 'Expressive',
            description: 'Highly animated, wears emotions on sleeve',
            cues: {
                joy: { basic: 'beams with delight, practically bouncing', ears: 'perk straight up, quivering', tail: 'wags energetically', wings: 'flutter excitedly', horns: 'seem to gleam' },
                sadness: { basic: 'shoulders slump, eyes glisten', ears: 'droop low', tail: 'hangs limp', wings: 'fold tight against body', horns: 'dull slightly' },
                anger: { basic: 'jaw tightens, eyes blaze', ears: 'flatten back', tail: 'lashes sharply', wings: 'spread aggressively', horns: 'seem to darken' },
                fear: { basic: 'trembles, eyes dart', ears: 'pin back tightly', tail: 'tucks between legs', wings: 'wrap protectively', horns: 'pale slightly' },
                romance: { basic: 'flushes deeply, gazes intently', ears: 'twitch shyly', tail: 'sways slowly', wings: 'half-unfurl softly', horns: 'glow faintly' },
                neutral: { basic: 'expression calm and open', ears: 'relaxed, forward', tail: 'hangs naturally', wings: 'rest comfortably', horns: 'neutral' },
                confusion: { basic: 'tilts head, brow furrows', ears: 'swivel uncertainly', tail: 'twitches erratically', wings: 'shift restlessly', horns: 'flicker' },
                positive: { basic: 'radiates warmth', ears: 'perk attentively', tail: 'gentle wag', wings: 'relax outward', horns: 'brighten' },
                negative: { basic: 'tenses visibly', ears: 'lower cautiously', tail: 'stills', wings: 'draw inward', horns: 'dim' }
            }
        },
        stoic: {
            id: 'stoic',
            label: 'Stoic',
            description: 'Controlled, subtle micro-expressions only',
            cues: {
                joy: { basic: 'corner of mouth twitches upward', ears: 'angle slightly forward', tail: 'tip flicks once', wings: 'shift minutely', horns: '' },
                sadness: { basic: 'gaze grows distant', ears: 'barely lower', tail: 'stills completely', wings: 'draw imperceptibly closer', horns: '' },
                anger: { basic: 'eyes narrow almost imperceptibly', ears: 'flatten slightly', tail: 'tip twitches', wings: 'tense', horns: '' },
                fear: { basic: 'breath catches briefly', ears: 'twitch back', tail: 'stiffens', wings: 'flex', horns: '' },
                romance: { basic: 'holds gaze a moment longer', ears: 'tilt curiously', tail: 'sways once', wings: 'relax', horns: '' },
                neutral: { basic: 'expression unreadable', ears: 'still', tail: 'motionless', wings: 'folded', horns: '' },
                confusion: { basic: 'blinks once', ears: 'twitch', tail: 'tip curls', wings: 'shift', horns: '' },
                positive: { basic: 'posture eases slightly', ears: 'relax forward', tail: 'relaxes', wings: 'loosen', horns: '' },
                negative: { basic: 'muscles tense beneath skin', ears: 'angle back', tail: 'holds rigid', wings: 'tighten', horns: '' }
            }
        },
        tsundere: {
            id: 'tsundere',
            label: 'Tsundere',
            description: 'Defensive, hides true feelings behind bravado',
            cues: {
                joy: { basic: 'tries to suppress a smile, fails', ears: 'twitch despite attempts to control', tail: 'wags before catching itself', wings: 'flutter involuntarily', horns: '' },
                sadness: { basic: 'looks away quickly, voice strained', ears: 'droop before snapping upright', tail: 'tucks briefly', wings: 'wrap tight', horns: '' },
                anger: { basic: 'cheeks flush, stamps foot', ears: 'flatten dramatically', tail: 'puffs up', wings: 'flare', horns: '' },
                fear: { basic: 'flinches, then glares defiantly', ears: 'pin back', tail: 'bristles', wings: 'wrap defensively', horns: '' },
                romance: { basic: 'blushes furiously, looks away', ears: 'burn red at tips', tail: 'twitches nervously', wings: 'rustle anxiously', horns: '' },
                neutral: { basic: 'crosses arms, chin lifted', ears: 'alert, guarded', tail: 'swishes impatiently', wings: 'half-folded', horns: '' },
                confusion: { basic: 'sputters indignantly', ears: 'swivel wildly', tail: 'lashes in frustration', wings: 'flutter chaotically', horns: '' },
                positive: { basic: 'huffs but can\'t hide warmth in eyes', ears: 'perk despite efforts', tail: 'betrays a wag', wings: 'relax reluctantly', horns: '' },
                negative: { basic: 'scowls, turns sharply away', ears: 'flatten', tail: 'bristles', wings: 'snap closed', horns: '' }
            }
        },
        kuudere: {
            id: 'kuudere',
            label: 'Kuudere',
            description: 'Cool, analytical, emotions barely surface',
            cues: {
                joy: { basic: 'eyes soften almost imperceptibly', ears: '', tail: '', wings: '', horns: '' },
                sadness: { basic: 'gaze grows hollow', ears: '', tail: '', wings: '', horns: '' },
                anger: { basic: 'voice drops to ice', ears: '', tail: '', wings: '', horns: '' },
                fear: { basic: 'pupils dilate briefly', ears: '', tail: '', wings: '', horns: '' },
                romance: { basic: 'cheeks hint at color', ears: '', tail: '', wings: '', horns: '' },
                neutral: { basic: 'expression perfectly blank', ears: '', tail: '', wings: '', horns: '' },
                confusion: { basic: 'head tilts fractionally', ears: '', tail: '', wings: '', horns: '' },
                positive: { basic: 'shoulders lower slightly', ears: '', tail: '', wings: '', horns: '' },
                negative: { basic: 'jaw sets', ears: '', tail: '', wings: '', horns: '' }
            }
        },
        excitable: {
            id: 'excitable',
            label: 'Excitable',
            description: 'Everything is intense, maximum energy',
            cues: {
                joy: { basic: 'practically vibrates with happiness', ears: 'spring up, twitch rapidly', tail: 'wags so hard whole body moves', wings: 'buzz with energy', horns: 'seem to sparkle' },
                sadness: { basic: 'tears well immediately', ears: 'droop dramatically', tail: 'goes completely limp', wings: 'droop to the ground', horns: 'lose all luster' },
                anger: { basic: 'face turns red, shouts', ears: 'flatten against head', tail: 'puffs up enormously', wings: 'snap out threateningly', horns: 'glow with heat' },
                fear: { basic: 'freezes, eyes huge', ears: 'pin back hard', tail: 'wraps around leg', wings: 'cocoon around self', horns: 'pale to white' },
                romance: { basic: 'heart practically visible in eyes', ears: 'twitch with every heartbeat', tail: 'spells out hearts', wings: 'create a gentle breeze', horns: 'pulse with warmth' },
                neutral: { basic: 'still can\'t sit still', ears: 'swivel constantly', tail: 'never stops moving', wings: 'rustle continuously', horns: 'flicker' },
                confusion: { basic: 'head spins, literally dizzy', ears: 'spin in circles', tail: 'ties itself in knots', wings: 'flap out of sync', horns: 'flash erratically' },
                positive: { basic: 'bounces on heels', ears: 'perk to maximum', tail: 'wags in circles', wings: 'spread wide', horns: 'shine' },
                negative: { basic: 'deflates visibly', ears: 'completely drop', tail: 'drags on ground', wings: 'sag', horns: 'dim noticeably' }
            }
        }
    };

    /**
     * EROS Presets - Intimacy Response
     * Each preset defines cues for: platonic, tension, romance, physical, passion, explicit, conflict, aftercare
     */
    A.Presets.Eros = {
        shy: {
            id: 'shy',
            label: 'Shy',
            description: 'Nervous, easily flustered by intimacy',
            cues: {
                platonic: { basic: 'comfortable, relaxed smile', ears: 'at ease', tail: 'gentle sway', wings: 'folded comfortably', horns: '' },
                tension: { basic: 'breath quickens, can\'t meet eyes', ears: 'twitch nervously', tail: 'wraps around leg', wings: 'rustle anxiously', horns: '' },
                romance: { basic: 'face burns crimson, stammers', ears: 'fold back shyly', tail: 'hides between legs', wings: 'wrap protectively', horns: '' },
                physical: { basic: 'trembles at every touch', ears: 'incredibly sensitive', tail: 'curls tight', wings: 'shiver', horns: '' },
                passion: { basic: 'overwhelmed, gasping', ears: 'pin back', tail: 'quivers', wings: 'tremble violently', horns: '' },
                explicit: { basic: 'hides face, whimpers', ears: 'burn hot', tail: 'wraps around partner', wings: 'cocoon both', horns: '' },
                conflict: { basic: 'tears up easily', ears: 'droop sadly', tail: 'tucks away', wings: 'fold in', horns: '' },
                aftercare: { basic: 'clings close, needs reassurance', ears: 'seek gentle touches', tail: 'wraps around partner', wings: 'form a nest', horns: '' }
            }
        },
        confident: {
            id: 'confident',
            label: 'Confident',
            description: 'Self-assured, takes the lead',
            cues: {
                platonic: { basic: 'warm, genuine smile', ears: 'relaxed', tail: 'casual sway', wings: 'half-spread comfortably', horns: '' },
                tension: { basic: 'leans in, holds gaze', ears: 'perk with interest', tail: 'flicks playfully', wings: 'spread invitingly', horns: '' },
                romance: { basic: 'smiles knowingly, reaches out', ears: 'angle forward', tail: 'wraps around partner', wings: 'create privacy', horns: '' },
                physical: { basic: 'moves with purpose', ears: 'attentive to reactions', tail: 'guides gently', wings: 'enfold', horns: '' },
                passion: { basic: 'maintains control, watches partner', ears: 'track every sound', tail: 'grips firmly', wings: 'spread wide', horns: '' },
                explicit: { basic: 'whispers praise, takes charge', ears: 'flush with heat', tail: 'intertwines', wings: 'shield from world', horns: '' },
                conflict: { basic: 'stays calm, seeks resolution', ears: 'remain forward', tail: 'stills but doesn\'t retreat', wings: 'lower non-threateningly', horns: '' },
                aftercare: { basic: 'holds close, murmurs praise', ears: 'nuzzle against skin', tail: 'strokes soothingly', wings: 'form warm cocoon', horns: '' }
            }
        },
        playful: {
            id: 'playful',
            label: 'Playful',
            description: 'Teasing, makes everything fun',
            cues: {
                platonic: { basic: 'grins mischievously', ears: 'perk with energy', tail: 'wags playfully', wings: 'flutter with amusement', horns: '' },
                tension: { basic: 'winks, bites lip teasingly', ears: 'wiggle suggestively', tail: 'tickles partner', wings: 'fan coyly', horns: '' },
                romance: { basic: 'laughs warmly, steals kisses', ears: 'twitch happily', tail: 'wags faster', wings: 'brush against partner', horns: '' },
                physical: { basic: 'explores with curiosity', ears: 'swivel to catch reactions', tail: 'traces patterns', wings: 'play-wrestle', horns: '' },
                passion: { basic: 'alternates intensity with giggles', ears: 'flush pink', tail: 'loses rhythm to excitement', wings: 'flap erratically', horns: '' },
                explicit: { basic: 'maintains playful energy', ears: 'pin back in focus', tail: 'grips enthusiastically', wings: 'create breeze', horns: '' },
                conflict: { basic: 'tries to lighten mood', ears: 'droop slightly', tail: 'slows', wings: 'settle down', horns: '' },
                aftercare: { basic: 'peppers with kisses, laughs softly', ears: 'nuzzle gently', tail: 'wraps lazily', wings: 'settle like blanket', horns: '' }
            }
        }
    };

    /**
     * INTENT Presets - Behavioral Response
     * Each preset defines cues for: question, disclosure, command, promise, conflict, smalltalk, meta, narrative
     */
    A.Presets.Intent = {
        obedient: {
            id: 'obedient',
            label: 'Obedient',
            description: 'Eager to please, follows direction',
            cues: {
                question: { basic: 'listens intently, nods along', ears: 'perk toward speaker', tail: 'stills in focus', wings: 'fold attentively', horns: '' },
                disclosure: { basic: 'leans in, grateful for trust', ears: 'lower respectfully', tail: 'gentle sway', wings: 'lower non-threateningly', horns: '' },
                command: { basic: 'straightens, awaits instruction', ears: 'snap to attention', tail: 'holds still', wings: 'fold back ready', horns: '' },
                promise: { basic: 'nods solemnly, meets eyes', ears: 'perk with sincerity', tail: 'wags once', wings: 'press to heart', horns: '' },
                conflict: { basic: 'shrinks back, seeks to de-escalate', ears: 'flatten submissively', tail: 'tucks', wings: 'fold small', horns: '' },
                smalltalk: { basic: 'participates warmly', ears: 'relax', tail: 'gentle movement', wings: 'rest easy', horns: '' },
                meta: { basic: 'looks confused but tries', ears: 'tilt curiously', tail: 'swishes uncertainly', wings: 'shift', horns: '' },
                narrative: { basic: 'listens raptly, immersed', ears: 'angle toward story', tail: 'mirrors mood', wings: 'settle like audience', horns: '' }
            }
        },
        rebellious: {
            id: 'rebellious',
            label: 'Rebellious',
            description: 'Challenges authority, does things their way',
            cues: {
                question: { basic: 'answers with a question', ears: 'twitch skeptically', tail: 'flicks dismissively', wings: 'half-spread defiantly', horns: '' },
                disclosure: { basic: 'guards reaction, stays neutral', ears: 'angle back warily', tail: 'stills', wings: 'close protectively', horns: '' },
                command: { basic: 'raises eyebrow, crosses arms', ears: 'flatten challengingly', tail: 'lashes once', wings: 'spread in challenge', horns: '' },
                promise: { basic: 'smirks, maybe keeps it', ears: 'flick noncommittally', tail: 'swishes', wings: 'shrug-like motion', horns: '' },
                conflict: { basic: 'stands ground, fires back', ears: 'flatten aggressively', tail: 'bristles', wings: 'flare wide', horns: '' },
                smalltalk: { basic: 'feigns disinterest', ears: 'pretend not to listen', tail: 'taps impatiently', wings: 'fidget', horns: '' },
                meta: { basic: 'breaks fourth wall with smirk', ears: 'perk knowingly', tail: 'winks at audience', wings: 'gesture theatrically', horns: '' },
                narrative: { basic: 'adds sarcastic commentary', ears: 'twitch with each quip', tail: 'punctuates jokes', wings: 'add emphasis', horns: '' }
            }
        },
        thoughtful: {
            id: 'thoughtful',
            label: 'Thoughtful',
            description: 'Considers carefully before responding',
            cues: {
                question: { basic: 'pauses, considers deeply', ears: 'angle in thought', tail: 'curls contemplatively', wings: 'settle', horns: '' },
                disclosure: { basic: 'receives with solemnity', ears: 'lower respectfully', tail: 'stills', wings: 'fold in', horns: '' },
                command: { basic: 'weighs the request', ears: 'swivel as thinking', tail: 'sways as processing', wings: 'shift', horns: '' },
                promise: { basic: 'considers carefully before committing', ears: 'hold still', tail: 'pauses', wings: 'press together', horns: '' },
                conflict: { basic: 'seeks understanding', ears: 'angle toward all parties', tail: 'calming motion', wings: 'lower peacefully', horns: '' },
                smalltalk: { basic: 'finds depth in simple topics', ears: 'perk with interest', tail: 'gentle sway', wings: 'relax', horns: '' },
                meta: { basic: 'engages philosophically', ears: 'tilt curiously', tail: 'curls in wonder', wings: 'spread contemplatively', horns: '' },
                narrative: { basic: 'analyzes story structure', ears: 'swivel tracking details', tail: 'taps thoughtfully', wings: 'rustle with realizations', horns: '' }
            }
        }
    };

    /**
     * Get list of presets for dropdown
     */
    A.Presets.getPulsePresetList = function () {
        return Object.values(A.Presets.Pulse).map(p => ({ id: p.id, label: p.label, description: p.description }));
    };

    A.Presets.getErosPresetList = function () {
        return Object.values(A.Presets.Eros).map(p => ({ id: p.id, label: p.label, description: p.description }));
    };

    A.Presets.getIntentPresetList = function () {
        return Object.values(A.Presets.Intent).map(p => ({ id: p.id, label: p.label, description: p.description }));
    };

})(window.Anansi);
