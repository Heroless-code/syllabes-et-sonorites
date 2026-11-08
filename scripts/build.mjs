import {readFileSync, writeFileSync} from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
let ui = read('src/ui.js');
for (const name of ['caesuras', 'rhymes']) {
  const marker = '/* @include ' + name + ' */';
  if (!ui.includes(marker)) throw new Error('Missing source marker for ' + name);
  ui = ui.replace(marker, () => read('src/' + name + '.js').trim());
}
const sources = {
  SYLLABER_LEXICON:read('src/syllaber-lexicon.js'),
  SYLLABER_ENGINE:read('src/syllaber-engine.js'),
  MODULES:read('src/phonetics.js') + ui
};
let html = read('src/template.html');
for (const [name, source] of Object.entries(sources)) {
  const marker = '{{' + name + '}}';
  if (!html.includes(marker)) throw new Error('Missing template marker ' + name);
  html = html.replace(marker, () => source);
}
writeFileSync(new URL('index.html', root), html);
console.log('Application construite — index.html');
