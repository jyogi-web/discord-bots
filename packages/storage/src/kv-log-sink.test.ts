import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KVLogSink } from './kv-log-sink.js';
import { InMemoryAdapter } from './adapters/in-memory.js';

function makeEntry(ts: string) {
  return { feature: 'gacha' as const, action: 'test', user: 'user1', ts };
}

describe('KVLogSink', () => {
  let storage: InMemoryAdapter;

  beforeEach(() => {
    storage = new InMemoryAdapter();
  });

  it('record() → flush() でKVに正しいキーで保存される', async () => {
    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    sink.record({ feature: 'gacha', action: 'five_match', user: 'alice' });
    await sink.flush();

    const today = new Date().toISOString().slice(0, 10);
    const raw = await storage.get(`logs:toy-bear-bot:${today}`);
    expect(raw).not.toBeNull();

    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ feature: 'gacha', action: 'five_match', user: 'alice' });
    expect(entries[0].ts).toBeDefined();
  });

  it('複数エントリが同じ日付バケットにマージされる', async () => {
    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    sink.record({ feature: 'gacha', action: 'five_match', user: 'alice' });
    sink.record({ feature: 'gacha', action: 'reversed', user: 'bob' });
    sink.record({ feature: 'eyes-lips', action: 'triggered', user: 'carol' });
    await sink.flush();

    const today = new Date().toISOString().slice(0, 10);
    const raw = await storage.get(`logs:toy-bear-bot:${today}`);
    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(3);
  });

  it('日跨ぎで別々のキーに保存される', async () => {
    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    const entry1 = makeEntry('2026-04-12T23:59:59.000Z');
    const entry2 = makeEntry('2026-04-13T00:00:01.000Z');

    // buffer に直接 ts 付きエントリを積むため record を2回呼ぶが、
    // ts は record() 内で付与されるので spyOn で固定する
    const dateSpy = vi.spyOn(Date.prototype, 'toISOString');
    dateSpy.mockReturnValueOnce(entry1.ts).mockReturnValueOnce(entry2.ts);

    sink.record({ feature: 'gacha', action: 'a', user: 'u1' });
    sink.record({ feature: 'gacha', action: 'b', user: 'u2' });
    dateSpy.mockRestore();

    await sink.flush();

    const raw12 = await storage.get('logs:toy-bear-bot:2026-04-12');
    const raw13 = await storage.get('logs:toy-bear-bot:2026-04-13');

    expect(JSON.parse(raw12!)).toHaveLength(1);
    expect(JSON.parse(raw13!)).toHaveLength(1);
  });

  it('既存KVデータに新しいエントリがマージされる', async () => {
    const key = 'logs:toy-bear-bot:2026-04-12';
    const existing = [makeEntry('2026-04-12T10:00:00.000Z'), makeEntry('2026-04-12T11:00:00.000Z')];
    await storage.put(key, JSON.stringify(existing));

    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    const dateSpy = vi.spyOn(Date.prototype, 'toISOString');
    dateSpy.mockReturnValueOnce('2026-04-12T12:00:00.000Z');
    sink.record({ feature: 'gacha', action: 'new', user: 'alice' });
    dateSpy.mockRestore();

    await sink.flush();

    const raw = await storage.get(key);
    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(3);
    expect(entries[2]).toMatchObject({ action: 'new' });
  });

  it('flush失敗時にバッファに戻して次回リトライできる', async () => {
    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    sink.record({ feature: 'gacha', action: 'five_match', user: 'alice' });

    vi.spyOn(storage, 'put').mockRejectedValueOnce(new Error('KV error'));
    await sink.flush(); // 失敗 → バッファに戻る

    const today = new Date().toISOString().slice(0, 10);
    expect(await storage.get(`logs:toy-bear-bot:${today}`)).toBeNull();

    // 2回目は成功
    await sink.flush();
    const raw = await storage.get(`logs:toy-bear-bot:${today}`);
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it('destroy() が未送信バッファを最終フラッシュする', async () => {
    const sink = new KVLogSink(storage, 'toy-bear-bot', 2 ** 31 - 1);

    sink.record({ feature: 'gacha', action: 'all_correct', user: 'alice' });
    await sink.destroy();

    const today = new Date().toISOString().slice(0, 10);
    const raw = await storage.get(`logs:toy-bear-bot:${today}`);
    expect(JSON.parse(raw!)).toHaveLength(1);
  });
});
