/** Menu : annulation de la dernière manche, abandon de la partie. */

import { LIBELLES_FORMATS, type FormatManches, FORMATS_MANCHES } from "../engine/rules"
import type { Jeu } from "../state/useGame"

type Props = {
  jeu: Jeu
  onFermer: () => void
  onAnnulerManche: () => void
  onAbandonner: () => void
  onPalmares: () => void
}

export function Menu({
  jeu,
  onFermer,
  onAnnulerManche,
  onAbandonner,
  onPalmares,
}: Props) {
  const { partie, terminee } = jeu
  if (!partie) return null

  // Retrouve le format d'origine pour l'afficher — le calendrier seul est stocké.
  const format = (Object.keys(FORMATS_MANCHES) as FormatManches[]).find(
    (id) =>
      FORMATS_MANCHES[id].length === partie.calendrier.length &&
      FORMATS_MANCHES[id].every((c, i) => c === partie.calendrier[i]),
  )

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onFermer}>
      <div className="absolute inset-0 bg-abysse/80" />
      <nav
        aria-label="Menu"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-72 max-w-[85%] flex-col border-r border-pont bg-coque"
      >
        <div className="border-b border-pont p-4">
          <div className="titre-grave text-sm text-or">Skull King</div>
          <div className="text-xs text-brume">
            {partie.joueurs.length} joueurs ·{" "}
            {partie.systeme === "skullking" ? "Skull King" : "Rascal"}
          </div>
          <div className="text-xs text-brume">
            {format ? LIBELLES_FORMATS[format] : `${partie.calendrier.length} manches`}
          </div>
          <div className="mt-1 text-xs text-brume">
            Manche {Math.min(partie.mancheCourante + 1, partie.calendrier.length)} sur{" "}
            {partie.calendrier.length}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          <button
            type="button"
            onClick={onAnnulerManche}
            disabled={partie.manches.length === 0}
            className="min-h-12 w-full rounded-xl border border-pont px-3 text-left text-sm text-ecume disabled:opacity-30"
          >
            Annuler la dernière manche
            <span className="block text-xs text-brume">
              {partie.manches.length === 0
                ? "Aucune manche validée"
                : `Manche ${partie.manches.length}`}
            </span>
          </button>

          {partie.correction !== null && (
            <button
              type="button"
              onClick={() => {
                jeu.abandonnerCorrection()
                onFermer()
              }}
              className="min-h-12 w-full rounded-xl border border-or px-3 text-left text-sm text-or"
            >
              Abandonner la correction
              <span className="block text-xs text-brume">
                Manche {partie.correction + 1} en cours de correction
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onPalmares}
            className="min-h-12 w-full rounded-xl border border-pont px-3 text-left text-sm text-ecume"
          >
            Palmarès
            <span className="block text-xs text-brume">
              Classement général et parties passées
            </span>
          </button>

          <button
            type="button"
            onClick={onAbandonner}
            className={[
              "min-h-12 w-full rounded-xl border px-3 text-left text-sm",
              terminee ? "border-or text-or" : "border-babord text-babord",
            ].join(" ")}
          >
            Terminer la partie
            <span className="block text-xs text-brume">
              {terminee ? "Enregistrée au palmarès" : "Les scores seront perdus"}
            </span>
          </button>
        </div>

        <div className="border-t border-pont p-3 text-xs text-brume">
          Les données restent sur cet appareil. Aucun compte, aucun réseau.
        </div>
      </nav>
    </div>
  )
}
