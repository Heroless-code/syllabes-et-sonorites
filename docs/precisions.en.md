# Syllables and sound patterns — Notes

Open the online application or **downloads/syllaber.html** in a recent browser, paste a French poem and select **Analyser**. The downloaded HTML is self-contained and works offline. A blank line separates stanzas. After editing the text, analyse it again to display the corresponding result.

Below **Analyser**, the three clear buttons remove all text, the line at the caret or start of the selection, or the last non-empty line.

## Syllables and rhyme endings

The / marks show the written-text boundaries proposed by Syllaber. **Syllabes** controls these marks and the syllable count. **Rimes** controls the **Rime**, **Disposition** and **Richesse** columns, together with the gold internal-rhyme marks.

A range such as **4 à 6** indicates alternative counts. Homographs, synaeresis and diaeresis can affect the count. The displayed segmentation represents one reading.

**Fem.** and **Masc.** refer to feminine and masculine verse endings. **F / M** indicates an ambiguous ending.

The counter uses attested verb forms from the bundled dictionary to recognize a single-syllable ending in forms such as *pre/nions* and *chan/gions*. Diaeresis applies after certain consonant clusters, as in *en/tri/ons*, and to verbs ending in *-ier*, as in *pri/ions*. [Quicherat, *Petit Traité de versification française*](https://fr.wikisource.org/wiki/Petit_Trait%C3%A9_de_versification_fran%C3%A7aise_(Quicherat))

## Rhyme schemes and richness

The **Disposition** column assigns a letter to each final rhyme family. The same last pronounced vowel, followed by the same consonants, receives the same letter throughout the poem. A final caduc e is excluded. Letters continue with **AA**, **AB**, and so on after **Z**.

Rhyme comparison ignores vowel duration and brings together the traditional variants in the **âme / flamme / dame / femme** final family. Sound-pattern analysis uses the poetic reading before these rhyme adjustments.

For a few endings, the engine uses a documented pronunciation variant when it uniquely pairs two otherwise unmatched lines in the same stanza. Pairs that already match under the primary pronunciation keep that reading.

Scheme names appear at the beginning of a recognised block. Paired rhymes follow **A A B B**, alternating rhymes **A B A B**, and enclosed rhymes **A B B A**. **Redoublées** is shown at the beginning of a stanza when one rhyme occurs at least three times anywhere in that stanza.

**Richesse** gives priority to the two lines paired by a recognized paired, alternating or enclosed rhyme scheme, even without blank lines between blocks. A single letter can therefore cover pairs of different richness. For lines outside a recognized pair, the engine uses the longest final sound sequence shared with a line of the same letter in its stanza, or across the poem if the line is alone with that letter in its stanza. The shared sequence can span multiple words, as in *des marées / démarrées*.

- **Pauvre**, in purple, shares one sound unit.
- **Suffisante**, in blue, shares two units. They can be two consecutive vowels, as in the poetic reading of *éblouies / inouïes*, which shares /u.i/.
- **Riche**, in green, shares at least three units, as in *porte / morte*.

Syllaber counts phonemes and treats each single-syllable sequence /wa/, /wɑ/ or /ɥi/ as one unit. *Parfois / toi* and *nuit / bruit* are therefore poor rhymes. *Moi / émoi* is sufficient because it also shares /m/.

A dash identifies a family with no partner or an ending the engine cannot identify.

## Caesura

Enable **Césure** to show estimated cuts as light-blue // marks. Small numbers above each cut show the syllables in each segment, such as **6/6** or **4/4/4**. At the same position, // takes the place of /.

Candidate cuts follow word boundaries in the displayed Syllaber segmentation. The score considers balance, punctuation and close grammatical links between words. For twelve syllables, **6/6** is favoured when other evidence is equal. Pauses can favour **4/8**, **4/4/4** or **3/3/3/3**.

Short and odd-length lines can also receive cuts. The two central divisions of an odd-length line, such as **3/4** and **4/3**, have equal balance weight.

Each segment contains at least one syllable. A one-syllable line or a line made of a single word remains uncut. If the estimate is weak or tied, the fallback uses the available word boundary nearest the midpoint. For a count range, only boundaries in the supplied segmentation are evaluated.

## Internal rhymes

**Interne** appears when rhymes occur at estimated caesuras in two distinct lines of the same stanza, within an eight-line window including both lines.

Gold marks cover the letters associated with the common final phonemes, up to three phonemes. For example, **on** is marked in *pont* and *fond*. Silent letters and uncertain alignments remain unmarked. The gold marks can appear while // is hidden.

## Sound patterns

Alliteration repeats consonant sounds and assonance repeats vowel sounds within a line. The chips give the sound and occurrence count. Hovering also shows the number of words involved.

The sound summary lists lines where an individual sound occurs at least four times. It shows qualifying alliterations and assonances together, with their counts, in the order of the text. Highlight filters apply to the displayed lines.

Select several chips to focus their sounds together within a line. Select a chip again to hide its colour, then again to restore it. **×1** adds sounds occurring once in a subdued colour.

Counts follow the proposed pronunciation. A realised liaison is counted once. A written group can represent several sounds. An occurrence can be counted while its uncertain letter alignment remains uncoloured.

## Classical checks

**Règle classique** shows a tick or a cross for these two checks.

1. An **-ées** ending is accepted at the end of a line. Inside a line, it produces a cross, including before a vowel.
2. Inside a line, a **mute e after a pronounced vowel**, as in *mélodie* or *destinée*, must precede a vowel onset or mute h. An aspirated h or uncertain onset produces a cross. A line-final ending is accepted.

In *une rose blanche*, the caduc e of *rose* can be pronounced before the consonant in classical reading. The second check concerns the post-vocalic mute e.

## Reading and uncertainty

The engine combines a traditional modern French lexicon with contextual rules. Unknown words receive a rule-based pronunciation. Dotted underlining can indicate uncertainty.

The sound engine omits line-final caduc e. Inside a line, free caduc e can elide before a vowel or mute h and remain before a consonant or aspirated h. Some **-es** and verbal **-ent** endings follow specific classical rules.

Pronunciation and diction can vary by work, period and reading. The sound and rhyme analyses use the proposed reading. Syllaber computes the written-text count separately and can show a range. Linguistic references appear in **Sources linguistiques** at the bottom of the application.
