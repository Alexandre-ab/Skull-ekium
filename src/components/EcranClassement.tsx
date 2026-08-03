/** Classement et feuille de score complète. */

import { FeuilleDeScore } from "./FeuilleDeScore"
import type { Jeu } from "../state/useGame"

type Props = { jeu: Jeu; onCorriger: (indexManche: number) => void }

export function EcranClassement({ jeu, onCorriger }: Props) {
  const { partie, classement, terminee } = jeu
  if (!partie) return null

  const ordre = partie.joueurs
    .map((nom, i) => ({ nom, score: classement[i] ?? 0 }))
    .sort((a, b) => b.score - a.score)

  const aFlot = ordre.filter((j) => j.score >= 0)
  const coules = ordre.filter((j) => j.score < 0)

  return (
    <div className="pb-6">
      <div className="px-3 pt-3">
        {terminee && (
          <div className="mb-4 rounded-2xl carte-or p-5 text-center">
            <div className="text-[0.7rem] tracking-[0.2em] text-brume uppercase">
              Capitaine des Sept Mers
            </div>
            <div className="titre-grave mt-1 text-2xl text-or">{ordre[0]?.nom}</div>
            <div className="mt-1 text-sm text-ecume tabular-nums">
              {ordre[0]?.score} points
            </div>
          </div>
        )}

        <ul className="space-y-1.5">
          {aFlot.map((joueur, rang) => (
            <LigneClassement key={joueur.nom} rang={rang + 1} {...joueur} />
          ))}
        </ul>

        {coules.length > 0 && (
          <>
            <h3 className="mt-4 mb-1.5 text-xs font-bold text-babord">Par le fond</h3>
            <ul className="space-y-1.5">
              {coules.map((joueur, rang) => (
                <LigneClassement
                  key={joueur.nom}
                  rang={aFlot.length + rang + 1}
                  {...joueur}
                  coule
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <h3 className="mt-6 mb-2 px-3 text-xs font-bold text-brume">Feuille de score</h3>
      <FeuilleDeScore jeu={jeu} onCorriger={onCorriger} />
    </div>
  )
}

type LigneProps = { rang: number; nom: string; score: number; coule?: boolean }

function LigneClassement({ rang, nom, score, coule = false }: LigneProps) {
  return (
    <li
      className={[
        "flex items-center gap-3 rounded-2xl border p-3",
        rang === 1 && !coule ? "carte-or" : "carte",
      ].join(" ")}
    >
      <span className="w-6 text-center text-sm text-brume tabular-nums">{rang}</span>
      <span className="min-w-0 flex-1 truncate font-bold text-ecume">{nom}</span>
      <span
        className={[
          "text-lg font-bold tabular-nums",
          score > 0 ? "text-tribord" : score < 0 ? "text-babord" : "text-brume",
        ].join(" ")}
      >
        {score}
      </span>
    </li>
  )
}
