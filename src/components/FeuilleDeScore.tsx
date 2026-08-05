/**
 * Feuille de score — la carte de la traversée, puis le détail manche par manche.
 *
 * Le tableau qu'elle remplace défilait latéralement dès quatre joueurs : une
 * colonne par joueur ne tient pas sur un téléphone. Ici les scores se lisent
 * en hauteur sur la carte, et chaque manche donne ses chiffres sur une ligne
 * qui se replie au lieu de déborder.
 *
 * Toucher une manche la rouvre en saisie et recalcule tout ce qui suit.
 * C'est la demande n°1 sur les applis concurrentes.
 */

import { useState } from "react"
import { CarteTraversee } from "./CarteTraversee"
import { scorerManche } from "../engine/scoring"
import type { Jeu } from "../state/useGame"

type Props = {
  jeu: Jeu
  /** Appelé après l'ouverture d'une manche en correction, pour quitter le classement. */
  onCorriger: (indexManche: number) => void
}

export function FeuilleDeScore({ jeu, onCorriger }: Props) {
  const { partie, courbes, classement } = jeu
  // Par défaut on suit le meneur : c'est la ligne que tout le monde cherche.
  const [suivi, setSuivi] = useState<number | null>(null)

  if (!partie) return null

  if (partie.manches.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-brume">
        Aucune manche validée pour l'instant.
      </p>
    )
  }

  const meneur = classement.reduce(
    (meilleur, score, i) => (score > (classement[meilleur] ?? 0) ? i : meilleur),
    0,
  )
  const joueurSuivi = suivi ?? meneur

  return (
    <div className="px-3">
      <div className="rounded-2xl carte p-3">
        <CarteTraversee
          trajectoires={courbes}
          joueurs={partie.joueurs}
          suivi={joueurSuivi}
        />

        {/* Sélecteur et légende à la fois : la couleur ne désigne personne,
            c'est le nom en clair au bout de la ligne qui le fait. */}
        <div
          role="group"
          aria-label="Joueur suivi sur la carte"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {partie.joueurs.map((nom, i) => (
            <button
              key={nom}
              type="button"
              aria-pressed={i === joueurSuivi}
              onClick={() => setSuivi(i)}
              className={[
                "min-h-9 rounded-lg border px-2.5 text-xs transition-transform active:scale-95",
                i === joueurSuivi
                  ? "border-or bg-or/15 font-bold text-or"
                  : "border-pont text-brume",
              ].join(" ")}
            >
              {nom}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 mb-2 text-xs text-brume">
        Touchez une manche pour la corriger. Les totaux suivants se recalculent seuls.
      </p>

      <ul className="space-y-1.5">
        {partie.manches.map((manche, index) => {
          const scores = scorerManche(manche, partie.systeme, partie.options)
          const enCorrection = partie.correction === index

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => onCorriger(index)}
                aria-label={`Corriger la manche ${index + 1}`}
                className={[
                  "w-full rounded-2xl p-3 text-left",
                  enCorrection ? "carte-or" : "carte",
                ].join(" ")}
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-ecume">
                    Manche {index + 1}
                  </span>
                  <span className="text-xs text-brume">
                    {manche.cartes} carte{manche.cartes > 1 ? "s" : ""}
                    {manche.plisDetruits > 0 && (
                      <> · {manche.plisDetruits} dévoré{manche.plisDetruits > 1 ? "s" : ""}</>
                    )}
                  </span>
                </div>

                {/* Les joueurs se replient sur plusieurs rangées : c'est ce qui
                    remplace le défilement latéral de l'ancien tableau. */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {partie.joueurs.map((nom, j) => {
                    const score = scores[j]
                    const entree = manche.entrees[j]
                    const total = score?.total ?? 0
                    return (
                      <span
                        key={nom}
                        className={[
                          "text-xs whitespace-nowrap",
                          j === joueurSuivi ? "text-ecume" : "text-brume",
                        ].join(" ")}
                      >
                        {nom}{" "}
                        <span className="chiffres">
                          {entree?.mise ?? "—"}/{entree?.plis ?? "—"}
                        </span>{" "}
                        <span
                          className={[
                            "font-bold chiffres",
                            total > 0
                              ? "text-tribord"
                              : total < 0
                                ? "text-babord"
                                : "text-brume",
                          ].join(" ")}
                        >
                          {total > 0 ? "+" : ""}
                          {total}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
