/**
 * One-shot generator for TIAV extension banks (classic universal + ghana merge).
 * Run: node scripts/generate-tiav-banks.js
 * Then: npm run validate-questions
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_UNI = path.join(ROOT, 'content', 'questions', 'universal', 'tiav-extension-v1.json');
const OUT_GH = path.join(ROOT, 'content', 'questions', 'ghana', 'tiav-ghana-v1.json');

/** @param {Record<string, number>} w */
function row(id, text, culturalContext, type, difficulty, tags, reverseScored, informationGain, w, gh_variant) {
  return {
    id,
    text,
    dimension_weights: w,
    type,
    difficulty,
    tags,
    culturalContext,
    informationGain,
    reverseScored,
    ...(gh_variant ? { gh_variant } : {}),
  };
}

/** @param {string} dim @param {number} pri @param {Record<string, number>} extra */
function W(dim, pri, extra = {}) {
  return { [dim]: pri, ...extra };
}

const structure = 'structure';
const sensory = 'sensory';
const pattern = 'pattern';
const focus = 'focus';

/** @type {ReturnType<typeof row>[]} */
const universal = [];

function addDim(prefix, dim, tag, stems) {
  for (let i = 0; i < stems.length; i++) {
    const s = stems[i];
    const n = String(i + 1).padStart(2, '0');
    const id = `${prefix}-${n}`;
    const w = W(dim, s.pri, s.cross || {});
    universal.push(
      row(
        id,
        s.text,
        'universal',
        s.type || 'core',
        s.difficulty || 'broad',
        [tag],
        s.rev,
        s.ig,
        w,
        s.gh
      )
    );
  }
}

// --- T: temporal (20) — mix primary 0.62–0.88; ~7 reverse ---
addDim('TIAV-T', 'T', structure, [
  { text: 'When something important is coming up, I can picture how the next few weeks might unfold.', pri: 0.86, cross: { R: 0.08, F: 0.06 }, rev: false, ig: 0.78, gh: 'When something big is coming up — a naming ceremony, exams, or travel — I can picture how the next few weeks might unfold.' },
  { text: 'I start preparing for deadlines while they still feel far away on the calendar.', pri: 0.84, cross: { R: 0.1, P: 0.06 }, rev: false, ig: 0.76, gh: 'I start preparing while the date still feels far away on the calendar or in family talk.' },
  { text: 'Hours feel short when I am absorbed; I often look at the clock and realise more time passed than it felt like.', pri: 0.82, cross: { F: 0.12, A: 0.06 }, rev: true, ig: 0.74 },
  { text: 'I bump tasks forward until the last stretch of pressure finally gets me moving.', pri: 0.8, cross: { R: 0.12, E: 0.08 }, rev: true, ig: 0.72, gh: 'I bump tasks forward until the last stretch before market day, exams, or travel finally gets me moving.' },
  { text: 'I keep a rough map in my head of what belongs to which day this week.', pri: 0.72, cross: { R: 0.16, C: 0.12 }, rev: false, ig: 0.68 },
  { text: 'I split big projects into ordered steps with rough time boxes before I begin.', pri: 0.74, cross: { P: 0.14, R: 0.12 }, rev: false, ig: 0.7 },
  { text: 'I work in bursts; each stretch feels shorter or longer on the clock than it felt from the inside.', pri: 0.64, cross: { F: 0.2, A: 0.16 }, rev: true, ig: 0.62 },
  { text: 'The order of small errands in a day feels flexible; sequence matters little to me.', pri: 0.62, cross: { C: 0.22, E: 0.16 }, rev: false, ig: 0.58, difficulty: 'specific', gh: 'The order of small errands before market or after school feels flexible; sequence matters little to me.' },
  { text: 'I notice seasonal rhythms like holidays or exam cycles shaping how I plan ahead.', pri: 0.83, cross: { R: 0.1, E: 0.07 }, rev: false, ig: 0.75, gh: 'I notice seasons, holidays, harvest talk, or exam cycles shaping how I plan ahead.' },
  { text: 'Long stretches of free time feel shapeless until I give them a simple frame.', pri: 0.81, cross: { I: 0.1, F: 0.09 }, rev: true, ig: 0.73 },
  { text: 'I replay past conversations on a loose timeline to learn what to do differently next time.', pri: 0.73, cross: { A: 0.15, V: 0.12 }, rev: false, ig: 0.66, difficulty: 'specific' },
  { text: 'I arrive close to start times and leave little spare time for traffic or queues.', pri: 0.79, cross: { R: 0.12, S: 0.09 }, rev: true, ig: 0.71, gh: 'I arrive close to start times and leave little spare time for traffic, tro-tro waits, or queues.' },
  { text: 'I can describe how my typical weekday flows from morning to evening.', pri: 0.7, cross: { V: 0.18, R: 0.12 }, rev: false, ig: 0.65 },
  { text: 'I treat today and next week as about equally “present” when choosing what to worry about.', pri: 0.65, cross: { E: 0.2, A: 0.15 }, rev: false, ig: 0.6, difficulty: 'specific' },
  { text: 'I picture where milestones sit on a calendar before saying yes to new commitments.', pri: 0.85, cross: { R: 0.09, C: 0.06 }, rev: false, ig: 0.77 },
  { text: 'I lose track of clock time during screen time, reading, or deep hobbies.', pri: 0.83, cross: { F: 0.1, A: 0.07 }, rev: true, ig: 0.75 },
  { text: 'I keep mental notes about what should happen before lunch versus after school or work.', pri: 0.71, cross: { R: 0.18, F: 0.11 }, rev: false, ig: 0.67 },
  { text: 'I feel steady when there is a clear rhythm to the week even if plans change inside it.', pri: 0.68, cross: { E: 0.18, R: 0.14 }, rev: false, ig: 0.63, difficulty: 'specific' },
  { text: 'I underestimate how long familiar tasks take almost every time.', pri: 0.8, cross: { P: 0.12, F: 0.08 }, rev: true, ig: 0.72 },
  { text: 'I enjoy imagining possible futures in detail when making a big choice.', pri: 0.77, cross: { A: 0.13, E: 0.1 }, rev: false, ig: 0.69, type: 'refinement', difficulty: 'specific' },
]);

// --- I: interoceptive (20) ---
addDim('TIAV-I', 'I', sensory, [
  { text: 'When a choice feels heavy, I sense tightness, warmth, or openness in my body before the words line up.', pri: 0.86, cross: { S: 0.1, C: 0.04 }, rev: false, ig: 0.79, gh: 'When a choice feels heavy — at the market or in a family talk — I sense tightness, warmth, or openness in my body before the words line up.' },
  { text: 'I pick up early signs of hunger, thirst, or tiredness while they are still mild.', pri: 0.84, cross: { S: 0.1, E: 0.06 }, rev: false, ig: 0.77 },
  { text: 'Other people seem to notice hunger or fatigue before I feel it clearly.', pri: 0.82, cross: { S: 0.12, F: 0.06 }, rev: true, ig: 0.74 },
  { text: 'Signals from my body feel faint compared to what is happening around me.', pri: 0.8, cross: { S: 0.14, F: 0.06 }, rev: true, ig: 0.72 },
  { text: 'I sense heart rate or breathing shift during excitement or stress while it is happening.', pri: 0.74, cross: { E: 0.16, T: 0.1 }, rev: false, ig: 0.68, difficulty: 'specific' },
  { text: 'Muscle tension in shoulders, jaw, or hands is something I notice during a busy day.', pri: 0.72, cross: { S: 0.18, R: 0.1 }, rev: false, ig: 0.66 },
  { text: 'I realise I need water or food only after a headache or irritability shows up.', pri: 0.78, cross: { R: 0.12, E: 0.1 }, rev: true, ig: 0.71 },
  { text: 'Fullness after eating reaches my awareness quickly enough to guide portion pace.', pri: 0.7, cross: { T: 0.18, S: 0.12 }, rev: false, ig: 0.64, difficulty: 'specific' },
  { text: 'I track small shifts in energy across the day like a weather map inside me.', pri: 0.83, cross: { T: 0.1, E: 0.07 }, rev: false, ig: 0.75 },
  { text: 'Physical discomfort sits in the background until it suddenly demands attention.', pri: 0.81, cross: { S: 0.12, F: 0.07 }, rev: true, ig: 0.73 },
  { text: 'I sense temperature comfort in a room soon after entering.', pri: 0.65, cross: { S: 0.22, P: 0.13 }, rev: false, ig: 0.59, difficulty: 'specific' },
  { text: 'Butterflies or calm in the stomach show up during anticipation or relief.', pri: 0.73, cross: { E: 0.15, T: 0.12 }, rev: false, ig: 0.66 },
  { text: 'I connect shallow breathing with stress early enough to slow down on purpose.', pri: 0.76, cross: { R: 0.14, C: 0.1 }, rev: false, ig: 0.69 },
  { text: 'I am last to notice that the room feels too loud or too bright for my comfort.', pri: 0.79, cross: { S: 0.14, E: 0.07 }, rev: true, ig: 0.71 },
  { text: 'I name inner states with simple words like wired, flat, or buzzing.', pri: 0.71, cross: { V: 0.18, E: 0.11 }, rev: false, ig: 0.65 },
  { text: 'I feel sleep pressure build gradually before a sharp drop in energy hits.', pri: 0.75, cross: { T: 0.15, R: 0.1 }, rev: false, ig: 0.68 },
  { text: 'I notice posture slipping into a slouch before discomfort spikes.', pri: 0.69, cross: { S: 0.18, F: 0.13 }, rev: false, ig: 0.63, difficulty: 'specific' },
  { text: 'I sense rest needs during social time before irritability leaks into my tone.', pri: 0.77, cross: { E: 0.13, R: 0.1 }, rev: false, ig: 0.7 },
  { text: 'I rely on outside cues like meal times to guess my hunger more than inner cues.', pri: 0.8, cross: { T: 0.12, S: 0.08 }, rev: true, ig: 0.72, gh: 'I rely on meal times or what others are eating to guess my hunger more than inner cues.' },
  { text: 'A short body scan in my mind helps me locate where stress sits.', pri: 0.72, cross: { A: 0.14, V: 0.14 }, rev: false, ig: 0.66, type: 'refinement', difficulty: 'specific' },
]);

// --- A: associative (20) ---
addDim('TIAV-A', 'A', pattern, [
  { text: 'While working on one thing, my mind links useful ideas from topics that seemed unrelated.', pri: 0.86, cross: { P: 0.08, F: 0.06 }, rev: false, ig: 0.8, gh: 'While doing one task — selling, studying, or fixing something — my mind links useful ideas from topics that seemed unrelated.' },
  { text: 'Analogies between different areas of life show up when I let my mind wander freely.', pri: 0.84, cross: { P: 0.1, V: 0.06 }, rev: false, ig: 0.78 },
  { text: 'My thinking stays close to the task; wide hops feel rare or distracting.', pri: 0.82, cross: { F: 0.12, R: 0.06 }, rev: true, ig: 0.74 },
  { text: 'I prefer a straight outline and skip tempting side branches.', pri: 0.8, cross: { C: 0.12, P: 0.08 }, rev: true, ig: 0.72 },
  { text: 'A single word can pull up a chain of memories from different years.', pri: 0.75, cross: { V: 0.15, T: 0.1 }, rev: false, ig: 0.7 },
  { text: 'I spot parallels between a story someone tells and something I read elsewhere.', pri: 0.73, cross: { V: 0.16, E: 0.11 }, rev: false, ig: 0.68, difficulty: 'specific' },
  { text: 'Brainstorming lists grow wide fast; pruning them down is the harder part.', pri: 0.78, cross: { E: 0.12, F: 0.1 }, rev: false, ig: 0.72 },
  { text: 'I keep meetings and lessons on one track; side topics seldom pull me off course.', pri: 0.7, cross: { R: 0.18, F: 0.12 }, rev: true, ig: 0.65, difficulty: 'specific' },
  { text: 'Dreams or daydreams reuse symbols that connect to daytime worries.', pri: 0.71, cross: { I: 0.15, T: 0.14 }, rev: false, ig: 0.64 },
  { text: 'I draw creative links between tools at hand when a usual approach is blocked.', pri: 0.83, cross: { C: 0.1, P: 0.07 }, rev: false, ig: 0.76 },
  { text: 'I lose the main thread when a conversation jumps topics quickly.', pri: 0.79, cross: { F: 0.12, V: 0.09 }, rev: true, ig: 0.71 },
  { text: 'I enjoy mixing metaphors from cooking, music, and travel to explain an idea.', pri: 0.74, cross: { V: 0.14, E: 0.12 }, rev: false, ig: 0.68 },
  { text: 'I solve puzzles fastest when I stop forcing a linear path and let patterns pop.', pri: 0.76, cross: { P: 0.14, F: 0.1 }, rev: false, ig: 0.69 },
  { text: 'I screen out interesting tangents so the group finishes on time.', pri: 0.72, cross: { R: 0.16, C: 0.12 }, rev: true, ig: 0.66 },
  { text: 'Remote connections feel obvious in hindsight even if they surprised me at first.', pri: 0.69, cross: { P: 0.18, T: 0.13 }, rev: false, ig: 0.63, difficulty: 'specific' },
  { text: 'I map how two school subjects support each other across the term.', pri: 0.67, cross: { P: 0.2, R: 0.13 }, rev: false, ig: 0.61, difficulty: 'specific' },
  { text: 'I often find humour in the collision between two unlike frames.', pri: 0.81, cross: { E: 0.12, V: 0.07 }, rev: false, ig: 0.74 },
  { text: 'I stick to one interpretation until evidence forces a switch.', pri: 0.77, cross: { C: 0.13, P: 0.1 }, rev: true, ig: 0.7 },
  { text: 'I use mind maps or loose webs more often than tight bullet lists when planning ideas.', pri: 0.73, cross: { V: 0.15, F: 0.12 }, rev: false, ig: 0.67 },
  { text: 'I notice when a new idea rhymes with an older habit I thought I left behind.', pri: 0.71, cross: { T: 0.15, I: 0.14 }, rev: false, ig: 0.65, type: 'refinement', difficulty: 'specific' },
]);

// --- V: verbal-spatial (20) ---
addDim('TIAV-V', 'V', focus, [
  { text: 'Diagrams, sketches, or maps speed up my understanding more than words alone.', pri: 0.86, cross: { P: 0.08, F: 0.06 }, rev: false, ig: 0.79, gh: 'A quick sketch in sand or on paper, or pointing on a map, speeds up my understanding more than words alone.' },
  { text: 'I rehearse sentences in my head until the wording feels right.', pri: 0.84, cross: { A: 0.1, E: 0.06 }, rev: true, ig: 0.77 },
  { text: 'I picture layouts of rooms or streets to remember where things sit.', pri: 0.82, cross: { P: 0.12, T: 0.06 }, rev: false, ig: 0.75 },
  { text: 'Narrating events in order with words is easier than drawing them.', pri: 0.8, cross: { A: 0.12, T: 0.08 }, rev: true, ig: 0.73 },
  { text: 'I rotate shapes in imagination to see if parts will fit.', pri: 0.75, cross: { P: 0.15, F: 0.1 }, rev: false, ig: 0.7 },
  { text: 'I take voice notes because speaking captures my thoughts cleaner than imagery.', pri: 0.73, cross: { A: 0.14, E: 0.13 }, rev: true, ig: 0.68, difficulty: 'specific' },
  { text: 'I remember faces and scenes like snapshots more than spoken lines.', pri: 0.78, cross: { S: 0.12, I: 0.1 }, rev: false, ig: 0.72 },
  { text: 'Written step lists carry me through a recipe or repair more than pictures.', pri: 0.7, cross: { R: 0.18, P: 0.12 }, rev: true, ig: 0.65, difficulty: 'specific' },
  { text: 'I turn abstract rules into little verbal formulas I repeat.', pri: 0.72, cross: { P: 0.16, A: 0.12 }, rev: true, ig: 0.66 },
  { text: 'I navigate by landmarks and sense of direction more than street names.', pri: 0.81, cross: { T: 0.1, P: 0.09 }, rev: false, ig: 0.74, gh: 'I navigate by landmarks, paths people use, and sense of direction more than street signs alone.' },
  { text: 'I explain new ideas to someone else using a chalk talk or whiteboard sketch.', pri: 0.79, cross: { E: 0.12, P: 0.09 }, rev: false, ig: 0.71 },
  { text: 'I replay dialogue lines from films or books to savour rhythm and word choice.', pri: 0.74, cross: { A: 0.14, E: 0.12 }, rev: true, ig: 0.68 },
  { text: 'I score higher on remembering patterns than on remembering exact phrases.', pri: 0.69, cross: { P: 0.18, F: 0.13 }, rev: false, ig: 0.63, difficulty: 'specific' },
  { text: 'I translate teacher instructions into a quick inner comic strip.', pri: 0.71, cross: { A: 0.15, F: 0.14 }, rev: false, ig: 0.65, difficulty: 'specific' },
  { text: 'Colour coding or spatial grouping organises my notes.', pri: 0.77, cross: { P: 0.13, C: 0.1 }, rev: false, ig: 0.69 },
  { text: 'I trust a spoken promise more if I hear the exact words again in memory.', pri: 0.76, cross: { E: 0.14, T: 0.1 }, rev: true, ig: 0.69 },
  { text: 'I imagine cutting objects or folding paper to guess outcomes.', pri: 0.73, cross: { P: 0.16, A: 0.11 }, rev: false, ig: 0.67 },
  { text: 'I describe directions to a friend mainly as left-right verbal sequence.', pri: 0.68, cross: { T: 0.18, R: 0.14 }, rev: true, ig: 0.62, difficulty: 'specific' },
  { text: 'Music feels like moving shapes or colours as much as sound layers.', pri: 0.66, cross: { S: 0.2, I: 0.14 }, rev: false, ig: 0.6, difficulty: 'specific' },
  { text: 'I pick fonts and spacing when a message matters because form carries meaning.', pri: 0.72, cross: { A: 0.14, E: 0.14 }, rev: true, ig: 0.66, type: 'refinement', difficulty: 'specific' },
]);

// Fix informationGain minimum 0.5 for validator
for (const q of universal) {
  if (q.informationGain < 0.5) q.informationGain = 0.5;
}

const ghanaOnly = [
  row(
    'GH-TIAV-T-101',
    'When the family calendar fills with funerals, weddings, and naming dates, you still know which week each one sits in.',
    'ghana',
    'core',
    'broad',
    [structure],
    false,
    0.76,
    W('T', 0.85, { R: 0.09, E: 0.06 })
  ),
  row(
    'GH-TIAV-T-102',
    'Market mornings and quiet afternoons feel like different kinds of time to you.',
    'ghana',
    'core',
    'specific',
    [structure],
    false,
    0.68,
    W('T', 0.72, { E: 0.16, S: 0.12 })
  ),
  row(
    'GH-TIAV-I-101',
    'Heat, Harmattan dust, or sudden cool rain change how your body feels within minutes.',
    'ghana',
    'core',
    'broad',
    [sensory],
    false,
    0.74,
    W('I', 0.82, { S: 0.12, T: 0.06 })
  ),
  row(
    'GH-TIAV-I-102',
    'After spicy food or a long walk in sun, you notice belly or skin signals before they ruin your mood.',
    'ghana',
    'core',
    'specific',
    [sensory],
    false,
    0.67,
    W('I', 0.74, { S: 0.14, E: 0.12 })
  ),
  row(
    'GH-TIAV-A-101',
    'A proverb from home connects easily to a problem you see online or in class.',
    'ghana',
    'core',
    'broad',
    [pattern],
    false,
    0.77,
    W('A', 0.84, { V: 0.1, E: 0.06 })
  ),
  row(
    'GH-TIAV-A-102',
    'You see links between how a stall is arranged and how a lesson is structured.',
    'ghana',
    'core',
    'specific',
    [pattern],
    false,
    0.66,
    W('A', 0.71, { P: 0.17, V: 0.12 })
  ),
  row(
    'GH-TIAV-V-101',
    'You give directions using big trees, chapels, and chop bars people know along the way.',
    'ghana',
    'core',
    'broad',
    [focus],
    false,
    0.75,
    W('V', 0.83, { P: 0.11, T: 0.06 })
  ),
  row(
    'GH-TIAV-V-102',
    'You sketch the football pitch or classroom layout to explain a play or seating plan.',
    'ghana',
    'core',
    'specific',
    [focus],
    false,
    0.69,
    W('V', 0.76, { P: 0.14, R: 0.1 })
  ),
];

// Universal TIAV stems: first person (I / my / me). Ghana-only rows above: second person (you / your), matching `ghana/core.json`.

fs.writeFileSync(OUT_UNI, JSON.stringify(universal, null, 2) + '\n', 'utf8');
fs.writeFileSync(OUT_GH, JSON.stringify(ghanaOnly, null, 2) + '\n', 'utf8');
console.log(`Wrote ${universal.length} universal + ${ghanaOnly.length} ghana TIAV items.`);
