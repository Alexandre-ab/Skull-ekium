/** Étape 2 — les plis remportés, avec le contrôle de cohérence. */

import { Pastilles } from "./Pastilles"
import { plisADistribuer } from "../engine/scoring"
import type { Jeu } from "../state/useGame"

export function EcranPlis({ jeu }: { jeu: Jeu }) {
  const { partie, cartes, coherence, scoresBrouillon } = jeu
  if (!partie) return null

  const { entrees, plisDetruits } = partie.brouillon
  const { kraken, baleineBlanche } = partie.options

  // Les deux bêtes ne dévorent qu'un pli chacune, et jamais plus qu'il n'y a
  // de cartes : au-delà, le choix proposé n'aurait aucun sens.
  const devoreursEnJeu = (kraken ? 1 : 0) + (baleineBlanche ? 1 : 0)
  const maxDetruits = Math.min(devoreursEnJeu, cartes)
  const aRepartir = plisADistribuer(partie.brouillon)

  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-brume">
        Combien de plis chacun a-t-il réellement remportés ?
      </p>

      {/*
        Les plis dévorés se déclarent au lieu de se deviner : l'appli connaît
        alors le compte exact à répartir, l'auto-cochage reste juste et une
        vraie erreur de saisie ne passe plus pour un coup du Kraken.
      */}
      {maxDetruits > 0 && (
        <div className="rounded-2xl carte p-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-ecume">Plis dévorés</span>
            <span className="text-xs text-brume">
              {aRepartir} pli{aRepartir > 1 ? "s" : ""} à répartir
            </span>
          </div>
          <Pastilles
            max={maxDetruits}
            valeur={plisDetruits}
            onChoisir={(v) => jeu.definirPlisDetruits(v)}
            etiquette="Plis dévorés"
            ton="cordage"
          />
          <p className="mt-2 text-xs text-brume">
            {[kraken && "Kraken", baleineBlanche && "Baleine blanche"]
              .filter(Boolean)
              .join(" ou ")}{" "}
            : le pli est détruit, personne ne le remporte.
          </p>
        </div>
      )}

      {partie.joueurs.map((nom, i) => {
        const entree = entrees[i]
        const score = scoresBrouillon[i]
        const mise = entree?.mise ?? 0
        const saisi = entree?.plis !== null && entree?.plis !== undefined
        return (
          <div key={nom} className="rounded-2xl carte p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-bold text-ecume">{nom}</span>
              <span className="text-xs text-brume">
                misé {mise}
                {saisi && score && (
                  <span
                    className={[
                      "ml-2 font-bold tabular-nums",
                      score.base > 0 ? "text-tribord" : score.base < 0 ? "text-babord" : "",
                    ].join(" ")}
                  >
                    {score.base > 0 ? "+" : ""}
                    {score.base}
                  </span>
                )}
              </span>
            </div>
            <Pastilles
              max={aRepartir}
              valeur={entree?.plis ?? null}
              onChoisir={(v) => jeu.definirPlis(i, v)}
              etiquette={`Plis de ${nom}`}
              ton="cordage"
            />
          </div>
        )
      })}

      {coherence && coherence.etat !== "incomplet" && coherence.etat !== "exact" && (
        <div
          role="status"
          className={[
            "rounded-xl border p-3 text-xs",
            coherence.etat === "manquants" && coherence.tolere
              ? "border-cordage bg-cordage/10 text-brume"
              : "border-babord bg-babord/10 text-babord",
          ].join(" ")}
        >
          {coherence.etat === "excedentaires" && (
            <>
              {coherence.ecart} pli{coherence.ecart > 1 ? "s" : ""} de trop : il n'y a
              que {aRepartir} pli{aRepartir > 1 ? "s" : ""} à répartir cette manche.
            </>
          )}
          {coherence.etat === "manquants" && !coherence.tolere && (
            <>
              Il manque {coherence.ecart} pli{coherence.ecart > 1 ? "s" : ""} sur{" "}
              {aRepartir}.
              {maxDetruits > 0 && plisDetruits < maxDetruits && (
                <> Une bête en a dévoré un ? Déclarez-le ci-dessus.</>
              )}
            </>
          )}
          {coherence.etat === "manquants" && coherence.tolere && (
            <>
              {coherence.ecart} pli{coherence.ecart > 1 ? "s" : ""} non attribué
              {coherence.ecart > 1 ? "s" : ""} — Barbe Grise en a sûrement profité.
            </>
          )}
        </div>
      )}
    </div>
  )
}
