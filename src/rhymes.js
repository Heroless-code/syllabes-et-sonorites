// Documented variants for verse endings. Zone uses the TLFi's closed vowel.
// The other alternatives are already present in the bundled phonetic lexicon.
const rhymeVariants = new Map([
  ['zone', 'zon'], ['zones', 'zon'], ['hanses', 'ɑ̃s'],
  ['flache', 'flɑʃ'], ['flaches', 'flɑʃ'], ['mai', 'me']
]);

function analyzeRhymes(lines, caesuras) {
  const { phones, isVowel } = __modules["phonology.js"];
  const { ASSONANCE_SEQUENCES } = __modules["sonorities.js"];
  const poemGroups = new Map();
  const stanzaEndings = [];
  const verses = lines.map(() => ({
    letter:'—', richness:'—', disposition:'', redoubled:false, internal:false, internalSpans:[]
  }));

  function labelFor(index) {
    let label = '';
    for (let number = index + 1; number > 0; number = Math.floor((number - 1) / 26)) {
      label = String.fromCharCode(65 + (number - 1) % 26) + label;
    }
    return label;
  }

  const isPronounced = phone => phone !== '.' && phone !== '‿';

  function rhymePhones(sounds) {
    // Vowel duration does not add a phoneme to the rhyme comparison.
    const normalized = sounds.map(phone => phone.replace(/ː/gu, ''));
    const vowel = normalized.findLastIndex(isVowel);
    // The traditional lexical layer distinguishes âme /ɑːm/ and flamme /flam/.
    // Their final /am/ rhyme family is shared, while other /a ~ ɑ/ pairs stay distinct.
    if (normalized[vowel] === 'ɑ' && normalized.slice(vowel + 1).join('') === 'm') {
      normalized[vowel] = 'a';
    }
    return normalized;
  }

  function alignedSpans(word, offset, expected) {
    const {segments} = word;
    if (!Array.isArray(segments) || segments.map(segment => segment.text).join('') !== word.text) return [];
    const spans = [];
    let phoneIndex = 0;
    for (const segment of segments) {
      const end = offset + segment.text.length;
      const span = !segment.silent && !segment.uncertain && end > offset ? {start:offset, end} : null;
      for (const phone of phones((segment.phones || []).join('')).filter(isPronounced)) {
        if (phone !== expected[phoneIndex++]) return [];
        spans.push(span);
      }
      offset = end;
    }
    return phoneIndex === expected.length ? spans : [];
  }

  function ending(tokens, first, limit, offsets, finalIpa) {
    let last = limit - 1;
    while (last >= first && tokens[last].type !== 'word') last--;
    if (last < first) return null;
    const sounds = [];
    const anchors = [];
    const joinedVowels = new Set();
    for (let index = first; index <= last; index++) {
      const word = tokens[index];
      if (word.type !== 'word') continue;
      const ipa = index === last && finalIpa ? finalIpa : word.ipa;
      const pronunciation = phones(ipa || '');
      const phonemes = pronunciation.filter(isPronounced);
      const spans = offsets ? alignedSpans(word, offsets[index], phonemes) : [];
      if (index === last) {
        // A liaison into the next segment is external to the ending.
        if (word.liaison?.realized && phonemes.at(-1) === word.liaison.phone) phonemes.pop();
        if (phonemes.at(-1) === 'ə' && phonemes.slice(0, -1).some(isVowel)) phonemes.pop();
      }
      const excludedSpan = spans[phonemes.length];
      let phoneIndex = 0;
      for (const [position, phone] of pronunciation.entries()) {
        if (phoneIndex === phonemes.length) break;
        if (!isPronounced(phone)) continue;
        if (ASSONANCE_SEQUENCES.includes((pronunciation[position - 1] || '') + phone)) {
          joinedVowels.add(sounds.length);
        }
        sounds.push(phone);
        if (offsets) anchors.push(spans[phoneIndex] !== excludedSpan ? spans[phoneIndex] || null : null);
        phoneIndex++;
      }
    }

    const compared = rhymePhones(sounds);
    const vowel = compared.findLastIndex(isVowel);
    if (vowel < 0) return null;
    // Group « oi » and « ui » for richness only. Keep phonemes for internal-rhyme marks.
    const units = [];
    for (const [index, phone] of compared.entries()) {
      if (joinedVowels.has(index)) units[units.length - 1] += phone;
      else units.push(phone);
    }
    return {key:compared.slice(vowel).join('|'), sounds:compared, anchors, units};
  }

  function commonEnding(a, b) {
    let shared = 0;
    while (shared < Math.min(a.length, b.length) && a.at(-shared - 1) === b.at(-shared - 1)) {
      shared++;
    }
    return a.slice(a.length - shared);
  }

  function richnessSize(common) {
    return Math.min(3, common.length);
  }

  function addEnding(groups, {key, units}, index) {
    let group = groups.get(key);
    if (!group) {
      group = {members:[]};
      groups.set(key, group);
    }
    group.members.push({index, units});
    return group;
  }

  function setRichness(groups) {
    const labels = ['Pauvre', 'Suffisante', 'Riche'];
    for (const {members} of groups.values()) {
      if (members.length < 2) continue;
      const suffixCounts = new Map();
      for (const {units} of members) {
        for (let size = 2; size <= richnessSize(units); size++) {
          const suffix = units.slice(-size).join('|');
          suffixCounts.set(suffix, (suffixCounts.get(suffix) || 0) + 1);
        }
      }
      for (const {index, units} of members) {
        if (verses[index].richness !== '—') continue;
        // The family guarantees one shared sound. Longer suffixes need an actual partner.
        let size = richnessSize(units);
        while (size > 1 && (suffixCounts.get(units.slice(-size).join('|')) || 0) < 2) size--;
        verses[index].richness = labels[size - 1];
      }
    }
  }

  function selectStanzaVariants() {
    const singletons = new Map();
    for (const entry of stanzaEndings) {
      const {key} = entry.final;
      singletons.set(key, singletons.has(key) ? null : entry);
    }

    const proposals = [];
    const candidateCounts = new Map();
    for (const entry of stanzaEndings) {
      if (!entry.variant || singletons.get(entry.final.key) !== entry) continue;
      const partner = singletons.get(entry.variant.key);
      if (!partner || partner === entry) continue;
      proposals.push({entry, partner});
      candidateCounts.set(entry, (candidateCounts.get(entry) || 0) + 1);
      candidateCounts.set(partner, (candidateCounts.get(partner) || 0) + 1);
    }
    // A variant may link two otherwise isolated endings if the match is unique.
    for (const {entry, partner} of proposals) {
      if (candidateCounts.get(entry) === 1 && candidateCounts.get(partner) === 1) entry.final = entry.variant;
    }
  }

  function namedBlock(start, end) {
    const [a, b, c, d] = verses.slice(start, Math.min(end, start + 4)).map(verse => verse.letter);
    if (a === '—') return null;
    if (b && b !== '—' && a !== b && a === c && b === d) return ['Croisées', 4];
    if (b && b !== '—' && a !== b && a === d && b === c) return ['Embrassées', 4];
    if (a === b && b === c) {
      let next = start + 3;
      while (next < end && verses[next].letter === a) next++;
      // A run of identical rhymes gets the stanza-level indication.
      return ['', next - start];
    }
    return a === b ? ['Plates', 2] : null;
  }

  function setDispositions(start, end) {
    const frequencies = new Map();
    for (let index = start; index < end; index++) {
      const {letter} = verses[index];
      if (letter !== '—') frequencies.set(letter, (frequencies.get(letter) || 0) + 1);
    }
    if ([...frequencies.values()].some(count => count >= 3)) verses[start].redoubled = true;

    let previous = '';
    for (let index = start; index < end;) {
      const block = namedBlock(index, end);
      if (block) {
        const [name, length] = block;
        if (previous !== name) verses[index].disposition = name;
        previous = name;
        index += length;
        continue;
      }
      previous = '';
      index++;
    }
  }

  let stanzaStart = 0;
  const stanzaCaesuras = [];
  const recentCaesuras = new Map();

  function matchCaesuras(line, index, cuts) {
    if (!cuts.length) return;

    const offsets = [0];
    for (const token of line.tokens) offsets.push(offsets.at(-1) + token.text.length);
    const alignedOffsets = line.tokens.map(token => token.text).join('') === line.original ? offsets : null;

    let first = 0;
    for (const {tokenIndex} of cuts) {
      const segment = ending(line.tokens, first, tokenIndex, alignedOffsets);
      first = tokenIndex;
      if (!segment) continue;

      const current = {index, sounds:segment.sounds, anchors:segment.anchors, size:0};
      const nearby = (recentCaesuras.get(segment.key) || []).filter(cut => index - cut.index < 8);
      for (const previous of nearby) {
        if (previous.index === index) continue;
        const size = richnessSize(commonEnding(current.sounds, previous.sounds));
        current.size = Math.max(current.size, size);
        previous.size = Math.max(previous.size, size);
      }
      nearby.push(current);
      recentCaesuras.set(segment.key, nearby);
      stanzaCaesuras.push(current);
    }
  }

  function finishStanza(end) {
    selectStanzaVariants();
    const stanzaGroups = new Map();
    for (const {index, final} of stanzaEndings) {
      const group = addEnding(poemGroups, final, index);
      group.label ??= labelFor(poemGroups.size - 1);
      verses[index].letter = group.label;
      addEnding(stanzaGroups, final, index);
    }
    stanzaEndings.length = 0;
    setDispositions(stanzaStart, end);
    setRichness(stanzaGroups);
    for (const cut of stanzaCaesuras) {
      if (!cut.size) continue;
      const verse = verses[cut.index];
      verse.internal = true;
      const first = cut.anchors.length - cut.size;
      const precedingSpan = cut.anchors[first - 1];
      verse.internalSpans.push(...cut.anchors.slice(first).filter(span => span && span !== precedingSpan));
    }
    stanzaCaesuras.length = 0;
    recentCaesuras.clear();
  }

  function mergeSpans(spans) {
    const merged = [];
    for (const span of spans.sort((a, b) => a.start - b.start)) {
      const previous = merged.at(-1);
      if (previous && span.start <= previous.end) {
        previous.end = Math.max(previous.end, span.end);
      } else {
        merged.push({...span});
      }
    }
    return merged;
  }

  for (const [index, line] of lines.entries()) {
    if (!line.original.trim()) {
      finishStanza(index);
      stanzaStart = index + 1;
      continue;
    }

    matchCaesuras(line, index, caesuras[index] || []);

    const final = ending(line.tokens, 0, line.tokens.length);
    if (!final) continue;
    const word = line.tokens.findLast(token => token.type === 'word');
    const variantIpa = rhymeVariants.get(word.lower);
    const variant = variantIpa ? ending(line.tokens, 0, line.tokens.length, undefined, variantIpa) : null;
    stanzaEndings.push({index, final, variant});
  }
  finishStanza(lines.length);
  for (const verse of verses) verse.internalSpans = mergeSpans(verse.internalSpans);

  // Only lines without a partner in their stanza use the whole-poem family.
  setRichness(poemGroups);
  return verses;
}
