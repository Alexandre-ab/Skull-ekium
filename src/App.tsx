/** Assemblage des écrans. Toute la logique de score vit dans `engine/`. */

import { useState } from "react"
import { BandeauMiseAJour } from "./components/BandeauMiseAJour"
import { BarreSuperieure } from "./components/BarreSuperieure"
import { EcranBonus } from "./components/EcranBonus"
import { EcranClassement } from "./components/EcranClassement"
import { EcranMiseEnPlace } from "./components/EcranMiseEnPlace"
import { EcranMises } from "./components/EcranMises"
import { EcranPalmares } from "./components/EcranPalmares"
import { EcranPlis } from "./components/EcranPlis"
import { EcranRecap } from "./components/EcranRecap"
import { Menu } from "./components/Menu"
import { MiniClassement } from "./components/MiniClassement"
import { Modale } from "./components/Modale"
import {
  PHASES,
  useGame,
  type ConfigNouvellePartie,
  type Phase,
} from "./state/useGame"
import { usePalmares } from "./state/usePalmares"

/** Confirmations ouvertes en modale — jamais `confirm()` natif. */
type Confirmation = "annulerManche" | "abandonner" | "plisIncoherents" | null

export default function App() {
  return (
    <>
      <Ecrans />
      <BandeauMiseAJour />
    </>
  )
}

function Ecrans() {
  const jeu = useGame()
  const palmares = usePalmares()
  const [vueClassement, setVueClassement] = useState(false)
  const [vuePalmares, setVuePalmares] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)

  const { partie, phase, coherence, terminee } = jeu

  /** Retient l'équipage avant de lancer : la prochaine soirée sera plus rapide. */
  const demarrer = (config: ConfigNouvellePartie) => {
    palmares.memoriser(config.joueurs)
    jeu.nouvellePartie(config)
  }

  /**
   * Referme la partie en cours.
   * Seule une partie menée jusqu'à la dernière manche rejoint le palmarès :
   * un abandon en cours de route fausserait les moyennes.
   */
  const terminerPartie = () => {
    if (partie && terminee) palmares.archiver(partie, jeu.classement)
    jeu.terminer()
  }

  const ouvrirPalmares = () => {
    setMenuOuvert(false)
    setVuePalmares(true)
  }

  /* ── Palmarès ── */

  if (vuePalmares) {
    return (
      <div className="min-h-full">
        <header className="sticky top-0 z-30 border-b border-pont barre-voilee px-4 py-3 text-center">
          <div className="titre text-sm text-or">Palmarès</div>
          <div className="text-xs text-brume">
            {palmares.parties.length} partie{palmares.parties.length > 1 ? "s" : ""}{" "}
            archivée{palmares.parties.length > 1 ? "s" : ""}
          </div>
        </header>
        <EcranPalmares palmares={palmares} onFermer={() => setVuePalmares(false)} />
      </div>
    )
  }

  if (!partie)
    return (
      <EcranMiseEnPlace
        onDemarrer={demarrer}
        equipage={palmares.equipage}
        onPalmares={() => setVuePalmares(true)}
      />
    )

  const enCorrection = partie.correction !== null
  const indexAffiche = (partie.correction ?? partie.mancheCourante) + 1

  /** Rouvre une manche validée en saisie et quitte le classement pour l'afficher. */
  const ouvrirCorrection = (indexManche: number) => {
    jeu.corriger(indexManche)
    setVueClassement(false)
  }

  /* ── Progression entre les étapes ── */

  const misesCompletes = partie.brouillon.entrees.every((e) => e.mise !== null)
  const plisComplets = partie.brouillon.entrees.every((e) => e.plis !== null)

  const peutAvancer =
    phase === "mises"
      ? misesCompletes
      : phase === "plis"
        ? plisComplets
        : true

  const indexPhase = PHASES.findIndex((p) => p.id === phase)
  const phaseSuivante = PHASES[indexPhase + 1]?.id
  const phasePrecedente = PHASES[indexPhase - 1]?.id

  const avancer = () => {
    // Un total de plis impossible mérite une confirmation, pas un blocage sec :
    // c'est à la table de trancher, pas à l'appli.
    if (phase === "plis" && coherence) {
      const suspect =
        coherence.etat === "excedentaires" ||
        (coherence.etat === "manquants" && !coherence.tolere)
      if (suspect) return setConfirmation("plisIncoherents")
    }
    if (phase === "recap") return jeu.validerManche()
    if (phaseSuivante) jeu.allerA(phaseSuivante)
  }

  const libelleAvancer =
    phase === "recap" ? (enCorrection ? "Enregistrer la correction" : "Valider la manche") : "Suivant"

  /* ── Écran classement ── */

  if (vueClassement) {
    return (
      <div className="min-h-full">
        <BarreSuperieure
          titre="Classement"
          sousTitre={`${partie.manches.length} manche${partie.manches.length > 1 ? "s" : ""} jouée${partie.manches.length > 1 ? "s" : ""}`}
          onMenu={() => setMenuOuvert(true)}
          onClassement={() => setVueClassement(false)}
        />
        <EcranClassement jeu={jeu} onCorriger={ouvrirCorrection} />
        <div className="sticky bottom-0 border-t border-pont barre-voilee p-3">
          <button
            type="button"
            onClick={() => setVueClassement(false)}
            className="min-h-12 w-full rounded-xl border border-pont text-ecume"
          >
            {terminee ? "Retour" : "Reprendre la partie"}
          </button>
        </div>
        {menuOuvert && (
          <Menu
            jeu={jeu}
            onFermer={() => setMenuOuvert(false)}
            onAnnulerManche={() => setConfirmation("annulerManche")}
            onAbandonner={() => setConfirmation("abandonner")}
            onPalmares={ouvrirPalmares}
          />
        )}
        <Confirmations
          confirmation={confirmation}
          fermer={() => setConfirmation(null)}
          jeu={jeu}
          fermerMenu={() => setMenuOuvert(false)}
          avancerQuandMeme={() => {}}
          onTerminer={terminerPartie}
          partieTerminee={terminee}
        />
      </div>
    )
  }

  /* ── Partie terminée ── */

  if (terminee && !enCorrection) {
    return (
      <div className="min-h-full">
        <BarreSuperieure
          titre="Partie terminée"
          onMenu={() => setMenuOuvert(true)}
          onClassement={() => setVueClassement(true)}
        />
        <EcranClassement jeu={jeu} onCorriger={ouvrirCorrection} />
        <div className="sticky bottom-0 border-t border-pont barre-voilee p-3">
          <button
            type="button"
            onClick={() => setConfirmation("abandonner")}
            className="min-h-12 w-full rounded-xl bouton-or font-bold"
          >
            Nouvelle partie
          </button>
        </div>
        {menuOuvert && (
          <Menu
            jeu={jeu}
            onFermer={() => setMenuOuvert(false)}
            onAnnulerManche={() => setConfirmation("annulerManche")}
            onAbandonner={() => setConfirmation("abandonner")}
            onPalmares={ouvrirPalmares}
          />
        )}
        <Confirmations
          confirmation={confirmation}
          fermer={() => setConfirmation(null)}
          jeu={jeu}
          fermerMenu={() => setMenuOuvert(false)}
          avancerQuandMeme={() => {}}
          onTerminer={terminerPartie}
          partieTerminee={terminee}
        />
      </div>
    )
  }

  /* ── Saisie d'une manche ── */

  return (
    <div className="flex min-h-full flex-col">
      <BarreSuperieure
        titre={`Manche ${indexAffiche} sur ${partie.calendrier.length}`}
        sousTitre={`${partie.brouillon.cartes} carte${partie.brouillon.cartes > 1 ? "s" : ""}${enCorrection ? " · correction" : ""}`}
        onMenu={() => setMenuOuvert(true)}
        onClassement={() => setVueClassement(true)}
      />

      <MiniClassement joueurs={partie.joueurs} totaux={jeu.classement} />

      {/* Fil des étapes, cliquable pour revenir en arrière. */}
      <nav aria-label="Étapes" className="flex gap-1 px-3 pb-2">
        {PHASES.map((etape, i) => {
          // En correction tout est déjà saisi : on doit pouvoir sauter au récap.
          const atteignable =
            i <= indexPhase ||
            (i === 1 && misesCompletes) ||
            (i >= 2 && misesCompletes && plisComplets)
          return (
            <button
              key={etape.id}
              type="button"
              disabled={!atteignable}
              aria-current={etape.id === phase ? "step" : undefined}
              onClick={() => jeu.allerA(etape.id as Phase)}
              className={[
                "min-h-9 flex-1 rounded-lg border text-xs",
                etape.id === phase
                  ? "border-or bg-or/15 font-bold text-or"
                  : "border-pont text-brume disabled:opacity-30",
              ].join(" ")}
            >
              {etape.libelle}
            </button>
          )
        })}
      </nav>

      <main className="flex-1">
        {phase === "mises" && <EcranMises jeu={jeu} />}
        {phase === "plis" && <EcranPlis jeu={jeu} />}
        {phase === "bonus" && <EcranBonus jeu={jeu} />}
        {phase === "recap" && <EcranRecap jeu={jeu} />}
      </main>

      <div className="sticky bottom-0 flex gap-2 border-t border-pont barre-voilee p-3">
        {phasePrecedente && (
          <button
            type="button"
            onClick={() => jeu.allerA(phasePrecedente)}
            className="min-h-12 min-w-24 rounded-xl border border-pont text-ecume"
          >
            Retour
          </button>
        )}
        <button
          type="button"
          disabled={!peutAvancer}
          onClick={avancer}
          className="min-h-12 flex-1 rounded-xl bouton-or font-bold"
        >
          {libelleAvancer}
        </button>
      </div>

      {menuOuvert && (
        <Menu
          jeu={jeu}
          onFermer={() => setMenuOuvert(false)}
          onAnnulerManche={() => setConfirmation("annulerManche")}
          onAbandonner={() => setConfirmation("abandonner")}
          onPalmares={ouvrirPalmares}
        />
      )}

      <Confirmations
        confirmation={confirmation}
        fermer={() => setConfirmation(null)}
        jeu={jeu}
        fermerMenu={() => setMenuOuvert(false)}
        avancerQuandMeme={() => jeu.allerA("bonus")}
        onTerminer={terminerPartie}
        partieTerminee={terminee}
      />
    </div>
  )
}

/* ═══════════ Modales de confirmation ═══════════ */

type ConfirmationsProps = {
  confirmation: Confirmation
  fermer: () => void
  fermerMenu: () => void
  jeu: ReturnType<typeof useGame>
  avancerQuandMeme: () => void
  onTerminer: () => void
  /** La dernière manche a été jouée : la partie ira au palmarès. */
  partieTerminee: boolean
}

function Confirmations({
  confirmation,
  fermer,
  fermerMenu,
  jeu,
  avancerQuandMeme,
  onTerminer,
  partieTerminee,
}: ConfirmationsProps) {
  if (confirmation === "annulerManche") {
    return (
      <Modale
        titre="Annuler la dernière manche ?"
        libelleConfirmer="Annuler la manche"
        danger
        onAnnuler={fermer}
        onConfirmer={() => {
          jeu.annulerDerniereManche()
          fermer()
          fermerMenu()
        }}
      >
        La manche sera effacée et les totaux recalculés. Pour ne corriger qu'une saisie,
        touchez plutôt la ligne concernée dans la feuille de score.
      </Modale>
    )
  }

  if (confirmation === "abandonner") {
    return (
      <Modale
        titre={partieTerminee ? "Enregistrer et repartir ?" : "Terminer la partie ?"}
        libelleConfirmer={partieTerminee ? "Nouvelle partie" : "Terminer"}
        danger={!partieTerminee}
        onAnnuler={fermer}
        onConfirmer={() => {
          onTerminer()
          fermer()
          fermerMenu()
        }}
      >
        {partieTerminee
          ? "Le résultat rejoint le palmarès et compte au classement général."
          : "La partie n'est pas allée à son terme : elle ne comptera pas au palmarès et ses scores seront perdus."}
      </Modale>
    )
  }

  if (confirmation === "plisIncoherents") {
    const c = jeu.coherence
    return (
      <Modale
        titre="Le compte des plis ne tombe pas juste"
        libelleConfirmer="Continuer quand même"
        onAnnuler={fermer}
        onConfirmer={() => {
          avancerQuandMeme()
          fermer()
        }}
      >
        {c?.etat === "excedentaires"
          ? `Vous avez saisi ${c.ecart} pli${c.ecart > 1 ? "s" : ""} de plus qu'il n'y a de cartes dans cette manche.`
          : "Il manque des plis par rapport aux cartes distribuées."}{" "}
        Vérifiez la saisie avant de continuer.
      </Modale>
    )
  }

  return null
}
