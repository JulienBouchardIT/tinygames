# Motus - Wordle en francais

Un clone du jeu Wordle en francais, jouable directement dans le navigateur.

**Jouer : https://julienbouchardit.github.io/tinygames/**

## Regles

Devinez le mot du jour en 6 essais. Chaque essai doit etre un mot valide de 5 lettres.
Apres chaque essai, la couleur des cases indique si vos lettres sont bien placees :

- **vert** : la lettre est dans le mot et bien placee
- **jaune** : la lettre est dans le mot mais mal placee
- **gris** : la lettre n'est pas dans le mot

Un nouveau mot est propose chaque jour. Apres une victoire ou une defaite, un bouton
"Nouvelle partie" permet de rejouer avec un mot aleatoire.

## Structure du projet

- `index.html` - structure de la page
- `style.css` - habillage visuel
- `script.js` - logique du jeu
- `words.csv` - liste des mots francais de 5 lettres utilises par le jeu

## Developpement local

Servez simplement le dossier avec un serveur HTTP statique, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.
