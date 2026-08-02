/**
 * Équipage enregistré et journal des parties terminées.
 *
 * Deux clés `localStorage` distinctes de celle de la partie en cours :
 * terminer ou abandonner une partie ne doit jamais emporter le palmarès.
 * Le calcul du classement global reste dans `engine/palmares.ts`.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Partie, PartieArchivee } from "../engine/types"
import { cleJoueur, statistiques } from "../engine/palmares"

const CLE_EQUIPAGE = "skullking:equipage"
const CLE_PARTIES = "skullking:palmares"

/** Au-delà, les parties les plus anciennes sortent du journal. */
const PARTIES_MAX = 200
/** Au-delà, les noms les moins récemment joués sortent de l'équipage. */
const EQUIPAGE_MAX = 30

/* ═══════════ Persistance ═══════════ */

/** Lecture tolérante : une sauvegarde abîmée ne doit jamais bloquer l'appli. */
function lire<T>(cle: string, valide: (lu: unknown) => lu is T, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle)
    if (!brut) return defaut
    const lu: unknown = JSON.parse(brut)
    return valide(lu) ? lu : defaut
  } catch {
    return defaut
  }
}

function estListeDeNoms(lu: unknown): lu is string[] {
  return Array.isArray(lu) && lu.every((n) => typeof n === "string")
}

function estJournal(lu: unknown): lu is PartieArchivee[] {
  return (
    Array.isArray(lu) &&
    lu.every(
      (p) =>
        p !== null &&
        typeof p === "object" &&
        Array.isArray((p as PartieArchivee).joueurs) &&
        Array.isArray((p as PartieArchivee).totaux),
    )
  )
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur))
  } catch {
    // Mode privé ou quota atteint : le palmarès vit en mémoire pour la session.
  }
}

/** Identifiant local, sans dépendance à `crypto` — absent de certaines webviews. */
function identifiant(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Place `noms` en tête de l'équipage, sans doublon.
 * Les derniers joueurs sont ceux qu'on retrouvera le plus souvent à la table
 * suivante : ils doivent rester à portée de pouce.
 */
function fusionner(equipage: string[], noms: string[]): string[] {
  const propres = noms.map((n) => n.trim()).filter(Boolean)
  const ajoutes = new Set(propres.map(cleJoueur))
  const restants = equipage.filter((n) => !ajoutes.has(cleJoueur(n)))
  return [...propres, ...restants].slice(0, EQUIPAGE_MAX)
}

/* ═══════════ Hook ═══════════ */

export function usePalmares() {
  const [equipage, setEquipage] = useState<string[]>(() =>
    lire(CLE_EQUIPAGE, estListeDeNoms, []),
  )
  const [parties, setParties] = useState<PartieArchivee[]>(() =>
    lire(CLE_PARTIES, estJournal, []),
  )

  useEffect(() => ecrire(CLE_EQUIPAGE, equipage), [equipage])
  useEffect(() => ecrire(CLE_PARTIES, parties), [parties])

  /** Retient des noms sans lancer de partie — utile dès la mise en place. */
  const memoriser = useCallback((noms: string[]) => {
    setEquipage((liste) => fusionner(liste, noms))
  }, [])

  const oublierJoueur = useCallback((nom: string) => {
    setEquipage((liste) => liste.filter((n) => cleJoueur(n) !== cleJoueur(nom)))
  }, [])

  /**
   * Archive une partie terminée et remet son équipage en tête.
   * Le journal est stocké du plus récent au plus ancien.
   */
  const archiver = useCallback((partie: Partie, totaux: number[]) => {
    const archive: PartieArchivee = {
      id: identifiant(),
      date: new Date().toISOString(),
      joueurs: partie.joueurs,
      systeme: partie.systeme,
      totaux,
      manches: partie.manches.length,
    }
    setParties((liste) => [archive, ...liste].slice(0, PARTIES_MAX))
    setEquipage((liste) => fusionner(liste, partie.joueurs))
  }, [])

  const oublierPartie = useCallback((id: string) => {
    setParties((liste) => liste.filter((p) => p.id !== id))
  }, [])

  const viderJournal = useCallback(() => setParties([]), [])

  const classementGlobal = useMemo(() => statistiques(parties), [parties])

  return {
    equipage,
    parties,
    classementGlobal,
    memoriser,
    oublierJoueur,
    archiver,
    oublierPartie,
    viderJournal,
  }
}

export type Palmares = ReturnType<typeof usePalmares>
