// Exercise library, muscle regions and starter routines.
//
// Each exercise names the muscle regions it works: `pri` the ones doing the job,
// `sec` the ones helping. The body map in the reports and the little figure beside
// every exercise are drawn straight from these, so adding a move is enough to make
// it light up in the right place. `muscle` is still the coarse group the rest of the
// app counts by, and it is derived from the first primary region.
// inc = usual weight jump in kg. bw = bodyweight move (kg means added weight).

// The regions the body map can light up, each inside one of the six coarse groups.
export const REGIONS = {
  ch: { name: 'Chest', group: 'chest' },
  df: { name: 'Front delts', group: 'shoulders' },
  ds: { name: 'Side delts', group: 'shoulders' },
  dr: { name: 'Rear delts', group: 'shoulders' },
  tr: { name: 'Traps', group: 'back' },
  lt: { name: 'Lats', group: 'back' },
  ub: { name: 'Upper back', group: 'back' },
  lb: { name: 'Lower back', group: 'back' },
  bi: { name: 'Biceps', group: 'arms' },
  tx: { name: 'Triceps', group: 'arms' },
  fa: { name: 'Forearms', group: 'arms' },
  ab: { name: 'Abs', group: 'core' },
  ob: { name: 'Obliques', group: 'core' },
  gl: { name: 'Glutes', group: 'legs' },
  qu: { name: 'Quads', group: 'legs' },
  ha: { name: 'Hamstrings', group: 'legs' },
  ca: { name: 'Calves', group: 'legs' },
};

export const MUSCLES = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', legs: 'Legs', arms: 'Arms', core: 'Core' };
// Regions belonging to each coarse group, in the order they read best in a list.
export const GROUP_REGIONS = Object.keys(MUSCLES).reduce((o, g) => ({ ...o, [g]: Object.keys(REGIONS).filter(r => REGIONS[r].group === g) }), {});

// Movement pattern per region, for the push/pull and upper/lower balance checks.
export const REGION_PATTERN = {
  ch: 'push', df: 'push', ds: 'push', tx: 'push',
  lt: 'pull', ub: 'pull', tr: 'pull', dr: 'pull', bi: 'pull', fa: 'pull',
  qu: 'quad', ha: 'hinge', gl: 'hinge', lb: 'hinge', ca: 'calf',
  ab: 'core', ob: 'core',
};

// id | name | equipment | weight step | primary | secondary | form cues | flags
const TABLE = [
  // ---------- Chest ----------
  ['bench', 'Bench press', 'Barbell', 2.5, 'ch', 'df tx', 'Shoulder blades pinched back and down|Bar to mid-chest, elbows tucked about 45°'],
  ['incline_bench', 'Incline bench press', 'Barbell', 2.5, 'ch df', 'tx', 'Bench at 30°, higher turns it into a press|Bar to just under the collarbone'],
  ['decline_bench', 'Decline bench press', 'Barbell', 2.5, 'ch', 'tx', 'Lock your legs in before you unrack|Bar to the lower chest'],
  ['db_bench', 'Dumbbell bench press', 'Dumbbell', 2, 'ch', 'df tx', 'Let the bells come level with your chest|Press slightly inward at the top'],
  ['incline_db', 'Incline dumbbell press', 'Dumbbell', 2, 'ch df', 'tx', 'Wrists stacked over elbows|Stop short of clanging them together'],
  ['decline_db', 'Decline dumbbell press', 'Dumbbell', 2, 'ch', 'tx', 'Keep the ribcage down|Control the stretch at the bottom'],
  ['db_fly', 'Dumbbell fly', 'Dumbbell', 2, 'ch', 'df', 'Soft elbows, hold the angle the whole way|Think hugging a barrel, not pressing'],
  ['incline_db_fly', 'Incline dumbbell fly', 'Dumbbell', 2, 'ch', 'df', 'Stretch is the point — go slow at the bottom|Squeeze without letting the elbows straighten'],
  ['cable_fly', 'Cable fly', 'Cable', 2.5, 'ch', 'df', 'Step forward until the cables pull you open|Finish with the hands crossing slightly'],
  ['low_cable_fly', 'Low-to-high cable fly', 'Cable', 2.5, 'ch', 'df', 'Pulleys at the bottom, finish at chin height|Upper chest does the work'],
  ['high_cable_fly', 'High-to-low cable fly', 'Cable', 2.5, 'ch', '', 'Pulleys high, finish at your hips|Lean in a touch and hold the squeeze'],
  ['pec_deck', 'Pec deck', 'Machine', 5, 'ch', 'df', 'Set the seat so handles sit at chest height|Back flat on the pad the whole set'],
  ['chest_press', 'Machine chest press', 'Machine', 5, 'ch', 'df tx', 'Handles level with the mid-chest|Don’t let the shoulders roll forward'],
  ['incline_machine_press', 'Incline machine press', 'Machine', 5, 'ch df', 'tx', 'Chest up, elbows under the handles|Stop just short of lockout'],
  ['smith_bench', 'Smith machine bench press', 'Machine', 2.5, 'ch', 'tx df', 'The bar path is fixed, so set your bench carefully|Great for pushing close to failure alone'],
  ['dips', 'Dips', 'Bodyweight', 2.5, 'ch tx', 'df', 'Lean forward for chest, stay upright for triceps|Down until the upper arms are parallel', 'bw'],
  ['pushup', 'Push-up', 'Bodyweight', 0, 'ch', 'tx df ab', 'Hands just outside the shoulders|Body in one line from head to heels', 'bw'],
  ['decline_pushup', 'Decline push-up', 'Bodyweight', 0, 'ch df', 'tx ab', 'Feet up on a bench shifts load to the upper chest|Keep the hips from sagging', 'bw'],
  ['diamond_pushup', 'Diamond push-up', 'Bodyweight', 0, 'tx', 'ch', 'Hands together under the chest|Elbows brush the ribs on the way down', 'bw'],

  // ---------- Back ----------
  ['deadlift', 'Deadlift', 'Barbell', 5, 'lb ha gl', 'lt tr qu fa', 'Bar over the mid-foot, shins almost touching|Push the floor away, don’t yank with the back'],
  ['sumo_dl', 'Sumo deadlift', 'Barbell', 5, 'gl qu', 'lb tr ha', 'Wide stance, toes turned out|Open the knees out as you drive'],
  ['trap_bar_dl', 'Trap bar deadlift', 'Barbell', 5, 'qu gl lb', 'tr fa', 'Easier on the back than a straight bar|Stand up tall, don’t lean back at the top'],
  ['rack_pull', 'Rack pull', 'Barbell', 5, 'lb tr', 'lt gl', 'Bar set just below the knee|Chest proud, finish with the shoulders back'],
  ['row', 'Barbell row', 'Barbell', 2.5, 'lt ub', 'bi lb', 'Hinge to about 45° and hold it|Pull to the belly button, elbows past the ribs'],
  ['pendlay_row', 'Pendlay row', 'Barbell', 2.5, 'lt ub', 'bi', 'Torso stays parallel, bar resets on the floor|Explode up, control down'],
  ['yates_row', 'Underhand barbell row', 'Barbell', 2.5, 'lt', 'bi ub', 'Underhand grip, more upright torso|Drive the elbows down and back'],
  ['db_row', 'Dumbbell row', 'Dumbbell', 2, 'lt', 'bi ub', 'Brace a hand on the bench, hips square|Pull to the hip, not the shoulder'],
  ['chest_supported_row', 'Chest-supported row', 'Machine', 5, 'ub lt', 'bi dr', 'The pad takes the lower back out of it|Squeeze the blades together at the top'],
  ['tbar_row', 'T-bar row', 'Machine', 5, 'lt ub', 'bi', 'Chest on the pad, let the arms hang|Pull until the plates touch the pad'],
  ['seated_row', 'Seated cable row', 'Cable', 5, 'lt ub', 'bi', 'Sit tall, no rocking for momentum|Handle to the belly, elbows along your sides'],
  ['wide_seated_row', 'Wide-grip seated row', 'Cable', 5, 'ub dr', 'lt bi', 'Pull to the sternum with flared elbows|Hits the mid-back more than the lats'],
  ['single_cable_row', 'Single-arm cable row', 'Cable', 2.5, 'lt', 'bi ob', 'Let the shoulder reach forward, then pull|One side at a time evens out a lean'],
  ['lat_pulldown', 'Lat pulldown', 'Cable', 5, 'lt', 'bi ub', 'Grip just outside the shoulders|Bar to the collarbone, chest up to meet it'],
  ['close_pulldown', 'Close-grip pulldown', 'Cable', 5, 'lt', 'bi', 'Narrow grip gives a longer stretch|Drive the elbows down to your hips'],
  ['neutral_pulldown', 'Neutral-grip pulldown', 'Cable', 5, 'lt', 'bi', 'Palms facing in is the friendliest on shoulders|Lean back only a few degrees'],
  ['straight_pulldown', 'Straight-arm pulldown', 'Cable', 2.5, 'lt', 'ab', 'Arms stay long, hinge at the shoulder only|Finish with the bar at your thighs'],
  ['pullup', 'Pull-up', 'Bodyweight', 2.5, 'lt', 'bi ub fa', 'Start from a dead hang every rep|Chest to the bar, not the chin over it', 'bw'],
  ['chinup', 'Chin-up', 'Bodyweight', 2.5, 'lt bi', 'ub', 'Underhand grip brings the biceps in|Keep the ribs down, no swinging', 'bw'],
  ['neutral_pullup', 'Neutral-grip pull-up', 'Bodyweight', 2.5, 'lt bi', 'ub', 'Palms facing each other on parallel handles|Easiest version to add weight to', 'bw'],
  ['inverted_row', 'Inverted row', 'Bodyweight', 2.5, 'ub lt', 'bi', 'Body in one line, heels on the floor|Lower the bar to make it harder', 'bw'],
  ['pullover', 'Dumbbell pullover', 'Dumbbell', 2, 'lt', 'ch tx', 'One bell over the chest, arms slightly bent|Feel the stretch across the ribs'],
  ['back_ext', 'Back extension', 'Bodyweight', 2.5, 'lb', 'gl ha', 'Stop at a straight line — no hyperextending|Squeeze the glutes to finish', 'bw'],
  ['good_morning', 'Good morning', 'Barbell', 2.5, 'ha lb', 'gl', 'Light weight, this one punishes ego|Push the hips back, soft knees'],
  ['face_pull', 'Face pull', 'Cable', 2.5, 'dr ub', 'tr', 'Rope at eye height, pull to the forehead|Finish with the knuckles beside your ears'],
  ['rev_pec_deck', 'Reverse pec deck', 'Machine', 5, 'dr ub', '', 'Chest on the pad, arms almost straight|Lead with the pinkies'],
  ['shrug', 'Shrug', 'Dumbbell', 2, 'tr', '', 'Straight up, no rolling the shoulders|Pause for a beat at the top'],
  ['bb_shrug', 'Barbell shrug', 'Barbell', 2.5, 'tr', 'fa', 'Let the bar hang at arm’s length|Shrug to the ears, control it down'],

  // ---------- Shoulders ----------
  ['ohp', 'Overhead press', 'Barbell', 2.5, 'df', 'tx tr ab', 'Squeeze the glutes and brace hard|Move the head back as the bar passes'],
  ['seated_ohp', 'Seated barbell press', 'Barbell', 2.5, 'df', 'tx tr', 'Back against the pad takes the legs out|Bar just in front of the forehead'],
  ['push_press', 'Push press', 'Barbell', 5, 'df', 'tx qu', 'A short dip from the legs, then drive|Lets you handle more than a strict press'],
  ['db_shoulder', 'Dumbbell shoulder press', 'Dumbbell', 2, 'df ds', 'tx', 'Elbows slightly in front of the body|Down until the bells reach the ears'],
  ['arnold', 'Arnold press', 'Dumbbell', 2, 'df ds', 'tx', 'Start palms in, rotate as you press|Slow the rotation down, it is the point'],
  ['machine_shoulder', 'Machine shoulder press', 'Machine', 5, 'df ds', 'tx', 'Seat set so handles start at the ears|Safe way to take the last set to failure'],
  ['lateral_raise', 'Lateral raise', 'Dumbbell', 1, 'ds', 'tr', 'Lead with the elbows, not the hands|Stop at shoulder height — higher is traps'],
  ['cable_lateral', 'Cable lateral raise', 'Cable', 1.25, 'ds', '', 'Cable behind the body keeps tension at the bottom|One arm at a time, lean away slightly'],
  ['machine_lateral', 'Machine lateral raise', 'Machine', 2.5, 'ds', '', 'Pads on the upper arm, not the wrists|Smooth and slow both ways'],
  ['front_raise', 'Front raise', 'Dumbbell', 1, 'df', '', 'Only to shoulder height|Don’t swing the hips to start the rep'],
  ['rear_delt', 'Rear delt fly', 'Dumbbell', 1, 'dr', 'ub', 'Hinge over until the chest faces the floor|Thumbs down, elbows soft'],
  ['cable_rear_delt', 'Cable rear delt fly', 'Cable', 1.25, 'dr', 'ub', 'Cross the cables at chest height|Pull wide and back, not down'],
  ['upright_row', 'Upright row', 'Barbell', 2.5, 'ds tr', '', 'Wider grip is kinder on the shoulder|Stop when the elbows reach shoulder height'],
  ['landmine_press', 'Landmine press', 'Barbell', 2.5, 'df', 'tx ch', 'The arc suits cranky shoulders|Press up and slightly across'],

  // ---------- Legs ----------
  ['squat', 'Back squat', 'Barbell', 5, 'qu gl', 'lb ha ab', 'Big breath, brace, then break at hips and knees|Knees track over the toes, chest stays up'],
  ['front_squat', 'Front squat', 'Barbell', 2.5, 'qu', 'gl ab ub', 'Elbows high, bar on the shoulders not the wrists|Keeps you upright — quad heavy'],
  ['smith_squat', 'Smith machine squat', 'Machine', 5, 'qu gl', '', 'Feet a little forward of the bar|Fixed path lets you sit back safely'],
  ['hack_squat', 'Hack squat', 'Machine', 5, 'qu', 'gl', 'Back flat on the pad, feet mid-platform|Depth before weight'],
  ['leg_press', 'Leg press', 'Machine', 10, 'qu gl', 'ha', 'Hips stay on the seat — no rounding at the bottom|Don’t lock the knees out hard'],
  ['single_leg_press', 'Single-leg press', 'Machine', 5, 'qu gl', '', 'Foot in the middle of the platform|Evens out a stronger side'],
  ['goblet_squat', 'Goblet squat', 'Dumbbell', 2, 'qu gl', 'ab', 'Bell at the chest, elbows inside the knees|Great for grooving depth'],
  ['bulgarian', 'Bulgarian split squat', 'Dumbbell', 2, 'qu gl', 'ha', 'Back foot on the bench, front shin vertical|Lean forward slightly for more glute'],
  ['split_squat', 'Split squat', 'Dumbbell', 2, 'qu gl', '', 'Feet planted, straight up and down|Back knee to just above the floor'],
  ['lunge', 'Walking lunge', 'Dumbbell', 2, 'qu gl', 'ha', 'Long steps, torso upright|Push through the whole front foot'],
  ['rev_lunge', 'Reverse lunge', 'Dumbbell', 2, 'gl qu', 'ha', 'Stepping back is easier on the knees|Keep the weight on the front leg'],
  ['step_up', 'Step-up', 'Dumbbell', 2, 'qu gl', '', 'Box at about knee height|Don’t push off the back foot'],
  ['leg_ext', 'Leg extension', 'Machine', 5, 'qu', '', 'Pad on the ankle, not the shin|Pause a beat at the top'],
  ['rdl', 'Romanian deadlift', 'Barbell', 5, 'ha gl', 'lb', 'Push the hips back, bar grazing the thighs|Stop where the hamstrings run out of stretch'],
  ['db_rdl', 'Dumbbell Romanian deadlift', 'Dumbbell', 2, 'ha gl', 'lb', 'Bells outside the thighs|Soft knees, long spine'],
  ['single_rdl', 'Single-leg Romanian deadlift', 'Dumbbell', 2, 'ha gl', 'ob', 'Back leg and torso move as one line|Hips stay level, don’t open up'],
  ['stiff_dl', 'Stiff-leg deadlift', 'Barbell', 5, 'ha', 'gl lb', 'Knees almost straight the whole way|Lighter than an RDL for the same stretch'],
  ['leg_curl', 'Leg curl', 'Machine', 5, 'ha', 'ca', 'Hips pinned down, no lifting off the pad|Curl all the way, lower slowly'],
  ['seated_leg_curl', 'Seated leg curl', 'Machine', 5, 'ha', '', 'Hamstrings get a longer stretch seated|Toes pulled up towards the shins'],
  ['nordic', 'Nordic hamstring curl', 'Bodyweight', 2.5, 'ha', '', 'Lower as slowly as you can control|Push off the floor to get back up', 'bw'],
  ['hip_thrust', 'Hip thrust', 'Barbell', 5, 'gl', 'ha qu', 'Chin tucked, ribs down, finish level|Squeeze hard at the top for a beat'],
  ['glute_bridge', 'Glute bridge', 'Bodyweight', 2.5, 'gl', 'ha', 'Heels close to the hips|Push the floor away through the heels', 'bw'],
  ['cable_kickback', 'Cable glute kickback', 'Cable', 2.5, 'gl', 'ha', 'Hinge forward a little and hold it|Drive the heel back, not up'],
  ['hip_abduction', 'Hip abduction machine', 'Machine', 5, 'gl', '', 'Lean forward for the upper glute|Slow on the way back in'],
  ['hip_adduction', 'Hip adduction machine', 'Machine', 5, 'qu', '', 'Squeeze the knees together, pause|Keeps the inner thigh from being the weak link'],
  ['calf_raise', 'Calf raise', 'Machine', 5, 'ca', '', 'All the way down for the stretch|Pause at the top, no bouncing'],
  ['seated_calf', 'Seated calf raise', 'Machine', 5, 'ca', '', 'Bent knee hits the soleus underneath|Slow three-count down'],
  ['leg_press_calf', 'Leg press calf raise', 'Machine', 10, 'ca', '', 'Balls of the feet on the platform edge|Knees stay soft, not locked'],

  // ---------- Arms ----------
  ['curl', 'Barbell curl', 'Barbell', 2.5, 'bi', 'fa', 'Elbows pinned to your sides|No swinging — if the hips move, go lighter'],
  ['ez_curl', 'EZ-bar curl', 'Barbell', 2.5, 'bi', 'fa', 'The angled grip is kinder on the wrists|Same rules: still elbows'],
  ['db_curl', 'Dumbbell curl', 'Dumbbell', 1, 'bi', 'fa', 'Supinate as you come up|Lower all the way to a straight arm'],
  ['incline_db_curl', 'Incline dumbbell curl', 'Dumbbell', 1, 'bi', '', 'Arms hang behind the body for a long stretch|Humbling — start light'],
  ['hammer', 'Hammer curl', 'Dumbbell', 1, 'bi fa', '', 'Palms facing in the whole way|Builds the thickness on the outside of the arm'],
  ['concentration', 'Concentration curl', 'Dumbbell', 1, 'bi', '', 'Elbow braced on the inner thigh|Peak contraction, squeeze hard'],
  ['preacher', 'Preacher curl', 'Machine', 2.5, 'bi', '', 'Armpits over the top of the pad|Control the bottom, it is where it stretches'],
  ['cable_curl', 'Cable curl', 'Cable', 2.5, 'bi', 'fa', 'Tension never drops off|Step back so the cable pulls down and away'],
  ['bayesian', 'Cable bayesian curl', 'Cable', 1.25, 'bi', '', 'Stand in front of the pulley, arm behind you|Best stretch of any curl'],
  ['spider_curl', 'Spider curl', 'Dumbbell', 1, 'bi', '', 'Chest on an incline bench, arms hanging straight down|All contraction, no stretch'],
  ['reverse_curl', 'Reverse curl', 'Barbell', 1.25, 'fa bi', '', 'Overhand grip, lighter than it looks|Wrists held straight'],
  ['wrist_curl', 'Wrist curl', 'Dumbbell', 1, 'fa', '', 'Forearms on the bench, wrists off the end|Small range, high reps'],
  ['rev_wrist_curl', 'Reverse wrist curl', 'Dumbbell', 1, 'fa', '', 'Palms down, lift the knuckles|Helps elbow pain from pressing'],
  ['farmer_walk', 'Farmer’s walk', 'Dumbbell', 2, 'fa tr', 'ab gl', 'Walk tall, shoulders back|Time it rather than counting reps'],
  ['pushdown', 'Triceps pushdown', 'Cable', 2.5, 'tx', '', 'Elbows locked to the ribs|Straighten fully, squeeze at the bottom'],
  ['rope_pushdown', 'Rope pushdown', 'Cable', 2.5, 'tx', '', 'Split the rope apart at the bottom|Turn the pinkies out to finish'],
  ['oh_ext', 'Overhead triceps extension', 'Cable', 2.5, 'tx', '', 'Overhead stretches the long head — the big one|Keep the elbows from flaring out'],
  ['db_oh_ext', 'Dumbbell overhead extension', 'Dumbbell', 2, 'tx', '', 'One bell in both hands behind the head|Elbows point forward, not out'],
  ['skull', 'Skull crusher', 'Barbell', 2.5, 'tx', '', 'Lower to the forehead or just behind it|Upper arms stay still'],
  ['close_bench', 'Close-grip bench press', 'Barbell', 2.5, 'tx', 'ch df', 'Hands shoulder-width, no narrower|Elbows brush the ribs'],
  ['kickback', 'Triceps kickback', 'Dumbbell', 1, 'tx', '', 'Upper arm parallel to the floor and still|Light weight, full straighten'],
  ['dip_machine', 'Triceps dip machine', 'Machine', 5, 'tx', 'ch', 'Sit upright to keep it on the triceps|Easy to load heavy and safely'],
  ['bench_dip', 'Bench dip', 'Bodyweight', 2.5, 'tx', 'ch', 'Hands on the bench behind you|Stay close to the bench, no drifting out', 'bw'],

  // ---------- Core ----------
  ['leg_raise', 'Hanging leg raise', 'Bodyweight', 0, 'ab', 'ob', 'Tilt the pelvis before the legs move|No swinging between reps', 'bw'],
  ['hanging_knee', 'Hanging knee raise', 'Bodyweight', 0, 'ab', '', 'Knees to the chest, curl the hips up|The easier way into leg raises', 'bw'],
  ['lying_leg_raise', 'Lying leg raise', 'Bodyweight', 0, 'ab', '', 'Press the lower back into the floor|Stop before the back arches', 'bw'],
  ['crunch', 'Crunch', 'Bodyweight', 0, 'ab', '', 'Short range — ribs towards the hips|Hands by the ears, don’t pull the neck', 'bw'],
  ['cable_crunch', 'Cable crunch', 'Cable', 5, 'ab', 'ob', 'Kneel under the rope, hips stay put|Crunch with the ribs, not the arms'],
  ['machine_crunch', 'Machine crunch', 'Machine', 5, 'ab', '', 'Easiest way to add load to abs|Slow on the way back out'],
  ['ab_wheel', 'Ab wheel rollout', 'Bodyweight', 0, 'ab', 'ob lb', 'Ribs down, roll only as far as you can hold|Hips and shoulders move together', 'bw'],
  ['plank', 'Plank', 'Bodyweight', 0, 'ab', 'ob', 'Squeeze the glutes, tuck the ribs|Log it as reps of seconds', 'bw'],
  ['side_plank', 'Side plank', 'Bodyweight', 0, 'ob', 'ab', 'Stack the feet and lift the hips high|Log it as reps of seconds', 'bw'],
  ['dead_bug', 'Dead bug', 'Bodyweight', 0, 'ab', '', 'Lower back glued to the floor|Opposite arm and leg, slowly', 'bw'],
  ['russian_twist', 'Russian twist', 'Dumbbell', 1, 'ob', 'ab', 'Rotate from the ribs, not the arms|Feet down until it feels easy'],
  ['pallof', 'Pallof press', 'Cable', 2.5, 'ob', 'ab', 'Resist the twist — nothing should move|Press out slowly and come back'],
  ['woodchop', 'Cable woodchop', 'Cable', 2.5, 'ob', 'ab', 'Pivot the back foot as you turn|Arms stay long, hips lead'],
  ['side_bend', 'Dumbbell side bend', 'Dumbbell', 2, 'ob', '', 'One bell only, bend straight sideways|No leaning forward or back'],
  ['toes_to_bar', 'Toes to bar', 'Bodyweight', 0, 'ab', 'ob lt', 'Hollow body, then snap the toes up|Control the way down', 'bw'],
];

const list = s => (s ? s.split(' ') : []);
export const EXERCISES = TABLE.map(([id, name, equip, inc, pri, sec, cues, flags]) => ({
  id, name, equip, inc,
  pri: list(pri), sec: list(sec),
  muscle: REGIONS[list(pri)[0]]?.group ?? 'core',
  cues: cues ? cues.split('|') : [],
  ...(flags === 'bw' ? { bw: true } : {}),
}));

// Regions an exercise touches, primary first. Custom exercises fall back to every
// region in their group so the body map still has something to light up.
export function exRegions(ex) {
  if (ex?.pri?.length) return { pri: ex.pri, sec: ex.sec ?? [] };
  const g = GROUP_REGIONS[ex?.muscle] ?? [];
  return { pri: g, sec: [] };
}

// ---------- routines ----------
const ex = (exId, sets, repMin, repMax, extra) => ({ exId, sets, repMin, repMax, ...extra });

// Rep-range presets offered in the routine editor.
export const REP_PRESETS = [
  { id: 'strength', name: 'Strength', repMin: 4, repMax: 6, sets: 4, rest: 180, blurb: 'Heavy, long rests' },
  { id: 'hyper', name: 'Hypertrophy', repMin: 8, repMax: 12, sets: 3, rest: 120, blurb: 'The size range' },
  { id: 'pump', name: 'Pump', repMin: 12, repMax: 20, sets: 3, rest: 60, blurb: 'Light, short rests' },
];

export const TEMPLATES = {
  ppl: {
    name: 'Push / Pull / Legs', perWeek: 6, blurb: 'Classic bodybuilding split. Run it 3 or 6 days a week.',
    days: [
      { id: 'push', name: 'Push', exercises: [ex('bench', 4, 6, 8), ex('ohp', 3, 8, 10), ex('incline_db', 3, 8, 12), ex('lateral_raise', 3, 12, 15), ex('pushdown', 3, 10, 12), ex('dips', 2, 8, 12)] },
      { id: 'pull', name: 'Pull', exercises: [ex('deadlift', 3, 5, 6), ex('pullup', 4, 6, 10), ex('row', 3, 8, 10), ex('face_pull', 3, 12, 15), ex('db_curl', 3, 10, 12), ex('hammer', 2, 10, 12)] },
      { id: 'legs', name: 'Legs', exercises: [ex('squat', 4, 6, 8), ex('rdl', 3, 8, 10), ex('leg_press', 3, 10, 12), ex('leg_curl', 3, 10, 12), ex('calf_raise', 4, 10, 15)] },
    ],
  },
  ul: {
    name: 'Upper / Lower', perWeek: 4, blurb: 'Four days a week, each muscle twice. Great for a lean bulk.',
    days: [
      { id: 'upper_a', name: 'Upper A', exercises: [ex('bench', 4, 6, 8), ex('row', 4, 6, 8), ex('ohp', 3, 8, 10), ex('lat_pulldown', 3, 10, 12), ex('curl', 2, 10, 12), ex('pushdown', 2, 10, 12)] },
      { id: 'lower_a', name: 'Lower A', exercises: [ex('squat', 4, 6, 8), ex('rdl', 3, 8, 10), ex('leg_press', 3, 10, 12), ex('leg_curl', 3, 10, 12), ex('calf_raise', 3, 12, 15)] },
      { id: 'upper_b', name: 'Upper B', exercises: [ex('incline_db', 3, 8, 12), ex('pullup', 3, 6, 10), ex('db_shoulder', 3, 8, 12), ex('seated_row', 3, 10, 12), ex('lateral_raise', 3, 12, 15), ex('hammer', 2, 10, 12)] },
      { id: 'lower_b', name: 'Lower B', exercises: [ex('deadlift', 3, 5, 6), ex('bulgarian', 3, 8, 12), ex('leg_ext', 3, 12, 15), ex('hip_thrust', 3, 8, 12), ex('calf_raise', 3, 12, 15)] },
    ],
  },
  full: {
    name: 'Full body', perWeek: 3, blurb: 'Three days a week, whole body each time. Simple and effective.',
    days: [
      { id: 'full_a', name: 'Full body A', exercises: [ex('squat', 3, 6, 8), ex('bench', 3, 6, 8), ex('row', 3, 8, 10), ex('lateral_raise', 2, 12, 15), ex('curl', 2, 10, 12)] },
      { id: 'full_b', name: 'Full body B', exercises: [ex('deadlift', 3, 5, 6), ex('ohp', 3, 8, 10), ex('pullup', 3, 6, 10), ex('leg_curl', 2, 10, 12), ex('pushdown', 2, 10, 12)] },
      { id: 'full_c', name: 'Full body C', exercises: [ex('leg_press', 3, 10, 12), ex('incline_db', 3, 8, 12), ex('lat_pulldown', 3, 10, 12), ex('rdl', 3, 8, 10), ex('face_pull', 2, 12, 15)] },
    ],
  },
  bro: {
    name: 'Body part split', perWeek: 5, blurb: 'One muscle a day, five days a week. Lots of volume per session.',
    days: [
      { id: 'bro_chest', name: 'Chest', exercises: [ex('bench', 4, 6, 8), ex('incline_db', 3, 8, 12), ex('chest_press', 3, 10, 12), ex('cable_fly', 3, 12, 15), ex('dips', 2, 8, 12)] },
      { id: 'bro_back', name: 'Back', exercises: [ex('deadlift', 3, 5, 6), ex('pullup', 3, 6, 10), ex('row', 3, 8, 10), ex('seated_row', 3, 10, 12), ex('straight_pulldown', 3, 12, 15)] },
      { id: 'bro_legs', name: 'Legs', exercises: [ex('squat', 4, 6, 8), ex('rdl', 3, 8, 10), ex('leg_press', 3, 10, 12), ex('leg_curl', 3, 10, 12), ex('leg_ext', 3, 12, 15), ex('calf_raise', 4, 10, 15)] },
      { id: 'bro_shoulders', name: 'Shoulders', exercises: [ex('ohp', 4, 6, 8), ex('db_shoulder', 3, 8, 12), ex('lateral_raise', 4, 12, 15), ex('rear_delt', 3, 12, 15), ex('bb_shrug', 3, 10, 12)] },
      { id: 'bro_arms', name: 'Arms', exercises: [ex('ez_curl', 3, 8, 12, { sg: 1 }), ex('pushdown', 3, 10, 12, { sg: 1 }), ex('incline_db_curl', 3, 10, 12, { sg: 2 }), ex('oh_ext', 3, 10, 12, { sg: 2 }), ex('hammer', 3, 10, 15)] },
    ],
  },
};

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATE_COLORS = { 25: 'var(--move)', 20: 'var(--work)', 15: 'var(--school)', 10: 'var(--diet)', 5: 'var(--sleep)', 2.5: '#c9c9d3', 1.25: '#dcdce4' };
