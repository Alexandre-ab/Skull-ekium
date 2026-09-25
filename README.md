# Skull King — Journal de bord

Feuille de score installable pour le jeu de cartes **Skull King**
(Grandpa Beck's Games, règle française Blackrock Games 2022).

Pensée pour l'usage réel : plusieurs joueurs autour d'une table, un seul
téléphone qui circule. Saisie d'un pouce, sans réfléchir, hors ligne.

**En ligne : [skull-self.vercel.app](https://skull-self.vercel.app)**

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Prérequis](#prérequis)
4. [Installation et lancement](#installation-et-lancement)
5. [Scripts npm](#scripts-npm)
6. [Structure du projet](#structure-du-projet)
7. [Architecture](#architecture)
8. [Règles de score](#règles-de-score)
9. [Données et vie privée](#données-et-vie-privée)
10. [Tests](#tests)
11. [Déploiement](#déploiement)
12. [Installer sur le téléphone](#installer-sur-le-téléphone)
13. [Workflow Git](#workflow-git)
14. [Hors périmètre](#hors-périmètre)

---

## Fonctionnalités

- Les deux systèmes de décompte : **Skull King** classique et **Rascal**
- Bonus complets : cartes 14, sirènes, pirates, Skull King, alliances Butin
- Options : bonus conditionnés à la mise exacte, boulet de canon, extensions
  (Butin, Kraken, Baleine blanche), pouvoirs de pirates (Rascal le Flambeur,
  Harry le Géant)
- Sept formats de manches, du classique à l'Heure du dodo
- Saisie en quatre étapes — **mises, plis, bonus, récapitulatif** — par
  pastilles, jamais au clavier numérique
- Contrôle de cohérence : la somme des plis doit égaler les cartes distribuées,
  moins les plis dévorés par le Kraken ou la Baleine
- **Correction d'une manche déjà validée** : toucher sa ligne la rouvre et
  recalcule tous les totaux suivants
- Feuille de score en graphique (« carte de la traversée ») : score cumulé
  par manche, une ligne par joueur
- **Palmarès local** : équipage mémorisé pour relancer vite, classement
  général et précision d'annonce sur les parties terminées
- **PWA installable**, entièrement utilisable en mode avion

---

## Stack technique

| Outil | Rôle |
|---|---|
| [React 19](https://react.dev) | Interface |
| [TypeScript 6](https://www.typescriptlang.org) (mode `strict`) | Typage |
| [Vite 8](https://vite.dev) | Serveur de développement et build |
| [Tailwind CSS 4](https://tailwindcss.com) | Styles |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Service worker, manifeste, hors ligne |
| [Vitest 4](https://vitest.dev) | Tests du moteur de score |
| [Vercel](https://vercel.com) | Hébergement |

Aucune dépendance d'exécution en dehors de React : pas de backend, pas de base
de données, pas de bibliothèque d'état.

---

## Prérequis

- **Node.js 20.19 ou plus récent** (exigence de Vite 8 — le projet est
  développé sous Node 24)
- **npm** (livré avec Node)
- Git

Vérifier les versions installées :

```sh
node -v
npm -v
```

---

## Installation et lancement

```sh
# 1. Récupérer le projet
git clone https://github.com/Alexandre-ab/Skull-ekium.git
cd Skull-ekium

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application est alors disponible sur <http://localhost:5173>.

Pour tester le comportement réel de la PWA (service worker, hors ligne), il
faut passer par le build de production :

```sh
npm run build
npm run preview   # sert le dossier dist/ sur http://localhost:4173
```

---

## Scripts npm

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Vérification TypeScript stricte (`tsc -b`), puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production en local |
| `npm run test` | Lance les tests une fois |
| `npm run test:watch` | Relance les tests à chaque modification |

---

## Structure du projet

```
.
├── config/
│   ├── CLAUDE.md            spécification complète : règles, modèle, interface
│   └── reference.html       maquette de référence de l'interface
├── public/                  fichiers servis tels quels
│   ├── fonts/               Fraunces et IBM Plex Mono, auto-hébergées (licence OFL)
│   └── icon-*.png           icônes de la PWA (192, 512, maskable)
├── src/
│   ├── engine/              moteur de score — fonctions pures
│   │   ├── types.ts         types du domaine (Partie, Manche, Entree…)
│   │   ├── rules.ts         constantes de règles, formats de manches
│   │   ├── scoring.ts       calcul des scores, cohérence des plis
│   │   ├── palmares.ts      agrégation des parties terminées
│   │   └── __tests__/       tests du moteur
│   ├── state/               orchestration et persistance
│   │   ├── useGame.ts       reducer de la partie + sauvegarde + migrations
│   │   ├── usePalmares.ts   équipage enregistré et journal des parties
│   │   └── __tests__/       tests de migration des sauvegardes
│   ├── components/          un fichier par écran, plus les briques partagées
│   ├── App.tsx              assemblage des écrans
│   ├── main.tsx             point d'entrée
│   └── index.css            styles globaux, polices et thème Tailwind
├── index.html
├── vite.config.ts           configuration Vite, PWA et Vitest
├── vercel.json              en-têtes de cache du service worker
└── package.json
```

---

## Architecture

Le code est découpé en trois couches, chacune ignorant celle du dessus :

1. **`src/engine/`** ne connaît ni React, ni le DOM, ni `localStorage`.
   Uniquement des fonctions pures : un état entre, un score sort. Toute la
   logique de calcul y vit et nulle part ailleurs, ce qui la rend testable
   sans navigateur.
2. **`src/state/`** orchestre la saisie (un reducer React) et la persistance.
3. **`src/components/`** se contente d'afficher et de transmettre les actions.

Toutes les valeurs chiffrées des règles (20 points par pli, 10 par carte pour
une mise à zéro…) sont des constantes nommées dans `rules.ts`. Aucun nombre
magique dans le calcul.

**Mises à jour sans risque.** Le service worker est en mode `prompt` : une
nouvelle version s'annonce par un bandeau, et c'est l'utilisateur qui la
déclenche — jamais au milieu d'une partie. Les sauvegardes d'anciennes
versions sont migrées au chargement plutôt que rejetées, pour qu'une mise à
jour ne fasse jamais perdre une partie en cours.

La spécification détaillée, qui fait foi, est dans
[`config/CLAUDE.md`](config/CLAUDE.md).

---

## Règles de score

Elles viennent de la règle officielle française 2022 et ne s'inventent pas.
Résumé :

### Système Skull King (classique)

| Situation | Points |
|---|---|
| Mise ≥ 1 exacte | `+20 × mise` |
| Mise ≥ 1 ratée | `−10 × écart`, rien pour les plis pris |
| Mise 0 tenue | `+10 × cartes de la manche` |
| Mise 0 ratée | `−10 × cartes de la manche` |

### Système Rascal

Chaque manche vaut le même potentiel pour tous : `10 × cartes`.

| Précision | Part du potentiel |
|---|---|
| Écart 0 — coup direct | 100 % |
| Écart 1 — frappe à revers | 50 % |
| Écart ≥ 2 — échec cuisant | 0 % |

Les bonus suivent le même multiplicateur. Option **boulet de canon** : `15 ×
cartes` si la mise est exacte, `0` sinon.

### Bonus

| Bonus | Points |
|---|---|
| Carte 14 de couleur (vert, violet, jaune) | 10 chacune |
| Carte 14 noire | 20 |
| Sirène capturée par un pirate | 20 chacune |
| Pirate capturé par le Skull King | 30 chacun |
| Skull King capturé par une sirène | 40 |
| Alliance Butin, si les **deux** alliés tiennent leur mise | 20 chacun |

Par défaut, les bonus sont acquis même si la mise est ratée (règle 2022) ;
une option rétablit le comportement des anciennes éditions.

---

## Données et vie privée

Tout vit en `localStorage`, sur l'appareil. Trois clés volontairement
séparées, pour qu'effacer une partie n'emporte jamais le palmarès :

| Clé | Contenu |
|---|---|
| `skullking:partie` | la partie en cours, sauvegardée à chaque saisie |
| `skullking:equipage` | jusqu'à 30 noms de joueurs récents |
| `skullking:palmares` | jusqu'à 200 parties terminées |

Pas de compte, pas de réseau, pas d'analytics. Rien ne se synchronise d'un
appareil à l'autre — c'est le prix de cette promesse.

---

## Tests

```sh
npm run test
```

**123 tests**, répartis en trois fichiers :

| Fichier | Couvre |
|---|---|
| `src/engine/__tests__/scoring.test.ts` | les deux systèmes de score, bonus, options, pouvoirs de pirates, cohérence des plis |
| `src/engine/__tests__/palmares.test.ts` | classement général, précision d'annonce, sillage des joueurs |
| `src/state/__tests__/migration.test.ts` | reprise des sauvegardes d'anciennes versions |

Le moteur est testé, l'interface non : toute modification d'écran se vérifie
en passant réellement dans le navigateur.

---

## Déploiement

Le site est hébergé sur **Vercel**, qui détecte Vite automatiquement :
commande de build `npm run build`, dossier publié `dist/`.

`vercel.json` interdit la mise en cache de `sw.js` et du manifeste. Sans ça,
un `Cache-Control` long empêcherait les mises à jour d'atteindre les
téléphones.

Le HTTPS est obligatoire pour le service worker ; `localhost` fait exception
en développement.

---

## Installer sur le téléphone

- **iPhone** — ouvrir le lien dans Safari, Partager → « Sur l'écran
  d'accueil ». Chrome iOS ne sait pas installer de PWA.
- **Android** — Chrome propose « Installer l'application ».

Une fois installée, l'appli fonctionne en mode avion.

---

## Workflow Git

Le dépôt suit un modèle à deux branches permanentes, inspiré de Git Flow :

| Branche | Rôle |
|---|---|
| `main` | Version stable, celle qui est en production. On n'y commite jamais directement. |
| `develop` | Branche d'intégration : c'est là que le travail avance. |

Cycle de travail :

```sh
# Travailler sur develop (ou sur une branche de fonctionnalité issue de develop)
git switch develop
git switch -c feature/ma-fonctionnalite
# … commits …
git switch develop
git merge --no-ff feature/ma-fonctionnalite

# Livrer : une fois develop stable (tests et build au vert)
git switch main
git merge --no-ff develop
git push origin main develop
```

Avant toute fusion vers `main`, `npm run test` et `npm run build` doivent
passer sans erreur.

Les messages de commit sont en français, à l'indicatif présent, et décrivent
ce que fait le commit : « Ajoute le pouvoir de Harry le Géant ».

**Fichiers exclus du dépôt** (voir [`.gitignore`](.gitignore)) :
`node_modules/` et `dist/` (régénérables), journaux, fichiers d'éditeur,
configuration locale Vercel et Claude Code, et le PDF de la règle officielle,
sous droits.

---

## Hors périmètre

Pas de multijoueur, pas de synchronisation, pas de compte, pas d'analytics,
pas de publicité. Les données restent sur l'appareil.
