/**
 * État de la partie : reducer + persistance `localStorage`.
 *
 * Toute la logique de calcul reste dans `engine/`. Ce fichier ne fait
 * qu'orchestrer la saisie et la sauvegarde.
 */

import { useCallback, useEffect, useMemo, useReducer } from "react"
import type {
  Alliance,
  Entree,
  Manche,
  OptionsPartie,
  Partie,
  Systeme,
} from "../engine/types"
import {
  cartesDeLaManche,
  plisADistribuer,
  scorerManche,
  totaux,
  verifierPlis,
} from "../engine/scoring"
import { FORMATS_MANCHES, type FormatManches } from "../engine/rules"

const CLE_SAUVEGARDE = "skullking:partie"

/* ═══════════ Types ═══════════ */

/** Étape de saisie d'une manche. */
export type Phase = "mises" | "plis" | "bonus" | "recap"

export const PHASES: readonly { id: Phase; libelle: string }[] = [
  { id: "mises", libelle: "Mises" },
  { id: "plis", libelle: "Plis" },
  { id: "bonus", libelle: "Bonus" },
  { id: "recap", libelle: "Récap" },
]

/** Champs de bonus saisissables par joueur. */
export type ChampBonus =
  | "quatorzeCouleur"
  | "quatorzeNoir"
  | "sirenesCapturees"
  | "piratesCaptures"
  | "skullKingCapture"
  | "boulet"
  | "flambeur"

export type ConfigNouvellePartie = {
  joueurs: string[]
  systeme: Systeme
  options: OptionsPartie
  format: FormatManches
}

type EtatJeu = {
  partie: Partie | null
  phase: Phase
}

type Action =
  | { type: "nouvellePartie"; config: ConfigNouvellePartie }
  | { type: "mise"; joueur: number; valeur: number | null }
  | { type: "plis"; joueur: number; valeur: number | null }
  | { type: "plisDetruits"; valeur: number }
  | { type: "bonus"; joueur: number; champ: ChampBonus; valeur: number | boolean }
  | { type: "allianceAjouter"; paire: Alliance }
  | { type: "allianceRetirer"; index: number }
  | { type: "phase"; phase: Phase }
  | { type: "validerManche" }
  | { type: "corriger"; manche: number }
  | { type: "abandonnerCorrection" }
  | { type: "annulerDerniereManche" }
  | { type: "terminer" }

/* ═══════════ Fabriques ═══════════ */

export function entreeVierge(): Entree {
  return {
    mise: null,
    plis: null,
    quatorzeCouleur: 0,
    quatorzeNoir: false,
    sirenesCapturees: 0,
    piratesCaptures: 0,
    skullKingCapture: false,
    boulet: false,
    flambeur: 0,
  }
}

function mancheVierge(nbJoueurs: number, cartes: number): Manche {
  return {
    cartes,
    entrees: Array.from({ length: nbJoueurs }, entreeVierge),
    alliances: [],
    plisDetruits: 0,
  }
}

/**
 * Remplit les plis dont la valeur est forcée — il n'existe alors qu'une
 * réponse possible, la faire cocher à la main est du temps perdu.
 *
 * - Un seul joueur reste à saisir : il a forcément tous les plis restants.
 * - Il ne reste aucun pli à distribuer : les joueurs restants sont tous à 0.
 *
 * Les plis dévorés par le Kraken sont retirés du compte avant de conclure :
 * sans cela, le dernier joueur hériterait d'un pli que personne n'a remporté.
 */
function completerPlisForces(partie: Partie): Partie {
  const { entrees } = partie.brouillon
  const manquants = entrees.filter((e) => e.plis === null).length
  if (manquants === 0) return partie

  const restant =
    plisADistribuer(partie.brouillon) -
    entrees.reduce((somme, e) => somme + (e.plis ?? 0), 0)
  if (restant < 0) return partie
  if (manquants > 1 && restant !== 0) return partie

  return {
    ...partie,
    brouillon: {
      ...partie.brouillon,
      entrees: entrees.map((e) =>
        e.plis === null ? { ...e, plis: manquants === 1 ? restant : 0 } : e,
      ),
    },
  }
}

/** Cartes distribuées à une manche donnée, plafond du paquet appliqué. */
function cartesPour(partie: Partie, indexManche: number): number {
  return cartesDeLaManche(
    partie.calendrier,
    indexManche,
    partie.joueurs.length,
    partie.options,
  )
}

/* ═══════════ Reducer ═══════════ */

function reducer(etat: EtatJeu, action: Action): EtatJeu {
  const { partie } = etat

  if (action.type === "nouvellePartie") {
    const { joueurs, systeme, options, format } = action.config
    const calendrier = [...FORMATS_MANCHES[format]]
    const neuve: Partie = {
      joueurs,
      systeme,
      options,
      calendrier,
      mancheCourante: 0,
      manches: [],
      brouillon: mancheVierge(joueurs.length, 0),
      correction: null,
    }
    neuve.brouillon = mancheVierge(joueurs.length, cartesPour(neuve, 0))
    return { partie: neuve, phase: "mises" }
  }

  if (action.type === "terminer") return { partie: null, phase: "mises" }
  if (!partie) return etat

  /** Applique une transformation à l'entrée d'un joueur du brouillon. */
  const modifierEntree = (joueur: number, transforme: (e: Entree) => Entree): EtatJeu => ({
    ...etat,
    partie: {
      ...partie,
      brouillon: {
        ...partie.brouillon,
        entrees: partie.brouillon.entrees.map((e, i) => (i === joueur ? transforme(e) : e)),
      },
    },
  })

  switch (action.type) {
    case "mise":
      return modifierEntree(action.joueur, (e) => ({ ...e, mise: action.valeur }))

    case "plis": {
      const suivant = modifierEntree(action.joueur, (e) => ({ ...e, plis: action.valeur }))
      if (!suivant.partie) return suivant
      return { ...suivant, partie: completerPlisForces(suivant.partie) }
    }

    case "plisDetruits": {
      /*
       * Déclarer un pli dévoré après coup change le compte attendu : les plis
       * déjà saisis pourraient dépasser. On les efface plutôt que de laisser
       * un total faux passer inaperçu — c'est deux touchers à refaire, contre
       * une manche mal comptée.
       */
      const trop =
        partie.brouillon.entrees.reduce((somme, e) => somme + (e.plis ?? 0), 0) >
        Math.max(0, partie.brouillon.cartes - action.valeur)

      return {
        ...etat,
        partie: {
          ...partie,
          brouillon: {
            ...partie.brouillon,
            plisDetruits: action.valeur,
            entrees: trop
              ? partie.brouillon.entrees.map((e) => ({ ...e, plis: null }))
              : partie.brouillon.entrees,
          },
        },
      }
    }

    case "bonus":
      return modifierEntree(action.joueur, (e) => ({ ...e, [action.champ]: action.valeur }))

    case "allianceAjouter": {
      const [a, b] = action.paire
      const existe = partie.brouillon.alliances.some(
        ([x, y]) => (x === a && y === b) || (x === b && y === a),
      )
      if (a === b || existe) return etat
      return {
        ...etat,
        partie: {
          ...partie,
          brouillon: {
            ...partie.brouillon,
            alliances: [...partie.brouillon.alliances, action.paire],
          },
        },
      }
    }

    case "allianceRetirer":
      return {
        ...etat,
        partie: {
          ...partie,
          brouillon: {
            ...partie.brouillon,
            alliances: partie.brouillon.alliances.filter((_, i) => i !== action.index),
          },
        },
      }

    case "phase":
      return { ...etat, phase: action.phase }

    case "corriger": {
      const aCorriger = partie.manches[action.manche]
      if (!aCorriger) return etat
      return {
        partie: { ...partie, correction: action.manche, brouillon: aCorriger },
        phase: "mises",
      }
    }

    case "abandonnerCorrection": {
      if (partie.correction === null) return etat
      return {
        partie: {
          ...partie,
          correction: null,
          brouillon: mancheVierge(
            partie.joueurs.length,
            cartesPour(partie, partie.mancheCourante),
          ),
        },
        phase: "mises",
      }
    }

    case "validerManche": {
      // Correction d'une manche déjà validée : on remplace sur place.
      if (partie.correction !== null) {
        const manches = partie.manches.map((m, i) =>
          i === partie.correction ? partie.brouillon : m,
        )
        return {
          partie: {
            ...partie,
            manches,
            correction: null,
            brouillon: mancheVierge(
              partie.joueurs.length,
              cartesPour(partie, partie.mancheCourante),
            ),
          },
          phase: "mises",
        }
      }

      const manches = [...partie.manches, partie.brouillon]
      const mancheCourante = partie.mancheCourante + 1
      return {
        partie: {
          ...partie,
          manches,
          mancheCourante,
          brouillon: mancheVierge(partie.joueurs.length, cartesPour(partie, mancheCourante)),
        },
        phase: "mises",
      }
    }

    case "annulerDerniereManche": {
      if (partie.manches.length === 0) return etat
      const manches = partie.manches.slice(0, -1)
      const mancheCourante = manches.length
      return {
        partie: {
          ...partie,
          manches,
          mancheCourante,
          correction: null,
          brouillon: mancheVierge(partie.joueurs.length, cartesPour(partie, mancheCourante)),
        },
        phase: "mises",
      }
    }

    default:
      return etat
  }
}

/* ═══════════ Persistance ═══════════ */

/**
 * Rattrape les sauvegardes antérieures au choix extension par extension.
 * Elles portent un unique `extensions: boolean` : tout ou rien, ce qui
 * correspond aux trois cartes activées ensemble.
 */
function migrerOptions(options: OptionsPartie & { extensions?: boolean }): OptionsPartie {
  if (options.butin !== undefined) return options
  const toutes = options.extensions === true
  return {
    ...options,
    butin: toutes,
    kraken: toutes,
    baleineBlanche: toutes,
  }
}

/**
 * Rattrape les manches antérieures à la déclaration des plis dévorés.
 * Elles n'en comptent aucun : leurs totaux restent ceux qui ont été validés.
 */
function migrerManche(manche: Manche): Manche {
  return manche.plisDetruits === undefined ? { ...manche, plisDetruits: 0 } : manche
}

function chargerEtat(): EtatJeu {
  const vide: EtatJeu = { partie: null, phase: "mises" }
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE)
    if (!brut) return vide
    const lu = JSON.parse(brut) as Partial<EtatJeu>
    // Une sauvegarde d'une version antérieure ne doit jamais bloquer l'appli.
    if (!lu.partie || !Array.isArray(lu.partie.joueurs)) return vide
    const partie: Partie = {
      ...lu.partie,
      options: migrerOptions(lu.partie.options),
      manches: lu.partie.manches.map(migrerManche),
      brouillon: migrerManche(lu.partie.brouillon),
    }
    return { partie, phase: lu.phase ?? "mises" }
  } catch {
    return vide
  }
}

/* ═══════════ Hook ═══════════ */

export function useGame() {
  const [etat, envoyer] = useReducer(reducer, undefined, chargerEtat)
  const { partie, phase } = etat

  useEffect(() => {
    try {
      if (partie) localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat))
      else localStorage.removeItem(CLE_SAUVEGARDE)
    } catch {
      // Mode privé ou quota atteint : la partie continue en mémoire.
    }
  }, [etat, partie])

  /** Index de la manche en cours de saisie — correction comprise. */
  const indexManche = partie ? (partie.correction ?? partie.mancheCourante) : 0
  const cartes = partie?.brouillon.cartes ?? 0
  const terminee = partie ? partie.mancheCourante >= partie.calendrier.length : false

  /** Totaux après les manches validées. */
  const classement = useMemo(() => {
    if (!partie) return []
    return totaux(partie.manches, partie.joueurs.length, partie.systeme, partie.options)
  }, [partie])

  /** Scores de la manche en cours de saisie. */
  const scoresBrouillon = useMemo(() => {
    if (!partie) return []
    return scorerManche(partie.brouillon, partie.systeme, partie.options)
  }, [partie])

  /**
   * Totaux tels qu'ils seront une fois le brouillon validé.
   *
   * En correction, la manche rouverte remplace son ancienne version : l'ajouter
   * aux totaux existants la compterait deux fois.
   */
  const classementProjete = useMemo(() => {
    if (!partie) return []
    const projection =
      partie.correction === null
        ? [...partie.manches, partie.brouillon]
        : partie.manches.map((m, i) => (i === partie.correction ? partie.brouillon : m))
    return totaux(projection, partie.joueurs.length, partie.systeme, partie.options)
  }, [partie])

  /** Cohérence entre les plis saisis et les cartes distribuées. */
  const coherence = useMemo(() => {
    if (!partie) return null
    return verifierPlis(partie.brouillon, partie.joueurs.length)
  }, [partie])

  const actions = useMemo(
    () => ({
      nouvellePartie: (config: ConfigNouvellePartie) =>
        envoyer({ type: "nouvellePartie", config }),
      definirMise: (joueur: number, valeur: number | null) =>
        envoyer({ type: "mise", joueur, valeur }),
      definirPlis: (joueur: number, valeur: number | null) =>
        envoyer({ type: "plis", joueur, valeur }),
      definirPlisDetruits: (valeur: number) => envoyer({ type: "plisDetruits", valeur }),
      definirBonus: (joueur: number, champ: ChampBonus, valeur: number | boolean) =>
        envoyer({ type: "bonus", joueur, champ, valeur }),
      ajouterAlliance: (paire: Alliance) => envoyer({ type: "allianceAjouter", paire }),
      retirerAlliance: (index: number) => envoyer({ type: "allianceRetirer", index }),
      allerA: (phase: Phase) => envoyer({ type: "phase", phase }),
      validerManche: () => envoyer({ type: "validerManche" }),
      corriger: (manche: number) => envoyer({ type: "corriger", manche }),
      abandonnerCorrection: () => envoyer({ type: "abandonnerCorrection" }),
      annulerDerniereManche: () => envoyer({ type: "annulerDerniereManche" }),
      terminer: () => envoyer({ type: "terminer" }),
    }),
    [],
  )

  /** Score cumulé d'un joueur après une manche donnée, pour la feuille de score. */
  const cumulApres = useCallback(
    (indexManche: number): number[] => {
      if (!partie) return []
      return totaux(
        partie.manches.slice(0, indexManche + 1),
        partie.joueurs.length,
        partie.systeme,
        partie.options,
      )
    },
    [partie],
  )

  return {
    partie,
    phase,
    indexManche,
    cartes,
    terminee,
    classement,
    classementProjete,
    scoresBrouillon,
    coherence,
    cumulApres,
    ...actions,
  }
}

export type Jeu = ReturnType<typeof useGame>
