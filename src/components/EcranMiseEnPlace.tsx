/** Mise en place : joueurs, système de score, options, format de manches. */

import { useState } from "react"
import {
  FORMATS_MANCHES,
  JOUEURS_MAX,
  JOUEURS_MIN,
  LIBELLES_FORMATS,
  type FormatManches,
} from "../engine/rules"
import { cleJoueur } from "../engine/palmares"
import { cartesMaximum } from "../engine/scoring"
import type { OptionsPartie, Systeme } from "../engine/types"
import type { ConfigNouvellePartie } from "../state/useGame"

type Props = {
  onDemarrer: (config: ConfigNouvellePartie) => void
  /** Noms déjà rencontrés, du plus récent au plus ancien. */
  equipage: string[]
  onPalmares: () => void
}

export function EcranMiseEnPlace({ onDemarrer, equipage, onPalmares }: Props) {
  const [noms, setNoms] = useState<string[]>(["", "", ""])
  const [systeme, setSysteme] = useState<Systeme>("skullking")
  const [format, setFormat] = useState<FormatManches>("classique")
  const [options, setOptions] = useState<OptionsPartie>({
    bonusSiMiseExacte: false,
    bouletActif: false,
    extensions: false,
    flambeurActif: false,
  })

  const nomsValides = noms.map((n) => n.trim()).filter(Boolean)
  const pret = nomsValides.length >= JOUEURS_MIN

  const calendrier = FORMATS_MANCHES[format]
  const plafond = pret ? cartesMaximum(nomsValides.length, options.extensions) : 0
  const ampute = pret && calendrier.some((c) => c > plafond)

  const basculer = (cle: keyof OptionsPartie) =>
    setOptions((o) => ({ ...o, [cle]: !o[cle] }))

  const estEmbarque = (nom: string) => noms.some((n) => cleJoueur(n) === cleJoueur(nom))

  /**
   * Embarque ou débarque un joueur enregistré.
   * On vide la case au lieu de la supprimer : la disposition ne bouge pas
   * sous le pouce d'un toucher à l'autre.
   */
  const basculerJoueur = (nom: string) =>
    setNoms((liste) => {
      const dejaLa = liste.findIndex((n) => cleJoueur(n) === cleJoueur(nom))
      if (dejaLa >= 0) return liste.map((n, i) => (i === dejaLa ? "" : n))

      const libre = liste.findIndex((n) => !n.trim())
      if (libre >= 0) return liste.map((n, i) => (i === libre ? nom : n))
      if (liste.length >= JOUEURS_MAX) return liste
      return [...liste, nom]
    })

  // Les cases laissées vides ne créent pas de joueur fantôme.
  const demarrer = () => {
    if (pret) onDemarrer({ joueurs: nomsValides, systeme, options, format })
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32">
      <div className="flex items-start justify-between gap-3 pt-6">
        <div>
          <h1 className="pb-1 text-2xl font-bold text-or">Skull King</h1>
          <p className="pb-6 text-sm text-brume">Journal de bord — feuille de score</p>
        </div>
        <button
          type="button"
          onClick={onPalmares}
          className="min-h-11 shrink-0 rounded-xl border border-pont px-3 text-sm text-ecume"
        >
          Palmarès
        </button>
      </div>

      {/* ── Joueurs ── */}
      <section aria-labelledby="titre-joueurs" className="mb-6">
        <h2 id="titre-joueurs" className="mb-2 text-sm font-bold text-ecume">
          Équipage
          <span className="ml-2 font-normal text-brume">
            {nomsValides.length} / {JOUEURS_MAX}
          </span>
        </h2>

        {/* Rappeler l'équipage habituel évite de tout retaper à chaque soirée. */}
        {equipage.length > 0 && (
          <div role="group" aria-label="Joueurs enregistrés" className="mb-3 flex flex-wrap gap-1.5">
            {equipage.map((nom) => {
              const embarque = estEmbarque(nom)
              return (
                <button
                  key={nom}
                  type="button"
                  aria-pressed={embarque}
                  onClick={() => basculerJoueur(nom)}
                  className={[
                    "min-h-11 rounded-xl border px-3 text-sm",
                    embarque
                      ? "border-or bg-or text-abysse font-bold"
                      : "border-pont bg-coque text-brume",
                  ].join(" ")}
                >
                  {nom}
                </button>
              )
            })}
          </div>
        )}

        <div className="space-y-2">
          {noms.map((nom, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={nom}
                onChange={(e) =>
                  setNoms((liste) => liste.map((n, j) => (j === i ? e.target.value : n)))
                }
                placeholder={`Pirate ${i + 1}`}
                aria-label={`Nom du joueur ${i + 1}`}
                className="min-h-11 flex-1 rounded-xl border border-pont bg-coque px-3 text-ecume placeholder:text-brume/60"
              />
              {noms.length > JOUEURS_MIN && (
                <button
                  type="button"
                  onClick={() => setNoms((liste) => liste.filter((_, j) => j !== i))}
                  aria-label={`Retirer le joueur ${i + 1}`}
                  className="min-h-11 min-w-11 rounded-xl border border-pont text-brume"
                >
                  −
                </button>
              )}
            </div>
          ))}
        </div>
        {noms.length < JOUEURS_MAX && (
          <button
            type="button"
            onClick={() => setNoms((liste) => [...liste, ""])}
            className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-pont text-sm text-brume"
          >
            + Ajouter un joueur
          </button>
        )}
      </section>

      {/* ── Système de score ── */}
      <section aria-labelledby="titre-systeme" className="mb-6">
        <h2 id="titre-systeme" className="mb-2 text-sm font-bold text-ecume">
          Système de score
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["skullking", "Skull King", "Classique, tout ou rien"],
              ["rascal", "Rascal", "Équilibré, demi-parts"],
            ] as const
          ).map(([id, titre, detail]) => (
            <button
              key={id}
              type="button"
              aria-pressed={systeme === id}
              onClick={() => setSysteme(id)}
              className={[
                "min-h-11 rounded-xl border p-3 text-left",
                systeme === id ? "border-or bg-or/10" : "border-pont bg-coque",
              ].join(" ")}
            >
              <div className="text-sm font-bold text-ecume">{titre}</div>
              <div className="text-xs text-brume">{detail}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Format de manches ── */}
      <section aria-labelledby="titre-format" className="mb-6">
        <h2 id="titre-format" className="mb-2 text-sm font-bold text-ecume">
          Format
        </h2>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as FormatManches)}
          aria-label="Format de manches"
          className="min-h-11 w-full rounded-xl border border-pont bg-coque px-3 text-ecume"
        >
          {Object.entries(LIBELLES_FORMATS).map(([id, libelle]) => (
            <option key={id} value={id}>
              {libelle}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-brume">
          {calendrier.length} manche{calendrier.length > 1 ? "s" : ""} :{" "}
          {calendrier.join(" · ")} cartes
        </p>
        {ampute && (
          <p className="mt-1 text-xs text-or">
            Le paquet ne permet que {plafond} cartes par joueur : les dernières manches
            seront réduites.
          </p>
        )}
      </section>

      {/* ── Options ── */}
      <section aria-labelledby="titre-options" className="mb-6">
        <h2 id="titre-options" className="mb-2 text-sm font-bold text-ecume">
          Options
        </h2>
        <div className="space-y-2">
          {(
            [
              ["extensions", "Extensions", "Butin, Kraken, Baleine blanche"],
              [
                "bonusSiMiseExacte",
                "Bonus si mise exacte",
                "Variante ancienne édition : mise ratée, bonus perdus",
              ],
              ["flambeurActif", "Rascal le Flambeur", "Pari de 0, 10 ou 20 points"],
              ...(systeme === "rascal"
                ? ([["bouletActif", "Boulet de canon", "Rascal : 15 points par carte, tout ou rien"]] as const)
                : []),
            ] as const
          ).map(([cle, titre, detail]) => (
            <button
              key={cle}
              type="button"
              role="switch"
              aria-checked={options[cle]}
              onClick={() => basculer(cle)}
              className={[
                "flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left",
                options[cle] ? "border-or bg-or/10" : "border-pont bg-coque",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "grid h-6 w-6 shrink-0 place-items-center rounded-md border",
                  options[cle] ? "border-or bg-or text-abysse" : "border-pont",
                ].join(" ")}
              >
                {options[cle] ? "✓" : ""}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-ecume">{titre}</span>
                <span className="block text-xs text-brume">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Départ ── */}
      <div className="fixed inset-x-0 bottom-0 border-t border-pont bg-abysse/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={!pret}
            onClick={demarrer}
            className="min-h-14 w-full rounded-2xl bg-or text-lg font-bold text-abysse disabled:opacity-30"
          >
            Larguer les amarres
          </button>
          {!pret && (
            <p className="pt-2 text-center text-xs text-brume">
              Il faut au moins {JOUEURS_MIN} joueurs.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
