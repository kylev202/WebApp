// Exercise library and starter routines. inc = usual weight jump in kg.
// bw = bodyweight move (kg means added weight).

export const MUSCLES = { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', legs: 'Legs', arms: 'Arms', core: 'Core' };

export const EXERCISES = [
  // Chest
  { id: 'bench', name: 'Bench press', muscle: 'chest', equip: 'Barbell', inc: 2.5 },
  { id: 'incline_bench', name: 'Incline bench press', muscle: 'chest', equip: 'Barbell', inc: 2.5 },
  { id: 'db_bench', name: 'Dumbbell bench press', muscle: 'chest', equip: 'Dumbbell', inc: 2 },
  { id: 'incline_db', name: 'Incline dumbbell press', muscle: 'chest', equip: 'Dumbbell', inc: 2 },
  { id: 'cable_fly', name: 'Cable fly', muscle: 'chest', equip: 'Cable', inc: 2.5 },
  { id: 'pec_deck', name: 'Pec deck', muscle: 'chest', equip: 'Machine', inc: 5 },
  { id: 'chest_press', name: 'Machine chest press', muscle: 'chest', equip: 'Machine', inc: 5 },
  { id: 'dips', name: 'Dips', muscle: 'chest', equip: 'Bodyweight', inc: 2.5, bw: true },
  { id: 'pushup', name: 'Push-up', muscle: 'chest', equip: 'Bodyweight', inc: 0, bw: true },
  // Back
  { id: 'deadlift', name: 'Deadlift', muscle: 'back', equip: 'Barbell', inc: 5 },
  { id: 'row', name: 'Barbell row', muscle: 'back', equip: 'Barbell', inc: 2.5 },
  { id: 'db_row', name: 'Dumbbell row', muscle: 'back', equip: 'Dumbbell', inc: 2 },
  { id: 'pullup', name: 'Pull-up', muscle: 'back', equip: 'Bodyweight', inc: 2.5, bw: true },
  { id: 'chinup', name: 'Chin-up', muscle: 'back', equip: 'Bodyweight', inc: 2.5, bw: true },
  { id: 'lat_pulldown', name: 'Lat pulldown', muscle: 'back', equip: 'Cable', inc: 5 },
  { id: 'seated_row', name: 'Seated cable row', muscle: 'back', equip: 'Cable', inc: 5 },
  { id: 'tbar_row', name: 'T-bar row', muscle: 'back', equip: 'Machine', inc: 5 },
  { id: 'face_pull', name: 'Face pull', muscle: 'back', equip: 'Cable', inc: 2.5 },
  // Shoulders
  { id: 'ohp', name: 'Overhead press', muscle: 'shoulders', equip: 'Barbell', inc: 2.5 },
  { id: 'db_shoulder', name: 'Dumbbell shoulder press', muscle: 'shoulders', equip: 'Dumbbell', inc: 2 },
  { id: 'lateral_raise', name: 'Lateral raise', muscle: 'shoulders', equip: 'Dumbbell', inc: 1 },
  { id: 'cable_lateral', name: 'Cable lateral raise', muscle: 'shoulders', equip: 'Cable', inc: 1.25 },
  { id: 'rear_delt', name: 'Rear delt fly', muscle: 'shoulders', equip: 'Dumbbell', inc: 1 },
  { id: 'shrug', name: 'Shrug', muscle: 'shoulders', equip: 'Dumbbell', inc: 2 },
  // Legs
  { id: 'squat', name: 'Back squat', muscle: 'legs', equip: 'Barbell', inc: 5 },
  { id: 'front_squat', name: 'Front squat', muscle: 'legs', equip: 'Barbell', inc: 2.5 },
  { id: 'hack_squat', name: 'Hack squat', muscle: 'legs', equip: 'Machine', inc: 5 },
  { id: 'leg_press', name: 'Leg press', muscle: 'legs', equip: 'Machine', inc: 10 },
  { id: 'rdl', name: 'Romanian deadlift', muscle: 'legs', equip: 'Barbell', inc: 5 },
  { id: 'leg_curl', name: 'Leg curl', muscle: 'legs', equip: 'Machine', inc: 5 },
  { id: 'leg_ext', name: 'Leg extension', muscle: 'legs', equip: 'Machine', inc: 5 },
  { id: 'lunge', name: 'Walking lunge', muscle: 'legs', equip: 'Dumbbell', inc: 2 },
  { id: 'bulgarian', name: 'Bulgarian split squat', muscle: 'legs', equip: 'Dumbbell', inc: 2 },
  { id: 'hip_thrust', name: 'Hip thrust', muscle: 'legs', equip: 'Barbell', inc: 5 },
  { id: 'calf_raise', name: 'Calf raise', muscle: 'legs', equip: 'Machine', inc: 5 },
  // Arms
  { id: 'curl', name: 'Barbell curl', muscle: 'arms', equip: 'Barbell', inc: 2.5 },
  { id: 'db_curl', name: 'Dumbbell curl', muscle: 'arms', equip: 'Dumbbell', inc: 1 },
  { id: 'hammer', name: 'Hammer curl', muscle: 'arms', equip: 'Dumbbell', inc: 1 },
  { id: 'preacher', name: 'Preacher curl', muscle: 'arms', equip: 'Machine', inc: 2.5 },
  { id: 'pushdown', name: 'Triceps pushdown', muscle: 'arms', equip: 'Cable', inc: 2.5 },
  { id: 'skull', name: 'Skull crusher', muscle: 'arms', equip: 'Barbell', inc: 2.5 },
  { id: 'oh_ext', name: 'Overhead triceps extension', muscle: 'arms', equip: 'Cable', inc: 2.5 },
  { id: 'close_bench', name: 'Close-grip bench press', muscle: 'arms', equip: 'Barbell', inc: 2.5 },
  // Core
  { id: 'leg_raise', name: 'Hanging leg raise', muscle: 'core', equip: 'Bodyweight', inc: 0, bw: true },
  { id: 'cable_crunch', name: 'Cable crunch', muscle: 'core', equip: 'Cable', inc: 5 },
  { id: 'ab_wheel', name: 'Ab wheel rollout', muscle: 'core', equip: 'Bodyweight', inc: 0, bw: true },
];

const ex = (exId, sets, repMin, repMax) => ({ exId, sets, repMin, repMax });

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
};

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATE_COLORS = { 25: 'var(--move)', 20: 'var(--work)', 15: 'var(--school)', 10: 'var(--diet)', 5: 'var(--sleep)', 2.5: '#c9c9d3', 1.25: '#dcdce4' };
