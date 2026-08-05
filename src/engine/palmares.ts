/**
 * Palmarès : agrégation des parties archivées.
 *
 * Fonctions pures, comme le reste de `engine/` : ni React, ni `localStorage`.
 * Un journal de parties entre, un classement global sort.
 */

import type { PartieArchivee, Resultat, StatsJoueur } from "./types"

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
 * Rang d'un joueur dans une partie : un de plus que le nombre de joueurs
 * l'ayant devancé. Les ex æquo partagent donc le même rang.
 */
export function rangDans(totaux: number[], joueur: number): number {
  const sien = totaux[joueur] ?? 0
  return 1 + totaux.filter((t) => t > sien).length
}

/**
 * Statistiques cumulées, du plus titré au moins titré.
 *
 * `parties` est attendu du plus récent au plus ancien : c'est la première
 * orthographe rencontrée qui sert à l'affichage, et le sillage est retourné
 * en fin de calcul pour se lire de gauche à droite dans l'ordre du temps.
 *
 * Une partie gagnée ex æquo compte une victoire pour chacun — la règle ne
 * départage pas les égalités, l'appli n'a pas à inventer un vainqueur.
 *
 * Le classement suit les victoires, puis la précision d'annonce. Classer sur
 * la seule précision hisserait en tête qui n'a joué qu'une partie chanceuse.
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
        manchesMesurees: 0,
        misesExactes: 0,
        precision: null,
        sillage: [] as Resultat[],
      }

      fiche.parties += 1
      fiche.victoires += gagnants.has(i) ? 1 : 0
      fiche.points += total
      fiche.meilleur = Math.max(fiche.meilleur, total)

      // Les parties archivées avant la mesure ne comptent pas dans le ratio :
      // les inclure à zéro écraserait la précision de tout le monde.
      const exactes = partie.exactes?.[i]
      if (exactes !== undefined) {
        fiche.manchesMesurees += partie.manches
        fiche.misesExactes += exactes
      }

      fiche.sillage.push({
        date: partie.date,
        rang: rangDans(partie.totaux, i),
        joueurs: partie.joueurs.length,
        total,
      })

      fiches.set(cle, fiche)
    })
  }

  return [...fiches.values()]
    .map((fiche) => ({
      ...fiche,
      moyenne: fiche.parties === 0 ? 0 : fiche.points / fiche.parties,
      precision:
        fiche.manchesMesurees === 0
          ? null
          : fiche.misesExactes / fiche.manchesMesurees,
      sillage: [...fiche.sillage].reverse(),
    }))
    .sort(
      (a, b) =>
        b.victoires - a.victoires ||
        (b.precision ?? -1) - (a.precision ?? -1) ||
        b.moyenne - a.moyenne ||
        a.nom.localeCompare(b.nom, "fr"),
    )
}
