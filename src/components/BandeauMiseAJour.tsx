/**
 * Bandeau « Nouvelle version disponible ».
 *
 * Le service worker est enregistré en mode `prompt` : la mise à jour n'est
 * appliquée que sur action de l'utilisateur, jamais au milieu d'une partie.
 */

import { useRegisterSW } from "virtual:pwa-register/react"

export function BandeauMiseAJour() {
  const {
    needRefresh: [besoinRechargement, setBesoinRechargement],
    updateServiceWorker,
  } = useRegisterSW()

  if (!besoinRechargement) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-or bg-coque p-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <span className="min-w-0 flex-1 text-sm text-ecume">
          Nouvelle version disponible.
          <span className="block text-xs text-brume">
            La partie en cours est conservée.
          </span>
        </span>
        <button
          type="button"
          onClick={() => setBesoinRechargement(false)}
          className="min-h-11 rounded-xl border border-pont px-3 text-sm text-brume"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="min-h-11 rounded-xl bg-or px-3 text-sm font-bold text-abysse"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  )
}
