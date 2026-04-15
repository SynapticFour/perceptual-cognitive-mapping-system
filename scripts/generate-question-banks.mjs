/**
 * One-off generator for universal + ghana question JSON (run: node scripts/generate-question-banks.mjs).
 * Outputs valid banks: ≥2 reverse-scored primaries per dimension (primary = argmax ≥ 0.6).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'content', 'questions');

function q(row) {
  return {
    id: row.id,
    text: row.text,
    dimension_weights: row.w,
    type: row.type,
    difficulty: row.difficulty,
    tags: row.tags,
    culturalContext: row.ctx,
    informationGain: row.ig,
    reverseScored: row.rev,
  };
}

/** 30 core: 3 per dimension; 2 reverse + 1 forward each; primary > 0.6 */
function universalCore() {
  const rows = [];
  const dims = [
    {
      k: 'F',
      tag: ['focus'],
      fwd: {
        text: 'When working on something that genuinely interests you, you can keep your attention on it for a long stretch without your mind wandering.',
        w: { F: 0.82, S: 0.12, T: 0.06 },
        ig: 0.78,
      },
      r1: {
        text: 'Background noise, people moving, or small interruptions usually derail your concentration completely.',
        w: { F: 0.8, S: 0.14, E: 0.06 },
        ig: 0.74,
      },
      r2: {
        text: 'Within a few minutes of starting a focused task, you often catch yourself doing something else without planning to.',
        w: { F: 0.78, A: 0.12, C: 0.1 },
        ig: 0.72,
      },
    },
    {
      k: 'P',
      tag: ['pattern'],
      fwd: {
        text: 'You are comfortable spotting rules, regularities, or hidden structure behind concrete examples.',
        w: { P: 0.84, F: 0.08, R: 0.08 },
        ig: 0.76,
      },
      r1: {
        text: 'Abstract diagrams or purely symbolic explanations rarely feel clear unless tied to a concrete example.',
        w: { P: 0.8, V: 0.12, F: 0.08 },
        ig: 0.7,
      },
      r2: {
        text: 'You prefer instructions that list exact steps over explanations that stress the “big idea” behind them.',
        w: { P: 0.78, R: 0.14, V: 0.08 },
        ig: 0.68,
      },
    },
    {
      k: 'S',
      tag: ['sensory'],
      fwd: {
        text: 'Bright lights, strong smells, or crowded noisy spaces can quickly feel overwhelming.',
        w: { S: 0.85, E: 0.08, F: 0.07 },
        ig: 0.8,
      },
      r1: {
        text: 'You hardly notice typical office or street-level sensory stimulation; it rarely bothers you.',
        w: { S: 0.82, F: 0.1, E: 0.08 },
        ig: 0.72,
      },
      r2: {
        text: 'Loud overlapping conversations feel like neutral background; they rarely drain your energy.',
        w: { S: 0.8, E: 0.12, F: 0.08 },
        ig: 0.7,
      },
    },
    {
      k: 'E',
      tag: ['social'],
      fwd: {
        text: 'After several hours in lively group settings, you usually need quiet time alone to recharge.',
        w: { E: 0.84, S: 0.1, F: 0.06 },
        ig: 0.77,
      },
      r1: {
        text: 'Being around many people for a long time tends to energise you rather than wear you down.',
        w: { E: 0.82, F: 0.1, S: 0.08 },
        ig: 0.73,
      },
      r2: {
        text: 'You look forward to back-to-back social events on the same day and rarely feel “peopled out”.',
        w: { E: 0.8, R: 0.12, F: 0.08 },
        ig: 0.71,
      },
    },
    {
      k: 'R',
      tag: ['structure'],
      fwd: {
        text: 'Knowing the plan in advance and having predictable routines helps you feel settled and effective.',
        w: { R: 0.84, C: 0.1, F: 0.06 },
        ig: 0.75,
      },
      r1: {
        text: 'You are comfortable improvising when schedules change at the last minute and rarely find that stressful.',
        w: { R: 0.82, C: 0.12, F: 0.06 },
        ig: 0.72,
      },
      r2: {
        text: 'You prefer open-ended days with few fixed commitments over days blocked into timed slots.',
        w: { R: 0.8, T: 0.12, C: 0.08 },
        ig: 0.7,
      },
    },
    {
      k: 'C',
      tag: ['flexibility'],
      fwd: {
        text: 'When new information contradicts what you believed, you can revise your view without much inner resistance.',
        w: { C: 0.84, R: 0.08, P: 0.08 },
        ig: 0.76,
      },
      r1: {
        text: 'Once you have decided on an answer, you find it uncomfortable to revisit it even if someone raises a good counterpoint.',
        w: { C: 0.82, R: 0.1, F: 0.08 },
        ig: 0.74,
      },
      r2: {
        text: 'Ambiguous situations where there is no single “right” interpretation feel irritating rather than interesting.',
        w: { C: 0.8, P: 0.12, R: 0.08 },
        ig: 0.72,
      },
    },
    {
      k: 'T',
      tag: ['structure'],
      fwd: {
        text: 'You usually have a clear sense of how long tasks will take and rarely lose track of time when deadlines matter.',
        w: { T: 0.84, R: 0.1, F: 0.06 },
        ig: 0.78,
      },
      r1: {
        text: 'Hours can pass in what feels like minutes when you are absorbed; you often underestimate how much time went by.',
        w: { T: 0.82, F: 0.12, A: 0.06 },
        ig: 0.76,
      },
      r2: {
        text: 'You frequently run late or need alarms because internal time sense is weak compared to what the clock shows.',
        w: { T: 0.8, R: 0.12, F: 0.08 },
        ig: 0.74,
      },
    },
    {
      k: 'I',
      tag: ['sensory'],
      fwd: {
        text: 'You notice early when you are hungry, thirsty, tired, or physically tense before it becomes severe.',
        w: { I: 0.84, S: 0.1, E: 0.06 },
        ig: 0.77,
      },
      r1: {
        text: 'You are often surprised by sudden hunger, fatigue, or tension because earlier signals were easy to miss.',
        w: { I: 0.82, F: 0.1, S: 0.08 },
        ig: 0.73,
      },
      r2: {
        text: 'Physical cues from your body feel vague or “far away” compared to what is happening in your surroundings.',
        w: { I: 0.8, S: 0.12, F: 0.08 },
        ig: 0.71,
      },
    },
    {
      k: 'A',
      tag: ['pattern'],
      fwd: {
        text: 'One idea often sparks many side connections, analogies, or tangents you did not plan in advance.',
        w: { A: 0.84, P: 0.1, F: 0.06 },
        ig: 0.79,
      },
      r1: {
        text: 'Your thinking usually stays close to the task at hand; wide associative hops feel rare or unhelpful.',
        w: { A: 0.82, R: 0.1, F: 0.08 },
        ig: 0.72,
      },
      r2: {
        text: 'You prefer sticking to a linear outline rather than following interesting but off-topic mental branches.',
        w: { A: 0.8, C: 0.12, P: 0.08 },
        ig: 0.7,
      },
    },
    {
      k: 'V',
      tag: ['focus'],
      fwd: {
        text: 'Diagrams, maps, or mental imagery often help you understand faster than long verbal explanations alone.',
        w: { V: 0.84, P: 0.1, F: 0.06 },
        ig: 0.78,
      },
      r1: {
        text: 'You rely mainly on spoken or written language; pictures feel optional rather than central to how you think.',
        w: { V: 0.82, F: 0.12, P: 0.06 },
        ig: 0.74,
      },
      r2: {
        text: 'When learning something new, you prefer a clear verbal sequence over spatial or pictorial layouts.',
        w: { V: 0.8, R: 0.12, F: 0.08 },
        ig: 0.72,
      },
    },
  ];

  for (const d of dims) {
    const triple = [
      { text: d.fwd.text, w: d.fwd.w, ig: d.fwd.ig, rev: false },
      { text: d.r1.text, w: d.r1.w, ig: d.r1.ig, rev: true },
      { text: d.r2.text, w: d.r2.w, ig: d.r2.ig, rev: true },
    ];
    for (let i = 0; i < 3; i++) {
      const b = triple[i];
      rows.push(
        q({
          id: `${d.k}-core-${String(i + 1).padStart(3, '0')}`,
          text: b.text,
          w: b.w,
          type: 'core',
          difficulty: 'broad',
          tags: d.tag,
          ctx: 'universal',
          ig: b.ig,
          rev: b.rev,
        })
      );
    }
  }
  return rows;
}

function universalRefinement() {
  const specs = [
    ['F-ref-001', 'You can return to a complex task after an interruption and pick up roughly where you left off.', { F: 0.72, C: 0.18, S: 0.1 }, ['focus'], 0.68, false],
    ['F-ref-002', 'Switching tasks frequently feels more natural than blocking long uninterrupted stretches.', { F: 0.7, A: 0.18, C: 0.12 }, ['focus'], 0.66, true],
    ['P-ref-001', 'You enjoy puzzles or games that reward noticing subtle patterns others overlook.', { P: 0.74, A: 0.16, F: 0.1 }, ['pattern'], 0.7, false],
    ['P-ref-002', 'You rarely look for a deeper rule once a procedure “works well enough”.', { P: 0.72, R: 0.18, C: 0.1 }, ['pattern'], 0.65, true],
    ['S-ref-001', 'Layered textures, perfumes, or fluorescent flicker can linger in your awareness long after exposure.', { S: 0.74, I: 0.16, F: 0.1 }, ['sensory'], 0.71, false],
    ['S-ref-002', 'You can tune out sensory clutter for hours without feeling drained.', { S: 0.7, F: 0.2, E: 0.1 }, ['sensory'], 0.64, true],
    ['E-ref-001', 'One-to-one conversations feel easier to sustain than free-flowing group banter.', { E: 0.72, F: 0.16, S: 0.12 }, ['social'], 0.67, false],
    ['E-ref-002', 'You seek out large gatherings when you need a mood lift rather than when you need rest.', { E: 0.7, A: 0.18, F: 0.12 }, ['social'], 0.66, true],
    ['R-ref-001', 'Checklists and written timelines reduce your anxiety more than verbal reminders alone.', { R: 0.74, V: 0.14, T: 0.12 }, ['structure'], 0.69, false],
    ['R-ref-002', 'Strict agendas feel suffocating even when they would make coordination easier.', { R: 0.72, C: 0.18, E: 0.1 }, ['structure'], 0.65, true],
    ['C-ref-001', 'You can hold two plausible interpretations of the same situation without forcing an immediate choice.', { C: 0.74, P: 0.16, R: 0.1 }, ['flexibility'], 0.7, false],
    ['C-ref-002', 'Changing a habit feels almost as hard as solving a technical problem from scratch.', { C: 0.7, R: 0.2, F: 0.1 }, ['flexibility'], 0.63, true],
    ['T-ref-001', 'You segment your day mentally into “before / after” anchor events rather than watching the clock constantly.', { T: 0.72, R: 0.16, F: 0.12 }, ['structure'], 0.66, false],
    ['T-ref-002', 'You rarely think about how long something took until someone asks you afterwards.', { T: 0.7, I: 0.18, A: 0.12 }, ['structure'], 0.64, true],
    ['I-ref-001', 'Noticing your breathing or heartbeat helps you gauge stress before it peaks.', { I: 0.74, S: 0.14, F: 0.12 }, ['sensory'], 0.68, false],
    ['I-ref-002', 'You discover you are exhausted mainly from behaviour changes (irritability) rather than early body cues.', { I: 0.72, E: 0.16, F: 0.12 }, ['sensory'], 0.66, true],
    ['A-ref-001', 'Metaphors and analogies come to mind automatically when you explain ideas to others.', { A: 0.74, V: 0.14, P: 0.12 }, ['pattern'], 0.71, false],
    ['A-ref-002', 'You edit your speech to remove “too many” side threads before you say them out loud.', { A: 0.7, R: 0.18, C: 0.12 }, ['pattern'], 0.64, true],
    ['V-ref-001', 'You can rotate or rearrange objects in your mind when judging whether they would fit in a space.', { V: 0.74, P: 0.16, F: 0.1 }, ['focus'], 0.7, false],
    ['V-ref-002', 'Written lists are your first tool; sketching or spatial models feel like an extra step.', { V: 0.72, R: 0.16, F: 0.12 }, ['focus'], 0.65, true],
  ];
  return specs.map(([id, text, w, tags, ig, rev]) =>
    q({ id, text, w, type: 'refinement', difficulty: 'specific', tags, ctx: 'universal', ig, rev })
  );
}

function ghanaCore() {
  const rows = [
    q({
      id: 'GH-F-core-001',
      text: 'When you help prepare food for a large family gathering, how often can you stay with one task (chopping, stirring) without drifting to conversations around you?',
      w: { F: 0.8, S: 0.12, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['focus'],
      ctx: 'ghana',
      ig: 0.76,
      rev: false,
    }),
    q({
      id: 'GH-F-core-002',
      text: 'At an outdoor market with many sellers calling out and music nearby, unrelated sights and sounds often pull your attention away from what you came to buy.',
      w: { F: 0.78, S: 0.14, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['focus'],
      ctx: 'ghana',
      ig: 0.74,
      rev: true,
    }),
    q({
      id: 'GH-P-core-001',
      text: 'When an elder explains a proverb, you easily notice how it connects to other sayings or situations you have heard before.',
      w: { P: 0.82, E: 0.1, R: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['pattern'],
      ctx: 'ghana',
      ig: 0.73,
      rev: false,
    }),
    q({
      id: 'GH-S-core-001',
      text: 'During a long church or community programme with heat, crowded benches, and strong incense or perfume, the sensory load becomes hard to ignore.',
      w: { S: 0.84, E: 0.1, I: 0.06 },
      type: 'core',
      difficulty: 'broad',
      tags: ['sensory'],
      ctx: 'ghana',
      ig: 0.78,
      rev: false,
    }),
    q({
      id: 'GH-E-core-001',
      text: 'After a full day visiting relatives house-to-house, you usually need quiet time alone or with only your household before you feel restored.',
      w: { E: 0.82, R: 0.1, F: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['social'],
      ctx: 'ghana',
      ig: 0.75,
      rev: false,
    }),
    q({
      id: 'GH-E-core-002',
      text: 'Community funerals, weddings, or naming ceremonies that stretch late into the night tend to energise you more than drain you.',
      w: { E: 0.8, R: 0.12, S: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['social'],
      ctx: 'ghana',
      ig: 0.72,
      rev: true,
    }),
    q({
      id: 'GH-R-core-001',
      text: 'When the family plans travel or a funeral contribution, knowing who is responsible for each step early on helps you feel calm.',
      w: { R: 0.82, E: 0.1, T: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['structure'],
      ctx: 'ghana',
      ig: 0.74,
      rev: false,
    }),
    q({
      id: 'GH-C-core-001',
      text: 'If the head of the household changes a decision after consulting others, you can adjust your expectations without prolonged frustration.',
      w: { C: 0.8, R: 0.12, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['flexibility'],
      ctx: 'ghana',
      ig: 0.72,
      rev: false,
    }),
    q({
      id: 'GH-T-core-001',
      text: 'When shared taxis or tro-tros run on flexible schedules, you still arrive roughly when you intended without constant clock-watching.',
      w: { T: 0.8, R: 0.12, F: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['structure'],
      ctx: 'ghana',
      ig: 0.71,
      rev: false,
    }),
    q({
      id: 'GH-I-core-001',
      text: 'During a busy market day you notice thirst, heat, or muscle ache early enough to rest, drink, or find shade before you feel unwell.',
      w: { I: 0.82, S: 0.12, F: 0.06 },
      type: 'core',
      difficulty: 'broad',
      tags: ['sensory'],
      ctx: 'ghana',
      ig: 0.73,
      rev: false,
    }),
    q({
      id: 'GH-A-core-001',
      text: 'During storytelling at home, your mind links the tale to other memories or proverbs in ways that surprise even you.',
      w: { A: 0.8, P: 0.12, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['pattern'],
      ctx: 'ghana',
      ig: 0.74,
      rev: false,
    }),
    q({
      id: 'GH-V-core-001',
      text: 'When someone gives directions using landmarks (“turn at the mango tree”), you form a clear mental map faster than from street names alone.',
      w: { V: 0.82, T: 0.1, P: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['focus'],
      ctx: 'ghana',
      ig: 0.72,
      rev: false,
    }),
    q({
      id: 'GH-S-core-002',
      text: 'Children playing loudly nearby rarely disrupt your reading, studying, or quiet work at home.',
      w: { S: 0.78, F: 0.14, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['sensory'],
      ctx: 'ghana',
      ig: 0.68,
      rev: true,
    }),
    q({
      id: 'GH-R-core-002',
      text: 'You are comfortable when community meetings shift topic or time at short notice and rarely depend on a fixed agenda.',
      w: { R: 0.78, C: 0.14, E: 0.08 },
      type: 'core',
      difficulty: 'broad',
      tags: ['structure'],
      ctx: 'ghana',
      ig: 0.69,
      rev: true,
    }),
    q({
      id: 'GH-school-001',
      text: 'In a classroom where several students answer at once, you can still follow the teacher’s main point without losing the thread.',
      w: { F: 0.72, E: 0.16, S: 0.12 },
      type: 'core',
      difficulty: 'broad',
      tags: ['focus'],
      ctx: 'ghana',
      ig: 0.67,
      rev: false,
    }),
  ];
  return rows;
}

function ghanaRefinement() {
  const specs = [
    ['GH-F-ref-001', 'When many people talk at once during a family meeting, you can track who said what without confusion.', { F: 0.7, E: 0.18, S: 0.12 }, 0.66, false],
    ['GH-P-ref-001', 'You notice when two different versions of a community story no longer line up in their details.', { P: 0.72, E: 0.16, C: 0.12 }, 0.65, false],
    ['GH-E-ref-001', 'Rotating savings groups (susu) or communal labour feel socially light for you rather than heavy obligations.', { E: 0.7, R: 0.18, F: 0.12 }, 0.64, true],
    ['GH-T-ref-001', 'You estimate how long farm or market work will take using sun position or routine cues as reliably as a watch.', { T: 0.72, R: 0.16, I: 0.12 }, 0.66, false],
    ['GH-I-ref-001', 'During fasting periods or long outdoor work, you feel clear body signals before headaches or dizziness set in.', { I: 0.74, R: 0.14, S: 0.12 }, 0.68, false],
    ['GH-A-ref-001', 'When a pastor or teacher gives one verse, several applications come to mind that connect to everyday life.', { A: 0.72, V: 0.14, P: 0.14 }, 0.67, false],
    ['GH-V-ref-001', 'You remember routes to a relative’s compound mainly as a sequence of turns told in words rather than as a picture.', { V: 0.7, T: 0.18, R: 0.12 }, 0.64, true],
    ['GH-C-ref-001', 'If seating or speaking order at a gathering changes at the last minute, you adjust without dwelling on the old plan.', { C: 0.72, R: 0.16, E: 0.12 }, 0.65, false],
    ['GH-S-ref-003', 'Strong cooking smells from neighbouring compounds rarely bother you while you study or rest.', { S: 0.7, I: 0.18, F: 0.12 }, 0.62, true],
    ['GH-E-ref-002', 'You prefer short neighbourly visits spread across the week over one very long open-house where everyone stays late.', { E: 0.72, R: 0.14, T: 0.14 }, 0.66, false],
  ];
  const tagFor = (id) => {
    if (id.includes('-F-')) return ['focus'];
    if (id.includes('-P-')) return ['pattern'];
    if (id.includes('-S-')) return ['sensory'];
    if (id.includes('-E-')) return ['social'];
    if (id.includes('-R-') || id.includes('-T-')) return ['structure'];
    if (id.includes('-I-')) return ['sensory'];
    if (id.includes('-A-')) return ['pattern'];
    if (id.includes('-V-')) return ['focus'];
    if (id.includes('-C-')) return ['flexibility'];
    return ['social'];
  };
  return specs.map(([id, text, w, ig, rev]) =>
    q({
      id,
      text,
      w,
      type: 'refinement',
      difficulty: 'specific',
      tags: tagFor(id),
      ctx: 'ghana',
      ig,
      rev,
    })
  );
}

function write(name, data) {
  const dir = path.join(root, name.split('/')[0]);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(root, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('wrote', file, data.length);
}

write('universal/core', universalCore());
write('universal/refinement', universalRefinement());
write('ghana/core', ghanaCore());
write('ghana/refinement', ghanaRefinement());
