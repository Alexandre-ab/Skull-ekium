/**
 * Moteur de score — fonctions pures uniquement.
 *
 * Ce fichier ne connaît ni React, ni le DOM, ni `localStorage` : un état entre,
 * un score sort. Toutes les valeurs du barème viennent de `rules.ts`.
 */

import type {
  Entree,
  Manche,
  OptionsPartie,
  ScoreEntree,
  Systeme,
} from "./types"
import {
  BONUS_ALLIANCE_BUTIN,
  BONUS_PIRATE_CAPTURE,
  BONUS_QUATORZE_COULEUR,
  BONUS_QUATORZE_NOIR,
  BONUS_SIRENE_CAPTUREE,
  BONUS_SKULL_KING_CAPTURE,
  ECART_FRAPPE_A_REVERS,
  JOUEURS_MIN,
  MULT_COUP_DIRECT,
  MULT_ECHEC_CUISANT,
  MULT_FRAPPE_A_REVERS,
  CARTES_BALEINE_BLANCHE,
  CARTES_BUTIN,
  CARTES_KRAKEN,
  PAQUET_BASE,
  PENALITE_PAR_PLI_ECART,
  POINTS_PAR_CARTE_BOULET,
  POINTS_PAR_CARTE_CHEVROTINE,
  POINTS_PAR_CARTE_MISE_ZERO,
  POINTS_PAR_PLI_MISE_TENUE,
} from "./rules"

/* ═══════════ Paquet et cartes distribuées ═══════════ */

/** Nombre de cartes en jeu : le paquet de base plus les extensions retenues. */
export function taillePaquet(options: OptionsPartie): number {
  return (
    PAQUET_BASE +
    (options.butin ? CARTES_BUTIN : 0) +
    (options.kraken ? CARTES_KRAKEN : 0) +
    (options.baleineBlanche ? CARTES_BALEINE_BLANCHE : 0)
  )
}

/**
 * Cartes distribuables à chaque joueur sans épuiser le paquet.
 *
 * Le livret demande seulement que « chaque joueur ait le même nombre de cartes
 * lors des dernières manches », sans donner de formule ; celle-ci vient de
 * CLAUDE.md. Au moins une carte est toujours distribuée.
 */
export function cartesMaximum(nbJoueurs: number, options: OptionsPartie): number {
  return Math.max(1, Math.floor(taillePaquet(options) / nbJoueurs))
}

/**
 * Cartes réellement distribuées à une manche : la valeur du calendrier,
 * ramenée au plafond du paquet. Rend 0 si la manche sort du calendrier.
 */
export function cartesDeLaManche(
  calendrier: readonly number[],
  indexManche: number,
  nbJoueurs: number,
  options: OptionsPartie,
): number {
  const prevues = calendrier[indexManche]
  if (prevues === undefined) return 0
  return Math.min(prevues, cartesMaximum(nbJoueurs, options))
}

/* ═══════════ Cohérence de la saisie ═══════════ */

/** Verdict du contrôle de cohérence entre les plis saisis et les cartes distribuées. */
export type CoherencePlis =
  | { etat: "incomplet" }
  | { etat: "exact" }
  | { etat: "manquants"; ecart: number; tolere: boolean }
  | { etat: "excedentaires"; ecart: number }

/**
 * Plis restant à répartir entre les joueurs : les cartes de la manche, moins
 * ceux que le Kraken ou la Baleine blanche ont dévorés.
 */
export function plisADistribuer(manche: Manche): number {
  return Math.max(0, manche.cartes - (manche.plisDetruits || 0))
}

/**
 * Confronte la somme des plis saisis aux plis réellement à répartir.
 *
 * Plus de plis qu'il n'en reste est toujours impossible. Moins est légitime
 * dans un seul cas : à deux joueurs, le fantôme de Barbe Grise en remporte
 * sans marquer.
 *
 * Les plis dévorés ne sont plus devinés — ils se déclarent. Une manche où le
 * Kraken est passé se vérifie donc aussi précisément qu'une autre, au lieu de
 * laisser filer n'importe quelle erreur de saisie.
 */
export function verifierPlis(manche: Manche, nbJoueurs: number): CoherencePlis {
  if (manche.entrees.some((e) => e.plis === null)) return { etat: "incomplet" }

  const attendus = plisADistribuer(manche)
  const somme = manche.entrees.reduce((total, e) => total + (e.plis ?? 0), 0)
  if (somme === attendus) return { etat: "exact" }
  if (somme > attendus) return { etat: "excedentaires", ecart: somme - attendus }

  return {
    etat: "manquants",
    ecart: attendus - somme,
    tolere: nbJoueurs === JOUEURS_MIN,
  }
}

/* ═══════════ Points bonus ═══════════ */

/**
 * Points bonus d'une entrée, hors alliance Butin — celle-ci dépend de la
 * réussite d'un autre joueur et se calcule au niveau de la manche.
 */
export function bonusBrut(entree: Entree): number {
  return (
    entree.quatorzeCouleur * BONUS_QUATORZE_COULEUR +
    (entree.quatorzeNoir ? BONUS_QUATORZE_NOIR : 0) +
    entree.sirenesCapturees * BONUS_SIRENE_CAPTUREE +
    entree.piratesCaptures * BONUS_PIRATE_CAPTURE +
    (entree.skullKingCapture ? BONUS_SKULL_KING_CAPTURE : 0)
  )
}

/** La mise a été annoncée et tenue exactement. */
function miseTenue(entree: Entree): boolean {
  return entree.mise !== null && entree.mise === entree.plis
}

/**
 * Nombre d'alliances Butin payantes pour un joueur.
 *
 * Les 20 points ne sont accordés que si **les deux** alliés tiennent leur mise,
 * quelles que soient les options de la partie.
 */
export function compterAlliancesReussies(manche: Manche, joueur: number): number {
  let reussies = 0
  for (const [a, b] of manche.alliances) {
    if (a !== joueur && b !== joueur) continue
    const indexAllie = a === joueur ? b : a
    const moi = manche.entrees[joueur]
    const allie = manche.entrees[indexAllie]
    if (!moi || !allie) continue
    if (miseTenue(moi) && miseTenue(allie)) reussies++
  }
  return reussies
}

/* ═══════════ Score d'une entrée ═══════════ */

/**
 * Score d'un joueur pour une manche.
 *
 * @param cartes    cartes distribuées cette manche, plafond déjà appliqué
 * @param alliances alliances Butin réussies par ce joueur
 */
/**
 * Mise réellement défendue : celle annoncée, ajustée du pouvoir de Harry le
 * Géant. Bornée à ce qui est jouable — on ne mise ni moins que zéro, ni plus
 * qu'il n'y a de cartes.
 */
export function miseEffective(
  entree: Entree,
  cartes: number,
  options: OptionsPartie,
): number {
  const annoncee = entree.mise ?? 0
  if (!options.harryActif) return annoncee
  return Math.min(cartes, Math.max(0, annoncee + entree.harry))
}

export function scorerEntree(
  entree: Entree,
  cartes: number,
  alliances: number,
  systeme: Systeme,
  options: OptionsPartie,
): ScoreEntree {
  const mise = miseEffective(entree, cartes, options)
  const plis = entree.plis ?? 0
  const ecart = Math.abs(mise - plis)
  const exacte = ecart === 0

  const bonusPotentiel = bonusBrut(entree) + BONUS_ALLIANCE_BUTIN * alliances

  // Le pari du Flambeur se règle en points fixes, hors de tout multiplicateur.
  // Le pari nul est écarté d'emblée : le nier produirait -0, qui s'afficherait « -0 ».
  const flambeur =
    options.flambeurActif && entree.flambeur !== 0
      ? exacte
        ? entree.flambeur
        : -entree.flambeur
      : 0

  const { base, bonus } =
    systeme === "skullking"
      ? pointsSkullKing(mise, ecart, exacte, cartes, bonusPotentiel, options)
      : pointsRascal(entree, ecart, exacte, cartes, bonusPotentiel, options)

  return { base, bonus, flambeur, total: base + bonus + flambeur, exacte, ecart }
}

/** Système classique : la mise seule décide du gain ou de la perte. */
function pointsSkullKing(
  mise: number,
  ecart: number,
  exacte: boolean,
  cartes: number,
  bonusPotentiel: number,
  options: OptionsPartie,
): { base: number; bonus: number } {
  const base =
    mise === 0
      ? // La mise à zéro se compte par carte distribuée, jamais 20 × 0.
        (exacte ? 1 : -1) * POINTS_PAR_CARTE_MISE_ZERO * cartes
      : exacte
        ? POINTS_PAR_PLI_MISE_TENUE * mise
        : // Mise ratée : rien pour les plis pris, la pénalité suit l'écart.
          -PENALITE_PAR_PLI_ECART * ecart

  // Par défaut les bonus restent acquis ; l'option rétablit l'ancienne édition.
  const bonus = options.bonusSiMiseExacte && !exacte ? 0 : bonusPotentiel

  return { base, bonus }
}

/**
 * Système Rascal : le potentiel est le même pour tous, seule la précision
 * décide de la part obtenue. Les bonus suivent le même multiplicateur.
 */
function pointsRascal(
  entree: Entree,
  ecart: number,
  exacte: boolean,
  cartes: number,
  bonusPotentiel: number,
  options: OptionsPartie,
): { base: number; bonus: number } {
  const boulet = options.bouletActif && entree.boulet
  const parCarte = boulet ? POINTS_PAR_CARTE_BOULET : POINTS_PAR_CARTE_CHEVROTINE

  // Le boulet de canon ne connaît pas la demi-part : tout ou rien.
  const multiplicateur = exacte
    ? MULT_COUP_DIRECT
    : ecart === ECART_FRAPPE_A_REVERS && !boulet
      ? MULT_FRAPPE_A_REVERS
      : MULT_ECHEC_CUISANT

  return {
    base: Math.round(parCarte * cartes * multiplicateur),
    bonus: Math.round(bonusPotentiel * multiplicateur),
  }
}

/* ═══════════ Manche et totaux ═══════════ */

/** Score de chaque joueur pour une manche, dans l'ordre des joueurs. */
export function scorerManche(
  manche: Manche,
  systeme: Systeme,
  options: OptionsPartie,
): ScoreEntree[] {
  return manche.entrees.map((entree, joueur) =>
    scorerEntree(
      entree,
      manche.cartes,
      compterAlliancesReussies(manche, joueur),
      systeme,
      options,
    ),
  )
}

/**
 * Totaux cumulés après les manches fournies.
 *
 * Tout se recalcule depuis les manches : corriger une manche validée suffit à
 * remettre d'aplomb l'ensemble du classement.
 */
export function totaux(
  manches: readonly Manche[],
  nbJoueurs: number,
  systeme: Systeme,
  options: OptionsPartie,
): number[] {
  const cumul = new Array<number>(nbJoueurs).fill(0)
  for (const manche of manches) {
    scorerManche(manche, systeme, options).forEach((score, joueur) => {
      const acquis = cumul[joueur]
      // Une manche peut compter plus d'entrées que de joueurs après correction.
      if (acquis !== undefined) cumul[joueur] = acquis + score.total
    })
  }
  return cumul
}

/**
 * Trajectoire de chaque joueur : son score cumulé après chaque manche.
 *
 * Une entrée par joueur, chacune longue de `manches.length + 1` — la première
 * vaut 0, avant que rien ne soit joué. C'est ce point de départ commun qui
 * permet de lire l'écart se creuser depuis le début de la traversée.
 */
export function trajectoires(
  manches: readonly Manche[],
  nbJoueurs: number,
  systeme: Systeme,
  options: OptionsPartie,
): number[][] {
  const courbes = Array.from({ length: nbJoueurs }, () => [0])
  const cumul = new Array<number>(nbJoueurs).fill(0)

  for (const manche of manches) {
    const scores = scorerManche(manche, systeme, options)
    for (let joueur = 0; joueur < nbJoueurs; joueur += 1) {
      cumul[joueur] = (cumul[joueur] ?? 0) + (scores[joueur]?.total ?? 0)
      courbes[joueur]?.push(cumul[joueur] ?? 0)
    }
  }

  return courbes
}
