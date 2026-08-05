/**
 * La carte de la traversée — le score cumulé, manche après manche.
 *
 * Remplace le tableau qui défilait latéralement : six colonnes de joueurs
 * demandaient 480 px pour un écran qui en fait 390. Ici, dix joueurs tiennent
 * dans la même largeur que deux.
 *
 * Un seul joueur est mis en avant à la fois. La palette n'a pas dix teintes
 * distinctes à offrir, et en fabriquer serait illisible pour un daltonien :
 * le joueur suivi passe en or, les autres restent en brume, et son nom est
 * écrit au bout de sa ligne — l'identité ne tient jamais à la couleur seule.
 */

const LARGEUR = 300
const HAUTEUR = 150
/** Place laissée à droite pour le nom du joueur suivi. */
const MARGE_DROITE = 52
const MARGE_HAUT = 10
const MARGE_BAS = 18

type Props = {
  /** Une trajectoire par joueur, de longueur `manches + 1`. */
  trajectoires: number[][]
  joueurs: string[]
  /** Joueur mis en avant. */
  suivi: number
}

export function CarteTraversee({ trajectoires, joueurs, suivi }: Props) {
  const manches = (trajectoires[0]?.length ?? 1) - 1
  if (manches < 1) return null

  const valeurs = trajectoires.flat()
  // La ligne de flottaison fait toujours partie du cadre, même si personne
  // n'est jamais passé dessous : c'est le repère qui donne son sens à la pente.
  const haut = Math.max(0, ...valeurs)
  const bas = Math.min(0, ...valeurs)
  const amplitude = haut - bas || 1

  // Le tracé démarre à 10 : la place du « 0 » qui étiquette la flottaison.
  const MARGE_GAUCHE = 10
  const x = (manche: number) =>
    MARGE_GAUCHE + (manche / manches) * (LARGEUR - MARGE_DROITE - MARGE_GAUCHE)
  const y = (valeur: number) =>
    MARGE_HAUT + ((haut - valeur) / amplitude) * (HAUTEUR - MARGE_HAUT - MARGE_BAS)

  const tracer = (courbe: number[]) =>
    courbe.map((valeur, manche) => `${x(manche)},${y(valeur)}`).join(" ")

  const courbeSuivie = trajectoires[suivi] ?? []
  const finSuivie = courbeSuivie[courbeSuivie.length - 1] ?? 0

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      /* Plafonnée : sur un écran large, une carte pleine largeur devient
         une fresque illisible. Sur téléphone, la limite ne s'applique jamais. */
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`Traversée sur ${manches} manche${manches > 1 ? "s" : ""}. ${joueurs[suivi]} termine à ${finSuivie} points.`}
    >
      {/*
        Ligne de flottaison : au-dessus on navigue, en dessous on coule.
        En cordage elle disparaissait sur le fond de carte ; en brume atténuée
        elle se lit sans jamais concurrencer les trajectoires.
      */}
      <line
        x1="10"
        x2={LARGEUR - MARGE_DROITE}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--color-brume)"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Sans ce repère, rien ne dit que la ligne pointillée vaut zéro. */}
      <text
        x="0"
        y={y(0) + 3}
        fill="var(--color-brume)"
        fillOpacity="0.6"
        fontSize="8"
        className="chiffres"
      >
        0
      </text>

      {/* Les autres joueurs, en retrait : ils donnent le peloton, pas le détail. */}
      {trajectoires.map((courbe, joueur) =>
        joueur === suivi ? null : (
          <polyline
            key={joueur}
            points={tracer(courbe)}
            fill="none"
            stroke="var(--color-brume)"
            strokeOpacity="0.3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}

      {/* Le joueur suivi passe devant, en or et plus épais. */}
      <polyline
        points={tracer(courbeSuivie)}
        fill="none"
        stroke="var(--color-or)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {courbeSuivie.map((valeur, manche) =>
        manche === 0 ? null : (
          <circle
            key={manche}
            cx={x(manche)}
            cy={y(valeur)}
            r={manche === manches ? 3 : 2}
            fill="var(--color-or)"
          />
        ),
      )}

      {/* Nom au bout de la ligne : l'identité ne dépend pas de la couleur. */}
      <text
        x={LARGEUR - MARGE_DROITE + 6}
        y={y(finSuivie) + 3}
        fill="var(--color-or)"
        fontSize="10"
        fontWeight="700"
      >
        {joueurs[suivi]}
      </text>
      <text
        x={LARGEUR - MARGE_DROITE + 6}
        y={y(finSuivie) + 15}
        fill="var(--color-brume)"
        fontSize="9"
        className="chiffres"
      >
        {finSuivie}
      </text>

      {/* Numéros de manche, discrets : ils raccordent la carte à la liste. */}
      {Array.from({ length: manches }, (_, i) => i + 1).map((manche) => (
        <text
          key={manche}
          x={x(manche)}
          y={HAUTEUR - 4}
          fill="var(--color-brume)"
          fillOpacity="0.6"
          fontSize="8"
          textAnchor="middle"
          className="chiffres"
        >
          {manche}
        </text>
      ))}
    </svg>
  )
}
