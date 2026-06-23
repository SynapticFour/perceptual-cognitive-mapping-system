/**
 * French stems for the classic universal question bank (`content/questions/universal/*.json`).
 * IDs must match question `id`; missing keys fall back to English from the bank JSON.
 * Draft — pending native review. Vous form; wording tuned for Francophone West Africa where natural.
 */
export const QUESTION_STEMS_FR: Record<string, string> = {
  'F-core-001':
    'Lorsque vous travaillez sur quelque chose qui vous passionne vraiment, vous pouvez rester concentré(e) longtemps sans que votre esprit s\'égare.',
  'F-core-002':
    'Le bruit ambiant, le va-et-vient des gens ou de petites interruptions perturbent généralement totalement votre concentration.',
  'F-core-003':
    'Quelques minutes après le début d\'une tâche qui demande de la concentration, vous vous surprenez souvent à faire autre chose sans l\'avoir prévu.',
  'P-core-001':
    'Vous repérez facilement les règles, régularités ou structures cachées derrière des exemples concrets.',
  'P-core-002':
    'Les diagrammes abstraits ou les explications purement symboliques restent rarement clairs s\'ils ne sont pas liés à un exemple concret.',
  'P-core-003':
    'Vous préférez des instructions avec des étapes précises plutôt que des explications qui insistent sur « l\'idée générale ».',
  'S-core-001':
    'Les lumières vives, les odeurs fortes ou les endroits bondés et bruyants (comme un marché animé) peuvent vite devenir envahissants.',
  'S-core-002':
    'Dans les lieux partagés animés, les stimulations sensorielles du quotidien vous échappent à peine ; elles vous gênent rarement.',
  'S-core-003':
    'Les conversations bruyantes qui se chevauchent sont comme un bruit de fond neutre ; elles vous épuisent rarement.',
  'E-core-001':
    'Après plusieurs heures passées en groupe dans une ambiance animée, vous avez généralement besoin de calme, seul(e), pour vous ressourcer.',
  'E-core-002':
    'Rester longtemps au milieu de beaucoup de monde vous donne plutôt de l\'énergie qu\'il ne vous épuise.',
  'E-core-003':
    'Vous appréciez d\'enchaîner plusieurs rendez-vous sociaux le même jour et vous vous sentez rarement « saturé(e) de contact avec les gens ».',
  'R-core-001':
    'Connaître le plan à l\'avance et avoir des habitudes prévisibles vous aide à vous sentir ancré(e) et efficace.',
  'R-core-002':
    'Vous vous adaptez facilement lorsque les horaires changent au dernier moment, et cela vous stresse rarement.',
  'R-core-003':
    'Vous préférez les journées ouvertes, avec peu d\'obligations fixes, aux journées découpées en créneaux horaires.',
  'C-core-001':
    'Lorsque de nouvelles informations contredisent ce que vous pensiez, vous pouvez ajuster votre point de vue sans grande résistance intérieure.',
  'C-core-002':
    'Une fois que vous avez choisi une réponse, il vous est déplaisant d\'y revenir, même si quelqu\'un apporte un bon contre-argument.',
  'C-core-003':
    'Les situations ambiguës sans interprétation uniquement « juste » vous agacent plutôt qu\'elles ne vous intéressent.',
  'T-core-001':
    'Vous avez généralement une bonne idée de la durée des tâches et perdez rarement la notion du temps quand les délais comptent.',
  'T-core-002':
    'Quand vous êtes absorbé(e), des heures peuvent passer comme des minutes ; vous sous-estimez souvent le temps écoulé.',
  'T-core-003':
    'Vous arrivez souvent en retard ou avez besoin d\'alarmes, car votre sens interne du temps est faible par rapport à l\'heure affichée.',
  'I-core-001':
    'Vous remarquez tôt lorsque vous avez faim, soif, fatigue ou tension physique, avant que cela ne devienne intense.',
  'I-core-002':
    'La faim soudaine, la fatigue ou la tension vous surprennent souvent, car les signaux précoces étaient faciles à manquer.',
  'I-core-003':
    'Les signaux de votre corps paraissent vagues ou « lointains » par rapport à ce qui se passe autour de vous.',
  'A-core-001':
    'Une seule idée déclenche souvent de nombreuses connexions, analogies ou digressions que vous n\'aviez pas prévues.',
  'A-core-002':
    'Votre pensée reste généralement proche de la tâche en cours ; les grands sauts associatifs sont rares ou peu utiles.',
  'A-core-003':
    'Vous préférez suivre une structure linéaire plutôt que de vous laisser emporter par des pensées intéressantes mais hors sujet.',
  'V-core-001':
    'Les schémas, cartes ou images mentales vous aident souvent à comprendre plus vite que de longues explications verbales seules.',
  'V-core-002':
    'Vous comptez surtout sur le langage parlé ou écrit ; les images semblent secondaires plutôt qu\'essentielles à votre façon de penser.',
  'V-core-003':
    'Pour apprendre quelque chose de nouveau, vous préférez une séquence verbale claire à une organisation spatiale ou visuelle.',
  'F-ref-001':
    'Après une interruption, vous pouvez reprendre une tâche complexe à peu près là où vous vous étiez arrêté(e).',
  'F-ref-002':
    'Changer souvent de tâche vous semble plus naturel que de rester longtemps sur une seule sans interruption.',
  'P-ref-001':
    'Vous aimez les énigmes ou jeux qui récompensent la découverte de motifs subtils que d\'autres ne voient pas.',
  'P-ref-002':
    'Vous cherchez rarement une règle plus profonde une fois qu\'une méthode « fonctionne assez bien ».',
  'S-ref-001':
    'Les textures superposées, les parfums ou le scintillement des néons peuvent rester présents dans votre esprit longtemps après l\'exposition.',
  'S-ref-002':
    'Vous pouvez ignorer le chaos sensoriel pendant des heures sans vous sentir épuisé(e).',
  'E-ref-001':
    'Les conversations en tête-à-tête vous sont plus faciles à tenir que les échanges libres en groupe.',
  'E-ref-002':
    'Vous cherchez plutôt les grandes réunions (comme une fête de famille) lorsque vous voulez remonter le moral que lorsque vous avez besoin de repos.',
  'R-ref-001':
    'Les listes de contrôle et les plannings écrits réduisent davantage votre anxiété que les rappels verbaux seuls.',
  'R-ref-002':
    'Les ordres du jour rigides vous étouffent, même s\'ils faciliteraient la coordination.',
  'C-ref-001':
    'Vous pouvez accepter deux interprétations plausibles d\'une même situation sans forcer un choix immédiat.',
  'C-ref-002':
    'Changer une habitude vous semble presque aussi difficile que résoudre un problème technique depuis le début.',
  'T-ref-001':
    'Vous structurez mentalement votre journée en événements repères « avant / après » plutôt que de regarder l\'heure en permanence.',
  'T-ref-002':
    'Vous pensez rarement à la durée d\'une activité jusqu\'à ce que quelqu\'un vous le demande après coup.',
  'I-ref-001':
    'Faire attention à votre respiration ou à votre rythme cardiaque vous aide à évaluer le stress avant qu\'il ne monte.',
  'I-ref-002':
    'Vous réalisez surtout que vous êtes épuisé(e) par des changements de comportement (irritabilité), et non par les premiers signaux du corps.',
  'A-ref-001':
    'Les métaphores et analogies vous viennent naturellement lorsque vous expliquez des idées aux autres.',
  'A-ref-002':
    'Vous reformulez ce que vous allez dire pour éviter de laisser trop de fils secondaires s\'échapper à voix haute.',
  'V-ref-001':
    'Vous pouvez faire tourner ou réorganiser des objets dans votre tête pour juger s\'ils tiendraient dans un espace.',
  'V-ref-002':
    'Les listes écrites sont votre premier outil ; esquisser ou modéliser dans l\'espace vous semble une étape supplémentaire.',
};
