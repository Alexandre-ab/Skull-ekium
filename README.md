# Skull King — Journal de bord

Feuille de score installable pour le jeu de cartes **Skull King**
(Grandpa Beck's Games, règle française Blackrock Games 2022).

Pensée pour l'usage réel : plusieurs joueurs autour d'une table, un seul
téléphone qui circule. Saisie d'un pouce, sans réfléchir, hors ligne.

**En ligne : [skull-self.vercel.app](https://skull-self.vercel.app)**

## Ce qu'elle fait

- Les deux systèmes de décompte : **Skull King** classique et **Rascal**
- Bonus complets : cartes 14, sirènes, pirates, Skull King, alliances Butin
- Options : bonus conditionnés à la mise exacte, boulet de canon, extensions,
  pouvoir Rascal le Flambeur
- Sept formats de manches, du classique à l'Heure du dodo
- Saisie en quatre étapes — mises, plis, bonus, récapitulatif — par pastilles,
  jamais au clavier numérique
- **Correction d'une manche déjà validée** : toucher sa ligne la rouvre et
  recalcule tous les totaux suivants
- **Palmarès local** : équipage mémorisé pour relancer vite, et classement
  général sur les parties terminées

## Installer sur le téléphone

- **iPhone** — ouvrir le lien dans Safari, Partager → « Sur l'écran d'accueil ».
  Chrome iOS ne sait pas installer de PWA.
- **Android** — Chrome propose « Installer l'application ».

Une fois installée, l'appli fonctionne en mode avion. Un bandeau signale les
nouvelles versions ; c'est l'utilisateur qui déclenche la mise à jour, jamais
au milieu d'une partie.

## Données

Tout vit en `localStorage`, sur l'appareil : partie en cours, équipage
enregistré, palmarès. Pas de compte, pas de réseau, pas d'analytics. Rien ne
se synchronise d'un appareil à l'autre — c'est le prix de cette promesse.

## Développement

```sh
npm install
npm run dev     # serveur local
npm run test    # moteur de score, 82 cas
npm run build   # tsc strict puis build de production
```

Le dossier `src/engine/` ne connaît ni React, ni le DOM, ni `localStorage` :
uniquement des fonctions pures. Toute la logique de calcul y vit et nulle part
ailleurs. `src/state/` orchestre la saisie et la persistance, `src/components/`
n'affiche.

Les règles de score font foi telles qu'elles sont écrites dans
[`config/CLAUDE.md`](config/CLAUDE.md) — elles viennent de la règle officielle,
elles ne s'inventent pas.
