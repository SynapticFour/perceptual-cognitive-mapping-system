/**
 * One-shot patch: add `francophone_west_africa` stems to sensory_regulation items 001–025.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/patch-francophone-sensory-stems.ts
 */
import fs from 'fs';
import path from 'path';

const FRANCOPHONE_SENSORY_STEMS: Record<string, string> = {
  'ca-v1-sensory_regulation-001':
    'Là où je me trouve, je remarque souvent les odeurs du quotidien avant que les autres n\'en parlent.',
  'ca-v1-sensory_regulation-002':
    'Dans un marché animé, un car rapide plein ou une grande tabaski, je fatigue plus vite que dans un endroit calme.',
  'ca-v1-sensory_regulation-003':
    'Une lumière vive au plafond finit par me gêner si je reste longtemps dessous.',
  'ca-v1-sensory_regulation-004':
    'Quand le bruit augmente, je cherche un coin plus calme si je le peux.',
  'ca-v1-sensory_regulation-005':
    'Les coutures rugueuses ou les étiquettes sur les vêtements me distraient de ce que je fais.',
  'ca-v1-sensory_regulation-006':
    'Je sens les changements de chaleur — saison sèche, pluie, courant d\'air — avant que les autres n\'en parlent.',
  'ca-v1-sensory_regulation-007':
    'Le ronflement d\'un groupe électrogène ou les vibrations d\'une moto attirent vite mon attention.',
  'ca-v1-sensory_regulation-008':
    'Après qu\'on m\'a parlé très fort tout près, j\'ai besoin d\'un moment avant de me sentir à nouveau stable.',
  'ca-v1-sensory_regulation-009':
    'Les autres peuvent lire sur mon visage ou mon corps qu\'un endroit est trop bruyant pour moi.',
  'ca-v1-sensory_regulation-010':
    'Après une période de forte stimulation, j\'ai besoin d\'une pause calme pour retrouver ma concentration.',
  'ca-v1-sensory_regulation-011':
    'Si la musique ou un haut-parleur est trop fort, je baisse le volume ou m\'éloigne quand c\'est possible.',
  'ca-v1-sensory_regulation-012':
    'Les textures très gluantes ou très rugueuses sont difficiles à ignorer pendant que je mange.',
  'ca-v1-sensory_regulation-013':
    'Quand j\'ai le choix, je m\'assois loin des lumières qui clignotent ou vacillent.',
  'ca-v1-sensory_regulation-014':
    'Les endroits très animés et les endroits calmes demandent à peu près la même énergie de ma part.',
  'ca-v1-sensory_regulation-015':
    'Une forte lumière au plafond me gêne rarement, même après de longues heures.',
  'ca-v1-sensory_regulation-016':
    'Un bruit qui monte me pousse rarement à changer de place.',
  'ca-v1-sensory_regulation-017':
    'Les coutures rugueuses sur les vêtements me distraient rarement de ma tâche.',
  'ca-v1-sensory_regulation-018':
    'Je remarque rarement les petits changements de chaleur ou de fraîcheur sans qu\'on me le signale.',
  'ca-v1-sensory_regulation-019':
    'Le ronflement d\'un moteur se fond dans le fond pour moi.',
  'ca-v1-sensory_regulation-020':
    'Une voix forte tout près me déséquilibre rarement plus qu\'un instant.',
  'ca-v1-sensory_regulation-021':
    'Les autres lisent rarement mon malaise sur mon visage à cause du bruit.',
  'ca-v1-sensory_regulation-022':
    'Je retrouve vite une concentration claire juste après une période très stimulante.',
  'ca-v1-sensory_regulation-023':
    'Une musique ou une annonce très forte me pousse rarement à baisser le volume ou à partir.',
  'ca-v1-sensory_regulation-024':
    'Les textures très gluantes ou rugueuses me gênent rarement en mangeant.',
  'ca-v1-sensory_regulation-025':
    'Les lumières qui clignotent influencent rarement où je choisis de m\'asseoir.',
};

const bankPath = path.join(process.cwd(), 'content', 'questions', 'cultural-adaptive-v1', 'bank.json');

function main(): void {
  const rows = JSON.parse(fs.readFileSync(bankPath, 'utf8')) as Array<{
    id: string;
    variants: Record<string, string>;
  }>;
  let patched = 0;
  for (const row of rows) {
    const fr = FRANCOPHONE_SENSORY_STEMS[row.id];
    if (!fr) continue;
    row.variants.francophone_west_africa = fr;
    patched += 1;
  }
  if (patched !== 25) {
    throw new Error(`Expected 25 patches, got ${patched}`);
  }
  fs.writeFileSync(bankPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Patched ${patched} francophone_west_africa stems in ${bankPath}`);
}

main();
