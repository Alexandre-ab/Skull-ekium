/** Étape 1 — les mises, joueur par joueur. */

import { SaisieJoueurs } from "./SaisieJoueurs"
import { PARIS_FLAMBEUR } from "../engine/rules"
import type { Jeu } from "../state/useGame"

export function EcranMises({ jeu }: { jeu: Jeu }) {
  const { partie, cartes } = jeu
  if (!partie) return null

  const { entrees } = partie.brouillon
  const { flambeurActif } = partie.options
  const sommeMises = entrees.reduce((total, e) => total + (e.mise ?? 0), 0)
  const toutesSaisies = entrees.every((e) => e.mise !== null)

  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-brume">
        Chacun annonce le nombre de plis qu'il pense remporter sur {cartes} carte
        {cartes > 1 ? "s" : ""}.
      </p>

      <SaisieJoueurs
        joueurs={partie.joueurs}
        valeurs={entrees.map((e) => e.mise)}
        max={cartes}
        onChoisir={(i, v) => jeu.definirMise(i, v)}
        etiquette={(nom) => `Mise de ${nom}`}
        resume={(i) => (entrees[i]?.mise === null ? "à miser" : `misé ${entrees[i]?.mise}`)}
        complement={
          flambeurActif
            ? (i) => (
                /*
                  Le pari se pose ici, avec la mise, et non à l'étape Bonus :
                  là-bas les plis sont déjà connus, on saurait déjà si la mise
                  est tenue et le pari ne risquerait plus rien.
                */
                <div className="mt-3 border-t border-pont pt-3">
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs text-ecume">Pari du Flambeur</span>
                    <span className="text-xs text-brume">
                      {entrees[i]?.flambeur === 0
                        ? "aucun pari"
                        : `${entrees[i]?.flambeur} en jeu`}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {PARIS_FLAMBEUR.map((pari) => {
                      const choisi = entrees[i]?.flambeur === pari
                      return (
                        <button
                          key={pari}
                          type="button"
                          aria-pressed={choisi}
                          aria-label={`Pari de ${partie.joueurs[i]} : ${pari}`}
                          onClick={() => jeu.definirBonus(i, "flambeur", pari)}
                          className={[
                            "min-h-11 flex-1 rounded-xl border text-sm chiffres",
                            "transition-transform active:scale-95",
                            choisi ? "pastille-or font-bold" : "carte text-brume",
                          ].join(" ")}
                        >
                          {pari}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-brume">
                    Gagné si la mise est exacte, perdu sinon.
                  </p>
                </div>
              )
            : undefined
        }
      />

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
