/**
 * Saisie joueur par joueur, en accordéon qui avance tout seul.
 *
 * Un seul joueur est déplié à la fois ; les autres tiennent sur une ligne.
 * Dès qu'une valeur est touchée, la fiche se referme et celle du joueur
 * suivant s'ouvre — le téléphone circule, chacun trouve sa question sans
 * jamais faire défiler. À dix cartes, la liste dépliée demanderait trois
 * rangées de pastilles par joueur : aucun écran de téléphone ne l'absorbe.
 */

import { useState, type ReactNode } from "react"
import { Pastilles } from "./Pastilles"

type Props = {
  joueurs: string[]
  /** Valeur saisie par joueur, `null` tant qu'il n'a pas répondu. */
  valeurs: (number | null)[]
  max: number
  onChoisir: (joueur: number, valeur: number) => void
  /** Libellé lu par les lecteurs d'écran, ex. « Mise de Suzie ». */
  etiquette: (nom: string) => string
  ton?: "or" | "cordage"
  /** Ce qui s'affiche à droite du nom, fiche repliée. */
  resume: (joueur: number) => ReactNode
  /** Contenu ajouté sous les pastilles du joueur déplié. */
  complement?: (joueur: number) => ReactNode
}

export function SaisieJoueurs({
  joueurs,
  valeurs,
  max,
  onChoisir,
  etiquette,
  ton = "or",
  resume,
  complement,
}: Props) {
  /** Fiche ouverte à la main, sinon on suit le premier joueur sans réponse. */
  const [choisi, setChoisi] = useState<number | null>(null)
  const premierVide = valeurs.findIndex((v) => v === null)
  const ouvert = choisi ?? (premierVide === -1 ? null : premierVide)

  return (
    <div className="space-y-1.5">
      {joueurs.map((nom, i) => {
        const deplie = ouvert === i
        const repondu = valeurs[i] !== null

        if (!deplie) {
          return (
            <button
              key={nom}
              type="button"
              onClick={() => setChoisi(i)}
              aria-expanded={false}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl carte px-3 text-left"
            >
              <span
                aria-hidden="true"
                className={repondu ? "text-tribord" : "text-brume/40"}
              >
                {repondu ? "✓" : "○"}
              </span>
              <span
                className={[
                  "min-w-0 flex-1 truncate text-sm",
                  repondu ? "text-brume" : "text-ecume",
                ].join(" ")}
              >
                {nom}
              </span>
              <span className="shrink-0 text-xs text-brume">{resume(i)}</span>
            </button>
          )
        }

        return (
          <div key={nom} className="rounded-2xl carte-or p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="titre text-lg text-or">{nom}</span>
              <span className="text-xs text-brume">{resume(i)}</span>
            </div>
            <Pastilles
              max={max}
              valeur={valeurs[i] ?? null}
              onChoisir={(v) => {
                onChoisir(i, v)
                // Rendre la main au premier joueur sans réponse : c'est le
                // suivant en saisie normale, et personne une fois tout rempli.
                setChoisi(null)
              }}
              etiquette={etiquette(nom)}
              ton={ton}
            />
            {complement?.(i)}
          </div>
        )
      })}
    </div>
  )
}
