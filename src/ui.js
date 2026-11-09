__modules["ui.js"]=(()=>{
const { initialize, transcribe }=__modules["engine.js"];
const {analyzeSonorities,isAssonance}=__modules["sonorities.js"];
const {applyPoeticReading}=__modules["poetry.js"];
const {renderSonorityPanel,focusSonority,markSounds}=__modules["sonorities-view.js"];
const {applySonorityStyle}=__modules["sonority-colors.js"];

const $ = id => document.getElementById(id);
let currentResult = null;
let inputRevision = 0;

const syllabifyVerses = globalThis.createSyllaber(globalThis.SYLLABER_LEXICON);
let verseDetails = [];
let sonoritiesEnabled = true;
let caesurasEnabled = false;
let showSingletons = false;

const sonoritySelections = new Map();
const notableSonoritySelections = new Map();
const sonorityHiddenPhones = new Map();
const sonorityCategories={alliterations:true,assonances:true};
const sonorityVerseCategories=new Map();
const sonorityCache = new WeakMap();
const notableSoundMinimum = 4;




/* @include caesuras */

/* @include rhymes */

function renderOriginal(container, {tokens, original}, {
  meter, caesuras = [], internalSpans = [], showUncertainty = true
} = {}) {
  const boundaries = meter ? meter.boundaries.map(at => at - meter.start) : [];
  const caesuraOffsets = new Set(caesurasEnabled ? caesuras.map(cut => cut.offset) : []);
  const segmentEnds = [0, ...caesuras.map(cut => boundaries.indexOf(cut.offset) + 1)];
  if (caesuras.length) segmentEnds.push(meter.syllableCount);
  const caesuraPattern = segmentEnds.slice(1).map((end, index) => end - segmentEnds[index]).join('/');
  let offset = 0;
  let nextBoundary = 0;
  let nextRhyme = 0;

  function appendLetters(parent, text, start, end) {
    let cursor = start;
    while (cursor < end) {
      const span = internalSpans[nextRhyme];
      if (!span || span.start >= end) {
        parent.append(text.slice(cursor - offset, end - offset));
        return;
      }
      if (cursor < span.start) {
        parent.append(text.slice(cursor - offset, span.start - offset));
        cursor = span.start;
      }
      const markedEnd = Math.min(span.end, end);
      const mark = document.createElement('span');
      mark.className = 'internal-rhyme';
      mark.title = 'Rime interne à la césure';
      mark.textContent = text.slice(cursor - offset, markedEnd - offset);
      parent.append(mark);
      cursor = markedEnd;
      if (cursor === span.end) nextRhyme++;
    }
  }

  function appendText(parent, text) {
    const end = offset + text.length;
    let cursor = offset;
    while (boundaries[nextBoundary] < end) {
      const cut = boundaries[nextBoundary++];
      appendLetters(parent, text, cursor, cut);
      const divider = document.createElement('span');
      if (caesuraOffsets.has(cut)) {
        divider.className = 'caesura-divider';
        divider.textContent = '//';
        divider.dataset.pattern = caesuraPattern;
        divider.setAttribute('aria-label', 'Césure estimée, découpage ' + caesuraPattern);
        divider.setAttribute('role', 'img');
      } else {
        divider.className = 'syllable-divider';
        divider.textContent = '/';
      }
      parent.append(divider);
      cursor = cut;
    }
    appendLetters(parent, text, cursor, end);
    offset = end;
  }

  if (!Array.isArray(tokens) || tokens.map(token => token.text).join('') !== original) {
    appendText(container, original);
    return;
  }
  for (const [tokenIndex,token] of tokens.entries()) {
    if (token.type !== 'word') { appendText(container, token.text); continue; }
    const word = document.createElement('span');
    const uncertain = token.confidence === 'hypothesis' || token.confidence === 'ambiguous' || token.confidence === 'fallback';
    if (sonoritiesEnabled && showUncertainty && uncertain) word.className = 'word-uncertain';
    const segments = token.segments || [];
    if (sonoritiesEnabled && segments.length && segments.map(s => s.text).join('') === token.text) {
      for (const [segmentIndex,segment] of segments.entries()) {
        const node = document.createElement('span');
        node.className = 'sonority-unit';
        node.dataset.tokenIndex = tokenIndex;
        node.dataset.segmentIndex = segmentIndex;
        appendText(node, segment.text);
        word.append(node);
      }
    } else appendText(word, token.text);
    container.append(word);
  }
}

const rhymeLabels = {F:'Fem.', M:'Masc.', '?':'F / M'};

function renderMeter(row, meter) {
  const count = document.createElement('span');
  count.className = 'verse-count verse-metric';
  count.dataset.column = 'Syllabes';
  count.textContent = meter?.syllableCountText || '—';
  if (meter) count.setAttribute('aria-label', meter.syllableCountText + (meter.syllableCountMax === 1 ? ' syllabe' : ' syllabes'));

  const rhyme = document.createElement('span');
  rhyme.className = 'verse-rhyme verse-metric';
  rhyme.dataset.column = 'Rime';
  rhyme.textContent = rhymeLabels[meter?.rhyme] || '—';
  const spokenRhyme = {F:'féminine', M:'masculine', '?':'féminine ou masculine selon la lecture'}[meter?.rhyme];
  if (spokenRhyme) rhyme.setAttribute('aria-label', 'Rime ' + spokenRhyme);
  row.append(count, rhyme);
}

function renderRhymeAnalysis(row, analysis) {
  const scheme = document.createElement('div');
  scheme.className = 'verse-scheme verse-metric';
  scheme.dataset.column = 'Disposition';
  const letter = document.createElement('span');
  letter.className = 'verse-rhyme-letter';
  letter.textContent = analysis.letter || '—';
  scheme.append(letter);
  for (const label of [analysis.disposition, analysis.redoubled && 'Redoublées', analysis.internal && 'Interne']) {
    if (!label) continue;
    const annotation = document.createElement('span');
    annotation.className = 'rhyme-annotation';
    annotation.textContent = label;
    scheme.append(annotation);
  }
  const richness = document.createElement('span');
  richness.className = 'verse-richness verse-metric';
  richness.dataset.column = 'Richesse';
  if (analysis.richness && analysis.richness !== '—') {
    const badge = document.createElement('span');
    badge.className = 'richness-badge';
    badge.dataset.quality = analysis.richness.toLowerCase();
    badge.textContent = analysis.richness;
    richness.append(badge);
  } else richness.textContent = '—';
  row.append(scheme, richness);
}

function getSonorities(result) {
  if (!sonorityCache.has(result)) sonorityCache.set(result, analyzeSonorities(result));
  return sonorityCache.get(result);
}

function renderSonoritySummary(analysis) {
  const summary = $('sonority-summary');
  const list = $('sonority-summary-list');
  summary.hidden = !analysis;
  if (!analysis) {
    list.replaceChildren();
    return;
  }

  const items = document.createDocumentFragment();
  let verseNumber = 0;
  let hasNotableVerses = false;
  for (const line of analysis.lines) {
    if (!line.original.trim()) continue;
    verseNumber++;
    const groups = [
      ['Allitérations', line.groups.alliterations.filter(sound => sound.count >= notableSoundMinimum)],
      ['Assonances', line.groups.assonances.filter(sound => sound.count >= notableSoundMinimum)]
    ];
    const notableSounds = groups.flatMap(([, sounds]) => sounds);
    if (!notableSounds.length) continue;

    const item = document.createElement('li');
    item.className = 'notable-verse';
    const number = document.createElement('span');
    number.className = 'notable-number';
    number.textContent = 'Vers ' + verseNumber;
    const content = document.createElement('div');
    const text = document.createElement('p');
    text.className = 'notable-text';
    renderOriginal(text, currentResult.lines[line.lineIndex], {showUncertainty:false});
    content.append(text);

    const selected = notableSonoritySelections.get(line.lineIndex) || new Set();
    const updateHighlights = () => markSounds(text, selected.size ? notableSounds : [], selected);
    if (selected.size) updateHighlights();

    const details = document.createElement('div');
    details.className = 'notable-details';
    for (const [label, sounds] of groups) {
      if (sounds.length === 0) continue;
      const group = document.createElement('div');
      group.className = 'notable-group';
      const name = document.createElement('span');
      name.className = 'notable-category';
      name.textContent = label;
      group.append(name);
      for (const sound of sounds) {
        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'notable-sound';
        badge.textContent = '/' + sound.phone + '/ ×' + sound.count;
        badge.setAttribute('aria-pressed', String(selected.has(sound.phone)));
        applySonorityStyle(badge, [sound.phone]);
        badge.addEventListener('click', () => {
          if (!selected.delete(sound.phone)) selected.add(sound.phone);
          if (selected.size) notableSonoritySelections.set(line.lineIndex, selected);
          else notableSonoritySelections.delete(line.lineIndex);
          badge.setAttribute('aria-pressed', String(selected.has(sound.phone)));
          updateHighlights();
        });
        group.append(badge);
      }
      details.append(group);
    }
    content.append(details);
    item.append(number, content);
    items.append(item);
    hasNotableVerses = true;
  }
  list.replaceChildren(items);
  list.hidden = !hasNotableVerses;
  $('sonority-summary-empty').hidden = hasNotableVerses;
}

function render(result) {
  currentResult = result;
  const soundAnalysis = sonoritiesEnabled ? getSonorities(result) : null;
  const showRhymes = $('result-section').dataset.rhymes !== 'false';
  $('sonorities-description').hidden=!sonoritiesEnabled;
  $('sonorities-enabled').setAttribute('aria-pressed', String(sonoritiesEnabled));
  $('sonority-singletons').setAttribute('aria-pressed',String(showSingletons));
  for(const kind of ['alliterations','assonances'])$('sonority-'+kind).setAttribute('aria-pressed',categoryState(kind));
  const fragment = document.createDocumentFragment();
  let previousVerse = -1;
  for (const [lineIndex,line] of result.lines.entries()) {
    if (!line.original.trim()) continue;
    const row = document.createElement('article');
    row.className = 'line-result';
    row.dataset.lineIndex = lineIndex;
    if (previousVerse >= 0 && lineIndex > previousVerse + 1) row.classList.add('stanza-start');
    previousVerse = lineIndex;
    const original = document.createElement('div');
    original.className = 'line-original';
    const {meter, caesuras, rhymes} = verseDetails[lineIndex];
    if (caesurasEnabled && caesuras.length) row.classList.add('has-caesuras');
    renderOriginal(original, line, {meter, caesuras, internalSpans:showRhymes ? rhymes.internalSpans : []});
    const entry = document.createElement('div');
    entry.className = 'verse-entry';
    row.append(entry);
    const content=soundAnalysis?document.createElement('div'):entry;
    if(soundAnalysis){content.className='sonority-text';entry.append(content);}
    content.append(original);
    renderMeter(row, meter);
    renderRhymeAnalysis(row, rhymes);
    if(soundAnalysis){
      const analysis=soundAnalysis.lines[lineIndex];
      const selected=sonoritySelections.get(lineIndex)||new Set();
      const hiddenPhones=sonorityHiddenPhones.get(lineIndex)||new Set();sonorityHiddenPhones.set(lineIndex,hiddenPhones);
      const categories=sonorityVerseCategories.get(lineIndex)||{...sonorityCategories};sonorityVerseCategories.set(lineIndex,categories);
      renderSonorityPanel(entry,analysis,{selected,hiddenPhones,categories,showSingletons,onToggleCategory:kind=>toggleSonorityCategory(kind,lineIndex),onSelect:phone=>{
        if (hiddenPhones.has(phone)) hiddenPhones.delete(phone);
        else if (selected.delete(phone)) hiddenPhones.add(phone);
        else selected.add(phone);
        if (selected.size) sonoritySelections.set(lineIndex, selected);
        else sonoritySelections.delete(lineIndex);
        focusSonority(entry,analysis,selected,{hiddenPhones,categories,showSingletons});
      }});
    }
    if (line.classicalRegular !== null) {
      const mark = document.createElement('span');
      mark.className = line.classicalRegular ? 'classical-mark' : 'classical-mark irregular';
      mark.textContent = line.classicalRegular ? '✓' : '×';
      mark.setAttribute('role', 'img');
      mark.setAttribute('aria-label', line.classicalRegular
        ? 'Vers régulier selon les deux critères'
        : 'Vers irrégulier selon les deux critères');
      row.append(mark);
    }
    fragment.append(row);
  }
  $('results').replaceChildren(fragment);
  renderSonoritySummary(soundAnalysis);
  $('result-section').hidden = false;
}

function setSonorities(enabled){sonoritiesEnabled=enabled;if(currentResult)render(currentResult);}

function categoryState(kind){
  const values=(currentResult?.lines||[]).flatMap((line,i)=>line.original?.trim()?[(sonorityVerseCategories.get(i)||sonorityCategories)[kind]]:[]);
  if(!values.length)return String(sonorityCategories[kind]);
  return values.every(Boolean)?'true':values.every(v=>!v)?'false':'mixed';
}
function toggleSonorityCategory(kind,lineIndex){
  const global=lineIndex===undefined;
  const enabled=global?categoryState(kind)!=='true':!(sonorityVerseCategories.get(lineIndex)||sonorityCategories)[kind];
  if(global)sonorityCategories[kind]=enabled;
  for(const [i,line]of (currentResult?.lines||[]).entries()){
    if(!line.original?.trim()||!global&&i!==lineIndex)continue;
    const categories=sonorityVerseCategories.get(i)||{...sonorityCategories};categories[kind]=enabled;sonorityVerseCategories.set(i,categories);
    const selected = sonoritySelections.get(i);
    if (!enabled && selected) {
      for (const phone of selected) {
        if ((isAssonance(phone) ? 'assonances' : 'alliterations') === kind) selected.delete(phone);
      }
      if (!selected.size) sonoritySelections.delete(i);
    }
  }
  if(currentResult)render(currentResult);
  if(!global)document.querySelector('.line-result[data-line-index="'+lineIndex+'"] .sonority-category-toggle[data-category="'+kind+'"]')?.focus({preventScroll:true});
}

async function run(event) {
  event?.preventDefault();
  const text = $('input-text').value.replace(/\r\n|[\r\u2028\u2029]/gu, '\n');
  const status = $('status');
  status.classList.remove('error');
  if (!text.trim()) {
    currentResult = null;
    verseDetails = [];
    $('results').replaceChildren();
    renderSonoritySummary(null);
    $('result-section').hidden = true;
    $('input-text').focus();
    status.textContent = 'Saisissez un texte à analyser.';
    return;
  }
  const revision = inputRevision;
  const button = $('transcribe-button');
  button.disabled = true;
  button.textContent = 'Analyse…';
  status.textContent = '';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    if (revision !== inputRevision) return;
    const meterByStart = new Map(syllabifyVerses.analyze(text).lines.map(line => [line.start, line]));
    const baseResult = transcribe(text);
    let lineStart = 0;
    const meters = baseResult.lines.map(line => {
      const meter = meterByStart.get(lineStart);
      lineStart += line.original.length + 1;
      return meter;
    });
    const result = applyPoeticReading(baseResult);
    const caesuras = result.lines.map((line, index) => findCaesuras(line, meters[index]));
    const rhymes = analyzeRhymes(result.lines, caesuras);
    verseDetails = meters.map((meter, index) => ({meter, caesuras:caesuras[index], rhymes:rhymes[index]}));
    sonoritySelections.clear();
    notableSonoritySelections.clear();
    sonorityHiddenPhones.clear();
    sonorityVerseCategories.clear();
    render(result);
    const verseCount = result.lines.filter(line => line.original.trim()).length;
    status.textContent = `${verseCount.toLocaleString('fr-FR')} ${verseCount === 1 ? 'vers analysé' : 'vers analysés'}.`;
  } catch (error) {
    status.classList.add('error');
    status.textContent = 'L’analyse a rencontré une difficulté. Réessayez avec un passage plus court.';
    console.error(error);
  } finally { button.disabled = false; button.textContent = 'Analyser'; }
}

const inputText = $('input-text');
const editButtons = ['clear-text', 'clear-line', 'clear-last-line'].map($);

function syncEditButtons() {
  for (const button of editButtons) button.disabled = inputText.value.length === 0;
}

function handleTextEdit() {
  inputRevision++;
  const status = $('status');
  status.classList.remove('error');
  if (currentResult) {
    status.textContent = 'L’analyse affichée correspond au texte précédent. Cliquez sur Analyser pour l’actualiser.';
  } else {
    status.textContent = inputText.value.trim()
      ? 'Texte modifié. Cliquez sur Analyser.'
      : 'Prêt. Le texte reste sur cet appareil.';
  }
  syncEditButtons();
}

function clearTextRange(start, end) {
  if (start !== end) {
    inputText.setRangeText('', start, end, 'start');
    handleTextEdit();
  }
  inputText.focus({preventScroll:true});
}

function clearLineAt(caret) {
  const {value} = inputText;
  let start = 0;
  let previousBreak = 0;
  for (const separator of value.matchAll(/\r\n|[\r\n\u2028\u2029]/gu)) {
    const end = separator.index + separator[0].length;
    if (end > caret) {
      clearTextRange(start, end);
      return;
    }
    start = end;
    previousBreak = separator.index;
  }
  clearTextRange(previousBreak, value.length);
}

inputText.addEventListener('input', handleTextEdit);
syncEditButtons();
$('clear-text').addEventListener('click', () => clearTextRange(0, inputText.value.length));
$('clear-line').addEventListener('click', () => clearLineAt(inputText.selectionStart));
$('clear-last-line').addEventListener('click', () => {
  const {value} = inputText;
  clearLineAt(value.trimEnd().length || value.length);
});
$('transcription-form').addEventListener('submit', run);
$('input-text').addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !$('transcribe-button').disabled) run(event);
});
function bindOverlay(buttonId, overlay, afterToggle) {
  $(buttonId).addEventListener('click', event => {
    const button = event.currentTarget;
    const pressed = String(button.getAttribute('aria-pressed') !== 'true');
    button.setAttribute('aria-pressed', pressed);
    $('result-section').dataset[overlay] = pressed;
    afterToggle?.();
  });
}
bindOverlay('syllables-enabled', 'syllables');
bindOverlay('classical-enabled', 'classical');
bindOverlay('rhymes-enabled', 'rhymes', () => {
  if (currentResult) render(currentResult);
});
$('caesuras-enabled').addEventListener('click', event => {
  caesurasEnabled = !caesurasEnabled;
  event.currentTarget.setAttribute('aria-pressed', String(caesurasEnabled));
  if (currentResult) render(currentResult);
});
$('sonorities-enabled').addEventListener('click',()=>setSonorities(!sonoritiesEnabled));
for(const kind of ['alliterations','assonances'])$('sonority-'+kind).addEventListener('click',()=>toggleSonorityCategory(kind));
$('sonority-singletons').addEventListener('click',()=>{
  showSingletons=!showSingletons;
  if(!showSingletons&&currentResult){
    const analysis = getSonorities(currentResult);
    for (const [line, selected] of sonoritySelections) {
      const {alliterations, assonances} = analysis.lines[line].soundGroups;
      for (const sound of [...alliterations, ...assonances]) {
        if (sound.count === 1) selected.delete(sound.phone);
      }
      if (!selected.size) sonoritySelections.delete(line);
    }
  }
  if(currentResult)render(currentResult);
});
initialize().then(() => {
  $('transcribe-button').disabled = false;
  $('transcribe-button').textContent = 'Analyser';
  $('status').textContent = 'Prêt. Le texte reste sur cet appareil.';
}).catch(error => {
  $('status').classList.add('error');
  $('status').textContent = 'Le lexique local n’a pas pu être chargé dans ce navigateur. Ouvrez ce fichier dans une version récente de Firefox, Chrome, Edge ou Safari.';
  $('transcribe-button').textContent = 'Indisponible';
  console.error(error);
});

return {};
})();
