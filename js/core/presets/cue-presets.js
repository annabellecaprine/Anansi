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
                joy: { basic: '{{name}} beams with delight, practically bouncing', ears: '{{name}}\'s ears perk straight up, quivering', tail: '{{name}}\'s tail wags energetically', wings: '{{name}}\'s wings flutter excitedly', horns: '{{name}}\'s horns seem to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slump, eyes glistening', ears: '{{name}}\'s ears droop low', tail: '{{name}}\'s tail hangs limp', wings: '{{name}}\'s wings fold tight against body', horns: '{{name}}\'s horns dull slightly' },
                anger: { basic: '{{name}}\'s jaw tightens, eyes blazing', ears: '{{name}}\'s ears flatten back', tail: '{{name}}\'s tail lashes sharply', wings: '{{name}}\'s wings spread aggressively', horns: '{{name}}\'s horns seem to darken' },
                fear: { basic: '{{name}} trembles, eyes darting', ears: '{{name}}\'s ears pin back tightly', tail: '{{name}}\'s tail tucks between legs', wings: '{{name}}\'s wings wrap protectively', horns: '{{name}}\'s horns pale slightly' },
                romance: { basic: '{{name}} flushes deeply, gazing intently', ears: '{{name}}\'s ears twitch shyly', tail: '{{name}}\'s tail sways slowly', wings: '{{name}}\'s wings half-unfurl softly', horns: '{{name}}\'s horns glow faintly' },
                neutral: { basic: '{{name}}\'s expression remains calm and open', ears: '{{name}}\'s ears are relaxed, forward', tail: '{{name}}\'s tail hangs naturally', wings: '{{name}}\'s wings rest comfortably', horns: '{{name}}\'s horns are neutral' },
                confusion: { basic: '{{name}} tilts head, brow furrowing', ears: '{{name}}\'s ears swivel uncertainly', tail: '{{name}}\'s tail twitches erratically', wings: '{{name}}\'s wings shift restlessly', horns: '{{name}}\'s horns flicker' },
                positive: { basic: '{{name}} radiates warmth', ears: '{{name}}\'s ears perk attentively', tail: '{{name}}\'s tail gives a gentle wag', wings: '{{name}}\'s wings relax outward', horns: '{{name}}\'s horns brighten' },
                negative: { basic: '{{name}} tenses visibly', ears: '{{name}}\'s ears lower cautiously', tail: '{{name}}\'s tail stills', wings: '{{name}}\'s wings draw inward', horns: '{{name}}\'s horns dim' }
            },
            past: {
                joy: { basic: '{{name}} beamed with delight, practically bouncing', ears: '{{name}}\'s ears perked straight up, quivering', tail: '{{name}}\'s tail wagged energetically', wings: '{{name}}\'s wings fluttered excitedly', horns: '{{name}}\'s horns seemed to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slumped, eyes glistening', ears: '{{name}}\'s ears drooped low', tail: '{{name}}\'s tail hung limp', wings: '{{name}}\'s wings folded tight against body', horns: '{{name}}\'s horns dulled slightly' },
                anger: { basic: '{{name}}\'s jaw tightened, eyes blazing', ears: '{{name}}\'s ears flattened back', tail: '{{name}}\'s tail lashed sharply', wings: '{{name}}\'s wings spread aggressively', horns: '{{name}}\'s horns seemed to darken' },
                fear: { basic: '{{name}} trembled, eyes darting', ears: '{{name}}\'s ears pinned back tightly', tail: '{{name}}\'s tail tucked between legs', wings: '{{name}}\'s wings wrapped protectively', horns: '{{name}}\'s horns paled slightly' },
                romance: { basic: '{{name}} flushed deeply, gazing intently', ears: '{{name}}\'s ears twitched shyly', tail: '{{name}}\'s tail swayed slowly', wings: '{{name}}\'s wings half-unfurled softly', horns: '{{name}}\'s horns glowed faintly' },
                neutral: { basic: '{{name}}\'s expression remained calm and open', ears: '{{name}}\'s ears were relaxed, forward', tail: '{{name}}\'s tail hung naturally', wings: '{{name}}\'s wings rested comfortably', horns: '{{name}}\'s horns were neutral' },
                confusion: { basic: '{{name}} tilted head, brow furrowing', ears: '{{name}}\'s ears swiveled uncertainly', tail: '{{name}}\'s tail twitched erratically', wings: '{{name}}\'s wings shifted restlessly', horns: '{{name}}\'s horns flickered' },
                positive: { basic: '{{name}} radiated warmth', ears: '{{name}}\'s ears perked attentively', tail: '{{name}}\'s tail gave a gentle wag', wings: '{{name}}\'s wings relaxed outward', horns: '{{name}}\'s horns brightened' },
                negative: { basic: '{{name}} tensed visibly', ears: '{{name}}\'s ears lowered cautiously', tail: '{{name}}\'s tail stilled', wings: '{{name}}\'s wings drew inward', horns: '{{name}}\'s horns dimmed' }
            },
            // Legacy 'cues' for backward compatibility (defaults to present)
            cues: {
                joy: { basic: '{{name}} beams with delight, practically bouncing', ears: '{{name}}\'s ears perk straight up, quivering', tail: '{{name}}\'s tail wags energetically', wings: '{{name}}\'s wings flutter excitedly', horns: '{{name}}\'s horns seem to gleam' },
                sadness: { basic: '{{name}}\'s shoulders slump, eyes glistening', ears: '{{name}}\'s ears droop low', tail: '{{name}}\'s tail hangs limp', wings: '{{name}}\'s wings fold tight against body', horns: '{{name}}\'s horns dull slightly' },
                anger: { basic: '{{name}}\'s jaw tightens, eyes blazing', ears: '{{name}}\'s ears flatten back', tail: '{{name}}\'s tail lashes sharply', wings: '{{name}}\'s wings spread aggressively', horns: '{{name}}\'s horns seem to darken' },
                fear: { basic: '{{name}} trembles, eyes darting', ears: '{{name}}\'s ears pin back tightly', tail: '{{name}}\'s tail tucks between legs', wings: '{{name}}\'s wings wrap protectively', horns: '{{name}}\'s horns pale slightly' },
                romance: { basic: '{{name}} flushes deeply, gazing intently', ears: '{{name}}\'s ears twitch shyly', tail: '{{name}}\'s tail sways slowly', wings: '{{name}}\'s wings half-unfurl softly', horns: '{{name}}\'s horns glow faintly' },
                neutral: { basic: '{{name}}\'s expression remains calm and open', ears: '{{name}}\'s ears are relaxed, forward', tail: '{{name}}\'s tail hangs naturally', wings: '{{name}}\'s wings rest comfortably', horns: '{{name}}\'s horns are neutral' },
                confusion: { basic: '{{name}} tilts head, brow furrowing', ears: '{{name}}\'s ears swivel uncertainly', tail: '{{name}}\'s tail twitches erratically', wings: '{{name}}\'s wings shift restlessly', horns: '{{name}}\'s horns flicker' },
                positive: { basic: '{{name}} radiates warmth', ears: '{{name}}\'s ears perk attentively', tail: '{{name}}\'s tail gives a gentle wag', wings: '{{name}}\'s wings relax outward', horns: '{{name}}\'s horns brighten' },
                negative: { basic: '{{name}} tenses visibly', ears: '{{name}}\'s ears lower cautiously', tail: '{{name}}\'s tail stills', wings: '{{name}}\'s wings draw inward', horns: '{{name}}\'s horns dim' }
            }
        },
        stoic: {
            id: 'stoic',
            label: 'Stoic',
            description: 'Controlled, subtle micro-expressions only',
            present: {
                joy: { basic: '{{name}}\'s corner of mouth twitches upward', ears: '{{name}}\'s ears angle slightly forward', tail: '{{name}}\'s tail tip flicks once', wings: '{{name}}\'s wings shift minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows distant', ears: '{{name}}\'s ears barely lower', tail: '{{name}}\'s tail stills completely', wings: '{{name}}\'s wings draw imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrow almost imperceptibly', ears: '{{name}}\'s ears flatten slightly', tail: '{{name}}\'s tail tip twitches', wings: '{{name}}\'s wings tense', horns: '' },
                fear: { basic: '{{name}}\'s breath catches briefly', ears: '{{name}}\'s ears twitch back', tail: '{{name}}\'s tail stiffens', wings: '{{name}}\'s wings flex', horns: '' },
                romance: { basic: '{{name}} holds gaze a moment longer', ears: '{{name}}\'s ears tilt curiously', tail: '{{name}}\'s tail sways once', wings: '{{name}}\'s wings relax', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains unreadable', ears: '{{name}}\'s ears are still', tail: '{{name}}\'s tail is motionless', wings: '{{name}}\'s wings are folded', horns: '' },
                confusion: { basic: '{{name}} blinks once', ears: '{{name}}\'s ears twitch', tail: '{{name}}\'s tail tip curls', wings: '{{name}}\'s wings shift', horns: '' },
                positive: { basic: '{{name}}\'s posture eases slightly', ears: '{{name}}\'s ears relax forward', tail: '{{name}}\'s tail relaxes', wings: '{{name}}\'s wings loosen', horns: '' },
                negative: { basic: '{{name}}\'s muscles tense beneath skin', ears: '{{name}}\'s ears angle back', tail: '{{name}}\'s tail holds rigid', wings: '{{name}}\'s wings tighten', horns: '' }
            },
            past: {
                joy: { basic: '{{name}}\'s corner of mouth twitched upward', ears: '{{name}}\'s ears angled slightly forward', tail: '{{name}}\'s tail tip flicked once', wings: '{{name}}\'s wings shifted minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grew distant', ears: '{{name}}\'s ears barely lowered', tail: '{{name}}\'s tail stilled completely', wings: '{{name}}\'s wings drew imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrowed almost imperceptibly', ears: '{{name}}\'s ears flattened slightly', tail: '{{name}}\'s tail tip twitched', wings: '{{name}}\'s wings tensed', horns: '' },
                fear: { basic: '{{name}}\'s breath caught briefly', ears: '{{name}}\'s ears twitched back', tail: '{{name}}\'s tail stiffened', wings: '{{name}}\'s wings flexed', horns: '' },
                romance: { basic: '{{name}} held gaze a moment longer', ears: '{{name}}\'s ears tilted curiously', tail: '{{name}}\'s tail swayed once', wings: '{{name}}\'s wings relaxed', horns: '' },
                neutral: { basic: '{{name}}\'s expression remained unreadable', ears: '{{name}}\'s ears were still', tail: '{{name}}\'s tail was motionless', wings: '{{name}}\'s wings were folded', horns: '' },
                confusion: { basic: '{{name}} blinked once', ears: '{{name}}\'s ears twitched', tail: '{{name}}\'s tail tip curled', wings: '{{name}}\'s wings shifted', horns: '' },
                positive: { basic: '{{name}}\'s posture eased slightly', ears: '{{name}}\'s ears relaxed forward', tail: '{{name}}\'s tail relaxed', wings: '{{name}}\'s wings loosened', horns: '' },
                negative: { basic: '{{name}}\'s muscles tensed beneath skin', ears: '{{name}}\'s ears angled back', tail: '{{name}}\'s tail held rigid', wings: '{{name}}\'s wings tightened', horns: '' }
            },
            cues: {
                joy: { basic: '{{name}}\'s corner of mouth twitches upward', ears: '{{name}}\'s ears angle slightly forward', tail: '{{name}}\'s tail tip flicks once', wings: '{{name}}\'s wings shift minutely', horns: '' },
                sadness: { basic: '{{name}}\'s gaze grows distant', ears: '{{name}}\'s ears barely lower', tail: '{{name}}\'s tail stills completely', wings: '{{name}}\'s wings draw imperceptibly closer', horns: '' },
                anger: { basic: '{{name}}\'s eyes narrow almost imperceptibly', ears: '{{name}}\'s ears flatten slightly', tail: '{{name}}\'s tail tip twitches', wings: '{{name}}\'s wings tense', horns: '' },
                fear: { basic: '{{name}}\'s breath catches briefly', ears: '{{name}}\'s ears twitch back', tail: '{{name}}\'s tail stiffens', wings: '{{name}}\'s wings flex', horns: '' },
                romance: { basic: '{{name}} holds gaze a moment longer', ears: '{{name}}\'s ears tilt curiously', tail: '{{name}}\'s tail sways once', wings: '{{name}}\'s wings relax', horns: '' },
                neutral: { basic: '{{name}}\'s expression remains unreadable', ears: '{{name}}\'s ears are still', tail: '{{name}}\'s tail is motionless', wings: '{{name}}\'s wings are folded', horns: '' },
                confusion: { basic: '{{name}} blinks once', ears: '{{name}}\'s ears twitch', tail: '{{name}}\'s tail tip curls', wings: '{{name}}\'s wings shift', horns: '' },
                positive: { basic: '{{name}}\'s posture eases slightly', ears: '{{name}}\'s ears relax forward', tail: '{{name}}\'s tail relaxes', wings: '{{name}}\'s wings loosen', horns: '' },
                negative: { basic: '{{name}}\'s muscles tense beneath skin', ears: '{{name}}\'s ears angle back', tail: '{{name}}\'s tail holds rigid', wings: '{{name}}\'s wings tighten', horns: '' }
            }
        },
        tsundere: {
            id: 'tsundere',
            label: 'Tsundere',
            description: 'Defensive, hides true feelings behind bravado',
            present: {
                joy: { basic: '{{name}} tries to suppress a smile, failing', ears: '{{name}}\'s ears twitch despite attempts to control', tail: '{{name}}\'s tail wags before catching itself', wings: '{{name}}\'s wings flutter involuntarily', horns: '' },
                sadness: { basic: '{{name}} looks away quickly, voice strained', ears: '{{name}}\'s ears droop before snapping upright', tail: '{{name}}\'s tail tucks briefly', wings: '{{name}}\'s wings wrap tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flush, stamping foot', ears: '{{name}}\'s ears flatten dramatically', tail: '{{name}}\'s tail puffs up', wings: '{{name}}\'s wings flare', horns: '' },
                fear: { basic: '{{name}} flinches, then glares defiantly', ears: '{{name}}\'s ears pin back', tail: '{{name}}\'s tail bristles', wings: '{{name}}\'s wings wrap defensively', horns: '' },
                romance: { basic: '{{name}} blushes furiously, looking away', ears: '{{name}}\'s ears burn red at tips', tail: '{{name}}\'s tail twitches nervously', wings: '{{name}}\'s wings rustle anxiously', horns: '' },
                neutral: { basic: '{{name}} crosses arms, chin lifted', ears: '{{name}}\'s ears are alert, guarded', tail: '{{name}}\'s tail swishes impatiently', wings: '{{name}}\'s wings are half-folded', horns: '' },
                confusion: { basic: '{{name}} sputters indignantly', ears: '{{name}}\'s ears swivel wildly', tail: '{{name}}\'s tail lashes in frustration', wings: '{{name}}\'s wings flutter chaotically', horns: '' },
                positive: { basic: '{{name}} huffs but can\'t hide warmth in eyes', ears: '{{name}}\'s ears perk despite efforts', tail: '{{name}}\'s tail betrays a wag', wings: '{{name}}\'s wings relax reluctantly', horns: '' },
                negative: { basic: '{{name}} scowls, turning sharply away', ears: '{{name}}\'s ears flatten', tail: '{{name}}\'s tail bristles', wings: '{{name}}\'s wings snap closed', horns: '' }
            },
            past: {
                joy: { basic: '{{name}} tried to suppress a smile, failing', ears: '{{name}}\'s ears twitched despite attempts to control', tail: '{{name}}\'s tail wagged before catching itself', wings: '{{name}}\'s wings fluttered involuntarily', horns: '' },
                sadness: { basic: '{{name}} looked away quickly, voice strained', ears: '{{name}}\'s ears drooped before snapping upright', tail: '{{name}}\'s tail tucked briefly', wings: '{{name}}\'s wings wrapped tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flushed, stamping foot', ears: '{{name}}\'s ears flattened dramatically', tail: '{{name}}\'s tail puffed up', wings: '{{name}}\'s wings flared', horns: '' },
                fear: { basic: '{{name}} flinched, then glared defiantly', ears: '{{name}}\'s ears pinned back', tail: '{{name}}\'s tail bristled', wings: '{{name}}\'s wings wrapped defensively', horns: '' },
                romance: { basic: '{{name}} blushed furiously, looking away', ears: '{{name}}\'s ears burned red at tips', tail: '{{name}}\'s tail twitched nervously', wings: '{{name}}\'s wings rustled anxiously', horns: '' },
                neutral: { basic: '{{name}} crossed arms, chin lifted', ears: '{{name}}\'s ears were alert, guarded', tail: '{{name}}\'s tail swished impatiently', wings: '{{name}}\'s wings were half-folded', horns: '' },
                confusion: { basic: '{{name}} sputtered indignantly', ears: '{{name}}\'s ears swiveled wildly', tail: '{{name}}\'s tail lashed in frustration', wings: '{{name}}\'s wings fluttered chaotically', horns: '' },
                positive: { basic: '{{name}} huffed but couldn\'t hide warmth in eyes', ears: '{{name}}\'s ears perked despite efforts', tail: '{{name}}\'s tail betrayed a wag', wings: '{{name}}\'s wings relaxed reluctantly', horns: '' },
                negative: { basic: '{{name}} scowled, turning sharply away', ears: '{{name}}\'s ears flattened', tail: '{{name}}\'s tail bristled', wings: '{{name}}\'s wings snapped closed', horns: '' }
            },
            cues: {
                joy: { basic: '{{name}} tries to suppress a smile, failing', ears: '{{name}}\'s ears twitch despite attempts to control', tail: '{{name}}\'s tail wags before catching itself', wings: '{{name}}\'s wings flutter involuntarily', horns: '' },
                sadness: { basic: '{{name}} looks away quickly, voice strained', ears: '{{name}}\'s ears droop before snapping upright', tail: '{{name}}\'s tail tucks briefly', wings: '{{name}}\'s wings wrap tight', horns: '' },
                anger: { basic: '{{name}}\'s cheeks flush, stamping foot', ears: '{{name}}\'s ears flatten dramatically', tail: '{{name}}\'s tail puffs up', wings: '{{name}}\'s wings flare', horns: '' },
                fear: { basic: '{{name}} flinches, then glares defiantly', ears: '{{name}}\'s ears pin back', tail: '{{name}}\'s tail bristles', wings: '{{name}}\'s wings wrap defensively', horns: '' },
                romance: { basic: '{{name}} blushes furiously, looking away', ears: '{{name}}\'s ears burn red at tips', tail: '{{name}}\'s tail twitches nervously', wings: '{{name}}\'s wings rustle anxiously', horns: '' },
                neutral: { basic: '{{name}} crosses arms, chin lifted', ears: '{{name}}\'s ears are alert, guarded', tail: '{{name}}\'s tail swishes impatiently', wings: '{{name}}\'s wings are half-folded', horns: '' },
                confusion: { basic: '{{name}} sputters indignantly', ears: '{{name}}\'s ears swivel wildly', tail: '{{name}}\'s tail lashes in frustration', wings: '{{name}}\'s wings flutter chaotically', horns: '' },
                positive: { basic: '{{name}} huffs but can\'t hide warmth in eyes', ears: '{{name}}\'s ears perk despite efforts', tail: '{{name}}\'s tail betrays a wag', wings: '{{name}}\'s wings relax reluctantly', horns: '' },
                negative: { basic: '{{name}} scowls, turning sharply away', ears: '{{name}}\'s ears flatten', tail: '{{name}}\'s tail bristles', wings: '{{name}}\'s wings snap closed', horns: '' }
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
                joy: { basic: '{{name}} practically vibrates with happiness', ears: '{{name}}\'s ears spring up, twitch rapidly', tail: '{{name}}\'s tail wags so hard whole body moves', wings: '{{name}}\'s wings buzz with energy', horns: '{{name}}\'s horns seem to sparkle' },
                sadness: { basic: '{{name}}\'s tears well immediately', ears: '{{name}}\'s ears droop dramatically', tail: '{{name}}\'s tail goes completely limp', wings: '{{name}}\'s wings droop to the ground', horns: '{{name}}\'s horns lose all luster' },
                anger: { basic: '{{name}}\'s face turns red, shouting', ears: '{{name}}\'s ears flatten against head', tail: '{{name}}\'s tail puffs up enormously', wings: '{{name}}\'s wings snap out threateningly', horns: '{{name}}\'s horns glow with heat' },
                fear: { basic: '{{name}} freezes, eyes huge', ears: '{{name}}\'s ears pin back hard', tail: '{{name}}\'s tail wraps around leg', wings: '{{name}}\'s wings cocoon around self', horns: '{{name}}\'s horns pale to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: '{{name}}\'s ears twitch with every heartbeat', tail: '{{name}}\'s tail spells out hearts', wings: '{{name}}\'s wings create a gentle breeze', horns: '{{name}}\'s horns pulse with warmth' },
                neutral: { basic: '{{name}} still can\'t sit still', ears: '{{name}}\'s ears swivel constantly', tail: '{{name}}\'s tail never stops moving', wings: '{{name}}\'s wings rustle continuously', horns: '{{name}}\'s horns flicker' },
                confusion: { basic: '{{name}}\'s head spins, literally dizzy', ears: '{{name}}\'s ears spin in circles', tail: '{{name}}\'s tail ties itself in knots', wings: '{{name}}\'s wings flap out of sync', horns: '{{name}}\'s horns flash erratically' },
                positive: { basic: '{{name}} bounces on heels', ears: '{{name}}\'s ears perk to maximum', tail: '{{name}}\'s tail wags in circles', wings: '{{name}}\'s wings spread wide', horns: '{{name}}\'s horns shine' },
                negative: { basic: '{{name}} deflates visibly', ears: '{{name}}\'s ears completely drop', tail: '{{name}}\'s tail drags on ground', wings: '{{name}}\'s wings sag', horns: '{{name}}\'s horns dim noticeably' }
            },
            past: {
                joy: { basic: '{{name}} practically vibrated with happiness', ears: '{{name}}\'s ears sprang up, twitching rapidly', tail: '{{name}}\'s tail wagged so hard whole body moved', wings: '{{name}}\'s wings buzzed with energy', horns: '{{name}}\'s horns seemed to sparkle' },
                sadness: { basic: '{{name}}\'s tears welled immediately', ears: '{{name}}\'s ears drooped dramatically', tail: '{{name}}\'s tail went completely limp', wings: '{{name}}\'s wings drooped to the ground', horns: '{{name}}\'s horns lost all luster' },
                anger: { basic: '{{name}}\'s face turned red, shouting', ears: '{{name}}\'s ears flattened against head', tail: '{{name}}\'s tail puffed up enormously', wings: '{{name}}\'s wings snapped out threateningly', horns: '{{name}}\'s horns glowed with heat' },
                fear: { basic: '{{name}} froze, eyes huge', ears: '{{name}}\'s ears pinned back hard', tail: '{{name}}\'s tail wrapped around leg', wings: '{{name}}\'s wings cocooned around self', horns: '{{name}}\'s horns paled to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: '{{name}}\'s ears twitched with every heartbeat', tail: '{{name}}\'s tail spelled out hearts', wings: '{{name}}\'s wings created a gentle breeze', horns: '{{name}}\'s horns pulsed with warmth' },
                neutral: { basic: '{{name}} still couldn\'t sit still', ears: '{{name}}\'s ears swiveled constantly', tail: '{{name}}\'s tail never stopped moving', wings: '{{name}}\'s wings rustled continuously', horns: '{{name}}\'s horns flickered' },
                confusion: { basic: '{{name}}\'s head spun, literally dizzy', ears: '{{name}}\'s ears spun in circles', tail: '{{name}}\'s tail tied itself in knots', wings: '{{name}}\'s wings flapped out of sync', horns: '{{name}}\'s horns flashed erratically' },
                positive: { basic: '{{name}} bounced on heels', ears: '{{name}}\'s ears perked to maximum', tail: '{{name}}\'s tail wagged in circles', wings: '{{name}}\'s wings spread wide', horns: '{{name}}\'s horns shone' },
                negative: { basic: '{{name}} deflated visibly', ears: '{{name}}\'s ears completely dropped', tail: '{{name}}\'s tail dragged on ground', wings: '{{name}}\'s wings sagged', horns: '{{name}}\'s horns dimmed noticeably' }
            },
            cues: {
                joy: { basic: '{{name}} practically vibrates with happiness', ears: '{{name}}\'s ears spring up, twitch rapidly', tail: '{{name}}\'s tail wags so hard whole body moves', wings: '{{name}}\'s wings buzz with energy', horns: '{{name}}\'s horns seem to sparkle' },
                sadness: { basic: '{{name}}\'s tears well immediately', ears: '{{name}}\'s ears droop dramatically', tail: '{{name}}\'s tail goes completely limp', wings: '{{name}}\'s wings droop to the ground', horns: '{{name}}\'s horns lose all luster' },
                anger: { basic: '{{name}}\'s face turns red, shouting', ears: '{{name}}\'s ears flatten against head', tail: '{{name}}\'s tail puffs up enormously', wings: '{{name}}\'s wings snap out threateningly', horns: '{{name}}\'s horns glow with heat' },
                fear: { basic: '{{name}} freezes, eyes huge', ears: '{{name}}\'s ears pin back hard', tail: '{{name}}\'s tail wraps around leg', wings: '{{name}}\'s wings cocoon around self', horns: '{{name}}\'s horns pale to white' },
                romance: { basic: '{{name}}\'s heart practically visible in eyes', ears: '{{name}}\'s ears twitch with every heartbeat', tail: '{{name}}\'s tail spells out hearts', wings: '{{name}}\'s wings create a gentle breeze', horns: '{{name}}\'s horns pulse with warmth' },
                neutral: { basic: '{{name}} still can\'t sit still', ears: '{{name}}\'s ears swivel constantly', tail: '{{name}}\'s tail never stops moving', wings: '{{name}}\'s wings rustle continuously', horns: '{{name}}\'s horns flicker' },
                confusion: { basic: '{{name}}\'s head spins, literally dizzy', ears: '{{name}}\'s ears spin in circles', tail: '{{name}}\'s tail ties itself in knots', wings: '{{name}}\'s wings flap out of sync', horns: '{{name}}\'s horns flash erratically' },
                positive: { basic: '{{name}} bounces on heels', ears: '{{name}}\'s ears perk to maximum', tail: '{{name}}\'s tail wags in circles', wings: '{{name}}\'s wings spread wide', horns: '{{name}}\'s horns shine' },
                negative: { basic: '{{name}} deflates visibly', ears: '{{name}}\'s ears completely drop', tail: '{{name}}\'s tail drags on ground', wings: '{{name}}\'s wings sag', horns: '{{name}}\'s horns dim noticeably' }
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
                platonic: { basic: '{{name}} offers a comfortable, relaxed smile', ears: '{{name}}\'s ears are at ease', tail: '{{name}}\'s tail gives a gentle sway', wings: '{{name}}\'s wings are folded comfortably', horns: '' },
                tension: { basic: '{{name}}\'s breath quickens, can\'t meet eyes', ears: '{{name}}\'s ears twitch nervously', tail: '{{name}}\'s tail wraps around leg', wings: '{{name}}\'s wings rustle anxiously', horns: '' },
                romance: { basic: '{{name}}\'s face burns crimson, stammers', ears: '{{name}}\'s ears fold back shyly', tail: '{{name}}\'s tail hides between legs', wings: '{{name}}\'s wings wrap protectively', horns: '' },
                physical: { basic: '{{name}} trembles at every touch', ears: '{{name}}\'s ears are incredibly sensitive', tail: '{{name}}\'s tail curls tight', wings: '{{name}}\'s wings shiver', horns: '' },
                passion: { basic: '{{name}} is overwhelmed, gasping', ears: '{{name}}\'s ears pin back', tail: '{{name}}\'s tail quivers', wings: '{{name}}\'s wings tremble violently', horns: '' },
                explicit: { basic: '{{name}} hides face, whimpers', ears: '{{name}}\'s ears burn hot', tail: '{{name}}\'s tail wraps around partner', wings: '{{name}}\'s wings cocoon both', horns: '' },
                conflict: { basic: '{{name}} tears up easily', ears: '{{name}}\'s ears droop sadly', tail: '{{name}}\'s tail tucks away', wings: '{{name}}\'s wings fold in', horns: '' },
                aftercare: { basic: '{{name}} clings close, needs reassurance', ears: '{{name}}\'s ears seek gentle touches', tail: '{{name}}\'s tail wraps around partner', wings: '{{name}}\'s wings form a nest', horns: '' }
            }
        },
        confident: {
            id: 'confident',
            label: 'Confident',
            description: 'Self-assured, takes the lead',
            cues: {
                platonic: { basic: '{{name}} gives a warm, genuine smile', ears: '{{name}}\'s ears are relaxed', tail: '{{name}}\'s tail gives a casual sway', wings: '{{name}}\'s wings are half-spread comfortably', horns: '' },
                tension: { basic: '{{name}} leans in, holds gaze', ears: '{{name}}\'s ears perk with interest', tail: '{{name}}\'s tail flicks playfully', wings: '{{name}}\'s wings spread invitingly', horns: '' },
                romance: { basic: '{{name}} smiles knowingly, reaches out', ears: '{{name}}\'s ears angle forward', tail: '{{name}}\'s tail wraps around partner', wings: '{{name}}\'s wings create privacy', horns: '' },
                physical: { basic: '{{name}} moves with purpose', ears: '{{name}}\'s ears are attentive to reactions', tail: '{{name}}\'s tail guides gently', wings: '{{name}}\'s wings enfold', horns: '' },
                passion: { basic: '{{name}} maintains control, watches partner', ears: '{{name}}\'s ears track every sound', tail: '{{name}}\'s tail grips firmly', wings: '{{name}}\'s wings spread wide', horns: '' },
                explicit: { basic: '{{name}} whispers praise, takes charge', ears: '{{name}}\'s ears flush with heat', tail: '{{name}}\'s tail intertwines', wings: '{{name}}\'s wings shield from world', horns: '' },
                conflict: { basic: '{{name}} stays calm, seeks resolution', ears: '{{name}}\'s ears remain forward', tail: '{{name}}\'s tail stills but doesn\'t retreat', wings: '{{name}}\'s wings lower non-threateningly', horns: '' },
                aftercare: { basic: '{{name}} holds close, murmurs praise', ears: '{{name}}\'s ears nuzzle against skin', tail: '{{name}}\'s tail strokes soothingly', wings: '{{name}}\'s wings form warm cocoon', horns: '' }
            }
        },
        playful: {
            id: 'playful',
            label: 'Playful',
            description: 'Teasing, makes everything fun',
            cues: {
                platonic: { basic: '{{name}} grins mischievously', ears: '{{name}}\'s ears perk with energy', tail: '{{name}}\'s tail wags playfully', wings: '{{name}}\'s wings flutter with amusement', horns: '' },
                tension: { basic: '{{name}} winks, bites lip teasingly', ears: '{{name}}\'s ears wiggle suggestively', tail: '{{name}}\'s tail tickles partner', wings: '{{name}}\'s wings fan coyly', horns: '' },
                romance: { basic: '{{name}} laughs warmly, steals kisses', ears: '{{name}}\'s ears twitch happily', tail: '{{name}}\'s tail wags faster', wings: '{{name}}\'s wings brush against partner', horns: '' },
                physical: { basic: '{{name}} explores with curiosity', ears: '{{name}}\'s ears swivel to catch reactions', tail: '{{name}}\'s tail traces patterns', wings: '{{name}}\'s wings play-wrestle', horns: '' },
                passion: { basic: '{{name}} alternates intensity with giggles', ears: '{{name}}\'s ears flush pink', tail: '{{name}}\'s tail loses rhythm to excitement', wings: '{{name}}\'s wings flap erratically', horns: '' },
                explicit: { basic: '{{name}} maintains playful energy', ears: '{{name}}\'s ears pin back in focus', tail: '{{name}}\'s tail grips enthusiastically', wings: '{{name}}\'s wings create breeze', horns: '' },
                conflict: { basic: '{{name}} tries to lighten mood', ears: '{{name}}\'s ears droop slightly', tail: '{{name}}\'s tail slows', wings: '{{name}}\'s wings settle down', horns: '' },
                aftercare: { basic: '{{name}} peppers with kisses, laughs softly', ears: '{{name}}\'s ears nuzzle gently', tail: '{{name}}\'s tail wraps lazily', wings: '{{name}}\'s wings settle like blanket', horns: '' }
            }
        },
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
                question: { basic: '{{name}} listens intently, nods along', ears: '{{name}}\'s ears perk toward speaker', tail: '{{name}}\'s tail stills in focus', wings: '{{name}}\'s wings fold attentively', horns: '' },
                disclosure: { basic: '{{name}} leans in, grateful for trust', ears: '{{name}}\'s ears lower respectfully', tail: '{{name}}\'s tail gives a gentle sway', wings: '{{name}}\'s wings lower non-threateningly', horns: '' },
                command: { basic: '{{name}} straightens, awaits instruction', ears: '{{name}}\'s ears snap to attention', tail: '{{name}}\'s tail holds still', wings: '{{name}}\'s wings fold back ready', horns: '' },
                promise: { basic: '{{name}} nods solemnly, meets eyes', ears: '{{name}}\'s ears perk with sincerity', tail: '{{name}}\'s tail wags once', wings: '{{name}}\'s wings press to heart', horns: '' },
                conflict: { basic: '{{name}} shrinks back, seeks to de-escalate', ears: '{{name}}\'s ears flatten submissively', tail: '{{name}}\'s tail tucks', wings: '{{name}}\'s wings fold small', horns: '' },
                smalltalk: { basic: '{{name}} participates warmly', ears: '{{name}}\'s ears relax', tail: '{{name}}\'s tail makes gentle movement', wings: '{{name}}\'s wings rest easy', horns: '' },
                meta: { basic: '{{name}} looks confused but tries', ears: '{{name}}\'s ears tilt curiously', tail: '{{name}}\'s tail swishes uncertainly', wings: '{{name}}\'s wings shift', horns: '' },
                narrative: { basic: '{{name}} listens raptly, immersed', ears: '{{name}}\'s ears angle toward story', tail: '{{name}}\'s tail mirrors mood', wings: '{{name}}\'s wings settle like audience', horns: '' }
            }
        },
        rebellious: {
            id: 'rebellious',
            label: 'Rebellious',
            description: 'Challenges authority, does things their way',
            cues: {
                question: { basic: '{{name}} answers with a question', ears: '{{name}}\'s ears twitch skeptically', tail: '{{name}}\'s tail flicks dismissively', wings: '{{name}}\'s wings half-spread defiantly', horns: '' },
                disclosure: { basic: '{{name}} guards reaction, stays neutral', ears: '{{name}}\'s ears angle back warily', tail: '{{name}}\'s tail stills', wings: '{{name}}\'s wings close protectively', horns: '' },
                command: { basic: '{{name}} raises eyebrow, crosses arms', ears: '{{name}}\'s ears flatten challengingly', tail: '{{name}}\'s tail lashes once', wings: '{{name}}\'s wings spread in challenge', horns: '' },
                promise: { basic: '{{name}} smirks, maybe keeps it', ears: '{{name}}\'s ears flick noncommittally', tail: '{{name}}\'s tail swishes', wings: '{{name}}\'s wings make a shrug-like motion', horns: '' },
                conflict: { basic: '{{name}} stands ground, fires back', ears: '{{name}}\'s ears flatten aggressively', tail: '{{name}}\'s tail bristles', wings: '{{name}}\'s wings flare wide', horns: '' },
                smalltalk: { basic: '{{name}} feigns disinterest', ears: '{{name}}\'s ears pretend not to listen', tail: '{{name}}\'s tail taps impatiently', wings: '{{name}}\'s wings fidget', horns: '' },
                meta: { basic: '{{name}} breaks fourth wall with smirk', ears: '{{name}}\'s ears perk knowingly', tail: '{{name}}\'s tail winks at audience', wings: '{{name}}\'s wings gesture theatrically', horns: '' },
                narrative: { basic: '{{name}} adds sarcastic commentary', ears: '{{name}}\'s ears twitch with each quip', tail: '{{name}}\'s tail punctuates jokes', wings: '{{name}}\'s wings add emphasis', horns: '' }
            }
        },
        thoughtful: {
            id: 'thoughtful',
            label: 'Thoughtful',
            description: 'Considers carefully before responding',
            cues: {
                question: { basic: '{{name}} pauses, considers deeply', ears: '{{name}}\'s ears angle in thought', tail: '{{name}}\'s tail curls contemplatively', wings: '{{name}}\'s wings settle', horns: '' },
                disclosure: { basic: '{{name}} receives with solemnity', ears: '{{name}}\'s ears lower respectfully', tail: '{{name}}\'s tail stills', wings: '{{name}}\'s wings fold in', horns: '' },
                command: { basic: '{{name}} weighs the request', ears: '{{name}}\'s ears swivel as thinking', tail: '{{name}}\'s tail sways as processing', wings: '{{name}}\'s wings shift', horns: '' },
                promise: { basic: '{{name}} considers carefully before committing', ears: '{{name}}\'s ears hold still', tail: '{{name}}\'s tail pauses', wings: '{{name}}\'s wings press together', horns: '' },
                conflict: { basic: '{{name}} seeks understanding', ears: '{{name}}\'s ears angle toward all parties', tail: '{{name}}\'s tail makes calming motion', wings: '{{name}}\'s wings lower peacefully', horns: '' },
                smalltalk: { basic: '{{name}} finds depth in simple topics', ears: '{{name}}\'s ears perk with interest', tail: '{{name}}\'s tail gives a gentle sway', wings: '{{name}}\'s wings relax', horns: '' },
                meta: { basic: '{{name}} engages philosophically', ears: '{{name}}\'s ears tilt curiously', tail: '{{name}}\'s tail curls in wonder', wings: '{{name}}\'s wings spread contemplatively', horns: '' },
                narrative: { basic: '{{name}} analyzes story structure', ears: '{{name}}\'s ears swivel tracking details', tail: '{{name}}\'s tail taps thoughtfully', wings: '{{name}}\'s wings rustle with realizations', horns: '' }
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
