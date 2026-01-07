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
     * Each preset has 'present' and 'past' tense variants.
     * Each cue includes {{name}} placeholder for actor name.
     * Tags: joy, sadness, anger, fear, romance, neutral, confusion, positive, negative
     */
    A.Presets.Pulse = {
        expressive: {
            id: 'expressive',
            label: 'Expressive',
            description: 'Highly animated, wears emotions on sleeve',
            present: {
                joy: { basic: '{{name}} beams with delight, practically bouncing', ears: 'perk straight up, quivering', tail: 'wags energetically', wings: 'flutter excitedly', horns: 'seem to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slump, eyes glistening', ears: 'droop low', tail: 'hangs limp', wings: 'fold tight against body', horns: 'dull slightly' },
                anger: { basic: '{{name}}\'s jaw tightens, eyes blazing', ears: 'flatten back', tail: 'lashes sharply', wings: 'spread aggressively', horns: 'seem to darken' },
                fear: { basic: '{{name}} trembles, eyes darting', ears: 'pin back tightly', tail: 'tucks between legs', wings: 'wrap protectively', horns: 'pale slightly' },
                romance: { basic: '{{name}} flushes deeply, gazing intently', ears: 'twitch shyly', tail: 'sways slowly', wings: 'half-unfurl softly', horns: 'glow faintly' },
                neutral: { basic: '{{name}}\'s expression remains calm and open', ears: 'relaxed, forward', tail: 'hangs naturally', wings: 'rest comfortably', horns: 'neutral' },
                confusion: { basic: '{{name}} tilts head, brow furrowing', ears: 'swivel uncertainly', tail: 'twitches erratically', wings: 'shift restlessly', horns: 'flicker' },
                positive: { basic: '{{name}} radiates warmth', ears: 'perk attentively', tail: 'gives a gentle wag', wings: 'relax outward', horns: 'brighten' },
                negative: { basic: '{{name}} tenses visibly', ears: 'lower cautiously', tail: 'stills', wings: 'draw inward', horns: 'dim' }
            },
            past: {
                joy: { basic: '{{name}} beamed with delight, practically bouncing', ears: 'perked straight up, quivering', tail: 'wagged energetically', wings: 'fluttered excitedly', horns: 'seemed to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slumped, eyes glistening', ears: 'drooped low', tail: 'hung limp', wings: 'folded tight against body', horns: 'dulled slightly' },
                anger: { basic: '{{name}}\'s jaw tightened, eyes blazing', ears: 'flattened back', tail: 'lashed sharply', wings: 'spread aggressively', horns: 'seemed to darken' },
                fear: { basic: '{{name}} trembled, eyes darting', ears: 'pinned back tightly', tail: 'tucked between legs', wings: 'wrapped protectively', horns: 'paled slightly' },
                romance: { basic: '{{name}} flushed deeply, gazing intently', ears: 'twitched shyly', tail: 'swayed slowly', wings: 'half-unfurled softly', horns: 'glowed faintly' },
                neutral: { basic: '{{name}}\'s expression remained calm and open', ears: 'relaxed, forward', tail: 'hung naturally', wings: 'rested comfortably', horns: 'neutral' },
                confusion: { basic: '{{name}} tilted head, brow furrowing', ears: 'swiveled uncertainly', tail: 'twitched erratically', wings: 'shifted restlessly', horns: 'flickered' },
                positive: { basic: '{{name}} radiated warmth', ears: 'perked attentively', tail: 'gave a gentle wag', wings: 'relaxed outward', horns: 'brightened' },
                negative: { basic: '{{name}} tensed visibly', ears: 'lowered cautiously', tail: 'stilled', wings: 'drew inward', horns: 'dimmed' }
            },
            // Legacy 'cues' for backward compatibility (defaults to present)
            cues: {
                joy: { basic: '{{name}} beams with delight, practically bouncing', ears: 'perk straight up, quivering', tail: 'wags energetically', wings: 'flutter excitedly', horns: 'seem to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slump, eyes glistening', ears: 'droop low', tail: 'hangs limp', wings: 'fold tight against body', horns: 'dull slightly' },
                anger: { basic: '{{name}}\'s jaw tightens, eyes blazing', ears: 'flatten back', tail: 'lashes sharply', wings: 'spread aggressively', horns: 'seem to darken' },
                fear: { basic: '{{name}} trembles, eyes darting', ears: 'pin back tightly', tail: 'tucks between legs', wings: 'wrap protectively', horns: 'pale slightly' },
                romance: { basic: '{{name}} flushes deeply, gazing intently', ears: 'twitch shyly', tail: 'sways slowly', wings: 'half-unfurl softly', horns: 'glow faintly' },
                neutral: { basic: '{{name}}\'s expression remains calm and open', ears: 'relaxed, forward', tail: 'hangs naturally', wings: 'rest comfortably', horns: 'neutral' },
                confusion: { basic: '{{name}} tilts head, brow furrowing', ears: 'swivel uncertainly', tail: 'twitches erratically', wings: 'shift restlessly', horns: 'flicker' },
                positive: { basic: '{{name}} radiates warmth', ears: 'perk attentively', tail: 'gives a gentle wag', wings: 'relax outward', horns: 'brighten' },
                negative: { basic: '{{name}} tenses visibly', ears: 'lower cautiously', tail: 'stills', wings: 'draw inward', horns: 'dim' }
            }
        },
        stoic: {
            id: 'stoic',
            label: 'Stoic',
            description: 'Controlled, subtle micro-expressions only',
            present: {
                joy: { basic: '{{name}}\'s corner of mouth twitches upward', ears: 'angle slightly forward', tail: 'tip flicks once', wings: 'shift minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows distant', ears: 'barely lower', tail: 'stills completely', wings: 'draw imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrow almost imperceptibly', ears: 'flatten slightly', tail: 'tip twitches', wings: 'tense', horns: '' },
                fear: { basic: '{{name}}\'s breath catches briefly', ears: 'twitch back', tail: 'stiffens', wings: 'flex', horns: '' },
                romance: { basic: '{{name}} holds gaze a moment longer', ears: 'tilt curiously', tail: 'sways once', wings: 'relax', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains unreadable', ears: 'still', tail: 'motionless', wings: 'folded', horns: '' },
                confusion: { basic: '{{name}} blinks once', ears: 'twitch', tail: 'tip curls', wings: 'shift', horns: '' },
                positive: { basic: '{{name}}\'s posture eases slightly', ears: 'relax forward', tail: 'relaxes', wings: 'loosen', horns: '' },
                negative: { basic: '{{name}}\'s muscles tense beneath skin', ears: 'angle back', tail: 'holds rigid', wings: 'tighten', horns: '' }
            },
            past: {
                joy: { basic: '{{name}}\'s corner of mouth twitched upward', ears: 'angled slightly forward', tail: 'tip flicked once', wings: 'shifted minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grew distant', ears: 'barely lowered', tail: 'stilled completely', wings: 'drew imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrowed almost imperceptibly', ears: 'flattened slightly', tail: 'tip twitched', wings: 'tensed', horns: '' },
                fear: { basic: '{{name}}\'s breath caught briefly', ears: 'twitched back', tail: 'stiffened', wings: 'flexed', horns: '' },
                romance: { basic: '{{name}} held gaze a moment longer', ears: 'tilted curiously', tail: 'swayed once', wings: 'relaxed', horns: '' },
                neutral: { basic: '{{name}}\'s expression remained unreadable', ears: 'still', tail: 'motionless', wings: 'folded', horns: '' },
                confusion: { basic: '{{name}} blinked once', ears: 'twitched', tail: 'tip curled', wings: 'shifted', horns: '' },
                positive: { basic: '{{name}}\'s posture eased slightly', ears: 'relaxed forward', tail: 'relaxed', wings: 'loosened', horns: '' },
                negative: { basic: '{{name}}\'s muscles tensed beneath skin', ears: 'angled back', tail: 'held rigid', wings: 'tightened', horns: '' }
            },
            cues: {
                joy: { basic: '{{name}}\'s corner of mouth twitches upward', ears: 'angle slightly forward', tail: 'tip flicks once', wings: 'shift minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows distant', ears: 'barely lower', tail: 'stills completely', wings: 'draw imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrow almost imperceptibly', ears: 'flatten slightly', tail: 'tip twitches', wings: 'tense', horns: '' },
                fear: { basic: '{{name}}\'s breath catches briefly', ears: 'twitch back', tail: 'stiffens', wings: 'flex', horns: '' },
                romance: { basic: '{{name}} holds gaze a moment longer', ears: 'tilt curiously', tail: 'sways once', wings: 'relax', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains unreadable', ears: 'still', tail: 'motionless', wings: 'folded', horns: '' },
                confusion: { basic: '{{name}} blinks once', ears: 'twitch', tail: 'tip curls', wings: 'shift', horns: '' },
                positive: { basic: '{{name}}\'s posture eases slightly', ears: 'relax forward', tail: 'relaxes', wings: 'loosen', horns: '' },
                negative: { basic: '{{name}}\'s muscles tense beneath skin', ears: 'angle back', tail: 'holds rigid', wings: 'tighten', horns: '' }
            }
        },
        tsundere: {
            id: 'tsundere',
            label: 'Tsundere',
            description: 'Defensive, hides true feelings behind bravado',
            present: {
                joy: { basic: '{{name}} tries to suppress a smile, failing', ears: 'twitch despite attempts to control', tail: 'wags before catching itself', wings: 'flutter involuntarily', horns: '' },
                sadness: { basic: '{{name}} looks away quickly, voice strained', ears: 'droop before snapping upright', tail: 'tucks briefly', wings: 'wrap tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flush, stamping foot', ears: 'flatten dramatically', tail: 'puffs up', wings: 'flare', horns: '' },
                fear: { basic: '{{name}} flinches, then glares defiantly', ears: 'pin back', tail: 'bristles', wings: 'wrap defensively', horns: '' },
                romance: { basic: '{{name}} blushes furiously, looking away', ears: 'burn red at tips', tail: 'twitches nervously', wings: 'rustle anxiously', horns: '' },
                neutral: { basic: '{{name}} crosses arms, chin lifted', ears: 'alert, guarded', tail: 'swishes impatiently', wings: 'half-folded', horns: '' },
                confusion: { basic: '{{name}} sputters indignantly', ears: 'swivel wildly', tail: 'lashes in frustration', wings: 'flutter chaotically', horns: '' },
                positive: { basic: '{{name}} huffs but can\'t hide warmth in eyes', ears: 'perk despite efforts', tail: 'betrays a wag', wings: 'relax reluctantly', horns: '' },
                negative: { basic: '{{name}} scowls, turning sharply away', ears: 'flatten', tail: 'bristles', wings: 'snap closed', horns: '' }
            },
            past: {
                joy: { basic: '{{name}} tried to suppress a smile, failing', ears: 'twitched despite attempts to control', tail: 'wagged before catching itself', wings: 'fluttered involuntarily', horns: '' },
                sadness: { basic: '{{name}} looked away quickly, voice strained', ears: 'drooped before snapping upright', tail: 'tucked briefly', wings: 'wrapped tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flushed, stamping foot', ears: 'flattened dramatically', tail: 'puffed up', wings: 'flared', horns: '' },
                fear: { basic: '{{name}} flinched, then glared defiantly', ears: 'pinned back', tail: 'bristled', wings: 'wrapped defensively', horns: '' },
                romance: { basic: '{{name}} blushed furiously, looking away', ears: 'burned red at tips', tail: 'twitched nervously', wings: 'rustled anxiously', horns: '' },
                neutral: { basic: '{{name}} crossed arms, chin lifted', ears: 'alert, guarded', tail: 'swished impatiently', wings: 'half-folded', horns: '' },
                confusion: { basic: '{{name}} sputtered indignantly', ears: 'swiveled wildly', tail: 'lashed in frustration', wings: 'fluttered chaotically', horns: '' },
                positive: { basic: '{{name}} huffed but couldn\'t hide warmth in eyes', ears: 'perked despite efforts', tail: 'betrayed a wag', wings: 'relaxed reluctantly', horns: '' },
                negative: { basic: '{{name}} scowled, turning sharply away', ears: 'flattened', tail: 'bristled', wings: 'snapped closed', horns: '' }
            },
            cues: {
                joy: { basic: '{{name}} tries to suppress a smile, failing', ears: 'twitch despite attempts to control', tail: 'wags before catching itself', wings: 'flutter involuntarily', horns: '' },
                sadness: { basic: '{{name}} looks away quickly, voice strained', ears: 'droop before snapping upright', tail: 'tucks briefly', wings: 'wrap tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flush, stamping foot', ears: 'flatten dramatically', tail: 'puffs up', wings: 'flare', horns: '' },
                fear: { basic: '{{name}} flinches, then glares defiantly', ears: 'pin back', tail: 'bristles', wings: 'wrap defensively', horns: '' },
                romance: { basic: '{{name}} blushes furiously, looking away', ears: 'burn red at tips', tail: 'twitches nervously', wings: 'rustle anxiously', horns: '' },
                neutral: { basic: '{{name}} crosses arms, chin lifted', ears: 'alert, guarded', tail: 'swishes impatiently', wings: 'half-folded', horns: '' },
                confusion: { basic: '{{name}} sputters indignantly', ears: 'swivel wildly', tail: 'lashes in frustration', wings: 'flutter chaotically', horns: '' },
                positive: { basic: '{{name}} huffs but can\'t hide warmth in eyes', ears: 'perk despite efforts', tail: 'betrays a wag', wings: 'relax reluctantly', horns: '' },
                negative: { basic: '{{name}} scowls, turning sharply away', ears: 'flatten', tail: 'bristles', wings: 'snap closed', horns: '' }
            }
        },
        kuudere: {
            id: 'kuudere',
            label: 'Kuudere',
            description: 'Cool, analytical, emotions barely surface',
            present: {
                joy: { basic: '{{name}}\'s eyes soften almost imperceptibly', ears: '', tail: '', wings: '', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows hollow', ears: '', tail: '', wings: '', horns: '' },
                anger: { basic: '{{name}}\'s voice drops to ice', ears: '', tail: '', wings: '', horns: '' },
                fear: { basic: '{{name}}\'s pupils dilate briefly', ears: '', tail: '', wings: '', horns: '' },
                romance: { basic: '{{name}}\'s cheeks hint at color', ears: '', tail: '', wings: '', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains perfectly blank', ears: '', tail: '', wings: '', horns: '' },
                confusion: { basic: '{{name}}\'s head tilts fractionally', ears: '', tail: '', wings: '', horns: '' },
                positive: { basic: '{{name}}\'s shoulders lower slightly', ears: '', tail: '', wings: '', horns: '' },
                negative: { basic: '{{name}}\'s jaw sets', ears: '', tail: '', wings: '', horns: '' }
            },
            past: {
                joy: { basic: '{{name}}\'s eyes softened almost imperceptibly', ears: '', tail: '', wings: '', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grew hollow', ears: '', tail: '', wings: '', horns: '' },
                anger: { basic: '{{name}}\'s voice dropped to ice', ears: '', tail: '', wings: '', horns: '' },
                fear: { basic: '{{name}}\'s pupils dilated briefly', ears: '', tail: '', wings: '', horns: '' },
                romance: { basic: '{{name}}\'s cheeks hinted at color', ears: '', tail: '', wings: '', horns: '' },
                neutral: { basic: '{{name}}\'s expression remained perfectly blank', ears: '', tail: '', wings: '', horns: '' },
                confusion: { basic: '{{name}}\'s head tilted fractionally', ears: '', tail: '', wings: '', horns: '' },
                positive: { basic: '{{name}}\'s shoulders lowered slightly', ears: '', tail: '', wings: '', horns: '' },
                negative: { basic: '{{name}}\'s jaw set', ears: '', tail: '', wings: '', horns: '' }
            },
            cues: {
                joy: { basic: '{{name}}\'s eyes soften almost imperceptibly', ears: '', tail: '', wings: '', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows hollow', ears: '', tail: '', wings: '', horns: '' },
                anger: { basic: '{{name}}\'s voice drops to ice', ears: '', tail: '', wings: '', horns: '' },
                fear: { basic: '{{name}}\'s pupils dilate briefly', ears: '', tail: '', wings: '', horns: '' },
                romance: { basic: '{{name}}\'s cheeks hint at color', ears: '', tail: '', wings: '', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains perfectly blank', ears: '', tail: '', wings: '', horns: '' },
                confusion: { basic: '{{name}}\'s head tilts fractionally', ears: '', tail: '', wings: '', horns: '' },
                positive: { basic: '{{name}}\'s shoulders lower slightly', ears: '', tail: '', wings: '', horns: '' },
                negative: { basic: '{{name}}\'s jaw sets', ears: '', tail: '', wings: '', horns: '' }
            }
        },
        excitable: {
            id: 'excitable',
            label: 'Excitable',
            description: 'Everything is intense, maximum energy',
            present: {
                joy: { basic: '{{name}} practically vibrates with happiness', ears: 'spring up, twitch rapidly', tail: 'wags so hard whole body moves', wings: 'buzz with energy', horns: 'seem to sparkle' },
                sadness: { basic: '{{name}}\'s tears well immediately', ears: 'droop dramatically', tail: 'goes completely limp', wings: 'droop to the ground', horns: 'lose all luster' },
                anger: { basic: '{{name}}\'s face turns red, shouting', ears: 'flatten against head', tail: 'puffs up enormously', wings: 'snap out threateningly', horns: 'glow with heat' },
                fear: { basic: '{{name}} freezes, eyes huge', ears: 'pin back hard', tail: 'wraps around leg', wings: 'cocoon around self', horns: 'pale to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: 'twitch with every heartbeat', tail: 'spells out hearts', wings: 'create a gentle breeze', horns: 'pulse with warmth' },
                neutral: { basic: '{{name}} still can\'t sit still', ears: 'swivel constantly', tail: 'never stops moving', wings: 'rustle continuously', horns: 'flicker' },
                confusion: { basic: '{{name}}\'s head spins, literally dizzy', ears: 'spin in circles', tail: 'ties itself in knots', wings: 'flap out of sync', horns: 'flash erratically' },
                positive: { basic: '{{name}} bounces on heels', ears: 'perk to maximum', tail: 'wags in circles', wings: 'spread wide', horns: 'shine' },
                negative: { basic: '{{name}} deflates visibly', ears: 'completely drop', tail: 'drags on ground', wings: 'sag', horns: 'dim noticeably' }
            },
            past: {
                joy: { basic: '{{name}} practically vibrated with happiness', ears: 'sprang up, twitching rapidly', tail: 'wagged so hard whole body moved', wings: 'buzzed with energy', horns: 'seemed to sparkle' },
                sadness: { basic: '{{name}}\'s tears welled immediately', ears: 'drooped dramatically', tail: 'went completely limp', wings: 'drooped to the ground', horns: 'lost all luster' },
                anger: { basic: '{{name}}\'s face turned red, shouting', ears: 'flattened against head', tail: 'puffed up enormously', wings: 'snapped out threateningly', horns: 'glowed with heat' },
                fear: { basic: '{{name}} froze, eyes huge', ears: 'pinned back hard', tail: 'wrapped around leg', wings: 'cocooned around self', horns: 'paled to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: 'twitched with every heartbeat', tail: 'spelled out hearts', wings: 'created a gentle breeze', horns: 'pulsed with warmth' },
                neutral: { basic: '{{name}} still couldn\'t sit still', ears: 'swiveled constantly', tail: 'never stopped moving', wings: 'rustled continuously', horns: 'flickered' },
                confusion: { basic: '{{name}}\'s head spun, literally dizzy', ears: 'spun in circles', tail: 'tied itself in knots', wings: 'flapped out of sync', horns: 'flashed erratically' },
                positive: { basic: '{{name}} bounced on heels', ears: 'perked to maximum', tail: 'wagged in circles', wings: 'spread wide', horns: 'shone' },
                negative: { basic: '{{name}} deflated visibly', ears: 'completely dropped', tail: 'dragged on ground', wings: 'sagged', horns: 'dimmed noticeably' }
            },
            cues: {
                joy: { basic: '{{name}} practically vibrates with happiness', ears: 'spring up, twitch rapidly', tail: 'wags so hard whole body moves', wings: 'buzz with energy', horns: 'seem to sparkle' },
                sadness: { basic: '{{name}}\'s tears well immediately', ears: 'droop dramatically', tail: 'goes completely limp', wings: 'droop to the ground', horns: 'lose all luster' },
                anger: { basic: '{{name}}\'s face turns red, shouting', ears: 'flatten against head', tail: 'puffs up enormously', wings: 'snap out threateningly', horns: 'glow with heat' },
                fear: { basic: '{{name}} freezes, eyes huge', ears: 'pin back hard', tail: 'wraps around leg', wings: 'cocoon around self', horns: 'pale to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: 'twitch with every heartbeat', tail: 'spells out hearts', wings: 'create a gentle breeze', horns: 'pulse with warmth' },
                neutral: { basic: '{{name}} still can\'t sit still', ears: 'swivel constantly', tail: 'never stops moving', wings: 'rustle continuously', horns: 'flicker' },
                confusion: { basic: '{{name}}\'s head spins, literally dizzy', ears: 'spin in circles', tail: 'ties itself in knots', wings: 'flap out of sync', horns: 'flash erratically' },
                positive: { basic: '{{name}} bounces on heels', ears: 'perk to maximum', tail: 'wags in circles', wings: 'spread wide', horns: 'shine' },
                negative: { basic: '{{name}} deflates visibly', ears: 'completely drop', tail: 'drags on ground', wings: 'sag', horns: 'dim noticeably' }
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
