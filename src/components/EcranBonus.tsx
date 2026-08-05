/**
 * Étape 3 — les bonus.
 *
 * Repliés par défaut : la plupart des manches n'en comportent aucun, et on ne
 * doit pas faire défiler dix formulaires pour valider une manche vide.
 */

import { useState } from "react"
import {
  BONUS_PIRATE_CAPTURE,
  BONUS_QUATORZE_COULEUR,
  BONUS_QUATORZE_NOIR,
  BONUS_SIRENE_CAPTUREE,
  BONUS_SKULL_KING_CAPTURE,
  MAX_PIRATES_CAPTURES,
  MAX_QUATORZE_COULEUR,
  MAX_SIRENES_CAPTUREES,
} from "../engine/rules"
import { bonusBrut } from "../engine/scoring"
import type { Jeu } from "../state/useGame"

export function EcranBonus({ jeu }: { jeu: Jeu }) {
  const { partie } = jeu
  const [ouverts, setOuverts] = useState<Set<number>>(new Set())
  if (!partie) return null

  const { entrees } = partie.brouillon
  const { options, systeme, joueurs } = partie

  const basculer = (i: number) =>
    setOuverts((set) => {
      const suivant = new Set(set)
      if (suivant.has(i)) suivant.delete(i)
      else suivant.add(i)
      return suivant
    })

  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-brume">
        Cartes 14 conservées, personnages capturés. Rien à signaler ? Passez directement
        au récapitulatif.
      </p>

      {joueurs.map((nom, i) => {
        const entree = entrees[i]
        if (!entree) return null
        const points = bonusBrut(entree)
        const ouvert = ouverts.has(i)

        return (
          <div key={nom} className="rounded-2xl carte">
            <button
              type="button"
              onClick={() => basculer(i)}
              aria-expanded={ouvert}
              className="flex min-h-14 w-full items-center justify-between gap-2 p-3 text-left"
            >
              <span className="font-bold text-ecume">{nom}</span>
              <span className="flex items-center gap-2">
                {points > 0 && (
                  <span className="rounded-full bg-or/15 px-2 py-0.5 text-xs font-bold text-or chiffres">
                    +{points}
                  </span>
                )}
                <span aria-hidden="true" className="text-brume">
                  {ouvert ? "▴" : "▾"}
                </span>
              </span>
            </button>

            {ouvert && (
              <div className="space-y-3 border-t border-pont p-3">
                <CompteurBonus
                  etiquette="Cartes 14 de couleur"
                  detail={`${BONUS_QUATORZE_COULEUR} points chacune`}
                  valeur={entree.quatorzeCouleur}
                  max={MAX_QUATORZE_COULEUR}
                  onChanger={(v) => jeu.definirBonus(i, "quatorzeCouleur", v)}
                />
                <InterrupteurBonus
                  etiquette="Carte 14 noire"
                  detail={`${BONUS_QUATORZE_NOIR} points`}
                  actif={entree.quatorzeNoir}
                  onChanger={(v) => jeu.definirBonus(i, "quatorzeNoir", v)}
                />
                <CompteurBonus
                  etiquette="Sirènes capturées"
                  detail={`${BONUS_SIRENE_CAPTUREE} points chacune, par un pirate`}
                  valeur={entree.sirenesCapturees}
                  max={MAX_SIRENES_CAPTUREES}
                  onChanger={(v) => jeu.definirBonus(i, "sirenesCapturees", v)}
                />
                <CompteurBonus
                  etiquette="Pirates capturés"
                  detail={`${BONUS_PIRATE_CAPTURE} points chacun, par le Skull King`}
                  valeur={entree.piratesCaptures}
                  max={MAX_PIRATES_CAPTURES}
                  onChanger={(v) => jeu.definirBonus(i, "piratesCaptures", v)}
                />
                <InterrupteurBonus
                  etiquette="Skull King capturé"
                  detail={`${BONUS_SKULL_KING_CAPTURE} points, par votre sirène`}
                  actif={entree.skullKingCapture}
                  onChanger={(v) => jeu.definirBonus(i, "skullKingCapture", v)}
                />

                {systeme === "rascal" && options.bouletActif && (
                  <InterrupteurBonus
                    etiquette="Boulet de canon"
                    detail="15 points par carte, tout ou rien"
                    actif={entree.boulet}
                    onChanger={(v) => jeu.definirBonus(i, "boulet", v)}
                  />
                )}

                {/*
                  Le pari du Flambeur se pose à l'étape Mises, pas ici : à ce
                  stade les plis sont connus, parier ne coûterait plus rien.
                  Rappelé en lecture seule pour que le récapitulatif se comprenne.
                */}
                {options.flambeurActif && entree.flambeur !== 0 && (
                  <p className="text-xs text-brume">
                    Pari du Flambeur : {entree.flambeur} points, posé à la mise.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {options.butin && <BlocAlliances jeu={jeu} />}
    </div>
  )
}

/* ═══════════ Alliances Butin ═══════════ */

function BlocAlliances({ jeu }: { jeu: Jeu }) {
  const { partie } = jeu
  const [premier, setPremier] = useState<number | null>(null)
  if (!partie) return null

  const { joueurs } = partie
  const { alliances } = partie.brouillon

  const choisir = (i: number) => {
    if (premier === null) setPremier(i)
    else if (premier === i) setPremier(null)
    else {
      jeu.ajouterAlliance([premier, i])
      setPremier(null)
    }
  }

  return (
    <section className="rounded-2xl carte p-3">
      <h3 className="text-sm font-bold text-ecume">Alliances Butin</h3>
      <p className="mt-1 mb-3 text-xs text-brume">
        20 points chacun, accordés seulement si les deux alliés tiennent leur mise.
      </p>

      {alliances.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {alliances.map(([a, b], index) => (
            <li
              key={`${a}-${b}-${index}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-cordage bg-cordage/10 px-3 py-2 text-sm"
            >
              <span className="truncate text-ecume">
                {joueurs[a]} &amp; {joueurs[b]}
              </span>
              <button
                type="button"
                onClick={() => jeu.retirerAlliance(index)}
                aria-label={`Retirer l'alliance ${joueurs[a]} et ${joueurs[b]}`}
                className="min-h-11 min-w-11 shrink-0 rounded-lg text-brume"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="text-xs text-brume">
        {premier === null
          ? "Touchez les deux alliés."
          : `${joueurs[premier]} s'allie avec…`}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {joueurs.map((nom, i) => (
          <button
            key={nom}
            type="button"
            aria-pressed={premier === i}
            onClick={() => choisir(i)}
            className={[
              "min-h-11 rounded-xl border px-3 text-sm",
              premier === i
                ? "border-or bg-or text-abysse font-bold"
                : "border-pont bg-abysse text-ecume",
            ].join(" ")}
          >
            {nom}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ═══════════ Contrôles ═══════════ */

type CompteurProps = {
  etiquette: string
  detail: string
  valeur: number
  max: number
  onChanger: (valeur: number) => void
}

function CompteurBonus({ etiquette, detail, valeur, max, onChanger }: CompteurProps) {
  return (
    <div>
      <div className="text-sm text-ecume">{etiquette}</div>
      <div className="mb-1.5 text-xs text-brume">{detail}</div>
      <div role="group" aria-label={etiquette} className="flex gap-1.5">
        {Array.from({ length: max + 1 }, (_, n) => (
          <button
            key={n}
            type="button"
            aria-pressed={valeur === n}
            aria-label={`${etiquette} : ${n}`}
            onClick={() => onChanger(n)}
            className={[
              "min-h-11 flex-1 rounded-xl border text-sm chiffres",
              valeur === n
                ? "border-or bg-or text-abysse font-bold"
                : "border-pont bg-abysse text-brume",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

type InterrupteurProps = {
  etiquette: string
  detail: string
  actif: boolean
  onChanger: (actif: boolean) => void
}

function InterrupteurBonus({ etiquette, detail, actif, onChanger }: InterrupteurProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChanger(!actif)}
      className={[
        "flex min-h-11 w-full items-center gap-3 rounded-xl border p-2.5 text-left",
        actif ? "border-or bg-or/10" : "border-pont bg-abysse",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs",
          actif ? "border-or bg-or text-abysse" : "border-pont",
        ].join(" ")}
      >
        {actif ? "✓" : ""}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ecume">{etiquette}</span>
        <span className="block text-xs text-brume">{detail}</span>
      </span>
    </button>
  )
}
