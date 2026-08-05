/**
 * Palmarès : classement global sur toutes les parties terminées,
 * journal des parties, et gestion de l'équipage enregistré.
 */

import { useState } from "react"
import { Modale } from "./Modale"
import { Sillage } from "./Sillage"
import { vainqueurs } from "../engine/palmares"
import type { StatsJoueur } from "../engine/types"
import type { Palmares } from "../state/usePalmares"

type Props = {
  palmares: Palmares
  onFermer: () => void
}

/** Confirmations ouvertes en modale — jamais `confirm()` natif. */
type Confirmation = { type: "viderJournal" } | { type: "oublierJoueur"; nom: string } | null

const DATE_COURTE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function EcranPalmares({ palmares, onFermer }: Props) {
  const { classementGlobal, parties, equipage } = palmares
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  // Une seule fiche dépliée : en ouvrir plusieurs ramènerait le défilement.
  const [detaille, setDetaille] = useState<string | null>(null)

  return (
    <div className="pb-6">
      {/* ── Classement global ── */}
      <section aria-labelledby="titre-global" className="px-3 pt-3">
        <h2 id="titre-global" className="mb-2 text-xs font-bold text-brume">
          Classement général
        </h2>

        {classementGlobal.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pont p-4 text-center text-sm text-brume">
            Aucune partie terminée pour l'instant. Le palmarès se remplit à la fin
            de chaque partie jouée jusqu'à la dernière manche.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {classementGlobal.map((fiche, i) => (
              <LigneFiche
                key={fiche.nom}
                rang={i + 1}
                fiche={fiche}
                ouvert={detaille === fiche.nom}
                onBasculer={() =>
                  setDetaille((actuel) => (actuel === fiche.nom ? null : fiche.nom))
                }
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Journal des parties ── */}
      {parties.length > 0 && (
        <section aria-labelledby="titre-journal" className="mt-6 px-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="titre-journal" className="text-xs font-bold text-brume">
              Parties jouées
              <span className="ml-2 font-normal chiffres">{parties.length}</span>
            </h2>
            <button
              type="button"
              onClick={() => setConfirmation({ type: "viderJournal" })}
              className="min-h-9 rounded-lg px-2 text-xs text-babord"
            >
              Tout effacer
            </button>
          </div>

          <ul className="space-y-1.5">
            {parties.map((partie) => {
              const gagnants = vainqueurs(partie.totaux)
              const meilleur = partie.totaux[gagnants[0] ?? 0] ?? 0
              return (
                <li
                  key={partie.id}
                  className="flex items-center gap-3 rounded-2xl carte p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ecume">
                      {gagnants.map((i) => partie.joueurs[i]).join(" & ") || "—"}
                      <span className="ml-2 font-normal text-or chiffres">
                        {meilleur}
                      </span>
                    </div>
                    <div className="truncate text-xs text-brume">
                      {DATE_COURTE.format(new Date(partie.date))} ·{" "}
                      {partie.joueurs.length} joueurs ·{" "}
                      {partie.systeme === "skullking" ? "Skull King" : "Rascal"} ·{" "}
                      {partie.manches} manche{partie.manches > 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => palmares.oublierPartie(partie.id)}
                    aria-label={`Effacer la partie du ${DATE_COURTE.format(new Date(partie.date))}`}
                    className="min-h-11 min-w-11 shrink-0 rounded-xl border border-pont text-brume"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Équipage enregistré ── */}
      {equipage.length > 0 && (
        <section aria-labelledby="titre-equipage" className="mt-6 px-3">
          <h2 id="titre-equipage" className="mb-2 text-xs font-bold text-brume">
            Équipage enregistré
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {equipage.map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => setConfirmation({ type: "oublierJoueur", nom })}
                aria-label={`Oublier ${nom}`}
                className="flex min-h-11 items-center gap-2 rounded-xl carte px-3 text-sm text-ecume"
              >
                {nom}
                <span aria-hidden="true" className="text-brume">
                  ×
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-brume">
            Ces noms sont proposés d'un toucher à la mise en place. Les oublier
            ne retire rien du classement.
          </p>
        </section>
      )}

      <div className="mt-6 px-3">
        <button
          type="button"
          onClick={onFermer}
          className="min-h-12 w-full rounded-xl border border-pont text-ecume"
        >
          Retour
        </button>
      </div>

      {confirmation?.type === "viderJournal" && (
        <Modale
          titre="Effacer tout le palmarès ?"
          libelleConfirmer="Tout effacer"
          danger
          onAnnuler={() => setConfirmation(null)}
          onConfirmer={() => {
            palmares.viderJournal()
            setConfirmation(null)
          }}
        >
          Les {parties.length} parties archivées et le classement général seront
          perdus. L'équipage enregistré, lui, est conservé.
        </Modale>
      )}

      {confirmation?.type === "oublierJoueur" && (
        <Modale
          titre={`Oublier ${confirmation.nom} ?`}
          libelleConfirmer="Oublier"
          danger
          onAnnuler={() => setConfirmation(null)}
          onConfirmer={() => {
            palmares.oublierJoueur(confirmation.nom)
            setConfirmation(null)
          }}
        >
          Le nom ne sera plus proposé à la mise en place. Ses parties déjà jouées
          restent au classement général.
        </Modale>
      )}
    </div>
  )
}

/* ═══════════ Ligne de classement général ═══════════ */

type LigneProps = {
  rang: number
  fiche: StatsJoueur
  ouvert: boolean
  onBasculer: () => void
}

function LigneFiche({ rang, fiche, ouvert, onBasculer }: LigneProps) {
  return (
    <li className={rang === 1 ? "rounded-2xl carte-or" : "rounded-2xl carte"}>
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={ouvert}
        className="flex min-h-14 w-full items-center gap-3 p-3 text-left"
      >
        <span className="w-5 shrink-0 text-center text-sm text-brume chiffres">
          {rang}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-ecume">{fiche.nom}</span>
          <span className="block truncate text-xs text-brume">
            {fiche.victoires} victoire{fiche.victoires > 1 ? "s" : ""} ·{" "}
            {fiche.parties} partie{fiche.parties > 1 ? "s" : ""}
          </span>
        </span>

        <Sillage resultats={fiche.sillage} nom={fiche.nom} />

        {/* La précision d'annonce, pas le cumul de points : c'est le seul
            chiffre comparable d'une partie à l'autre, quelle que soit sa durée. */}
        <span className="w-12 shrink-0 text-right">
          {fiche.precision === null ? (
            <span className="text-sm text-brume">—</span>
          ) : (
            <span className="text-lg font-bold text-or chiffres">
              {Math.round(fiche.precision * 100)}
              <span className="text-xs font-normal">%</span>
            </span>
          )}
        </span>
      </button>

      {ouvert && (
        <dl className="grid grid-cols-3 gap-2 border-t border-pont p-3 text-center">
          <Chiffre libelle="Moyenne" valeur={`${Math.round(fiche.moyenne)}`} />
          <Chiffre libelle="Meilleure partie" valeur={`${fiche.meilleur}`} />
          <Chiffre
            libelle="Mises tenues"
            valeur={
              fiche.manchesMesurees === 0
                ? "—"
                : `${fiche.misesExactes} / ${fiche.manchesMesurees}`
            }
          />
        </dl>
      )}
    </li>
  )
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] text-brume">{libelle}</dt>
      <dd className="text-sm font-bold text-ecume chiffres">{valeur}</dd>
    </div>
  )
}
