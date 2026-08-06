/**
 * Migration des sauvegardes.
 *
 * Une partie en cours sur un téléphone ne doit jamais être perdue par une
 * mise à jour : chaque forme historique de la sauvegarde doit se relire.
 */

import { describe, expect, it } from "vitest"
import { migrerManche, migrerOptions } from "../useGame"
import type { Manche } from "../../engine/types"

describe("migration des options", () => {
  it("convertit l'ancien drapeau « extensions » en trois cartes", () => {
    expect(migrerOptions({ extensions: true })).toMatchObject({
      butin: true,
      kraken: true,
      baleineBlanche: true,
    })
    expect(migrerOptions({ extensions: false })).toMatchObject({
      butin: false,
      kraken: false,
      baleineBlanche: false,
    })
  })

  it("regroupe les anciens pouvoirs réglés pirate par pirate", () => {
    expect(migrerOptions({ flambeurActif: true }).pouvoirsPirates).toBe(true)
    expect(migrerOptions({ harryActif: true }).pouvoirsPirates).toBe(true)
    expect(migrerOptions({ flambeurActif: false, harryActif: false }).pouvoirsPirates).toBe(
      false,
    )
  })

  it("respecte le réglage courant quand il existe déjà", () => {
    expect(migrerOptions({ pouvoirsPirates: true, flambeurActif: false }).pouvoirsPirates).toBe(
      true,
    )
  })

  it("donne une valeur à chaque option, même partant de rien", () => {
    const migrees = migrerOptions({})
    expect(Object.values(migrees).every((v) => typeof v === "boolean")).toBe(true)
    expect(Object.keys(migrees).sort()).toEqual([
      "baleineBlanche",
      "bonusSiMiseExacte",
      "bouletActif",
      "butin",
      "kraken",
      "pouvoirsPirates",
    ])
  })
})

describe("migration d'une manche", () => {
  /** Manche telle que l'écrivaient les versions antérieures. */
  const ancienne = {
    cartes: 3,
    alliances: [],
    entrees: [{ mise: 1, plis: 1 }, { mise: 0, plis: 2 }],
  } as unknown as Manche

  it("ajoute les plis dévorés absents des anciennes sauvegardes", () => {
    expect(migrerManche(ancienne).plisDetruits).toBe(0)
  })

  it("ajoute l'ajustement de Harry à chaque entrée", () => {
    expect(migrerManche(ancienne).entrees.every((e) => e.harry === 0)).toBe(true)
  })

  it("ne touche pas aux valeurs déjà présentes", () => {
    const recente = { ...ancienne, plisDetruits: 1 } as Manche
    expect(migrerManche(recente).plisDetruits).toBe(1)
  })

  it("conserve les mises et les plis", () => {
    const migree = migrerManche(ancienne)
    expect(migree.entrees.map((e) => [e.mise, e.plis])).toEqual([[1, 1], [0, 2]])
  })
})
