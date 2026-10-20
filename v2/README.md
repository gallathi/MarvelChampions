# Générateur Marvel Champions — v2

Tire au sort une partie de **Marvel Champions** (méchant, modules, difficulté, héros et affinités) parmi le matériel que vous possédez. Refonte de la [v1](../v1).

## Fonctionnalités

- **Collection** : cochez les extensions que vous possédez (boîte de base, Crâne Rouge…), puis ajustez carte par carte. Aux visites suivantes, le site s'ouvre directement sur la partie.
- **Partie** : réglez le nombre de joueurs (1 à 4) et de modules (1 à 3).
- **Tirage** : verrouillez un élément pour le garder, relancez-en un seul ou choisissez-le à la main.
- **Partage** : un lien recrée la même partie chez un ami.
- **Historique** : le bouton « On joue ! » enregistre la partie. Vous pouvez ensuite indiquer victoire ou défaite, voir les héros les moins joués et exporter ou importer l'historique.
- **Succès** : 12 succès, des plus faciles (première partie) aux plus longs (jouer tous ses héros).
- **Option « Favoriser les moins joués »** : les héros et méchants rarement joués sortent plus souvent au tirage.

Le site est 100 % statique, sans framework. Il s'adapte au mobile et peut s'installer sur l'écran d'accueil. Les choix sont enregistrés dans le navigateur.

## Démarrer

Node.js 20.9+ est nécessaire pour les outils uniquement (exigence de `sharp`).

```bash
npm install       # une fois
npm run dev       # http://localhost:8000
npm test
```

## Ajouter du contenu

Déposez l'image dans `public/images/<scenarios|modules|heros|modes|affinites>/`. Le nom du fichier devient le libellé affiché. Lancez ensuite `npm run content`, qui convertit l'image en WebP, génère ses miniatures et met à jour `public/data/content.json`, puis committez le tout. Si l'élément fait partie d'une boîte ou d'un paquet de scénario, ajoutez son identifiant dans `public/js/extensions.js` (`npm test` vérifie que chaque identifiant existe). L'illustration d'une extension se dépose dans `public/images/extensions/<identifiant>.webp` (toute la couverture est affichée, quel que soit son format).

## Déployer

Publiez le dossier `public/` sur n'importe quel hébergeur statique (GitHub Pages, Azure Static Web Apps…).

## Crédits

Illustrations des intercalaires : **Stéphane Jarny**.
Projet de fan non officiel. *Marvel Champions: The Card Game* © Fantasy Flight Games / Marvel.
