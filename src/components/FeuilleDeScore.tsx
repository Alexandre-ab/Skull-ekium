/**
 * Feuille de score complète.
 *
 * Toucher une ligne rouvre la manche en saisie et recalcule tout ce qui suit.
 * C'est la demande n°1 sur les applis concurrentes.
 */

import { scorerManche } from "../engine/scoring"
import type { Jeu } from "../state/useGame"

type Props = {
  jeu: Jeu
  /** Appelé après l'ouverture d'une manche en correction, pour quitter le classement. */
  onCorriger: (indexManche: number) => void
}

export function FeuilleDeScore({ jeu, onCorriger }: Props) {
  const { partie, cumulApres } = jeu
  if (!partie) return null

  if (partie.manches.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-brume">
        Aucune manche validée pour l'instant.
      </p>
    )
  }

  return (
    <div className="px-3">
      <p className="mb-2 text-xs text-brume">
        Touchez une manche pour la corriger. Les totaux suivants se recalculent seuls.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-pont">
        <table className="w-full min-w-max text-sm">
          <caption className="sr-only">
            Feuille de score, une ligne par manche validée
          </caption>
          <thead>
            <tr className="bg-coque text-xs text-brume">
              <th scope="col" className="p-2 text-left font-normal">
                Manche
              </th>
              {partie.joueurs.map((nom) => (
                <th key={nom} scope="col" className="max-w-24 truncate p-2 text-right font-normal">
                  {nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partie.manches.map((manche, index) => {
              const scores = scorerManche(manche, partie.systeme, partie.options)
              const cumuls = cumulApres(index)
              const enCours = partie.correction === index
              return (
                <tr
                  key={index}
                  onClick={() => onCorriger(index)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Corriger la manche ${index + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onCorriger(index)
                    }
                  }}
                  className={[
                    "cursor-pointer border-t border-pont",
                    enCours ? "bg-or/10" : "bg-abysse hover:bg-coque",
                  ].join(" ")}
                >
                  <th scope="row" className="p-2 text-left font-normal whitespace-nowrap">
                    <span className="text-ecume">{index + 1}</span>
                    <span className="ml-1 text-xs text-brume">
                      · {manche.cartes} c.
                    </span>
                  </th>
                  {partie.joueurs.map((nom, j) => {
                    const score = scores[j]
                    const entree = manche.entrees[j]
                    return (
                      <td key={nom} className="p-2 text-right whitespace-nowrap">
                        <span className="block text-xs text-brume tabular-nums">
                          {entree?.mise ?? "—"}/{entree?.plis ?? "—"}
                          <span
                            className={[
                              "ml-1",
                              (score?.total ?? 0) > 0
                                ? "text-tribord"
                                : (score?.total ?? 0) < 0
                                  ? "text-babord"
                                  : "",
                            ].join(" ")}
                          >
                            {(score?.total ?? 0) > 0 ? "+" : ""}
                            {score?.total ?? 0}
                          </span>
                        </span>
                        <span className="block font-bold tabular-nums text-ecume">
                          {cumuls[j] ?? 0}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
