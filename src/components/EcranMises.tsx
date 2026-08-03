/** Étape 1 — les mises. Un joueur par ligne, pastilles de 0 au nombre de cartes. */

import { Pastilles } from "./Pastilles"
import type { Jeu } from "../state/useGame"

export function EcranMises({ jeu }: { jeu: Jeu }) {
  const { partie, cartes } = jeu
  if (!partie) return null

  const { entrees } = partie.brouillon
  const sommeMises = entrees.reduce((total, e) => total + (e.mise ?? 0), 0)
  const toutesSaisies = entrees.every((e) => e.mise !== null)

  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-brume">
        Chacun annonce le nombre de plis qu'il pense remporter sur {cartes} carte
        {cartes > 1 ? "s" : ""}.
      </p>

      {partie.joueurs.map((nom, i) => (
        <div key={nom} className="rounded-2xl carte p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-bold text-ecume">{nom}</span>
            <span className="text-xs text-brume">
              {entrees[i]?.mise === null ? "à miser" : `mise ${entrees[i]?.mise}`}
            </span>
          </div>
          <Pastilles
            max={cartes}
            valeur={entrees[i]?.mise ?? null}
            onChoisir={(v) => jeu.definirMise(i, v)}
            etiquette={`Mise de ${nom}`}
          />
        </div>
      ))}

      {toutesSaisies && (
        <p className="text-center text-xs text-brume">
          Total des mises : {sommeMises} pour {cartes} pli{cartes > 1 ? "s" : ""} à
          remporter.
          {sommeMises === cartes && " Personne ne sera déçu… ou tout le monde."}
        </p>
      )}
    </div>
  )
}
