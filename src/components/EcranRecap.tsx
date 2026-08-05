/** Étape 4 — récapitulatif de la manche avant validation. */

import type { Jeu } from "../state/useGame"

export function EcranRecap({ jeu }: { jeu: Jeu }) {
  const { partie, cartes, scoresBrouillon, classementProjete } = jeu
  if (!partie) return null

  const { entrees } = partie.brouillon

  return (
    <div className="px-3 pb-4">
      <p className="mb-3 text-xs text-brume">
        Vérifiez avant de valider — tout reste corrigeable ensuite depuis le classement.
      </p>

      <div className="overflow-hidden rounded-2xl border border-pont">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-coque text-xs text-brume">
              <th scope="col" className="p-2 text-left font-normal">
                Joueur
              </th>
              <th scope="col" className="p-2 text-center font-normal">
                M / P
              </th>
              <th scope="col" className="p-2 text-right font-normal">
                Mise
              </th>
              <th scope="col" className="p-2 text-right font-normal">
                Bonus
              </th>
              <th scope="col" className="p-2 text-right font-normal">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {partie.joueurs.map((nom, i) => {
              const entree = entrees[i]
              const score = scoresBrouillon[i]
              if (!entree || !score) return null
              const bonusAffiche = score.bonus + score.flambeur
              return (
                <tr key={nom} className="border-t border-pont bg-abysse">
                  <th scope="row" className="max-w-28 truncate p-2 text-left font-normal text-ecume">
                    {nom}
                  </th>
                  <td className="p-2 text-center chiffres text-brume">
                    {entree.mise ?? "—"} / {entree.plis ?? "—"}
                  </td>
                  <td
                    className={[
                      "p-2 text-right chiffres",
                      score.base > 0 ? "text-tribord" : score.base < 0 ? "text-babord" : "text-brume",
                    ].join(" ")}
                  >
                    {score.base > 0 ? "+" : ""}
                    {score.base}
                  </td>
                  <td className="p-2 text-right chiffres text-or">
                    {bonusAffiche !== 0 ? (bonusAffiche > 0 ? `+${bonusAffiche}` : bonusAffiche) : "—"}
                  </td>
                  <td className="p-2 text-right font-bold chiffres text-ecume">
                    {score.total > 0 ? "+" : ""}
                    {score.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-center text-xs text-brume">
        Manche à {cartes} carte{cartes > 1 ? "s" : ""}
        {partie.brouillon.alliances.length > 0 &&
          ` · ${partie.brouillon.alliances.length} alliance${partie.brouillon.alliances.length > 1 ? "s" : ""}`}
      </p>

      {/* Aperçu du classement une fois la manche validée. */}
      <div className="mt-4">
        <h3 className="mb-2 text-xs font-bold text-brume">Après cette manche</h3>
        <ul className="space-y-1">
          {partie.joueurs
            .map((nom, i) => ({
              nom,
              score: classementProjete[i] ?? 0,
              gain: scoresBrouillon[i]?.total ?? 0,
            }))
            .sort((a, b) => b.score - a.score)
            .map((joueur, rang) => (
              <li
                key={joueur.nom}
                className="flex items-center gap-2 rounded-xl carte px-3 py-2 text-sm"
              >
                <span className="w-5 text-brume chiffres">{rang + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-ecume">{joueur.nom}</span>
                <span className="text-xs text-brume chiffres">
                  {joueur.gain > 0 ? "+" : ""}
                  {joueur.gain}
                </span>
                <span className="w-14 text-right font-bold chiffres text-ecume">
                  {joueur.score}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
