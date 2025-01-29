# ON VA OU BABOU ?

Une application web interactive qui permet d'explorer le monde à travers un globe 3D interactif. Vous pouvez cliquer sur n'importe quel pays ou utiliser la barre de recherche pour obtenir des informations détaillées et la météo en temps réel.

## Fonctionnalités

- Globe 3D interactif avec rotation automatique
- Sélection des pays par clic ou recherche
- Affichage des informations du pays :
  - Nom commun et officiel
  - Capitale
  - Devise (nom et symbole)
  - Drapeau
- Affichage de la météo en temps réel :
  - Température en °C
  - Description des conditions météorologiques
  - Taux d'humidité

## Technologies Utilisées

- **Three.js** : Pour le rendu 3D du globe
- **GSAP** : Pour les animations
- **APIs** :
  - REST Countries : Pour les informations des pays
  - OpenWeatherMap : Pour les données météorologiques en temps réel

## Comment Utiliser

1. **Navigation sur le Globe** :
   - Utilisez la souris pour faire tourner le globe
   - Cliquez sur un pays pour voir ses informations

2. **Recherche** :
   - Tapez le nom d'un pays dans la barre de recherche
   - Appuyez sur Entrée pour voir les informations

## Structure du Code

- `index.html` : Structure de la page et importation des dépendances
- `script.js` : Logique principale (globe 3D, interactions, APIs)
- `style.css` : Styles et mise en page

## Crédits

Développé avec ❤️ par l'équipe BABOU
