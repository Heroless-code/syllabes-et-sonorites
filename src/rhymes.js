function analyzeRhymes(lines, caesuras) {
  const { phones, isVowel } = __modules["phonology.js"];
  const poemGroups = new Map();
  const stanzaGroups = new Map();
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

  function pronouncedPhones(ipa) {
    return phones(ipa).filter(phone => phone !== '.' && phone !== '‿');
  }

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
      for (const phone of pronouncedPhones((segment.phones || []).join(''))) {
        if (phone !== expected[phoneIndex++]) return [];
        spans.push(span);
      }
      offset = end;
    }
    return phoneIndex === expected.length ? spans : [];
  }

  function ending(tokens, first, limit, offsets) {
    let last = limit - 1;
    while (last >= first && tokens[last].type !== 'word') last--;
    if (last < first) return null;
    const sounds = [];
    const anchors = [];
    for (let index = first; index <= last; index++) {
      const word = tokens[index];
      if (word.type !== 'word') continue;
      const phonemes = pronouncedPhones(word.ipa || '');
      const spans = offsets ? alignedSpans(word, offsets[index], phonemes) : [];
      if (index === last) {
        // A liaison into the next segment is external to the ending.
        if (word.liaison?.realized && phonemes.at(-1) === word.liaison.phone) phonemes.pop();
        if (phonemes.at(-1) === 'ə' && phonemes.slice(0, -1).some(isVowel)) phonemes.pop();
      }
      const excludedSpan = spans[phonemes.length];
      for (const [phoneIndex, phone] of phonemes.entries()) {
        sounds.push(phone);
        if (offsets) anchors.push(spans[phoneIndex] !== excludedSpan ? spans[phoneIndex] || null : null);
      }
    }

    const compared = rhymePhones(sounds);
    const vowel = compared.findLastIndex(isVowel);
    return vowel < 0 ? null : {key:compared.slice(vowel).join('|'), sounds:compared, anchors};
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

  function addEnding(groups, key, sounds, index) {
    const group = groups.get(key);
    if (group) {
      group.common = commonEnding(group.common, sounds);
      group.members.push(index);
      return group;
    }
    const first = {common:sounds, members:[index]};
    groups.set(key, first);
    return first;
  }

  function setRichness(groups) {
    for (const {common, members} of groups.values()) {
      if (members.length < 2) continue;
      const richness = ['Pauvre', 'Suffisante', 'Riche'][richnessSize(common) - 1];
      for (const index of members) {
        if (verses[index].richness === '—') verses[index].richness = richness;
      }
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
    setDispositions(stanzaStart, end);
    setRichness(stanzaGroups);
    stanzaGroups.clear();
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
    const group = addEnding(poemGroups, final.key, final.sounds, index);
    group.label ??= labelFor(poemGroups.size - 1);
    verses[index].letter = group.label;
    addEnding(stanzaGroups, final.key, final.sounds, index);
  }
  finishStanza(lines.length);
  for (const verse of verses) verse.internalSpans = mergeSpans(verse.internalSpans);

  // Only lines without a partner in their stanza use the whole-poem family.
  setRichness(poemGroups);
  return verses;
}
