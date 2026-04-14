export const TARGET_CHARS = '情報技術研究部'.split('');
export const REVERSED_CHARS = [...TARGET_CHARS].reverse();

export function shuffleChars(): string[] {
  const arr = [...TARGET_CHARS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function countMatches(shuffled: string[], target: string[]): number {
  return shuffled.filter((char, i) => char === target[i]).length;
}

export function isAllCorrect(shuffled: string[]): boolean {
  return countMatches(shuffled, TARGET_CHARS) === TARGET_CHARS.length;
}

export function isAllReversed(shuffled: string[]): boolean {
  return countMatches(shuffled, REVERSED_CHARS) === REVERSED_CHARS.length;
}

export function formatResult(shuffled: string[]): string {
  const colored = shuffled.map((char, i) => {
    if (char === TARGET_CHARS[i]) {
      return `\x1b[32m${char}\x1b[0m`;
    }
    return char;
  });
  return `\`\`\`ansi\n${colored.join('')}\n\`\`\``;
}

export function buildShuffledForMatches(matches: number): string[] {
  const result = [...TARGET_CHARS];
  const mismatchCount = TARGET_CHARS.length - matches;
  if (mismatchCount < 2) return result;
  const tail = result.slice(-mismatchCount);
  const rotated = [...tail.slice(1), tail[0]];
  for (let i = 0; i < mismatchCount; i++) {
    result[TARGET_CHARS.length - mismatchCount + i] = rotated[i];
  }
  return result;
}
