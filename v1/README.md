# Générateur de parties Marvel Champions — v1

Application web qui tire au sort une configuration de partie pour le jeu de cartes coopératif **Marvel Champions** (Fantasy Flight Games) : scénario, module de rencontre, difficulté, héros et affinités, en ne piochant que dans le matériel que vous possédez.

> Statut : **v1 terminée**. La suite du développement se passe dans [`../v2 (in progress)`](../v2%20(in%20progress)).

---

## Fonctionnalités

### 1. Sélection du matériel (`index.php`)
- Trois listes repliables (**Scénarios**, **Modules**, **Héros**) à cocher selon votre collection, chacune avec une case « Tout (dé)cocher ».
- Choix du **nombre de joueurs** (1 à 4).
- Les choix sont **enregistrés dans des cookies** (365 jours), donc retrouvés à la visite suivante.
- Avant de passer au tirage, l'appli vérifie qu'il y a au moins un scénario, au moins un module et au moins autant de héros que de joueurs.
- Un bandeau demande l'accord de l'utilisateur pour les cookies (Accepter / Refuser).

### 2. Tirage de la partie (`majeur.php`)
- Une liste déroulante par élément de la partie :
  - **Scénario**, **Module**, **Difficulté** (Standard / Expert)
  - **Un héros par joueur**
  - **Une affinité par joueur** (Agressivité, Commandement, Justice, Protection)
- Chaque liste démarre sur **« Aléatoire »**. Si vous voulez fixer un paramètre, il suffit de le choisir à la main.
- **« Générer tout l'Aléatoire »** tire tous les paramètres restés sur « Aléatoire ».
- Chaque paramètre a aussi son propre bouton pour être tiré à nouveau seul.
- Le tirage empêche les doublons : pas deux fois le même héros ni la même affinité.
- **Reset** remet tous les paramètres sur « Aléatoire ».
- L'illustration de chaque élément tiré s'affiche sous sa liste.
- Un clic sur le titre « MARVEL CHAMPIONS » ramène à l'accueil.

---

## Contenu disponible

Le contenu n'est **pas écrit dans le code** : il est construit à partir des images présentes dans `Generator/wwwroot/images/`, et le nom de chaque fichier (sans extension) devient le libellé affiché.

| Dossier                | Rôle                  | Nombre |
|------------------------|-----------------------|-------:|
| `images/scenarios/`    | Scénarios (méchants)  | 18     |
| `images/modules/`      | Modules de rencontre  | 29     |
| `images/heros/`        | Héros                 | 24     |
| `images/modes/`        | Difficultés           | 2      |
| `images/affinites/`    | Affinités             | 4      |
| `images/autres/`       | Visuels du site (fonds, « Aléatoire », intercalaires divers) | — |

**Ajouter une extension** : déposez simplement l'image (`.jpg`/`.png`) dans le bon dossier, nommée comme elle doit apparaître (ex. `images/heros/Wolverine.jpg`). Il n'y a rien d'autre à modifier.

---

## Stack technique

- **PHP** (sessions natives) : liste les images avec `glob()`, garde les listes en session et filtre côté serveur ce que l'utilisateur a décoché (via les cookies).
- **JavaScript / jQuery 1.12.4** : cookies, cases à cocher, tirage aléatoire, affichage des images.
- **Bootstrap 4.0** pour la mise en page, chargé depuis un CDN, et une feuille de style perso (`style.css`).
- Aucune base de données et aucune dépendance à installer.

---

## Arborescence

```
v1/
├── README.md
├── MC - Application web.docx     # Document de conception de l'application
├── demo-cookies.html             # Prototype autonome de la gestion des cookies multi-listes
└── Generator/
    └── wwwroot/                  # Racine du site web
        ├── index.php             # Page 1 : sélection du matériel et du nombre de joueurs
        ├── majeur.php            # Page 2 : tirage de la partie
        ├── script.js             # Logique front (cookies, tirage, affichage)
        ├── style.css             # Styles
        ├── favicon.ico
        ├── facebook_img.jpg      # Image de partage (Open Graph)
        ├── MC-update.zip         # Archive de mise à jour (index.php, script.js, style.css)
        ├── test/script.js        # Ancienne version de script.js (sans le bandeau cookies)
        └── images/               # Contenu du jeu (voir plus haut)
```

---

## Lancer le projet en local

PHP 7 ou plus récent suffit. `script.js` et les images sont chargés en chemin absolu (`/script.js`), donc `wwwroot` doit être **la racine** du serveur :

```bash
cd v1/Generator/wwwroot
php -S localhost:8000
```

Ouvrez ensuite <http://localhost:8000/index.php>.

> Il faut passer par `index.php` avant `majeur.php` : c'est `index.php` qui remplit la session PHP utilisée par la page de tirage.

## Déploiement

La v1 était hébergée sur **Azure App Service** (Windows/PHP), avec le contenu de `Generator/wwwroot` déployé à la racine du site.

---

## Limites connues

- Le nombre de joueurs n'est lu que dans le cookie `j`. Si les cookies sont refusés ou effacés, la page de tirage ne s'affiche pas correctement.
- Les choix « décoché » sont aussi stockés dans des cookies nommés d'après les éléments, donc un cookie par scénario, module et héros.
- jQuery et Bootstrap sont dans des versions anciennes et chargés depuis des CDN externes.

---

## Crédits

- Illustrations des intercalaires : un grand merci à **Stéphane Jarny** pour son [travail d'illustration](https://drive.google.com/drive/folders/1ZIDEIVUde8r_cukUIVEclr7lOi2zq_zP?usp=sharing).
- *Marvel Champions: The Card Game* est un jeu © Fantasy Flight Games / Marvel. Ce projet est une création de fan, sans but commercial ni lien officiel avec eux.
