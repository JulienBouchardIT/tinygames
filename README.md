# TinyGames

Une petite collection de jeux de mots en francais, jouables directement dans le navigateur.

**Jouer : https://julienbouchardit.github.io/tinygames/**

La page d'accueil liste les jeux disponibles :

- **Motus** (`wordle/`) - clone de Wordle en francais
- **Boggle** (`boggle/`) - trouvez un maximum de mots dans une grille de lettres

## Motus

Devinez le mot du jour en 6 essais. Chaque essai doit etre un mot valide de 5 lettres.
Apres chaque essai, la couleur des cases indique si vos lettres sont bien placees :

- **vert** : la lettre est dans le mot et bien placee
- **jaune** : la lettre est dans le mot mais mal placee
- **gris** : la lettre n'est pas dans le mot

Un nouveau mot est propose chaque jour. Apres une victoire ou une defaite, un bouton
"Nouvelle partie" permet de rejouer avec un mot aleatoire.

## Boggle

Formez des mots de 3 a 8 lettres en reliant des lettres adjacentes (horizontalement,
verticalement ou en diagonale) sur une grille 5x5. Chaque case ne peut etre utilisee
qu'une seule fois par mot. Vous avez 3 minutes pour marquer un maximum de points
(1 point pour 3-4 lettres, 2 pour 5, 3 pour 6, 5 pour 7, 11 pour 8).

## Structure du projet

- `index.html`, `style.css` - page d'accueil listant les jeux
- `words.csv` - liste des mots francais de 5 lettres, utilisee par Motus
- `liste_francais.txt` - liste brute de mots francais de longueurs variees (source de `boggle/words.txt`)
- `wordle/` - jeu Motus (`index.html`, `script.js`, `style.css`)
- `boggle/` - jeu Boggle (`index.html`, `script.js`, `style.css`, `words.txt`)

## Developpement local

Servez simplement le dossier avec un serveur HTTP statique, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.
