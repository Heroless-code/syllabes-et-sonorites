# Audit de Syllaber sur Les Contemplations

Essai de la version locale corrigée sur 158 pages poétiques et 11 216 vers répartis en 1 289 strophes. La copie du [sommaire de Wikisource](https://fr.wikisource.org/wiki/Les_Contemplations) contient 165 pages avec la préface et les six sommaires de livre. Les deux versions de l’application, web et HTML autonome, donnent les mêmes résultats aux contrôles ci-dessous.

## Correction du calcul de richesse

L’ancienne version, comparée ici au commit publié ff1a7c9, réduisait chaque famille de rimes à sa finale commune à tous les vers du groupe. Dans une strophe avec « charnier », « prisonnier », « étaler » et « avaler », la seule finale partagée par les quatre est /e/. Toutes les rimes étaient alors classées pauvres.

Le moteur retient désormais la plus longue finale commune à chaque vers et à un partenaire de même lettre dans la strophe. Si le vers est seul à porter cette lettre dans la strophe, la recherche s’étend au poème. « Charnier / prisonnier » partage /nje/ et « étaler / avaler » partage /ale/. Les quatre vers sont donc classés riches dans le test dédié.

| Transition | Vers |
| --- | ---: |
| Suffisante → Riche | 427 |
| Pauvre → Suffisante | 881 |
| Pauvre → Riche | 301 |

1 609 vers sont reclassés dans 86 textes. Les lettres, les motifs, le signalement des rimes redoublées et les rimes internes ont été comparés avant et après sur chaque vers.

Dans « Le poëte s’en va dans les champs… », *fleurs / couleurs* passent de **Suffisante** à **Riche** grâce à /lœʁ/. Dans « Le firmament est plein de la vaste clarté », *clarté / bonté* passent de **Pauvre** à **Suffisante** grâce à /te/. [Premier poème](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Le_po%C3%ABte_s%E2%80%99en_va_dans_les_champs%E2%80%A6_%C2%BB) · [Second poème](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Le_firmament_est_plein_de_la_vaste_clart%C3%A9_%C2%BB)

## Contrôles de fonctionnement

| Fonction | Résultat |
| --- | --- |
| Saisie, strophes et numérotation | Texte restitué sans perte après retrait des marques ajoutées. Tous les vers sont numérotés dans l’ordre et les débuts de strophes sont signalés. |
| Syllabes | Compteurs comparés au résultat du moteur pour chaque vers. 48 fourchettes affichées. Les 12 vers de *Demain, dès l’aube* sont comptés à 12 syllabes. |
| Rimes finales et internes | Richesse comparée à un second calcul qui confronte chaque vers à tous les partenaires possibles. Genre, lettre et marquage interne comparés au résultat du moteur. 4 305 vers signalés avec une rime interne. |
| Césures | 11 194 vers avec au moins une coupe. 3 386 sur 3 398 vers de deux à huit syllabes et 628 sur 638 vers impairs de plus d’une syllabe. Chaque coupe tombe sur une frontière disponible entre mots. Les deux monosyllabes du corpus extrait restent sans coupe. |
| Règle classique | Marques vérifiées selon les deux critères de l’application. 11 208 coches, 7 croix et 1 ligne sans verdict. |
| Sonorités | 62 873 pastilles de répétition vérifiées. Le récapitulatif retient 4 319 vers contenant un son répété au moins quatre fois. |
| Interaction | Les six options, les filtres de sonorités, la sélection multiple, les pastilles du récapitulatif et les trois boutons d’effacement ont été actionnés sur 11 textes, dont un par livre. |
| Navigateur | Sur 23 vers de *Melancholia*, Ctrl + Entrée lance l’analyse. À 1 440 et 320 px, les six boutons restent en haut pendant le défilement et les numéros restent en marge sans débordement. L’effacement de la dernière ligne laisse 23 résultats visibles, puis **Analyser** en affiche 22. Une pastille du récapitulatif surligne quatre occurrences et un second clic retire la surbrillance. |

Les contrôles automatiques vérifient la cohérence des résultats et les régressions, tandis que les lectures poétiques restent à examiner au cas par cas. Par exemple, Syllaber propose **5/7** au premier vers de *Demain, dès l’aube*. La coupe alexandrine **6/6** après « l’heure » est possible sur ce même vers. [Demain, dès l’aube](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Demain%2C_d%C3%A8s_l%E2%80%99aube%2C_%C3%A0_l%E2%80%99heure_o%C3%B9_blanchit_la_campagne_%C2%BB)

## Résultats par texte

| Texte | Vers | Richesses reclassées | Vers avec césure | Vers aux sonorités remarquables |
| --- | ---: | ---: | ---: | ---: |
| [Un jour je vis, debout au bord des flots mouvants](https://fr.wikisource.org/wiki/Les_Contemplations/Un_jour_je_vis,_debout_au_bord_des_flots_mouvants) | 16 | 0 | 16 | 3 |
| [À ma fille](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_ma_fille) | 44 | 0 | 41 | 6 |
| [« Le poëte s’en va dans les champs… »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Le_po%C3%ABte_s%E2%80%99en_va_dans_les_champs%E2%80%A6_%C2%BB) | 20 | 2 | 20 | 11 |
| [Mes deux filles](https://fr.wikisource.org/wiki/Les_Contemplations/Mes_deux_filles) | 10 | 0 | 10 | 4 |
| [« Le firmament est plein de la vaste clarté »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Le_firmament_est_plein_de_la_vaste_clart%C3%A9_%C2%BB) | 40 | 21 | 40 | 26 |
| [À André Chénier](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Andr%C3%A9_Ch%C3%A9nier) | 24 | 2 | 24 | 9 |
| [La Vie aux champs](https://fr.wikisource.org/wiki/Les_Contemplations/La_Vie_aux_champs) | 95 | 6 | 95 | 40 |
| [Réponse à un acte d’accusation](https://fr.wikisource.org/wiki/Les_Contemplations/R%C3%A9ponse_%C3%A0_un_acte_d%E2%80%99accusation) | 235 | 84 | 234 | 130 |
| [Suite](https://fr.wikisource.org/wiki/Les_Contemplations/Suite) | 111 | 22 | 111 | 65 |
| [« Le poème éploré se lamente »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Le_po%C3%A8me_%C3%A9plor%C3%A9_se_lamente_%C2%BB) | 38 | 12 | 38 | 21 |
| [À Madame D. G. de G.](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Madame_D._G._de_G.) | 28 | 4 | 28 | 14 |
| [Lise](https://fr.wikisource.org/wiki/Les_Contemplations/Lise) | 42 | 5 | 42 | 10 |
| [Vere novo](https://fr.wikisource.org/wiki/Les_Contemplations/Vere_novo) | 18 | 0 | 18 | 7 |
| [À propos d’Horace](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_propos_d%E2%80%99Horace) | 218 | 49 | 218 | 102 |
| [À Granville, en 1836](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Granville,_en_1836) | 80 | 0 | 80 | 5 |
| [La Coccinelle](https://fr.wikisource.org/wiki/Les_Contemplations/La_Coccinelle) | 20 | 0 | 20 | 0 |
| [Vers 1820](https://fr.wikisource.org/wiki/Les_Contemplations/Vers_1820) | 16 | 0 | 16 | 9 |
| [À M. Froment Meurice](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_M._Froment_Meurice) | 32 | 0 | 32 | 4 |
| [Les Oiseaux](https://fr.wikisource.org/wiki/Les_Contemplations/Les_Oiseaux) | 59 | 26 | 59 | 26 |
| [Vieille chanson du jeune temps](https://fr.wikisource.org/wiki/Les_Contemplations/Vieille_chanson_du_jeune_temps) | 36 | 0 | 36 | 2 |
| [À un poëte aveugle](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_un_po%C3%ABte_aveugle) | 8 | 0 | 8 | 5 |
| [« Elle était déchaussée, elle était décoiffée »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Elle_%C3%A9tait_d%C3%A9chauss%C3%A9e,_elle_%C3%A9tait_d%C3%A9coiff%C3%A9e_%C2%BB) | 16 | 0 | 16 | 5 |
| [La Fête chez Thérèse](https://fr.wikisource.org/wiki/Les_Contemplations/La_F%C3%AAte_chez_Th%C3%A9r%C3%A8se) | 88 | 12 | 88 | 35 |
| [L’Enfance](https://fr.wikisource.org/wiki/Les_Contemplations/L%E2%80%99Enfance) | 12 | 0 | 12 | 6 |
| [« Heureux l’homme, occupé de l’éternel destin »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Heureux_l%E2%80%99homme,_occup%C3%A9_de_l%E2%80%99%C3%A9ternel_destin_%C2%BB) | 12 | 0 | 12 | 5 |
| [Unité](https://fr.wikisource.org/wiki/Les_Contemplations/Unit%C3%A9) | 10 | 0 | 10 | 5 |
| [Quelques mots à un autre](https://fr.wikisource.org/wiki/Les_Contemplations/Quelques_mots_%C3%A0_un_autre) | 166 | 33 | 165 | 91 |
| [« Oui, je suis le rêveur ; je suis le camarade »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Oui,_je_suis_le_r%C3%AAveur_;_je_suis_le_camarade_%C2%BB) | 44 | 14 | 44 | 19 |
| [« Il faut que le poëte, épris d’ombre et d’azur »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Il_faut_que_le_po%C3%ABte,_%C3%A9pris_d%E2%80%99ombre_et_d%E2%80%99azur_%C2%BB) | 22 | 4 | 22 | 10 |
| [Halte en marchant](https://fr.wikisource.org/wiki/Les_Contemplations/Halte_en_marchant) | 74 | 6 | 74 | 40 |
| [Premier mai](https://fr.wikisource.org/wiki/Les_Contemplations/Premier_mai) | 32 | 12 | 32 | 21 |
| [« Mes vers fuiraient, doux et frêles »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Mes_vers_fuiraient,_doux_et_fr%C3%AAles_%C2%BB) | 12 | 0 | 12 | 0 |
| [Le Rouet d’Omphale](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Rouet_d%E2%80%99Omphale) | 24 | 0 | 24 | 12 |
| [Chanson](https://fr.wikisource.org/wiki/Les_Contemplations/Chanson) | 18 | 10 | 18 | 2 |
| [Hier au soir](https://fr.wikisource.org/wiki/Les_Contemplations/Hier_au_soir) | 10 | 0 | 10 | 4 |
| [Lettre](https://fr.wikisource.org/wiki/Les_Contemplations/Lettre) | 44 | 13 | 44 | 24 |
| [« Nous allions au verger cueillir des bigarreaux »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Nous_allions_au_verger_cueillir_des_bigarreaux_%C2%BB) | 14 | 0 | 14 | 9 |
| [« Tu peux, comme il te plaît, me faire jeune ou vieux »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Tu_peux,_comme_il_te_pla%C3%AEt,_me_faire_jeune_ou_vieux_%C2%BB) | 36 | 2 | 36 | 15 |
| [En écoutant les oiseaux](https://fr.wikisource.org/wiki/Les_Contemplations/En_%C3%A9coutant_les_oiseaux) | 36 | 6 | 36 | 20 |
| [« Mon bras pressait ta taille frêle »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Mon_bras_pressait_ta_taille_fr%C3%AAle_%C2%BB) | 12 | 0 | 12 | 0 |
| [« Les femmes sont sur la terre »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Les_femmes_sont_sur_la_terre_%C2%BB) | 28 | 4 | 28 | 0 |
| [Églogue](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89glogue) | 24 | 0 | 24 | 6 |
| [« Viens ! – une flûte invisible »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Viens_!_%E2%80%93_une_fl%C3%BBte_invisible_%C2%BB) | 12 | 0 | 12 | 1 |
| [Billet du matin](https://fr.wikisource.org/wiki/Les_Contemplations/Billet_du_matin) | 28 | 4 | 28 | 11 |
| [Paroles dans l’ombre](https://fr.wikisource.org/wiki/Les_Contemplations/Paroles_dans_l%E2%80%99ombre) | 20 | 0 | 20 | 6 |
| [L’Hirondelle au printemps](https://fr.wikisource.org/wiki/Les_Contemplations/L%E2%80%99Hirondelle_au_printemps) | 14 | 0 | 14 | 7 |
| [Sous les arbres](https://fr.wikisource.org/wiki/Les_Contemplations/Sous_les_arbres) | 24 | 0 | 24 | 6 |
| [« Je sais bien qu’il est d’usage »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Je_sais_bien_qu%E2%80%99il_est_d%E2%80%99usage_%C2%BB) | 64 | 0 | 64 | 4 |
| [N’envions rien](https://fr.wikisource.org/wiki/Les_Contemplations/N%E2%80%99envions_rien) | 40 | 0 | 40 | 1 |
| [Il fait froid](https://fr.wikisource.org/wiki/Les_Contemplations/Il_fait_froid) | 44 | 0 | 44 | 6 |
| [« Il lui disait Vois-tu, si tous deux nous pouvions »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Il_lui_disait_Vois-tu,_si_tous_deux_nous_pouvions_%C2%BB) | 12 | 0 | 12 | 5 |
| [« Aimons toujours ! aimons encore »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Aimons_toujours_!_aimons_encore_%C2%BB) | 64 | 0 | 64 | 9 |
| [Après l’hiver](https://fr.wikisource.org/wiki/Les_Contemplations/Apr%C3%A8s_l%E2%80%99hiver) | 60 | 0 | 60 | 4 |
| [« Que le sort, quel qu’il soit, vous trouve toujours grande »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Que_le_sort,_quel_qu%E2%80%99il_soit,_vous_trouve_toujours_grande_%C2%BB) | 16 | 0 | 16 | 5 |
| [« Je respire où tu palpites »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Je_respire_o%C3%B9_tu_palpites_%C2%BB) | 72 | 1 | 72 | 9 |
| [Crépuscule](https://fr.wikisource.org/wiki/Les_Contemplations/Cr%C3%A9puscule) | 28 | 0 | 28 | 12 |
| [La Nichée sous le portail](https://fr.wikisource.org/wiki/Les_Contemplations/La_Nich%C3%A9e_sous_le_portail) | 32 | 1 | 32 | 1 |
| [Un soir que je regardais le ciel](https://fr.wikisource.org/wiki/Les_Contemplations/Un_soir_que_je_regardais_le_ciel) | 66 | 0 | 66 | 14 |
| [Écrit sur un exemplaire de la « Divina Commedia »](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89crit_sur_un_exemplaire_de_la_%C2%AB_Divina_Commedia_%C2%BB) | 14 | 0 | 14 | 7 |
| [Melancholia](https://fr.wikisource.org/wiki/Les_Contemplations/Melancholia) | 337 | 102 | 336 | 165 |
| [Saturne](https://fr.wikisource.org/wiki/Les_Contemplations/Saturne) | 100 | 0 | 100 | 48 |
| [Écrit au bas d’un crucifix](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89crit_au_bas_d%E2%80%99un_crucifix) | 4 | 0 | 4 | 0 |
| [Quia pulvis es](https://fr.wikisource.org/wiki/Les_Contemplations/Quia_pulvis_es) | 18 | 0 | 18 | 10 |
| [La Source](https://fr.wikisource.org/wiki/Les_Contemplations/La_Source) | 24 | 0 | 24 | 5 |
| [La Statue](https://fr.wikisource.org/wiki/Les_Contemplations/La_Statue) | 30 | 4 | 30 | 14 |
| [« Je lisais. Que lisais-je ? Oh ! le vieux livre austère »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Je_lisais._Que_lisais-je_%3F_Oh_!_le_vieux_livre_aust%C3%A8re_%C2%BB) | 64 | 22 | 64 | 32 |
| [« Jeune fille, la grâce emplit tes dix-sept ans »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Jeune_fille,_la_gr%C3%A2ce_emplit_tes_dix-sept_ans_%C2%BB) | 18 | 4 | 18 | 8 |
| [Amour](https://fr.wikisource.org/wiki/Les_Contemplations/Amour) | 54 | 20 | 54 | 27 |
| [?](https://fr.wikisource.org/wiki/Les_Contemplations/%3F) | 22 | 2 | 22 | 8 |
| [Explication](https://fr.wikisource.org/wiki/Les_Contemplations/Explication) | 38 | 4 | 38 | 23 |
| [La Chouette](https://fr.wikisource.org/wiki/Les_Contemplations/La_Chouette) | 94 | 4 | 93 | 19 |
| [À la mère de l’enfant mort](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_la_m%C3%A8re_de_l%E2%80%99enfant_mort) | 32 | 0 | 32 | 7 |
| [Épitaphe](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89pitaphe) | 12 | 0 | 12 | 5 |
| [Le Maître d’études](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Ma%C3%AEtre_d%E2%80%99%C3%A9tudes) | 128 | 28 | 128 | 71 |
| [Chose vue un jour de printemps](https://fr.wikisource.org/wiki/Les_Contemplations/Chose_vue_un_jour_de_printemps) | 60 | 14 | 60 | 32 |
| [Intérieur](https://fr.wikisource.org/wiki/Les_Contemplations/Int%C3%A9rieur) | 26 | 3 | 26 | 13 |
| [Baraques de la foire](https://fr.wikisource.org/wiki/Les_Contemplations/Baraques_de_la_foire) | 30 | 12 | 30 | 15 |
| [Insomnie](https://fr.wikisource.org/wiki/Les_Contemplations/Insomnie) | 73 | 6 | 73 | 38 |
| [Écrit sur la plinthe d’un bas-relief antique](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89crit_sur_la_plinthe_d%E2%80%99un_bas-relief_antique) | 26 | 8 | 26 | 11 |
| [« La clarté du dehors ne distrait pas mon âme »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_La_clart%C3%A9_du_dehors_ne_distrait_pas_mon_%C3%A2me_%C2%BB) | 30 | 0 | 30 | 6 |
| [Le Revenant](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Revenant) | 104 | 23 | 104 | 53 |
| [Aux arbres](https://fr.wikisource.org/wiki/Les_Contemplations/Aux_arbres) | 40 | 4 | 40 | 20 |
| [« L’enfant, voyant l’aïeule à filer occupée »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_L%E2%80%99enfant,_voyant_l%E2%80%99a%C3%AFeule_%C3%A0_filer_occup%C3%A9e_%C2%BB) | 8 | 0 | 8 | 5 |
| [Joies du soir](https://fr.wikisource.org/wiki/Les_Contemplations/Joies_du_soir) | 48 | 0 | 48 | 25 |
| [« J’aime l’araignée et j’aime l’ortie »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_J%E2%80%99aime_l%E2%80%99araign%C3%A9e_et_j%E2%80%99aime_l%E2%80%99ortie_%C2%BB) | 28 | 0 | 28 | 3 |
| [Le Poëte](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Po%C3%ABte) | 32 | 4 | 32 | 21 |
| [La Nature](https://fr.wikisource.org/wiki/Les_Contemplations/La_Nature) | 48 | 12 | 48 | 29 |
| [Magnitudo parvi](https://fr.wikisource.org/wiki/Les_Contemplations/Magnitudo_parvi) | 813 | 31 | 812 | 180 |
| [« Pure innocence ! Vertu sainte »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Pure_innocence_!_Vertu_sainte_%C2%BB) | 36 | 0 | 36 | 6 |
| [15 février 1843 – 4 septembre 1843](https://fr.wikisource.org/wiki/Les_Contemplations/15_f%C3%A9vrier_1843_%E2%80%93_4_septembre_1843) | 8 | 0 | 8 | 2 |
| [Trois Ans après](https://fr.wikisource.org/wiki/Les_Contemplations/Trois_Ans_apr%C3%A8s) | 128 | 0 | 128 | 12 |
| [« Oh ! je fus comme fou dans le premier moment »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Oh_!_je_fus_comme_fou_dans_le_premier_moment_%C2%BB) | 20 | 4 | 20 | 11 |
| [« Elle avait pris ce pli dans son âge enfantin »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Elle_avait_pris_ce_pli_dans_son_%C3%A2ge_enfantin_%C2%BB) | 26 | 12 | 26 | 15 |
| [« Quand nous habitions tous ensemble »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Quand_nous_habitions_tous_ensemble_%C2%BB) | 52 | 4 | 52 | 4 |
| [« Elle était pâle, et pourtant rose »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Elle_%C3%A9tait_p%C3%A2le,_et_pourtant_rose_%C2%BB) | 40 | 0 | 40 | 8 |
| [« À qui donc sommes-nous ? Qui nous a ? qui nous mène ? »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_%C3%80_qui_donc_sommes-nous_%3F_Qui_nous_a_%3F_qui_nous_m%C3%A8ne_%3F_%C2%BB) | 24 | 0 | 24 | 8 |
| [« Ô souvenirs ! printemps ! aurore ! »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_%C3%94_souvenirs_!_printemps_!_aurore_!_%C2%BB) | 52 | 2 | 52 | 7 |
| [« Pendant que le marin, qui calcule et qui doute »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Pendant_que_le_marin,_qui_calcule_et_qui_doute_%C2%BB) | 10 | 0 | 10 | 2 |
| [« On vit, on parle, on a le ciel et les nuages »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_On_vit,_on_parle,_on_a_le_ciel_et_les_nuages_%C2%BB) | 20 | 4 | 20 | 5 |
| [À quoi songeaient les deux cavaliers dans la forêt](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_quoi_songeaient_les_deux_cavaliers_dans_la_for%C3%AAt) | 36 | 4 | 36 | 20 |
| [Veni, vidi, vixi](https://fr.wikisource.org/wiki/Les_Contemplations/Veni,_vidi,_vixi) | 32 | 0 | 32 | 12 |
| [« Demain, dès l’aube, à l’heure où blanchit la campagne »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Demain,_d%C3%A8s_l%E2%80%99aube,_%C3%A0_l%E2%80%99heure_o%C3%B9_blanchit_la_campagne_%C2%BB) | 12 | 0 | 12 | 11 |
| [À Villequier](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Villequier) | 160 | 5 | 160 | 56 |
| [Mors](https://fr.wikisource.org/wiki/Les_Contemplations/Mors) | 20 | 2 | 20 | 12 |
| [Charles Vacquerie](https://fr.wikisource.org/wiki/Les_Contemplations/Charles_Vacquerie) | 126 | 7 | 126 | 42 |
| [À Aug. V.](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Aug._V.) | 34 | 13 | 34 | 16 |
| [Au fils d’un poëte](https://fr.wikisource.org/wiki/Les_Contemplations/Au_fils_d%E2%80%99un_po%C3%ABte) | 32 | 0 | 32 | 2 |
| [Écrit en 1846 – Écrit en 1855](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89crit_en_1846_%E2%80%93_%C3%89crit_en_1855) | 448 | 152 | 447 | 221 |
| [« La source tombait du rocher »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_La_source_tombait_du_rocher_%C2%BB) | 12 | 0 | 12 | 2 |
| [À Mademoiselle Louise B.](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Mademoiselle_Louise_B.) | 90 | 0 | 90 | 33 |
| [À vous qui êtes là](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_vous_qui_%C3%AAtes_l%C3%A0) | 66 | 5 | 66 | 29 |
| [« Pour l’erreur, éclairer, c’est apostasier »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Pour_l%E2%80%99erreur,_%C3%A9clairer,_c%E2%80%99est_apostasier_%C2%BB) | 18 | 2 | 18 | 9 |
| [À Jules J.](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Jules_J.) | 70 | 9 | 70 | 38 |
| [Le Mendiant](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Mendiant) | 26 | 4 | 26 | 15 |
| [Aux Feuillantines](https://fr.wikisource.org/wiki/Les_Contemplations/Aux_Feuillantines) | 24 | 0 | 24 | 12 |
| [Ponto](https://fr.wikisource.org/wiki/Les_Contemplations/Ponto) | 28 | 4 | 28 | 19 |
| [Dolorosae](https://fr.wikisource.org/wiki/Les_Contemplations/Dolorosae) | 28 | 0 | 28 | 15 |
| [Paroles sur la dune](https://fr.wikisource.org/wiki/Les_Contemplations/Paroles_sur_la_dune) | 52 | 0 | 52 | 19 |
| [Claire P.](https://fr.wikisource.org/wiki/Les_Contemplations/Claire_P.) | 70 | 21 | 70 | 30 |
| [À Alexandre D.](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Alexandre_D.) | 24 | 6 | 24 | 9 |
| [Lueur au couchant](https://fr.wikisource.org/wiki/Les_Contemplations/Lueur_au_couchant) | 52 | 16 | 52 | 26 |
| [Mugitusque boum](https://fr.wikisource.org/wiki/Les_Contemplations/Mugitusque_boum) | 38 | 8 | 38 | 18 |
| [Apparition](https://fr.wikisource.org/wiki/Les_Contemplations/Apparition) | 18 | 4 | 18 | 7 |
| [« Au poète qui m’envoie une plume d’aigle »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Au_po%C3%A8te_qui_m%E2%80%99envoie_une_plume_d%E2%80%99aigle_%C2%BB) | 16 | 0 | 16 | 1 |
| [Cérigo](https://fr.wikisource.org/wiki/Les_Contemplations/C%C3%A9rigo) | 76 | 36 | 76 | 39 |
| [À Paul M., auteur du drame « Paris »](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_Paul_M.,_auteur_du_drame_%C2%AB_Paris_%C2%BB) | 22 | 0 | 22 | 15 |
| [« Je payai le pêcheur qui passa son chemin »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Je_payai_le_p%C3%AAcheur_qui_passa_son_chemin_%C2%BB) | 18 | 0 | 18 | 8 |
| [Pasteurs et troupeaux](https://fr.wikisource.org/wiki/Les_Contemplations/Pasteurs_et_troupeaux) | 46 | 14 | 46 | 24 |
| [« J’ai cueilli cette fleur pour toi sur la colline »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_J%E2%80%99ai_cueilli_cette_fleur_pour_toi_sur_la_colline_%C2%BB) | 28 | 10 | 28 | 11 |
| [« Ô strophe du poëte, autrefois, dans les fleurs »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_%C3%94_strophe_du_po%C3%ABte,_autrefois,_dans_les_fleurs_%C2%BB) | 32 | 2 | 32 | 16 |
| [Les Malheureux](https://fr.wikisource.org/wiki/Les_Contemplations/Les_Malheureux) | 377 | 110 | 377 | 189 |
| [Le Pont](https://fr.wikisource.org/wiki/Les_Contemplations/Le_Pont) | 22 | 4 | 22 | 6 |
| [Ibo](https://fr.wikisource.org/wiki/Les_Contemplations/Ibo) | 132 | 2 | 130 | 8 |
| [« Un spectre m’attendait dans un grand angle d’ombre »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Un_spectre_m%E2%80%99attendait_dans_un_grand_angle_d%E2%80%99ombre_%C2%BB) | 29 | 4 | 29 | 10 |
| [« Écoutez. Je suis Jean. J’ai vu des choses sombres »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_%C3%89coutez._Je_suis_Jean._J%E2%80%99ai_vu_des_choses_sombres_%C2%BB) | 20 | 0 | 20 | 11 |
| [Croire, mais pas en nous](https://fr.wikisource.org/wiki/Les_Contemplations/Croire,_mais_pas_en_nous) | 70 | 23 | 70 | 39 |
| [Pleurs dans la nuit](https://fr.wikisource.org/wiki/Les_Contemplations/Pleurs_dans_la_nuit) | 673 | 37 | 672 | 230 |
| [« Un jour, le morne esprit, le prophète sublime »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Un_jour,_le_morne_esprit,_le_proph%C3%A8te_sublime_%C2%BB) | 12 | 0 | 12 | 3 |
| [Claire](https://fr.wikisource.org/wiki/Les_Contemplations/Claire) | 168 | 3 | 168 | 98 |
| [À la fenêtre, pendant la nuit](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_la_fen%C3%AAtre,_pendant_la_nuit) | 108 | 4 | 108 | 39 |
| [Éclaircie](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%89claircie) | 38 | 18 | 38 | 18 |
| [« Oh ! par nos vils plaisirs, nos appétits, nos fanges »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_Oh_!_par_nos_vils_plaisirs,_nos_app%C3%A9tits,_nos_fanges_%C2%BB) | 12 | 0 | 12 | 5 |
| [Aux anges qui nous voient](https://fr.wikisource.org/wiki/Les_Contemplations/Aux_anges_qui_nous_voient) | 12 | 0 | 12 | 0 |
| [Cadaver](https://fr.wikisource.org/wiki/Les_Contemplations/Cadaver) | 54 | 16 | 54 | 27 |
| [« Ô gouffre ! l’âme plonge et rapporte le doute »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_%C3%94_gouffre_!_l%E2%80%99%C3%A2me_plonge_et_rapporte_le_doute_%C2%BB) | 18 | 0 | 18 | 8 |
| [À celle qui est voilée](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_celle_qui_est_voil%C3%A9e) | 116 | 0 | 116 | 10 |
| [Horror](https://fr.wikisource.org/wiki/Les_Contemplations/Horror) | 138 | 0 | 138 | 48 |
| [Dolor](https://fr.wikisource.org/wiki/Les_Contemplations/Dolor) | 120 | 5 | 120 | 61 |
| [« Hélas ! tout est sépulcre. On en sort, on y tombe »](https://fr.wikisource.org/wiki/Les_Contemplations/%C2%AB_H%C3%A9las_!_tout_est_s%C3%A9pulcre._On_en_sort,_on_y_tombe_%C2%BB) | 24 | 0 | 24 | 9 |
| [Voyage de nuit](https://fr.wikisource.org/wiki/Les_Contemplations/Voyage_de_nuit) | 52 | 14 | 52 | 34 |
| [Religio](https://fr.wikisource.org/wiki/Les_Contemplations/Religio) | 24 | 0 | 24 | 10 |
| [Spes](https://fr.wikisource.org/wiki/Les_Contemplations/Spes) | 26 | 6 | 26 | 15 |
| [Ce que c’est que la mort](https://fr.wikisource.org/wiki/Les_Contemplations/Ce_que_c%E2%80%99est_que_la_mort) | 24 | 2 | 24 | 12 |
| [Les Mages](https://fr.wikisource.org/wiki/Les_Contemplations/Les_Mages) | 710 | 64 | 710 | 118 |
| [En frappant à une porte](https://fr.wikisource.org/wiki/Les_Contemplations/En_frappant_%C3%A0_une_porte) | 28 | 0 | 28 | 2 |
| [Nomen, numen, lumen](https://fr.wikisource.org/wiki/Les_Contemplations/Nomen,_numen,_lumen) | 10 | 0 | 10 | 7 |
| [Ce que dit la bouche d’ombre](https://fr.wikisource.org/wiki/Les_Contemplations/Ce_que_dit_la_bouche_d%E2%80%99ombre) | 800 | 196 | 798 | 427 |
| [À celle qui est restée en France](https://fr.wikisource.org/wiki/Les_Contemplations/%C3%80_celle_qui_est_rest%C3%A9e_en_France) | 354 | 89 | 346 | 179 |
