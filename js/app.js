(function () {
  const zoneTexte = document.getElementById("zone-texte");
  const compteurMots = document.getElementById("compteur-mots");
  const boutonAction = document.getElementById("bouton-action");
  const listeAnnotations = document.getElementById("liste-annotations");
  const margeVide = document.getElementById("marge-vide");
  const explicationCategorie = document.getElementById("explication-categorie");

  const panneauCorrection = document.getElementById("panneau-correction");
  const panneauTraduction = document.getElementById("panneau-traduction");
  const blocTraduction = document.getElementById("resultat-traduction-bloc");
  const resultatTraduction = document.getElementById("resultat-traduction");
  const selectSource = document.getElementById("langue-source");
  const selectCible = document.getElementById("langue-cible");
  const boutonCopier = document.getElementById("bouton-copier-traduction");

  let mode = "correction";
  let categorie = "classique";
  let registre = "classique";

  // ---------- Bascule de mode ----------
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach((b) => {
        b.classList.toggle("actif", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      panneauCorrection.hidden = mode !== "correction";
      panneauTraduction.hidden = mode !== "traduction";
      blocTraduction.hidden = mode !== "traduction";
      boutonAction.textContent = mode === "correction" ? "Corriger le texte" : "Traduire le texte";
    });
  });

  // ---------- Sélecteurs catégorie / registre ----------
  const descriptions = {
    classique: "Un français correct et équilibré, sans jargon ni familiarité.",
    pro: "Direct, clair, orienté action — le ton d'un email ou d'un rapport professionnel.",
    academique: "Rigoureux, impersonnel, argumenté — adapté à un mémoire ou un article.",
    administratif: "Formel, impersonnel, vouvoiement systématique — le ton d'un courrier officiel.",
  };

  document.querySelectorAll('[data-groupe="categorie"] .option').forEach((btn) => {
    btn.addEventListener("click", () => {
      categorie = btn.dataset.valeur;
      document.querySelectorAll('[data-groupe="categorie"] .option').forEach((b) => b.classList.toggle("actif", b === btn));
      explicationCategorie.textContent = descriptions[categorie];
    });
  });

  document.querySelectorAll('[data-groupe="registre"] .option').forEach((btn) => {
    btn.addEventListener("click", () => {
      registre = btn.dataset.valeur;
      document.querySelectorAll('[data-groupe="registre"] .option').forEach((b) => b.classList.toggle("actif", b === btn));
    });
  });

  // ---------- Compteur de mots ----------
  function majCompteur() {
    const texte = zoneTexte.innerText.trim();
    const mots = texte ? texte.split(/\s+/).length : 0;
    compteurMots.textContent = `${mots} mot${mots > 1 ? "s" : ""}`;
  }
  zoneTexte.addEventListener("input", majCompteur);

  // ---------- Langues (traduction) ----------
  window.PLUME_TRANSLATE.LANGUES.forEach((l) => {
    const opt1 = document.createElement("option");
    opt1.value = l.code;
    opt1.textContent = l.nom;
    selectSource.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = l.code;
    opt2.textContent = l.nom;
    selectCible.appendChild(opt2);
  });
  selectSource.value = "fr";
  selectCible.value = "en";

  // ---------- Action principale ----------
  boutonAction.addEventListener("click", async () => {
    const texte = zoneTexte.innerText;
    if (!texte.trim()) return;

    if (mode === "correction") {
      lancerCorrection(texte);
    } else {
      await lancerTraduction(texte);
    }
  });

  function lancerCorrection(texte) {
    const annotations = window.PLUME_ENGINE.analyserTexte(texte, categorie, registre);
    afficherTexteAnnote(texte, annotations);
    afficherMarge(texte, annotations);
  }

  function afficherTexteAnnote(texte, annotations) {
    if (annotations.length === 0) {
      zoneTexte.innerText = texte;
      return;
    }
    let html = "";
    let curseur = 0;
    annotations.forEach((a, i) => {
      html += escapeHtml(texte.slice(curseur, a.start));
      html += `<mark class="souligne ${a.type}" data-idx="${i}" title="${escapeHtml(a.message)}">${escapeHtml(a.original)}</mark>`;
      curseur = a.end;
    });
    html += escapeHtml(texte.slice(curseur));
    zoneTexte.innerHTML = html;
  }

  function afficherMarge(texte, annotations) {
    listeAnnotations.innerHTML = "";
    margeVide.hidden = annotations.length > 0;

    if (annotations.length === 0) {
      margeVide.hidden = false;
      margeVide.textContent = "Aucune remarque : votre texte est cohérent avec la catégorie et le registre choisis. Bravo !";
      return;
    }

    annotations.forEach((a, i) => {
      const li = document.createElement("li");
      li.className = `annotation ${a.type}`;
      li.innerHTML = `
        <div class="annotation-type">${libelleType(a.type)}</div>
        <p class="annotation-message">${escapeHtml(a.message)}</p>
        ${a.suggestion ? `<button class="annotation-suggestion" data-idx="${i}">Remplacer par « ${escapeHtml(a.suggestion)} »</button>` : ""}
      `;
      listeAnnotations.appendChild(li);
    });

    listeAnnotations.querySelectorAll(".annotation-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const texteActuel = zoneTexte.innerText;
        const annotationsActuelles = window.PLUME_ENGINE.analyserTexte(texteActuel, categorie, registre);
        const nouveauTexte = window.PLUME_ENGINE.appliquerSuggestion(texteActuel, annotationsActuelles[idx]);
        lancerCorrection(nouveauTexte);
      });
    });
  }

  function libelleType(type) {
    const noms = {
      orthographe: "Orthographe",
      grammaire: "Grammaire",
      style: "Style & registre",
      typographie: "Typographie",
    };
    return noms[type] || type;
  }

  async function lancerTraduction(texte) {
    resultatTraduction.textContent = "Traduction en cours…";
    boutonAction.disabled = true;
    try {
      const traduit = await window.PLUME_TRANSLATE.traduire(texte, selectSource.value, selectCible.value);
      resultatTraduction.textContent = traduit || "Aucune traduction n'a pu être obtenue.";
    } catch (err) {
      resultatTraduction.textContent = "La traduction a échoué : " + err.message;
    } finally {
      boutonAction.disabled = false;
    }
  }

  boutonCopier.addEventListener("click", () => {
    navigator.clipboard.writeText(resultatTraduction.textContent);
    boutonCopier.textContent = "Copié !";
    setTimeout(() => (boutonCopier.textContent = "Copier"), 1500);
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  majCompteur();
})();
