/**
 * Plume — traduction
 * -------------------
 * Utilise l'API publique MyMemory (https://mymemory.translated.net), gratuite
 * et sans clé, avec un quota "honnête" (~5000 mots/jour/IP sans inscription,
 * ~50 000 avec une adresse e-mail renseignée gratuitement — voir README).
 * C'est l'option la plus proche d'un usage "sans limite" que l'on puisse
 * obtenir sans héberger soi-même un serveur de traduction.
 */

const LANGUES = [
  { code: "fr", nom: "Français" },
  { code: "en", nom: "Anglais" },
  { code: "es", nom: "Espagnol" },
  { code: "de", nom: "Allemand" },
  { code: "it", nom: "Italien" },
  { code: "pt", nom: "Portugais" },
  { code: "nl", nom: "Néerlandais" },
  { code: "ru", nom: "Russe" },
  { code: "ar", nom: "Arabe" },
  { code: "zh", nom: "Chinois" },
  { code: "ja", nom: "Japonais" },
  { code: "ko", nom: "Coréen" },
  { code: "pl", nom: "Polonais" },
  { code: "tr", nom: "Turc" },
  { code: "sv", nom: "Suédois" },
  { code: "el", nom: "Grec" },
  { code: "he", nom: "Hébreu" },
  { code: "hi", nom: "Hindi" },
  { code: "vi", nom: "Vietnamien" },
  { code: "uk", nom: "Ukrainien" },
];

async function traduire(texte, langueSource, langueCible, emailOptionnel) {
  if (!texte.trim()) return "";
  const morceaux = decouperEnMorceaux(texte, 480); // l'API limite ~500 caractères par requête
  const resultats = [];

  for (const morceau of morceaux) {
    const params = new URLSearchParams({
      q: morceau,
      langpair: `${langueSource}|${langueCible}`,
    });
    if (emailOptionnel) params.append("de", emailOptionnel);

    const reponse = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
    if (!reponse.ok) {
      throw new Error("Le service de traduction est momentanément indisponible.");
    }
    const donnees = await reponse.json();
    resultats.push(donnees?.responseData?.translatedText || "");
  }

  return resultats.join(" ");
}

function decouperEnMorceaux(texte, tailleMax) {
  const phrases = texte.split(/(?<=[.!?])\s+/);
  const morceaux = [];
  let courant = "";
  for (const phrase of phrases) {
    if ((courant + " " + phrase).trim().length > tailleMax) {
      if (courant) morceaux.push(courant.trim());
      courant = phrase;
    } else {
      courant = (courant + " " + phrase).trim();
    }
  }
  if (courant) morceaux.push(courant.trim());
  return morceaux.length ? morceaux : [texte];
}

window.PLUME_TRANSLATE = { traduire, LANGUES };
