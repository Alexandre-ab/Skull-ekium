/**
 * Modale interne de confirmation.
 *
 * Jamais `confirm()` natif : il est bloqué dans certains contextes embarqués
 * (webview, PWA installée), et l'action échouerait alors en silence.
 */

import { useEffect, useRef } from "react"

type Props = {
  titre: string
  children?: React.ReactNode
  libelleConfirmer: string
  onConfirmer: () => void
  onAnnuler: () => void
  /** Action destructrice : le bouton passe en rouge. */
  danger?: boolean
}

export function Modale({
  titre,
  children,
  libelleConfirmer,
  onConfirmer,
  onAnnuler,
  danger = false,
}: Props) {
  const confirmer = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmer.current?.focus()
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnnuler()
    }
    document.addEventListener("keydown", auClavier)
    return () => document.removeEventListener("keydown", auClavier)
  }, [onAnnuler])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-abysse/80 p-4 sm:items-center"
      onClick={onAnnuler}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl carte p-5 shadow-2xl"
      >
        <h2 className="titre text-lg text-ecume">{titre}</h2>
        {children && <div className="mt-2 text-sm text-brume">{children}</div>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAnnuler}
            className="min-h-11 flex-1 rounded-xl border border-pont text-ecume"
          >
            Annuler
          </button>
          <button
            ref={confirmer}
            type="button"
            onClick={onConfirmer}
            className={[
              "min-h-11 flex-1 rounded-xl font-bold",
              danger ? "bg-babord text-ecume" : "bg-or text-abysse",
            ].join(" ")}
          >
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  )
}
