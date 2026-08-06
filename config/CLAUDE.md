# Skull King — feuille de score (PWA)

Application web installable pour tenir le score du jeu de cartes **Skull King**
(Grandpa Beck's Games, règle française Blackrock Games 2022).

Usage réel : plusieurs joueurs autour d'une table, **un seul téléphone** qui circule.
L'appli doit être utilisable d'une main, en une seconde, sans réfléchir.

---

## Stack imposée

- **Vite + React 19 + TypeScript** (mode `strict`)
- **Tailwind CSS**
- **vite-plugin-pwa** — installable et pleinement hors ligne
- **Vitest** pour le moteur de score
- Persistance : `localStorage` uniquement. Pas de backend, pas de compte, pas de réseau.

Français partout : interface, commentaires, noms de variables métier
(`mise`, `plis`, `manche`, `bonus`).

---

## Architecture — non négociable

```
src/
  engine/                   fonctions PURES — ni React, ni DOM, ni localStorage
    types.ts                types du domaine
    rules.ts                constantes de règles, formats, calendriers
    scoring.ts              score, cohérence des plis, trajectoires
    palmares.ts             agrégation des parties archivées
    __tests__/              scoring.test.ts · palmares.test.ts
  state/                    orchestration de la saisie et de la persistance
    useGame.ts              reducer + sauvegarde de la partie en cours
    usePalmares.ts          équipage enregistré + journal des parties
  components/               affichage seul
    SaisieJoueurs.tsx       accordéon partagé par Mises et Plis
    CarteTraversee.tsx      la feuille de score, en graphique
    Sillage.tsx             historique d'un joueur, au palmarès
    …                       un fichier par écran, plus Modale et Pastilles
  App.tsx                   assemblage des écrans
```

**`engine/` ne connaît ni React, ni le DOM, ni `localStorage`.**
Uniquement des fonctions pures : un état entre, un score sort.
Toute logique de calcul vit là et nulle part ailleurs.

Trois clés `localStorage`, volontairement séparées — effacer une partie ne
doit jamais emporter le palmarès :

| Clé | Contenu | Écrite quand |
|---|---|---|
| `skullking:partie` | la partie en cours | à chaque saisie |
| `skullking:equipage` | jusqu'à 30 noms, le plus récent en tête | au lancement d'une partie |
| `skullking:palmares` | jusqu'à 200 parties terminées | à la fin d'une partie complète |

Les sauvegardes anciennes sont migrées au chargement plutôt que rejetées :
une partie en cours sur un téléphone ne doit jamais être perdue par une mise
à jour. Voir `migrerOptions` et `migrerManche` dans `useGame.ts`.

---

## Modèle de données

```ts
type Systeme = "skullking" | "rascal";

type Manche = {
  cartes: number;              // cartes distribuées cette manche
  entrees: Entree[];           // une par joueur, même ordre que players[]
  alliances: [number, number][]; // paires d'indices de joueurs (Butin)
  plisDetruits: number;        // plis dévorés par le Kraken / la Baleine
};

type Entree = {
  mise: number | null;
  plis: number | null;
  quatorzeCouleur: number;   // 0–3 : cartes 14 vert/violet/jaune possédées
  quatorzeNoir: boolean;     // carte 14 noire
  sirenesCapturees: number;  // 0–2 : sirènes prises par un pirate
  piratesCaptures: number;   // 0–6 : pirates pris par le Skull King
  skullKingCapture: boolean; // Skull King pris par votre sirène
  boulet: boolean;           // Rascal : boulet de canon (sinon chevrotine)
  flambeur: 0 | 10 | 20;     // pari de Rascal le Flambeur
  harry: -1 | 0 | 1;         // ajustement de mise de Harry le Géant
};

type Partie = {
  joueurs: string[];           // 2 à 10
  systeme: Systeme;
  options: {
    bonusSiMiseExacte: boolean;  // variante ancienne édition
    bouletActif: boolean;        // Rascal uniquement
    butin: boolean;              // 2 cartes — alliances
    kraken: boolean;             // 1 carte — le pli est détruit
    baleineBlanche: boolean;     // 1 carte — pouvoirs annulés
    pouvoirsPirates: boolean;    // règle avancée : Flambeur + Harry
  };
  calendrier: number[];        // cartes par manche, ex. [1,2,3,4,5,6,7,8,9,10]
  mancheCourante: number;
  manches: Manche[];           // manches validées
  brouillon: Manche;           // manche en cours de saisie
  correction: number | null;   // index de la manche en cours de correction
};
```

---

## Règles de score — source de vérité

Ces règles viennent de la règle officielle française 2022.
**Ne pas les modifier, ne pas en inventer.**

### Système Skull King (classique)

| Situation | Points |
|---|---|
| Mise ≥ 1 exacte | `+20 × mise` |
| Mise ≥ 1 ratée | `−10 × |mise − plis|`, et rien pour les plis pris |
| Mise 0 tenue | `+10 × cartes de la manche` |
| Mise 0 ratée | `−10 × cartes de la manche` |

⚠️ La mise à zéro n'est **pas** `20 × 0`. C'est la formule à part ci-dessus.

### Système Rascal

Chaque manche vaut le même potentiel pour tous : `10 × cartes`.

| Précision | Points |
|---|---|
| Coup direct (écart 0) | 100 % du potentiel |
| Frappe à revers (écart 1) | 50 % du potentiel |
| Échec cuisant (écart ≥ 2) | 0 |

**Les bonus suivent le même multiplicateur** (100 % / 50 % / 0 %).

Option boulet de canon, choisie **par joueur et par manche** :
`15 × cartes` si la mise est exacte, `0` sinon — pas de demi-part.
Les bonus suivent : tout ou rien.

### Bonus (identiques aux deux systèmes)

| Bonus | Points |
|---|---|
| Carte 14 de couleur classique (vert, violet, jaune) possédée en fin de manche | 10 chacune |
| Carte 14 noire (drapeau pirate) | 20 |
| Sirène capturée par un pirate | 20 chacune |
| Pirate capturé par le Skull King (Tigresse-pirate comprise) | 30 chacun |
| Skull King capturé par votre sirène | 40 |
| Alliance Butin réussie | 20 à chacun des deux alliés |

Deux conditions à respecter précisément :

1. **Par défaut, les bonus sont acquis même si la mise est ratée** (règle 2022).
   L'option `bonusSiMiseExacte` rétablit le comportement des anciennes éditions.
2. **L'alliance Butin fait exception** : les 20 points ne sont accordés que si
   **les deux** alliés réussissent leur mise. Toujours, quelle que soit l'option.

### Pouvoirs de pirates

La règle en compte cinq. Trois — Rosie la Douce, Will le Bandit, Juanita Jade —
changent le déroulement du jeu, jamais le décompte : l'appli les ignore. Les
deux autres touchent au score.

**Rascal le Flambeur.** Pari de 0, 10 ou 20 points, posé **au moment de la
mise** : `+pari` si la mise est exacte, `−pari` sinon. Non soumis au
multiplicateur Rascal.

**Harry le Géant.** Ajuste sa mise de `+1`, `−1` ou la laisse telle quelle.
La règle en fait **le seul pirate dont le pouvoir s'emploie après le dernier
pli** : il connaît son résultat avant de corriger son annonce. L'ajustement se
saisit donc à l'étape Plis, à l'exact opposé du Flambeur. Il est borné à ce
qui est jouable, entre 0 et le nombre de cartes.

Le score se calcule sur la mise ainsi ajustée (`miseEffective`), mais
l'annonce d'origine reste affichée : le journal garde ce qui a été dit.

Ni l'un ni l'autre ne se débloque sans avoir remporté un pli avec le pirate
concerné — l'appli ne peut pas le savoir et fait confiance à la table.

### Formats de manches

```ts
classique  : [1,2,3,4,5,6,7,8,9,10]
pasDImpair : [2,4,6,8,10]
pretAuCombat: [6,7,8,9,10]
attaqueEclair: [5,5,5,5,5]
tirDeBarrage: Array(10).fill(10)
tourbillon : [9,7,5,3,1]
heureDuDodo: [1]
```

Le format donne le calendrier complet ; la mise en place permet de n'en jouer
que les `n` premières manches. Rien n'oblige à aller au bout des dix.

Paquet : 70 cartes de base. Chaque extension retenue ajoute les siennes —
Butin 2, Kraken 1, Baleine blanche 1 — soit 74 quand les trois sont en jeu.
Plafonner les cartes distribuées à `floor(paquet / nbJoueurs)`.

---

## Tests à écrire EN PREMIER

Écris `scoring.test.ts` avant toute interface. Cas obligatoires :

- Skull King : mise 3 réussie sur 5 cartes → +60
- Skull King : mise 2, 4 plis pris → −20
- Skull King : mise 0 tenue à la manche 7 → +70
- Skull King : mise 0, 2 plis pris à la manche 9 → −90
- Rascal : mise exacte sur 4 cartes → +40
- Rascal : écart de 1 sur 4 cartes → +20
- Rascal : écart de 2 sur 4 cartes → 0
- Rascal : bonus de 30 avec écart de 1 → +15 (multiplicateur appliqué)
- Boulet : mise exacte sur 6 cartes → +90 ; écart de 1 → 0
- Bonus par défaut acquis malgré une mise ratée
- Bonus annulés si `bonusSiMiseExacte` est actif et la mise ratée
- Butin : alliance non payée si un seul des deux allié réussit
- Flambeur 20 avec mise ratée → −20

---

## Interface

Déroulé d'une manche, un écran par étape :

**Mises → Plis → Bonus → Récapitulatif → validation**

- Saisie exclusivement par **boutons pastilles** (0 à N). Jamais de clavier
  numérique pour un nombre de plis.
- Mises et Plis se saisissent **en accordéon** : un seul joueur déplié à la
  fois, les autres sur une ligne. Toucher sa valeur ouvre le joueur suivant.
  À six joueurs et dix cartes, la liste dépliée déborderait de trois écrans.
- Le pari du Flambeur se pose **à l'étape Mises**, jamais après : à l'étape
  Bonus les plis sont connus et le pari ne risquerait plus rien.
- **Barre supérieure permanente** sur tous les écrans : accès au menu à gauche,
  au classement à droite. L'utilisateur ne doit jamais se retrouver bloqué.
- **Mini-classement toujours visible** pendant la saisie.
- Contrôle de cohérence : la somme des plis doit égaler `cartes - plisDetruits`.
  Les plis dévorés par le Kraken ou la Baleine blanche se **déclarent** à
  l'étape Plis, ils ne se devinent pas : le compte reste ainsi vérifiable au
  pli près, et l'auto-complétion des plis forcés reste juste. Seule exception,
  à deux joueurs : Barbe Grise remporte des plis sans marquer.
- **Correction d'une manche validée** : toucher une ligne du tableau récapitulatif
  la rouvre en saisie et recalcule tous les totaux suivants. Fonctionnalité
  essentielle, c'est la demande n°1 sur les applis concurrentes.
- Effacement de la dernière manche depuis le menu. Le mot « annuler » reste
  réservé au renvoi des modales : un bouton, une action, un seul sens.
- Modales internes pour toutes les confirmations. **Jamais `confirm()` natif** :
  il est bloqué dans certains contextes embarqués et l'action échoue en silence.

Accessibilité : cibles tactiles ≥ 44 px, focus clavier visible,
`prefers-reduced-motion` respecté.

Typographie : **Fraunces** pour les titres, **IBM Plex Mono** pour les nombres
et rien d'autre — sur une feuille de score les chiffres sont le sujet, et la
chasse fixe les aligne en colonnes. Le corps de texte reste en police système,
qui s'affiche sans attendre. Les deux polices sont auto-hébergées.

La feuille de score est **la carte de la traversée** : score cumulé en
ordonnée, manches en abscisse, une ligne par joueur. Un tableau à une colonne
par joueur déborde de l'écran dès quatre joueurs. Un seul joueur est mis en
avant à la fois, nommé au bout de sa ligne : la palette n'offre pas dix teintes
distinguables, et l'identité ne doit jamais tenir à la couleur seule.

---

## Configuration PWA

```ts
// vite.config.ts
VitePWA({
  registerType: "prompt",   // PAS autoUpdate — voir ci-dessous
  includeAssets: ["favicon.svg", "apple-touch-icon.png"],
  manifest: {
    name: "Skull King — Journal de bord",
    short_name: "Skull King",
    description: "Feuille de score pour le jeu de cartes Skull King",
    theme_color: "#071722",
    background_color: "#071722",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
  }
})
```

Points à ne pas rater :

- **`registerType: "prompt"`, pas `"autoUpdate"`.** Avec `autoUpdate`, un nouveau
  service worker peut prendre la main pendant une partie. Utiliser
  `useRegisterSW` depuis `virtual:pwa-register/react` et afficher un bandeau
  « Nouvelle version disponible » que l'utilisateur déclenche lui-même.
- **Polices auto-hébergées**, pas de CDN Google Fonts : sinon l'appli
  s'affiche sans ses polices en mode avion.
- **Icônes 192 et 512 px obligatoires** pour l'installabilité, plus une version
  `maskable` pour un rendu correct sur Android.
- `<meta name="viewport" content="... viewport-fit=cover">` et
  `env(safe-area-inset-bottom)` pour l'encoche iPhone.
- HTTPS requis pour le service worker — `localhost` fait exception en développement.

---

## Ordre de travail

Pour toute évolution du moteur, l'ordre reste le même : `types.ts` et
`rules.ts` d'abord, les tests ensuite, le calcul en dernier. Les constantes
chiffrées vivent dans `rules.ts` et nulle part ailleurs.

## Vérification

```sh
npm run test    # moteur de score — doit passer sans échec
npm run build   # tsc strict puis build de production — sans erreur
```

Le moteur est testé, l'interface non. Toute modification d'écran demande donc
un passage réel dans le navigateur : une erreur de câblage passe le
compilateur sans se voir.

### Audit Lighthouse

```sh
npx lighthouse@latest https://skull-self.vercel.app \
  --output=json --output-path=./lh.json \
  --chrome-flags="--headless=new" --quiet
```

Auditer l'URL de production, pas le serveur de développement : c'est ce build
qui tourne sur le téléphone, avec son HTTPS et son service worker réels.

**La catégorie « PWA » de Lighthouse n'existe plus**, supprimée en version 12.
Les audits `installable-manifest`, `service-worker`, `maskable-icon` et
`splash-screen` ont disparu avec elle. L'installabilité se vérifie donc à la
main — chaque point ci-dessous doit répondre en production :

| À vérifier | Attendu |
|---|---|
| `/manifest.webmanifest` | 200, `application/manifest+json` |
| `/sw.js` | 200, `Cache-Control: max-age=0, must-revalidate` |
| `/icon-192.png`, `/icon-512.png`, `/icon-512-maskable.png` | 200 |
| `/apple-touch-icon.png` | 200, et référencé dans le `<head>` |
| `/fonts/*.woff2` | 200 — sinon l'appli s'affiche nue en mode avion |
| Protocole | HTTPS |

Un `Cache-Control` long sur `sw.js` empêcherait toute mise à jour d'atteindre
les téléphones : c'est le piège principal, et `vercel.json` s'en charge.

### Test en mode avion

Le seul contrôle qu'aucun outil ne remplace. Appli installée sur l'écran
d'accueil, réseau coupé, une partie complète jouée. Il valide d'un coup le
précache, les polices auto-hébergées et la persistance `localStorage`.

---

## Palmarès

Les parties menées jusqu'à la dernière manche rejoignent un journal local
(`skullking:palmares`), séparé de la partie en cours. Un abandon en route n'y
entre pas : il fausserait les moyennes.

L'indicateur mis en avant est la **précision d'annonce** — mises tenues
exactement, rapportées aux manches jouées. C'est le seul chiffre comparable
d'une partie à l'autre : le cumul de points dépend surtout de la longueur de
la partie. Le classement suit les victoires, puis la précision ; classer sur
la seule précision hisserait en tête qui n'a joué qu'une partie chanceuse.

Chaque joueur porte un **sillage** : un point par partie, du plus ancien au
plus récent, la hauteur donnant le rang obtenu ramené au nombre de joueurs ce
soir-là. Or pour une victoire — l'or double la position, il ne la remplace
pas, une victoire étant déjà tout en haut.

---

## Hors périmètre

Pas de multijoueur, pas de synchronisation, pas de compte, pas d'analytics,
pas de publicité. Les données restent sur l'appareil.
