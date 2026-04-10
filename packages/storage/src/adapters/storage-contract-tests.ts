import { describe, it, expect } from 'vitest';
import type { StorageAdapter } from '../types.js';

/**
 * StorageAdapter の契約テストヘルパー。
 * すべての実装はこの契約を満たす必要がある。
 * 新しいアダプターを追加したら各アダプターの test ファイルでこれを呼び出すこと。
 */
export function runStorageContractTests(name: string, createAdapter: () => StorageAdapter) {
  describe(`${name} — StorageAdapter 契約`, () => {
    it('put した値を get で取得できる', async () => {
      const adapter = createAdapter();
      await adapter.put('key1', 'value1');
      expect(await adapter.get('key1')).toBe('value1');
    });

    it('存在しないキーは null を返す', async () => {
      const adapter = createAdapter();
      expect(await adapter.get('not-exist')).toBeNull();
    });

    it('delete 後は null になる', async () => {
      const adapter = createAdapter();
      await adapter.put('key1', 'value1');
      await adapter.delete('key1');
      expect(await adapter.get('key1')).toBeNull();
    });

    it('同じキーに put すると最新値で上書きされる', async () => {
      const adapter = createAdapter();
      await adapter.put('key1', 'first');
      await adapter.put('key1', 'second');
      expect(await adapter.get('key1')).toBe('second');
    });

    it('異なるキーは独立して管理される', async () => {
      const adapter = createAdapter();
      await adapter.put('key1', 'value1');
      await adapter.put('key2', 'value2');
      expect(await adapter.get('key1')).toBe('value1');
      expect(await adapter.get('key2')).toBe('value2');
    });

    it('存在しないキーの delete はエラーにならない', async () => {
      const adapter = createAdapter();
      await expect(adapter.delete('not-exist')).resolves.toBeUndefined();
    });

    it('JSON 文字列を put/get できる', async () => {
      const adapter = createAdapter();
      const record = { userId: 'u1', rank: 1, timestamp: '2026-04-10T00:00:00Z' };
      await adapter.put('gacha:winner:1', JSON.stringify(record));
      const raw = await adapter.get('gacha:winner:1');
      expect(JSON.parse(raw!)).toEqual(record);
    });
  });
}
