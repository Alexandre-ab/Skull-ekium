/**
 * Le sillage — la traînée que laisse un joueur derrière lui.
 *
 * Un point par partie, du plus ancien au plus récent : haut du tracé pour une
 * victoire, bas pour la dernière place. Six chiffres empilés ne disent pas si
 * une rivalité se resserre ; cette ligne le montre en un coup d'œil.
 *
 * Le rang est ramené à une hauteur relative, parce que troisième sur cinq et
 * troisième sur trois n'ont rien à voir.
 */

import type { Resultat } from "../engine/types"

/** Au-delà, la traînée devient illisible ; on garde les plus récentes. */
const PARTIES_AFFICHEES = 10

const LARGEUR = 60
const HAUTEUR = 20
/** Marge verticale : sans elle, les points extrêmes seraient rognés. */
const MARGE = 3

type Props = {
  /** De la plus ancienne à la plus récente. */
  resultats: Resultat[]
  nom: string
}

export function Sillage({ resultats, nom }: Props) {
  const derniers = resultats.slice(-PARTIES_AFFICHEES)
  if (derniers.length === 0) return null

  const points = derniers.map((resultat, i) => {
    // Un seul point se pose à droite, là où le regard cherche le plus récent.
    const x =
      derniers.length === 1 ? LARGEUR : (i / (derniers.length - 1)) * LARGEUR
    // Rang 1 en haut. À deux joueurs, 1er et 2e occupent haut et bas.
    const echelle = Math.max(1, resultat.joueurs - 1)
    const y = MARGE + ((resultat.rang - 1) / echelle) * (HAUTEUR - 2 * MARGE)
    return { x, y, resultat }
  })

  const victoires = derniers.filter((r) => r.rang === 1).length

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      width={LARGEUR}
      height={HAUTEUR}
      role="img"
      aria-label={`Sillage de ${nom} : ${derniers.length} partie${derniers.length > 1 ? "s" : ""}, ${victoires} en tête`}
      className="shrink-0 overflow-visible"
    >
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--color-brume)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.map(({ x, y, resultat }, i) => {
        // L'or double la position du point, il ne la remplace pas : une
        // victoire est déjà tout en haut du tracé.
        const gagnee = resultat.rang === 1
        const dernier = i === points.length - 1
        return (
          <circle
            key={`${resultat.date}-${i}`}
            cx={x}
            cy={y}
            r={dernier ? 2.6 : 2}
            fill={gagnee ? "var(--color-or)" : "var(--color-brume)"}
            fillOpacity={gagnee ? 1 : dernier ? 0.9 : 0.55}
          />
        )
      })}
    </svg>
  )
}
