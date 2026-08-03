/** Étape 2 — les plis remportés, avec le contrôle de cohérence. */

import { Pastilles } from "./Pastilles"
import type { Partie } from "../engine/types"
import type { Jeu } from "../state/useGame"

/**
 * Ce qui peut légitimement avoir escamoté des plis, d'après ce qui est en jeu.
 * Ne nomme que les cartes réellement choisies à la mise en place : suggérer le
 * Kraken alors qu'il est resté dans la boîte enverrait vérifier la mauvaise chose.
 */
function responsableDesPlisPerdus(partie: Partie): string {
  const { kraken, baleineBlanche } = partie.options
  const coupables = [
    ...(kraken ? ["le Kraken"] : []),
    ...(baleineBlanche ? ["la Baleine blanche"] : []),
  ]

  if (partie.joueurs.length === 2) {
    return coupables.length > 0
      ? `Barbe Grise, ${coupables.join(" ou ")}, sans doute`
      : "Barbe Grise en a sûrement profité"
  }
  return `${coupables.join(" ou ")}, sans doute`
}

export function EcranPlis({ jeu }: { jeu: Jeu }) {
  const { partie, cartes, coherence, scoresBrouillon } = jeu
  if (!partie) return null

  const { entrees } = partie.brouillon

  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-xs text-brume">
        Combien de plis chacun a-t-il réellement remportés ?
      </p>

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
              max={cartes}
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
              que {cartes} carte{cartes > 1 ? "s" : ""} dans cette manche.
            </>
          )}
          {coherence.etat === "manquants" && !coherence.tolere && (
            <>
              Il manque {coherence.ecart} pli{coherence.ecart > 1 ? "s" : ""} sur{" "}
              {cartes}.
            </>
          )}
          {coherence.etat === "manquants" && coherence.tolere && (
            <>
              {coherence.ecart} pli{coherence.ecart > 1 ? "s" : ""} non attribué
              {coherence.ecart > 1 ? "s" : ""} — {responsableDesPlisPerdus(partie)}.
            </>
          )}
        </div>
      )}
    </div>
  )
}
