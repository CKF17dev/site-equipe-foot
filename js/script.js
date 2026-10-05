/* ============================================================
   RACING ALLIANCE — Scripts du site
   Menu mobile, navigation active, animations, visionneuse de
   maillots, formulaire de contact.
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     Année dynamique dans le pied de page
     ---------------------------------------------------------- */
  var annee = document.getElementById("annee");
  if (annee) annee.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     En-tête : ombre au défilement
     ---------------------------------------------------------- */
  var entete = document.getElementById("entete");
  function majEntete() {
    if (!entete) return;
    entete.classList.toggle("est-defile", window.scrollY > 8);
  }
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  /* ----------------------------------------------------------
     Lien actif selon la page courante
     ---------------------------------------------------------- */
  var chemin = location.pathname.split("/").pop() || "index.html";
  var liensNav = document.querySelectorAll(".navigation a[data-page]");
  liensNav.forEach(function (lien) {
    if (lien.getAttribute("data-page") === chemin) {
      lien.classList.add("est-actif");
      lien.setAttribute("aria-current", "page");
    }
  });

  /* ----------------------------------------------------------
     Menu mobile
     ---------------------------------------------------------- */
  var boutonMenu = document.getElementById("bouton-menu");

  function fermerMenu() {
    document.body.classList.remove("menu-ouvert");
    if (boutonMenu) boutonMenu.setAttribute("aria-expanded", "false");
  }

  if (boutonMenu) {
    boutonMenu.addEventListener("click", function () {
      var ouvert = document.body.classList.toggle("menu-ouvert");
      boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });

    document.addEventListener("keydown", function (evenement) {
      if (evenement.key === "Escape") fermerMenu();
    });

    document.addEventListener("click", function (evenement) {
      if (!document.body.classList.contains("menu-ouvert")) return;
      var cible = evenement.target;
      if (
        !cible.closest(".navigation") &&
        !cible.closest(".bouton-menu")
      ) {
        fermerMenu();
      }
    });
  }

  liensNav.forEach(function (lien) {
    lien.addEventListener("click", fermerMenu);
  });

  /* ----------------------------------------------------------
     Apparitions au défilement
     ---------------------------------------------------------- */
  var elementsReveles = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    var observateur = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            entree.target.classList.add("est-visible");
            observateur.unobserve(entree.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elementsReveles.forEach(function (element) {
      var freres = Array.prototype.filter.call(
        element.parentNode.children,
        function (enfant) {
          return enfant.hasAttribute("data-reveal");
        }
      );
      var rang = freres.indexOf(element);
      if (rang > 0) element.style.transitionDelay = Math.min(rang * 70, 350) + "ms";
      observateur.observe(element);
    });
  } else {
    elementsReveles.forEach(function (element) {
      element.classList.add("est-visible");
    });
  }

  /* ----------------------------------------------------------
     Visionneuse de maillots
     ---------------------------------------------------------- */
  var zoneMaillot = document.getElementById("image-maillot");
  if (zoneMaillot) {

    var DOSSIER_KITS = "assets/kits/";
    var EXTENSIONS = ["webp", "png", "jpg", "jpeg"];

    var KITS = {
      home:  { nom: "Domicile",  base: "home",  devise: "« Le bleu du crépuscule sur le fleuve. »" },
      away:  { nom: "Extérieur", base: "away",  devise: "« Blanc comme les voiles sur le fleuve. »" },
      third: { nom: "Third",     base: "third", devise: "« La brume du matin sur la Digue. »" }
    };

    var FACES = {
      front: { nom: "Face avant" },
      back:  { nom: "Face arrière" }
    };

    var image = document.getElementById("image-maillot");
    var etiquette = document.getElementById("etiquette-maillot");
    var legende = document.getElementById("legende-maillot");
    var message = document.getElementById("message-maillot");
    var boutonsKits = Array.prototype.slice.call(
      document.querySelectorAll("#selection-maillot .selecteur-bouton")
    );
    var boutonsFaces = Array.prototype.slice.call(
      document.querySelectorAll("#selection-face .selecteur-bouton")
    );

    var etat = { kit: "home", face: "front" };
    var inventaire = {};
    var prechargement = {};

    function testerImage(url) {
      return new Promise(function (resoudre) {
        var sonde = new Image();
        sonde.onload = function () { resoudre(true); };
        sonde.onerror = function () { resoudre(false); };
        sonde.src = url;
      });
    }

    function trouverFichier(kit, face) {
      var base = KITS[kit].base;
      var promesse = EXTENSIONS.reduce(function (chaine, extension) {
        return chaine.then(function (resultat) {
          if (resultat) return resultat;
          var url = DOSSIER_KITS + base + "-" + face + "." + extension;
          return testerImage(url).then(function (ok) {
            return ok ? url : null;
          });
        });
      }, Promise.resolve(null));
      return promesse;
    }

    function precharger(url) {
      if (!url || prechargement[url]) return;
      prechargement[url] = true;
      var im = new Image();
      im.src = url;
    }

    function majBoutons(liste, cle, disponible) {
      liste.forEach(function (bouton) {
        var valeur = bouton.getAttribute("data-kit") || bouton.getAttribute("data-face");
        var actif = valeur === cle;
        bouton.classList.toggle("est-actif", actif);
        bouton.setAttribute("aria-pressed", actif ? "true" : "false");
        if (typeof disponible === "function") {
          bouton.disabled = !disponible(valeur);
        } else {
          bouton.disabled = false;
        }
      });
    }

    function afficherMaillot(transition) {
      var kit = KITS[etat.kit];
      var face = FACES[etat.face];
      var cle = etat.kit + "-" + etat.face;
      var url = inventaire[cle];

      etiquette.textContent = kit.nom + " — " + face.nom;
      image.alt = "Mockup du maillot " + kit.nom.toLowerCase() + ", " + face.nom.toLowerCase();

      Object.keys(KITS).forEach(function (identifiant) {
        var fiche = document.querySelector('[data-fiche="' + identifiant + '"]');
        if (fiche) fiche.hidden = identifiant !== etat.kit;
      });

      majBoutons(boutonsKits, etat.kit);
      majBoutons(boutonsFaces, etat.face, function (valeur) {
        return Boolean(inventaire[etat.kit + "-" + valeur]);
      });

      legende.textContent = url ? kit.devise : "";

      if (!url) {
        image.hidden = true;
        message.hidden = false;
        return;
      }

      message.hidden = true;
      image.hidden = false;

      if (transition) image.classList.add("est-chargement");

      image.onload = function () {
        requestAnimationFrame(function () {
          image.classList.remove("est-chargement");
        });
      };

      if (transition) {
        setTimeout(function () {
          image.src = url;
        }, 180);
      } else {
        image.src = url;
        image.classList.remove("est-chargement");
      }

      precharger(url);
    }

    boutonsKits.forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        var nouveau = bouton.getAttribute("data-kit");
        if (nouveau === etat.kit || bouton.disabled) return;
        etat.kit = nouveau;
        if (!inventaire[nouveau + "-" + etat.face]) etat.face = "front";
        afficherMaillot(true);
      });
    });

    boutonsFaces.forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        var nouvelle = bouton.getAttribute("data-face");
        if (nouvelle === etat.face || bouton.disabled) return;
        etat.face = nouvelle;
        afficherMaillot(true);
      });
    });

    var combinaisons = [];
    Object.keys(KITS).forEach(function (kit) {
      Object.keys(FACES).forEach(function (face) {
        combinaisons.push({ kit: kit, face: face });
      });
    });

    Promise.all(
      combinaisons.map(function (paire) {
        return trouverFichier(paire.kit, paire.face).then(function (url) {
          inventaire[paire.kit + "-" + paire.face] = url;
          precharger(url);
        });
      })
    ).then(function () {
      if (!inventaire["home-front"] && !inventaire["home-back"]) {
        var autre = combinaisons.find(function (paire) {
          return inventaire[paire.kit + "-" + paire.face];
        });
        if (autre) {
          etat.kit = autre.kit;
          etat.face = autre.face;
        }
      }
      if (etat.face !== "front" && !inventaire[etat.kit + "-" + etat.face]) {
        etat.face = "front";
      }
      afficherMaillot(false);
    });
  }

  /* ----------------------------------------------------------
     Formulaire de contact (vitrine statique)
     ---------------------------------------------------------- */
  var formulaire = document.getElementById("formulaire-contact");
  if (formulaire) {
    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      if (!formulaire.reportValidity()) return;
      var retour = document.getElementById("formulaire-retour");
      if (retour) {
        retour.hidden = false;
        retour.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      formulaire.reset();
    });
  }
})();
