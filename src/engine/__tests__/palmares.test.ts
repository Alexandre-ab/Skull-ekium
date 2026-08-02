import { describe, expect, it } from "vitest"
import type { PartieArchivee } from "../types"
import { cleJoueur, statistiques, vainqueurs } from "../palmares"

/* ═══════════ Fabriques ═══════════ */

let compteur = 0

/** Partie archivée minimale : des joueurs, leurs totaux, le reste par défaut. */
function partie(joueurs: string[], totaux: number[]): PartieArchivee {
  compteur += 1
  return {
    id: `test-${compteur}`,
    date: "2026-08-03T20:00:00.000Z",
    joueurs,
    systeme: "skullking",
    totaux,
    manches: 10,
  }
}

/** Retrouve la fiche d'un joueur dans un classement. */
function fiche(classement: ReturnType<typeof statistiques>, nom: string) {
  const trouvee = classement.find((f) => cleJoueur(f.nom) === cleJoueur(nom))
  if (!trouvee) throw new Error(`Aucune fiche pour ${nom}`)
  return trouvee
}

/* ═══════════ Vainqueurs ═══════════ */

describe("vainqueurs", () => {
  it("désigne le meilleur total", () => {
    expect(vainqueurs([120, 340, 90])).toEqual([1])
  })

  it("désigne tous les ex æquo", () => {
    expect(vainqueurs([340, 340, 90])).toEqual([0, 1])
  })

  it("gère les totaux négatifs", () => {
    expect(vainqueurs([-40, -10, -90])).toEqual([1])
  })

  it("ne désigne personne sur une liste vide", () => {
    expect(vainqueurs([])).toEqual([])
  })
})

/* ═══════════ Statistiques cumulées ═══════════ */

describe("statistiques", () => {
  it("ne renvoie rien sans partie archivée", () => {
    expect(statistiques([])).toEqual([])
  })

  it("cumule parties, points et meilleur score", () => {
    const classement = statistiques([
      partie(["Suzie", "Léo"], [300, 120]),
      partie(["Suzie", "Léo"], [100, 260]),
    ])

    expect(fiche(classement, "Suzie")).toMatchObject({
      parties: 2,
      victoires: 1,
      points: 400,
      moyenne: 200,
      meilleur: 300,
    })
    expect(fiche(classement, "Léo")).toMatchObject({
      parties: 2,
      victoires: 1,
      points: 380,
      moyenne: 190,
      meilleur: 260,
    })
  })

  it("compte une victoire à chacun des ex æquo", () => {
    const classement = statistiques([partie(["Suzie", "Léo"], [200, 200])])
    expect(fiche(classement, "Suzie").victoires).toBe(1)
    expect(fiche(classement, "Léo").victoires).toBe(1)
  })

  it("regroupe un même joueur malgré la casse et les espaces", () => {
    const classement = statistiques([
      partie(["Suzie", "Léo"], [300, 120]),
      partie([" suzie ", "Léo"], [200, 400]),
    ])

    expect(classement).toHaveLength(2)
    expect(fiche(classement, "Suzie")).toMatchObject({ parties: 2, points: 500 })
  })

  it("retient l'orthographe la plus récente", () => {
    // Le journal arrive du plus récent au plus ancien.
    const classement = statistiques([
      partie(["SUZIE"], [100]),
      partie(["suzie"], [100]),
    ])
    expect(classement[0]?.nom).toBe("SUZIE")
  })

  it("ignore les noms vides", () => {
    const classement = statistiques([partie(["Suzie", "   "], [300, 120])])
    expect(classement).toHaveLength(1)
  })

  it("classe par victoires, puis par moyenne", () => {
    const classement = statistiques([
      partie(["Suzie", "Léo", "Nour"], [500, 100, 300]),
      partie(["Suzie", "Léo", "Nour"], [400, 100, 350]),
    ])
    expect(classement.map((f) => f.nom)).toEqual(["Suzie", "Nour", "Léo"])
  })

  it("départage deux joueurs à égalité de victoires par la moyenne", () => {
    const classement = statistiques([
      partie(["Suzie", "Nour"], [500, 100]),
      partie(["Léo", "Nour"], [200, 100]),
    ])
    // Une victoire chacun : Suzie passe devant Léo par la moyenne.
    expect(classement.map((f) => f.nom)).toEqual(["Suzie", "Léo", "Nour"])
  })

  it("prend en compte un joueur absent de certaines parties", () => {
    const classement = statistiques([
      partie(["Suzie", "Léo"], [300, 120]),
      partie(["Suzie", "Nour"], [100, 260]),
    ])
    expect(fiche(classement, "Léo").parties).toBe(1)
    expect(fiche(classement, "Nour")).toMatchObject({ parties: 1, victoires: 1 })
  })

  it("tolère un total manquant sans casser le cumul", () => {
    const classement = statistiques([partie(["Suzie", "Léo"], [300])])
    expect(fiche(classement, "Léo")).toMatchObject({ parties: 1, points: 0 })
  })
})
