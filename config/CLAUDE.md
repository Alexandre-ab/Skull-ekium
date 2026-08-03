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
  engine/
    types.ts            types du domaine
    scoring.ts          fonctions PURES de calcul
    rules.ts            constantes de règles, formats de manches
    __tests__/scoring.test.ts
  state/
    useGame.ts          reducer + persistance localStorage
  components/
  App.tsx
```

**`engine/` ne connaît ni React, ni le DOM, ni `localStorage`.**
Uniquement des fonctions pures : un état entre, un score sort.
Toute logique de calcul vit là et nulle part ailleurs.

---

## Modèle de données

```ts
type Systeme = "skullking" | "rascal";

type Manche = {
  cartes: number;              // cartes distribuées cette manche
  entrees: Entree[];           // une par joueur, même ordre que players[]
  alliances: [number, number][]; // paires d'indices de joueurs (Butin)
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
  flambeur: 0 | 10 | 20;     // pouvoir Rascal le Flambeur
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
    flambeurActif: boolean;
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

### Rascal le Flambeur

Pari de 0, 10 ou 20 points, posé au moment de la mise :
`+pari` si la mise est exacte, `−pari` sinon. Non soumis au multiplicateur Rascal.

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
- **Barre supérieure permanente** sur tous les écrans : accès au menu à gauche,
  au classement à droite. L'utilisateur ne doit jamais se retrouver bloqué.
- **Mini-classement toujours visible** pendant la saisie.
- Contrôle de cohérence : la somme des plis doit égaler le nombre de cartes.
  Exception si `kraken` ou `baleineBlanche` est actif — ces deux cartes
  détruisent des plis, un total inférieur est alors légitime. Le Butin, lui,
  n'en détruit aucun et ne justifie rien.
- **Correction d'une manche validée** : toucher une ligne du tableau récapitulatif
  la rouvre en saisie et recalcule tous les totaux suivants. Fonctionnalité
  essentielle, c'est la demande n°1 sur les applis concurrentes.
- Annulation de la dernière manche depuis le menu.
- Modales internes pour toutes les confirmations. **Jamais `confirm()` natif** :
  il est bloqué dans certains contextes embarqués et l'action échoue en silence.

Accessibilité : cibles tactiles ≥ 44 px, focus clavier visible,
`prefers-reduced-motion` respecté.

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

1. `types.ts` + `rules.ts`
2. `scoring.test.ts` — tous les cas ci-dessus, ils échouent
3. `scoring.ts` — jusqu'à ce que les tests passent
4. `useGame.ts` — reducer et persistance
5. Interface, écran par écran
6. Configuration PWA et icônes
7. Vérification : Lighthouse en mode PWA, puis test réel en mode avion

À la fin, `npm run build` doit passer sans erreur TypeScript et
`npm run test` sans échec.

---

## Hors périmètre

Pas de multijoueur, pas de synchronisation, pas de compte, pas d'analytics,
pas de publicité. Les données restent sur l'appareil.
