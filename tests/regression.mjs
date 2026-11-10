import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

class Element {
  children = [];
  dataset = {};
  attributes = {};
  events = {};
  className = '';
  hidden = false;
  style = new Map();
  classList = {
    add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
    remove: name => { this.className = this.className.split(' ').filter(value => value !== name).join(' '); },
    contains: name => this.className.split(' ').includes(name),
    toggle: (name, present) => present ? this.classList.add(name) : this.classList.remove(name)
  };

  constructor() {
    this.style.setProperty = this.style.set.bind(this.style);
    this.style.removeProperty = this.style.delete.bind(this.style);
  }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [value]; }
  append(...nodes) {
    for (const node of nodes) {
      if (node.fragment) this.append(...node.children);
      else {
        if (node instanceof Element && node.parent) node.parent.children = node.parent.children.filter(child => child !== node);
        if (node instanceof Element) node.parent = this;
        this.children.push(node);
      }
    }
  }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener(name, listener) { this.events[name] = listener; }
  invoke(name) { return this.events[name]({currentTarget:this, preventDefault() {}}); }
  querySelectorAll(selector) {
    assert.match(selector, /^\.[\w-]+$/);
    return this.children.flatMap(child => child instanceof Element ?
      [...(child.classList.contains(selector.slice(1)) ? [child] : []), ...child.querySelectorAll(selector)] : []);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
}

const entry = new URL(process.argv.includes('--standalone') ? '../downloads/syllaber.html' : '../index.html', import.meta.url);
const html = readFileSync(entry, 'utf8');
const document = new Element();
const ids = Object.fromEntries([...html.split('</main>')[0].matchAll(/\bid="([^"]+)"/gu)]
  .map(match => [match[1], new Element()]));
document.getElementById = id => ids[id];
document.createElement = () => new Element();
document.createDocumentFragment = () => Object.assign(new Element(), {fragment:true});
const input = ids['input-text'];
input.value = '';
input.selectionStart = 0;
input.selectionEnd = 0;
input.focus = () => {};
input.setRangeText = (replacement, start, end, selectionMode) => {
  assert.equal(selectionMode, 'start');
  input.value = input.value.slice(0, start) + replacement + input.value.slice(end);
  input.selectionStart = input.selectionEnd = start;
};
ids['syllables-enabled'].setAttribute('aria-pressed', 'true');
ids['rhymes-enabled'].setAttribute('aria-pressed', 'true');
ids['classical-enabled'].setAttribute('aria-pressed', 'false');
ids['numbering-enabled'].setAttribute('aria-pressed', 'false');

let script = [...html.matchAll(/<script\b([^>]*)>/gu)]
  .map(match => [null, match[1], html.slice(match.index + match[0].length, html.indexOf('</script>', match.index))])
  .filter(([, attributes]) => !/type="application\/ld\+json"/u.test(attributes))
  .map(([, attributes, body]) => {
    const src = /src="([^"]+)"/u.exec(attributes);
    if (!src) return body;
    const url = new URL(src[1], entry);
    return readFileSync(url, 'utf8').replace(/import (\w+) from '([^']+)';/gu, (_, name, path) => {
      const part = readFileSync(new URL(path, url), 'utf8');
      assert.ok(part.startsWith('export default "') && part.endsWith('";\n'));
      assert.equal(typeof JSON.parse(part.slice('export default '.length, -2)), 'string');
      return part.replace('export default ', 'const ' + name + '=');
    });
  }).join('\n');
script = script.replace('initialize().then(() => {', 'globalThis.ready = initialize().then(() => {');
const context = {
  document, window:new Element(), requestAnimationFrame:callback => callback(), structuredClone,
  Blob, Response, DecompressionStream, atob, console
};
runInNewContext(script, context);
await context.ready;
assert.equal(ids['transcribe-button'].textContent, 'Analyser');

ids['input-text'].value = '\nappareil appareil\r\n\r\n \t\nLe couvent.\u2028« 😀 E\u0301le\u0301onore aime le me\u0301le\u0300ze. »\nUne épée / une rose\nPour qui sont ces serpents qui sifflent sur vos têtes ?\n\n';
await ids['transcription-form'].invoke('submit');
assert.equal(ids.status.textContent, '5 vers analysés.');
const results = ids.results;
const rows = results.children;
const originals = results.querySelectorAll('.line-original');
assert.equal(originals[0].textContent, 'ap/pa/reil /ap/pa/reil');
assert.equal(originals[1].textContent, 'Le /couvent.');
assert.equal(originals[2].textContent, '« 😀 E\u0301le\u0301o/no/re ai/me /le /me\u0301le\u0300ze. »');
assert.equal(originals[3].textContent, 'U/ne é/pée / /u/ne /rose');
assert.equal(originals[4].textContent, 'Pour /qui /sont /ces /ser/pents /qui /sif/flent /sur /vos /têtes ?');
assert.equal(rows.length, 5);
assert.deepEqual(rows.map(row => row.classList.contains('stanza-start')), [false,true,false,false,false]);
assert.equal(rows[0].querySelector('.verse-rhyme').textContent, 'Masc.');
assert.equal(rows[1].querySelector('.verse-count').textContent, '2 à 3');
assert.equal(rows[1].querySelector('.verse-rhyme').textContent, 'F / M');
assert.equal(rows[4].querySelector('.verse-count').textContent, '12');
assert.equal(rows[4].querySelector('.verse-rhyme').textContent, 'Fem.');
assert.deepEqual(rows[4].children.slice(0, 4).map(cell => cell.className.split(' ')[0]), ['verse-number','verse-entry','verse-count','verse-rhyme']);
assert.deepEqual(rows.map(row => row.querySelector('.verse-number').textContent), ['1', '2', '3', '4', '5']);
assert.equal(results.querySelectorAll('.verse-help').length, 0);
assert.equal(results.querySelectorAll('.verse-meter-note').length, 0);
assert.equal(results.querySelectorAll('.line-phonetic').length, 0);
assert.equal(ids['copy-button'], undefined);
const p = rows[0].querySelectorAll('.sonority-chip').find(chip => chip.dataset.phone === 'p');
assert.equal(Number(p.dataset.occurrences), 2);
p.invoke('click');
assert.equal(p.getAttribute('aria-pressed'), 'true');
assert.deepEqual(rows[0].querySelectorAll('.sonority-hit').map(span => span.textContent), ['p/p','p/p']);
ids['syllables-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.syllables, 'false');
assert.equal(p.getAttribute('aria-pressed'), 'true');
ids['sonorities-enabled'].invoke('click');
assert.equal(results.querySelectorAll('.sonority-chip').length, 0);
assert.equal(ids['download-details'], undefined);
ids['sonorities-enabled'].invoke('click');
assert.equal(results.children[0].querySelectorAll('.sonority-chip').find(chip => chip.dataset.phone === 'p').getAttribute('aria-pressed'), 'true');
ids['syllables-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.syllables, 'true');
assert.deepEqual(results.children[0].querySelectorAll('.sonority-hit').map(span => span.textContent), ['p/p','p/p']);

const classicalCases = [
  ['Une mélodie douce', '×'],
  ['Une mélodie enchantée', '✓'],
  ['Des destinées obscures', '×'],
  ['Ce sont des destinées !', '✓'],
  ['', null],
  ['La destinée humaine', '✓'],
  ['Une mélodie honteuse', '×'],
  ['Une mélodie l’emporte', '×'],
  ['Une rose blanche', '✓'],
  ['Des DESTINE\u0301ES obscures', '×'],
  ['J’écoute la mélodie.', '✓'],
  ['Des amies arrivent', '✓'],
  ['…', null]
];
ids['input-text'].value = classicalCases.map(([line]) => line).join('\n');
await ids['transcription-form'].invoke('submit');
ids['classical-enabled'].invoke('click');
assert.equal(ids['classical-enabled'].getAttribute('aria-pressed'), 'true');
assert.equal(ids['result-section'].dataset.classical, 'true');
assert.deepEqual(results.children.map(row => row.querySelector('.classical-mark')?.textContent ?? null),
  classicalCases.filter(([line]) => line).map(([,mark]) => mark));
assert.equal(results.children[4].classList.contains('stanza-start'), true);
assert.equal(results.children[0].querySelector('.classical-mark').getAttribute('role'), 'img');
ids['syllables-enabled'].invoke('click');
ids['sonorities-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.classical, 'true');
assert.equal(results.children[0].querySelector('.classical-mark').textContent, '×');
ids['classical-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.classical, 'false');

async function analyze(text) {
  ids['input-text'].value = text;
  await ids['transcription-form'].invoke('submit');
  return results.children;
}

const poem = await analyze([
  'Cheval\nRival\nPorte\nMorte',
  'Bancale\nJour\nFinal\nAmour',
  'Nuit\nFort\nMort\nLit',
  'Bancale\nRival\nFinal\nJour'
].join('\n\n'));
assert.deepEqual(poem.map(row => row.querySelector('.verse-rhyme-letter').textContent),
  'A A B B A C A C D E E D A A A C'.split(' '));
assert.deepEqual(poem.flatMap(row => row.querySelectorAll('.rhyme-annotation').map(label => label.textContent)),
  ['Plates', 'Croisées', 'Embrassées', 'Redoublées']);
assert.deepEqual(poem.slice(0, 4).map(row => row.querySelector('.verse-richness').textContent),
  ['Riche', 'Riche', 'Riche', 'Riche']);
assert.deepEqual([4, 6, 12, 13, 14].map(index => poem[index].querySelector('.verse-richness').textContent),
  Array(5).fill('Suffisante'));
assert.equal(poem[8].querySelector('.verse-richness').textContent, 'Pauvre');
for (const [index, quality] of [[0, 'riche'], [4, 'suffisante'], [8, 'pauvre']]) {
  assert.equal(poem[index].querySelector('.richness-badge').dataset.quality, quality);
}
const pair = await analyze('Cheval\nRival\nCœur');
assert.deepEqual(pair.map(row => row.querySelector('.verse-richness').textContent), ['Riche', 'Riche', '—']);
assert.equal(pair[2].querySelector('.richness-badge'), undefined);
const acrossStanzas = await analyze('Final\n\nBancale\n\nCœur');
assert.deepEqual(acrossStanzas.map(row => row.querySelector('.verse-rhyme-letter').textContent), ['A', 'A', 'B']);
assert.deepEqual(acrossStanzas.map(row => row.querySelector('.verse-richness').textContent), ['Suffisante', 'Suffisante', '—']);
const mixedRichness = await analyze([
  'Au bord du charnier,', 'On vient tout étaler ;', 'Il resta prisonnier !',
  'Il voulait tout avaler.', 'Tu dois parler.', 'Il va manger.'
].join('\n'));
assert.deepEqual(mixedRichness.map(row => row.querySelector('.verse-rhyme-letter').textContent), Array(6).fill('A'));
assert.deepEqual(mixedRichness.map(row => row.querySelector('.verse-richness').textContent),
  ['Riche', 'Riche', 'Riche', 'Riche', 'Suffisante', 'Pauvre']);
const mixedAcrossStanzas = await analyze('Charnier\n\nÉtaler\n\nPrisonnier\n\nAvaler\n\nParler\n\nManger');
assert.deepEqual(mixedAcrossStanzas.map(row => row.querySelector('.verse-richness').textContent),
  ['Riche', 'Riche', 'Riche', 'Riche', 'Suffisante', 'Pauvre']);
const stanzaPriority = await analyze('Étaler\nParler\n\nAvaler');
assert.deepEqual(stanzaPriority.map(row => row.querySelector('.verse-richness').textContent),
  ['Suffisante', 'Suffisante', 'Riche']);
const hiatusPairs = await analyze('Éblouies\ninouïes\n\nHaï\ntrahi\n\nOui\ninouï\n\nInouï\névanoui');
assert.deepEqual(hiatusPairs.map(row => row.querySelector('.verse-richness').textContent),
  ['Suffisante', 'Suffisante', 'Suffisante', 'Suffisante', 'Pauvre', 'Pauvre', 'Riche', 'Riche']);
const rhymeVariantCases = [
  ['Zones', 'jaunes', 'Suffisante'], ['Anses', 'Hanses', 'Suffisante'],
  ['Flache', 'lâche', 'Riche'], ['Embaumé', 'mai', 'Suffisante'],
  ['Zones', 'personnes', 'Suffisante'], ['Flache', 'cache', 'Suffisante'],
  ['Mai', 'mais', 'Suffisante'], ['Genoux', 'cheval', '—'],
  ['Bonne', 'jaune', '—'], ['Patte', 'pâte', '—'], ['Pré', 'près', '—']
];
for (const [left, right, richness] of rhymeVariantCases) {
  const rows = await analyze(left + '\n' + right);
  assert.deepEqual(rows.map(row => row.querySelector('.verse-richness').textContent),
    [richness, richness], left + ' / ' + right);
  const letters = rows.map(row => row.querySelector('.verse-rhyme-letter').textContent);
  assert.equal(letters[0] === letters[1], richness !== '—', left + ' / ' + right);
}
const separatedVariants = await analyze('Zones\r\n \r\njaunes');
assert.deepEqual(separatedVariants.map(row => row.querySelector('.verse-richness').textContent), ['—', '—']);
assert.ok(separatedVariants[1].classList.contains('stanza-start'));
const competingVariants = await analyze('Flache\ncache\nlâche');
assert.deepEqual(competingVariants.map(row => row.querySelector('.verse-richness').textContent),
  ['Suffisante', 'Suffisante', '—']);
const dispositionLabels = row => row.querySelector('.verse-scheme').querySelectorAll('.rhyme-annotation')
  .map(label => label.textContent);
const stanza = await analyze('pont\nporte\nfond\njour\namour\nfront');
assert.deepEqual(stanza.map(row => row.querySelector('.verse-rhyme-letter').textContent), ['A', 'B', 'A', 'C', 'C', 'A']);
assert.deepEqual(stanza.map(dispositionLabels), [['Redoublées'], [], ['Embrassées'], [], [], []]);
const separateStanzas = await analyze('pont\nfond\n\nfront');
assert.equal(separateStanzas.flatMap(dispositionLabels).includes('Redoublées'), false);

const cutExamples = [
  ['L’or', 1, [], ''],
  ['Pour qui sont ces serpents qui sifflent sur vos têtes ?', 12, ['qui /sif'], '6/6'],
  ['Dans le jardin, les papillons vont vers les fleurs', 12, ['les'], '4/8'],
  ['Dans le jardin, sous le grand pin, près du ruisseau', 12, ['sous', 'près'], '4/4/4'],
  ['Sous le pont, dans la nuit, près du bois, loin du bruit', 12, ['dans', 'près', 'loin'], '3/3/3/3'],
  ['Sous le pont, dans le fond', 6, ['dans'], '3/3']
];
const withCuts = await analyze(cutExamples.map(([line]) => line).join('\n\n'));
assert.equal(results.querySelectorAll('.caesura-divider').length, 0);
assert.deepEqual(withCuts.map(row => Number(row.querySelector('.verse-count').textContent)),
  cutExamples.map(([,count]) => count));
assert.equal(withCuts[5].querySelector('.internal-rhyme'), undefined);
ids['caesuras-enabled'].invoke('click');
assert.equal(ids['caesuras-enabled'].getAttribute('aria-pressed'), 'true');
for (const [index, [, , nextWords, pattern]] of cutExamples.entries()) {
  const original = results.children[index].querySelector('.line-original');
  assert.equal(original.querySelectorAll('.caesura-divider').length, nextWords.length);
  for (const marker of original.querySelectorAll('.caesura-divider')) {
    assert.equal(marker.dataset.pattern, pattern);
    assert.equal(marker.getAttribute('aria-label'), 'Césure estimée, découpage ' + pattern);
  }
  assert.doesNotMatch(original.textContent, /\/\/\//u);
  let offset = 0;
  for (const phrase of nextWords) {
    const next = original.textContent.indexOf('//' + phrase, offset);
    assert.ok(next >= 0, original.textContent);
    offset = next + 2 + phrase.length;
  }
}
ids['syllables-enabled'].invoke('click');
ids['classical-enabled'].invoke('click');
ids['sonorities-enabled'].invoke('click');
assert.equal(results.querySelectorAll('.caesura-divider').length, 8);
assert.equal(ids['caesuras-enabled'].getAttribute('aria-pressed'), 'true');
ids['caesuras-enabled'].invoke('click');
assert.equal(results.querySelectorAll('.caesura-divider').length, 0);

const firstInternal = 'Sous le pont, les flots grondent';
const secondInternal = 'Dans le fond, la nuit danse';
const markedParts = () => results.children.map(row => row.querySelectorAll('.internal-rhyme')
  .map(mark => mark.textContent).join('')).filter(Boolean);
const internalPair = await analyze([firstInternal, secondInternal].join('\n'));
assert.deepEqual(markedParts(), ['on', 'on']);
assert.deepEqual(internalPair.map(dispositionLabels), [['Interne'], ['Interne']]);
const nasal = internalPair[0].querySelectorAll('.sonority-chip').find(chip => chip.dataset.phone === 'ɔ̃');
nasal.invoke('click');
assert.ok(internalPair[0].querySelectorAll('.sonority-hit').some(node => node.querySelector('.internal-rhyme')));
ids['rhymes-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.rhymes, 'false');
assert.deepEqual(markedParts(), []);
assert.equal(ids['syllables-enabled'].getAttribute('aria-pressed'), 'true');
ids['syllables-enabled'].invoke('click');
ids['rhymes-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.rhymes, 'true');
assert.equal(ids['result-section'].dataset.syllables, 'false');
assert.deepEqual(markedParts(), ['on', 'on']);
ids['caesuras-enabled'].invoke('click');
assert.deepEqual(markedParts(), ['on', 'on']);
assert.equal(results.querySelectorAll('.caesura-divider').length, 2);
ids['caesuras-enabled'].invoke('click');

await analyze([firstInternal, ...Array(6).fill('Feu'), secondInternal].join('\n'));
assert.deepEqual(markedParts(), ['on', 'on']);
await analyze([firstInternal, ...Array(7).fill('Feu'), secondInternal].join('\n'));
assert.deepEqual(markedParts(), []);
await analyze([firstInternal, '', secondInternal].join('\n'));
assert.deepEqual(markedParts(), []);
await analyze('Sous le pont, dans le fond, près des champs, loin du bourg');
assert.deepEqual(markedParts(), []);
ids['caesuras-enabled'].invoke('click');
assert.equal(results.querySelectorAll('.caesura-divider').length, 3);

await analyze('Vers le port, les voiles dansent\nPrès du bord, les ombres veillent');
assert.deepEqual(markedParts(), ['or', 'or']);
await analyze('Sous la porte, les rats passent\nPrès des mortes, la nuit tremble');
assert.deepEqual(markedParts(), ['ort', 'ort']);
ids['sonorities-enabled'].invoke('click');
assert.deepEqual(markedParts(), ['ort', 'ort']);
await analyze('Pour la justice, le peuple avance\nFace à l’injustice, les braves se lèvent');
assert.deepEqual(markedParts(), ['tic', 'tic']);
if (ids['caesuras-enabled'].getAttribute('aria-pressed') !== 'true') ids['caesuras-enabled'].invoke('click');
const shortCases = [
  ['Jour noir', '1/1'], ['Le jour tombe', '2/1'], ['Le vent se lève', '2/2'],
  ['À quoi bon rêver', '2/3'], ['Un oiseau chante', '3/1'],
  ['Feu', ''], ['Bonjour', ''], ['Le jour', '1/1'], ['Je t’aime', '1/1'], ['J’y lis.', '1/1'],
  ['Viens ! viens dans ma brume hagarde,', '4/4'],
  ['Dieu, pour le penseur attristé,', '3/5']
];
const shortVerses = await analyze(shortCases.map(([text]) => text).join('\n\n'));
assert.deepEqual(shortVerses.map(row => row.querySelector('.caesura-divider')?.dataset.pattern || ''),
  shortCases.map(([,pattern]) => pattern));
const flameVerses = await analyze('Viens voir le songeur qui s’enflamme\nEt, de jour en jour, dans son âme');
assert.deepEqual(flameVerses.map(row => row.querySelector('.verse-rhyme-letter').textContent), ['A', 'A']);
assert.deepEqual(flameVerses.map(row => row.querySelector('.verse-richness').textContent), ['Suffisante', 'Suffisante']);
ids['input-text'].value = 'Texte modifié';
ids['input-text'].invoke('input');
const previousAnalysisStatus = 'L’analyse affichée correspond au texte précédent. Cliquez sur Analyser pour l’actualiser.';
assert.equal(results.children, flameVerses);
assert.equal(ids['result-section'].hidden, false);
assert.equal(ids.status.textContent, previousAnalysisStatus);
context.requestAnimationFrame = callback => setTimeout(callback, 0);
const canceledAnalysis = ids['transcription-form'].invoke('submit');
ids['input-text'].value = 'Un autre texte';
ids['input-text'].invoke('input');
await canceledAnalysis;
assert.equal(results.children, flameVerses);
assert.equal(ids['result-section'].hidden, false);
assert.equal(ids['transcribe-button'].disabled, false);
ids['input-text'].value = '';
ids['input-text'].invoke('input');
assert.equal(ids.status.textContent, previousAnalysisStatus);
await ids['transcription-form'].invoke('submit');
assert.equal(results.children.length, 0);
assert.equal(ids['result-section'].hidden, true);
ids['input-text'].invoke('input');
assert.match(ids.status.textContent, /^Prêt\./u);
const example = readFileSync(new URL('../docs/examples/le-bateau-ivre.txt', import.meta.url), 'utf8').trim();
const exampleRows = await analyze(example);
assert.equal(exampleRows.length, 100);
ids['numbering-enabled'].invoke('click');
assert.equal(ids['numbering-enabled'].getAttribute('aria-pressed'), 'true');
assert.equal(ids['result-section'].dataset.numbering, 'true');
assert.equal(ids['result-section'].style.get('--verse-number-digits'), '3');
assert.deepEqual([0, 4, 99].map(index => exampleRows[index].querySelector('.verse-number').textContent), ['1', '5', '100']);
assert.equal(results.children, exampleRows);
ids['numbering-enabled'].invoke('click');
assert.equal(ids['result-section'].dataset.numbering, 'false');
assert.equal(ids.status.textContent, '100 vers analysés.');
assert.equal(ids['result-section'].hidden, false);
assert.deepEqual([8, 10, 93].map(index => exampleRows[index].querySelector('.verse-rhyme-letter').textContent),
  ['E', 'E', 'E']);
assert.deepEqual([8, 9, 10, 11, 93].map(index => exampleRows[index].querySelector('.verse-richness').textContent),
  ['Riche', 'Suffisante', 'Riche', 'Suffisante', 'Suffisante']);
const hiatusLines = [exampleRows[36], exampleRows[38]];
assert.deepEqual(hiatusLines.map(row => row.querySelector('.verse-count').textContent), ['12', '12']);
assert.deepEqual(hiatusLines.map(row => row.querySelector('.verse-richness').textContent),
  ['Suffisante', 'Suffisante']);
for (const [index, quality] of [[60, 'Suffisante'], [68, 'Suffisante'], [92, 'Riche'], [93, 'Suffisante']]) {
  assert.deepEqual([index, index + 2].map(verse => exampleRows[verse].querySelector('.verse-richness').textContent),
    [quality, quality], 'Vers ' + (index + 1) + ' et ' + (index + 3));
}
const exampleStanzas = example.split(/\r?\n[ \t]*\r?\n/u);
assert.equal(exampleStanzas.length, 25);
for (const [index, text] of exampleStanzas.entries()) {
  const stanzaRows = exampleRows.slice(index * 4, index * 4 + 4);
  assert.equal(text.split(/\r?\n/u).length, 4);
  assert.equal(stanzaRows[0].classList.contains('stanza-start'), index !== 0);
  const [a, b, c, d] = stanzaRows.map(row => row.querySelector('.verse-rhyme-letter').textContent);
  assert.equal(a, c, 'Première rime du quatrain ' + (index + 1));
  assert.equal(b, d, 'Deuxième rime du quatrain ' + (index + 1));
  assert.notEqual(a, b, 'Familles distinctes dans le quatrain ' + (index + 1));
  assert.ok(stanzaRows.every(row => row.querySelector('.richness-badge')), 'Richesse du quatrain ' + (index + 1));
  assert.ok(dispositionLabels(stanzaRows[0]).includes('Croisées'), 'Disposition du quatrain ' + (index + 1));
}
if (ids['sonorities-enabled'].getAttribute('aria-pressed') !== 'true') ids['sonorities-enabled'].invoke('click');
const summary = ids['sonority-summary'];
const summaryList = ids['sonority-summary-list'];
const summaryEmpty = ids['sonority-summary-empty'];
const belowThreshold = 'Pas, par, part.';
const notableLines = ['Pas, pile, peau, poule.', 'Rat, chat, pas, drap, chat.', 'Pas, par, pal, part.'];
await analyze([belowThreshold, notableLines[0], '', ...notableLines.slice(1)].join('\n'));
const listedVerses = () => summaryList.children.map(item => ({
  number: item.querySelector('.notable-number').textContent,
  text: item.querySelector('.notable-text').textContent,
  groups: item.querySelectorAll('.notable-group').map(group => [
    group.querySelector('.notable-category').textContent,
    ...group.querySelectorAll('.notable-sound').map(sound => sound.textContent)
  ])
}));
const expectedSummary = [
  {number:'Vers 2', text:notableLines[0], groups:[['Allitérations', '/p/ ×4']]},
  {number:'Vers 3', text:notableLines[1], groups:[['Assonances', '/a/ ×5']]},
  {number:'Vers 4', text:notableLines[2], groups:[['Allitérations', '/p/ ×4'], ['Assonances', '/a/ ×4']]}
];
assert.equal(summary.hidden, false);
assert.equal(summaryEmpty.hidden, true);
assert.deepEqual(listedVerses(), expectedSummary);
const lastNotableVerse = () => summaryList.children.at(-1);
const notableButtons = () => lastNotableVerse().querySelectorAll('.notable-sound');
const notableHighlights = () => lastNotableVerse().querySelectorAll('.sonority-hit').map(span => span.textContent);
const [notableP, notableA] = notableButtons();
assert.equal(notableP.type, 'button');
assert.equal(notableP.getAttribute('aria-pressed'), 'false');
notableP.invoke('click');
assert.equal(notableP.getAttribute('aria-pressed'), 'true');
assert.deepEqual(notableHighlights(), ['P', 'p', 'p', 'p']);
assert.equal(summaryList.children[0].querySelectorAll('.sonority-hit').length, 0);
notableA.invoke('click');
assert.deepEqual(notableHighlights(), ['P', 'a', 'p', 'a', 'p', 'a', 'p', 'a']);
notableP.invoke('click');
assert.equal(notableP.getAttribute('aria-pressed'), 'false');
assert.deepEqual(notableHighlights(), ['a', 'a', 'a', 'a']);
ids['sonority-alliterations'].invoke('click');
assert.deepEqual(listedVerses(), expectedSummary);
ids['sonority-alliterations'].invoke('click');
ids['sonorities-enabled'].invoke('click');
assert.equal(summary.hidden, true);
assert.equal(summaryList.children.length, 0);
ids['sonorities-enabled'].invoke('click');
assert.deepEqual(listedVerses(), expectedSummary);
assert.equal(notableButtons()[1].getAttribute('aria-pressed'), 'true');
assert.deepEqual(notableHighlights(), ['a', 'a', 'a', 'a']);
notableButtons()[1].invoke('click');
assert.deepEqual(notableHighlights(), []);
await analyze(belowThreshold);
assert.equal(summaryEmpty.hidden, false);
assert.equal(summaryList.children.length, 0);
ids['input-text'].value = 'Un autre vers';
ids['input-text'].invoke('input');
assert.equal(summary.hidden, false);

await analyze('Pas, par, pal, part.\nPas, par, pal, part.');
const chipFor = phone => results.children[0].querySelectorAll('.sonority-chip').find(chip => chip.dataset.phone === phone);
const focusedSounds = () => [...new Set(results.children[0].querySelectorAll('.sonority-hit')
  .flatMap(node => JSON.parse(node.dataset.sonorityPhones)))].sort();
for (const phone of ['p', 'a', 'ʁ']) chipFor(phone).invoke('click');
assert.deepEqual(focusedSounds(), ['a', 'p', 'ʁ']);
assert.deepEqual(['p', 'a', 'ʁ'].map(phone => chipFor(phone).getAttribute('aria-pressed')), ['true', 'true', 'true']);
assert.equal(results.children[1].querySelectorAll('.sonority-hit').length, 0);
chipFor('p').invoke('click');
assert.equal(chipFor('p').dataset.sonorityState, 'hidden');
assert.deepEqual(focusedSounds(), ['a', 'ʁ']);
chipFor('p').invoke('click');
assert.equal(chipFor('p').dataset.sonorityState, 'visible');
assert.deepEqual(focusedSounds(), ['a', 'ʁ']);
ids['sonority-alliterations'].invoke('click');
assert.deepEqual(focusedSounds(), ['a']);
ids['sonority-alliterations'].invoke('click');
assert.deepEqual(focusedSounds(), ['a']);
ids['sonority-singletons'].invoke('click');
chipFor('l').invoke('click');
assert.deepEqual(focusedSounds(), ['a', 'l']);
ids['sonority-singletons'].invoke('click');
assert.deepEqual(focusedSounds(), ['a']);

const beforeLineDeletion = await analyze('Un\n\nDeux 😀\nTrois\n');
input.selectionStart = 'Un\n\nDe'.length;
input.selectionEnd = input.value.length;
ids['clear-line'].invoke('click');
assert.equal(input.value, 'Un\n\nTrois\n');
assert.equal(input.selectionStart, 'Un\n\n'.length);
assert.equal(input.selectionEnd, input.selectionStart);
assert.equal(results.children, beforeLineDeletion);
assert.equal(ids['result-section'].hidden, false);
assert.equal(summary.hidden, false);
assert.equal(ids.status.textContent, previousAnalysisStatus);
await ids['transcription-form'].invoke('submit');
assert.equal(results.children.length, 2);
assert.equal(ids.status.textContent, '2 vers analysés.');
const beforeLastLineDeletion = results.children;
input.value = 'Un\nDeux\n\n';
input.selectionStart = input.selectionEnd = 0;
ids['clear-last-line'].invoke('click');
assert.equal(input.value, 'Un\n\n');
input.value = 'Un\r\nDeux\u2028Trois';
ids['clear-last-line'].invoke('click');
assert.equal(input.value, 'Un\r\nDeux');
assert.equal(results.children, beforeLastLineDeletion);
const beforeClearAll = await analyze(notableLines[0] + '\nDeux');
const beforeClearAllSummary = summaryList.children;
assert.equal(beforeClearAllSummary.length, 1);
ids['clear-text'].invoke('click');
assert.equal(input.value, '');
assert.equal(results.children, beforeClearAll);
assert.equal(summaryList.children, beforeClearAllSummary);
assert.equal(ids.status.textContent, previousAnalysisStatus);
assert.ok(['clear-text', 'clear-line', 'clear-last-line'].every(id => ids[id].disabled));
await ids['transcription-form'].invoke('submit');
assert.equal(results.children.length, 0);
assert.equal(summaryList.children.length, 0);
assert.equal(summary.hidden, true);
assert.equal(ids['result-section'].hidden, true);
assert.equal(ids.status.textContent, 'Saisissez un texte à analyser.');
console.log('Régressions et exemple complet du Bateau ivre vérifiés.');

