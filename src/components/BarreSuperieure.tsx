/**
 * Barre supérieure permanente : menu à gauche, classement à droite.
 * Présente sur tous les écrans — l'utilisateur ne doit jamais se retrouver bloqué.
 */

type Props = {
  titre: string
  sousTitre?: string
  onMenu: () => void
  onClassement: () => void
}

export function BarreSuperieure({ titre, sousTitre, onMenu, onClassement }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-pont barre-voilee px-2 py-2">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Ouvrir le menu"
        className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-pont text-ecume"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
          <rect x="2" y="4" width="16" height="2" rx="1" />
          <rect x="2" y="9" width="16" height="2" rx="1" />
          <rect x="2" y="14" width="16" height="2" rx="1" />
        </svg>
      </button>

      <div className="min-w-0 flex-1 text-center">
        <div className="titre truncate text-sm text-ecume">{titre}</div>
        {sousTitre && <div className="truncate text-xs text-brume">{sousTitre}</div>}
      </div>

      <button
        type="button"
        onClick={onClassement}
        aria-label="Voir le classement"
        className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-pont text-ecume"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
          <rect x="2" y="11" width="4" height="7" rx="1" />
          <rect x="8" y="6" width="4" height="12" rx="1" />
          <rect x="14" y="9" width="4" height="9" rx="1" />
        </svg>
      </button>
    </header>
  )
}
