/**
 * Saisie d'un nombre par pastilles, de 0 à `max`.
 * Jamais de clavier numérique : le téléphone circule, on doit pouvoir
 * répondre d'un pouce et sans regarder.
 */

type Props = {
  max: number
  valeur: number | null
  onChoisir: (valeur: number) => void
  /** Libellé lu par les lecteurs d'écran, ex. « Mise de Suzie ». */
  etiquette: string
  /** Palette d'accent, pour distinguer mise et plis d'un coup d'œil. */
  ton?: "or" | "cordage"
}

export function Pastilles({ max, valeur, onChoisir, etiquette, ton = "or" }: Props) {
  const choix = Array.from({ length: max + 1 }, (_, i) => i)
  const actif =
    ton === "or"
      ? "bg-or text-abysse border-or font-bold"
      : "bg-cordage text-ecume border-cordage font-bold"

  return (
    <div role="group" aria-label={etiquette} className="flex flex-wrap gap-1.5">
      {choix.map((n) => {
        const choisi = valeur === n
        return (
          <button
            key={n}
            type="button"
            aria-pressed={choisi}
            aria-label={`${etiquette} : ${n}`}
            onClick={() => onChoisir(n)}
            className={[
              "min-h-11 min-w-11 rounded-xl border text-base tabular-nums transition-colors",
              choisi
                ? actif
                : "border-pont bg-coque text-brume hover:border-cordage hover:text-ecume",
            ].join(" ")}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
