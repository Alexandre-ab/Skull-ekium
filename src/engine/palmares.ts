/**
 * Palmarès : agrégation des parties archivées.
 *
 * Fonctions pures, comme le reste de `engine/` : ni React, ni `localStorage`.
 * Un journal de parties entre, un classement global sort.
 */

import type { PartieArchivee, StatsJoueur } from "./types"

/**
 * Clé de regroupement d'un joueur.
 * « Suzie », « suzie » et « Suzie » avec une espace en trop sont le même pirate :
 * personne ne retape son nom à l'identique d'une soirée à l'autre.
 */
export function cleJoueur(nom: string): string {
  return nom.trim().toLowerCase()
}

/** Indices des joueurs ayant le meilleur total. Plusieurs en cas d'égalité. */
export function vainqueurs(totaux: number[]): number[] {
  if (totaux.length === 0) return []
  const meilleur = Math.max(...totaux)
  return totaux.flatMap((total, i) => (total === meilleur ? [i] : []))
}

/**
 * Statistiques cumulées, du plus titré au moins titré.
 *
 * `parties` est attendu du plus récent au plus ancien : c'est la première
 * orthographe rencontrée qui sert à l'affichage.
 *
 * Une partie gagnée ex æquo compte une victoire pour chacun — la règle ne
 * départage pas les égalités, l'appli n'a pas à inventer un vainqueur.
 */
export function statistiques(parties: PartieArchivee[]): StatsJoueur[] {
  const fiches = new Map<string, StatsJoueur>()

  for (const partie of parties) {
    const gagnants = new Set(vainqueurs(partie.totaux))

    partie.joueurs.forEach((nom, i) => {
      const cle = cleJoueur(nom)
      if (!cle) return

      const total = partie.totaux[i] ?? 0
      const fiche = fiches.get(cle) ?? {
        nom: nom.trim(),
        parties: 0,
        victoires: 0,
        points: 0,
        moyenne: 0,
        meilleur: total,
      }

      fiche.parties += 1
      fiche.victoires += gagnants.has(i) ? 1 : 0
      fiche.points += total
      fiche.meilleur = Math.max(fiche.meilleur, total)
      fiches.set(cle, fiche)
    })
  }

  return [...fiches.values()]
    .map((fiche) => ({
      ...fiche,
      moyenne: fiche.parties === 0 ? 0 : fiche.points / fiche.parties,
    }))
    .sort(
      (a, b) =>
        b.victoires - a.victoires ||
        b.moyenne - a.moyenne ||
        b.points - a.points ||
        a.nom.localeCompare(b.nom, "fr"),
    )
}
