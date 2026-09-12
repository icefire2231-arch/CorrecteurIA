/**
 * Plume — moteur d'application des règles
 * ----------------------------------------
 * Entièrement synchrone et local : pas de fetch, pas de clé API, pas de quota.
 * Le moteur repère les correspondances des règles de rules-fr.js dans le texte
 * et renvoie une liste d'annotations (type, position, message, suggestion).
 */

function analyserTexte(texte, categorie, registre) {
  const { CONFUSIONS, TYPOGRAPHIE, LEXIQUE_REGISTRE, TON_CATEGORIE } = window.PLUME_RULES_FR;
  const annotations = [];

  // 1. Pièges classiques + typographie
  [...CONFUSIONS, ...TYPOGRAPHIE].forEach((regle) => {
    const re = new RegExp(regle.regex.source, regle.regex.flags.includes("g") ? regle.regex.flags : regle.regex.flags + "g");
    let match;
    while ((match = re.exec(texte)) !== null) {
      annotations.push({
        id: regle.id,
        type: regle.type,
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        message: regle.message,
        hint: regle.hint || null,
        suggestion: regle.suggest ? regle.suggest(...match) : null,
      });
      if (match[0].length === 0) re.lastIndex++; // évite les boucles infinies
    }
  });

  // 2. Suggestions de registre (catégorie + style choisis)
  const lexique = LEXIQUE_REGISTRE[registre] || [];
  const tonCategorie = TON_CATEGORIE[categorie] || { extra: [] };
  const substitutions = [...lexique, ...tonCategorie.extra];

  substitutions.forEach(([regex, remplacement], idx) => {
    const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    let match;
    while ((match = re.exec(texte)) !== null) {
      const suggestion = match[0].replace(re, remplacement);
      if (suggestion.toLowerCase() !== match[0].toLowerCase()) {
        annotations.push({
          id: `registre-${idx}`,
          type: "style",
          start: match.index,
          end: match.index + match[0].length,
          original: match[0],
          message: `Registre « ${registre} » / catégorie « ${categorie} » : formulation plus adaptée disponible.`,
          hint: null,
          suggestion,
        });
      }
      if (match[0].length === 0) re.lastIndex++;
    }
  });

  // Trie par position et supprime les recouvrements pour un affichage lisible
  annotations.sort((a, b) => a.start - b.start);
  const filtrees = [];
  let dernierFin = -1;
  for (const a of annotations) {
    if (a.start >= dernierFin) {
      filtrees.push(a);
      dernierFin = a.end;
    }
  }
  return filtrees;
}

function appliquerSuggestion(texte, annotation) {
  if (!annotation.suggestion) return texte;
  return texte.slice(0, annotation.start) + annotation.suggestion + texte.slice(annotation.end);
}

function appliquerToutesLesSuggestions(texte, annotations) {
  // Applique de la fin vers le début pour ne pas décaler les index
  let resultat = texte;
  const avecSuggestion = annotations.filter((a) => a.suggestion).sort((a, b) => b.start - a.start);
  avecSuggestion.forEach((a) => {
    resultat = resultat.slice(0, a.start) + a.suggestion + resultat.slice(a.end);
  });
  return resultat;
}

window.PLUME_ENGINE = { analyserTexte, appliquerSuggestion, appliquerToutesLesSuggestions };
