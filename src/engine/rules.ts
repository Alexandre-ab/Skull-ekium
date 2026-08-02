/**
 * Constantes de la règle officielle française (Blackrock Games, 2022).
 *
 * Toute valeur chiffrée du barème vit ici et nulle part ailleurs :
 * `scoring.ts` ne contient aucun nombre en dur.
 */

/* ═══════════ Joueurs et paquet ═══════════ */

export const JOUEURS_MIN = 2

/**
 * La règle papier ne dépasse jamais 8 joueurs (« 7-8 joueurs », « plus de six
 * joueurs »). Le plafond de 10 vient de CLAUDE.md, pas du livret.
 */
export const JOUEURS_MAX = 10

/** 56 cartes de couleur + 14 cartes spéciales. */
export const PAQUET_BASE = 70

/** Paquet de base + Butin (2), Kraken (1), Baleine blanche (1). */
export const PAQUET_EXTENSIONS = 74

/* ═══════════ Système Skull King ═══════════ */

/** Mise d'au moins 1, tenue : 20 points par pli annoncé. */
export const POINTS_PAR_PLI_MISE_TENUE = 20

/** Mise d'au moins 1, ratée : 10 points de pénalité par pli d'écart. */
export const PENALITE_PAR_PLI_ECART = 10

/**
 * Mise à zéro : 10 points par carte distribuée, gagnés si aucun pli n'est
 * remporté, perdus sinon. Ce n'est pas `20 × 0`.
 */
export const POINTS_PAR_CARTE_MISE_ZERO = 10

/* ═══════════ Système Rascal ═══════════ */

/** Chevrotine : potentiel de 10 points par carte distribuée. */
export const POINTS_PAR_CARTE_CHEVROTINE = 10

/** Boulet de canon : potentiel de 15 points par carte distribuée. */
export const POINTS_PAR_CARTE_BOULET = 15

/** Coup direct — mise parfaitement exacte : la totalité du potentiel. */
export const MULT_COUP_DIRECT = 1

/** Frappe à revers — écart de 1 : la moitié du potentiel. */
export const MULT_FRAPPE_A_REVERS = 0.5

/** Échec cuisant — écart de 2 ou plus : aucun point. */
export const MULT_ECHEC_CUISANT = 0

/** Écart qui donne droit à la frappe à revers. */
export const ECART_FRAPPE_A_REVERS = 1

/* ═══════════ Points bonus (communs aux deux systèmes) ═══════════ */

/** Carte 14 de couleur classique (vert, violet, jaune) possédée en fin de manche. */
export const BONUS_QUATORZE_COULEUR = 10

/** Carte 14 noire (Drapeau pirate) possédée en fin de manche. */
export const BONUS_QUATORZE_NOIR = 20

/** Sirène capturée par un pirate. */
export const BONUS_SIRENE_CAPTUREE = 20

/** Pirate capturé par le Skull King, Tigresse jouée en pirate comprise. */
export const BONUS_PIRATE_CAPTURE = 30

/** Skull King capturé par votre sirène. */
export const BONUS_SKULL_KING_CAPTURE = 40

/**
 * Alliance Butin réussie : 20 points à chacun des deux alliés.
 * Accordés uniquement si les deux misent correctement, en toutes circonstances.
 */
export const BONUS_ALLIANCE_BUTIN = 20

/* ═══════════ Rascal le Flambeur ═══════════ */

/** Paris possibles du pouvoir Rascal le Flambeur. */
export const PARIS_FLAMBEUR = [0, 10, 20] as const

/* ═══════════ Plafonds de saisie ═══════════ */

/** Trois couleurs classiques, donc trois cartes 14 non atout. */
export const MAX_QUATORZE_COULEUR = 3

/** Le paquet contient deux sirènes. */
export const MAX_SIRENES_CAPTUREES = 2

/** Cinq pirates, plus la Tigresse jouée en pirate. */
export const MAX_PIRATES_CAPTURES = 6

/* ═══════════ Formats de manches ═══════════ */

export type FormatManches =
  | "classique"
  | "pasDImpair"
  | "pretAuCombat"
  | "attaqueEclair"
  | "tirDeBarrage"
  | "tourbillon"
  | "heureDuDodo"

/**
 * Cartes distribuées à chaque manche, avant plafond du paquet.
 *
 * Divergence signalée : le livret écrit « Pas d'impair : **deux manches** de
 * 2, 4, 6, 8 et enfin 10 cartes » et « Tourbillon : **deux manches** de
 * 9, 7, 5, 3 et enfin 1 carte(s) », ce qui se lit comme dix manches et non
 * cinq. Les valeurs ci-dessous sont celles de CLAUDE.md.
 */
export const FORMATS_MANCHES: Record<FormatManches, readonly number[]> = {
  classique: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  pasDImpair: [2, 4, 6, 8, 10],
  pretAuCombat: [6, 7, 8, 9, 10],
  attaqueEclair: [5, 5, 5, 5, 5],
  tirDeBarrage: Array<number>(10).fill(10),
  tourbillon: [9, 7, 5, 3, 1],
  heureDuDodo: [1],
}

/** Libellés des formats, pour l'écran de mise en place. */
export const LIBELLES_FORMATS: Record<FormatManches, string> = {
  classique: "Classique — 1 à 10 cartes",
  pasDImpair: "Pas d'impair — 2·4·6·8·10",
  pretAuCombat: "Prêt au combat — 6·7·8·9·10",
  attaqueEclair: "Attaque éclair — 5 × 5 cartes",
  tirDeBarrage: "Tir de barrage — 10 × 10 cartes",
  tourbillon: "Tourbillon — 9·7·5·3·1",
  heureDuDodo: "L'heure du dodo — 1 manche",
}
