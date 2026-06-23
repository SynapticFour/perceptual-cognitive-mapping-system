/**
 * Draft batch: `francophone_west_africa` stems for cultural-adaptive-v1 items
 * in attention_focus, temporal_pacing, conversation_rhythm, structure_preference,
 * adaptability_change, effort_recovery, learning_expression (175 items).
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/patch-francophone-remaining-stems.ts
 */
import fs from 'fs';
import path from 'path';

const FRANCOPHONE_REMAINING_STEMS: Record<string, string> = {
  // —— attention_focus ——
  'ca-v1-attention_focus-001':
    'Quand je compte finir une seule tâche, les bruits autour — marché, radio, appels — arrachent encore mon attention.',
  'ca-v1-attention_focus-002':
    'De petites courses annexes morcellent mon temps avant que la tâche principale soit terminée.',
  'ca-v1-attention_focus-003':
    'Une longue consigne reste claire dans ma tête pendant que je la reçois.',
  'ca-v1-attention_focus-004':
    'Les fautes de frappe ou les lignes manquantes me sautent aux yeux quand je relis.',
  'ca-v1-attention_focus-005':
    'Les notifications m\'interrompent alors que je voulais rester concentré ailleurs.',
  'ca-v1-attention_focus-006':
    'Une pause n\'efface pas ma place dans le travail que je faisais.',
  'ca-v1-attention_focus-007':
    'Deux petites tâches en parallèle ne me déroutent pas.',
  'ca-v1-attention_focus-008':
    'Un bout de papier ou une note sur le téléphone me rappelle la prochaine étape.',
  'ca-v1-attention_focus-009':
    'Je peux écouter une seule personne malgré les conversations autour.',
  'ca-v1-attention_focus-010':
    'Un travail manuel qui me plaît peut faire oublier le temps qui passe.',
  'ca-v1-attention_focus-011':
    'Chaque changement d\'outil demande un moment avant que le geste suivant soit clair.',
  'ca-v1-attention_focus-012':
    'En parcourant vite un texte, une ligne visible peut m\'échapper.',
  'ca-v1-attention_focus-013':
    'Le bruit de fond casse rarement la tâche sur laquelle je me suis concentré.',
  'ca-v1-attention_focus-014':
    'Les courses annexes attendent que la tâche principale soit finie.',
  'ca-v1-attention_focus-015':
    'Une longue consigne a tendance à s\'estomper avant la fin.',
  'ca-v1-attention_focus-016':
    'Un premier passage sur un formulaire laisse souvent des erreurs non vues.',
  'ca-v1-attention_focus-017':
    'Je parviens à empêcher les alertes de rompre un bloc de concentration que j\'ai fixé.',
  'ca-v1-attention_focus-018':
    'Après une pause, reprendre ressemble souvent à recommencer presque depuis le début.',
  'ca-v1-attention_focus-019':
    'Deux petites tâches en parallèle me semblent enchevêtrées plutôt que fluides.',
  'ca-v1-attention_focus-020':
    'J\'ai rarement besoin d\'une note pour savoir quelle est la prochaine étape.',
  'ca-v1-attention_focus-021':
    'Les conversations de fond continuent de rivaliser quand je vise une seule voix.',
  'ca-v1-attention_focus-022':
    'Ma conscience du temps reste vive même dans un travail manuel absorbant.',
  'ca-v1-attention_focus-023':
    'Passer d\'un outil à l\'autre est presque instantané pour moi.',
  'ca-v1-attention_focus-024':
    'Une relecture ligne par ligne saute rarement du texte visible.',
  'ca-v1-attention_focus-025':
    'Une longue attente — file au bureau, car rapide — laisse mon sujet stable en tête.',

  // —— temporal_pacing ——
  'ca-v1-temporal_pacing-001':
    'Un changement soudain de programme me pousse à ajuster mes prochains gestes sans longtemps perdre pied.',
  'ca-v1-temporal_pacing-002':
    'Attendre les mains vides dans une longue file au marché ou au guichet m\'épuise.',
  'ca-v1-temporal_pacing-003':
    'Aux heures convenues, j\'arrive dans le créneau attendu.',
  'ca-v1-temporal_pacing-004':
    'Quand la durée est sous-estimée, j\'élargis le créneau plutôt que de paniquer.',
  'ca-v1-temporal_pacing-005':
    'Découper en morceaux avec des pauses, c\'est ma façon d\'aborder les longues tâches.',
  'ca-v1-temporal_pacing-006':
    'Une date butoir fixe pousse à terminer plutôt qu\'à bloquer le départ.',
  'ca-v1-temporal_pacing-007':
    'Les dates à venir disparaissent de ma tête sans rappel écrit ou sur le téléphone.',
  'ca-v1-temporal_pacing-008':
    'Reprendre le travail après une pause n\'est pas instantané pour moi.',
  'ca-v1-temporal_pacing-009':
    'Un partage clair des rôles accélère le travail de groupe au-delà de ma première estimation.',
  'ca-v1-temporal_pacing-010':
    'Un trajet en car rapide ou en taxi dans le trafic dépasse souvent ma première estimation.',
  'ca-v1-temporal_pacing-011':
    'Une routine du matin fixe calme mon entrée dans la journée.',
  'ca-v1-temporal_pacing-012':
    'Les trous imprévus deviennent des moments pour de petites victoires.',
  'ca-v1-temporal_pacing-013':
    'Les changements soudains d\'emploi du temps me déstabilisent d\'abord, puis je m\'adapte.',
  'ca-v1-temporal_pacing-014':
    'Une longue attente inactive est facile à supporter pour mon humeur.',
  'ca-v1-temporal_pacing-015':
    'Les gens attendent parfois pour moi même quand je compte être ponctuel.',
  'ca-v1-temporal_pacing-016':
    'Les tâches qui dépassent le temps prévu déclenchent un sentiment de précipitation.',
  'ca-v1-temporal_pacing-017':
    'J\'évite les minuteurs par morceaux sur le travail de longue durée.',
  'ca-v1-temporal_pacing-018':
    'Les échéances bloquent mon premier geste.',
  'ca-v1-temporal_pacing-019':
    'Je rate rarement une heure entendue une seule fois à l\'oral.',
  'ca-v1-temporal_pacing-020':
    'La fin du repos et le pic de vitesse au travail arrivent d\'un coup pour moi.',
  'ca-v1-temporal_pacing-021':
    'Les travaux partagés s\'allongent en temps par rapport à mon plan.',
  'ca-v1-temporal_pacing-022':
    'Même avec les routes dégagées, je garde une longue marge de temps.',
  'ca-v1-temporal_pacing-023':
    'La routine du matin peut varier sans me coûter grand-chose.',
  'ca-v1-temporal_pacing-024':
    'Attendre des retardataires me vide sans usage productif.',
  'ca-v1-temporal_pacing-025':
    'La durée en équipe et en solo me semble similaire quand je planifie.',

  // —— conversation_rhythm ——
  'ca-v1-conversation_rhythm-001':
    'Quand plusieurs personnes parlent en même temps, j\'attends un silence net avant de prendre la parole.',
  'ca-v1-conversation_rhythm-002':
    'J\'insère mon propos quand je suis prêt plutôt que d\'attendre le silence complet.',
  'ca-v1-conversation_rhythm-003':
    'Quand quelqu\'un attend visiblement, je me tais pour le laisser parler.',
  'ca-v1-conversation_rhythm-004':
    'Je termine ma phrase avant d\'ouvrir l\'espace aux autres.',
  'ca-v1-conversation_rhythm-005':
    'J\'articule plus lentement quand la compréhension semble faible.',
  'ca-v1-conversation_rhythm-006':
    'Mon débit reste stable malgré des regards perplexes.',
  'ca-v1-conversation_rhythm-007':
    'Après des consignes, je pose une petite question de confirmation.',
  'ca-v1-conversation_rhythm-008':
    'Je demande rarement une vérification rapide après avoir expliqué les étapes.',
  'ca-v1-conversation_rhythm-009':
    'Si je n\'ai pas bien entendu, je reformule brièvement.',
  'ca-v1-conversation_rhythm-010':
    'Ma deuxième tentative reprend la même formulation longue que la première.',
  'ca-v1-conversation_rhythm-011':
    'Les signaux silencieux de tour de parole me sont clairs.',
  'ca-v1-conversation_rhythm-012':
    'Les gestes ou hochements indiquant une pause m\'échappent facilement.',
  'ca-v1-conversation_rhythm-013':
    'Une voix principale douce avec du bruit latéral fonctionne encore pour mon écoute.',
  'ca-v1-conversation_rhythm-014':
    'Une voix principale basse plus le bavardage autour me perdent.',
  'ca-v1-conversation_rhythm-015':
    'Je marque une courte pause pour qu\'une autre voix entre dans l\'échange.',
  'ca-v1-conversation_rhythm-016':
    'Je commence à parler dans de petites ouvertures même si la phrase n\'est peut-être pas finie.',
  'ca-v1-conversation_rhythm-017':
    'Après un bruit fort — moto, haut-parleur — je répète un mot clé plus lentement.',
  'ca-v1-conversation_rhythm-018':
    'Je ne répète pas un mot clé après que la pièce a été bruyante.',
  'ca-v1-conversation_rhythm-019':
    'Pendant le chevauchement, je parle plus doucement pour qu\'un fil puisse passer.',
  'ca-v1-conversation_rhythm-020':
    'Pendant le chevauchement, je hausse la voix pour percer.',
  'ca-v1-conversation_rhythm-021':
    'J\'utilise un geste de la main quand les mots simples risquent de ne pas suffire.',
  'ca-v1-conversation_rhythm-022':
    'J\'évite de montrer du doigt même quand cela clarifierait les choses.',
  'ca-v1-conversation_rhythm-023':
    'Les interventions désordonnées me font perdre le fil du récit.',
  'ca-v1-conversation_rhythm-024':
    'L\'ordre chaotique des tours de parole ne me perd pas.',
  'ca-v1-conversation_rhythm-025':
    'Quand quelqu\'un s\'avance pour parler, je cède un peu.',

  // —— structure_preference ——
  'ca-v1-structure_preference-001':
    'Une nouvelle tâche complexe commence par des notes ordonnées.',
  'ca-v1-structure_preference-002':
    'Des emplois du temps ouverts me plaisent plus que des plannings à la minute.',
  'ca-v1-structure_preference-003':
    'Des règles simples visibles m\'apaisent dans les espaces partagés.',
  'ca-v1-structure_preference-004':
    'Les manques de fournitures déclenchent des remplacements sur le moment.',
  'ca-v1-structure_preference-005':
    'Pour les sorties du matin, je prépare les sacs la veille au soir.',
  'ca-v1-structure_preference-006':
    'Les visites surprises me dérangent les jours chargés de listes.',
  'ca-v1-structure_preference-007':
    'Des places stables pour les objets accélèrent la recherche.',
  'ca-v1-structure_preference-008':
    'Je soulève des inquiétudes quand des règles affichées me semblent mauvaises.',
  'ca-v1-structure_preference-009':
    'Sauter des étapes me déstabilise quand l\'ordre influence le résultat.',
  'ca-v1-structure_preference-010':
    'Un nouvel artisanat commence par un modèle à copier.',
  'ca-v1-structure_preference-011':
    'Je répartis le temps total entre les parties avant de travailler.',
  'ca-v1-structure_preference-012':
    'Tout pré-planifier est moins plaisant pour moi que découvrir en avançant.',
  'ca-v1-structure_preference-013':
    'Je lance des tâches complexes sans préparation numérotée.',
  'ca-v1-structure_preference-014':
    'Je préfère une forte structure aux tâches flottantes.',
  'ca-v1-structure_preference-015':
    'Des règles partagées écrites ajoutent peu de confort pour moi.',
  'ca-v1-structure_preference-016':
    'Commencer sans le bon outil me est difficile.',
  'ca-v1-structure_preference-017':
    'Préparer le sac le matin même est ma norme.',
  'ca-v1-structure_preference-018':
    'Les visiteurs de passage s\'accordent bien avec les corvées planifiées.',
  'ca-v1-structure_preference-019':
    'Laisser les choses où elles tombent est mon habitude.',
  'ca-v1-structure_preference-020':
    'Je réorganise mon espace de travail de la même façon entre les sessions.',
  'ca-v1-structure_preference-021':
    'La séquence des étapes est lâche dans ma tête.',
  'ca-v1-structure_preference-022':
    'Une nouvelle fabrication commence par le jeu libre.',
  'ca-v1-structure_preference-023':
    'Je ne devine pas le temps par sous-tâche à l\'avance.',
  'ca-v1-structure_preference-024':
    'Tout planifier d\'un bloc précède l\'action.',
  'ca-v1-structure_preference-025':
    'Terminer prime sur un rangement strict.',

  // —— adaptability_change ——
  'ca-v1-adaptability_change-001':
    'Un changement de cap forcé en pleine tâche m\'accorde peu de temps de rouspétance.',
  'ca-v1-adaptability_change-002':
    'Des chemins inconnus vers des lieux connus me plaisent.',
  'ca-v1-adaptability_change-003':
    'Casser la routine le premier jour me déstabilise.',
  'ca-v1-adaptability_change-004':
    'Un outil en panne déclenche la recherche d\'un substitut.',
  'ca-v1-adaptability_change-005':
    'Des changements d\'équipe réguliers demandent des mises en route chaleureuses.',
  'ca-v1-adaptability_change-006':
    'Un changement de ciel — pluie soudaine, harmattan — pousse vite un plan de repli.',
  'ca-v1-adaptability_change-007':
    'L\'habitude confortable l\'emporte parfois sur une nouvelle façon améliorée.',
  'ca-v1-adaptability_change-008':
    'Les nouvelles règles ont besoin d\'une justification pour tenir.',
  'ca-v1-adaptability_change-009':
    'Un changement d\'interface demande du temps d\'exploration.',
  'ca-v1-adaptability_change-010':
    'Une annulation me redirige vite vers la prochaine chose utile.',
  'ca-v1-adaptability_change-011':
    'Des ingrédients inconnus m\'ouvrent à de nouveaux plats.',
  'ca-v1-adaptability_change-012':
    'Après un congé, l\'ancien rythme quotidien revient facilement.',
  'ca-v1-adaptability_change-013':
    'Un changement de chemin en pleine tâche m\'irrite avant de passer à la suite.',
  'ca-v1-adaptability_change-014':
    'Les chemins alternatifs me semblent superflus.',
  'ca-v1-adaptability_change-015':
    'Un trou dans la routine du premier jour ne me secoue pas.',
  'ca-v1-adaptability_change-016':
    'Sans l\'outil exact, j\'ai du mal à avancer quand quelque chose casse.',
  'ca-v1-adaptability_change-017':
    'Je suis à l\'aise tout de suite avec de nouveaux membres d\'équipe.',
  'ca-v1-adaptability_change-018':
    'Les retournements de météo créent des blancs dans mon plan.',
  'ca-v1-adaptability_change-019':
    'Une preuve d\'amélioration me pousse à changer d\'habitude vite.',
  'ca-v1-adaptability_change-020':
    'Une nouvelle règle annoncée en peu de mots me suffit.',
  'ca-v1-adaptability_change-021':
    'Un redesign me rend plus rapide dès le premier jour.',
  'ca-v1-adaptability_change-022':
    'Une annulation vide ma prochaine action.',
  'ca-v1-adaptability_change-023':
    'Des plats inconnus nommés sont encore refusés par moi.',
  'ca-v1-adaptability_change-024':
    'Le retour au rythme après une absence est lent pour moi.',
  'ca-v1-adaptability_change-025':
    'Des combinaisons bizarres finissent le travail sans le bon matériel.',

  // —— effort_recovery ——
  'ca-v1-effort_recovery-001':
    'Après une tâche dure, une autre manche est possible après une promenade.',
  'ca-v1-effort_recovery-002':
    'Après un travail pénible sous le soleil, je m\'hydrate et me repose brièvement.',
  'ca-v1-effort_recovery-003':
    'Les corvées importantes mais ennuyeuses ne restent pas inachevées jusqu\'à minuit.',
  'ca-v1-effort_recovery-004':
    'Une douleur corporelle me pousse à réduire la taille de la tâche suivante.',
  'ca-v1-effort_recovery-005':
    'La fatigue de réflexion me pousse vers des tâches manuelles simples.',
  'ca-v1-effort_recovery-006':
    'Un grand nettoyage se découpe en plan sur la journée.',
  'ca-v1-effort_recovery-007':
    'Une journée très exigeante allonge mon sommeil du lendemain.',
  'ca-v1-effort_recovery-008':
    'Une longue conversation s\'accompagne de pauses pour noter.',
  'ca-v1-effort_recovery-009':
    'Des morceaux minutés portent le travail ennuyeux.',
  'ca-v1-effort_recovery-010':
    'Une pause repas précède les tremblements ou vertiges.',
  'ca-v1-effort_recovery-011':
    'Les petites victoires méritent d\'être partagées à voix haute.',
  'ca-v1-effort_recovery-012':
    'Après une dispute, j\'ai besoin d\'un temps seul pour me remettre.',
  'ca-v1-effort_recovery-013':
    'Un échec envoie la tâche au placard longtemps.',
  'ca-v1-effort_recovery-014':
    'Je ne m\'assois ni ne bois entre les manches d\'effort intense.',
  'ca-v1-effort_recovery-015':
    'Les corvées importantes traînent inachevées.',
  'ca-v1-effort_recovery-016':
    'La douleur ne réduit pas la tâche suivante pour moi.',
  'ca-v1-effort_recovery-017':
    'La fatigue mentale met fin au bloc de travail complètement.',
  'ca-v1-effort_recovery-018':
    'J\'attaque les grands nettoyages d\'un seul coup.',
  'ca-v1-effort_recovery-019':
    'La durée de mon sommeil reste stable après un effort intense.',
  'ca-v1-effort_recovery-020':
    'Je retiens seul les longues conversations sans notes.',
  'ca-v1-effort_recovery-021':
    'Je reste sur des corvées ennuyeuses sans limite de temps.',
  'ca-v1-effort_recovery-022':
    'Je repousse le repas jusqu\'à une plainte corporelle forte.',
  'ca-v1-effort_recovery-023':
    'Je ne célèbre pas les petites étapes entre les morceaux.',
  'ca-v1-effort_recovery-024':
    'Je n\'ai pas besoin d\'un temps seul après un échange tendu.',
  'ca-v1-effort_recovery-025':
    'Une courte pause des yeux relève rarement mon énergie.',

  // —— learning_expression ——
  'ca-v1-learning_expression-001':
    'Une démonstration avant de longs discours seuls convient mieux à mes mains.',
  'ca-v1-learning_expression-002':
    'Entendre l\'ordre des étapes suffit sans images.',
  'ca-v1-learning_expression-003':
    'Un nouveau motage demande des répétitions à voix haute.',
  'ca-v1-learning_expression-004':
    'Les questions de lieu reçoivent des croquis en réponse.',
  'ca-v1-learning_expression-005':
    'Voir le résultat d\'une erreur m\'enseigne.',
  'ca-v1-learning_expression-006':
    'Je demande une démo plus lente quand on va trop vite.',
  'ca-v1-learning_expression-007':
    'Un détail saillant fixe les noms dans ma mémoire.',
  'ca-v1-learning_expression-008':
    'Mes récits incluent montrer un objet du doigt.',
  'ca-v1-learning_expression-009':
    'Un mur de texte me perd ; les listes gagnent.',
  'ca-v1-learning_expression-010':
    'Un nouveau geste moteur commence lentement pour moi.',
  'ca-v1-learning_expression-011':
    'Un tour d\'essai enseigne les règles de groupe plus vite.',
  'ca-v1-learning_expression-012':
    'Des tableaux en couleur accélèrent la comparaison.',
  'ca-v1-learning_expression-013':
    'J\'ai besoin de plusieurs reprises avant de copier le geste.',
  'ca-v1-learning_expression-014':
    'Les mots seuls ne suffisent pas pour les nouvelles routines.',
  'ca-v1-learning_expression-015':
    'Je n\'ai pas besoin de répéter fort les phrases nouvelles.',
  'ca-v1-learning_expression-016':
    'Je ne fais pas de croquis pour les directions.',
  'ca-v1-learning_expression-017':
    'Les essais ratés demandent une reprise guidée pour moi.',
  'ca-v1-learning_expression-018':
    'Une démo rapide enchaînée me convient.',
  'ca-v1-learning_expression-019':
    'Je n\'utilise pas les visages comme ancres mnémotechniques.',
  'ca-v1-learning_expression-020':
    'Les objets apparaissent rarement dans mes récits.',
  'ca-v1-learning_expression-021':
    'Un texte dense me guide bien.',
  'ca-v1-learning_expression-022':
    'Je n\'ai pas besoin de commencer un geste au ralenti.',
  'ca-v1-learning_expression-023':
    'Les règles verbales avant le jeu me suffisent.',
  'ca-v1-learning_expression-024':
    'Les nombres simples comparent bien pour moi.',
  'ca-v1-learning_expression-025':
    'Une liste écrite me convient mieux que regarder une démonstration.',
};

const EXPECTED = 175;
const bankPath = path.join(process.cwd(), 'content', 'questions', 'cultural-adaptive-v1', 'bank.json');

function main(): void {
  const keys = Object.keys(FRANCOPHONE_REMAINING_STEMS);
  if (keys.length !== EXPECTED) {
    throw new Error(`Stem map has ${keys.length} entries, expected ${EXPECTED}`);
  }

  const rows = JSON.parse(fs.readFileSync(bankPath, 'utf8')) as Array<{
    id: string;
    dimension: string;
    variants: Record<string, string>;
  }>;

  let patched = 0;
  for (const row of rows) {
    const fr = FRANCOPHONE_REMAINING_STEMS[row.id];
    if (!fr) continue;
    if (row.variants.francophone_west_africa) {
      throw new Error(`${row.id} already has francophone_west_africa stem`);
    }
    row.variants.francophone_west_africa = fr;
    patched += 1;
  }

  if (patched !== EXPECTED) {
    throw new Error(`Expected ${EXPECTED} patches, got ${patched}`);
  }

  fs.writeFileSync(bankPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Patched ${patched} francophone_west_africa stems in ${bankPath}`);
}

main();
