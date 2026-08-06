import { describe, expect, it } from "vitest"
import type { Alliance, Entree, Manche, OptionsPartie, Systeme } from "../types"
import {
  bonusBrut,
  cartesDeLaManche,
  cartesMaximum,
  miseEffective,
  compterAlliancesReussies,
  plisADistribuer,
  scorerEntree,
  scorerManche,
  taillePaquet,
  totaux,
  trajectoires,
  verifierPlis,
} from "../scoring"
import {
  CARTES_BALEINE_BLANCHE,
  calendrierDe,
  CARTES_BUTIN,
  CARTES_KRAKEN,
  FORMATS_MANCHES,
  PAQUET_BASE,
  PAQUET_EXTENSIONS,
} from "../rules"

/* ═══════════ Fabriques ═══════════ */

/** Entrée vierge, surchargée par ce que le test veut mettre en avant. */
function entree(champs: Partial<Entree> = {}): Entree {
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
    harry: 0,
    ...champs,
  }
}

function options(champs: Partial<OptionsPartie> = {}): OptionsPartie {
  return {
    bonusSiMiseExacte: false,
    bouletActif: false,
    butin: false,
    kraken: false,
    baleineBlanche: false,
    pouvoirsPirates: false,
    ...champs,
  }
}

/** Les trois extensions ensemble — l'ancien drapeau « extensions ». */
function toutesExtensions(champs: Partial<OptionsPartie> = {}): OptionsPartie {
  return options({ butin: true, kraken: true, baleineBlanche: true, ...champs })
}

function manche(
  cartes: number,
  entrees: Entree[],
  alliances: Alliance[] = [],
  plisDetruits = 0,
): Manche {
  return { cartes, entrees, alliances, plisDetruits }
}

/** Raccourci : score total d'une entrée isolée, sans alliance. */
function total(
  e: Entree,
  cartes: number,
  systeme: Systeme = "skullking",
  opts: OptionsPartie = options(),
): number {
  return scorerEntree(e, cartes, 0, systeme, opts).total
}

/* ═══════════ Système Skull King ═══════════ */

describe("système Skull King — points de mise", () => {
  it("mise de 3 tenue sur 5 cartes rapporte 60", () => {
    expect(total(entree({ mise: 3, plis: 3 }), 5)).toBe(60)
  })

  it("mise de 1 tenue rapporte 20", () => {
    expect(total(entree({ mise: 1, plis: 1 }), 5)).toBe(20)
  })

  it("mise de 2 pour 4 plis pris coûte 20", () => {
    expect(total(entree({ mise: 2, plis: 4 }), 10)).toBe(-20)
  })

  it("une mise ratée ne rapporte rien pour les plis pris", () => {
    // Mise 3, 5 plis : l'écart de 2 coûte 20 points, les 5 plis ne rapportent rien.
    expect(total(entree({ mise: 3, plis: 5 }), 10)).toBe(-20)
  })

  it("une mise ratée par défaut coûte autant qu'une mise ratée par excès", () => {
    expect(total(entree({ mise: 5, plis: 3 }), 10)).toBe(-20)
  })

  it("mise à zéro tenue à la manche 7 rapporte 70", () => {
    expect(total(entree({ mise: 0, plis: 0 }), 7)).toBe(70)
  })

  it("mise à zéro et 2 plis pris à la manche 9 coûte 90", () => {
    expect(total(entree({ mise: 0, plis: 2 }), 9)).toBe(-90)
  })

  it("la mise à zéro ratée coûte le même prix quel que soit le nombre de plis pris", () => {
    // La pénalité dépend des cartes distribuées, jamais de l'écart.
    expect(total(entree({ mise: 0, plis: 1 }), 9)).toBe(-90)
    expect(total(entree({ mise: 0, plis: 5 }), 9)).toBe(-90)
  })

  it("la mise à zéro n'est pas 20 × 0", () => {
    expect(total(entree({ mise: 0, plis: 0 }), 3)).not.toBe(0)
    expect(total(entree({ mise: 0, plis: 0 }), 3)).toBe(30)
  })
})

/* ═══════════ Système Rascal ═══════════ */

describe("système Rascal — chevrotine", () => {
  const rascal = (e: Entree, cartes: number, opts = options()) =>
    total(e, cartes, "rascal", opts)

  it("coup direct sur 4 cartes rapporte 40", () => {
    expect(rascal(entree({ mise: 2, plis: 2 }), 4)).toBe(40)
  })

  it("frappe à revers sur 4 cartes rapporte 20", () => {
    expect(rascal(entree({ mise: 1, plis: 2 }), 4)).toBe(20)
  })

  it("échec cuisant sur 4 cartes ne rapporte rien", () => {
    expect(rascal(entree({ mise: 4, plis: 2 }), 4)).toBe(0)
  })

  it("le potentiel ne dépend pas de la mise", () => {
    // Exemple A du livret : 3 cartes, mises de 0, 1 et 2, toutes tenues.
    expect(rascal(entree({ mise: 0, plis: 0 }), 3)).toBe(30)
    expect(rascal(entree({ mise: 1, plis: 1 }), 3)).toBe(30)
    expect(rascal(entree({ mise: 2, plis: 2 }), 3)).toBe(30)
  })

  it("la mise à zéro ne bénéficie d'aucune règle particulière", () => {
    // Contrairement au système Skull King, zéro raté suit le multiplicateur.
    expect(rascal(entree({ mise: 0, plis: 1 }), 4)).toBe(20)
    expect(rascal(entree({ mise: 0, plis: 2 }), 4)).toBe(0)
  })

  it("reproduit l'exemple B du livret", () => {
    // 4 cartes : Suzie mise juste, Félix se trompe de 1, Pauline de 2.
    expect(rascal(entree({ mise: 1, plis: 1 }), 4)).toBe(40)
    expect(rascal(entree({ mise: 0, plis: 1 }), 4)).toBe(20)
    expect(rascal(entree({ mise: 4, plis: 2 }), 4)).toBe(0)
  })

  it("les bonus suivent le multiplicateur : 30 avec un écart de 1 donne 15", () => {
    const e = entree({ mise: 1, plis: 2, piratesCaptures: 1 })
    const score = scorerEntree(e, 4, 0, "rascal", options())
    expect(score.bonus).toBe(15)
    expect(score.total).toBe(35) // 20 de base + 15 de bonus
  })

  it("les bonus sont perdus en cas d'échec cuisant", () => {
    const e = entree({ mise: 4, plis: 2, piratesCaptures: 1 })
    expect(rascal(e, 4)).toBe(0)
  })
})

describe("système Rascal — boulet de canon", () => {
  const opts = options({ bouletActif: true })

  it("mise exacte sur 6 cartes rapporte 90", () => {
    expect(total(entree({ mise: 3, plis: 3, boulet: true }), 6, "rascal", opts)).toBe(90)
  })

  it("un écart de 1 ne rapporte rien : pas de demi-part", () => {
    expect(total(entree({ mise: 3, plis: 4, boulet: true }), 6, "rascal", opts)).toBe(0)
  })

  it("les bonus suivent le tout ou rien du boulet", () => {
    const rate = entree({ mise: 3, plis: 4, boulet: true, piratesCaptures: 1 })
    expect(total(rate, 6, "rascal", opts)).toBe(0)

    const tenue = entree({ mise: 3, plis: 3, boulet: true, piratesCaptures: 1 })
    expect(total(tenue, 6, "rascal", opts)).toBe(120) // 90 + 30
  })

  it("la chevrotine reste le comportement par défaut", () => {
    expect(total(entree({ mise: 3, plis: 4, boulet: false }), 6, "rascal", opts)).toBe(30)
  })

  it("le boulet est ignoré si l'option est désactivée", () => {
    const e = entree({ mise: 3, plis: 3, boulet: true })
    expect(total(e, 6, "rascal", options({ bouletActif: false }))).toBe(60)
  })

  it("le boulet n'a aucun effet dans le système Skull King", () => {
    const e = entree({ mise: 3, plis: 3, boulet: true })
    expect(total(e, 6, "skullking", opts)).toBe(60)
  })
})

/* ═══════════ Points bonus ═══════════ */

describe("points bonus — barème", () => {
  it("applique le barème unitaire de chaque bonus", () => {
    expect(bonusBrut(entree({ quatorzeCouleur: 1 }))).toBe(10)
    expect(bonusBrut(entree({ quatorzeCouleur: 3 }))).toBe(30)
    expect(bonusBrut(entree({ quatorzeNoir: true }))).toBe(20)
    expect(bonusBrut(entree({ sirenesCapturees: 1 }))).toBe(20)
    expect(bonusBrut(entree({ sirenesCapturees: 2 }))).toBe(40)
    expect(bonusBrut(entree({ piratesCaptures: 1 }))).toBe(30)
    expect(bonusBrut(entree({ piratesCaptures: 6 }))).toBe(180)
    expect(bonusBrut(entree({ skullKingCapture: true }))).toBe(40)
  })

  it("cumule les bonus d'une même manche", () => {
    const e = entree({
      quatorzeCouleur: 3,
      quatorzeNoir: true,
      sirenesCapturees: 2,
      piratesCaptures: 6,
      skullKingCapture: true,
    })
    expect(bonusBrut(e)).toBe(30 + 20 + 40 + 180 + 40)
  })

  it("une entrée sans bonus vaut zéro", () => {
    expect(bonusBrut(entree())).toBe(0)
  })

  it("l'alliance Butin n'entre pas dans le bonus brut", () => {
    // Le bonus d'alliance dépend de la manche, pas de l'entrée seule.
    expect(bonusBrut(entree({ quatorzeNoir: true }))).toBe(20)
  })

  it("reproduit l'exemple du livret : sirène capturant le Skull King avec un 14 jaune", () => {
    const pippa = entree({ mise: 1, plis: 1, quatorzeCouleur: 1, skullKingCapture: true })
    const score = scorerEntree(pippa, 1, 0, "skullking", options())
    expect(score.bonus).toBe(50) // 10 pour le 14 jaune, 40 pour le Skull King
  })
})

describe("points bonus — condition de mise", () => {
  it("les bonus sont acquis malgré une mise ratée (règle 2022)", () => {
    const e = entree({ mise: 2, plis: 4, quatorzeNoir: true, piratesCaptures: 1 })
    const score = scorerEntree(e, 10, 0, "skullking", options())
    expect(score.base).toBe(-20)
    expect(score.bonus).toBe(50)
    expect(score.total).toBe(30)
  })

  it("les bonus sont annulés si bonusSiMiseExacte est actif et la mise ratée", () => {
    const e = entree({ mise: 2, plis: 4, quatorzeNoir: true, piratesCaptures: 1 })
    const score = scorerEntree(e, 10, 0, "skullking", options({ bonusSiMiseExacte: true }))
    expect(score.base).toBe(-20)
    expect(score.bonus).toBe(0)
    expect(score.total).toBe(-20)
  })

  it("bonusSiMiseExacte laisse les bonus intacts quand la mise est tenue", () => {
    const e = entree({ mise: 2, plis: 2, quatorzeNoir: true })
    const score = scorerEntree(e, 10, 0, "skullking", options({ bonusSiMiseExacte: true }))
    expect(score.bonus).toBe(20)
    expect(score.total).toBe(60)
  })

  it("une mise à zéro ratée conserve ses bonus par défaut", () => {
    const e = entree({ mise: 0, plis: 1, quatorzeNoir: true })
    expect(total(e, 9)).toBe(-70) // -90 de mise, +20 de bonus
  })
})

/* ═══════════ Alliance Butin ═══════════ */

describe("alliance Butin", () => {
  it("paie 20 points à chacun quand les deux alliés réussissent", () => {
    const m = manche(
      5,
      [entree({ mise: 2, plis: 2 }), entree({ mise: 1, plis: 1 })],
      [[0, 1]],
    )
    expect(compterAlliancesReussies(m, 0)).toBe(1)
    expect(compterAlliancesReussies(m, 1)).toBe(1)

    const scores = scorerManche(m, "skullking", options())
    expect(scores[0]?.bonus).toBe(20)
    expect(scores[1]?.bonus).toBe(20)
  })

  it("ne paie personne si un seul des deux alliés réussit", () => {
    const m = manche(
      5,
      [entree({ mise: 2, plis: 2 }), entree({ mise: 1, plis: 3 })],
      [[0, 1]],
    )
    expect(compterAlliancesReussies(m, 0)).toBe(0)
    expect(compterAlliancesReussies(m, 1)).toBe(0)

    const scores = scorerManche(m, "skullking", options())
    expect(scores[0]?.bonus).toBe(0)
    expect(scores[1]?.bonus).toBe(0)
  })

  it("ne paie pas si l'un des alliés n'a pas encore misé", () => {
    const m = manche(
      5,
      [entree({ mise: 2, plis: 2 }), entree({ mise: null, plis: null })],
      [[0, 1]],
    )
    expect(compterAlliancesReussies(m, 0)).toBe(0)
  })

  it("ne concerne pas les joueurs hors de l'alliance", () => {
    const m = manche(
      5,
      [
        entree({ mise: 2, plis: 2 }),
        entree({ mise: 1, plis: 1 }),
        entree({ mise: 1, plis: 1 }),
      ],
      [[0, 1]],
    )
    expect(compterAlliancesReussies(m, 2)).toBe(0)
    expect(scorerManche(m, "skullking", options())[2]?.bonus).toBe(0)
  })

  it("cumule deux alliances réussies pour un même joueur", () => {
    const m = manche(
      5,
      [
        entree({ mise: 2, plis: 2 }),
        entree({ mise: 1, plis: 1 }),
        entree({ mise: 1, plis: 1 }),
      ],
      [
        [0, 1],
        [0, 2],
      ],
    )
    expect(compterAlliancesReussies(m, 0)).toBe(2)
    expect(scorerManche(m, "skullking", options())[0]?.bonus).toBe(40)
  })

  it("reste payée même si bonusSiMiseExacte est actif, la mise étant tenue par construction", () => {
    const m = manche(
      5,
      [entree({ mise: 2, plis: 2 }), entree({ mise: 1, plis: 1 })],
      [[0, 1]],
    )
    const scores = scorerManche(m, "skullking", options({ bonusSiMiseExacte: true }))
    expect(scores[0]?.bonus).toBe(20)
  })
})

/* ═══════════ Rascal le Flambeur ═══════════ */

describe("Rascal le Flambeur", () => {
  const pouvoirsPirates = options({ pouvoirsPirates: true })

  it("un pari de 20 avec une mise ratée coûte 20", () => {
    const e = entree({ mise: 2, plis: 4, flambeur: 20 })
    const score = scorerEntree(e, 10, 0, "skullking", pouvoirsPirates)
    expect(score.flambeur).toBe(-20)
    expect(score.total).toBe(-40) // -20 de mise, -20 de pari
  })

  it("un pari de 20 avec une mise tenue rapporte 20", () => {
    const e = entree({ mise: 2, plis: 2, flambeur: 20 })
    const score = scorerEntree(e, 10, 0, "skullking", pouvoirsPirates)
    expect(score.flambeur).toBe(20)
    expect(score.total).toBe(60) // 40 de mise, 20 de pari
  })

  it("un pari de 10 suit la même règle", () => {
    expect(
      scorerEntree(entree({ mise: 1, plis: 1, flambeur: 10 }), 5, 0, "skullking", pouvoirsPirates)
        .flambeur,
    ).toBe(10)
    expect(
      scorerEntree(entree({ mise: 1, plis: 2, flambeur: 10 }), 5, 0, "skullking", pouvoirsPirates)
        .flambeur,
    ).toBe(-10)
  })

  it("un pari de 0 ne change rien", () => {
    const e = entree({ mise: 2, plis: 4, flambeur: 0 })
    expect(scorerEntree(e, 10, 0, "skullking", pouvoirsPirates).flambeur).toBe(0)
  })

  it("est ignoré si l'option est désactivée", () => {
    const e = entree({ mise: 2, plis: 4, flambeur: 20 })
    const score = scorerEntree(e, 10, 0, "skullking", options({ pouvoirsPirates: false }))
    expect(score.flambeur).toBe(0)
    expect(score.total).toBe(-20)
  })

  it("n'est pas soumis au multiplicateur Rascal", () => {
    // Frappe à revers : la base est réduite de moitié, pas le pari.
    const e = entree({ mise: 1, plis: 2, flambeur: 20 })
    const score = scorerEntree(e, 4, 0, "rascal", pouvoirsPirates)
    expect(score.base).toBe(20)
    expect(score.flambeur).toBe(-20)
    expect(score.total).toBe(0)
  })

  it("n'est pas soumis au tout ou rien du boulet", () => {
    const e = entree({ mise: 3, plis: 3, boulet: true, flambeur: 20 })
    const opts = options({ pouvoirsPirates: true, bouletActif: true })
    expect(scorerEntree(e, 6, 0, "rascal", opts).total).toBe(110) // 90 + 20
  })
})

/* ═══════════ Décomposition du score ═══════════ */

describe("décomposition du score", () => {
  it("expose base, bonus, flambeur et leur somme", () => {
    const e = entree({ mise: 2, plis: 2, quatorzeNoir: true, flambeur: 10 })
    const score = scorerEntree(e, 5, 0, "skullking", options({ pouvoirsPirates: true }))
    expect(score).toEqual({
      base: 40,
      bonus: 20,
      flambeur: 10,
      total: 70,
      exacte: true,
      ecart: 0,
    })
  })

  it("expose l'écart et l'exactitude de la mise", () => {
    const score = scorerEntree(entree({ mise: 2, plis: 5 }), 10, 0, "skullking", options())
    expect(score.exacte).toBe(false)
    expect(score.ecart).toBe(3)
  })

  it("traite une mise non saisie comme zéro", () => {
    // Sécurité : une manche corrigée peut contenir une saisie incomplète.
    const score = scorerEntree(entree({ mise: null, plis: null }), 5, 0, "skullking", options())
    expect(score.ecart).toBe(0)
    expect(score.exacte).toBe(true)
  })
})

/* ═══════════ Manche entière et totaux ═══════════ */

describe("score d'une manche", () => {
  it("rend un score par joueur, dans l'ordre des joueurs", () => {
    const m = manche(5, [
      entree({ mise: 3, plis: 3 }),
      entree({ mise: 0, plis: 0 }),
      entree({ mise: 2, plis: 4 }),
    ])
    expect(scorerManche(m, "skullking", options()).map((s) => s.total)).toEqual([60, 50, -20])
  })

  it("utilise le nombre de cartes de la manche", () => {
    const e = [entree({ mise: 0, plis: 0 })]
    expect(scorerManche(manche(7, e), "skullking", options())[0]?.total).toBe(70)
    expect(scorerManche(manche(9, e), "skullking", options())[0]?.total).toBe(90)
  })
})

describe("totaux cumulés", () => {
  it("additionne les manches validées", () => {
    const manches = [
      manche(5, [entree({ mise: 3, plis: 3 }), entree({ mise: 2, plis: 4 })]),
      manche(7, [entree({ mise: 0, plis: 0 }), entree({ mise: 1, plis: 1 })]),
    ]
    expect(totaux(manches, 2, "skullking", options())).toEqual([130, 0])
  })

  it("rend des zéros quand aucune manche n'est validée", () => {
    expect(totaux([], 3, "skullking", options())).toEqual([0, 0, 0])
  })
})

/* ═══════════ Paquet et plafond de cartes ═══════════ */

describe("paquet et plafond de cartes", () => {
  it("compte 70 cartes sans extension, 74 avec les trois", () => {
    expect(taillePaquet(options())).toBe(PAQUET_BASE)
    expect(taillePaquet(toutesExtensions())).toBe(PAQUET_EXTENSIONS)
  })

  it("n'ajoute que les cartes des extensions retenues", () => {
    expect(taillePaquet(options({ butin: true }))).toBe(PAQUET_BASE + CARTES_BUTIN)
    expect(taillePaquet(options({ kraken: true }))).toBe(PAQUET_BASE + CARTES_KRAKEN)
    expect(taillePaquet(options({ baleineBlanche: true }))).toBe(
      PAQUET_BASE + CARTES_BALEINE_BLANCHE,
    )
    expect(taillePaquet(options({ kraken: true, baleineBlanche: true }))).toBe(72)
  })

  it("plafonne les cartes distribuées à floor(paquet / joueurs)", () => {
    expect(cartesMaximum(2, options())).toBe(35)
    expect(cartesMaximum(6, options())).toBe(11)
    expect(cartesMaximum(8, options())).toBe(8)
    expect(cartesMaximum(10, options())).toBe(7)
  })

  it("tient compte des cartes d'extension", () => {
    expect(cartesMaximum(8, toutesExtensions())).toBe(9)
  })

  it("distribue au moins une carte, même à dix joueurs", () => {
    expect(cartesMaximum(10, options())).toBeGreaterThanOrEqual(1)
  })

  it("n'ampute pas une manche qui tient dans le paquet", () => {
    // Six joueurs : le plafond de 11 laisse les dix manches intactes.
    expect(cartesDeLaManche(FORMATS_MANCHES.classique, 9, 6, options())).toBe(10)
  })

  it("ampute les dernières manches quand le paquet ne suit plus", () => {
    // Huit joueurs : plafond de 8, les manches 9 et 10 sont réduites.
    expect(cartesDeLaManche(FORMATS_MANCHES.classique, 7, 8, options())).toBe(8)
    expect(cartesDeLaManche(FORMATS_MANCHES.classique, 8, 8, options())).toBe(8)
    expect(cartesDeLaManche(FORMATS_MANCHES.classique, 9, 8, options())).toBe(8)
  })

  it("rend zéro pour une manche hors du calendrier", () => {
    expect(cartesDeLaManche(FORMATS_MANCHES.heureDuDodo, 1, 4, options())).toBe(0)
  })
})

/* ═══════════ Cohérence de la saisie ═══════════ */

describe("cohérence des plis", () => {
  const trois = (plis: (number | null)[]) =>
    plis.map((p) => entree({ mise: 0, plis: p }))

  it("signale une saisie incomplète", () => {
    expect(verifierPlis(manche(5, trois([2, null, 1])), 3)).toEqual({ etat: "incomplet" })
  })

  it("valide une somme égale au nombre de cartes", () => {
    expect(verifierPlis(manche(5, trois([2, 2, 1])), 3)).toEqual({ etat: "exact" })
  })

  it("refuse toujours plus de plis que de cartes", () => {
    expect(verifierPlis(manche(5, trois([3, 2, 1])), 3)).toEqual({
      etat: "excedentaires",
      ecart: 1,
    })
  })

  it("refuse des plis manquants tant qu'aucun n'est déclaré dévoré", () => {
    expect(verifierPlis(manche(5, trois([2, 1, 1])), 3)).toEqual({
      etat: "manquants",
      ecart: 1,
      tolere: false,
    })
  })

  it("valide le compte quand le pli manquant est déclaré dévoré", () => {
    expect(verifierPlis(manche(5, trois([2, 1, 1]), [], 1), 3)).toEqual({ etat: "exact" })
  })

  it("refuse un excédent par rapport aux plis restants après un pli dévoré", () => {
    // 5 cartes, 1 pli dévoré : il n'en reste que 4 à répartir.
    expect(verifierPlis(manche(5, trois([2, 2, 1]), [], 1), 3)).toEqual({
      etat: "excedentaires",
      ecart: 1,
    })
  })

  it("compte encore les plis manquants au-delà de ceux déclarés dévorés", () => {
    // 5 cartes, 1 dévoré, 4 attendus, 3 saisis.
    expect(verifierPlis(manche(5, trois([2, 1, 0]), [], 1), 3)).toEqual({
      etat: "manquants",
      ecart: 1,
      tolere: false,
    })
  })

  it("tolère des plis manquants à deux joueurs : Barbe Grise en remporte sans marquer", () => {
    const m = manche(5, [entree({ mise: 0, plis: 2 }), entree({ mise: 0, plis: 1 })])
    expect(verifierPlis(m, 2)).toEqual({ etat: "manquants", ecart: 2, tolere: true })
  })
})

/* ═══════════ Plis à répartir ═══════════ */

describe("plis à distribuer", () => {
  const vide = (n: number) => Array.from({ length: n }, () => entree())

  it("rend toutes les cartes quand rien n'est dévoré", () => {
    expect(plisADistribuer(manche(7, vide(3)))).toBe(7)
  })

  it("retire les plis dévorés", () => {
    expect(plisADistribuer(manche(7, vide(3), [], 2))).toBe(5)
  })

  it("ne descend jamais sous zéro", () => {
    expect(plisADistribuer(manche(1, vide(3), [], 2))).toBe(0)
  })
})

/* ═══════════ Formats de manches ═══════════ */

describe("formats de manches", () => {
  it("respecte les calendriers de CLAUDE.md", () => {
    expect(FORMATS_MANCHES.classique).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(FORMATS_MANCHES.pasDImpair).toEqual([2, 4, 6, 8, 10])
    expect(FORMATS_MANCHES.pretAuCombat).toEqual([6, 7, 8, 9, 10])
    expect(FORMATS_MANCHES.attaqueEclair).toEqual([5, 5, 5, 5, 5])
    expect(FORMATS_MANCHES.tirDeBarrage).toEqual(Array<number>(10).fill(10))
    expect(FORMATS_MANCHES.tourbillon).toEqual([9, 7, 5, 3, 1])
    expect(FORMATS_MANCHES.heureDuDodo).toEqual([1])
  })

  it("ne propose que des manches d'au moins une carte", () => {
    for (const calendrier of Object.values(FORMATS_MANCHES)) {
      expect(calendrier.length).toBeGreaterThan(0)
      for (const cartes of calendrier) expect(cartes).toBeGreaterThanOrEqual(1)
    }
  })
})

/* ═══════════ Longueur de partie ═══════════ */

describe("calendrier d'une partie écourtée", () => {
  it("rend le format entier quand on demande toutes les manches", () => {
    expect(calendrierDe("classique", 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it("coupe la fin, pas le début : les manches courtes mettent en jambes", () => {
    expect(calendrierDe("classique", 6)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("s'applique à n'importe quel format", () => {
    expect(calendrierDe("tourbillon", 3)).toEqual([9, 7, 5])
    expect(calendrierDe("pretAuCombat", 2)).toEqual([6, 7])
  })

  it("ne dépasse jamais la longueur du format", () => {
    expect(calendrierDe("pasDImpair", 99)).toEqual([2, 4, 6, 8, 10])
    expect(calendrierDe("heureDuDodo", 5)).toEqual([1])
  })

  it("garde toujours au moins une manche", () => {
    expect(calendrierDe("classique", 0)).toEqual([1])
    expect(calendrierDe("classique", -3)).toEqual([1])
  })
})

/* ═══════════ Trajectoires ═══════════ */

describe("trajectoires", () => {
  const trois = (mises: number[], plis: number[]) =>
    mises.map((mise, i) => entree({ mise, plis: plis[i] ?? 0 }))

  it("part de zéro pour tout le monde", () => {
    expect(trajectoires([], 3, "skullking", options())).toEqual([[0], [0], [0]])
  })

  it("donne un point de plus qu'il n'y a de manches", () => {
    const m = [manche(1, trois([1, 0, 0], [1, 0, 0]))]
    const courbes = trajectoires(m, 3, "skullking", options())
    expect(courbes[0]).toHaveLength(2)
  })

  it("cumule manche après manche", () => {
    const m = [
      manche(1, trois([1, 0, 0], [1, 0, 0])), // +20, +10, +10
      manche(2, trois([2, 0, 0], [2, 0, 0])), // +40, +20, +20
    ]
    const courbes = trajectoires(m, 3, "skullking", options())
    expect(courbes[0]).toEqual([0, 20, 60])
    expect(courbes[1]).toEqual([0, 10, 30])
  })

  it("suit une chute sous zéro", () => {
    // Mise 0 ratée à 9 cartes : −90, puis mise 1 tenue : +20.
    const m = [
      manche(9, trois([0, 0, 0], [2, 0, 0])),
      manche(1, trois([1, 0, 0], [1, 0, 0])),
    ]
    const courbes = trajectoires(m, 3, "skullking", options())
    expect(courbes[0]).toEqual([0, -90, -70])
  })

  it("s'accorde avec les totaux finaux", () => {
    const m = [
      manche(3, trois([1, 2, 0], [1, 1, 0])),
      manche(4, trois([2, 0, 1], [2, 0, 1])),
    ]
    const courbes = trajectoires(m, 3, "skullking", options())
    const finaux = totaux(m, 3, "skullking", options())
    expect(courbes.map((c) => c[c.length - 1])).toEqual(finaux)
  })
})

/* ═══════════ Pouvoir de Harry le Géant ═══════════ */

describe("Harry le Géant", () => {
  const harry = options({ pouvoirsPirates: true })

  it("rend la mise annoncée quand l'option est inactive", () => {
    const e = entree({ mise: 2, harry: 1 })
    expect(miseEffective(e, 5, options())).toBe(2)
  })

  it("ajoute ou retire un pli à la mise", () => {
    expect(miseEffective(entree({ mise: 2, harry: 1 }), 5, harry)).toBe(3)
    expect(miseEffective(entree({ mise: 2, harry: -1 }), 5, harry)).toBe(1)
    expect(miseEffective(entree({ mise: 2, harry: 0 }), 5, harry)).toBe(2)
  })

  it("ne descend jamais sous zéro ni au-dessus des cartes en jeu", () => {
    expect(miseEffective(entree({ mise: 0, harry: -1 }), 5, harry)).toBe(0)
    expect(miseEffective(entree({ mise: 5, harry: 1 }), 5, harry)).toBe(5)
  })

  it("rattrape une mise ratée d'un pli", () => {
    // Mise 2 pour 3 plis pris : ratée à −10. Ajustée à 3, elle est tenue.
    const ratee = entree({ mise: 2, plis: 3 })
    expect(total(ratee, 5, "skullking", harry)).toBe(-10)

    const rattrapee = entree({ mise: 2, plis: 3, harry: 1 })
    expect(total(rattrapee, 5, "skullking", harry)).toBe(60)
  })

  it("peut aussi faire rater une mise tenue", () => {
    const tenue = entree({ mise: 2, plis: 2, harry: 1 })
    expect(total(tenue, 5, "skullking", harry)).toBe(-10)
  })

  it("bascule la mise à zéro vers sa formule à part", () => {
    // Mise 1 pour 0 pli : ratée. Ajustée à 0, c'est 10 points par carte.
    const e = entree({ mise: 1, plis: 0, harry: -1 })
    expect(total(e, 7, "skullking", harry)).toBe(70)
  })

  it("s'applique aussi au système Rascal", () => {
    // Écart de 1 sur 4 cartes vaut 20 ; ramené à zéro, il vaut 40.
    const e = entree({ mise: 1, plis: 2, harry: 1 })
    expect(total(e, 4, "rascal", harry)).toBe(40)
  })

  it("décide du sort du pari du Flambeur", () => {
    const opts = options({ pouvoirsPirates: true })
    const rattrapee = entree({ mise: 2, plis: 3, harry: 1, flambeur: 20 })
    // Mise tenue grâce à Harry : le pari est gagné, pas perdu.
    expect(scorerEntree(rattrapee, 5, 0, "skullking", opts).flambeur).toBe(20)
  })
})
