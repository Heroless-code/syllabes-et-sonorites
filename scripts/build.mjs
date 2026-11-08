import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
let ui = read('src/ui.js');
for (const name of ['caesuras', 'rhymes']) {
  const marker = '/* @include ' + name + ' */';
  if (!ui.includes(marker)) throw new Error('Missing source marker for ' + name);
  ui = ui.replace(marker, () => read('src/' + name + '.js').trim());
}
const lexicon = read('src/syllaber-lexicon.js');
const engine = read('src/syllaber-engine.js');
const modules = read('src/phonetics.js') + ui;
const template = read('src/template.html');
function page(values) {
  let html = template;
  for (const [name, value] of Object.entries(values)) {
    const marker = '{{' + name + '}}';
    if (!html.includes(marker)) throw new Error('Missing template marker ' + name);
    html = html.replaceAll(marker, () => value);
  }
  if (/\{\{[A-Z_]+\}\}/u.test(html)) throw new Error('Unresolved template marker');
  return html;
}

// Keep the public HTML small and every script below Googlebot's 2 MB fetch limit.
// Only the existing base64 dictionary is split; the linguistic engines stay identical.
mkdirSync(new URL('assets/', root), {recursive:true});
const dictionaryMarker = 'const LEXICON_B64="';
const dictionaryStart = modules.indexOf(dictionaryMarker);
const dictionaryEnd = modules.indexOf('";', dictionaryStart + dictionaryMarker.length);
if (dictionaryStart < 0 || dictionaryEnd < 0) throw new Error('Phonetic dictionary not found');
const dictionary = modules.slice(dictionaryStart + dictionaryMarker.length, dictionaryEnd);
const imports = [];
const parts = [];
for (let offset = 0, index = 0; offset < dictionary.length; offset += 1_500_000, index++) {
  const name = 'lexiconPart' + index;
  const path = 'lexicon-' + String(index + 1).padStart(2, '0') + '.js';
  writeFileSync(new URL('assets/' + path, root), 'export default ' + JSON.stringify(dictionary.slice(offset, offset + 1_500_000)) + ';\n');
  imports.push('import ' + name + " from './" + path + "';");
  parts.push(name);
}
const hostedModules = modules.slice(0, dictionaryStart) + 'const LEXICON_B64=[' + parts.join(',') + '].join(\'\');' + modules.slice(dictionaryEnd + 2);
const app = imports.join('\n') + '\n' + lexicon + '\n' + engine + '\n' + hostedModules;
if (Buffer.byteLength(app) >= 2_000_000) throw new Error('Public application script exceeds crawl limit');
writeFileSync(new URL('assets/app.js', root), app);
const hosted = page({
  SCRIPT_POLICY:"'self' 'unsafe-inline'",
  ROBOTS:'index, follow, max-image-preview:large',
  ICON:'https://heroless-code.github.io/syllabes-et-sonorites/assets/icon.svg',
  SCRIPTS:'<script type="module" src="./assets/app.js"></script>'
});
writeFileSync(new URL('index.html', root), hosted);

// Preserve a genuinely self-contained HTML for file:// use without module requests.
mkdirSync(new URL('downloads/', root), {recursive:true});
const offline = page({
  SCRIPT_POLICY:"'unsafe-inline'",
  ROBOTS:'noindex, follow',
  ICON:'data:image/svg+xml,' + encodeURIComponent(read('assets/icon.svg')),
  SCRIPTS:'<script id="syllaber-lexicon">' + lexicon + '</script>\n<script id="syllaber-engine">' + engine + '</script>\n<script type="module">' + modules + '</script>'
});
writeFileSync(new URL('downloads/syllaber.html', root), offline);
console.log('Application construite — index.html (' + Buffer.byteLength(hosted) + ' octets) et downloads/syllaber.html (autonome)');
