/** Étape 2 — les plis remportés, avec le contrôle de cohérence. */

import { Pastilles } from "./Pastilles"
import { SaisieJoueurs } from "./SaisieJoueurs"
import { miseEffective, plisADistribuer } from "../engine/scoring"
import type { Jeu } from "../state/useGame"

export function EcranPlis({ jeu }: { jeu: Jeu }) {
  const { partie, cartes, coherence, scoresBrouillon } = jeu
  if (!partie) return null

  const { entrees, plisDetruits } = partie.brouillon
  const { kraken, baleineBlanche, harryActif } = partie.options

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

      <SaisieJoueurs
        joueurs={partie.joueurs}
        valeurs={entrees.map((e) => e.plis)}
        max={aRepartir}
        onChoisir={(i, v) => jeu.definirPlis(i, v)}
        etiquette={(nom) => `Plis de ${nom}`}
        ton="cordage"
        complement={
          harryActif
            ? (i) => <AjustementHarry jeu={jeu} joueur={i} />
            : undefined
        }
        resume={(i) => {
          const entree = entrees[i]
          const score = scoresBrouillon[i]
          const saisi = entree?.plis !== null && entree?.plis !== undefined
          const annoncee = entree?.mise ?? 0
          const defendue = entree
            ? miseEffective(entree, cartes, partie.options)
            : annoncee
          return (
            <>
              misé {annoncee}
              {defendue !== annoncee && <> → {defendue}</>}
              {saisi && score && (
                <span
                  className={[
                    "ml-2 font-bold chiffres",
                    score.base > 0 ? "text-tribord" : score.base < 0 ? "text-babord" : "",
                  ].join(" ")}
                >
                  {score.base > 0 ? "+" : ""}
                  {score.base}
                </span>
              )}
            </>
          )
        }}
      />

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

/* ═══════════ Pouvoir de Harry le Géant ═══════════ */

/**
 * Ajustement de la mise de ±1, proposé une fois les plis connus.
 *
 * C'est l'inverse du pari du Flambeur, qui se pose avant de jouer : la règle
 * fait de Harry le seul pirate dont le pouvoir s'emploie après le dernier pli.
 * Voir son résultat avant de corriger son annonce, c'est tout le pouvoir.
 */
function AjustementHarry({ jeu, joueur }: { jeu: Jeu; joueur: number }) {
  const { partie, cartes } = jeu
  const entree = partie?.brouillon.entrees[joueur]
  if (!partie || !entree) return null

  const annoncee = entree.mise ?? 0
  const defendue = miseEffective(entree, cartes, partie.options)

  const choix = [
    { valeur: -1 as const, libelle: "−1" },
    { valeur: 0 as const, libelle: "inchangée" },
    { valeur: 1 as const, libelle: "+1" },
  ]

  return (
    <div className="mt-3 border-t border-pont pt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs text-ecume">Harry le Géant</span>
        <span className="text-xs text-brume">
          mise {annoncee}
          {defendue !== annoncee && <> → <span className="text-or">{defendue}</span></>}
        </span>
      </div>
      <div className="flex gap-1.5">
        {choix.map(({ valeur, libelle }) => {
          // Une mise ne descend pas sous zéro ni au-delà des cartes en jeu :
          // proposer l'ajustement impossible ne ferait qu'égarer.
          const cible = annoncee + valeur
          const jouable = cible >= 0 && cible <= cartes
          const choisi = entree.harry === valeur
          return (
            <button
              key={valeur}
              type="button"
              aria-pressed={choisi}
              disabled={!jouable}
              onClick={() => jeu.definirChamp(joueur, "harry", valeur)}
              className={[
                "min-h-11 flex-1 rounded-xl border text-sm",
                "transition-transform active:scale-95 disabled:opacity-30",
                choisi ? "pastille-or font-bold" : "carte text-brume",
              ].join(" ")}
            >
              {libelle}
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-brume">
        Utilisable après le dernier pli, une fois le résultat connu.
      </p>
    </div>
  )
}
