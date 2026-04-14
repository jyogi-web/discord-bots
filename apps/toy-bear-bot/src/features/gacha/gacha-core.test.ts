import { describe, it, expect, vi } from 'vitest';
import {
  TARGET_CHARS,
  REVERSED_CHARS,
  shuffleChars,
  countMatches,
  isAllCorrect,
  isAllReversed,
  formatResult,
  buildShuffledForMatches,
} from './gacha-core.js';

describe('TARGET_CHARS / REVERSED_CHARS', () => {
  it('TARGET_CHARS は「情報技術研究部」を分割した7文字', () => {
    expect(TARGET_CHARS).toEqual(['情', '報', '技', '術', '研', '究', '部']);
  });

  it('REVERSED_CHARS は TARGET_CHARS の逆順', () => {
    expect(REVERSED_CHARS).toEqual([...TARGET_CHARS].reverse());
    expect(REVERSED_CHARS).toEqual(['部', '究', '研', '術', '技', '報', '情']);
  });
});

describe('countMatches', () => {
  it('完全一致なら 7 を返す', () => {
    expect(countMatches(TARGET_CHARS, TARGET_CHARS)).toBe(7);
  });

  it('逆順配列との一致数は 1（中央の「術」が同じ位置）', () => {
    // 情報技術研究部 の逆順は 部究研術技報情 で index=3 の「術」だけ一致
    expect(countMatches(REVERSED_CHARS, TARGET_CHARS)).toBe(1);
  });

  it('先頭1文字だけ一致なら 1 を返す', () => {
    const shuffled = ['情', '部', '究', '研', '術', '技', '報'];
    expect(countMatches(shuffled, TARGET_CHARS)).toBe(1);
  });

  it('5文字一致なら 5 を返す', () => {
    const shuffled = buildShuffledForMatches(5);
    expect(countMatches(shuffled, TARGET_CHARS)).toBe(5);
  });
});

describe('isAllCorrect', () => {
  it('TARGET_CHARS そのままなら true', () => {
    expect(isAllCorrect([...TARGET_CHARS])).toBe(true);
  });

  it('1文字でも違えば false', () => {
    const shuffled = [...TARGET_CHARS];
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    expect(isAllCorrect(shuffled)).toBe(false);
  });

  it('逆順なら false', () => {
    expect(isAllCorrect([...REVERSED_CHARS])).toBe(false);
  });
});

describe('isAllReversed', () => {
  it('REVERSED_CHARS そのままなら true', () => {
    expect(isAllReversed([...REVERSED_CHARS])).toBe(true);
  });

  it('TARGET_CHARS なら false', () => {
    expect(isAllReversed([...TARGET_CHARS])).toBe(false);
  });

  it('1文字だけずれていれば false', () => {
    const arr = [...REVERSED_CHARS];
    [arr[0], arr[1]] = [arr[1], arr[0]];
    expect(isAllReversed(arr)).toBe(false);
  });
});

describe('formatResult', () => {
  it('一致文字に ANSI 緑色エスケープが付く', () => {
    const result = formatResult([...TARGET_CHARS]);
    for (const char of TARGET_CHARS) {
      expect(result).toContain(`\x1b[32m${char}\x1b[0m`);
    }
  });

  it('不一致文字はエスケープなしで含まれる', () => {
    // 先頭だけ一致しない配列
    const shuffled = [...TARGET_CHARS];
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    const result = formatResult(shuffled);
    // 先頭の「報」はそのまま（エスケープなし）
    expect(result).toContain('報');
    // 2番目の「情」はそのまま
    expect(result).toContain('情');
  });

  it('```ansi コードブロックで囲まれる', () => {
    const result = formatResult([...TARGET_CHARS]);
    expect(result).toMatch(/^```ansi\n/);
    expect(result).toMatch(/\n```$/);
  });
});

describe('buildShuffledForMatches', () => {
  it.each([0, 1, 2, 3, 4, 5, 7] as const)(
    'matches=%i のとき countMatches が一致する',
    (matches) => {
      const shuffled = buildShuffledForMatches(matches);
      expect(countMatches(shuffled, TARGET_CHARS)).toBe(matches);
    },
  );

  it('返される配列は TARGET_CHARS と同じ文字の集合（並び替えのみ）', () => {
    for (const matches of [0, 1, 2, 3, 4, 5, 7]) {
      const shuffled = buildShuffledForMatches(matches);
      expect([...shuffled].sort()).toEqual([...TARGET_CHARS].sort());
    }
  });

  it('返される配列の長さは常に 7', () => {
    for (const matches of [0, 1, 2, 3, 4, 5, 7]) {
      expect(buildShuffledForMatches(matches)).toHaveLength(7);
    }
  });
});

describe('shuffleChars', () => {
  it('返される配列の長さは 7', () => {
    expect(shuffleChars()).toHaveLength(7);
  });

  it('TARGET_CHARS と同じ文字の集合', () => {
    const result = shuffleChars();
    expect([...result].sort()).toEqual([...TARGET_CHARS].sort());
  });

  it('Math.random を固定すると決定的な結果になる', () => {
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = shuffleChars();
    expect(result).toHaveLength(7);
    expect([...result].sort()).toEqual([...TARGET_CHARS].sort());
    mockRandom.mockRestore();
  });
});
