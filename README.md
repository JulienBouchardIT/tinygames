# TinyGames

Une petite collection de jeux de mots en francais, jouables directement dans le navigateur.

**Jouer : https://julienbouchardit.github.io/tinygames/**

La page d'accueil liste les jeux disponibles :

- **Motus** (`wordle/`) - clone de Wordle en francais
- **Boggle** (`boggle/`) - trouvez un maximum de mots dans une grille de lettres
- **Zip** (`zip/`) - reliez les chiffres dans l'ordre en parcourant toute la grille
- **Queens** (`queens/`) - placez une reine par ligne, colonne et region sans qu'elles se touchent
- **Blackjack** (`blackjack/`) - battez le croupier en approchant 21 sans le depasser

Chaque page affiche dans son entete le nombre de pieces du joueur. Ce solde est commun a
tous les jeux (stocke dans le `localStorage` du navigateur, cle `tinygames-coins`, 100
pieces au demarrage) : trouver un mot dans Boggle rapporte 1 piece, terminer Zip 10,
terminer Queens 15 et gagner a Motus 25. Ces pieces servent de mise au Blackjack.

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

## Zip

Reliez les chiffres 1, 2, 3... dans l'ordre en traçant un chemin entre cases voisines
(horizontalement ou verticalement), sans repasser deux fois par la même case. Le chemin
doit couvrir toutes les cases de la grille. Cliquez ou glissez d'une case à l'autre pour
tracer le chemin ; cliquez sur la dernière case tracée pour revenir en arrière.

## Queens

Placez une reine par ligne, par colonne et par région colorée, de sorte qu'aucune reine ne
touche une autre reine, même en diagonale. Cliquez une fois pour marquer une case d'une
croix (aide-mémoire), une deuxième fois pour y placer une reine, une troisième fois pour la
vider. Les reines en conflit s'affichent en rouge.

## Blackjack

Misez des pièces (votre solde commun à tous les jeux) puis distribuez les cartes.
Approchez 21 le plus possible sans le dépasser, en tirant des cartes ou en restant sur
votre main. Le croupier tire tant que sa main est inférieure à 17. Un blackjack (21 avec
les 2 premières cartes) paie 3 pour 2, une victoire classique paie 1 pour 1, et une
égalité rembourse la mise. Vous pouvez doubler votre mise sur les 2 premières cartes pour
tirer une seule carte supplémentaire. Si vous n'avez plus de pièces, rejouez aux autres
jeux du site pour en regagner.

## Structure du projet

- `index.html`, `style.css` - page d'accueil listant les jeux
- `coins.js` - solde de pieces partage (localStorage), inclus par toutes les pages
- `words.csv` - liste des mots francais de 5 lettres, utilisee par Motus
- `liste_francais.txt` - liste brute de mots francais de longueurs variees (source de `boggle/words.txt`)
- `wordle/` - jeu Motus (`index.html`, `script.js`, `style.css`)
- `boggle/` - jeu Boggle (`index.html`, `script.js`, `style.css`, `words.txt`)
- `zip/` - jeu Zip (`index.html`, `script.js`, `style.css`)
- `queens/` - jeu Queens (`index.html`, `script.js`, `style.css`)
- `blackjack/` - jeu Blackjack (`index.html`, `script.js`, `style.css`)

## Developpement local

Servez simplement le dossier avec un serveur HTTP statique, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.
