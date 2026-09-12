/**
 * Plume — moteur de règles pour le français
 * -------------------------------------------------
 * Tout tourne dans le navigateur : aucune règle ici n'appelle de serveur.
 * C'est ce qui permet au site de rester gratuit et sans aucune limite d'usage.
 *
 * Structure :
 *  - CONFUSIONS     : pièges classiques (a/à, ce/se, leur/leurs...)
 *  - TYPOGRAPHIE     : règles typographiques françaises
 *  - LEXIQUE_REGISTRE: substitutions pour changer de registre (naturel / soutenu / classique)
 *  - TON_CATEGORIE   : ajustements propres à chaque catégorie (classique, pro, académique, administratif)
 *
 * Pour enrichir le correcteur, il suffit d'ajouter des entrées dans ces tableaux :
 * aucune dépendance externe, aucune clé API, aucune limite de requêtes.
 */

const CONFUSIONS = [
  {
    id: "a-vs-agrave",
    regex: /\b(il|elle|on|ça|cela|y)\s+a\s+(?=[a-zàâäéèêëïîôöùûüç])/gi,
    type: "orthographe",
    message: "« a » (verbe avoir) est correct ici seulement si on peut le remplacer par « avait ».",
    hint: "Vérifiez : peut-on dire « il avait » ? Sinon, il faut « à ».",
  },
  {
    id: "sa-vs-ca",
    regex: /\bsa\s+(va|marche|se passe|craint|arrive)\b/gi,
    type: "orthographe",
    message: "« sa » est un possessif (sa maison). Ici, on veut sans doute « ça ».",
    suggest: (m) => m.replace(/\bsa\b/i, "ça"),
  },
  {
    id: "ce-vs-se",
    regex: /\bce\s+(sont|passe|trouve|dit|fait|demande)\b/gi,
    type: "grammaire",
    message: "Distinguez « ce » (démonstratif : ce livre) et « se » (pronom réfléchi : il se passe).",
  },
  {
    id: "ces-vs-ses-vs-c-est",
    regex: /\bses\s+(que|qui)\b/gi,
    type: "orthographe",
    message: "« ses » est un possessif pluriel (ses amis). Ici il faut « c'est ».",
    suggest: (m) => m.replace(/\bses\b/i, "c'est"),
  },
  {
    id: "leur-invariable",
    regex: /\bleurs\s+(a|ai|as|ont|dit|semble|paraît)\b/gi,
    type: "grammaire",
    message: "« leur » pronom (leur dire) est invariable ; « leurs » ne prend un « s » que devant un nom pluriel.",
    suggest: (m) => m.replace(/\bleurs\b/i, "leur"),
  },
  {
    id: "quelque-vs-quel-que",
    regex: /\bquel\s+que\s+soit\s+les\b/gi,
    type: "grammaire",
    message: "Devant un nom pluriel avec « soient », on écrit « quels que soient » (accord avec le sujet).",
  },
  {
    id: "malgre-que",
    regex: /\bmalgré\s+que\b/gi,
    type: "style",
    message: "« Malgré que » est très critiqué en registre soutenu. Préférez « bien que » ou « quoique » (+ subjonctif).",
    suggest: (m) => "bien que",
  },
  {
    id: "au-jour-d-aujourd-hui",
    regex: /\bau\s+jour\s+d['’]?aujourd['’]?hui\b/gi,
    type: "style",
    message: "Pléonasme : « aujourd'hui » suffit.",
    suggest: () => "aujourd'hui",
  },
  {
    id: "apres-que-subjonctif",
    regex: /\baprès\s+que\s+\w+\s+(ait|aient|soit|soient)\b/gi,
    type: "grammaire",
    message: "« Après que » est suivi de l'indicatif (et non du subjonctif), contrairement à « avant que ».",
  },
  {
    id: "double-negation-orale",
    regex: /\b(j'|je|tu|il|elle|on|nous|vous|ils|elles)\s+\w+\s+pas\b(?!.*\bne\b)/gi,
    type: "style",
    message: "À l'écrit soigné, on conserve le « ne » de la négation (je ne sais pas, et non je sais pas).",
  },
  {
    id: "voire-vs-voir",
    regex: /\bvoir\s+même\b/gi,
    type: "orthographe",
    message: "On écrit « voire même » avec un e : « voire » signifie déjà « et même ».",
    suggest: () => "voire même",
  },
  {
    id: "hormis-le-fait",
    regex: /\bpallier\s+à\b/gi,
    type: "grammaire",
    message: "« Pallier » est transitif direct : on pallie un problème, sans « à ».",
    suggest: (m) => m.replace(/\bpallier\s+à\b/i, "pallier"),
  },
  {
    id: "espece-de",
    regex: /\bune\s+espèce\s+de\b/gi,
    type: "style",
    message: "« Espèce » est féminin mais l'expression est jugée familière en registre soutenu. Préférez « une sorte de » ou une formulation directe.",
  },
];

const TYPOGRAPHIE = [
  {
    id: "espace-avant-double-ponctuation",
    regex: /(\S)([;:!?])/g,
    type: "typographie",
    message: "En typographie française, on met une espace insécable avant « ; : ! ? ».",
    suggest: (m, p1, p2) => `${p1}\u00A0${p2}`,
  },
  {
    id: "guillemets-anglais",
    regex: /"([^"]+)"/g,
    type: "typographie",
    message: "En français, on utilise les guillemets « français » avec espace insécable, plutôt que \" \".",
    suggest: (m, inner) => `«\u00A0${inner}\u00A0»`,
  },
  {
    id: "points-suspension-multiples",
    regex: /\.{4,}/g,
    type: "typographie",
    message: "Les points de suspension s'écrivent avec trois points exactement : « … ».",
    suggest: () => "…",
  },
  {
    id: "majuscule-debut-phrase",
    regex: /([.!?]\s+)([a-zàâäéèêëïîôöùûüç])/g,
    type: "typographie",
    message: "Une phrase commence par une majuscule.",
    suggest: (m, p1, p2) => `${p1}${p2.toUpperCase()}`,
  },
];

/**
 * Lexique de substitutions par registre.
 * Chaque entrée : forme familière/neutre -> alternative dans un registre donné.
 * "soutenu" et "classique" tirent vers un français plus littéraire ;
 * "naturel" ramène au contraire vers une formulation courante et fluide.
 */
const LEXIQUE_REGISTRE = {
  soutenu: [
    [/\btruc(s)?\b/gi, "élément$1"],
    [/\bchose(s)?\b/gi, "élément$1"],
    [/\bdu coup\b/gi, "par conséquent"],
    [/\bbosser\b/gi, "travailler"],
    [/\bouais\b/gi, "oui"],
    [/\bun peu\b/gi, "quelque peu"],
    [/\bbeaucoup de\b/gi, "un grand nombre de"],
    [/\bmontrer\b/gi, "démontrer"],
    [/\bj'ai vu que\b/gi, "j'ai constaté que"],
    [/\bje pense que\b/gi, "il me semble que"],
    [/\bmaintenant\b/gi, "à présent"],
    [/\bdonc\b/gi, "par conséquent"],
    [/\bparce que\b/gi, "car"],
  ],
  classique: [
    [/\btruc(s)?\b/gi, "objet$1"],
    [/\bdu coup\b/gi, "ainsi"],
    [/\bmaintenant\b/gi, "désormais"],
    [/\bje pense que\b/gi, "je considère que"],
    [/\bmontrer\b/gi, "établir"],
    [/\bbeaucoup\b/gi, "grandement"],
  ],
  naturel: [
    [/\bil est nécessaire de\b/gi, "il faut"],
    [/\bà présent\b/gi, "maintenant"],
    [/\bpar conséquent\b/gi, "du coup"],
    [/\bje considère que\b/gi, "je pense que"],
    [/\bnonobstant\b/gi, "malgré"],
  ],
};

/**
 * Ajustements propres à chaque catégorie : ils s'ajoutent au registre choisi.
 */
const TON_CATEGORIE = {
  classique: {
    description: "Un français correct et équilibré, sans jargon ni familiarité.",
    extra: [],
  },
  pro: {
    description: "Direct, clair, orienté action — le ton d'un email ou d'un rapport professionnel.",
    extra: [
      [/\bje voudrais\b/gi, "je souhaite"],
