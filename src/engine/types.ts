/**
 * Types du domaine Skull King.
 * Aucun type lié à React, au DOM ou au stockage : ce fichier décrit
 * uniquement la partie telle qu'elle se joue autour de la table.
 */

/** Les deux systèmes de décompte proposés par la règle. */
export type Systeme = "skullking" | "rascal"

/** Saisie d'un joueur pour une manche. */
export type Entree = {
  /** Plis annoncés. `null` tant que le joueur n'a pas misé. */
  mise: number | null
  /** Plis effectivement remportés. `null` tant que la manche n'est pas jouée. */
  plis: number | null
  /** 0 à 3 : cartes 14 vert / violet / jaune possédées en fin de manche. */
  quatorzeCouleur: number
  /** Carte 14 noire (Drapeau pirate) possédée en fin de manche. */
  quatorzeNoir: boolean
  /** 0 à 2 : sirènes capturées par un pirate. */
  sirenesCapturees: number
  /** 0 à 6 : pirates capturés par le Skull King, Tigresse-pirate comprise. */
  piratesCaptures: number
  /** Skull King capturé par votre sirène. */
  skullKingCapture: boolean
  /** Rascal : boulet de canon choisi pour cette manche (sinon chevrotine). */
  boulet: boolean
  /** Pari du pouvoir Rascal le Flambeur. */
  flambeur: 0 | 10 | 20
}

/** Paire d'indices de joueurs alliés par une carte Butin. */
export type Alliance = [number, number]

/** Une manche : les cartes distribuées, la saisie de chaque joueur, les alliances. */
export type Manche = {
  /** Cartes distribuées cette manche, plafond du paquet déjà appliqué. */
  cartes: number
  /** Une entrée par joueur, dans le même ordre que `Partie.joueurs`. */
  entrees: Entree[]
  /** Alliances Butin nouées pendant la manche. */
  alliances: Alliance[]
}

/** Options de partie, choisies à la mise en place. */
export type OptionsPartie = {
  /** Variante ancienne édition : les bonus exigent une mise exacte. */
  bonusSiMiseExacte: boolean
  /** Rascal : autorise le choix boulet de canon / chevrotine. */
  bouletActif: boolean
  /**
   * Butin (2 cartes) : noue une alliance entre deux joueurs.
   * N'entre en jeu qu'ici — le Butin ne détruit aucun pli.
   */
  butin: boolean
  /** Kraken (1 carte) : le pli est détruit, personne ne le remporte. */
  kraken: boolean
  /**
   * Baleine blanche (1 carte) : annule les pouvoirs, le plus fort numéro
   * l'emporte. Sans carte numérotée dans le pli, celui-ci est détruit.
   */
  baleineBlanche: boolean
  /** Autorise le pari du pouvoir Rascal le Flambeur. */
  flambeurActif: boolean
}

/** État complet d'une partie. */
export type Partie = {
  /** 2 à 10 joueurs. */
  joueurs: string[]
  systeme: Systeme
  options: OptionsPartie
  /** Cartes distribuées par manche, avant plafond. Ex. [1,2,3,4,5,6,7,8,9,10]. */
  calendrier: number[]
  mancheCourante: number
  /** Manches validées. */
  manches: Manche[]
  /** Manche en cours de saisie. */
  brouillon: Manche
  /** Index de la manche en cours de correction, `null` sinon. */
  correction: number | null
}

/**
 * Résultat figé d'une partie terminée, conservé pour le palmarès.
 * On ne garde que le résultat, pas le détail des manches : le journal
 * doit rester léger même après des centaines de parties.
 */
export type PartieArchivee = {
  /** Identifiant local, unique sur cet appareil. */
  id: string
  /** Date de fin de partie, au format ISO. */
  date: string
  joueurs: string[]
  systeme: Systeme
  /** Total final de chaque joueur, même ordre que `joueurs`. */
  totaux: number[]
  /** Nombre de manches jouées. */
  manches: number
}

/** Statistiques cumulées d'un joueur sur toutes les parties archivées. */
export type StatsJoueur = {
  nom: string
  parties: number
  /** Parties gagnées, ex æquo compris. */
  victoires: number
  /** Somme des totaux de fin de partie. */
  points: number
  /** `points / parties`, non arrondi. */
  moyenne: number
  /** Meilleur total sur une partie. */
  meilleur: number
}

/**
 * Score d'un joueur pour une manche, décomposé.
 * `base` correspond aux points de mise, `bonus` aux points bonus,
 * `flambeur` au pari — les trois colonnes de la feuille de score officielle.
 */
export type ScoreEntree = {
  /** Points de mise. */
  base: number
  /** Points bonus, alliance Butin comprise. */
  bonus: number
  /** Gain ou perte du pari Rascal le Flambeur. */
  flambeur: number
  /** `base + bonus + flambeur`. */
  total: number
  /** La mise a été tenue exactement. */
  exacte: boolean
  /** Écart absolu entre la mise et les plis. */
  ecart: number
}
