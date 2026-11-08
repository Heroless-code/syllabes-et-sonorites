const caesuraDeterminers = new Set(
  'le la les un une des du au aux ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs chaque quelques plusieurs aucun aucune'.split(' ')
);
const caesuraSubjects = new Set('je tu il elle on nous vous ils elles'.split(' '));
const caesuraClitics = new Set('ne me te se que y en'.split(' '));
const caesuraConnectors = new Set('et ou mais donc or ni car pourtant puis'.split(' '));
const caesuraPrepositions = new Set('à de dans en chez avec sans pour par sous sur vers entre'.split(' '));

function caesuraBoundaryWeight(left, right, gap) {
  if (/[.;:!?…—–]/u.test(gap)) return 4;
  if (/,/u.test(gap)) return 3;

  const leftWord = left.lower;
  const rightWord = right.lower;
  const rightIsPredicate = right.posHint === 'verb' || right.regularVerbCandidate ||
    right.pos?.includes('VER') || right.pos?.includes('AUX') ||
    caesuraClitics.has(rightWord) || /['’ʼ]$/u.test(rightWord);
  if (caesuraDeterminers.has(leftWord) || left.posHint === 'determiner' ||
      left.pos?.includes('ART') || (caesuraSubjects.has(leftWord) && rightIsPredicate) ||
      caesuraClitics.has(leftWord)) {
    return -3;
  }
  if (caesuraPrepositions.has(leftWord) || caesuraConnectors.has(leftWord) ||
      left.pos?.includes('PRE') || left.liaison?.realized) {
    return -2;
  }
  if (caesuraConnectors.has(rightWord)) return 1.5;
  return caesuraSubjects.has(rightWord) ? 0.75 : 0;
}

function caesuraSinglePreference(count, before) {
  const difference = Math.abs(count - 2 * before);
  // A single isolated syllable is rarely a useful main division in a longer verse.
  const isolatedSyllablePenalty = count >= 6 && Math.min(before, count - before) === 1 ? 2 : 0;
  if (count === 12) {
    if (difference === 0) return 3.5;
    if (difference === 2) return 2.7;
    if (difference === 4) return 2.35;
  }
  // Both central integer divisions of an odd verse have full balance credit.
  const distanceFromCentralSplit = difference - count % 2;
  const balancePenalty = count < 5 ? 3 : 5;
  return 3 - balancePenalty * distanceFromCentralSplit / count - isolatedSyllablePenalty;
}

function findCaesuras(line, meter) {
  const count = meter?.syllableCount ?? 0;
  if (count < 2 || meter.boundaries.length !== count - 1) return [];
  if (line.tokens.map(token => token.text).join('') !== line.original) return [];

  const syllablesByOffset = new Map(
    meter.boundaries.map((position, index) => [position - meter.start, index + 1])
  );
  const candidates = new Map();
  let offset = 0;
  let previousWord = null;
  let previousEnd = 0;
  for (const [tokenIndex, token] of line.tokens.entries()) {
    const end = offset + token.text.length;
    if (token.type === 'word') {
      const before = syllablesByOffset.get(offset);
      const gap = line.original.slice(previousEnd, offset);
      if (before && previousWord && /\s/u.test(gap) && !/[-‐‑]/u.test(gap) &&
          !/['’ʼ]$/u.test(previousWord.text)) {
        const weight = caesuraBoundaryWeight(previousWord, token, gap);
        candidates.set(before, {tokenIndex, offset, weight});
      }
      previousWord = token;
      previousEnd = end;
    }
    offset = end;
  }

  const plans = [];
  for (const [before, cut] of candidates) {
    plans.push({cuts: [cut], score: caesuraSinglePreference(count, before) + cut.weight});
  }

  // A balanced division into three or four groups needs a cue at each cut.
  for (const groups of [3, 4]) {
    const length = count / groups;
    if (!Number.isInteger(length) || length < 3) continue;
    const cuts = Array.from({length: groups - 1}, (_, index) => candidates.get((index + 1) * length));
    if (!cuts.every(cut => cut && cut.weight >= 1)) continue;
    const averageWeight = cuts.reduce((sum, cut) => sum + cut.weight, 0) / cuts.length;
    const regularity = groups === 3 ? 1.6 : 1.1;
    plans.push({cuts, score: regularity + averageWeight + (cuts.length - 1) * 1.5});
  }

  plans.sort((left, right) => right.score - left.score ||
    Math.abs(count - 2 * syllablesByOffset.get(left.cuts[0].offset)) -
      Math.abs(count - 2 * syllablesByOffset.get(right.cuts[0].offset)) ||
    left.cuts[0].offset - right.cuts[0].offset);
  const [best, next] = plans;
  if (!best) return [];
  const minimumScore = count < 5 ? 1.4 : 2.2;
  // Short and odd verses can use a central boundary even if its mirror ties.
  const firstCut = best.cuts[0];
  const centralDifference = Math.abs(count - 2 * syllablesByOffset.get(firstCut.offset));
  const acceptsCentralTie = (count < 5 || count % 2 === 1) && best.cuts.length === 1 &&
    firstCut.weight >= 0 && centralDifference === count % 2;
  const uncertain = best.score < minimumScore ||
    (next && best.score - next.score < 0.4 && !acceptsCentralTie);
  // The final fallback uses distance from the halfway point alone. It still
  // selects a whole-word boundary already present in the displayed segmentation.
  const midpoint = uncertain ? [...candidates.entries()].sort((left, right) =>
    Math.abs(count - 2 * left[0]) - Math.abs(count - 2 * right[0]) || left[0] - right[0]
  )[0][1] : null;
  const selected = uncertain ? [midpoint] : best.cuts;
  return selected.map(({tokenIndex, offset}) => ({tokenIndex, offset}));
}
