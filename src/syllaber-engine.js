
/* Moteur autonome. Les indices publics sont ceux de la chaîne originale (UTF-16).
 * Aucun accès DOM, réseau, horloge ou stockage. La factory peut être sérialisée
 * dans un Worker ; toutes ses dépendances sont dans le paramètre lexical. */
function createSyllaber(lexicon) {
  'use strict';
  lexicon = lexicon || {};
  const vowels = new Set(Array.from('aàâäæeéèêëiîïoôöœuùûüyÿ'));
  const tremas = new Set(Array.from('äëïöüÿ'));
  const onsets = new Set(['bl','br','ch','cl','cr','dh','dr','fl','fr','gl','gn','gr','ph','pl','pr','th','tl','tr','vr','qu','gu']);
  const aspirated = new Set(lexicon.hAspirated || []);
  const presentStems = new Set(lexicon.presentStems || []);
  const ierStems = new Set(lexicon.ierStems || []);
  const ionNouns = new Set(['passions','notions','portions','mentions','actions','conditions','religions','questions','lions','rions','septentrions','visions','nations','illusions']);
  const nasalEnt = new Set([...(lexicon.entNasal || []), ...(lexicon.entAmbiguous || [])]);
  // Captures targeted et additional : la référence traite ces homographes
  // avec une finale féminine, même si leur entrée phonétique est nasale.
  nasalEnt.delete('accident');
  nasalEnt.delete('couvent');
  const verifiedWords = lexicon.verifiedWords || {};
  const wordCorrections = lexicon.wordCorrections || {};
  const hCorrections = lexicon.hCorrections || {};
  const rhymeOverrides = lexicon.rhymeOverrides || {};
  const spellingCorrections = lexicon.spellingCorrections || {};
  const bomCorrections = lexicon.bomCorrections || {};
  const adjacentWords = lexicon.adjacentWords || {};
  const countVariants = lexicon.countVariants || {words:{},previousWordOverrides:{}};
  const cache = new Map();
  const base = c => c.normalize('NFD').replace(/\p{M}/gu, '');
  const isVowel = c => typeof c==='string' && (vowels.has(c) || /^[aeiouy]$/u.test(base(c)));
  const canonical = s => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const normalize = s => s.normalize('NFC').toLowerCase();
  const spellingKey = s => s.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}\p{M}]+$/gu,'').replace(/’/gu,"'");

  function letters(raw) {
    const out = [];
    for (const m of raw.matchAll(/[\p{L}\p{N}]\p{M}*/gu)) {
      // Les marques décomposées restent dans le texte. La référence les traite
      // différemment des accents précomposés : ne pas les convertir ici en NFC.
      const key = m[0].replace(/\p{M}/gu,'').toLowerCase();
      out.push({ key, start: m.index, end: m.index + m[0].length, vowel: isVowel(key) });
    }
    return out;
  }

  // Les suites vocaliques sont des graphèmes, pas une liste de syllabes.
  // Les règles de diérèse précèdent les regroupements usuels (tableaux fournis).
  function joins(a, b, index, chars, word, features) {
    if (tremas.has(b)) return false;
    if(index===features.familyJoinAt && a+b===features.familyJoinPair && !word.startsWith('\ufeff')) return true;
    // Futur/conditionnel des verbes en -éer : crée/ra, mais cré/er, cré/é.
    if (a==='é' && b==='e' && chars[index+2]?.key==='r' && chars[index+3]?.vowel) return true;
    // Captures : prée/xis/ter et rée/xa/men ; pré/ex/por/ter reste séparé.
    if (a==='é' && b==='e' && chars[index+2]?.key==='x' && chars[index+3]?.vowel) return true;
    if (a === 'æ' || b === 'æ' || a === 'é' || (b === 'é' && base(a)!=='i')) return false;
    if (a === 'œ') return b === 'u' || b === 'i';
    const x = base(a), y = base(b), pair = x + y;
    if (pair==='ee') return true;
    // coe/xis/ter, coem/bal/ler ; po/ème et po/é/sie gardent l'accent.
    if (a==='o' && b==='e') return true;
    if (b==='y' && index+2===chars.length && /[aeou]/u.test(x)) return true;
    if (pair === 'ea' && chars[index+2]?.key==='u') return true;
    if (['ai','au','ei','eu','oi','ou'].includes(pair)) return true;
    if (pair==='oo') return true;
    if (a==='ï' && /[aeo]/u.test(y)) return true;
    if (pair === 'ui') {
      if (/[oe]/u.test(chars[index-1]?.key||'') && chars[index+2]?.key!=='n' && word!=='oui') return false;
      return !features.uiHiatus;
    }
    if (x !== 'i') return false;
    if (features.ierAt===index && word!=='avions') return false;
    const before = chars.slice(Math.max(0,index-2),index).map(c => base(c.key)).join('');
    const remaining=chars.length-index-1;
    const after = chars.slice(index+1,index+11).map(c => c.key).join('')+(remaining>10?'#':'');
    if (y === 'a') return /^(?:diable|diacre|fiacre|giaour|viande|diantre|biais)/u.test(word) || features.illiard;
    if (y === 'o') {
      if (/^(?:fiole|kiosque|mioche|pioche)/u.test(word)) return true;
      return /(?:[yi]|rl)$/u.test(before) || features.verbIon;
    }
    if (y === 'u') return false;
    if (y !== 'e') return false;
    if (/^(?:bien|rien)/u.test(word)) return true;
    if (/^(?:(?:re|de|sou|con|par|ob|main|entre)?(?:vien|tien))/u.test(word)) return true;
    if (/^(?:vieil|faïence|aïeul|piéd|piét|empiét|(?:en)?fiévr|(?:at)?tiéd|assiég|siég|rapiéc)/u.test(word)) return true;
    if (features.aieu) return true;
    if (b==='é') return /tiés?$/u.test(word);
    if (/^(?:ciel|fiel|miel|bielle|nielle|miette|assiette|pied|bief|fief|relief|diète|fièvre|mièvre|lièvre|dièse|tiède|siège|pièce|lierre|pierre)/u.test(word)) return true;
    if (/^(?:dieu|adieu|pieu|épieu|cieux|essieu|mieux|monsieur|vieux|lieu|milieu)/u.test(word)) return true;
    if (/^eu/u.test(after)) return false;
    if (/^elles?$/u.test(after) || /^els?$/u.test(after)) return false;
    if (/^ettes?$/u.test(after) || /^ets?$/u.test(after) || /^esses?$/u.test(after)) return false;
    if (/^ennes?$/u.test(after)) return /^(?:mienne|sienne|tienne|chienne|chrétienne|gardienne|paroissienne|païenne|ancienne|vaurienne)/u.test(word) || /(?:tienne|vienne)/u.test(word);
    if (/^ents?$/u.test(after) || /^ences?$/u.test(after)) return /^(?:vient|tient|souvient|revient|devient)/u.test(word);
    if (/^ens?$/u.test(after)) return /^(?:bien|combien|rien|chien|mien|sien|tien|chrétien|gardien|paroissien|païen|vaurien|sébastien|amiens|ancien)s?$/u.test(word);
    const liquidCluster=/[^aeiouy][lr]$/u.test(before) && before[0]!==before[1];
    if (/^èmes?$/u.test(after)) return !liquidCluster;
    if (/^è/u.test(after)) return !liquidCluster;
    if (/^er/u.test(after)) return !liquidCluster && !/^(?:allier|colorier|initier|lier|nier|confier)$/u.test(word);
    if (/^ez$/u.test(after)) return word!=='riez' && (!liquidCluster || before==='rl');
    if (/^é(?:e?s?)?$/u.test(after)) return !liquidCluster;
    return false;
  }

  function simplePlan(raw, final, prefixedBOM=false) {
    const chars = letters(raw);
    const word = chars.map(c => c.key).join('');
    if (!chars.length) return { cuts: [], elidable: false };
    const lexicalWord=normalize(raw).replace(/^[\W_]*?(?:[ldjtscmn]|qu)['’ʼ]/u,'').replace(/[^\p{L}\p{N}]/gu,'');
    const prefixLength=word.length-lexicalWord.length;
    const ionStem=lexicalWord.endsWith('ions')?lexicalWord.slice(0,-4):'';
    const pastASubjunctive=lexicalWord.endsWith('assions') && presentStems.has(lexicalWord.slice(0,-7));
    const features={uiHiatus:/(druide|fluide|bruine|bruire|ruine|suicid)/u.test(word),illiard:/illiards?$/u.test(word),verbIon:!ionNouns.has(lexicalWord) && (pastASubjunctive||presentStems.has(ionStem)||presentStems.has(ionStem+'e')||(ionStem.endsWith('er')&&presentStems.has(ionStem.slice(0,-2)))||/^(?:pouv|dev|ét|ir|dir|fer|ver|sent|cour|ven|reven|fais|dis|puiss|fuss|a[uy])ions$/u.test(lexicalWord)),aieu:word.includes('aïeu'),cueil:word.includes('cueil'),ierAt:-1};
    const family=countVariants.families?.find(f=>word.startsWith(f.prefix));
    features.familyJoinAt=family?.joinAt??-1;
    features.familyJoinPair=family?.pair||'';
    for(const suffix of ['ier','ié','iée','iés','iées','iez','ions','ia','ias','iâmes','iâtes','ièrent','iais','iait','iaient','iant','iante','iantes','ient','iions','iiez']) {
      if(lexicalWord.endsWith(suffix) && ierStems.has(lexicalWord.slice(0,-suffix.length))) { features.ierAt=prefixLength+lexicalWord.length-suffix.length; break; }
    }
    let lastE = -1;
    if (/e$/u.test(word)) lastE = chars.length - 1;
    else if (/es$/u.test(word)) lastE = chars.length - 2;
    else if (/ent$/u.test(word) && ((!nasalEnt.has(word) && !/[eé]ment$/u.test(word)) || /aient$/u.test(word))) lastE = chars.length - 3;
    for (let i=0; i<chars.length; i++) {
      const c=chars[i], prev=chars[i-1]?.key, next=chars[i+1]?.key;
      if (c.key === 'y' && next && (/[aàâäeéèêëiîïuùûü]/u.test(next) || (isVowel(next) && isVowel(prev)))) c.vowel = false;
      if (c.key === 'u' && (prev === 'q' || (prev === 'g' && /[eéèêiîïy]/u.test(next || '')) || (prev === 'c' && chars.slice(i+1,i+4).map(x=>x.key).join('') === 'eil'))) c.vowel = false;
      if (c.key === 'u' && prev==='g' && /[aàâoô]/u.test(next||'') && chars.length-i<=9 && presentStems.has(word.slice(0,i+1))) c.vowel=false;
      if (c.key === 'i' && chars[i-1]?.vowel && chars[i+1]?.key === 'l') { c.vowel = false; c.tail=true; }
      if (c.key === 'e' && prev==='g' && /[aàâo]/u.test(next||'')) c.vowel = false;
      if (c.key === 'e' && prev==='g' && next==='ô') c.vowel=false;
      if (c.key === 'e' && /[iy]/u.test(prev||'') && chars[i-1]?.vowel && next==='m' && chars.slice(i+1,i+5).map(x=>x.key).join('')==='ment') c.vowel=false;
      if (c.key === 'e' && prev==='s' && next==='o' && chars[i+2]?.key==='i') c.vowel=false;
      if (c.key === 'e' && chars[i-1]?.vowel && base(prev)==='u' && base(chars[i-2]?.key||'')!=='o' && next==='r' && /^(?:ai|as|a|ons|ez|ont|ais|ait|ions|iez|aient)$/u.test(chars.slice(i+2,i+9).map(x=>x.key).join(''))) c.vowel=false;
    }
    // Le e suivant un noyau en fin de mot est graphique (vie, joie, créent).
    // Le y semi-consonant de paye/abbaye n'est pas un noyau précédent.
    if (lastE > 0 && chars[lastE-1].vowel) chars[lastE].vowel = false;
    if (/guë$/u.test(word)) chars[chars.length-1].vowel = false;
    const nuclei=[];
    for (let i=0;i<chars.length;i++) {
      if (!chars[i].vowel) {
        const last=nuclei[nuclei.length-1];
        if(chars[i].tail && last && last.end===i) last.end=i+1;
        continue;
      }
      const prev=nuclei[nuclei.length-1];
      const a=prev ? chars[prev.end-1].key : '';
      if (prev && prev.end === i && joins(a,chars[i].key,i-1,chars,prefixedBOM?'\ufeff'+word:word,features)) {
        prev.end=i+1;
      } else nuclei.push({start:i,end:i+1});
    }
    const eIsNucleus = lastE >= 0 && nuclei.some(n=>n.start === lastE);
    const elidable = /e$/u.test(word) && eIsNucleus;
    const feminine = eIsNucleus && lastE > 0 && !chars[lastE-1].vowel && chars[lastE-1].key!=='y';
    if (final && feminine && nuclei.length>1) nuclei.pop();
    const cuts=[];
    for (let i=1;i<nuclei.length;i++) {
      const prev=nuclei[i-1], next=nuclei[i];
      let at=next.start;
      const gap=chars.slice(prev.end,next.start);
      if (gap.length) {
        at=next.start-1;
        if (gap.length>=3) at=prev.end+1;
        if (gap.length>=2 && onsets.has(gap.slice(-2).map(c=>c.key).join(''))) at--;
        if (gap.length>=3 && onsets.has(gap.slice(-2).map(c=>c.key).join(''))) at=prev.end+1;
        if (gap.length===2 && gap[1].key==='h') at=prev.end;
        if (gap.length===2 && gap[0].key==='g' && gap[1].key==='e' && !gap[1].vowel) at=prev.end;
        if (gap.length===3 && gap[1].key==='h') at=prev.end;
        if (gap.length>=2 && gap.slice(-2).map(c=>c.key).join('')==='cu' && features.cueil) at=next.start-2;
        if (gap.length===2 && ['nh','lh'].includes(gap.map(c=>c.key).join(''))) at=prev.end;
        if (gap.length>=3 && gap.slice(-3).map(c=>c.key).join('')==='thm') at=next.start-3;
        // qu/gu gardent leur voyelle graphique dans l'attaque ; ch,gn,etc idem.
        if (word.startsWith('en') && prev.start===0 && next.start===2) at=next.start;
      }
      const gapStart=chars[prev.end-1].start+chars[prev.end-1].key.length;
      const rawGap=raw.slice(gapStart,chars[next.start].start),block=rawGap.search(/[\p{M}‐‑]/u);
      // Une marque bloque la transition qui la traverse, pas une frontière
      // déjà décidée avant elle (liar/d‐xyz, clou/e/ron/s‐nous).
      if (at>0 && (block<0 || chars[at].start<=gapStart+block)) cuts.push(chars[at].start);
    }
    return {cuts,elidable,word,nuclei:nuclei.length};
  }

  function wordPlan(raw, final, prefixedBOM=false, previousWord='') {
    const pair=previousWord+' '+canonical(raw);
    const contextual=Object.hasOwn(adjacentWords,pair)?adjacentWords[pair]:null;
    const cacheKey=(final?'1':'0')+(prefixedBOM?'\ufeff':'')+(contextual?previousWord+' ':'')+raw;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const chars=letters(raw), key=canonical(raw);
    const hyphenKey=normalize(raw).replace(/[^\p{L}\p{N}'’ʼ\-‐‑]/gu,'');
    let plan;
    const decomposed=/\p{M}/u.test(raw);
    const known=!prefixedBOM && !decomposed && Object.hasOwn(verifiedWords,key) ? verifiedWords[key] : null;
    if (known) {
      const selected=final && known.finalCuts ? known.finalCuts : known.cuts;
      plan={cuts:selected.map(i=>chars[i]?.start).filter(i=>i>0),elidable:known.elidable === true,word:key};
    } else if (/-/u.test(raw) && !/-(?:t[-'’ʼ]|(?:il|ils|elle|elles|on)$)/iu.test(hyphenKey)) {
      const parts=[];
      for (const m of raw.matchAll(/[^-]+/gu)) {
        if(/[\p{L}\p{N}]/u.test(m[0])) parts.push({raw:m[0],start:m.index});
      }
      const cuts=[];
      let prev=null;
      for (let i=0;i<parts.length;i++) {
        const part=parts[i], p=simplePlan(part.raw,final && i===parts.length-1);
        if (prev && !(prev.elidable && startsVowel(part.raw))) cuts.push(part.start+(letters(part.raw)[0]?.start||0));
        for (const c of p.cuts) cuts.push(part.start+c);
        prev=p;
      }
      plan={cuts,elidable:prev?.elidable || false,word:key};
    } else plan=simplePlan(raw,final,prefixedBOM);
    const spelling=spellingKey(raw),resource=prefixedBOM?bomCorrections:spellingCorrections;
    const correction=prefixedBOM?(Object.hasOwn(resource,spelling)?resource[spelling]:null):{
      ...(!decomposed && Object.hasOwn(wordCorrections,key)?wordCorrections[key]:{}),
      ...(Object.hasOwn(resource,spelling)?resource[spelling]:{}),
      ...(contextual||{})};
    const correctionMode=final?'finalCuts':'cuts';
    if(correction && Object.hasOwn(correction,correctionMode)) {
      plan={...plan,cuts:correction[correctionMode].map(i=>chars[i]?.start).filter(i=>i>0)};
    }
    if(correction && Object.hasOwn(correction,'elidable')) plan={...plan,elidable:correction.elidable};
    if (cache.size>=4096) cache.delete(cache.keys().next().value);
    cache.set(cacheKey,plan);
    return plan;
  }

  function startsVowel(raw) {
    if(raw.match(/^[^\p{L}\p{N}]*/u)[0].includes('\ufeff')) return false;
    const word=normalize(raw).replace(/[^\p{L}\p{N}]/gu,'');
    const first=Array.from(word)[0];
    if (isVowel(first)) return true;
    if(first==='h' && Object.hasOwn(hCorrections,word)) return !hCorrections[word];
    return first==='h' && !aspirated.has(word);
  }

  function rhymeGender(raw, prefixedBOM=false) {
    const key=canonical(raw);
    if (!key) return null;
    if (!prefixedBOM && Object.hasOwn(rhymeOverrides,key)) return rhymeOverrides[key];
    if (/es?$/u.test(key)) return 'F';
    if (/ent$/u.test(key)) {
      // La référence distingue des finales lexicales, parfois sans suivre
      // l'analyse grammaticale usuelle. Les exceptions mesurées sont séparées.
      return /[eé]ment$/u.test(key) || nasalEnt.has(key) ? 'M' : 'F';
    }
    return 'M';
  }

  function variantWidth(raw,final,prefixedBOM,previousWord) {
    if(prefixedBOM) return 0;
    const key=spellingKey(raw),mode=final?'final':'nonfinal';
    const word=Object.hasOwn(countVariants.words,key)?countVariants.words[key]:null;
    const contexts=countVariants.previousWordOverrides && Object.hasOwn(countVariants.previousWordOverrides,key)?countVariants.previousWordOverrides[key]:null;
    const override=contexts && Object.hasOwn(contexts,previousWord)?contexts[previousWord]:null;
    return override && Object.hasOwn(override,mode)?override[mode]:
      word && Object.hasOwn(word,mode)?word[mode]:familyVariant(key).width;
  }

  function familyVariant(raw) {
    let width=0,kind='';
    for(const part of spellingKey(raw).split('-')){
      const family=countVariants.families?.find(f=>part.startsWith(f.prefix));
      if(family){width+=family.width;kind=family.kind;}
    }
    return {width,kind};
  }

  function analyze(input) {
    if (typeof input !== 'string') throw new TypeError('Le texte doit être une chaîne.');
    const boundaries=[],lines=[];
    for (const lineMatch of input.matchAll(/[^\r\n\u2028\u2029]+|\r\n|[\r\n\u2028\u2029]/gu)) {
      const line=lineMatch[0], offset=lineMatch.index;
      if (/^[\r\n\u2028\u2029]/u.test(line)) continue;
      // The reference retains isolated *, horizontal bars and BOM-bearing
      // chunks as counted units. Other standalone punctuation is ignored.
      const words=Array.from(line.matchAll(/(?:[^\s]|\ufeff)+/gu)).filter(m=>/[\p{L}\p{N}*―\ufeff]/u.test(m[0]));
      const local=[];
      let previous=null,hasWord=false,nonLexicalCount=0,additionalCount=0;
      const ambiguities=[];
      for (let i=0;i<words.length;i++) {
        const token=words[i];
        if(!/[\p{L}\p{N}]/u.test(token[0])) {
          nonLexicalCount++;
          previous={elidable:false,word:''};
          continue;
        }
        const firstLetter=letters(token[0])[0]?.start||0;
        const prefixedBOM=token[0].slice(0,firstLetter).includes('\ufeff');
        const plan=wordPlan(token[0],i===words.length-1,prefixedBOM,previous?.word||'');
        const width=variantWidth(token[0],i===words.length-1,prefixedBOM,previous?.word||'');
        additionalCount+=width;
        if(width){
          const spelling=spellingKey(token[0]);
          ambiguities.push({word:spelling,kind:countVariants.kinds?.[spelling]||familyVariant(spelling).kind||'lecture variable',additionalSyllables:width});
        }
        if (hasWord && previous && !(previous.elidable && startsVowel(token[0]))) local.push(offset+token.index+firstLetter);
        for (const cut of plan.cuts) local.push(offset+token.index+cut);
        previous=plan;
        hasWord=true;
      }
      for (const cut of local) boundaries.push(cut);
      const lastWord=words[words.length-1];
      const lastLetter=lastWord?(letters(lastWord[0])[0]?.start||0):0;
      const count=(hasWord?local.length+1:0)+nonLexicalCount;
      lines.push({start:offset,end:offset+line.length,boundaries:local,
        syllableCount:count,syllableCountMin:count,syllableCountMax:count+additionalCount,
        syllableCountText:additionalCount?count+' à '+(count+additionalCount):String(count),
        ambiguities,
        referenceCountAdjustment:nonLexicalCount,
        rhyme:lastWord ? (/[\p{L}\p{N}]/u.test(lastWord[0])?rhymeGender(lastWord[0],lastWord[0].slice(0,lastLetter).includes('\ufeff')):'M') : null});
    }
    const chunks=[];
    let last=0;
    for (const at of boundaries) { chunks.push(input.slice(last,at),'/'); last=at; }
    chunks.push(input.slice(last));
    return {input,output:chunks.join(''),boundaries,lines};
  }
  return Object.freeze({analyze});
}
globalThis.createSyllaber = createSyllaber;
if (typeof module !== 'undefined' && module.exports) module.exports = {createSyllaber};

  