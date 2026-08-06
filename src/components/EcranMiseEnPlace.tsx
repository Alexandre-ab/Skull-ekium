/** Mise en place : joueurs, système de score, options, format de manches. */

import { useState } from "react"
import {
  CARTES_BALEINE_BLANCHE,
  CARTES_BUTIN,
  CARTES_KRAKEN,
  FORMATS_MANCHES,
  calendrierDe,
  JOUEURS_MAX,
  JOUEURS_MIN,
  LIBELLES_FORMATS,
  type FormatManches,
} from "../engine/rules"
import { Pastilles } from "./Pastilles"
import { cleJoueur } from "../engine/palmares"
import { cartesMaximum, taillePaquet } from "../engine/scoring"
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
    butin: false,
    kraken: false,
    baleineBlanche: false,
    flambeurActif: false,
    harryActif: false,
  })

  // La longueur du format sert de valeur de départ ; `null` tant que le joueur
  // n'a rien choisi, pour qu'un changement de format ne garde pas un vieux compte.
  const [nbManchesChoisi, setNbManchesChoisi] = useState<number | null>(null)

  const nomsValides = noms.map((n) => n.trim()).filter(Boolean)
  const pret = nomsValides.length >= JOUEURS_MIN

  const manchesMax = FORMATS_MANCHES[format].length
  const nbManches = Math.min(nbManchesChoisi ?? manchesMax, manchesMax)
  const calendrier = calendrierDe(format, nbManches)
  const plafond = pret ? cartesMaximum(nomsValides.length, options) : 0
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
    if (pret) onDemarrer({ joueurs: nomsValides, systeme, options, format, nbManches })
  }

  return (
    /* Repère « main » : sans lui, un lecteur d'écran n'a aucun moyen de
       sauter directement au contenu, et doit parcourir la page entière. */
    <main className="mx-auto max-w-lg px-4 pb-32">
      <div className="flex items-start justify-between gap-3 pt-6">
        <div>
          <h1 className="titre pb-1 text-3xl text-or">Skull King</h1>
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
                    "min-h-11 rounded-xl border px-3 text-sm transition-transform active:scale-95",
                    embarque ? "pastille-or font-bold" : "carte text-brume",
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
                className="min-h-11 flex-1 rounded-xl carte px-3 text-ecume placeholder:text-brume/60"
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
          onChange={(e) => {
            setFormat(e.target.value as FormatManches)
            // Repartir de la longueur du nouveau format plutôt que de garder
            // un compte hérité du précédent, qui n'aurait plus de sens.
            setNbManchesChoisi(null)
          }}
          aria-label="Format de manches"
          className="min-h-11 w-full rounded-xl carte px-3 text-ecume"
        >
          {Object.entries(LIBELLES_FORMATS).map(([id, libelle]) => (
            <option key={id} value={id}>
              {libelle}
            </option>
          ))}
        </select>

        {/* Rien n'oblige à jouer le format en entier : une tablée pressée
            s'arrête plus tôt, et le classement se lit à la manche atteinte. */}
        {manchesMax > 1 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm text-ecume">Nombre de manches</span>
              {nbManches < manchesMax && (
                <button
                  type="button"
                  onClick={() => setNbManchesChoisi(null)}
                  className="min-h-9 rounded-lg px-2 text-xs text-or"
                >
                  Tout jouer
                </button>
              )}
            </div>
            <Pastilles
              min={1}
              max={manchesMax}
              valeur={nbManches}
              onChoisir={setNbManchesChoisi}
              etiquette="Nombre de manches"
            />
          </div>
        )}

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

      {/* ── Extensions ── */}
      <section aria-labelledby="titre-extensions" className="mb-6">
        <h2 id="titre-extensions" className="mb-1 text-sm font-bold text-ecume">
          Cartes d'extension
        </h2>
        <p className="mb-2 text-xs text-brume">
          Chacune se glisse dans le paquet indépendamment des autres — prenez
          celles que vous avez sorties de la boîte.
        </p>
        <div className="space-y-2">
          {(
            [
              [
                "butin",
                "Butin",
                `${CARTES_BUTIN} cartes · alliance entre deux joueurs, 20 points si les deux tiennent leur mise`,
              ],
              [
                "kraken",
                "Kraken",
                `${CARTES_KRAKEN} carte · le pli est détruit, personne ne le remporte`,
              ],
              [
                "baleineBlanche",
                "Baleine blanche",
                `${CARTES_BALEINE_BLANCHE} carte · les pouvoirs sont annulés, le plus fort numéro l'emporte`,
              ],
            ] as const
          ).map(([cle, titre, detail]) => (
            <Bascule
              key={cle}
              actif={options[cle]}
              titre={titre}
              detail={detail}
              onBasculer={() => basculer(cle)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-brume">
          Paquet : <span className="chiffres">{taillePaquet(options)}</span> cartes
        </p>
      </section>

      {/* ── Options ── */}
      <section aria-labelledby="titre-options" className="mb-6">
        <h2 id="titre-options" className="mb-2 text-sm font-bold text-ecume">
          Options
        </h2>
        <div className="space-y-2">
          {(
            [
              [
                "bonusSiMiseExacte",
                "Bonus si mise exacte",
                "Variante ancienne édition : mise ratée, bonus perdus",
              ],
              ["flambeurActif", "Rascal le Flambeur", "Pari de 0, 10 ou 20 points"],
              [
                "harryActif",
                "Harry le Géant",
                "Ajuste sa mise de ±1, après le dernier pli",
              ],
              ...(systeme === "rascal"
                ? ([["bouletActif", "Boulet de canon", "Rascal : 15 points par carte, tout ou rien"]] as const)
                : []),
            ] as const
          ).map(([cle, titre, detail]) => (
            <Bascule
              key={cle}
              actif={options[cle]}
              titre={titre}
              detail={detail}
              onBasculer={() => basculer(cle)}
            />
          ))}
        </div>
      </section>

      {/* ── Départ ── */}
      <div className="fixed inset-x-0 bottom-0 border-t border-pont barre-voilee p-4">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={!pret}
            onClick={demarrer}
            className="min-h-14 w-full rounded-2xl bouton-or text-lg font-bold"
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
    </main>
  )
}

/* ═══════════ Interrupteur d'option ═══════════ */

type BasculeProps = {
  actif: boolean
  titre: string
  detail: string
  onBasculer: () => void
}

function Bascule({ actif, titre, detail, onBasculer }: BasculeProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={onBasculer}
      className={[
        "flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left",
        actif ? "border-or bg-or/10" : "border-pont bg-coque",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "grid h-6 w-6 shrink-0 place-items-center rounded-md border",
          actif ? "border-or bg-or text-abysse" : "border-pont",
        ].join(" ")}
      >
        {actif ? "✓" : ""}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ecume">{titre}</span>
        <span className="block text-xs text-brume">{detail}</span>
      </span>
    </button>
  )
}
