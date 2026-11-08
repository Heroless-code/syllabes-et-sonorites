# Syllabes et sonorités — Précisions

Décompressez l’archive et ouvrez **Syllabes-et-sonorites.html** dans votre navigateur. Collez vos vers, puis cliquez sur **Analyser**. Une ligne vide marque le passage d’une strophe à la suivante. L’analyse s’effectue hors ligne.

Après modification du texte, cliquez de nouveau sur **Analyser** pour obtenir les résultats correspondants.

## Syllabes et rimes

- Les barres `/` indiquent les frontières proposées par Syllaber dans le texte écrit. **Syllabes** affiche ou masque les barres et le compte syllabique. **Rimes** commande les colonnes **Rime**, **Disposition** et **Richesse**, ainsi que les traits dorés des rimes internes.
- Une fourchette comme **4 à 6** indique plusieurs comptes possibles. Deux lectures d’un homographe ou une alternance entre **synérèse** (un seul noyau vocalique) et **diérèse** (deux noyaux) peuvent faire varier le compte. La segmentation affichée représente une seule lecture.
- **Fem.** et **Masc.** désignent le genre de la finale en versification. **F / M** indique une finale qui peut être féminine ou masculine selon la lecture. Par exemple, Syllaber laisse ouverte la lecture de la finale de « couvent ». La colonne indique le genre de la rime.

## Disposition et richesse des rimes

La colonne **Disposition** donne une lettre à chaque finale. La même dernière voyelle prononcée, suivie des mêmes consonnes éventuelles, reçoit la même lettre dans tout le poème. Le calcul écarte le *e* caduc final. Après `Z`, les lettres continuent avec `AA`, `AB`, etc.

La comparaison des rimes ignore la durée des voyelles et réunit les deux prononciations traditionnelles de la famille « âme / flamme / dame / femme ». Les sonorités restent calculées à partir des prononciations fournies par le lexique.

Le nom d’un motif apparaît au début du bloc où il est reconnu. Les rimes **plates** se suivent par paires (`A A B B`), les **croisées** alternent (`A B A B`), et les **embrassées** encadrent une paire (`A B B A`). La mention **Redoublées** figure au début d’une strophe dès qu’une même rime apparaît au moins trois fois dans cette strophe, y compris dans des blocs différents. Les lettres restent lisibles dans les passages où aucun de ces motifs ne se dégage.

La colonne **Richesse** compare la suite de sons commune à tous les vers de même lettre. Une rime **pauvre**, en mauve, partage la voyelle finale. Une rime **suffisante**, en bleu, partage une voyelle et une consonne, comme « final / bancale ». Une rime **riche**, en vert, partage au moins trois phonèmes, comme « porte / morte ». Un tiret indique une rime sans partenaire ou une finale que le moteur ne peut pas identifier.

## Césure

Activez **Césure** pour afficher les coupes estimées en `//` bleu clair. Le découpage retenu est écrit en petit au-dessus de chaque `//`, par exemple `6/6` ou `4/4/4`. Les nombres donnent le nombre de syllabes de chaque segment dans la lecture utilisée. Cette option se combine avec **Syllabes**, **Sonorités** et **Règle classique**. Lorsqu’une coupe tombe sur une frontière de syllabe déjà affichée, le `//` remplace le `/`.

Le programme cherche des frontières entre les mots dans le découpage de Syllaber. Il tient compte de l’équilibre syllabique, de la ponctuation et de certains liens entre mots, notamment entre un déterminant et son nom. Dans un vers de 12 syllabes, le partage **6/6** est favorisé à indices comparables. Des pauses peuvent faire ressortir un autre partage, par exemple **4/8**, **4/4/4** ou **3/3/3/3**.

Les vers courts et impairs peuvent aussi recevoir une coupe. Les deux partages centraux d’un vers impair, comme **3/4** et **4/3**, sont évalués à égalité pour l’équilibre syllabique. La ponctuation et les liens entre les mots départagent les propositions. À indices égaux, une frontière centrale admissible est retenue de façon déterministe.

Un vers d’une seule syllabe reste sans césure. Les coupes passent entre les mots et laissent au moins une syllabe dans chaque segment. Si le compte est donné sous forme de fourchette, seules les positions du découpage fourni sont évaluées. Quand les indices sont faibles ou que plusieurs coupes se valent, le programme retient en dernier recours la frontière entre mots la plus proche de la moitié du compte. Un vers constitué d’un seul mot reste sans coupe.

Sur un écran large, les colonnes de mesures se placent à droite de la largeur réservée à la saisie et aux vers. Sur un écran plus étroit, elles passent sous chaque vers pour préserver la place du texte.

La mention **Interne** apparaît dans **Disposition** quand deux rimes se répondent à la césure de vers distincts. Les vers doivent appartenir à la même strophe et tenir dans une fenêtre de huit vers, les deux vers concernés inclus.

Le **trait doré** couvre les lettres associées aux phonèmes communs à la fin des deux segments, jusqu’à trois phonèmes. Par exemple, il couvre « on » dans « pont » et « fond ». Les lettres muettes et les correspondances incertaines restent sans trait. Le trait peut apparaître avec **Rimes** même si les `//` sont masqués.

## Sonorités

- Une **allitération** répète un son consonantique dans un vers. Une **assonance** répète un son vocalique. Les pastilles indiquent des sons individuels et leur nombre d’occurrences. Le survol donne aussi le nombre de mots concernés. Un son peut se répéter dans un seul mot.
- Un clic sur une pastille isole le son dans le texte. Un deuxième clic masque sa couleur. Un autre clic la rétablit. **×1** ajoute les sons isolés dans une teinte discrète.
- Les sons sont comptés à partir de la prononciation proposée. Une liaison réalisée compte une fois. Un groupe de lettres peut porter plusieurs sons. Si l’association entre un son et les lettres est incertaine, l’occurrence peut être comptée sans être surlignée.
- Les décomptes sont propres à chaque vers. Les parties d’un mot séparées par une apostrophe d’élision ou un trait d’union peuvent être regroupées pour le nombre de mots concernés.

## Règle classique

Activez **Règle classique** pour afficher une coche dans la marge si le vers respecte les deux critères, ou une croix si l’un d’eux échoue.

1. Une finale en **-ées** est admise à la fin du vers. À l’intérieur du vers, elle donne une croix, même devant une voyelle.
2. À l’intérieur du vers, un **e muet après une voyelle prononcée**, comme dans « mélodie » ou « destinée », doit être suivi d’une initiale vocalique ou d’un h muet. Un h aspiré ou une initiale que le moteur ne peut pas confirmer donne une croix. La fin du vers est admise.

« Une mélodie douce » donne une croix, tandis que « Une mélodie enchantée » donne une coche. Dans « Une rose blanche », le e caduc de « rose » peut se prononcer en lecture classique devant la consonne. Il n’est pas visé par le deuxième critère. La coche porte sur ces deux critères.

## Lecture classique et incertitudes

Le moteur s’appuie sur un lexique de français moderne traditionnel et tient compte du contexte. Un mot inconnu reçoit une prononciation proposée par des règles. Un pointillé sous un mot ou sur une pastille indique que la lecture peut être incertaine.

Le moteur des sonorités omet le **e caduc** de fin de vers. À l’intérieur du vers, le e caduc libre peut s’élider devant une voyelle ou un h muet et se maintenir devant une consonne ou un h aspiré. Certaines finales en **-es** ou en **-ent** verbal suivent des règles de maintien et de jonction propres à la lecture classique. La ponctuation forte, un statut du h incertain ou une finale après voyelle peuvent demander une vérification à la lecture.

Pour des mots comme « duel » ou « nuage », la diction peut varier selon l’œuvre, l’époque ou le choix de lecture. Les pastilles et les rimes suivent la lecture proposée par le moteur des sonorités. Le compte de Syllaber reste calculé séparément et peut afficher une fourchette.

Les références du lexique et de la lecture classique figurent dans la rubrique **Sources linguistiques** au bas de l’application.
