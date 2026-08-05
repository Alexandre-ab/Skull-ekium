/**
 * Mini-classement, visible en permanence pendant la saisie.
 * On sait toujours où l'on en est sans quitter l'écran en cours.
 */

type Props = {
  joueurs: string[]
  totaux: number[]
}

export function MiniClassement({ joueurs, totaux }: Props) {
  const ordre = joueurs
    .map((nom, i) => ({ nom, score: totaux[i] ?? 0 }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 py-2" aria-label="Mini-classement">
      {ordre.map((joueur, rang) => (
        <div
          key={joueur.nom}
          className={[
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            rang === 0 ? "carte-or" : "carte",
          ].join(" ")}
        >
          <span className="text-brume">{rang + 1}.</span>
          <span className="max-w-24 truncate text-ecume">{joueur.nom}</span>
          <span
            className={[
              "font-bold chiffres",
              joueur.score > 0 ? "text-tribord" : joueur.score < 0 ? "text-babord" : "text-brume",
            ].join(" ")}
          >
            {joueur.score}
          </span>
        </div>
      ))}
    </div>
  )
}
